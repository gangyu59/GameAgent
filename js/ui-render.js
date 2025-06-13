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
      document.getElementById('roomInfo').innerText =
        `✅ 房间已创建，房间ID为：${roomId}，请复制此ID分享给对方`;
      document.getElementById('roomIdInput').value = roomId; // 自动填入输入框
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
            document.getElementById('roomInfo').innerText = `成功加入房间: ${roomId}`;
        }).catch(err => {
            document.getElementById('roomInfo').innerText = `加入失败: ${err.message}`;
        });
    }
};