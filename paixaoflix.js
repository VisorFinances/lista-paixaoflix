// PaixãoFlix Pro Max - HBO Max Edition
class PaixaoFlixApp {
    constructor() {
        this.baseURL = 'https://raw.githubusercontent.com/paixaoflix-mobile/paixaoflix-mobile/main/';
        this.apiKey = 'b275ce8e1a6b3d5d879bb0907e4f56ad';
        
        this.data = {
            filmes: [],
            series: [],
            kidsFilmes: [],
            kidsSeries: [],
            favoritos: [],
            channels: [],
            kidsChannels: []
        };
        
        this.continueWatching = [];
        this.currentPage = 'home';
        this.currentFocusIndex = 0;
        this.focusableElements = [];
        this.currentFeaturedContent = null;
        
        this.categories = [
            'Lançamento 2026', 'Lançamento 2025', 'Ação', 'Aventura', 'Comédia', 
            'Drama', 'Nacional', 'Romance', 'Religioso', 'Ficção', 'Anime', 
            'Animação', 'Família', 'Clássicos', 'Dorama', 'Suspense', 
            'Policial', 'Crime', 'Terror', 'Documentários', 'Faroeste', 
            'Musical', 'Adulto'
        ];
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateDateTime();
        this.updateTitleCount();
        this.loadHomeContent();
        this.checkSaturdayNight();
        this.initNavigation();
        
        setInterval(() => this.updateDateTime(), 1000);
        setInterval(() => this.checkSaturdayNight(), 60000); // Verificar a cada minuto
    }
    
    async loadData() {
        try {
            // Carregar filmes
            const filmesResponse = await fetch(this.baseURL + 'data/filmes.json');
            this.data.filmes = await filmesResponse.json();
            
            // Carregar séries
            const seriesResponse = await fetch(this.baseURL + 'data/series.json');
            this.data.series = await seriesResponse.json();
            
            // Carregar filmes kids
            const kidsFilmesResponse = await fetch(this.baseURL + 'data/kids_filmes.json');
            this.data.kidsFilmes = await kidsFilmesResponse.json();
            
            // Carregar séries kids
            const kidsSeriesResponse = await fetch(this.baseURL + 'data/kids_series.json');
            this.data.kidsSeries = await kidsSeriesResponse.json();
            
            // Carregar canais
            const channelsResponse = await fetch(this.baseURL + 'data/ativa_canais.m3u');
            const channelsText = await channelsResponse.text();
            this.data.channels = this.parseM3U(channelsText);
            
            // Carregar canais kids
            const kidsChannelsResponse = await fetch(this.baseURL + 'data/ativa_kids_canais.m3u');
            const kidsChannelsText = await kidsChannelsResponse.text();
            this.data.kidsChannels = this.parseM3U(kidsChannelsText);
            
            // Carregar favoritos do localStorage
            const favoritos = localStorage.getItem('paixaoflix_favorites');
            if (favoritos) {
                this.data.favoritos = JSON.parse(favoritos);
            }
            
            // Carregar continuar assistindo
            const continueWatching = localStorage.getItem('paixaoflix_continue_watching');
            if (continueWatching) {
                this.continueWatching = JSON.parse(continueWatching);
            }
            
            console.log('Dados carregados com sucesso:', this.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }
    
    parseM3U(m3uText) {
        const lines = m3uText.split('\n');
        const channels = [];
        let currentChannel = {};
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF:')) {
                const parts = line.split(',');
                const namePart = parts[parts.length - 1];
                currentChannel.name = namePart.trim();
                
                // Extrair logo
                const logoMatch = line.match(/tvg-logo="([^"]*)"/);
                if (logoMatch) {
                    currentChannel.logo = logoMatch[1];
                }
            } else if (line && !line.startsWith('#')) {
                currentChannel.url = line.trim();
                channels.push({...currentChannel});
                currentChannel = {};
            }
        }
        
