window.onload = function () {
    function showAlert() {
        Swal.fire({
            icon: "warning",
            title: "Facetime",
            text: "종료하시겠습니까?",
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: "예",
            cancelButtonText: "아니오",
            showClass: {
                popup: `
                    animate__animated
                    animate__jackInTheBox
                    animate__faster
                `
            },
            hideClass: {
                popup: `
                    animate__animated
                    animate__hinge
                    animate__faster
                `
            }
        }).then((result) => {
            if (result.isConfirmed) {
                exitFacetime();
            }
        });
    }

    function startCountdownTimer(duration) {
        let remainingTime = duration;
        const toast = Swal.fire({
            title: "Facetime",
            text: `상대가 떠났습니다.\n${remainingTime}초 후 강제 종료됩니다.`,
            icon: "warning",
            toast: true,
            position: "center",
            showConfirmButton: false,
            timer: duration * 1000,
            timerProgressBar: true,
            didOpen: () => {
                const interval = setInterval(() => {
                    remainingTime--;
                    if (remainingTime < 0) {
                        clearInterval(interval);
                    } else {
                        toast.update({
                            text: `상대가 떠났습니다.\n${remainingTime}초 후 강제 종료됩니다.`
                        });
                    }
                }, 1000);
            },
            didClose: () => {
                exitFacetime();
            }
        });
    }

    const endCallButton = document.querySelector("#end-call-button");
    endCallButton.addEventListener("click", (event) => {
        showAlert();
    });

    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const waitingMessage = document.getElementById('waitingMessage');

    let peerConnection;
    let ws;
    let userSessionId = sessionStorage.getItem("userid"); // 입장시 사용되는 아이디.
    if (userSessionId === undefined || userSessionId === null) {
        window.location.href = "../views/login.html";
    }

    const iceServers = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun.l.google.com:5349" },
            { urls: "stun:stun1.l.google.com:3478" },
            { urls: "stun:stun1.l.google.com:5349" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:5349" },
            { urls: "stun:stun3.l.google.com:3478" },
            { urls: "stun:stun3.l.google.com:5349" },
            { urls: "stun:stun4.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:5349" }
        ]
    };

    ws = new WebSocket("wss://mhd.hopto.org:8443/facetime"); // -> 서버 통합.

    const iceCandidateQueue = []; // ICE candidates를 저장할 Queue.

    ws.onopen = async () => {
        console.log(`유저 ${userSessionId} 이/가 Facetime 연결 대기중입니다.`);
        ws.send(JSON.stringify({ type: "joined", data: null, userId: userSessionId }));
        createPeerConnection();
        await getMediaStream();
    };

    ws.onerror = (error) => {
        console.error(`Facetime client 에러: ${error}`);
    };

    ws.onmessage = async (message) => {
        const parsedData = JSON.parse(message.data);
        const receivedType = parsedData.type;
        const receivedData = parsedData.data;
        const targetUsers = parsedData.targetUsers;
        if (targetUsers.includes(userSessionId)) { // 나를 대상으로 한 신호라면,
            switch (receivedType) {
                case "offer":
                    if (peerConnection.signalingState !== "stable") { // 스테이블 하지 않으면 오퍼 처리 불가함.
                        console.warn(`[Offer] 처리 불가: ${peerConnection.signalingState}`);
                        return;
                    }
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(receivedData));
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    console.log(`${userSessionId} 응답중...`);
                    ws.send(JSON.stringify({ type: 'answer', data: answer, userId: userSessionId }));
    
                    // 큐에 쌓여 있던 ICE candidates를 앞에서 하나씩 빼면서 추가함.
                    while (iceCandidateQueue.length > 0) {
                        await peerConnection.addIceCandidate(iceCandidateQueue.shift()); // 수정됨
                    }
                    break;
                case "answer":
                    if (peerConnection.signalingState !== "have-local-offer") { // 로컬 오퍼를 받은 상태가 아니면 응답할 수 없음.
                        console.warn(`[Answer] 처리 불가: ${peerConnection.signalingState}`);
                        return;
                    }
                    console.log(`${userSessionId} 연결 합의.`);
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(receivedData));
                    break;
                case "ice-candidate":
                    console.log(`${userSessionId} 상대방 찾는 중...`);
                    const candidate = new RTCIceCandidate(receivedData);
                    if (peerConnection.remoteDescription) {
                        await peerConnection.addIceCandidate(candidate);
                    } else {
                        console.warn("[ICE Candidate] Remote description 아직 안됨.");
                        iceCandidateQueue.push(candidate); // ICE candidate을 큐에 넣기.
                    }
                    break;
                case "invalidJoin":
                    let duration = 3;
                    let remainingTime = duration;
                    const toast = Swal.fire({
                        title: "Facetime",
                        text: `잘못된 접근입니다!\n${remainingTime}초 후 채팅 페이지로 돌아갑니다.`,
                        icon: "warning",
                        toast: true,
                        position: "center",
                        showConfirmButton: false,
                        timer: duration * 1000,
                        timerProgressBar: true,
                        didOpen: () => {
                            const interval = setInterval(() => {
                                remainingTime--;
                                if (remainingTime < 0) {
                                    clearInterval(interval);
                                } else {
                                    toast.update({
                                        text: `잘못된 접근입니다!\n${remainingTime}초 후 채팅 페이지로 돌아갑니다.`
                                    });
                                }
                            }, 1000);
                        },
                        didClose: () => {
                            exitFacetime();
                        }
                    });
                    break;
                default:
                    break;
            }
        }
    };

    function createPeerConnection() {
        peerConnection = new RTCPeerConnection(iceServers);

        peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                await ws.send(JSON.stringify({ type: 'ice-candidate', data: event.candidate, userId: userSessionId }));
            }
        };

        peerConnection.ontrack = event => {
            remoteVideo.srcObject = event.streams[0];
            waitingMessage.style.display = 'none';
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE 상태:', peerConnection.iceConnectionState);

            if (peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'closed') {
                startCountdownTimer(5);
            }
        };

        peerConnection.onconnectionstatechange = () => {
            console.log('Connection 상태:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'closed') {
                startCountdownTimer(5);
            }
        };
    }

    async function getMediaStream() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = stream;

            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

            console.log(`${userSessionId} 제안중...`);
            await createOffer();
        } catch (error) {
            console.error('미디어 스트림 오류:', error);
        }
    }

    async function createOffer() {
        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            await ws.send(JSON.stringify({ type: 'offer', data: peerConnection.localDescription , userId: userSessionId }));
        } catch (error) {
            console.error('Offer 생성 오류:', error);
        }
    }

    function exitFacetime() {
        if (peerConnection) {
            peerConnection.close();
        }
        if (ws) {
            ws.send(JSON.stringify({ type: "terminate-facetime", data: null, userId: userSessionId }));
            ws.close();
        }
        handleClientDisconnect();
        window.location.href = '/views/chat.html';
    };

    function handleClientDisconnect() {
        // 비디오 요소의 srcObject를 null로 설정하여 비디오를 제거합니다.
        remoteVideo.srcObject = null;
        // 검정색 배경을 표시하기 위해 CSS를 설정합니다.
        remoteVideo.style.backgroundColor = 'black';
        // 대기 메시지를 표시할 수 있습니다.
        waitingMessage.style.display = 'block';
    }
};