# PaixãoFlix - Smart TV Streaming Platform

Uma plataforma de streaming completa para Smart TVs inspirada nos melhores recursos da Netflix e Disney+, desenvolvida com HTML5, CSS3 e JavaScript vanilla.

## 🚀 Funcionalidades Principais

### 📺 Interface para Smart TV
- **Menu Lateral Disney+**: Design expansível com backdrop-filter blur(20px)
- **Hero Banner Netflix**: 80vh de altura com gradientes profissionais
- **22 Categorias de Conteúdo**: Organizadas em fileiras horizontais scrollable
- **Sistema de Foco Avançado**: Scale 1.1 + borda glow para navegação remota

### 🎮 Navegação Universal
- **Controle Remoto**: Suporte completo para gamepad (D-pad + botões A/B)
- **Teclado**: Navegação com setas, Enter, Escape
- **Touch/Mouse**: Scroll nativo com inertia
- **Focus Management**: Sistema inteligente de foco entre elementos

### 🎬 Player de Vídeo "Clapper"
- **Controles Completos**: Play/pause, skip, volume, fullscreen
- **Auto-hide Controls**: Oculta automaticamente após 3 segundos
- **Progress Bar Interativa**: Click para seek, preview ao hover
- **Configurações**: Velocidade (0.5x-2x) e qualidade (480p-4K)
- **Resume Play**: Salva progresso automaticamente

### 📋 Modal de Detalhes
- **Informações Completas**: Sinopse, elenco, episódios
- **Favoritos**: Sistema de favoritos com localStorage
- **Ações Diretas**: Play direto do modal
- **Design Responsivo**: Adaptável para diferentes telas

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semântico**: Estrutura acessível e otimizada
- **CSS3 Moderno**: Grid, Flexbox, backdrop-filter, animações
- **JavaScript ES6+**: Classes, async/await, módulos
- **Font Awesome 6**: Ícones profissionais
- **Google Fonts**: Tipografia Inter

## 📁 Estrutura do Projeto

```
paixaoflix/
├── index.html              # Página principal
├── style.css               # Estilos completos
├── data/                   # Dados de conteúdo
│   ├── filmes.json         # Catálogo de filmes
│   ├── series.json         # Catálogo de séries
│   ├── ativa_canais.m3u    # Canais ao vivo
│   ├── kids_filmes.json    # Filmes infantis
│   ├── kids_series.json    # Séries infantis
│   └── ativa_kids_canais.m3u # Canais infantis
└── README.md               # Documentação
```

## 🎯 Como Usar

### Navegação por Controle Remoto
- **D-pad**: Navegar entre elementos
- **Botão A**: Selecionar/Ativar
- **Botão B**: Voltar/Sair

### Navegação por Teclado
- **Setas**: Navegar
- **Enter**: Selecionar
- **Escape**: Voltar
- **Espaço**: Play/Pause (no player)
- **F**: Fullscreen (no player)

### Menu Lateral
- **Click no Logo**: Expandir/colapsar menu
- **Hover**: Efeito de transição suave
- **Foco**: Borda vermelha com glow

## 🎨 Design System

### Cores
- **Primária**: #E50914 (Vermelho Netflix)
- **Background**: #0a0a0a (Preto profundo)
- **Superfície**: #1a1a1a (Cinza escuro)
- **Texto**: #ffffff (Branco puro)
- **Secundário**: #b3b3b3 (Cinza médio)

### Tipografia
- **Fonte**: Inter (Google Fonts)
- **Pesos**: 300-900
- **Tamanhos**: Sistema fluido com clamp()

### Animações
- **Duração**: 0.3s (transições)
- **Curva**: cubic-bezier(0.4, 0, 0.2, 1)
- **Performance**: will-change para GPU acceleration

## 📱 Responsividade

### Breakpoints
- **1200px+**: Desktop/TV completo
- **768px-1199px**: Tablets grandes
- **480px-767px**: Tablets pequenos
- **<480px**: Smartphones

### Adaptações
- Cards: 200px → 180px → 150px → 120px
- Sidebar: 80px → 60px
- Hero: 80vh → 60vh
- Fontes: Sistema fluido com clamp()

## 🔧 Personalização

### Adicionar Novo Conteúdo
1. Edite os arquivos JSON em `/data/`
2. Adicione IDs às categorias correspondentes
3. Atualize imagens e metadados

### Modificar Cores
Edite as variáveis CSS em `:root`:
```css
:root {
    --primary-color: #E50914;
    --background-color: #0a0a0a;
    /* ... */
}
```

### Configurar Player
Modifique a classe `VideoPlayer` para:
- Mudar vídeo de exemplo
- Ajustar tempo de auto-hide
- Adicionar novas configurações

## 🚀 Performance

### Otimizações Implementadas
- **Lazy Loading**: Carregamento sob demanda
- **GPU Acceleration**: will-change em animações
- **Debouncing**: Eventos otimizados
- **LocalStorage**: Cache de preferências
- **RequestAnimationFrame**: Gamepad loop otimizado

### Recomendações
- Use imagens WebP para melhor compressão
- Implemente service worker para cache offline
- Considere CDN para vídeos em produção

## 🌐 Navegadores Compatíveis

- **Chrome 90+**: Full support
- **Firefox 88+**: Full support  
- **Safari 14+**: Full support
- **Edge 90+**: Full support
- **Smart TVs**: WebOS 3.0+, Tizen 3.0+

## 📄 Licença

Este projeto é para fins demonstrativos e educacionais.

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:
1. Fork o projeto
2. Crie uma branch feature
3. Commit suas mudanças
4. Abra um Pull Request

---

**Desenvolvido com ❤️ para a comunidade de desenvolvedores Smart TV**
