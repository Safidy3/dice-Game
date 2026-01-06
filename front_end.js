// ===========================
// FRONTEND COMPONENTS (UI Builders)
// ===========================

/**
 * HTML Builder Utility
 * Creates DOM elements programmatically
 */
class HTMLBuilder {
	static createElement(tag, className = '', attributes = {}) {
		const element = document.createElement(tag);
		if (className) element.className = className;
		Object.entries(attributes).forEach(([key, value]) => {
			if (key === 'textContent') {
				element.textContent = value;
			} else if (key.startsWith('on')) {
				element.addEventListener(key.substring(2).toLowerCase(), value);
			} else {
				element.setAttribute(key, value);
			}
		});
		return element;
	}

	static createButton(text, className, onClick) {
		return this.createElement('button', className, {
			textContent: text,
			onClick: onClick
		});
	}

	static createInput(type, placeholder, className = '') {
		return this.createElement('input', className, {
			type: type,
			placeholder: placeholder
		});
	}

	static createDiv(className = '', textContent = '') {
		return this.createElement('div', className, { textContent });
	}
}

/**
 * Setup View Component
 * Handles the player setup UI
 */
class SetupView {
	constructor(gameEngine, onStartGame) {
		this.gameEngine = gameEngine;
		this.onStartGame = onStartGame;
		this.container = null;
	}

	render() {
		this.container = HTMLBuilder.createDiv('setup-section');

		const title = HTMLBuilder.createElement('h2', '', {
			textContent: 'Add Players'
		});
		title.style.marginBottom = '20px';

		const inputContainer = this.buildInputSection();
		const playerList = this.buildPlayerList();
		const startButton = this.buildStartButton();

		this.container.appendChild(title);
		this.container.appendChild(inputContainer);
		this.container.appendChild(playerList);
		this.container.appendChild(startButton);

		return this.container;
	}

	buildInputSection() {
		const inputContainer = HTMLBuilder.createDiv('player-input');
		
		this.playerInput = HTMLBuilder.createInput('text', 'Enter player name');
		this.playerInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') this.handleAddPlayer();
		});

		const addButton = HTMLBuilder.createButton('Add Player', 'btn-add', () => {
			this.handleAddPlayer();
		});

		inputContainer.appendChild(this.playerInput);
		inputContainer.appendChild(addButton);
		return inputContainer;
	}

	buildPlayerList() {
		this.playerListContainer = HTMLBuilder.createDiv('player-list');
		this.updatePlayerList();
		return this.playerListContainer;
	}

	buildStartButton() {
		this.startButton = HTMLBuilder.createButton('Start Game', 'btn-start', () => {
			this.onStartGame();
		});
		this.updateStartButton();
		return this.startButton;
	}

	handleAddPlayer() {
		try {
			this.gameEngine.addPlayer(this.playerInput.value.trim());
			this.playerInput.value = '';
			this.updatePlayerList();
			this.updateStartButton();
		} catch (error) {
			alert(error.message);
		}
	}

	updatePlayerList() {
		this.playerListContainer.innerHTML = '';
		this.gameEngine.players.forEach(player => {
			const playerItem = this.buildPlayerItem(player);
			this.playerListContainer.appendChild(playerItem);
		});
	}

	buildPlayerItem(player) {
		const item = HTMLBuilder.createDiv('player-item');
		
		const nameSpan = HTMLBuilder.createElement('span', '', {
			textContent: player.name
		});
		nameSpan.innerHTML = `<strong>${player.name}</strong>`;

		const removeButton = HTMLBuilder.createButton('Remove', 'btn-remove', () => {
			this.gameEngine.removePlayer(player.id);
			this.updatePlayerList();
			this.updateStartButton();
		});

		item.appendChild(nameSpan);
		item.appendChild(removeButton);
		return item;
	}

	updateStartButton() {
		this.startButton.disabled = !this.gameEngine.canStartGame();
	}

	destroy() {
		if (this.container && this.container.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}
	}
}

/**
 * Game View Component
 * Handles the main game UI
 */
class GameView {
	constructor(gameEngine, onReset) {
		this.gameEngine = gameEngine;
		this.onReset = onReset;
		this.container = null;
	}

	render() {
		this.container = HTMLBuilder.createDiv('game-section');

		const roundInfo = this.buildRoundInfo();
		const playersGrid = this.buildPlayersGrid();
		const controls = this.buildControls();
		this.winnerSection = this.buildWinnerSection();

		this.container.appendChild(roundInfo);
		this.container.appendChild(playersGrid);
		this.container.appendChild(controls);
		this.container.appendChild(this.winnerSection);

		return this.container;
	}

	buildRoundInfo() {
		this.roundInfoContainer = HTMLBuilder.createDiv('round-info');
		this.updateRoundInfo();
		return this.roundInfoContainer;
	}

	updateRoundInfo() {
		const state = this.gameEngine.getGameState();
		this.roundInfoContainer.innerHTML = `<h2>Round ${state.currentRound} of ${state.maxRounds}</h2>`;
	}

	buildPlayersGrid() {
		this.playersGridContainer = HTMLBuilder.createDiv('players-grid');
		this.updatePlayersGrid();
		return this.playersGridContainer;
	}

	updatePlayersGrid() {
		this.playersGridContainer.innerHTML = '';
		const state = this.gameEngine.getGameState();
		const roundWinner = this.gameEngine.getRoundWinner();

		this.gameEngine.players.forEach(player => {
			const card = this.buildPlayerCard(player, roundWinner);
			this.playersGridContainer.appendChild(card);
		});
	}

