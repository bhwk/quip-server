const fs = require("fs");

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const initGame = (gameDataStore, lobbyName) => {
  const fileBuffer = fs.readFileSync("./tweet_data.json");
  const { tweets } = JSON.parse(fileBuffer.toString());
  shuffleArray(tweets);

  for (let i = 0; i < 5; i++) {
    gameDataStore[lobbyName].totalRoundData.push(tweets[i]);
  }
};

const generateLobbyData = (gameDataStore, lobbyName, username) => {
  return {
    players: gameDataStore[lobbyName].players.map((u) => u.name),
    isHost: gameDataStore[lobbyName].players.reduce((acc, u) => {
      return username === u.name && u.isHost;
    }, false),
  };
};

const nextRound = (gameDataStore, lobbyName) => {
  gameDataStore[lobbyName].currentRound += 1;
  if (gameDataStore[lobbyName].currentRound === 5) {
    return false;
  }
  for (player in gameDataStore[lobbyName].players) {
    player.currentRoundAnswer = null;
    player.currentRoundVotes = null;
  }
  return true;
};

module.exports = {
  initGame,
  generateLobbyData,
  nextRound,
};
