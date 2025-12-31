// m3u2json.js - Conversor de Alta Performance para PaixãoFlix
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
        
        // Captura metadados da linha #EXTINF
        if(line.startsWith('#EXTINF:')){
            const logo = line.match(/tvg-logo="(.+?)"/);
            const group = line.match(/group-title="(.+?)"/);
            const title = line.split(',').pop();
            
            temp = {
                id: Math.random().toString(36).slice(2,9),
                t: title.trim(), // Título
                g: group ? group[1] : 'GERAL', // Categoria/Grupo
                c: logo ? logo[1] : 'https://tv.paixaoflix.vip/logo.png', // Capa/Logo
                v: '' // URL do vídeo (capturada na próxima linha)
            };
        } 
        // Captura a URL que vem logo após o #EXTINF
        else if(line.startsWith('http')){
            if(temp.t){
                temp.v = line.trim();
                cat.push(temp);
                temp = {}; // Limpa para o próximo item
            }
        }
    }

    fs.writeFileSync(outFile, JSON.stringify(cat, null, 2));
    console.log(`✅ Sucesso! ${cat.length} itens convertidos para ${outFile}`);
} catch (err) {
    console.error("❌ Erro ao converter arquivo:", err.message);
}
