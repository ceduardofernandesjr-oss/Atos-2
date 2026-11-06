// Testes da Biblioteca: itens unificados, pesquisa, ordenação e coleções com vários tipos de conteúdo
const test = require('node:test');
const assert = require('node:assert');
const B = require('../app/js/nucleo/biblioteca.js');

const dados = () => ({
  favoritos: [{ id: 'JHN.3.16', criadoEm: '2026-11-01T10:00:00Z', colecoes: ['c1'] }, { id: 'ISA.54.10', criadoEm: '2026-11-05T10:00:00Z', colecoes: [] }],
  notas: [{ id: 'n1', refs: ['JHN.1.14'], texto: 'O Verbo se fez carne\nsegunda linha', atualizadoEm: '2026-11-03T10:00:00Z' },
    { id: 'n2', titulo: 'Oração da manhã', refs: [], texto: 'Agradecer', atualizadoEm: '2026-10-01T10:00:00Z' }],
  estudos: [{ id: 'e1', titulo: 'Batismo em Atos', categoria: 'Doutrina', corpo: 'arrependimento', refs: [{ ref: 'At 2:38' }], criadoEm: '2026-11-02T10:00:00Z' }],
  devSalvos: [{ id: 'd1', titulo: 'Perseverar juntos', categoria: 'Comunhão', data: '2026-11-04', _t: Date.parse('2026-11-04T12:00:00Z') }],
  devocionais: [{ id: 'd1', passagem: 'At 2:42' }],
  artes: [{ id: 'a1', nome: 'Amor de Deus', miniatura: 'data:x', criadoEm: '2026-11-06T08:00:00Z', estado: 'rascunho' }],
  colecoes: [{ id: 'c1', nome: 'Promessas de Deus', descricao: 'Para dias difíceis', itens: [{ tipo: 'estudo', id: 'e1' }, { tipo: 'nota', id: 'apagada' }] }],
  rotulo: k => ({ 'JHN.3.16': 'João 3:16', 'ISA.54.10': 'Isaías 54:10' }[k] || k),
  rotuloRefs: refs => refs.join('; '),
  chavesDe: s => ({ 'At 2:38': ['ACT.2.38'], 'At 2:42': ['ACT.2.42'] }[s] || [])
});

test('itens unificados com dados reais de cada tipo', () => {
  const its = B.itens(dados());
  assert.deepStrictEqual(its.map(i => i.tipo).sort(), ['arte', 'devocional', 'estudo', 'nota', 'nota', 'versiculo', 'versiculo']);
  const n1 = its.find(i => i.id === 'n1'), n2 = its.find(i => i.id === 'n2');
  assert.strictEqual(n1.titulo, 'JHN.1.14', 'sem título: usa as referências');
  assert.strictEqual(n2.titulo, 'Oração da manhã');
  const dv = its.find(i => i.tipo === 'devocional');
  assert.deepStrictEqual([dv.ref, dv.chaves[0], dv.data.slice(0, 10)], ['At 2:42', 'ACT.2.42', '2026-11-04']);
  assert.deepStrictEqual(its.find(i => i.tipo === 'estudo').chaves, ['ACT.2.38']);
  const c = B.contagens(dados());
  assert.deepStrictEqual([c.versiculos, c.estudos, c.devocionais, c.notas, c.colecoes, c.artes], [2, 1, 1, 2, 1, 1]);
  assert.deepStrictEqual(B.itens({}), []);
});

test('ordenação: recentes, antigos, A–Z e ordem bíblica', () => {
  const its = B.itens(dados());
  assert.strictEqual(B.ordenar(its, 'recentes')[0].tipo, 'arte');
  assert.strictEqual(B.ordenar(its, 'antigos')[0].id, 'n2');
  assert.strictEqual(B.ordenar(its, 'az')[0].titulo, 'Amor de Deus');
  const bib = B.ordenar(its.filter(i => i.chaves && i.chaves.length), 'biblica', ['ISA', 'JHN', 'ACT']);
  assert.deepStrictEqual(bib.map(i => i.chaves[0]), ['ISA.54.10', 'JHN.1.14', 'JHN.3.16', 'ACT.2.38', 'ACT.2.42']);
});

