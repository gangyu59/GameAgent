//ui-render.js

function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  const size = 9;
  const cellSize = 66;
  const starPoints = [[2,2],[6,2],[2,6],[6,6],[4,4]];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const intersection = document.createElement('div');
      intersection.className = 'intersection';
      intersection.dataset.x = x;
      intersection.dataset.y = y;

      intersection.style.left = `${x * cellSize}px`;
      intersection.style.top = `${y * cellSize}px`;

      if (starPoints.some(([sx, sy]) => sx === x && sy === y)) {
        const star = document.createElement('div');
        star.className = 'star-point';
        intersection.appendChild(star);
      }

      intersection.addEventListener('click', () => {
        if (window.game.currentPlayer === window.game.playerColor) {
          placeStone(x, y);
          if (window.sendMove) window.sendMove({ x, y });
        }
      });

      board.appendChild(intersection);
    }
  }

  updateBoardUI();
}

function updateBoardUI() {
  document.querySelectorAll('.stone').forEach(el => el.remove());
  const board = window.game.board;
  const lastMove = window.lastMove || null; // ✅ 移进来！

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const val = board[y][x];
      if (val === 1 || val === 2) {
        const stone = document.createElement('div');
        stone.className = 'stone ' + (val === 1 ? 'black-stone' : 'white-stone');

        // ✅ 如果是最后一手棋，加红点
        if (lastMove && lastMove.x === x && lastMove.y === y) {
          const dot = document.createElement('div');
          dot.className = 'red-dot';
          stone.appendChild(dot);
        }

        const intersection = document.querySelector(`.intersection[data-x="${x}"][data-y="${y}"]`);
        if (intersection) intersection.appendChild(stone);
      }
    }
  }
}

function switchPlayer() {
  window.game.currentPlayer = window.game.currentPlayer === 'black' ? 'white' : 'black';
}

function switchTurn(color) {
  return color === 'black' ? 'white' : 'black';
}

function restartGame(isRemote = false) {
  logDebug("🔄 重新开始新的一局");

  initGame(9);
  window.game.playerColor = isRemote ? 'white' : 'black';

  updateBoardUI();
  updatePlayerColorInfo();
  startTimer(window.game.currentPlayer);

  document.getElementById("resultBox").style.display = "none";
  document.getElementById("restartBtn").style.display = "none";

  if (!isRemote && window.sendMove) {
    window.sendMove({
		  type: 'restart',
		  board: window.game.board,             // 空棋盘
		  currentPlayer: window.game.currentPlayer,
		  playerColor: 'black'                  // 发起方默认执黑
		});
  }

  hideConnectionInfo(); // 同步隐藏连接信息
}

function updatePlayerColorInfo() {
  const label = document.getElementById('playerColorLabel');
  if (!label) return;
  label.textContent = window.game.playerColor === 'black' ? '⚫' : '⚪';
}