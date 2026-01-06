
// ===========================
// BACKEND LOGIC (Game Engine)
// ===========================

/**
 * Player Model
 * Represents a single player in the game
 */
class Player {
	constructor(name) {
		this.id = this.generateId();
		this.name = name;
		this.roundScores = [0, 0, 0];
		this.currentDice = [0, 0, 0];
	}

	generateId() {
		return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	rollDice() {
		this.currentDice = [
			Math.floor(Math.random() * 6) + 1,
			Math.floor(Math.random() * 6) + 1,
			Math.floor(Math.random() * 6) + 1
		];
		return this.currentDice;
	}

	calculateRoundScore(roundIndex) {
		const score = (this.currentDice.reduce((a, b) => a + b, 0)) % 9 + 1;
		this.roundScores[roundIndex] = score;
		return score;
	}

	getTotalScore() {
		return this.roundScores.reduce((a, b) => a + b, 0);
	}

	getDiceSum() {
		return this.currentDice.reduce((a, b) => a + b, 0);
	}

	resetDice() {
		this.currentDice = [0, 0, 0];
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			roundScores: this.roundScores,
			currentDice: this.currentDice
		};
	}
}

/**
 * Game Engine
 * Handles all game logic and state management
 */
class GameEngine {
	constructor() {
		this.players = [];
		this.currentRound = 1;
		this.maxRounds = 3;
		this.hasRolledThisRound = false;
		this.gameState = 'SETUP'; // SETUP, PLAYING, FINISHED
	}

	addPlayer(name) {
		if (!name || name.trim() === '')
			throw new Error('Player name cannot be empty');

		if (this.players.some(p => p.name === name))
			throw new Error('Player name already exists');

		const player = new Player(name);
		this.players.push(player);
		console.log(`Player added: ${name}`);
		return player;
	}

	removePlayer(playerId) {
		const index = this.players.findIndex(p => p.id === playerId);
		if (index !== -1) {
			this.players.splice(index, 1);
			console.log(`Player removed: ${playerId}`);
			return true;
		}
		return false;
	}

	canStartGame() {
		console.log(`Current players: ${this.players.length}`);
		return this.players.length >= 2;
	}

	startGame() {
		if (!this.canStartGame())
			throw new Error('Need at least 2 players to start');
		console.log('Game started');
		this.gameState = 'PLAYING';
		this.currentRound = 1;
		this.hasRolledThisRound = false;
	}

	rollAllDice() {
		if (this.gameState !== 'PLAYING')
			throw new Error('Game is not in playing state');
		this.players.forEach(player => {
			player.rollDice();
			player.calculateRoundScore(this.currentRound - 1);
		});
		console.log(`Round ${this.currentRound} rolled`);

		this.hasRolledThisRound = true;
	}

	getRoundWinner() {
		if (!this.hasRolledThisRound) return null;

		const roundIndex = this.currentRound - 1;
		const maxScore = Math.max(...this.players.map(p => p.roundScores[roundIndex]));
		return this.players.find(p => p.roundScores[roundIndex] === maxScore);
	}

	canAdvanceRound() {
		return this.hasRolledThisRound && this.currentRound < this.maxRounds;
	}

	advanceRound() {
		if (!this.canAdvanceRound()) {
			if (this.currentRound >= this.maxRounds) {
				this.endGame();
				return false;
			}
			throw new Error('Cannot advance round');
		}

		this.currentRound++;
		this.hasRolledThisRound = false;
		this.players.forEach(player => player.resetDice());
		return true;
	}

	endGame() {
		this.gameState = 'FINISHED';
	}

	getWinners() {
		if (this.gameState !== 'FINISHED') return [];

		const maxScore = Math.max(...this.players.map(p => p.getTotalScore()));
		return this.players.filter(p => p.getTotalScore() === maxScore);
	}

	reset() {
		this.players = [];
		this.currentRound = 1;
		this.hasRolledThisRound = false;
		this.gameState = 'SETUP';
	}

	getGameState() {
		return {
			state: this.gameState,
			currentRound: this.currentRound,
			maxRounds: this.maxRounds,
			hasRolledThisRound: this.hasRolledThisRound,
			players: this.players.map(p => p.toJSON()),
			roundWinner: this.getRoundWinner()?.toJSON() || null
		};
	}
}

function main()
{
	const game = new GameEngine();
	// Example usage:
	try {
		game.addPlayer("Alice");
		game.addPlayer("Bob");
		game.startGame();
		game.rollAllDice();
		console.log(game.getGameState());
		game.advanceRound();
		game.rollAllDice();
		console.log(game.getGameState());
		game.advanceRound();
		game.rollAllDice();
		console.log(game.getGameState());
		game.endGame();
		console.log("Winners:", game.getWinners().map(w => w.name));
	} catch (error) {
		console.error(error.message);
	}
}



main();