socket.on('waiting', () => {
  statusEl.textContent = 'Wachten op tweede toestel...';
});

socket.on('join-error', (message) => {
  alert(message);
  statusEl.textContent = message;
});

socket.on('room-full', () => {
  alert('Room is bezet');
  statusEl.textContent = 'Room is bezet';
});

socket.on('peer-left', () => {
  statusEl.textContent = 'Andere gebruiker is weg';
  callBtn.disabled = true;
});