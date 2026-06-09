const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'AudioSync Broker (Native WebSocket)'
    });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Map to store client connections per session
// Socket -> SessionId
const clients = new Map();

// Function to broadcast presence count to a specific session
const broadcastPresence = (sessionId) => {
    let count = 0;
    clients.forEach((session) => {
        if (session === sessionId) count++;
    });

    const payload = JSON.stringify({ type: "presence", count });
    clients.forEach((session, ws) => {
        if (session === sessionId && ws.readyState === 1) { // 1 is WebSocket.OPEN
            try {
                ws.send(payload);
            } catch (e) {
                console.error("Failed to send presence payload:", e);
            }
        }
    });
};

wss.on('connection', (ws) => {
    console.log('Cliente conectado');

    ws.on('message', (messageData) => {
        try {
            const message = JSON.parse(messageData.toString());
            
            if (message.type === 'join') {
                const sessionId = message.sessionId || 'default';
                clients.set(ws, sessionId);
                console.log(`Cliente unido a sala: ${sessionId}`);
                broadcastPresence(sessionId);
            } else if (message.type === 'trigger-sound') {
                const sessionId = clients.get(ws);
                if (sessionId) {
                    const payload = JSON.stringify({
                        type: 'play-sound',
                        soundId: message.soundId,
                        soundName: message.soundName,
                        timestamp: Date.now()
                    });
                    clients.forEach((session, clientWs) => {
                        if (session === sessionId && clientWs !== ws && clientWs.readyState === 1) {
                            try {
                                clientWs.send(payload);
                            } catch (e) {
                                console.error("Failed to forward sound trigger:", e);
                            }
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Error procesando mensaje:', err);
        }
    });

    ws.on('close', () => {
        const sessionId = clients.get(ws);
        clients.delete(ws);
        if (sessionId) {
            console.log(`Cliente desconectado de sala: ${sessionId}`);
            broadcastPresence(sessionId);
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});
