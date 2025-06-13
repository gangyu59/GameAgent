//ui-render.js

function renderBoard() {
    const board = document.getElementById('board');
    for (let y = 0; y < 19; y++) {
        for (let x = 0; x < 19; x++) {
            const cell = document.createElement('div');
            cell.id = `cell-${x}-${y}`;
            cell.className = 'cell'; // 使用CSS类名
            cell.addEventListener('click', () => placeStone(x, y));
            board.appendChild(cell);
        }
    }
}