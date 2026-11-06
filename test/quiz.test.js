// ATOS 2 — quiz e mural: cada resposta é conferida no texto da Bíblia Livre.
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../app/js/nucleo/referencias.js');
const S = require('../app/js/nucleo/busca.js');
const Q = require('../app/js/nucleo/quiz.js');
const M = require('../app/js/nucleo/mural.js');
const B = require('./biblia-node.js');

const ref = s => { const r = R.interpretar(s, B.contagem); assert.ok(r.ok, s + ': ' + r.erro); return r.ref; };
const textoRef = s => S.normalizar(R.versiculosDa(ref(s), B.contagem).map(([b, c, v]) => B.plano(B.texto(b, c, v))).join(' '));

const fs = require('fs'), path = require('path');
const DIR_QUIZ = path.join(__dirname, '..', 'app', 'quiz');
const INDICE = JSON.parse(fs.readFileSync(path.join(DIR_QUIZ, 'indice.json'), 'utf8'));
const BANCO = [].concat(...INDICE.arquivos.map(a => JSON.parse(fs.readFileSync(path.join(DIR_QUIZ, a.arquivo), 'utf8'))));
Q.carregar(BANCO);
const NOMES = Object.fromEntries(B.indice.livros.map((l, i) => [l.id, i]));

test('Quiz: banco com mais de 1.000 perguntas, variado e bem formado', () => {
  assert.ok(BANCO.length >= 1000, 'banco tem ' + BANCO.length);
  assert.equal(INDICE.total, BANCO.length);
  assert.equal(Q.BANCO.length, BANCO.length, 'todas passam na validação do aplicativo');
  const ids = new Set(), textos = new Set();
  for (const x of BANCO) {
    assert.ok(!ids.has(x.id), 'id repetido ' + x.id); ids.add(x.id);
    const t = S.normalizar(x.pergunta).replace(/[^a-z0-9 ]/g, '');
    assert.ok(!textos.has(t), 'pergunta repetida: ' + x.pergunta); textos.add(t);
    assert.equal(x.opcoes.length, x.formato === 'vf' ? 2 : 4, x.id);
    assert.equal(new Set(x.opcoes.map(S.normalizar)).size, x.opcoes.length, x.id + ' opções repetidas');
    assert.equal(x.opcoes[x.certa], x.resposta, x.id);
    assert.ok(x.explicacao.length >= 20, x.id + ' sem explicação');
    assert.ok([1, 2, 3, 4].includes(x.dificuldade), x.id);
    assert.equal(x.secao, INDICE.arquivos.find(a => a.secao === x.secao).secao);
    const cont = B.contagem(x.livro); assert.ok(cont && cont[x.capitulo - 1] >= x.versiculo, x.id + ': livro/capítulo/versículo inválidos');
  }
  const r = Q.resumo(BANCO);
  for (const s of Q.SECOES) assert.ok(r.secoes[s.id] >= 40, s.id + ': ' + r.secoes[s.id]);
  for (const d of [1, 2, 3, 4]) assert.ok(r.dificuldades[d] >= 100, 'dificuldade ' + d);
  for (const f of Object.keys(Q.FORMATOS)) assert.ok(r.formatos[f] >= 10, 'formato ' + f);
  for (const t of Q.TEMAS) assert.ok(r.temas[t.id] >= 10, 'tema ' + t.id);
});

test('Quiz: toda resposta está no texto da referência (Bíblia Livre)', () => {
  const falhas = [];
  const conferir = (id, refTxt, chave) => {
    const r = ref(refTxt);
    for (const k of chave.split(';')) {
      if (k.startsWith('#caps=')) { if (B.contagem(r.livro).length !== +k.slice(6)) falhas.push(`${id}: capítulos`); continue; }
      if (k.startsWith('#ordem=')) { if (NOMES[r.livro] !== NOMES[k.slice(7)] + 1) falhas.push(`${id}: ordem`); continue; }
      const t = textoRef(refTxt);
      if (!k.split('|').some(alt => t.includes(S.normalizar(alt)))) falhas.push(`${id} ${refTxt}: “${k}” não encontrado — ${t.slice(0, 160)}`);
    }
  };
  for (const x of BANCO) {
    if (x.chave) conferir(x.id, x.ref, x.chave);
    (x.conferir || []).forEach(c => conferir(x.id, c.ref, c.chave));
    if (!x.chave && !x.conferir) falhas.push(x.id + ': sem chave');
    if (x.formato === 'complete') assert.ok(textoRef(x.ref).includes(S.normalizar(x.resposta)), x.id);
  }
  assert.deepEqual(falhas, []);
});

