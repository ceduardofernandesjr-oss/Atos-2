/* ATOS 2 — Criar: estúdio de artes bíblicas, galeria de artes prontas e artes salvas.
   Regra central: a IA só cria o FUNDO. O texto bíblico é composto pelo editor a partir da tradução,
   sem nenhuma alteração de palavras. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;

  var FONTES = [['Cormorant Garamond', 600, 'Cormorant'], ['Playfair Display', 500, 'Playfair'], ['Literata', 400, 'Literata'],
    ['Manrope', 600, 'Manrope'], ['Josefin Sans', 300, 'Josefin'], ['Great Vibes', 400, 'Caligrafia']];
  var CORES = ['#FFFFFF', '#F6F1E7', '#F1DDB3', '#C7A56B', '#14284B', '#1A2133', '#2F6B4F', '#7A2E1F'];
  // Fundos: só as fotos da biblioteca (Pixabay, enviadas pelo responsável do app).
  var FONTES_MODELO = ['Cormorant Garamond', 'Playfair Display', 'Literata', 'Cormorant Garamond', 'Josefin Sans', 'Playfair Display', 'Manrope'];
  function modeloFoto(ft, i, formato) {
    var pc = formato === 'papel-pc', cel = formato === 'papel-celular', fonte = FONTES_MODELO[i % FONTES_MODELO.length];
    var y = cel ? Math.min(0.8, Math.max(0.42, ft.y || 0.56)) : (ft.y || (pc ? 0.45 : 0.47));
    return { id: (cel ? 'pc-' : pc ? 'pp-' : 'f-') + ft.id, nome: ft.nome + (cel ? ' · celular' : pc ? ' · computador' : ''), formato: formato || null, papel: !!(cel || pc),
      fundo: { tipo: 'banco', id: ft.id }, escurecer: ft.escurecer,
      estilo: { fonte: fonte, cor: ft.cor, alinhar: 'center', sombra: ft.cor === '#FFFFFF', maiusculas: fonte === 'Josefin Sans', entrelinha: fonte === 'Josefin Sans' ? 1.45 : 1.3, largura: pc ? 0.56 : 0.8 },
      pos: { x: 0.5, y: y } };
  }
  var MODELOS = A2Fotos.LISTA.map(function (ft, i) { return modeloFoto(ft, i); });
  var PAPEIS = A2Fotos.LISTA.map(function (ft, i) { return modeloFoto(ft, i, 'papel-celular'); })
    .concat(['aurora-boreal', 'pier', 'fiorde', 'lago-outono', 'leao', 'caminho-outono'].map(function (id, i) { return modeloFoto(A2Fotos.POR_ID[id], i, 'papel-pc'); }));
  var FUNDO_PADRAO = { tipo: 'banco', id: 'pier' };
  MODELOS = MODELOS.concat(PAPEIS);

  function specPadrao() {
    return { formato: 'feed', conteudo: { tipo: 'versiculo', ref: 'At 2:42', versao: Biblia.padrao(), texto: '' },
      fundo: { tipo: 'banco', id: 'pier' }, escurecer: 0.25,
      estilo: { fonte: 'Cormorant Garamond', cor: '#FFFFFF', tamanho: 0, alinhar: 'center', maiusculas: false, sombra: true, aspas: true, largura: 0.8, entrelinha: 1.3 },
      pos: { x: 0.5, y: 0.47 }, referencia: { mostrar: true }, assinatura: { texto: '', mostrar: false }, marca: false };
  }
  function mesclarModelo(spec, m) {
    var s = JSON.parse(JSON.stringify(spec));
    if (m.fundo) s.fundo = JSON.parse(JSON.stringify(m.fundo));
    if (m.escurecer != null) s.escurecer = m.escurecer;
    s.estilo = Object.assign({}, specPadrao().estilo, m.estilo || {});
    s.pos = Object.assign({}, specPadrao().pos, m.pos || {});
    if (m.assinatura) s.assinatura = Object.assign({}, m.assinatura);
    if (m.formato) s.formato = m.formato;
    return s;
  }
  function formato(id) { return A2Arte.FORMATOS.filter(function (f) { return f.id === id; })[0] || A2Arte.FORMATOS[0]; }

  // ---------------------------------------------------------------- recursos (fotos e fontes)
  var imagens = {};
  function carregarImagem(chave, src) {
    if (imagens[chave]) return imagens[chave];
    imagens[chave] = new Promise(function (res) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; });
    return imagens[chave];
  }
  async function imagemDoFundo(f, F, larguraPx) {
    if (f.tipo === 'ia') return carregarImagem('s:' + f.svg.length + ':' + f.svg.slice(0, 80) + f.svg.slice(-80), URL.createObjectURL(new Blob([f.svg], { type: 'image/svg+xml' })));
    var arq = A2Fotos.arquivo(f.id, F.w, F.h, larguraPx) || A2Fotos.arquivo(FUNDO_PADRAO.id, F.w, F.h, larguraPx);
    return carregarImagem('b:' + arq, arq);
  }
  var fontesProntas = {};
  function garantirFonte(fam, peso) {
    var k = peso + ' ' + fam;
    if (!fontesProntas[k]) fontesProntas[k] = Promise.race([document.fonts ? document.fonts.load(peso + ' 40px "' + fam + '"') : Promise.resolve(), new Promise(function (r) { setTimeout(r, 2500); })]);
    return fontesProntas[k];
  }
  function pesoDe(fam) { var f = FONTES.filter(function (x) { return x[0] === fam; })[0]; return f ? f[1] : 500; }

  // Texto da arte: versículo da tradução (exato) ou texto livre do usuário
  async function textoDaArte(spec) {
    var c = spec.conteudo;
    if (c.tipo === 'livre') return { texto: c.texto || '', ref: c.legenda || '' };
    var r = await Biblia.textoDeString(c.ref, c.versao || 'blivre');
    return { texto: A2Arte.textoParaArte(r.versos.map(function (x) { return x.t; })), ref: A2Ref.formatar(r.ref) + ' · ' + Biblia.versao(c.versao || 'blivre').sigla, refObj: r.ref };
  }

  // ---------------------------------------------------------------- desenho
  function fundoDe(spec) {
    var f = spec.fundo || {};
    if (f.tipo === 'ia' && f.svg) return f;
    return f.tipo === 'banco' && A2Fotos.POR_ID[f.id] ? f : FUNDO_PADRAO;
  }
  async function desenharArte(canvas, spec, larguraAlvo) {
    var F = formato(spec.formato), esc = larguraAlvo / F.w;
    canvas.width = Math.round(F.w * esc); canvas.height = Math.round(F.h * esc);
    var ctx = canvas.getContext('2d'), W = F.w, H = F.h, u = (F.base || W) / 1080;
    var est = Object.assign({}, specPadrao().estilo, spec.estilo), peso = pesoDe(est.fonte);
    var conteudo, img;
    try { conteudo = await textoDaArte(spec); } catch (e) { conteudo = { texto: 'Referência inválida: ' + e.message, ref: '' }; }
    await Promise.all([garantirFonte(est.fonte, peso), garantirFonte('Manrope', 600), (async function () { img = await imagemDoFundo(fundoDe(spec), F, larguraAlvo); })()]);
    ctx.setTransform(esc, 0, 0, esc, 0, 0);
    // fundo
    if (img) {
      var s = Math.max(W / img.width, H / img.height), iw = img.width * s, ih = img.height * s;
      ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
    } else {
      ctx.fillStyle = '#2B3550'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = '600 ' + (28 * u) + 'px Manrope'; ctx.textAlign = 'center';
      ctx.fillText('Sem conexão: a foto do fundo não carregou', W / 2, 70 * u);
    }
    if (spec.escurecer > 0) { ctx.fillStyle = 'rgba(0,0,0,' + spec.escurecer + ')'; ctx.fillRect(0, 0, W, H); }

    // texto
    var corpo = est.maiusculas ? conteudo.texto.toLocaleUpperCase('pt-BR') : conteudo.texto;
    if (est.aspas && spec.conteudo.tipo !== 'livre' && corpo && !/[“”"]/.test(corpo)) corpo = '“' + corpo + '”';   // o versículo já com fala citada não ganha aspas extras
    var celular = spec.formato === 'papel-celular';   // fora da área do relógio (topo) e dos atalhos (rodapé)
    var caixa = { w: W * est.largura, h: H * (spec.formato === 'facebook' ? 0.62 : celular ? 0.48 : 0.6) };
    var medirCom = function (t) { ctx.font = peso + ' ' + t + 'px "' + est.fonte + '"'; return function (s) { return ctx.measureText(s).width; }; };
    var ent = est.entrelinha || 1.3, layout;
    if (est.tamanho > 0) { var tam = est.tamanho * u; layout = { tamanho: tam, linhas: A2Arte.quebrar(corpo, caixa.w, medirCom(tam)) }; layout.altura = layout.linhas.length * tam * ent; }
    else layout = A2Arte.ajustar(corpo, caixa, medirCom, { min: 22 * u, max: (spec.formato === 'stories' || spec.formato === 'papel-celular' ? 104 : 92) * u, entrelinha: ent });
    var mostrarRef = spec.referencia && spec.referencia.mostrar && conteudo.ref;
    var refTam = Math.max(22 * u, Math.min(34 * u, layout.tamanho * 0.42)), gap = layout.tamanho * 0.75;
    var alturaBloco = layout.altura + (mostrarRef ? gap + refTam : 0);
    var cx = spec.pos.x * W, cy = spec.pos.y * H;
    var lim0 = celular ? H * 0.31 : 40 * u, lim1 = celular ? H * 0.86 : H - 40 * u;
    var topo = Math.max(lim0, Math.min(lim1 - alturaBloco, cy - alturaBloco / 2));
    var x0 = Math.max(30 * u, Math.min(W - caixa.w - 30 * u, cx - caixa.w / 2));
    var xTexto = est.alinhar === 'left' ? x0 : est.alinhar === 'right' ? x0 + caixa.w : x0 + caixa.w / 2;
    ctx.textAlign = est.alinhar; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = est.cor;
    if (est.sombra) { ctx.shadowColor = 'rgba(0,0,0,.38)'; ctx.shadowBlur = 18 * u; ctx.shadowOffsetY = 2 * u; }
    ctx.font = peso + ' ' + layout.tamanho + 'px "' + est.fonte + '"';
    layout.linhas.forEach(function (l, i) { ctx.fillText(l, xTexto, topo + layout.tamanho * (0.95 + i * ent)); });
    if (mostrarRef) {
      ctx.font = '600 ' + refTam + 'px Manrope';
      try { ctx.letterSpacing = (refTam * 0.12) + 'px'; } catch (e) {}
      ctx.globalAlpha = 0.92; ctx.fillText(conteudo.ref.toLocaleUpperCase('pt-BR'), xTexto, topo + layout.altura + gap + refTam * 0.8);
      ctx.globalAlpha = 1; try { ctx.letterSpacing = '0px'; } catch (e) {}
    }
    ctx.shadowColor = 'transparent';
    if (spec.assinatura && spec.assinatura.mostrar && spec.assinatura.texto) {
      ctx.font = '500 ' + (26 * u) + 'px Manrope'; ctx.textAlign = 'center'; ctx.globalAlpha = 0.85; ctx.fillStyle = est.cor;
      ctx.fillText(spec.assinatura.texto, W / 2, H - 56 * u); ctx.globalAlpha = 1;
    }
    if (spec.marca) { ctx.font = '700 ' + (22 * u) + 'px "Cormorant Garamond"'; ctx.textAlign = 'right'; ctx.globalAlpha = 0.7; ctx.fillStyle = est.cor; try { ctx.letterSpacing = (4 * u) + 'px'; } catch (e) {} ctx.fillText('ATOS 2', W - 40 * u, H - 34 * u); ctx.globalAlpha = 1; try { ctx.letterSpacing = '0px'; } catch (e) {} }
    return { bloco: { x: x0 * esc, y: topo * esc, w: caixa.w * esc, h: alturaBloco * esc }, conteudo: conteudo };
  }

  // ---------------------------------------------------------------- exportação
  async function gerarPng(spec) {
    var c = document.createElement('canvas'); await desenharArte(c, spec, formato(spec.formato).w);
    return new Promise(function (r) { c.toBlob(r, 'image/png'); });
  }
  function nomeArquivo(spec, conteudo) { return 'atos2-' + (conteudo && conteudo.refObj ? A2Ref.formatar(conteudo.refObj) : 'arte').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-' + spec.formato + '.png'; }
  // Licença do Pixabay: a foto não pode sair sozinha, sem nenhum elemento criativo por cima.
  function fotoSemTexto(spec) {
    if (fundoDe(spec).tipo !== 'banco') return false;
    return spec.conteudo.tipo === 'livre' && !String(spec.conteudo.texto || '').trim();
  }
  function avisarFotoSemTexto() { UI.aviso('Escreva um texto ou escolha um versículo: as fotos da biblioteca só podem sair com texto por cima.', true); }
  async function baixar(spec) {
    if (fotoSemTexto(spec)) { avisarFotoSemTexto(); return; }
    UI.aviso('Gerando a imagem…');
    var blob = await gerarPng(spec), cont = await textoDaArte(spec).catch(function () { return null; }), nome = nomeArquivo(spec, cont);
    return salvarImagem(blob, nome, cont && cont.ref);
  }
  // Salva um PNG: pelo download do claude.ai, pelo navegador ou, em último caso, mostrando a imagem.
  async function salvarImagem(blob, nome, ref) {
    var dl = root.claude && root.claude.use ? await root.claude.use('downloads') : null;
    if (dl) {
      try { await dl.save({ filename: nome, data: blob }); UI.aviso('Imagem salva.'); App.registrar('arte', { titulo: 'Arte exportada', ref: ref }); return; }
      catch (e) { if (e && e.code === 'declined') return; }
    } else {
      try { var a = h('a', { href: URL.createObjectURL(blob), download: nome }); document.body.appendChild(a); a.click(); a.remove(); }
      catch (e) { /* segue para a visualização */ }
    }
    var url = URL.createObjectURL(blob);
    UI.folha('Salvar imagem', h('div.form', h('p.sub', 'Se o download não começou, toque e segure a imagem para salvar na galeria do aparelho.'), h('img', { src: url, alt: 'Arte gerada', style: { width: '100%', borderRadius: '12px' } })));
  }
  async function compartilharArte(spec) {
    if (fotoSemTexto(spec)) { avisarFotoSemTexto(); return; }
    var cont = await textoDaArte(spec).catch(function () { return null; });
    try {
      var blob = await gerarPng(spec), arq = new File([blob], nomeArquivo(spec, cont), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [arq] })) { await navigator.share({ files: [arq], text: cont ? cont.ref : '' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    var texto = cont ? (spec.conteudo.tipo === 'livre' ? cont.texto : '“' + cont.texto + '”\n— ' + cont.ref) : '';
    UI.aviso('Neste ambiente, baixe a imagem e compartilhe pela galeria. O texto pode ser enviado agora.');
    App.compartilhar(texto, 'Compartilhar');
  }
  // Compartilha um PNG pelo menu do aparelho; sem suporte, oferece o texto.
  async function compartilharImagem(blob, nome, texto) {
    try {
      var arq = new File([blob], nome, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [arq] })) { await navigator.share({ files: [arq] }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    UI.aviso('Neste ambiente, baixe a imagem e compartilhe pela galeria. O texto pode ser enviado agora.');
    if (texto) App.compartilhar(texto, 'Compartilhar');
  }
  async function miniatura(spec) {
    var c = document.createElement('canvas'); await desenharArte(c, spec, 240);
    return c.toDataURL('image/jpeg', 0.78);
  }

  // ---------------------------------------------------------------- tela
  var arte = null, idArte = null, painel = 'texto', ultimoBloco = null, canvasEl = null, pendente = false;

  function render(tela) {
    if (App.estado.arteNova) { arte = App.estado.arteNova; idArte = App.estado.arteNovaId || null; App.estado.arteNova = null; App.estado.arteNovaId = null; App.estado.secaoCriar = 'estudio'; }
    if (!arte) { var rasc = Dados.obter('_rascunhoArte', 'atual'); arte = rasc ? rasc.spec : specPadrao(); idArte = rasc ? rasc.idArte : null; }
    var secao = App.estado.secaoCriar || 'estudio';
    tela.appendChild(h('header.cab', h('h1', 'Criar'), h('div.esp')));
    tela.appendChild(h('div.chips', [['estudio', 'Estúdio'], ['galeria', 'Galeria'], ['minhas', 'Minhas artes']].map(function (s) {
      return h('button.chip', { 'aria-pressed': String(s[0] === secao), on: { click: function () { App.estado.secaoCriar = s[0]; App.recarregar(); } } }, s[1]);
    })));
    var area = h('div', { style: { marginTop: '10px' } }); tela.appendChild(area);
    if (secao === 'galeria') galeria(area); else if (secao === 'minhas') minhas(area); else estudio(area);
  }

  function estudio(area) {
    canvasEl = h('canvas', { 'aria-label': 'Prévia da arte. Arraste o texto para posicionar.', role: 'img' });
    var palco = h('div.palco', canvasEl, h('span.dica', 'Arraste o texto para mover'));
    var acoes = h('div.linha-bts',
      h('button.bt.peq', { on: { click: function () { arte = specPadrao(); idArte = null; App.recarregar(); } } }, ico('mais'), 'Nova'),
      h('button.bt.peq', { on: { click: escolherModelo } }, ico('colecao'), 'Modelos'),
      h('button.bt.peq.pri', { on: { click: salvarArte } }, ico('ok'), idArte ? 'Salvar alterações' : 'Salvar'),
      h('button.bt.peq', { on: { click: function () { baixar(arte); } } }, ico('baixar'), 'Baixar PNG'),
      h('button.bt.peq', { on: { click: function () { compartilharArte(arte); } } }, ico('compartilhar'), 'Compartilhar'),
      idArte ? h('button.bt.peq', { on: { click: function () { idArte = null; salvarArte(); } } }, ico('duplicar'), 'Duplicar') : null,
      h('button.bt.peq', { on: { click: salvarModelo } }, ico('estrela'), 'Salvar como modelo'));
    var abas = h('div.chips', [['texto', 'Texto'], ['fundo', 'Fundo'], ['estilo', 'Estilo'], ['formato', 'Formato'], ['assinatura', 'Assinatura']].map(function (p) {
      return h('button.chip', { 'aria-pressed': String(p[0] === painel), on: { click: function (e) { painel = p[0]; e.target.parentNode.querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b === e.target)); }); montarPainel(); } } }, p[1]);
    }));
    var caixaPainel = h('div.painel');
    area.appendChild(h('div.estudio', palco, acoes, abas, caixaPainel));
    function montarPainel() { caixaPainel.replaceChildren(PAINEIS[painel]()); }
    montarPainel();
    redesenhar();
    arrastar(canvasEl);
  }

  function redesenhar(salvarRascunho) {
    if (!canvasEl) return;
    if (pendente) return; pendente = true;
    requestAnimationFrame(async function () {
      pendente = false;
      var largura = Math.min(720, Math.max(320, (canvasEl.parentNode ? canvasEl.parentNode.clientWidth - 28 : 540))) * (window.devicePixelRatio > 1 ? 1.5 : 1);
      var r = await desenharArte(canvasEl, arte, largura);
      ultimoBloco = r.bloco;
      if (guias && formato(arte.formato).papel) desenharGuias(canvasEl, arte.formato);
      var F = formato(arte.formato), maxAlt = window.innerHeight * 0.56, larguraCss = Math.min(canvasEl.parentNode ? canvasEl.parentNode.clientWidth - 28 : 540, maxAlt * F.w / F.h);
      canvasEl.style.width = larguraCss + 'px'; canvasEl.style.height = (larguraCss * F.h / F.w) + 'px';
      if (salvarRascunho !== false) Dados.salvar('_rascunhoArte', 'atual', { spec: arte, idArte: idArte });
    });
  }
  function mudar(fn) { fn(arte); redesenhar(); }
  // Só na prévia: onde o relógio e os ícones costumam ficar na tela (não sai na imagem baixada).
  var guias = true;
  function desenharGuias(cv, fmt) {
    var g = cv.getContext('2d'), W = cv.width, H = cv.height, u = Math.min(W, H) / 1080;
    var zonas = fmt === 'papel-celular' ? [[0.06, 0.3, 'Relógio e data'], [0.87, 0.985, 'Atalhos']] : [[0.94, 1, 'Barra de tarefas']];
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    zonas.forEach(function (z) {
      var y0 = H * z[0], y1 = H * z[1], m = 18 * u;
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(m, y0, W - 2 * m, y1 - y0);
      g.setLineDash([10 * u, 8 * u]); g.lineWidth = 2.5 * u; g.strokeStyle = 'rgba(255,255,255,0.75)'; g.strokeRect(m, y0, W - 2 * m, y1 - y0);
      g.setLineDash([]); g.font = '600 ' + (34 * u) + 'px Manrope'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.9)';
      g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 6 * u; g.fillText(z[2], W / 2, (y0 + y1) / 2 + 9 * u); g.shadowBlur = 0;
    });
    g.restore();
  }

  function arrastar(cv) {
    var ativo = false, dx = 0, dy = 0;
    function pt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; }
    cv.addEventListener('pointerdown', function (e) {
      var p = pt(e); ativo = true; cv.setPointerCapture(e.pointerId); cv.classList.add('arrastando');
      dx = arte.pos.x - p.x; dy = arte.pos.y - p.y;
      if (ultimoBloco) { var bx = ultimoBloco.x / cv.width, by = ultimoBloco.y / cv.height, bw = ultimoBloco.w / cv.width, bh = ultimoBloco.h / cv.height; if (!(p.x >= bx && p.x <= bx + bw && p.y >= by && p.y <= by + bh)) { dx = 0; dy = 0; arte.pos = { x: p.x, y: p.y }; redesenhar(false); } }
    });
    cv.addEventListener('pointermove', function (e) { if (!ativo) return; var p = pt(e); arte.pos = { x: Math.max(0.05, Math.min(0.95, p.x + dx)), y: Math.max(0.05, Math.min(0.95, p.y + dy)) }; redesenhar(false); });
    function fim() { if (!ativo) return; ativo = false; cv.classList.remove('arrastando'); redesenhar(); }
    cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim);
    cv.tabIndex = 0;
    cv.addEventListener('keydown', function (e) {
      var d = { ArrowUp: [0, -0.02], ArrowDown: [0, 0.02], ArrowLeft: [-0.02, 0], ArrowRight: [0.02, 0] }[e.key];
      if (d) { e.preventDefault(); mudar(function (a) { a.pos = { x: Math.max(0.05, Math.min(0.95, a.pos.x + d[0])), y: Math.max(0.05, Math.min(0.95, a.pos.y + d[1])) }; }); }
    });
  }

  // ---------------------------------------------------------------- painéis
  var PAINEIS = {
    texto: function () {
      var c = arte.conteudo, wrap = h('div.form');
      wrap.appendChild(h('div.chips', [['versiculo', 'Versículo bíblico'], ['livre', 'Texto livre']].map(function (t) {
        return h('button.chip', { 'aria-pressed': String(c.tipo === t[0]), on: { click: function () { mudar(function (a) { a.conteudo.tipo = t[0]; }); wrap.replaceWith(PAINEIS.texto()); } } }, t[1]);
      })));
      if (c.tipo === 'livre') {
        var ta = h('textarea.entrada#arte-livre', { rows: 4, maxlength: 600, placeholder: 'Escreva sua frase, reflexão ou convite' }); ta.value = c.texto || '';
        var leg = h('input.entrada#arte-leg', { type: 'text', maxlength: 80, placeholder: 'Ex.: Culto de domingo, 19h' }); leg.value = c.legenda || '';
        ta.addEventListener('input', function () { arte.conteudo.texto = ta.value; redesenhar(); });
        leg.addEventListener('input', function () { arte.conteudo.legenda = leg.value; redesenhar(); });
        wrap.appendChild(h('label.campo', { for: 'arte-livre' }, h('span', 'Seu texto'), ta));
        wrap.appendChild(h('label.campo', { for: 'arte-leg' }, h('span', 'Legenda (opcional)'), leg));
        wrap.appendChild(h('div.aviso', ico('info'), h('span', 'Texto livre é seu. Ele não é apresentado como versículo bíblico. Para citar a Bíblia, use “Versículo bíblico”, que traz o texto exato da tradução.')));
      } else {
        var ref = h('input.entrada#arte-ref', { type: 'text', placeholder: 'Ex.: Jo 3:16, Sl 23:1-3, Rm 8:28', autocomplete: 'off' }); ref.value = c.ref || '';
        var erro = h('p.sub', { style: { color: 'var(--perigo)' } }), previa = h('p', { style: { font: '400 16px/1.6 var(--f-leitura)' } });
        function aplicar() {
          var r = Biblia.interpretar(ref.value);
          if (!r.ok || r.ref.v1 == null) { erro.textContent = r.ok ? 'Indique os versículos, por exemplo Sl 23:1-3.' : r.erro; return; }
          var n = A2Ref.versiculosDa(r.ref, Biblia.contagemSinc()).length;
          if (n > 6) { erro.textContent = 'Para caber na arte, escolha até 6 versículos.'; return; }
          erro.textContent = ''; mudar(function (a) { a.conteudo.ref = A2Ref.formatar(r.ref, true); a.conteudo.versao = a.conteudo.versao || Biblia.padrao(); }); mostrarPrevia();
        }
        function mostrarPrevia() { Biblia.textoDeString(arte.conteudo.ref, arte.conteudo.versao).then(function (r) { previa.textContent = r.versos.map(function (x) { return UI.plano(x.t); }).join(' '); }, function (e) { previa.textContent = ''; erro.textContent = e.message; }); }
        ref.addEventListener('change', aplicar);
        wrap.appendChild(h('form', { on: { submit: function (e) { e.preventDefault(); aplicar(); } } },
          h('label.campo', { for: 'arte-ref' }, h('span', 'Referência'), h('div', { style: { display: 'flex', gap: '8px' } }, ref, h('button.bt', { type: 'submit' }, 'Aplicar'))), erro));
        var trad = h('select.entrada#arte-trad', Biblia.VERSOES.map(function (v) { var o = h('option', { value: v.id, disabled: !v.ativa }, v.nome + (v.ativa ? '' : ' (licença pendente)')); if (v.id === (c.versao || 'blivre')) o.selected = true; return o; }));
        trad.addEventListener('change', function () { mudar(function (a) { a.conteudo.versao = trad.value; }); mostrarPrevia(); });
        wrap.appendChild(h('label.campo', { for: 'arte-trad' }, h('span', 'Tradução'), trad));
        wrap.appendChild(h('div.campo', h('span', 'Texto que vai na arte (exato da tradução)'), previa));
        wrap.appendChild(h('button.bt.peq', { on: { click: escolherFavorito } }, ico('coracao'), 'Escolher dos favoritos'));
        mostrarPrevia();
      }
      wrap.appendChild(chave('ref-mostrar', c.tipo === 'livre' ? 'Mostrar legenda' : 'Mostrar referência e tradução', arte.referencia.mostrar, function (v) { mudar(function (a) { a.referencia.mostrar = v; }); }));
      return wrap;
    },
    fundo: function () {
      var wrap = h('div.form'), f = fundoDe(arte), sel = f.tipo === 'ia' ? 'ia' : 'fotos';
      var chips = h('div.chips', [['fotos', 'Fotos'], ['ia', 'Criar com IA']].filter(function (c) { return c[0] !== 'ia' || App.temIA; }).map(function (c) { return h('button.chip', { 'aria-pressed': String(c[0] === sel), on: { click: function () { sel = c[0]; marcarChip(chips, this); mostrar(); } } }, c[1]); }));
      var area = h('div');
      var gf = h('div.fundos.papeis');
      A2Fotos.LISTA.forEach(function (ft) {
        gf.appendChild(h('button', { 'aria-label': ft.nome, title: ft.nome, 'aria-pressed': String(f.id === ft.id), on: { click: function () {
          gf.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); this.setAttribute('aria-pressed', 'true');
          mudar(function (a) { a.fundo = { tipo: 'banco', id: ft.id }; a.estilo.cor = ft.cor; a.escurecer = ft.escurecer; a.estilo.sombra = ft.cor === '#FFFFFF'; if (ft.y) a.pos = { x: 0.5, y: ft.y }; });
          esc.value = ft.escurecer;
        } } }, h('img', { src: 'fundos/fotos/' + ft.id + '-mini.jpg', alt: '', loading: 'lazy', width: 180, height: 320 }), h('small', ft.nome)));
      });
      var esc = h('input#escurecer', { type: 'range', min: 0, max: 0.7, step: 0.05, value: arte.escurecer });
      esc.addEventListener('input', function () { arte.escurecer = +esc.value; redesenhar(); });
      var credito = h('p.sub', A2Fotos.CREDITO + ' A foto sai sempre com o versículo ou o seu texto por cima.');
      function mostrar() { area.replaceChildren(sel === 'ia' ? painelIA() : h('div.form', gf, credito)); }
      wrap.appendChild(chips); wrap.appendChild(area); mostrar();
      wrap.appendChild(h('label.campo', { for: 'escurecer' }, h('span', 'Escurecer o fundo (melhora a leitura)'), esc));
      return wrap;
    },
    estilo: function () {
      var e = arte.estilo, wrap = h('div.form');
      wrap.appendChild(h('div.campo', h('span', 'Fonte'), h('div.fontes', FONTES.map(function (f) {
        return h('button', { style: { fontFamily: '"' + f[0] + '"', fontWeight: f[1] }, 'aria-pressed': String(e.fonte === f[0]), on: { click: function () { marcarChip(this.parentNode, this); mudar(function (a) { a.estilo.fonte = f[0]; }); } } }, f[2]);
      }))));
      var corLivre = h('input#cor-texto', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(e.cor) ? e.cor : '#ffffff', 'aria-label': 'Outra cor' });
      corLivre.addEventListener('input', function () { mudar(function (a) { a.estilo.cor = corLivre.value; }); });
      wrap.appendChild(h('div.campo', h('span', 'Cor do texto'), h('div.amostras', CORES.map(function (c) {
        return h('button.amostra', { style: { background: c }, 'aria-label': 'Cor ' + c, 'aria-pressed': String(e.cor.toLowerCase() === c.toLowerCase()), on: { click: function () { marcarChip(this.parentNode, this); mudar(function (a) { a.estilo.cor = c; }); } } });
      }), corLivre)));
      var auto = e.tamanho === 0, tam = h('input#tam-arte', { type: 'range', min: 24, max: 130, step: 1, value: e.tamanho || 60, disabled: auto });
      tam.addEventListener('input', function () { arte.estilo.tamanho = +tam.value; redesenhar(); });
      wrap.appendChild(chave('tam-auto', 'Tamanho automático (cabe na arte)', auto, function (v) { tam.disabled = v; mudar(function (a) { a.estilo.tamanho = v ? 0 : +tam.value; }); }));
      wrap.appendChild(h('label.campo', { for: 'tam-arte' }, h('span', 'Tamanho do texto'), tam));
      wrap.appendChild(h('div.campo', h('span', 'Alinhamento'), h('div.chips', [['left', 'Esquerda'], ['center', 'Centro'], ['right', 'Direita']].map(function (a) {
        return h('button.chip', { 'aria-pressed': String(e.alinhar === a[0]), on: { click: function () { marcarChip(this.parentNode, this); mudar(function (x) { x.estilo.alinhar = a[0]; }); } } }, a[1]);
      }))));
      var larg = h('input#larg-arte', { type: 'range', min: 0.45, max: 0.92, step: 0.01, value: e.largura });
      larg.addEventListener('input', function () { arte.estilo.largura = +larg.value; redesenhar(); });
      wrap.appendChild(h('label.campo', { for: 'larg-arte' }, h('span', 'Largura da caixa de texto'), larg));
      var entl = h('input#ent-arte', { type: 'range', min: 1.05, max: 1.8, step: 0.05, value: e.entrelinha });
      entl.addEventListener('input', function () { arte.estilo.entrelinha = +entl.value; redesenhar(); });
      wrap.appendChild(h('label.campo', { for: 'ent-arte' }, h('span', 'Espaço entre linhas'), entl));
      wrap.appendChild(chave('maius', 'Letras maiúsculas', e.maiusculas, function (v) { mudar(function (a) { a.estilo.maiusculas = v; }); }));
      wrap.appendChild(chave('sombra', 'Sombra no texto', e.sombra, function (v) { mudar(function (a) { a.estilo.sombra = v; }); }));
      wrap.appendChild(chave('aspas', 'Aspas no versículo', e.aspas !== false, function (v) { mudar(function (a) { a.estilo.aspas = v; }); }));
      return wrap;
    },
    formato: function () {
      var lista = h('div.lista', A2Arte.FORMATOS.map(function (f) {
        return h('button.item', { 'aria-pressed': String(arte.formato === f.id), style: arte.formato === f.id ? { borderColor: 'var(--ouro)' } : null, on: { click: function () { mudar(function (a) { a.formato = f.id; }); var alvo = this.closest('.painel'); if (alvo) alvo.replaceChildren(PAINEIS.formato()); } } },
          h('div', { style: { width: '34px', display: 'grid', placeItems: 'center' } }, h('div', { style: { width: (28 * Math.min(1, f.w / f.h)) + 'px', height: (28 * Math.min(1, f.h / f.w)) + 'px', border: '2px solid var(--azul-texto)', borderRadius: '4px' } })),
          h('div.corpo', h('span.titulo', f.nome), h('span.meta', f.w + ' × ' + f.h + ' px')), arte.formato === f.id ? ico('ok') : null);
      }));
      if (!formato(arte.formato).papel) return lista;
      return h('div.form', lista, chave('guias', 'Mostrar onde ficam o relógio e os ícones (só na prévia)', guias, function (v) { guias = v; redesenhar(false); }));
    },
    assinatura: function () {
      var a = arte.assinatura, ent = h('input.entrada#assin', { type: 'text', maxlength: 60, placeholder: 'Ex.: @seuperfil ou nome da igreja' }); ent.value = a.texto || '';
      ent.addEventListener('input', function () { arte.assinatura.texto = ent.value; arte.assinatura.mostrar = !!ent.value; redesenhar(); });
      return h('div.form', h('label.campo', { for: 'assin' }, h('span', 'Assinatura'), ent),
        chave('assin-on', 'Mostrar assinatura', a.mostrar, function (v) { mudar(function (x) { x.assinatura.mostrar = v; }); }),
        chave('marca', 'Marca ATOS 2 no canto', arte.marca, function (v) { mudar(function (x) { x.marca = v; }); }));
    }
  };
  function marcarChip(pai, el) { pai.querySelectorAll('[aria-pressed]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === el)); }); }
  function chave(id, rotulo, valor, fn) {
    var i = h('input.interruptor#' + id, { type: 'checkbox' }); i.checked = !!valor;
    i.addEventListener('change', function () { fn(i.checked); });
    return h('label.chave', { for: id }, h('span', rotulo), i);
  }

  function escolherFavorito() {
    UI.folha('Versículos favoritos', function (api) {
      var favs = Dados.todos('favoritos');
      if (!favs.length) return h('div.vazio', h('b', 'Você ainda não tem favoritos.'), h('span', 'Na Bíblia, toque em um versículo e escolha Favoritar.'));
      return h('div.lista', favs.map(function (f) {
        var k = A2Ref.deChave(f.id), r = { livro: k.livro, cap: k.cap, v1: k.v, v2: k.v }, t = h('span.texto-vers', '…');
        Biblia.textoDe(r).then(function (vs) { t.textContent = UI.plano(vs[0].t); });
        return h('button.item', { on: { click: function () { api.fechar(); mudar(function (a) { a.conteudo = { tipo: 'versiculo', ref: A2Ref.formatar(r, true), versao: Biblia.padrao() }; }); App.recarregar(); } } }, h('div.corpo', h('span.titulo', A2Ref.formatar(r)), t));
      }));
    });
  }



  // Fundo criado por IA: a IA devolve apenas um SVG abstrato/paisagem, SEM texto; o texto é aplicado depois pelo editor.
  function painelIA() {
    var desc = h('textarea.entrada#ia-desc', { rows: 3, maxlength: 300, placeholder: 'Descreva o fundo. Ex.: amanhecer dourado sobre colinas com névoa suave' });
    var estado = h('p.sub'), bt = h('button.bt.pri', { on: { click: gerar } }, ico('brilho'), 'Gerar fundo');
    async function gerar() {
      var sample = root.claude && root.claude.use ? await root.claude.use('sample') : null;
      if (!sample) { estado.textContent = 'A criação com IA não está disponível nesta visualização. Use uma das fotos.'; return; }
      if (!desc.value.trim()) { estado.textContent = 'Descreva o fundo que você quer.'; return; }
      var F = formato(arte.formato);
      bt.disabled = true; estado.textContent = 'Criando o fundo…';
      try {
        var r = await sample('Crie UM fundo decorativo em SVG para uma arte de versículo bíblico.\n' +
          'Descrição do usuário: ' + desc.value.trim() + '\n' +
          'Regras obrigatórias: responda SOMENTE com o código <svg>…</svg>; viewBox="0 0 ' + F.w + ' ' + F.h + '"; use formas, gradientes (linearGradient/radialGradient) e filtros simples; ' +
          'NÃO inclua nenhum texto, letra, número, palavra, elemento <text>, imagem externa, script, link ou estilo CSS; não desenhe rostos de pessoas nem figuras de Jesus; ' +
          'deixe a área central mais calma e sem detalhes fortes, pois um versículo será aplicado por cima; no máximo 60 elementos; cores harmoniosas.', { modelTier: 'default' });
        var svg = A2Arte.limparSvg(r && r.text);
        if (!svg) throw new Error('A resposta não trouxe um fundo válido. Tente descrever de outro jeito.');
        if (svg.length > 120000) throw new Error('O fundo ficou complexo demais. Tente uma descrição mais simples.');
        mudar(function (a) { a.fundo = { tipo: 'ia', svg: svg, descricao: desc.value.trim() }; a.estilo.cor = '#FFFFFF'; if (a.escurecer < 0.15) a.escurecer = 0.2; });
        estado.textContent = 'Pronto. Fundo gerado por IA, sem texto; o versículo é aplicado pelo editor.';
      } catch (e) {
        estado.textContent = e && e.code === 'rate_limited' ? 'Muitos pedidos seguidos. Aguarde um pouco e tente de novo.' : e && e.code === 'not_granted' ? 'A criação com IA não foi autorizada nesta visualização.' : (e.message || 'Não foi possível gerar agora.');
      } finally { bt.disabled = false; }
    }
    return h('div.form', h('label.campo', { for: 'ia-desc' }, h('span', 'Como deve ser o fundo?'), desc), bt, estado,
      h('div.aviso-ia', ico('brilho'), h('span', 'A IA cria só a imagem de fundo. Ela nunca escreve o versículo: o texto é composto pelo editor a partir da tradução, para evitar erros e alterações nas Escrituras.')));
  }

  async function salvarArte() {
    UI.aviso('Salvando…');
    var id = idArte || UI.uid(), mini = await miniatura(arte), cont = await textoDaArte(arte).catch(function () { return null; });
    var d = { spec: arte, miniatura: mini, titulo: cont && cont.ref ? cont.ref : 'Arte', atualizadoEm: new Date().toISOString(), criadoEm: (Dados.obter('artes', id) || {}).criadoEm || new Date().toISOString() };
    Dados.salvar('artes', id, d);
    idArte = id; Dados.salvar('_rascunhoArte', 'atual', { spec: arte, idArte: idArte });
    App.registrar('arte', { titulo: 'Arte salva', ref: d.titulo });
    UI.aviso('Arte salva em Minhas artes.'); App.recarregar();
  }
  async function salvarModelo() {
    var nome = await UI.perguntar('Salvar como modelo', 'Nome do modelo', '', { ok: 'Salvar modelo' });
    if (!nome) return;
    Dados.salvar('modelos', UI.uid(), { nome: nome, fundo: arte.fundo, escurecer: arte.escurecer, estilo: arte.estilo, pos: arte.pos, assinatura: arte.assinatura, formato: arte.formato });
    UI.aviso('Modelo salvo.');
  }
  function escolherModelo() {
    UI.folha('Modelos', function (api) {
      var grade = h('div.artes-grade'), meus = Dados.todos('modelos');
      MODELOS.concat(meus.map(function (m) { return Object.assign({ meu: true }, m); })).forEach(function (m) {
        var cv = h('canvas'), spec = mesclarModelo(arte, m);
        desenharArte(cv, spec, 220);
        grade.appendChild(h('div', { style: { display: 'grid', gap: '4px' } }, h('button.arte-card' + (formato(spec.formato).papel ? '.papel' : ''), { on: { click: function () { api.fechar(); arte = spec; if (m.formato) arte.formato = m.formato; App.recarregar(); } } }, cv, h('small', m.nome + (m.meu ? ' · seu' : ''))),
          m.meu ? h('button.bt.peq.fant.perigo', { on: { click: function () { Dados.excluir('modelos', m.id); api.fechar(); escolherModelo(); } } }, ico('lixo'), 'Excluir') : null));
      });
      return h('div.form', h('p.sub', 'O modelo troca fundo e estilo; o texto escolhido continua o mesmo.'), grade);
    });
  }

  // ---------------------------------------------------------------- galeria de artes prontas
  function galeria(area) {
    var cat = App.estado.catGaleria || 'favoritas';
    var extras = (Dados.conteudo.galeria || []).filter(function (x) { return x.publicado; });
    var favs = Dados.todos('galeriaFav');
    if (cat === 'favoritas' && !favs.length) cat = A2Conteudo.GALERIA[0].id;
    var cats = (favs.length ? [{ id: 'favoritas', nome: 'Favoritas' }] : []).concat(A2Conteudo.GALERIA, extras.length ? [{ id: 'novidades', nome: 'Novidades' }] : []);
    area.appendChild(h('div.chips', cats.map(function (c) { return h('button.chip', { 'aria-pressed': String(c.id === cat), on: { click: function () { App.estado.catGaleria = c.id; App.recarregar(); } } }, c.nome); })));
    var itens;
    if (cat === 'favoritas') itens = favs.map(function (f) { return { id: f.id, ref: f.ref, modelo: f.modelo }; });
    else if (cat === 'novidades') itens = extras.map(function (x) { return { id: 'n:' + x.id, ref: x.ref, modelo: x.modelo }; });
    else { var g = A2Conteudo.GALERIA.filter(function (x) { return x.id === cat; })[0]; if (g.fotos) itens = g.refs.map(function (r, i) { return { id: cat + ':' + r, ref: r, modelo: 'foto:' + g.fotos[i % g.fotos.length] }; });
      else { var base = g.papel ? PAPEIS.filter(function (m) { return m.formato === 'papel-celular'; }) : MODELOS.filter(function (m) { return !m.papel; });
      if (g.papel) { var ordem = ['aurora-boreal', 'pier', 'leao', 'fiorde', 'cisnes', 'floresta-nevoa', 'vulcao', 'lago-amanhecer', 'caminho-outono', 'margaridas', 'iceberg', 'praia'];
        base = ordem.map(function (id) { return base.filter(function (m) { return m.fundo.id === id; })[0]; }).filter(Boolean); }
      itens = g.refs.map(function (r, i) { return { id: cat + ':' + r, ref: r, modelo: base[(i + (g.papel ? 0 : A2Conteudo.GALERIA.indexOf(g))) % base.length].id }; }); } }
    var grade = h('div.artes-grade', { style: { marginTop: '10px' } });
    area.appendChild(grade);
    var fila = itens.slice();
    itens.forEach(function (it) {
      var spec = specGaleria(it), cv = h('canvas');
      it._spec = spec; it._cv = cv;
      grade.appendChild(h('button.arte-card' + (formato(spec.formato).papel ? '.papel' : ''), { on: { click: function () { abrirGaleria(it); } } }, cv, h('small', A2Ref.formatar(Biblia.interpretar(it.ref).ref))));
    });
    (async function () { for (var i = 0; i < fila.length; i++) { if (!fila[i]._cv.isConnected) return; await desenharArte(fila[i]._cv, fila[i]._spec, 300); } })();
  }
  function specGaleria(it) {
    if (/^foto:/.test(it.modelo || '')) {
      var ft = A2Fotos.POR_ID[it.modelo.slice(5)] || A2Fotos.LISTA[0], sp = specPadrao();
      sp.fundo = { tipo: 'banco', id: ft.id }; sp.escurecer = ft.escurecer; sp.estilo.cor = ft.cor; sp.estilo.sombra = ft.cor === '#FFFFFF'; if (ft.y) sp.pos = { x: 0.5, y: ft.y };
      sp.conteudo = { tipo: 'versiculo', ref: it.ref, versao: Biblia.padrao() }; sp.marca = true;
      return sp;
    }
    var m = MODELOS.filter(function (x) { return x.id === it.modelo; })[0] || MODELOS[0];
    var s = mesclarModelo(specPadrao(), m); s.conteudo = { tipo: 'versiculo', ref: it.ref, versao: Biblia.padrao() }; s.marca = true;
    return s;
  }
  function abrirGaleria(it) {
    var fav = !!Dados.obter('galeriaFav', it.id.replace(/^n:/, ''));
    UI.folha(A2Ref.formatar(Biblia.interpretar(it.ref).ref), function (api) {
      var cv = h('canvas', { style: { width: '100%', maxWidth: '380px', borderRadius: '12px', justifySelf: 'center' } });
      desenharArte(cv, it._spec, 760);
      var bFav = h('button.bt', { on: { click: function () {
        var k = it.id.replace(/^n:/, '');
        if (fav) Dados.excluir('galeriaFav', k); else Dados.salvar('galeriaFav', k, { ref: it.ref, modelo: it.modelo });
        fav = !fav; bFav.replaceChildren(ico(fav ? 'coracaoCheio' : 'coracao'), fav ? 'Favorita' : 'Favoritar');
      } } }, ico(fav ? 'coracaoCheio' : 'coracao'), fav ? 'Favorita' : 'Favoritar');
      return h('div.form', cv, h('div.linha-bts', { style: { justifyContent: 'center' } },
        h('button.bt.pri', { on: { click: function () { baixar(it._spec); } } }, ico('baixar'), 'Baixar'),
        h('button.bt', { on: { click: function () { compartilharArte(it._spec); } } }, ico('compartilhar'), 'Compartilhar'),
        h('button.bt', { on: { click: function () { api.fechar(); App.estado.arteNova = JSON.parse(JSON.stringify(it._spec)); App.estado.secaoCriar = 'estudio'; App.recarregar(); } } }, ico('editar'), 'Personalizar'),
        bFav));
    });
  }

  // ---------------------------------------------------------------- minhas artes
  function minhas(area) {
    var lista = Dados.todos('artes').sort(function (a, b) { return String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)); });
    if (!lista.length) { area.appendChild(h('div.vazio', h('b', 'Nenhuma arte salva ainda.'), h('span', 'Crie no Estúdio e toque em Salvar.'), h('button.bt.pri', { on: { click: function () { App.estado.secaoCriar = 'estudio'; App.recarregar(); } } }, 'Abrir o estúdio'))); return; }
    area.appendChild(h('div.artes-grade', lista.map(function (a) {
      return h('button.arte-card', { on: { click: function () { abrirMinha(a); } } }, h('img', { src: a.miniatura, alt: a.titulo }), h('small', a.titulo + ' · ' + UI.dataCurta(a.atualizadoEm)));
    })));
  }
  function abrirMinha(a) {
    UI.folha(a.titulo, function (api) {
      return h('div.form', h('img', { src: a.miniatura, alt: a.titulo, style: { width: '100%', maxWidth: '360px', borderRadius: '12px', justifySelf: 'center' } }),
        h('div.linha-bts', { style: { justifyContent: 'center' } },
          h('button.bt.pri', { on: { click: function () { api.fechar(); App.estado.arteNova = JSON.parse(JSON.stringify(a.spec)); App.estado.arteNovaId = a.id; App.recarregar(); } } }, ico('editar'), 'Editar'),
          h('button.bt', { on: { click: function () { baixar(a.spec); } } }, ico('baixar'), 'Baixar'),
          h('button.bt', { on: { click: function () { compartilharArte(a.spec); } } }, ico('compartilhar'), 'Compartilhar'),
          h('button.bt', { on: { click: function () { var id = UI.uid(); Dados.salvar('artes', id, Object.assign({}, a, { id: undefined, titulo: a.titulo, atualizadoEm: new Date().toISOString() })); api.fechar(); UI.aviso('Arte duplicada.'); App.recarregar(); } } }, ico('duplicar'), 'Duplicar'),
          h('button.bt.perigo', { on: { click: async function () { if (await UI.confirmar('Excluir arte', 'Esta arte será removida de Minhas artes.', 'Excluir', true)) { Dados.excluir('artes', a.id); api.fechar(); App.recarregar(); } } } }, ico('lixo'), 'Excluir')));
    });
  }

  function comVersiculo(refStr) {
    var base = arte ? JSON.parse(JSON.stringify(arte)) : specPadrao();
    base.conteudo = { tipo: 'versiculo', ref: refStr, versao: Biblia.padrao() };
    App.estado.arteNova = base; App.estado.arteNovaId = null; App.estado.secaoCriar = 'estudio';
    App.ir('criar');
  }

  root.Telas.criar = { render: render, comVersiculo: comVersiculo, desenharArte: desenharArte, salvarImagem: salvarImagem, compartilharImagem: compartilharImagem };
})(window);
