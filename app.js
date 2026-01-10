/**
 * AR Tic-Tac-Toe Game
 * Manages game state, UI, and AR marker detection
 */

// ============================================================================
// Game State Management
// ============================================================================
class GameState {
  constructor() {
    this.board = Array(9).fill(null);
    this.currentPlayer = "X";
    this.gameOver = false;
    this.lastPlacementTime = 0;
    this.winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // cols
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];
  }

  canPlaceMove(position) {
    return !this.gameOver && this.board[position] === null;
  }

  placeMove(position) {
    if (!this.canPlaceMove(position)) {
      return false;
    }

    this.board[position] = this.currentPlayer;
    return true;
  }

  checkWin() {
    for (let pattern of this.winPatterns) {
      const [a, b, c] = pattern;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return pattern;
      }
    }
    return null;
  }

  checkDraw() {
    return this.board.every((cell) => cell !== null);
  }

  switchPlayer() {
    this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
  }

  reset() {
    this.board = Array(9).fill(null);
    this.currentPlayer = "X";
    this.gameOver = false;
    this.lastPlacementTime = 0;
  }

  canProcessMove() {
    const now = Date.now();
    if (now - this.lastPlacementTime < 1000) {
      return false; // Debounce
    }
    this.lastPlacementTime = now;
    return true;
  }
}

// ============================================================================
// UI Management
// ============================================================================
class GameUI {
  constructor() {
    this.statusEl = document.getElementById("status");
    this.resetBtn = document.getElementById("reset");
    this.cells = [];
    
    for (let i = 0; i < 9; i++) {
      this.cells.push(document.getElementById(`cell-${i}`));
    }
  }

  updateStatus(message) {
    this.statusEl.textContent = message;
  }

  showTemporaryMessage(message, duration = 1500, currentPlayer) {
    this.updateStatus(message);
    setTimeout(() => {
      if (currentPlayer) {
        this.updateStatus(`Player ${currentPlayer}'s Turn`);
      }
    }, duration);
  }

  highlightCell(index) {
    // Remove previous highlights
    this.cells.forEach((cell) => {
      cell.classList.remove("active");
    });

    // Highlight current cell if valid and empty
    if (index >= 0 && index < 9) {
      const cell = this.cells[index];
      if (cell && !cell.classList.contains("x") && !cell.classList.contains("o")) {
        cell.classList.add("active");
      }
    }
  }

  updateCell(position, player) {
    const cell = this.cells[position];
    cell.classList.add(player.toLowerCase());
    cell.classList.remove("active");
  }

  highlightWinningCells(pattern) {
    pattern.forEach((index) => {
      this.cells[index].classList.add("winner");
    });
  }

  resetBoard() {
    this.cells.forEach((cell) => {
      cell.classList.remove("x", "o", "active", "winner");
    });
    this.updateStatus("Player X's Turn");
  }

  onReset(callback) {
    this.resetBtn.addEventListener("click", callback);
  }
}

// ============================================================================
// AR Marker Detection and Grid Position Mapping
// ============================================================================
class MarkerDetector {
  constructor() {
    this.markerPositions = { player1: null, player2: null };
    this.boardOverlay = document.getElementById("board-overlay");
  }

  resetPositions() {
    this.markerPositions = { player1: null, player2: null };
  }

  clearPosition(player) {
    this.markerPositions[player] = null;
  }

