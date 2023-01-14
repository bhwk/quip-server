const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const {
  handleJoinLobby,
  handleGetLobbyDetails,
  handleRoundStart,
} = require("./helpers/utils");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT || 3000;

io.use(async (socket, next) => {
  const username = socket.handshake.auth.username;

  if (!username) {
    return next(new Error("Invalid username"));
  }
  socket.username = username;

  const lobby = socket.handshake.auth.lobby;
  await handleJoinLobby(io, socket, lobby);
  socket.lobby = lobby;
  next();
});

io.on("connection", (socket) => {
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

  socket.on("startGame", () => {
    handleRoundStart(io, socket);
  });
});

server.listen(port, () => {
  console.log(`Server is up on port: ${port}`);
});
