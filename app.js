(() => {
    const PROXY = 'https://tv.paixaoflix-vip.workers.dev/?url='; 
    const CATALOG = 'catalogo.json';
    
    let catData = [], filtered = [], hls = null, activeCat = 'Todos';
    const catsEl = document.getElementById('cats');
    const gridsEl = document.getElementById('grids');
    const searchEl = document.getElementById('search');
    const playEl = document.getElementById('player');
    const vidEl = document.getElementById('vid');
    const spinner = document.getElementById('spinner');

    /* ---------- carregar dados ---------- */
    fetch(CATALOG)
        .then(r => r.json())
        .then(data => {
            catData = data;
            spinner.style.display = 'none';
            buildCats();
            switchCat('Todos');
        });

    function buildCats() {
        const set = ['Todos', ...new Set(catData.map(m => m.g))];
        catsEl.innerHTML = set.map(c => `<button data-cat="${c}">${c}</button>`).join('');
        catsEl.addEventListener('click', e => {
            const bt = e.target.closest('button');
            if (bt) switchCat(bt.dataset.cat);
        });
    }

    window.switchCat = (cat) => {
        activeCat = cat;
        searchEl.value = ''; // limpa busca ao trocar categoria
        filtered = cat === 'Todos' ? catData : catData.filter(m => m.g === cat);
        render();
        document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
    };

    /* ---------- busca com debounce ---------- */
    let searchTimer;
    searchEl.addEventListener('input', e => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => runSearch(e.target.value.trim()), 150);
    });

    function runSearch(q) {
        if (!q) {
            switchCat(activeCat);
            return;
        }
        const regex = new RegExp(q.replace(/\s+/g, '.*'), 'i');
        filtered = catData.filter(m => regex.test(m.t) || (m.y && regex.test(m.y)) || regex.test(m.g));
        render(q);
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    }

    function render(query = '') {
        gridsEl.innerHTML = `<div class="row">${filtered.map(m => makeCard(m, query)).join('')}</div>`;
    }

    function makeCard(m, q) {
        let title = m.t;
        if (q) {
            const re = new RegExp(`(${q.replace(/\s+/g, '|')})`, 'ig');
            title = title.replace(re, '<mark>$1</mark>');
        }
        return `
            <div class="card" tabindex="0" onclick="playStream('${m.v}')">
                <img loading="lazy" src="${m.c}" alt="${m.t}">
                <span>${title}</span>
            </div>`;
    }

    /* ---------- player hls ---------- */
    window.playStream = (url) => {
        playEl.hidden = false;
        if (hls) hls.destroy();

        const finalUrl = PROXY + encodeURIComponent(url);

        if (Hls.isSupported()) {
            hls = new Hls({ maxBufferLength: 30, enableWorker: true });
            hls.loadSource(finalUrl);
            hls.attachMedia(vidEl);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                vidEl.muted = true;
                vidEl.play();
                setTimeout(() => vidEl.muted = false, 1000);
            });
        } else {
            vidEl.src = finalUrl;
        }
    };

    document.getElementById('close').onclick = () => {
        playEl.hidden = true;
        vidEl.pause();
        if (hls) hls.destroy();
    };

    /* ---------- atalhos e teclado ---------- */
    document.addEventListener('keydown', e => {
        if (e.key === '/') { e.preventDefault(); searchEl.focus(); }
        if (e.key === 'Escape' || e.keyCode === 461) document.getElementById('close').click();
    });

})();
