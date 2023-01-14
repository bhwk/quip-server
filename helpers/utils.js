test_tweet =
  "What two jobs are fine on their own, but suspicious if you put them together?";

const initGame = (gameDataStore, lobbyName) => {
	for (let i = 0; i < 5; i++) {
		gameDataStore[lobbyName].totalRoundData.push(
			{
				username: "",
				body: "",
				avatar: "",
				retweets: 0,
				likes: 0	
			}
		)
	}

};

const generateLobbyData = (gameDataStore, lobbyName, username) => {
	return {
    players: gameDataStore[lobbyName].players.map((u) => u.name),
    isHost: gameDataStore[lobbyName].players.reduce((acc, u) => {
      return (username === u.name) && u.isHost
    }, false)
  };
}

module.exports = {
  initGame,
  generateLobbyData,
};
