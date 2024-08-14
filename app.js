const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

let roomMaster = null;
let secretNumber = null;
let players = [];

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinGame', (username) => {
        const player = { id: socket.id, username, isRoomMaster: false };
        players.push(player);

        if (!roomMaster) {
            roomMaster = player;
            player.isRoomMaster = true;
            io.to(socket.id).emit('roomMasterAssigned', player);
        }

        io.emit('playersUpdate', players);
        io.emit('waitingForPlayers', players.length < 2);

        console.log(`${username} joined the game`);
    });

    socket.on('setNumber', (number) => {
        if (socket.id === roomMaster.id) {
            secretNumber = number;
            console.log('Room Master set the number:', secretNumber);
            io.emit('gameStart');
            startCountdown();
        }
    });

    socket.on('makeGuess', (guess) => {
        if (guess == secretNumber) {
            io.emit('gameEnd', { winnerId: socket.id, winnerName: getUsernameById(socket.id) });
        } else {
            io.emit('guessResult', { playerId: socket.id, guess });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        players = players.filter(player => player.id !== socket.id);

        if (roomMaster && roomMaster.id === socket.id) {
            roomMaster = players.length > 0 ? players[0] : null;
            if (roomMaster) {
                roomMaster.isRoomMaster = true;
                io.to(roomMaster.id).emit('roomMasterAssigned', roomMaster);
            }
        }

        io.emit('playersUpdate', players);
        io.emit('waitingForPlayers', players.length < 2);
    });
});

function startCountdown() {
    let countdown = 180; // 3 minutes
    const countdownInterval = setInterval(() => {
        io.emit('countdownUpdate', countdown);
        countdown--;

        if (countdown < 0) {
            clearInterval(countdownInterval);
            io.emit('gameEnd', { winnerId: null });
        }
    }, 1000);
}

function getUsernameById(id) {
    const player = players.find(player => player.id === id);
    return player ? player.username : 'Unknown';
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
