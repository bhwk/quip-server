test_tweet =
  "What two jobs are fine on their own, but suspicious if you put them together?";

const gameDataStore = {};

const handleGetLobbyDetails = async (io, socket) => {
  const sockets = await io.in(socket.lobby).fetchSockets();
  const players = sockets.map((s) => socket.username);
  const res = { players, lobby: socket.lobby };
  if (socket.isHost) {
    res.isHost = true;
  }
  socket.emit("getLobbyDetailsResponse", res);
};

const initGame = (socket) => {
  // Create a record in gameDataStore
  gameDataStore[socket.lobby] = {
    round: {
      number: 1,
    },
    scores: {},
  };
};

module.exports = {
  initGame,
  handleGetLobbyDetails,
};
