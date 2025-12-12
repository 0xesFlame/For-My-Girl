/* === НАСТРОЙКИ === */
const TOTAL_HEIGHT = 1250000; 
const PX_PER_PERCENT = TOTAL_HEIGHT / 250; 
let state = {
    money: 0,
    progress: 0,
    locked: false, // Если true, скролл запрещен
    activeTask: null,
    checkpoint: 0,
    shield: false,
    insurance: false
};

// СПИСОК ЗАДАНИЙ
// type: riddle, math, memory, color, dont_press
const TASKS = [
    { pct: 10, type: 'riddle', q: 'У отца Мэри есть 5 дочерей: Чача, Чичи, Чочо, Чучу. Как зовут пятую?', a: 'мэри' },
    { pct: 15, type: 'math', level: 1 },
    { pct: 25, type: 'memory' },
    { pct: 30, type: 'color' },
    { pct: 40, type: 'math', level: 2 },
    { pct: 70, type: 'dont_press' },
    { pct: 100, type: 'checkpoint' },
    { pct: 150, type: 'math', level: 3 },
    { pct: 200, type: 'checkpoint' },
    { pct: 250, type: 'final' }
];

/* === ЗАПУСК === */
window.onload = () => {
    initMatrix();
    initRunawayBtn();
    loadGame();
    
    // Экономика и Хаос
    setInterval(() => {
        state.money += 900;
        updateUI();
        notify("💰 Майнинг: +900$");
    }, 60000); // Раз в минуту

    setInterval(chaosRoutine, 30000); // Раз в 30 сек
};

/* === ЛОГИКА СКРОЛЛА === */
window.onscroll = () => {
    let y = window.scrollY;
    
    // Если заблокировано, возвращаем назад
    if (state.locked && state.activeTask) {
        let targetY = state.activeTask.pct * PX_PER_PERCENT;
        if (Math.abs(y - targetY) > 50) {
            window.scrollTo(0, targetY);
        }
        return;
    }

    let p = y / PX_PER_PERCENT;
    state.progress = p;
    document.getElementById('progress-display').innerText = p.toFixed(2);

    // Смена цвета на 195%
    if (p >= 195) document.body.classList.add('green-mode');
    else document.body.classList.remove('green-mode');

    // Проверка заданий
    checkTasks(p);
};

function checkTasks(currentPct) {
    let task = TASKS.find(t => currentPct >= t.pct && currentPct < t.pct + 0.1);
    
    // Чтобы не триггерить одно и то же задание постоянно
    // Мы проверяем, проходили ли мы его только что или оно новое
    let lastTaskPct = state.activeTask ? state.activeTask.pct : -1;

    if (task && !state.locked && Math.floor(task.pct) !== Math.floor(lastTaskPct)) {
        if (task.type === 'checkpoint') {
            state.checkpoint = task.pct;
            notify("🚩 ЧЕКПОИНТ СОХРАНЕН!");
            saveGame();
        } else {
            startTask(task);
        }
    }
}

