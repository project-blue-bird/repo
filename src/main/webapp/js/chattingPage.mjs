import Swal from "sweetalert2";


let userSessionId; // 입장시 사용되는 아이디.
const ws = new WebSocket("wss://mhd.hopto.org:8443/chat");


window.onload = () => {
    const previousUrl = document.referrer;
    if (previousUrl === "https://mhd.hopto.org/views/login.html") {
        Swal.fire({
            position: "top-end",
            icon: "success",
            title: "로그인 성공!",
            showConfirmButton: false,
            timer: 3000
        });
    }
    userSessionId = sessionStorage.getItem("userid");
    if (userSessionId === undefined || userSessionId === null) {
        window.location.href = "../views/login.html";
    }
}


ws.onopen = () => { // 채팅 서버로 처음 입장했을 때 수행되는 익명함수 정의.
    console.log("채팅 서버와 연결되었습니다.");
    const buttonSendMsg = document.querySelector("#send-msg-button");
    buttonSendMsg.addEventListener("click", () => { // 메세지를 채팅 서버로 보내는 익명함수 정의.
        const inputSendMessage = document.querySelector("#send-msg-input");
        ws.send(JSON.stringify({ type: "send-chat", userId: userSessionId, content: inputSendMessage.value }));
        inputSendMessage.value = ""; // input값 초기화.
    })
    if (userSessionId === undefined) { // 만약 아이디를 설정하지 못했다면,
        ws.send(JSON.stringify({ type: "no-nick" }));
    } else { // 그렇지 않은 경우 인증 시도.
        ws.send(JSON.stringify({ type: "identify", userId: userSessionId }));
    }
};


function printDate() { // 채팅 시각 계산해주는 함수.
    let now = new Date();
    let day = now.getDate();
    let month = now.getMonth();
    let mm = now.getMinutes();
    let hh = now.getHours();
    let hhampm = hh % 12 ? (hh % 12).toString() + " PM" : hh.toString() + " AM";
    return `${month}월${day}일 ${hhampm}${mm}`;
}


function createNewChat(isMe, parsedData) { // 새로운 채팅을 만들어주는 함수.
    const chatAvatar = document.createElement("img");
    let parsedUserId = parsedData.userId;
    chatAvatar.src = "../images/avatar.png";
    chatAvatar.style.cursor = "pointer";
    if (parsedUserId !== userSessionId) { // 내 글이 아닌 경우에만 facetime 클릭 이벤트 생성.
        chatAvatar.addEventListener("click", () => {
            Swal.fire({
                title: "Facetime",
                text: "Facetime을 하시겠습니까?",
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "예",
                cancelButtonText: "아니오"
            }).then((result) => {
                if (result.isConfirmed) {
                    ws.send(JSON.stringify({ type: "request-facetime", requestUserId: userSessionId, otherUserId: parsedUserId }));
                    const Toast = Swal.mixin({
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                    });
                    Toast.fire({
                        icon: undefined,
                        html: `
                        상대방의 수락을 기다리고 있습니다... 
                        <div class="spinner-border text-success" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        `
                    });
                }
            });
        });
    }
    chatAvatar.classList.add("chat-avatar");
    const newChat = document.createElement("li");
    let newChatContentSpan = document.createElement("span");
    let newChatDateSpan = document.createElement("span");
    newChat.appendChild(chatAvatar);
    newChatContentSpan.textContent = parsedData.content;
    newChatDateSpan.textContent = printDate();
    newChat.classList.add("d-flex", "align-items-end", "my-3");
    newChatContentSpan.classList.add("chat-box");
    newChatDateSpan.classList.add("tx-small");
    if (isMe) { // 내가 말한 경우,
        newChat.classList.add("flex-row-reverse", "bg-me");
        newChatContentSpan.classList.add("me-1");
    } else { // 다른 사람이 말한 경우,
        newChat.classList.add("flex-row", "bg-other");
        newChatContentSpan.classList.add("ms-1");
        newChatDateSpan.classList.add("text-end");
    }
    newChat.appendChild(newChatContentSpan);
    newChat.appendChild(newChatDateSpan);
    return newChat;
}


