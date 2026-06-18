const PUZZLES = [
    [
        [5,3,0, 0,7,0, 0,0,0],
        [6,0,0, 1,9,5, 0,0,0],
        [0,9,8, 0,0,0, 0,6,0],
        [8,0,0, 0,6,0, 0,0,3],
        [4,0,0, 8,0,3, 0,0,1],
        [7,0,0, 0,2,0, 0,0,6],
        [0,6,0, 0,0,0, 2,8,0],
        [0,0,0, 4,1,9, 0,0,5],
        [0,0,0, 0,8,0, 0,7,9]
    ]
];

const FILL_PERCENTAGE = 70; 

let board = [];        
let solution = [];     
let givens = [];        
let errorCells = new Set(); 
let errorCount = 0;     
let selectedCell = null;
let timerInterval = null;
let secondsElapsed = 0;
let gameOver = false;   
let pivot = null;      

function isValidPlacement(grid, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (grid[row][i] === num) return false;
        if (grid[i][col] === num) return false;

        let br = 3 * Math.floor(row / 3) + Math.floor(i / 3);
        let bc = 3 * Math.floor(col / 3) + (i % 3);
        if (grid[br][bc] === num) return false; 
    }
    return true;
}

function solve(grid) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) { 
                for (let n = 1; n <= 9; n++) {
                    if (isValidPlacement(grid, r, c, n)) {
                        grid[r][c] = n; 
                        if (solve(grid)) return true; 
                        grid[r][c] = 0; 
                    }
                }
                return false; 
            }
        }
    }
    return true; 
}

function formatTime(s) {
    let m = Math.floor(s / 60);
    let sec = s % 60;
    return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}

function startTimer() {
    clearInterval(timerInterval); 
    secondsElapsed = 0;
    document.getElementById('timer').textContent = '00:00';
    timerInterval = setInterval(() => {
        secondsElapsed++;
        document.getElementById('timer').textContent = formatTime(secondsElapsed);
    }, 1000); 
}

function getWDRData() {
    let data = [{ "Рядок": { type: "string" }, "Колонка": { type: "string" }, "Значення": { type: "number" } }];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            data.push({
                "Рядок": "Рядок " + (r + 1),
                "Колонка": "Колонка " + (c + 1),
                "Значення": board[r][c] 
            });
        }
    }
    return data;
}

// Нова надійна функція для парсингу координат клітинки
function parseCoords(cellData) {
    if (!cellData || !cellData.rows || !cellData.columns || cellData.rows.length === 0 || cellData.columns.length === 0) {
        return null;
    }
    
    // Витягуємо безпосередньо цифри з назви ієрархії типу "Рядок 1"
    let rMatch = cellData.rows[0].uniqueName.match(/\d+/);
    let cMatch = cellData.columns[0].uniqueName.match(/\d+/);
    
    if (!rMatch || !cMatch) return null;
    
    return {
        r: parseInt(rMatch[0]) - 1,
        c: parseInt(cMatch[0]) - 1
    };
}

function customizeCell(cell, data) {
    let coords = parseCoords(data);
    if (!coords) return;

    let r = coords.r;
    let c = coords.c;
    let key = r + '-' + c; 
    let val = board[r][c];

    if (c === 2 || c === 5) cell.addClass("box-border-right");
    if (r === 2 || r === 5) cell.addClass("box-border-bottom");

    if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
        cell.addClass("cell-selected");
    } else if (errorCells.has(key)) {
        cell.addClass("cell-error");    
    } else if (givens[r][c]) {
        cell.addClass("cell-given");   
    } else if (val !== 0) {
        cell.addClass("cell-player");  
    } else {
        cell.addClass("cell-empty");  
    }
}

function hideAllZerosDirectly() {
    let values = document.querySelectorAll('.wdr-grid-container .wdr-value');
    values.forEach(el => {
        if (el.textContent.trim() === "0" || el.textContent.trim() === "") {
            el.style.setProperty('color', 'transparent', 'important');
            el.style.setProperty('opacity', '0', 'important');
        } else {
            el.style.removeProperty('color');
            el.style.removeProperty('opacity');
        }
    });
}

function showInputOverlay(r, c) {
    if (gameOver) return;
    selectedCell = { r, c }; 
    refreshBoard(); 

    let overlay = document.getElementById('input-overlay');
    let container = document.getElementById('num-buttons');
    let label = document.getElementById('input-label');

    label.textContent = `Рядок ${r+1}, колонка ${c+1} — введіть цифру:`;
    container.innerHTML = ''; 

    for (let n = 1; n <= 9; n++) {
        let btn = document.createElement('button');
        btn.textContent = n;
        btn.onclick = () => submitNumber(n); 
        container.appendChild(btn);
    }

    overlay.style.display = 'flex'; 
}

