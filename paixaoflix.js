// PaixãoFlix - Sistema Completo de Streaming
class PaixaoFlixApp {
    constructor() {
        this.currentPage = 'home';
        this.currentCategory = null;
        this.data = {
            filmes: [],
            series: [],
            kidsFilmes: [],
            kidsSeries: [],
            favoritos: []
        };
        this.continueWatching = [];
        this.lastWatched = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.initNavigation();
        this.initSearch();
        this.initVideoPlayer();
        this.setupEventListeners();
        this.applyTimeBasedVisibility();
        this.initTMDB();
        
        // Garantir que home seja a página inicial
        this.showPage('home');
        // loadHomeContent() já é chamado dentro de showPage('home')
        
        // Iniciar foco no primeiro elemento
        this.setInitialFocus();
    }

    setInitialFocus() {
        // Foco inicial no primeiro item do menu
        const firstMenuItem = document.querySelector('.menu-item .menu-link');
        if (firstMenuItem) {
            firstMenuItem.focus();
        }
    }

    async loadData() {
        try {
            const [filmes, series, kidsFilmes, kidsSeries, favoritos] = await Promise.all([
                fetch('data/filmes.json').then(r => r.json()),
                fetch('data/series.json').then(r => r.json()),
                fetch('data/kids_filmes.json').then(r => r.json()),
                fetch('data/kids_series.json').then(r => r.json()),
                fetch('data/favoritos.json').then(r => r.json())
            ]);

            this.data.filmes = filmes;
            this.data.series = series;
            this.data.kidsFilmes = kidsFilmes;
            this.data.kidsSeries = kidsSeries;
            this.data.favoritos = favoritos;

            // Carregar continuar assistindo (últimos 3)
            const saved = localStorage.getItem('paixaoflix_continue_watching');
            if (saved) {
                this.continueWatching = JSON.parse(saved);
                // Manter apenas os 3 mais recentes
                this.continueWatching.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
                this.continueWatching = this.continueWatching.slice(0, 3);
            }

            // Carregar último assistido para recomendações
            const lastSaved = localStorage.getItem('paixaoflix_last_watched');
            if (lastSaved) {
                this.lastWatched = JSON.parse(lastSaved);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    initTMDB() {
        this.tmdbService = new TMDBService('b275ce8e1a6b3d5d879bb0907e4f56ad');
        this.loadHeroBanner();
    }

    async loadHeroBanner() {
        try {
            const randomMovie = this.data.filmes[Math.floor(Math.random() * this.data.filmes.length)];
            const tmdbData = await this.tmdbService.getMovieDetails(randomMovie.tmdb_id);
            
            const heroBanner = document.querySelector('.hero-background');
            if (heroBanner && tmdbData.backdrop_path) {
                heroBanner.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${tmdbData.backdrop_path})`;
            }
        } catch (error) {
            console.error('Erro ao carregar banner:', error);
        }
    }

    loadHomeContent() {
        // Verificar e inserir sessão de sábado dinamicamente
        this.checkSaturdaySession();
        
        // 1. Não deixe de ver (primeira sessão) - 5 capas mais vistas
        this.loadMostViewed();
        
        // 2. Continuar Assistindo
        this.loadContinueWatching();
        
        // 3. Minha Lista (segunda sessão)
        this.loadMyList();
        
        // 4. Sábado à Noite (será inserido dinamicamente se necessário)
        
        // 5. Premiados pela mídia - 5 capas com loop infinito
        this.loadAwardWinning();
        
        // 6. Nostalgia - 5 capas
        this.loadNostalgia();
        
        // 7. Kids - 5 capas
        this.loadKids();
        
        // 8. Maratonar - 5 capas
        this.loadMarathon();
        
        // 9. Porque você assistiu - 4 capas baseadas no último assistido
        this.loadRecommendations();
        
        // 10. Novela (última sessão)
        this.loadNovelas();
    }

    loadMyList() {
        const container = document.getElementById('my-list-row');
        if (!container) return;

        // Verificar se há favoritos
        if (this.data.favoritos.length === 0) {
            // Ocultar sessão se estiver vazia
            const section = container.closest('.content-section');
            if (section) {
                section.style.display = 'none';
            }
            return;
        }

        // Mostrar sessão se houver conteúdo
        const section = container.closest('.content-section');
        if (section) {
            section.style.display = 'block';
        }

        container.innerHTML = '';
        
        // Limitar a 5 capas
        const selected = this.data.favoritos.slice(0, 5);
        
        selected.forEach(item => {
            const card = this.createMovieCard(item);
            container.appendChild(card);
        });
    }

    checkSaturdaySession() {
        // Para testes: permitir simulação de horário
        const testMode = localStorage.getItem('test_saturday_mode');
        let shouldShow = false;
        
        if (testMode === 'true') {
            // Modo de teste: sempre mostrar
            shouldShow = true;
        } else {
            // Modo normal: verificar horário real
            const now = new Date();
            const day = now.getDay(); // 0 = Domingo, 6 = Sábado
            const hour = now.getHours();
            
            // Verificar se é horário de exibir (Sáb 16:59 - Dom 05:59)
            shouldShow = (day === 6 && hour >= 16) || (day === 0 && hour < 6);
        }
        
        const saturdaySection = document.querySelector('.saturday-night-section');
        const mainContent = document.querySelector('.main-content');
        
        if (shouldShow && !saturdaySection) {
            // Inserir sessão na terceira posição
            this.insertSaturdaySection();
        } else if (!shouldShow && saturdaySection) {
            // Remover sessão
            saturdaySection.remove();
        }
    }

    // Função para testar (pode ser chamada no console)
    testSaturdayMode(enable = true) {
        localStorage.setItem('test_saturday_mode', enable.toString());
        this.checkSaturdaySession();
        console.log(`Modo teste sábado ${enable ? 'ativado' : 'desativado'}`);
    }

    insertSaturdaySection() {
        const mainContent = document.querySelector('.main-content');
        const sections = mainContent.querySelectorAll('.content-section, .continue-watching');
        
        // Criar sessão de sábado
        const saturdaySection = document.createElement('section');
        saturdaySection.className = 'saturday-night-section saturday-night';
        saturdaySection.innerHTML = `
            <div class="saturday-night-content">
                <h2 class="section-title">Sábado à noite merece</h2>
                <div class="infinite-row" id="saturday-night-row">
                    <!-- Será preenchido -->
                </div>
            </div>
        `;
        
        // Inserir na terceira posição (índice 2)
        if (sections.length >= 2) {
            mainContent.insertBefore(saturdaySection, sections[2]);
        } else {
            mainContent.appendChild(saturdaySection);
        }
        
        // Carregar conteúdo aleatório
        this.loadSaturdayNightContent();
    }

    loadSaturdayNightContent() {
        const container = document.getElementById('saturday-night-row');
        if (!container) return;

        // Puxar conteúdo aleatório de categorias específicas
        const categories = ['Romance', 'Comédia', 'Série', 'Kids', 'Suspense', 'Terror', 'Religioso', 'Animação'];
        const selectedContent = [];
        
        categories.forEach(category => {
            const allContent = [
                ...this.data.filmes.filter(item => item.genre === category),
                ...this.data.series.filter(item => item.genre === category),
                ...this.data.kidsFilmes.filter(item => item.genre === category),
                ...this.data.kidsSeries.filter(item => item.genre === category)
            ];
            
            if (allContent.length > 0) {
                const random = allContent[Math.floor(Math.random() * allContent.length)];
                selectedContent.push(random);
            }
        });
        
        // Limitar a 5 capas
        const finalSelection = selectedContent.slice(0, 5);
        
        container.innerHTML = '';
        
        finalSelection.forEach(item => {
            const card = this.createMovieCardWithMeta(item);
            container.appendChild(card);
        });
    }

    loadMostViewed() {
        const container = document.getElementById('nao-deixe-de-ver-row');
        if (!container) return;

        // Verificar se há dados carregados
        if (this.data.filmes.length === 0) {
            setTimeout(() => this.loadMostViewed(), 100);
            return;
        }

        // Pegar conteúdo mais visto (simulado com rating ou views)
        const allContent = [...this.data.filmes, ...this.data.series];
        
        // Ordenar por popularidade (rating ou views)
        const mostViewed = allContent
            .filter(item => item.rating && item.rating >= 7.0)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 5);
        
        container.innerHTML = '';
        
        mostViewed.forEach((item, index) => {
            const card = this.createMostViewedCard(item, index + 1);
            container.appendChild(card);
        });
    }

    createMostViewedCard(item, rank) {
        const card = document.createElement('div');
        card.className = 'movie-card most-viewed';
        card.dataset.id = item.id;
        card.tabIndex = 0;
        
        // Verificar se tem URL de exibição
        const hasContent = item.video_url || item.m3u8_url;
        
        // Determinar cor do rank baseado na avaliação
        const rating = parseFloat(item.rating) || 8.0;
        let rankColor = '';
        
        if (rating > 9.0) {
            rankColor = 'gold'; // Dourado
        } else if (rating >= 8.0) {
            rankColor = 'silver'; // Prata
        } else {
            rankColor = 'bronze'; // Bronze/Branco Fosco
        }
        
        card.innerHTML = `
            ${!hasContent ? '<div class="coming-soon-badge">Em Breve</div>' : ''}
            <div class="rank-number rank-${rankColor}">#${rank}</div>
            <div class="card-thumbnail">
                <i class="fas fa-play-circle"></i>
            </div>
            <h3>${item.title}</h3>
            <div class="card-meta">
                <span>${item.year || '2024'}</span>
                <span>${item.rating || '⭐ 8.0'}</span>
                <span>${item.duration || '2h'}</span>
            </div>
        `;
        
        card.addEventListener('click', () => this.showContentDetails(item));
        return card;
    }

    createMovieCardWithMeta(item) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.id = item.id;
        card.tabIndex = 0;
        
        card.innerHTML = `
            <div class="card-thumbnail">
                <i class="fas fa-play-circle"></i>
            </div>
            <h3>${item.title}</h3>
            <div class="card-meta">
                <span>${item.year || '2026'}</span>
                <span>${item.rating || '⭐ 8.5'}</span>
                <span>${item.genre || 'Drama'}</span>
                <span>${item.duration || '2h'}</span>
            </div>
        `;
        
        card.addEventListener('click', () => this.showContentDetails(item));
        return card;
    }

    loadContinueWatching() {
        const container = document.getElementById('continue-watching-row');
        if (!container) return;

        container.innerHTML = '';
        
        this.continueWatching.forEach(item => {
            const card = this.createWideCard(item);
            container.appendChild(card);
        });
    }

    loadNovelas() {
        const container = document.querySelector('.novela-section .infinite-row');
        if (!container) return;

        const novelas = this.data.series.filter(item => item.genre === 'Novela');
        
        // Criar loop infinito para novelas
        const createLoop = () => {
            container.innerHTML = '';
            const loopContainer = document.createElement('div');
            loopContainer.className = 'loop-container';
            
            // Clonar novelas múltiplas vezes para loop infinito
            for (let i = 0; i < 3; i++) {
                novelas.forEach(novela => {
                    const card = this.createWideCard(novela);
                    loopContainer.appendChild(card);
                });
            }
            
            container.appendChild(loopContainer);
        };
        
        createLoop();
    }

    setupMenuNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            item.addEventListener('focus', () => {
                // Expandir menu
                document.getElementById('sidebar').classList.add('expanded');
                
                // Mostrar categorias se for menu principal
                const page = item.querySelector('.menu-link').dataset.page;
                if (page && page !== 'home') {
                    this.showPageCategories(page);
                }
            });
            
            item.addEventListener('blur', () => {
                document.getElementById('sidebar').classList.remove('expanded');
            });
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.querySelector('.menu-link').dataset.page;
                if (page) {
                    this.showPage(page);
                }
            });
        });
    }

    loadAwardWinning() {
        const container = document.getElementById('premiados-pela-midia-row');
        if (!container) return;

        const curator = new CuratorEngine(this.data);
        const awarded = curator.getAwardWinning();
        
        // Criar loop infinito para premiados
        const createInfiniteLoop = () => {
            container.innerHTML = '';
            container.className = 'infinite-row';
            
            // Criar container para loop
            const loopContainer = document.createElement('div');
            loopContainer.className = 'infinite-loop-container';
            
            // Clonar conteúdo múltiplas vezes para loop infinito
            for (let i = 0; i < 3; i++) {
                awarded.forEach(item => {
                    const card = this.createAwardCard(item);
                    loopContainer.appendChild(card);
                });
            }
            
            container.appendChild(loopContainer);
            
            // Adicionar indicador de continuar
            const indicator = document.createElement('div');
            indicator.className = 'continue-indicator';
            indicator.innerHTML = '<i class="fas fa-chevron-right"></i>';
            container.appendChild(indicator);
        };
        
        createInfiniteLoop();
    }

    closeVideoPlayer() {
        const player = document.getElementById('video-player');
        const video = player.querySelector('video');
        
        video.pause();
        player.classList.remove('active');
        document.body.classList.remove('player-open');
        
        // Fechar sugestões se estiverem abertas
        this.closeVideoSuggestions();
        
        // Voltar para detalhes se houver conteúdo em exibição
        if (this.lastWatched) {
            this.showRegularModal(this.lastWatched);
        }
    }

    loadNostalgia() {
        const container = document.getElementById('nostalgia-row');
        if (!container) return;

        const curator = new CuratorEngine(this.data);
        const nostalgia = curator.getNostalgia();
        
        // Limitar a 5 capas
        const selected = nostalgia.slice(0, 5);
        
        container.innerHTML = '';
        
        selected.forEach(item => {
            const card = this.createMovieCard(item);
            container.appendChild(card);
        });
    }

    loadKids() {
        const container = document.getElementById('kids-row');
        if (!container) return;

        const allKids = [...this.data.kidsFilmes, ...this.data.kidsSeries];
        
        // Embaralhar e limitar a 5 capas
        const shuffled = allKids.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 5);
        
        container.innerHTML = '';
        
        selected.forEach(item => {
            const card = this.createMovieCard(item);
            container.appendChild(card);
        });
    }

    loadMarathon() {
        const container = document.getElementById('maratonar-row');
        if (!container) return;

        const curator = new CuratorEngine(this.data);
        const marathon = curator.getMarathonContent();
        
        // Limitar a 5 capas
        const selected = marathon.slice(0, 5);
        
        container.innerHTML = '';
        
        selected.forEach(item => {
            const card = this.createMovieCard(item);
            container.appendChild(card);
        });
    }

    loadRecommendations() {
        const container = document.getElementById('recomendacoes-row');
        if (!container) return;

        // Algoritmo de recomendação baseado no último assistido
        let recommendations = [];
        
        if (this.lastWatched && this.lastWatched.genero) {
            // Usar função de filtro que compare o array de 'genero' do último filme assistido com o resto do JSON
            const lastGenero = this.lastWatched.genero;
            
            const allContent = [...this.data.filmes, ...this.data.series];
            
            // Filtrar conteúdos com gênero similar
            recommendations = allContent.filter(item => {
                if (item.id === this.lastWatched.id) return false; // Excluir o próprio
                
                // Verificar se tem algum gênero em comum
                const itemGenero = item.genero || [item.genero];
                return itemGenero.some(genre => lastGenero.includes(genre));
            });
            
            // Embaralhar e pegar 4
            recommendations = recommendations.sort(() => Math.random() - 0.5).slice(0, 4);
        }
        
        // Se não houver recomendações, usar conteúdo popular
        if (recommendations.length === 0) {
            recommendations = this.data.filmes
                .filter(item => item.rating && item.rating >= 7.5)
                .sort(() => Math.random() - 0.5)
                .slice(0, 4);
        }
        
        container.innerHTML = '';
        
        recommendations.forEach(item => {
            const card = this.createMovieCard(item);
            container.appendChild(card);
        });
    }

    createMovieCard(item) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.id = item.id;
        card.tabIndex = 0;
        
        card.innerHTML = `
            <div class="card-thumbnail">
                <i class="fas fa-play-circle"></i>
            </div>
            <h3>${item.title}</h3>
            <div class="card-meta">
                <span>${item.year || '2024'}</span>
                <span>${item.rating || '⭐ 8.0'}</span>
                <span>${item.duration || '2h'}</span>
            </div>
        `;
        
        card.addEventListener('click', () => this.showContentDetails(item));
        return card;
    }

    createWideCard(item) {
        const card = document.createElement('div');
        card.className = 'wide-card';
        card.dataset.id = item.id;
        card.tabIndex = 0;
        
        const progress = item.progress || 0;
        
        card.innerHTML = `
            <div class="card-thumbnail">
                <i class="fas fa-play-circle"></i>
                ${progress > 0 ? `
                    <div class="progress-overlay">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                ` : ''}
            </div>
            <div class="card-info">
                <div class="card-title">${item.title}</div>
                <div class="card-meta">
                    <span>${item.year || '2024'}</span>
                    <span>${item.rating || '⭐ 8.0'}</span>
                    <span>${item.duration || '45min'}</span>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => this.showContentDetails(item));
        return card;
    }

    createAwardCard(item) {
        const card = document.createElement('div');
        card.className = 'movie-card award-card';
        card.dataset.id = item.id;
        card.tabIndex = 0;
        
        card.innerHTML = `
            <div class="award-badge">
                <i class="fas fa-trophy"></i>
            </div>
            <div class="card-thumbnail">
                <i class="fas fa-play-circle"></i>
            </div>
            <h3>${item.title}</h3>
            <div class="card-meta">
                <span>${item.year || '2024'}</span>
                <span>${item.rating || '⭐ 8.5'}</span>
                <span>${item.duration || '2h'}</span>
            </div>
        `;
        
        card.addEventListener('click', () => this.showContentDetails(item));
        return card;
    }

    showContentDetails(item) {
        // Verificar se está em "Continuar Assistindo"
        const isContinueWatching = this.continueWatching.some(cw => cw.id === item.id);
        
        if (isContinueWatching && item.progress && item.progress > 0) {
            // Mostrar modal de boas-vindas
            this.showContinueWatchingModal(item);
        } else {
            // Mostrar modal normal
            this.showRegularModal(item);
        }
    }

    showContinueWatchingModal(item) {
        // Criar modal personalizado
        const modal = document.createElement('div');
        modal.className = 'modal continue-watching-modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Bem vindo(a) de volta ao PaixãoFlix</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-info">
                        <p class="modal-description">Quer continuar assistindo ou recomeçar?</p>
                        <div class="modal-meta">
                            <span class="modal-year">${item.year || '2024'}</span>
                            <span class="modal-genre">${item.genre || 'Drama'}</span>
                        </div>
                        <div class="progress-info">
                            <p>Progresso: ${Math.round(item.progress)}%</p>
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${item.progress}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-primary continue-btn">
                            <i class="fas fa-play"></i> Continuar
                        </button>
                        <button class="btn-secondary restart-btn">
                            <i class="fas fa-redo"></i> Recomeçar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        
        // Event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const continueBtn = modal.querySelector('.continue-btn');
        const restartBtn = modal.querySelector('.restart-btn');
        
        closeBtn.onclick = () => this.closeContinueWatchingModal(modal);
        continueBtn.onclick = () => this.continueWatchingItem(item, modal);
        restartBtn.onclick = () => this.restartItem(item, modal);
        
        // ESC para fechar
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeContinueWatchingModal(modal);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    closeContinueWatchingModal(modal) {
        modal.remove();
        document.body.classList.remove('modal-open');
    }

    continueWatchingItem(item, modal) {
        this.closeContinueWatchingModal(modal);
        this.playContent(item, true); // true = continuar
    }

    restartItem(item, modal) {
        this.closeContinueWatchingModal(modal);
        
        // Resetar progresso
        const cwIndex = this.continueWatching.findIndex(cw => cw.id === item.id);
        if (cwIndex !== -1) {
            this.continueWatching[cwIndex].progress = 0;
            this.saveContinueWatching();
        }
        
        this.playContent(item, false); // false = recomeçar
    }

    showRegularModal(item) {
        const modal = document.getElementById('content-modal');
        const modalTitle = modal.querySelector('.modal-title');
        const modalDescription = modal.querySelector('.modal-description');
        const modalYear = modal.querySelector('.modal-year');
        const modalGenre = modal.querySelector('.modal-genre');
        const modalActions = modal.querySelector('.modal-actions');
        
        modalTitle.textContent = item.title;
        modalDescription.textContent = item.description || 'Descrição não disponível';
        modalYear.textContent = item.year || '2024';
        modalGenre.textContent = item.genre || 'Drama';
        
        // Verificar se está na lista de favoritos
        const isInList = this.data.favoritos.some(fav => fav.id === item.id);
        
        // Adicionar botão "Minha Lista"
        const listBtn = document.createElement('button');
        listBtn.className = `btn-secondary ${isInList ? 'in-list' : ''}`;
        listBtn.innerHTML = `
            <i class="fas ${isInList ? 'fa-check' : 'fa-heart'}"></i>
            ${isInList ? 'Remover da Lista' : 'Minha Lista'}
        `;
        listBtn.onclick = () => this.toggleMyList(item, listBtn);
        
        // Limpar e reconstruir ações
        modalActions.innerHTML = '';
        
        const playBtn = document.createElement('button');
        playBtn.className = 'btn-primary play-btn';
        playBtn.innerHTML = '<i class="fas fa-play"></i> Assistir Agora';
        playBtn.onclick = () => this.playContent(item, false);
        
        const continueBtn = document.createElement('button');
        continueBtn.className = 'btn-secondary continue-btn';
        continueBtn.innerHTML = '<i class="fas fa-play"></i> Continuar';
        
        if (item.progress && item.progress > 0) {
            continueBtn.style.display = 'inline-block';
            continueBtn.onclick = () => this.continueWatchingItem(item, modal);
        } else {
            continueBtn.style.display = 'none';
        }
        
        const backBtn = document.createElement('button');
        backBtn.className = 'btn-secondary';
        backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar';
        backBtn.onclick = () => this.closeModal();
        
        modalActions.appendChild(playBtn);
        modalActions.appendChild(listBtn);
        modalActions.appendChild(continueBtn);
        modalActions.appendChild(backBtn);
        
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }

    toggleMyList(item, button) {
        const index = this.data.favoritos.findIndex(fav => fav.id === item.id);
        
        if (index === -1) {
            // Adicionar à lista
            this.data.favoritos.push(item);
            button.innerHTML = '<i class="fas fa-check"></i> Remover da Lista';
            button.classList.add('in-list');
        } else {
            // Remover da lista
            this.data.favoritos.splice(index, 1);
            button.innerHTML = '<i class="fas fa-heart"></i> Minha Lista';
            button.classList.remove('in-list');
        }
        
        // Salvar no localStorage
        localStorage.setItem('paixaoflix_favorites', JSON.stringify(this.data.favoritos));
        
        // Atualizar a home se estiver visível
        if (this.currentPage === 'home') {
            this.loadMyList();
        }
    }

    closeModal() {
        const modal = document.getElementById('content-modal');
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }

    playContent(item, isContinue = false) {
        const player = document.getElementById('video-player');
        const video = player.querySelector('video');
        
        // Fechar modal
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.classList.remove('modal-open');
        
        // Abrir player
        player.classList.add('active');
        document.body.classList.add('player-open');
        
        // Carregar vídeo
        if (item.m3u8_url) {
            // Suporte a M3U8
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(item.m3u8_url);
                hls.attachMedia(video);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = item.m3u8_url;
            }
        } else if (item.video_url) {
            video.src = item.video_url;
        }
        
        // Configurar tempo inicial
        if (isContinue && item.progress && item.progress > 0) {
            video.addEventListener('loadedmetadata', () => {
                video.currentTime = (item.progress / 100) * video.duration;
            });
        }
        
        video.play();
        
        // Adicionar ao continuar assistindo e salvar último assistido
        this.addToContinueWatching(item);
        this.saveLastWatched(item);
        
        // Configurar salvamento de progresso
        this.setupProgressSaving(item, video);
    }

    setupProgressSaving(item, video) {
        let lastProgress = 0;
        let saveInterval;
        let suggestionsShown = false;
        
        const saveProgress = () => {
            if (video.duration) {
                const progress = (video.currentTime / video.duration) * 100;
                
                // Salvar apenas se houver mudança significativa (1%)
                if (Math.abs(progress - lastProgress) > 1) {
                    lastProgress = progress;
                    
                    // Atualizar no continuar assistindo
                    const cwIndex = this.continueWatching.findIndex(cw => cw.id === item.id);
                    if (cwIndex !== -1) {
                        this.continueWatching[cwIndex].progress = progress;
                        this.saveContinueWatching();
                    }
                }
            }
        };
        
        // Salvar progresso a cada 5 segundos
        saveInterval = setInterval(saveProgress, 5000);
        
        // Monitorar para sugestões (últimos 30 segundos)
        const checkSuggestions = () => {
            if (video.duration && !suggestionsShown) {
                const timeRemaining = video.duration - video.currentTime;
                
                if (timeRemaining <= 30) {
                    suggestionsShown = true;
                    this.showVideoSuggestions(item);
                }
            }
        };
        
        video.addEventListener('timeupdate', checkSuggestions);
        
        // Limpar ao terminar
        video.addEventListener('ended', () => {
            clearInterval(saveInterval);
            
            // Marcar como 100% completo
            const cwIndex = this.continueWatching.findIndex(cw => cw.id === item.id);
            if (cwIndex !== -1) {
                this.continueWatching[cwIndex].progress = 100;
                this.saveContinueWatching();
            }
            
            // Se não houver interação com sugestões, voltar para home
            setTimeout(() => {
                if (!document.querySelector('.video-suggestions-overlay')) {
                    this.closeVideoPlayer();
                    this.showPage('home');
                }
            }, 3000);
        });
        
        // Limpar ao fechar player
        video.addEventListener('pause', () => {
            clearInterval(saveInterval);
            saveProgress(); // Salvar progresso final
        });
    }

    showVideoSuggestions(currentItem) {
        const player = document.getElementById('video-player');
        
        // Criar overlay de sugestões
        const overlay = document.createElement('div');
        overlay.className = 'video-suggestions-overlay';
        overlay.innerHTML = `
            <div class="suggestions-content">
                <h2 class="suggestions-title">Que tal assistir a seguir?</h2>
                <div class="suggestions-grid">
                    <!-- Será preenchido -->
                </div>
                <button class="next-content-btn">
                    <i class="fas fa-forward"></i>
                    Próximo Conteúdo
                </button>
            </div>
        `;
        
        player.appendChild(overlay);
        
        // Carregar sugestões baseadas no gênero
        this.loadVideoSuggestions(currentItem);
        
        // Foco automático no botão "Próximo Conteúdo"
        setTimeout(() => {
            const nextBtn = overlay.querySelector('.next-content-btn');
            if (nextBtn) {
                nextBtn.focus();
            }
        }, 100);
    }

    loadVideoSuggestions(currentItem) {
        const overlay = document.querySelector('.video-suggestions-overlay');
        if (!overlay) return;
        
        const grid = overlay.querySelector('.suggestions-grid');
        const nextBtn = overlay.querySelector('.next-content-btn');
        
        // Buscar sugestões do mesmo gênero
        let suggestions = [];
        if (currentItem.genero) {
            const allContent = [...this.data.filmes, ...this.data.series, ...this.data.kidsFilmes, ...this.data.kidsSeries];
            
            suggestions = allContent.filter(item => {
                if (item.id === currentItem.id) return false;
                const itemGenero = item.genero || [item.genero];
                return itemGenero.some(genre => currentItem.genero.includes(genre));
            }).slice(0, 2);
        }
        
        // Se não houver sugestões, usar conteúdo popular
        if (suggestions.length === 0) {
            suggestions = this.data.filmes
                .filter(item => item.rating && item.rating >= 8.0)
                .sort(() => Math.random() - 0.5)
                .slice(0, 2);
        }
        
        // Criar cards de sugestão
        grid.innerHTML = '';
        suggestions.forEach(item => {
            const card = this.createSuggestionCard(item);
            grid.appendChild(card);
        });
        
        // Event listeners
        nextBtn.onclick = () => this.playNextContent(currentItem, suggestions[0]);
    }

    createSuggestionCard(item) {
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        card.tabIndex = 0;
        
        card.innerHTML = `
            <div class="suggestion-thumbnail">
                <img src="${item.thumbnail || 'https://via.placeholder.com/320x180'}" alt="${item.title}">
                <i class="fas fa-play-circle"></i>
            </div>
            <div class="suggestion-info">
                <h3>${item.title}</h3>
                <div class="suggestion-meta">
                    <span>${item.year || '2024'}</span>
                    <span>${item.rating || '⭐ 8.0'}</span>
                    <span>${item.duration || '2h'}</span>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.closeVideoSuggestions();
            this.closeVideoPlayer();
            this.showRegularModal(item);
        });
        
        return card;
    }

    closeVideoSuggestions() {
        const overlay = document.querySelector('.video-suggestions-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    playNextContent(currentItem, nextItem) {
        if (nextItem) {
            this.closeVideoSuggestions();
            this.playContent(nextItem, false);
        }
    }

    saveLastWatched(item) {
        this.lastWatched = item;
        localStorage.setItem('paixaoflix_last_watched', JSON.stringify(item));
    }

    saveContinueWatching() {
        // Manter apenas os 3 mais recentes
        this.continueWatching.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
        this.continueWatching = this.continueWatching.slice(0, 3);
        
        // Salvar no localStorage
        localStorage.setItem('paixaoflix_continue_watching', JSON.stringify(this.continueWatching));
        
        // Atualizar UI
        this.loadContinueWatching();
    }

    continueWatching(item) {
        const player = document.getElementById('video-player');
        const video = player.querySelector('video');
        
        // Fechar modal
        document.getElementById('content-modal').classList.remove('active');
        document.body.classList.remove('modal-open');
        
        // Abrir player
        player.classList.add('active');
        document.body.classList.add('player-open');
        
        // Carregar vídeo e continuar de onde parou
        if (item.m3u8_url) {
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(item.m3u8_url);
                hls.attachMedia(video);
                video.currentTime = (item.progress / 100) * video.duration;
            }
        } else if (item.video_url) {
            video.src = item.video_url;
            video.currentTime = (item.progress / 100) * video.duration;
        }
        
        video.play();
    }

    addToContinueWatching(item) {
        // Verificar se já existe
        const existingIndex = this.continueWatching.findIndex(i => i.id === item.id);
        
        if (existingIndex !== -1) {
            // Atualizar item existente
            this.continueWatching[existingIndex].lastWatched = new Date().toISOString();
        } else {
            // Adicionar novo item
            this.continueWatching.push({
                ...item,
                lastWatched: new Date().toISOString(),
                progress: 0
            });
        }
        
        // Manter apenas os 10 mais recentes
        this.continueWatching.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
        this.continueWatching = this.continueWatching.slice(0, 10);
        
        // Salvar no localStorage
        localStorage.setItem('paixaoflix_continue_watching', JSON.stringify(this.continueWatching));
        
        // Atualizar UI
        this.loadContinueWatching();
    }

    initNavigation() {
        this.navigation = new NavigationManager();
        this.setupMenuNavigation();
        this.setupCardNavigation();
    }

    setupMenuNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            item.addEventListener('focus', () => {
                // Expandir menu
                document.getElementById('sidebar').classList.add('expanded');
                
                // Mostrar categorias se for menu principal
                const page = item.querySelector('.menu-link').dataset.page;
                if (page && page !== 'home') {
                    this.showPageCategories(page);
                }
            });
            
            item.addEventListener('blur', () => {
                document.getElementById('sidebar').classList.remove('expanded');
            });
            
            item.addEventListener('click', () => {
                const page = item.querySelector('.menu-link').dataset.page;
                if (page) {
                    this.showPage(page);
                }
            });
        });
    }

    setupCardNavigation() {
        // Implementar navegação com scrollIntoView e transição menu/grid
        document.addEventListener('keydown', (e) => {
            const focused = document.activeElement;
            
            // Transição menu -> grid
            if (e.key === 'ArrowRight' && focused.classList.contains('menu-link')) {
                e.preventDefault();
                const firstCard = document.querySelector('.movie-card, .wide-card');
                if (firstCard) {
                    firstCard.focus();
                    firstCard.scrollIntoView({ block: 'center' });
                }
                return;
            }
            
            // Transição grid -> menu
            if (e.key === 'ArrowLeft' && focused && (focused.classList.contains('movie-card') || focused.classList.contains('wide-card'))) {
                e.preventDefault();
                const allCards = Array.from(document.querySelectorAll('.movie-card, .wide-card'));
                const firstCard = allCards[0];
                
                if (focused === firstCard) {
                    // Se está no primeiro card, voltar ao menu
                    const firstMenuItem = document.querySelector('.menu-item .menu-link');
                    if (firstMenuItem) {
                        firstMenuItem.focus();
                        // Expandir menu
                        document.getElementById('sidebar').classList.add('expanded');
                    }
                }
                return;
            }
            
            // Navegação vertical com scrollIntoView
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                if (focused && (focused.classList.contains('movie-card') || focused.classList.contains('wide-card'))) {
                    e.preventDefault();
                    
                    // Encontrar próxima seção
                    const section = focused.closest('.content-section, .continue-watching, .saturday-night-section');
                    const sections = Array.from(document.querySelectorAll('.content-section, .continue-watching, .saturday-night-section'));
                    const currentIndex = sections.indexOf(section);
                    
                    let nextSection;
                    if (e.key === 'ArrowDown' && currentIndex < sections.length - 1) {
                        nextSection = sections[currentIndex + 1];
                    } else if (e.key === 'ArrowUp' && currentIndex > 0) {
                        nextSection = sections[currentIndex - 1];
                    }
                    
                    if (nextSection) {
                        const firstCard = nextSection.querySelector('.movie-card, .wide-card');
                        if (firstCard) {
                            firstCard.focus();
                            firstCard.scrollIntoView({ block: 'center' });
                        }
                    }
                }
            }
        });
    }

    showPage(page) {
        this.currentPage = page;
        
        if (page === 'home') {
            // Mostrar todas as sessões especiais na home
            document.querySelectorAll('.content-section, .continue-watching, .saturday-night-section').forEach(section => {
                section.style.display = 'block';
            });
            
            // Carregar conteúdo da home se não estiver carregado
            if (document.getElementById('nao-deixe-de-ver-row').children.length === 0) {
                this.loadHomeContent();
            } else {
                // Apenas atualizar lançamentos se já estiver carregado
                this.loadLancamentos2026();
            }
        } else {
            // Esconder sessões especiais
            document.querySelectorAll('.content-section, .continue-watching, .saturday-night-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Mostrar categorias do menu
            this.showPageCategories(page);
        }
    }

    showPageCategories(page) {
        // Implementar lógica para mostrar categorias específicas de cada menu
        const categories = this.getCategoriesForPage(page);
        
        // Limpar conteúdo atual
        const mainContent = document.querySelector('.main-content');
        
        // Manter hero banner
        const hero = mainContent.querySelector('.hero');
        mainContent.innerHTML = '';
        if (hero) {
            mainContent.appendChild(hero);
        }
        
        // Adicionar categorias
        categories.forEach(category => {
            const section = document.createElement('section');
            section.className = 'content-section';
            section.innerHTML = `
                <h2 class="section-title">${category.name}</h2>
                <div class="movie-row" id="${category.id}-row">
                    <!-- Será preenchido -->
                </div>
            `;
            mainContent.appendChild(section);
            
            // Carregar conteúdo da categoria
            this.loadCategoryContent(category.id, category.type);
        });
    }

    getCategoriesForPage(page) {
        const categories = {
            'live-channels': [
                { id: 'canais-ao-vivo', name: 'Canais ao Vivo', type: 'channels' }
            ],
            'cinema': [
                { id: 'acao', name: 'Ação', type: 'movies' },
                { id: 'comedia', name: 'Comédia', type: 'movies' },
                { id: 'drama', name: 'Drama', type: 'movies' },
                { id: 'terror', name: 'Terror', type: 'movies' },
                { id: 'romance', name: 'Romance', type: 'movies' }
            ],
            'series': [
                { id: 'drama-series', name: 'Drama', type: 'series' },
                { id: 'comedia-series', name: 'Comédia', type: 'series' },
                { id: 'sci-fi', name: 'Ficção Científica', type: 'series' },
                { id: 'documentario', name: 'Documentário', type: 'series' },
                { id: 'suspense', name: 'Suspense', type: 'series' }
            ],
            'kids-channels': [
                { id: 'canais-kids', name: 'Canais Kids', type: 'kids-channels' }
            ],
            'kids-movies': [
                { id: 'animacao-infantil', name: 'Animação', type: 'kids-movies' },
                { id: 'aventura-kids', name: 'Aventura', type: 'kids-movies' },
                { id: 'comedia-kids', name: 'Comédia', type: 'kids-movies' }
            ],
            'kids-series': [
                { id: 'series-infantis', name: 'Séries Infantis', type: 'kids-series' },
                { id: 'educativo', name: 'Educativo', type: 'kids-series' },
                { id: 'desenhos', name: 'Desenhos', type: 'kids-series' }
            ],
            'my-list': [
                { id: 'favoritos', name: 'Meus Favoritos', type: 'favorites' }
            ]
        };
        
        return categories[page] || [];
    }

    loadCategoryContent(categoryId, type) {
        const container = document.getElementById(`${categoryId}-row`);
        if (!container) return;
        
        let content = [];
        
        switch(type) {
            case 'movies':
                content = this.data.filmes.filter(item => item.category === categoryId);
                break;
            case 'series':
                content = this.data.series.filter(item => item.category === categoryId);
                break;
            case 'kids-movies':
                content = this.data.kidsFilmes.filter(item => item.category === categoryId);
                break;
            case 'kids-series':
                content = this.data.kidsSeries.filter(item => item.category === categoryId);
                break;
            case 'kids-channels':
                // Carregar canais kids do M3U
                this.loadM3UChannels('data/ativa_kids_canais.m3u', container);
                return;
            case 'channels':
                // Carregar canais ao vivo do M3U
                this.loadM3UChannels('data/ativa_canais.m3u', container);
                return;
            case 'favorites':
                content = this.data.favoritos;
                break;
        }
        
        content.forEach(item => {
            const card = this.createMovieCard(item);
            container.appendChild(card);
        });
    }

    async loadM3UChannels(m3uFile, container) {
        try {
            const response = await fetch(m3uFile);
            const m3uData = await response.text();
            
            // Parse M3U data
            const channels = this.parseM3UData(m3uData);
            
            channels.forEach(channel => {
                const card = this.createChannelCard(channel);
                container.appendChild(card);
            });
        } catch (error) {
            console.error('Erro ao carregar canais M3U:', error);
        }
    }

    parseM3UData(m3uData) {
        const lines = m3uData.split('\n');
        const channels = [];
        let currentChannel = {};
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF:')) {
                // Extrair informações do canal
                const parts = line.split(',');
                const name = parts[parts.length - 1];
                
                currentChannel = {
                    name: name,
                    url: '',
                    logo: '',
                    group: ''
                };
                
                // Extrair outros atributos
                const attributes = line.substring(8, parts.length - name.length - 1);
                const attrMatch = attributes.match(/tvg-logo="([^"]+)"/);
                if (attrMatch) {
                    currentChannel.logo = attrMatch[1];
                }
                
                const groupMatch = attributes.match(/group-title="([^"]+)"/);
                if (groupMatch) {
                    currentChannel.group = groupMatch[1];
                }
            } else if (line && !line.startsWith('#') && currentChannel.name) {
                // URL do canal
                currentChannel.url = line;
                channels.push({...currentChannel});
                currentChannel = {};
            }
        }
        
        return channels;
    }

    createChannelCard(channel) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.tabIndex = 0;
        
        card.innerHTML = `
            <div class="card-thumbnail">
                ${channel.logo ? 
                    `<img src="${channel.logo}" alt="${channel.name}" style="width: 100%; height: 100%; object-fit: cover;">` :
                    `<i class="fas fa-broadcast-tower"></i>`
                }
            </div>
            <h3>${channel.name}</h3>
        `;
        
        card.addEventListener('click', () => this.playChannel(channel));
        return card;
    }

    playChannel(channel) {
        const player = document.getElementById('video-player');
        const video = player.querySelector('video');
        
        // Abrir player
        player.classList.add('active');
        document.body.classList.add('player-open');
        
        // Carregar canal ao vivo
        if (channel.url) {
            video.src = channel.url;
            video.play();
        }
    }

    initSearch() {
        const searchIcon = document.querySelector('[data-page="search"]');
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'search-input';
        searchInput.placeholder = 'Buscar conteúdo...';
        searchInput.style.cssText = `
            position: fixed;
            top: 20px;
            left: 100px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 16px;
            display: none;
            z-index: 1001;
        `;
        
        document.body.appendChild(searchInput);
        
        if (searchIcon) {
            searchIcon.addEventListener('click', () => {
                searchInput.style.display = 'block';
                searchInput.focus();
            });
        }
        
        searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.style.display = 'none';
                searchInput.value = '';
            }
        });
    }

    performSearch(query) {
        if (!query || query.length < 2) return;
        
        const results = this.searchContent(query);
        this.displaySearchResults(results);
    }

    searchContent(query) {
        const allContent = [
            ...this.data.filmes,
            ...this.data.series,
            ...this.data.kidsFilmes,
            ...this.data.kidsSeries
        ];
        
        return allContent.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase())
        );
    }

    displaySearchResults(results) {
        // Implementar exibição de resultados de busca
        console.log('Resultados da busca:', results);
    }

    initVideoPlayer() {
        const player = document.getElementById('video-player');
        const closeBtn = player.querySelector('.close-btn');
        const video = player.querySelector('video');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeVideoPlayer();
            });
        }
        
        // Salvar progresso
        if (video) {
            video.addEventListener('timeupdate', () => {
                const progress = (video.currentTime / video.duration) * 100;
                // Atualizar progresso do conteúdo atual
                // Implementar lógica de salvamento
            });
        }
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && player.classList.contains('active')) {
                this.closeVideoPlayer();
            }
        });
    }

    closeVideoPlayer() {
        const player = document.getElementById('video-player');
        const video = player.querySelector('video');
        
        video.pause();
        player.classList.remove('active');
        document.body.classList.remove('player-open');
        
        // Voltar para detalhes
        document.getElementById('content-modal').classList.add('active');
        document.body.classList.add('modal-open');
    }

    applyTimeBasedVisibility() {
        const saturdaySection = document.querySelector('.saturday-night-section');
        if (!saturdaySection) return;
        
        const now = new Date();
        const day = now.getDay(); // 0 = Domingo, 6 = Sábado
        const hour = now.getHours();
        
        // Visível Sábado 16:59 até Domingo 05:59
        const isVisible = (day === 6 && hour >= 16) || (day === 0 && hour < 6);
        
        saturdaySection.style.display = isVisible ? 'block' : 'none';
    }

    setupEventListeners() {
        // Modal close
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                document.getElementById('content-modal').classList.remove('active');
                document.body.classList.remove('modal-open');
            });
        }
        
        // Verificar visibilidade do sábado a cada minuto
        setInterval(() => {
            this.checkSaturdaySession();
        }, 60000);
        
        // Verificar a cada 30 segundos para maior precisão
        setInterval(() => {
            this.checkSaturdaySession();
        }, 30000);
    }
}

// Serviço TMDB
class TMDBService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.themoviedb.org/3';
    }

    async getMovieDetails(tmdbId) {
        const response = await fetch(`${this.baseUrl}/movie/${tmdbId}?api_key=${this.apiKey}&language=pt-BR`);
        return response.json();
    }

    async getSeriesDetails(tmdbId) {
        const response = await fetch(`${this.baseUrl}/tv/${tmdbId}?api_key=${this.apiKey}&language=pt-BR`);
        return response.json();
    }
}

// Gerenciador de Navegação
class NavigationManager {
    constructor() {
        this.currentFocus = null;
        this.focusableElements = [];
        this.initGamepadSupport();
        this.initKeyboardSupport();
    }

    initGamepadSupport() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad conectado:', e.gamepad);
            this.handleGamepadInput();
        });
    }

    handleGamepadInput() {
        const gamepads = navigator.getGamepads();
        
        if (gamepads[0]) {
            const gamepad = gamepads[0];
            
            // Mapear botões do gamepad para ações
            gamepad.buttons.forEach((button, index) => {
                if (button.pressed) {
                    switch(index) {
                        case 0: // A
                            this.selectFocused();
                            break;
                        case 1: // B
                            this.goBack();
                            break;
                        case 12: // Up
                            this.moveFocus('up');
                            break;
                        case 13: // Down
                            this.moveFocus('down');
                            break;
                        case 14: // Left
                            this.moveFocus('left');
                            break;
                        case 15: // Right
                            this.moveFocus('right');
                            break;
                    }
                }
            });
        }
        
        requestAnimationFrame(() => this.handleGamepadInput());
    }

    initKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    this.moveFocus('up');
                    break;
                case 'ArrowDown':
                    this.moveFocus('down');
                    break;
                case 'ArrowLeft':
                    this.moveFocus('left');
                    break;
                case 'ArrowRight':
                    this.moveFocus('right');
                    break;
                case 'Enter':
                    this.selectFocused();
                    break;
                case 'Escape':
                    this.goBack();
                    break;
            }
        });
    }

    moveFocus(direction) {
        const focused = document.activeElement;
        if (!focused) return;
        
        let nextElement = null;
        
        switch(direction) {
            case 'up':
                nextElement = this.findAbove(focused);
                break;
            case 'down':
                nextElement = this.findBelow(focused);
                break;
            case 'left':
                nextElement = this.findLeft(focused);
                break;
            case 'right':
                nextElement = this.findRight(focused);
                break;
        }
        
        if (nextElement) {
            nextElement.focus();
            nextElement.scrollIntoView({ block: 'center' });
        }
    }

    findAbove(element) {
        // Implementar lógica para encontrar elemento acima
        return null;
    }

    findBelow(element) {
        // Implementar lógica para encontrar elemento abaixo
        return null;
    }

    findLeft(element) {
        // Implementar lógica para encontrar elemento à esquerda
        return null;
    }

    findRight(element) {
        // Implementar lógica para encontrar elemento à direita
        return null;
    }

    selectFocused() {
        const focused = document.activeElement;
        if (focused) {
            focused.click();
        }
    }

    goBack() {
        // Implementar lógica de voltar
        history.back();
    }
}

// Motor de Curadoria
class CuratorEngine {
    constructor(data) {
        this.data = data;
    }

    getDontMiss() {
        // Selecionar conteúdo baseado em popularidade e avaliações
        const allContent = [
            ...this.data.filmes,
            ...this.data.series
        ];
        
        return allContent
            .filter(item => item.rating && item.rating >= 8.0)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 10);
    }

    getAwardWinning() {
        // Selecionar conteúdo premiado
        const allContent = [
            ...this.data.filmes,
            ...this.data.series
        ];
        
        return allContent
            .filter(item => item.awards && item.awards.length > 0)
            .sort((a, b) => (b.awards?.length || 0) - (a.awards?.length || 0))
            .slice(0, 10);
    }

    getNostalgia() {
        // Selecionar conteúdo clássico/retro
        const allContent = [
            ...this.data.filmes,
            ...this.data.series
        ];
        
        return allContent
            .filter(item => item.year && item.year < 2010)
            .sort((a, b) => (a.year || 0) - (b.year || 0))
            .slice(0, 10);
    }

    getMarathonContent() {
        // Selecionar conteúdo ideal para maratona
        const allContent = [
            ...this.data.filmes,
            ...this.data.series
        ];
        
        return allContent
            .filter(item => item.seasons || item.duration === '2h+')
            .slice(0, 10);
    }

    getRecommendations() {
        // Gerar recomendações baseadas no histórico
        const continueWatching = JSON.parse(localStorage.getItem('paixaoflix_continue_watching') || '[]');
        
        if (continueWatching.length === 0) {
            // Se não há histórico, mostrar conteúdo popular
            return this.getDontMiss();
        }
        
        // Analisar gêneros assistidos
        const watchedGenres = continueWatching.map(item => item.genre);
        const favoriteGenres = this.getMostFrequent(watchedGenres);
        
        // Recomendar conteúdo similar
        const allContent = [
            ...this.data.filmes,
            ...this.data.series
        ];
        
        return allContent
            .filter(item => favoriteGenres.includes(item.genre))
            .sort(() => Math.random() - 0.5)
            .slice(0, 10);
    }

    getMostFrequent(arr) {
        const frequency = {};
        arr.forEach(item => {
            frequency[item] = (frequency[item] || 0) + 1;
        });
        
        return Object.keys(frequency)
            .sort((a, b) => frequency[b] - frequency[a])
            .slice(0, 3);
    }
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    const app = new PaixaoFlixApp();
    window.paixaoflix = app; // Disponibilizar globalmente
});
