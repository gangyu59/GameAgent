window.AIAgent = {
  getNextMove(board, color, previousBoard = null) {
    const size = board.length;
    const candidates = [];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] !== 0) continue;

        if (!isLegalMove(board, x, y, color, previousBoard)) continue;

        const winRate = simulatePlayouts(board, x, y, color, 10);
        const liberties = countLiberties(findGroup(x, y, board), board);
        const score = winRate + liberties / 10;

        candidates.push({ x, y, score });
      }
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.score - a.score);
    return { x: candidates[0].x, y: candidates[0].y };
  }
};

function simulatePlayouts(board, x, y, color, times = 10) {
  if (!isLegalMove(board, x, y, color)) return 0;

  let wins = 0;
  for (let i = 0; i < times; i++) {
    const tempBoard = deepCopyBoard(board);
    tempBoard[y][x] = color;
    let current = switchColor(color);
    let passCount = 0, moveCount = 0;

    while (passCount < 2 && moveCount < 100) {
      const empties = getAllEmpty(tempBoard);
      if (empties.length === 0) break;

      const move = empties[Math.floor(Math.random() * empties.length)];
      tempBoard[move.y][move.x] = current;

      if (Math.random() < 0.1) passCount++;
      else passCount = 0;

      current = switchColor(current);
      moveCount++;
    }

    const myScore = countStones(tempBoard, color);
    const oppScore = countStones(tempBoard, switchColor(color));
    if (myScore >= oppScore) wins++;
  }

  return wins / times;
}

function isLegalMove(board, x, y, color, prevBoard = null) {
  if (board[y][x] !== 0) return false;

  const testBoard = deepCopyBoard(board);
  testBoard[y][x] = color;

  const group = findGroup(x, y, testBoard);
  if (countLiberties(group, testBoard) === 0) return false;

  if (prevBoard && JSON.stringify(prevBoard) === JSON.stringify(testBoard)) return false;

  return true;
}

function getAllEmpty(board) {
  const result = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board.length; x++) {
      if (board[y][x] === 0) result.push({ x, y });
    }
  }
  return result;
}

function switchColor(c) {
  return c === 1 ? 2 : 1;
}

function countStones(board, color) {
  let count = 0;
  for (let row of board) {
    for (let cell of row) {
      if (cell === color) count++;
    }
  }
  return count;
}