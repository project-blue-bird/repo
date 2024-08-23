const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 5500;

let connectedClients = [];

// WebSocket 연결 이벤트 처리
wss.on('connection', (ws) => {
    console.log('클라이언트가 연결되었습니다.');

    // 새로운 클라이언트를 연결 리스트에 추가
    connectedClients.push(ws);

    // 메시지 수신 처리
    ws.on('message', (message) => {
        console.log('수신된 메시지:', message);

        // 연결된 다른 클라이언트에게 메시지 전달
        connectedClients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    // 연결 종료 처리
    ws.on('close', () => {
        console.log('클라이언트 연결이 종료되었습니다.');
        connectedClients = connectedClients.filter(client => client !== ws);
    });
});

// 정적 파일 제공
app.use(express.static('webapp'));

// 서버 시작
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});