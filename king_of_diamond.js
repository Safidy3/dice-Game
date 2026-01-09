import { GameEngine } from './index.js';
import { Player } from './index.js';

// ===========================
// KING OF DIAMOND GAME IMPLEMENTATION
// ===========================

/**
 * King of Diamond Player
 * Extends base Player with game-specific data
 */
class KingOfDiamondPlayer extends Player {
	constructor(name) {
		super(name);
		this.lifePoints = 10;
		this.currentChoice = null;
		this.isEliminated = false;
		this.roundHistory = []; // Track all choices
	}

	makeChoice(number) {
		if (number < 0 || number > 100)
			throw new Error('Choice must be between 0 and 100');
		this.currentChoice = number;
	}

	loseLifePoint() {
		this.lifePoints--;
		if (this.lifePoints <= 0)
			this.isEliminated = true;
	}

	resetChoice() {
		this.currentChoice = null;
	}

	addToHistory(choice, targetNumber, won) {
		this.roundHistory.push({
			choice,
			targetNumber,
			won,
			lifePointsAfter: this.lifePoints
		});
	}

	toJSON() {
		return {
			...super.toJSON(),
			lifePoints: this.lifePoints,
			currentChoice: this.currentChoice,
			isEliminated: this.isEliminated,
			roundHistory: this.roundHistory
		};
	}
}

/**
 * King of Diamond Game Engine
 * Strategic number guessing game
 */

class KingOfDiamondEngine extends GameEngine {
	constructor() {
		super();
		this.maxRounds = 999; // Game continues until one winner
		this.currentRound = 0;
		this.targetNumber = null;
		this.roundWinners = [];
	}

	// ===== Implementation of abstract methods =====

	createPlayer(name) {
		return new KingOfDiamondPlayer(name);
	}

	getGameName() {
		return 'King of Diamond';
	}

	getGameRules() {
		return {
			name: 'King of Diamond',
			description: 'Choose numbers strategically. Closest to (average × 0.8) wins!',
			rounds: 'Until one winner remains',
			minPlayers: 2,
			maxPlayers: 20,
			startingLife: 10,
			scoring: 'Last player alive wins',
			specialRules: [
				'Choose a number between 0-100 each round',
				'Target = (Average of all choices) × 0.8',
				'Closest to target wins the round',
				'Losers lose 1 life point',
				'Eliminated at 0 life points',
				'With 2 players: if both choose same number or one chooses 0 and other 100, both lose 1 point'
			]
		};
	}

	getMinPlayers() {
		return 2;
	}

	showRoundResults() {

		console.log(`******* ${++this.currentRound} *********`);
		this.players.map(p => {
			console.log(`${p.lifePoints} ${p.name} chose ${p.currentChoice} ${p.isEliminated ? '(Eliminated)' : ''}`);
		});
		console.log(`Target Number: ${this.targetNumber.toFixed(2)}`);
		if (this.roundWinners.length === 0)
			console.log('No winners.');
		else
			console.log('Round Winner(s): ' + this.roundWinners.map(w => w.name).join(','));
		console.log("\n");
	}

	playRound() {
		if (this.gameState !== 'PLAYING')
			throw new Error('Game is not in playing state');

		this.players.map(p => { p.makeChoice(Math.floor(Math.random() * 101)); });

		// Check if all active players have made a choice
		const activePlayers = this.getActivePlayers();
		const allChosen = activePlayers.every(p => p.currentChoice !== null);

		if (!allChosen)
			throw new Error('Not all players have made their choice');

		// Calculate target number
		this.targetNumber = this.calculateTargetNumber(activePlayers);

		// Check for special 2-player draw conditions
		if (activePlayers.length === 2) {
			const [p1, p2] = activePlayers;
			const isDraw = this.checkTwoPlayerDraw(p1, p2);

			if (isDraw) {
				// Both lose a point
				p1.loseLifePoint();
				p2.loseLifePoint();

				p1.addToHistory(p1.currentChoice, this.targetNumber, false);
				p2.addToHistory(p2.currentChoice, this.targetNumber, false);

				this.roundWinners = [];
				this.hasPlayedThisRound = true;
				return;
			}
		}

		// Find round winners (closest to target)
		this.roundWinners = this.findRoundWinners(activePlayers);

		// Apply life point changes
		activePlayers.forEach(player => {
			const won = this.roundWinners.some(w => w.id === player.id);
			if (!won) player.loseLifePoint();
			player.addToHistory(player.currentChoice, this.targetNumber, won);
		});

		this.hasPlayedThisRound = true;

		this.showRoundResults();
		// Check if game should end
		if (this.shouldEndGame())
			return this.endGame();

		this.playRound();
	}

	calculateTargetNumber(players) {
		const sum = players.reduce((acc, p) => acc + p.currentChoice, 0);
		const average = sum / players.length;
		return average * 0.8;
	}

	checkTwoPlayerDraw(p1, p2) {
		// Same number
		if (p1.currentChoice === p2.currentChoice)
			return true;
		// One chooses 0, other chooses 100 (or vice versa)
		if ((p1.currentChoice === 0 && p2.currentChoice === 100) ||
			(p1.currentChoice === 100 && p2.currentChoice === 0))
			return true;
		return false;
	}

	findRoundWinners(players) {
		const distances = players.map(p => ({
			player: p,
			distance: Math.abs(p.currentChoice - this.targetNumber)
		}));

		const minDistance = Math.min(...distances.map(d => d.distance));

		return distances
			.filter(d => d.distance === minDistance)
			.map(d => d.player);
	}

	getActivePlayers() {
		return this.players.filter(p => !p.isEliminated);
	}

	getRoundWinner() {
		if (!this.hasPlayedThisRound) return null;
		return this.roundWinners.length === 1 ? this.roundWinners[0] : null;
	}

	getRoundWinners() {
		return this.roundWinners;
	}

	shouldEndGame() {
		const activePlayers = this.getActivePlayers();

		// No one left (both eliminated in final round)
		if (activePlayers.length === 0)
			return true;
		// One winner
		if (activePlayers.length === 1)
			return true;
		return false;
	}

	getWinners() {
		if (this.gameState !== 'FINISHED') return [];

		const activePlayers = this.getActivePlayers();

		// If no active players, no winner (draw)
		if (activePlayers.length === 0)
			return [];
		return activePlayers;
	}

	canAdvanceRound() {
		// Game continues until someone wins or draw
		if (!this.hasPlayedThisRound) return false;
		if (this.gameState === 'FINISHED') return false;
		return true;
	}

	advanceRound() {
		if (!this.canAdvanceRound())
			return false;

		this.currentRound++;
		this.hasPlayedThisRound = false;
		this.targetNumber = null;
		this.roundWinners = [];

		// Reset choices for next round
		this.players.forEach(player => player.resetChoice());

		return true;
	}

	// ===== Additional helper methods =====

	getGameState() {
		return {
			...super.getGameState(),
			targetNumber: this.targetNumber,
			roundWinners: this.roundWinners.map(w => w.toJSON()),
			activePlayers: this.getActivePlayers().map(p => p.toJSON()),
			eliminatedPlayers: this.players.filter(p => p.isEliminated).map(p => p.toJSON())
		};
	}

	allPlayersChosen() {
		const activePlayers = this.getActivePlayers();
		return activePlayers.every(p => p.currentChoice !== null);
	}
}

const game = new KingOfDiamondEngine();
game.addPlayer("Alice");
game.addPlayer("Bob");
game.addPlayer("Charlie");

// Play round
game.startGame();
game.playRound();
game.advanceRound();