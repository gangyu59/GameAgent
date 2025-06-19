//ui-render.js

// 保留原有函数
function renderBoard() {
  const boardContainer = document.getElementById("board");
  boardContainer.innerHTML = "";

  for (let y = 0; y < window.game.boardSize; y++) {
    for (let x = 0; x < window.game.boardSize; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = `cell-${x}-${y}`;

      cell.addEventListener("click", () => {
        // 修复：使用 game.playerColor 而不是 myColor
        if (window.game.currentPlayer !== window.game.playerColor) return;
        placeStone(x, y); // game-logic 会检查合法性并广播
      });

      boardContainer.appendChild(cell);
    }
  }

  updateBoardUI();
}

// 修复：使用全局 game 对象
function updateBoardUI() {
  const board = window.game.board;
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board.length; x++) {
      const cell = document.getElementById(`cell-${x}-${y}`);
      const value = board[y][x];
      if (value === 1) {
        cell.innerHTML = `<div class="black-stone"></div>`;
      } else if (value === 2) {
        cell.innerHTML = `<div class="white-stone"></div>`;
      } else {
        cell.innerHTML = "";
      }
    }
  }
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