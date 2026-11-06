// Uso: node ferramentas/quiz/buscar.js "termo" [LIVRO] — mostra onde o termo ocorre na Bíblia Livre.
const B = require('../../test/biblia-node.js'), S = require('../../app/js/nucleo/busca.js');
const [termo, livro] = process.argv.slice(2), t = S.normalizar(termo); let n = 0;
for (const l of B.indice.livros) { if (livro && l.id !== livro) continue;
  B.livro(l.id).caps.forEach((c, ci) => c.forEach((v, vi) => { const p = B.plano(v); if (S.normalizar(p).includes(t)) { n++; if (n <= 12) console.log(l.abrev + ' ' + (ci + 1) + ':' + (vi + 1) + '  ' + p.slice(0, 170)); } })); }
console.log('total', n);
