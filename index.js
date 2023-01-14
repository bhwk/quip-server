const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.get("/", (req, res) => {
  res.send("test");
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server is up on port: ${port}`);
});
