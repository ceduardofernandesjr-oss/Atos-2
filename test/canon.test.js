const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const C = require('../app/js/nucleo/canon.js');
const R = require('../app/js/nucleo/referencias.js');

test('categorias cobrem os 66 livros, sem sobrar nem repetir, na ordem', () => {
  const ids = C.CATEGORIAS.flatMap(c => c.livros);
  assert.deepEqual(ids, R.LIVROS.map(l => l.id));
  assert.deepEqual(C.categoriasDo('AT').map(c => c.nome), ['Pentateuco', 'Livros históricos', 'Livros poéticos', 'Profetas maiores', 'Profetas menores']);
  assert.deepEqual(C.categoriasDo('NT').map(c => c.nome), ['Evangelhos', 'História da Igreja', 'Cartas de Paulo', 'Cartas gerais', 'Profecia']);
  assert.equal(C.livrosDo('AT').length, 39); assert.equal(C.livrosDo('NT').length, 27);
  C.CATEGORIAS.forEach(c => c.livros.forEach(id => assert.equal(R.POR_ID[id].test, c.test, id)));
});

test('capítulos por livro conferem com o índice de cada tradução', () => {
  const base = path.join(__dirname, '../app/biblia');
  fs.readdirSync(base).filter(d => fs.existsSync(path.join(base, d, 'indice.json'))).forEach(v => {
    const ix = JSON.parse(fs.readFileSync(path.join(base, v, 'indice.json'), 'utf8'));
    ix.livros.forEach(l => assert.equal(C.CAPITULOS[l.id], l.versos.length, v + ' ' + l.id));
  });
  assert.equal(C.progressoTestamento({}, 'AT').total, 929);
  assert.equal(C.progressoTestamento({}, 'NT').total, 260);
});

test('progresso usa só os capítulos marcados como lidos', () => {
  const lidos = { 'GEN.1': true, 'GEN.2': true, 'ACT.2': true, 'XYZ.1': true };
  assert.deepEqual(C.progressoLivro(lidos, 'GEN'), { lidos: 2, total: 50, fracao: 0.04, completo: false });
  assert.equal(C.progressoTestamento(lidos, 'NT').lidos, 1);
  assert.equal(C.progressoTestamento({}, 'AT').lidos, 0);
  const tudo = {}; for (let i = 1; i <= 4; i++) tudo['RUT.' + i] = true;
  assert.equal(C.progressoLivro(tudo, 'RUT').completo, true);
  // contagem da tradução tem prioridade sobre a tabela
  assert.equal(C.capitulos('MAL', () => [1, 2, 3]), 3);
  assert.equal(C.capitulos('MAL', () => null), 4);
});

test('busca de livros', () => {
  const primeiro = q => (C.buscar(q)[0] || {}).id;
  assert.equal(primeiro('Gênesis'), 'GEN'); assert.equal(primeiro('genesis'), 'GEN'); assert.equal(primeiro('gen'), 'GEN');
  assert.equal(primeiro('Salmos'), 'PSA'); assert.equal(primeiro('sl'), 'PSA'); assert.equal(primeiro('salmo'), 'PSA');
  assert.equal(primeiro('Isaías'), 'ISA'); assert.equal(primeiro('isaias'), 'ISA');
  assert.equal(primeiro('Mateus'), 'MAT'); assert.equal(primeiro('João'), 'JHN'); assert.equal(primeiro('jo'), 'JHN'); assert.equal(primeiro('Jó'), 'JOB');
  assert.equal(primeiro('Romanos'), 'ROM'); assert.equal(primeiro('rom'), 'ROM'); assert.equal(primeiro('Apocalipse'), 'REV'); assert.equal(primeiro('ap'), 'REV');
  assert.equal(primeiro('1 jo'), '1JN'); assert.equal(primeiro('2 tim'), '2TI'); assert.equal(primeiro('fil'), 'PHP');
  assert.deepEqual(C.buscar('joão').map(l => l.id), ['JHN', '1JN', '2JN', '3JN']);
  assert.deepEqual(C.buscar('reis').map(l => l.id), ['1KI', '2KI']);
  assert.deepEqual(C.buscar(''), []); assert.deepEqual(C.buscar('xyz'), []);
  assert.ok(C.pareceReferencia('Jo 3:16') && C.pareceReferencia('Sl 23') && C.pareceReferencia('1 Co 13'));
  assert.ok(!C.pareceReferencia('1 Jo') && !C.pareceReferencia('Gênesis'));
});
