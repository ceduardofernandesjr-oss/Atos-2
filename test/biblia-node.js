// Carrega a Bíblia Livre convertida para uso nos testes (Node).
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', 'app', 'biblia', 'blivre');
const indice = JSON.parse(fs.readFileSync(path.join(DIR, 'indice.json'), 'utf8'));
const cache = {};
function livro(id) { return cache[id] || (cache[id] = JSON.parse(fs.readFileSync(path.join(DIR, id + '.json'), 'utf8'))); }
const contagem = id => { const l = indice.livros.find(x => x.id === id); return l && l.versos; };
const texto = (id, c, v) => livro(id).caps[c - 1][v - 1];
const plano = s => s.replace(/[{}]/g, '');
module.exports = { indice, livro, contagem, texto, plano };