test('Quiz: rodada, sorteio inteligente, desafio do dia e pontuação', () => {
  const r1 = Q.rodada('a', { n: 10 }), r2 = Q.rodada('a', { n: 10 });
  assert.deepEqual(r1.map(x => x.id), r2.map(x => x.id), 'determinístico');
  assert.equal(new Set(r1.map(x => x.id)).size, 10);
  for (const x of r1) assert.equal(x.opcoes[x.certa], x.resposta);
  const so = Q.rodada('b', { secoes: ['evangelhos'], dificuldade: 1, n: 50 });
  assert.ok(so.length > 0 && so.every(x => x.secao === 'evangelhos' && x.dificuldade === 1));
  const poucas = Q.filtrar({ secoes: ['apocalipse'], dificuldade: 4 });
  const ev = Q.rodada('c', { secoes: ['apocalipse'], dificuldade: 4, n: 3, evitar: poucas.slice(0, poucas.length - 3).map(x => x.id) });
  assert.deepEqual(ev.map(x => x.id).sort(), poucas.slice(-3).map(x => x.id).sort(), 'prefere perguntas não vistas');
  // sorteio inteligente: inéditas primeiro, nível alto puxa dificuldade
  const vistas = {}; Q.filtrar({ secoes: ['atos'] }).slice(0, 60).forEach(x => { vistas[x.id] = { a: 1, e: 0, u: '2026-11-01', s: 'atos' }; });
  const sel = Q.selecionar('s', { nivel: 1, respostas: vistas, hoje: '2026-11-05' }, { secoes: ['atos'], n: 10 });
  assert.ok(sel.filter(x => !vistas[x.id]).length >= 8, 'prioriza inéditas');
  const media = l => l.reduce((s, x) => s + x.dificuldade, 0) / l.length;
  let m1 = 0, m8 = 0; for (let i = 0; i < 20; i++) { m1 += media(Q.selecionar('n1' + i, { nivel: 1 }, { n: 10 })); m8 += media(Q.selecionar('n8' + i, { nivel: 8 }, { n: 10 })); }
  assert.ok(m8 > m1 + 0.8, 'dificuldade sobe com o nível: ' + m1 / 20 + ' → ' + m8 / 20);
  const erros = {}; Q.filtrar({ secoes: ['paulo'] }).slice(0, 10).forEach(x => { erros[x.id] = { a: 0, e: 3, s: 'paulo' }; });
  assert.ok(Q.taxaDeErroPorSecao(erros).paulo === 1);
  const vf = Q.BANCO.find(x => x.formato === 'vf'); assert.deepEqual(Q.preparar(vf, 'x').opcoes, ['Verdadeiro', 'Falso'], 'V/F não embaralha');
  const d = Q.desafioDoDia('2026-11-05');
  assert.equal(d.length, 5); assert.equal(new Set(d.map(x => x.secao)).size, 5, 'cinco seções diferentes');
  assert.deepEqual(d.map(x => x.id), Q.desafioDoDia('2026-11-05').map(x => x.id));
  const p = Q.pontuar([{ certo: true, dificuldade: 1 }, { certo: true, dificuldade: 3 }, { certo: true, nivel: 2 }, { certo: false, dificuldade: 1 }]);
  assert.deepEqual(p, { pontos: 10 + 15 + 14, acertos: 3, total: 4, melhorSequencia: 3 });
  assert.ok(Q.POR_ID.at1 && Q.POR_ID.qd108, 'ids das perguntas originais preservados');
});

test('Mural: 95 teses, grupos contínuos e referências válidas', () => {
  assert.equal(M.TESES.length, 95);
  let esperado = 1;
  for (const g of M.TESES_GRUPOS) { assert.equal(g.de, esperado); assert.ok(g.ate >= g.de); esperado = g.ate + 1; }
  assert.equal(esperado, 96);
  for (const t of M.TESES) { assert.ok(t.t.length > 20); (t.refs || []).forEach(ref); }
  assert.match(M.TESES[0].t, /toda a vida dos fiéis fosse arrependimento/);
  assert.match(M.TESES[61].t, /verdadeiro tesouro da Igreja é o santíssimo evangelho/);
  for (const c of M.CURIOSIDADES) { assert.ok(c.fontes.length > 0, c.id); c.refs.forEach(ref); }
  assert.ok(textoRef('At 11:26').includes('antioquia') && textoRef('At 11:26').includes('cristaos'));
  assert.ok(textoRef('At 17:11').includes('escrituras'));
});

test('Mural: estatísticas calculadas da Bíblia Livre', () => {
  const s = M.estatisticas(B.indice);
  assert.equal(s.livros, 66); assert.equal(s.capitulos, 1189); assert.equal(s.versiculos, 31102);
  assert.equal(s.at.versiculos + s.nt.versiculos, 31102);
  assert.deepEqual(s.maiorCapitulo, { livro: 'PSA', cap: 119, n: 176 });
  assert.deepEqual(s.menorCapitulo, { livro: 'PSA', cap: 117, n: 2 });
  assert.deepEqual(s.capitulosDoMeio, [{ livro: 'PSA', cap: 117 }]);
  assert.deepEqual(s.versiculosDoMeio.map(x => x.livro + x.cap + ':' + x.v), ['PSA103:1', 'PSA103:2']);
  const ex = M.extremosDoTexto(B.indice.livros.map(l => B.livro(l.id)), B.plano);
  assert.deepEqual([ex.maisLongo.livro, ex.maisLongo.cap, ex.maisLongo.v], ['EST', 8, 9]);
  assert.ok(ex.maisCurtos.some(x => x.livro === 'JHN' && x.cap === 11 && x.v === 35));
});

