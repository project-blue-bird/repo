import WebSocket, { WebSocketServer } from "ws";
import express from "express";
import dotenv from "dotenv";
// import https from "https";
import http from "http";
import cors from "cors";
import fs from "fs";


dotenv.config();


// const serverOptions = {
//     key: fs.readFileSync(process.env.SSL_KEY),
//     cert: fs.readFileSync(process.env.SSL_PEM)
// };
const corsOptions = {
    // origin: "https://mhd.hopto.org",
    origin: "*",
    credentials: true,
}


const app = express();
app.use(express.json());
app.use(cors(corsOptions));
// const PORT = 8443;
const PORT = 9099;
// const filePath = process.env.FILE_PATH;
const filePath = "/Users/jihyun/IdeaProjects/blueBirdProject/src/main/webapp/js/users.json";


app.get("/", (req, res) => { // https express 서버.
    const response = {
        status: "success",
        data: {
            body: "블루버드 메인 서버입니다.\n제 컴퓨터 괴롭히지 마요~~!!~"
        },
        error: null,
        meta: {
            requestTime: new Date().toISOString()
        }
    };
    res.status(200).json(response);
});


app.get("/api/get-users", (req, res) => {
    let status;
    let data;
    let code;
    let error;
    let response;
    fs.readFile(filePath, "utf8", (err, loadedData) => {
        if (err) {
            console.error(`읽기 에러: ${err}`);
            if (err.code === "ENOENT") {
                code = 404;
                data = "회원 정보 파일이 없습니다.";
            } else {
                code = 500;
                data = "회원 정보 파일을 읽어오는 중 오류가 발생했습니다.";
            }
            response = {
                status: "error",
                data: data,
                error: err,
                meta: {
                    requestTime: new Date().toISOString()
                },
            };
            res.status(code).json(response);
            return;
        }
        const userData = JSON.parse(loadedData);
        try {
            status = "success";
            data = userData;
            code = 200;
            error = null;
        } catch (parseError) {
            status = "error";
            data = "JSON 파일을 파싱하던 중 오류가 발생했습니다.";
            code = 500;
            error = parseError;
        }
        response = {
            status: status,
            data: userData,
            error: error,
            meta: {
                requestTime: new Date().toISOString()
            },
        };
        res.status(code).json(response);
    });
});


app.post("/api/signup", (req, res) => {
    const requestData = req.body;
    const jsonData = JSON.stringify(requestData, null, 2);
    let code;
    let data;
    let error;
    let status;
    let response;
    fs.writeFile(filePath, jsonData, "utf8", (err) => {
        if (err) {
            console.error(`쓰기 에러: ${err}`);
            status = "error";
            data = "가입 도중 에러가 발생하였습니다.";
            error = err;
            code = 500;
            return;
        } else {
            status = "success";
            data = "성공적으로 가입되었습니다.";
            error = null;
            code = 200;
        }
        response = {
            status: status,
            data: data,
            error: error,
            meta: {
                requestTime: new Date().toISOString()
            },
        };
        res.status(code).json(response);
    });
})


const wssChatting = new WebSocketServer({ noServer: true });
const wssFacetime = new WebSocketServer({ noServer: true });


const facetimeUsers = {};
const facetimeRooms = {};


wssFacetime.on("connection", (ws) => { // Facetime 서버.
    console.log("신규 Facetime 생성.");
    ws.on("message", async (message) => {
        const parsedMessage = JSON.parse(message);
        const receivedType = parsedMessage.type;
        const receivedData = parsedMessage.data;
        const receivedUserId = parsedMessage.userId;
        const facetimeRoomNumber = facetimeUsers[receivedUserId];
        const facetimeUserList = facetimeRooms[facetimeRoomNumber];
        if (receivedUserId in facetimeUsers) { // 유저가 실제 채팅중일때만,
            switch (receivedType) {
                case "terminate-facetime": // 종료시 방을 삭제함.
                    facetimeUserList.forEach(client => {
                        delete facetimeUsers[client];
                    });
                    delete facetimeRooms[facetimeRoomNumber];
                    break;
                case "joined":
                    // 실제 채팅중인 유저라면 아무 동작도 하지 않음.
                    break;
                default:
                    wssFacetime.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            const response = JSON.stringify({ // 받은 데이터를 받은 형식 그대로 돌려줌.
                                type: receivedType,
                                data: receivedData,
                                targetUsers: facetimeUserList // 브로드캐스팅 하기 때문에 누구에게 해당하는 신호인지 알려줘야함.
                            });
                            client.send(response);
                        }
                    });
                    break;
            }
        } else { // 실제 채팅중이 아닌 유저 (잘못된 경로로 접속한 경우.)
            wssFacetime.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    const response = JSON.stringify({ // 받은 데이터를 받은 형식 그대로 돌려줌.
                        type: "invalidJoin",
                        data: receivedData,
                        targetUsers: receivedUserId // 너 지금 잘못들어왔다는 뜻임.
                    });
                    client.send(response);
                }
            });
        }
    });
    ws.on("close", () => {
        console.log("Facetime 종료됨.");
    });
    ws.on("error", (error) => {
        console.error(`Facetime 서버 에러: ${error}`);
    });
});


