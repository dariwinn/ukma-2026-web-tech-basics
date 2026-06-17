// Заготовка початкового шаблону Судоку (де 0 — порожні клітинки)
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

// Відсоток заповненості поля цифрами на початку гри (рівень складності)
const FILL_PERCENTAGE = 75; 

// Глобальні змінні стану гри
let board = [];         // Поточний стан дошки гравця (матриця 9х9)
let solution = [];      // Повний правильний розв'язок судоку (матриця 9х9)
let givens = [];        // Булева матриця 9х9: true для початкових підказок, false для пустих клітинок
let errorCells = new Set(); // Колекція унікальних ключів помилкових клітинок (наприклад, "0-5")
let errorCount = 0;     // Поточна кількість помилок гравця
let selectedCell = null;// Об'єкт збереження координат поточної виділеної клітинки {r: row, c: col}
let timerInterval = null;// ID інтервалу для лічильника часу
let secondsElapsed = 0; // Скільки секунд триває гра
let gameOver = false;   // Прапорець завершення гри
let pivot = null;       // Екземпляр об'єкта WebDataRocks

/**
 * Валідатор: Перевіряє, чи можна поставити цифру `num` у координати `row`, `col`
 */
function isValidPlacement(grid, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (grid[row][i] === num) return false; // Перевірка дублікату в рядку
        if (grid[i][col] === num) return false; // Перевірка дублікату в колонці
        
        // Магічна математика для знаходження індексів всередині малого квадрата 3х3
        let br = 3 * Math.floor(row / 3) + Math.floor(i / 3);
        let bc = 3 * Math.floor(col / 3) + (i % 3);
        if (grid[br][bc] === num) return false; // Перевірка дублікату в квадраті 3х3
    }
    return true; // Якщо колізій немає, розміщення валідне
}

/**
 * Алгоритм Backtracking (пошук з поверненням) для автоматичного повного вирішення судоку
 */
function solve(grid) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) { // Шукаємо пусту клітинку
                for (let n = 1; n <= 9; n++) {
                    if (isValidPlacement(grid, r, c, n)) {
                        grid[r][c] = n; // Пробуємо поставити цифру
                        if (solve(grid)) return true; // Рекурсивно йдемо далі
                        grid[r][c] = 0; // Відкат назад (backtrack), якщо цифра не підійшла
                    }
                }
                return false; // Якщо жодна цифра не підійшла, цей шлях тупиковий
            }
        }
    }
    return true; // Поле успішно заповнене
}

/**
 * Форматування секунд у вигляд стрічки ММ:СС
 */
function formatTime(s) {
    let m = Math.floor(s / 60);
    let sec = s % 60;
    return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}

/**
 * Запуск таймера гри
 */
function startTimer() {
    clearInterval(timerInterval); // Зупиняємо попередній таймер, якщо він працював
    secondsElapsed = 0;
    document.getElementById('timer').textContent = '00:00';
    timerInterval = setInterval(() => {
        secondsElapsed++;
        document.getElementById('timer').textContent = formatTime(secondsElapsed);
    }, 1000); // Оновлювати кожну 1 секунду
}

/**
 * Перетворення нашої матриці 9х9 у плоский JSON-масив, який розуміє WebDataRocks
 */
function getWDRData() {
    // Перший елемент — це опис архітектури (типів даних) колонок
    let data = [{ "Рядок": { type: "string" }, "Колонка": { type: "string" }, "Значення": { type: "number" } }];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            data.push({
                "Рядок": "Рядок " + (r + 1),
                "Колонка": "Колонка " + (c + 1),
                "Значення": board[r][c] // Поточне значення на ігровій дошці
            });
        }
    }
    return data;
}

/**
 * Функція зворотного виклику WebDataRocks для стилізації клітинок (додавання класів)
 */
function customizeCell(cell, data) {
    if (!data.rows[0] || !data.columns[0]) return; // Пропускаємо технічні підсумкові елементи

    // Витягуємо індекси рядка та колонки з назв (наприклад з "Рядок 3" отримуємо число 3)
    let rowVal = parseInt(data.rows[0].uniqueName.replace(/\D/g, ''));
    let colVal = parseInt(data.columns[0].uniqueName.replace(/\D/g, ''));
    if (isNaN(rowVal) || isNaN(colVal)) return;

    let r = rowVal - 1; // Переводимо в індекси масиву (від 0 до 8)
    let c = colVal - 1;
    let key = r + '-' + c; // Ключ для Set
    let val = board[r][c];

    // Додаємо товсті грані для відокремлення секторів судоку 3х3
    if (c === 2 || c === 5) cell.addClass("box-border-right");
    if (r === 2 || r === 5) cell.addClass("box-border-bottom");

    // Логіка призначення CSS класів залежно від статусу клітинки
    if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
        cell.addClass("cell-selected"); // Клітинка виділена
    } else if (errorCells.has(key)) {
        cell.addClass("cell-error");    // У клітинці помилка
    } else if (givens[r][c]) {
        cell.addClass("cell-given");    // Це початкова підказка системи
    } else if (val !== 0) {
        cell.addClass("cell-player");   // Цифра введена гравцем
    } else {
        cell.addClass("cell-empty");    // Клітинка пуста
    }
}

