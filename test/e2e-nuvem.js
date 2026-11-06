// ATOS 2 — teste ponta a ponta da versão publicada (sem claude.ai), com um Supabase falso compartilhado entre
// dois "aparelhos" (test/supabase-falso.js). As regras do banco real são conferidas à parte, por SQL.
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8765/';
const EMAIL = 'teste@atos2.invalid', SENHA = 'Senha123teste';
const F = require('./supabase-falso.js'), servidor = F.criarServidor();
const ok = [], falhas = [], erros = [];
function checar(c, m) { (c ? ok : falhas).push(m); if (!c) console.log('FALHA:', m); }
async function abrir(b) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  await p.exposeFunction('__sb', (op, a) => servidor.tratar(p, op, a));
  await p.addInitScript(F.clienteNavegador);
  p.on('pageerror', e => erros.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::|favicon/.test(m.text())) erros.push(m.text()); });
  await p.goto(URL); await p.waitForSelector('.onboarding', { timeout: 15000 });
  await p.evaluate(() => { App.salvarConfig({ boasVindas: true }); document.querySelector('.onboarding .bt').click(); });
  await p.waitForSelector('.vdia', { timeout: 15000 });
  return p;
}
async function entrar(p) {
  await p.click('a[data-aba="perfil"]'); await p.waitForSelector('.cartao button:has-text("Entrar")', { timeout: 15000 });
  await p.click('.cartao button:has-text("Entrar")');
  await p.fill('#conta-email', EMAIL); await p.fill('#conta-senha', SENHA); await p.click('.folha button[type="submit"]');
  await p.waitForFunction(() => Dados.estado.modo === 'sincronizado', null, { timeout: 25000 });
}
(async () => {
  const b = await chromium.launch();
  const a = await abrir(b);
  checar(await a.evaluate(() => !window.claude && App.temIA === false), 'Versão publicada: sem IA');
  await a.click('a[data-aba="perfil"]'); await a.waitForSelector('button:has-text("Criar conta")', { timeout: 15000 });
  checar(true, 'Perfil: botões Criar conta e Entrar');
  await a.click('.cartao button:has-text("Entrar")'); await a.fill('#conta-email', EMAIL); await a.fill('#conta-senha', 'errada123'); await a.click('.folha button[type="submit"]');
  await a.waitForFunction(() => /incorretos/.test(document.querySelector('.folha').textContent), null, { timeout: 15000 }).catch(() => {});
  checar((await a.textContent('.folha')).includes('E-mail ou senha incorretos'), 'Login: senha errada com mensagem clara');
  await a.keyboard.press('Escape');
  // dado criado antes do login sobe para a conta
  await a.evaluate(() => Dados.salvar('favoritos', 'PSA.23.1', { ref: 'PSA.23.1', colecoes: [], criadoEm: new Date().toISOString() }));
  await entrar(a);
  checar((await a.textContent('.tela')).includes(EMAIL), 'Login: conta conectada e sincronizada');
  await a.waitForFunction(() => Dados.estado.pendentes === 0, null, { timeout: 15000 }).catch(() => {});
  // segundo aparelho
  const c = await abrir(b); await entrar(c);
  await c.waitForFunction(() => !!Dados.obter('favoritos', 'PSA.23.1'), null, { timeout: 15000 }).catch(() => {});
  checar(await c.evaluate(() => !!Dados.obter('favoritos', 'PSA.23.1')), 'Sincronização: favorito chega ao outro aparelho');
  await c.evaluate(() => Dados.salvar('notas', 'n1', { refs: ['JHN.3.16'], texto: 'Nota do aparelho 2', criadoEm: new Date().toISOString() }));
  await a.waitForFunction(() => !!Dados.obter('notas', 'n1'), null, { timeout: 20000 }).catch(() => {});
  checar(await a.evaluate(() => (Dados.obter('notas', 'n1') || {}).texto === 'Nota do aparelho 2'), 'Tempo real: nota aparece no primeiro aparelho');
  await a.evaluate(() => Dados.excluir('notas', 'n1'));
  await c.waitForFunction(() => !Dados.obter('notas', 'n1'), null, { timeout: 20000 }).catch(() => {});
  checar(await c.evaluate(() => !Dados.obter('notas', 'n1')), 'Tempo real: exclusão chega ao outro aparelho');
  // leitor não grava conteúdo editorial
  const neg = await a.evaluate(async () => { try { await Dados.gravarConteudo('devocionais', 'teste', { titulo: 'x' }); return 'gravou'; } catch (e) { return 'negado'; } });
  checar(neg === 'negado', 'Segurança: leitor não publica devocional');
  // sair
  await a.click('a[data-aba="perfil"]'); await a.click('button:has-text("Sair da conta")'); await a.click('.folha .bt.perigo');
  await a.waitForFunction(() => !Dados.estado.conta && Dados.estado.modo === 'local', null, { timeout: 15000 }).catch(() => {});
  checar(await a.evaluate(() => !Dados.estado.conta && !Dados.obter('favoritos', 'PSA.23.1')), 'Sair: desconecta e apaga a cópia do aparelho');
  checar(servidor.docs.size >= 2 && [...servidor.docs.values()].every(d => d.usuario_id === 'u-teste'), 'Servidor: documentos gravados na conta certa');
  // cadastro pede confirmação de e-mail
  await a.click('.cartao button:has-text("Criar conta")'); await a.fill('#conta-nome', 'Ana'); await a.fill('#conta-email', 'ana@atos2.invalid'); await a.fill('#conta-senha', 'senhafraca');
  await a.click('.folha button[type="submit"]'); await a.waitForTimeout(300);
  checar((await a.textContent('.folha')).includes('letras e números'), 'Cadastro: senha fraca recusada');
  await a.fill('#conta-senha', 'Senha123ana'); await a.click('.folha button[type="submit"]');
  await a.waitForSelector('.folha :text("link de confirmação")', { timeout: 8000 }).catch(() => {});
  checar((await a.textContent('.folha')).includes('link de confirmação'), 'Cadastro: pede confirmação por e-mail');
  await a.screenshot({ path: '/tmp/shots/30-conta.png', fullPage: true });
  await a.keyboard.press('Escape');
  await c.click('a[data-aba="perfil"]'); await c.waitForTimeout(500); await c.screenshot({ path: '/tmp/shots/31-conta-logada.png', fullPage: true });
  console.log('\nOK:', ok.length, ' FALHAS:', falhas.length, ' ERROS:', erros.length); erros.slice(0, 8).forEach(e => console.log('  ', e.slice(0, 250)));
  await b.close(); process.exit(falhas.length || erros.length ? 1 : 0);
})().catch(e => { console.error('ERRO', e); console.log('OK:', ok.length, 'FALHAS:', falhas); process.exit(2); });
