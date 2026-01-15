# AR Tic-Tac-Toe

An augmented reality implementation of the classic Tic-Tac-Toe game using AR.js and A-Frame. Players use physical AR markers to place their moves on a virtual game board overlaid on their camera view.

## About The Game

AR Tic-Tac-Toe brings the classic two-player game into augmented reality. Instead of clicking or tapping on a screen, players show physical printed markers to their device's camera to place X's and O's on the game board.

### How It Works

- **Player 1 (X)** uses Marker 1 (pattern-marker1.patt)
- **Player 2 (O)** uses Marker 2 (pattern-marker2.patt)
- Position your marker over one of the 9 grid cells visible on screen
- The game detects which cell you're pointing at and highlights it
- Hold the marker steady to place your move
- The game automatically tracks turns, detects wins, and handles game flow

### Code Architecture

The application uses a clean, object-oriented architecture:

- **`GameState`** - Manages game logic, board state, and win conditions
- **`GameUI`** - Handles all DOM manipulation and visual updates
- **`MarkerDetector`** - Processes AR marker detection and maps positions to grid cells
- **`TicTacToeGame`** - Main controller that coordinates all components

## Getting Started

### Prerequisites

- A modern web browser with WebRTC support
- A device with a camera (webcam or mobile device)
- Printed AR markers (`img\pattern-player1.png` and `img\pattern-player2.png`)

### Installation

1. Clone or download this repository
2. Serve the files using a local web server:

   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Node.js http-server
   npx http-server -p 8000

   # Using PHP
   php -S localhost:8000
   ```

3. Open `http://localhost:8000` in your browser
4. Allow camera permissions when prompted

**Enjoy playing AR Tic-Tac-Toe!** 🎉