/**
 * ХАК: Прямий пошук по DOM елементах зведеної таблиці для приховування технічних нулів WebDataRocks
 */
function hideAllZerosDirectly() {
    let values = document.querySelectorAll('.wdr-grid-container .wdr-value');
    values.forEach(el => {
        if (el.textContent.trim() === "0") {
            el.style.color = 'transparent'; // Робимо нуль невидимим
            el.style.opacity = '0';
        }
    });
}

/**
 * Відкриття модального вікна вибору цифри для конкретної клітинки
 */
function showInputOverlay(r, c) {
    if (gameOver) return;
    selectedCell = { r, c }; // Запам'ятовуємо, де клікнули
    refreshBoard(); // Оновлюємо стилі, щоб підсвітити вибрану клітинку

    let overlay = document.getElementById('input-overlay');
    let container = document.getElementById('num-buttons');
    let label = document.getElementById('input-label');

    label.textContent = `Рядок ${r+1}, колонка ${c+1} — введіть цифру:`;
    container.innerHTML = ''; // Очищаємо старі кнопки

    // Динамічно створюємо 9 кнопок для вибору чисел від 1 до 9
    for (let n = 1; n <= 9; n++) {
        let btn = document.createElement('button');
        btn.textContent = n;
        btn.onclick = () => submitNumber(n); // Натискання викликає логіку перевірки
        container.appendChild(btn);
    }

    overlay.style.display = 'flex'; // Показуємо модалку
}

/**
 * Скасування вибору (закриття модалки без дій)
 */
function cancelInput() {
    selectedCell = null;
    document.getElementById('input-overlay').style.display = 'none';
    refreshBoard();
}

/**
 * Обробка введеної гравцем цифри
 */
function submitNumber(num) {
    if (!selectedCell) return;
    let { r, c } = selectedCell;
    let key = r + '-' + c;

    document.getElementById('input-overlay').style.display = 'none'; // Ховаємо модалку вибору
    selectedCell = null;

    // Перевірка: чи збігається введена цифра з прорахованим правильним рішенням судоку
    if (num === solution[r][c]) {
        board[r][c] = num; // Записуємо правильну цифру на дошку
        errorCells.delete(key);
    } else {
        errorCount++; // Збільшуємо лічильник помилок
        document.getElementById('errors').textContent = errorCount;
        errorCells.add(key); // Додаємо клітинку в список червоного підсвічування
        
        // Через 1.5 секунди прибираємо червоне виділення помилки
        setTimeout(() => {
            errorCells.delete(key);
            refreshBoard();
        }, 1500);

        // Перевірка ліміту поразок (програш при 3 помилках)
        if (errorCount >= 3) {
            gameOver = true;
            clearInterval(timerInterval); // Зупиняємо час
            setTimeout(() => {
                alert('Ви допустили 3 помилки! Гра закінчена.\nНатисніть «Нова гра» щоб спробувати знову.');
                revealSolution(); // Показуємо розв'язок судоку гравцю
            }, 300);
        }
    }

    refreshBoard(); // Перемальовуємо WebDataRocks
    if (!gameOver) checkWin(); // Перевіряємо, чи не виграв гравець цим ходом
}

/**
 * Функція капітуляції / програшу: відкриває всі правильні цифри на полі
 */
function revealSolution() {
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
            board[r][c] = solution[r][c];
    refreshBoard();
}

/**
 * Перевірка, чи заповнене все поле без помилок (Умова перемоги)
 */
function checkWin() {
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
            if (board[r][c] !== solution[r][c]) return; // Якщо є хоч одна невідповідність — гра продовжується

    clearInterval(timerInterval); // Зупиняємо таймер переможця
    gameOver = true;

    // Заповнюємо дані на екрані перемоги та відображаємо його
    document.getElementById('win-time').textContent = formatTime(secondsElapsed);
    document.getElementById('win-errors').textContent = errorCount;
    document.getElementById('win-overlay').style.display = 'flex';
}

/**
 * Синхронізація внутрішніх даних JS гри із віджетом WebDataRocks
 */
function refreshBoard() {
    if (pivot) {
        pivot.updateData({ data: getWDRData() }); // Оновлення датасету всередині Pivot
        setTimeout(hideAllZerosDirectly, 50); // ХАК: Зачищаємо нулі після рендеру
    }
}

/**
 * Основна функція генерації та запуску нової гри
 */
