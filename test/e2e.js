// ATOS 2 — teste ponta a ponta (local, sem banco do claude.ai). node test/e2e.js
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8765/';
const erros = [], ok = [], falhas = [];
function checar(cond, msg) { (cond ? ok : falhas).push(msg); if (!cond) console.log('FALHA:', msg); }
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, acceptDownloads: true });
  const p = await ctx.newPage();
  // simula a prévia do claude.ai sem banco; a IA (sample) só aparece quando o teste a liga
  await p.addInitScript(() => { window.claude = { use: async n => n === 'sample' ? (window.__sample || null) : null }; });
  p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) erros.push(m.text()); });
  p.on('pageerror', e => erros.push('pageerror: ' + e.message));
  await p.goto(URL);
  // boas-vindas
  await p.waitForSelector('.onboarding', { timeout: 15000 });
  for (let i = 0; i < 3; i++) await p.click('.onboarding .bt.ouro');
  await p.fill('#bv-nome', 'Cadu');
  await p.click('.onboarding .bt.ouro');
  await p.waitForSelector('.vdia blockquote', { timeout: 15000 });
  const vd = await p.textContent('.vdia blockquote');
  checar(vd.length > 20, 'Início: versículo do dia carregado');
  checar((await p.textContent('h1')).includes('Cadu'), 'Início: saudação com o nome');
  await p.click('.vdia button[aria-label="Compartilhar"]'); await p.waitForSelector('.folha canvas'); await p.waitForTimeout(1500);
  const cart = await p.$eval('.folha canvas', c => [c.width, c.height]);
  checar(cart[0] === 720 && cart[1] > 400 && (await p.textContent('.folha')).includes('Compartilhar imagem'), 'Início: versículo do dia vira imagem no visual do cartão');
  await p.click('.folha .chip:has-text("Stories")'); await p.waitForTimeout(800);
  checar(Math.abs(await p.$eval('.folha canvas', c => c.width / c.height) - 1080 / 1920) < 0.01, 'Cartão do versículo: formato Stories');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.screenshot({ path: '/tmp/shots/1-inicio.png', fullPage: true });

  // Bíblia
  await p.click('a[data-aba="biblia"]');
  await p.waitForSelector('.v[data-v="1"]');
  checar(await p.locator('.v').count() === 51, 'Bíblia: João 1 com 51 versículos');
  await p.click('.v[data-v="1"]'); await p.click('.v[data-v="2"]');
  await p.waitForSelector('.barra-sel');
  checar((await p.textContent('.barra-sel .topo')).includes('João 1:1-2'), 'Bíblia: seleção João 1:1-2');
  await p.click('.barra-sel button:has-text("Favoritar")');
  await p.waitForTimeout(200);
  checar(await p.locator('.v[data-v="1"] .marca-fav').count() === 1, 'Bíblia: favorito marcado');
  await p.click('.v[data-v="3"]'); await p.click('.barra-sel button:has-text("Destacar")');
  await p.click('.cor-bolinha[aria-label="Amarelo"]');
  await p.waitForTimeout(200);
  checar(await p.getAttribute('.v[data-v="3"]', 'data-cor') === 'amarelo', 'Bíblia: destaque amarelo');
  await p.click('.v[data-v="14"]'); await p.click('.barra-sel button:has-text("Anotar")');
  await p.fill('#nota-txt', 'O Verbo se fez carne.'); await p.click('.folha button[type="submit"]');
  await p.waitForTimeout(200);
  checar(await p.locator('.v[data-v="14"] .marca-nota').count() === 1, 'Bíblia: anotação ligada ao versículo');
  // comparar
  await p.click('.v[data-v="16"]'); await p.click('.barra-sel button:has-text("Comparar")');
  await p.waitForSelector('.folha .cartao');
  checar((await p.textContent('.folha')).includes('Aguardando licença'), 'Comparar: traduções pendentes sinalizadas');
  await p.keyboard.press('Escape'); await p.click('.barra-sel .bt-ico');
  await p.screenshot({ path: '/tmp/shots/2-biblia.png' });
  // ir para referência
  await p.click('.seletor-cap'); await p.fill('#ir-ref', 'At 2:42'); await p.press('#ir-ref', 'Enter');
  await p.waitForFunction(() => document.querySelector('.seletor-cap').textContent.includes('Atos 2'), null, { timeout: 5000 }).catch(async () => console.log('DEBUG folhas:', await p.$$eval('.folha h2', x => x.map(y => y.textContent)), await p.$$eval('.folha .sub', x => x.map(y => y.textContent))));
  checar((await p.textContent('.seletor-cap')).includes('Atos 2'), 'Navegação por referência: Atos 2');
  checar((await p.textContent('.v[data-v="38"]')).includes('recebereis o dom do Espírito Santo'), 'Texto: Atos 2:38 completo');
  // próximo capítulo e marcar lido
  await p.click('button:has-text("Marcar capítulo como lido")');
  checar(await p.locator('button:has-text("Capítulo lido")').count() === 1, 'Capítulo marcado como lido');
  await p.click('.nav-cap .bt:last-child'); await p.waitForTimeout(300);
  checar((await p.textContent('.seletor-cap')).includes('Atos 3'), 'Navegação: próximo capítulo');
  // salmo com título
  await p.click('.seletor-cap'); await p.fill('#ir-ref', 'Sl 3'); await p.press('#ir-ref', 'Enter');
  await p.waitForSelector('.titulo-salmo');
  checar((await p.textContent('.titulo-salmo')).includes('Absalão'), 'Salmo 3 com título');
  // pesquisa
  await p.click('.leitor-cab [aria-label="Pesquisar"]');
  await p.fill('#pesq', '"partir do pão"');
  await p.waitForSelector('.folha mark', { timeout: 30000 });
  checar((await p.textContent('.folha')).includes('Atos 2:42'), 'Pesquisa: expressão exata acha Atos 2:42');
  await p.fill('#pesq', 'Jo 3:16'); await p.waitForTimeout(900);
  checar((await p.textContent('.folha')).includes('Abrir João 3:16'), 'Pesquisa: reconhece referência');
  await p.fill('#pesq', ''); await p.click('.folha .chip:has-text("Batismo")');
  await p.waitForTimeout(500);
  checar(await p.locator('.folha .item').count() === 12, 'Pesquisa: tema Batismo com 12 passagens');
  await p.screenshot({ path: '/tmp/shots/3-pesquisa.png' });
  await p.keyboard.press('Escape');

  // Criar
  await p.click('a[data-aba="criar"]');
  await p.waitForSelector('.palco canvas'); await p.waitForTimeout(1500);
  const w = await p.$eval('.palco canvas', c => c.width);
  checar(w > 300, 'Estúdio: canvas desenhado');
  await p.fill('#arte-ref', 'Sl 23:1'); await p.press('#arte-ref', 'Enter'); await p.waitForTimeout(800);
  checar((await p.textContent('.painel')).includes('O SENHOR é meu pastor'), 'Estúdio: versículo aplicado com texto exato');
  await p.click('.chips .chip:has-text("Fundo")');
  checar(await p.locator('.painel .chip').count() === 2 && (await p.textContent('.painel')).includes('Criar com IA'), 'Fundo: só fotos e Criar com IA');
  await p.click('.fundos.papeis button >> nth=1'); await p.waitForTimeout(500);
  await p.click('.chips .chip:has-text("Formato")'); await p.click('.painel .item:has-text("Instagram Stories")'); await p.waitForTimeout(800);
  const dims = await p.$eval('.palco canvas', c => c.width / c.height);
  checar(Math.abs(dims - 1080 / 1920) < 0.01, 'Estúdio: formato Stories 1080×1920');
  // papéis de parede Full HD (com as fotos)
  await p.click('.chips .chip:has-text("Formato")'); await p.click('.painel .item:has-text("celular")'); await p.waitForTimeout(1200);
  checar(Math.abs(await p.$eval('.palco canvas', c => c.width / c.height) - 1080 / 1920) < 0.01, 'Papel de parede do celular: 1080×1920');
  await p.screenshot({ path: '/tmp/shots/15-papel-celular.png' });
  await p.click('.chips .chip:has-text("Formato")'); await p.click('.painel .item:has-text("computador")'); await p.waitForTimeout(1200);
  checar(Math.abs(await p.$eval('.palco canvas', c => c.width / c.height) - 1920 / 1080) < 0.01, 'Papel de parede do computador: 1920×1080');
  await p.screenshot({ path: '/tmp/shots/16-papel-pc.png' });
  const exp = await p.evaluate(async () => { const c = document.createElement('canvas'); await Telas.criar.desenharArte(c, { formato: 'papel-pc', conteudo: { tipo: 'versiculo', ref: 'Sl 46:10', versao: 'blivre' }, fundo: { tipo: 'banco', id: 'leao' }, escurecer: 0, estilo: {}, pos: { x: 0.5, y: 0.5 }, referencia: { mostrar: true }, assinatura: {} }, 1920); return [c.width, c.height]; });
  checar(exp[0] === 1920 && exp[1] === 1080, 'Exportação do papel de parede em Full HD (1920×1080)');
  await p.click('.painel .item:has-text("Instagram Stories")'); await p.waitForTimeout(600);
  // fotos da biblioteca (Pixabay)
  await p.click('.chips .chip:has-text("Fundo")'); await p.waitForTimeout(800);
  checar(await p.locator('.fundos.papeis button img').count() === 25, 'Fotos: 25 fundos');
  await p.click('.fundos.papeis button[title="Leão de Judá"]'); await p.waitForTimeout(1800);
  const px = await p.$eval('.palco canvas', c => { const d = c.getContext('2d').getImageData(Math.round(c.width * 0.5), Math.round(c.height * 0.15), 1, 1).data; return [d[0], d[1], d[2]]; });
  checar(!(px[0] === 43 && px[1] === 53 && px[2] === 80), 'Fotos: imagem aplicada ao fundo');
  checar((await p.textContent('.painel')).includes('Pixabay'), 'Fotos: crédito e licença no painel');
  const expFoto = await p.evaluate(async () => { const c = document.createElement('canvas'); await Telas.criar.desenharArte(c, { formato: 'papel-pc', conteudo: { tipo: 'versiculo', ref: 'Sl 19:1', versao: 'blivre' }, fundo: { tipo: 'banco', id: 'fiorde' }, escurecer: 0.2, estilo: {}, pos: { x: 0.5, y: 0.5 }, referencia: { mostrar: true }, assinatura: {} }, 1920); const d = c.getContext('2d').getImageData(100, 100, 1, 1).data; return [c.width, c.height, d[0] + d[1] + d[2]]; });
  checar(expFoto[0] === 1920 && expFoto[1] === 1080 && expFoto[2] > 30, 'Fotos: papel de parede do computador com foto em Full HD');
  await p.screenshot({ path: '/tmp/shots/18-foto-leao.png' });
  await p.click('.chips .chip:has-text("Texto")'); await p.click('.painel .chip:has-text("Texto livre")'); await p.waitForTimeout(300);
  await p.fill('#arte-livre', ''); await p.waitForTimeout(300);
  await p.click('button:has-text("Baixar PNG")'); await p.waitForTimeout(500);
  checar((await p.textContent('body')).includes('só podem sair com texto'), 'Fotos: não baixa a foto sem texto (licença)');
  await p.click('.painel .chip:has-text("Versículo bíblico")'); await p.waitForTimeout(300);
  await p.fill('#arte-ref', 'Sl 23:1'); await p.press('#arte-ref', 'Enter'); await p.waitForTimeout(600);
  // arrastar texto
  const box = await p.$eval('.palco canvas', c => { const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await p.mouse.move(box.x + box.w / 2, box.y + box.h * 0.47); await p.mouse.down(); await p.mouse.move(box.x + box.w / 2, box.y + box.h * 0.25, { steps: 5 }); await p.mouse.up();
  await p.waitForTimeout(400);
  await p.screenshot({ path: '/tmp/shots/4-estudio.png' });
  await p.click('button:has-text("Salvar") >> nth=0'); await p.waitForTimeout(1500);
  await p.click('.chip:has-text("Minhas artes")'); await p.waitForTimeout(400);
  checar(await p.locator('.arte-card').count() === 1, 'Estúdio: arte salva em Minhas artes');
  await p.click('.chip:has-text("Galeria")'); await p.waitForTimeout(2500);
  checar(await p.locator('.arte-card canvas').count() >= 5, 'Galeria: artes prontas desenhadas');
  await p.click('.chip:has-text("Papéis de parede")'); await p.waitForTimeout(4000);
  checar(await p.locator('.arte-card.papel canvas').count() === 12, 'Galeria: papéis de parede prontos');
  await p.screenshot({ path: '/tmp/shots/17-galeria-papeis.png', fullPage: true });
  await p.click('.chip:has-text("Fotos da criação")'); await p.waitForTimeout(4000);
  checar(await p.locator('.arte-card canvas').count() === 16, 'Galeria: fotos da criação');
  await p.screenshot({ path: '/tmp/shots/19-galeria-fotos.png', fullPage: true });
  await p.click('.chip:has-text("Versículos de fé")'); await p.waitForTimeout(1500);
  await p.screenshot({ path: '/tmp/shots/5-galeria.png' });
  // exportação PNG (fora do claude.ai: download direto)
  await p.click('.arte-card >> nth=0'); await p.waitForTimeout(600);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }).catch(() => null), p.click('.folha button:has-text("Baixar")')]);
  if (dl) { const path = await dl.path(); const fs = require('fs'); const buf = fs.readFileSync(path); checar(buf.slice(1, 4).toString() === 'PNG' && buf.readUInt32BE(16) === 1080 && buf.readUInt32BE(20) === 1350, 'Exportação: PNG 1080×1350'); }
  else checar(false, 'Exportação: download do PNG');
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');

  // Biblioteca
  await p.click('a[data-aba="biblioteca"]'); await p.waitForTimeout(300);
  checar((await p.textContent('.tela')).includes('2 versículos'), 'Biblioteca: 2 favoritos');
  await p.click('.chip:has-text("Planos")'); await p.click('.capa-plano:has-text("Atos dos Apóstolos")');
  await p.click('.folha button:has-text("Iniciar plano")'); await p.waitForTimeout(200);
  await p.click('.folha .dia-plano >> nth=0 >> input.marcar'); await p.waitForTimeout(300);
  checar((await p.textContent('.folha .numeros')).includes('1/28'), 'Plano: dia 1 concluído (1/28)');
  checar((await p.textContent('.folha .numeros')).includes('3,6%'), 'Plano: percentual 3,6%');
  await p.click('.folha button:has-text("Pausar")'); await p.waitForTimeout(200);
  checar((await p.textContent('.folha')).includes('Plano pausado'), 'Plano: pausa');
  await p.click('.folha button:has-text("Retomar")'); await p.waitForTimeout(200);
  await p.click('.folha button:has-text("Continuar: dia 2")'); await p.waitForTimeout(600);
  checar((await p.textContent('.faixa-plano')).includes('Dia 2'), 'Plano: leitura do dia 2 com faixa do plano');
  await p.click('.faixa-plano button:has-text("Concluir dia")'); await p.waitForTimeout(800);
  checar((await p.textContent('.folha .numeros')).includes('2/28'), 'Plano: concluir dia pela leitura');
  await p.keyboard.press('Escape');
  await p.click('.chip:has-text("Anotações")'); await p.waitForTimeout(200);
  checar((await p.textContent('.tela')).includes('O Verbo se fez carne'), 'Biblioteca: anotação listada');
  await p.click('.chip:has-text("Estudos")'); await p.click('button:has-text("Novo estudo")');
  await p.fill('#est-tit', 'Batismo em Atos'); await p.fill('#est-ref', 'At 2:38'); await p.click('.folha button:has-text("Adicionar")');
  await p.fill('#est-ref', 'At 99:1'); await p.click('.folha button:has-text("Adicionar")');
  checar((await p.textContent('.folha')).includes('28 capítulos'), 'Estudo: referência inválida recusada');
  await p.click('.folha button[type="submit"]'); await p.waitForTimeout(300);
  checar((await p.textContent('.tela')).includes('Batismo em Atos'), 'Estudo salvo');
  await p.click('.chip:has-text("Histórico")'); await p.waitForTimeout(200);
  checar(await p.locator('.tela .item').count() > 3, 'Histórico registrado');
  await p.screenshot({ path: '/tmp/shots/6-biblioteca.png' });

  // Perfil e tema noturno
  await p.click('a[data-aba="perfil"]'); await p.waitForTimeout(300);
  checar((await p.textContent('.numeros')).includes('capítulos lidos'), 'Perfil: estatísticas');
  await p.selectOption('#pref-tema', 'escuro'); await p.waitForTimeout(200);
  checar(await p.getAttribute('html', 'data-tema') === 'escuro', 'Perfil: modo noturno');
  await p.screenshot({ path: '/tmp/shots/7-perfil-escuro.png', fullPage: true });
  await p.click('a[data-aba="biblia"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/shots/8-biblia-escuro.png' });
  await p.click('a[data-aba="perfil"]'); await p.waitForTimeout(200); await p.selectOption('#pref-tema', 'claro'); await p.waitForTimeout(150);

  // Traduções: Almeida 1911 e Nova Bíblia Viva
  await p.click('a[data-aba="biblia"]'); await p.waitForTimeout(300);
  await p.click('button.trad'); await p.waitForSelector('.folha .item');
  checar(await p.locator('.folha button.item:not([disabled])').count() === 4, 'Traduções: 4 disponíveis');
  await p.click('.folha button.item:has-text("(ALM1911)")'); await p.waitForTimeout(400);
  await p.evaluate(() => App.abrirBiblia('ACT', 2, 42)); await p.waitForSelector('.v[data-v="42"]'); await p.waitForTimeout(300);
  checar((await p.textContent('.v[data-v="42"]')).includes('perseveravam na doutrina dos apostolos'), 'ALM1911: Atos 2:42 com a grafia de 1911');
  checar((await p.textContent('button.trad')).includes('ALM1911'), 'ALM1911: sigla no leitor');
  checar(await p.locator('.marca-tn:has-text("†")').count() === 0, 'ALM1911: referências cruzadas ocultas por padrão');
  await p.evaluate(() => App.salvarConfig({ refsCruzadas: true })); await p.evaluate(() => App.abrirBiblia('ACT', 2, 42)); await p.waitForTimeout(500);
  checar(await p.locator('.marca-tn:has-text("†")').count() > 3, 'ALM1911: referências cruzadas quando ativadas');
  await p.locator('.marca-tn:has-text("†")').first().click(); await p.waitForSelector('.folha');
  checar((await p.textContent('.folha')).includes('Referências cruzadas da edição de 1911'), 'ALM1911: nota de referência explicada');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.evaluate(() => App.salvarConfig({ refsCruzadas: false }));
  await p.evaluate(() => App.abrirBiblia('PSA', 119, 1)); await p.waitForSelector('.v[data-v="176"]'); await p.waitForTimeout(300);
  checar(await p.locator('.cab-v').count() >= 21, 'ALM1911: letras do Salmo 119 como cabeçalhos');
  await p.screenshot({ path: '/tmp/shots/10-alm1911-sl119.png' });
  // comparar as três
  await p.click('.v[data-v="105"]'); await p.click('.barra-sel button:has-text("Comparar")'); await p.waitForSelector('.folha .cartao'); await p.waitForTimeout(800);
  var comp = await p.textContent('.folha');
  checar(comp.includes('BLIVRE') && comp.includes('ALM1911AT') && comp.includes('ONBV') && /lampada/i.test(comp) && /lâmpada/i.test(comp), 'Comparar: quatro traduções lado a lado');
  await p.screenshot({ path: '/tmp/shots/11-comparar.png' });
  await p.keyboard.press('Escape'); await p.click('.barra-sel .bt-ico'); await p.waitForTimeout(200);
  // pesquisa com grafia de hoje na edição de 1911
  await p.evaluate(() => Telas.pesquisa.abrir('batismo')); await p.waitForSelector('.folha mark', { timeout: 30000 });
  var marcas = await p.$$eval('.folha mark', x => x.map(y => y.textContent));
  checar(marcas.length > 5 && marcas.every(m => /baptismo/i.test(m)), 'Pesquisa ALM1911: “batismo” encontra “baptismo”');
  checar((await p.textContent('.folha')).includes('grafia de hoje'), 'Pesquisa ALM1911: dica de grafia');
  await p.screenshot({ path: '/tmp/shots/12-pesquisa-1911.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // Almeida 1911 com grafia atualizada
  await p.click('button.trad'); await p.waitForSelector('.folha .item'); await p.click('.folha button.item:has-text("ALM1911AT")'); await p.waitForTimeout(400);
  await p.evaluate(() => App.abrirBiblia('ACT', 2, 38)); await p.waitForSelector('.v[data-v="38"]'); await p.waitForTimeout(300);
  checar((await p.textContent('.v[data-v="38"]')).includes('batizado em nome de Jesus Cristo'), 'ALM1911AT: Atos 2:38 com a grafia atualizada');
  await p.screenshot({ path: '/tmp/shots/14-alm1911at.png' });
  // Nova Bíblia Viva
  await p.click('button.trad'); await p.waitForSelector('.folha .item'); await p.click('.folha button.item:has-text("ONBV")'); await p.waitForTimeout(400);
  await p.evaluate(() => App.abrirBiblia('JHN', 3, 16)); await p.waitForSelector('.v[data-v="16"]'); await p.waitForTimeout(300);
  checar((await p.textContent('.v[data-v="16"]')).length > 40 && (await p.textContent('button.trad')).includes('ONBV'), 'ONBV: João 3:16');
  await p.screenshot({ path: '/tmp/shots/13-onbv.png' });
  // créditos
  await p.click('a[data-aba="perfil"]'); await p.waitForTimeout(800);
  var sobre = await p.textContent('.tela');
  checar(sobre.includes('marca registrada') && sobre.includes('Gutenberg') && sobre.includes('Bíblia Livre'), 'Perfil: créditos e licenças das três traduções');
  // a arte nova usa a tradução escolhida
  checar(await p.evaluate(() => Biblia.padrao()) === 'onbv', 'Tradução padrão segue a escolha');
  var vd2 = await p.evaluate(async () => { await App.ir('inicio'); await new Promise(r => setTimeout(r, 800)); return document.querySelector('.vdia').textContent; });
  checar(vd2.includes('ONBV'), 'Início: versículo do dia na tradução escolhida');
  await p.evaluate(() => App.salvarConfig({ traducao: 'blivre' })); await p.waitForTimeout(300);

  // ---------------------------------------------------------------- Explorar
  await p.evaluate(() => App.ir('inicio')); await p.waitForSelector('.explorar .atalho');
  checar(await p.locator('.explorar .atalho').count() === 3, 'Início: seção Explorar com assistente, quiz e mural');
  await p.click('.explorar .atalho:has-text("Assistente")'); await p.waitForSelector('#assist-q');
  await p.waitForTimeout(400);
  checar((await p.textContent('.aviso-ia')).includes('Modo guia') && (await p.textContent('.assist-caixa .bt.pri')).includes('Buscar'), 'Assistente: sem IA, entra no modo guia');
  await p.fill('#assist-q', 'versículos sobre ansiedade'); await p.click('.assist-caixa .bt.pri');
  await p.waitForSelector('.res-assist', { timeout: 20000 }); await p.waitForTimeout(400);
  checar((await p.textContent('.assist-status')).includes('Ansiedade') && await p.locator('.res-assist').count() >= 5, 'Guia: pesquisa por tema usa temas curados e a busca no texto');
  await p.click('.res-assist .bt:has-text("Estudar") >> nth=0'); await p.waitForSelector('.estudo-topo', { timeout: 10000 }); await p.waitForTimeout(1500);
  await p.fill('#assist-q', 'Jo 3:16'); await p.click('.assist-caixa .bt.pri'); await p.waitForSelector('.estudo-topo:has-text("João 3:16")', { timeout: 10000 }); await p.waitForTimeout(2000);
  var guia = await p.textContent('.assist-area');
  checar(guia.includes('Sobre o livro de João') && guia.includes('No capítulo') && guia.includes('Em outras traduções') && guia.includes('Referências cruzadas') && guia.includes('1 João 4:9'), 'Guia: passagem com ficha do livro, capítulo, outras traduções e referências cruzadas');
  checar(await p.locator('.outra-trad').count() >= 2 && await p.locator('.trecho .alvo').count() === 1, 'Guia: outras traduções e versículo destacado no capítulo');
  await p.screenshot({ path: '/tmp/shots/27-guia.png', fullPage: true });
  // ---- estudo teológico sem IA: níveis, original, doutrinas, Bereano
  checar(await p.locator('.modos-estudo .chip').count() === 4, 'Assistente: modos Estudar, Bereano, Doutrinas, Grego e hebraico');
  await p.click('.niveis .chip:has-text("Avançado")'); await p.waitForSelector('#assist-q');
  await p.fill('#assist-q', 'Jo 3:16'); await p.click('.assist-caixa .bt.pri');
  await p.waitForSelector('.inter-pal', { timeout: 20000 }); await p.waitForTimeout(800);
  var av = await p.textContent('.assist-area');
  checar(av.includes('Estrutura do capítulo 3') && av.includes('Palavras importantes no original') && av.includes('Texto original') && av.includes('avançado'), 'Guia avançado: estrutura, palavras-chave e texto original');
  checar((await p.textContent('.interlinear')).includes('ἠγάπησεν') && av.includes('STEP Bible'), 'Guia avançado: grego de Jo 3:16 com crédito');
  await p.screenshot({ path: '/tmp/shots/40-guia-avancado.png', fullPage: true });
  await p.click('.inter-pal:has-text("ἠγάπησεν")'); await p.waitForSelector('.palavra-topo', { timeout: 10000 }); await p.waitForTimeout(1200);
  var pal = await p.textContent('.folha');
  checar(pal.includes('ἀγαπάω') && pal.includes('Strong G0025') && pal.includes('verbo, aoristo') && /Onde aparece \(\d+ vezes\)/.test(pal), 'Palavra original: lema, Strong, gramática em português e ocorrências');
  checar(await p.locator('.folha .lista .item').count() >= 12 && !(await p.textContent('.folha .lista .item .texto-vers')).startsWith('…'), 'Palavra original: ocorrências com o texto em português');
  await p.screenshot({ path: '/tmp/shots/41-palavra.png' });
  await p.keyboard.press('Escape'); await p.click('.niveis .chip:has-text("Intermediário")'); await p.waitForSelector('#assist-q');
  await p.click('.modos-estudo .chip:has-text("Doutrinas")'); await p.waitForSelector('.assist-area .item');
  checar(await p.locator('.assist-area .item').count() >= 19, 'Doutrinas: lista com os temas');
  await p.click('.assist-area .item:has-text("Dízimos e ofertas")'); await p.waitForSelector('.conclusao'); await p.waitForTimeout(800);
  var dz = await p.textContent('.assist-area');
  checar(dz.includes('Como os cristãos leem') && dz.includes('Objeções e dificuldades') && dz.includes('Explícito no texto') && !(await p.textContent('.assist-area .lista .item .texto-vers')).startsWith('…'), 'Doutrina: passagens com texto, leituras, objeções e conclusão equilibrada');
  await p.screenshot({ path: '/tmp/shots/42-doutrina.png', fullPage: true });
  await p.click('.modos-estudo .chip:has-text("Bereano")'); await p.waitForSelector('#bereano-q');
  await p.fill('#bereano-q', 'O dízimo é obrigatório para o cristão'); await p.click('.assist-caixa .bt.pri');
  await p.waitForSelector('ol.passos-bereanos', { timeout: 20000 });
  var br = await p.textContent('.assist-area');
  checar(br.includes('Está escrito com essas palavras?') && br.includes('Dízimos e ofertas') && br.includes('Perguntas para examinar'), 'Bereano (sem IA): frase exata, passagens, tema curado e perguntas');
  await p.screenshot({ path: '/tmp/shots/43-bereano.png', fullPage: true });
  await p.click('.modos-estudo .chip:has-text("Grego e hebraico")'); await p.waitForSelector('#orig-q');
  await p.fill('#orig-q', 'graça'); await p.press('#orig-q', 'Enter'); await p.waitForSelector('.assist-area .item', { timeout: 15000 });
  checar((await p.textContent('.assist-area')).includes('χάρις'), 'Original: busca por palavra em português');
  await p.fill('#orig-q', 'Gn 1:1'); await p.press('#orig-q', 'Enter'); await p.waitForSelector('.inter-vers.rtl', { timeout: 15000 });
  checar((await p.textContent('.interlinear')).includes('בָּרָא'), 'Original: hebraico de Gn 1:1 da direita para a esquerda');
  await p.screenshot({ path: '/tmp/shots/44-hebraico.png' });
  await p.evaluate(() => { App.estado.assistenteModo = 'estudar'; App.salvarConfig({ nivelEstudo: 'intermediario' }); });
  await p.evaluate(() => App.abrirBiblia('ROM', 5, 1)); await p.waitForSelector('.v[data-v="1"]');
  await p.click('.v[data-v="1"]'); await p.click('.barra-sel button:has-text("Original")');
  await p.waitForSelector('.folha .inter-pal', { timeout: 15000 });
  checar((await p.textContent('.folha')).includes('ικαιωθέντες'), 'Bíblia: “Original” mostra o grego da seleção');
  await p.keyboard.press('Escape'); await p.evaluate(() => App.ir('assistente')); await p.waitForSelector('#assist-q');
  // IA simulada: usa as ferramentas do app e devolve uma referência e uma obra inventadas
  await p.evaluate(() => {
    window.__chamadas = [];
    const mock = async function (input, opts) {
      const t = opts.tools.find(x => x.name === 'ler_passagem'); const r = await t.execute({ referencia: 'Jo 3:16' }); window.__chamadas.push('texto:' + r.referencia);
      return { text: 'Veja também Rm 5:8, que mostra o amor de Deus. (Simulação)' };
    };
    mock.json = async function (input, opts) {
      const ferr = Object.fromEntries(opts.tools.map(x => [x.name, x]));
      if (/Modo Bereano/.test(input)) {
        const d = await ferr.doutrina.execute({ tema: 'dízimo' }); window.__chamadas.push('doutrina:' + d.nome);
        return { afirmacao: 'O dízimo é obrigatório para o cristão.', classificacao: 'debatida', resposta: 'Resposta simulada.', a_favor: [{ ref: 'Ml 3:10', nota: 'trazei os dízimos' }, { ref: 'Ml 9:99', nota: 'inventada' }],
          limites: [{ ref: '2Co 9:7', nota: 'dar com alegria' }], contexto: 'Contexto simulado.', leituras: [], explicito_x_interpretacao: 'Texto e interpretação.', perguntas: ['?'] };
      }
      if (/encontrar passagens/.test(input)) {
        const b = await ferr.buscar_texto.execute({ consulta: 'ansiosos' }); window.__chamadas.push('busca:' + b.total);
        return { resumo: 'Deus convida a lançar sobre ele a ansiedade (Fp 4:6).', versiculos: [{ ref: 'Fp 4:6-7', motivo: 'oração em vez de ansiedade' }, { ref: '1 Pe 5:7', motivo: 'Deus cuida' }, { ref: 'Mt 6:99', motivo: 'inventado' }], sugestoes: ['paz de Deus'] };
      }
      const a = await ferr.ler_passagem.execute({ referencia: 'Jo 3' }); window.__chamadas.push('cap:' + a.referencia);
      const i = await ferr.introducao_livro.execute({ livro: 'João' }); window.__chamadas.push('intro:' + i.nome);
      const c = await ferr.referencias_cruzadas.execute({ referencia: 'Jo 3:16' }); window.__chamadas.push('refs:' + c.referencias.length);
      return { titulo: 'O amor que dá', resumo: 'Resumo simulado.', contexto_historico: 'Conversa com Nicodemos, fariseu, em Jerusalém.', cultura: 'Mestres judeus debatiam à noite.', sentido: 'Deus ama o mundo e dá o Filho (compare 1 Jo 4:9).',
        palavras: [{ termo: 'mundo', explicacao: 'a humanidade' }], ligacoes: [{ ref: '1 Jo 4:9', nota: 'o mesmo amor' }, { ref: 'Jo 30:1', nota: 'inventada' }], interpretacoes: [], aplicacao: 'Crer e descansar.', perguntas: ['O que significa crer?'], obras: ['chc-nt', 'livro-falso'] };
    };
    window.__sample = mock;
  });
  await p.evaluate(() => App.recarregar()); await p.waitForSelector('#assist-q'); await p.waitForTimeout(300);
  await p.fill('#assist-q', 'Jo 3:16'); await p.click('.assist-caixa .bt.pri');
  await p.waitForSelector('.estudo-sec', { timeout: 10000 });
  var est = await p.textContent('.assist-area');
  checar(est.includes('Porque Deus amou o mundo') && est.includes('Contexto histórico') && est.includes('Cultura e costumes') && est.includes('O sentido no texto'), 'Assistente: estudo com texto da tradução, contexto, cultura e sentido');
  checar(est.includes('Primeira Epístola de João 4:9') || est.includes('1 João 4:9'), 'Assistente: passagem relacionada conferida');
  checar((await p.textContent('.assist-status')).includes('1 referência'), 'Assistente: referência inventada descartada e informada');
  checar(est.includes('Comentário Histórico-Cultural') && !est.includes('livro-falso'), 'Assistente: só obras da lista fixa');
  checar(est.includes('Ficha do livro de João'), 'Assistente: ficha curada do livro');
  var ch = await p.evaluate(() => window.__chamadas);
  checar(ch.includes('cap:João 3') && ch.includes('intro:João') && ch.some(x => /^refs:[1-9]/.test(x)), 'Assistente: IA lê capítulo, ficha e referências cruzadas pelo app');
  await p.fill('#assist-perg', 'Quem era Nicodemos?'); await p.click('.pergunta-linha .bt');
  await p.waitForSelector('.bolha .r .link-ref', { timeout: 8000 });
  checar((await p.textContent('.bolha .r .link-ref')).includes('Rm 5:8'), 'Assistente: resposta à pergunta com referência clicável');
  await p.screenshot({ path: '/tmp/shots/20-assistente-estudo.png', fullPage: true });
  await p.fill('#assist-q', 'versículos sobre ansiedade'); await p.click('.assist-caixa .bt.pri');
  await p.waitForSelector('.res-assist', { timeout: 10000 }); await p.waitForTimeout(500);
  checar(await p.locator('.res-assist').count() === 2 && (await p.textContent('.res-assist')).includes('Filipenses 4:6-7'), 'Assistente: pesquisa por tema com passagens conferidas');
  checar(!(await p.textContent('.res-assist .texto-vers')).startsWith('…'), 'Assistente: texto dos versículos vem da tradução');
  checar((await p.evaluate(() => window.__chamadas)).some(x => /^busca:[1-9]/.test(x)), 'Assistente: busca no texto bíblico pelo app');
  await p.screenshot({ path: '/tmp/shots/21-assistente-pesquisa.png', fullPage: true });
  await p.evaluate(() => App.recarregar()); await p.waitForSelector('#assist-q');
  checar(await p.locator('.tela .lista .item:has-text("Estudo")').count() >= 1, 'Assistente: estudos recentes guardados');
  await p.click('.modos-estudo .chip:has-text("Bereano")'); await p.waitForSelector('#bereano-q');
  await p.fill('#bereano-q', 'O dízimo é obrigatório para o cristão'); await p.click('.assist-caixa .bt.pri');
  await p.waitForSelector('.selo-bereano', { timeout: 15000 }); await p.waitForSelector('ol.passos-bereanos', { timeout: 20000 });
  var bia = await p.textContent('.tela');
  checar(bia.includes('Cristãos fiéis à Escritura leem de formas diferentes') && bia.includes('Conferência pelo app') && (await p.textContent('.assist-status')).includes('1 referência') && (await p.evaluate(() => window.__chamadas)).includes('doutrina:Dízimos e ofertas'), 'Bereano com IA: classificação, referência inventada descartada, tema curado e conferência do app');
  await p.click('.modos-estudo .chip:has-text("Estudar")'); await p.waitForSelector('#assist-q');
  await p.fill('#assist-q', 'às vezes penso em me matar'); await p.click('.assist-caixa .bt.pri'); await p.waitForTimeout(400);
  checar((await p.textContent('#camadas')).includes('188'), 'Assistente: acolhimento com CVV diante de sinal de crise');
  await p.keyboard.press('Escape'); await p.waitForTimeout(800);
  // Entender a partir da Bíblia
  await p.evaluate(() => App.abrirBiblia('ROM', 8, 28)); await p.waitForSelector('.v[data-v="28"]');
  await p.click('.v[data-v="28"]'); await p.click('.barra-sel button:has-text("Entender")');
  await p.waitForSelector('.estudo-topo', { timeout: 10000 });
  checar((await p.textContent('.estudo-topo')).includes('Romanos 8:28'), 'Bíblia: “Entender” abre o estudo da seleção');

  // Quiz
  await p.evaluate(() => App.ir('quiz')); await p.waitForSelector('.quiz-desafio');
  await p.click('.quiz-desafio .bt');
  for (let i = 0; i < 5; i++) {
    await p.waitForSelector('.opcao:not([disabled])'); await p.click('.opcao >> nth=0');
    await p.waitForSelector('.quiz-feedback .trecho sup', { timeout: 8000 });
    if (i === 0) { checar((await p.locator('.opcao.certa').count()) === 1, 'Quiz: mostra a resposta certa'); await p.screenshot({ path: '/tmp/shots/22-quiz.png', fullPage: true }); }
    await p.click('.quiz-feedback .bt.pri');
  }
  await p.waitForSelector('.quiz-final');
  checar((await p.textContent('.placar')).includes('/5'), 'Quiz: resultado do desafio do dia');
  await p.screenshot({ path: '/tmp/shots/23-quiz-final.png', fullPage: true });
  await p.click('.quiz-final ~ .linha-bts .bt.pri'); await p.waitForSelector('.quiz-desafio');
  checar((await p.textContent('.quiz-desafio')).includes('Feito'), 'Quiz: desafio do dia marcado como feito');
  await p.click('.chip:has-text("Evangelhos")'); await p.click('.chip:has-text("Fácil")');
  await p.click('button:has-text("Jogar 10 perguntas")'); await p.waitForSelector('.quiz-topo');
  checar((await p.textContent('.quiz-topo')).includes('Evangelhos') && (await p.textContent('.quiz-topo')).includes('Fácil'), 'Quiz: rodada filtrada por tema e nível');
  await p.click('.quiz .linha-bts .bt:has-text("Sair")');

  // Mural
  await p.evaluate(() => App.ir('mural')); await p.waitForSelector('.curio');
  checar(await p.locator('.curio').count() >= 10, 'Mural: curiosidades com fontes');
  await p.screenshot({ path: '/tmp/shots/24-mural.png', fullPage: true });
  await p.click('.chip:has-text("95 Teses")'); await p.waitForSelector('li.tese');
  checar(await p.locator('li.tese').count() === 95, 'Mural: as 95 Teses');
  await p.fill('#teses-busca', 'tesouro'); await p.waitForTimeout(200);
  var nT = await p.locator('li.tese').count();
  checar(nT > 2 && nT < 15 && (await p.textContent('ol.teses')).includes('santíssimo evangelho'), 'Mural: busca nas teses');
  await p.fill('#teses-busca', ''); await p.evaluate(() => { App.estado.tesesBusca = ''; });
  await p.screenshot({ path: '/tmp/shots/25-teses.png' });
  await p.click('.chip:has-text("Números da Bíblia")'); await p.waitForSelector('.numero-cartao');
  var num = await p.textContent('.mural');
  checar(num.includes('31.102') && num.includes('Salmos 117') && num.includes('Salmos 103:1'), 'Mural: números calculados da tradução');
  await p.fill('#mural-palavra', 'graça'); await p.click('.pergunta-linha .bt.pri');
  await p.waitForSelector('.mural .cartao b', { timeout: 15000 }); await p.waitForTimeout(300);
  checar(/aparece em\s*[\d.]+\s*versículo/.test(await p.textContent('.mural')), 'Mural: contador de palavras');
  await p.screenshot({ path: '/tmp/shots/26-numeros.png', fullPage: true });

  await p.evaluate(() => App.ir('inicio')); await p.waitForTimeout(300);
  // persistência após recarregar
  await p.reload(); await p.waitForSelector('.tela .v, .vdia', { timeout: 15000 }); await p.waitForTimeout(800);
  await p.click('a[data-aba="biblioteca"]'); await p.waitForTimeout(300);
  await p.click('.chip:has-text("Favoritos")'); await p.waitForTimeout(300);
  checar((await p.textContent('.tela')).includes('2 versículos'), 'Persistência: favoritos após recarregar');

  // desktop
  await p.setViewportSize({ width: 1280, height: 860 }); await p.click('a[data-aba="inicio"]'); await p.waitForTimeout(600);
  await p.screenshot({ path: '/tmp/shots/9-desktop.png' });
  console.log('\nOK:', ok.length, ' FALHAS:', falhas.length, '\nERROS DE CONSOLE:', erros.length); erros.slice(0, 10).forEach(e => console.log('  ', e.slice(0, 300)));
  await b.close();
  process.exit(falhas.length || erros.length ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE', e); console.log('OK:', ok.length, 'FALHAS:', falhas, 'ERROS:', erros); process.exit(2); });
