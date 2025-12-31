const fs = require('fs');
const [,,inFile,outFile='catalogo.json'] = process.argv;

if(!inFile) {
    console.log('Uso: node m3u2json.js lista.m3u');
    process.exit(1);
}

try {
    const raw = fs.readFileSync(inFile,'utf8');
    const lines = raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const cat = [];
    let temp = {};

    for(let i=0; i<lines.length; i++){
        const line = lines[i];
        if(line.startsWith('#EXTINF:')){
            const logo = line.match(/tvg-logo="(.+?)"/);
            const group = line.match(/group-title="(.+?)"/);
            const title = line.split(',').pop();
            temp = {
                id: Math.random().toString(36).slice(2,9),
                t: title.trim(),
                g: group ? group[1] : 'GERAL',
                c: logo ? logo[1] : 'https://tv.paixaoflix.vip/logo.png',
                v: ''
            };
        } else if(line.startsWith('http')){
            if(temp.t){
                temp.v = line.trim();
                cat.push(temp);
                temp = {};
            }
        }
    }
    fs.writeFileSync(outFile, JSON.stringify(cat));
    console.log(`✅ Gerado: ${cat.length} itens em ${outFile}`);
} catch (err) {
    console.error("❌ Erro:", err.message);
}
