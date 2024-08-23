window.onload = function () {
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const waitingMessage = document.getElementById('waitingMessage');

    let localStream;
    let peerConnection;
    let ws;

    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    };

    ws = new WebSocket('ws://192.168.240.46:5500');

    ws.onopen = () => {
        console.log('WebSocket 연결이 열렸습니다.');
        createPeerConnection();
        getMediaStream();
    };

    ws.onmessage = async (message) => {
        const data = JSON.parse(await message.data.text());

        if (data.type === 'offer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', answer }));
        } else if (data.type === 'answer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else if (data.type === 'ice-candidate') {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    };

    function createPeerConnection() {
        peerConnection = new RTCPeerConnection(iceServers);

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                ws.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
            }
        };

        peerConnection.ontrack = event => {
            remoteVideo.srcObject = event.streams[0];
            waitingMessage.style.display = 'none';
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE 상태:', peerConnection.iceConnectionState);

            if (peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'closed') {
                handleClientDisconnect();
            }
        };

        peerConnection.onconnectionstatechange = () => {
            console.log('Connection 상태:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'closed') {
                handleClientDisconnect();
            }
        };
    }

    function getMediaStream() {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStream = stream;
                localVideo.srcObject = stream;

                stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

                createOffer();
            })
            .catch(error => console.error('미디어 스트림 오류:', error));
    }

    function createOffer() {
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => ws.send(JSON.stringify({ type: 'offer', offer: peerConnection.localDescription })))
            .catch(error => console.error('Offer 생성 오류:', error));
    }

    function handleClientDisconnect() {
        // 비디오 요소의 srcObject를 null로 설정하여 비디오를 제거합니다.
        remoteVideo.srcObject = null;
        // 검정색 배경을 표시하기 위해 CSS를 설정합니다.
        remoteVideo.style.backgroundColor = 'black';
        // 대기 메시지를 표시할 수 있습니다.
        waitingMessage.style.display = 'block';
    }

    window.endCall = function () {
        peerConnection.close();
        ws.close();
        handleClientDisconnect();
        window.location.href = '/views/chat.html';
    };
};
