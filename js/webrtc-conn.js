/**
 * 完全修复版 - WebRTC连接与渲染问题解决方案
 * 修复：
 * 1. 本地棋子渲染问题
 * 2. 跨设备同步问题
 * 3. 连接状态管理
 */

document.addEventListener('DOMContentLoaded', function() {
  const FIXED_ID = "GameAgentRoom";
  window.connections = {};
  let isHost = false;
  
  // ========== 关键修复1：增强UI更新函数 ==========
  function updateMyIdUI(peerId) {
    const el = document.getElementById("myPeerIdDisplay");
    if (el) {
      el.textContent = isHost ? `房主ID: ${peerId}` : `访客ID: ${peerId}`;
      el.style.color = isHost ? '#000' : '#666';
    }
  }

  // ========== 关键修复2：强制渲染函数 ==========
  window.forceRenderBoard = function() {
    const board = window.game.board;
    logDebug("强制执行棋盘渲染");
    
    // 使用两层循环确保更新所有单元格
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const cell = document.getElementById(`cell-${x}-${y}`);
        if (!cell) continue;
        
        const value = board[y][x];
        let newHTML = '';
        if (value === 1) newHTML = '<div class="stone black"></div>';
        if (value === 2) newHTML = '<div class="stone white"></div>';
        
        // 强制更新DOM
        if (cell.innerHTML !== newHTML) {
          cell.innerHTML = newHTML;
          // 添加动画效果确保可视化
          if (newHTML) {
            setTimeout(() => {
              cell.firstChild.style.transform = 'scale(1)';
            }, 10);
          }
        }
      }
    }
  };

  // ========== 关键修复3：改进PeerJS初始化 ==========
  logDebug("初始化PeerJS连接...");
  window.peer = new Peer(FIXED_ID, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    debug: 2
  });

  // ========== 房主逻辑 ==========
  peer.on('open', id => {
    isHost = true;
    window.myPeerId = id;
    window.game.playerColor = 'black';
    logDebug(`✅ 房主连接成功 | ID: ${id}`);
    updateMyIdUI(id);

    peer.on('connection', conn => {
      logDebug(`👥 新连接来自: ${conn.peer}`);
      window.connections[conn.peer] = conn;

      conn.on('open', () => {
        logDebug("🔗 连接已就绪");
        // 发送完整游戏状态
        conn.send(JSON.stringify({
          type: 'sync',
          board: window.game.board,
          currentPlayer: window.game.currentPlayer
        }));
      });

      conn.on('data', data => {
        logDebug(`📩 收到数据: ${data}`);
        handleRemoteMove(data);
      });
    });
  });

  // ========== 错误处理 ==========
  peer.on('error', err => {
    logDebug(`❌ PeerJS错误: ${err.type}`, true);
    
    if (err.type === 'unavailable-id') {
      logDebug("转为访客模式...");
      window.peer = new Peer(null, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true
      });

      peer.on('open', id => {
        isHost = false;
        window.myPeerId = id;
        window.game.playerColor = 'white';
        logDebug(`🕊 访客连接成功 | ID: ${id}`);
        updateMyIdUI(id);

        const conn = peer.connect(FIXED_ID);
        conn.on('open', () => {
          window.connections[conn.peer] = conn;
          conn.on('data', handleRemoteMove);
        });
      });
    }
  });

  // ========== 关键修复4：改进数据发送 ==========
	window.sendMove = function(move) {
	  const payload = {
	    ...move,
	    sender: window.myPeerId,
	    board: window.game.board,
	    timestamp: Date.now()
	  };
	
	  logDebug(`📤 本地发送落子数据: ${JSON.stringify(payload)}`);
	
	  Object.values(window.connections || {}).forEach(conn => {
	    if (conn.open) {
	      conn.send(JSON.stringify(payload));
	    }
	  });
	};

  // ========== 关键修复5：数据处理 ==========
	function handleRemoteMove(data) {
	  try {
	    const msg = typeof data === 'string' ? JSON.parse(data) : data;
	    logDebug(`📩 接收到远程数据: ${JSON.stringify(msg)}`);
	
	    if (msg.type === 'sync') {
	      logDebug("🔄 执行同步数据");
	      window.game.board = msg.board || window.game.board;
	      window.game.currentPlayer = msg.currentPlayer || 'black';
	      updateBoardUI(); // 重新绘制
	      return;
	    }
	
	    if (typeof msg.x === 'number' && typeof msg.y === 'number') {
	      logDebug("🎯 远程落子请求，调用 placeStone()");
	      placeStone(msg.x, msg.y, true);  // ✅ 远程落子
	    }
	
	  } catch (e) {
	    logDebug(`❌ 数据解析错误: ${e.message}`, true);
	  }
	}

  // ========== 页面可见性检测 ==========
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      logDebug("页面恢复可见，强制刷新棋盘");
      forceRenderBoard();
    }
  });
});