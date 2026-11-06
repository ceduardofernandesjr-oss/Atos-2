// ATOS 2 — testes dos motores. Rodar: node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../app/js/nucleo/referencias.js');
const C = require('../app/js/nucleo/conteudo.js');
const P = require('../app/js/nucleo/planos.js');
const S = require('../app/js/nucleo/busca.js');
const A = require('../app/js/nucleo/arte.js');
const Y = require('../app/js/nucleo/sinc.js');
const B = require('./biblia-node.js');

const ref = s => { const r = R.interpretar(s, B.contagem); assert.ok(r.ok, s + ': ' + r.erro); return r.ref; };
const textoRef = s => R.versiculosDa(ref(s), B.contagem).map(([b, c, v]) => B.plano(B.texto(b, c, v))).join(' ');

// ---------------------------------------------------------------- Bíblia
test('Bíblia Livre: 66 livros, 1189 capítulos, 31102 versículos, sem marcação no texto', () => {
  assert.equal(B.indice.livros.length, 66);
  assert.equal(B.indice.livros.reduce((s, l) => s + l.versos.length, 0), 1189);
  assert.equal(B.indice.totalVersiculos, 31102);
  for (const l of B.indice.livros) {
    const lv = B.livro(l.id);
    lv.caps.forEach((cap, c) => cap.forEach((t, v) => {
      if (l.id === 'ACT' && c === 27 && v === 28) return;           // At 28:29 sem texto na fonte (documentado)
      assert.ok(t.length > 0, `${l.id} ${c + 1}:${v + 1} vazio`);
      assert.ok(!/\\|\bN4\b|Comparar com/.test(t), `${l.id} ${c + 1}:${v + 1} com marcação`);
      assert.equal(t.split('{').length, t.split('}').length, `${l.id} ${c + 1}:${v + 1} chaves`);
    }));
  }
});
test('Bíblia Livre: correções do gerador oficial aplicadas', () => {
  assert.match(textoRef('At 2:38'), /para perdão dos pecados; e recebereis o dom do Espírito Santo\.$/);
  assert.equal(textoRef('Rm 5:1'), 'Portanto, visto que somos justificados pela fé, temos paz com Deus, por meio do nosso Senhor Jesus Cristo.');
  assert.match(textoRef('Mc 5:19'), /^Porém Jesus não lhe permitiu/);
  assert.match(textoRef('Lc 4:8'), /Porque está escrito:/);
  assert.ok(textoRef('Ml 4:6').startsWith('Ele converterá o coração'));
  assert.equal(B.livro('ACT').caps[27][28], '');
  assert.ok(B.livro('ACT').notas['28:29'][0].editorial);
});

// ---------------------------------------------------------------- referências
test('referências: formatos aceitos', () => {
  const casos = {
    'Jo 3:16': 'João 3:16', 'joão 3.16': 'João 3:16', 'JOAO 3,16-18': 'João 3:16-18', 'Jó 1:1': 'Jó 1:1', 'jó 42': 'Jó 42',
    '1 Co 13:4-7': '1 Coríntios 13:4-7', '1co 13': '1 Coríntios 13', 'Primeira Coríntios 13': '1 Coríntios 13', 'I João 4:8': '1 João 4:8',
    '1ª Pedro 5:7': '1 Pedro 5:7', 'Sl 23': 'Salmos 23', 'salmo 119:105': 'Salmos 119:105', 'Gênesis': 'Gênesis 1', 'Is 53': 'Isaías 53',
    'Atos 2:42': 'Atos 2:42', 'atos dos apostolos 2': 'Atos 2', 'Ap 21:1-22:5': 'Apocalipse 21:1-22:5', 'Mt 5-7': 'Mateus 5-7',
    'deuteron 6': 'Deuteronômio 6', 'cantares 2': 'Cantares 2', '3 jo 2': '3 João 1:2', 'Jd 24-25': 'Judas 1:24-25', 'Fm 1': 'Filemom 1'
  };
  for (const [e, s] of Object.entries(casos)) assert.equal(R.formatar(ref(e)), s, e);
});
test('referências: erros com mensagem clara', () => {
  assert.match(R.interpretar('Jo 22', B.contagem).erro, /21 capítulos/);
  assert.match(R.interpretar('Sl 23:7', B.contagem).erro, /6 versículos/);
  assert.equal(R.interpretar('Xyz 1', B.contagem).ok, false);
  assert.equal(R.interpretar('Jo 3:18-16', B.contagem).ok, false);
});

