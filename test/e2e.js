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
  checar(!(await p.textContent('.folha')).includes('Aguardando licença') && await p.locator('.folha .cartao').count() === 4, 'Comparar: só as 4 traduções licenciadas');
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

  // ---------------------------------------------------------------- Criar: Estúdio v2 (4 etapas)
  const estArte = () => p.evaluate(() => JSON.parse(JSON.stringify(Telas.criar._estado())));
  const camadaDe = async (papel) => (await estArte()).spec.camadas.find(c => c.papel === papel);
  await p.click('a[data-aba="criar"]'); await p.waitForSelector('.criar-hero');
  checar((await p.textContent('.criar-hero')).includes('Nova arte'), 'Estúdio: início com Nova arte e as 4 etapas');
  await p.screenshot({ path: '/tmp/shots/4-criar-inicio.png' });
  // etapa 1 — versículo
  await p.click('#nova-arte'); await p.waitForSelector('#arte-busca');
  checar((await p.textContent('.passos li.atual')).includes('Versículo') && await p.isDisabled('#continuar-1'), 'Etapa 1: ativa e sem versículo não continua');
  await p.fill('#arte-busca', 'pastor'); await p.press('#arte-busca', 'Enter');
  await p.waitForSelector('.resultados-busca .item mark', { timeout: 30000 });
  checar(await p.locator('.resultados-busca .item').count() > 3, 'Etapa 1: busca por palavra-chave');
  await p.fill('#arte-busca', 'Sl 23:1'); await p.press('#arte-busca', 'Enter'); await p.waitForSelector('.resultados-busca .item');
  await p.click('.resultados-busca .item'); await p.waitForSelector('.previa-vers .texto');
  checar((await p.textContent('.previa-vers')).includes('O SENHOR é meu pastor'), 'Etapa 1: texto exato da tradução na prévia');
  await p.selectOption('#sel-livro', 'JHN'); await p.waitForTimeout(200);
  await p.selectOption('#sel-cap', '3'); await p.waitForTimeout(200);
  await p.selectOption('#sel-v1', '16'); await p.waitForTimeout(700);
  checar((await p.textContent('.previa-vers')).includes('Porque Deus amou o mundo'), 'Etapa 1: escolha por livro, capítulo e versículo');
  await p.fill('#arte-rotulo', 'João 3.16');
  await p.screenshot({ path: '/tmp/shots/4b-etapa1.png' });
  await p.click('#continuar-1');
  // etapa 2 — modelo
  await p.waitForSelector('.modelo-card canvas'); await p.waitForTimeout(1500);
  checar(await p.locator('.cats-modelo .chip').count() === 15, 'Etapa 2: 12 categorias, Todos, Favoritos e Meus modelos');
  await p.click('.cats-modelo .chip:has-text("Clássico")'); await p.waitForTimeout(1500);
  checar(await p.locator('.modelo-card').count() === 5, 'Etapa 2: categoria Clássico com prévias reais');
  const pxModelo = await p.$eval('.modelo-card canvas', c => c.width);
  checar(pxModelo === 300, 'Etapa 2: prévia desenhada com o versículo escolhido');
  await p.click('.modelo-card >> nth=1 >> .mc-fav'); await p.waitForTimeout(200);
  checar(await p.evaluate(() => Dados.todos('modelosFav').length) === 1, 'Etapa 2: modelo favoritado');
  await p.click('.modelo-card >> nth=0 >> button[aria-label^="Ver"]'); await p.waitForSelector('.folha canvas'); await p.waitForTimeout(600);
  checar(await p.$eval('.folha canvas', c => c.width) === 760, 'Etapa 2: modelo em tela cheia');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.screenshot({ path: '/tmp/shots/4c-etapa2.png' });
  await p.click('.modelo-card[data-modelo="cla-pergaminho"] .mc-usar');
  // etapa 3 — editor
  await p.waitForSelector('.editor-arte'); await p.waitForTimeout(1500);
  checar(!(await p.isVisible('.abas')), 'Editor imersivo: navegação principal oculta');
  checar(Math.abs(await p.$eval('.ed-mesa canvas', c => c.width / c.height) - 1080 / 1350) < 0.01, 'Editor: arte no formato Feed 1080×1350');
  let e1 = await estArte();
  checar(e1.spec.conteudo.ref === 'Jo 3:16' && e1.spec.conteudo.rotulo === 'João 3.16' && e1.spec.modelo === 'cla-pergaminho', 'Editor: versículo, referência personalizada e modelo aplicados');
  checar((await p.textContent('.ed-painel')).includes('Porque Deus amou o mundo de tal maneira'), 'Editor: texto bíblico exato e não editável');
  checar(!!(await p.$('.ed-sobre .sel .alca')), 'Editor: seleção com alças de redimensionar e girar');
  // texto
  await p.click('.sub-abas .chip:has-text("Fonte")'); await p.click('.fontes button:has-text("Montserrat")'); await p.waitForTimeout(200);
  checar((await camadaDe('versiculo')).fonte === 'Montserrat', 'Texto: troca de fonte');
  await p.click('.sub-abas .chip:has-text("Estilo")'); await p.click('.chip.alternar[title="Negrito"]'); await p.waitForTimeout(200);
  checar((await camadaDe('versiculo')).negrito === true, 'Texto: negrito');
  await p.click('.sub-abas .chip:has-text("Efeitos")');
  await p.locator('.deslizador:has-text("Contorno") input').fill('3'); await p.waitForTimeout(200);
  checar((await camadaDe('versiculo')).contorno === 3, 'Texto: contorno');
  await p.click('#ed-desfazer'); await p.waitForTimeout(200);
  checar((await camadaDe('versiculo')).contorno === 0, 'Edição: desfazer');
  await p.click('#ed-refazer'); await p.waitForTimeout(200);
  checar((await camadaDe('versiculo')).contorno === 3, 'Edição: refazer');
  // arrastar o versículo
  const yAntes = (await camadaDe('versiculo')).y;
  const sb = await p.$eval('.ed-sobre .sel', el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(sb.x, sb.y); await p.mouse.down(); await p.mouse.move(sb.x, sb.y + 50, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(400);
  checar((await camadaDe('versiculo')).y > yAntes + 0.05, 'Editor: arrastar o texto no canvas');
  // arrastar a referência a solta do versículo
  const rb = await p.evaluate(() => { const c = document.querySelector('.ed-mesa canvas'), r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  // fundo
  await p.click('.ed-barra button[data-painel="fundo"]'); await p.click('.sub-abas .chip:has-text("Cores")');
  await p.click('.seletor-cor .amostra[aria-label="Cor #4A1C2A"]'); await p.waitForTimeout(300);
  e1 = await estArte(); checar(e1.spec.fundo.tipo === 'cor' && e1.spec.fundo.cor === '#4A1C2A', 'Fundo: cor sólida');
  await p.click('.sub-abas .chip:has-text("Degradês")'); await p.click('.degrades button >> nth=2'); await p.waitForTimeout(300);
  checar((await estArte()).spec.fundo.tipo === 'gradiente', 'Fundo: degradê');
  await p.click('.sub-abas .chip:has-text("Minhas imagens")');
  await p.setInputFiles('#fundo-upload', { name: 'minha.jpg', mimeType: 'image/jpeg', buffer: require('fs').readFileSync(__dirname + '/../app/fundos/fotos/pier-mini.jpg') });
  await p.waitForTimeout(1200);
  e1 = await estArte(); checar(e1.spec.fundo.tipo === 'imagem' && await p.evaluate(() => Dados.todos('_imagensArte').length) === 1, 'Fundo: imagem própria enviada (fica no aparelho)');
  await p.click('.sub-abas .chip:has-text("Fotos")'); await p.fill('#fundo-busca', 'leão'); await p.waitForTimeout(300);
  checar(await p.locator('.fundos.papeis button').count() === 1, 'Fundo: busca nas fotos');
  await p.click('.fundos.papeis button[title="Leão de Judá"]'); await p.waitForTimeout(1500);
  checar((await estArte()).spec.fundo.id === 'leao' && (await p.textContent('.ed-painel')).includes('Pixabay'), 'Fundo: foto da biblioteca com crédito');
  await p.click('.sub-abas .chip:has-text("Ajustes")');
  await p.locator('.deslizador:has-text("Desfoque") input').fill('6'); await p.locator('.deslizador:has-text("Brilho") input').fill('0.8'); await p.waitForTimeout(800);
  e1 = await estArte(); checar(e1.spec.fundo.desfoque === 6 && e1.spec.fundo.brilho === 0.8, 'Fundo: desfoque e brilho');
  await p.click('.sub-abas .chip:has-text("Sobreposição")'); await p.locator('.deslizador:has-text("Intensidade") input').fill('0.4'); await p.waitForTimeout(300);
  checar((await estArte()).spec.fundo.sobreposicao.opacidade === 0.4, 'Fundo: sobreposição');
  // cores
  await p.click('.ed-barra button[data-painel="cores"]'); await p.click('.paleta[aria-label="Aplicar a paleta Vinho"]'); await p.waitForTimeout(300);
  checar((await estArte()).spec.paleta === 'vinho', 'Cores: paleta harmonizada aplicada');
  checar(await p.locator('.harmonia').count() === 4, 'Cores: harmonias geradas pela cor selecionada');
  // elementos
  await p.click('.ed-barra button[data-painel="elementos"]');
  const nAntes = (await estArte()).spec.camadas.length;
  await p.click('.item-bib[aria-label="Adicionar Pomba"]'); await p.waitForTimeout(300);
  e1 = await estArte(); const pomba = e1.spec.camadas.find(c => c.icone === 'pomba');
  checar(e1.spec.camadas.length === nAntes + 1 && pomba && e1.sel === pomba.id, 'Elementos: ícone adicionado e selecionado');
  const iVers = e1.spec.camadas.findIndex(c => c.papel === 'versiculo');
  checar(e1.spec.camadas.findIndex(c => c.id === pomba.id) < iVers, 'Elementos: o texto continua por cima');
  await p.click('.item-bib[aria-label="Adicionar Moldura dupla"]'); await p.waitForTimeout(300);
  await p.click('#ed-duplicar'); await p.waitForTimeout(200);
  checar((await estArte()).spec.camadas.filter(c => c.forma === 'moldura').length >= 3, 'Elementos: duplicar');
  await p.click('#ed-excluir-el'); await p.waitForTimeout(200);
  // camadas
  await p.click('.ed-barra button[data-painel="camadas"]'); await p.waitForTimeout(200);
  await p.click('.lista-camadas li:has-text("Referência") button[aria-label^="Ocultar"]'); await p.waitForTimeout(200);
  checar((await camadaDe('referencia')).visivel === false, 'Camadas: ocultar');
  await p.click('.lista-camadas li:has-text("Referência") button[aria-label^="Mostrar"]'); await p.waitForTimeout(200);
  await p.click('.lista-camadas li:has-text("Pomba") .cam-nome'); await p.click('.lista-camadas li:has-text("Pomba") button[aria-label^="Bloquear"]'); await p.waitForTimeout(200);
  checar((await estArte()).spec.camadas.find(c => c.icone === 'pomba').bloqueado === true && !!(await p.$('.ed-sobre .sel.travada')), 'Camadas: bloquear');
  const ordem0 = (await estArte()).spec.camadas.findIndex(c => c.icone === 'pomba');
  await p.click('.lista-camadas li.sel button:has-text("Subir")'); await p.waitForTimeout(200);
  checar((await estArte()).spec.camadas.findIndex(c => c.icone === 'pomba') === ordem0 + 1, 'Camadas: reordenar');
  await p.screenshot({ path: '/tmp/shots/4d-editor.png' });
  // licença das fotos: sem texto visível não exporta
  await p.evaluate(() => { const s = Telas.criar._estado().spec; s.camadas.forEach(c => { if (c.tipo === 'texto') c.visivel = false; }); });
  await p.click('#ed-exportar'); await p.waitForSelector('#exp-baixar'); await p.click('#exp-baixar'); await p.waitForTimeout(600);
  checar((await p.textContent('body')).includes('só podem sair com texto'), 'Fotos: não exporta a foto sem texto (licença)');
  await p.keyboard.press('Escape');
  await p.evaluate(() => { const s = Telas.criar._estado().spec; s.camadas.forEach(c => { if (c.tipo === 'texto') c.visivel = true; }); });
  // menu: renomear e formato
  await p.click('#ed-menu'); await p.click('.folha .item:has-text("Renomear")'); await p.fill('.folha input.entrada', 'Amor de Deus'); await p.click('.folha button:has-text("Salvar")'); await p.waitForTimeout(300);
  checar((await p.textContent('.ed-nome')).includes('Amor de Deus'), 'Editor: renomear');
  await p.click('#ed-menu'); await p.click('.folha .item:has-text("Formato")'); await p.click('.folha .item:has-text("Status do WhatsApp")'); await p.waitForTimeout(1200);
  checar(Math.abs(await p.$eval('.ed-mesa canvas', c => c.width / c.height) - 1080 / 1920) < 0.01, 'Formato: Status do WhatsApp 1080×1920');
  await p.waitForTimeout(1800);
  e1 = await estArte();
  const salvo = await p.evaluate(id => Dados.obter('artes', id), e1.id);
  checar(salvo && salvo.estado === 'rascunho' && salvo.spec.nome === 'Amor de Deus' && /^data:image\/jpeg/.test(salvo.miniatura), 'Salvamento automático como rascunho');
  checar((await p.textContent('.ed-status')).includes('Salvo'), 'Indicador de salvamento');
  // etapa 4 — exportar
  await p.click('#ed-exportar'); await p.waitForSelector('.folha .previa-export'); await p.waitForTimeout(800);
  checar((await p.textContent('.folha .passos li.atual')).includes('Exportar'), 'Etapa 4: exportar e compartilhar');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }).catch(() => null), p.click('#exp-baixar')]);
  if (dl) { const buf = require('fs').readFileSync(await dl.path()); checar(buf.slice(1, 4).toString() === 'PNG' && buf.readUInt32BE(16) === 1080 && buf.readUInt32BE(20) === 1920, 'Exportação: PNG 1080×1920'); }
  else checar(false, 'Exportação: download do PNG');
  await p.waitForTimeout(1200); await p.keyboard.press('Escape');   // fecha a folha de apoio “Salvar imagem”
  checar((await p.evaluate(id => Dados.obter('artes', id), e1.id)).estado === 'finalizada', 'Exportar move a arte para Finalizadas');
  await p.click('.folha .chip:has-text("JPG")'); await p.waitForTimeout(300);
  const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }).catch(() => null), p.click('#exp-baixar')]);
  if (dl2) { const buf = require('fs').readFileSync(await dl2.path()); checar(buf[0] === 0xFF && buf[1] === 0xD8 && dl2.suggestedFilename().endsWith('.jpg'), 'Exportação: JPG'); }
  else checar(false, 'Exportação: download do JPG');
  await p.waitForTimeout(600); await p.keyboard.press('Escape');
  await p.click('#exp-modelo'); await p.fill('.folha input.entrada', 'Meu pergaminho'); await p.click('.folha button:has-text("Salvar modelo")'); await p.waitForTimeout(300);
  checar(await p.evaluate(() => Dados.todos('modelos').length) === 1, 'Salvar como modelo');
  // trocar o versículo mantendo o visual
  await p.click('.ed-barra button[data-painel="texto"]'); await p.click('.lista-camadas li:has-text("Versículo") .cam-nome').catch(() => {});
  await p.evaluate(() => { const e = Telas.criar._estado(); e.sel = 'versiculo'; e.sub.texto = 'conteudo'; });
  await p.click('.ed-barra button[data-painel="camadas"]'); await p.click('.ed-barra button[data-painel="texto"]');
  await p.click('#ed-trocar-vers'); await p.waitForSelector('#arte-busca');
  await p.click('.chip:has-text("Fp 4:13")'); await p.waitForTimeout(600); await p.click('#continuar-1');
  await p.waitForSelector('.editor-arte'); await p.waitForTimeout(800);
  e1 = await estArte(); checar(e1.spec.conteudo.ref === 'Fp 4:13' && e1.spec.nome === 'Amor de Deus' && e1.spec.fundo.id === 'leao', 'Trocar versículo mantém o visual');
  // voltar ao início: Minhas artes
  await p.click('.ed-cab button[aria-label="Voltar para Criar"]'); await p.waitForSelector('.criar-hero'); await p.waitForTimeout(300);
  checar(await p.isVisible('.abas') && await p.locator('.area-minhas .arte-card').count() === 1, 'Minhas artes: recentes');
  await p.click('.abas-minhas .chip:has-text("Finalizadas")'); checar(await p.locator('.area-minhas .arte-card').count() === 1, 'Minhas artes: finalizadas');
  await p.click('.abas-minhas .chip:has-text("Rascunhos")'); checar(await p.locator('.area-minhas .arte-card').count() === 0, 'Minhas artes: rascunhos');
  await p.click('.abas-minhas .chip:has-text("Meus modelos")'); await p.waitForTimeout(600); checar(await p.locator('.area-minhas .arte-card canvas').count() === 1, 'Minhas artes: meus modelos');
  await p.click('.abas-minhas .chip:has-text("Modelos favoritos")'); await p.waitForTimeout(600); checar(await p.locator('.area-minhas .arte-card canvas').count() === 1, 'Minhas artes: modelos favoritos');
  await p.click('.abas-minhas .chip:has-text("Recentes")');
  await p.click('.area-minhas .arte-card'); await p.click('.folha button:has-text("Duplicar")'); await p.waitForTimeout(300);
  checar(await p.locator('.area-minhas .arte-card').count() === 2, 'Minhas artes: duplicar');
  await p.click('.area-minhas .arte-card >> nth=0'); await p.click('.folha button:has-text("Abrir e editar")'); await p.waitForSelector('.editor-arte');
  checar((await p.textContent('.ed-nome')).includes('Amor de Deus'), 'Minhas artes: reabrir para editar');
  await p.click('.ed-cab button[aria-label="Voltar para Criar"]'); await p.waitForSelector('.criar-hero');
  // Criar com IA (prévia do claude.ai): a IA só compõe; o versículo vem da tradução
  await p.evaluate(() => { window.__sample = async () => ({ text: '{"nome":"Esperança","fundo":{"tipo":"gradiente","cores":["#0F4C5C","#192D50"],"angulo":160},"texto":{"fonte":"Lora","cor":"#F4F0E5","alinhar":"center","y":0.5,"italico":true,"conteudo":"TEXTO INVENTADO"},"referencia":{"cor":"#A58A57"},"elementos":[{"forma":"icone","icone":"pomba","x":0.5,"y":0.12,"w":0.1,"h":0.1,"cor":"#A58A57"},{"forma":"textura","estilo":"granulado","opacidade":0.3,"cor":"#FFFFFF"}]}' }); });
  await p.click('#criar-ia'); await p.fill('#ia-ref', 'Is 41:10'); await p.fill('#ia-desc', 'coragem e esperança, tons de mar'); await p.click('#ia-criar');
  await p.waitForSelector('.editor-arte'); await p.waitForTimeout(1200);
  e1 = await estArte();
  checar(e1.spec.criadaComIA && e1.spec.conteudo.ref === 'Is 41:10' && e1.spec.camadas.some(c => c.icone === 'pomba') && (await camadaDe('versiculo')).fonte === 'Lora', 'Criar com IA: composição em camadas editáveis');
  const txIA = await p.evaluate(async () => (await A2Desenho.textoDaArte(Telas.criar._estado().spec)).texto);
  checar(txIA.startsWith('Não temas') && !JSON.stringify(e1.spec).includes('TEXTO INVENTADO'), 'Criar com IA: o versículo vem da tradução, nunca da IA');
  await p.screenshot({ path: '/tmp/shots/4e-ia.png' });
  await p.evaluate(() => { window.__sample = null; });
  await p.click('.ed-cab button[aria-label="Voltar para Criar"]'); await p.waitForSelector('.criar-hero');
  // atalho da Bíblia: começa nos modelos com o versículo
  await p.evaluate(() => Telas.criar.comVersiculo('Rm 8:28')); await p.waitForSelector('.modelo-card canvas'); await p.waitForTimeout(400);
  checar((await p.textContent('.passos li.atual')).includes('Modelo'), 'Atalho “Criar arte”: abre a escolha de modelo com o versículo');
  await p.click('.cab button[aria-label="Voltar"]'); await p.click('.cab button[aria-label="Voltar"]'); await p.waitForSelector('.criar-hero');
  // compatibilidade: artes da v1 continuam desenhando
  const exp = await p.evaluate(async () => { const c = document.createElement('canvas'); await Telas.criar.desenharArte(c, { formato: 'papel-pc', conteudo: { tipo: 'versiculo', ref: 'Sl 46:10', versao: 'blivre' }, fundo: { tipo: 'banco', id: 'fiorde' }, escurecer: 0.2, estilo: {}, pos: { x: 0.5, y: 0.5 }, referencia: { mostrar: true }, assinatura: {} }, 1920); const d = c.getContext('2d').getImageData(100, 100, 1, 1).data; return [c.width, c.height, d[0] + d[1] + d[2]]; });
  checar(exp[0] === 1920 && exp[1] === 1080 && exp[2] > 30, 'Compatibilidade: arte da v1 (papel de parede Full HD com foto)');
  // Inspirações (galeria editorial)
  await p.click('.item.inspira'); await p.waitForTimeout(2500);
  checar(await p.locator('.arte-card canvas').count() >= 5, 'Inspirações: artes prontas desenhadas');
  await p.click('.chip:has-text("Papéis de parede")'); await p.waitForTimeout(4000);
  checar(await p.locator('.arte-card.papel canvas').count() === 12, 'Inspirações: papéis de parede prontos');
  await p.click('.arte-card >> nth=0'); await p.waitForTimeout(600);
  await p.click('.folha button:has-text("Personalizar")'); await p.waitForSelector('.editor-arte'); await p.waitForTimeout(600);
  checar((await estArte()).spec.formato === 'papel-celular', 'Inspirações: personalizar abre no editor');
  await p.click('.ed-cab button[aria-label="Voltar para Criar"]'); await p.waitForSelector('.criar-hero');

  // Biblioteca
  await p.click('a[data-aba="biblioteca"]'); await p.waitForSelector('.bib-resumo');
  checar((await p.textContent('.bib-num[data-num="favoritos"] b')) === '2' && (await p.textContent('.cab-bib')).includes('Seus conteúdos organizados'), 'Biblioteca: cabeçalho e resumo com números reais');
  checar(await p.locator('.acesso-card').count() === 4 && await p.locator('.cats-bib .chip').count() === 11, 'Biblioteca: acesso rápido e 11 categorias (com Livros e Artigos)');
  await p.click('.acesso-card[data-acesso="favoritos"]'); await p.waitForTimeout(300);
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
  // Biblioteca: recentes, coleções com vários tipos, pesquisa, ações e estados vazios
  await p.click('.cats-bib .chip[data-cat="todos"]'); await p.waitForSelector('.bib-lista .bib-item');
  checar(await p.locator('.bib-lista .bib-item').count() >= 4 && (await p.textContent('.bib-lista')).includes('Batismo em Atos'), 'Biblioteca: adicionados recentemente (versículos, anotação e estudo)');
  await p.click('#nova-colecao'); await p.click('.folha .chip:has-text("Pregações")'); await p.fill('#col-desc', 'Esboços e textos-base');
  await p.click('.icone-col[aria-label="Ícone chama"]'); await p.click('#col-salvar'); await p.waitForSelector('#col-adicionar');
  await p.click('#col-adicionar'); await p.waitForSelector('.lista-sel input');
  await p.click('.lista-sel .sel-item:has-text("Batismo em Atos")'); await p.click('.lista-sel .sel-item >> nth=0'); await p.waitForTimeout(200);
  await p.click('#col-concluir'); await p.waitForTimeout(300);
  checar(await p.locator('.col-folha .bib-item').count() === 2 && (await p.textContent('.col-cab')).includes('2 itens'), 'Coleção com versículo e estudo');
  await p.click('.col-folha .bib-item[data-tipo="estudo"] button[aria-label="Tirar da coleção"]'); await p.waitForTimeout(200);
  checar(await p.locator('.col-folha .bib-item').count() === 1, 'Coleção: remover conteúdo');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  checar(await p.evaluate(() => { const c = Dados.todos('colecoes').find(x => x.nome === 'Pregações'); return c && c.icone === 'chama' && c.descricao === 'Esboços e textos-base'; }), 'Coleção salva com nome, descrição e ícone');
  await p.click('.bib-item[data-tipo="estudo"] .bib-menu'); await p.click('.folha .item:has-text("Adicionar a uma coleção")');
  await p.click('.folha label.chave:has-text("Pregações")'); await p.waitForTimeout(200); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  checar(await p.evaluate(() => Dados.todos('colecoes').find(x => x.nome === 'Pregações').itens.some(i => i.tipo === 'estudo')), 'Menu do conteúdo: adicionar a uma coleção');
  await p.fill('#bib-busca', 'Jo 1:14'); await p.waitForSelector('.busca-total'); await p.waitForTimeout(300);
  checar((await p.textContent('.bib-area')).includes('Anotação'), 'Pesquisa por referência encontra a anotação');
  await p.fill('#bib-busca', 'pregações'); await p.waitForTimeout(800);
  checar(await p.locator('.bib-area .col-card').count() === 1 && await p.locator('.bib-area .bib-item').count() >= 1, 'Pesquisa por nome de coleção');
  await p.fill('#bib-busca', 'verbo'); await p.waitForTimeout(800);
  checar((await p.textContent('.bib-area')).includes('João 1:14') || (await p.textContent('.bib-area')).includes('Anotação'), 'Pesquisa por palavra');
  await p.click('.busca-filtros .chip:has-text("Estudos")'); await p.waitForTimeout(500);
  checar(await p.locator('.bib-area .bib-item[data-tipo="nota"]').count() === 0, 'Pesquisa: filtro por categoria');
  await p.fill('#bib-busca', ''); await p.waitForTimeout(400);
  await p.click('.cats-bib .chip[data-cat="artes"]'); await p.waitForTimeout(300);
  const nArtes = await p.evaluate(() => Dados.todos('artes').length);
  checar(nArtes ? await p.locator('.arte-bib').count() === nArtes : !!(await p.$('.vazio-bib')), 'Biblioteca: categoria Artes');
  if (nArtes) { await p.click('.arte-bib-abrir >> nth=0'); await p.waitForSelector('.editor-arte'); checar(true, 'Biblioteca: abrir arte no estúdio'); await p.click('.ed-cab button[aria-label="Voltar para Criar"]'); await p.click('a[data-aba="biblioteca"]'); }
  await p.click('.cats-bib .chip[data-cat="destaques"]'); await p.waitForTimeout(200);
  checar(await p.locator('.vazio-bib, .lista .item').count() >= 1, 'Biblioteca: destaques preservados');
  await p.evaluate(() => { App.estado.colecao = 'todas'; }); await p.click('.cats-bib .chip[data-cat="favoritos"]'); await p.waitForTimeout(300);
  await p.click('.bib-item[data-tipo="versiculo"] .bib-menu >> nth=0'); await p.click('.folha .item:has-text("Remover dos favoritos")');
  await p.click('.folha button:has-text("Cancelar")').catch(() => {}); await p.waitForTimeout(300);
  checar(await p.evaluate(() => Dados.todos('favoritos').length) === 2, 'Excluir pede confirmação (cancelado)');
  await p.click('.cats-bib .chip[data-cat="todos"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: '/tmp/shots/6-biblioteca.png' });

  // Perfil e tema noturno
  await p.click('a[data-aba="perfil"]'); await p.waitForTimeout(300);
  checar((await p.textContent('.jornada2')).includes('Capítulos lidos') && !!(await p.$('#ver-jornada')), 'Perfil: estatísticas de Minha jornada');
  await p.click('#pref-tema .chip[data-tema="escuro"]'); await p.waitForTimeout(200);
  checar(await p.getAttribute('html', 'data-tema') === 'escuro', 'Perfil: modo noturno');
  checar(await p.getAttribute('#pref-tema .chip[data-tema="escuro"]', 'aria-pressed') === 'true', 'Perfil: aparência em chips com seleção');
  await p.click('#pref-tema .chip[data-tema="claro"]'); await p.evaluate(() => App.ir('inicio')); await p.waitForSelector('.cab-inicio .bt-tema');
  await p.click('.cab-inicio .bt-tema'); checar(await p.getAttribute('html', 'data-tema') === 'escuro' && await p.getAttribute('.cab-inicio .bt-tema', 'aria-pressed') === 'true', 'Início: botão de modo noturno liga o tema escuro');
  await p.click('.cab-inicio .bt-tema'); checar(await p.getAttribute('html', 'data-tema') === 'claro', 'Início: o mesmo botão volta ao modo claro');
  await p.evaluate(() => App.abrirBiblia('1TH', 5, 1)); await p.waitForSelector('.leitor-cab .bt-tema');
  checar(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Leitor: cabeçalho com botão de tema cabe na tela (1 Tessalonicenses)');
  await p.click('.leitor-cab .bt-tema'); checar(await p.getAttribute('html', 'data-tema') === 'escuro', 'Leitor: botão de modo noturno no cabeçalho');
  await p.click('.leitor-cab .bt-tema'); await p.evaluate(() => App.ir('perfil')); await p.waitForSelector('#pref-tema');
  checar(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--vdia-azul').trim() !== ''), 'Paleta: tons do Versículo do Dia guardados');
  await p.screenshot({ path: '/tmp/shots/7-perfil-escuro.png', fullPage: true });
  await p.click('a[data-aba="biblia"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/shots/8-biblia-escuro.png' });
  await p.click('a[data-aba="perfil"]'); await p.waitForTimeout(200); await p.click('#pref-tema .chip[data-tema="claro"]'); await p.waitForTimeout(150);

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
  await p.click('#ver-licencas'); await p.waitForTimeout(800);
  var sobre = await p.textContent('.folha');
  checar(sobre.includes('marca registrada') && sobre.includes('Gutenberg') && sobre.includes('Bíblia Livre'), 'Perfil: créditos e licenças das três traduções');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // a arte nova usa a tradução escolhida
  checar(await p.evaluate(() => Biblia.padrao()) === 'onbv', 'Tradução padrão segue a escolha');
  var vd2 = await p.evaluate(async () => { await App.ir('inicio'); await new Promise(r => setTimeout(r, 800)); return document.querySelector('.vdia').textContent; });
  checar(vd2.includes('ONBV'), 'Início: versículo do dia na tradução escolhida');
  await p.evaluate(() => App.salvarConfig({ traducao: 'blivre' })); await p.waitForTimeout(300);

  // ---------------------------------------------------------------- Explorar
  await p.evaluate(() => App.ir('inicio')); await p.waitForSelector('.explorar .atalho');
  checar(await p.locator('.explorar .atalho').count() === 3, 'Início: seção Explorar com assistente, quiz e mural');
  checar(await p.locator('.saudacao h1').count() === 1 && await p.locator('.continue .cont-card').count() === 2, 'Início: saudação e Continue (leitura e plano com progresso)');
  checar(await p.locator('.devo-card').count() === 1 && await p.locator('.estudio-card canvas').count() === 1, 'Início: devocional e estúdio com prévia do versículo de hoje');
  checar(await p.locator('.descubra-card img').count() === 7 && await p.locator('.jornada2 .kpis .kpi').count() === 6 && await p.locator('.jornada2 .grafico .coluna').count() === 7, 'Início: Descubra mais com imagens e resumo de Minha jornada');
  // Minha jornada: só conta o que foi concluído
  const lidosAntes = await p.evaluate(() => Object.keys((Dados.obter('leitura', 'capitulos') || {}).lidos || {}).length);
  checar(lidosAntes >= 1 && +(await p.textContent('#kpi-capitulos b')).replace(/\D/g, '') === lidosAntes, 'Jornada: capítulos lidos vêm das marcações reais');
  await p.evaluate(() => App.abrirBiblia('PHP', 4)); await p.waitForSelector('button:has-text("Marcar capítulo como lido")'); await p.waitForTimeout(300);
  await p.evaluate(() => App.ir('jornada')); await p.waitForSelector('#p-capitulos');
  const capsJ = async () => +(await p.textContent('#p-capitulos b')).replace(/\D/g, '');
  const c0 = await capsJ();
  checar(c0 === lidosAntes, 'Jornada: abrir um capítulo não conta como lido');
  await p.evaluate(() => App.abrirBiblia('PHP', 4)); await p.click('button:has-text("Marcar capítulo como lido")'); await p.waitForTimeout(200);
  await p.click('button:has-text("Capítulo lido")'); await p.waitForTimeout(200);              // desmarca
  await p.click('button:has-text("Marcar capítulo como lido")'); await p.waitForTimeout(200);   // marca de novo
  await p.evaluate(() => App.ir('jornada')); await p.waitForSelector('#p-capitulos');
  checar(await capsJ() === c0 + 1, 'Jornada: marcar, desmarcar e marcar de novo conta uma vez');
  checar(await p.evaluate(() => A2Jornada.eventos({ historico: Dados.todos('historico'), lidos: Dados.obter('leitura', 'capitulos').lidos }).filter(e => e.chave === 'PHP.4').length) === 1, 'Jornada: sem registro duplicado');
  checar(await p.locator('.j-periodos .chip').count() === 4 && await p.locator('.j-tempo .j-item').count() >= 1, 'Jornada: filtros de período e histórico de atividades');
  await p.click('.j-periodos .chip:has-text("90 dias")'); await p.waitForSelector('.grafico .coluna');
  checar(await p.locator('.grafico .coluna').count() >= 13, 'Jornada: evolução por semana em 90 dias');
  await p.click('.j-periodos .chip:has-text("Todo o período")'); await p.click('.chip:has-text("Todas as atividades")'); await p.waitForTimeout(200);
  checar(await p.locator('.legenda span').count() === 5 && !!(await p.$('#j-proxima')), 'Jornada: todas as atividades e próxima leitura');
  await p.screenshot({ path: '/tmp/shots/4f-jornada.png', fullPage: true });
  await p.click('.j-tempo .j-item:has-text("Filipenses 4")'); await p.waitForTimeout(500);
  checar((await p.textContent('.seletor-cap')).includes('Filipenses 4'), 'Jornada: item do histórico abre o capítulo');
  await p.evaluate(() => App.ir('perfil')); await p.waitForSelector('#ver-jornada');
  checar(await p.locator('.jornada2 .kpis .kpi').count() === 6, 'Perfil: resumo de Minha jornada e acesso ao painel');
  checar(await p.locator('.perfil-hero .perfil-foto').count() === 1 && await p.locator('.caminhada .acesso-card').count() === 6, 'Perfil: destaque com foto e seis atalhos da caminhada');
  checar(await p.evaluate(() => { var r = getComputedStyle(document.documentElement); return r.getPropertyValue('--azul').trim().toUpperCase() === '#192D50' && r.getPropertyValue('--ouro').trim().toUpperCase() === '#A58A57' && r.getPropertyValue('--areia').trim().toUpperCase() === '#F4F0E5'; }), 'Paleta oficial nas variáveis base');
  checar(await p.evaluate(() => { var a = document.querySelector('.abas'); return !!a && !!a.querySelector('[data-aba="criar"]'); }), 'Perfil: navegação flutuante com Criar no centro');
  await p.click('#editar-perfil'); await p.waitForSelector('#perfil-nome'); await p.fill('#perfil-nome', 'Cadu F.'); await p.click('.folha button[type=submit]'); await p.waitForTimeout(400);
  checar((await p.textContent('#perfil-nome-txt')) === 'Cadu F.', 'Perfil: editar nome');
  await p.click('#editar-perfil'); await p.waitForSelector('#perfil-nome'); await p.fill('#perfil-nome', 'Cadu'); await p.click('.folha button[type=submit]'); await p.waitForTimeout(400);
  await p.evaluate(() => App.ir('inicio')); await p.waitForSelector('.explorar .atalho');
  checar(await p.locator('.vdia .acoes-ico .bt-ico').count() === 4 && (await p.textContent('.vdia')).includes('Anteriores'), 'Início: cartão do Versículo do Dia preservado');
  await p.click('.descubra-card:has-text("Tema da semana")'); await p.waitForSelector('.folha .lista .item'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  checar(true, 'Descubra mais: tema da semana abre as passagens');
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
  await p.click('.v[data-v="1"]'); await p.waitForSelector('.painel-estudo');
  checar(await p.evaluate(() => document.body.classList.contains('selecionando') && getComputedStyle(document.querySelector('.abas')).pointerEvents === 'none'), 'Leitor: seleção esconde a navegação flutuante');
  checar((await p.textContent('.painel-estudo .acoes')).includes('Favoritar') && (await p.textContent('.painel-estudo .acoes')).includes('Criar arte'), 'Leitor: ações favoritar/anotar/destacar/criar arte');
  await p.click('.painel-estudo .acoes button:has-text("Destacar")');
  checar(await p.locator('.painel-estudo .cores-inline .cor-bolinha').count() > 0, 'Leitor: “Destacar” mostra cores no próprio painel');
  await p.click('.ev-aba[data-aba="palavras"]'); await p.waitForSelector('.painel-estudo .inter-pal', { timeout: 15000 });
  checar((await p.textContent('.painel-estudo')).includes('ικαιωθέντες'), 'Estudo do versículo: “Palavras” mostra o grego da seleção');
  checar(await p.getAttribute('.painel-estudo', 'data-estado') === 'aberto', 'Estudo do versículo: abrir aba expande o painel');
  await p.click('.ev-aba[data-aba="contexto"]'); await p.waitForSelector('.painel-estudo .ev-area .alvo', { timeout: 10000 });
  checar((await p.textContent('.painel-estudo .ev-area')).length > 80, 'Estudo do versículo: “Contexto” mostra versos ao redor');
  await p.click('.ev-aba[data-aba="referencias"]'); await p.waitForTimeout(800);
  checar(await p.locator('.painel-estudo .ev-area').count() === 1, 'Estudo do versículo: “Referências” renderiza');
  await p.click('.ev-aba[data-aba="interpretacao"]'); await p.waitForSelector('.painel-estudo .ev-aviso', { timeout: 10000 });
  checar(true, 'Estudo do versículo: “Interpretação” com aviso de neutralidade');
  await p.click('.painel-estudo .topo .bt-ico'); await p.waitForTimeout(200);
  checar(await p.locator('.painel-estudo').count() === 0 && !(await p.evaluate(() => document.body.classList.contains('selecionando'))), 'Estudo do versículo: fechar limpa a seleção');
  await p.evaluate(() => App.ir('assistente')); await p.waitForSelector('#assist-q');
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
  await p.click('.v[data-v="28"]'); await p.waitForSelector('.ev-assistente'); await p.click('.ev-assistente');
  await p.waitForSelector('.estudo-topo', { timeout: 10000 });
  checar((await p.textContent('.estudo-topo')).includes('Romanos 8:28'), 'Estudo do versículo: enviar ao Assistente Bíblico');

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

  // ---------- Biblioteca › Livros e Artigos (acervo)
  await p.evaluate(() => { App.estado.secaoBiblioteca = 'todos'; App.ir('biblioteca'); }); await p.waitForSelector('.cats-bib [data-cat="acervo"]');
  await p.click('.cats-bib [data-cat="acervo"]'); await p.waitForSelector('.obra-card', { timeout: 10000 });
  const nObras = await p.locator('.obra-card').count();
  checar(nObras === 18 && !(await p.$('.obra-card[data-obra="didaque"]')), 'Acervo: 18 publicações; traduções em revisão não aparecem para o leitor');
  checar(await p.locator('.subcats-acervo .chip').count() === 9 && !(await p.$('#acervo-admin')), 'Acervo: oito subcategorias e sem administração para leitor');
  await p.click('.subcats-acervo [data-subcat="pais"]'); await p.waitForTimeout(150);
  const pais = await p.$$eval('.obra-card', els => els.map(e => e.dataset.obra));
  checar(pais.includes('confissoes-agostinho') && pais.includes('encarnacao-atanasio') && !pais.includes('galatas-lutero'), 'Acervo: subcategoria Pais da Igreja');
  await p.click('.subcats-acervo [data-subcat="todas"]'); await p.selectOption('#acervo-idioma', 'pt'); await p.waitForTimeout(150);
  checar((await p.$$eval('.obra-card .obra-tipo', els => els.every(e => /Português/.test(e.textContent)))) && await p.locator('.obra-card').count() >= 8, 'Acervo: filtro de idioma (português)');
  await p.selectOption('#acervo-idioma', ''); await p.selectOption('#acervo-acesso', 'app'); await p.waitForTimeout(150);
  checar(await p.locator('.obra-card .selo-obra.fonte').count() === 0 && await p.locator('.obra-card').count() === 8, 'Acervo: filtro “Ler no app”');
  await p.selectOption('#acervo-acesso', '');
  // ficha com identificação completa
  await p.click('.obra-card[data-obra="artigo-jesus-historico"]'); await p.waitForSelector('.ficha-obra'); await p.waitForTimeout(250);
  const ficha = await p.textContent('.ficha-obra');
  checar(['Licença', 'CC BY 4.0', 'Fonte original', 'Tradição teológica', 'Procedência', 'Verificação', 'Como citar', 'JOSÉ ARMANDO VICENTE'].every(t => ficha.includes(t)), 'Acervo: ficha com autor, fonte, licença, procedência e citação');
  checar((await p.getAttribute('#obra-fonte', 'href')).startsWith('https://doi.org/') && (await p.getAttribute('#obra-fonte', 'target')) === '_blank', 'Acervo: material com direitos reservados só com link para a publicação original');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // favoritar, lista de leitura e coleção usando os sistemas existentes
  await p.click('.obra-card[data-obra="confissoes-agostinho"]'); await p.waitForSelector('#obra-fav'); await p.waitForTimeout(250);
  await p.click('#obra-fav'); await p.click('#obra-lista');
  checar(await p.evaluate(() => { const f = Dados.obter('favoritos', 'obra-confissoes-agostinho'); return !!f && f.tipo === 'obra' && Dados.obter('leituraObras', 'confissoes-agostinho').lista === true; }), 'Acervo: favorito na coleção de favoritos e lista de leitura');
  await p.evaluate(() => Dados.salvar('colecoes', 'col-leituras', { nome: 'Leituras da fé', itens: [], criadoEm: new Date().toISOString() }));
  await p.click('#obra-colecao'); await p.waitForSelector('#ec-col-leituras'); await p.click('label[for="ec-col-leituras"]'); await p.waitForTimeout(150);
  checar(await p.evaluate(() => Dados.obter('colecoes', 'col-leituras').itens.some(i => i.tipo === 'obra' && i.id === 'confissoes-agostinho')), 'Acervo: livro adicionado a uma coleção existente');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // leitura no app: começa no texto, destaque, anotação e progresso
  await p.evaluate(() => Telas.acervo.abrirLeitura('confissoes-agostinho')); await p.waitForSelector('.obra-par', { timeout: 15000 });
  checar((await p.textContent('.obra-sec-cab h1')) === 'Livro I' && (await p.textContent('.aviso-idioma')).includes('inglês'), 'Leitor de livros: começa no Livro I, com aviso do idioma');
  checar(await p.getAttribute('a[data-aba="biblioteca"]', 'aria-current') === 'page', 'Leitor de livros: navegação marca a Biblioteca');
  await p.click('.obra-par[data-p="0"]'); await p.waitForSelector('.painel-obra');
  checar(await p.evaluate(() => document.body.classList.contains('selecionando')), 'Leitor de livros: painel de ações no padrão do leitor da Bíblia');
  await p.click('#obra-destacar'); await p.click('.painel-obra .cor-bolinha[aria-label="Verde"]'); await p.waitForTimeout(150);
  checar(await p.locator('.obra-par[data-p="0"].d-verde').count() === 1 && await p.evaluate(() => Dados.obter('destaques', 'obra-confissoes-agostinho-1-0').cor === 'verde'), 'Leitor de livros: trecho destacado no sistema de destaques');
  await p.click('.obra-par[data-p="1"]'); await p.click('#obra-anotar'); await p.waitForSelector('#nota-txt');
  checar((await p.textContent('.nota-obra')).includes('Confissões'), 'Leitor de livros: anotação mostra o trecho do livro');
  await p.fill('#nota-txt', 'Inquieto é o coração até descansar em Deus.'); await p.click('.folha button[type=submit]'); await p.waitForTimeout(200);
  checar(await p.evaluate(() => Dados.todos('notas').some(n => n.obra && n.obra.id === 'confissoes-agostinho' && n.obra.par === 1)), 'Leitor de livros: anotação salva no sistema de anotações');
  await p.click('#obra-proxima'); await p.waitForTimeout(300);
  checar((await p.textContent('.obra-sec-cab h1')) === 'Livro II', 'Leitor de livros: próxima seção');
  await p.click('#obra-sumario'); await p.waitForSelector('.sumario-obra'); checar(await p.locator('.sumario-obra .item').count() === 14, 'Leitor de livros: sumário'); await p.keyboard.press('Escape');
  await p.click('#obra-voltar'); await p.waitForSelector('.obra-card');
  checar((await p.textContent('.tela')).includes('Continue lendo') && (await p.textContent('#lista-leitura')).includes('Confissões'), 'Acervo: continue lendo e minha lista de leitura');
  const prog = await p.evaluate(() => Dados.obter('leituraObras', 'confissoes-agostinho'));
  checar(prog.secao === 2 && prog.secoesVistas && prog.secoesVistas['1'] && prog.total === 14, 'Acervo: progresso guardado (continuar de onde parou)');
  // referências bíblicas do texto em inglês abrem a Bíblia
  await p.evaluate(() => Telas.acervo.abrirLeitura('imitacao-de-cristo', { secao: 0 })); await p.waitForSelector('.obra-par .ref-obra', { timeout: 15000 });
  await p.click('.obra-par .ref-obra >> nth=0'); await p.waitForSelector('.v', { timeout: 10000 });
  checar((await p.textContent('.seletor-cap')).includes('João 8'), 'Leitor de livros: referência “John viii. 12” abre João 8');
  // integração com a Biblioteca: favoritos, anotações, destaques e pesquisa
  await p.evaluate(() => { App.estado.secaoBiblioteca = 'favoritos'; App.ir('biblioteca'); }); await p.waitForTimeout(400);
  checar((await p.textContent('.bib-area')).includes('Livros e artigos favoritos') && (await p.textContent('.bib-area')).includes('Confissões'), 'Biblioteca: livro favoritado aparece nos favoritos');
  await p.evaluate(() => { App.estado.secaoBiblioteca = 'notas'; App.recarregar(); }); await p.waitForTimeout(300);
  checar((await p.textContent('.bib-area')).includes('Anotação em Confissões'), 'Biblioteca: anotação do livro nas Anotações');
  await p.evaluate(() => { App.estado.secaoBiblioteca = 'destaques'; App.recarregar(); }); await p.waitForTimeout(400);
  checar(await p.locator('.destaque-obra').count() === 1, 'Biblioteca: destaque do livro nos Destaques');
  await p.evaluate(() => { App.estado.secaoBiblioteca = 'todos'; App.recarregar(); }); await p.waitForTimeout(300);
  checar(await p.locator('#acervo-destaques .obra-mini').count() >= 4, 'Biblioteca: bloco “Livros e artigos” em Todos');
  await p.evaluate(() => { App.estado.bibBuscaTipo = ''; }); await p.fill('#bib-busca', 'eusébio');
  const achouObra = await p.waitForFunction(() => document.querySelector('.bib-area') && document.querySelector('.bib-area').textContent.includes('História eclesiástica'), null, { timeout: 8000 }).then(() => true, () => false);
  if (!achouObra) console.log('   busca:', (await p.textContent('.bib-area')).slice(0, 300));
  checar(achouObra, 'Biblioteca: a pesquisa encontra livros e artigos');
  await p.fill('#bib-busca', ''); await p.waitForTimeout(300);
  // Assistente Bíblico sem IA: referência bibliográfica e modo guia
  await p.evaluate(() => { window.__sample = null; });
  await p.evaluate(() => Telas.acervo.estudar(Telas.acervo.porId('encarnacao-atanasio'), null)); await p.waitForSelector('#assist-obra-ia');
  checar((await p.textContent('.estudo-obra')).includes('Referência bibliográfica'), 'Assistente: obra com link vai como referência bibliográfica');
  await p.click('#assist-obra-ia'); await p.waitForTimeout(300);
  checar((await p.textContent('.estudo-obra')).includes('Modo Bereano'), 'Assistente: sem IA, oferece o modo guia');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  checar(await p.evaluate(() => A2Biblioteca.favVersiculos(Dados.todos('favoritos')).length === Dados.todos('favoritos').length - 1), 'Contagem de versículos favoritos não inclui livros');

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
