// --- SELEÇÃO DE ELEMENTOS DO DOM ---
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const userDisplayName = document.getElementById('user-display-name');
const logoutButton = document.getElementById('logout-button');
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');
const filterInput = document.getElementById('filter-input');
const reportsTableBody = document.getElementById('reports-table-body');
const menuToggleButton = document.getElementById('menu-toggle-button');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

// ELEMENTOS DO MODAL
const endGameModal = document.getElementById('end-game-modal');
const modalScoreText = document.getElementById('modal-score-text');
const modalButtonYes = document.getElementById('modal-button-yes');
const modalButtonNo = document.getElementById('modal-button-no');

// Displays do Dashboard
const highScoreDisplay = document.getElementById('high-score-display');
const maxLevelDisplay = document.getElementById('max-level-display');
const gamesPlayedDisplay = document.getElementById('games-played-display');
const lastScoreDisplay = document.getElementById('last-score-display'); 

// Elementos do Jogo
const gameBoard = document.getElementById('game-board');
const gameIcons = document.querySelectorAll('.game-icon');
const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const gameStatus = document.getElementById('game-status');
const startGameButton = document.getElementById('start-game-button');

// --- VARIÁVEIS DE ESTADO ---
let currentUser = null;
let gameHistory = [];

// Estado do Jogo
let sequence = [];
let playerSequence = [];
let level = 1;
let score = 0;
let isPlayerTurn = false;
let gameSpeed = 800;
const allIconIds = Array.from(gameIcons).map(icon => icon.dataset.id);

// --- FUNÇÕES DE DADOS (Simulando um banco de dados com localStorage) ---
function loadData() {
    const savedUser = JSON.parse(localStorage.getItem('senacGameUser'));
    if (savedUser) {
        currentUser = savedUser;
        gameHistory = JSON.parse(localStorage.getItem(`gameHistory_${currentUser.email}`)) || [];
        showApp();
    }
}

function saveData() {
    localStorage.setItem('senacGameUser', JSON.stringify(currentUser));
    localStorage.setItem(`gameHistory_${currentUser.email}`, JSON.stringify(gameHistory));
}

// --- FUNÇÕES DE LÓGICA PRINCIPAL ---
function handleLogin(event) {
    event.preventDefault();
    currentUser = {
        name: document.getElementById('fullname').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
    };
    gameHistory = JSON.parse(localStorage.getItem(`gameHistory_${currentUser.email}`)) || [];
    saveData();
    showApp();
}

function showApp() {
    loginScreen.classList.add('hidden');
    mainApp.classList.add('visible');
    userDisplayName.textContent = currentUser.name; 
    updateDashboard();
    renderReportsTable();
}

function handleLogout() {
    currentUser = null;
    gameHistory = [];
    localStorage.removeItem('senacGameUser');
    mainApp.classList.remove('visible');
    loginScreen.classList.remove('hidden');
    loginForm.reset();
}

// --- LÓGICA DE NAVEGAÇÃO ---
function showView(viewId) {
    views.forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === viewId) {
            link.classList.add('active');
        }
    });
}

// --- LÓGICA DO DASHBOARD (RF04) ---
function updateDashboard() {
    const dashboardTitle = document.getElementById('dashboard-title');
    if (dashboardTitle) {
        dashboardTitle.textContent = `Desempenho de ${currentUser.name}`;
    }

    const reportTitle = document.getElementById('reports-title');
    if (reportTitle) {
        reportTitle.textContent = `Histórico de Partidas de ${currentUser.name}`;
    }

    const highScore = gameHistory.reduce((max, game) => game.score > max ? game.score : max, 0);
    const maxLevel = gameHistory.reduce((max, game) => game.level > max ? game.level : max, 0);
    const gamesPlayed = gameHistory.length;
    const lastScore = gamesPlayed > 0 ? gameHistory[gameHistory.length - 1].score : 0;

    highScoreDisplay.textContent = highScore;
    lastScoreDisplay.textContent = lastScore;
    maxLevelDisplay.textContent = maxLevel;
    gamesPlayedDisplay.textContent = gamesPlayed;
}

