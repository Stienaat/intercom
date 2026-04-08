const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Gebruiker verbonden:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    // meld aan de andere peer in dezelfde room dat er iemand bij is
    socket.to(roomId).emit('peer-joined');
  });

  socket.on('signal', ({ roomId, data }) => {
    // stuur offer/answer/ICE door naar de andere peer
    socket.to(roomId).emit('signal', { data });
  });

  socket.on('disconnect', () => {
    console.log('Gebruiker weg:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Intercom draait op poort ${PORT}`);
});