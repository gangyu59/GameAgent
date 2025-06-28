// =============== 全局接口 ===============
window.AIAgent = {
  getNextMove: function(board, color) {
    // 0. 计时开始
    const startTime = Date.now();
    
    // 1. 开局策略（快速响应）
    if (this._isOpeningPhase(board)) {
      const cornerMove = this._getCornerMove(board, color);
      if (cornerMove) return cornerMove;
    }
    
    // 2. MCTS搜索（带超时控制）
    let mctsMove;
    try {
      mctsMove = this._runWithTimeout(() => {
        return window.MCTS.search(board, color, {
          simulations: 100,  // 增加模拟次数
          exploration: 1.4,
          timeout: 28000      // 预留2秒给后续处理
        });
      }, 30000); // 总超时30秒
    } catch (e) {
      console.error("MCTS搜索出错:", e);
    }
    
    // 3. 结果处理
    return mctsMove || this._getRandomValidMove(board, color); // 确保返回合法走子
  },

  // =============== 私有方法 ===============
  _isOpeningPhase: function(board) {
    // 更高效的开局判断
    let stoneCount = 0;
    for (let y = 0; y < board.length && stoneCount < 10; y++) {
      for (let x = 0; x < board.length && stoneCount < 10; x++) {
        if (board[y][x] !== 0) stoneCount++;
      }
    }
    return stoneCount < 10;
  },

  _getCornerMove: function(board, color) {
    const size = board.length;
    const corners = [
      [3, 3], [size-4, 3], 
      [3, size-4], [size-4, size-4],
      [2, 2], [size-3, 2],      // 增加星位点
      [2, size-3], [size-3, size-3]
    ];
    
    for (let i = 0; i < corners.length; i++) {
      const [x, y] = corners[i];
      if (board[y][x] === 0 && window.AIEval.isValidMove(board, x, y, color)) {
        return {x, y};
      }
    }
    return null;
  },

  _getRandomValidMove: function(board, color) {
    // 只返回合法走子（重要改进！）
    const empties = [];
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board.length; x++) {
        if (board[y][x] === 0 && window.AIEval.isValidMove(board, x, y, color)) {
          empties.push({x, y});
        }
      }
    }
    return empties.length > 0 ? empties[Math.floor(Math.random() * empties.length)] : null;
  },

  _runWithTimeout: function(fn, timeoutMs) {
    // 简单的超时控制
    const start = Date.now();
    const endTime = start + timeoutMs;
    
    let result;
    while (Date.now() < endTime) {
      result = fn();
      if (result !== undefined) break;
    }
    return result;
  }
};