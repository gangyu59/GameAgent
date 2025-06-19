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