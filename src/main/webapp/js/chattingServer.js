import WebSocket, { WebSocketServer } from "ws";
const PORT = 8000;


const wss = new WebSocketServer({ port: PORT });


const userList = [];


wss.on("connection", (ws) => {
    console.log("신규 유저와 연결됨.");
    ws.on("message", (data) => {
        let response;
        let parsedData = JSON.parse(data);
        switch (parsedData.type) {
            case "identify":
                let userId = parsedData.userId;
                userList.push(userId);
                console.log(`현재 참여중인 인원: ${userList.length}`);
                response = JSON.stringify({ type: "init", userId: userId });
                ws.send(response);
                break;
            case "send-chat":
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        let content = parsedData.content;
                        let userId = parsedData.userId;
                        response = JSON.stringify({ type: "new-chat", userId: userId, content: content });
                        client.send(response);
                    } else {
                        console.log("클라이언트가 준비되지 않았음.")
                    }
                });
                break;
            case "rejoin":
                let joinUserId = parsedData.userId;
                console.log(`유저 ${joinUserId} 가 다시 접속하였음.`);
                userList.push(joinUserId);
                break;
            case "leave":
                let exitUserId = parsedData.userId;
                let idx = userList.indexOf(exitUserId);
                if (idx !== -1) {
                    userList.splice(idx, 1);
                }
                console.log(`유저 ${exitUserId} 가 떠났음.`);
                break;
            case "no-nick": // 유저 닉네임을 받지 못한 상황.
                ws.close(1003, "닉네임을 전달받지 못해 연결을 종료합니다.");
                break;
            default:
                ws.close(1003, "잘못된 접근이므로 연결을 종료합니다.");
                break;
        }
    });
    ws.on("close", () => {
        console.log(`현재 참여중인 인원: ${userList.length}`);
    });
});

console.log(`웹소켓 서버가 현재 포트 ${PORT} 에서 실행중입니다.`);