// ---------------------------------------------------------------- conteúdo curado
test('versículos do dia: existem, são únicos, frases completas e ciclo sem repetição', () => {
  assert.ok(C.VERSICULOS_DIA.length >= 365);
  const vistos = new Set();
  for (const s of C.VERSICULOS_DIA) {
    const k = R.formatar(ref(s)); assert.ok(!vistos.has(k), 'repetido ' + s); vistos.add(k);
    const t = textoRef(s);
    assert.ok(!/[,;:]\s*$/.test(t) && !/^[a-zà-ú]/.test(t), 'fragmento: ' + s + ' — ' + t);
  }
  const ano = new Set(); let d = '2026-01-01';
  for (let i = 0; i < 365; i++) { ano.add(C.versiculoDoDia(d)); d = P.addDias(d, 1); }
  assert.equal(ano.size, 365);
  assert.equal(C.versiculoDoDia('2026-11-03'), C.versiculoDoDia('2026-11-03'));
  assert.equal(C.anteriores('2026-11-03', 7)[0].data, '2026-11-02');
});
test('temas: cada referência existe e contém uma palavra do tema', () => {
  for (const t of C.TEMAS) {
    for (const s of t.refs) {
      const n = S.normalizar(textoRef(s));
      assert.ok(t.termos.some(w => new RegExp('(^|[^a-z])' + S.normalizar(w)).test(n)), `${t.nome}: ${s} — ${textoRef(s)}`);
    }
  }
});
test('personagens: o nome aparece no capítulo indicado', () => {
  for (const p of C.PERSONAGENS) for (const s of p.refs) {
    const r = ref(s), cap = B.livro(r.livro).caps[r.cap - 1].map(B.plano).join(' ');
    assert.ok(S.normalizar(cap).includes(S.normalizar(p.termo)), `${p.nome}: ${s}`);
  }
});
test('galeria: referências válidas', () => { for (const g of C.GALERIA) for (const s of g.refs) assert.ok(textoRef(s).length > 10, s); });

// ---------------------------------------------------------------- planos
test('planos: todos os capítulos, sem repetição, na quantidade de dias anunciada', () => {
  for (const d of P.DEFINICOES) {
    const c = P.cronograma(d, B.contagem);
    assert.equal(c.length, d.dias, d.id);
    assert.ok(c.every(g => g.length > 0), d.id + ' dia vazio');
    const caps = c.flat().map(x => x.livro + '.' + x.cap);
    assert.equal(new Set(caps).size, caps.length, d.id + ' repetido');
    if (d.livros) assert.equal(caps.length, d.livros.reduce((s, b) => s + B.contagem(b).length, 0), d.id);
  }
  const b365 = P.cronograma(P.DEFINICOES[0], B.contagem);
  assert.equal(b365.flat().length, 1189);
  assert.deepEqual(b365[0][0], { livro: 'GEN', cap: 1 });
  assert.deepEqual(b365[364].at(-1), { livro: 'REV', cap: 22 });
});
test('planos: progresso, atraso, pausa e retomada', () => {
  const def = P.DEFINICOES.find(d => d.id === 'atos-28');
  let e = P.iniciar(def, '2026-11-01');
  let r = P.resumo(e, 28, '2026-11-03');
  assert.equal(r.diaDoCalendario, 3); assert.equal(r.atrasados, 2); assert.equal(r.proximo, 0);
  e = P.marcar(e, 0, true, '2026-11-03', 28); e = P.marcar(e, 1, true, '2026-11-03', 28);
  r = P.resumo(e, 28, '2026-11-03');
  assert.equal(r.concluidos, 2); assert.equal(r.atrasados, 0); assert.equal(r.proximo, 2); assert.equal(r.lidoHoje, true);
  assert.equal(r.percentual.toFixed(2), '7.14');
  e = P.pausar(e, '2026-11-04');
  r = P.resumo(e, 28, '2026-11-10');                       // pausado de 04 a 10: não avança o calendário
  assert.equal(r.diaDoCalendario, 3); assert.equal(r.atrasados, 0);
  e = P.retomar(e, '2026-11-10');
  r = P.resumo(e, 28, '2026-11-10');
  assert.equal(r.diaDoCalendario, 4);                       // 01,02,03 + dia da retomada
  assert.equal(r.atrasados, 1);                             // dia 3 não lido
  for (let i = 0; i < 28; i++) e = P.marcar(e, i, true, '2026-11-10', 28);
  assert.equal(e.status, 'concluido'); assert.equal(P.resumo(e, 28, '2026-11-10').concluido, true);
  e = P.marcar(e, 5, false, '2026-11-11', 28);
  assert.equal(e.status, 'ativo');
});
test('planos: rótulo agrupa capítulos seguidos', () => {
  assert.equal(P.rotuloLeitura([{ livro: 'GEN', cap: 1 }, { livro: 'GEN', cap: 2 }, { livro: 'EXO', cap: 1 }], R.formatar), 'Gênesis 1-2; Êxodo 1');
});