/* === СИСТЕМА ЗАДАНИЙ === */
function startTask(task) {
    state.locked = true;
    state.activeTask = task;
    document.getElementById('task-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Жесткий блок
    
    // Рендер конкретной игры
    let container = document.getElementById('task-container');
    container.innerHTML = '';
    let msg = document.getElementById('task-message');
    msg.innerText = '';

    // 1. ЗАГАДКА
    if (task.type === 'riddle') {
        container.innerHTML = `
            <p>${task.q}</p>
            <input id="ans-input" placeholder="Ответ...">
            <br><br>
            <button class="cyber-btn" onclick="checkRiddle('${task.a}')">ПРОВЕРИТЬ</button>
        `;
    }
    // 2. МАТЕМАТИКА
    else if (task.type === 'math') {
        let n1 = Math.floor(Math.random() * 10 * task.level) + 5;
        let n2 = Math.floor(Math.random() * 10 * task.level) + 5;
        let sign = Math.random() > 0.5 ? '+' : '-';
        if(sign === '-') n1 += n2; // чтобы не было отрицательных
        let ans = sign === '+' ? n1 + n2 : n1 - n2;
        
        container.innerHTML = `
            <h2>${n1} ${sign} ${n2} = ?</h2>
            <input id="ans-input" type="number">
            <br><br>
            <button class="cyber-btn" onclick="checkMath(${ans})">ВВОД</button>
        `;
    }
    // 3. ПАМЯТЬ РЫБКИ
    else if (task.type === 'memory') {
        let secret = Math.floor(1000 + Math.random() * 9000);
        container.innerHTML = `<h2>ЗАПОМНИ: <span style="color:white">${secret}</span></h2>`;
        setTimeout(() => {
            container.innerHTML = `
                <p>Введите число:</p>
                <input id="ans-input" type="number">
                <br><br>
                <button class="cyber-btn" onclick="checkMath(${secret})">ВВОД</button>
            `;
        }, 2000);
    }
    // 4. ЦВЕТА (Эффект Струпа)
    else if (task.type === 'color') {
        let colors = ['red', 'green', 'blue', 'yellow'];
        let trueColor = colors[Math.floor(Math.random() * colors.length)];
        let textVal = colors[Math.floor(Math.random() * colors.length)].toUpperCase();
        
        // Перевод на русский для отображения
        let ruNames = {'red':'КРАСНЫЙ', 'green':'ЗЕЛЕНЫЙ', 'blue':'СИНИЙ', 'yellow':'ЖЕЛТЫЙ'};
        
        container.innerHTML = `
            <p>Нажми кнопку, цвет которой соответствует <br> <b>ЦВЕТУ ТЕКСТА</b> (а не слову):</p>
            <h1 style="color:${trueColor}; font-size: 50px;">${ruNames[textVal] || textVal}</h1>
            <div class="color-grid">
                <div class="color-btn" style="background:red" onclick="checkColor('red', '${trueColor}')"></div>
                <div class="color-btn" style="background:green" onclick="checkColor('green', '${trueColor}')"></div>
                <div class="color-btn" style="background:blue" onclick="checkColor('blue', '${trueColor}')"></div>
                <div class="color-btn" style="background:yellow" onclick="checkColor('yellow', '${trueColor}')"></div>
            </div>
        `;
    }
    // 5. НЕ НАЖИМАЙ
    else if (task.type === 'dont_press') {
        container.innerHTML = `
            <h3>НЕ НАЖИМАЙ КНОПКУ 10 СЕКУНД</h3>
            <button id="danger-btn" class="cyber-btn" style="border-color:red; color:red" onclick="failTask()">Я НЕ ВЫДЕРЖАЛА</button>
            <h1 id="timer">10</h1>
        `;
        let timeLeft = 10;
        let timer = setInterval(() => {
            if(!state.locked) { clearInterval(timer); return; } // Если закрыли
            timeLeft--;
            document.getElementById('timer').innerText = timeLeft;
            if(timeLeft <= 0) {
                clearInterval(timer);
                let btn = document.getElementById('danger-btn');
                btn.innerText = "ТЕПЕРЬ МОЖНО";
                btn.style.borderColor = "#0f0";
                btn.style.color = "#0f0";
                btn.onclick = completeTask;
            }
        }, 1000);
    }
    // ФИНАЛ
    else if (task.type === 'final') {
        container.innerHTML = `
            <h1>СИСТЕМА ВЗЛОМАНА</h1>
            <p style="font-size:30px; color:white;">ПОДСКАЗКА: Загляни за телевизор...</p>
        `;
        // Финал нельзя закрыть
    }
}

/* === ПРОВЕРКИ === */
window.checkRiddle = (correct) => {
    let val = document.getElementById('ans-input').value.toLowerCase().trim();
    if (val === correct) completeTask();
    else failTask();
}

window.checkMath = (correct) => {
    let val = parseInt(document.getElementById('ans-input').value);
    if (val === correct) completeTask();
    else failTask();
}

window.checkColor = (picked, correct) => {
    if (picked === correct) completeTask();
    else failTask();
}

function completeTask() {
    state.money += 100;
    state.locked = false;
    // activeTask не сбрасываем в null сразу, чтобы не триггернуло повторно мгновенно
    document.getElementById('task-overlay').classList.add('hidden');
    document.body.style.overflow = 'auto';
    updateUI();
    notify("✅ ДОСТУП РАЗРЕШЕН (+100$)");
    
    // Чуть проскроллить вниз, чтобы выйти из зоны триггера
    window.scrollBy(0, 1000);
}

window.failTask = () => {
    if (state.insurance) {
        state.insurance = false;
        notify("🛡️ СТРАХОВКА СПАСЛА ВАС!");
        return;
    }

    notify("⛔ ОШИБКА! СИСТЕМА ПЕРЕЗАГРУЖАЕТСЯ...");
    state.locked = false;
    document.getElementById('task-overlay').classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    // Телепорт назад
    setTimeout(() => {
        window.scrollTo(0, state.checkpoint * PX_PER_PERCENT);
    }, 100);
}

/* === МАГАЗИН И UI === */
window.toggleShop = () => {
    document.getElementById('shop-overlay').classList.toggle('hidden');
}

window.buyItem = (item) => {
    let cost = { 'skip': 5000, 'shield': 2000, 'insurance': 3000 }[item];
    
    if (state.money >= cost) {
        state.money -= cost;
        updateUI();
        if (item === 'skip') {
            if (state.locked) completeTask();
            else notify("Куплено. Но задания сейчас нет.");
        }
        if (item === 'shield') {
            state.shield = true;
            notify("Щит активирован (2 мин)");
            setTimeout(() => state.shield = false, 120000);
        }
        if (item === 'insurance') {
            state.insurance = true;
            notify("Страховка активирована");
        }
        toggleShop(); // Закрыть магазин после покупки
    } else {
        alert("НЕДОСТАТОЧНО ДЕНЕГ!");
    }
}

function updateUI() {
    document.getElementById('money-display').innerText = state.money;
}

function notify(text) {
    let div = document.createElement('div');
    div.style = "position:fixed; bottom:20px; right:20px; background:var(--primary); color:black; padding:10px; z-index:9999; font-weight:bold;";
    div.innerText = text;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

/* === ХАОС === */
function chaosRoutine() {
    if (state.shield || state.locked) return;
    
    let events = ['shake', 'dark', 'invert'];
    let ev = events[Math.floor(Math.random() * events.length)];
    
    notify("⚠️ СБОЙ СИСТЕМЫ: " + ev);

    if (ev === 'shake') {
        document.body.classList.add('shake-screen');
        setTimeout(() => document.body.classList.remove('shake-screen'), 2000);
    }
    if (ev === 'invert') {
        document.body.classList.add('invert-colors');
        setTimeout(() => document.body.classList.remove('invert-colors'), 5000);
    }
}

/* === МАТРИЦА И КНОПКА === */
function initMatrix() {
    const c = document.getElementById('matrixCanvas');
    const ctx = c.getContext('2d');
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const cols = Math.floor(c.width / 20);
    const drops = Array(cols).fill(1);
    
    function draw() {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0,0,c.width,c.height);
        ctx.fillStyle = document.body.classList.contains('green-mode') ? '#0f0' : '#f00';
        ctx.font = '15px monospace';
        for(let i=0; i<drops.length; i++) {
            let txt = String.fromCharCode(0x30A0 + Math.random()*96);
            ctx.fillText(txt, i*20, drops[i]*20);
            if(drops[i]*20 > c.height && Math.random()>0.975) drops[i]=0;
            drops[i]++;
        }
    }
    setInterval(draw, 50);
}

function initRunawayBtn() {
    const b = document.getElementById('runaway-btn');
    b.onmouseover = () => {
        let x = Math.random() * (window.innerWidth - 200);
        let y = Math.random() * (window.innerHeight - 100);
        b.style.position = 'absolute';
        b.style.left = x + 'px';
        b.style.top = y + 'px';
    };
}

/* === АДМИНКА === */
let adminClicks = 0;
document.getElementById('admin-trigger').onclick = () => {
    adminClicks++;
    if(adminClicks >= 5) {
        document.getElementById('admin-overlay').classList.remove('hidden');
        adminClicks = 0;
    }
    setTimeout(() => adminClicks=0, 2000);
};

window.checkAdmin = () => {
    if(document.getElementById('admin-pass').value === '1379') {
        document.getElementById('admin-tools').classList.remove('hidden');
    }
};

window.addMoney = (n) => { state.money += n; updateUI(); };
window.skipTask = () => completeTask();
window.teleportTo = (pct) => window.scrollTo(0, pct * PX_PER_PERCENT);
window.triggerChaos = (type) => document.body.classList.add('shake-screen');

/* === СОХРАНЕНИЯ === */
function saveGame() {
    localStorage.setItem('gfQuest', JSON.stringify(state));
}
function loadGame() {
    let d = localStorage.getItem('gfQuest');
    if(d) {
        let s = JSON.parse(d);
        state.money = s.money;
        state.checkpoint = s.checkpoint;
        updateUI();
        if(state.checkpoint > 0) teleportTo(state.checkpoint);
    }
}
