// =============== 全局接口 ===============
window.AIAgent = {
  getNextMove: function(board, color) {
    // 1. 开局策略
    const stoneCount = board.flat().filter(x => x !== 0).length;
    if (stoneCount < 10) {
      const cornerMove = this._getCornerMove(board, color);
      if (cornerMove) return cornerMove;
    }
    
    // 2. MCTS搜索
    const move = window.MCTS.search(board, color, {
      simulations: 50,
      exploration: 1.4
    });
    
    // 3. 保底随机走子
    return move || this._getRandomMove(board);
  },

  _getCornerMove: function(board, color) {
    const size = board.length;
    const corners = [[3,3], [size-4,3], [3,size-4], [size-4,size-4]];
    
    for (let i = 0; i < corners.length; i++) {
      const [x, y] = corners[i];
      if (board[y][x] === 0 && window.AIEval.isValidMove(board, x, y, color)) {
        return {x, y};
      }
    }
    return null;
  },

  _getRandomMove: function(board) {
    const empties = [];
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board.length; x++) {
        if (board[y][x] === 0) empties.push({x, y});
      }
    }
    return empties[Math.floor(Math.random() * empties.length)];
  }
};