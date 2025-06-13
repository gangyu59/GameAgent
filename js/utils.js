// utils.js  日志输出
function log(message) {
    document.getElementById('log').innerHTML += `${message}<br>`;
}

// 生成随机ID（用于测试）
function generateId() {
    return Math.random().toString(36).substring(2, 8);
}