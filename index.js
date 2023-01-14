const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT || 3000;

// Data structures
const usernameStore = {};

io.on("connection", (socket) => {
  console.log(`User connected with socket id: ${socket.id}`);
  socket.on("disconnect", (socket) => {
    console.log(`User disconnected with socket id: ${socket.id}`);
  });
});

server.listen(port, () => {
  console.log(`Server is up on port: ${port}`);
});
