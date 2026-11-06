// Testes de Minha jornada: só dados reais, sem duplicar e sem contar o incompleto
const test = require('node:test');
const assert = require('node:assert');
const J = require('../app/js/nucleo/jornada.js');

const HOJE = '2026-11-06';
const d = n => J.addDias(HOJE, -n);
const em = (n, h) => d(n) + 'T' + (h || '12') + ':00:00';

function base() {
  return {
    lidos: { 'ROM.1': d(5), 'ROM.2': d(3), 'ROM.3': d(0), 'JHN.1': '???' },
    historico: [{ itens: [
      { tipo: 'leitura', em: em(0), ref: 'Rm 4' },                       // só abriu: não conta
      { tipo: 'capitulo', em: em(0, '09'), chave: 'ROM.3', ref: 'Rm 3' },
      { tipo: 'capitulo', em: em(0, '10'), chave: 'ROM.3', ref: 'Rm 3' }, // repetido no mesmo dia: conta uma vez
      { tipo: 'capitulo', em: em(1), chave: 'ROM.9', ref: 'Rm 9' },        // desmarcado depois: não conta
      { tipo: 'estudo', em: em(2), titulo: 'Assistente: Rm 8' },
      { tipo: 'estudo', em: em(2, '15'), titulo: 'assistente: Rm 8' },      // mesmo estudo no mesmo dia
      { tipo: 'estudo', em: em(40), titulo: 'Doutrina: Trindade' },
      { tipo: 'quiz', em: em(1), titulo: 'Desafio do dia: 4/5' },
      { tipo: 'quiz', em: em(1, '13'), titulo: 'Quiz: 7/10' },
      { tipo: 'devocional', em: em(4), titulo: 'Perseverar juntos', id: 'dv1' },
      { tipo: 'busca', em: em(0), titulo: 'paz' },
      { tipo: 'arte', em: em(0) }
    ] }],
    planos: [{ id: 'nt-90', nome: 'Novo Testamento em 90 dias', feitos: { 0: d(2), 1: d(1) } }],
    devLidos: [{ id: 'dv1', em: em(4) }]
  };
}

test('eventos: só conclusões reais, sem duplicar', () => {
  const ev = J.eventos(base());
  const caps = ev.filter(e => e.tipo === 'capitulo');
  assert.deepStrictEqual(caps.map(e => e.chave).sort(), ['ROM.1', 'ROM.2', 'ROM.3']);
  assert.ok(!ev.some(e => e.chave === 'ROM.9'), 'capítulo desmarcado não conta');
  assert.ok(!ev.some(e => e.tipo === 'leitura' || e.tipo === 'busca' || e.tipo === 'arte'), 'abrir capítulo, pesquisar e arte não contam');
  assert.strictEqual(ev.filter(e => e.tipo === 'estudo').length, 2);
  assert.strictEqual(ev.filter(e => e.tipo === 'quiz').length, 2);
  assert.strictEqual(ev.filter(e => e.tipo === 'plano').length, 2);
  const dv = ev.filter(e => e.tipo === 'devocional');
  assert.strictEqual(dv.length, 1); assert.strictEqual(dv[0].titulo, 'Perseverar juntos');
  assert.ok(ev[0].em >= ev[ev.length - 1].em, 'mais recentes primeiro');
});

test('resumo por período e dias de leitura', () => {
  const ev = J.eventos(base());
  const s7 = J.resumo(ev, J.periodo('7', HOJE, ev));
  assert.deepStrictEqual([s7.capitulos, s7.diasPlano, s7.estudos, s7.quizzes, s7.devocionais], [3, 2, 1, 2, 1]);
  assert.strictEqual(s7.diasLeitura, 5, 'dias com capítulo (5, 3, 0) ou plano (2, 1)');
  const tudo = J.periodo('tudo', HOJE, ev);
  assert.strictEqual(tudo.inicio, d(40));
  assert.strictEqual(J.resumo(ev, tudo).estudos, 2);
  assert.strictEqual(J.resumo(J.eventos({}), J.periodo('30', HOJE, [])).capitulos, 0, 'sem dados, tudo zero');
});

