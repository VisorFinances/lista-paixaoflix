// PaixãoFlix - Sistema Completo de Streaming
// Variável global para acesso via console
let listaFilmes = [];

class PaixaoFlixApp {
    constructor() {
        this.currentPage = 'home';
        this.data = {
            filmes: [],
            series: [],
            kidsFilmes: [],
            kidsSeries: [],
            favoritos: [],
            channels: [],
            kidsChannels: []
        };
        this.lastWatched = null;
        this.continueWatching = [];
        this.favorites = [];
        this.currentFocusIndex = 0;
        this.focusableElements = [];
        this.navigationManager = null;
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando PaixãoFlix...');
        
        await this.loadData();
        console.log('📁 Dados carregados, inicializando componentes...');
        
        this.initNavigation();
        this.initSearch();
        this.initVideoPlayer();
        this.setupEventListeners();
        this.initTMDB();
        
        // Inicializar data e hora
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000); // Atualizar a cada minuto
        
        // Garantir que home seja a página inicial
        console.log('🏠 Exibindo página inicial...');
        this.showPage('home');
        
        // Iniciar foco no primeiro elemento
        console.log('🎯 Configurando foco inicial...');
        this.setInitialFocus();
        
        console.log('✅ PaixãoFlix inicializado com sucesso!');
    }

    setInitialFocus() {
        // Focar no primeiro card da home após carregar
        setTimeout(() => {
            const firstCard = document.querySelector('.movie-row .movie-card, .infinite-row .wide-card');
            if (firstCard) {
                firstCard.focus();
                console.log('🎯 Foco inicial no primeiro card');
            }
        }, 1000);
    }

    updateTitleCount() {
        const totalTitles = this.data.filmes.length + this.data.series.length;
        const countElement = document.getElementById('title-count');
        if (countElement) {
            countElement.textContent = `${totalTitles.toLocaleString('pt-BR')} Títulos Disponíveis`;
        }
    }

    updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateStr = now.toLocaleDateString('pt-BR', options);
        const timeStr = now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const dateTimeElement = document.getElementById('date-time');
        if (dateTimeElement) {
            dateTimeElement.textContent = `${dateStr} - ${timeStr}`;
        }
    }

    async loadData() {
        try {
            console.log('Carregando dados...');
            
            const [filmes, series, kidsFilmes, kidsSeries, favoritos] = await Promise.all([
                fetch('data/filmes.json').then(r => {
                    console.log('Filmes carregados:', r.status);
                    return r.json();
                }).catch(err => {
                    console.error('Erro ao carregar filmes:', err);
                    return [];
                }),
                fetch('data/series.json').then(r => {
                    console.log('Séries carregadas:', r.status);
                    return r.json();
                }).catch(err => {
                    console.error('Erro ao carregar séries:', err);
                    return [];
                }),
                fetch('data/kids_filmes.json').then(r => {
                    console.log('Filmes kids carregados:', r.status);
                    return r.json();
                }).catch(err => {
                    console.error('Erro ao carregar filmes kids:', err);
                    return [];
                }),
                fetch('data/kids_series.json').then(r => {
                    console.log('Séries kids carregadas:', r.status);
                    return r.json();
                }).catch(err => {
                    console.error('Erro ao carregar séries kids:', err);
                    return [];
                }),
                fetch('data/favoritos.json').then(r => {
                    console.log('Favoritos carregados:', r.status);
                    return r.json();
                }).catch(err => {
                    console.error('Erro ao carregar favoritos:', err);
                    return [];
                })
            ]);

            // Garantir que todos sejam arrays
            this.data.filmes = Array.isArray(filmes.movies) ? filmes.movies : Array.isArray(filmes) ? filmes : [];
            this.data.series = Array.isArray(series.series) ? series.series : Array.isArray(series) ? series : [];
            this.data.kidsFilmes = Array.isArray(kidsFilmes.movies) ? kidsFilmes.movies : Array.isArray(kidsFilmes) ? kidsFilmes : [];
            this.data.kidsSeries = Array.isArray(kidsSeries.series) ? kidsSeries.series : Array.isArray(kidsSeries) ? kidsSeries : [];
            this.data.favoritos = Array.isArray(favoritos) ? favoritos : [];
            
            // Carregar canais M3U
            await this.loadChannels();
            
            console.log('Dados carregados:', this.data);
            
            // Atualizar variável global para acesso via console
            listaFilmes = this.data.filmes;
            
            // Atualizar contador de títulos
            this.updateTitleCount();
            
            return true;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            // Fallback para arrays vazios
            this.data.filmes = [];
            this.data.series = [];
            this.data.kidsFilmes = [];
            this.data.kidsSeries = [];
            this.data.favoritos = [];
            this.data.channels = [];
            this.data.kidsChannels = [];
            return false;
        }
    }
        async loadChannels() {
        try {
            // Carregar canais normais
            const channelsResponse = await fetch('data/ativa_canais.m3u');
            const channelsText = await channelsResponse.text();
            this.data.channels = this.parseM3U(channelsText);
            
            // Carregar canais kids
            const kidsChannelsResponse = await fetch('data/ativa_kids_canais.m3u');
            const kidsChannelsText = await kidsChannelsResponse.text();
            this.data.kidsChannels = this.parseM3U(kidsChannelsText);
            
            console.log(`📺 Carregados ${this.data.channels.length} canais e ${this.data.kidsChannels.length} canais kids`);
        } catch (error) {
            console.error('Erro ao carregar canais:', error);
            this.data.channels = [];
            this.data.kidsChannels = [];
        }
    }

    parseM3U(m3uText) {
        const channels = [];
        const lines = m3uText.split('\n');
        let currentChannel = {};
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF:')) {
                // Extrair informações do canal
                const nameMatch = line.match(/,(.+)$/);
                const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                
                currentChannel = {
                    name: nameMatch ? nameMatch[1] : 'Canal Sem Nome',
                    logo: logoMatch ? logoMatch[1] : null,
                    url: null
                };
            } else if (line && !line.startsWith('#') && currentChannel.name) {
                // URL do stream
                currentChannel.url = line;
                channels.push({...currentChannel});
                currentChannel = {};
            }
        }
        
        return channels;
    }

    updateFocusableElements() {
        // Atualizar array de elementos focáveis
        this.focusableElements = Array.from(document.querySelectorAll(
            '.movie-card, .wide-card, .menu-link, .channel-card, .search-result-item, button, input'
        )).filter(el => {
            // Verificar se elemento está visível
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   el.offsetParent !== null;
        });
        
        console.log(`🎯 Atualizados ${this.focusableElements.length} elementos focáveis`);
    }

    navigateWithArrows(direction) {
        if (this.focusableElements.length === 0) return;
        
        const currentElement = document.activeElement;
        const currentIndex = this.focusableElements.indexOf(currentElement);
        
        let nextIndex = currentIndex;
        
        switch(direction) {
            case 'ArrowRight':
                nextIndex = (currentIndex + 1) % this.focusableElements.length;
                break;
            case 'ArrowLeft':
                nextIndex = currentIndex === 0 ? this.focusableElements.length - 1 : currentIndex - 1;
                break;
            case 'ArrowDown':
                // Lógica para navegar para baixo (próxima linha)
                nextIndex = Math.min(currentIndex + 6, this.focusableElements.length - 1);
                break;
            case 'ArrowUp':
                // Lógica para navegar para cima (linha anterior)
                nextIndex = Math.max(currentIndex - 6, 0);
                break;
        }
        
        if (nextIndex !== currentIndex && this.focusableElements[nextIndex]) {
            this.focusableElements[nextIndex].focus();
            this.currentFocusIndex = nextIndex;
            
            // Scroll para elemento se necessário
            this.focusableElements[nextIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }

    async initTMDB() {
        console.log('🎬 Inicializando TMDB...');
        
        // Carregar banner rotativo
        await this.loadRotatingBanner();
        
        // Configurar rotação automática a cada 10 segundos
        setInterval(() => {
            this.loadRotatingBanner();
        }, 10000);
    }

    async loadRotatingBanner() {
        try {
            // Buscar filmes populares para o banner
            const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=b275ce8e1a6b3d5d879bb0907e4f56ad&language=pt-BR&page=${Math.floor(Math.random() * 5) + 1}`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                // Selecionar filme aleatório
                const movie = data.results[Math.floor(Math.random() * data.results.length)];
                
                // Atualizar banner
                const heroBanner = document.querySelector('.hero-background');
                const heroTitle = document.querySelector('.hero-title');
                const heroDescription = document.querySelector('.hero-description');
                
                if (heroBanner && movie.backdrop_path) {
                    heroBanner.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`;
                    heroBanner.style.backgroundSize = 'cover';
                    heroBanner.style.backgroundPosition = 'center';
                    heroBanner.style.transition = 'background-image 1s ease-in-out';
                }
                
                if (heroTitle) {
                    heroTitle.textContent = movie.title;
                }
                
                if (heroDescription) {
                    heroDescription.textContent = movie.overview ? 
                        movie.overview.substring(0, 200) + '...' : 
                        'Filme em destaque no PaixãoFlix';
                }
                
                console.log('🎬 Banner atualizado:', movie.title);
            }
        } catch (error) {
            console.error('Erro ao carregar banner TMDB:', error);
        }
    }

    loadHomeContent() {
        console.log('🏠 Iniciando carregamento do conteúdo da home...');
        
        // Verificar se elementos existem
        const requiredElements = [
            'nao-deixe-de-ver-row',
            'continue-watching-row', 
            'my-list-row',
            'premiados-pela-midia-row',
            'nostalgia-row',
            'kids-row',
            'maratonar-row',
            'recomendacoes-row'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.warn('⚠️ Elementos faltando:', missingElements);
            return;
        }
        
        // Verificar e inserir sessão de sábado dinamicamente
        this.checkSaturdaySession();
        
        // 1. Não deixe de ver (primeira sessão) - 5 capas mais vistas
        console.log('📺 Carregando "Não deixe de ver"...');
        this.loadMostViewed();
        
        // 2. Continuar Assistindo
        console.log('▶️ Carregando "Continuar Assistindo"...');
        this.loadContinueWatching();
        
        // 3. Minha Lista (segunda sessão)
        console.log('❤️ Carregando "Minha Lista"...');
        this.loadMyList();
        
        // 4. Sábado à Noite (será inserido dinamicamente se necessário)
        
        // 5. Premiados pela mídia - 5 capas com loop infinito
        console.log('🏆 Carregando "Premiados pela mídia"...');
        this.loadAwardWinning();
        
        // 6. Nostalgia - 5 capas
        console.log('🕰️ Carregando "Nostalgia"...');
        this.loadNostalgiaContent();
        
        // 7. Kids - 5 capas
        console.log('👶 Carregando "As crianças amam"...');
        this.loadKids();
        
        // 8. Maratonar - 5 capas
        console.log('🍿 Carregando "Prepare a pipoca"...');
        this.loadMarathon();
        
        // 9. Porque você assistiu - 4 capas baseadas no último assistido
        console.log('🎯 Carregando "Porque você assistiu"...');
        this.loadRecommendations();
        
        // 10. Novela (última sessão)
        console.log('📺 Carregando "Novela"...');
        this.loadNovelas();
        
        console.log('✅ Conteúdo da home carregado com sucesso!');
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
            const minutes = now.getMinutes();
            
            // Verificar se é horário de exibir (Sáb 16:59 - Dom 05:59)
            // Hoje é Sábado, 07/02/2026, 10:30 - deve estar OCULTO
            shouldShow = (day === 6 && hour >= 16 && minutes >= 59) || (day === 0 && hour < 6);
            
            console.log(`📅 Verificação Sábado: Dia=${day}, Hora=${hour}:${minutes}, DeveMostrar=${shouldShow}`);
        }
        
        const saturdaySection = document.querySelector('.saturday-night-section');
        const mainContent = document.querySelector('.main-content');
        
        if (shouldShow && !saturdaySection) {
            // Inserir sessão na terceira posição
            this.insertSaturdaySection();
            console.log('✅ Sessão Sábado à Noite Merece adicionada');
        } else if (!shouldShow && saturdaySection) {
            // Remover sessão
            saturdaySection.remove();
            console.log('❌ Sessão Sábado à Noite Merece removida');
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

    loadNovelas() {
        const container = document.querySelector('.novela-section .infinite-row');
        const section = document.querySelector('.novela-section');
        
        if (!container || !section) {
            console.warn('⚠️ Container de novelas não encontrado');
            return;
        }

        // Buscar conteúdo de novela em todos os JSONs
        let novelas = [];
        
        // Procurar em filmes
        const filmesNovela = this.data.filmes.filter(item => 
            item.category === 'Novela' || 
            item.genre === 'Novela' ||
            (item.genero && item.genero.includes('Novela'))
        );
        
        // Procurar em séries
        const seriesNovela = this.data.series.filter(item => 
            item.category === 'Novela' || 
            item.genre === 'Novela' ||
            (item.genero && item.genero.includes('Novela'))
        );
        
        novelas = [...filmesNovela, ...seriesNovela];
        
        if (novelas.length === 0) {
            console.warn('⚠️ Nenhuma novela encontrada nos dados - removendo seção');
            section.remove();
            return;
        }
        
        console.log(`📺 Carregando ${novelas.length} novelas`);
        
        // Embaralhar e limitar
        const selected = novelas.sort(() => Math.random() - 0.5).slice(0, 10);
        
        container.innerHTML = '';
        
        selected.forEach(item => {
            const card = this.createWideCard(item);
            container.appendChild(card);
        });
        
        // Configurar loop infinito
        this.setupInfiniteLoop(container);
    }

    loadNostalgiaContent() {
        const container = document.getElementById('nostalgia-row');
        if (!container) return;

        // Filtrar conteúdo clássico/retro (antes de 2010)
        const allContent = [...this.data.filmes, ...this.data.series];
        const nostalgia = allContent.filter(item => {
            const year = parseInt(item.year) || 2024;
            return year < 2010;
        });
        
        if (nostalgia.length === 0) {
            console.warn('⚠️ Nenhum conteúdo nostálgico encontrado - tentando filtro alternativo');
            // Tentar filtro alternativo por genre/category
            const nostalgiaAlt = allContent.filter(item => 
                item.genre === 'Clássicos' || 
                item.category === 'Clássicos' ||
                (item.genero && item.genero.includes('Clássicos'))
            );
            
            if (nostalgiaAlt.length > 0) {
                console.log(`🕰️ Encontrados ${nostalgiaAlt.length} itens nostálgicos via filtro alternativo`);
                const selected = nostalgiaAlt.sort(() => Math.random() - 0.5).slice(0, 5);
                container.innerHTML = '';
                selected.forEach(item => {
                    const card = this.createMovieCard(item);
                    container.appendChild(card);
                });
                return;
            }
            
            container.innerHTML = '<div class="no-content">Nenhum conteúdo clássico encontrado</div>';
            return;
        }
        
        console.log(`🕰️ Carregando ${nostalgia.length} itens nostálgicos`);
        
        // Embaralhar e limitar a 5 capas
        const selected = nostalgia.sort(() => Math.random() - 0.5).slice(0, 5);
        
        container.innerHTML = '';
        
        selected.forEach(item => {
            const card = this.createMovieCard(item);
            container.appendChild(card);
        });
    }

    loadKids() {
        const container = document.getElementById('kids-row');
        if (!container) return;

        // Combinar filmes e séries kids
        const allKids = [...this.data.kidsFilmes, ...this.data.kidsSeries];
        
        if (allKids.length === 0) {
            console.warn('⚠️ Nenhum conteúdo kids encontrado - tentando filtro alternativo');
            // Tentar filtro alternativo por genre/category
            const allContent = [...this.data.filmes, ...this.data.series];
            const kidsAlt = allContent.filter(item => 
                item.genre === 'Kids' || 
                item.genre === 'Animação' ||
                item.genre === 'Infantil' ||
                item.category === 'Kids' ||
                item.category === 'Animação' ||
                item.category === 'Infantil' ||
                (item.genero && item.genero.some(g => g === 'Kids' || g === 'Animação' || g === 'Infantil')) ||
                item.rating === 'L'
            );
            
            if (kidsAlt.length > 0) {
                console.log(`👶 Encontrados ${kidsAlt.length} itens kids via filtro alternativo`);
                const selected = kidsAlt.sort(() => Math.random() - 0.5).slice(0, 5);
                container.innerHTML = '';
                selected.forEach(item => {
                    const card = this.createMovieCard(item);
                    container.appendChild(card);
                });
                return;
            }
            
            container.innerHTML = '<div class="no-content">Nenhum conteúdo kids encontrado</div>';
            return;
        }
        
        console.log(`👶 Carregando ${allKids.length} itens kids`);
        
        // Embaralhar e limitar a 5 capas
        const selected = allKids.sort(() => Math.random() - 0.5).slice(0, 5);
        
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
        
        // Abrir player em tela cheia imediatamente
        player.classList.add('active');
        document.body.classList.add('player-open');
        
        // Configurar fonte do vídeo
        if (item.url) {
            if (item.url.includes('.m3u8') || item.url.includes('m3u8')) {
                // HLS stream
                if (Hls.isSupported()) {
                    const hls = new Hls();
                    hls.loadSource(item.url);
                    hls.attachMedia(video);
                } else {
                    video.src = item.url;
                }
            } else {
                video.src = item.url;
            }
            
            video.play().then(() => {
                // Tentar tela cheia após início da reprodução
                if (video.requestFullscreen) {
                    video.requestFullscreen();
                } else if (video.webkitRequestFullscreen) {
                    video.webkitRequestFullscreen();
                } else if (video.mozRequestFullScreen) {
                    video.mozRequestFullScreen();
                }
            }).catch(error => {
                console.error('Erro ao reproduzir vídeo:', error);
            });
        }
        
        // Salvar como último assistido
        this.lastWatched = item;
        localStorage.setItem('paixaoflix_last_watched', JSON.stringify(item));
        
        // Adicionar aos "Continuar Assistindo"
        this.addToContinueWatching(item);
        
        // Configurar controles de qualidade
        this.setupQualityControls(item);
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
        
        // Navegação do menu para os cards
        document.addEventListener('keydown', (e) => {
            const activeElement = document.activeElement;
            
            // Se estiver no menu e pressionar seta direita
            if (activeElement && activeElement.classList.contains('menu-link') && e.key === 'ArrowRight') {
                e.preventDefault();
                
                // Ir para a primeira capa da primeira sessão da home
                const firstCard = document.querySelector('.movie-row .movie-card, .infinite-row .wide-card');
                if (firstCard) {
                    firstCard.focus();
                    // Centralizar a sessão na tela
                    const section = firstCard.closest('.content-section, .continue-watching, .saturday-night-section');
                    if (section) {
                        section.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                }
            }
            
            // Se estiver em um card e pressionar seta esquerda
            if (activeElement && activeElement.classList.contains('movie-card') && e.key === 'ArrowLeft') {
                e.preventDefault();
                
                // Verificar se está na primeira coluna
                const rect = activeElement.getBoundingClientRect();
                const container = activeElement.parentElement;
                const containerRect = container.getBoundingClientRect();
                
                // Se estiver na primeira posição da linha
                if (rect.left - containerRect.left < 150) {
                    // Voltar para o menu
                    const homeMenuItem = document.querySelector('.menu-item[data-page="home"] .menu-link');
                    if (homeMenuItem) {
                        homeMenuItem.focus();
                    }
                }
            }
        });
    }

    setupCardNavigation() {
        // Navegação entre cards com scrollIntoView para manter centralizado
        document.addEventListener('keydown', (e) => {
            const focused = document.activeElement;
            
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
                            firstCard.scrollIntoView({ block: 'center', behavior: 'smooth' });
                        }
                    }
                }
            }
        });
    }

    showPage(page) {
        this.currentPage = page;
        console.log(`📄 Navegando para página: ${page}`);
        
        // Atualizar elementos focáveis
        setTimeout(() => {
            this.updateFocusableElements();
            // Focar no primeiro elemento se não houver foco
            if (!document.activeElement || document.activeElement === document.body) {
                if (this.focusableElements.length > 0) {
                    this.focusableElements[0].focus();
                    console.log('� Foco inicial no primeiro elemento');
                }
            }
        }, 100);
        
        if (page === 'home') {
            document.querySelectorAll('.content-section, .continue-watching, .saturday-night-section').forEach(section => {
                section.style.display = 'block';
            });
            
            // Verificar se já tem conteúdo carregado
            if (document.getElementById('nao-deixe-de-ver-row').children.length === 0) {
                console.log('🏠 Carregando conteúdo da home...');
                this.loadHomeContent();
            } else {
                console.log('🏠 Home já carregada, atualizando elementos focáveis');
            }
        } else if (page === 'live-channels') {
            // Limpar conteúdo principal
            const mainContent = document.querySelector('.main-content');
            mainContent.innerHTML = '';
            
            // Carregar canais ao vivo
            this.loadLiveChannels();
        } else {
            // Esconder seções especiais
            document.querySelectorAll('.content-section, .continue-watching, .saturday-night-section').forEach(section => {
                section.style.display = 'none';
            });
            
            this.showPageCategories(page);
        }
    }

    loadLiveChannels() {
        const mainContent = document.querySelector('.main-content');
        
        // Criar página completa de canais ao vivo
        const liveChannelsPage = document.createElement('div');
        liveChannelsPage.className = 'live-channels-page';
        liveChannelsPage.innerHTML = `
            <div class="live-channels-header">
                <div class="live-channels-info">
                    <h1 class="live-channels-title">Canais ao Vivo</h1>
                    <p class="live-channels-subtitle">Transmissões ao vivo 24/7</p>
                </div>
                <div class="live-channels-stats">
                    <span class="channels-count">${this.data.channels.length} canais disponíveis</span>
                </div>
            </div>
            
            <div class="live-channels-content">
                <div class="channels-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class="fas fa-broadcast-tower"></i>
                            Canais Principais
                        </h2>
                        <div class="section-badge">AO VIVO</div>
                    </div>
                    <div class="channels-grid" id="channels-grid">
                        <div class="loading-channels">
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>Carregando canais...</span>
                        </div>
                    </div>
                </div>
                
                ${this.data.kidsChannels.length > 0 ? `
                <div class="channels-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class="fas fa-child"></i>
                            Canais Kids
                        </h2>
                        <div class="section-badge kids">INFANTIL</div>
                    </div>
                    <div class="channels-grid" id="kids-channels-grid">
                        <div class="loading-channels">
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>Carregando canais kids...</span>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        // Limpar conteúdo e adicionar página
        mainContent.innerHTML = '';
        mainContent.appendChild(liveChannelsPage);
        
        // Carregar canais após um pequeno delay para mostrar loading
        setTimeout(() => {
            this.populateChannelsGrid();
        }, 500);
        
        console.log(`📺 Criando página de canais ao vivo com ${this.data.channels.length} canais`);
    }

    populateChannelsGrid() {
        const channelsGrid = document.getElementById('channels-grid');
        const kidsChannelsGrid = document.getElementById('kids-channels-grid');
        
        // Limpar loading
        if (channelsGrid) {
            channelsGrid.innerHTML = '';
            
            // Adicionar canais normais
            this.data.channels.forEach((channel, index) => {
                const channelCard = this.createChannelCard(channel);
                // Adicionar delay para animação
                setTimeout(() => {
                    channelCard.style.opacity = '0';
                    channelCard.style.transform = 'scale(0.8)';
                    channelsGrid.appendChild(channelCard);
                    
                    // Animar entrada
                    setTimeout(() => {
                        channelCard.style.transition = 'all 0.3s ease';
                        channelCard.style.opacity = '1';
                        channelCard.style.transform = 'scale(1)';
                    }, 50);
                }, index * 100);
            });
        }
        
        // Adicionar canais kids se houver
        if (kidsChannelsGrid && this.data.kidsChannels.length > 0) {
            kidsChannelsGrid.innerHTML = '';
            
            this.data.kidsChannels.forEach((channel, index) => {
                const channelCard = this.createChannelCard(channel);
                setTimeout(() => {
                    channelCard.style.opacity = '0';
                    channelCard.style.transform = 'scale(0.8)';
                    kidsChannelsGrid.appendChild(channelCard);
                    
                    setTimeout(() => {
                        channelCard.style.transition = 'all 0.3s ease';
                        channelCard.style.opacity = '1';
                        channelCard.style.transform = 'scale(1)';
                    }, 50);
                }, index * 100);
            });
        }
        
        // Atualizar elementos focáveis após carregar
        setTimeout(() => {
            this.updateFocusableElements();
            // Focar no primeiro canal
            const firstChannel = document.querySelector('.channel-card');
            if (firstChannel) {
                firstChannel.focus();
            }
        }, this.data.channels.length * 100 + 500);
    }

    createChannelCard(channel) {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.tabIndex = 0;
        
        card.innerHTML = `
            <div class="channel-logo">
                ${channel.logo ? 
                    `<img src="${channel.logo}" alt="${channel.name}" onerror="this.style.display='none'">` : 
                    `<i class="fas fa-tv"></i>`
                }
            </div>
            <div class="channel-name">${channel.name}</div>
        `;
        
        card.addEventListener('click', () => {
            this.playChannel(channel);
        });
        
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.playChannel(channel);
            }
        });
        
        return card;
    }

    playChannel(channel) {
        console.log(`📺 Sintonizando canal: ${channel.name}`);
        
        // Abrir player de vídeo com o canal
        const player = document.getElementById('video-player');
        const video = player.querySelector('video');
        
        if (channel.url) {
            video.src = channel.url;
            player.classList.add('active');
            document.body.classList.add('player-open');
            
            video.play().then(() => {
                // Tentar tela cheia após início da reprodução
                if (video.requestFullscreen) {
                    video.requestFullscreen();
                } else if (video.webkitRequestFullscreen) {
                    video.webkitRequestFullscreen();
                } else if (video.mozRequestFullScreen) {
                    video.mozRequestFullScreen();
                }
            }).catch(error => {
                console.error('Erro ao reproduzir canal:', error);
            });
        } else {
            console.error('URL do canal não encontrada');
        }
    }

    showPageCategories(page) {
        const mainContent = document.querySelector('.main-content');
        
        // Limpar conteúdo existente
        mainContent.innerHTML = '';
        
        // Obter categorias para a página
        const categories = this.getCategoriesForPage(page);
        
        if (categories.length === 0) {
            // Se não houver categorias, mostrar mensagem
            mainContent.innerHTML = '<div class="no-content">Nenhum conteúdo disponível</div>';
            return;
        }
        
        // Criar seções para cada categoria
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

    loadCategoryContent(categoryId, categoryType) {
        const container = document.getElementById(`${categoryId}-row`);
        if (!container) return;

        let content = [];
        
        switch (categoryType) {
            case 'movies':
                // Carregar filmes por categoria específica
                content = this.data.filmes.filter(item => {
                    const category = categoryId.replace('lancamento-', '').replace('-series', '');
                    return item.category === category || 
                           item.genre === category ||
                           (item.genero && item.genero.includes(category));
                });
                break;
                
            case 'series':
                // Carregar séries por categoria específica
                content = this.data.series.filter(item => {
                    const category = categoryId.replace('lancamento-', '').replace('-series', '');
                    return item.category === category || 
                           item.genre === category ||
                           (item.genero && item.genero.includes(category));
                });
                break;
                
            case 'kids-movies-all':
                // Todos os filmes kids em ordem alfabética
                content = [...this.data.kidsFilmes].sort((a, b) => a.title.localeCompare(b.title));
                break;
                
            case 'kids-series-all':
                // Todas as séries kids em ordem alfabética
                content = [...this.data.kidsSeries].sort((a, b) => a.title.localeCompare(b.title));
                break;
                
            case 'favorites':
                content = this.data.favoritos;
                break;
                
            case 'channels':
                // Carregar do M3U
                this.loadM3UChannels('data/ativa_canais.m3u', container);
                return;
                
            case 'kids-channels':
                // Carregar do M3U
                this.loadM3UChannels('data/ativa_kids_canais.m3u', container);
                return;
        }
        
        // Verificar se encontrou conteúdo
        if (content.length === 0) {
            console.warn(`⚠️ Nenhum conteúdo encontrado para categoria: ${categoryId}`);
            container.innerHTML = '<div class="no-content">Nenhum conteúdo encontrado nesta categoria</div>';
            return;
        }
        
        console.log(`📺 Carregando ${content.length} itens para categoria: ${categoryId}`);
        
        // Limitar a 10 itens (exceto kids que mostram todos)
        let selected = content;
        if (categoryType !== 'kids-movies-all' && categoryType !== 'kids-series-all') {
            selected = content.sort(() => Math.random() - 0.5).slice(0, 10);
        }
        
        container.innerHTML = '';
        
        selected.forEach(item => {
            const card = this.createMovieCard(item);
            container.appendChild(card);
        });
    }

    getCategoriesForPage(page) {
        const categories = {
            'live-channels': [
                { id: 'canais-ao-vivo', name: 'Canais ao Vivo', type: 'channels' }
            ],
            'cinema': [
                { id: 'lancamento-2026', name: 'Lançamento 2026', type: 'movies' },
                { id: 'lancamento-2025', name: 'Lançamento 2025', type: 'movies' },
                { id: 'acao', name: 'Ação', type: 'movies' },
                { id: 'aventura', name: 'Aventura', type: 'movies' },
                { id: 'comedia', name: 'Comédia', type: 'movies' },
                { id: 'drama', name: 'Drama', type: 'movies' },
                { id: 'nacional', name: 'Nacional', type: 'movies' },
                { id: 'romance', name: 'Romance', type: 'movies' },
                { id: 'religioso', name: 'Religioso', type: 'movies' },
                { id: 'ficcao', name: 'Ficção', type: 'movies' },
                { id: 'anime', name: 'Anime', type: 'movies' },
                { id: 'animacao', name: 'Animação', type: 'movies' },
                { id: 'familia', name: 'Família', type: 'movies' },
                { id: 'classicos', name: 'Clássicos', type: 'movies' },
                { id: 'dorama', name: 'Dorama', type: 'movies' },
                { id: 'suspense', name: 'Suspense', type: 'movies' },
                { id: 'policial', name: 'Policial', type: 'movies' },
                { id: 'crime', name: 'Crime', type: 'movies' },
                { id: 'terror', name: 'Terror', type: 'movies' },
                { id: 'documentarios', name: 'Documentários', type: 'movies' },
                { id: 'faroeste', name: 'Faroeste', type: 'movies' },
                { id: 'musical', name: 'Musical', type: 'movies' },
                { id: 'adulto', name: 'Adulto', type: 'movies' }
            ],
            'series': [
                { id: 'lancamento-2026-series', name: 'Lançamento 2026', type: 'series' },
                { id: 'lancamento-2025-series', name: 'Lançamento 2025', type: 'series' },
                { id: 'acao-series', name: 'Ação', type: 'series' },
                { id: 'aventura-series', name: 'Aventura', type: 'series' },
                { id: 'comedia-series', name: 'Comédia', type: 'series' },
                { id: 'drama-series', name: 'Drama', type: 'series' },
                { id: 'nacional-series', name: 'Nacional', type: 'series' },
                { id: 'romance-series', name: 'Romance', type: 'series' },
                { id: 'religioso-series', name: 'Religioso', type: 'series' },
                { id: 'ficcao-series', name: 'Ficção', type: 'series' },
                { id: 'anime-series', name: 'Anime', type: 'series' },
                { id: 'animacao-series', name: 'Animação', type: 'series' },
                { id: 'familia-series', name: 'Família', type: 'series' },
                { id: 'classicos-series', name: 'Clássicos', type: 'series' },
                { id: 'dorama-series', name: 'Dorama', type: 'series' },
                { id: 'suspense-series', name: 'Suspense', type: 'series' },
                { id: 'policial-series', name: 'Policial', type: 'series' },
                { id: 'crime-series', name: 'Crime', type: 'series' },
                { id: 'terror-series', name: 'Terror', type: 'series' },
                { id: 'documentarios-series', name: 'Documentários', type: 'series' },
                { id: 'faroeste-series', name: 'Faroeste', type: 'series' },
                { id: 'musical-series', name: 'Musical', type: 'series' },
                { id: 'adulto-series', name: 'Adulto', type: 'series' }
            ],
            'kids-movies': [
                { id: 'filmes-kids-todos', name: 'Filmes Kids', type: 'kids-movies-all' }
            ],
            'kids-series': [
                { id: 'series-kids-todos', name: 'Séries Kids', type: 'kids-series-all' }
            ],
            'kids-channels': [
                { id: 'canais-kids', name: 'Canais Kids', type: 'kids-channels' }
            ],
            'my-list': [
                { id: 'favoritos', name: 'Meus Favoritos', type: 'favorites' }
            ]
        };
        
        return categories[page] || [];
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
        
        lines.forEach(line => {
            line = line.trim();
            
            if (line.startsWith('#EXTINF:')) {
                // Parse channel info
                const parts = line.split(',');
                const name = parts[parts.length - 1].replace(/^.*?/, '');
                
                currentChannel = {
                    name: name,
                    url: ''
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
        });
        
        return channels;
    }

    createChannelCard(channel) {
        const card = document.createElement('div');
        card.className = 'movie-card channel-card';
        card.tabIndex = 0;
        
        card.innerHTML = `
            <div class="card-thumbnail">
                ${channel.logo ? 
                    `<img src="${channel.logo}" alt="${channel.name}">` : 
                    '<i class="fas fa-broadcast-tower"></i>'
                }
                <i class="fas fa-play-circle"></i>
            </div>
            <h3>${channel.name}</h3>
        `;
        
        card.addEventListener('click', () => {
            this.playContent(channel);
        });
        
        return card;
    }

    initNavigation() {
        this.setupCardNavigation();
        this.setupMenuNavigation();
    }

    initSearch() {
        const searchIcon = document.querySelector('.search-icon');
        const searchInput = document.querySelector('.search-input');
        const searchResults = document.querySelector('.search-results');
        
        if (!searchIcon || !searchInput || !searchResults) return;
        
        searchIcon.addEventListener('click', () => {
            searchInput.style.display = 'block';
            searchInput.focus();
        });
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }
            
            const allContent = [
                ...this.data.filmes,
                ...this.data.series,
                ...this.data.kidsFilmes,
                ...this.data.kidsSeries
            ];
            
            const results = allContent.filter(item => 
                item.title.toLowerCase().includes(query) ||
                (item.genre && item.genre.toLowerCase().includes(query)) ||
                (item.genero && item.genero.some(g => g.toLowerCase().includes(query)))
            );
            
            this.displaySearchResults(results);
        });
        
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                searchInput.style.display = 'none';
                searchResults.style.display = 'none';
            }, 200);
        });
    }

    displaySearchResults(results) {
        // Criar ou atualizar container de resultados
        let resultsContainer = document.querySelector('.search-results-overlay');
        
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.className = 'search-results-overlay';
            document.body.appendChild(resultsContainer);
        }
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">Nenhum resultado encontrado</div>';
        } else {
            resultsContainer.innerHTML = `
                <div class="search-results-header">
                    <h3>${results.length} resultados encontrados</h3>
                    <button class="search-results-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="search-results-grid"></div>
            `;
            
            const grid = resultsContainer.querySelector('.search-results-grid');
            const closeBtn = resultsContainer.querySelector('.search-results-close');
            
            results.slice(0, 12).forEach(item => {
                const resultItem = this.createMovieCard(item);
                resultItem.addEventListener('click', () => {
                    this.closeSearchInput();
                    this.playContent(item);
                });
                grid.appendChild(resultItem);
            });
            
            closeBtn.addEventListener('click', () => {
                this.closeSearchInput();
            });
        }
        
        resultsContainer.classList.add('active');
    }

    initVideoPlayer() {
        const player = document.getElementById('video-player');
        const closeBtn = player.querySelector('.close-btn');
        const qualityBtns = player.querySelectorAll('.quality-btn');
        
        closeBtn.addEventListener('click', () => {
            this.closeVideoPlayer();
        });
        
        qualityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const quality = btn.dataset.quality;
                this.changeVideoQuality(quality);
                
                // Update active state
                qualityBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // ESC para fechar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && player.classList.contains('active')) {
                this.closeVideoPlayer();
            }
        });
    }

    changeVideoQuality(quality) {
        const video = document.querySelector('#video-player video');
        if (!video) return;
        
        const currentTime = video.currentTime;
        const wasPlaying = !video.paused;
        
        // Implementar lógica de mudança de qualidade
        // Isso depende da fonte do vídeo (M3U8, MP4, etc.)
        console.log(`Mudando qualidade para: ${quality}`);
        
        // Restaurar posição e estado de reprodução
        video.addEventListener('loadedmetadata', () => {
            video.currentTime = currentTime;
            if (wasPlaying) {
                video.play();
            }
        }, { once: true });
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
        
        // Listener universal de navegação (Teclado + Controles Remotos + Touch)
        document.addEventListener('keydown', (e) => {
            // Se não houver nada focado, forçar foco no primeiro item
            if (!document.activeElement || document.activeElement === document.body) {
                e.preventDefault();
                if (this.focusableElements.length > 0) {
                    this.focusableElements[0].focus();
                    console.log('🎯 Foco forçado no primeiro elemento disponível');
                }
                return;
            }
            
            // Mapeamento de controles remotos para teclas padrão
            const keyMap = {
                // Controles remotos comuns
                37: 'ArrowLeft',    // Setas
                38: 'ArrowUp',
                39: 'ArrowRight',
                40: 'ArrowDown',
                13: 'Enter',        // OK/Enter
                27: 'Escape',       // Back/Escape
                33: 'PageUp',       // Channel Up
                34: 'PageDown',     // Channel Down
                100: 'ArrowLeft',   // LG WebOS
                101: 'ArrowUp',
                102: 'ArrowRight',
                103: 'ArrowDown',
                461: 'Enter',       // Samsung OK
                462: 'Escape',      // Samsung Back
                // Android TV
                19: 'ArrowUp',
                20: 'ArrowDown',
                21: 'ArrowLeft',
                22: 'ArrowRight',
                23: 'Enter'
            };
            
            const mappedKey = keyMap[e.keyCode] || e.key;
            
            // Navegação 4D robusta
            switch(mappedKey) {
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    // Permitir navegação apenas se não estiver em input
                    if (document.activeElement.tagName !== 'INPUT') {
                        e.preventDefault();
                        this.navigate4D(mappedKey);
                    }
                    break;
                case 'Enter':
                    // Enter para pesquisa no menu Localizar
                    if (document.activeElement.classList.contains('menu-link') && 
                        document.activeElement.closest('[data-page="search"]')) {
                        e.preventDefault();
                        this.openSearchInput();
                    }
                    break;
                case 'Escape':
                    // ESC para voltar
                    if (document.querySelector('.video-player.active')) {
                        this.closeVideoPlayer();
                    } else if (document.querySelector('.modal.active')) {
                        this.closeModal();
                    } else if (this.currentPage !== 'home') {
                        this.showPage('home');
                    }
                    break;
            }
        });
        
        // Mouse enter/leave para menu expansivo
        const sidebar = document.getElementById('sidebar');
        sidebar.addEventListener('mouseenter', () => {
            sidebar.classList.add('expanded');
        });
        
        sidebar.addEventListener('mouseleave', () => {
            sidebar.classList.remove('expanded');
        });
        
        // Touch events para mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Swipe horizontal
                if (deltaX > 50) {
                    this.navigate4D('ArrowRight');
                } else if (deltaX < -50) {
                    this.navigate4D('ArrowLeft');
                }
            } else {
                // Swipe vertical
                if (deltaY > 50) {
                    this.navigate4D('ArrowDown');
                } else if (deltaY < -50) {
                    this.navigate4D('ArrowUp');
                }
            }
        });
    }

    navigate4D(direction) {
        if (this.focusableElements.length === 0) return;
        
        const currentElement = document.activeElement;
        const currentIndex = this.focusableElements.indexOf(currentElement);
        
        // Verificar se está no menu lateral
        const isInSidebar = currentElement && currentElement.classList.contains('menu-link');
        
        if (isInSidebar) {
            this.navigateSidebar(direction);
            return;
        }
        
        // Navegação em cards (grid)
        this.navigateGrid(direction, currentIndex);
    }

    navigateSidebar(direction) {
        const menuItems = Array.from(document.querySelectorAll('.menu-link'));
        const currentIndex = menuItems.findIndex(item => item === document.activeElement);
        
        let nextIndex = currentIndex;
        
        switch(direction) {
            case 'ArrowUp':
                nextIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
                break;
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % menuItems.length;
                break;
            case 'ArrowRight':
                // Sair do menu e ir para o conteúdo
                this.exitMenuToContent();
                return;
            case 'ArrowLeft':
                // Ficar no menu (circular)
                nextIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
                break;
        }
        
        if (nextIndex !== currentIndex && menuItems[nextIndex]) {
            menuItems[nextIndex].focus();
            console.log(`🎯 Menu: ${menuItems[nextIndex].querySelector('span').textContent}`);
        }
    }

    navigateGrid(direction, currentIndex) {
        let nextIndex = currentIndex;
        
        switch(direction) {
            case 'ArrowRight':
                nextIndex = (currentIndex + 1) % this.focusableElements.length;
                break;
            case 'ArrowLeft':
                // No limite esquerdo, ir para o menu
                if (currentIndex === 0 || this.isFirstInRow(currentIndex)) {
                    this.focusFirstMenuItem();
                    return;
                }
                nextIndex = currentIndex === 0 ? this.focusableElements.length - 1 : currentIndex - 1;
                break;
            case 'ArrowDown':
                // Próxima linha (considerando grid)
                nextIndex = Math.min(currentIndex + 6, this.focusableElements.length - 1);
                break;
            case 'ArrowUp':
                // Linha anterior
                nextIndex = Math.max(currentIndex - 6, 0);
                break;
        }
        
        if (nextIndex !== currentIndex && this.focusableElements[nextIndex]) {
            this.focusableElements[nextIndex].focus();
            this.currentFocusIndex = nextIndex;
            
            // Scroll inteligente para centralizar elemento
            this.focusableElements[nextIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        }
    }

    isFirstInRow(index) {
        // Lógica para determinar se é o primeiro da linha
        // Considerando grid responsivo, isso precisa ser adaptativo
        const container = this.focusableElements[index].parentElement;
        const containerWidth = container.offsetWidth;
        const itemWidth = this.focusableElements[index].offsetWidth;
        const itemsPerRow = Math.floor(containerWidth / itemWidth);
        
        return index % itemsPerRow === 0;
    }

    exitMenuToContent() {
        // Sair do menu e focar no primeiro elemento do conteúdo
        const firstContentElement = this.focusableElements.find(el => 
            !el.classList.contains('menu-link')
        );
        
        if (firstContentElement) {
            firstContentElement.focus();
            console.log('🎯 Saindo do menu para o conteúdo');
        }
    }

    focusFirstMenuItem() {
        const firstMenuItem = document.querySelector('.menu-link');
        if (firstMenuItem) {
            firstMenuItem.focus();
            console.log('🎯 Foco no menu lateral');
        }
    }

    openSearchInput() {
        // Criar ou mostrar campo de busca
        let searchInput = document.querySelector('.search-input-overlay');
        
        if (!searchInput) {
            searchInput = document.createElement('div');
            searchInput.className = 'search-input-overlay';
            searchInput.innerHTML = `
                <div class="search-container">
                    <input type="text" class="search-input-field" placeholder="Buscar conteúdo..." autofocus>
                    <button class="search-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            document.body.appendChild(searchInput);
            
            // Event listeners
            const input = searchInput.querySelector('.search-input-field');
            const closeBtn = searchInput.querySelector('.search-close-btn');
            
            input.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });
            
            closeBtn.addEventListener('click', () => {
                this.closeSearchInput();
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeSearchInput();
                }
            });
        }
        
        // Focar no input
        searchInput.querySelector('.search-input-field').focus();
        console.log('🔍 Campo de busca aberto');
    }

    closeSearchInput() {
        const searchInput = document.querySelector('.search-input-overlay');
        const searchResults = document.querySelector('.search-results-overlay');
        
        if (searchInput) {
            searchInput.remove();
            console.log('🔍 Campo de busca fechado');
        }
        
        if (searchResults) {
            searchResults.remove();
            console.log('🔍 Resultados de busca fechados');
        }
    }

    performSearch(query) {
        if (query.length < 2) return;
        
        const allContent = [
            ...this.data.filmes,
            ...this.data.series,
            ...this.data.kidsFilmes,
            ...this.data.kidsSeries
        ];
        
        const results = allContent.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            (item.genre && item.genre.toLowerCase().includes(query.toLowerCase())) ||
            (item.genero && item.genero.some(g => g.toLowerCase().includes(query.toLowerCase())))
        );
        
        this.displaySearchResults(results);
        console.log(`🔍 Busca por "${query}": ${results.length} resultados`);
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
