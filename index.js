const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { initGame, generateLobbyData, nextRound } = require("./helpers/utils");

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
      endTimer: number,
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
      },
      hasStarted: boolean,
      currentRoundData: {
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

setInterval(() => {
  for (const lobby in gameDataStore) {
    gameDataStore[lobby].endTimer = gameDataStore[lobby].endTimer
      ? Math.max(gameDataStore[lobby].endTimer - 1, 0)
      : null;

    const timeLeft = gameDataStore[lobby].endTimer;
    const players = gameDataStore[lobby].players;
    io.to(lobby).emit("gameUpdate", { timeLeft, players });

    if (gameDataStore[lobby].endTimer === 0) {
      const shouldContinue = nextRound(gameDataStore, lobby);
      if (shouldContinue) {
        const totalRoundData = gameDataStore[lobby].totalRoundData;

        const currentRoundData = totalRoundData[0];

        // remove current round data from total round data
        gameDataStore[lobby].totalRoundData.splice(0, 1);

        gameDataStore[lobby].endTimer = 30;
        gameDataStore[lobby].currentRoundData = currentRoundData;

        io.to(lobby).emit("roundStart", { roundData: currentRoundData });
      } else {
        io.to(lobby).emit("gameEnd", gameDataStore[lobby].players);
      }
    }
  }
}, 1000);

io.on("connection", async (socket) => {
  // Handle user joins/creates lobby
  const lobbyName = socket.lobby;
  const username = socket.username;

  if (gameDataStore[lobbyName]) {
    const containsPlayer = gameDataStore[lobbyName].players.reduce(
      (acc, playerObj) => {
        return acc || playerObj.name === socket.username;
      },
      false
    );

    console.log("containsPlayer", containsPlayer);

    if (!containsPlayer) {
      gameDataStore[lobbyName].players.push({
        name: username,
        isHost: false,
        score: 0,
      });
    }
  } else {
    Object.assign(gameDataStore, {
      [lobbyName]: {
        endTimer: null,
        next: null,
        players: [
          {
            name: username,
            isHost: true,
            score: 0,
          },
        ],
        currentRound: 0,
        totalRoundData: [],
      },
    });
  }

  if (gameDataStore[lobbyName].players.length >= MAX_PLAYERS) {
    socket.emit("joinLobbyFailure", { success: false });
    // todo: disconnect client from websocket
  }

  socket.join(socket.lobby);

  // Broadcast to entire lobby

  io.to(socket.lobby).emit(
    "lobbyUpdate",
    generateLobbyData(gameDataStore, lobbyName, username)
  );

  console.log(`User ${socket.username} connected to lobby: ${socket.lobby}`);

  socket.on("hostStartGame", () => {
    const isHost = gameDataStore[lobbyName].players.reduce((acc, u) => {
      return acc || (username === u.name && u.isHost);
    }, false);

    if (!isHost) {
      socket.emit("gameStart", { success: false });
      return;
    }

    initGame(gameDataStore, lobbyName); // populates total round data

    const currentRound = gameDataStore[lobbyName].currentRound;
    const totalRoundData = gameDataStore[lobbyName].totalRoundData;

    const currentRoundData = totalRoundData[0];

    // remove current round data from total round data
    gameDataStore[lobbyName].totalRoundData.splice(0, 1);

    gameDataStore[lobbyName].endTimer = 30;

    gameDataStore[lobbyName].hasStarted = true;

    gameDataStore[lobbyName].currentRoundData = currentRoundData;

    io.to(lobbyName).emit("gameStart", {
      success: true,
      roundData: currentRoundData,
    });
  });

  socket.on("receiveAnswer", (answer) => {
    const playerIdx = gameDataStore[lobbyName].players.findIndex(
      (p) => p.name === username
    );
    gameDataStore[lobbyName].players[playerIdx].currentRoundAnswer = answer;
  });

  socket.on("receiveVotes", (votes) => {
    const playerIdx = gameDataStore[lobbyName].players.findIndex(
      (p) => p.name === username
    );
    gameDataStore[lobbyName].players[playerIdx].currentRoundVotes = votes;
  });

  socket.on("forceGameUpdate", () => {
    const totalRoundData = gameDataStore[lobbyName].totalRoundData;

    socket.emit("forceClientUpdate", {
      success: true,
      roundData: gameDataStore[lobbyName].currentRoundData,
    });
  });

  // On socket disconnect
  socket.on("disconnect", () => {
    console.log(`User ${socket.username} disconnected.`);

    if (
      !gameDataStore[lobbyName] ||
      !gameDataStore[lobbyName].players ||
      !gameDataStore[lobbyName].players.length
    ) {
      return;
    }

    const isHost = gameDataStore[lobbyName].players.reduce((acc, u) => {
      return username === u.name && u.isHost;
    });

    if (!isHost) {
      gameDataStore[lobbyName].players = gameDataStore[
        lobbyName
      ].players.filter((u) => u.name !== username);

      io.to(socket.lobby).emit(
        "lobbyUpdate",
        generateLobbyData(gameDataStore, lobbyName, username)
      );
      return;
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on port: ${port}`);
});
