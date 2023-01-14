const removeUser = (socket, usernameStore) => {
  const temp = usernameStore[socket.id];
  delete usernameStore[socket.id];
  return temp;
};

const joinLobby = (socket, lobby) => {
  const [most_recent] = socket.rooms;
  if (most_recent !== socket.id) {
    socket.leave(most_recent);
  }
  socket.join(lobby);
};

module.exports = {
  removeUser,
  joinLobby,
};
