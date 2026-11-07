/* ATOS 2 — utilitários de interface: criação de elementos, ícones, logotipo, folhas, avisos. */
(function (root) {
  'use strict';

  // h('div.classe#id', {atributos, on:{click}}, filhos...) — textos entram sempre como texto (nunca HTML)
  function h(sel, attrs) {
    var m = /^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i.exec(sel || 'div') || [];
    var el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, function (_, t, v) { if (t === '.') el.classList.add(v); else el.id = v; });
    var filhos = Array.prototype.slice.call(arguments, 2);
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { filhos.unshift(attrs); attrs = null; }
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'on') Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;               // só para SVG/HTML gerado pelo próprio app
      else if (k in el && typeof v !== 'string' && k !== 'list') el[k] = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    filhos.flat(Infinity).forEach(function (f) {
      if (f == null || f === false) return;
      el.appendChild(f instanceof Node ? f : document.createTextNode(String(f)));
    });
    return el;
  }

  // Ícones (traço 1.7, desenho próprio)
  var P = {
    casa: '<path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>',
    livro: '<path d="M12 6.5C10 5 7.5 4.5 4 4.5V19c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4.5c-3.5 0-6 .5-8 2zM12 6.5V21"/>',
    pincel: '<path d="M14.5 4.5l5 5L10 19l-5 1 1-5zM12.5 6.5l5 5"/>',
    estante: '<path d="M4 4h4v16H4zM10 4h4v16h-4zM15.5 5.2l3.8-1 3.2 15.5-3.8.8z"/>',
    pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6"/>',
    busca: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    coracao: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
    coracaoCheio: '<path fill="currentColor" d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
    marcador: '<path d="M4 20l4-1 10-10-3-3L5 16zM13.5 7.5l3 3"/><path d="M3 21h18" opacity=".5"/>',
    nota: '<path d="M5 4h10l4 4v12H5zM15 4v4h4M8 12h8M8 16h5"/>',
    copiar: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    compartilhar: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
    comparar: '<path d="M4 5h7v14H4zM13 5h7v14h-7z"/><path d="M6.5 9h2M6.5 12h2M15.5 9h2M15.5 12h2"/>',
    imagem: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
    play: '<path fill="currentColor" stroke="none" d="M8 5.5v13l11-6.5z"/>',
    pausa: '<path fill="currentColor" stroke="none" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>',
    ouvir: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3.5" y="14" width="4" height="6" rx="1.5"/><rect x="16.5" y="14" width="4" height="6" rx="1.5"/>',
    ajustes: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    texto: '<path d="M4 18 9 6l5 12M5.8 14h6.4M15 18l3-7 3 7M15.8 16h4.4"/>',
    esquerda: '<path d="M15 5l-7 7 7 7"/>', direita: '<path d="M9 5l7 7-7 7"/>', baixo: '<path d="M6 9l6 6 6-6"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>', ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', mais: '<path d="M12 5v14M5 12h14"/>',
    mapa: '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6zM9 4v14M15 6v14"/>',
    desfazer: '<path d="M9 7 4.5 11.5 9 16M5 11.5h9.5a5 5 0 0 1 0 10H11"/>', refazer: '<path d="M15 7l4.5 4.5L15 16M19 11.5H9.5a5 5 0 0 0 0 10H13"/>',
    camadas: '<path d="M12 4 3 8.5l9 4.5 9-4.5zM3 12.5l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5"/>', olho: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    olhoOff: '<path d="M4 4l16 16M10 6c.6-.3 1.3-.5 2-.5 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.6 7.6C4 9.4 2.5 12 2.5 12S6 18.5 12 18.5c1.7 0 3.2-.5 4.4-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    cadeado: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>', cadeadoAberto: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 7.7-1.5"/>',
    menu: '<circle cx="12" cy="5.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="18.5" r="1.3" fill="currentColor"/>',
    zoomMais: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.4-4.4M11 8.2v5.6M8.2 11h5.6"/>', zoomMenos: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.4-4.4M8.2 11h5.6"/>',
    subir: '<path d="M12 19V5M6 11l6-6 6 6"/>', descer: '<path d="M12 5v14M6 13l6 6 6-6"/>', forma: '<rect x="3.5" y="3.5" width="9" height="9" rx="1.5"/><circle cx="15.5" cy="15.5" r="5"/>',
    paleta: '<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-1 .8-1.7 1.8-1.7h2.2c2.3 0 3.7-1.7 3.7-3.8 0-4-3.8-7.2-8.5-7.2z"/><circle cx="7.8" cy="11" r="1.1"/><circle cx="10.5" cy="7.5" r="1.1"/><circle cx="15" cy="7.8" r="1.1"/>',
    centralizar: '<path d="M12 3v18M3 12h18"/><rect x="7.5" y="7.5" width="9" height="9" rx="1.5"/>', grade: '<path d="M4 4h16v16H4zM9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16"/>',
    expandir: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', enviarImagem: '<path d="M12 16V4M7 9l5-5 5 5M4 15v4.5h16V15"/>',
    calendario: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    sino: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>',
    baixar: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
    brilho: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    lixo: '<path d="M5 7h14M10 4h4M7 7l1 13h8l1-13M10.5 10.5v6M13.5 10.5v6"/>',
    editar: '<path d="M14.5 5.5l4 4L9 19H5v-4zM12.5 7.5l4 4"/>',
    duplicar: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V5.5a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3"/>',
    lua: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    relogio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    anterior: '<path fill="currentColor" stroke="none" d="M6 5h2v14H6zM19 5.5v13L9.5 12z"/>',
    proximo: '<path fill="currentColor" stroke="none" d="M16 5h2v14h-2zM5 5.5v13L14.5 12z"/>',
    colecao: '<path d="M4 7h16v12H4zM6.5 4h11M8 13h8"/>', historico: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5M12 8v4l3 2"/>',
    estrela: '<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
    nuvem: '<path d="M7 18h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 7 18z"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/>',
    escudo: '<path d="M12 3.5l7 3v5.5c0 4.2-3 7.4-7 8.5-4-1.1-7-4.3-7-8.5V6.5z"/>',
    planos: '<path d="M5 5h14v15H5zM8 3v4M16 3v4M8.5 11.5l2 2 4.5-4.5M8.5 16.5h7"/>',
    chama: '<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.6 3-5.4 3.6-8.9 2.4 1.5 3.4 3.6 3.2 5.6 1-.6 1.6-1.6 1.8-2.9 1.9 1.6 3.4 3.7 3.4 6.2 0 3.2-2.4 5.6-6 5.6z"/>',
    pao: '<path d="M4.5 13.5c-1-3.5 2.5-7 7.5-7s8.5 3.5 7.5 7c-.3 1-1.2 1.5-2 1.5v4H6.5v-4c-.8 0-1.7-.5-2-1.5zM9 10.5v4M12 10v4.5M15 10.5v4"/>',
    cruz: '<path d="M12 3v18M6.5 8.5h11"/>', harpa: '<path d="M6 20V5c5 0 11 4 12 15zM9 8v12M12 10v10M15 13.5V20"/>',
    lampada: '<path d="M4 15c2 0 3-1 5-1h7.5c2 0 3.5-1.5 3.5-3H9c-3 0-5 2-5 4zM13 11c0-2 1-3 1-5 1 1.5 2 3 2 5"/>',
    luz: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    pedra: '<path d="M4 19h16l-2-6-4-1-2-5-4 2-2 5z"/>',
    tabuas: '<path d="M4 20V8a4 4 0 0 1 7.5-2V20zM12.5 20V6A4 4 0 0 1 20 8v12z"/><path d="M6.5 11h3M6.5 14h3M15 11h3M15 14h3"/>',
    coroa: '<path d="M4 17.5 3 7.5l5 4 4-6 4 6 5-4-1 10z"/><path d="M5 20.5h14"/>',
    pergaminho: '<path d="M8 4h11a2 2 0 0 1 0 4h-2v10a2 2 0 0 1-2 2H6a2 2 0 0 1 0-4h2z"/><path d="M8 16V4M11 9h4M11 12.5h4"/>',
    carta: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    pena: '<path d="M20 4c-7 0-12 5-13.5 12.5L5 20M20 4c0 6-3.5 10.5-10 12M13 9.5 9 13.5"/>', globo: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z"/>'
  };
  function icone(nome, extra) {
    var s = h('span.ico', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (P[nome] || P.info) + '</svg>' });
    if (extra) s.classList.add(extra);
    return s;
  }
  function preencherIcones(raiz) {
    (raiz || document).querySelectorAll('[data-ico]').forEach(function (el) { if (!el.firstChild) el.innerHTML = icone(el.dataset.ico).innerHTML; });
  }

  // Logotipo: chama (Atos 2:3) sobre o livro aberto, em dourado, dentro de um selo azul.
  function logo(tam, semFundo) {
    var fundo = semFundo ? '' : '<rect class="lg-fundo" x="2" y="2" width="116" height="116" rx="30" fill="#14284B"/><rect class="lg-borda" x="7" y="7" width="106" height="106" rx="26" fill="none" stroke="#C7A56B" stroke-opacity=".45" stroke-width="1.2"/>';
    return '<svg viewBox="0 0 120 120" width="' + (tam || 120) + '" height="' + (tam || 120) + '" role="img" aria-label="ATOS 2">' + fundo +
      '<defs><linearGradient id="lg-ch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1D9A4"/><stop offset="1" stop-color="#B98E4E"/></linearGradient></defs>' +
      '<path class="lg-chama" d="M60 23c3 9 13 14 13 27 0 8-6 13-13 13s-13-5-13-13c0-7 4-10 6-15 1 4 3 6 6 7-1-7 0-13 1-19z" fill="url(#lg-ch)"/>' +
      '<path class="lg-miolo" d="M60 43c1.5 4 5 6 5 11 0 3.5-2.3 5.6-5 5.6s-5-2.1-5-5.6c0-3 1.6-4.4 2.6-6.6.4 1.6 1.4 2.6 2.4 3 0-2.7-.3-5 0-7.4z" fill="#14284B" fill-opacity=".55"/>' +
      '<path class="lg-livro" d="M22 72c14-4 28-2 38 6 10-8 24-10 38-6v22c-14-4-28-2-38 6-10-8-24-10-38-6z" fill="none" stroke="#E9D3A1" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<path class="lg-livro" d="M60 78v22" stroke="#E9D3A1" stroke-width="3.2" stroke-linecap="round"/></svg>';
  }

  // ---------- avisos ----------
  function aviso(msg, erro) {
    var t = h('div.toast' + (erro ? '.erro' : ''), msg);
    document.getElementById('avisos').appendChild(t);
    setTimeout(function () { t.remove(); }, erro ? 5200 : 2800);
  }

  // ---------- folhas (bottom sheets) ----------
  var pilha = [];
  function folha(titulo, conteudo, opcoes) {
    opcoes = opcoes || {};
    var corpo = h('div.folha' + (opcoes.cheia ? '.cheia' : ''), { role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo });
    var fundo = h('div.fundo-camada', corpo);
    var fechar = function () {
      if (!fundo.isConnected) return;
      fundo.remove(); pilha = pilha.filter(function (x) { return x !== api; });
      if (opcoes.aoFechar) opcoes.aoFechar();
      if (!pilha.length) window.dispatchEvent(new Event('folhas-fechadas'));
    };
    var api = { el: corpo, fechar: fechar, fundo: fundo };
    corpo.appendChild(h('div.pegador'));
    corpo.appendChild(h('div.cab', h('h2', titulo), h('div.esp'), opcoes.acoes || null,
      h('button.bt-ico', { 'aria-label': 'Fechar', on: { click: fechar } }, icone('fechar'))));
    var c = typeof conteudo === 'function' ? conteudo(api) : conteudo;
    if (c) corpo.appendChild(c);
    fundo.addEventListener('click', function (e) { if (e.target === fundo) fechar(); });
    document.getElementById('camadas').appendChild(fundo);
    pilha.push(api);
    setTimeout(function () { var f = corpo.querySelector('input, textarea, select, button:not(.bt-ico)'); if (f && opcoes.foco !== false) f.focus({ preventScroll: true }); else corpo.focus(); }, 30);
    corpo.tabIndex = -1;
    return api;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pilha.length) pilha[pilha.length - 1].fechar(); });
  function fecharTodas() { pilha.slice().forEach(function (f) { f.fechar(); }); }
  // Substitui os filhos ignorando null/false (replaceChildren escreveria "null")
  function trocar(el) { el.replaceChildren.apply(el, Array.prototype.slice.call(arguments, 1).flat(Infinity).filter(function (x) { return x != null && x !== false; })); return el; }
  function temFolha() { return pilha.length > 0; }

  // Confirmação própria (o ambiente bloqueia confirm())
  function confirmar(titulo, texto, rotuloOk, perigo) {
    return new Promise(function (res) {
      var f = folha(titulo, function (api) {
        return h('div.form', h('p', texto), h('div.linha-bts',
          h('button.bt' + (perigo ? '.perigo' : '.pri'), { on: { click: function () { res(true); api.fechar(); } } }, rotuloOk || 'Confirmar'),
          h('button.bt', { on: { click: function () { res(false); api.fechar(); } } }, 'Cancelar')));
      }, { aoFechar: function () { res(false); } });
      return f;
    });
  }
  // Pergunta de texto curta
  function perguntar(titulo, rotulo, valor, opcoes) {
    opcoes = opcoes || {};
    return new Promise(function (res) {
      var entrada = opcoes.multilinha ? h('textarea.entrada', { id: 'perg-' + Date.now(), rows: 5 }) : h('input.entrada', { id: 'perg-' + Date.now(), type: 'text', maxlength: opcoes.max || 120 });
      entrada.value = valor || '';
      var resolvido = false;
      folha(titulo, function (api) {
        var form = h('form.form', { on: { submit: function (e) { e.preventDefault(); resolvido = true; api.fechar(); res(entrada.value.trim()); } } },
          h('label.campo', { for: entrada.id }, h('span', rotulo), entrada),
          h('div.linha-bts', h('button.bt.pri', { type: 'submit' }, opcoes.ok || 'Salvar'), h('button.bt', { type: 'button', on: { click: function () { api.fechar(); } } }, 'Cancelar')));
        return form;
      }, { aoFechar: function () { if (!resolvido) res(null); } });
    });
  }

  // Copiar para a área de transferência (só a partir de um clique)
  function copiar(texto) {
    var ok = function () { aviso('Copiado.'); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texto).then(ok, function () { return copiarAntigo(texto) ? ok() : falha(); });
    } catch (e) { /* segue */ }
    if (copiarAntigo(texto)) ok(); else falha();
    function falha() { aviso('Não foi possível copiar aqui. Selecione o texto e copie manualmente.', true); }
    return Promise.resolve();
  }
  function copiarAntigo(t) {
    try { var ta = h('textarea', { style: { position: 'fixed', opacity: 0 } }); ta.value = t; document.body.appendChild(ta); ta.select(); var r = document.execCommand('copy'); ta.remove(); return r; } catch (e) { return false; }
  }

  // Datas
  function hoje() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function agoraHora() { var d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function dataLonga(iso) { var p = iso.split('-'); return +p[2] + ' de ' + MESES[+p[1] - 1] + (p[0] !== hoje().slice(0, 4) ? ' de ' + p[0] : ''); }
  function dataCurta(iso) { var p = String(iso).slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function uid() { return (crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2))).replace(/-/g, '').slice(0, 20); }
  function pct(n) { return (Math.round(n * 10) / 10).toString().replace('.', ',') + '%'; }

  // Texto com palavras acrescentadas em itálico (marcadas entre chaves)
  function textoComItalico(t) {
    var frag = document.createDocumentFragment();
    String(t).split(/(\{[^}]*\})/).forEach(function (p) {
      if (!p) return;
      if (p[0] === '{') frag.appendChild(h('i', p.slice(1, -1))); else frag.appendChild(document.createTextNode(p));
    });
    return frag;
  }
  function plano(t) { return String(t).replace(/[{}]/g, ''); }

  root.App = root.App || {};      // completado em app.js; as telas registram ações antes
  // A IA só existe na prévia do claude.ai (capacidade sample); na versão publicada os botões de IA somem
  Object.defineProperty(root.App, 'temIA', { configurable: true, get: function () { return !!(root.claude && root.claude.use); } });
  root.Telas = root.Telas || {};
  root.UI = { h: h, icone: icone, preencherIcones: preencherIcones, logo: logo, aviso: aviso, folha: folha, fecharTodas: fecharTodas, temFolha: temFolha, trocar: trocar,
    confirmar: confirmar, perguntar: perguntar, copiar: copiar, hoje: hoje, agoraHora: agoraHora, dataLonga: dataLonga, dataCurta: dataCurta,
    uid: uid, pct: pct, textoComItalico: textoComItalico, plano: plano, MESES: MESES };
})(window);