  getGridPositionFromMarker(markerEl) {
    // Get the camera
    const camera = document.querySelector("[camera]");
    if (!camera) return -1;

    // Get marker world position
    const markerPos = new THREE.Vector3();
    markerEl.object3D.getWorldPosition(markerPos);

    // Project to screen space
    const cameraObj = camera.getObject3D("camera");
    if (!cameraObj) return -1;

    // Clone position to avoid modifying original
    const projectedPos = markerPos.clone();
    projectedPos.project(cameraObj);

    // Convert from normalized device coordinates (-1 to 1) to screen coordinates
    const screenX = ((projectedPos.x + 1) / 2) * window.innerWidth;
    const screenY = ((-projectedPos.y + 1) / 2) * window.innerHeight;

    // Get the board overlay dimensions and position
    const rect = this.boardOverlay.getBoundingClientRect();

    // Check if marker is within board bounds
    if (
      screenX < rect.left ||
      screenX > rect.right ||
      screenY < rect.top ||
      screenY > rect.bottom
    ) {
      return -1; // Outside board
    }

    // Calculate position relative to board
    const relX = (screenX - rect.left) / rect.width;
    const relY = (screenY - rect.top) / rect.height;

    // Determine which grid cell (0-8)
    let col = Math.floor(relX * 3);
    let row = Math.floor(relY * 3);

    // Clamp to valid range
    col = Math.max(0, Math.min(2, col));
    row = Math.max(0, Math.min(2, row));

    return row * 3 + col;
  }
}

// ============================================================================
// Game Controller
// ============================================================================
class TicTacToeGame {
  constructor() {
    this.state = new GameState();
    this.ui = new GameUI();
    this.markerDetector = new MarkerDetector();
    
    this.setupMarkers();
    this.setupEventListeners();
  }

  setupMarkers() {
    this.player1Marker = document.getElementById("player1-marker");
    this.player2Marker = document.getElementById("player2-marker");

    // Player 1 (X) marker events
    this.player1Marker.addEventListener("markerFound", () => {
      this.handleMarkerFound("player1", this.player1Marker);
    });

    this.player1Marker.addEventListener("markerLost", () => {
      this.markerDetector.clearPosition("player1");
    });

    // Player 2 (O) marker events
    this.player2Marker.addEventListener("markerFound", () => {
      this.handleMarkerFound("player2", this.player2Marker);
    });

    this.player2Marker.addEventListener("markerLost", () => {
      this.markerDetector.clearPosition("player2");
    });
  }

  setupEventListeners() {
    this.ui.onReset(() => this.resetGame());
  }

  handleMarkerFound(player, markerEl) {
    if (this.state.gameOver) return;
    if (!this.state.canProcessMove()) return;

    const playerSymbol = player === "player1" ? "X" : "O";
    
    // Check if it's the correct player's turn
    if (playerSymbol !== this.state.currentPlayer) {
      this.ui.showTemporaryMessage(
        `Not your turn! Player ${this.state.currentPlayer}'s turn`,
        1500,
        this.state.currentPlayer
      );
      return;
    }

    // Determine grid position based on marker screen location
    const gridPos = this.markerDetector.getGridPositionFromMarker(markerEl);
    
    if (gridPos !== -1) {
      this.ui.highlightCell(gridPos);
      this.attemptMove(gridPos);
    }
  }

  attemptMove(position) {
    // Check if position is already taken
    if (!this.state.canPlaceMove(position)) {
      this.ui.showTemporaryMessage(
        "Position taken! Choose another spot",
        1500,
        this.state.currentPlayer
      );
      return;
    }

    // Place the move
    this.state.placeMove(position);
    this.ui.updateCell(position, this.state.currentPlayer);

    // Check for win
    const winPattern = this.state.checkWin();
    if (winPattern) {
      this.handleWin(winPattern);
      return;
    }

    // Check for draw
    if (this.state.checkDraw()) {
      this.handleDraw();
      return;
    }

    // Continue game - switch player
    this.state.switchPlayer();
    this.ui.updateStatus(`Player ${this.state.currentPlayer}'s Turn`);
  }

  handleWin(winPattern) {
    this.state.gameOver = true;
    this.ui.updateStatus(`Player ${this.state.currentPlayer} Wins! 🎉`);
    this.ui.highlightWinningCells(winPattern);
  }

  handleDraw() {
    this.state.gameOver = true;
    this.ui.updateStatus("It's a Draw! 🤝");
  }

  resetGame() {
    this.state.reset();
    this.markerDetector.resetPositions();
    this.ui.resetBoard();
  }
}

// ============================================================================
// Initialize Game
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  new TicTacToeGame();
});