wssChatting.on("connection", (ws) => { // 채팅 서버.
    const userList = [];
    let signalingUserList;
    console.log("신규 채팅 유저와 연결됨.");
    ws.on("message", (data) => {
        let response;
        let parsedData = JSON.parse(data);
        switch (parsedData.type) {
            case "identify":
                let userId = parsedData.userId;
                userList.push(userId);
                wssChatting.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        let userId = parsedData.userId;
                        response = JSON.stringify({ type: "init", userId: userId });
                        client.send(response);
                    }
                });
                console.log(`현재 참여중인 인원: ${userList.length}`);
                break;
            case "send-chat":
                wssChatting.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        let content = parsedData.content;
                        let userId = parsedData.userId;
                        response = JSON.stringify({ type: "new-chat", userId: userId, content: content });
                        client.send(response);
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
            case "request-facetime": // 화상채팅 신청.
                const preReqId = parsedData.requestUserId; // 신청자.
                const preOthId = parsedData.otherUserId; // 수신자.
                let responsetype = preOthId in facetimeUsers ? "already-facetime" : "request-facetime"; // 상대방은 이미 채팅중임.
                wssChatting.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        response = JSON.stringify({ type: responsetype, otherUserId: preOthId, requestUserId: preReqId });
                        client.send(response);
                    }
                });
                break;
            case "facetime-confirm": // 화상채팅 수락.
                const reqId = parsedData.requestUserId; // 신청자.
                const confId = parsedData.confirmUserId; // 수신자.
                signalingUserList = [reqId, confId];
                const roomNumber = Object.keys(facetimeRooms).length + 1 // 방 번호는 1번부터 시작.
                facetimeUsers[reqId] = roomNumber; // facetime 중인 유저 목록에 추가.
                facetimeUsers[confId] = roomNumber; // facetime 중인 유저 목록에 추가.
                facetimeRooms[roomNumber] = signalingUserList; // 두 유저를 하나의 방으로 묶어서 방 목록에 추가.
                wssChatting.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        response = JSON.stringify({ type: "facetime-confirm", confirmUserId: confId, requestUserId: reqId });
                        client.send(response);
                    }
                });
                break;
            case "facetime-deny": // 화상채팅 거절.
                wssChatting.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        let reqId = parsedData.requestUserId; // 신청자.
                        let denyId = parsedData.denyUserId; // 수신자.
                        response = JSON.stringify({ type: "facetime-deny", denyUserId: denyId, requestUserId: reqId });
                        client.send(response);
                    }
                });
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
    ws.on("error", (error) => {
        console.error(`채팅 서버 에러: ${error}`);
    });
});


// const httpsServer = https.createServer(serverOptions, app);
const httpsServer = http.createServer(app);

httpsServer.on("upgrade", (request, socket, head) => {
    if (request.url.startsWith("/chat")) { // 채팅 서버.
        wssChatting.handleUpgrade(request, socket, head, (ws) => {
            wssChatting.emit("connection", ws, request);
        });
    } else if (request.url.startsWith("/facetime")) { // Facetime 서버.
        wssFacetime.handleUpgrade(request, socket, head, (ws) => {
            wssFacetime.emit("connection", ws, request);
        });
    } else {
        socket.destroy(); // 지원하지 않는 경로일 경우 소켓연결 끊음.
    }
});


httpsServer.listen(PORT, () => {
    console.log(`https 서버가 현재 포트 ${PORT} 에서 실행중입니다.`);
});
