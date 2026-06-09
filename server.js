const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'AudioSync Broker'
    });
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {

    console.log(`Cliente conectado: ${socket.id}`);

    socket.on('join-room', (room) => {

        socket.join(room);

        console.log(
            `${socket.id} entró a ${room}`
        );

        socket.emit('joined', {
            room
        });
    });

    socket.on('audio-trigger', (data) => {

        io.to(data.room).emit(
            'audio-trigger',
            data
        );

        console.log(
            `[${data.room}] ${data.sound}`
        );
    });

    socket.on('disconnect', () => {
        console.log(
            `Cliente desconectado: ${socket.id}`
        );
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(
        `Servidor iniciado en puerto ${PORT}`
    );
});
