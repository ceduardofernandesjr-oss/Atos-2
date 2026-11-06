// ATOS 2 — Jornada da Sabedoria: níveis, pontos sem duplicidade, medalhas e domínio bíblico.
const test = require('node:test');
const assert = require('node:assert/strict');
const J = require('../app/js/nucleo/sabedoria.js');
const Q = require('../app/js/nucleo/quiz.js');

// banco de teste pequeno
const banco = {};
for (let i = 1; i <= 40; i++) banco['p' + i] = { id: 'p' + i, resposta: 'certa', secao: i <= 20 ? 'evangelhos' : 'profetas-menores', dificuldade: i <= 10 ? 1 : 3 };
const opts = (hoje, extra) => Object.assign({ porId: banco, hoje, agora: hoje + 'T12:00:00Z' }, extra || {});
const rodada = (id, ids, certas, extra) => Object.assign({ id, modo: 'livre', respostas: ids.map((p, i) => ({ p, r: certas === true || (Array.isArray(certas) && certas[i]) ? 'certa' : 'errada' })) }, extra || {});
const ids = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => 'p' + (a + i));

test('Jornada: oito níveis com as faixas pedidas', () => {
  assert.deepEqual(J.NIVEIS.map(n => n.min), [0, 100, 250, 500, 850, 1300, 1900, 2700]);
  assert.deepEqual(J.NIVEIS.map(n => n.nome), ['Aprendiz das Escrituras', 'Discípulo', 'Conhecedor da Palavra', 'Servo Fiel', 'Evangelista', 'Mestre das Escrituras', 'Ancião na Palavra', 'Guardião da Palavra']);
  assert.equal(J.nivelDe(99).n, 1); assert.equal(J.nivelDe(100).n, 2); assert.equal(J.nivelDe(1899).n, 6); assert.equal(J.nivelDe(99999).n, 8);
  const p = J.progresso(175); assert.equal(p.nivel.n, 2); assert.equal(p.faltam, 75); assert.equal(p.pct, 50);
  assert.equal(J.progresso(3000).proximo, null); assert.equal(J.progresso(3000).pct, 100);
  assert.equal(J.progresso(50, 3).nivel.n, 3, 'nível nunca regride');
  assert.match(J.AVISO, /não representam ordenação/i);
  for (const n of J.NIVEIS) assert.ok(n.descricao.length > 40 && n.emblema, n.id);
});

test('Jornada: +10 só no primeiro acerto, +15 por 5 seguidos, +20 por quiz concluído', () => {
  let e = J.estadoInicial();
  const r1 = J.registrar(e, rodada('r1', ids(1, 10), true), opts('2026-11-05'));
  assert.equal(r1.pontos, 100 + 30 + 20); // 10 inéditas, 2 sequências, conclusão
  assert.deepEqual(r1.ganhos.map(g => g.tipo), ['acerto', 'sequencia', 'conclusao']);
  e = r1.estado;
  const r2 = J.registrar(e, rodada('r2', ids(1, 10), true), opts('2026-11-05'));
  assert.equal(r2.ganhos.find(g => g.tipo === 'acerto'), undefined, 'sem pontos repetidos por pergunta já acertada');
  assert.throws(() => J.registrar(r2.estado, rodada('r2', ids(11, 15), true), opts('2026-11-05')), /já foi registrada/);
  assert.throws(() => J.registrar(e, rodada('x', ['p1', 'p1'], true), opts('2026-11-05')), /repetida/);
  assert.throws(() => J.registrar(e, rodada('y', ['zzz'], true), opts('2026-11-05')), /desconhecida/);
  assert.throws(() => J.registrar(e, rodada('z', ids(1, 16), true), opts('2026-11-05')), /demais/);
  // errar zera a sequência
  const r3 = J.registrar(J.estadoInicial(), rodada('r3', ids(1, 6), [1, 1, 1, 1, 0, 1]), opts('2026-11-05'));
  assert.equal(r3.ganhos.find(g => g.tipo === 'sequencia'), undefined);
  assert.equal(r3.estado.respostas.p5.e, 1);
});

test('Jornada: limites diários dos bônus e rodadas antigas só valem pelos acertos', () => {
  let e = J.estadoInicial(), conclusoes = 0;
  for (let i = 0; i < 7; i++) { const r = J.registrar(e, rodada('c' + i, ids(1, 5), false), opts('2026-11-05')); conclusoes += r.ganhos.filter(g => g.tipo === 'conclusao').length; e = r.estado; }
  assert.equal(conclusoes, J.REGRAS.conclusoesDia);
  const antiga = J.registrar(J.estadoInicial(), rodada('a', ids(1, 10), true, { dia: '2026-10-01' }), opts('2026-11-05'));
  assert.deepEqual(antiga.ganhos.map(g => g.tipo), ['acerto']);
  assert.equal(antiga.estado.diasSeguidos, 0);
  assert.throws(() => J.registrar(J.estadoInicial(), rodada('f', ids(1, 5), true, { dia: '2026-11-09' }), opts('2026-11-05')), /inválida/);
});

