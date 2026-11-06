// ATOS 2 — teste ponta a ponta com banco simulado (mesmo contrato do db/user/sample do claude.ai).
// Verifica: sincronização entre dois aparelhos, privacidade por usuário, fluxo editorial (rascunho IA → revisão → publicação),
// leitor sem permissão de edição e saneamento do fundo gerado por IA. Rodar: node test/e2e-banco.js
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8765/';
const loja = new Map();   // caminho do documento -> dados
const ok = [], falhas = [], erros = [];
function checar(c, m) { (c ? ok : falhas).push(m); if (!c) console.log('FALHA:', m); }

const MOCK = `(() => {
  const CFG = window.__cfg;
  const ouvintes = [];
  function snapDe(col, lista) {
    const docs = lista.map(([p, d]) => ({ id: p.split('/').pop(), exists: true, data: () => d, metadata: { fromCache: false } }));
    return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, hasPendingWrites: false }, docChanges: () => docs.map(doc => ({ type: 'added', doc })) };
  }
  function permitido(caminho, escrita) {
    if (caminho.startsWith('data/users/')) return caminho.split('/')[2] === CFG.uid;
    if (caminho.startsWith('editorial/')) return CFG.dono;
    return escrita ? CFG.dono : true;
  }
  function colecao(path) {
    return {
      path,
      doc(id) { const p = path + '/' + id; return {
        id, path: p,
        async set(d) { if (!permitido(p, true)) throw { code: 'invalid_argument', message: 'sem permissão' }; await window.__dbOp('set', p, JSON.stringify(d)); },
        async delete() { if (!permitido(p, true)) throw { code: 'invalid_argument', message: 'sem permissão' }; await window.__dbOp('del', p, ''); },
        async get() { const d = JSON.parse(await window.__dbOp('get', p, '')); return { id, exists: !!d, data: () => d || undefined, metadata: { fromCache: false } }; }
      }; },
      onSnapshot(next, err) {
        if (!permitido(path + '/x', false)) { setTimeout(() => next(snapDe(path, [])), 50); return () => {}; }
        let ultimo = '';
        const tick = async () => { const r = await window.__dbOp('list', path, ''); if (r !== ultimo) { ultimo = r; next(snapDe(path, JSON.parse(r))); } };
        tick(); const t = setInterval(tick, 400); return () => clearInterval(t);
      }
    };
  }
  const db = { collection: colecao, doc(p) { const i = p.lastIndexOf('/'); return colecao(p.slice(0, i)).doc(p.slice(i + 1)); } };
  const user = { isOwner: () => CFG.dono, canEdit: () => CFG.dono, can: () => CFG.dono, id: async () => CFG.uid, me: async () => ({ id: CFG.uid }) };
  const sample = async (input) => ({ text: '<svg viewBox="0 0 1080 1350"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a4e"/><stop offset="1" stop-color="#e7b57a"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#g)"/><circle cx="540" cy="900" r="220" fill="#f6d9a0" opacity=".6"/><text x="100" y="200">JOAO 3:16 errado</text><script>window.__invadido=1</script></svg>' });
  sample.json = async (input) => ({ titulo: 'Perseverar juntos', contexto: 'Logo após o Pentecostes, a igreja de Jerusalém se formou ao redor do ensino dos apóstolos (At 2:1-41).',
    explicacao: 'Lucas descreve quatro marcas da comunidade.', reflexao: 'A fé cristã nasceu em comunidade, ouvindo os apóstolos e orando juntos.',
    aplicacao: 'Leia um trecho de Atos com alguém esta semana.', pergunta: 'O que significa perseverar?', oracao: 'Senhor, ajuda-me a perseverar na tua Palavra.', versiculoArte: 'At 2:42',
    passagens: [{ ref: 'At 2:38', nota: 'arrependimento e batismo' }, { ref: 'At 99:1', nota: 'inválida' }, { ref: 'Rm 6:3-4', nota: 'união com Cristo' }], introducao: 'Estudo de teste.' });
  window.claude = { use: async (n) => ({ db, user, sample })[n] || null };
})();`;

