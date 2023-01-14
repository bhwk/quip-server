const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { handleGetLobbyDetails, initGame } = require("./helpers/utils");

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
    socket.emit("joinLobbyResponse", { success: false });
  }

  socket.join(socket.lobby);
  io.to(socket.lobby).emit("lobbyUpdate");

  // Log User Connection
  console.log(`User ${socket.username} connected to lobby: ${socket.lobby}`);
  // On socket disconnect
  socket.on("disconnect", () => {
    console.log(`User ${socket.username} disconnected.`);
  });

  socket.on("hello world", () => {
    console.log("hello world");
  });

  socket.on("getLobbyDetailsRequest", async () => {
    await handleGetLobbyDetails(io, socket);
  });

  socket.on("startGameRequest", () => {
    if (!socket.isHost) {
      // Don't start game
      socket.emit("startGameResponse", { success: false });
      return;
    }
    initGame(socket);
  });
});

server.listen(port, () => {
  console.log(`Server is up on port: ${port}`);
});
