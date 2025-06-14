// ui-render.js

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

window.UI = {
  createRoom: function () {
    if (!window.peer || !peer.id) {
      alert("Peer 未初始化");
      return;
    }

    const roomId = window.peer.id;
    const dbRef = firebase.database().ref(`rooms/${roomId}`);
    dbRef.set({
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      creator: roomId,
      status: 'waiting'
    }).then(() => {
      const url = `${location.origin + location.pathname}?room=${roomId}`;
      document.getElementById('roomInfo').innerHTML = `
        <div style="color:green; font-size:18px;">
          ✅ 房间创建成功！你的房间号是：<strong>${roomId}</strong>
        </div>
        <input value="${roomId}" readonly onclick="this.select()" style="font-size:18px; width:90%; margin-top:10px;" />
        <div style="margin-top:10px;">
          <input id="shareLink" value="${url}" readonly style="font-size:16px; width:90%;" />
          <button onclick="navigator.clipboard.writeText('${url}')" style="margin-top:5px;">📋 复制邀请链接</button>
        </div>
        <div style="font-size:14px; color:#555;">请将链接发送给你的对手</div>
      `;
    }).catch((err) => {
      document.getElementById('roomInfo').innerText = `❌ 房间创建失败: ${err.message}`;
    });
  },

  joinRoomFromInput: function () {
    const input = document.getElementById("roomIdInput");
    const roomId = input.value.trim();
    if (!roomId) return alert("请输入房间号");

    const conn = peer.connect(roomId);
    conn.on("open", () => {
      document.getElementById("roomInfo").innerText = `✅ 已连接到房间：${roomId}`;
    });

    conn.on("error", err => {
      document.getElementById("roomInfo").innerText = `❌ 连接失败：${err.message}`;
    });
  }
};

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