// --- LÓGICA DOS RELATÓRIOS (RF06 & RF07) ---
function renderReportsTable(filter = '') {
    reportsTableBody.innerHTML = '';
    const filteredHistory = gameHistory.filter(game => 
        game.score.toString().includes(filter) || 
        game.date.includes(filter)
    );

    if (filteredHistory.length === 0) {
        reportsTableBody.innerHTML = '<tr><td colspan="3">Nenhum registro encontrado.</td></tr>';
        return;
    }

    filteredHistory.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate)); 

    filteredHistory.forEach(game => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${game.date}</td>
            <td>${game.score}</td>
            <td>${game.level}</td>
        `;
        reportsTableBody.appendChild(row);
    });
}

// --- LÓGICA DO JOGO "MEMO-FLASH" ---
function startGame() {
    level = 1;
    score = 0;
    gameSpeed = 800;
    sequence = [];
    startGameButton.style.display = 'none';
    updateGameInfo();
    nextLevel();
}

function updateGameInfo() {
    scoreDisplay.textContent = `Pontos: ${score}`;
    levelDisplay.textContent = `Nível: ${level}`;
}

function nextLevel() {
    isPlayerTurn = false;
    playerSequence = [];
    gameStatus.textContent = "Memorize a sequência...";
    gameBoard.classList.add('no-click');
    const randomIconId = allIconIds[Math.floor(Math.random() * allIconIds.length)];
    sequence.push(randomIconId);
    if (level > 5) gameSpeed = 500;
    if (level > 10) gameSpeed = 350;
    playSequence();
}

function playSequence() {
    let i = 0;
    const interval = setInterval(() => {
        if (i < sequence.length) {
            const iconId = sequence[i];
            const iconElement = document.querySelector(`.game-icon[data-id="${iconId}"]`);
            iconElement.classList.add('flash');
            setTimeout(() => {
                iconElement.classList.remove('flash');
            }, gameSpeed * 0.6);
            i++;
        } else {
            clearInterval(interval);
            startPlayerTurn();
        }
    }, gameSpeed);
}

function startPlayerTurn() {
    isPlayerTurn = true;
    gameStatus.textContent = "Sua vez!";
    gameBoard.classList.remove('no-click');
}

function handleIconClick(event) {
    if (!isPlayerTurn || !event.target.dataset.id) return;
    const clickedId = event.target.closest('.game-icon').dataset.id;
    playerSequence.push(clickedId);
    const currentStep = playerSequence.length - 1;
    event.target.closest('.game-icon').classList.add('flash');
    setTimeout(() => {
        event.target.closest('.game-icon').classList.remove('flash');
    }, 200);
    if (playerSequence[currentStep] !== sequence[currentStep]) {
        endGame("Sequência errada!");
        return;
    }
    if (playerSequence.length === sequence.length) {
        score += level * 10;
        level++;
        updateGameInfo();
        setTimeout(nextLevel, 1000);
    }
}

function endGame(message) {
    isPlayerTurn = false;
    gameStatus.textContent = `Fim de Jogo! ${message}`;
    const now = new Date();
    gameHistory.push({
        date: now.toLocaleString('pt-BR'),
        rawDate: now,
        score: score,
        level: level
    });
    saveData();
    updateDashboard();
    renderReportsTable();
    
    modalScoreText.textContent = `Sua pontuação final foi: ${score}`;
    endGameModal.classList.add('visible');
}

// --- FUNÇÕES DO MODAL ---
function closeModal() {
    endGameModal.classList.remove('visible');
    gameStatus.textContent = 'Clique em "Iniciar" para começar!';
    startGameButton.style.display = 'block';
}

// --- FUNÇÃO PARA MENU RESPONSIVO ---
function toggleSidebar() {
    sidebar.classList.toggle('visible');
    overlay.classList.toggle('visible');
}

// --- EVENT LISTENERS ---
loginForm.addEventListener('submit', handleLogin);
logoutButton.addEventListener('click', handleLogout);

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showView(link.dataset.view);
        if (sidebar.classList.contains('visible')) {
            toggleSidebar();
        }
    });
});

filterInput.addEventListener('input', (e) => renderReportsTable(e.target.value));
startGameButton.addEventListener('click', startGame);
gameBoard.addEventListener('click', handleIconClick);

// LISTENERS DO MODAL
modalButtonYes.addEventListener('click', () => {
    closeModal();
    showView('reports-view');
});

modalButtonNo.addEventListener('click', () => {
    closeModal();
});

// LISTENERS PARA MENU RESPONSIVO
menuToggleButton.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

// --- INICIALIZAÇÃO ---
loadData();