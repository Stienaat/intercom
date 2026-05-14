const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
  console.log('verbonden:', socket.id);

  socket.on('join-room', ({ roomId, pin, name }) => {
    console.log('join-room:', roomId, pin, name, socket.id);

    if (!roomId || !pin || !name) {
      socket.emit('join-error', 'Naam, room en PIN zijn verplicht');
      return;
    }

    if (!rooms[roomId]) {
      rooms[roomId] = { pin, users: [] };
    }

    const room = rooms[roomId];

    if (room.pin !== pin) {
      socket.emit('join-error', 'Verkeerde PIN');
      return;
    }

    const alreadyInRoom = room.users.find(u => u.id === socket.id);

    if (!alreadyInRoom && room.users.length >= 2) {
      socket.emit('room-full');
      return;
    }

    if (!alreadyInRoom) {
      room.users.push({ id: socket.id, name });
      socket.join(roomId);
    }

    console.log('users in room', roomId, room.users);

    if (room.users.length === 1) {
      socket.emit('waiting');
      return;
    }

    if (room.users.length === 2) {
      const other = room.users.find(u => u.id !== socket.id);

      socket.emit('peer-ready', { name: other.name });
      socket.to(roomId).emit('peer-ready', { name });
    }
  });

  socket.on('call-user', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const caller = room.users.find(u => u.id === socket.id);
    if (!caller) return;

    socket.to(roomId).emit('incoming-call', { from: caller.name });
  });

  socket.on('accept-call', ({ roomId }) => {
    socket.to(roomId).emit('call-accepted');
  });

  socket.on('reject-call', ({ roomId }) => {
    socket.to(roomId).emit('call-rejected');
  });

  socket.on('signal', ({ roomId, data }) => {
    socket.to(roomId).emit('signal', { data });
  });

  socket.on('disconnect', () => {
    console.log('weg:', socket.id);

    for (const roomId in rooms) {
      rooms[roomId].users = rooms[roomId].users.filter(u => u.id !== socket.id);

      socket.to(roomId).emit('peer-left');

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