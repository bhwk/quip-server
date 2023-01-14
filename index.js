const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { removeUser, joinLobby } = require("./helpers/utils");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT || 3000;

// Data structures
const usernameStore = {};

io.on("connection", (socket) => {
  console.log(`User connected with socket id: ${socket.id}.`);
  socket.on("disconnect", () => {
    const dcUser = removeUser(socket, usernameStore);
    console.log(`User ${dcUser} disconnected.`);
  });

  socket.on("joinLobby", (data) => {
    usernameStore[socket.id] = data.username;
    joinLobby(socket, data.lobby);
    console.log(`User ${data.username} joined lobby: ${data.lobby}`);

    // For testing
    socket.to(data.lobby).emit("enteredLobby", {
      message: `${data.username} entered ${data.lobby}`,
    });
  });

  socket.on("getLobbyDetails", async () => {
    const [curr_room] = socket.rooms;
    const sockets = await io.in(curr_room).fetchSockets();
    const players = sockets.map((s) => usernameStore[s.id]);
    socket.emit("receiveLobbyDetails", { players, lobby: curr_room });
  });
});

server.listen(port, () => {
  console.log(`Server is up on port: ${port}`);
});
