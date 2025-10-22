const API_BASE = 'http://localhost:4000/api'; 

let appState = {
  currentPage: 'home',
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  trainedDaysServer: {}, 
  userScore: 0,
  userName: null
};


function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function toggleMenu() {
  const navMenu = document.getElementById('navMenu');
  navMenu.classList.toggle('active');
}


function getLocalUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveLocalUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

async function fakeRegister(name, email, password) {
  const users = getLocalUsers();
  if (users.find(u => u.email === email)) {
    throw new Error('E-mail já cadastrado');
  }

  users.push({
    id: Date.now().toString(),
    name,
    email,
    password,
    score: 0,
    trainedDays: {}
  });

  saveLocalUsers(users);
  localStorage.setItem('token', email);
}

async function fakeLogin(email, password) {
  const users = getLocalUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Credenciais inválidas');

  localStorage.setItem('token', email);
}

function getLoggedUser() {
  const email = localStorage.getItem('token');
  if (!email) return null;
  const users = getLocalUsers();
  return users.find(u => u.email === email) || null;
}

function saveLoggedUser(user) {
  const users = getLocalUsers();
  const index = users.findIndex(u => u.email === user.email);
  if (index >= 0) users[index] = user;
  saveLocalUsers(users);
}


function setAuthUI(loggedIn, name) {
  const authButtons = document.querySelectorAll('.auth-buttons');
  const welcomes = document.querySelectorAll('.welcome');
  const navPont = document.getElementById('navPontuacao');

  if (loggedIn) {
    authButtons.forEach(b => b.style.display = 'none');
    welcomes.forEach(w => {
      w.style.display = 'flex';
      w.innerHTML = `Bem-vindo, ${escapeHtml(name)} <button class="btn" onclick="logout()" style="margin-left:8px;padding:6px 10px;font-size:13px">Sair</button>`;
    });
    navPont.classList.remove('blocked');
  } else {
    authButtons.forEach(b => b.style.display = 'flex');
    welcomes.forEach(w => w.style.display = 'none');
    navPont.classList.add('blocked');
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"'`=\/]/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;', '/': '&#x2F;',
    '`': '&#x60;', '=': '&#x3D;'
  })[s]);
}

async function loadUser() {
  const user = getLoggedUser();
  if (!user) {
    setAuthUI(false);
    return;
  }

  appState.userName = user.name;
  appState.userScore = user.score || 0;
  appState.trainedDaysServer = user.trainedDays || {};
  setAuthUI(true, user.name);

  const totalScoreEl = document.getElementById('totalScore');
  if (totalScoreEl) totalScoreEl.textContent = user.score.toLocaleString();
}


async function doLogin(email, password) {
  await fakeLogin(email, password);
  const user = getLoggedUser();
  if (user) {
    appState.userName = user.name;
    appState.userScore = user.score || 0;
    appState.trainedDaysServer = user.trainedDays || {};
    setAuthUI(true, user.name);
    document.getElementById('totalScore').textContent = user.score.toLocaleString();
  }
  alert('Login efetuado com sucesso!');
}

async function doSignup(name, email, password) {
  await fakeRegister(name, email, password);
  await loadUser();
  alert('Cadastro e login concluídos!');
}

function logout() {
  localStorage.removeItem('token');
  appState.userName = null;
  appState.userScore = 0;
  appState.trainedDaysServer = {};
  setAuthUI(false);
  showPage('home');
}


document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navLoginBtn').addEventListener('click', () => openModal('loginModal'));
  document.getElementById('navSignupBtn').addEventListener('click', () => openModal('signupModal'));

  document.getElementById('loginSubmit').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!email || !password) return alert('Preencha e-mail e senha.');
    try {
      await doLogin(email, password);
      closeModal('loginModal');
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  });

  document.getElementById('signupSubmit').addEventListener('click', async () => {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    if (!name || !email || !password) return alert('Preencha todos os campos.');
    try {
      await doSignup(name, email, password);
      closeModal('signupModal');
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  });

  loadUser();
  initApp();
});


function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (!target) return;

  if (pageId === 'pontuacao' && !localStorage.getItem('token')) {
    alert('Você precisa estar logado para acessar a pontuação.');
    return;
  }

  target.classList.add('active');
  appState.currentPage = pageId;

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    link.style.backgroundColor = '#f8f9fa';
    link.style.color = '#333';
  });

  const activeLink = document.querySelector(`.nav-link[onclick*="showPage('${pageId}')"]`);
  if (activeLink) {
    activeLink.classList.add('active');
    activeLink.style.backgroundColor = '#28a745';
    activeLink.style.color = '#fff';
  }

  if (appState.menuOpen) toggleMenu();
}