test('série do gráfico: dias, semanas e meses', () => {
  const ev = J.eventos(base());
  const s7 = J.serie(ev, J.periodo('7', HOJE, ev), ['capitulo']);
  assert.strictEqual(s7.granularidade, 'dia'); assert.strictEqual(s7.baldes.length, 7);
  assert.deepStrictEqual(s7.baldes.map(b => b.valor), [0, 1, 0, 1, 0, 0, 1]);
  assert.strictEqual(s7.maximo, 1);
  const s90 = J.serie(ev, J.periodo('90', HOJE, ev));
  assert.strictEqual(s90.granularidade, 'semana');
  assert.strictEqual(s90.baldes[s90.baldes.length - 1].fim, HOJE);
  assert.strictEqual(s90.baldes.reduce((s, b) => s + b.valor, 0), ev.length);
  const longo = J.serie(ev, { inicio: '2024-01-15', fim: HOJE }, null);
  assert.strictEqual(longo.granularidade, 'mes'); assert.ok(longo.baldes.length <= 24);
  assert.strictEqual(longo.baldes[longo.baldes.length - 1].fim, HOJE);
});

test('sequência de dias com leitura', () => {
  const ev = J.eventos({ lidos: { 'GEN.1': d(0), 'GEN.2': d(1), 'GEN.3': d(2), 'GEN.4': d(4) } });
  assert.strictEqual(J.sequencia(ev, HOJE), 3);
  const ontem = J.eventos({ lidos: { 'GEN.2': d(1), 'GEN.3': d(2) } });
  assert.strictEqual(J.sequencia(ontem, HOJE), 2, 'hoje sem leitura ainda não quebra');
  assert.strictEqual(J.sequencia(J.eventos({ lidos: { 'GEN.3': d(2) } }), HOJE), 0);
  assert.strictEqual(J.melhorSequencia(ev), 3);
});

test('progresso de leitura e próxima leitura', () => {
  const livros = [{ id: 'RUT', nome: 'Rute', caps: 4 }, { id: 'JHN', nome: 'João', caps: 21 }];
  const p = J.progressoLeitura({ 'RUT.1': HOJE, 'RUT.2': HOJE, 'RUT.4': HOJE, 'XXX.1': HOJE }, { livro: 'RUT', cap: 2 }, livros);
  assert.deepStrictEqual([p.livro.nome, p.livro.cap, p.livro.concluidos, p.livro.total, Math.round(p.livro.pct)], ['Rute', 2, 3, 4, 75]);
  assert.deepStrictEqual(p.proxima, { livro: 'RUT', nome: 'Rute', cap: 3 });
  assert.strictEqual(p.biblia.lidos, 3, 'capítulo inexistente não conta');
  const fim = J.progressoLeitura({ 'RUT.1': 1, 'RUT.2': 1, 'RUT.3': 1, 'RUT.4': 1 }, { livro: 'RUT', cap: 4 }, livros);
  assert.deepStrictEqual(fim.proxima, { livro: 'JHN', nome: 'João', cap: 1 });
  assert.strictEqual(J.progressoLeitura({}, null, livros).livro.nome, 'João');
});

test('linha do tempo agrupada por dia, com filtro', () => {
  const ev = J.eventos(base());
  const t = J.linhaDoTempo(ev, J.periodo('7', HOJE, ev), 'todas');
  assert.strictEqual(t.grupos[0].dia, HOJE);
  assert.strictEqual(t.total, ev.filter(e => e.dia >= d(6)).length);
  const est = J.linhaDoTempo(ev, null, 'estudo');
  assert.ok(est.grupos.every(g => g.itens.every(e => e.tipo === 'estudo')));
  assert.strictEqual(J.linhaDoTempo(ev, null, 'todas', 3).grupos.reduce((s, g) => s + g.itens.length, 0), 3);
});

test('dia local do carimbo de data', () => {
  assert.strictEqual(J.diaDe('2026-11-06'), '2026-11-06');
  assert.strictEqual(J.diaDe('lixo'), null);
  const t = new Date(2026, 10, 6, 23, 30).toISOString();
  assert.strictEqual(J.diaDe(t), '2026-11-06', 'leitura às 23h30 conta no dia local');
});
