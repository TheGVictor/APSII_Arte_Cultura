 // Estado global da aplicação
        let appState = {
            currentPage: 'home',
            currentMonth: 0, // Janeiro = 0
            currentYear: 2024,
            userScore: 1250,
            currentStreak: 7,
            monthlyGoal: 20,
            menuOpen: false
        };

        // Dados simulados de treinos (dias do mês que houve participação)
        let trainedDays = {
            '2024-0': [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26],
            '2024-1': [1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
            '2024-2': [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15]
        };

        // Função para alternar o menu mobile
        function toggleMenu() {
            const navMenu = document.getElementById('navMenu');
            const hamburger = document.querySelector('.hamburger');

            appState.menuOpen = !appState.menuOpen;

            if (appState.menuOpen) {
                navMenu.classList.add('active');
                hamburger.classList.add('active');
            } else {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        }

        // Função para mostrar páginas
        function showPage(pageId) {
            // Esconder todas as páginas
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => page.classList.remove('active'));

            // Mostrar página selecionada
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
            }

            // Atualizar navegação
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => link.classList.remove('active'));

            // Encontrar e ativar o link correspondente
            navLinks.forEach(link => {
                if (link.onclick && link.onclick.toString().includes(pageId)) {
                    link.classList.add('active');
                }
            });

            // Fechar menu mobile se estiver aberto
            if (appState.menuOpen) {
                toggleMenu();
            }

            appState.currentPage = pageId;

            // Se for página de pontuação, gerar calendário
            if (pageId === 'pontuacao') {
                setTimeout(() => {
                    generateCalendar();
                    updateScoreDisplay();
                }, 100);
            }
        }

        // Função para gerar calendário
        function generateCalendar() {
            const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];

            const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

            const monthYearElement = document.getElementById('monthYear');
            if (monthYearElement) {
                monthYearElement.textContent = `${monthNames[appState.currentMonth]} ${appState.currentYear}`;
            }

            const firstDay = new Date(appState.currentYear, appState.currentMonth, 1).getDay();
            const daysInMonth = new Date(appState.currentYear, appState.currentMonth + 1, 0).getDate();

            let calendarHTML = '';

            // Adicionar cabeçalhos dos dias da semana
            dayNames.forEach(day => {
                calendarHTML += `<div class="calendar-day header">${day}</div>`;
            });

            // Adicionar dias vazios no início
            for (let i = 0; i < firstDay; i++) {
                calendarHTML += '<div class="calendar-day"></div>';
            }

            // Adicionar dias do mês
            const monthKey = `${appState.currentYear}-${appState.currentMonth}`;
            const trained = trainedDays[monthKey] || [];

            for (let day = 1; day <= daysInMonth; day++) {
                let classes = 'calendar-day';
                if (trained.includes(day)) {
                    classes += ' trained';

                    // Verificar se está em sequência
                    if (isInStreak(day, trained)) {
                        classes += ' streak';
                    }
                }

                calendarHTML += `<div class="${classes}" onclick="toggleTraining(${day})">${day}</div>`;
            }

            const calendarGrid = document.getElementById('calendarGrid');
            if (calendarGrid) {
                calendarGrid.innerHTML = calendarHTML;
            }
        }

        // Função para verificar se um dia está em sequência
        function isInStreak(day, trained) {
            let consecutiveCount = 0;
            let maxConsecutive = 0;

            // Verificar sequências no array ordenado
            const sortedTrained = [...trained].sort((a, b) => a - b);

            for (let i = 0; i < sortedTrained.length; i++) {
                if (i === 0 || sortedTrained[i] === sortedTrained[i - 1] + 1) {
                    consecutiveCount++;
                    maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
                } else {
                    consecutiveCount = 1;
                }

                // Se o dia atual está na sequência de pelo menos 3 dias
                if (sortedTrained[i] === day && maxConsecutive >= 3) {
                    return true;
                }
            }

            return false;
        }

        // Função para mudar mês
        function changeMonth(direction) {
            appState.currentMonth += direction;
            if (appState.currentMonth > 11) {
                appState.currentMonth = 0;
                appState.currentYear++;
            } else if (appState.currentMonth < 0) {
                appState.currentMonth = 11;
                appState.currentYear--;
            }
            generateCalendar();
        }

        // Função para marcar/desmarcar treino
        function toggleTraining(day) {
            const monthKey = `${appState.currentYear}-${appState.currentMonth}`;
            if (!trainedDays[monthKey]) {
                trainedDays[monthKey] = [];
            }

            const index = trainedDays[monthKey].indexOf(day);
            if (index > -1) {
                trainedDays[monthKey].splice(index, 1);
                appState.userScore = Math.max(0, appState.userScore - 10);
            } else {
                trainedDays[monthKey].push(day);
                trainedDays[monthKey].sort((a, b) => a - b);
                appState.userScore += 10;

                // Verificar bônus de sequência
                const trained = trainedDays[monthKey];
                if (isInStreak(day, trained)) {
                    const streakLength = calculateStreak(trained);
                    if (streakLength >= 7 && streakLength < 15) {
                        appState.userScore += 50;
                    } else if (streakLength >= 15 && streakLength < 30) {
                        appState.userScore += 100;
                    } else if (streakLength >= 30) {
                        appState.userScore += 200;
                    }
                }
            }

            updateScoreDisplay();
            generateCalendar();
        }

        // Função para calcular streak atual
        function calculateStreak(trained) {
            if (!trained || trained.length === 0) return 0;

            const sortedTrained = [...trained].sort((a, b) => a - b);
            let maxStreak = 1;
            let currentStreak = 1;

            for (let i = 1; i < sortedTrained.length; i++) {
                if (sortedTrained[i] === sortedTrained[i - 1] + 1) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
            }

            return maxStreak;
        }

        // Função para atualizar display de pontuação
        function updateScoreDisplay() {
            const totalScoreElement = document.getElementById('totalScore');
            const currentStreakElement = document.getElementById('currentStreak');

            if (totalScoreElement) {
                totalScoreElement.textContent = appState.userScore.toLocaleString();
            }

            // Calcular streak atual baseado no mês atual
            const monthKey = `${appState.currentYear}-${appState.currentMonth}`;
            const trained = trainedDays[monthKey] || [];
            const streakValue = calculateStreak(trained);

            if (currentStreakElement) {
                currentStreakElement.textContent = streakValue;
            }

            appState.currentStreak = streakValue;
        }

        // Função para enviar mensagem
        function enviarMensagem() {
            const nome = document.getElementById('nome');
            const email = document.getElementById('email');
            const telefone = document.getElementById('telefone');
            const assunto = document.getElementById('assunto');
            const mensagem = document.getElementById('mensagem');
            const sendBtn = document.getElementById('sendBtn');
            const successMessage = document.getElementById('successMessage');

            // Validação básica
            if (!nome.value.trim() || !email.value.trim() || !mensagem.value.trim()) {
                alert('Por favor, preencha todos os campos obrigatórios (Nome, E-mail e Mensagem).');
                return;
            }

            // Validação de email simples
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.value)) {
                alert('Por favor, insira um e-mail válido.');
                return;
            }

            // Simular envio
            sendBtn.innerHTML = '<span class="loading"></span> Enviando...';
            sendBtn.disabled = true;

            setTimeout(() => {
                // Mostrar mensagem de sucesso
                successMessage.style.display = 'block';

                // Limpar formulário
                nome.value = '';
                email.value = '';
                telefone.value = '';
                assunto.value = '';
                mensagem.value = '';

                // Restaurar botão
                sendBtn.innerHTML = 'Enviar Mensagem';
                sendBtn.disabled = false;

                // Esconder mensagem após 5 segundos
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 5000);

            }, 2000);
        }

        // Função para adicionar listeners de eventos
        function addEventListeners() {
            // Listener para cliques nos links de navegação
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    // O onclick já está definido inline, então não precisamos fazer nada aqui
                });
            });

            // Listener para redimensionamento da tela
            window.addEventListener('resize', function () {
                if (window.innerWidth > 768 && appState.menuOpen) {
                    toggleMenu();
                }
            });

            // Listener para teclas do teclado
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && appState.menuOpen) {
                    toggleMenu();
                }
            });
        }

        // Função para inicializar a aplicação
        function initApp() {
            console.log('Inicializando aplicação...');

            // Gerar calendário se estivermos na página de pontuação
            if (appState.currentPage === 'pontuacao') {
                generateCalendar();
            }

            // Atualizar display de pontuação
            updateScoreDisplay();

            // Adicionar event listeners
            addEventListeners();

            console.log('Aplicação inicializada com sucesso!');
        }

        // Inicializar quando o DOM estiver carregado
        document.addEventListener('DOMContentLoaded', initApp);

        // Simular atualização periódica de dados
        setInterval(() => {
            if (appState.currentPage === 'pontuacao') {
                // Pequena chance de ganhar pontos automaticamente (simulação)
                if (Math.random() > 0.95) {
                    appState.userScore += 5;
                    updateScoreDisplay();
                }
            }
        }, 10000); // A cada 10 segundos

        // Função para debug (pode ser removida em produção)
        function debugInfo() {
            console.log('Estado atual da aplicação:', appState);
            console.log('Dias treinados:', trainedDays);
        }

        // Expor função de debug globalmente para testes
        window.debugInfo = debugInfo;