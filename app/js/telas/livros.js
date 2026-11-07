/* ATOS 2 — Bíblia › seleção de livros (v2.8).
   Visão geral com os dois testamentos → categorias e livros do testamento → capítulos do livro.
   Rotas: #livros · #livros/AT · #livros/NT · #livros/<ID do livro>. A barra inferior continua na aba Bíblia.
   O progresso vem dos capítulos marcados como lidos (Dados 'leitura'/'capitulos'); nada é simulado. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;
  var profundidadeAnterior = 0;

  function versao() { return Biblia.padrao(); }
  function lidos() { return (Dados.obter('leitura', 'capitulos') || {}).lidos || {}; }
  function ultima() { var u = Dados.obter('leitura', 'ultima'); return u && A2Ref.POR_ID[u.livro] ? u : null; }
  function contagem() { return Biblia.contagemSinc(versao()); }
  function nCaps(id) { return A2Canon.capitulos(id, contagem()); }
  function fmt(n) { return Number(n).toLocaleString('pt-BR'); }
  function plural(n, um, varios) { return fmt(n) + ' ' + (n === 1 ? um : varios); }

  function rota() {
    var p = location.hash.replace('#', '').split('/'), alvo = p[1] ? decodeURIComponent(p[1]) : '';
    if (alvo === 'AT' || alvo === 'NT') return { vista: 'test', test: alvo, prof: 1 };
    if (A2Ref.POR_ID[alvo]) return { vista: 'livro', livro: alvo, test: A2Ref.POR_ID[alvo].test, prof: 2 };
    return { vista: 'geral', prof: 0 };
  }
  function ir(destino, substituir) {
    var hash = '#livros' + (destino ? '/' + destino : '');
    if (location.hash === hash) { App.recarregar(); return; }
    if (substituir) location.replace(hash); else location.hash = hash;
  }
  // Livro com um só capítulo abre direto no leitor, como antes
  function abrirLivro(id) { if (nCaps(id) === 1) App.abrirBiblia(id, 1); else ir(id); }

  function barra(fracao, rotulo) {
    var pct = Math.round(Math.max(0, Math.min(1, fracao)) * 1000) / 10;
    return h('div.lv-barra', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': rotulo || 'Progresso de leitura' },
      h('i', { style: { width: (fracao > 0 && pct < 1.5 ? 1.5 : pct) + '%' } }));
  }
  function textoProgresso(p) {
    if (!p.lidos) return 'Nenhum capítulo marcado como lido';
    if (p.completo) return 'Todos os ' + fmt(p.total) + ' capítulos lidos';
    var pct = p.fracao * 100;
    return fmt(p.lidos) + ' de ' + fmt(p.total) + ' capítulos lidos · ' + (pct < 1 ? 'menos de 1' : fmt(Math.floor(pct))) + '%';
  }

  // ---------------------------------------------------------------- tela
  function render(tela) {
    var r = rota();
    var dir = r.prof > profundidadeAnterior ? 'frente' : r.prof < profundidadeAnterior ? 'volta' : 'igual';
    profundidadeAnterior = r.prof;
    var raiz = h('div.livros-tela.lv-vista-' + r.vista);
    tela.appendChild(raiz);
    raiz.appendChild(cabecalho(r));
    var busca = painelBusca();
    raiz.appendChild(busca.el);
    var corpo = h('div.lv-corpo.lv-entra-' + dir);
    raiz.appendChild(corpo);
    busca.corpo = corpo;
    function desenhar() {
      corpo.replaceChildren();
      if (r.vista === 'geral') visaoGeral(corpo);
      else if (r.vista === 'test') visaoTestamento(corpo, r.test);
      else visaoLivro(corpo, r.livro);
    }
    desenhar();
    // a contagem de capítulos da tradução chega do índice; a tabela padrão cobre a primeira pintura
    var antes = contagem()('GEN');
    Biblia.indice(versao()).then(function () { if (!antes && raiz.isConnected && r.vista === 'livro') desenhar(); }, function () {});
    App.aoMudar(function (col) { if (col === 'leitura' && raiz.isConnected) desenhar(); });
  }

  function cabecalho(r) {
    var v = Biblia.versao(versao());
    var btBusca = h('button.bt-ico#livros-buscar', { type: 'button', 'aria-label': 'Buscar livro', 'aria-expanded': 'false', on: { click: function () { abrirBusca(); } } }, ico('busca'));
    var trad = h('button.lv-trad', { type: 'button', 'aria-label': 'Tradução: ' + v.nome + '. Trocar tradução', on: { click: function () { Telas.biblia.escolherTraducao(); } } },
      h('b', v.sigla), h('span', v.nome), ico('baixo'));
    if (r.vista === 'geral') {
      return h('header.cab.lv-cab',
        h('div.lv-cab-txt', h('h1', 'Bíblia Sagrada'), h('p.sub', 'Explore as Escrituras'), trad),
        h('div.esp'), btBusca);
    }
    var voltar = r.vista === 'test' ? { rot: 'Bíblia Sagrada', fn: function () { ir(''); } }
      : { rot: A2Canon.testamento(r.test).nome, fn: function () { ir(r.test); } };
    return h('header.cab.lv-cab.lv-cab-int',
      h('button.lv-voltar', { type: 'button', 'aria-label': 'Voltar para ' + voltar.rot, on: { click: voltar.fn } }, ico('esquerda'), h('span', voltar.rot)),
      h('div.esp'), h('span.lv-sigla', { title: v.nome }, v.sigla), btBusca);
  }

  // ---------------------------------------------------------------- visão geral
  function visaoGeral(c) {
    var u = ultima(), l = lidos();
    if (u) {
      var nome = A2Ref.POR_ID[u.livro].nome;
      c.appendChild(h('section.lv-continuar', { 'aria-label': 'Continuar lendo' },
        h('button.lv-cont-principal', { type: 'button', on: { click: function () { App.abrirBiblia(u.livro, u.cap); } } },
          h('span.lv-cont-ico', ico('livro')),
          h('span.lv-cont-txt', h('small', 'Continuar lendo'), h('b', nome + ' ' + u.cap))),
        nCaps(u.livro) > 1 ? h('button.lv-cont-caps', { type: 'button', on: { click: function () { ir(u.livro); } } }, 'Capítulos', ico('direita')) : null));
    }
    var grade = h('div.lv-testamentos');
    A2Canon.TESTAMENTOS.forEach(function (t, i) {
      var livros = A2Canon.livrosDo(t.id), p = A2Canon.progressoTestamento(l, t.id, contagem());
      grade.appendChild(h('button.lv-test.lv-test-' + t.id.toLowerCase(), { type: 'button', style: { animationDelay: (i * 70) + 'ms' }, 'data-test': t.id, 'aria-label': t.nome + ', ' + livros.length + ' livros. ' + textoProgresso(p), on: { click: function () { ir(t.id); } } },
        h('span.lv-test-arte', { 'aria-hidden': 'true', html: t.id === 'AT' ? ARTE_AT : ARTE_NT }),
        h('span.lv-test-sobre', livros.length + ' livros'),
        h('span.lv-test-nome', t.nome),
        h('span.lv-test-desc', t.descricao),
        h('span.lv-test-cats', A2Canon.categoriasDo(t.id).map(function (x) { return x.nome; }).join(' · ')),
        h('span.lv-test-pe', h('span.lv-test-prog', barra(p.fracao, 'Progresso no ' + t.nome), h('small', textoProgresso(p))), h('span.lv-test-seta', ico('direita')))));
    });
    c.appendChild(grade);
  }

  // ---------------------------------------------------------------- testamento
  function visaoTestamento(c, test) {
    var t = A2Canon.testamento(test), l = lidos(), u = ultima(), cont = contagem();
    var livros = A2Canon.livrosDo(test), p = A2Canon.progressoTestamento(l, test, cont);
    c.appendChild(h('div.lv-seg', { role: 'tablist', 'aria-label': 'Testamento' }, A2Canon.TESTAMENTOS.map(function (x) {
      var on = x.id === test;
      return h('button' + (on ? '.ativo' : ''), { type: 'button', role: 'tab', 'aria-selected': String(on), on: { click: function () { if (!on) ir(x.id, true); } } }, x.nome);
    })));
    c.appendChild(h('div.lv-test-cab',
      h('h1', t.nome),
      h('p.sub', livros.length + ' livros · ' + fmt(p.total) + ' capítulos'),
      h('div.lv-test-cab-prog', barra(p.fracao, 'Progresso no ' + t.nome), h('small', textoProgresso(p)))));
    var cats = A2Canon.categoriasDo(test);
    c.appendChild(h('nav.chips.lv-cats', { 'aria-label': 'Categorias' }, cats.map(function (cat) {
      return h('button.chip', { type: 'button', on: { click: function () { var alvo = document.getElementById('cat-' + cat.id); if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } }, cat.nome);
    })));
    cats.forEach(function (cat) {
      var pc = A2Canon.progresso(l, cat.livros, cont);
      c.appendChild(h('section.lv-cat#cat-' + cat.id, { 'aria-labelledby': 'cat-t-' + cat.id },
        h('div.lv-cat-cab',
          h('span.lv-cat-ico', ico(cat.icone)),
          h('div.lv-cat-txt',
            h('h2#cat-t-' + cat.id, cat.nome),
            h('p', cat.descricao)),
          h('span.lv-cat-num', plural(cat.livros.length, 'livro', 'livros'), pc.lidos ? h('small', fmt(pc.lidos) + '/' + fmt(pc.total)) : null)),
        h('div.lv-grade', cat.livros.map(function (id) { return cartaoLivro(id, l, u); }))));
    });
  }

  function cartaoLivro(id, l, u) {
    var info = A2Ref.POR_ID[id], n = nCaps(id), p = A2Canon.progressoLivro(l, id, contagem());
    var atual = u && u.livro === id;
    var estado = atual ? 'Lendo agora' : p.completo ? 'Lido' : p.lidos ? fmt(p.lidos) + '/' + fmt(n) + ' lidos' : null;
    return h('button.lv-livro' + (atual ? '.atual' : '') + (p.completo ? '.completo' : ''), { type: 'button', 'data-livro': id,
      'aria-label': info.nome + ', ' + plural(n, 'capítulo', 'capítulos') + (atual ? ', lendo agora' : '') + (p.lidos ? ', ' + textoProgresso(p) : ''), on: { click: function () { abrirLivro(id); } } },
      h('span.lv-mono', { 'aria-hidden': 'true' }, info.abrev),
      h('span.lv-livro-txt', h('b', info.nome), h('small', plural(n, 'capítulo', 'capítulos')),
        estado ? h('span.lv-estado' + (atual ? '.agora' : p.completo ? '.ok' : ''), p.completo && !atual ? ico('ok') : null, estado) : null),
      p.lidos ? barra(p.fracao, 'Progresso em ' + info.nome) : null);
  }

  // ---------------------------------------------------------------- livro (capítulos)
  function visaoLivro(c, id) {
    var info = A2Ref.POR_ID[id], cat = A2Canon.categoriaDe(id), t = A2Canon.testamento(info.test);
    var n = nCaps(id), l = lidos(), u = ultima(), p = A2Canon.progressoLivro(l, id, contagem());
    var capAtual = u && u.livro === id ? u.cap : null;
    var primeiroNaoLido = 0;
    for (var i = 1; i <= n; i++) if (!l[id + '.' + i]) { primeiroNaoLido = i; break; }
    var seguir = capAtual || primeiroNaoLido || 1;
    var rotuloSeguir = capAtual ? 'Continuar no capítulo ' + capAtual : p.lidos && !p.completo ? 'Seguir no capítulo ' + seguir : p.completo ? 'Ler de novo desde o capítulo 1' : 'Começar a leitura';
    c.appendChild(h('section.lv-livro-hero', { 'aria-label': info.nome },
      h('span.lv-hero-mono', { 'aria-hidden': 'true' }, info.abrev),
      h('span.lv-hero-sobre', (cat ? cat.nome + ' · ' : '') + t.nome),
      h('h1', info.nome),
      h('p', plural(n, 'capítulo', 'capítulos') + (cat ? ' · ' + cat.descricao : '')),
      h('div.lv-hero-prog', barra(p.fracao, 'Progresso em ' + info.nome), h('small', textoProgresso(p))),
      h('div.lv-hero-bts',
        h('button.bt.ouro#livro-seguir', { type: 'button', on: { click: function () { App.abrirBiblia(id, seguir); } } }, ico('livro'), rotuloSeguir),
        h('button.bt.lv-bt-assist', { type: 'button', on: { click: function () { App.estado.assistentePedido = { ref: info.nome + ' ' + seguir }; App.estado.assistenteModo = 'estudar'; App.ir('assistente'); } } }, ico('brilho'), 'Estudar com o Assistente'))));
    c.appendChild(h('div.secao.lv-caps-cab', h('h2', 'Capítulos'), h('div.esp'),
      h('span.lv-legenda', h('i.lv-leg-lido'), 'lido', capAtual ? h('i.lv-leg-atual') : null, capAtual ? 'último aberto' : null)));
    c.appendChild(h('div.caps-grade.lv-caps', Array.from({ length: n }, function (_, i) {
      var k = id + '.' + (i + 1), lido = !!l[k], at = capAtual === i + 1;
      return h('button' + (at ? '.atual' : '') + (lido ? '.lido' : ''), { type: 'button', 'aria-label': 'Capítulo ' + (i + 1) + (lido ? ', lido' : '') + (at ? ', último aberto' : ''),
        on: { click: function () { App.abrirBiblia(id, i + 1); } } }, String(i + 1));
    })));
  }

  // ---------------------------------------------------------------- busca
  var buscaAtual = null;
  function abrirBusca() { if (buscaAtual) buscaAtual.abrir(); }
  function painelBusca() {
    var entrada = h('input.entrada#ir-ref', { type: 'search', placeholder: 'Buscar livro ou ir para… ex.: Jo 3:16', autocomplete: 'off', enterkeyhint: 'go', 'aria-describedby': 'livros-busca-dica' });
    var lista = h('div.lv-resultados', { role: 'list', 'aria-live': 'polite' });
    var el = h('div.lv-busca', { hidden: true },
      h('form.lv-busca-form', { role: 'search', on: { submit: function (e) { e.preventDefault(); escolherPrimeiro(); } } },
        h('label.sr', { for: 'ir-ref' }, 'Buscar livro ou referência'),
        h('span.lv-busca-ico', ico('busca')), entrada,
        h('button.bt-ico.lv-busca-fechar', { type: 'button', 'aria-label': 'Fechar a busca', on: { click: function () { fechar(); } } }, ico('fechar'))),
      h('p.sr#livros-busca-dica', 'Digite o nome de um livro, como Salmos ou Romanos, ou uma referência, como João 3:16.'),
      lista);
    var api = { el: el, corpo: null, abrir: abrir };
    buscaAtual = api;
    var resultados = [];
    function abrir() {
      el.hidden = false; el.classList.add('aberta');
      var bt = document.getElementById('livros-buscar'); if (bt) bt.setAttribute('aria-expanded', 'true');
      setTimeout(function () { entrada.focus(); }, 30);
    }
    function fechar() {
      entrada.value = ''; atualizar(); el.hidden = true; el.classList.remove('aberta');
      var bt = document.getElementById('livros-buscar'); if (bt) { bt.setAttribute('aria-expanded', 'false'); bt.focus(); }
    }
    function atualizar() {
      var q = entrada.value.trim();
      if (api.corpo) api.corpo.hidden = !!q;
      lista.replaceChildren(); resultados = [];
      if (!q) return;
      if (A2Canon.pareceReferencia(q)) {
        var r = Biblia.interpretar(q);
        if (r.ok) {
          var rot = A2Ref.formatar(r.ref);
          resultados.push(function () { App.abrirBiblia(r.ref.livro, r.ref.cap, r.ref.v1); });
          lista.appendChild(h('button.lv-res.lv-res-ref', { type: 'button', role: 'listitem', on: { click: resultados[0] } },
            h('span.lv-res-ico', ico('direita')), h('span.lv-res-txt', h('b', 'Ir para ' + rot), h('small', 'Abrir no leitor'))));
        } else if (!A2Canon.buscar(q, 1).length) {
          lista.appendChild(h('p.lv-res-vazio', r.erro || 'Referência não encontrada.'));
        }
      }
      var achados = A2Canon.buscar(q, 12);
      achados.forEach(function (lv) {
        var cat = A2Canon.categoriaDe(lv.id), fn = function () { abrirLivro(lv.id); };
        resultados.push(fn);
        lista.appendChild(h('button.lv-res', { type: 'button', role: 'listitem', 'data-livro': lv.id, on: { click: fn } },
          h('span.lv-mono', { 'aria-hidden': 'true' }, lv.abrev),
          h('span.lv-res-txt', h('b', lv.nome), h('small', (cat ? cat.nome + ' · ' : '') + plural(nCaps(lv.id), 'capítulo', 'capítulos'))),
          ico('direita')));
      });
      if (!lista.childNodes.length) lista.appendChild(h('p.lv-res-vazio', 'Nenhum livro encontrado para “' + q + '”.'));
    }
    function escolherPrimeiro() { if (resultados[0]) resultados[0](); }
    entrada.addEventListener('input', atualizar);
    entrada.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); fechar(); } });
    return api;
  }

  // ---------------------------------------------------------------- ilustrações (traço dourado sobre o azul)
  // AT: tábuas da Lei diante de um rolo aberto. NT: livro aberto com a cruz e raios de luz.
  var ARTE_AT = '<svg viewBox="0 0 160 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M18 104c0-6 5-10 11-10h96c6 0 11 4 11 10s-5 10-11 10H29c-6 0-11-4-11-10z" opacity=".55"/><path d="M29 94v20M125 94v20" opacity=".55"/>' +
    '<path d="M48 98V40c0-11 8-19 19-19s19 8 19 19v58z"/><path d="M90 98V40c0-11 8-19 19-19s19 8 19 19v58z"/>' +
    '<path d="M57 44h20M57 54h20M57 64h20M57 74h20M57 84h14M99 44h20M99 54h20M99 64h20M99 74h20M99 84h14" opacity=".7"/></svg>';
  var ARTE_NT = '<svg viewBox="0 0 160 140" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M80 12v40M66 26h28"/><path d="M80 4v4M52 18l3 3M108 18l-3 3M44 38h4M112 38h4" opacity=".55"/>' +
    '<path d="M80 74c-12-8-30-10-52-8v52c22-2 40 0 52 8 12-8 30-10 52-8V66c-22-2-40 0-52 8z"/><path d="M80 74v52"/>' +
    '<path d="M38 80c12-1 22 1 32 5M38 92c12-1 22 1 32 5M38 104c12-1 22 1 32 5M90 85c10-4 20-6 32-5M90 97c10-4 20-6 32-5M90 109c10-4 20-6 32-5" opacity=".6"/></svg>';

  root.Telas = root.Telas || {};
  root.Telas.livros = { render: render };
})(window);
