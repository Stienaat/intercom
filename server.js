// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // hier komt je frontend

io.on('connection', (socket) => {
  console.log('client connected', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit('peer-joined', socket.id);
  });

  socket.on('signal', ({ roomId, data }) => {
    socket.to(roomId).emit('signal', { from: socket.id, data });
  });

  socket.on('disconnect', () => {
    console.log('client disconnected', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log('listening on http://localhost:' + PORT);
});
