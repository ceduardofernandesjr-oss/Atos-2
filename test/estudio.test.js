// Testes do núcleo do Estúdio de Criação v2 (camadas, modelos, cores, histórico e IA)
const test = require('node:test');
const assert = require('node:assert');
const A = require('../app/js/nucleo/arte.js');
const M = require('../app/js/nucleo/modelos-arte.js');

const V1 = { formato: 'whatsapp', conteudo: { tipo: 'versiculo', ref: 'Sl 23:1', versao: 'blivre' }, fundo: { tipo: 'banco', id: 'leao' }, escurecer: 0.3,
  estilo: { fonte: 'Playfair Display', cor: '#F1DDB3', sombra: false, largura: 0.7, alinhar: 'left', tamanho: 70 }, pos: { x: 0.4, y: 0.6 },
  referencia: { mostrar: false }, assinatura: { texto: '@eu', mostrar: true }, marca: true };

test('formatos: os quatro principais e o personalizado', () => {
  const tam = id => { const f = A.formatoDe({ formato: id }); return f.w + 'x' + f.h; };
  assert.strictEqual(tam('feed'), '1080x1350');
  assert.strictEqual(tam('quadrado'), '1080x1080');
  assert.strictEqual(tam('stories'), '1080x1920');
  assert.strictEqual(tam('status'), '1080x1920');
  const p = A.formatoDe({ formato: 'personalizado', personalizado: { w: 99999, h: 50 } });
  assert.deepStrictEqual([p.w, p.h], [A.LIMITE_PX, 200]);
  assert.strictEqual(A.formatoDe({ formato: 'papel-pc' }).base, 1080);
});

test('migração da v1: mesma aparência em camadas, sem perder dados', () => {
  const s = A.migrar(V1);
  assert.strictEqual(s.v, 2);
  assert.strictEqual(s.formato, 'quadrado');
  const V = s.camadas.find(c => c.papel === 'versiculo');
  assert.deepStrictEqual([V.x, V.y, V.largura, V.tamanho, V.fonte, V.cor, V.alinhar, V.sombra], [0.4, 0.6, 0.7, 70, 'Playfair Display', '#F1DDB3', 'left', 0]);
  assert.strictEqual(s.camadas.find(c => c.papel === 'referencia').visivel, false);
  assert.strictEqual(s.camadas.find(c => c.papel === 'assinatura').texto, '@eu');
  assert.ok(s.camadas.some(c => c.papel === 'marca'));
  assert.deepStrictEqual([s.fundo.tipo, s.fundo.id, s.fundo.sobreposicao.opacidade], ['banco', 'leao', 0.3]);
  assert.deepStrictEqual(A.migrar(s), s, 'migrar é idempotente');
  assert.strictEqual(s.conteudo.ref, 'Sl 23:1');
});

test('normalizar: sempre um único versículo e ids únicos', () => {
  const s = A.normalizar({ camadas: [{ papel: 'versiculo' }, { papel: 'versiculo' }, { tipo: 'elemento', forma: 'circulo', id: 'x' }, { tipo: 'elemento', forma: 'circulo', id: 'x' }, { tipo: 'elemento', forma: 'invalida' }] });
  assert.strictEqual(s.camadas.filter(c => c.papel === 'versiculo').length, 1);
  assert.strictEqual(new Set(s.camadas.map(c => c.id)).size, s.camadas.length);
  assert.ok(!s.camadas.some(c => c.forma === 'invalida'));
  assert.strictEqual(A.normalizar({}).camadas.filter(c => c.papel === 'versiculo').length, 1);
});

