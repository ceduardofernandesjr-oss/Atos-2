/* ATOS 2 — Desenho das artes v2 no canvas: fundo (foto, cor, degradê, imagem própria, IA) com ajustes,
   camadas de texto e elementos. O versículo vem sempre da tradução (Biblia), nunca de outro lugar.
   Navegador: window.A2Desenho */
(function (root) {
  'use strict';

  var FONTES = A2Arte.FONTES;
  function fonteInfo(fam) { return A2Arte.FONTE_POR_FAM[fam] || FONTES[0]; }
  function lim(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ---------------------------------------------------------------- recursos
  var imagens = {};
  function carregarImagem(chave, src) {
    if (imagens[chave]) return imagens[chave];
    imagens[chave] = new Promise(function (res) {
      var i = new Image(); i.decoding = 'async';
      i.onload = function () { res(i); }; i.onerror = function () { delete imagens[chave]; res(null); }; i.src = src;
    });
    return imagens[chave];
  }
  function hash(s) { var x = 5381; s = String(s); for (var i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0; return (x >>> 0).toString(36) + ':' + s.length; }
  async function imagemDoFundo(f, F, larguraPx) {
    if (f.tipo === 'ia' && f.svg) return carregarImagem('s:' + hash(f.svg), URL.createObjectURL(new Blob([f.svg], { type: 'image/svg+xml' })));
    if (f.tipo === 'imagem') {
      var reg = root.Dados && Dados.obter('_imagensArte', f.imagem);
      return reg && reg.dados ? carregarImagem('u:' + f.imagem, reg.dados) : null;
    }
    if (f.tipo === 'banco') {
      var arq = A2Fotos.arquivo(f.id, F.w, F.h, larguraPx) || A2Fotos.arquivo('pier', F.w, F.h, larguraPx);
      return carregarImagem('b:' + arq, arq);
    }
    return null;
  }
  var fontesProntas = {};
  function garantirFonte(fam, peso, italico) {
    var k = (italico ? 'italic ' : '') + peso + ' ' + fam;
    if (!fontesProntas[k]) fontesProntas[k] = Promise.race([document.fonts ? document.fonts.load(k.replace(fam, '40px "' + fam + '"')).catch(function () {}) : Promise.resolve(), new Promise(function (r) { setTimeout(r, 2500); })]);
    return fontesProntas[k];
  }
  function pesoDe(L) { var f = fonteInfo(L.fonte); return L.negrito ? f.negrito : (L.peso || f.peso); }
  function fonteCss(L, tam) { return (L.italico ? 'italic ' : '') + pesoDe(L) + ' ' + tam + 'px "' + fonteInfo(L.fonte).fam + '"'; }

  // Texto bíblico exato da tradução (ou o texto livre do usuário)
  var cacheTexto = {};
  async function textoDaArte(spec) {
    var c = spec.conteudo || {};
    if (c.tipo === 'livre') return { texto: c.texto || '', ref: c.legenda || '', refBase: c.legenda || '', sigla: '', livre: true };
    var v = c.versao || 'blivre', k = v + '|' + c.ref;
    if (!cacheTexto[k]) cacheTexto[k] = Biblia.textoDeString(c.ref, v).then(function (r) {
      return { texto: A2Arte.textoParaArte(r.versos.map(function (x) { return x.t; })), refAuto: A2Ref.formatar(r.ref), sigla: Biblia.versao(v).sigla, refObj: r.ref };
    }, function (e) { delete cacheTexto[k]; throw e; });
    var b = await cacheTexto[k], base = c.rotulo || b.refAuto;
    return { texto: b.texto, refBase: base, sigla: b.sigla, refObj: b.refObj, ref: base + ' · ' + b.sigla };
  }

  // ---------------------------------------------------------------- fundo
  var suportaFiltro = (function () {
    try { var g = document.createElement('canvas').getContext('2d'); if (!('filter' in g)) return false; g.filter = 'blur(2px)'; return g.filter === 'blur(2px)'; } catch (e) { return false; }
  })();
  var cacheFundo = [];
  function chaveFundo(f, w, h) { var c = Object.assign({}, f); if (c.svg) c.svg = hash(c.svg); return JSON.stringify(c) + '@' + w + 'x' + h; }

  function preencherGradiente(g, f, W, H) {
    var cores = f.cores && f.cores.length >= 2 ? f.cores : ['#192D50', '#0E1830'], gr;
    if (f.radial) gr = g.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.hypot(W, H) * 0.6);
    else {
      var a = ((f.angulo == null ? 180 : f.angulo) - 90) * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a);
      var meio = (Math.abs(W * dx) + Math.abs(H * dy)) / 2;
      gr = g.createLinearGradient(W / 2 - dx * meio, H / 2 - dy * meio, W / 2 + dx * meio, H / 2 + dy * meio);
    }
    cores.forEach(function (c, i) { gr.addColorStop(i / (cores.length - 1), c); });
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  function ajustarPixels(g, w, h, f) {
    var b = f.brilho, c = f.contraste, s = f.saturacao;
    if (b === 1 && c === 1 && s === 1) return;
    try {
      var d = g.getImageData(0, 0, w, h), p = d.data;
      for (var i = 0; i < p.length; i += 4) {
        var r = p[i] * b, gg = p[i + 1] * b, bb = p[i + 2] * b;
        r = (r - 128) * c + 128; gg = (gg - 128) * c + 128; bb = (bb - 128) * c + 128;
        var cinza = 0.2126 * r + 0.7152 * gg + 0.0722 * bb;
        p[i] = cinza + (r - cinza) * s; p[i + 1] = cinza + (gg - cinza) * s; p[i + 2] = cinza + (bb - cinza) * s;
      }
      g.putImageData(d, 0, 0);
    } catch (e) { /* imagem sem permissão de leitura: segue sem o ajuste */ }
  }
  function desfocarManual(cv, px) {
    if (px < 0.5) return;
    var k = Math.max(1.5, px / 1.6), w = Math.max(2, Math.round(cv.width / k)), h = Math.max(2, Math.round(cv.height / k));
    var t = document.createElement('canvas'); t.width = w; t.height = h;
    var tg = t.getContext('2d'); tg.imageSmoothingQuality = 'high'; tg.drawImage(cv, 0, 0, w, h);
    var g = cv.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingQuality = 'high'; g.clearRect(0, 0, cv.width, cv.height); g.drawImage(t, 0, 0, cv.width, cv.height); g.restore();
  }
  function sobreposicao(g, o, W, H) {
    if (!o || !(o.opacidade > 0)) return;
    var rgb = A2Arte.hexParaRgb(o.cor || '#000000'), cor = function (a) { return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'; }, gr;
    if (o.estilo === 'base' || o.estilo === 'topo') {
      gr = o.estilo === 'base' ? g.createLinearGradient(0, H * 0.25, 0, H) : g.createLinearGradient(0, H * 0.75, 0, 0);
      gr.addColorStop(0, cor(0)); gr.addColorStop(1, cor(o.opacidade)); g.fillStyle = gr;
    } else if (o.estilo === 'vinheta') {
      gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.hypot(W, H) * 0.55);
      gr.addColorStop(0, cor(0)); gr.addColorStop(1, cor(o.opacidade)); g.fillStyle = gr;
    } else g.fillStyle = cor(o.opacidade);
    g.fillRect(0, 0, W, H);
  }
  async function renderFundo(f, F, esc, larguraAlvo) {
    var w = Math.round(F.w * esc), h = Math.round(F.h * esc), chave = chaveFundo(f, w, h);
    var achado = cacheFundo.filter(function (x) { return x.k === chave; })[0];
    if (achado) return achado.c;
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var g = cv.getContext('2d'), W = F.w, H = F.h, u = F.base / 1080;
    g.setTransform(esc, 0, 0, esc, 0, 0);
    g.fillStyle = f.base || '#192D50'; g.fillRect(0, 0, W, H);
    var temAjuste = f.brilho !== 1 || f.contraste !== 1 || f.saturacao !== 1, desf = (f.desfoque || 0) * u * esc;
    var filtroCss = suportaFiltro && (temAjuste || desf > 0) ? 'blur(' + desf.toFixed(2) + 'px) brightness(' + f.brilho + ') contrast(' + f.contraste + ') saturate(' + f.saturacao + ')' : null;
    var camada = document.createElement('canvas'); camada.width = w; camada.height = h;
    var cg = camada.getContext('2d'); cg.setTransform(esc, 0, 0, esc, 0, 0);
    if (f.tipo === 'cor') { cg.fillStyle = f.cor || '#192D50'; cg.fillRect(0, 0, W, H); }
    else if (f.tipo === 'gradiente') preencherGradiente(cg, f, W, H);
    else {
      var img = await imagemDoFundo(f, F, larguraAlvo);
      if (img) {
        var extra = desf > 0 ? 1 + (4 * desf / esc) / Math.min(W, H) : 1;
        var s = Math.max(W / img.width, H / img.height) * (f.zoom || 1) * extra, iw = img.width * s, ih = img.height * s;
        var x = (W - iw) / 2 - (f.dx || 0) * (iw - W) / 2, y = (H - ih) / 2 - (f.dy || 0) * (ih - H) / 2;
        cg.drawImage(img, x, y, iw, ih);
      } else {
        cg.fillStyle = '#2B3550'; cg.fillRect(0, 0, W, H);
        cg.fillStyle = 'rgba(255,255,255,.65)'; cg.font = '600 ' + (28 * u) + 'px Manrope'; cg.textAlign = 'center';
        cg.fillText(f.tipo === 'imagem' ? 'A imagem não está neste aparelho' : 'Sem conexão: o fundo não carregou', W / 2, 70 * u);
      }
    }
    if (filtroCss) {
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = f.opacidade == null ? 1 : f.opacidade; g.filter = filtroCss; g.drawImage(camada, 0, 0); g.restore();
    } else {
      if (temAjuste) ajustarPixels(cg, w, h, f);
      if (desf > 0) desfocarManual(camada, desf);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = f.opacidade == null ? 1 : f.opacidade; g.drawImage(camada, 0, 0); g.restore();
    }
    sobreposicao(g, f.sobreposicao, W, H);
    cacheFundo.unshift({ k: chave, c: cv }); if (cacheFundo.length > 6) cacheFundo.pop();
    return cv;
  }

  // ---------------------------------------------------------------- ícones (caixa 24×24, desenhos próprios)
  var ICONES = {
    cruz: { d: 'M10.6 2h2.8v6h5.6v2.8h-5.6V22h-2.8V10.8H5V8h5.6z' },
    coracao: { d: 'M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 5.6 3.9 4.3 7.3C19.5 16.4 12 21 12 21z' },
    estrela: { d: 'M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.5 6.6-.8z' },
    chama: { d: 'M12 22c-4 0-6.6-2.7-6.6-6.2 0-4 3.3-5.9 4-9.8 2.6 1.6 3.7 4 3.5 6.2 1.1-.7 1.8-1.8 2-3.2 2.1 1.8 3.7 4.1 3.7 6.8 0 3.5-2.6 6.2-6.6 6.2z' },
    pomba: { d: 'M2.5 13.2c2.3.5 4.3-.1 5.9-1.6L5.6 5.8c2.8.7 4.8 2.5 5.8 5l1.4-5.6c1.9 2 2.5 4.6 1.8 7.3l2.6-1.7c.7-.4 1.5-.5 2.2-.2l2.1.9-1.8.6c-.4 2-1.5 3.8-3.2 5-2.6 1.9-5.9 2.4-8.8 1.2L5 20.3l1-3.3c-1.6-.8-2.8-2.1-3.5-3.8z' },
    folha: { d: 'M20 3.5C10 3.5 4 8.6 4 15.6c0 1.6.4 2.9 1 4.1 1.1-4.1 4.1-8 9-10.2-4 3-6.5 6.3-7.5 10.3 1.2.5 2.6.8 4.2.8 6.2 0 9.3-6.1 9.3-17.1z' },
    coroa: { d: 'M3 7.5l4.6 4.2L12 4.5l4.4 7.2L21 7.5l-1.8 10.2H4.8zM4.8 19h14.4v2H4.8z' },
    peixe: { d: 'M2 12c4.5-6.5 12-6.5 17.5 1.6L22 10v4l-2.5-3.6C14 18.5 6.5 18.5 2 12', traco: true },
    ancora: { d: 'M12 3.2a1.9 1.9 0 1 1 0 3.8a1.9 1.9 0 1 1 0-3.8M12 7v14M8 10h8M4.5 14c0 4 3.4 7 7.5 7s7.5-3 7.5-7M3 15.6l1.5-1.6 1.8 1.4M21 15.6l-1.5-1.6-1.8 1.4', traco: true },
    livro: { d: 'M2 5.4c3-1 6.5-.8 9.2 1v13c-2.7-1.8-6.2-2-9.2-1zM22 5.4c-3-1-6.5-.8-9.2 1v13c2.7-1.8 6.2-2 9.2-1z' },
    calice: { d: 'M6 3h12c0 5-2.4 8.4-5 9.3V18c1.8.3 3.5.9 4 2.2V21H7v-.8c.5-1.3 2.2-1.9 4-2.2v-5.7C8.4 11.4 6 8 6 3z' },
    trigo: { d: 'M12 9c-2-1-3-2.6-3-4.5 2 .6 3 2.2 3 4.5zM12 9c2-1 3-2.6 3-4.5-2 .6-3 2.2-3 4.5zM12 13c-2.2-1-3.4-2.6-3.4-4.6 2.2.6 3.4 2.2 3.4 4.6zM12 13c2.2-1 3.4-2.6 3.4-4.6-2.2.6-3.4 2.2-3.4 4.6zM12 17c-2.4-1-3.8-2.6-3.8-4.8 2.4.6 3.8 2.4 3.8 4.8zM12 17c2.4-1 3.8-2.6 3.8-4.8-2.4.6-3.8 2.4-3.8 4.8zM12 2.5c-.9 1-1.2 2.2-.9 3.4h1.8c.3-1.2 0-2.4-.9-3.4z', haste: 'M12 22V5' },
    montanha: { d: 'M1.5 20l7.5-12 4 6.2 3-4.2 6.5 10z' },
    sol: { sol: true }
  };
  var paths = {};
  function path(d) { if (!paths[d]) paths[d] = new Path2D(d); return paths[d]; }
  function desenharIcone(g, nome, s) {
    var ic = ICONES[nome] || ICONES.cruz;
    g.save(); g.scale(s / 24, s / 24); g.translate(-12, -12);
    if (ic.sol) {
      g.beginPath(); g.arc(12, 12, 4.6, 0, Math.PI * 2); g.fill();
      g.lineWidth = 1.6; g.lineCap = 'round';
      for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; g.beginPath(); g.moveTo(12 + Math.cos(a) * 7, 12 + Math.sin(a) * 7); g.lineTo(12 + Math.cos(a) * (i % 2 ? 9.4 : 10.8), 12 + Math.sin(a) * (i % 2 ? 9.4 : 10.8)); g.stroke(); }
    } else if (ic.traco) { g.lineWidth = 1.7; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(path(ic.d)); }
    else {
      g.fill(path(ic.d));
      if (ic.haste) { g.lineWidth = 1.3; g.lineCap = 'round'; g.stroke(path(ic.haste)); }
    }
    g.restore();
  }

  // ---------------------------------------------------------------- texturas (determinísticas)
  var ladrilhos = {};
  function ruido(semente) {
    return function () { semente |= 0; semente = semente + 0x6D2B79F5 | 0; var t = Math.imul(semente ^ semente >>> 15, 1 | semente); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function ladrilho(estilo, cor) {
    var k = estilo + cor;
    if (ladrilhos[k]) return ladrilhos[k];
    var n = 160, c = document.createElement('canvas'); c.width = n; c.height = n;
    var g = c.getContext('2d'), rnd = ruido(estilo === 'papel' ? 7 : 42), rgb = A2Arte.hexParaRgb(cor), d = g.createImageData(n, n);
    for (var i = 0; i < d.data.length; i += 4) {
      var v = rnd();
      d.data[i] = rgb[0]; d.data[i + 1] = rgb[1]; d.data[i + 2] = rgb[2];
      d.data[i + 3] = estilo === 'papel' ? (v > 0.55 ? (v - 0.55) * 160 : 0) : v * 90;
    }
    g.putImageData(d, 0, 0);
    if (estilo === 'papel') {
      g.strokeStyle = 'rgba(' + rgb.join(',') + ',.18)'; g.lineWidth = 0.6;
      for (var j = 0; j < 26; j++) { var x = rnd() * n, y = rnd() * n, a = rnd() * Math.PI, l = 8 + rnd() * 22; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    }
    ladrilhos[k] = c; return c;
  }
  function desenharTextura(g, e, W, H, u) {
    var est = e.estilo || 'granulado';
    if (est === 'granulado' || est === 'papel') {
      g.save(); g.fillStyle = g.createPattern(ladrilho(est, e.cor), 'repeat');
      var esc = est === 'papel' ? 1.6 * u : 1.1 * u; g.scale(esc, esc); g.fillRect(0, 0, W / esc, H / esc); g.restore();
    } else if (est === 'linhas') {
      g.strokeStyle = e.cor; g.lineWidth = 1.4 * u; var p = 16 * u; g.beginPath();
      for (var x = -H; x < W; x += p) { g.moveTo(x, 0); g.lineTo(x + H, H); } g.stroke();
    } else if (est === 'pontos') {
      g.fillStyle = e.cor; var q = 30 * u, r = 2.2 * u;
      for (var yy = q / 2; yy < H; yy += q) for (var xx = q / 2; xx < W; xx += q) { g.beginPath(); g.arc(xx, yy, r, 0, Math.PI * 2); g.fill(); }
    } else if (est === 'vinheta') {
      var gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.56), rgb = A2Arte.hexParaRgb(e.cor);
      gr.addColorStop(0, 'rgba(' + rgb.join(',') + ',0)'); gr.addColorStop(1, 'rgba(' + rgb.join(',') + ',1)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    } else if (est === 'luz') {
      var gl = g.createRadialGradient(W * 0.3, H * 0.12, 0, W * 0.3, H * 0.12, Math.hypot(W, H) * 0.7), c = A2Arte.hexParaRgb(e.cor);
      gl.addColorStop(0, 'rgba(' + c.join(',') + ',1)'); gl.addColorStop(0.5, 'rgba(' + c.join(',') + ',.25)'); gl.addColorStop(1, 'rgba(' + c.join(',') + ',0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
    }
  }

  // ---------------------------------------------------------------- elementos
  function retArredondado(g, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function cantos(g, w, h, lw, u) {
    var l = Math.min(w, h) * 0.14, x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2, d = lw * 1.6;
    g.lineWidth = lw; g.lineCap = 'square';
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(function (c) {
      g.beginPath(); g.moveTo(c[0], c[1] + c[3] * l); g.lineTo(c[0], c[1]); g.lineTo(c[0] + c[2] * l, c[1]); g.stroke();
      g.beginPath(); g.moveTo(c[0] + c[2] * d * 2.4, c[1] + c[3] * l * 0.6); g.lineTo(c[0] + c[2] * d * 2.4, c[1] + c[3] * d * 2.4); g.lineTo(c[0] + c[2] * l * 0.6, c[1] + c[3] * d * 2.4); g.lineWidth = lw * 0.5; g.stroke(); g.lineWidth = lw;
      g.beginPath(); g.arc(c[0] + c[2] * d * 4.2, c[1] + c[3] * d * 4.2, Math.max(1.5 * u, lw * 0.7), 0, Math.PI * 2); g.fill();
    });
  }
  function ornamento(g, e, w, h, u) {
    var lw = (e.espessura || 2) * u, est = e.estilo || 'divisor';
    g.lineWidth = lw; g.lineCap = 'round';
    if (est === 'divisor') {
      var s = Math.min(h * 0.5, w * 0.06);
      g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-s * 2.2, 0); g.moveTo(s * 2.2, 0); g.lineTo(w / 2, 0); g.stroke();
      g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 1.2, 0); g.lineTo(0, s); g.lineTo(-s * 1.2, 0); g.closePath(); g.fill();
      [-1, 1].forEach(function (k) { g.beginPath(); g.arc(k * s * 2.2, 0, s * 0.32, 0, Math.PI * 2); g.fill(); });
    } else if (est === 'ramos') {
      // dois ramos de oliveira que sobem do centro, com folhas ao longo do galho
      [-1, 1].forEach(function (k) {
        var p0 = [k * w * 0.04, h * 0.42], c1 = [k * w * 0.36, h * 0.46], p1 = [k * w * 0.48, -h * 0.4];
        function pt(t) { var a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; return [a * p0[0] + b * c1[0] + c * p1[0], a * p0[1] + b * c1[1] + c * p1[1]]; }
        function tg(t) { return [2 * (1 - t) * (c1[0] - p0[0]) + 2 * t * (p1[0] - c1[0]), 2 * (1 - t) * (c1[1] - p0[1]) + 2 * t * (p1[1] - c1[1])]; }
        g.lineWidth = Math.max(lw * 0.8, 1); g.beginPath(); g.moveTo(p0[0], p0[1]); g.quadraticCurveTo(c1[0], c1[1], p1[0], p1[1]); g.stroke();
        for (var i = 0; i < 7; i++) {
          var t = 0.12 + i * 0.13, q = pt(t), d = tg(t), ang = Math.atan2(d[1], d[0]), r = h * 0.3 * (1 - t * 0.35);
          [-1, 1].forEach(function (lado) {
            g.save(); g.translate(q[0], q[1]); g.rotate(ang + lado * 0.75 * k);
            g.beginPath(); g.ellipse(r * 0.9, 0, r, r * 0.36, 0, 0, Math.PI * 2); g.fill(); g.restore();
          });
        }
        g.beginPath(); g.ellipse(p1[0], p1[1], h * 0.12, h * 0.26, k * 0.5, 0, Math.PI * 2); g.fill();
      });
    } else if (est === 'aspas') {
      g.font = '700 ' + (h * 2.2) + 'px "Playfair Display"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('“', 0, h * 0.45);
    } else if (est === 'raios') {
      var n = 13, gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, e.cor); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr;
      for (var j = 0; j < n; j++) {
        var a0 = Math.PI * (0.12 + 0.76 * j / (n - 1)) - 0.035, a1 = a0 + 0.07, R = Math.hypot(w, h);
        g.beginPath(); g.moveTo(0, -h / 2); g.lineTo(Math.cos(a0) * R, -h / 2 + Math.sin(a0) * R); g.lineTo(Math.cos(a1) * R, -h / 2 + Math.sin(a1) * R); g.closePath(); g.fill();
      }
    } else if (est === 'selo') {
      var r1 = Math.min(w, h) / 2; g.beginPath(); g.arc(0, 0, r1 - lw, 0, Math.PI * 2); g.stroke();
      g.lineWidth = lw * 0.5; g.beginPath(); g.arc(0, 0, r1 * 0.82, 0, Math.PI * 2); g.stroke();
      for (var k2 = 0; k2 < 24; k2++) { var a = k2 * Math.PI / 12; g.beginPath(); g.arc(Math.cos(a) * r1 * 0.91, Math.sin(a) * r1 * 0.91, lw * 0.45, 0, Math.PI * 2); g.fill(); }
    } else if (est === 'cantos') cantos(g, w, h, lw, u);
  }
  function desenharElemento(g, e, W, H, u) {
    var cx = e.x * W, cy = e.y * H, w = e.w * W, h = e.h * H, rot = (e.rotacao || 0) * Math.PI / 180;
    if (e.forma === 'textura') {
      g.save(); g.globalAlpha = e.opacidade; desenharTextura(g, e, W, H, u); g.restore();
      return { x: 0, y: 0, w: W, h: H, rot: 0, px: W / 2, py: H / 2, textura: true };
    }
    var caixa = { x: cx - w / 2, y: cy - h / 2, w: w, h: h, rot: rot, px: cx, py: cy };
    g.save(); g.translate(cx, cy); g.rotate(rot); g.globalAlpha = e.opacidade; g.fillStyle = e.cor; g.strokeStyle = e.cor;
    var lw = (e.espessura || 3) * u;
    if (e.forma === 'retangulo') { retArredondado(g, -w / 2, -h / 2, w, h, (e.raio || 0) * u); if (e.preenchido === false) { g.lineWidth = lw; g.stroke(); } else g.fill(); }
    else if (e.forma === 'circulo') { g.beginPath(); g.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2); if (e.preenchido === false) { g.lineWidth = lw; g.stroke(); } else g.fill(); }
    else if (e.forma === 'linha') {
      g.fillRect(-w / 2, -lw / 2, w, lw);
      if (e.estilo === 'dupla') g.fillRect(-w / 2, lw * 1.6, w, lw * 0.5);
      var hh = Math.max(lw, 24 * u); caixa.y = cy - hh / 2; caixa.h = hh;
    }
    else if (e.forma === 'moldura') {
      g.lineWidth = lw;
      if (e.estilo === 'cantos') cantos(g, w, h, lw, u);
      else {
        g.strokeRect(-w / 2 + lw / 2, -h / 2 + lw / 2, w - lw, h - lw);
        if (e.estilo === 'dupla') { var d = Math.max(10 * u, lw * 3); g.lineWidth = lw * 0.5; g.strokeRect(-w / 2 + d, -h / 2 + d, w - 2 * d, h - 2 * d); }
      }
    }
    else if (e.forma === 'icone') { var s = Math.min(w, h); desenharIcone(g, e.icone, s); caixa = { x: cx - s / 2, y: cy - s / 2, w: s, h: s, rot: rot, px: cx, py: cy }; }
    else if (e.forma === 'ornamento') ornamento(g, e, w, h, u);
    g.restore();
    return caixa;
  }

  // ---------------------------------------------------------------- texto
  function medidor(g, L, tam) {
    g.font = fonteCss(L, tam);
    var sp = (L.espacamento || 0) * tam;
    return function (s) { var n = Array.from(s).length; return g.measureText(s).width + (n > 1 ? sp * (n - 1) : 0); };
  }
  function desenharLinhas(g, L, layout, ancX, topo, medir) {
    var sp = (L.espacamento || 0) * layout.tamanho, ent = L.entrelinha || 1.3, contorno = (L.contorno || 0) > 0;
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    function linha(s, y, tracar) {
      var w = medir(s), x = L.alinhar === 'left' ? ancX : L.alinhar === 'right' ? ancX - w : ancX - w / 2;
      if (!sp) { if (tracar) g.strokeText(s, x, y); else g.fillText(s, x, y); return; }
      Array.from(s).forEach(function (ch) { if (tracar) g.strokeText(ch, x, y); else g.fillText(ch, x, y); x += g.measureText(ch).width + sp; });
    }
    var passes = contorno ? [true, false] : [false];
    passes.forEach(function (tracar, i) {
      if (i === 1) { g.shadowColor = 'transparent'; }
      layout.linhas.forEach(function (l, k) { linha(l, topo + layout.tamanho * (0.95 + k * ent), tracar); });
    });
  }
  function aplicarSombra(g, L, u) {
    var s = L.sombra || 0;
    if (s > 0) { g.shadowColor = 'rgba(0,0,0,' + (0.76 * s).toFixed(3) + ')'; g.shadowBlur = 36 * s * u; g.shadowOffsetY = 4 * s * u; }
    else { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0; }
  }
  function textoDaCamada(L, cont) {
    var t = '';
    if (L.papel === 'versiculo') {
      t = cont.texto || '';
      if (L.aspas && !cont.livre && t && !/[“”"]/.test(t)) t = '“' + t + '”';   // o versículo já com fala citada não ganha aspas extras
    } else if (L.papel === 'referencia') t = cont.livre ? (cont.refBase || '') : cont.refBase + (L.mostrarVersao !== false && cont.sigla ? ' · ' + cont.sigla : '');
    else if (L.papel === 'marca') t = 'ATOS 2';
    else t = L.texto || '';
    return L.maiusculas ? t.toLocaleUpperCase('pt-BR') : t;
  }
  function layoutTexto(g, L, texto, caixa, u, auto) {
    var ent = L.entrelinha || 1.3;
    if (L.tamanho > 0 || !auto || auto.fixo) {
      var tam = (L.tamanho > 0 ? L.tamanho : auto && auto.fixo ? auto.fixo : 40) * u, med = medidor(g, L, tam);
      var l = { tamanho: tam, linhas: A2Arte.quebrar(texto, caixa.w, med) }; l.altura = l.linhas.length * tam * ent; return l;
    }
    return A2Arte.ajustar(texto, caixa, function (t) { return medidor(g, L, t); }, { min: auto.min, max: auto.max, entrelinha: ent });
  }

  // ---------------------------------------------------------------- desenho principal
  // Retorna { caixas: { idCamada: {x, y, w, h, rot, px, py} } em px do canvas, conteudo, escala }
  async function desenhar(canvas, specEntrada, larguraAlvo, opcoes) {
    opcoes = opcoes || {};
    var spec = A2Arte.migrar(specEntrada), F = A2Arte.formatoDe(spec), esc = larguraAlvo / F.w;
    canvas.width = Math.max(1, Math.round(F.w * esc)); canvas.height = Math.max(1, Math.round(F.h * esc));
    var g = canvas.getContext('2d'), W = F.w, H = F.h, u = F.base / 1080;
    var cont;
    try { cont = await textoDaArte(spec); } catch (e) { cont = { texto: 'Referência inválida: ' + e.message, refBase: '', sigla: '', livre: true }; }
    var textos = spec.camadas.filter(function (c) { return c.tipo === 'texto' && c.visivel !== false; });
    var fundoCv = await Promise.all([renderFundo(spec.fundo, F, esc, larguraAlvo)].concat(textos.map(function (c) { return garantirFonte(fonteInfo(c.fonte).fam, pesoDe(c), c.italico); })))
      .then(function (r) { return r[0]; });
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(fundoCv, 0, 0);
    g.setTransform(esc, 0, 0, esc, 0, 0);
    var caixas = {};

    // bloco do versículo (com a referência ancorada logo abaixo)
    var V = spec.camadas.filter(function (c) { return c.papel === 'versiculo'; })[0];
    var Rf = spec.camadas.filter(function (c) { return c.papel === 'referencia'; })[0];
    var ancorada = Rf && Rf.ancora === 'versiculo' && Rf.visivel !== false;
    var celular = spec.formato === 'papel-celular', blocoV = null;
    if (V) {
      var tV = textoDaCamada(V, cont), cxV = { w: W * V.largura, h: H * V.altura };
      var maxV = (V.tamanhoMax || (spec.formato === 'stories' || spec.formato === 'status' || celular ? 128 : 112)) * u;
      var layV = layoutTexto(g, V, tV, cxV, u, { min: 18 * u, max: maxV });
      var tRf = ancorada ? textoDaCamada(Rf, cont) : '', refTam = 0, gap = 0, layR = null;
      if (ancorada && tRf) {
        refTam = Rf.tamanho > 0 ? Rf.tamanho * u : Math.max(22 * u, Math.min(34 * u, layV.tamanho * 0.42));
        gap = layV.tamanho * 0.75;
        layR = { tamanho: refTam, linhas: A2Arte.quebrar(tRf, cxV.w, medidor(g, Rf, refTam)) };
        layR.altura = layR.linhas.length * refTam * 1.25;
      }
      var altBloco = layV.altura + (layR ? gap + layR.altura : 0);
      var lim0 = celular ? H * 0.31 : 40 * u, lim1 = celular ? H * 0.86 : H - 40 * u;
      var topo = lim(V.y * H - altBloco / 2, lim0, Math.max(lim0, lim1 - altBloco));
      var x0 = lim(V.x * W - cxV.w / 2, 30 * u, Math.max(30 * u, W - cxV.w - 30 * u));
      var anc = V.alinhar === 'left' ? x0 : V.alinhar === 'right' ? x0 + cxV.w : x0 + cxV.w / 2;
      var px = x0 + cxV.w / 2, py = topo + altBloco / 2, rot = (V.rotacao || 0) * Math.PI / 180;
      blocoV = { layV: layV, layR: layR, topo: topo, x0: x0, anc: anc, px: px, py: py, rot: rot, tRf: tRf, gap: gap };
      caixas[V.id] = { x: x0, y: topo, w: cxV.w, h: layV.altura, rot: rot, px: px, py: py };
      if (layR) caixas[Rf.id] = { x: x0, y: topo + layV.altura + gap, w: cxV.w, h: layR.altura, rot: rot, px: px, py: py };
    }

    spec.camadas.forEach(function (c) {
      if (c.visivel === false) return;
      if (c.tipo === 'elemento') { caixas[c.id] = desenharElemento(g, c, W, H, u); return; }
      if (c.papel === 'versiculo' && blocoV) {
        g.save(); g.translate(blocoV.px, blocoV.py); g.rotate(blocoV.rot); g.translate(-blocoV.px, -blocoV.py);
        g.globalAlpha = c.opacidade; g.fillStyle = c.cor; g.strokeStyle = c.corContorno; g.lineWidth = (c.contorno || 0) * u * 2; g.lineJoin = 'round';
        aplicarSombra(g, c, u); g.font = fonteCss(c, blocoV.layV.tamanho);
        desenharLinhas(g, c, blocoV.layV, blocoV.anc, blocoV.topo, medidor(g, c, blocoV.layV.tamanho));
        g.restore(); return;
      }
      if (c.papel === 'referencia' && ancorada) {
        if (!blocoV || !blocoV.layR) return;
        var alinhaR = Object.assign({}, c, { alinhar: (spec.camadas.filter(function (x) { return x.papel === 'versiculo'; })[0] || {}).alinhar || 'center' });
        g.save(); g.translate(blocoV.px, blocoV.py); g.rotate(blocoV.rot); g.translate(-blocoV.px, -blocoV.py);
        g.globalAlpha = c.opacidade; g.fillStyle = c.cor; g.strokeStyle = c.corContorno; g.lineWidth = (c.contorno || 0) * u * 2; g.lineJoin = 'round';
        aplicarSombra(g, c, u); g.font = fonteCss(c, blocoV.layR.tamanho);
        var lr = Object.assign({}, blocoV.layR); var Lr = Object.assign({}, alinhaR, { entrelinha: 1.25 });
        desenharLinhas(g, Lr, lr, blocoV.anc, blocoV.topo + blocoV.layV.altura + blocoV.gap - blocoV.layR.tamanho * 0.15, medidor(g, Lr, lr.tamanho));
        g.restore(); return;
      }
      // camadas de texto livres (referência solta, textos, assinatura, marca)
      var t = textoDaCamada(c, cont);
      if (!t) { caixas[c.id] = null; return; }
      var cx = { w: W * c.largura, h: H * c.altura };
      var auto = c.papel === 'referencia' ? { fixo: 30 } : c.papel === 'marca' ? { fixo: 22 } : c.papel === 'assinatura' ? { fixo: 26 } : { fixo: 40 };
      var lay = layoutTexto(g, c, t, cx, u, auto);
      var largReal = Math.max.apply(null, lay.linhas.map(medidor(g, c, lay.tamanho)).concat([1]));
      var w = c.papel === 'marca' || c.papel === 'assinatura' ? Math.min(cx.w, largReal + 8 * u) : cx.w;
      var x0 = c.x * W - w / 2, top = c.y * H - lay.altura / 2;
      var ancX = c.alinhar === 'left' ? x0 : c.alinhar === 'right' ? x0 + w : x0 + w / 2;
      var rot2 = (c.rotacao || 0) * Math.PI / 180;
      g.save(); g.translate(c.x * W, c.y * H); g.rotate(rot2); g.translate(-c.x * W, -c.y * H);
      g.globalAlpha = c.opacidade; g.fillStyle = c.cor; g.strokeStyle = c.corContorno; g.lineWidth = (c.contorno || 0) * u * 2; g.lineJoin = 'round';
      aplicarSombra(g, c, u); g.font = fonteCss(c, lay.tamanho);
      desenharLinhas(g, c, lay, ancX, top, medidor(g, c, lay.tamanho));
      g.restore();
      caixas[c.id] = { x: x0, y: top, w: w, h: lay.altura, rot: rot2, px: c.x * W, py: c.y * H };
    });
    g.shadowColor = 'transparent'; g.globalAlpha = 1;

    // converte as caixas para px do canvas
    Object.keys(caixas).forEach(function (k) {
      var b = caixas[k]; if (!b) { delete caixas[k]; return; }
      caixas[k] = { x: b.x * esc, y: b.y * esc, w: b.w * esc, h: b.h * esc, rot: b.rot || 0, px: b.px * esc, py: b.py * esc, textura: !!b.textura };
    });
    // compatibilidade com a v1: "bloco" = caixa do versículo
    return { caixas: caixas, conteudo: cont, escala: esc, spec: spec, bloco: caixas.versiculo || null };
  }

  // Miniatura de um elemento para a biblioteca (prévia real)
  function previaElemento(canvas, e, cor) {
    var n = 112; canvas.width = n; canvas.height = n;
    var g = canvas.getContext('2d'), el = Object.assign({}, A2Arte.camadaElemento(e.forma, e), { x: 0.5, y: 0.5, cor: cor || e.cor });
    if (e.forma === 'textura') { g.fillStyle = '#F4F0E5'; g.fillRect(0, 0, n, n); el.opacidade = Math.max(0.6, el.opacidade); el.cor = e.estilo === 'luz' ? '#E7C98F' : e.estilo === 'vinheta' ? '#192D50' : (cor || '#192D50'); }
    else {
      var w0 = e.w || 0.3, h0 = e.h || 0.2, k = 0.78 / Math.max(w0, h0);
      el.w = w0 * k; el.h = Math.max(h0 * k, e.forma === 'linha' ? 0.02 : 0); el.rotacao = 0;
      if (e.forma === 'ornamento' && e.estilo === 'raios') { el.w = 1.2; el.h = 0.9; el.y = 0.55; }
    }
    desenharElemento(g, el, n, n, n / 540);
  }

  // Exporta a arte (PNG ou JPG) no tamanho real do formato
  async function exportar(spec, opcoes) {
    opcoes = opcoes || {};
    var F = A2Arte.formatoDe(A2Arte.migrar(spec)), c = document.createElement('canvas');
    var largura = Math.min(A2Arte.LIMITE_PX, F.w * (opcoes.escala || 1));
    if (F.h * largura / F.w > A2Arte.LIMITE_PX) largura = A2Arte.LIMITE_PX * F.w / F.h;
    await desenhar(c, spec, Math.round(largura));
    var tipo = opcoes.tipo === 'jpeg' ? 'image/jpeg' : 'image/png';
    return new Promise(function (r) { c.toBlob(r, tipo, opcoes.qualidade || 0.92); });
  }

  root.A2Desenho = { desenhar: desenhar, exportar: exportar, textoDaArte: textoDaArte, previaElemento: previaElemento, desenharElemento: desenharElemento,
    ICONES: Object.keys(ICONES), fonteCss: fonteCss, garantirFonte: garantirFonte, limparCache: function () { cacheFundo = []; } };
})(window);
