const fs = require('fs');
const inFile = process.argv[2];
const outFile = 'catalogo.json';

if (!inFile) {
    console.log('Uso: node m3u2json.js caminho/da/lista.m3u');
    process.exit(1);
}

try {
    const raw = fs.readFileSync(inFile, 'utf8');
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const cat = [];
    let temp = {};

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF:')) {
            const logo = lines[i].match(/tvg-logo="(.+?)"/);
            const group = lines[i].match(/group-title="(.+?)"/);
            const title = lines[i].split(',').pop();
            temp = {
                t: title.trim(),
                g: group ? group[1] : 'GERAL',
                c: logo ? logo[1] : '',
                v: ''
            };
        } else if (lines[i].startsWith('http')) {
            if (temp.t) {
                temp.v = lines[i].trim();
                cat.push(temp);
                temp = {};
            }
        }
    }
    fs.writeFileSync(outFile, JSON.stringify(cat));
    console.log('✅ Sucesso! O arquivo catalogo.json foi criado com ' + cat.length + ' canais.');
} catch (e) {
    console.log('❌ Erro: ' + e.message);
}
