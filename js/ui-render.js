//ui-render.js

function renderBoard() {
  const boardContainer = document.getElementById("board");
  boardContainer.innerHTML = "";
  
  logDebug("开始渲染棋盘");
  logDebug(`棋盘尺寸: ${window.game.boardSize}x${window.game.boardSize}`);
  logDebug(`当前玩家颜色: ${window.game.playerColor}, 回合: ${window.game.currentPlayer}`);

  for (let y = 0; y < window.game.boardSize; y++) {
    for (let x = 0; x < window.game.boardSize; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = `cell-${x}-${y}`;

      cell.addEventListener("click", () => {
        logDebug(`--- 点击事件开始 ---`);
        logDebug(`点击位置: (${x},${y})`);
        logDebug(`当前玩家颜色: ${window.game.playerColor}, 回合: ${window.game.currentPlayer}`);
        logDebug(`棋盘状态: ${JSON.stringify(window.game.board[y][x])}`);
        
        if (window.game.currentPlayer !== window.game.playerColor) {
          logDebug("⛔ 禁止落子：不是您的回合", true);
          logDebug(`--- 点击事件结束 (回合不符) ---`);
          return;
        }
        
        logDebug("✅ 回合验证通过，尝试落子");
        placeStone(x, y);
        logDebug(`--- 点击事件结束 ---`);
      });

      boardContainer.appendChild(cell);
    }
  }

  updateBoardUI();
}

function updateBoardUI() {
  logDebug("开始更新棋盘UI");
  const board = window.game.board;
  let updateCount = 0;
  
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board.length; x++) {
      const cell = document.getElementById(`cell-${x}-${y}`);
      if (!cell) {
        logDebug(`⚠️ 找不到单元格: cell-${x}-${y}`, true);
        continue;
      }
      
      const value = board[y][x];
      let newHTML = "";
      
      if (value === 1) {
        newHTML = `<div class="black-stone"></div>`;
      } else if (value === 2) {
        newHTML = `<div class="white-stone"></div>`;
      }
      
      if (cell.innerHTML !== newHTML) {
        cell.innerHTML = newHTML;
        updateCount++;
      }
    }
  }
  
  logDebug(`✅ 棋盘UI更新完成，共更新 ${updateCount} 处`);
}

// 修复：添加缺失的函数声明
function showEndGameModal() {
  document.getElementById('endGameModal').style.display = 'flex';
}

function closeEndGameModal() {
  document.getElementById('endGameModal').style.display = 'none';
}

function handlePass() {
  window.game.passCount++;
  logDebug(`⚪ 玩家选择放弃着手（累计 ${window.game.passCount} 次）`);
  closeEndGameModal();

  if (window.game.passCount >= 2) {
    calculateTerritory();
  } else {
    switchPlayer();
  }
}

function handleResign() {
  closeEndGameModal();
  const loser = window.game.currentPlayer;
  const winner = loser === 'black' ? 'white' : 'black';
  const summary = `🏳 ${loser === 'black' ? '⚫ 黑方' : '⚪ 白方'}认输，${winner === 'black' ? '⚫ 黑方' : '⚪ 白方'} 获胜`;
  document.getElementById("resultBox").innerHTML = summary;
  document.getElementById("resultBox").style.display = "block";
  document.getElementById("restartBtn").style.display = "inline-block";
  logDebug(summary);
}

function switchPlayer() {
  window.game.currentPlayer = window.game.currentPlayer === 'black' ? 'white' : 'black';
}