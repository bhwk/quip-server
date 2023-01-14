test_tweet =
  "What two jobs are fine on their own, but suspicious if you put them together?";

const gameDataStore = {};

const getLobbyData = async(io, socket) => {
  const sockets = await io.in(socket.lobby).fetchSockets();
  const players = sockets.map((s) => socket.username);

  const output = {
	players,
	lobby: socket.lobby,
  }

  if (socket.isHost) {
	Object.assign(output, {
		isHost: true
	});
  }
  return output;
}

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
  getLobbyData,
};
