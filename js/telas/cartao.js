/* ATOS 2 — imagem do cartão "Versículo do dia", no mesmo visual do cartão da tela Início.
   O texto é o da tradução, sem alteração; palavras acrescentadas pelos tradutores saem em itálico. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;

  var COR = { fundo: '#14284B', brilho: 'rgba(233,214,170,', rotulo: '#E2C894', data: '#CBBF9F', texto: '#F4EEE2', ref: '#E9D7AE' };
  var FORMATOS = [
    { id: 'cartao', nome: 'Cartão', w: 1080, h: 0 },          // altura acompanha o texto, como na tela
    { id: 'feed', nome: 'Feed 4:5', w: 1080, h: 1350 },
    { id: 'stories', nome: 'Stories', w: 1080, h: 1920 },
    { id: 'quadrado', nome: 'Quadrado', w: 1080, h: 1080 }
  ];
  var M = 96;                                                    // margem lateral (o cartão da tela usa 20 px em 390)

  // texto com {itálico} → lista de palavras [{t, it}]
  function palavras(versos) {
    var out = [];
    versos.forEach(function (v) {
      String(v.t || '').split(/(\{[^}]*\})/).forEach(function (parte) {
        var it = /^\{.*\}$/.test(parte), txt = it ? parte.slice(1, -1) : parte;
        txt.split(/\s+/).filter(Boolean).forEach(function (w) { out.push({ t: w, it: it }); });
      });
    });
    return out;
  }
  function fonteVerso(tam, it) { return (it ? 'italic ' : '') + '400 ' + tam + 'px "Literata", Georgia, serif'; }
  function quebrar(ctx, ws, tam, largura) {
    var linhas = [], linha = [], x = 0, esp;
    ctx.font = fonteVerso(tam, false); esp = ctx.measureText(' ').width;
    ws.forEach(function (w) {
      ctx.font = fonteVerso(tam, w.it); var lw = ctx.measureText(w.t).width;
      if (linha.length && x + esp + lw > largura) { linhas.push(linha); linha = []; x = 0; }
      if (linha.length) x += esp;
      linha.push({ t: w.t, it: w.it, x: x }); x += lw;
    });
    if (linha.length) linhas.push(linha);
    return linhas;
  }

  async function fontesProntas() {
    if (!document.fonts) return;
    await Promise.race([Promise.all(['400 40px "Literata"', 'italic 400 40px "Literata"', '600 40px "Cormorant Garamond"', '700 40px "Manrope"', '500 40px "Manrope"']
      .map(function (f) { return document.fonts.load(f); })), new Promise(function (r) { setTimeout(r, 2500); })]);
  }
  var logoImg = null;
  function logo() {
    if (!logoImg) logoImg = new Promise(function (res) {
      var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); };
      i.src = URL.createObjectURL(new Blob([UI.logo(120).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')], { type: 'image/svg+xml' }));
    });
    return logoImg;
  }

  // dados: { versos:[{t}], ref:'Romanos 5:8', sigla:'ONBV', data:'3 de novembro' }
  async function desenhar(canvas, dados, formatoId, larguraPx) {
    var F = FORMATOS.filter(function (f) { return f.id === formatoId; })[0] || FORMATOS[0];
    await fontesProntas();
    var marca = await logo();
    var W = F.w, larg = W - 2 * M, ws = palavras(dados.versos);
    var medidor = document.createElement('canvas').getContext('2d');
    var topoTxt = 236, rodape = 150;                              // cabeçalho e marca
    // tamanho do versículo: no cartão segue a proporção da tela; nos formatos fixos, o maior que couber
    var tam = 58, linhas, altTexto;
    function medir(t) { linhas = quebrar(medidor, ws, t, larg); altTexto = linhas.length * t * 1.5; }
    var H = F.h;
    if (!H) { tam = ws.length > 70 ? 50 : 58; medir(tam); H = topoTxt + altTexto + 40 + 60 + rodape; }
    else {
      var area = H - topoTxt - rodape - 120;
      for (tam = 78; tam > 34; tam -= 2) { medir(tam); if (altTexto <= area) break; }
    }
    var esc = (larguraPx || W) / W;
    canvas.width = Math.round(W * esc); canvas.height = Math.round(H * esc);
    var ctx = canvas.getContext('2d'); ctx.setTransform(esc, 0, 0, esc, 0, 0);

    // fundo como o cartão: azul com brilho dourado no canto superior direito
    ctx.fillStyle = COR.fundo; ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(W - 120, 120, 0, W - 120, 120, 640);
    g.addColorStop(0, COR.brilho + '0.24)'); g.addColorStop(0.45, COR.brilho + '0.08)'); g.addColorStop(1, COR.brilho + '0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // cabeçalho
    ctx.textBaseline = 'alphabetic';
    ctx.font = '700 34px "Manrope", sans-serif'; ctx.fillStyle = COR.rotulo; ctx.textAlign = 'left';
    try { ctx.letterSpacing = '5px'; } catch (e) {}
    ctx.fillText('VERSÍCULO DO DIA', M, 150);
    try { ctx.letterSpacing = '0px'; } catch (e) {}
    ctx.font = '500 34px "Manrope", sans-serif'; ctx.fillStyle = COR.data; ctx.textAlign = 'right';
    ctx.fillText(dados.data || '', W - M, 150);

    // versículo
    var y0 = F.h ? topoTxt + Math.max(0, (H - topoTxt - rodape - (altTexto + 40 + 60)) / 2) : topoTxt;
    ctx.fillStyle = COR.texto; ctx.textAlign = 'left';
    linhas.forEach(function (l, i) {
      var y = y0 + tam * (1.05 + i * 1.5);
      l.forEach(function (w) { ctx.font = fonteVerso(tam, w.it); ctx.fillText(w.t, M + w.x, y); });
    });
    // referência · tradução
    var yRef = y0 + altTexto + 70;
    ctx.font = '600 46px "Cormorant Garamond", Georgia, serif'; ctx.fillStyle = COR.ref;
    try { ctx.letterSpacing = '2px'; } catch (e) {}
    ctx.fillText(dados.ref + ' · ' + dados.sigla, M, yRef);
    try { ctx.letterSpacing = '0px'; } catch (e) {}

    // marca discreta no rodapé
    var yM = H - 74;
    if (marca) ctx.drawImage(marca, M, yM - 44, 56, 56);
    ctx.font = '600 32px "Cormorant Garamond", Georgia, serif'; ctx.fillStyle = COR.ref; ctx.globalAlpha = 0.85;
    try { ctx.letterSpacing = '4px'; } catch (e) {}
    ctx.fillText('ATOS 2', M + (marca ? 74 : 0), yM - 4);
    try { ctx.letterSpacing = '0px'; } catch (e) {}
    ctx.font = 'italic 500 26px "Cormorant Garamond", Georgia, serif'; ctx.fillStyle = COR.data; ctx.textAlign = 'right';
    ctx.fillText('De volta à doutrina dos apóstolos', W - M, yM - 4);
    ctx.globalAlpha = 1;
    return { w: W, h: H };
  }

  function nomeArquivo(dados, fmt) {
    return ('atos2-versiculo-do-dia-' + dados.ref + '-' + fmt).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.png';
  }
  async function gerar(dados, fmt) {
    var c = document.createElement('canvas'); await desenhar(c, dados, fmt);
    return new Promise(function (r) { c.toBlob(r, 'image/png'); });
  }

  // Folha de compartilhamento: prévia, formato, compartilhar a imagem, baixar ou mandar só o texto.
  function abrir(dados, textoCitacao) {
    var fmt = 'cartao';
    UI.folha('Compartilhar versículo do dia', function (api) {
      var cv = h('canvas', { style: { width: '100%', maxWidth: '360px', borderRadius: '14px', justifySelf: 'center', boxShadow: 'var(--sombra)' } });
      function previa() { desenhar(cv, dados, fmt, 720); }
      var chips = h('div.chips', { style: { justifyContent: 'center' } }, FORMATOS.map(function (f) {
        return h('button.chip', { 'aria-pressed': String(f.id === fmt), on: { click: function () { fmt = f.id; chips.querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b === this)); }, this); previa(); } } }, f.nome);
      }));
      previa();
      return h('div.form', cv, chips,
        h('div.linha-bts', { style: { justifyContent: 'center' } },
          h('button.bt.pri', { on: { click: async function () { var b = await gerar(dados, fmt); Telas.criar.compartilharImagem(b, nomeArquivo(dados, fmt), textoCitacao); } } }, ico('compartilhar'), 'Compartilhar imagem'),
          h('button.bt', { on: { click: async function () { var b = await gerar(dados, fmt); Telas.criar.salvarImagem(b, nomeArquivo(dados, fmt), dados.ref); } } }, ico('baixar'), 'Baixar'),
          h('button.bt', { on: { click: function () { api.fechar(); App.compartilhar(textoCitacao, 'Compartilhar versículo'); } } }, ico('copiar'), 'Só o texto')));
    });
  }

  root.A2Cartao = { FORMATOS: FORMATOS, desenhar: desenhar, abrir: abrir };
})(window);
