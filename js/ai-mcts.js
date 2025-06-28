// =============== MCTS节点类 ===============
function MCTSNode(board, move, parent, color) {
  this.board = window.copyBoard(board); // 使用全局方法
  this.move = move;
  this.parent = parent;
  this.color = color;
  this.children = [];
  this.wins = 0;
  this.visits = 0;
  
  if (move) this._applyMove();
}

MCTSNode.prototype._applyMove = function() {
  this.board[this.move.y][this.move.x] = this.color;
  const neighbors = window.getNeighbors(this.move.x, this.move.y, this.board.length);
  const opponent = 3 - this.color;
  
  for (let i = 0; i < neighbors.length; i++) {
    const [nx, ny] = neighbors[i];
    if (this.board[ny][nx] === opponent && 
        !window.AIEval.checkLiberties(this.board, nx, ny)) {
      this._removeGroup(nx, ny);
    }
  }
};

// =============== 公开接口 ===============
window.MCTS = {
  search: function(board, color, config) {
    const root = new MCTSNode(board, null, null, color);
    // ...（保持原有search实现完整）
    return root._getBestMove();
  }
};