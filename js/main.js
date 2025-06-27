// main.js：负责初始化页面并配置逻辑（自动配对模式）

(function () {

  // 控制台切换
  function toggleConsole() {
    const panel = document.getElementById("mobile-console");
    if (panel) {
      panel.style.display = (panel.style.display === "none" || panel.style.display === "") ? "block" : "none";
    }
  }
  window.toggleConsole = toggleConsole;

  // 重写 console 输出到浮动窗口
  const originalConsole = { ...console };
  window.console = {
    log: (...args) => {
      originalConsole.log(...args);
      const el = document.getElementById('console-log');
      if (el) el.innerHTML += `<div style="color:#0f0">${args.join(' ')}</div>`;
    },
    error: (...args) => {
      originalConsole.error(...args);
      const el = document.getElementById('console-log');
      if (el) el.innerHTML += `<div style="color:#f00">${args.join(' ')}</div>`;
    }
  };

  // 页面加载完成后执行
  document.addEventListener('DOMContentLoaded', () => {
    renderBoard(); // 渲染棋盘（不依赖 myColor）

    // 更新 Peer ID 显示（可选）
    const span = document.getElementById("myPeerIdDisplay");
    if (span && window.myPeerId) {
      span.textContent = window.myPeerId;
    }

    console.log("系统启动完成 ✅");
  });

})();

// 记录当前两色是否由 AI 控制
window.aiMode = { black: false, white: false };

/** 切换当前玩家的 AI 状态（由按钮触发） */
function toggleAIPlayer() {
  const myColor = window.game.playerColor;         // 我执黑或白
  const btn      = document.getElementById('aiBtn');

  // 取反后保存
  window.aiMode[myColor] = !window.aiMode[myColor];
  const isAIOn = window.aiMode[myColor];

  // 更新按钮外观
  if (isAIOn) {
    btn.textContent = '停止AI';
    btn.classList.add('ai-active');
  } else {
    btn.textContent = 'AI棋手';
    btn.classList.remove('ai-active');
  }

  logDebug(`${myColor} 方 AI 模式 ⇒ ${isAIOn ? '开启' : '关闭'}`);

  // 如果刚刚启用且当前轮到我方，立即让 AI 落子
  if (isAIOn && window.game.currentPlayer === myColor) {
    setTimeout(() => requestAIMove(myColor), 300);
  }
}

/** 让指定颜色的 AI 走一步（或 pass） */
function requestAIMove(color) {
  const move = AIAgent.getNextMove(window.game.board, color);
  if (!move) {
    handlePass();                   // 无合法点 ⇒ pass
  } else {
    placeStone(move.x, move.y);     // 正常落子
  }
}