test('modelos: 12 categorias completas, válidos e sem texto bíblico embutido', () => {
  assert.strictEqual(M.CATEGORIAS.length, 12);
  M.CATEGORIAS.forEach(c => assert.ok(M.daCategoria(c.id).length >= 5, c.id));
  assert.strictEqual(new Set(M.MODELOS.map(m => m.id)).size, M.MODELOS.length);
  const fotos = ['rochas-mar', 'praia', 'aurora-boreal', 'vulcao', 'pier', 'jardim', 'fiorde', 'capim', 'lago-amanhecer', 'urzes', 'lago-outono', 'floresta-nevoa', 'caminho-outono', 'cisnes', 'caminho-estreito', 'iceberg', 'leao', 'cidade', 'papoulas', 'mapa-mundi', 'folha', 'telhado', 'vela', 'flores-vermelhas', 'margaridas'];
  M.MODELOS.forEach(m => {
    const s = A.aplicarModelo(A.specPadrao(), m);
    assert.strictEqual(s.camadas.filter(c => c.papel === 'versiculo').length, 1, m.id);
    assert.ok(m.camadas.some(c => c.papel === 'referencia'), m.id + ' tem referência');
    m.camadas.filter(c => c.papel === 'versiculo').forEach(c => assert.ok(!c.texto, m.id + ': o versículo não vem do modelo'));
    s.camadas.forEach(c => {
      assert.ok(A.hexValido(c.cor), m.id + ' cor ' + c.cor);
      if (c.tipo === 'texto') assert.ok(A.FONTE_POR_FAM[c.fonte], m.id + ' fonte ' + c.fonte);
      if (c.forma === 'icone') assert.ok(A.ICONES.includes(c.icone), m.id + ' ícone');
      if (c.forma === 'ornamento') assert.ok(A.ORNAMENTOS.includes(c.estilo), m.id + ' ornamento');
      if (c.forma === 'textura') assert.ok(A.TEXTURAS.includes(c.estilo), m.id + ' textura');
    });
    if (s.fundo.tipo === 'banco') assert.ok(fotos.includes(s.fundo.id), m.id + ' foto');
    // textos legíveis sobre fundos sólidos
    if (s.fundo.tipo === 'cor') {
      const V = s.camadas.find(c => c.papel === 'versiculo');
      const atras = s.camadas.filter(c => c.tipo === 'elemento' && c.forma === 'retangulo' && c.w >= 0.9 && Math.abs(c.y - V.y) < c.h / 2);
      const base = atras.length ? atras[atras.length - 1].cor : s.fundo.cor;
      if (!V.contorno) assert.ok(A.contraste(V.cor, base) >= 4.5, m.id + ': contraste ' + A.contraste(V.cor, base).toFixed(2));
    }
  });
});

test('aplicar modelo mantém versículo, formato e nome', () => {
  const s = A.normalizar({ nome: 'Minha', formato: 'stories', conteudo: { tipo: 'versiculo', ref: 'Jo 3:16', versao: 'alm1911', rotulo: 'João 3.16' } });
  const r = A.aplicarModelo(s, M.POR_ID['ele-marinho']);
  assert.deepStrictEqual([r.nome, r.formato, r.conteudo.ref, r.conteudo.versao, r.conteudo.rotulo], ['Minha', 'stories', 'Jo 3:16', 'alm1911', 'João 3.16']);
  assert.strictEqual(r.modelo, 'ele-marinho');
});

test('camadas: subir, descer, duplicar e excluir (o versículo é protegido)', () => {
  let cs = A.aplicarModelo(A.specPadrao(), M.POR_ID['min-azul']).camadas;   // ícone, versículo, referência
  const icone = cs[0].id;
  cs = A.moverCamada(cs, icone, 1); assert.strictEqual(cs[1].id, icone);
  cs = A.moverCamada(cs, icone, -5); assert.strictEqual(cs[1].id, icone, 'fora do limite não move');
  const d = A.duplicarCamada(cs, icone); assert.ok(d.id && d.id !== icone); assert.strictEqual(d.camadas.length, cs.length + 1);
  assert.strictEqual(A.duplicarCamada(cs, 'versiculo').id, null);
  assert.strictEqual(A.removerCamada(cs, 'versiculo').length, cs.length);
  assert.strictEqual(A.removerCamada(cs, icone).length, cs.length - 1);
});

test('histórico: desfazer e refazer', () => {
  const hst = A.Historico(3);
  ['a', 'b', 'c', 'd'].forEach(x => hst.registrar(x));
  assert.strictEqual(hst.tamanho(), 3);
  assert.strictEqual(hst.desfazer(), 'c'); assert.strictEqual(hst.desfazer(), 'b'); assert.strictEqual(hst.desfazer(), null);
  assert.strictEqual(hst.refazer(), 'c');
  hst.registrar('x'); assert.strictEqual(hst.podeRefazer(), false);
  assert.strictEqual(hst.registrar('x'), false, 'estado repetido não entra');
});

