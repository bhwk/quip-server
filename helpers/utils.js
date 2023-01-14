const removeUser = (socket, usernameStore) => {
  const temp = usernameStore[socket.id];
  delete usernameStore[socket.id];
  return temp;
};

const joinLobby = (socket, lobby) => {
  const [prev_room] = socket.rooms;
  socket.leave(prev_room);
  socket.join(lobby);
};

module.exports = {
  removeUser,
  joinLobby,
};
