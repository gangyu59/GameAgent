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
  createRoom: function () {
    if (!window.peer || !peer.id) {
      console.error("Peer 未初始化");
      return;
    }

    const roomId = window.peer.id;
    const dbRef = firebase.database().ref(`rooms/${roomId}`);
    dbRef.set({
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      creator: roomId,
      status: 'waiting'
    }).then(() => {
      const msg = `✅ 房间创建成功！你的房间号是：<strong>${roomId}</strong>`;
		document.getElementById('roomInfo').innerHTML = `
		  <div style="color:green; font-size:18px;">${msg}</div>
		  <div style="margin-top:8px;">
		    <input value="${roomId}" readonly onclick="this.select()" style="font-size:18px; width:90%; padding:6px;" />
		  </div>
		  <div style="font-size:14px; color:#555;">请把房间号复制并发送给对手</div>
		`;
    }).catch((err) => {
      document.getElementById('roomInfo').innerText = `房间创建失败: ${err.message}`;
    });
  },

  joinRoom: function () {
    const input = document.getElementById("roomIdInput");
    const roomId = input.value.trim();
    if (!roomId) {
      alert("请输入房间号");
      return;
    }

    const conn = peer.connect(roomId);
    conn.on("open", () => {
      document.getElementById("roomInfo").innerText = `已连接到房间：${roomId}`;
      // 此处添加游戏逻辑初始化
    });

    conn.on("error", err => {
      document.getElementById("roomInfo").innerText = `连接失败：${err.message}`;
    });
  }
};

// Peer 初始化
document.addEventListener("DOMContentLoaded", function () {
  window.peer = new Peer({
    host: "0.peerjs.com",
    port: 443,
    path: "/",
    secure: true
  });

  peer.on("open", function (id) {
    console.log("✅ PeerJS 已连接，ID:", id);
    window.myPeerId = id;
  });

  peer.on("error", function (err) {
    console.error("❌ PeerJS 错误:", err);
  });
});