test('Jornada: desafio avançado e desafios especiais configuráveis', () => {
  const adv = J.registrar(J.estadoInicial(), rodada('adv', ids(11, 20), [1, 1, 1, 1, 1, 1, 1, 0, 0, 0], { modo: 'avancado' }), opts('2026-11-05'));
  assert.ok(adv.ganhos.some(g => g.tipo === 'avancado' && g.pontos === 30));
  const adv2 = J.registrar(adv.estado, rodada('adv2', ids(21, 30), true, { modo: 'avancado' }), opts('2026-11-05'));
  assert.ok(!adv2.ganhos.some(g => g.tipo === 'avancado'), 'uma vez por dia');
  const facil = J.registrar(J.estadoInicial(), rodada('advf', ids(1, 10), true, { modo: 'avancado' }), opts('2026-11-05'));
  assert.ok(!facil.ganhos.some(g => g.tipo === 'avancado'), 'exige perguntas difíceis');
  const d = J.registrar(J.estadoInicial(), rodada('d', ids(1, 5), [1, 1, 1, 0, 0], { modo: 'especial', especial: 'desafio-do-dia' }), opts('2026-11-05'));
  assert.ok(d.ganhos.some(g => g.tipo === 'especial' && g.pontos === 25));
  const cfg = [{ id: 'teste', titulo: 'Teste', pontos: 77, perguntas: 5, minAcertos: 5, secoes: ['profetas-menores'], periodo: 'unico' }];
  const s1 = J.registrar(J.estadoInicial(), rodada('s1', ids(21, 25), true, { modo: 'especial', especial: 'teste' }), opts('2026-11-05', { especiais: cfg }));
  assert.ok(s1.ganhos.some(g => g.pontos === 77));
  const s2 = J.registrar(s1.estado, rodada('s2', ids(26, 30), true, { modo: 'especial', especial: 'teste' }), opts('2026-11-07', { especiais: cfg }));
  assert.ok(!s2.ganhos.some(g => g.pontos === 77), 'desafio único não se repete');
  const s3 = J.registrar(J.estadoInicial(), rodada('s3', ids(1, 5), true, { modo: 'especial', especial: 'teste' }), opts('2026-11-05', { especiais: cfg }));
  assert.ok(!s3.ganhos.some(g => g.pontos === 77), 'perguntas fora da seção do desafio');
});

test('Jornada: dias seguidos, medalhas e subida de nível', () => {
  let e = J.estadoInicial(), eventos = [];
  const dias = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'];
  dias.forEach((d, i) => { const r = J.registrar(e, rodada('d' + i, ids(1 + (i % 4) * 10, 5 + (i % 4) * 10), true), opts(d)); e = r.estado; eventos = eventos.concat(r.eventos); });
  assert.equal(e.diasSeguidos, 7); assert.equal(e.maiorDias, 7);
  assert.ok(e.medalhas['primeiro-passo'] && e.medalhas.perseverante && !e.medalhas.dedicado);
  assert.ok(eventos.some(x => x.tipo === 'medalha' && x.id === 'primeiro-passo'));
  assert.ok(eventos.some(x => x.tipo === 'nivel' && x.para === 2), 'subiu para Discípulo');
  const pulo = J.registrar(e, rodada('pulo', ids(1, 5), true), opts('2026-11-10'));
  assert.equal(pulo.estado.diasSeguidos, 1); assert.equal(pulo.estado.maiorDias, 7);
  const seq = J.registrar(J.estadoInicial(), rodada('m', ids(1, 10), true), opts('2026-11-05'));
  assert.ok(seq.estado.medalhas['mente-atenta']);
  const med = J.medalhas(seq.estado); assert.equal(med.length, 7);
  assert.deepEqual(med.find(m => m.id === 'estudioso'), { id: 'estudioso', nome: 'Estudioso', descricao: 'Concluiu 50 quizzes.', icone: 'livros', em: null, atual: 1, meta: 50 });
  assert.equal(seq.estado.historico[0].tipo, 'medalha');
  assert.ok(seq.estado.iniciadoEm);
});

test('Jornada: domínio bíblico por seção e conversão do servidor', () => {
  const r = J.registrar(J.estadoInicial(), rodada('x', ids(1, 10), [1, 1, 1, 1, 1, 1, 1, 1, 0, 0]), opts('2026-11-05'));
  const dom = J.dominio(r.estado, { evangelhos: 20, 'profetas-menores': 20 }, Q.SECOES);
  const ev = dom.find(d => d.secao === 'evangelhos');
  assert.equal(dom.length, 10); assert.equal(ev.acertadas, 8); assert.equal(ev.pct, 40); assert.equal(ev.grau, 'Intermediário'); assert.equal(ev.taxa, 80);
  assert.equal(dom.find(d => d.secao === 'profetas-menores').grau, 'Iniciante');
  const s = J.doServidor({ pontos: 300, nivel: 3, rodadas: 4, respondidas: 40, acertos: 30, seq_atual: 2, seq_max: 9, dias_seguidos: 2, maior_dias: 3, ultimo_dia: '2026-11-05', medalhas: { 'primeiro-passo': 'x' }, iniciado_em: '2026-10-01' },
    [{ pergunta_id: 'p1', acertos: 1, erros: 0, ultima_em: '2026-11-05', secao: 'evangelhos' }], [{ criado_em: 'y', tipo: 'nivel', dados: { nivel: 3 } }]);
  assert.equal(s.pontos, 300); assert.equal(s.respostas.p1.s, 'evangelhos'); assert.deepEqual(s.historico[0], { em: 'y', tipo: 'nivel', nivel: 3 });
});
