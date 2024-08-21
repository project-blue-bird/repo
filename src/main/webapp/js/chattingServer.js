const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8000 });

const userList = [];

wss.on("connection", (ws) => {
    console.log("새 유저가 연결되었음.");
    ws.on("message", (data) => {
        let response;
        let parsedData = JSON.parse(data);
        switch (parsedData.type) {
            case "identify":
                let nickname = parsedData.nickname;
                userList.push(nickname);
                console.log(`현재 구경중인 인원: ${userList.length}`);
                response = JSON.stringify({ type: "init", nickname: nickname });
                ws.send(response);
                break;
            case "send-chat":
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        let content = parsedData.content;
                        let nickname = parsedData.nickname;
                        response = JSON.stringify({ type: "new-chat", nickname: nickname, content: content });
                        client.send(response);
                    }
                });
                break;
            case "join":
                let joinNickname = parsedData.nickname;
                console.log(`유저 ${joinNickname} 가 다시 접속하였음.`);
                userList.push(joinNickname);
                break;
            case "leave":
                let exitNickname = parsedData.nickname;
                let idx = userList.indexOf(exitNickname);
                if (idx !== -1) {
                    userList.splice(idx, 1);
                }
                console.log(`유저 ${exitNickname} 가 잠깐 떠났음.`);
                break;
            default:
                // 예외 처리...
                break;
        }
    });
    ws.on("close", () => {
        console.log(`현재 구경중인 인원: ${userList.length}`);
    });
});