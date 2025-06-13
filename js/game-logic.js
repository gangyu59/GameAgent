//game-logic.js    处理落子
function handleMove(move) {
    const { x, y, color } = JSON.parse(move);
    if (color !== game.currentPlayer) return; // 校验回合
    
    // 更新棋盘状态（示例：简单落子逻辑）
    document.getElementById(`cell-${x}-${y}`).innerHTML = 
        `<div class="stone ${color}"></div>`;
    
    game.currentPlayer = color === 'black' ? 'white' : 'black';
}

// 校验围棋规则（需扩展）
function isValidMove(x, y, color) {
    return true; // 简化版：允许任意落子
}