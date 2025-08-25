// --- SELEÇÃO DE ELEMENTOS DO DOM ---
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const userDisplayName = document.getElementById('user-display-name');
const userPointsDisplay = document.getElementById('user-points-display'); // PONTOS NO HEADER
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
 
// --- ELEMENTOS DA TELA DE PRÊMIOS ---
const prizeStockDisplays = {
    ruler: document.getElementById('ruler-stock'),
    phoneHolder: document.getElementById('phone-holder-stock'),
    cup: document.getElementById('cup-stock'),
    ball: document.getElementById('ball-stock')
};
 
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
 
// --- LÓGICA DE PRÊMIOS E ESTOQUE ---
const prizes = {
    ruler: { name: 'Régua', cost: 500, initialStock: 500, btnId: 'claim-ruler' },
    phoneHolder: { name: 'Porta Celular', cost: 1500, initialStock: 290, btnId: 'claim-phone-holder' },
    cup: { name: 'Copo', cost: 4000, initialStock: 40, btnId: 'claim-cup' },
    ball: { name: 'Bolinha', cost: 4000, initialStock: 40, btnId: 'claim-ball' }
};
 
function initializePrizeInventory() {
    let inventory = JSON.parse(localStorage.getItem('gamePrizeInventory'));
    if (!inventory) {
        inventory = {
            ruler: prizes.ruler.initialStock,
            phoneHolder: prizes.phoneHolder.initialStock,
            cup: prizes.cup.initialStock,
            ball: prizes.ball.initialStock
        };
        localStorage.setItem('gamePrizeInventory', JSON.stringify(inventory));
    }
}
 
// --- FUNÇÕES DE DADOS (Simulando um banco de dados com localStorage) ---
function loadData() {
    initializePrizeInventory();
    const savedUser = JSON.parse(localStorage.getItem('senacGameUser'));
    if (savedUser) {
        currentUser = savedUser;
        if (currentUser.points === undefined) { // Garante que usuários antigos tenham a propriedade
            currentUser.points = 0;
        }
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
    const email = document.getElementById('email').value;
   
    // Tenta carregar dados de um usuário com o mesmo e-mail, se existir
    let existingUserData = JSON.parse(localStorage.getItem('senacGameUser'));
    if (existingUserData && existingUserData.email === email) {
        currentUser = existingUserData;
        // Atualiza o nome e telefone caso tenham mudado
        currentUser.name = document.getElementById('fullname').value;
        currentUser.phone = document.getElementById('phone').value;
    } else {
        // Cria um novo usuário
        currentUser = {
            name: document.getElementById('fullname').value,
            phone: document.getElementById('phone').value,
            email: email,
            points: 0 // Novo jogador começa com 0 pontos
        };
    }
 
    gameHistory = JSON.parse(localStorage.getItem(`gameHistory_${currentUser.email}`)) || [];
    saveData();
    showApp();
}
 
function showApp() {
    loginScreen.classList.add('hidden');
    mainApp.classList.add('visible');
    userDisplayName.textContent = currentUser.name;
    updatePointsDisplay();
    updateDashboard();
    renderReportsTable();
    updatePrizesView();
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
 
function updatePointsDisplay() {
    if (currentUser) {
        userPointsDisplay.textContent = currentUser.points;
    }
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
    if (!isPlayerTurn || !event.target.closest('.game-icon')) return;
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
   
    currentUser.points += score; // SOMA OS PONTOS DA PARTIDA AO TOTAL
   
    const now = new Date();
    gameHistory.push({
        date: now.toLocaleString('pt-BR'),
        rawDate: now,
        score: score,
        level: level
    });
    saveData(); // Salva o novo total de pontos
    updateDashboard();
    renderReportsTable();
    updatePrizesView();
    updatePointsDisplay(); // Atualiza o placar no header
   
    modalScoreText.textContent = `Você fez ${score} pontos! Eles foram adicionados ao seu total.`;
    endGameModal.classList.add('visible');
}
 
// --- FUNÇÕES DO MODAL ---
function closeModal() {
    endGameModal.classList.remove('visible');
    gameStatus.textContent = 'Clique em "Iniciar" para começar!';
    startGameButton.style.display = 'block';
}
 
// --- FUNÇÕES DA TELA DE PRÊMIOS ---
function updatePrizesView() {
    const inventory = JSON.parse(localStorage.getItem('gamePrizeInventory'));
   
    prizeStockDisplays.ruler.textContent = inventory.ruler;
    prizeStockDisplays.phoneHolder.textContent = inventory.phoneHolder;
    prizeStockDisplays.cup.textContent = inventory.cup;
    prizeStockDisplays.ball.textContent = inventory.ball;
   
    for (const prizeKey in prizes) {
        const prize = prizes[prizeKey];
        const button = document.getElementById(prize.btnId);
       
        const canAfford = currentUser.points >= prize.cost;
        const isInStock = inventory[prizeKey] > 0;
 
        button.disabled = !canAfford || !isInStock;
 
        if (!isInStock) {
            button.textContent = 'Esgotado!';
        } else if (!canAfford) {
            button.textContent = `Requer ${prize.cost} pontos`;
        } else {
            button.textContent = 'Resgatar';
        }
    }
}
 
function handleClaimPrize(prizeKey) {
    let inventory = JSON.parse(localStorage.getItem('gamePrizeInventory'));
    const prize = prizes[prizeKey];
 
    if (currentUser.points >= prize.cost && inventory[prizeKey] > 0) {
        currentUser.points -= prize.cost; // DEDUZ OS PONTOS
        inventory[prizeKey]--;
       
        localStorage.setItem('gamePrizeInventory', JSON.stringify(inventory));
        saveData();
       
        alert(`Parabéns! Você resgatou um(a) ${prize.name}!`);
       
        updatePrizesView();
        updatePointsDisplay();
    } else {
        alert('Você não tem pontos suficientes ou o prêmio esgotou.');
    }
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
 
modalButtonYes.addEventListener('click', () => {
    closeModal();
    showView('reports-view');
});
modalButtonNo.addEventListener('click', () => {
    closeModal();
});
 
menuToggleButton.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);
 
document.getElementById('claim-ruler').addEventListener('click', () => handleClaimPrize('ruler'));
document.getElementById('claim-phone-holder').addEventListener('click', () => handleClaimPrize('phoneHolder'));
document.getElementById('claim-cup').addEventListener('click', () => handleClaimPrize('cup'));
document.getElementById('claim-ball').addEventListener('click', () => handleClaimPrize('ball'));
 
// --- INICIALIZAÇÃO ---
loadData();