function cancelInput() {
    selectedCell = null;
    document.getElementById('input-overlay').style.display = 'none';
    refreshBoard();
}

function submitNumber(num) {
    if (!selectedCell) return;
    let { r, c } = selectedCell;
    let key = r + '-' + c;

    document.getElementById('input-overlay').style.display = 'none';
    selectedCell = null;

    if (num === solution[r][c]) {
        board[r][c] = num; 
        errorCells.delete(key);
        refreshBoard();
        if (!gameOver) checkWin(); 
    } else {
        errorCount++; 
        document.getElementById('errors').textContent = errorCount;
        errorCells.add(key);
        refreshBoard();
        
        setTimeout(() => {
            errorCells.delete(key);
            refreshBoard();
        }, 1500);

        if (errorCount >= 3) {
            gameOver = true;
            clearInterval(timerInterval); 
            setTimeout(() => {
                alert('Ви допустили 3 помилки! Гра закінчена.\nНатисніть «Нова гра» щоб спробувати знову.');
                revealSolution();
            }, 300);
        }
    }
}

function revealSolution() {
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
            board[r][c] = solution[r][c];
    refreshBoard();
}

function checkWin() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] !== solution[r][c]) return; 
        }
    }

    clearInterval(timerInterval); 
    gameOver = true;

    document.getElementById('win-time').textContent = formatTime(secondsElapsed);
    document.getElementById('win-errors').textContent = errorCount;
    document.getElementById('win-overlay').style.display = 'flex';
}

function refreshBoard() {
    if (pivot) {
        pivot.updateData({ data: getWDRData() }); 
    }
}

function startNewGame() {
    document.getElementById('win-overlay').style.display = 'none';
    document.getElementById('input-overlay').style.display = 'none';

    errorCells.clear();
    errorCount = 0;
    gameOver = false;
    selectedCell = null;
    document.getElementById('errors').textContent = '0';

    solution = Array.from({ length: 9 }, () => Array(9).fill(0));
    
    let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    numbers.sort(() => Math.random() - 0.5);
    for (let c = 0; c < 9; c++) {
        if (Math.random() > 0.5) {
            solution[0][c] = numbers[c];
        }
    }

    solve(solution);

    board = [];
    for (let r = 0; r < 9; r++) {
        board.push([...solution[r]]);
    }

    let totalCells = 81;
    let cellsToShow = Math.round(totalCells * (FILL_PERCENTAGE / 100));
    let cellsToHide = totalCells - cellsToShow;

    let indices = [];
    for (let i = 0; i < totalCells; i++) { indices.push(i); }
    indices.sort(() => Math.random() - 0.5);

    for (let i = 0; i < cellsToHide; i++) {
        let cellIndex = indices[i];
        let r = Math.floor(cellIndex / 9);
        let c = cellIndex % 9;
        board[r][c] = 0;
    }

    givens = [];
    for (let r = 0; r < 9; r++) {
        givens.push(board[r].map(v => v !== 0));
    }

    startTimer(); 

    if (pivot) {
        refreshBoard();
    } else {
        initPivot();
    }
}

function initPivot() {
    pivot = new WebDataRocks({
        container: "#wdr-component", 
        toolbar: false,              
        customizeCell: customizeCell,
        report: {
            dataSource: { data: getWDRData() }, 
            slice: {
                rows: [{ uniqueName: "Рядок" }],
                columns: [{ uniqueName: "Колонка" }],
                measures: [{ uniqueName: "Значення", aggregation: "sum" }]
            },
            options: {
                grid: {
                    showTotals: "off",
                    showGrandTotals: "off",
                    showHeaders: false,
                    showFilter: false,
                    showEmptyRows: true,
                    showEmptyColumns: true
                }
            }
        }
    });

    pivot.on('reportcomplete', function() {
        hideAllZerosDirectly();
    });

    pivot.on('cellclick', function(cell) {
        if (gameOver) return;
        
        let coords = parseCoords(cell);
        if (!coords) return;

        let clickedR = coords.r;
        let clickedC = coords.c;

        if (clickedR < 0 || clickedR > 8 || clickedC < 0 || clickedC > 8) return;
        if (givens[clickedR][clickedC]) return;

        showInputOverlay(clickedR, clickedC);
    });
}

document.addEventListener("DOMContentLoaded", startNewGame);
