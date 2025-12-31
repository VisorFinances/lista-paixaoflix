(() => {
    const PROXY = 'https://tv.paixaoflix-vip.workers.dev/?url='; 
    const CATALOG = 'catalogo.json';
    let catData = [], filtered = [], hls = null, activeCat = 'Todos';

    const catsEl = document.getElementById('cats');
    const gridsEl = document.getElementById('grids');
    const searchEl = document.getElementById('search');
    const vidEl = document.getElementById('vid');

    fetch(CATALOG).then(r => r.json()).then(data => {
        catData = data;
        document.getElementById('spinner').style.display = 'none';
        buildCats();
        switchCat('Todos');
    });

    function buildCats() {
        const groups = ['Todos', ...new Set(catData.map(m => m.g))];
        catsEl.innerHTML = groups.map(g => `<button data-cat="${g}">${g}</button>`).join('');
        catsEl.addEventListener('click', e => {
            const bt = e.target.closest('button');
            if (bt) switchCat(bt.dataset.cat);
        });
    }

    window.switchCat = (cat) => {
        activeCat = cat;
        searchEl.value = '';
        filtered = cat === 'Todos' ? catData : catData.filter(m => m.g === cat);
        render();
        document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
    };

    let searchTimer;
    searchEl.addEventListener('input', e => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            const q = e.target.value.trim();
            if (!q) return switchCat(activeCat);
            const regex = new RegExp(q.replace(/\s+/g, '.*'), 'i');
            filtered = catData.filter(m => regex.test(m.t) || regex.test(m.g));
            render(q);
        }, 150);
    });

    function render(q = '') {
        gridsEl.innerHTML = `<div class="row">${filtered.map(m => {
            let t = m.t;
            if (q) t = t.replace(new RegExp(`(${q})`, 'ig'), '<mark>$1</mark>');
            return `<div class="card" tabindex="0" onclick="play('${m.v}')"><img src="${m.c}"><span>${t}</span></div>`;
        }).join('')}</div>`;
    }

    window.play = (url) => {
        document.getElementById('player').hidden = false;
        if (hls) hls.destroy();
        const finalUrl = PROXY + encodeURIComponent(url);
        if (Hls.isSupported()) {
            hls = new Hls({ maxBufferLength: 30 });
            hls.loadSource(finalUrl);
            hls.attachMedia(vidEl);
            hls.on(Hls.Events.MANIFEST_PARSED, () => vidEl.play());
        } else { vidEl.src = finalUrl; }
    };

    document.getElementById('close').onclick = () => {
        document.getElementById('player').hidden = true;
        vidEl.pause();
        if (hls) hls.destroy();
    };
})();
