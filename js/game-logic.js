// game-logic.js

// ✅ 落子核心逻辑
function placeStone(x, y) {
  const board = window.game.board;
  const color = window.game.currentPlayer === 'black' ? 1 : 2;
  
  // 检查是否轮到此玩家
  if (window.game.playerColor !== window.game.currentPlayer) {
    logDebug("⛔ 还没轮到你落子", true);
    return;
  }
  
  // 检查位置是否为空
  if (board[y][x] !== 0) return;
  
  // 创建棋盘副本
  const newBoard = board.map(row => [...row]);
  newBoard[y][x] = color;
  
  // 检查自杀规则
  const liberties = checkLiberties(x, y, newBoard);
  if (liberties === 0) {
    logDebug("🚫 禁止自杀", true);
    return;
  }
  
  // 检查打劫规则
  const newBoardStr = JSON.stringify(newBoard);
  if (window.game.previousBoard === newBoardStr) {
    logDebug("🚫 打劫规则禁止立即回提", true);
    return;
  }
  
  // 提子逻辑
  removeCapturedStones(x, y, newBoard);
  
  // 更新游戏状态
  window.game.previousBoard = JSON.stringify(board);
  window.game.board = newBoard;
  window.game.passCount = 0;
  window.game.currentPlayer = window.game.currentPlayer === 'black' ? 'white' : 'black';
  
  // 更新UI
  updateBoardUI();
  
  // 发送移动数据
  if (window.sendMove) {
    window.sendMove({ x, y });
  }
}

// ✅ 检查棋子气数
function checkLiberties(x, y, board) {
  let liberties = 0;
  const checked = new Set();
  const queue = [[x, y]];
  const color = board[y][x];
  
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    const key = `${cx},${cy}`;
    
    if (checked.has(key)) continue;
    checked.add(key);
    
    for (const [nx, ny] of getNeighbors(cx, cy)) {
      if (board[ny][nx] === 0) liberties++;
      else if (board[ny][nx] === color) queue.push([nx, ny]);
    }
  }
  
  return liberties;
}

// ✅ 提子逻辑
function removeCapturedStones(x, y, board) {
  const color = board[y][x];
  const opponentColor = color === 1 ? 2 : 1;
  
  for (const [nx, ny] of getNeighbors(x, y)) {
    if (board[ny][nx] === opponentColor) {
      const group = getConnectedGroup(nx, ny, board);
      if (getLiberties(group, board) === 0) {
        group.forEach(([gx, gy]) => board[gy][gx] = 0);
      }
    }
  }
}

// ✅ 获取连接组
function getConnectedGroup(x, y, board, visited = new Set()) {
  const color = board[y][x];
  const group = [];
  const stack = [[x, y]];
  
  while (stack.length) {
    const [cx, cy] = stack.pop();
    const key = `${cx},${cy}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    group.push([cx, cy]);
    
    for (const [nx, ny] of getNeighbors(cx, cy)) {
      if (board[ny][nx] === color) stack.push([nx, ny]);
    }
  }
  
  return group;
}

// ✅ 计算气数
function getLiberties(group, board) {
  let liberties = 0;
  const checked = new Set();
  
  for (const [x, y] of group) {
    for (const [nx, ny] of getNeighbors(x, y)) {
      if (board[ny][nx] === 0 && !checked.has(`${nx},${ny}`)) {
        liberties++;
        checked.add(`${nx},${ny}`);
      }
    }
  }
  
  return liberties;
}

// ✅ 处理对手落子
window.handleMove = function ({ x, y }) {
  // 更新对手落子
  window.game.board[y][x] = window.game.currentPlayer === 'black' ? 1 : 2;
  window.game.currentPlayer = window.game.currentPlayer === 'black' ? 'white' : 'black';
  
  // 更新UI
  updateBoardUI();
};

// ✅ 更新棋盘UI
function updateBoardUI() {
  const board = window.game.board;
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board.length; x++) {
      const cell = document.getElementById(`cell-${x}-${y}`);
      const value = board[y][x];
      cell.innerHTML = value === 1 ? `<div class="black-stone"></div>` :
                     value === 2 ? `<div class="white-stone"></div>` : "";
    }
  }
}

// ✅ 弃权处理
function handlePass() {
  window.game.passCount++;
  logDebug(`${window.game.currentPlayer === 'black' ? '⚫' : '⚪'} 放弃着手`);
  
  if (window.game.passCount >= 2) {
    const result = calculateScore();
    document.getElementById("resultBox").innerHTML = result.summary;
    document.getElementById("resultBox").style.display = "block";
    document.getElementById("restartBtn").style.display = "block";
  } else {
    window.game.currentPlayer = window.game.currentPlayer === 'black' ? 'white' : 'black';
  }
}

// ✅ 认输处理
function handleResign() {
  const winner = window.game.currentPlayer === 'black' ? '⚪ 白方' : '⚫ 黑方';
  logDebug(`${winner} 获胜（对手认输）`);
  
  document.getElementById("resultBox").innerHTML = `${winner} 获胜！`;
  document.getElementById("resultBox").style.display = "block";
  document.getElementById("restartBtn").style.display = "block";
}