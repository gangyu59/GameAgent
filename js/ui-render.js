// ui-render.js

//window.game.boardSize = 9;

function renderBoard() {
    const board = document.getElementById('board');
    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            const cell = document.createElement('div');
            cell.id = `cell-${x}-${y}`;
            cell.className = 'cell';
            cell.addEventListener('click', () => placeStone(x, y));
            board.appendChild(cell);
        }
    }
}

// 房间控制逻辑（绑定到全局 UI）
window.UI = {
  createRoomAndShowId: function () {
    createRoom().then(roomId => {
      document.getElementById('roomInfo').innerHTML =
        `✅ 房间已创建！<br>房间ID：<b>${roomId}</b><br>
         邀请链接：<input value="${window.location.origin + window.location.pathname}?room=${roomId}"
         onclick="this.select()" style="width:80%;">`;
      document.getElementById('roomIdInput').value = roomId;
    }).catch(err => {
      document.getElementById('roomInfo').innerText = `❌ 创建失败: ${err.message}`;
    });
  },

  joinRoomFromInput: function () {
    const roomId = document.getElementById('roomIdInput').value.trim();
    if (!roomId) {
      alert("请输入房间ID");
      return;
    }

    joinRoom(roomId).then(() => {
      document.getElementById('roomInfo').innerText =
        `✅ 已成功加入房间：${roomId}`;
    }).catch(err => {
      document.getElementById('roomInfo').innerText =
        `❌ 加入失败: ${err.message}`;
    });
  }
};