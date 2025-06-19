//ui-render.js

function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  const size = 9;
  const cellSize = 44;
  const offset = cellSize; // 交叉点之间的距离

  const starPoints = [
    [2, 2], [6, 2],
    [2, 6], [6, 6],
    [4, 4]
  ];

  // 创建交叉点（可落子点）
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const intersection = document.createElement('div');
      intersection.className = 'intersection';
      intersection.dataset.x = x;
      intersection.dataset.y = y;
      intersection.style.left = `${x * offset}px`;
      intersection.style.top = `${y * offset}px`;

      if (starPoints.some(([sx, sy]) => sx === x && sy === y)) {
        const star = document.createElement('div');
        star.className = 'star-point';
        intersection.appendChild(star);
      }

			intersection.addEventListener('click', () => {
			  console.log(`🔘 被点击: (${x}, ${y})`);
			  if (window.game.currentPlayer === window.game.playerColor) {
			    console.log("✅ 是你的回合，尝试落子");
			    placeStone(x, y);
			    if (window.sendMove) window.sendMove({ x, y });
			  } else {
			    console.log("⛔ 不是你的回合，忽略点击");
			  }
			});

      board.appendChild(intersection);
    }
  }

  updateBoardUI();
}

function updateBoardUI() {
  console.log("🎨 开始渲染棋盘 UI");

  // 清除旧棋子
  const oldStones = document.querySelectorAll('.stone');
  console.log(`🧹 清除旧棋子数量: ${oldStones.length}`);
  oldStones.forEach(el => el.remove());

  // 渲染新棋子
  const board = window.game.board;
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const val = board[y][x];
      if (val === 1 || val === 2) {
        console.log(`🧱 棋盘上有${val === 1 ? '黑' : '白'}子 at (${x}, ${y})`);

        const stone = document.createElement('div');
        stone.className = 'stone';
        stone.classList.add(val === 1 ? 'black-stone' : 'white-stone');

        const intersection = document.querySelector(`.intersection[data-x="${x}"][data-y="${y}"]`);
        if (intersection) {
          intersection.appendChild(stone);
          console.log(`✅ 成功插入棋子 at (${x}, ${y})`);
        } else {
          console.warn(`❌ 没有找到 intersection(${x}, ${y})`);
        }
      }
    }
  }

  console.log("✅ 棋盘 UI 渲染完成");
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