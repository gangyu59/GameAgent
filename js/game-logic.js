/**
 * 完整的围棋游戏逻辑核心
 * 包含：落子规则、吃子逻辑、打劫、弃权、认输、胜负判定等
 */

// 初始化游戏状态
function initGame(boardSize = 9) {
  window.game = {
    boardSize: boardSize,
    board: Array.from({ length: boardSize }, () => Array(boardSize).fill(0)),
    currentPlayer: 'black', // black或white
    playerColor: null,      // 当前玩家的颜色
    previousBoard: null,    // 上一步棋盘状态（用于打劫检测）
    passCount: 0,           // 连续弃权次数
    koPosition: null,       // 打劫位置
    capturedStones: {       // 提子计数
      black: 0,
      white: 0
    }
  };
  logDebug("游戏初始化完成");
  logDebug(`初始棋盘状态:\n${formatBoardForDebug(window.game.board)}`);
}

// 核心落子逻辑
function placeStone(x, y, isRemote = false) {
  logDebug(`\n===== ${isRemote ? '远程' : '本地'}落子 (${x},${y}) =====`);
  logDebug(`当前回合: ${window.game.currentPlayer}`);
  logDebug(`玩家颜色: ${window.game.playerColor}`);
  
  // ✅ 只本地落子时验证回合
  if (!isRemote && window.game.playerColor !== window.game.currentPlayer) {
    logDebug("⛔ 失败: 不是你的回合", true);
    return false;
  }

  // ✅ 以下逻辑全部保持你原样不动 ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  
  // 2. 位置有效性检查
  if (!isValidPosition(x, y)) {
    logDebug(`⛔ 无效位置: (${x},${y})`, true);
    return false;
  }

  // 3. 创建新棋盘状态
  const newBoard = deepCopyBoard(window.game.board);
  const color = window.game.currentPlayer === 'black' ? 1 : 2;
  newBoard[y][x] = color;

  // 4. 吃子检测
  const opponentColor = color === 1 ? 2 : 1;
  let capturedGroups = [];
  
  for (const [nx, ny] of getNeighbors(x, y)) {
    if (newBoard[ny][nx] === opponentColor) {
      const group = findGroup(nx, ny, newBoard);
      if (countLiberties(group, newBoard) === 0) {
        capturedGroups.push(group);
      }
    }
  }

  // 5. 执行吃子
  let capturedStones = [];
  capturedGroups.forEach(group => {
    group.forEach(([gx, gy]) => {
      newBoard[gy][gx] = 0;
      capturedStones.push([gx, gy]);
    });
  });

  // 6. 自杀规则检查
  const currentGroup = findGroup(x, y, newBoard);
  if (countLiberties(currentGroup, newBoard) === 0 && capturedStones.length === 0) {
    logDebug("⛔ 失败: 自杀规则", true);
    return false;
  }

  // 7. 打劫规则检查
  const newBoardString = JSON.stringify(newBoard);
  if (window.game.previousBoard === newBoardString) {
    logDebug("⛔ 失败: 打劫规则", true);
    return false;
  }

  // 8. 更新游戏状态
  window.game.previousBoard = JSON.stringify(window.game.board);
  window.game.board = newBoard;
  
  // 更新提子计数
  if (capturedStones.length > 0) {
    const captureCount = capturedStones.length;
    if (color === 1) {
      window.game.capturedStones.black += captureCount;
    } else {
      window.game.capturedStones.white += captureCount;
    }
    logDebug(`吃掉 ${captureCount} 颗${color === 1 ? '白' : '黑'}子`);
  }

  // 9. 切换回合
  window.game.currentPlayer = window.game.currentPlayer === 'black' ? 'white' : 'black';
  window.game.passCount = 0;
  window.game.koPosition = capturedStones.length === 1 ? capturedStones[0] : null;

  logDebug(`✅ 落子成功: (${x},${y})`);
  logDebug(`新回合: ${window.game.currentPlayer}`);
  logDebug(`提子统计 - 黑:${window.game.capturedStones.black} 白:${window.game.capturedStones.white}`);
  logDebug(`最新棋盘:\n${formatBoardForDebug(newBoard)}`);

  // 10. 更新UI
	startTimer(window.game.currentPlayer); // 切换计时器
	window.lastMove = { x, y };
	
	window.playStoneSound();  // 播放落子音效
	
  updateBoardUI();

  // ✅ 只本地落子时才发送网络同步
  if (!isRemote && window.sendMove) {
    window.sendMove({
      x,
      y,
      color: window.game.playerColor,
      currentTurn: window.game.currentPlayer,
      captured: capturedStones.length
    });
  }
	
  // 11. 终局检查
  checkGameEnd();
  return true;
}

