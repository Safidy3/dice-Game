
// ===========================
// CORE CLASSES (Shared across all games)
// ===========================

/**
 * Base Player Model
 * Generic player - no game-specific logic
 */
class Player {
	constructor(name) {
		this.id = this.generateId();
		this.name = name;
		this.totalScore = 0;
	}

	generateId() {
		return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			totalScore: this.totalScore
		};
	}
}

/**
 * Abstract Game Engine
 * Base class for all games - defines common structure
 */
class GameEngine {
	constructor() {
		this.players = [];
		this.currentRound = 1;
		this.maxRounds = 3;
		this.hasPlayedThisRound = false;
		this.gameState = 'SETUP'; // SETUP, PLAYING, FINISHED
	}

	// ===== Common Methods (Shared by all games) =====
	
	addPlayer(name) {
		if (!name || name.trim() === '')
			throw new Error('Player name cannot be empty');

		if (this.players.some(p => p.name === name))
			throw new Error('Player name already exists');

		const player = this.createPlayer(name);
		this.players.push(player);
		return player;
	}

	removePlayer(playerId) {
		const index = this.players.findIndex(p => p.id === playerId);
		if (index !== -1) {
			this.players.splice(index, 1);
			return true;
		}
		return false;
	}

	canStartGame() {
		return this.players.length >= this.getMinPlayers();
	}

	startGame() {
		if (!this.canStartGame())
			throw new Error(`Need at least ${this.getMinPlayers()} players to start`);
		this.gameState = 'PLAYING';
		this.currentRound = 1;
		this.hasPlayedThisRound = false;
		this.onGameStart();
	}

	canAdvanceRound() {
		return this.hasPlayedThisRound && this.currentRound < this.maxRounds;
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
		this.hasPlayedThisRound = false;
		this.onRoundStart();
		return true;
	}

	endGame() {
		this.gameState = 'FINISHED';
		this.onGameEnd();
	}

	reset() {
		this.players = [];
		this.currentRound = 1;
		this.hasPlayedThisRound = false;
		this.gameState = 'SETUP';
	}

	getGameState() {
		return {
			state: this.gameState,
			currentRound: this.currentRound,
			maxRounds: this.maxRounds,
			hasPlayedThisRound: this.hasPlayedThisRound,
			players: this.players.map(p => p.toJSON()),
			roundWinner: this.getRoundWinner()?.toJSON() || null,
			gameName: this.getGameName()
		};
	}

	// ===== Abstract Methods (Must be implemented by subclasses) =====
	
	/**
	 * Create game-specific player instance
	 */
	createPlayer(name) {
		throw new Error('Must implement createPlayer()');
	}

	/**
	 * Play a single round
	 */
	playRound() {
		throw new Error('Must implement playRound()');
	}

	/**
	 * Get the winner of current round
	 */
	getRoundWinner() {
		throw new Error('Must implement getRoundWinner()');
	}

	/**
	 * Get overall game winners
	 */
	getWinners() {
		throw new Error('Must implement getWinners()');
	}

	/**
	 * Get game-specific rules
	 */
	getGameRules() {
		throw new Error('Must implement getGameRules()');
	}

	/**
	 * Get minimum number of players required
	 */
	getMinPlayers() {
		return 2; // Default
	}

	/**
	 * Get game name
	 */
	getGameName() {
		throw new Error('Must implement getGameName()');
	}

	// ===== Hook Methods (Optional overrides) =====
	
	onGameStart() {
		// Hook for game-specific initialization
	}

	onRoundStart() {
		// Hook for round-specific initialization
	}

	onGameEnd() {
		// Hook for game-specific cleanup
	}
}

// ===========================
// GAME REGISTRY (Factory Pattern)
// ===========================

/**
 * Game Registry
 * Central registry for all available games
 */
class GameRegistry {
	constructor() {
		this.games = new Map();
		this.registerDefaultGames();
	}

	registerDefaultGames() {
		// Register dice game
		this.register('dice', {
			name: 'Dice Game',
			description: 'Roll 3 dice, highest score wins',
			GameClass: DiceGameEngine,
			minPlayers: 2,
			maxPlayers: 8
		});

		// Future games will be added here:
		// this.register('rps', { ... });
		// this.register('card', { ... });
	}

	register(id, config) {
		this.games.set(id, config);
	}

	createGame(id) {
		const gameConfig = this.games.get(id);
		if (!gameConfig)
			throw new Error(`Game '${id}' not found in registry`);
		return new gameConfig.GameClass();
	}

	getAvailableGames() {
		return Array.from(this.games.entries()).map(([id, config]) => ({
			id,
			name: config.name,
			description: config.description,
			minPlayers: config.minPlayers,
			maxPlayers: config.maxPlayers
		}));
	}

	gameExists(id) {
		return this.games.has(id);
	}
}
