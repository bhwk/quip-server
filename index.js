const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { initGame, getLobbyData } = require("./helpers/utils");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

const port = process.env.PORT || 3000;

const MAX_PLAYERS = 20;
const gameDataStore = {};

io.use(async (socket, next) => {
  if (!socket.handshake.auth.username) {
    return next(new Error("Invalid username"));
  }

  socket.username = socket.handshake.auth.username;
  socket.lobby = socket.handshake.auth.lobby;

  next();
});

io.on("connection", async (socket) => {
  // Handle user joins/creates lobby
  const socketsInLobby = await io.in(socket.lobby).fetchSockets();
  const numSocketsInLobby = socketsInLobby.length;

  if (numSocketsInLobby === 0) {
    socket.isHost = true;
  }

  if (numSocketsInLobby === MAX_PLAYERS) {
    socket.emit("joinLobbyFailure", { success: false });
	// todo: disconnect client from websocket
  }

  socket.join(socket.lobby);

	// Broadcast to entire lobby
  const lobbyData = await getLobbyData(io, socket);
  io.to(socket.lobby).emit("lobbyUpdate", lobbyData); 

  console.log(`User ${socket.username} connected to lobby: ${socket.lobby}`);

  socket.on("startGameRequest", () => {
    if (!socket.isHost) {
      // Don't start game
      socket.emit("startGameResponse", { success: false });
      return;
    }
    initGame(socket);
  });

  socket.on("receiveAnsweer", () => {});

  // On socket disconnect
  socket.on("disconnect", () => {
    console.log(`User ${socket.username} disconnected.`);
  });
});

server.listen(port, () => {
  console.log(`Server is up on port: ${port}`);
});