window.handleMove = function (data) {
  logDebug(`\n===== 处理对手操作 =====`);
  logDebug(`收到数据: ${JSON.stringify(data)}`);

  if (!data) return;

  switch (data.type) {
		case 'restart':
		  logDebug("♻️ 对手请求重新开始对局");
		
		  // ✅ 覆盖初始化参数
		  window.game.board = data.board || createEmptyBoard(9);
		  window.game.currentPlayer = data.currentPlayer || 'black';
		  window.game.playerColor = data.playerColor === 'black' ? 'white' : 'black'; // 对方是黑，我是白
		
		  renderBoard(); // ✅ 清空棋盘 + 重新绘制所有交叉点 + 绑定点击事件
		  startTimer(window.game.currentPlayer);
		  updatePlayerColorInfo();
		
		  document.getElementById("resultBox").style.display = "none";
		  document.getElementById("restartBtn").style.display = "none";
		  break;

		case 'pass':
		  logDebug("⏭ 对手弃权");
		  window.game.passCount++;
		  window.game.waitingForOpponentPass = false;
		  window.game.currentPlayer = data.currentTurn || switchTurn(window.game.currentPlayer);
		
		  if (window.game.passCount >= 2) {
		    logDebug("☑️ 双方弃权结束，对手发来终局信号");
		    endGameByPass(data.summary); // 对手计算出的结果
		  } else {
		    updateBoardUI();
		  }
		  break;

    case 'resign':
      logDebug(`🏳 对手认输，${data.winner} 获胜`);
      endGame(data.winner === 'black' ? '黑方胜（对手认输）' : '白方胜（对手认输）');
      break;

    case 'gameover':
      logDebug("📩 收到对手发送的终局结果");
      endGame(data.summary);
      break;

    default:
      // 落子数据
      if (typeof data.x !== 'number' || typeof data.y !== 'number') {
        logDebug("⛔ 无效的落子数据", true);
        return;
      }

      const stoneColor = data.color === 'black' ? 1 : 2;
      window.game.board[data.y][data.x] = stoneColor;

      if (data.captured > 0) {
        if (stoneColor === 1) {
          window.game.capturedStones.black += data.captured;
        } else {
          window.game.capturedStones.white += data.captured;
        }
      }

      window.game.currentPlayer = data.currentTurn || switchTurn(window.game.currentPlayer);
      window.lastMove = { x: data.x, y: data.y };
      window.game.passCount = 0;

      updateBoardUI();
      checkGameEnd();
  }
};

// 弃权处理
function handlePass() {
  if (window.game.waitingForOpponentPass) {
    logDebug("⏸ 请等待对手回应上一次弃权，不能连续弃权", true);
    return;
  }

  logDebug(`\n===== ${window.game.currentPlayer}方弃权 =====`);
  window.game.passCount++;
  window.game.waitingForOpponentPass = true;

  if (window.sendMove) {
    window.sendMove({
      type: 'pass',
      currentTurn: switchTurn(window.game.currentPlayer)
    });
  }

  if (window.game.passCount >= 2) {
    endGameByPass(); // 会负责 sendMove(gameover)
  } else {
    switchPlayer();
  }
}

