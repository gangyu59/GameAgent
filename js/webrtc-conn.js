//webrtc-conn.js

document.addEventListener('DOMContentLoaded', function () {
  const FIXED_ID = "GameAgentRoom";
  window.connections = {};
  let isHost = false;
	
	// 在 webrtc-conn.js 文件顶部添加以下函数
	function updateMyIdUI(peerId) {
	  const idDisplay = document.getElementById("myPeerIdDisplay");
	  if (idDisplay) {
	    idDisplay.textContent = peerId;
	    logDebug(`更新界面显示PeerID: ${peerId}`);
	  } else {
	    logDebug("⚠️ 找不到myPeerIdDisplay元素", true);
	  }
	}

  logDebug("正在初始化PeerJS连接...");
  window.peer = new Peer(FIXED_ID, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    debug: 3 // 开启详细日志
  });

  peer.on('open', id => {
    isHost = true;
    window.myPeerId = id;
    window.game.playerColor = 'black';
    logDebug(`✅ PeerJS连接成功，ID: ${id}`);
    logDebug(`🏠 房主模式 (执黑)`);
    logDebug(`当前连接状态: ${peer.disconnected ? '断开' : '连接'}`);
    updateMyIdUI(id);

    peer.on('connection', conn => {
      logDebug(`🎉 收到来自 ${conn.peer} 的新连接`);
      window.connections[conn.peer] = conn;
      
      conn.on('open', () => {
        logDebug(`🔗 连接 ${conn.peer} 已就绪`);
      });
      
      conn.on('data', data => {
        logDebug(`📩 收到来自 ${conn.peer} 的数据: ${data}`);
        handleIncomingData(data);
      });
      
      conn.on('close', () => {
        logDebug(`❌ 连接 ${conn.peer} 已关闭`);
        delete window.connections[conn.peer];
      });
      
      conn.on('error', err => {
        logDebug(`⚠️ 连接 ${conn.peer} 错误: ${err}`, true);
      });
    });
  });

  peer.on('error', err => {
    logDebug(`❌ PeerJS错误: ${err.type}`, true);
    logDebug(`错误详情: ${JSON.stringify(err)}`, true);
    
    if (err.type === 'unavailable-id') {
      logDebug("⚠️ 房主ID被占用，转为访客模式");
      window.peer = new Peer(undefined, peer.options);
      
      peer.on('open', id => {
        isHost = false;
        window.myPeerId = id;
        window.game.playerColor = 'white';
        logDebug(`✅ 新PeerID: ${id}`);
        logDebug(`🕊 访客模式 (执白)`);
        updateMyIdUI(id);

        const conn = peer.connect(FIXED_ID);
        logDebug(`尝试连接房主 ${FIXED_ID}...`);
        
        conn.on('open', () => {
          logDebug(`✅ 成功连接到房主 ${FIXED_ID}`);
          window.connections[conn.peer] = conn;
          conn.on('data', handleIncomingData);
        });
        
        conn.on('error', err => {
          logDebug(`❌ 连接房主失败: ${err}`, true);
        });
      });
    }
  });

  window.sendMove = function (move) {
    const payload = JSON.stringify({ 
      ...move, 
      sender: peer.id,
      currentTurn: window.game.currentPlayer,
      timestamp: Date.now()
    });
    
    logDebug(`📤 准备发送走子数据: ${payload}`);
    
    Object.values(window.connections).forEach(conn => {
      if (conn.open) {
        logDebug(`尝试通过连接 ${conn.peer} 发送数据`);
        conn.send(payload);
      } else {
        logDebug(`⚠️ 连接 ${conn.peer} 未就绪`, true);
      }
    });
  };

  function handleIncomingData(data) {
    logDebug(`📥 收到原始数据: ${data}`);
    
    try {
      const parsed = JSON.parse(data);
      logDebug(`解析后的数据: ${JSON.stringify(parsed)}`);
      
      if (window.handleMove) {
        logDebug("调用 handleMove 处理数据");
        window.handleMove(parsed);
      } else {
        logDebug("⚠️ handleMove 函数未定义", true);
      }
    } catch (e) {
      logDebug(`❌ 数据解析失败: ${e.message}`, true);
      logDebug(`原始数据: ${data}`, true);
    }
  }
});