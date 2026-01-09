import { GameEngine } from './index.js';
import { Player } from './index.js';

// ===========================
// DICE GAME IMPLEMENTATION
// ===========================

/**
 * Dice Game Player
 * Extends base Player with dice-specific data
 */
class DiceGamePlayer extends Player {
	constructor(name) {
		super(name);
		this.roundScores = [0, 0, 0];
		this.currentDice = [0, 0, 0];
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
		const sum = this.currentDice.reduce((a, b) => a + b, 0);
		const score = sum % 9;
		this.roundScores[roundIndex] = score;
		this.totalScore = this.roundScores.reduce((a, b) => a + b, 0);
		return score;
	}

	getDiceSum() {
		return this.currentDice.reduce((a, b) => a + b, 0);
	}

	resetDice() {
		this.currentDice = [0, 0, 0];
	}

	toJSON() {
		return {
			...super.toJSON(),
			roundScores: this.roundScores,
			currentDice: this.currentDice
		};
	}
}

/**
 * Dice Game Engine
 * Implements dice game specific logic
 */
class DiceGameEngine extends GameEngine {
	constructor() {
		super();
		this.maxRounds = 3;
	}

	// ===== Implementation of abstract methods =====

	createPlayer(name) {
		return new DiceGamePlayer(name);
	}

	getGameName() {
		return 'Dice Game';
	}

	getGameRules() {
		return {
			name: 'Dice Game',
			description: 'Roll 3 dice, score is sum % 9',
			rounds: 3,
			minPlayers: 2,
			scoring: 'Highest total score wins'
		};
	}

	playRound() {
		if (this.gameState !== 'PLAYING')
			throw new Error('Game is not in playing state');

		// Roll dice for all players
		this.players.forEach(player => {
			player.rollDice();
			player.calculateRoundScore(this.currentRound - 1);
		});

		this.hasPlayedThisRound = true;
	}

	getRoundWinner() {
		if (!this.hasPlayedThisRound) return null;

		const roundIndex = this.currentRound - 1;
		const maxScore = Math.max(...this.players.map(p => p.roundScores[roundIndex]));
		return this.players.find(p => p.roundScores[roundIndex] === maxScore);
	}

	getWinners() {
		if (this.gameState !== 'FINISHED') return [];

		const maxScore = Math.max(...this.players.map(p => p.totalScore));
		return this.players.filter(p => p.totalScore === maxScore);
	}

	// ===== Hook implementations =====

	// Reset dice at start of new round
	onRoundStart() {
		this.players.forEach(player => player.resetDice());
	}
}