// 认输处理
function handleResign() {
  const loser = window.game.currentPlayer;
  const winner = loser === 'black' ? 'white' : 'black';
  
  logDebug(`\n===== ${loser}方认输 =====`);
  logDebug(`🎉 ${winner}方获胜`);

  if (window.sendMove) {
    window.sendMove({
      type: 'resign',
      winner: winner
    });
  }

  endGame(winner === 'black' ? '黑方胜（对手认输）' : '白方胜（对手认输）');
}

// 辅助函数：获取相邻位置
function getNeighbors(x, y) {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const neighbors = [];
  const size = window.game.boardSize;

  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
      neighbors.push([nx, ny]);
    }
  }
  return neighbors;
}

// 辅助函数：查找连通块
function findGroup(x, y, board, visited = new Set()) {
  const color = board[y][x];
  const group = [];
  const stack = [[x, y]];
  const key = `${x},${y}`;

  if (visited.has(key)) return group;
  visited.add(key);

  while (stack.length > 0) {
    const [cx, cy] = stack.pop();
    group.push([cx, cy]);

    for (const [nx, ny] of getNeighbors(cx, cy)) {
      const nKey = `${nx},${ny}`;
      if (!visited.has(nKey) && board[ny][nx] === color) {
        visited.add(nKey);
        stack.push([nx, ny]);
      }
    }
  }

  return group;
}

// 辅助函数：计算气数
function countLiberties(group, board) {
  const libertySet = new Set();
  const size = window.game.boardSize;

  for (const [x, y] of group) {
    for (const [nx, ny] of getNeighbors(x, y)) {
      if (board[ny][nx] === 0) {
        libertySet.add(`${nx},${ny}`);
      }
    }
  }

  return libertySet.size;
}

// 终局判断
function checkGameEnd() {
  // 这里可以添加其他终局条件判断
  if (window.game.passCount >= 2) {
    endGameByPass();
  }
}

// 弃权终局处理
function endGameByPass(summary = null) {
  const result = calculateScore();
  const finalSummary = summary || result.summary;

  endGame(finalSummary); // 展示终局信息

  // ✅ 如果是我发起的终局，通知对方 gameover（含 summary）
  if (!summary && window.sendMove) {
    window.sendMove({ type: 'gameover', summary: finalSummary });
  }
}

// 辅助函数：统计棋盘上的棋子
function countStones(color) {
  let count = 0;
  for (const row of window.game.board) {
    for (const cell of row) {
      if (cell === color) count++;
    }
  }
  return count;
}

// 游戏结束处理
function endGame(message) {
  logDebug(`\n===== 游戏结束 =====`);
  logDebug(message);
  document.getElementById("resultBox").textContent = message;
  document.getElementById("resultBox").style.display = "block";
  document.getElementById("restartBtn").style.display = "block";

  // 停止计时器
  stopTimer('black');
  stopTimer('white');
}

// 辅助函数：深拷贝棋盘
function deepCopyBoard(board) {
  return board.map(row => [...row]);
}

// 辅助函数：位置有效性检查
function isValidPosition(x, y) {
  return x >= 0 && 
         x < window.game.boardSize && 
         y >= 0 && 
         y < window.game.boardSize && 
         window.game.board[y][x] === 0;
}

// 辅助函数：格式化棋盘调试输出
function formatBoardForDebug(board) {
  return board.map((row, y) => 
    row.map((cell, x) => {
      if (window.game.koPosition && x === window.game.koPosition[0] && y === window.game.koPosition[1]) {
        return cell === 0 ? '❌' : cell === 1 ? '●' : '○';
      }
      return cell === 0 ? '·' : cell === 1 ? '●' : '○';
    }).join(' ')
  ).join('\n');
}

// 初始化游戏
initGame(9);