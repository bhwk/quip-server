const MAX_PLAYERS = 8;

const handleJoinLobby = async (io, socket, lobby) => {
  const sockets = await io.in(lobby).fetchSockets();
  const numPlayers = sockets.length;
  if (numPlayers === MAX_PLAYERS) {
    socket.emit("joinLobbyResponse", {
      success: false,
      message: "Lobby is full.",
    });
    return;
  }
  socket.join(lobby);
};

const handleGetLobbyDetails = async (io, socket) => {
  const [curr_room] = socket.rooms;
  const sockets = await io.in(curr_room).fetchSockets();
  const players = sockets.map((s) => socket.username);
  socket.emit("getLobbyDetailsResponse", { players, lobby: curr_room });
};

const handleStartGame = async (io, socket) => {
  io.sockets.in(socket.lobby).emit("gameStart");
};

module.exports = {
  handleStartGame,
  handleJoinLobby,
  handleGetLobbyDetails,
};
