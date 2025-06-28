// =============== MCTS节点类 ===============
function MCTSNode(board, move, parent, color) {
  this.board = window.copyBoard(board);
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
  
  // 提子逻辑
  for (let i = 0; i < neighbors.length; i++) {
    const [nx, ny] = neighbors[i];
    if (this.board[ny][nx] === opponent && 
        !window.AIEval.checkLiberties(this.board, nx, ny)) {
      this._removeGroup(nx, ny);
    }
  }
};

MCTSNode.prototype._removeGroup = function(x, y) {
  const color = this.board[y][x];
  const queue = [[x, y]];
  const size = this.board.length;
  
  while (queue.length > 0) {
    const [cx, cy] = queue.pop();
    this.board[cy][cx] = 0;
    
    const neighbors = window.getNeighbors(cx, cy, size);
    for (let i = 0; i < neighbors.length; i++) {
      const [nx, ny] = neighbors[i];
      if (this.board[ny][nx] === color) {
        queue.push([nx, ny]);
      }
    }
  }
};

// =============== MCTS核心方法 ===============
MCTSNode.prototype._selectChild = function(exploration) {
  let bestChild = null;
  let bestUCT = -Infinity;
  
  for (let i = 0; i < this.children.length; i++) {
    const child = this.children[i];
    const uct = child._getUCTValue(exploration);
    if (uct > bestUCT) {
      bestUCT = uct;
      bestChild = child;
    }
  }
  return bestChild;
};

MCTSNode.prototype._getUCTValue = function(c) {
  if (this.visits === 0) return Infinity;
  return (this.wins / this.visits) + c * Math.sqrt(Math.log(this.parent.visits) / this.visits);
};

MCTSNode.prototype._expand = function() {
  const validMoves = this._getValidMoves();
  const nextColor = 3 - this.color;
  
  for (let i = 0; i < validMoves.length; i++) {
    this.children.push(new MCTSNode(
      this.board,
      validMoves[i],
      this,
      nextColor
    ));
  }
  
  return this.children[0] || this; // 返回第一个子节点或自身
};

MCTSNode.prototype._getValidMoves = function() {
  const moves = [];
  for (let y = 0; y < this.board.length; y++) {
    for (let x = 0; x < this.board.length; x++) {
      if (this.board[y][x] === 0 && window.AIEval.isValidMove(this.board, x, y, this.color)) {
        moves.push({ x, y });
      }
    }
  }
  return moves;
};

MCTSNode.prototype._simulate = function() {
  let board = window.copyBoard(this.board);
  let currentColor = this.color;
  let passes = 0;
  let steps = 0;
  
  // 限制模拟步数（防止无限循环）
  while (passes < 2 && steps < 100) {
    const move = window.getRandomMove(board, currentColor);
    if (!move) {
      passes++;
    } else {
      board[move.y][move.x] = currentColor;
      passes = 0;
    }
    currentColor = 3 - currentColor;
    steps++;
  }
  
  return this._estimateResult(board);
};

MCTSNode.prototype._estimateResult = function(board) {
  let score = 0;
  const size = board.length;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] === this.color) score++;
      else if (board[y][x] === 0) score += 0.5; // 简化评估
    }
  }
  
  return {
    winner: score > size * size / 2 ? this.color : 3 - this.color,
    score: Math.abs(score)
  };
};

MCTSNode.prototype._backpropagate = function(result) {
  let node = this;
  while (node) {
    node.visits++;
    if (node.color === result.winner) {
      node.wins += result.score;
    }
    node = node.parent;
  }
};

MCTSNode.prototype._getBestMove = function() {
  let bestMove = null;
  let bestVisits = -1;
  
  for (let i = 0; i < this.children.length; i++) {
    const child = this.children[i];
    if (child.visits > bestVisits) {
      bestVisits = child.visits;
      bestMove = child.move;
    }
  }
  
  return bestMove;
};

// =============== 公开接口 ===============
window.MCTS = {
  search: function(board, color, config) {
    const startTime = Date.now();
    const root = new MCTSNode(board, null, null, color);
    let simulations = 0;
    
    while (simulations < config.simulations) {
      // 超时检查（30秒限制）
      if (Date.now() - startTime > 30000) {
        console.warn("MCTS超时，已模拟次数:", simulations);
        break;
      }
      
      let node = root;
      let depth = 0;
      
      // 选择阶段（限制最大深度）
      while (node.children.length > 0 && depth < 200) {
        node = node._selectChild(config.exploration);
        depth++;
      }
      
      // 扩展阶段（跳过终局）
      if (node._getValidMoves().length > 0 && node.visits > 0) {
        node = node._expand();
      }
      
      // 模拟阶段
      const result = node._simulate();
      
      // 回溯
      node._backpropagate(result);
      simulations++;
    }
    
    const bestMove = root._getBestMove();
    return bestMove || window.getRandomMove(board, color); // 保底返回随机走子
  }
};