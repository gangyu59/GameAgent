//game-state.js

// 游戏初始状态
window.game = {
  boardSize: 9,
  currentPlayer: 'black',
  passCount: 0,
  previousBoard: null, // 用于打劫检测
  board: Array(9).fill().map(() => Array(9).fill(0))
};

// 玩家颜色由连接逻辑设置
window.game.playerColor = null;