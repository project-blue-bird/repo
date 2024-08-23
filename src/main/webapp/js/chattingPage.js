import Swal from "sweetalert2";


let userId; // 입장시 사용되는 아이디.


const ws = new WebSocket("ws://192.168.35.14:8000");


ws.onopen = () => { // 채팅 서버로 처음 입장했을 때 수행되는 익명함수 정의.
    console.log("채팅 서버와 연결되었습니다.");
    const buttonSendMsg = document.querySelector("#send-msg-button");
    buttonSendMsg.addEventListener("click", () => { // 메세지를 채팅 서버로 보내는 익명함수 정의.
        const inputSendMessage = document.querySelector("#send-msg-input");
        ws.send(JSON.stringify({ type: "send-chat", userId: userId, content: inputSendMessage.value }));
        inputSendMessage.value = ""; // input값 초기화.
    })
    userId = sessionStorage.getItem("userid");
    if (userId === null) { // 만약 아이디를 설정하지 못했다면,
        ws.send(JSON.stringify({ type: "no-nick" }));
    } else { // 그렇지 않은 경우 인증 시도.
        ws.send(JSON.stringify({ type: "identify", userId: userId }));
    }
};


window.addEventListener("visibilitychange", () => { // 채팅 화면이 최소화되거나 꺼지는 등 변화가 생길 때 수행하는 함수.
    if (document.hidden) { // 채팅방이 최소화 되거나 종료되는 등의 이벤트.
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "leave", userId: userId }));
        }
    } else { // 채팅방이 다시 켜지는 이벤트.
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "rejoin", userId: userId }));
        }
    }
});


ws.addEventListener("message", (event) => { // 웹소켓 서버 활성화상태.
    const chatTbody = document.querySelector("#chat-tbody");
    const chatAvatar = document.createElement("img");
    chatAvatar.src = "../images/avatar.png";
    chatAvatar.classList.add("chat-avatar");
    // 데이터 받아서 파싱.
    let data = event.data;
    let parsedData = JSON.parse(data);
    // 파싱된 데이터 타입에 따라 알맞게 처리.
    switch (parsedData.type) {
        case "init": // 서버에 최초로 접속함.
            userId = parsedData.userId;
            const Toast = Swal.mixin({
                toast: true,
                showConfirmButton: true,
                confirmButtonText: "안녕하세요~",
            });
            Toast.fire({
                icon: "success",
                title: `환영합니다, ${parsedData.userId} 님!!!`
            });
            let noticeChatRow = document.createElement("tr");
            let noticeChat = document.createElement("td");
            noticeChat.textContent = `${parsedData.userId} 님이 입장하셨습니다.`;
            noticeChat.colSpan = 3;
            
            noticeChatRow.appendChild(noticeChat);

            chatTbody.appendChild(noticeChatRow);
            break;
        case "new-chat": // 새로운 채팅이 올라옴.
            let newChatRow = document.createElement("tr");
            let chatMe = document.createElement("td");
            let chatSpace = document.createElement("td");
            let chatOther = document.createElement("td");
            if (parsedData.userId === userId) { // 내가 말한 경우,
                chatMe.textContent = parsedData.content;
                chatMe.appendChild(chatAvatar);
                chatSpace.textContent = ""
                chatOther.textContent = "";
            } else { // 다른 사람이 말한 경우,
                chatMe.textContent = "";
                chatSpace.textContent = ""
                chatOther.appendChild(chatAvatar);
                chatOther.textContent = parsedData.content;
            }
            chatMe.classList.add("chat-me", "bg-me");
            chatOther.classList.add("chat-other", "bg-other");
            chatSpace.classList.add("chat-space");

            newChatRow.appendChild(chatOther);
            newChatRow.appendChild(chatSpace);
            newChatRow.appendChild(chatMe);

            chatTbody.appendChild(newChatRow);
            break;
        default:
            // 여기에 예외처리...
            break;
    }
});


ws.onclose = (event) => {
    console.log("서버가 연결을 종료하였습니다.");
    let exitCode = event.code;
    let exitReason = event.reason;
    if (exitCode === 1003) {
        console.log();
        alert(exitReason);
    }
};