        return channels;
    }
    
    setupEventListeners() {
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.showPage(page);
            });
        });
        
        // Hero buttons
        document.getElementById('play-hero').addEventListener('click', () => {
            this.playFeaturedContent();
        });
        
        document.getElementById('info-hero').addEventListener('click', () => {
            this.showFeaturedInfo();
        });
        
        // Modal close
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Player close
        document.getElementById('player-close').addEventListener('click', () => {
            this.closePlayer();
        });
        
        // Search
        document.getElementById('search-clear-btn').addEventListener('click', () => {
            document.getElementById('search-input').value = '';
            document.getElementById('search-results-row').innerHTML = '';
            document.getElementById('search-empty').style.display = 'none';
        });
        
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });
    }
    
    updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const dateTimeString = now.toLocaleDateString('pt-BR', options);
        document.getElementById('date-time').textContent = dateTimeString;
    }
    
    updateTitleCount() {
        const totalContent = this.data.filmes.length + this.data.series.length + 
                           this.data.kidsFilmes.length + this.data.kidsSeries.length;
        document.getElementById('title-count').textContent = `${totalContent} Títulos Disponíveis`;
    }
    
    async loadHomeContent() {
        // Carregar continuar assistindo
        this.loadContinueWatching();
        
        // Carregar minha lista
        this.loadMyList();
        
        // Carregar lançamentos 2026
        this.loadCategory('lancamentos-2026-row', 'Lançamento 2026');
        
        // Carregar lançamentos 2025
        this.loadCategory('lancamentos-2025-row', 'Lançamento 2025');
        
        // Carregar outras categorias
        this.loadCategory('acao-row', 'Ação');
        this.loadCategory('comedia-row', 'Comédia');
        this.loadCategory('drama-row', 'Drama');
        this.loadCategory('nacional-row', 'Nacional');
        
        // Carregar banner hero
        await this.loadHeroBanner();
    }
    
    loadContinueWatching() {
        const container = document.getElementById('continue-watching-row');
        container.innerHTML = '';
        
        if (this.continueWatching.length === 0) {
            container.parentElement.style.display = 'none';
            return;
        }
        
        container.parentElement.style.display = 'block';
        this.continueWatching.forEach(item => {
            const card = this.createMovieCard(item, true);
            container.appendChild(card);
        });
    }
    
    loadMyList() {
        const container = document.getElementById('my-list-row');
        container.innerHTML = '';
        
        if (this.data.favoritos.length === 0) {
            container.parentElement.style.display = 'none';
            return;
        }
        
        container.parentElement.style.display = 'block';
        this.data.favoritos.forEach(item => {
            const card = this.createMovieCard(item);
            container.appendChild(card);
        });
    }
    
    loadCategory(containerId, category) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        // Combinar filmes e séries
        const allContent = [...this.data.filmes, ...this.data.series];
        const filtered = allContent.filter(item => {
            const itemCategories = item.categories || [];
            return itemCategories.includes(category);
        });
        
        if (filtered.length === 0) {
            container.parentElement.style.display = 'none';
            return;
        }
        
        container.parentElement.style.display = 'block';
        
        // Criar loop infinito
        const loopContainer = document.createElement('div');
        loopContainer.className = 'loop-container';
        
        // Clonar conteúdo múltiplas vezes
        for (let i = 0; i < 3; i++) {
            filtered.forEach(item => {
                const card = this.createMovieCard(item);
                loopContainer.appendChild(card);
            });
        }
        
        container.appendChild(loopContainer);
    }
    
    createMovieCard(item, showProgress = false) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.tabIndex = 0;
        
        const thumbnail = item.thumbnail || item.poster || 'https://via.placeholder.com/200x112/1a1a1a/ffffff?text=Sem+Imagem';
        
        card.innerHTML = `
            <img src="${thumbnail}" alt="${item.title}" loading="lazy">
            ${showProgress && item.progress ? `
                <div class="progress-overlay">
                    <div class="progress-bar" style="width: ${item.progress}%"></div>
                </div>
            ` : ''}
        `;
        
        card.addEventListener('click', () => {
            this.showContentDetails(item);
        });
        
        // Lazy loading
        const img = card.querySelector('img');
        img.addEventListener('load', () => {
            img.classList.add('loaded');
        });
        
        return card;
    }
    
    async loadHeroBanner() {
        try {
            // Buscar filme aleatório do TMDB
            const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${this.apiKey}&language=pt-BR&page=${Math.floor(Math.random() * 10) + 1}`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const movie = data.results[Math.floor(Math.random() * data.results.length)];
                
                const heroBackground = document.getElementById('hero-background');
                const heroTitle = document.getElementById('hero-title');
                const heroDescription = document.getElementById('hero-description');
                
                if (movie.backdrop_path) {
                    heroBackground.style.backgroundImage = `url(https://image.tmdb.org/t/p/w1280${movie.backdrop_path})`;
                }
                
                heroTitle.textContent = movie.title;
                heroDescription.textContent = movie.overview ? 
                    movie.overview.substring(0, 200) + '...' : 
                    'Filme em destaque no PaixãoFlix Pro Max';
                
                this.currentFeaturedContent = {
                    title: movie.title,
                    description: movie.overview,
                    backdrop: `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`,
                    rating: movie.vote_average
                };
            }
        } catch (error) {
            console.error('Erro ao carregar banner:', error);
        }
    }
    
    playFeaturedContent() {
        if (this.currentFeaturedContent) {
            // Buscar conteúdo correspondente nos dados
            const allContent = [...this.data.filmes, ...this.data.series];
            const content = allContent.find(item => item.title === this.currentFeaturedContent.title);
            
            if (content) {
                this.playContent(content);
            }
        }
    }
    
    showFeaturedInfo() {
        if (this.currentFeaturedContent) {
            this.showModal(this.currentFeaturedContent);
        }
    }
    
    showContentDetails(item) {
        this.showModal(item);
    }
    
    showModal(item) {
        const modal = document.getElementById('content-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalDescription = document.getElementById('modal-description');
        const modalPoster = document.getElementById('modal-poster');
        const modalYear = document.getElementById('modal-year');
        const modalGenre = document.getElementById('modal-genre');
        const modalRating = document.getElementById('modal-rating');
        const modalDuration = document.getElementById('modal-duration');
        const modalActions = document.getElementById('modal-actions');
        
        // Preencher modal
        modalTitle.textContent = item.title;
        modalDescription.textContent = item.description || 'Descrição não disponível';
        modalYear.textContent = item.year || '2024';
        modalGenre.textContent = Array.isArray(item.genre) ? item.genre.join(', ') : (item.genre || 'Drama');
        modalRating.textContent = item.rating ? `⭐ ${item.rating}` : '⭐ 8.0';
        modalDuration.textContent = item.duration || '2h';
        
        const poster = modalPoster.querySelector('img');
        poster.src = item.poster || item.thumbnail || 'https://via.placeholder.com/200x300/1a1a1a/ffffff?text=Sem+Imagem';
        
        // Limpar ações
        modalActions.innerHTML = '';
        
        // Botão assistir
        const playBtn = document.createElement('button');
        playBtn.className = 'btn-primary';
        playBtn.innerHTML = '<i class="fas fa-play"></i> Assistir Agora';
        playBtn.addEventListener('click', () => this.playContent(item));
        modalActions.appendChild(playBtn);
        
        // Botão trailer (se existir)
        if (item.trailer && item.trailer.trim() !== '') {
            const trailerBtn = document.createElement('button');
            trailerBtn.className = 'btn-secondary';
            trailerBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Assistir Trailer';
            trailerBtn.addEventListener('click', () => {
                window.open(item.trailer, '_blank');
            });
            modalActions.appendChild(trailerBtn);
        }
        
        // Botão minha lista
        const isInList = this.data.favoritos.some(fav => fav.id === item.id);
        const listBtn = document.createElement('button');
        listBtn.className = 'btn-secondary';
        listBtn.innerHTML = isInList ? 
            '<i class="fas fa-check"></i> Remover da Lista' : 
            '<i class="fas fa-heart"></i> Minha Lista';
        listBtn.addEventListener('click', () => this.toggleMyList(item, listBtn));
        modalActions.appendChild(listBtn);
        
        // Mostrar modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        const modal = document.getElementById('content-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    playContent(item) {
        const player = document.getElementById('video-player');
        const video = document.getElementById('video-element');
        
        // Adicionar ao continuar assistindo
        this.addToContinueWatching(item);
        
        // Configurar vídeo
        if (item.url) {
            video.src = item.url;
        } else if (item.identificador_archive) {
            // Buscar episódios do Archive.org
            this.loadArchiveEpisodes(item);
            return;
        } else {
            console.error('URL de vídeo não encontrada para:', item);
            return;
        }
        
        // Mostrar player
        player.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Reproduzir
        video.play();
        
        // Salvar progresso
        this.setupProgressSaving(item, video);
    }
    
    async loadArchiveEpisodes(item) {
        try {
            const response = await fetch(`https://archive.org/metadata/${item.identificador_archive}`);
            const metadata = await response.json();
            
            if (metadata.files) {
                const episodes = metadata.files.filter(file => 
                    file.name.endsWith('.mp4') && !file.name.includes('preview')
                );
                
                if (episodes.length > 0) {
                    // Reproduzir primeiro episódio
                    const video = document.getElementById('video-element');
                    video.src = `https://archive.org/download/${item.identificador_archive}/${episodes[0].name}`;
                    
                    const player = document.getElementById('video-player');
                    player.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    
                    video.play();
                    this.setupProgressSaving(item, video);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar episódios:', error);
        }
    }
    
    setupProgressSaving(item, video) {
        const saveProgress = () => {
            if (video.duration) {
                const progress = (video.currentTime / video.duration) * 100;
                
                // Atualizar no continuar assistindo
                const existingIndex = this.continueWatching.findIndex(i => i.id === item.id);
                if (existingIndex !== -1) {
                    this.continueWatching[existingIndex].progress = Math.round(progress);
                    this.continueWatching[existingIndex].currentTime = video.currentTime;
                }
                
                localStorage.setItem('paixaoflix_continue_watching', JSON.stringify(this.continueWatching));
            }
        };
        
        // Salvar progresso a cada 5 segundos
        const progressInterval = setInterval(saveProgress, 5000);
        
        video.addEventListener('ended', () => {
            clearInterval(progressInterval);
            // Remover do continuar assistindo quando terminar
            this.continueWatching = this.continueWatching.filter(i => i.id !== item.id);
            localStorage.setItem('paixaoflix_continue_watching', JSON.stringify(this.continueWatching));
        });
        
        video.addEventListener('pause', () => {
            saveProgress();
        });
    }
    
    addToContinueWatching(item) {
        const existingIndex = this.continueWatching.findIndex(i => i.id === item.id);
        
        if (existingIndex !== -1) {
            this.continueWatching[existingIndex].lastWatched = new Date().toISOString();
        } else {
            this.continueWatching.push({
                ...item,
                lastWatched: new Date().toISOString(),
                progress: 0,
                currentTime: 0
            });
        }
        
        // Manter apenas os 10 mais recentes
        this.continueWatching.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
        this.continueWatching = this.continueWatching.slice(0, 10);
        
        localStorage.setItem('paixaoflix_continue_watching', JSON.stringify(this.continueWatching));
    }
    
    toggleMyList(item, button) {
        const index = this.data.favoritos.findIndex(fav => fav.id === item.id);
        
        if (index === -1) {
            this.data.favoritos.push(item);
            button.innerHTML = '<i class="fas fa-check"></i> Remover da Lista';
        } else {
            this.data.favoritos.splice(index, 1);
            button.innerHTML = '<i class="fas fa-heart"></i> Minha Lista';
        }
        
        localStorage.setItem('paixaoflix_favorites', JSON.stringify(this.data.favoritos));
        
        // Atualizar se estiver na home
        if (this.currentPage === 'home') {
            this.loadMyList();
        }
    }
    
    closePlayer() {
        const player = document.getElementById('video-player');
        const video = document.getElementById('video-element');
        
        video.pause();
        video.src = '';
        player.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    showPage(page) {
        this.currentPage = page;
        
        // Esconder todas as seções
        document.querySelectorAll('.content-section, .search-section, .saturday-night-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Limpar conteúdo principal
        const mainContent = document.querySelector('.main-content');
        const sectionsToKeep = ['hero'];
        mainContent.childNodes.forEach(node => {
            if (node.nodeType === 1 && !sectionsToKeep.includes(node.id)) {
                node.remove();
            }
        });
        
        if (page === 'home') {
            this.loadHomeContent();
        } else if (page === 'search') {
            document.getElementById('search-section').style.display = 'block';
            document.getElementById('search-input').focus();
        } else if (page === 'live-channels') {
            this.loadChannels();
        } else if (page === 'cinema') {
            this.loadCinemaPage();
        } else if (page === 'series') {
            this.loadSeriesPage();
        } else if (page === 'kids-movies') {
            this.loadKidsMovies();
        } else if (page === 'kids-series') {
            this.loadKidsSeries();
        } else if (page === 'kids-channels') {
            this.loadKidsChannels();
        } else if (page === 'my-list') {
            this.loadMyListPage();
        }
        
        this.updateFocusableElements();
    }
    
    loadChannels() {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="content-section">
                <h2 class="section-title">Canais ao Vivo</h2>
                <div class="movie-row" id="channels-row"></div>
            </div>
        `;
        
        const container = document.getElementById('channels-row');
        this.data.channels.forEach(channel => {
            const card = this.createChannelCard(channel);
            container.appendChild(card);
        });
    }
    
    loadKidsChannels() {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="content-section">
                <h2 class="section-title">Canais Kids</h2>
                <div class="movie-row" id="kids-channels-row"></div>
            </div>
        `;
        
        const container = document.getElementById('kids-channels-row');
        this.data.kidsChannels.forEach(channel => {
            const card = this.createChannelCard(channel);
            container.appendChild(card);
        });
    }
    
    createChannelCard(channel) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.tabIndex = 0;
        
        const logo = channel.logo || 'https://via.placeholder.com/200x112/1a1a1a/ffffff?text=Canal';
        
        card.innerHTML = `
            <img src="${logo}" alt="${channel.name}" loading="lazy">
        `;
        
        card.addEventListener('click', () => {
            this.playChannel(channel);
        });
        
        return card;
    }
    
    playChannel(channel) {
        const player = document.getElementById('video-player');
        const video = document.getElementById('video-element');
        
        video.src = channel.url;
        player.classList.add('active');
        document.body.style.overflow = 'hidden';
        video.play();
    }
    
    loadCinemaPage() {
        this.loadCategoryPage('Cinema', this.data.filmes);
    }
    
    loadSeriesPage() {
        this.loadCategoryPage('Séries', this.data.series);
    }
    
    loadKidsMovies() {
        const filteredMovies = this.data.kidsFilmes.filter(movie => {
            const categories = movie.categories || [];
            return !categories.includes('Adulto');
        });
        this.loadCategoryPage('Filmes Kids', filteredMovies);
    }
    
    loadKidsSeries() {
        const filteredSeries = this.data.kidsSeries.filter(serie => {
            const categories = serie.categories || [];
            return !categories.includes('Adulto');
        });
        this.loadCategoryPage('Séries Kids', filteredSeries);
    }
    
    loadMyListPage() {
        this.loadCategoryPage('Minha Lista', this.data.favoritos);
    }
    
    loadCategoryPage(title, content) {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="content-section">
                <h2 class="section-title">${title}</h2>
                <div class="movie-row" id="category-content"></div>
            </div>
        `;
        
        const container = document.getElementById('category-content');
        content.forEach(item => {
            const card = this.createMovieCard(item);
            container.appendChild(card);
        });
    }
    
    performSearch(query) {
        const resultsRow = document.getElementById('search-results-row');
        const loading = document.getElementById('search-loading');
        const empty = document.getElementById('search-empty');
        
        // Limpar resultados anteriores
        resultsRow.innerHTML = '';
        loading.style.display = 'none';
        empty.style.display = 'none';
        
        if (!query || query.trim().length < 2) {
            return;
        }
        
        loading.style.display = 'block';
        
        setTimeout(() => {
            loading.style.display = 'none';
            
            // Buscar em todos os dados
            const allContent = [
                ...this.data.filmes,
                ...this.data.series,
                ...this.data.kidsFilmes,
                ...this.data.kidsSeries
            ];
            
            const searchTerm = query.toLowerCase().trim();
            
            const results = allContent.filter(item => {
                return item.title && item.title.toLowerCase().includes(searchTerm) ||
                       item.description && item.description.toLowerCase().includes(searchTerm) ||
                       (Array.isArray(item.genre) ? item.genre.join(' ').toLowerCase() : item.genre).includes(searchTerm) ||
                       item.year && item.year.toString().includes(searchTerm);
            });
            
            if (results.length === 0) {
                empty.style.display = 'block';
            } else {
                results.slice(0, 20).forEach(item => {
                    const card = this.createMovieCard(item);
                    resultsRow.appendChild(card);
                });
            }
        }, 300);
    }
    
    checkSaturdayNight() {
        const now = new Date();
        const day = now.getDay(); // 0 = Domingo, 6 = Sábado
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        const isSaturdayNight = (day === 6 && hour >= 16 && minute >= 59) || 
                              (day === 0 && hour < 12 && minute < 1);
        
        const saturdaySection = document.getElementById('saturday-section');
        
        if (isSaturdayNight && saturdaySection) {
            saturdaySection.style.display = 'block';
            this.loadSaturdayNightContent();
        } else if (saturdaySection) {
            saturdaySection.style.display = 'none';
        }
    }
    
    loadSaturdayNightContent() {
        const container = document.getElementById('saturday-night-row');
        if (!container || container.children.length > 0) return;
        
        // Buscar 1 série, 1 romance e 1 comédia
        const allContent = [...this.data.filmes, ...this.data.series];
        
        const series = allContent.filter(item => {
            const categories = item.categories || [];
            return categories.includes('Série') || item.type === 'series';
        });
        
        const romance = allContent.filter(item => {
            const categories = item.categories || [];
            return categories.includes('Romance');
        });
        
        const comedy = allContent.filter(item => {
            const categories = item.categories || [];
            return categories.includes('Comédia');
        });
        
        const selectedContent = [
            series[Math.floor(Math.random() * series.length)] || series[0],
            romance[Math.floor(Math.random() * romance.length)] || romance[0],
            comedy[Math.floor(Math.random() * comedy.length)] || comedy[0]
        ].filter(Boolean);
        
        selectedContent.forEach(item => {
            const card = this.createMovieCard(item);
            container.appendChild(card);
        });
    }
    
    initNavigation() {
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key)) {
                e.preventDefault();
                this.handleNavigation(e.key);
            }
        });
        
        this.updateFocusableElements();
    }
    
    updateFocusableElements() {
        this.focusableElements = Array.from(document.querySelectorAll(
            '.movie-card, .menu-link, button, input'
        )).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   el.offsetParent !== null;
        });
    }
    
    handleNavigation(key) {
        const focused = document.activeElement;
        const currentIndex = this.focusableElements.indexOf(focused);
        
        if (key === 'Escape') {
            if (document.getElementById('video-player').classList.contains('active')) {
                this.closePlayer();
            } else if (document.getElementById('content-modal').classList.contains('active')) {
                this.closeModal();
            } else {
                this.showPage('home');
            }
            return;
        }
        
        if (key === 'Enter' && focused) {
            focused.click();
            return;
        }
        
        let nextIndex = currentIndex;
        
        if (key === 'ArrowRight') {
            nextIndex = currentIndex < this.focusableElements.length - 1 ? currentIndex + 1 : 0;
        } else if (key === 'ArrowLeft') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : this.focusableElements.length - 1;
        } else if (key === 'ArrowDown' || key === 'ArrowUp') {
            // Navegação vertical (simplificada)
            const currentRect = focused.getBoundingClientRect();
            const candidates = [];
            
            this.focusableElements.forEach((element, index) => {
                if (index === currentIndex) return;
                
                const rect = element.getBoundingClientRect();
                const isBelow = key === 'ArrowDown' ? rect.top > currentRect.bottom : rect.bottom < currentRect.top;
                const isAligned = Math.abs(rect.left - currentRect.left) < 200;
                
                if (isBelow && isAligned) {
                    const distance = Math.abs(rect.top - currentRect.top);
                    candidates.push({ element, index, distance });
                }
            });
            
            if (candidates.length > 0) {
                candidates.sort((a, b) => a.distance - b.distance);
                nextIndex = candidates[0].index;
            }
        }
        
        if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < this.focusableElements.length) {
            this.focusableElements[nextIndex].focus();
        }
    }
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    const app = new PaixaoFlixApp();
    window.paixaoflix = app;
});
