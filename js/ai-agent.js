// js/ai-agent.js
window.AIAgent = {
  getNextMove(board, color) {
    const size = board.length;
    const validMoves = [];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] === 0) validMoves.push({ x, y });
      }
    }

    if (validMoves.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }
};