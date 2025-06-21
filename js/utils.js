// utils.js：工具函数集合

// ✅ 获取某点上下左右邻居
function getNeighbors(x, y) {
  const size = window.game.boardSize;
  const neighbors = [];
  if (x > 0) neighbors.push([x - 1, y]);
  if (x < size - 1) neighbors.push([x + 1, y]);
  if (y > 0) neighbors.push([x, y - 1]);
  if (y < size - 1) neighbors.push([x, y + 1]);
  return neighbors;
}

// ✅ 计算棋局得分与胜者
function calculateScore() {
  const board = window.game.board;
  const size = board.length;
  const visited = Array(size).fill().map(() => Array(size).fill(false));
  let blackStones = 0;
  let whiteStones = 0;
  let blackTerritory = 0;
  let whiteTerritory = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = board[y][x];

      if (cell === 1) blackStones++;
      else if (cell === 2) whiteStones++;
      else if (cell === 0 && !visited[y][x]) {
        const area = [];
        const queue = [[x, y]];
        let adjacentColor = new Set();

        while (queue.length) {
          const [cx, cy] = queue.shift();
          if (cx < 0 || cy < 0 || cx >= size || cy >= size || visited[cy][cx]) continue;

          visited[cy][cx] = true;

          if (board[cy][cx] === 0) {
            area.push([cx, cy]);
            queue.push(...getNeighbors(cx, cy));
          } else {
            adjacentColor.add(board[cy][cx]);
          }
        }

        if (adjacentColor.size === 1) {
          const owner = Array.from(adjacentColor)[0];
          if (owner === 1) blackTerritory += area.length;
          else if (owner === 2) whiteTerritory += area.length;
        }
      }
    }
  }

  const komi = 6.5;
  const blackScore = blackStones + blackTerritory;
  const whiteScore = whiteStones + whiteTerritory + komi;
  const winner = blackScore > whiteScore ? 'black' : 'white';

  return {
    blackStones,
    whiteStones,
    blackTerritory,
    whiteTerritory,
    blackScore,
    whiteScore,
    winner,
    summary: `⚫ 黑：${blackScore}（${blackStones}子+${blackTerritory}地） vs ⚪ 白：${whiteScore.toFixed(1)}（${whiteStones}子+${whiteTerritory}地+贴目${komi}） ➜ 胜者：${winner === 'black' ? '黑' : '白'}`
  };
}

window.logDebug = function(msg, isError = false) {
  const el = document.getElementById("debug-log");
  if (el) {
    el.innerHTML += `<p style="color:${isError ? 'red' : 'green'}">${msg}</p>`;
    el.scrollTop = el.scrollHeight;
  }
  console[isError ? "error" : "log"](msg);
};


let timerHandles = {
  black: null,
  white: null
};

let remainingTime = {
  black: 3600, // 秒
  white: 3600
};

function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, '0');
  const sec = String(seconds % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

/**
 * 启动倒计时
 * @param {'black'|'white'} playerColor 当前执棋方
 */
window.startTimer = function(playerColor) {
  const opponent = playerColor === 'black' ? 'white' : 'black';

  // 停止对方的定时器
  if (timerHandles[opponent]) {
    clearInterval(timerHandles[opponent]);
    timerHandles[opponent] = null;
    document.getElementById(`${opponent}-timer`).classList.remove('active');
  }

  // 启动当前玩家计时
  const label = document.getElementById(`${playerColor}-timer`);
  if (!label) return;

  document.getElementById(`${playerColor}-timer`).classList.add('active');

  if (timerHandles[playerColor]) {
    clearInterval(timerHandles[playerColor]);
  }

  timerHandles[playerColor] = setInterval(() => {
    if (remainingTime[playerColor] <= 0) {
      clearInterval(timerHandles[playerColor]);
      timerHandles[playerColor] = null;
      alert(`⏰ ${playerColor === 'black' ? '黑方' : '白方'}时间到！`);
      return;
    }

    remainingTime[playerColor]--;
    label.textContent = formatTime(remainingTime[playerColor]);
  }, 1000);
};