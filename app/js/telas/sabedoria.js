/* ATOS 2 — Jornada da Sabedoria: emblemas, medalhas, progresso, tela de novo nível e painel completo.
 * Window.Jornada guarda o estado: com conta (Supabase) o servidor calcula os pontos; sem conta ou na prévia,
 * o aparelho calcula com as mesmas regras (A2Sabedoria) e as rodadas ficam numa fila para enviar quando houver conta. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone, J = A2Sabedoria;

  // ====================================================================== EMBLEMAS (desenho próprio, traço fino)
  var GLIFOS = {
    lampada: '<path d="M18 36h22c-1.5 4-5 6-10 6h-3c-5 0-8-2.5-9-6z"/><path d="M40 36l5-3.2"/><path d="M18 36c-3 0-4.2-3-1.8-4.6"/><path d="M26 42v3h6v-3"/><path d="M45.2 31.2c-2.2-1.9-1.9-4.7.3-7.2.6 2.4 2.8 3.6 1.6 5.8-.5 1-1.1 1.4-1.9 1.4z"/>',
    pergaminho: '<path d="M23 24.5h18v15H23z"/><path d="M21 22a2.5 2.5 0 0 1 2.5-2.5h17a2.5 2.5 0 0 1 0 5h-17A2.5 2.5 0 0 1 21 22z"/><path d="M21 42a2.5 2.5 0 0 1 2.5-2.5h17a2.5 2.5 0 0 1 0 5h-17A2.5 2.5 0 0 1 21 42z"/><path d="M27 29h10M27 33h10M27 36.5h6"/>',
    livro: '<path d="M32 25c-4-3-9-3.5-13-2.5v18c4-1 9-.5 13 2.5 4-3 9-3.5 13-2.5v-18c-4-1-9-.5-13 2.5z"/><path d="M32 25v18"/><path d="M38 23.4v7l2-1.5 2 1.5v-7.5"/>',
    oliveira: '<path d="M21 45c4-6 10.5-14.5 21-23"/><path d="M27 37.5c-3-1-5-3-5-6 3 0 5 2 5 6z"/><path d="M31.5 32.5c-3-1-5-3-5-6 3 0 5 2 5 6z"/><path d="M36 27.6c-2.5-1.3-4-3.4-3.8-6.2 2.8.3 4.3 2.6 3.8 6.2z"/><path d="M29.4 38c1-3 3-4.8 6-5 0 3-2.2 4.8-6 5z"/><path d="M34 33c1-3 3-4.8 6-5 0 3-2.2 4.8-6 5z"/><circle cx="40.5" cy="36" r="1.6"/>',
    pomba: '<path d="M17 37.5c6 .5 11-1 15-5l5-5c1.5-1.6 3.6-2 5.4-1.3l3.6 1.6-3.4 1c-.6 3.6-3 7-6.6 9.2-4 2.4-9.4 3-14 2.2z"/><path d="M30.5 32c-2.4-4.8-2-9.6 1.2-13.4 2.6 2.8 4 6.4 3.6 10.6"/><path d="M27 33.6c-3.6-2.8-5.4-6.6-5-10.6 3.2 1.2 5.8 3.8 7 7.4"/><path d="M17 37.5l-3.6 2.2 4.6.6"/><path d="M41.8 27.6h.01"/>',
    tabuas: '<path d="M20.5 44V25.5a5 5 0 0 1 10 0V44z"/><path d="M33.5 44V25.5a5 5 0 0 1 10 0V44z"/><path d="M23.5 30h4M23.5 34h4M23.5 38h4M36.5 30h4M36.5 34h4M36.5 38h4"/>',
    cajado: '<path d="M30.5 46V25.5c0-5 3-8.2 7-8.2s6.2 3 6.2 6.2-2 5.2-4.2 5.2"/><path d="M24.5 46h12"/><path d="M30.5 33c-3-.4-5.2-2.4-5.6-5.4 3 .2 5.1 2.2 5.6 5.4z"/>',
    coroa: '<path d="M20 40.5l-1.2-14 7 6 6.2-10.2 6.2 10.2 7-6-1.2 14z"/><path d="M20 44.2h24"/><path d="M32 34.6h.01M26.2 37.2h.01M37.8 37.2h.01"/>'
  };
  function camada(n) { return n <= 2 ? 1 : n <= 4 ? 2 : n <= 6 ? 3 : 4; }
  /** SVG do emblema do nível n (1–8). A moldura evolui: areia → azul → aro duplo → coroa de louros dourada. */
  function emblema(n, tam, bloqueado) {
    var nv = J.nivel(n), t = camada(nv.n), uid = 'em' + nv.n + (bloqueado ? 'b' : '') + Math.random().toString(36).slice(2, 6);
    var cor = t === 1 ? '#192D50' : t === 4 ? '#EBD7A6' : '#DCC28D', s = '';
    s += '<defs><radialGradient id="' + uid + 'g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#F0DDB0"/><stop offset=".55" stop-color="#C9A86C"/><stop offset="1" stop-color="#93784A"/></radialGradient>' +
      '<radialGradient id="' + uid + 'a" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#22406F"/><stop offset="1" stop-color="#14264A"/></radialGradient></defs>';
    if (t === 1) s += '<circle cx="32" cy="32" r="30" fill="#F4F0E5" stroke="#192D50" stroke-width="1.6"/><circle cx="32" cy="32" r="26.2" fill="none" stroke="#A58A57" stroke-width=".8" stroke-dasharray="1.4 2.6"/>';
    if (t === 2) s += '<circle cx="32" cy="32" r="30" fill="url(#' + uid + 'a)" stroke="#A58A57" stroke-width="1.8"/><circle cx="32" cy="32" r="26.2" fill="none" stroke="#A58A57" stroke-opacity=".55" stroke-width=".8"/>';
    if (t === 3) {
      s += '<circle cx="32" cy="32" r="30.2" fill="url(#' + uid + 'a)" stroke="#C9A86C" stroke-width="2.4"/><circle cx="32" cy="32" r="25" fill="none" stroke="#C9A86C" stroke-width="1"/>';
      for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8; s += '<circle cx="' + (32 + 27.6 * Math.cos(a)).toFixed(2) + '" cy="' + (32 + 27.6 * Math.sin(a)).toFixed(2) + '" r=".9" fill="#E3CB98"/>'; }
    }
    if (t === 4) {
      s += '<circle cx="32" cy="32" r="31" fill="url(#' + uid + 'g)"/><circle cx="32" cy="32" r="23.6" fill="url(#' + uid + 'a)" stroke="#F3E3BC" stroke-width="1"/>';
      [-1, 1].forEach(function (lado) {
        for (var k = 0; k < 7; k++) {
          var graus = 162 - k * 19, ang = graus * Math.PI / 180, x = 32 + lado * 27.4 * Math.sin(ang), y = 32 - 27.4 * Math.cos(ang);
          var rot = lado * (graus - 90 + 28);
          s += '<ellipse cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" rx="1.5" ry="3.1" fill="#192D50" fill-opacity=".78" transform="rotate(' + rot.toFixed(1) + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ')"/>';
        }
      });
      s += '<path d="M32 2.8l1.3 2.6 2.8.4-2 2 .5 2.8-2.6-1.4-2.6 1.4.5-2.8-2-2 2.8-.4z" fill="#192D50"/>';
    }
    s += '<g fill="none" stroke="' + cor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + (t >= 3 ? ' transform="translate(32 32) scale(' + (t === 4 ? .84 : .92) + ') translate(-32 -32)"' : '') + '>' + GLIFOS[nv.emblema] + '</g>';
    if (bloqueado) s = '<g filter="url(#' + uid + 'cz)" opacity=".42">' + s + '</g><defs><filter id="' + uid + 'cz"><feColorMatrix type="saturate" values="0"/></filter></defs>' +
      '<g transform="translate(40 40)"><circle cx="10" cy="10" r="10" fill="#FFFFFF" stroke="#E2D8C5"/><path d="M6.5 9.5V8a3.5 3.5 0 0 1 7 0v1.5M5.5 9.5h9v6h-9z" fill="none" stroke="#5A6173" stroke-width="1.5" stroke-linejoin="round"/></g>';
    return '<svg class="emblema" viewBox="0 0 64 64" width="' + (tam || 64) + '" height="' + (tam || 64) + '" role="img" aria-label="Emblema: ' + nv.nome + (bloqueado ? ' (bloqueado)' : '') + '">' + s + '</svg>';
  }
  function emblemaEl(n, tam, bloqueado) { return h('span.emblema-caixa', { html: emblema(n, tam, bloqueado) }); }

  var ICONES_MEDALHA = {
    passo: '<path d="M8.5 15c-1.6 0-2.5-1.8-2.5-4s.9-4.5 2.5-4.5S11 8.8 11 11s-.9 4-2.5 4zM15.5 12c-1.6 0-2.5-1.8-2.5-4s.9-4.5 2.5-4.5S18 5.8 18 8s-.9 4-2.5 4zM7.5 17.5h2M14.5 14.5h2"/>',
    olho: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    livros: '<path d="M4 19h16M5.5 19V8h3.5v11M9 19V5.5h4V19M14.2 19l1.1-10.8 3.7.4-1 10.4"/>',
    chave: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M17.5 12v3M20.5 12v2"/>',
    chama: '<path d="M12 21c-3.5 0-6-2.4-6-5.8 0-3.4 2.6-5 3.6-8.2.9 1.6 1.8 2.5 3 2.8-.3-2.6.4-5 2-6.8.6 3 4.4 5.6 4.4 10.4 0 4-3 7.6-7 7.6z"/>',
    calendario: '<path d="M4 6.5h16v13H4zM4 10.5h16M8 4v4M16 4v4M8 14h2M12 14h2M16 14h.5M8 17h2M12 17h2"/>',
    coroa: '<path d="M4 17l-1-9 5 4 4-6 4 6 5-4-1 9zM4 20h16"/>'
  };
  function medalhaEl(m, tam) {
    var ok = !!m.em;
    return h('span.medalha' + (ok ? '.ganha' : '.bloqueada'), { style: { width: (tam || 52) + 'px', height: (tam || 52) + 'px' }, title: m.nome,
      html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONES_MEDALHA[m.icone] + '</svg>' +
        (ok ? '' : '<i class="medalha-cad" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M6.5 9.5V8a3.5 3.5 0 0 1 7 0v1.5M5.5 9.5h9v6h-9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></i>') });
  }

  // ====================================================================== ESTADO
  var cache = null, especiais = J.ESPECIAIS, ouvintes = [], enviando = null, extrasCarregados = false;
  function ouvir(fn) { ouvintes.push(fn); return function () { ouvintes = ouvintes.filter(function (x) { return x !== fn; }); }; }
  function avisar(o) { ouvintes.slice().forEach(function (fn) { try { fn(o || {}); } catch (e) { console.error(e); } }); }
  function contaNuvem() { return root.A2Nuvem && A2Nuvem.configurado() && Dados.estado.tipo === 'nuvem' && A2Nuvem.conta(); }
  function servidor() { return !!contaNuvem(); }
  function limpar(d) { if (!d) return null; var o = Object.assign({}, d); delete o.id; delete o._t; return o; }
  function estado() {
    if (servidor()) { var c = contaNuvem(); if (!cache || cache._uid !== c.id) cache = Object.assign(J.normalizar(limpar(Dados.obter('_sabedoriaNuvem', c.id))), { _uid: c.id }); return cache; }
    return J.normalizar(limpar(Dados.obter('sabedoria', 'estado')));
  }
  function gravarLocal(e) {
    if (servidor()) { var c = contaNuvem(); cache = Object.assign(e, { _uid: c.id }); Dados.salvar('_sabedoriaNuvem', c.id, e); }
    else Dados.salvar('sabedoria', 'estado', e);
  }
  function fila() { return Dados.todos('_sabedoriaFila').map(limpar).sort(function (a, b) { return a.criadaEm < b.criadaEm ? -1 : 1; }); }
  function transitorio(msg) { return /Sem conexão|fetch|network|Load failed|JWT|timeout|Entre na sua conta|50\d|52\d/i.test(String(msg)); }

  function deServidor(r) { return J.doServidor(r && r.linha, r && r.respostas, r && r.eventos); }

  /** Carrega estado do servidor, desafios configurados e perguntas acrescentadas pela edição. */
  async function carregar() {
    if (!(root.A2Nuvem && A2Nuvem.configurado() && Dados.estado.tipo === 'nuvem')) return estado();
    try {
      var ds = await A2Nuvem.tabela('sabedoria_desafios');
      if (ds && ds.length) especiais = ds.map(function (d) { return { id: d.id, titulo: d.titulo, descricao: d.descricao, pontos: d.pontos, perguntas: d.perguntas, minAcertos: d.min_acertos,
        secoes: d.secoes || null, dificuldadeMin: d.dificuldade_min || null, periodo: d.periodo, ativo: d.ativo, inicio: d.inicio, fim: d.fim }; });
      if (!extrasCarregados && root.A2Quiz) { var ex = await A2Nuvem.tabela('sabedoria_perguntas', { origem: 'editor' }); A2Quiz.carregar((ex || []).map(function (x) { return x.dados; })); extrasCarregados = true; }
    } catch (e) { console.warn('Jornada: configuração do servidor indisponível', e); }
    if (!servidor()) return estado();
    try {
      var r = await A2Nuvem.rpc('sabedoria_estado');
      var srv = deServidor(r), loc = estado();
      if (!fila().length || srv.pontos >= loc.pontos) gravarLocal(srv);
      avisar({ tipo: 'carregado' });
    } catch (e) { console.warn('Jornada: estado do servidor indisponível', e); }
    enviarFila();
    return estado();
  }

  /** Envia as rodadas pendentes ao servidor, uma de cada vez. Devolve { idRodada: resultadoDoServidor }. */
  function enviarFila() {
    if (!servidor()) return Promise.resolve({});
    if (enviando) return enviando;
    enviando = (async function () {
      var res = {};
      for (var item of fila()) {
        try {
          var r = await A2Nuvem.rpc('sabedoria_registrar_rodada', { p_id: item.rodada.id, p_modo: item.rodada.modo, p_especial: item.rodada.especial || null, p_dia: item.rodada.dia, p_respostas: item.rodada.respostas });
          Dados.excluir('_sabedoriaFila', item.rodada.id);
          gravarLocal(deServidor(r.estado));
          res[item.rodada.id] = r;
        } catch (e) {
          var m = e && e.message || String(e);
          if (transitorio(m)) break;
          Dados.excluir('_sabedoriaFila', item.rodada.id);
          res[item.rodada.id] = { erro: m };
          console.warn('Jornada: rodada recusada pelo servidor —', m);
        }
      }
      if (Object.keys(res).length) avisar({ tipo: 'servidor', resultados: res });
      return res;
    })().finally(function () { enviando = null; });
    return enviando;
  }

  function novoId() {
    if (root.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var x = Array.from(b, function (v) { return v.toString(16).padStart(2, '0'); }).join('');
    return x.slice(0, 8) + '-' + x.slice(8, 12) + '-' + x.slice(12, 16) + '-' + x.slice(16, 20) + '-' + x.slice(20);
  }

  /**
   * Registra uma rodada terminada. respostas: [{ p: id, r: texto escolhido }].
   * Devolve a prévia calculada no aparelho e, com conta, `confirmacao` (Promise com o resultado do servidor).
   */
  function registrarRodada(modo, especial, respostas) {
    var rodada = { id: novoId(), modo: modo, especial: especial || null, dia: UI.hoje(), respostas: respostas };
    var antes = estado();
    var r = J.registrar(antes, rodada, { porId: A2Quiz.POR_ID, hoje: UI.hoje(), especiais: especiais });
    r.antes = antes;
    gravarLocal(r.estado);
    Dados.salvar('_sabedoriaFila', rodada.id, { rodada: rodada, criadaEm: new Date().toISOString() });
    var vivos = fila(); if (vivos.length > 200) vivos.slice(0, vivos.length - 200).forEach(function (x) { Dados.excluir('_sabedoriaFila', x.rodada.id); });
    r.servidor = servidor();
    r.confirmacao = r.servidor ? enviarFila().then(function (res) { return res[rodada.id] || null; }) : Promise.resolve(null);
    avisar({ tipo: 'rodada' });
    return r;
  }

  function jaAcertou(id) { var r = estado().respostas[id]; return !!(r && r.a); }
  function perfilSorteio() {
    var e = estado(), lidos = {};
    Dados.todos('historico').forEach(function (doc) { (doc.itens || []).forEach(function (x) { if (x.livro) lidos[x.livro] = 1; }); });
    return { nivel: e.nivel, respostas: e.respostas, livrosLidos: Object.keys(lidos), hoje: UI.hoje() };
  }
  function desafiosAtivos() {
    var hoje = UI.hoje(), e = estado(), d = e.diario[hoje] || { especiais: {} };
    return especiais.filter(function (x) { return x.ativo !== false && (!x.inicio || x.inicio <= hoje) && (!x.fim || x.fim >= hoje); })
      .map(function (x) { return Object.assign({}, x, { feito: x.periodo === 'unico' ? !!e.especiais[x.id] : !!(d.especiais || {})[x.id] }); });
  }
  function totaisPorSecao() {
    if (A2Quiz.BANCO.length) return A2Quiz.resumo().secoes;
    return (A2Quiz.INDICE && A2Quiz.INDICE.resumo && A2Quiz.INDICE.resumo.secoes) || {};
  }

  // ====================================================================== COMPONENTES
  function barraNivel(prog, animarDe) {
    var i = h('i', { style: { width: (animarDe != null ? animarDe : prog.pct) + '%' } });
    var b = h('div.barra.barra-jornada', { role: 'progressbar', 'aria-label': 'Progresso até o próximo nível', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(prog.pct) }, i);
    requestAnimationFrame(function () { requestAnimationFrame(function () { i.style.width = prog.pct + '%'; }); });
    return b;
  }
  function fmt(n) { return Number(n || 0).toLocaleString('pt-BR'); }
  function textoFaltam(p) { return p.proximo ? 'Faltam ' + fmt(p.faltam) + ' pontos para ' + p.proximo.nome : 'Nível máximo alcançado'; }

  /** Cartão compacto (Quiz e Perfil). */
  function cartao(opcoes) {
    opcoes = opcoes || {};
    var e = estado(), p = J.progresso(e.pontos, e.nivel), meds = J.medalhas(e), ganhas = meds.filter(function (m) { return m.em; }).length;
    var el = h('section.cartao.jornada-cartao#jornada-cartao',
      h('div.jornada-topo', emblemaEl(p.nivel.n, 60),
        h('div.jornada-id', h('span.rotulo', 'Jornada da Sabedoria · nível ' + p.nivel.n + ' de 8'), h('b.jornada-nivel', p.nivel.nome),
          h('small', h('strong', fmt(e.pontos)), ' pontos · ', ganhas + ' de ' + meds.length + ' medalhas'))),
      barraNivel(p, opcoes.animarDe),
      h('div.jornada-rodape', h('small', textoFaltam(p)), h('div.esp'),
        h('button.link-secao#ver-sabedoria', { on: { click: function () { abrir(); } } }, 'Ver jornada', ico('direita'))));
    if (opcoes.medalhas) el.appendChild(h('div.jornada-medalhas', meds.map(function (m) { return medalhaEl(m, 34); })));
    return el;
  }

  function linhaEstat(v, r) { return h('div.jornada-num', h('b', v), h('span', r)); }

  /** Painel completo: progresso, medalhas, estatísticas, domínio, níveis e histórico. */
  function abrir(foco) {
    var desligar = null;
    if (!A2Quiz.BANCO.length) A2Quiz.pronto().then(function () { avisar({ tipo: 'banco' }); }, function () {});
    UI.folha('Jornada da Sabedoria', function (api) {
      var corpo = h('div.jornada-painel');
      function desenhar() {
        var e = estado(), p = J.progresso(e.pontos, e.nivel), perfil = App.perfil(), meds = J.medalhas(e);
        var dom = J.dominio(e, totaisPorSecao(), A2Quiz.SECOES);
        var taxa = e.respondidas ? Math.round(100 * e.acertos / e.respondidas) : 0;
        UI.trocar(corpo,
          h('section.jornada-hero',
            h('div.jornada-hero-id',
              h('div.perfil-foto.jornada-foto', perfil.foto ? h('img', { src: perfil.foto, alt: '' }) : h('span', (perfil.nome || 'A').trim().charAt(0).toUpperCase() || 'A')),
              h('div', h('b', perfil.nome || 'Leitor do Atos 2'), h('small', e.iniciadoEm ? 'Na jornada desde ' + UI.dataCurta(e.iniciadoEm) : 'Sua jornada começa no primeiro quiz'))),
            h('div.jornada-hero-nivel', emblemaEl(p.nivel.n, 92),
              h('div', h('span.rotulo', 'Nível ' + p.nivel.n + ' de 8'), h('h3', p.nivel.nome), h('p', p.nivel.descricao))),
            h('div.jornada-pontos', h('b', fmt(e.pontos)), h('span', 'pontos')),
            barraNivel(p, 0), h('small.jornada-falta', textoFaltam(p)),
            servidor() ? h('small.jornada-sinc', ico('nuvem'), 'Pontos confirmados pelo servidor e iguais em todos os seus aparelhos.')
              : h('small.jornada-sinc', ico('escudo'), Dados.estado.tipo === 'nuvem' ? 'Entre na sua conta para guardar seus pontos no servidor e vê-los em qualquer aparelho.' : 'Seu progresso fica salvo com seus dados do Atos 2.')),
          h('p.jornada-aviso', ico('info'), J.AVISO),
          h('div.secao', h('h2', 'Medalhas')),
          h('div.medalhas-grade', meds.map(function (m) {
            return h('div.medalha-item' + (m.em ? '.ganha' : ''), medalhaEl(m, 52), h('b', m.nome), h('small', m.descricao),
              h('small.medalha-estado', m.em ? 'Conquistada em ' + UI.dataCurta(m.em) : fmt(m.atual) + ' de ' + fmt(m.meta)));
          })),
          h('div.secao', h('h2', 'Estatísticas')),
          h('div.jornada-numeros', linhaEstat(fmt(e.rodadas), 'quizzes concluídos'), linhaEstat(fmt(e.respondidas), 'respostas'),
            linhaEstat(fmt(e.acertos), 'respostas corretas'), linhaEstat(e.respondidas ? taxa + '%' : '—', 'de acertos'),
            linhaEstat(fmt(e.seqMax), 'maior sequência de acertos'), linhaEstat(fmt(e.diasSeguidos), e.diasSeguidos === 1 ? 'dia seguido' : 'dias seguidos'),
            linhaEstat(fmt(e.maiorDias), 'maior série de dias'), linhaEstat(fmt(Object.keys(e.respostas).length), 'perguntas diferentes')),
          h('div.secao#dominio-biblico', h('h2', 'Domínio bíblico')),
          h('p.sub', 'Quanto de cada parte da Bíblia você já domina no quiz: perguntas da seção acertadas ao menos uma vez. É separado do seu nível geral.'),
          h('div.dominio-lista', dom.map(function (d) {
            return h('div.dominio-item', h('div.dominio-topo', h('b', d.nome), h('div.esp'), h('span.selo' + (d.pct >= 70 ? '.ouro' : ''), d.grau)),
              h('div.barra', h('i', { style: { width: d.pct + '%' } })),
              h('small', d.acertadas + ' de ' + d.total + ' perguntas (' + d.pct + '%)' + (d.taxa != null ? ' · ' + d.taxa + '% de acertos nas tentativas' : '')));
          })),
          h('div.secao#galeria-niveis', h('h2', 'Os oito níveis')),
          h('div.niveis-galeria', J.NIVEIS.map(function (n) {
            var aberto = n.n <= p.nivel.n;
            return h('div.nivel-card' + (aberto ? '' : '.bloqueado') + (n.n === p.nivel.n ? '.atual' : ''), emblemaEl(n.n, 64, !aberto),
              h('div', h('span.rotulo', 'Nível ' + n.n + (n.n === p.nivel.n ? ' · atual' : '')), h('b', n.nome),
                h('small', n.min ? 'A partir de ' + fmt(n.min) + ' pontos' : 'Ponto de partida'), h('p', n.descricao)));
          })),
          h('div.secao', h('h2', 'Evolução')),
          e.historico.length ? h('ol.jornada-historico', e.historico.slice(0, 40).map(function (x) {
            var t = x.tipo === 'nivel' ? ['estrela', 'Alcançou o nível ' + J.nivel(x.nivel).nome]
              : x.tipo === 'medalha' ? ['coroa', 'Medalha conquistada: ' + ((J.MEDALHAS.filter(function (m) { return m.id === x.id; })[0] || {}).nome || x.id)]
              : ['ok', (x.modo === 'avancado' ? 'Desafio avançado' : x.modo === 'especial' ? 'Desafio especial' : 'Quiz') + ': ' + x.acertos + ' de ' + x.total + (x.pontos ? ' · +' + x.pontos + ' pontos' : '')];
            return h('li.' + x.tipo, ico(t[0] === 'coroa' ? 'estrela' : t[0]), h('div', h('span', t[1]), h('small', UI.dataCurta(x.em))));
          })) : h('p.sub', 'Os seus quizzes, novos níveis e medalhas aparecem aqui.'),
          h('div.secao', h('h2', 'Como ganhar pontos')),
          h('ul.jornada-regras',
            h('li', h('b', '+10'), ' por resposta correta — só na primeira vez que você acerta cada pergunta.'),
            h('li', h('b', '+15'), ' a cada 5 acertos seguidos na mesma rodada (até ' + J.REGRAS.sequenciasDia + ' vezes por dia).'),
            h('li', h('b', '+20'), ' por quiz concluído, com pelo menos 5 perguntas (até ' + J.REGRAS.conclusoesDia + ' por dia).'),
            h('li', h('b', '+30'), ' no desafio avançado: 10 perguntas difíceis, com pelo menos 7 acertos (uma vez por dia).'),
            desafiosAtivos().map(function (d) { return h('li', h('b', '+' + d.pontos), ' ' + d.titulo + (d.periodo === 'unico' ? ' (uma única vez).' : ' (uma vez por dia).')); }),
            h('li', 'Os pontos são cumulativos e o nível nunca regride.')));
        if (foco) { var alvo = corpo.querySelector(foco); if (alvo) setTimeout(function () { alvo.scrollIntoView({ block: 'start' }); }, 60); foco = null; }
      }
      desenhar();
      desligar = ouvir(function () { if (corpo.isConnected) desenhar(); });
      return corpo;
    }, { cheia: true, aoFechar: function () { if (desligar) desligar(); } });
  }

  /** Tela especial de novo nível. */
  function celebrarNivel(n) {
    var nv = J.nivel(n), camadaEl;
    var fechar = function () { camadaEl.classList.add('saindo'); setTimeout(function () { camadaEl.remove(); }, 260); document.removeEventListener('keydown', tecla); };
    var tecla = function (ev) { if (ev.key === 'Escape' || ev.key === 'Enter') fechar(); };
    var bt = h('button.bt.ouro#subiu-continuar', { on: { click: fechar } }, 'Continuar');
    camadaEl = h('div.subiu-nivel', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'subiu-titulo' },
      h('div.subiu-brilho'),
      h('div.subiu-conteudo',
        h('span.subiu-rotulo', 'Novo nível alcançado'),
        h('div.subiu-emblema', h('span.subiu-anel'), h('span.subiu-anel.a2'), emblemaEl(nv.n, 148)),
        h('span.subiu-num', 'Nível ' + nv.n + ' de 8'),
        h('h2#subiu-titulo', nv.nome),
        h('p.subiu-desc', nv.descricao),
        h('p.subiu-msg', mensagemNivel(nv.n)),
        bt,
        h('small.subiu-aviso', J.AVISO)));
    document.body.appendChild(camadaEl);
    document.addEventListener('keydown', tecla);
    setTimeout(function () { bt.focus(); }, 400);
  }
  function mensagemNivel(n) {
    return ['', '', 'Parabéns! Sua constância nas Escrituras está dando fruto.', 'Que alegria ver você reconhecer a Palavra com mais clareza a cada rodada.',
      'Fiel no pouco: continue firme, um passo de cada vez.', 'Seu conhecimento já ajuda a anunciar a esperança com mansidão.',
      'Profundidade e precisão: a Palavra está habitando em você.', 'Maturidade que se firma com o tempo. Continue firme!',
      'Você chegou ao ponto mais alto da jornada. Que a Palavra continue guardada no seu coração.'][n] || 'Parabéns pelo novo nível!';
  }

  root.Jornada = { emblema: emblema, emblemaEl: emblemaEl, medalhaEl: medalhaEl, estado: estado, carregar: carregar, enviarFila: enviarFila,
    registrarRodada: registrarRodada, jaAcertou: jaAcertou, perfilSorteio: perfilSorteio, desafiosAtivos: desafiosAtivos, servidor: servidor,
    cartao: cartao, abrir: abrir, celebrarNivel: celebrarNivel, barraNivel: barraNivel, ouvir: ouvir, fila: fila, fmt: fmt };
})(window);
