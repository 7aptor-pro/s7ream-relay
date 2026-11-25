const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let latestFrame = null;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/status', (req, res) => {
    res.json({ status: 'ok', hasFrame: !!latestFrame });
});

wss.on('connection', (ws, req) => {
    const url = req.url;

    if (url === '/publisher') {
        console.log('Android Publisher connected');
        ws.on('message', (message) => {
            latestFrame = message;
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN && client.isViewer) {
                    client.send(message);
                }
            });
        });
        ws.on('close', () => {
            console.log('Android Publisher disconnected');
            latestFrame = null;
        });
    } else {
        console.log('Browser Viewer connected');
        ws.isViewer = true;
        if (latestFrame) {
            ws.send(latestFrame);
        }
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`S7Ream Relay Server running on port ${PORT}`);
});