test('cores: conversões, contraste e harmonias', () => {
  assert.strictEqual(A.hexValido('a58a57'), '#A58A57');
  assert.strictEqual(A.hexValido('#fff'), '#FFFFFF');
  assert.strictEqual(A.hexValido('azul'), null);
  const hsl = A.hexParaHsl('#192D50'); assert.strictEqual(A.hslParaHex(hsl[0], hsl[1], hsl[2]), '#192D50');
  assert.strictEqual(Math.round(A.contraste('#000000', '#FFFFFF')), 21);
  assert.strictEqual(A.corLegivel('#192D50'), '#FFFFFF');
  assert.notStrictEqual(A.corLegivel('#F4F0E5'), '#FFFFFF');
  const hm = A.harmonias('#A58A57');
  assert.strictEqual(hm.length, 4); hm.forEach(p => p.cores.forEach(c => assert.ok(A.hexValido(c))));
  A.PALETAS.forEach(p => assert.ok(A.contraste(p.texto, p.fundo) >= 4.5, 'paleta legível: ' + p.id));
});

test('paleta aplicada: muda fundo sólido e textos; com foto mantém a foto', () => {
  const p = A.PALETAS.find(x => x.id === 'vinho');
  const s = A.aplicarPaleta(A.aplicarModelo(A.specPadrao(), M.POR_ID['min-creme']), p);
  assert.strictEqual(s.fundo.cor, p.fundo);
  assert.strictEqual(s.camadas.find(c => c.papel === 'versiculo').cor, p.texto);
  const f = A.aplicarPaleta(A.specPadrao(), p);
  assert.deepStrictEqual([f.fundo.tipo, f.fundo.id], ['banco', 'pier']);
});

test('IA: só composição validada, nunca texto', () => {
  const resp = 'Claro! {"nome":"Paz <b>","fundo":{"tipo":"gradiente","cores":["#123456","nada","#FEDCBA"],"angulo":900},' +
    '"texto":{"fonte":"Comic Sans","cor":"#13284A","alinhar":"diagonal","y":2,"conteudo":"Texto inventado"},' +
    '"elementos":[{"forma":"icone","icone":"cruz"},{"forma":"icone","icone":"caveira"},{"forma":"script"},{"forma":"textura","estilo":"pontos","opacidade":1},' +
    '{"forma":"linha"},{"forma":"linha"},{"forma":"linha"},{"forma":"linha"}]} fim';
  const m = A.validarDesenhoIA(A.lerJson(resp), ['pier']);
  assert.strictEqual(m.nome, 'Paz b');
  assert.deepStrictEqual(m.fundo.cores, ['#123456', '#FEDCBA']);
  assert.strictEqual(m.fundo.angulo, 360);
  const V = m.camadas.find(c => c.papel === 'versiculo');
  assert.strictEqual(V.fonte, 'Cormorant Garamond');
  assert.strictEqual(V.alinhar, 'center');
  assert.strictEqual(V.y, 0.8);
  assert.ok(!('texto' in V) && !JSON.stringify(m).includes('Texto inventado'));
  assert.ok(A.contraste(V.cor, '#123456') >= 3, 'cor de texto ilegível é corrigida');
  const els = m.camadas.filter(c => c.tipo === 'elemento');
  assert.ok(els.length <= 6 && !els.some(e => e.icone === 'caveira'));
  assert.ok(els.find(e => e.forma === 'textura').opacidade <= 0.7);
  assert.strictEqual(A.validarDesenhoIA(null), null);
  assert.strictEqual(A.validarDesenhoIA({ fundo: { tipo: 'foto', foto: 'inexistente' } }, ['pier']).fundo.tipo, 'gradiente');
  assert.strictEqual(A.validarDesenhoIA({ fundo: { tipo: 'foto', foto: 'pier' } }, ['pier']).fundo.id, 'pier');
});

test('licença das fotos: precisa de texto visível por cima', () => {
  const s = A.specPadrao();
  assert.ok(A.temTextoVisivel(s, { texto: 'No princípio', refBase: 'Gn 1:1' }));
  s.camadas.forEach(c => { c.visivel = false; });
  assert.ok(!A.temTextoVisivel(s, { texto: 'No princípio', refBase: 'Gn 1:1' }));
  const l = A.normalizar({ conteudo: { tipo: 'livre', texto: '' }, camadas: [{ papel: 'versiculo' }, { papel: 'referencia' }] });
  assert.ok(!A.temTextoVisivel(l, { texto: '', refBase: '' }));
  l.camadas.push(A.camadaTexto('livre', { texto: 'Culto às 19h' }));
  assert.ok(A.temTextoVisivel(l, { texto: '', refBase: '' }));
});