window.addEventListener("visibilitychange", () => { // 채팅 화면이 최소화되거나 꺼지는 등 변화가 생길 때 수행하는 함수.
    if (document.hidden) { // 채팅방이 최소화 되거나 종료되는 등의 이벤트.
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "leave", userId: userSessionId }));
        }
    } else { // 채팅방이 다시 켜지는 이벤트.
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "rejoin", userId: userSessionId }));
        }
    }
});


ws.addEventListener("message", (event) => { // 웹소켓 서버 활성화상태.
    const chatUl = document.querySelector("#chat-ul");
    let reqId;
    let othId;
    let confId;
    let denyId;
    // 데이터 받아서 파싱.
    let data = event.data;
    let parsedData = JSON.parse(data);
    // 파싱된 데이터 타입에 따라 알맞게 처리.
    switch (parsedData.type) {
        case "init": // 서버에 최초로 접속함.
            parsedUserId = parsedData.userId;
            let noticeChat = document.createElement("li");
            noticeChat.textContent = `${parsedUserId} 님이 입장하셨습니다.`;
            chatUl.appendChild(noticeChat);
            break;
        case "new-chat": // 새로운 채팅이 올라옴.
            let newChat;
            if (parsedData.userId === userSessionId) { // 내가 말한 경우,
                newChat = createNewChat(true, parsedData);
            } else { // 다른 사람이 말한 경우,
                newChat = createNewChat(false, parsedData);
            }
            chatUl.appendChild(newChat);
            const simpleBarInstance = SimpleBar.instances.get(document.querySelector("#chat-div"));
            const scrollElement = simpleBarInstance.getScrollElement();
            scrollElement.scrollTop = scrollElement.scrollHeight;
            break;
        case "already-facetime": // 상대방이 이미 Facetime 중인 경우.
            reqId = parsedData.requestUserId;
            othId = parsedData.otherUserId;
            if (userSessionId === reqId) { // 신청했던 사람에게 답변을 보냄.
                Swal.close(); // 기존 대기중 toast 닫기.
                Swal.fire({
                    icon: "error",
                    title: "Facetime",
                    text: `${othId} 님은 다른 사람과 Facetime 중입니다.`,
                    confirmButtonText: "확인",
                });
            }
            break;
        case "request-facetime": // Facetime 신청.
            reqId = parsedData.requestUserId;
            if (userSessionId === parsedData.otherUserId) { // 지목된 아이디가 내 아이디인 경우,
                Swal.fire({
                    title: "Facetime",
                    text: `${reqId}님 으로부터 Facetime 요청이 도착했습니다.\n연결하시겠습니까?`,
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "예",
                    cancelButtonText: "아니오"
                }).then((result) => {
                    if (result.isConfirmed) {
                        ws.send(JSON.stringify({ type: "facetime-confirm", confirmUserId: userSessionId, requestUserId: reqId }));
                    } else {
                        ws.send(JSON.stringify({ type: "facetime-deny", denyUserId: userSessionId, requestUserId: reqId }));
                    }
                });
            }
            break;
        case "facetime-confirm": // Facetime 이 수락됨.
            reqId = parsedData.requestUserId;
            confId = parsedData.confirmUserId;
            // 신청한 사람과 수락한 사람을 화상 채팅방으로 이동시킴.
            if (userSessionId === reqId || userSessionId === confId) {
                window.location.href = "../views/facetime.html";
            }
            break;
        case "facetime-deny": // Facetime 이 거절됨.
            reqId = parsedData.requestUserId;
            denyId = parsedData.denyUserId;
            if (userSessionId === reqId) { // 신청했던 사람에게 답변을 보냄.
                Swal.close(); // 기존 대기중 toast 닫기.
                Swal.fire({
                    icon: "error",
                    title: "Facetime",
                    text: `${denyId} 님이 Facetime 을 거절하셨습니다.`,
                    confirmButtonText: "확인",
                });
            }
            break;
        default:
            // ...
            break;
    }
});


ws.onclose = (event) => {
    console.log("서버가 연결을 종료하였습니다.");
    let exitCode = event.code;
    let exitReason = event.reason;
    if (exitCode === 1003) {
        console.log();
        Swal.fire({
            icon: "error",
            title: "연결이 끊겼습니다.",
            text: `${exitReason}`,
            confirmButtonText: "확인",
        });
    }
};