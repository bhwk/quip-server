const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { initGame, generateLobbyData } = require("./helpers/utils");

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

/*
  gameDataStore = {
    "lobbyName": {
      players: [
        {
          name: string,
          isHost: boolean,
          score: number,
          currentRoundAnswer: string,
          currentRoundVotes: number,
        }
      ],
      currentRound: number,
      totalRoundData: {
        username: string,
        body: string,
        avatar: string
        retweets: number,
        likes: 0	
      }
    }
  }
*/


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
  const lobbyName = socket.lobby;
  const username = socket.username;

  if (gameDataStore[lobbyName]) {
    const containsPlayer = gameDataStore[lobbyName].players.reduce((acc, playerObj) => {
      return playerObj.name === socket.username;
    }, false);

    console.log('containsPlayer', containsPlayer)

    if (!containsPlayer) {
      gameDataStore[lobbyName].players.push({
        name: username,
        isHost: false,
        score: 0,
      })
    }
  }
  else {
    Object.assign(gameDataStore, {
      [lobbyName]: {
        players: [
          {
            name: username,
            isHost: true,
            score: 0,
          }
        ],
        currentRound: 0,
        totalRoundData: [],
      }
    })
  }

  if (gameDataStore[lobbyName].players.length >= MAX_PLAYERS) {
    socket.emit("joinLobbyFailure", { success: false });
    // todo: disconnect client from websocket
  }

  socket.join(socket.lobby);

	// Broadcast to entire lobby
  
  io.to(socket.lobby).emit("lobbyUpdate", generateLobbyData(gameDataStore, lobbyName, username)); 

  console.log(`User ${socket.username} connected to lobby: ${socket.lobby}`);

  socket.on("hostStartGame", () => {
    if (!socket.isHost) {
      return socket.emit("gameStart", { success: false });
    }

    initGame(gameDataStore, lobbyName); // populates total round data

    const currentRound = gameDataStore[lobbyName].currentRound;
    const totalRoundData = gameDataStore[lobbyName].totalRoundData;

    const currentRoundData = totalRoundData[currentRound];

    // remove current round data from total round data
    gameDataStore[lobbyName].totalRoundData.splice(0, 1)

    socket.emit("gameStart", { 
      success: false,
      roundData: currentRoundData
    })
  });

  socket.on("receiveAnsweer", () => {});

  // On socket disconnect
  socket.on("disconnect", () => {
    console.log(`User ${socket.username} disconnected.`);

    const isHost = gameDataStore[lobbyName].players.reduce((acc, u) => {
      return (username === u.name) && u.isHost
    });

    if (!isHost) {
      gameDataStore[lobbyName].players = gameDataStore[lobbyName].players.filter((u) => u.name !== username)
      
      io.to(socket.lobby).emit("lobbyUpdate", generateLobbyData(gameDataStore, lobbyName, username)); 
      return
    }


  });
});

server.listen(port, () => {
  console.log(`Server is up on port: ${port}`);
});
