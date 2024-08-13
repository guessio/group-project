const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.json({ message: 'waw mantap' })
});

// Socket.io event handler
io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    socket.on('message', (msg) => {
        console.log('Message received: ', msg);
        socket.broadcast.emit('message', msg);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected', socket.id);
    });
});

const gameSockets = require('./sockets/game')
gameSockets(io)

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
