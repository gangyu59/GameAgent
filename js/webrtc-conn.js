// webrtc-conn.js
document.addEventListener('DOMContentLoaded', function () {
  window.connections = {};

  window.peer = new Peer(undefined, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
      ]
    }
  });

  window.myPeerId = null;

  peer.on('open', id => {
    console.log('✅ Peer连接成功，ID:', id);
    window.myPeerId = id;
  });

  peer.on('error', err => {
    console.error('❌ Peer连接错误:', err);
    showDebugMessage(`PeerJS错误: ${err.type || err.message}`, true);
  });

  // ✅ 创建房间（使用 myPeerId）
  window.createRoom = function () {
    return new Promise((resolve, reject) => {
      if (!window.myPeerId) {
        return reject(new Error('Peer ID 未就绪'));
      }

      const roomId = window.myPeerId;

      const roomRef = db.ref(`rooms/${roomId}`);
      roomRef.set({
        status: 'waiting',
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        creator: roomId,
        peers: { [roomId]: true }
      }, (err) => {
        if (err) {
          showDebugMessage(`❌ 创建房间失败: ${err.message}`, true);
          reject(err);
        } else {
          showDebugMessage(`✅ 房间创建成功: ${roomId}`);
          peer.on('connection', handleNewConnection);
          resolve(roomId);
        }
      });
    });
  };

  // ✅ 加入房间
  window.joinRoom = function (roomId) {
    return new Promise((resolve, reject) => {
      const conn = peer.connect(roomId, {
        reliable: true,
        serialization: 'json'
      });

      conn.on('open', () => {
        connections[conn.peer] = conn;
        showDebugMessage(`✅ 成功加入房间: ${roomId}`);
        conn.on('data', handleIncomingData);
        resolve(conn);
      });

      conn.on('error', err => {
        showDebugMessage(`❌ 加入房间失败: ${err.message}`, true);
        reject(err);
      });
    });
  };

  // ✅ 发送数据
  window.sendMove = function (move) {
    const data = JSON.stringify({
      ...move,
      timestamp: Date.now(),
      sender: peer.id
    });

    Object.values(connections).forEach(conn => {
      if (conn.open) {
        conn.send(data);
      }
    });
  };

  // ✅ 连接处理逻辑
  function handleNewConnection(conn) {
    connections[conn.peer] = conn;
    showDebugMessage(`🔗 新玩家加入: ${conn.peer}`);
    conn.on('data', handleIncomingData);
    conn.on('close', () => {
      showDebugMessage(`🔌 连接关闭: ${conn.peer}`);
      delete connections[conn.peer];
    });
  }

  function handleIncomingData(data) {
    try {
      const parsed = JSON.parse(data);
      if (window.handleMove) window.handleMove(parsed);
    } catch (err) {
      showDebugMessage(`⚠️ 数据解析失败: ${err.message}`, true);
    }
  }

  function showDebugMessage(msg, isError = false) {
    const log = document.getElementById('debug-log');
    if (log) {
      log.innerHTML += `<p style="color:${isError ? 'red' : 'green'}">${msg}</p>`;
      log.scrollTop = log.scrollHeight;
    }
    console.log(msg);
  }
});