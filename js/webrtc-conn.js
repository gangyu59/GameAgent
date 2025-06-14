/**
 * WebRTC连接管理模块
 * 功能：PeerJS连接、房间管理、数据通信
 * 版本：v2.1-stable
 */

// 安全初始化模式
document.addEventListener('DOMContentLoaded', function () {
    // 全局连接池
    window.connections = {};

    // ✅ 正确连接 cloud PeerJS（必须传入 undefined 作为 id）
window.peer = new Peer(undefined, {
  host: 'peerjs.tokbox.com',   // 由 TokBox 提供的稳定 PeerJS 云服务
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

    // 增强错误处理
    peer.on('error', err => {
        console.error('PeerJS错误:', err);
        showDebugMessage(`PeerJS错误: ${err.type || err.message}`, true);
    });

    /**
     * 创建游戏房间（增强版）
     * @returns {Promise<string>} 返回房间ID的Promise
     */
    window.createRoom = function () {
        return new Promise((resolve, reject) => {
            if (!peer || peer.disconnected) {
                const err = new Error('PeerJS未初始化或已断开');
                showDebugMessage(`❌ ${err.message}`, true);
                return reject(err);
            }

            // 超时设置（15秒）
            const timeoutId = setTimeout(() => {
                reject(new Error('房间创建超时，请检查网络'));
                showDebugMessage('⏰ 房间创建超时', true);
            }, 15000);

            // 等待 PeerJS 分配 peer.id
            peer.once('open', (generatedId) => {
                clearTimeout(timeoutId);

                const roomId = generatedId;
                const roomData = {
                    status: "waiting",
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    creator: peer.id,
                    peers: { [peer.id]: true }
                };

                const roomRef = db.ref(`rooms/${roomId}`);
                roomRef.set(roomData, (err) => {
                    if (err) {
                        showDebugMessage(`❌ Firebase 写入失败: ${err.message}`, true);
                        return reject(err);
                    }

                    showDebugMessage(`✅ 房间创建成功: ${roomId}`);

                    // 监听连接和断开事件
                    const connectionHandler = (conn) => {
                        conn.on('close', () => {
                            roomRef.child(`peers/${conn.peer}`).remove();
                        });
                        handleNewConnection(conn);
                    };

                    peer.on('connection', connectionHandler);

                    // 暴露清理方法
                    window.cleanupRoom = () => {
                        peer.off('connection', connectionHandler);
                        roomRef.remove();
                    };

                    resolve(roomId);
                });
            });

            peer.on('error', err => {
                clearTimeout(timeoutId);
                reject(err);
            });
        });
    };

    // 加入房间（优化版）
    window.joinRoom = function (roomId) {
        return new Promise((resolve, reject) => {
            const conn = peer.connect(roomId, {
                reliable: true,
                serialization: 'json'
            });

            conn.on('open', () => {
                connections[conn.peer] = conn;
                showDebugMessage(`✅ 成功加入房间: ${roomId}`);
                resolve(conn);
            });

            conn.on('error', err => {
                showDebugMessage(`❌ 加入房间失败: ${err.message}`, true);
                reject(err);
            });

            conn.on('data', handleIncomingData);
        });
    };

    // 发送游戏数据（增强版）
    window.sendMove = function (move) {
        const data = JSON.stringify({
            ...move,
            timestamp: Date.now(),
            sender: peer.id
        });

        Object.values(connections).forEach(conn => {
            if (conn.open) {
                try {
                    conn.send(data);
                } catch (err) {
                    console.warn(`发送失败给 ${conn.peer}:`, err);
                    delete connections[conn.peer];
                }
            }
        });
    };

    /******************
     * 内部工具函数 *
     ******************/

    function handleNewConnection(conn) {
        conn.on('data', handleIncomingData);
        conn.on('close', () => cleanConnection(conn));
        conn.on('error', () => cleanConnection(conn));

        connections[conn.peer] = conn;
        showDebugMessage(`🔄 玩家加入: ${conn.peer}`);
    }

    function handleIncomingData(data) {
        try {
            const parsed = JSON.parse(data);
            if (window.handleMove) window.handleMove(parsed);
        } catch (err) {
            showDebugMessage(`⚠️ 数据解析失败: ${err.message}`, true);
        }
    }

    function cleanConnection(conn) {
        if (connections[conn.peer]) {
            delete connections[conn.peer];
            showDebugMessage(`🗑️ 连接清理: ${conn.peer}`);
        }
    }

    function showDebugMessage(msg, isError = false) {
        console.log(isError ? '❌ ' + msg : 'ℹ️ ' + msg);
        const debugEl = document.getElementById('debug-log');
        if (debugEl) {
            debugEl.innerHTML += `<p style="color:${
                isError ? 'red' : 'green'
            }">${new Date().toLocaleTimeString()} ${msg}</p>`;
            debugEl.scrollTop = debugEl.scrollHeight;
        }
    }
});