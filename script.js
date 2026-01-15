let gridSize = 5;
let board = [], solution = [];
let life = 3, currentMode = 'fix';
let rowTargets = [], colTargets = [];
let timerInterval, seconds = 0;
let isGameActive = false, isPaused = false;

window.onload = updateMenuBestScores;

function updateMenuBestScores() {
    for (let i = 5; i <= 8; i++) {
        const best = localStorage.getItem(`best_score_${i}`);
        const el = document.getElementById(`best-${i}`);
        if (best && el) {
            const m = Math.floor(best / 60).toString().padStart(2, '0');
            const s = (best % 60).toString().padStart(2, '0');
            el.textContent = `best: ${m}:${s}`;
        }
    }
}

function startGame(size) {
    gridSize = size;
    const maxTable = { 5: 65, 6: 58, 7: 52, 8: 45 };
    const baseMaxSize = maxTable[gridSize];
    const padding = 50;
    const availableWidth = window.innerWidth - padding;
    const calculatedSize = Math.floor(availableWidth / (gridSize + 1));
    const finalSize = Math.min(calculatedSize, baseMaxSize);
    const fontSize = (finalSize * 0.45) + "px";

    document.documentElement.style.setProperty('--cell-size', `${finalSize}px`);
    document.documentElement.style.setProperty('--font-size', fontSize);

    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-header').style.display = 'block';
    document.getElementById('game-area').style.display = 'block';
    document.getElementById('mode-ui').style.display = 'flex';
    initGame();
}

function backToMenu() {
    clearInterval(timerInterval);
    isGameActive = false;
    document.getElementById('menu-screen').style.display = 'flex';
    document.getElementById('game-header').style.display = 'none';
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('mode-ui').style.display = 'none';
    updateMenuBestScores();
}

function togglePause() {
    if (!isGameActive) return;
    isPaused = !isPaused;
    const overlay = document.getElementById('pause-overlay');
    const gameWrapper = document.getElementById('game-area');

    if (isPaused) {
        overlay.style.display = 'flex';
        gameWrapper.classList.add('is-paused');
    } else {
        overlay.style.display = 'none';
        gameWrapper.classList.remove('is-paused');
    }
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('btn-fix').classList.toggle('inactive', mode !== 'fix');
    document.getElementById('btn-erase').classList.toggle('inactive', mode !== 'erase');
}

function initGame() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `var(--cell-size) repeat(${gridSize}, var(--cell-size))`;
    document.getElementById('result-overlay').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('game-area').classList.remove('is-paused');
    document.getElementById('new-record').style.display = 'none';
    board = []; solution = []; seconds = 0; life = 3;
    isGameActive = true; isPaused = false;
    setMode('fix');
    updateLifeDisplay();
    updateTimerDisplay();
    generateValidBoard();

    grid.appendChild(document.createElement('div'));
    for (let c = 0; c < gridSize; c++) grid.appendChild(createHintCell('col', c, colTargets[c]));
    for (let r = 0; r < gridSize; r++) {
        grid.appendChild(createHintCell('row', r, rowTargets[r]));
        for (let c = 0; c < gridSize; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`;
            cell.textContent = board[r][c];
            cell.onclick = () => handleCellClick(r, c, cell);
            grid.appendChild(cell);
        }
    }
    clearInterval(timerInterval);
    timerInterval = setInterval(() => { if (isGameActive && !isPaused) { seconds++; updateTimerDisplay(); } }, 1000);
    updateSums();
}

function generateValidBoard() {
    let isValid = false;
    while (!isValid) {
        for (let r = 0; r < gridSize; r++) {
            board[r] = []; solution[r] = [];
            for (let c = 0; c < gridSize; c++) {
                board[r][c] = Math.floor(Math.random() * 9) + 1;
                solution[r][c] = Math.random() > 0.5;
            }
        }
        rowTargets = solution.map((row, r) => row.reduce((sum, sel, c) => sel ? sum + board[r][c] : sum, 0));
        colTargets = Array(gridSize).fill(0);
        for (let c = 0; c < gridSize; c++) for (let r = 0; r < gridSize; r++) if (solution[r][c]) colTargets[c] += board[r][c];
        if (rowTargets.every(v => v > 0) && colTargets.every(v => v > 0)) isValid = true;
    }
}

function createHintCell(type, index, targetVal) {
    const container = document.createElement('div');
    container.className = `target`;
    container.id = `target-${type}-${index}`;
    container.innerHTML = `<span class="current-sum" id="sum-${type}-${index}"></span><span class="target-val">${targetVal}</span>`;
    return container;
}

function handleCellClick(r, c, element) {
    if (!isGameActive || isPaused || element.className.includes('correct') || element.className.includes('eliminated')) return;
    if ((currentMode === 'fix' && solution[r][c]) || (currentMode === 'erase' && !solution[r][c])) {
        element.classList.add('correct');
        if (currentMode === 'erase') element.classList.add('eliminated');
    } else {
        life--; updateLifeDisplay();
        element.classList.add('wrong');
        setTimeout(() => element.classList.remove('wrong'), 500);
        if (life <= 0) endGame(false);
    }
    updateSums();
    checkWin();
}

function updateLifeDisplay() { document.getElementById('life-display').textContent = "✧ ".repeat(life); }
function updateTimerDisplay() {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('time-display').textContent = `${m}:${s}`;
}

function updateSums() {
    for (let i = 0; i < gridSize; i++) {
        let rSum = 0, cSum = 0;
        for (let j = 0; j < gridSize; j++) {
            const rCell = document.getElementById(`cell-${i}-${j}`);
            if (rCell && rCell.classList.contains('correct') && !rCell.classList.contains('eliminated')) rSum += board[i][j];
            const cCell = document.getElementById(`cell-${j}-${i}`);
            if (cCell && cCell.classList.contains('correct') && !cCell.classList.contains('eliminated')) cSum += board[j][i];
        }
        applySumUI('row', i, rSum, rowTargets[i]);
        applySumUI('col', i, cSum, colTargets[i]);
    }
}

function applySumUI(type, index, sum, target) {
    const sumEl = document.getElementById(`sum-${type}-${index}`);
    if (sumEl) {
        sumEl.textContent = sum === 0 ? "" : sum;
        sumEl.nextSibling.style.color = (sum === target) ? "white" : "#5a5a8a";
    }
}

function endGame(isWin) {
    isGameActive = false; clearInterval(timerInterval);
    const overlay = document.getElementById('result-overlay');
    overlay.style.display = 'flex';
    document.getElementById('result-text').textContent = isWin ? "light clear" : "lost spirit";
    document.getElementById('final-time').textContent = isWin ? `aura time: ${document.getElementById('time-display').textContent}` : "";
    if (isWin) saveBestScore();
}

function saveBestScore() {
    const currentBest = localStorage.getItem(`best_score_${gridSize}`);
    if (!currentBest || seconds < parseInt(currentBest)) {
        localStorage.setItem(`best_score_${gridSize}`, seconds);
        document.getElementById('new-record').style.display = 'block';
    }
}

function checkWin() {
    const cells = document.querySelectorAll('.cell');
    let correctCount = 0;
    cells.forEach(cell => {
        if (cell.classList.contains('correct') || cell.classList.contains('eliminated')) {
            correctCount++;
        }
    });
    if (correctCount === gridSize * gridSize) endGame(true);
}