test('pesquisa por referência, texto do versículo, título, tema e coleção', () => {
  const its = B.itens(dados()), cols = [{ id: 'c1', nome: 'Promessas de Deus', descricao: '', membros: ['estudo:e1'] }];
  assert.deepStrictEqual(B.pesquisar(its, '', { ref: { livro: 'JHN', cap: 3, v1: 16 } }).map(i => i.id), ['JHN.3.16']);
  assert.deepStrictEqual(B.pesquisar(its, '', { ref: { livro: 'JHN', cap: null } }).map(i => i.id).sort(), ['JHN.3.16', 'n1']);
  assert.deepStrictEqual(B.pesquisar(its, 'montes', { textos: { 'ISA.54.10': 'Porque os montes se retirarão' } }).map(i => i.id), ['ISA.54.10']);
  assert.strictEqual(B.pesquisar(its, 'batismo')[0].id, 'e1');
  assert.strictEqual(B.pesquisar(its, 'comunhao')[0].id, 'd1', 'tema sem acento');
  assert.strictEqual(B.pesquisar(its, 'promessas', { colecoes: cols })[0].motivo, 'coleção Promessas de Deus');
  assert.deepStrictEqual(B.pesquisar(its, 'xyzw'), []);
  assert.deepStrictEqual(B.pesquisar(its, '   '), []);
});

test('coleções: membros de vários tipos, sem duplicar e sem itens apagados', () => {
  const d = dados(), col = d.colecoes[0], todos = B.itens(d);
  assert.deepStrictEqual(B.membros(col, d.favoritos), [{ tipo: 'versiculo', id: 'JHN.3.16' }, { tipo: 'estudo', id: 'e1', em: undefined }, { tipo: 'nota', id: 'apagada', em: undefined }]);
  assert.deepStrictEqual(B.resolver(col, d.favoritos, todos).map(i => i.id), ['JHN.3.16', 'e1'], 'conteúdo apagado não aparece');
  const mais = B.comItem(col, 'devocional', 'd1', true, 'agora');
  assert.strictEqual(mais.filter(m => m.id === 'd1').length, 1);
  assert.strictEqual(B.comItem({ itens: mais }, 'devocional', 'd1', true, 'de novo').filter(m => m.id === 'd1').length, 1, 'sem duplicar');
  assert.ok(!B.comItem({ itens: mais }, 'devocional', 'd1', false).some(m => m.id === 'd1'));
  assert.ok(B.contem(col, d.favoritos, 'versiculo', 'JHN.3.16'));
  assert.deepStrictEqual(B.semItem(d.colecoes, 'estudo', 'e1'), [{ id: 'c1', itens: [{ tipo: 'nota', id: 'apagada' }] }]);
});

test('validação e compartilhamento de coleções', () => {
  const ex = [{ id: 'c1', nome: 'Fé' }];
  assert.strictEqual(B.validarColecao({ nome: '  ' }, ex).erro, 'Dê um nome à coleção.');
  assert.strictEqual(B.validarColecao({ nome: 'fe' }, ex).erro, 'Já existe uma coleção com esse nome.');
  assert.strictEqual(B.validarColecao({ nome: 'Fé' }, ex, 'c1').nome, 'Fé', 'renomear a própria coleção');
  assert.deepStrictEqual(B.validarColecao({ nome: ' Oração  diária ', icone: 'virus' }, ex), { nome: 'Oração diária', descricao: '', icone: 'colecao' });
  const d = dados(), col = d.colecoes[0];
  const txt = B.textoColecao(col, B.resolver(col, d.favoritos, B.itens(d)), { 'JHN.3.16': 'Porque Deus amou o mundo' }, 'BLIVRE');
  assert.ok(txt.startsWith('Coleção: Promessas de Deus\nPara dias difíceis'));
  assert.ok(txt.includes('• João 3:16 (BLIVRE) — “Porque Deus amou o mundo”'));
  assert.ok(txt.includes('• Estudo: Batismo em Atos'));
});
