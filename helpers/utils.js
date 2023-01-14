const MAX_PLAYERS = 8;

const timerStore = {};
const lobbyAnswerStore = {};

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
  socket.emit("joinLobbyResponse", { success: true });
  socket.emit("userJoinLobby");
};

const handleGetLobbyDetails = async (io, socket) => {
  const sockets = await io.in(socket.lobby).fetchSockets();
  const players = sockets.map((s) => socket.username);
  socket.emit("getLobbyDetailsResponse", { players, lobby: socket.lobby });
};

const handleRoundStart = (io, socket) => {
  lobbyAnswerStore[socket.lobby] = {};
  const timerStoreEntry = {
    timer: 30,
    lobby: socket.lobby,
  };
  timerStoreEntry.intervalId = setInterval(() => {
    if (timerStore[socket.lobby] && timerStore[socket.lobby].timer === 0) {
      io.sockets.in(socket.lobby).emit("round1End");
      clearInterval(timerStore[socket.lobby].intervalId);
      delete timerStore[socket.lobby];
    }

    timerStore[socket.lobby].timer -= 1;
  }, 1000);
};

const handleRoundAnswer = (io, socket, answer) => {
  lobbyAnswerStore[socket.lobby][socket.id] = answer;
};

module.exports = {
  handleRoundAnswer,
  handleRoundStart,
  handleJoinLobby,
  handleGetLobbyDetails,
};