function generateCalendar(trained) {
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  document.getElementById('monthYear').textContent =
    `${monthNames[appState.currentMonth]} ${appState.currentYear}`;

  const firstDay = new Date(appState.currentYear, appState.currentMonth, 1).getDay();
  const daysInMonth = new Date(appState.currentYear, appState.currentMonth + 1, 0).getDate();

  let html = '';
  dayNames.forEach(d => html += `<div class="calendar-day header">${d}</div>`);
  for (let i = 0; i < firstDay; i++) html += `<div class="calendar-day"></div>`;

  const key = `${appState.currentYear}-${appState.currentMonth}`;
  const trainedArr = (trained && trained[key]) ? trained[key] : [];
  const sortedTrained = [...trainedArr].sort((a, b) => a - b);

  for (let d = 1; d <= daysInMonth; d++) {
    const isTrained = trainedArr.includes(d);
    const classes = ['calendar-day'];
    if (isTrained) {
      classes.push('trained');
      const prevDay = sortedTrained.indexOf(d) - 1;
      const nextDay = sortedTrained.indexOf(d) + 1;
      if (prevDay >= 0 && nextDay < sortedTrained.length &&
          sortedTrained[prevDay] === d - 1 && sortedTrained[nextDay] === d + 1) {
        classes.push('sequence');
      }
    }
    html += `<div class="${classes.join(' ')}" data-day="${d}">${d}</div>`;
  }

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = html;

  grid.querySelectorAll('.calendar-day:not(.header)').forEach(day => {
    day.addEventListener('click', () => {
      const num = parseInt(day.getAttribute('data-day'));
      if (num) toggleTraining(num);
    });
  });

  document.getElementById('totalScore').textContent = (appState.userScore || 0).toLocaleString();
  document.getElementById('currentStreak').textContent = calculateStreak(trainedArr);
}

function calculateStreak(arr = []) {
  if (!arr.length) return 0;
  arr.sort((a, b) => a - b);
  let max = 1, cur = 1;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === arr[i - 1] + 1) {
      cur++;
      max = Math.max(max, cur);
    } else cur = 1;
  }
  return max;
}

function changeMonth(dir) {
  appState.currentMonth += dir;
  if (appState.currentMonth < 0) { appState.currentMonth = 11; appState.currentYear--; }
  if (appState.currentMonth > 11) { appState.currentMonth = 0; appState.currentYear++; }
  if (appState.currentPage === 'pontuacao') generateCalendar(appState.trainedDaysServer);
}

function toggleTraining(day) {
  const user = getLoggedUser();
  if (!user) return alert('Faça login para marcar o dia.');

  const key = `${appState.currentYear}-${appState.currentMonth}`;
  user.trainedDays[key] = user.trainedDays[key] || [];

  const idx = user.trainedDays[key].indexOf(day);
  if (idx >= 0) {
    user.trainedDays[key].splice(idx, 1);
    user.score = Math.max(0, user.score - 10);
  } else {
    user.trainedDays[key].push(day);
    user.score += 10;
  }

  saveLoggedUser(user);
  appState.userScore = user.score;
  appState.trainedDaysServer = user.trainedDays;
  document.getElementById('totalScore').textContent = user.score.toLocaleString();
  generateCalendar(user.trainedDays);
}


function enviarMensagem() {
  const nome = document.getElementById('nome');
  const email = document.getElementById('email');
  const telefone = document.getElementById('telefone');
  const assunto = document.getElementById('assunto');
  const mensagem = document.getElementById('mensagem');
  const sendBtn = document.getElementById('sendBtn');
  const successMessage = document.getElementById('successMessage');

  if (!nome.value.trim() || !email.value.trim() || !mensagem.value.trim()) {
    alert('Por favor, preencha Nome, E-mail e Mensagem.');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) return alert('E-mail inválido.');

  sendBtn.innerHTML = 'Enviando...';
  sendBtn.disabled = true;

  setTimeout(() => {
    successMessage.style.display = 'block';
    nome.value = ''; email.value = ''; telefone.value = ''; assunto.value = ''; mensagem.value = '';
    sendBtn.innerHTML = 'Enviar Mensagem';
    sendBtn.disabled = false;
    setTimeout(() => successMessage.style.display = 'none', 4000);
  }, 1200);
}

function initApp() {
  if (appState.currentPage === 'pontuacao') {
    showPage('pontuacao');
    generateCalendar(appState.trainedDaysServer);
    return;
  }
  showPage('home');
}