// ---------------------------------------------------------------- busca
const todos = () => B.indice.livros.map(l => B.livro(l.id));
test('busca: palavra inteira, sem acento, várias palavras e expressão exata', () => {
  const r1 = S.pesquisar(todos(), 'fe', { limite: 5000 });
  assert.ok(r1.total > 200);
  assert.ok(r1.resultados.every(x => /(^|[^a-z])fe([^a-z]|$)/.test(S.normalizar(x.texto))));
  const r2 = S.pesquisar(todos(), 'doutrina apóstolos');
  assert.ok(r2.resultados.some(x => x.livro === 'ACT' && x.cap === 2 && x.v === 42));
  const r3 = S.pesquisar(todos(), '"partir do pão"');
  assert.ok(r3.resultados.some(x => x.livro === 'ACT' && x.cap === 2 && x.v === 42));
  const r4 = S.pesquisar(todos(), '"pão do partir"');
  assert.equal(r4.total, 0);
  const r5 = S.pesquisar(todos(), 'batiz', { inicio: true });
  assert.ok(r5.total > 50);
  assert.equal(S.pesquisar(todos(), 'batiz').total, 0);
});
test('busca: trechos destacados batem com o texto original', () => {
  const r = S.pesquisar(todos(), 'espirito santo', { livros: new Set(['ACT']) });
  const x = r.resultados[0];
  const destacados = S.partes(x.texto, x.trechos).filter(p => p.destaque).map(p => p.t.toLowerCase());
  assert.ok(destacados.includes('espírito') && destacados.includes('santo'));
});

// ---------------------------------------------------------------- arte
test('arte: quebra respeitando a largura e ajuste de tamanho', () => {
  const medirCom = tam => s => s.length * tam * 0.5;
  const l = A.quebrar('Porque Deus amou o mundo de tal maneira', 100, medirCom(10));
  assert.ok(l.every(x => x.length * 5 <= 100));
  assert.equal(l.join(' '), 'Porque Deus amou o mundo de tal maneira');
  const aj = A.ajustar(textoRef('Jo 3:16'), { w: 900, h: 700 }, medirCom, { min: 20, max: 120 });
  assert.ok(aj.altura <= 700 && aj.tamanho > 20);
  assert.equal(aj.linhas.join(' '), textoRef('Jo 3:16'));     // nenhuma palavra perdida
  assert.equal(A.textoParaArte(['A {graça} de', 'Deus']), 'A graça de Deus');
});
test('arte: SVG da IA não pode conter texto, scripts ou links', () => {
  const sujo = '<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="url(#g)"/><text x="1">João 3:16</text><script>alert(1)</script><image href="http://x/y.png"/><circle onload="x()" r="2"/></svg>';
  const limpo = A.limparSvg(sujo);
  assert.ok(!/<text|script|image|onload|http:\/\/x/.test(limpo), limpo);
  assert.match(limpo, /url\(#g\)/);
  assert.equal(A.limparSvg('sem svg'), null);
});

// ---------------------------------------------------------------- sincronização
test('sincronização: vence a alteração mais recente; empate decidido pelo aparelho', () => {
  const a = { t: 10, dev: 'a' }, b = { t: 12, dev: 'b' };
  assert.equal(Y.mesclar(a, b), 'remoto');
  assert.equal(Y.mesclar(b, a), 'local');
  assert.equal(Y.mesclar({ t: 5, dev: 'z' }, { t: 5, dev: 'a' }), 'local');
  assert.equal(Y.mesclar({ t: 5, dev: 'a' }, { t: 5, dev: 'a' }), 'igual');
  assert.deepEqual(Y.pendentes({ k1: { t: 3 }, k2: { t: 1, dev: 'x' } }, { k1: { t: 2 }, k2: { t: 1, dev: 'x' } }), ['k1']);
  assert.match(Y.idDoc('fav', 'JHN.3.16 ç/x'), /^[A-Za-z0-9_\-.~:@+]+$/);
});
