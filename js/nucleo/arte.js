/*
 * ATOS 2 — Núcleo das artes (funções puras; a medição de texto vem do canvas).
 * Navegador: window.A2Arte · Node: module.exports
 * O texto bíblico é sempre composto pelo editor, por cima do fundo: nunca é escrito por IA.
 *
 * Arte v2 (camadas):
 *   { v: 2, nome, formato, personalizado: {w, h},
 *     conteudo: { tipo: 'versiculo', ref, versao, rotulo } | { tipo: 'livre', texto, legenda },
 *     fundo: { tipo: 'banco'|'cor'|'gradiente'|'imagem'|'ia', ... ajustes, sobreposicao },
 *     camadas: [ texto (papel versiculo|referencia|livre|assinatura|marca) | elemento ] }   // a última camada fica por cima
 */
(function (root) {
  'use strict';

  var FORMATOS = [
    { id: 'feed', nome: 'Feed', descricao: 'Instagram · 4:5', w: 1080, h: 1350 },
    { id: 'quadrado', nome: 'Quadrado', descricao: 'Feed e WhatsApp · 1:1', w: 1080, h: 1080 },
    { id: 'stories', nome: 'Stories', descricao: 'Instagram · 9:16', w: 1080, h: 1920 },
    { id: 'status', nome: 'Status do WhatsApp', descricao: '9:16', w: 1080, h: 1920 },
    { id: 'facebook', nome: 'Facebook (paisagem)', descricao: '1,91:1', w: 1200, h: 630 },
    { id: 'papel-celular', nome: 'Papel de parede do celular', descricao: 'Full HD', w: 1080, h: 1920, papel: true },
    { id: 'papel-pc', nome: 'Papel de parede do computador', descricao: 'Full HD', w: 1920, h: 1080, base: 1080, papel: true },
    { id: 'personalizado', nome: 'Personalizado', descricao: 'Você escolhe', w: 1080, h: 1350, livre: true },
    // formatos antigos (artes salvas antes da v2): continuam abrindo
    { id: 'whatsapp', nome: 'WhatsApp (quadrado)', w: 1080, h: 1080, oculto: true },
    { id: 'facebook-quadrado', nome: 'Facebook (quadrado)', w: 1080, h: 1080, oculto: true }
  ];
  var LIMITE_PX = 4096;

  var FONTES = [
    { fam: 'Cormorant Garamond', nome: 'Cormorant', peso: 600, negrito: 700, italico: true },
    { fam: 'Playfair Display', nome: 'Playfair', peso: 500, negrito: 700, italico: true },
    { fam: 'Lora', nome: 'Lora', peso: 400, negrito: 700, italico: true },
    { fam: 'Libre Baskerville', nome: 'Baskerville', peso: 400, negrito: 700, italico: true },
    { fam: 'Literata', nome: 'Literata', peso: 400, negrito: 600, italico: true },
    { fam: 'Cinzel', nome: 'Cinzel', peso: 500, negrito: 700 },
    { fam: 'Manrope', nome: 'Manrope', peso: 500, negrito: 800 },
    { fam: 'Montserrat', nome: 'Montserrat', peso: 500, negrito: 800, italico: true },
    { fam: 'Josefin Sans', nome: 'Josefin', peso: 300, negrito: 600, italico: true },
    { fam: 'Bebas Neue', nome: 'Bebas', peso: 400, negrito: 400 },
    { fam: 'Dancing Script', nome: 'Dancing', peso: 500, negrito: 700 },
    { fam: 'Great Vibes', nome: 'Caligrafia', peso: 400, negrito: 400 }
  ];
  var FONTE_POR_FAM = {};
  FONTES.forEach(function (f) { FONTE_POR_FAM[f.fam] = f; });

  var FORMAS = ['retangulo', 'circulo', 'linha', 'moldura', 'icone', 'ornamento', 'textura'];
  var ICONES = ['cruz', 'coracao', 'estrela', 'sol', 'chama', 'pomba', 'folha', 'coroa', 'peixe', 'ancora', 'livro', 'calice', 'trigo', 'montanha'];
  var ORNAMENTOS = ['divisor', 'ramos', 'aspas', 'raios', 'selo', 'cantos'];
  var TEXTURAS = ['granulado', 'papel', 'linhas', 'pontos', 'vinheta', 'luz'];

  // ---------------------------------------------------------------- utilidades
  function clonar(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function lim(v, a, b) { v = Number(v); if (!isFinite(v)) return a; return Math.max(a, Math.min(b, v)); }
  var seq = 0;
  function uid() { seq = (seq + 1) % 1e6; return 'c' + Date.now().toString(36) + seq.toString(36) + Math.floor(Math.random() * 1296).toString(36); }

  function formato(id) { return FORMATOS.filter(function (f) { return f.id === id; })[0] || FORMATOS[0]; }
  // Dimensões reais da arte (o formato personalizado usa as medidas da própria arte)
  function formatoDe(spec) {
    var f = formato(spec && spec.formato), out = { id: f.id, nome: f.nome, w: f.w, h: f.h, base: f.base || f.w, papel: !!f.papel };
    if (f.livre) {
      var p = (spec && spec.personalizado) || {};
      out.w = Math.round(lim(p.w || 1080, 200, LIMITE_PX)); out.h = Math.round(lim(p.h || 1350, 200, LIMITE_PX));
      out.base = Math.min(out.w, out.h);
    }
    return out;
  }

  // ---------------------------------------------------------------- texto (quebra e ajuste)
  // Quebra o texto em linhas que caibam em "largura". medir(texto) -> largura em px.
  // Respeita quebras de linha digitadas; palavra maior que a largura fica sozinha na linha.
  function quebrar(texto, largura, medir) {
    var linhas = [];
    String(texto || '').split('\n').forEach(function (par) {
      var palavras = par.split(/\s+/).filter(Boolean), atual = '';
      if (!palavras.length) { linhas.push(''); return; }
      palavras.forEach(function (p) {
        var teste = atual ? atual + ' ' + p : p;
        if (!atual || medir(teste) <= largura) atual = teste;
        else { linhas.push(atual); atual = p; }
      });
      linhas.push(atual);
    });
    return linhas;
  }

  // Maior tamanho de fonte (entre min e max) em que o texto cabe na caixa.
  // medirCom(tamanho) -> função medir para aquele tamanho. entrelinha: fator (ex.: 1.35)
  function ajustar(texto, caixa, medirCom, opcoes) {
    opcoes = opcoes || {};
    var min = opcoes.min || 18, max = opcoes.max || 120, ent = opcoes.entrelinha || 1.35;
    var melhor = { tamanho: min, linhas: quebrar(texto, caixa.w, medirCom(min)) };
    var lo = min, hi = max;
    while (lo <= hi) {
      var mid = Math.floor((lo + hi) / 2), med = medirCom(mid), l = quebrar(texto, caixa.w, med);
      var larguraOk = l.every(function (x) { return med(x) <= caixa.w; });
      if (larguraOk && l.length * mid * ent <= caixa.h) { melhor = { tamanho: mid, linhas: l }; lo = mid + 1; }
      else hi = mid - 1;
    }
    melhor.altura = melhor.linhas.length * melhor.tamanho * ent;
    return melhor;
  }

  // Texto do versículo para a arte: sem chaves de itálico, sem alterar palavras.
  function textoParaArte(versiculos) { return versiculos.map(function (t) { return String(t).replace(/[{}]/g, ''); }).join(' '); }

  // Remove de um SVG gerado por IA tudo que possa conter letras ou código (texto, scripts, links, imagens externas).
  function limparSvg(svg) {
    var s = String(svg || '');
    var m = /<svg[\s\S]*<\/svg>/i.exec(s);
    if (!m) return null;
    s = m[0]
      .replace(/<(text|tspan|textPath|script|foreignObject|style|a|image|use|title|desc|metadata)\b[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<(text|tspan|textPath|script|foreignObject|style|a|image|use|title|desc|metadata)\b[^>]*\/>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '')
      .replace(/(href|xlink:href)\s*=\s*("[^"]*"|'[^']*')/gi, '')
      .replace(/url\(\s*['"]?(?!#)[^)]*\)/gi, 'none');
    if (/<(text|script|foreignObject)\b/i.test(s)) return null;
    if (!/\sxmlns=/.test(s)) s = s.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    return s;
  }

  // ---------------------------------------------------------------- camadas
  var PADRAO_TEXTO = {
    tipo: 'texto', texto: '', x: 0.5, y: 0.5, largura: 0.8, altura: 0.6, tamanho: 0, tamanhoMax: 0,
    fonte: 'Cormorant Garamond', peso: 0, negrito: false, italico: false, cor: '#FFFFFF', alinhar: 'center',
    espacamento: 0, entrelinha: 1.3, maiusculas: false, aspas: false, sombra: 0.5, contorno: 0, corContorno: '#000000',
    opacidade: 1, rotacao: 0, visivel: true, bloqueado: false, ancora: null, mostrarVersao: true
  };
  var POR_PAPEL = {
    versiculo: { id: 'versiculo', y: 0.47, aspas: true },
    referencia: { id: 'referencia', fonte: 'Manrope', peso: 600, espacamento: 0.12, maiusculas: true, opacidade: 0.92, ancora: 'versiculo', largura: 0.8, altura: 0.1 },
    livre: { fonte: 'Manrope', tamanho: 40, largura: 0.7, altura: 0.2, y: 0.2, sombra: 0 },
    assinatura: { fonte: 'Manrope', tamanho: 26, largura: 0.8, altura: 0.06, y: 0.955, opacidade: 0.85, sombra: 0 },
    marca: { fonte: 'Cormorant Garamond', negrito: true, texto: 'ATOS 2', tamanho: 22, espacamento: 0.18, largura: 0.2, altura: 0.04, x: 0.88, y: 0.965, opacidade: 0.7, sombra: 0 }
  };
  var PADRAO_ELEMENTO = {
    tipo: 'elemento', forma: 'retangulo', nome: '', icone: 'cruz', estilo: '', x: 0.5, y: 0.5, w: 0.3, h: 0.2,
    cor: '#A58A57', opacidade: 1, rotacao: 0, espessura: 4, raio: 0, preenchido: true, visivel: true, bloqueado: false
  };

  function camadaTexto(papel, o) {
    var base = Object.assign({}, PADRAO_TEXTO, POR_PAPEL[papel] || POR_PAPEL.livre, { papel: papel }, o || {});
    if (!base.id || ((papel !== 'versiculo' && papel !== 'referencia') && (base.id === 'versiculo' || base.id === 'referencia'))) base.id = uid();
    if (papel === 'versiculo') base.id = 'versiculo';
    if (papel === 'referencia') base.id = 'referencia';
    return base;
  }
  function camadaElemento(forma, o) {
    var e = Object.assign({}, PADRAO_ELEMENTO, { forma: forma }, o || {});
    if (!e.id || e.id === 'versiculo' || e.id === 'referencia') e.id = uid();
    if (forma === 'textura') { e.x = 0.5; e.y = 0.5; if (o == null || o.w == null) e.w = 1; if (o == null || o.h == null) e.h = 1; }
    return e;
  }
  function normalizarCamada(c) {
    if (!c) return null;
    if (c.tipo === 'elemento') { if (FORMAS.indexOf(c.forma) < 0) return null; return camadaElemento(c.forma, c); }
    var papel = POR_PAPEL[c.papel] ? c.papel : 'livre';
    return camadaTexto(papel, c);
  }

  function fundoPadrao() {
    return { tipo: 'cor', cor: '#192D50', cores: ['#192D50', '#0E1830'], angulo: 180, radial: false, id: 'pier', imagem: null,
      desfoque: 0, brilho: 1, contraste: 1, saturacao: 1, opacidade: 1, zoom: 1, dx: 0, dy: 0, base: '#192D50',
      sobreposicao: { cor: '#000000', opacidade: 0, estilo: 'uniforme' } };
  }
  function normalizarFundo(f) {
    var out = Object.assign(fundoPadrao(), clonar(f) || {});
    out.sobreposicao = Object.assign(fundoPadrao().sobreposicao, (f && f.sobreposicao) || {});
    if (['banco', 'cor', 'gradiente', 'imagem', 'ia'].indexOf(out.tipo) < 0) out.tipo = 'cor';
    if (out.tipo === 'ia' && !out.svg) out.tipo = 'cor';
    if (!Array.isArray(out.cores) || out.cores.length < 2) out.cores = ['#192D50', '#0E1830'];
    return out;
  }

  function normalizar(spec) {
    var s = clonar(spec) || {};
    s.v = 2;
    s.nome = s.nome || '';
    if (s.formato === 'whatsapp' || s.formato === 'facebook-quadrado') s.formato = 'quadrado';
    if (!FORMATOS.some(function (f) { return f.id === s.formato; })) s.formato = 'feed';
    s.personalizado = { w: Math.round(lim((s.personalizado || {}).w || 1080, 200, LIMITE_PX)), h: Math.round(lim((s.personalizado || {}).h || 1350, 200, LIMITE_PX)) };
    var c = s.conteudo || {};
    s.conteudo = c.tipo === 'livre' ? { tipo: 'livre', texto: c.texto || '', legenda: c.legenda || '' }
      : { tipo: 'versiculo', ref: c.ref || 'At 2:42', versao: c.versao || 'blivre', rotulo: c.rotulo || '' };
    s.fundo = normalizarFundo(s.fundo);
    var camadas = (Array.isArray(s.camadas) ? s.camadas : []).map(normalizarCamada).filter(Boolean);
    // exatamente uma camada de versículo e no máximo uma de referência
    var vistos = {};
    camadas = camadas.filter(function (x) {
      if (x.papel === 'versiculo' || x.papel === 'referencia') { if (vistos[x.papel]) return false; vistos[x.papel] = true; }
      return true;
    });
    var ids = {};
    camadas.forEach(function (x) { if (ids[x.id]) x.id = uid(); ids[x.id] = true; });
    if (!vistos.versiculo) camadas.push(camadaTexto('versiculo'));
    s.camadas = camadas;
    return s;
  }

  // Converte artes da v1 (um bloco de texto + estilo) para camadas, mantendo a aparência.
  function migrar(spec) {
    var s = clonar(spec) || {};
    if (s.v === 2) return normalizar(s);
    var est = Object.assign({ fonte: 'Cormorant Garamond', cor: '#FFFFFF', tamanho: 0, alinhar: 'center', maiusculas: false, sombra: true, aspas: true, largura: 0.8, entrelinha: 1.3 }, s.estilo || {});
    var pos = Object.assign({ x: 0.5, y: 0.47 }, s.pos || {});
    var fmt = s.formato || 'feed';
    var sombra = est.sombra ? 0.5 : 0;
    var camadas = [
      camadaTexto('versiculo', { x: pos.x, y: pos.y, largura: est.largura || 0.8, altura: fmt === 'facebook' ? 0.62 : fmt === 'papel-celular' ? 0.48 : 0.6,
        tamanho: est.tamanho || 0, fonte: FONTE_POR_FAM[est.fonte] ? est.fonte : 'Cormorant Garamond', cor: est.cor, alinhar: est.alinhar, maiusculas: !!est.maiusculas,
        aspas: est.aspas !== false, entrelinha: est.entrelinha || 1.3, sombra: sombra }),
      camadaTexto('referencia', { cor: est.cor, alinhar: est.alinhar, sombra: sombra, visivel: !s.referencia || s.referencia.mostrar !== false })
    ];
    if (s.assinatura && s.assinatura.texto) camadas.push(camadaTexto('assinatura', { texto: s.assinatura.texto, cor: est.cor, visivel: !!s.assinatura.mostrar }));
    if (s.marca) camadas.push(camadaTexto('marca', { cor: est.cor }));
    var f = s.fundo || { tipo: 'banco', id: 'pier' };
    var fundo = f.tipo === 'ia' && f.svg ? { tipo: 'ia', svg: f.svg, descricao: f.descricao || '' } : { tipo: 'banco', id: f.id || 'pier' };
    fundo.sobreposicao = { cor: '#000000', opacidade: s.escurecer != null ? lim(s.escurecer, 0, 0.9) : 0.25, estilo: 'uniforme' };
    return normalizar({ v: 2, nome: s.nome || '', formato: fmt, conteudo: s.conteudo, fundo: fundo, camadas: camadas });
  }

  function specPadrao(versao) {
    return normalizar({ formato: 'feed', conteudo: { tipo: 'versiculo', ref: 'At 2:42', versao: versao || 'blivre' },
      fundo: { tipo: 'banco', id: 'pier', sobreposicao: { cor: '#000000', opacidade: 0.25, estilo: 'uniforme' } },
      camadas: [camadaTexto('versiculo'), camadaTexto('referencia')] });
  }

  // Aplica um modelo (fundo e camadas) mantendo o conteúdo, o formato e o nome da arte.
  function aplicarModelo(spec, modelo) {
    var s = normalizar(spec), m = clonar(modelo) || {};
    var livres = s.camadas.filter(function (c) { return c.papel === 'livre' && c.texto && c.manter; });
    s.fundo = normalizarFundo(m.fundo);
    s.camadas = (m.camadas || []).map(function (c) { var x = clonar(c); if (x.papel !== 'versiculo' && x.papel !== 'referencia') x.id = null; return x; }).concat(livres);
    s.modelo = m.id || null;
    return normalizar(s);
  }

  function indice(camadas, id) { for (var i = 0; i < camadas.length; i++) if (camadas[i].id === id) return i; return -1; }
  // delta +1 = sobe (fica mais por cima)
  function moverCamada(camadas, id, delta) {
    var a = camadas.slice(), i = indice(a, id), j = i + delta;
    if (i < 0 || j < 0 || j >= a.length) return a;
    var x = a[i]; a[i] = a[j]; a[j] = x; return a;
  }
  function duplicarCamada(camadas, id) {
    var a = camadas.slice(), i = indice(a, id);
    if (i < 0 || a[i].papel === 'versiculo' || a[i].papel === 'referencia') return { camadas: a, id: null };
    var c = clonar(a[i]); c.id = uid(); c.bloqueado = false;
    if (c.forma !== 'textura') { c.x = lim(c.x + 0.04, 0, 1); c.y = lim(c.y + 0.04, 0, 1); }
    a.splice(i + 1, 0, c);
    return { camadas: a, id: c.id };
  }
  function removerCamada(camadas, id) {
    return camadas.filter(function (c) { return c.id !== id || c.papel === 'versiculo'; });
  }

  // ---------------------------------------------------------------- histórico (desfazer/refazer)
  function Historico(limite) {
    limite = limite || 60;
    var pilha = [], i = -1;
    return {
      registrar: function (estado) {
        if (pilha[i] === estado) return false;
        pilha = pilha.slice(0, i + 1); pilha.push(estado);
        if (pilha.length > limite) pilha.shift();
        i = pilha.length - 1; return true;
      },
      desfazer: function () { if (i > 0) { i--; return pilha[i]; } return null; },
      refazer: function () { if (i < pilha.length - 1) { i++; return pilha[i]; } return null; },
      podeDesfazer: function () { return i > 0; },
      podeRefazer: function () { return i < pilha.length - 1; },
      tamanho: function () { return pilha.length; }
    };
  }

  // ---------------------------------------------------------------- cores
  function hexValido(s) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(s || '').trim());
    if (!m) return null;
    var h = m[1].length === 3 ? m[1].split('').map(function (c) { return c + c; }).join('') : m[1];
    return '#' + h.toUpperCase();
  }
  function hexParaRgb(hex) { var h = (hexValido(hex) || '#000000').slice(1); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function rgbParaHex(r, g, b) { return '#' + [r, g, b].map(function (v) { var x = Math.round(lim(v, 0, 255)).toString(16); return x.length < 2 ? '0' + x : x; }).join('').toUpperCase(); }
  function hexParaHsl(hex) {
    var c = hexParaRgb(hex), r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, h = 0, s = 0, d = max - min;
    if (d) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function hslParaHex(h, s, l) {
    h = ((h % 360) + 360) % 360; s = lim(s, 0, 1); l = lim(l, 0, 1);
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return rgbParaHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }
  function luminancia(hex) {
    var c = hexParaRgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contraste(a, b) { var la = luminancia(a), lb = luminancia(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
  function corLegivel(fundo, opcoes) {
    opcoes = opcoes || ['#FFFFFF', '#192D50', '#1B1B1B'];
    return opcoes.slice().sort(function (x, y) { return contraste(fundo, y) - contraste(fundo, x); })[0];
  }
  // Paletas geradas a partir de uma cor (teoria das cores)
  function harmonias(hex) {
    var b = hexValido(hex) || '#192D50', hsl = hexParaHsl(b), h = hsl[0], s = Math.max(hsl[1], 0.25), l = hsl[2];
    var lm = lim(l, 0.25, 0.7);
    return [
      { id: 'analogas', nome: 'Análogas', cores: [hslParaHex(h - 30, s, lm), b, hslParaHex(h + 30, s, lm), hslParaHex(h, s * 0.4, 0.94)] },
      { id: 'complementar', nome: 'Complementar', cores: [b, hslParaHex(h, s, lim(l + 0.25, 0, 0.92)), hslParaHex(h + 180, s, lm), hslParaHex(h + 180, s * 0.4, 0.93)] },
      { id: 'triade', nome: 'Tríade', cores: [b, hslParaHex(h + 120, s, lm), hslParaHex(h + 240, s, lm), hslParaHex(h, s * 0.3, 0.95)] },
      { id: 'monocromatica', nome: 'Monocromática', cores: [hslParaHex(h, s, 0.18), hslParaHex(h, s, 0.38), hslParaHex(h, s, 0.62), hslParaHex(h, s * 0.6, 0.9)] }
    ];
  }

  // Paletas harmonizadas prontas: fundo, texto, destaque, apoio
  var PALETAS = [
    { id: 'atos2', nome: 'Atos 2', fundo: '#192D50', texto: '#F4F0E5', destaque: '#A58A57', apoio: '#23395F' },
    { id: 'pergaminho', nome: 'Pergaminho', fundo: '#F4F0E5', texto: '#192D50', destaque: '#A58A57', apoio: '#E6DCC6' },
    { id: 'amanhecer', nome: 'Amanhecer', fundo: '#F7E3C9', texto: '#5A3420', destaque: '#D9822B', apoio: '#F2C38F' },
    { id: 'oliveira', nome: 'Oliveira', fundo: '#3E4A2F', texto: '#F1EEDC', destaque: '#C9B26B', apoio: '#56643F' },
    { id: 'galileia', nome: 'Mar da Galileia', fundo: '#0F4C5C', texto: '#F2F7F5', destaque: '#8FC1B5', apoio: '#1B6B7D' },
    { id: 'deserto', nome: 'Deserto', fundo: '#C8A27A', texto: '#2E1F14', destaque: '#F7EBDD', apoio: '#B08660' },
    { id: 'lavanda', nome: 'Lavanda', fundo: '#E7E1F2', texto: '#3B2E5A', destaque: '#8C6BB1', apoio: '#D3C8EA' },
    { id: 'noite', nome: 'Noite santa', fundo: '#0E1424', texto: '#F2E6C9', destaque: '#C9A45C', apoio: '#1C2640' },
    { id: 'rosa', nome: 'Rosa antigo', fundo: '#F3DDD8', texto: '#5B2C2F', destaque: '#B5646B', apoio: '#E7C3BC' },
    { id: 'floresta', nome: 'Floresta', fundo: '#1F3B2D', texto: '#EAF2E3', destaque: '#9CC08A', apoio: '#2E5640' },
    { id: 'vinho', nome: 'Vinho', fundo: '#4A1C2A', texto: '#F6E7DA', destaque: '#D4A373', apoio: '#632637' },
    { id: 'ceu', nome: 'Céu', fundo: '#DCEBF7', texto: '#17324D', destaque: '#3C7DBF', apoio: '#B9D6EE' }
  ];

  // Aplica uma paleta à arte inteira: fundo sólido/degradê, textos e elementos (texturas ficam como estão).
  function aplicarPaleta(spec, p) {
    var s = normalizar(spec), foto = s.fundo.tipo === 'banco' || s.fundo.tipo === 'imagem' || s.fundo.tipo === 'ia';
    if (s.fundo.tipo === 'cor') s.fundo.cor = p.fundo;
    if (s.fundo.tipo === 'gradiente') s.fundo.cores = [p.fundo, p.apoio];
    var corTexto = foto ? (luminancia(p.texto) > 0.5 ? p.texto : '#FFFFFF') : p.texto;
    s.camadas.forEach(function (c) {
      if (c.tipo === 'texto') c.cor = c.papel === 'versiculo' || c.papel === 'livre' ? corTexto : (foto && luminancia(p.destaque) < 0.3 ? corTexto : p.destaque);
      else if (c.forma !== 'textura') c.cor = c.forma === 'retangulo' && c.w >= 0.9 ? p.apoio : p.destaque;
    });
    s.paleta = p.id;
    return s;
  }

  // ---------------------------------------------------------------- desenho sugerido pela IA
  // A IA só sugere a composição (fundo, fontes, cores, elementos). Nenhum texto dela entra na arte.
  function validarDesenhoIA(obj, fotosPermitidas) {
    if (!obj || typeof obj !== 'object') return null;
    var fotos = fotosPermitidas || [];
    var f = obj.fundo || {}, fundo;
    if (f.tipo === 'foto' && fotos.indexOf(f.foto) >= 0) fundo = { tipo: 'banco', id: f.foto };
    else if (f.tipo === 'cor' && hexValido(f.cor)) fundo = { tipo: 'cor', cor: hexValido(f.cor) };
    else {
      var cores = (Array.isArray(f.cores) ? f.cores : []).map(hexValido).filter(Boolean).slice(0, 3);
      if (cores.length < 2) cores = ['#192D50', '#0E1830'];
      fundo = { tipo: 'gradiente', cores: cores, angulo: Math.round(lim(f.angulo == null ? 180 : f.angulo, 0, 360)), radial: !!f.radial };
    }
    fundo.sobreposicao = { cor: '#000000', opacidade: lim(f.sobreposicao == null ? (fundo.tipo === 'banco' ? 0.3 : 0) : f.sobreposicao, 0, 0.8), estilo: 'uniforme' };
    var corFundo = fundo.tipo === 'cor' ? fundo.cor : fundo.tipo === 'gradiente' ? fundo.cores[0] : '#333333';
    var t = obj.texto || {}, r = obj.referencia || {};
    var fonte = FONTE_POR_FAM[t.fonte] ? t.fonte : 'Cormorant Garamond';
    var corT = hexValido(t.cor) || corLegivel(corFundo);
    if (fundo.tipo !== 'banco' && contraste(corT, corFundo) < 3) corT = corLegivel(corFundo);
    var alinhar = ['left', 'center', 'right'].indexOf(t.alinhar) >= 0 ? t.alinhar : 'center';
    var camadas = [
      { papel: 'versiculo', fonte: fonte, cor: corT, alinhar: alinhar, y: lim(t.y == null ? 0.47 : t.y, 0.2, 0.8),
        maiusculas: !!t.maiusculas, italico: !!t.italico, negrito: !!t.negrito, sombra: fundo.tipo === 'banco' ? 0.5 : 0, largura: alinhar === 'center' ? 0.8 : 0.76 },
      { papel: 'referencia', cor: hexValido(r.cor) || corT, alinhar: alinhar, sombra: fundo.tipo === 'banco' ? 0.5 : 0 }
    ];
    var els = (Array.isArray(obj.elementos) ? obj.elementos : []).slice(0, 6).map(function (e) {
      if (!e || FORMAS.indexOf(e.forma) < 0) return null;
      var o = { tipo: 'elemento', forma: e.forma, x: lim(e.x == null ? 0.5 : e.x, -0.2, 1.2), y: lim(e.y == null ? 0.5 : e.y, -0.2, 1.2),
        w: lim(e.w == null ? 0.2 : e.w, 0.02, 1.2), h: lim(e.h == null ? 0.1 : e.h, 0.004, 1.2), cor: hexValido(e.cor) || '#A58A57', opacidade: lim(e.opacidade == null ? 1 : e.opacidade, 0.05, 1) };
      if (e.forma === 'icone') { if (ICONES.indexOf(e.icone) < 0) return null; o.icone = e.icone; }
      if (e.forma === 'ornamento') { if (ORNAMENTOS.indexOf(e.estilo) < 0) return null; o.estilo = e.estilo; }
      if (e.forma === 'textura') { if (TEXTURAS.indexOf(e.estilo) < 0) return null; o.estilo = e.estilo; o.x = 0.5; o.y = 0.5; o.w = 1; o.h = 1; o.opacidade = lim(o.opacidade, 0.05, 0.7); }
      if (e.forma === 'moldura' || e.forma === 'linha') o.espessura = lim(e.espessura == null ? 3 : e.espessura, 1, 14);
      return o;
    }).filter(Boolean);
    // texturas ficam atrás do texto; demais elementos também (o versículo sempre por cima)
    return { nome: String(obj.nome || 'Criada com IA').replace(/[<>]/g, '').slice(0, 40), fundo: fundo, camadas: els.concat(camadas) };
  }
  // Extrai o primeiro objeto JSON de uma resposta de texto
  function lerJson(txt) {
    var s = String(txt || ''), i = s.indexOf('{'), j = s.lastIndexOf('}');
    if (i < 0 || j <= i) return null;
    try { return JSON.parse(s.slice(i, j + 1)); } catch (e) { return null; }
  }

  // Licença das fotos da biblioteca: a foto não pode sair sem nenhum texto por cima.
  // cont: { texto, refBase } — o texto principal e a referência/legenda já resolvidos
  function temTextoVisivel(spec, cont) {
    cont = cont || {};
    return (spec.camadas || []).some(function (c) {
      if (c.tipo !== 'texto' || c.visivel === false || c.opacidade < 0.05) return false;
      if (c.papel === 'versiculo') return !!String(cont.texto || '').trim();
      if (c.papel === 'referencia') return !!String(cont.refBase || '').trim();
      if (c.papel === 'marca') return true;
      return !!String(c.texto || '').trim();
    });
  }

  var API = { FORMATOS: FORMATOS, FONTES: FONTES, FONTE_POR_FAM: FONTE_POR_FAM, FORMAS: FORMAS, ICONES: ICONES, ORNAMENTOS: ORNAMENTOS, TEXTURAS: TEXTURAS, PALETAS: PALETAS, LIMITE_PX: LIMITE_PX,
    formato: formato, formatoDe: formatoDe, quebrar: quebrar, ajustar: ajustar, textoParaArte: textoParaArte, limparSvg: limparSvg,
    clonar: clonar, uid: uid, camadaTexto: camadaTexto, camadaElemento: camadaElemento, fundoPadrao: fundoPadrao, normalizar: normalizar, migrar: migrar, specPadrao: specPadrao,
    aplicarModelo: aplicarModelo, moverCamada: moverCamada, duplicarCamada: duplicarCamada, removerCamada: removerCamada, Historico: Historico,
    hexValido: hexValido, hexParaRgb: hexParaRgb, rgbParaHex: rgbParaHex, hexParaHsl: hexParaHsl, hslParaHex: hslParaHex, luminancia: luminancia, contraste: contraste, corLegivel: corLegivel, harmonias: harmonias,
    aplicarPaleta: aplicarPaleta, validarDesenhoIA: validarDesenhoIA, lerJson: lerJson, temTextoVisivel: temTextoVisivel };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Arte = API;
})(typeof window !== 'undefined' ? window : this);
