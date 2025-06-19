//webrtc-conn.js

document.addEventListener('DOMContentLoaded', function () {
  const FIXED_ID = "GameAgentRoom";
  window.connections = {};

  let isHost = false;

  // ✅ 尝试作为房主连接
  window.peer = new Peer(FIXED_ID, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true
  });

  peer.on('open', id => {
    isHost = true;
    window.myPeerId = id;
    // 修复：使用 game.playerColor 而不是 myColor
    window.game.playerColor = 'black'; // 房主执黑
    logDebug(`✅ 我的 Peer ID: ${id}`);
    logDebug(`🧩 本地房主模式（执黑）`);
    updateMyIdUI(id);

    peer.on('connection', conn => {
      window.connections[conn.peer] = conn;
      conn.on('data', handleIncomingData);
      conn.on('close', () => delete window.connections[conn.peer]);
      logDebug(`🎉 有访客加入（执白）`);
    });
  });

  // ❗如果房主 ID 被占用，则自动降级为访客
  peer.on('error', err => {
    if (err.type === 'unavailable-id') {
      logDebug(`⚠️ 房主 ID 被占用，降级为访客`, true);

      // 重新创建 Peer（访客身份）
      window.peer = new Peer(undefined, peer.options);
      window.peer.on('open', id => {
        isHost = false;
        window.myPeerId = id;
        // 修复：使用 game.playerColor 而不是 myColor
        window.game.playerColor = 'white'; // 访客执白
        logDebug(`✅ 我的 Peer ID: ${id}`);
        logDebug(`🕊 访客模式（执白），尝试连接房主`);
        updateMyIdUI(id);

        const conn = peer.connect(FIXED_ID);
        conn.on('open', () => {
          window.connections[conn.peer] = conn;
          conn.on('data', handleIncomingData);
          conn.on('close', () => delete window.connections[conn.peer]);
          logDebug(`✅ 已连接到房主`);
        });
        conn.on('error', () => {
          logDebug(`❌ 无法连接房主`, true);
        });
      });
    } else {
      logDebug(`❌ PeerJS 错误: ${err.message}`, true);
    }
  });

  // ✅ 发送走子
  window.sendMove = function (move) {
    const payload = JSON.stringify({ ...move, sender: peer.id });
    Object.values(window.connections).forEach(conn => {
      if (conn.open) conn.send(payload);
    });
  };

  // ✅ 接收走子
  function handleIncomingData(data) {
    try {
      const parsed = JSON.parse(data);
      if (window.handleMove) window.handleMove(parsed);
    } catch (e) {
      logDebug(`⚠️ 数据解析失败: ${e.message}`, true);
    }
  }

  function updateMyIdUI(id) {
    const idBox = document.getElementById("myPeerIdDisplay");
    if (idBox) idBox.textContent = id;
  }
});