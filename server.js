const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {

  socket.on('join-room', ({ roomId, pin, name }) => {

    if (!rooms[roomId]) {
      rooms[roomId] = {
        pin,
        users: []
      };
    }

    const room = rooms[roomId];

    if (room.pin !== pin) {
      socket.emit('room-full');
      return;
    }

    if (room.users.length >= 2) {
      socket.emit('room-full');
      return;
    }

    room.users.push({
      id: socket.id,
      name
    });

    socket.join(roomId);

    const others = room.users.filter(u => u.id !== socket.id);

    if (others.length > 0) {
      socket.emit('peer-ready', {
        name: others[0].name
      });

      socket.to(roomId).emit('peer-ready', {
        name
      });
    }
  });

  socket.on('call-user', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const caller = room.users.find(u => u.id === socket.id);

    socket.to(roomId).emit('incoming-call', {
      from: caller.name
    });
  });

  socket.on('accept-call', ({ roomId }) => {
    socket.to(roomId).emit('call-accepted');
  });

  socket.on('signal', ({ roomId, data }) => {
    socket.to(roomId).emit('signal', { data });
  });

  socket.on('disconnect', () => {

    for (const roomId in rooms) {

      rooms[roomId].users =
        rooms[roomId].users.filter(u => u.id !== socket.id);

      if (rooms[roomId].users.length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('Server gestart op poort ' + PORT);
});