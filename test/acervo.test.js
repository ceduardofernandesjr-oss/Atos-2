// ATOS 2 — testes do acervo (Biblioteca › Livros e Artigos)
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const A = require('../app/js/nucleo/acervo.js');

const app = path.join(__dirname, '..', 'app');
const catalogo = JSON.parse(fs.readFileSync(path.join(app, 'acervo', 'catalogo.json'), 'utf8'));
const pubs = catalogo.publicacoes;

test('catálogo: ids únicos, publicados válidos, arquivos presentes e rascunhos de IA em revisão', () => {
  const ids = new Set();
  pubs.forEach(p => {
    assert.ok(!ids.has(p.id), 'id repetido: ' + p.id); ids.add(p.id);
    assert.ok(A.TIPOS[p.tipo], 'tipo: ' + p.id);
    assert.ok(A.CATEGORIAS.some(c => c.id === p.categoria), 'categoria: ' + p.id);
    assert.ok(p.licenca && A.LICENCAS[p.licenca.codigo], 'licença: ' + p.id);
    assert.equal(p.verificacao.direitos, 'verificado', 'direitos: ' + p.id);
    if (p.acesso === 'integral') {
      assert.ok(fs.existsSync(path.join(app, p.arquivo)), 'arquivo: ' + p.arquivo);
      assert.ok(A.LICENCAS[p.licenca.codigo].permiteTexto, 'texto integral só com licença que permite: ' + p.id);
      const t = JSON.parse(fs.readFileSync(path.join(app, p.arquivo), 'utf8'));
      assert.ok(t.secoes.length && t.secoes.every(s => s.titulo && Array.isArray(s.p)), 'formato do texto: ' + p.id);
      assert.ok(!/gutenberg/i.test(JSON.stringify(t)), 'sem referências ao Project Gutenberg no texto: ' + p.id);
    }
    if (p.acesso === 'link') assert.match(p.fonte.url, /^https:\/\//, 'link: ' + p.id);
    if (p.origem && p.origem.ia) assert.equal(p.situacao, 'revisao', 'tradução com IA começa em revisão: ' + p.id);
    if (p.situacao === 'publicado') assert.ok(A.podePublicar(p).ok, p.id + ': ' + A.podePublicar(p).faltas.join(', '));
  });
  assert.ok(!/gutenberg/i.test(JSON.stringify(catalogo)), 'catálogo público sem referências ao Project Gutenberg');
  assert.ok(pubs.filter(p => p.idioma === 'pt').length >= 8, 'prioridade ao português');
});

test('mesclar: edição da administração, item novo, retirado e rascunho', () => {
  const seed = [{ id: 'a', titulo: 'A', situacao: 'publicado' }, { id: 'b', titulo: 'B', situacao: 'revisao' }];
  const m = A.mesclar(seed, [{ id: 'a', titulo: 'A2' }, { id: 'c', titulo: 'C', situacao: 'publicado' }, { id: 'b', removido: true }], [{ id: 'd', titulo: 'D' }, { id: 'a', titulo: 'A3' }]);
  assert.deepEqual(m.map(x => x.id), ['a', 'b', 'c', 'd']);
  assert.equal(m[0].titulo, 'A2'); assert.equal(m[0]._revisaoPendente.titulo, 'A3');
  assert.equal(m[1].removido, true);
  assert.equal(m[2]._origem, 'editorial');
  assert.equal(m[3].situacao, 'revisao');
});

test('regras de publicação: licença, revisão editorial e link', () => {
  const base = pubs.find(p => p.id === 'confissoes-agostinho');
  assert.ok(A.visivel(base));
  assert.ok(!A.visivel(Object.assign({}, base, { verificacao: { direitos: 'verificado' } })), 'sem revisão editorial não aparece');
  const nd = Object.assign({}, base, { licenca: { codigo: 'cc-by-nc-nd-3.0' } });
  assert.ok(A.podePublicar(nd).faltas.some(f => /reproduzir o texto/.test(f)), 'NC-ND não permite texto integral');
  const sem = Object.assign({}, pubs.find(p => p.acesso === 'link'), { fonte: { nome: 'X', url: 'http://x' } });
  assert.ok(A.podePublicar(sem).faltas.some(f => /https/.test(f)));
  assert.ok(!A.visivel(Object.assign({}, base, { removido: true })));
  assert.equal(A.situacao(pubs.find(p => p.id === 'didaque')), 'revisao');
});

test('filtros: categoria temática ou por tipo, idioma, acesso e pesquisa sem acento', () => {
  const vis = pubs.filter(A.visivel);
  const livros = A.filtrar(vis, { categoria: 'livros' });
  assert.ok(livros.every(p => p.categoria === 'livros' || p.tipo === 'livro'));
  assert.ok(livros.some(p => p.id === 'confissoes-agostinho'), 'livro de outra categoria aparece em Livros cristãos');
  assert.ok(A.filtrar(vis, { idioma: 'pt' }).every(p => p.idioma === 'pt'));
  assert.ok(A.filtrar(vis, { acesso: 'app' }).every(p => p.acesso !== 'link'));
  assert.equal(A.filtrar(vis, { consulta: 'eusebio' })[0].id, 'historia-eclesiastica-eusebio');
  assert.equal(A.filtrar(vis, { consulta: 'Atanasio' })[0].id, 'encarnacao-atanasio');
  assert.ok(A.filtrar(vis, { consulta: 'igreja primitiva' }).length >= 3, 'temas entram na pesquisa');
  assert.deepEqual(A.ordenar([{ ano: '1894' }, { ano: 'c. 397–401' }, { ano: '1535' }], 'ano').map(x => x.ano), ['c. 397–401', '1535', '1894']);
});

test('progresso, citação e chaves', () => {
  assert.equal(A.progresso(null, 10), 0);
  assert.equal(A.progresso({ secao: 4, secoesVistas: { 0: 1, 1: 1 } }, 10), 40);
  assert.equal(A.progresso({ concluidoEm: '2026-11-06' }, 10), 100);
  assert.equal(A.progresso({ secao: 9, par: 3 }, 10), 95);
  const c = A.citacao(pubs.find(p => p.id === 'artigo-jesus-historico'), '6 nov. 2026');
  assert.match(c, /^JOSÉ ARMANDO VICENTE\. A discussão cristológica/);
  assert.match(c, /Disponível em: https:\/\/doi\.org\/10\.15448/);
  assert.match(c, /Acesso em: 6 nov\. 2026\.$/);
  assert.equal(A.chaveFavorito('x'), 'obra-x');
  assert.equal(A.chaveDestaque('x', 2, 5), 'obra-x-2-5');
  assert.ok(A.ehObra({ id: 'obra-x' }) && !A.ehObra({ id: 'JHN.3.16' }));
});

test('referências bíblicas em inglês com algarismos romanos', () => {
  const r = A.referenciasIngles('(1) John viii. 12. (2) Revelations ii. 17. See also 1 Cor. 15:3 and Rom. iii. 28; John viii. 12 again; Gal. 2:20.');
  assert.deepEqual(r.map(x => x.chave), ['JHN.8.12', 'REV.2.17', '1CO.15.3', 'ROM.3.28', 'GAL.2.20']);
  assert.equal(A.romano('xiv'), 14); assert.equal(A.romano('xl'), 40);
  assert.deepEqual(A.referenciasIngles('in the year 1520, chapter 3'), []);
});

test('cadastro e aprovação pela administração', () => {
  assert.match(A.validarCadastro({ titulo: 'X' }).erro, /autor/);
  const ok = { titulo: 'O Evangelho em Atos', autor: 'Fulano de Tal', tipo: 'artigo', categoria: 'estudos', idioma: 'pt', descricao: 'Estudo.', licenca: 'cc-by-4.0', acesso: 'link', url: 'https://exemplo.org/artigo', temas: 'Igreja primitiva, Atos' };
  const r = A.validarCadastro(ok, []).registro;
  assert.equal(r.id, 'o-evangelho-em-atos-tal');
  assert.deepEqual(r.temas, ['Igreja primitiva', 'Atos']);
  assert.match(A.validarCadastro(Object.assign({}, ok, { url: 'exemplo.org' })).erro, /https/);
  assert.match(A.validarCadastro(Object.assign({}, ok, { acesso: 'integral', licenca: 'direitos-reservados' })).erro, /não permite/);
  const ap = A.aprovar(Object.assign({}, r, { situacao: 'revisao', _rascunho: true }), 'Editor', '2026-11-06T10:00:00Z');
  assert.equal(ap.situacao, 'publicado'); assert.equal(ap.verificacao.editorialEm, '2026-11-06'); assert.ok(!('_rascunho' in ap));
  assert.ok(A.visivel(ap));
});