	buildPlayerCard(player, roundWinner) {
		const isWinner = roundWinner && player.id === roundWinner.id;
		const card = HTMLBuilder.createDiv(`player-card ${isWinner ? 'winner' : ''}`);

		const name = HTMLBuilder.createDiv('player-name');
		name.textContent = `${player.name} ${isWinner ? '👑' : ''}`;

		const diceContainer = this.buildDiceContainer(player.currentDice);
		const scoreInfo = this.buildScoreInfo(player);

		card.appendChild(name);
		card.appendChild(diceContainer);
		card.appendChild(scoreInfo);

		return card;
	}

	buildDiceContainer(dice) {
		const container = HTMLBuilder.createDiv('dice-container');
		
		dice.forEach(value => {
			const die = HTMLBuilder.createDiv('die');
			die.textContent = value > 0 ? value : '?';
			container.appendChild(die);
		});

		return container;
	}

	buildScoreInfo(player) {
		const container = HTMLBuilder.createDiv('score-info');
		const state = this.gameEngine.getGameState();
		
		const sum = HTMLBuilder.createElement('p', '', {
			textContent: `Sum: ${state.hasRolledThisRound ? player.getDiceSum() : '-'}`
		});

		const roundScore = HTMLBuilder.createElement('p', '', {
			textContent: `Round Score: ${state.hasRolledThisRound ? player.roundScores[state.currentRound - 1] : '-'}`
		});

		const totalScore = HTMLBuilder.createElement('p', 'total-score', {
			textContent: `Round Scores: ${player.roundScores.slice(0, state.currentRound).join(', ')}`
		});

		container.appendChild(sum);
		container.appendChild(roundScore);
		container.appendChild(totalScore);

		return container;
	}

	buildControls() {
		const controls = HTMLBuilder.createDiv('controls');
		
		this.rollButton = HTMLBuilder.createButton('Roll Dice', 'btn-roll', () => {
			this.handleRollAction();
		});

		controls.appendChild(this.rollButton);
		return controls;
	}

	handleRollAction() {
		const state = this.gameEngine.getGameState();

		if (!state.hasRolledThisRound) {
			this.gameEngine.rollAllDice();
			this.rollButton.textContent = 'Next Round';
			this.updatePlayersGrid();
		} else {
			if (this.gameEngine.canAdvanceRound()) {
				this.gameEngine.advanceRound();
				this.rollButton.textContent = 'Roll Dice';
				this.updateRoundInfo();
				this.updatePlayersGrid();
			} else {
				this.gameEngine.endGame();
				this.showWinner();
			}
		}
	}

	buildWinnerSection() {
		const section = HTMLBuilder.createDiv('winner-announcement hidden');
		this.winnerContent = HTMLBuilder.createDiv();
		
		const title = HTMLBuilder.createElement('h2', '', {
			textContent: '🏆 Game Over! 🏆'
		});

		const resetButton = HTMLBuilder.createButton('New Game', 'btn-reset', () => {
			this.onReset();
		});

		section.appendChild(title);
		section.appendChild(this.winnerContent);
		section.appendChild(resetButton);

		return section;
	}

	showWinner() {
		this.rollButton.classList.add('hidden');
		const winners = this.gameEngine.getWinners();

		let content = '';
		if (winners.length === 1) {
			content = `
				<p style="font-size: 2em; margin: 20px 0;"><strong>${winners[0].name}</strong> wins!</p>
				<p style="font-size: 1.5em;">Total Score: ${winners[0].getTotalScore()}</p>
			`;
		} else {
			content = `
				<p style="font-size: 2em; margin: 20px 0;">It's a tie!</p>
				<p style="font-size: 1.5em;">${winners.map(w => w.name).join(' & ')} tied with ${winners[0].getTotalScore()} points</p>
			`;
		}

		content += '<div style="margin-top: 20px;">';
		this.gameEngine.players.forEach(player => {
			content += `<p style="margin: 5px 0;">${player.name}: ${player.getTotalScore()} (${player.roundScores.join(', ')})</p>`;
		});
		content += '</div>';

		this.winnerContent.innerHTML = content;
		this.winnerSection.classList.remove('hidden');
	}

	destroy() {
		if (this.container && this.container.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}
	}
}

/**
 * Application Controller
 * Manages the overall application flow
 */
class GameApp {
	constructor(containerId) {
		this.container = document.getElementById(containerId);
		this.gameEngine = new GameEngine();
		this.currentView = null;
		
		this.init();
	}

	init() {
		this.showSetupView();
	}

	showSetupView() {
		this.clearView();
		this.currentView = new SetupView(this.gameEngine, () => this.startGame());
		this.container.appendChild(this.currentView.render());
	}

	showGameView() {
		this.clearView();
		this.currentView = new GameView(this.gameEngine, () => this.resetGame());
		this.container.appendChild(this.currentView.render());
	}

	startGame() {
		try {
			this.gameEngine.startGame();
			this.showGameView();
		} catch (error) {
			alert(error.message);
		}
	}

	resetGame() {
		this.gameEngine.reset();
		this.showSetupView();
	}

	clearView() {
		if (this.currentView) {
			this.currentView.destroy();
			this.currentView = null;
		}
	}
}

// ===========================
// APPLICATION INITIALIZATION
// ===========================

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	const app = new GameApp('app');
});