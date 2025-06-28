// =============== 气检测 ===============
window.AIEval = {
  checkLiberties: function(board, x, y) {
    const color = board[y][x];
    const visited = {};
    const queue = [[x, y]];
    const size = board.length;
    
    while (queue.length > 0) {
      const [cx, cy] = queue.pop();
      const key = cx + ',' + cy;
      if (visited[key]) continue;
      visited[key] = true;
      
      const neighbors = window.getNeighbors(cx, cy, size);
      for (let i = 0; i < neighbors.length; i++) {
        const [nx, ny] = neighbors[i];
        if (board[ny][nx] === 0) return true;
        if (board[ny][nx] === color) queue.push([nx, ny]);
      }
    }
    return false;
  },

  isValidMove: function(board, x, y, color) {
    if (board[y][x] !== 0) return false;
    
    const testBoard = window.copyBoard(board);
    testBoard[y][x] = color;
    return this.checkLiberties(testBoard, x, y) || 
      window.getNeighbors(x, y, board.length).some(([nx, ny]) => 
        board[ny][nx] === 3 - color && 
        !this.checkLiberties(testBoard, nx, ny)
      );
  }
};