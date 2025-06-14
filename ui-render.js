// ui-render.js

function logDebug(msg, isError = false) {
  const el = document.getElementById("debug-log");
  if (el) {
    el.innerHTML += `<p style="color:${isError ? 'red' : 'green'}">${msg}</p>`;
    el.scrollTop = el.scrollHeight;
  }
  console[isError ? "error" : "log"](msg);
}

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
      logDebug("❌ Peer 未初始化", true);
      alert("Peer 未初始化");
      return;
    }
		
		if (!window.db) {
		  logDebug("❌ Firebase DB 未初始化", true);
		  return;
		}

    const roomId = window.peer.id;
    const dbRef = window.db.ref(`rooms/${roomId}`);
    dbRef.set({
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      creator: roomId,
      status: 'waiting'
    }).then(() => {
      const url = `https://gangyu59.github.io/GameAgent/?room=${roomId}`;
      logDebug(`✅ 房间创建成功：${roomId}`);
      document.getElementById('roomInfo').innerHTML = `
        <div style="color:green; font-size:18px;">
          ✅ 房间创建成功！你的房间号是：<strong>${roomId}</strong>
        </div>
        <input value="${roomId}" readonly onclick="this.select()" style="font-size:18px; width:90%; margin-top:10px;" />
        <div style="margin-top:10px;">
          <input id="shareLink" value="${url}" readonly style="font-size:16px; width:90%;" />
          <button onclick="navigator.clipboard.writeText('${url}')">📋 复制邀请链接</button>
        </div>
        <div style="font-size:14px; color:#555;">请将链接发送给你的对手</div>
      `;
    }).catch((err) => {
      logDebug(`❌ 房间创建失败: ${err.message}`, true);
      document.getElementById('roomInfo').innerText = `❌ 房间创建失败: ${err.message}`;
    });
  },

  joinRoomFromInput: function () {
    const input = document.getElementById("roomIdInput");
    const roomId = input.value.trim();
    if (!roomId) return alert("请输入房间号");

    const conn = peer.connect(roomId);
    conn.on("open", () => {
      logDebug(`✅ 已连接到房间：${roomId}`);
      document.getElementById("roomInfo").innerText = `✅ 已连接到房间：${roomId}`;
    });

    conn.on("error", err => {
      logDebug(`❌ 连接失败：${err.message}`, true);
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
    logDebug(`✅ PeerJS 已连接，ID: ${id}`);
    window.myPeerId = id;
  });

  peer.on("error", function (err) {
    logDebug(`❌ PeerJS 错误: ${err.message}`, true);
  });
});