async function abrir(browser, cfg) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.exposeFunction('__dbOp', (op, p, d) => {
    if (op === 'set') { loja.set(p, JSON.parse(d)); return 'ok'; }
    if (op === 'del') { loja.delete(p); return 'ok'; }
    if (op === 'get') return JSON.stringify(loja.get(p) || null);
    if (op === 'list') { const pre = p + '/'; return JSON.stringify([...loja].filter(([k]) => k.startsWith(pre) && !k.slice(pre.length).includes('/')).sort()); }
  });
  await ctx.addInitScript(`window.__cfg = ${JSON.stringify(cfg)};`);
  await ctx.addInitScript(MOCK);
  const p = await ctx.newPage();
  p.on('pageerror', e => erros.push(cfg.uid + ': ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::/.test(m.text())) erros.push(cfg.uid + ': ' + m.text()); });
  await p.goto(URL);
  await p.waitForSelector('.onboarding, .vdia', { timeout: 15000 });
  if (await p.locator('.onboarding').count()) await p.click('.onboarding .bt');   // pular (aparelho novo de conta já usada não mostra)
  await p.waitForSelector('.vdia blockquote');
  return p;
}

(async () => {
  const b = await chromium.launch();
  // Aparelho 1 do proprietário
  const a = await abrir(b, { uid: 'dono1', dono: true });
  await a.waitForFunction(() => Dados.estado.modo === 'sincronizado', null, { timeout: 8000 });
  checar(true, 'Aparelho 1 sincronizado');
  await a.evaluate(() => { App.alternarFavorito('ACT.2.42'); Dados.salvar('notas', 'n1', { refs: ['ACT.2.42'], texto: 'perseverar', criadoEm: new Date().toISOString() }); });
  await a.waitForFunction(() => Dados.estado.pendentes === 0, null, { timeout: 8000 });
  checar([...loja.keys()].some(k => k.startsWith('data/users/dono1/favoritos')), 'Favorito gravado no espaço privado do usuário');

  // Aparelho 2 do mesmo usuário (navegador limpo)
  const a2 = await abrir(b, { uid: 'dono1', dono: true });
  await a2.waitForFunction(() => Dados.obter('favoritos', 'ACT.2.42') && Dados.obter('notas', 'n1'), null, { timeout: 8000 });
  checar(true, 'Aparelho 2 recebeu favorito e anotação');
  // conflito: alteração mais recente vence
  await a2.evaluate(() => Dados.salvar('notas', 'n1', { refs: ['ACT.2.42'], texto: 'editado no aparelho 2' }));
  await a.waitForFunction(() => (Dados.obter('notas', 'n1') || {}).texto === 'editado no aparelho 2', null, { timeout: 8000 });
  checar(true, 'Edição no aparelho 2 chegou ao aparelho 1');
  await a2.evaluate(() => Dados.excluir('favoritos', 'ACT.2.42'));
  await a.waitForFunction(() => !Dados.obter('favoritos', 'ACT.2.42'), null, { timeout: 8000 });
  checar(true, 'Exclusão propagada entre aparelhos');

  // Outro usuário não vê os dados do primeiro
  const c = await abrir(b, { uid: 'leitor9', dono: false });
  await c.waitForTimeout(1200);
  checar(await c.evaluate(() => !Dados.obter('notas', 'n1')), 'Privacidade: outro usuário não vê as anotações');

  // Fluxo editorial no aparelho 1 (proprietário)
  await a.click('a[data-aba="biblioteca"]'); await a.click('.chip:has-text("Devocionais")');
  await a.click('.chip:has-text("Edição")');
  await a.click('button:has-text("Rascunho com IA")');
  await a.fill('#ia-pass', 'At 2:42-47'); await a.click('.folha button:has-text("Gerar rascunho")');
  await a.waitForSelector('.folha #dv-titulo', { timeout: 8000 });
  checar(await a.inputValue('#dv-titulo') === 'Perseverar juntos', 'IA: rascunho aberto para revisão');
  checar((await a.textContent('.folha')).includes('Gerado por IA'), 'IA: rascunho identificado');
  checar([...loja.keys()].some(k => k.startsWith('editorial/rascunhos/devocionais/')), 'Rascunho salvo na área editorial');
  await a.click('.folha button:has-text("Publicar")');
  checar((await a.textContent('#avisos')).includes('Revisei'), 'Publicação exige confirmação de revisão');
  await a.click('label[for="dv-rev"]');
  await a.fill('#dv-data', await a.evaluate(() => UI.hoje()));
  await a.click('.folha button:has-text("Publicar")'); await a.waitForTimeout(600);
  checar([...loja.keys()].some(k => k.startsWith('pub/conteudo/devocionais/')) && ![...loja.keys()].some(k => k.startsWith('editorial/rascunhos/devocionais/')), 'Publicado e retirado dos rascunhos');

  // Leitor sem permissão vê o publicado, com aviso de IA, e não vê a edição
  await c.click('a[data-aba="biblioteca"]'); await c.click('.chip:has-text("Devocionais")');
  await c.waitForSelector('.item:has-text("Perseverar juntos")', { timeout: 8000 });
  checar(await c.locator('.chip:has-text("Edição")').count() === 0, 'Leitor não vê a aba Edição');
  await c.click('.item:has-text("Perseverar juntos")');
  await c.waitForSelector('.devo .passagem sup');
  const dev = await c.textContent('.devo');
  checar(dev.includes('apoio de inteligência artificial') && dev.includes('revisado'), 'Leitor vê o aviso de IA revisado');
  checar(dev.includes('E perseveravam na doutrina dos apóstolos'), 'Passagem vem do texto bíblico');
  checar(await c.evaluate(async () => { try { await Dados.gravarConteudo('devocionais', 'x', { titulo: 'invasão' }); return false; } catch (e) { return true; } }), 'Leitor não consegue publicar');
  await c.keyboard.press('Escape');
  await c.click('a[data-aba="inicio"]'); await c.waitForTimeout(500);
  checar((await c.textContent('.grade')).includes('Perseverar juntos'), 'Início mostra o devocional do dia');

  // Estudo montado com IA: referências conferidas
  await a.keyboard.press('Escape');
  await a.click('.chip:has-text("Estudos")'); await a.click('button:has-text("Montar com IA")');
  await a.fill('#ia-tema', 'batismo em Atos'); await a.click('.folha button:has-text("Montar rascunho")');
  await a.waitForSelector('.folha .aviso-ia', { timeout: 8000 }); await a.waitForTimeout(400);
  const est = await a.textContent('.folha');
  checar(est.includes('Atos 2:38') && est.includes('Romanos 6:3-4') && !est.includes('99'), 'Estudo IA: referência inválida descartada');
  checar(est.includes('Arrependei-vos'), 'Estudo IA: texto vem da tradução');
  await a.keyboard.press('Escape');

  // Fundo gerado por IA: sem texto nem script
  await a.evaluate(() => Telas.criar.comVersiculo('Jo 3:16')); await a.waitForSelector('.modelo-card[data-modelo="min-azul"] .mc-usar');
  await a.click('.modelo-card[data-modelo="min-azul"] .mc-usar'); await a.waitForSelector('.editor-arte');
  await a.click('.ed-barra button[data-painel="fundo"]'); await a.click('.sub-abas .chip:has-text("Criar com IA")');
  await a.fill('#ia-fundo', 'amanhecer dourado'); await a.click('.ed-painel button:has-text("Gerar fundo")');
  await a.waitForFunction(() => Telas.criar._estado().spec.fundo.tipo === 'ia', null, { timeout: 10000 });
  await a.waitForFunction(() => document.querySelector('.ed-painel').textContent.includes('Pronto'), null, { timeout: 8000 });
  const svg = await a.evaluate(() => Telas.criar._estado().spec.fundo.svg || '');
  checar(svg.includes('linearGradient') && !/<text|<script|JOAO/.test(svg), 'Fundo IA saneado: sem texto e sem script');
  checar(await a.evaluate(() => !window.__invadido), 'Script do SVG não executou');

  console.log('\nOK:', ok.length, ' FALHAS:', falhas.length, ' ERROS:', erros.length); erros.slice(0, 8).forEach(e => console.log('  ', e.slice(0, 250)));
  await b.close(); process.exit(falhas.length || erros.length ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE', e.message); console.log('OK:', ok.length, 'FALHAS:', falhas, 'ERROS:', erros); process.exit(2); });