const A = require('../app/js/nucleo/assistente.js');
const interp = s => R.interpretar(s, B.contagem);
test('Assistente: introduções dos 66 livros e obras de referência', () => {
  for (const l of B.indice.livros) {
    const i = A.INTRODUCOES[l.id];
    assert.ok(i && i.autoria && i.epoca && i.tema, 'introdução de ' + l.id);
  }
  assert.equal(Object.keys(A.INTRODUCOES).length, 66);
  assert.ok(A.OBRAS.length >= 8 && A.OBRAS.every(o => o.id && o.titulo && o.autor));
});
test('Assistente: validação descarta referências e obras inventadas', () => {
  const { estudo, descartadas } = A.validarEstudo({ titulo: 'x', resumo: 'Resumo', sentido: 'S', ligacoes: [{ ref: 'Jo 3:16', nota: 'a' }, { ref: 'Jo 99:1', nota: 'b' }, { ref: 'Hezequias 2:3' }],
    obras: ['ndb', 'livro-inventado', 'ndb'], palavras: [{ termo: 'ágape', explicacao: 'amor' }], perguntas: ['?'] }, interp);
  assert.equal(estudo.ligacoes.length, 1); assert.equal(estudo.ligacoes[0].ref.livro, 'JHN');
  assert.deepEqual(descartadas, ['Jo 99:1', 'Hezequias 2:3']);
  assert.deepEqual(estudo.obras, ['ndb']);
  assert.throws(() => A.validarEstudo({}, interp));
  const p = A.validarPesquisa({ resumo: 'r', versiculos: [{ ref: 'Fp 4:6-7', motivo: 'ansiedade' }, { ref: 'Fp 4:6', motivo: 'dup' }, { ref: 'Sl 23', motivo: 'cap' }, { ref: 'Mt 6:25-34' }, { ref: 'Xyz 1:1' }] }, interp);
  assert.equal(p.versiculos.length, 2);
  assert.equal(p.versiculos[1].ref.v2, 30, 'trecho longo limitado a 6 versículos');
  assert.deepEqual(p.descartadas, ['Sl 23', 'Xyz 1:1']);
  const refs = A.referenciasNoTexto('Veja Jo 3:16 e também 1 Co 13:4-7, além de Rm 99:1.', interp);
  assert.deepEqual(refs.map(r => r.ref.livro + r.ref.cap), ['JHN3', '1CO13']);
  assert.ok(A.sinalDeCrise('às vezes penso em me matar') && !A.sinalDeCrise('o que é a morte segundo Paulo?'));
  assert.match(A.promptEstudo('João 3:16', 'BLIVRE'), /NUNCA invente/);
});
test('Assistente (modo guia): referências cruzadas de 1911 e temas da pergunta', () => {
  const C = require('../app/js/nucleo/conteudo.js');
  assert.deepEqual(A.refsDaNota1911('cap. 1:13; Gl 6:15; Tt 3:5; 1Pe 1:23', 'Jo', 3), ['Jo 1:13', 'Gl 6:15', 'Tt 3:5', '1Pe 1:23']);
  assert.deepEqual(A.refsDaNota1911('Sl 8:3 e 33:6. Is 40:26; v. 5', 'Gn', 1), ['Sl 8:3', 'Sl 33:6', 'Is 40:26', 'Gn 1:5']);
  // todas as notas de referência da ALM1911AT de João viram referências válidas
  const fs = require('fs'), path = require('path');
  const jo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app', 'biblia', 'alm1911at', 'JHN.json'), 'utf8'));
  let total = 0, validas = 0;
  for (const [cv, ns] of Object.entries(jo.notas)) for (const n of ns) if (n.tipo === 'ref') for (const s of A.refsDaNota1911(n.t, 'Jo', +cv.split(':')[0])) { total++; if (interp(s).ok) validas++; }
  assert.ok(total > 500 && validas / total > 0.97, `válidas ${validas}/${total}`);
  assert.deepEqual(A.temasDaPergunta('o que a Bíblia diz sobre perdão', C.TEMAS, S.normalizar).map(t => t.id), ['perdao']);
  assert.ok(A.temasDaPergunta('versículos sobre fé', C.TEMAS, S.normalizar).some(t => t.id === 'fe'));
  assert.deepEqual(A.termosDaPergunta('Versículos sobre ansiedade e medo', S.normalizar), ['ansiedade', 'medo']);
});