function startNewGame() {
    // Ховаємо всі модальні вікна
    document.getElementById('win-overlay').style.display = 'none';
    document.getElementById('input-overlay').style.display = 'none';

    // Скидання дефолтних налаштувань стану
    errorCells.clear();
    errorCount = 0;
    gameOver = false;
    selectedCell = null;
    document.getElementById('errors').textContent = '0';

    // Створюємо пусту матрицю розв'язку 9х9, заповнену нулями
    solution = Array.from({ length: 9 }, () => Array(9).fill(0));
    
    // Рандомізація: перемішуємо числа від 1 до 9 і закидаємо у перший рядок як зерно для генерації
    let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    numbers.sort(() => Math.random() - 0.5);
    for (let c = 0; c < 9; c++) {
        if (Math.random() > 0.5) {
            solution[0][c] = numbers[c];
        }
    }

    // Викликаємо алгоритм solve(), який на базі зерна створює 100% валідну заповнену матрицю судоку
    solve(solution);

    // Копіюємо згенероване рішення в ігрове поле гравця (глибоке копіювання масиву)
    board = [];
    for (let r = 0; r < 9; r++) {
        board.push([...solution[r]]);
    }

    // Розраховуємо, скільки клітинок треба сховати відповідно до FILL_PERCENTAGE
    let totalCells = 81;
    let cellsToShow = Math.round(totalCells * (FILL_PERCENTAGE / 100));
    let cellsToHide = totalCells - cellsToShow;

    // Створюємо масив індексів від 0 до 80 і перемішуємо його, щоб випадково ховати клітинки
    let indices = [];
    for (let i = 0; i < totalCells; i++) { indices.push(i); }
    indices.sort(() => Math.random() - 0.5);

    // Занулюємо (ховаємо) випадкові клітинки на дошці гравця
    for (let i = 0; i < cellsToHide; i++) {
        let cellIndex = indices[i];
        let r = Math.floor(cellIndex / 9);
        let c = cellIndex % 9;
        board[r][c] = 0;
    }

    // Фіксуємо масив початкових підказок (все, що не 0 на старті — це true)
    givens = [];
    for (let r = 0; r < 9; r++) {
        givens.push(board[r].map(v => v !== 0));
    }

    startTimer(); // Запускаємо лічильник часу

    // Якщо екземпляр WebDataRocks вже існує — просто оновлюємо дані, інакше — створюємо його з нуля
    if (pivot) {
        refreshBoard();
    } else {
        initPivot();
    }
}

/**
 * Ініціалізація та конфігурація об'єкта WebDataRocks
 */
function initPivot() {
    pivot = new WebDataRocks({
        container: "#wdr-component", // ID HTML-тегу куди вмонтується таблиця
        toolbar: false,              // Вимикаємо верхній фінансовий тулбар WebDataRocks
        customizeCell: customizeCell,// Підключаємо нашу функцію стилізації
        report: {
            dataSource: { data: getWDRData() }, // Передаємо сформований JSON-масив даних
            slice: {
                // Конфігуруємо зріз (Slice) зведеної таблиці: що йде в рядки, а що в колонки
                rows: [{ uniqueName: "Рядок" }],
                columns: [{ uniqueName: "Колонка" }],
                measures: [{ uniqueName: "Значення", aggregation: "sum" }] // Значення у клітинці
            },
            options: {
                grid: {
                    // Вимикаємо зайві для гри фінансові/аналітичні елементи відображення
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

    // Подія закінчення побудови звіту таблиці: відразу ховаємо стартові нулі
    pivot.on('reportcomplete', function() {
        hideAllZerosDirectly();
    });

    // Подія Кліку на комірку зведеної таблиці
    pivot.on('cellclick', function(cell) {
        // Перевіряємо валідність об'єкта кліку
        if (!cell || !cell.rows || !cell.columns || cell.rows.length === 0 || cell.columns.length === 0) return;

        // Дізнаємося індекси клітинки за її назвою у WebDataRocks
        let clickedR = parseInt(cell.rows[0].uniqueName.replace(/\D/g, '')) - 1;
        let clickedC = parseInt(cell.columns[0].uniqueName.replace(/\D/g, '')) - 1;

        if (isNaN(clickedR) || isNaN(clickedC)) return;
        if (clickedR < 0 || clickedR > 8 || clickedC < 0 || clickedC > 8) return;

        // Якщо користувач клікнув по дефолтній цифрі-підказці — ігноруємо дію (її не можна міняти)
        if (givens[clickedR][clickedC]) return;

        // Якщо все ок — викликаємо модалку для зміни цифри в цій комірці
        showInputOverlay(clickedR, clickedC);
    });
}

// Першочерговий автоматичний запуск гри при завантаженні сторінки скриптом
startNewGame();
