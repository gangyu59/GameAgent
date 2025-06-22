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

function handlePass() {
  window.game.passCount++;
  logDebug(`⚪ 玩家选择放弃着手（累计 ${window.game.passCount} 次）`);

  if (window.game.passCount >= 2) {
    const result = calculateScore();
    const resultBox = document.getElementById("resultBox");
    resultBox.innerHTML = result.summary;
    resultBox.style.display = "block";
	document.getElementById("restartBtn").style.display = "inline-block";
    logDebug(result.summary);
  } else {
    switchPlayer();
  }
}

function handleResign() {
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

function restartGame(isRemote = false) {
  logDebug("🔄 重新开始新的一局");

  initGame(9);

  // 设置本地玩家颜色
  window.game.playerColor = isRemote ? 'white' : 'black';

  // ✅ 重建棋盘（含事件监听）
  renderBoard();

  // 重启计时器
  startTimer(window.game.currentPlayer);

  // 重置 UI
  document.getElementById("resultBox").style.display = "none";
  document.getElementById("restartBtn").style.display = "none";

  // 通知对手（仅本地发起）
  if (!isRemote && window.sendMove) {
    window.sendMove({ type: 'restart' });
  }

  // 更新玩家身份显示
  updatePlayerColorInfo();
}

function updatePlayerColorInfo() {
  const label = document.getElementById('playerColorLabel');
  if (!label) return;
  label.textContent = window.game.playerColor === 'black' ? '⚫' : '⚪';
}