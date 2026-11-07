/* ATOS 2 — Bíblia: leitura por capítulo, seleção de versículos, destaques, favoritos, notas,
   comparação de traduções, leitura em voz alta, progresso e planos. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;
  var CORES = [['amarelo', 'Amarelo'], ['verde', 'Verde'], ['azul', 'Azul'], ['rosa', 'Rosa'], ['lilas', 'Lilás']];
  var sel = new Set(), atual = null, conteudoEl = null, barraEl = null, audio = null;

  function versaoAtual() { return Biblia.padrao(); }
  function chaveV(v) { return A2Ref.chave(atual.livro, atual.cap, v); }

  function render(tela) {
    var c = App.estado.leitor || Dados.obter('leitura', 'ultima') || { livro: 'JHN', cap: 1 };
    atual = { livro: c.livro, cap: c.cap, alvo: (App.estado.leitor && App.estado.leitor.alvo) || null };
    App.estado.leitor = { livro: atual.livro, cap: atual.cap };
    sel.clear();
    var nomeLivro = A2Ref.POR_ID[atual.livro].nome;
    var sigla = Biblia.versao(versaoAtual()).sigla;
    tela.appendChild(h('header.leitor-cab',
      h('button.seletor-cap', { 'aria-label': 'Escolher livro e capítulo (' + nomeLivro + ' ' + atual.cap + ')', on: { click: escolherLivro } }, h('span.sc-livro', nomeLivro.length > 11 ? h('span', h('span.sc-longo', nomeLivro), h('span.sc-curto', A2Ref.POR_ID[atual.livro].abrev)) : nomeLivro), ' ', h('span.sc-cap', String(atual.cap)), ico('baixo')),
      h('button.trad', { 'aria-label': 'Tradução: ' + Biblia.versao(versaoAtual()).nome, on: { click: escolherTraducao } }, sigla),
      h('div', { style: { flex: 1 } }),
      h('button.bt-ico', { 'aria-label': 'Pesquisar', on: { click: function () { Telas.pesquisa.abrir(); } } }, ico('busca')),
      h('button.bt-ico', { 'aria-label': 'Ouvir capítulo', on: { click: function () { var a = Dados.obter('leitura', 'audio'); iniciarAudio(a && a.livro === atual.livro && a.cap === atual.cap && a.v > 1 ? a.v : 1); } } }, ico('ouvir')),
      App.botaoTema(),
      h('button.bt-ico', { 'aria-label': 'Aparência da leitura', on: { click: ajustesLeitura } }, ico('texto'))));
    if (App.estado.plano) tela.appendChild(faixaPlano());
    conteudoEl = h('article.texto-biblico', { 'aria-live': 'polite' }, h('div.carregando', h('div.giro'), 'Carregando…'));
    var fl = App.config().fonteLeitura;
    if (fl === 'ui') conteudoEl.classList.add('serifa-ui'); if (fl === 'display') conteudoEl.classList.add('serifa-display');
    tela.appendChild(conteudoEl);
    carregar();
    App.aoMudar(function (col) { if (col === 'destaques' || col === 'favoritos' || col === 'notas') redesenharMarcas(); });
    App.aoSair(function () { if (barraEl) barraEl.remove(); barraEl = null; fecharPainel(); document.body.classList.remove('selecionando'); pararAudio(); });
    document.addEventListener('keydown', teclas);
    App.aoSair(function () { document.removeEventListener('keydown', teclas); });
  }
  function teclas(e) {
    if (e.target.closest && e.target.closest('input, textarea, select, .folha')) return;
    if (e.key === 'ArrowRight') irCap(1); else if (e.key === 'ArrowLeft') irCap(-1);
  }

  var dadosLivro = null;
  async function carregar() {
    try {
      var ix = await Biblia.indice(versaoAtual());
      var nCaps = (ix.livros.filter(function (l) { return l.id === atual.livro; })[0] || { versos: [] }).versos.length;
      if (atual.cap > nCaps) atual.cap = nCaps;
      dadosLivro = await Biblia.livro(atual.livro, versaoAtual());
      desenhar();
      Dados.salvar('leitura', 'ultima', { livro: atual.livro, cap: atual.cap, v: atual.alvo || 1, em: new Date().toISOString() });
      App.registrar('leitura', { ref: A2Ref.formatar({ livro: atual.livro, cap: atual.cap }) });
    } catch (e) {
      conteudoEl.replaceChildren(h('div.vazio', h('b', 'Não foi possível abrir este capítulo.'), h('span', e.message), h('button.bt', { on: { click: carregar } }, 'Tentar de novo')));
    }
  }

  function desenhar() {
    var caps = dadosLivro.caps, versos = caps[atual.cap - 1];
    var frag = document.createDocumentFragment();
    frag.appendChild(h('div.cap-titulo', h('div.livro', A2Ref.POR_ID[atual.livro].nome), h('div.num', String(atual.cap))));
    if (dadosLivro.titulos && dadosLivro.titulos[atual.cap]) frag.appendChild(h('p.titulo-salmo', dadosLivro.titulos[atual.cap]));
    var p = h('p', { style: { margin: 0 } });
    versos.forEach(function (t, i) { p.appendChild(spanVersiculo(t, i + 1)); p.appendChild(document.createTextNode(' ')); });
    frag.appendChild(p);
    var lidos = (Dados.obter('leitura', 'capitulos') || {}).lidos || {}, k = atual.livro + '.' + atual.cap, lido = !!lidos[k];
    frag.appendChild(h('div', { style: { display: 'flex', justifyContent: 'center', marginTop: '22px' } },
      h('button.bt' + (lido ? '' : '.pri'), { 'aria-pressed': String(lido), on: { click: function () { marcarLido(!lido); desenhar(); } } }, ico(lido ? 'ok' : 'livro'), lido ? 'Capítulo lido' : 'Marcar capítulo como lido')));
    frag.appendChild(h('nav.nav-cap', { 'aria-label': 'Capítulos' },
      h('button.bt', { disabled: !temCap(-1), on: { click: function () { irCap(-1); } } }, ico('esquerda'), rotuloCap(-1)),
      h('button.bt', { disabled: !temCap(1), on: { click: function () { irCap(1); } } }, rotuloCap(1), ico('direita'))));
    var vv = Biblia.versao(versaoAtual());
    frag.appendChild(h('p.sub', { style: { textAlign: 'center', fontSize: '12px', marginTop: '18px' } }, vv.nome + ' (' + vv.sigla + ').' +
      (versaoAtual() === 'onbv' ? '' : ' Palavras em itálico foram acrescentadas pelos tradutores para clareza.') +
      (versaoAtual() === 'alm1911' ? ' Grafia original de 1911.' : versaoAtual() === 'alm1911at' ? ' Texto de 1911 com a grafia atualizada pelo ATOS 2.' : '')));
    conteudoEl.replaceChildren(frag);
    if (atual.alvo) {
      var alvo = conteudoEl.querySelector('[data-v="' + atual.alvo + '"]');
      if (alvo) { setTimeout(function () { alvo.scrollIntoView({ block: 'center', behavior: 'smooth' }); alvo.classList.add('foco'); }, 80); }
      atual.alvo = null;
    }
  }

  function spanVersiculo(t, n) {
    var span = h('span.v', { 'data-v': n, tabindex: '0', role: 'button', 'aria-pressed': 'false', 'aria-label': 'Versículo ' + n });
    span.appendChild(h('sup.n', String(n)));
    var mostrarRefs = !!App.config().refsCruzadas;
    var notas = ((dadosLivro.notas || {})[atual.cap + ':' + n] || []).filter(function (x) { return x.tipo !== 'ref' || mostrarRefs; })
      .concat(((dadosLivro.cab || {})[atual.cap + ':' + n] || []).map(function (x) { return Object.assign({ cab: true }, x); }))
      .sort(function (a, b) { return a.o - b.o || (b.cab ? 1 : 0) - (a.cab ? 1 : 0); });
    var cabIniciais = notas.filter(function (x) { return x.cab && x.o === 0; });
    notas = notas.filter(function (x) { return !(x.cab && x.o === 0); });
    if (cabIniciais.length) { var sup = span.querySelector('sup.n'); cabIniciais.forEach(function (x) { span.insertBefore(h('span.cab-v', { 'aria-hidden': 'false' }, x.t), sup); }); }
    if (!t) {
      span.classList.add('sem-texto');
      span.appendChild(document.createTextNode('Texto não disponível nesta edição. '));
    }
    var pos = 0, aberto = false;
    notas.forEach(function (nt, i) {
      var pedaco = t.slice(pos, nt.o); pos = nt.o;
      var r = fecharChaves(pedaco, aberto); aberto = r.aberto;
      span.appendChild(UI.textoComItalico(r.texto));
      if (nt.cab) { span.appendChild(h('span.cab-v', nt.t)); return; }
      span.appendChild(h('button.marca-tn', { 'aria-label': nt.tipo === 'ref' ? 'Referências' : 'Nota da tradução', title: nt.tipo === 'ref' ? 'Referências' : 'Nota da tradução', on: { click: function (e) { e.stopPropagation(); mostrarNota(n, nt); } } }, nt.editorial ? '!' : nt.tipo === 'ref' ? '†' : '*'));
    });
    var resto = fecharChaves(t.slice(pos), aberto);
    span.appendChild(UI.textoComItalico(resto.texto));
    marcas(span, n);
    span.addEventListener('click', function () { alternarSel(n); });
    span.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternarSel(n); } });
    return span;
  }
  // mantém o itálico correto quando uma nota cai dentro de um trecho acrescentado
  function fecharChaves(s, aberto) {
    var txt = (aberto ? '{' : '') + s, ab = aberto;
    for (var i = 0; i < s.length; i++) { if (s[i] === '{') ab = true; else if (s[i] === '}') ab = false; }
    return { texto: ab ? txt + '}' : txt, aberto: ab };
  }
  function marcas(span, n) {
    span.querySelectorAll('.marca-fav, .marca-nota').forEach(function (x) { x.remove(); });
    var k = chaveV(n), d = Dados.obter('destaques', k);
    if (d) span.dataset.cor = d.cor; else delete span.dataset.cor;
    if (App.ehFavorito(k)) span.appendChild(h('span.marca-fav', { title: 'Favorito' }));
    var notas = notasDoVersiculo(k);
    if (notas.length) span.appendChild(h('button.marca-nota', { 'aria-label': 'Ver anotação', on: { click: function (e) { e.stopPropagation(); Telas.biblioteca.editarNota(notas[0]); } } }, ico('nota')));
  }
  function notasDoVersiculo(k) { return Dados.todos('notas').filter(function (x) { return (x.refs || []).indexOf(k) >= 0; }); }
  function redesenharMarcas() { if (!conteudoEl) return; conteudoEl.querySelectorAll('.v').forEach(function (s) { marcas(s, +s.dataset.v); }); }

  function mostrarNota(n, nt) {
    UI.folha('Nota — ' + A2Ref.formatar({ livro: atual.livro, cap: atual.cap, v1: n, v2: n }), h('div.form',
      nt.k ? h('p', h('b', '“' + nt.k + '”')) : null, h('p', nt.t),
      h('p.sub', nt.editorial ? 'Aviso do ATOS 2 sobre a edição.' : ({
        blivre: 'Nota dos tradutores da Bíblia Livre. As siglas TR (Textus Receptus), RP (Texto Majoritário) e N4 (Nestle 1904) indicam os textos gregos comparados.',
        alm1911: nt.tipo === 'ref' ? 'Referências cruzadas da edição de 1911 (cap. = capítulo, ver. = versículo do mesmo livro).' : 'Leitura alternativa indicada pela edição de 1911 (Heb. = no hebraico; ou = outra tradução possível).',
        alm1911at: nt.tipo === 'ref' ? 'Referências cruzadas da edição de 1911 (cap. = capítulo e v. = versículo do mesmo livro).' : 'Leitura alternativa indicada pela edição de 1911 (Heb. = no hebraico; ou = outra tradução possível), com a grafia atualizada.',
        onbv: 'Nota da Nova Bíblia Viva.'
      })[versaoAtual()] || 'Nota da tradução.')));
  }

  // ---------- capítulos ----------
  function ordemLivros() { return A2Ref.LIVROS.map(function (l) { return l.id; }); }
  function vizinho(d) {
    var ix = Biblia.contagemSinc(versaoAtual()), ordem = ordemLivros(), i = ordem.indexOf(atual.livro);
    var cap = atual.cap + d, livro = atual.livro;
    if (cap < 1) { if (i === 0) return null; livro = ordem[i - 1]; cap = ix(livro).length; }
    else if (cap > ix(livro).length) { if (i === ordem.length - 1) return null; livro = ordem[i + 1]; cap = 1; }
    return { livro: livro, cap: cap };
  }
  function temCap(d) { return !!vizinho(d); }
  function rotuloCap(d) { var v = vizinho(d); return v ? (v.livro === atual.livro ? 'Capítulo ' + v.cap : A2Ref.POR_ID[v.livro].abrev + ' ' + v.cap) : (d < 0 ? 'Início' : 'Fim'); }
  function irCap(d) { var v = vizinho(d); if (v) { App.estado.leitor = v; App.recarregar(); } }

  // Capítulo concluído = marcado como lido (botão, “Próximo” no plano ou dia do plano concluído). Abrir não conta.
  function marcarLido(on, livro, cap) {
    livro = livro || atual.livro; cap = cap || atual.cap;
    var doc = Dados.obter('leitura', 'capitulos') || { lidos: {} }, l = Object.assign({}, doc.lidos || {});
    var k = livro + '.' + cap, hoje = UI.hoje();
    if (on) {
      if (l[k] === hoje) return;                      // já concluído hoje: não duplica
      l[k] = hoje;
      Dados.salvar('leitura', 'capitulos', { lidos: l });
      App.registrar('capitulo', { chave: k, livro: livro, cap: cap, ref: A2Ref.formatar({ livro: livro, cap: cap }) });
    } else {
      if (!l[k]) return;
      delete l[k];
      Dados.salvar('leitura', 'capitulos', { lidos: l });
      App.removerDoHistorico(function (x) { return x.tipo === 'capitulo' && x.chave === k; });
    }
  }
  root.Leitura = { marcarLido: marcarLido };

  // ---------- plano de leitura em andamento ----------
  function faixaPlano() {
    var ctx = App.estado.plano, def = A2Planos.DEFINICOES.filter(function (d) { return d.id === ctx.planoId; })[0];
    var cron = A2Planos.cronograma(def, Biblia.contagemSinc('blivre')), dia = cron[ctx.dia];
    var idx = dia.findIndex(function (x) { return x.livro === atual.livro && x.cap === atual.cap; });
    var prox = idx >= 0 && idx < dia.length - 1 ? dia[idx + 1] : null;
    return h('div.faixa-plano', ico('planos'),
      h('div', h('b', def.nome), h('div', 'Dia ' + (ctx.dia + 1) + ': ' + A2Planos.rotuloLeitura(dia, A2Ref.formatar))),
      h('div.esp'),
      prox ? h('button.bt.peq', { on: { click: function () { marcarLido(true); App.abrirBiblia(prox.livro, prox.cap, null, ctx); } } }, 'Próximo', ico('direita'))
        : h('button.bt.peq.pri', { on: { click: function () {
          var est = Dados.obter('planos', def.id);
          if (est) { Dados.salvar('planos', def.id, A2Planos.marcar(est, ctx.dia, true, UI.hoje(), def.dias)); }
          dia.forEach(function (x) { marcarLido(true, x.livro, x.cap); });
          App.registrar('plano', { titulo: def.nome + ' — dia ' + (ctx.dia + 1) });
          UI.aviso('Dia ' + (ctx.dia + 1) + ' concluído.');
          App.estado.plano = null; location.hash = 'biblioteca'; setTimeout(function () { Telas.planos.abrir(def.id); }, 50);
        } } }, ico('ok'), 'Concluir dia'),
      h('button.bt-ico', { 'aria-label': 'Sair do plano', on: { click: function () { App.estado.plano = null; App.recarregar(); } } }, ico('fechar')));
  }

  // ---------- seleção ----------
  function alternarSel(n) {
    if (sel.has(n)) sel.delete(n); else sel.add(n);
    conteudoEl.querySelectorAll('.v').forEach(function (s) { var on = sel.has(+s.dataset.v); s.classList.toggle('sel', on); s.setAttribute('aria-pressed', String(on)); });
    mostrarBarra();
  }
  function limparSel() { sel.clear(); conteudoEl.querySelectorAll('.v.sel').forEach(function (s) { s.classList.remove('sel'); s.setAttribute('aria-pressed', 'false'); }); mostrarBarra(); }
  function selecionados() { return Array.from(sel).sort(function (a, b) { return a - b; }); }
  function refSelecao() {
    var vs = selecionados(), partes = [], i = 0;
    while (i < vs.length) { var j = i; while (j + 1 < vs.length && vs[j + 1] === vs[j] + 1) j++; partes.push(vs[i] === vs[j] ? String(vs[i]) : vs[i] + '-' + vs[j]); i = j + 1; }
    return A2Ref.POR_ID[atual.livro].nome + ' ' + atual.cap + ':' + partes.join(', ');
  }
  function textoSelecao() { return selecionados().map(function (n) { return UI.plano(dadosLivro.caps[atual.cap - 1][n - 1]); }).join(' '); }
  function citacaoSel() { return '“' + textoSelecao() + '”\n— ' + refSelecao() + ' (' + Biblia.versao(versaoAtual()).sigla + ')'; }
  function contigua() { var vs = selecionados(); return vs.length && vs[vs.length - 1] - vs[0] === vs.length - 1; }

  // Painel "Estudo do versículo": ações rápidas + abas de estudo (contexto, palavras, referências, interpretação)
  var painel = { aberto: false, aba: null, cores: false };
  function refEstudo() {
    var vs = selecionados();
    return contigua() ? { livro: atual.livro, cap: atual.cap, v1: vs[0], v2: vs[vs.length - 1], cap2: atual.cap } : { livro: atual.livro, cap: atual.cap, v1: vs[0], v2: vs[0], cap2: atual.cap };
  }
  function fecharPainel() { painel.aberto = false; painel.aba = null; painel.cores = false; }
  function mostrarBarra() {
    if (!sel.size) {
      if (barraEl) barraEl.remove(); barraEl = null; fecharPainel(); document.body.classList.remove('selecionando'); return;
    }
    document.body.classList.add('selecionando');
    if (!barraEl) { barraEl = h('section.barra-sel.painel-estudo', { role: 'dialog', 'aria-label': 'Ações e estudo dos versículos selecionados' }); document.body.appendChild(barraEl); }
    var vs = selecionados(), todosFav = vs.every(function (n) { return App.ehFavorito(chaveV(n)); });
    var corAtual = (Dados.obter('destaques', chaveV(vs[0])) || {}).cor, ref = refEstudo();
    barraEl.dataset.estado = painel.aberto ? 'aberto' : 'compacto';
    function acao(i, r, fn, ativo) { return h('button' + (ativo ? '.ativo' : ''), { type: 'button', 'aria-pressed': ativo == null ? null : String(!!ativo), on: { click: fn } }, h('span.acao-ico', ico(i)), h('span', r)); }
    var cores = painel.cores ? h('div.cores-inline', { role: 'group', 'aria-label': 'Cor do destaque' }, CORES.map(function (c) {
      return h('button.cor-bolinha', { type: 'button', 'aria-label': c[1], 'aria-pressed': String(corAtual === c[0]), style: { background: 'var(--d-' + c[0] + ')' },
        on: { click: function () { vs.forEach(function (n) { Dados.salvar('destaques', chaveV(n), { cor: c[0], ref: chaveV(n), criadoEm: new Date().toISOString() }); }); UI.aviso('Destacado em ' + c[1].toLowerCase() + '.'); limparSel(); } } });
    }), corAtual ? h('button.bt.peq', { type: 'button', on: { click: function () { vs.forEach(function (n) { Dados.excluir('destaques', chaveV(n)); }); UI.aviso('Destaque removido.'); limparSel(); } } }, ico('lixo'), 'Remover') : null) : null;
    var conteudo = h('div.ev-area', { role: 'tabpanel' });
    barraEl.replaceChildren.apply(barraEl, [
      h('button.ev-alca', { type: 'button', 'aria-label': painel.aberto ? 'Recolher o estudo' : 'Abrir o estudo do versículo', on: { click: function () { painel.aberto = !painel.aberto; if (painel.aberto && !painel.aba) painel.aba = 'contexto'; mostrarBarra(); } } }, h('i')),
      h('div.topo', h('div.ev-ref', h('span', refSelecao()), h('small', Biblia.versao(versaoAtual()).sigla + (contigua() || vs.length === 1 ? '' : ' · estudo do v. ' + vs[0]))), h('div', { style: { flex: 1 } }),
        h('button.bt-ico', { type: 'button', 'aria-label': 'Limpar seleção', on: { click: limparSel } }, ico('fechar'))),
      h('div.acoes', { role: 'toolbar', 'aria-label': 'Ações' },
        acao(todosFav ? 'coracaoCheio' : 'coracao', todosFav ? 'Desfavoritar' : 'Favoritar', function () {
          vs.forEach(function (n) { var k = chaveV(n); if (todosFav) Dados.excluir('favoritos', k); else if (!App.ehFavorito(k)) Dados.salvar('favoritos', k, { ref: k, colecoes: [], criadoEm: new Date().toISOString() }); });
          UI.aviso(todosFav ? 'Removido dos favoritos.' : 'Salvo nos favoritos.'); limparSel();
        }, todosFav),
        acao('nota', 'Anotar', function () { var refs = vs.map(chaveV); limparSel(); Telas.biblioteca.editarNota({ refs: refs, texto: '' }); }),
        acao('marcador', 'Destacar', function () { painel.cores = !painel.cores; mostrarBarra(); }, painel.cores),
        acao('imagem', 'Criar arte', function () {
          if (!contigua()) { UI.aviso('Para a arte, selecione versículos seguidos.', true); return; }
          var s = A2Ref.formatar({ livro: atual.livro, cap: atual.cap, v1: vs[0], v2: vs[vs.length - 1] }, true);
          limparSel(); Telas.criar.comVersiculo(s);
        }),
        acao('copiar', 'Copiar', function () { UI.copiar(citacaoSel()); limparSel(); }),
        acao('compartilhar', 'Compartilhar', function () { App.compartilhar(citacaoSel(), 'Compartilhar versículos'); }),
        acao('comparar', 'Comparar', comparar),
        acao('ouvir', 'Ouvir daqui', function () { var n = vs[0]; limparSel(); iniciarAudio(n); })),
      cores,
      h('div.ev-cab', h('b', 'Estudo do versículo'), h('div', { style: { flex: 1 } }),
        painel.aberto ? h('button.bt-ico.peq', { type: 'button', 'aria-label': 'Recolher o estudo', on: { click: function () { painel.aberto = false; mostrarBarra(); } } }, ico('baixo')) : null),
      h('div.ev-abas', { role: 'tablist', 'aria-label': 'Estudo do versículo' }, EstudoVersiculo.ABAS.map(function (a) {
        var on = painel.aberto && painel.aba === a[0];
        return h('button.ev-aba' + (on ? '.ativa' : ''), { type: 'button', role: 'tab', 'aria-selected': String(on), 'data-aba': a[0], on: { click: function () {
          painel.aberto = true; painel.aba = a[0]; mostrarBarra(); rolarParaSelecao();
        } } }, ico(a[2]), h('span', a[1]));
      })),
      painel.aberto ? conteudo : null,
      h('button.bt.pri.ev-assistente', { type: 'button', on: { click: function () {
        var s = A2Ref.formatar({ livro: ref.livro, cap: ref.cap, v1: ref.v1, v2: ref.v2 }, true);
        limparSel(); Telas.assistente.estudar(s);
      } } }, ico('brilho'), 'Estudar com o Assistente')].filter(Boolean));
    if (painel.aberto) EstudoVersiculo.mostrar(painel.aba || 'contexto', ref, conteudo, { fechar: limparSel });
  }
  // Mantém a passagem selecionada visível acima do painel aberto
  function rolarParaSelecao() {
    var primeiro = conteudoEl && conteudoEl.querySelector('.v.sel');
    if (!primeiro) return;
    setTimeout(function () { var r = primeiro.getBoundingClientRect(); if (r.top < 70 || r.top > window.innerHeight * 0.22) window.scrollBy({ top: r.top - 80, behavior: 'smooth' }); }, 60);
  }

  function destacar() {
    var vs = selecionados();
    UI.folha('Destacar', function (api) {
      var atualCor = (Dados.obter('destaques', chaveV(vs[0])) || {}).cor;
      return h('div.form', h('div.cores', CORES.map(function (c) {
        return h('button.cor-bolinha', { 'aria-label': c[1], 'aria-pressed': String(atualCor === c[0]), style: { background: 'var(--d-' + c[0] + ')' },
          on: { click: function () { vs.forEach(function (n) { Dados.salvar('destaques', chaveV(n), { cor: c[0], ref: chaveV(n), criadoEm: new Date().toISOString() }); }); api.fechar(); limparSel(); } } });
      })), atualCor ? h('button.bt', { on: { click: function () { vs.forEach(function (n) { Dados.excluir('destaques', chaveV(n)); }); api.fechar(); limparSel(); } } }, ico('lixo'), 'Remover destaque') : null);
    });
  }

  async function comparar() {
    var vs = selecionados();
    UI.folha('Comparar traduções', function () {
      var corpo = h('div.form', h('p.sub', refSelecao()));
      Biblia.VERSOES.forEach(function (v) {
        var c = h('div.cartao', h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' } }, h('b', v.sigla), h('span.sub', v.nome), v.ativa ? null : h('span.selo.alerta', 'Aguardando licença')));
        if (v.ativa) {
          var t = h('p.texto-vers', { style: { font: '400 17px/1.6 var(--f-leitura)' } }, '…'); c.appendChild(t);
          Biblia.livro(atual.livro, v.id).then(function (lv) {
            t.replaceChildren();
            vs.forEach(function (n, i) {
              var tx = (lv.caps[atual.cap - 1] || [])[n - 1];
              if (i) t.appendChild(document.createTextNode(' '));
              t.appendChild(h('sup', { style: { color: 'var(--ouro)', fontWeight: 700, marginRight: '3px' } }, String(n)));
              t.appendChild(tx ? UI.textoComItalico(tx) : h('i.sub', 'versículo não existe nesta numeração'));
            });
          }, function (e) { t.textContent = e.message; });
        } else c.appendChild(h('p.sub', v.situacao));
        corpo.appendChild(c);
      });
      corpo.appendChild(h('p.sub', 'As traduções são exibidas lado a lado, sem mistura de textos. Novas traduções entram somente com o texto oficial e autorizado.'));
      return corpo;
    });
  }

  // ---------- seletores ----------
  // A escolha de livro e capítulo é a tela #livros (js/telas/livros.js); a barra inferior continua na aba Bíblia
  function escolherLivro() { App.ir('livros'); }

  function escolherTraducao() {
    UI.folha('Traduções', function (api) {
      var c = h('div.form');
      Biblia.VERSOES.forEach(function (v) {
        var ativa = v.id === versaoAtual();
        c.appendChild(h('button.item', { disabled: !v.ativa, style: v.ativa ? null : { opacity: .8, cursor: 'default' }, on: { click: function () { if (!v.ativa) return; App.salvarConfig({ traducao: v.id }); api.fechar(); App.recarregar(); } } },
          h('div.corpo', h('span.titulo', v.nome + ' (' + v.sigla + ')'), h('span.meta', v.ativa ? (ativa ? 'Em uso · ' : '') + (v.descricao || '') : v.situacao)),
          v.ativa ? (ativa ? ico('ok') : null) : h('span.selo.alerta', 'Licença pendente')));
      });
      Biblia.indice(versaoAtual()).then(function (ix) {
        c.appendChild(h('div.aviso', ico('info'), h('div', h('b', 'Sobre a ' + Biblia.versao(versaoAtual()).nome + '. '), ix.credito + ' ' + ix.alteracoes)));
      });
      return c;
    });
  }

  function ajustesLeitura() {
    UI.folha('Aparência da leitura', function () {
      var cfg = App.config();
      var faixa = h('input#tam-fonte', { type: 'range', min: 15, max: 28, step: 1, value: cfg.fonteTam });
      var valor = h('b', cfg.fonteTam + ' px');
      faixa.addEventListener('input', function () { document.documentElement.style.setProperty('--tam-leitura', faixa.value + 'px'); valor.textContent = faixa.value + ' px'; });
      faixa.addEventListener('change', function () { App.salvarConfig({ fonteTam: +faixa.value }); });
      function opc(nome, val, rot) {
        return h('button.chip', { 'aria-pressed': String(App.config()[nome] === val), on: { click: function (e) {
          var o = {}; o[nome] = val; App.salvarConfig(o);
          e.target.parentNode.querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b === e.target)); });
          if (nome === 'fonteLeitura') { conteudoEl.classList.toggle('serifa-ui', val === 'ui'); conteudoEl.classList.toggle('serifa-display', val === 'display'); }
        } } }, rot);
      }
      return h('div.form',
        h('label.campo', { for: 'tam-fonte' }, h('span', 'Tamanho do texto'), h('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } }, faixa, valor)),
        h('div.campo', h('span', 'Fonte'), h('div.chips', opc('fonteLeitura', 'leitura', 'Literata'), opc('fonteLeitura', 'display', 'Cormorant'), opc('fonteLeitura', 'ui', 'Sem serifa'))),
        h('div.campo', h('span', 'Tema'), h('div.chips', opc('tema', 'sistema', 'Automático'), opc('tema', 'claro', 'Claro'), opc('tema', 'escuro', 'Noturno'))),
        (function () { var cb = h('input.interruptor#refs-cruz', { type: 'checkbox' }); cb.checked = !!App.config().refsCruzadas;
          cb.addEventListener('change', function () { App.salvarConfig({ refsCruzadas: cb.checked }); desenhar(); });
          return h('label.chave', { for: 'refs-cruz' }, h('div', h('span', 'Referências cruzadas (†)'), h('small', 'Disponíveis nas edições Almeida 1911')), cb); })());
    });
  }

  // ---------- leitura em voz alta (voz sintética do aparelho) ----------
  function vozPt() {
    var vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    return vs.filter(function (v) { return /pt[-_]BR/i.test(v.lang); })[0] || vs.filter(function (v) { return /^pt/i.test(v.lang); })[0] || null;
  }
  function iniciarAudio(n) {
    if (!('speechSynthesis' in window)) { UI.aviso('Este aparelho não oferece leitura em voz alta.', true); return; }
    pararAudio();
    audio = { v: n || 1, tocando: true, el: null };
    var vel = App.config().audio.velocidade;
    var info = h('div.info', h('b', A2Ref.POR_ID[atual.livro].nome + ' ' + atual.cap), h('span.cont', 'Versículo ' + audio.v));
    var bPlay = h('button.bt-ico', { 'aria-label': 'Pausar', on: { click: alternar } }, ico('pausa'));
    var velSel = h('select#vel-audio', { 'aria-label': 'Velocidade' }, [0.75, 1, 1.25, 1.5, 1.75].map(function (x) { var o = h('option', { value: x }, x.toString().replace('.', ',') + '×'); if (x === vel) o.selected = true; return o; }));
    velSel.addEventListener('change', function () { App.salvarConfig({ audio: { velocidade: +velSel.value } }); falar(); });
    audio.el = h('div.audio', { role: 'region', 'aria-label': 'Leitura em voz alta' },
      h('button.bt-ico', { 'aria-label': 'Versículo anterior', on: { click: function () { audio.v = Math.max(1, audio.v - 1); falar(); } } }, ico('anterior')),
      bPlay,
      h('button.bt-ico', { 'aria-label': 'Próximo versículo', on: { click: function () { proximo(); } } }, ico('proximo')),
      info, velSel,
      h('button.bt-ico', { 'aria-label': 'Fechar leitura em voz alta', on: { click: pararAudio } }, ico('fechar')));
    document.body.appendChild(audio.el);
    audio.bPlay = bPlay; audio.info = info;
    if (!vozPt() && speechSynthesis.getVoices().length) UI.aviso('Não há voz em português neste aparelho; será usada a voz padrão.');
    falar();
    function alternar() {
      if (audio.tocando) { speechSynthesis.cancel(); audio.tocando = false; bPlay.replaceChildren(ico('play')); bPlay.setAttribute('aria-label', 'Continuar'); salvarPosicao(); }
      else { audio.tocando = true; bPlay.replaceChildren(ico('pausa')); bPlay.setAttribute('aria-label', 'Pausar'); falar(); }
    }
  }
  function falar() {
    if (!audio) return;
    speechSynthesis.cancel();
    var versos = dadosLivro.caps[atual.cap - 1];
    if (audio.v > versos.length) { pararAudio(); UI.aviso('Fim do capítulo.'); return; }
    conteudoEl.querySelectorAll('.v.foco').forEach(function (x) { x.classList.remove('foco'); });
    var span = conteudoEl.querySelector('[data-v="' + audio.v + '"]');
    if (span) { span.classList.add('foco'); span.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    audio.info.querySelector('.cont').textContent = 'Versículo ' + audio.v + ' de ' + versos.length;
    var t = UI.plano(versos[audio.v - 1] || '');
    if (!t) { proximo(); return; }
    var u = new SpeechSynthesisUtterance(t), voz = vozPt();
    if (voz) u.voice = voz; u.lang = 'pt-BR'; u.rate = App.config().audio.velocidade;
    var meu = audio;
    u.onend = function () { if (audio === meu && audio.tocando) proximo(); };
    u.onerror = function (e) { if (e.error !== 'interrupted' && e.error !== 'canceled') UI.aviso('A leitura em voz alta foi interrompida pelo aparelho.', true); };
    if (audio.tocando) speechSynthesis.speak(u);
  }
  function proximo() { audio.v++; salvarPosicao(); falar(); }
  function salvarPosicao() { if (audio) Dados.salvar('leitura', 'audio', { livro: atual.livro, cap: atual.cap, v: audio.v }); }
  function pararAudio() { if (audio) { try { speechSynthesis.cancel(); } catch (e) {} if (audio.el) audio.el.remove(); salvarPosicao(); audio = null; } }

  root.Telas.biblia = { render: render, escolherTraducao: escolherTraducao };
})(window);
