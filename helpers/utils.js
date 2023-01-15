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
    const isHost = gameDataStore[lobbyName].players.reduce((acc, u) => {
      if (u.name === username) {
        acc = u.isHost;
      }
      return acc;
    }, false);

  return {
    players: gameDataStore[lobbyName].players.map((u) => {
		return {
			name: u.name,
			isHost: u.isHost,
			score: u.score,
			
		}
	}),
    hasStarted: gameDataStore[lobbyName].hasStarted,
  };
};

const nextRound = (gameDataStore, lobbyName) => {
  gameDataStore[lobbyName].currentRound += 1;
  if (gameDataStore[lobbyName].currentRound === 5) {
    return false;
  }
  for (player in gameDataStore[lobbyName].players) {
    gameDataStore[lobbyName].players[player].currentRoundAnswer = null;
    gameDataStore[lobbyName].players[player].currentRoundVotes = null;
  }

  console.log(gameDataStore[lobbyName].players);
  return true;
};

module.exports = {
  initGame,
  generateLobbyData,
  nextRound,
};
