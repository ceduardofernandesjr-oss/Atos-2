// Uso: node ferramentas/quiz/ver.js "Gn 2:10-14" "Êx 20:3" … — imprime o texto da Bíblia Livre.
const B = require('../../test/biblia-node.js'), R = require('../../app/js/nucleo/referencias.js');
for (const s of process.argv.slice(2)) { const r = R.interpretar(s, B.contagem); if (!r.ok) { console.log(s, 'ERRO', r.erro); continue; }
  console.log('## ' + s + ': ' + R.versiculosDa(r.ref, B.contagem).map(([l, c, v]) => v + ' ' + B.plano(B.texto(l, c, v))).join(' ')); }
