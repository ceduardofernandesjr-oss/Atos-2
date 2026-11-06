/* ATOS 2 — Biblioteca › Livros e Artigos: acervo de conhecimento cristão dentro da Biblioteca existente.
   Catálogo (app/acervo/catalogo.json) + edições da administração (pub/conteudo/acervo, editorial/rascunhos/acervo).
   Usa os sistemas que já existem: favoritos ("obra-<id>"), anotações (notas com "obra"), destaques ("obra-<id>-<seção>-<parágrafo>"),
   coleções (itens do tipo "obra") e a pesquisa da Biblioteca. Progresso e lista de leitura: coleção "leituraObras". */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone, A = A2Acervo;
  var PUBLICADO = 'https://ceduardofernandesjr-oss.github.io/Atos-2/';
  var CORES = [['amarelo', 'Amarelo'], ['verde', 'Verde'], ['azul', 'Azul'], ['rosa', 'Rosa'], ['lilas', 'Lilás']];
  var seed = [], carregado = false, promessa = null;

  // ---------------------------------------------------------------- catálogo
  function carregar() {
    if (!promessa) promessa = fetch('acervo/catalogo.json').then(function (r) { if (!r.ok) throw new Error('catálogo'); return r.json(); })
      .then(function (j) { seed = j.publicacoes || []; carregado = true; avisar(); }, function (e) { promessa = null; throw e; });
    return promessa;
  }
  function editor() { var e = Dados.estado; return !!(e.dono || e.podeEditar); }
  function todas() { return A.mesclar(seed, Dados.conteudo.acervo || [], editor() ? Dados.conteudo.acervoRevisao || [] : []); }
  function visiveis() { return todas().filter(A.visivel); }
  function porId(id) { var p = todas().filter(function (x) { return x.id === id; })[0]; return p && (A.visivel(p) || editor()) ? p : null; }
  function avisar() { if (App.estado.aba === 'biblioteca' && document.getElementById('tela')) App.atualizar(); }   // o leitor não se redesenha no meio da leitura
  Dados.ouvirConteudo(function (nome) { if (nome === 'acervo' || nome === 'acervoRevisao') avisar(); });
  setTimeout(function () { carregar().catch(function () {}); }, 0);

  var textos = {};
  function buscarJson(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error('Não encontrado'); return r.json(); }); }
  // Na prévia do claude.ai os textos longos não vão junto com o app: vêm da versão publicada
  function texto(p) {
    if (!textos[p.id]) textos[p.id] = buscarJson(p.arquivo).catch(function () { return buscarJson(PUBLICADO + p.arquivo); })
      .catch(function (e) { delete textos[p.id]; throw new Error('Não foi possível abrir o texto agora. Verifique a conexão.'); });
    return textos[p.id];
  }

  // ---------------------------------------------------------------- estado do leitor (favoritos, lista, progresso)
  function agora() { return new Date().toISOString(); }
  function ehFav(id) { return !!Dados.obter('favoritos', A.chaveFavorito(id)); }
  function alternarFav(p) {
    var k = A.chaveFavorito(p.id);
    if (ehFav(p.id)) { Dados.excluir('favoritos', k); UI.aviso('Removido dos favoritos.'); return false; }
    Dados.salvar('favoritos', k, { tipo: 'obra', obra: p.id, colecoes: [], criadoEm: agora() });
    UI.aviso('Salvo nos favoritos da Biblioteca.'); return true;
  }
  function leitura(id) { return Dados.obter('leituraObras', id) || null; }
  function naLista(id) { var e = leitura(id); return !!(e && e.lista); }
  function alternarLista(p) {
    var e = leitura(p.id) || {}, na = !e.lista;
    Dados.salvar('leituraObras', p.id, Object.assign({}, e, { lista: na, atualizadoEm: agora(), adicionadoEm: na ? agora() : e.adicionadoEm }));
    UI.aviso(na ? 'Adicionado à sua lista de leitura.' : 'Retirado da lista de leitura.'); return na;
  }
  function pct(p) { var e = leitura(p.id); return e ? A.progresso(e, e.total || 0) : 0; }
  function lendo(p) { var e = leitura(p.id); return !!(e && e.secao != null && !e.concluidoEm && p.acesso === 'integral'); }

  // ---------------------------------------------------------------- capas (identificação visual por tipo)
  function capa(p, tam) {
    var t = A.TIPOS[p.tipo] || A.TIPOS.livro;
    return h('div.capa-obra.c-' + p.tipo + '.c-' + (tam || 'm'), { 'aria-hidden': 'true' },
      h('span.capa-orn', ico(t.icone)),
      h('span.capa-tipo', t.nome),
      h('b.capa-tit', p.titulo),
      h('small.capa-aut', String(p.autor || '').split(/ e |,/)[0]));
  }
  function seloAcesso(p) {
    if (p.acesso === 'integral' || p.acesso === 'app') return h('span.selo-obra.no-app', ico('livro'), p.acesso === 'app' ? 'No app' : 'Ler no app');
    return h('span.selo-obra.fonte', ico('globo'), 'Na fonte');
  }
  function cartaoObra(p) {
    var e = leitura(p.id), progresso = e && e.secao != null ? pct(p) : 0;
    return h('button.obra-card', { 'data-obra': p.id, on: { click: function () { abrirFicha(p.id); } } }, capa(p, 'm'),
      h('div.obra-info',
        h('span.obra-tipo', [A.TIPOS[p.tipo].nome, A.IDIOMAS[p.idioma]].join(' · ')),
        h('b.obra-tit', p.titulo), h('small.obra-aut', p.autor + (p.ano ? ' · ' + p.ano : '')),
        h('div.obra-selos', seloAcesso(p), ehFav(p.id) ? h('span.selo-obra.fav', ico('coracaoCheio'), 'Favorito') : null,
          A.situacao(p) !== 'publicado' ? h('span.selo-obra.revisao', A.situacao(p) === 'retirado' ? 'Retirado' : 'Em revisão') : null),
        progresso ? h('div.obra-prog', h('span.trilho', h('i', { style: { width: progresso + '%' } })), h('small', progresso + '% lido')) : null));
  }
  function cartaoMini(p) {
    var progresso = lendo(p) ? pct(p) : 0;
    return h('button.obra-mini', { 'data-obra': p.id, on: { click: function () { if (lendo(p)) abrirLeitura(p.id); else abrirFicha(p.id); } } }, capa(p, 'p'),
      h('b', p.titulo), h('small', progresso ? progresso + '% lido · continuar' : p.autor));
  }

  // ---------------------------------------------------------------- seção da Biblioteca
  function secaoTitulo(t, link, fn) { return h('div.secao', h('h2', t), h('div.esp'), link ? h('button.link-secao', { on: { click: fn } }, link, ico('direita')) : null); }
  function seletor(id, rotulo, opcoes, atual, fn) {
    var s = h('select.entrada.filtro-obra#' + id, { 'aria-label': rotulo }, opcoes.map(function (o) { var op = h('option', { value: o[0] }, o[1]); if (o[0] === (atual || '')) op.selected = true; return op; }));
    s.addEventListener('change', function () { fn(s.value); });
    return s;
  }
  function secao(area) {
    if (!carregado) {
      area.appendChild(h('div.carregando', h('div.giro')));
      carregar().then(function () { if (area.isConnected) { area.replaceChildren(); secao(area); } }, function () { if (area.isConnected) area.replaceChildren(h('div.vazio-bib', h('b', 'Não foi possível abrir o acervo agora.'), h('p', 'Verifique a conexão e tente de novo.'))); });
      return;
    }
    var vis = visiveis(), r = A.resumo(vis), est = App.estado;
    area.appendChild(h('section.bib-resumo.acervo-resumo', { 'aria-label': 'Resumo do acervo' },
      h('span.sobre', 'Acervo de conhecimento cristão'),
      h('p.acervo-lema', 'Livros, artigos e documentos selecionados, com procedência e licença conferidas.'),
      h('div.bib-nums.tres', [['', r.total, 'Publicações', 'livro'], ['app', r.noApp, 'Para ler no app', 'olho'], ['pt', r.portugues, 'Em português', 'globo']].map(function (x) {
        return h('button.bib-num', { 'data-num-acervo': x[0] || 'todos', on: { click: function () { est.acervoAcesso = x[0] === 'app' ? 'app' : ''; est.acervoIdioma = x[0] === 'pt' ? 'pt' : ''; est.acervoCat = 'todas'; App.recarregar(); } } },
          ico(x[3]), h('b', String(x[1])), h('small', x[2]));
      }))));
    if (editor()) {
      var pend = todas().filter(function (p) { return A.situacao(p) === 'revisao' || p._revisaoPendente; }).length;
      area.appendChild(h('div.acervo-admin', ico('escudo'), h('span', 'Administração do acervo', pend ? h('small', pend + ' em revisão') : null), h('div.esp'),
        h('button.bt.peq#acervo-admin', { on: { click: admin } }, 'Administrar')));
    }
    var continuar = vis.filter(lendo).sort(function (a, b) { return String((leitura(b.id) || {}).atualizadoEm).localeCompare(String((leitura(a.id) || {}).atualizadoEm)); });
    if (continuar.length) { area.appendChild(secaoTitulo('Continue lendo')); area.appendChild(h('div.obras-linha', continuar.map(cartaoMini))); }
    var lista = vis.filter(function (p) { return naLista(p.id); });
    if (lista.length) { area.appendChild(secaoTitulo('Minha lista de leitura')); area.appendChild(h('div.obras-linha#lista-leitura', lista.map(cartaoMini))); }

    var cat = est.acervoCat || 'todas';
    var chips = h('div.chips.cats-bib.subcats-acervo', { role: 'tablist', 'aria-label': 'Subcategorias' },
      [['todas', 'Todas', r.total]].concat(A.CATEGORIAS.map(function (c) { return [c.id, c.nome, r.porCategoria[c.id] || 0]; })).map(function (c) {
        return h('button.chip', { role: 'tab', 'aria-pressed': String(cat === c[0]), 'aria-selected': String(cat === c[0]), 'data-subcat': c[0],
          on: { click: function () { est.acervoCat = c[0]; App.recarregar(); } } }, c[1], h('small.n', String(c[2])));
      }));
    area.appendChild(secaoTitulo(cat === 'todas' ? 'Livros e artigos' : A.CATEGORIAS.filter(function (c) { return c.id === cat; })[0].nome));
    area.appendChild(chips);
    setTimeout(function () { var ch = chips.querySelector('[aria-pressed="true"]'); if (ch && ch.scrollIntoView && chips.scrollWidth > chips.clientWidth) ch.scrollIntoView({ inline: 'center', block: 'nearest' }); }, 0);
    area.appendChild(h('div.filtros-acervo',
      seletor('acervo-tipo', 'Tipo de publicação', [['', 'Todos os tipos']].concat(Object.keys(A.TIPOS).map(function (k) { return [k, A.TIPOS[k].nome]; })), est.acervoTipo, function (v) { est.acervoTipo = v; App.recarregar(); }),
      seletor('acervo-idioma', 'Idioma', [['', 'Todos os idiomas'], ['pt', 'Português'], ['en', 'Inglês']], est.acervoIdioma, function (v) { est.acervoIdioma = v; App.recarregar(); }),
      seletor('acervo-acesso', 'Acesso', [['', 'Todo o acesso'], ['app', 'Ler no app'], ['link', 'Na fonte original']], est.acervoAcesso, function (v) { est.acervoAcesso = v; App.recarregar(); }),
      seletor('acervo-ordem', 'Ordenar', [['portugues', 'Português primeiro'], ['titulo', 'Título A–Z'], ['autor', 'Autor A–Z'], ['ano', 'Mais antigos']], est.acervoOrdem || 'portugues', function (v) { est.acervoOrdem = v; App.recarregar(); })));
    var res = A.ordenar(A.filtrar(vis, { categoria: cat, tipo: est.acervoTipo, idioma: est.acervoIdioma, acesso: est.acervoAcesso }), est.acervoOrdem || 'portugues');
    area.appendChild(h('p.sub.acervo-total', res.length ? res.length + (res.length > 1 ? ' publicações' : ' publicação') : ''));
    if (!res.length) area.appendChild(h('div.vazio-bib', h('span.vazio-ico', ico('livro')), h('b', 'Nenhuma publicação com esses filtros.'), h('p', 'Troque a subcategoria, o tipo, o idioma ou o acesso.'),
      h('button.bt', { on: { click: function () { est.acervoCat = 'todas'; est.acervoTipo = est.acervoIdioma = est.acervoAcesso = ''; App.recarregar(); } } }, 'Limpar filtros')));
    else area.appendChild(h('div.obras-grade', res.map(cartaoObra)));
    area.appendChild(h('div.nota-editorial', ico('info'), h('p', h('b', 'Linha editorial. '), 'O acervo é cristocêntrico e não se limita a uma denominação. Cada ficha indica a tradição teológica do autor quando ela é conhecida; nenhuma interpretação particular é apresentada como consenso de todos os cristãos. Obras em inglês aparecem no idioma original até haver tradução em domínio público ou autorizada.')));
  }

  // Bloco curto para a categoria "Todos" da Biblioteca
  function teaser(area) {
    if (!carregado) { carregar().catch(function () {}); return; }
    var vis = visiveis(); if (!vis.length) return;
    var esc = vis.filter(lendo).concat(vis.filter(function (p) { return naLista(p.id) || ehFav(p.id); }), A.ordenar(vis, 'portugues'));
    var vistos = {}, sel = esc.filter(function (p) { if (vistos[p.id]) return false; vistos[p.id] = 1; return true; }).slice(0, 8);
    area.appendChild(secaoTitulo('Livros e artigos', 'Ver acervo', function () { App.estado.secaoBiblioteca = 'acervo'; App.estado.bibBusca = ''; App.recarregar(); window.scrollTo(0, 0); }));
    area.appendChild(h('div.obras-linha#acervo-destaques', sel.map(cartaoMini)));
  }

  // ---------------------------------------------------------------- ficha da publicação
  function dataBr(iso) { return iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : ''; }
  function linhaFicha(rotulo, valor) { return valor ? h('div.ficha-linha', h('dt', rotulo), h('dd', valor)) : null; }
  function link(url, texto) { return h('a.link-fonte', { href: url, target: '_blank', rel: 'noopener noreferrer' }, texto || url, ico('direita')); }
  function botaoPrincipal(p, api) {
    if (p.acesso === 'integral') {
      var e = leitura(p.id), cont = e && e.secao != null && !e.concluidoEm;
      return h('button.bt.pri#obra-ler', { on: { click: function () { if (api) api.fechar(); abrirLeitura(p.id); } } }, ico('livro'), cont ? 'Continuar leitura (' + pct(p) + '%)' : e && e.concluidoEm ? 'Ler de novo' : 'Ler agora');
    }
    if (p.acesso === 'app') return h('button.bt.pri#obra-ler', { on: { click: function () { if (api) api.fechar(); abrirNoApp(p); } } }, ico('livro'), 'Abrir no app');
    return h('a.bt.pri#obra-fonte', { href: p.fonte.url, target: '_blank', rel: 'noopener noreferrer', on: { click: function () { registrarAbertura(p); } } }, ico('globo'), 'Ler na fonte original');
  }
  function registrarAbertura(p) { var e = leitura(p.id) || {}; Dados.salvar('leituraObras', p.id, Object.assign({}, e, { abertoEm: agora(), atualizadoEm: agora() })); }
  function abrirNoApp(p) {
    if (p.rota === 'mural:teses') { App.estado.muralAba = 'teses'; if (App.estado.aba === 'mural') App.recarregar(); else App.ir('mural'); }
  }
  function acoesIcone(p, api) {
    var fav = h('button.acao-obra#obra-fav', { 'aria-pressed': String(ehFav(p.id)), on: { click: function () { fav.setAttribute('aria-pressed', String(alternarFav(p))); fav.querySelector('small').textContent = ehFav(p.id) ? 'Favorito' : 'Favoritar'; } } },
      h('span.acao-ico', ico('coracao')), h('small', ehFav(p.id) ? 'Favorito' : 'Favoritar'));
    var lst = h('button.acao-obra#obra-lista', { 'aria-pressed': String(naLista(p.id)), on: { click: function () { lst.setAttribute('aria-pressed', String(alternarLista(p))); lst.querySelector('small').textContent = naLista(p.id) ? 'Na lista' : 'Ler depois'; } } },
      h('span.acao-ico', ico('marcador')), h('small', naLista(p.id) ? 'Na lista' : 'Ler depois'));
    return h('div.acoes-obra', fav, lst,
      h('button.acao-obra#obra-colecao', { on: { click: function () { if (api) api.fechar(); setTimeout(function () { Telas.biblioteca.escolherColecoes(A.itemBiblioteca(p)); }, 30); } } }, h('span.acao-ico', ico('colecao')), h('small', 'Coleção')),
      h('button.acao-obra#obra-assistente', { on: { click: function () { estudar(p, null); } } }, h('span.acao-ico', ico('brilho')), h('small', 'Assistente')),
      h('button.acao-obra', { on: { click: function () { compartilhar(p); } } }, h('span.acao-ico', ico('compartilhar')), h('small', 'Compartilhar')));
  }
  function compartilhar(p) {
    App.compartilhar(p.titulo + ' — ' + p.autor + '\n' + (p.descricao || '') + '\n\n' + A.citacao(p) + '\n\n— Biblioteca do ATOS 2', 'Compartilhar publicação');
  }
  function abrirFicha(id) {
    var p = porId(id);
    if (!p) { UI.aviso(carregado ? 'Esta publicação não está disponível.' : 'Abrindo o acervo…', !carregado ? false : true); if (!carregado) carregar().then(function () { abrirFicha(id); }); return; }
    UI.folha(A.TIPOS[p.tipo].nome, function (api) {
      var c = h('div.form.ficha-obra');
      var sit = A.situacao(p);
      if (sit !== 'publicado') c.appendChild(h('div.aviso.aviso-revisao', ico('escudo'), h('span', h('b', sit === 'retirado' ? 'Retirado do acervo. ' : 'Em revisão. '), 'Esta publicação não aparece para os leitores.' + (A.podePublicar(A.aprovar(p, 'x', agora())).faltas.length ? ' Falta: ' + A.podePublicar(A.aprovar(p, 'x', agora())).faltas.join(', ') + '.' : ''))));
      if (p.origem && p.origem.ia) c.appendChild(h('div.aviso-ia', ico('brilho'), h('span', 'Tradução do ATOS 2 feita com apoio de IA a partir do original em domínio público. Só é publicada depois de revisada por um editor.')));
      c.appendChild(h('div.ficha-cab', capa(p, 'g'), h('div.ficha-tit',
        h('span.obra-tipo', A.TIPOS[p.tipo].nome + ' · ' + A.CATEGORIAS.filter(function (x) { return x.id === p.categoria; })[0].nome),
        h('h2', p.titulo), p.tituloOriginal ? h('p.sub.tit-original', p.tituloOriginal) : null,
        h('b.ficha-autor', p.autor + (p.autorDatas ? ' (' + p.autorDatas + ')' : '')))));
      c.appendChild(h('div.linha-bts.ficha-bts', botaoPrincipal(p, api), p.acesso === 'link' ? h('small.sub', 'Abre o site da publicação original') : null));
      var par = outraLingua(p);
      if (par) c.appendChild(h('button.outra-lingua#obra-outra-lingua', { type: 'button', on: { click: function () { api.fechar(); setTimeout(function () { abrirFicha(par.id); }, 30); } } },
        ico('globo'), h('span.outra-lingua-txt', h('b', par.idioma === 'pt' ? 'Ler em português' : 'Ver o original em inglês'), h('small', par.idioma === 'pt' ? 'Tradução do ATOS 2' + (A.visivel(par) ? '' : ' — em revisão') : 'Tradução inglesa de ' + (par.tradutor || 'domínio público'))), ico('direita')));
      c.appendChild(acoesIcone(p, api));
      c.appendChild(h('p.ficha-desc', p.descricao));
      if ((p.temas || []).length) c.appendChild(h('div.chips.quebra.temas-obra', p.temas.map(function (t) { return h('span.chip.peq', t); })));
      var lic = p.licenca || {};
      c.appendChild(h('dl.ficha-dados',
        linhaFicha('Autor', p.autor + (p.autorDatas ? ' (' + p.autorDatas + ')' : '')),
        linhaFicha('Tradução', p.tradutor),
        linhaFicha('Tradição teológica', p.tradicao),
        linhaFicha('Data', p.ano),
        linhaFicha('Edição', p.edicao),
        linhaFicha('Idioma', A.IDIOMAS[p.idioma] + (p.idioma === 'en' ? ' (texto original da tradução inglesa)' : '')),
        linhaFicha('Tipo', A.TIPOS[p.tipo].nome),
        linhaFicha('Fonte original', p.fonte && p.fonte.url ? h('span', p.fonte.nome + ' — ', link(p.fonte.url, 'abrir')) : p.fonte && p.fonte.nome),
        linhaFicha('Licença', h('span', h('b', lic.nome || ''), lic.detalhe ? h('small.sub', lic.detalhe) : null)),
        linhaFicha('Acesso', A.ACESSOS[p.acesso] + (p.acesso === 'link' ? ' — o ATOS 2 mostra só os dados bibliográficos' : '')),
        linhaFicha('Procedência', p.procedencia ? h('span', p.procedencia.arquivo, p.procedencia.tratamento ? h('small.sub', p.procedencia.tratamento) : null) : null),
        linhaFicha('Verificação', h('span', (p.verificacao && p.verificacao.direitos === 'verificado' ? 'Direitos conferidos em ' + dataBr(p.verificacao.em) : 'Direitos ainda não conferidos') +
          (p.verificacao && p.verificacao.editorialEm ? ' · revisão editorial em ' + dataBr(p.verificacao.editorialEm) + (p.verificacao.editorialPor ? ' (' + p.verificacao.editorialPor + ')' : '') : ' · aguardando revisão editorial'))),
        linhaFicha('Como citar', h('span.citacao', A.citacao(p, new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }))))));
      if (editor()) c.appendChild(h('div.linha-bts.ficha-admin',
        sit !== 'publicado' || p._revisaoPendente ? h('button.bt#obra-revisar', { on: { click: function () { api.fechar(); setTimeout(function () { revisar(p.id); }, 30); } } }, ico('escudo'), 'Revisar e publicar') : null,
        h('button.bt', { on: { click: function () { api.fechar(); setTimeout(function () { editar(p); }, 30); } } }, ico('editar'), 'Editar dados'),
        sit === 'publicado' ? h('button.bt.perigo', { on: { click: function () { retirar(p, api); } } }, ico('lixo'), 'Retirar do acervo') : null));
      return c;
    }, { cheia: true });
  }
  // original ↔ tradução: a tradução aponta para o original em traducaoDe; só aparece o que o leitor pode abrir
  function outraLingua(p) {
    if (p.traducaoDe) return porId(p.traducaoDe);
    var t = todas().filter(function (x) { return x.traducaoDe === p.id && !x.removido; })
      .map(function (x) { return porId(x.id); }).filter(Boolean);
    return t.filter(A.visivel)[0] || t[0] || null;
  }
  function acoes(id) { abrirFicha(id); }

  // ---------------------------------------------------------------- leitor de livros e documentos (rota #obra)
  function abrirLeitura(id, pos) {
    App.estado.obra = Object.assign({ id: id }, pos || {});
    UI.fecharTodas();
    if (App.estado.aba === 'obra') App.recarregar(); else App.ir('obra');
  }
  function marcasDa(id) {
    var d = {}, n = {};
    Dados.todos('destaques').forEach(function (x) { if (x.tipo === 'obra' && x.obra === id) d[x.secao + '-' + x.par] = x.cor; });
    Dados.todos('notas').forEach(function (x) { if (x.obra && x.obra.id === id) n[x.obra.secao + '-' + x.obra.par] = (n[x.obra.secao + '-' + x.obra.par] || 0) + 1; });
    return { d: d, n: n };
  }
  // texto com {itálico} e referências bíblicas tocáveis
  function formatar(t, idioma) {
    var frag = document.createDocumentFragment();
    String(t).split(/(\{[^}]*\})/).forEach(function (pedaco) {
      if (!pedaco) return;
      if (pedaco[0] === '{') { frag.appendChild(h('i', pedaco.slice(1, -1))); return; }
      var refs = idioma === 'pt' ? A2Assistente.referenciasNoTexto(pedaco, function (s) { return Biblia.interpretar(s); }).map(function (r) { return { inicio: r.inicio, fim: r.fim, livro: r.ref.livro, cap: r.ref.cap, v: r.ref.v1 }; })
        : A.referenciasIngles(pedaco);
      var pos = 0;
      refs.forEach(function (r) {
        if (r.inicio < pos) return;
        frag.appendChild(document.createTextNode(pedaco.slice(pos, r.inicio)));
        frag.appendChild(h('button.ref-obra', { type: 'button', title: 'Abrir na Bíblia', on: { click: function (ev) { ev.stopPropagation(); App.abrirBiblia(r.livro, r.cap, r.v); } } }, pedaco.slice(r.inicio, r.fim)));
        pos = r.fim;
      });
      frag.appendChild(document.createTextNode(pedaco.slice(pos)));
    });
    return frag;
  }
  function renderObra(tela) {
    var est = App.estado.obra;
    if (!est || !est.id) { App.ir('biblioteca'); return; }
    if (!carregado) { tela.appendChild(h('div.carregando', h('div.giro'))); carregar().then(function () { App.recarregar(); }, function () {}); return; }
    var p = porId(est.id);
    if (!p || p.acesso !== 'integral') { tela.appendChild(h('div.vazio', h('b', 'Esta publicação não está disponível para leitura no app.'), h('button.bt', { on: { click: function () { App.ir('biblioteca'); } } }, 'Voltar à Biblioteca'))); return; }
    document.body.classList.add('lendo-obra');
    App.aoSair(function () { document.body.classList.remove('lendo-obra', 'selecionando'); var b = document.querySelector('.painel-obra'); if (b) b.remove(); });
    var titSecao = h('small.obra-cab-sec', ''), barra = h('i');
    var sumarioBt = h('button.bt-ico#obra-sumario', { 'aria-label': 'Sumário', title: 'Sumário' }, ico('menu'));
    tela.appendChild(h('header.leitor-cab.obra-cab',
      h('button.bt-ico#obra-voltar', { 'aria-label': 'Voltar à Biblioteca', on: { click: function () { App.estado.secaoBiblioteca = 'acervo'; App.ir('biblioteca'); } } }, ico('esquerda')),
      h('button.obra-cab-tit', { on: { click: function () { abrirFicha(p.id); } } }, h('b', p.titulo), titSecao), h('div.esp'),
      sumarioBt,
      h('button.bt-ico', { 'aria-label': 'Tamanho do texto', title: 'Tamanho do texto', on: { click: tamanhoTexto } }, ico('texto')),
      h('div.obra-barra', barra)));
    var corpo = h('article.obra-leitura', h('div.carregando', h('div.giro')));
    tela.appendChild(corpo);
    texto(p).then(function (t) {
      if (!corpo.isConnected) return;
      var N = t.secoes.length, e = leitura(p.id) || {};
      var inicio = t.secoes[0] && t.secoes[0].titulo === 'Folha de rosto' && N > 1 ? 1 : 0;   // a leitura começa no texto, não na folha de rosto
      var i = est.secao != null ? est.secao : e.secao != null ? e.secao : inicio, parInicial = est.secao != null ? est.par : e.par;
      i = Math.max(0, Math.min(N - 1, i || 0));
      sumarioBt.addEventListener('click', function () { sumario(p, t, i, function (k) { mostrarSecao(k, 0); }); });
      var ultimoSalvo = '', salvarT;
      function salvar(sec, par, vista) {
        var atual = leitura(p.id) || {}, vistas = Object.assign({}, atual.secoesVistas || {});
        if (vista) vistas[sec] = true;
        var chave = sec + ':' + par + ':' + Object.keys(vistas).length;
        if (chave === ultimoSalvo) return; ultimoSalvo = chave;
        Dados.salvar('leituraObras', p.id, Object.assign({}, atual, { secao: sec, par: par, total: N, secoesVistas: vistas, iniciadoEm: atual.iniciadoEm || agora(), atualizadoEm: agora() }));
      }
      function mostrarSecao(k, par) {
        i = k; fecharPainel();
        var s = t.secoes[k], marcas = marcasDa(p.id);
        titSecao.textContent = s.titulo;
        barra.style.width = Math.round((k + 1) / N * 100) + '%';
        var cab = h('header.obra-sec-cab', h('span.rotulo', 'Seção ' + (k + 1) + ' de ' + N), h('h1', s.titulo), s.original && s.original !== s.titulo ? h('p.sub.tit-original', s.original) : null);
        var avisos = [];
        if (k <= inicio || par == null) {
          if (p.idioma === 'en') avisos.push(h('div.aviso.aviso-idioma', ico('globo'), h('span', 'Texto original em inglês' + (p.tradutor ? ' (tradução de ' + p.tradutor.replace(/ \(.*\)$/, '') + ')' : '') + ', em domínio público. Toque em um parágrafo para destacar, anotar ou estudar com o Assistente.')));
          if (p.origem && p.origem.ia) avisos.push(h('div.aviso-ia', ico('brilho'), h('span', 'Tradução do ATOS 2 com apoio de IA, em revisão editorial.')));
        }
        var rosto = s.titulo === 'Folha de rosto';
        var paras = s.p.map(function (x, j) {
          if (x && typeof x === 'object') return h('h3.obra-sub', formatar(x.h, p.idioma));
          var cor = marcas.d[k + '-' + j], nNotas = marcas.n[k + '-' + j];
          var el = h('p.obra-par' + (rosto ? '.rosto' : '') + (cor ? '.d-' + cor : ''), { 'data-p': String(j), tabindex: '0' }, formatar(x, p.idioma), nNotas ? h('span.marca-nota-obra', { title: 'Anotação' }, ico('editar')) : null);
          el.addEventListener('click', function () { selecionar(k, j, el, x); });
          el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') selecionar(k, j, el, x); });
          return el;
        });
        var nav = h('nav.obra-nav',
          k > 0 ? h('button.bt#obra-anterior', { on: { click: function () { mostrarSecao(k - 1, 0); window.scrollTo(0, 0); } } }, ico('esquerda'), 'Anterior') : h('span'),
          k < N - 1 ? h('button.bt.pri#obra-proxima', { on: { click: function () { salvar(k, 0, true); mostrarSecao(k + 1, 0); window.scrollTo(0, 0); } } }, 'Próxima', ico('direita'))
            : h('button.bt.pri#obra-concluir', { on: { click: function () {
              var atual = leitura(p.id) || {}, vistas = Object.assign({}, atual.secoesVistas || {}); vistas[k] = true;
              Dados.salvar('leituraObras', p.id, Object.assign({}, atual, { secao: k, par: 0, total: N, secoesVistas: vistas, concluidoEm: agora(), atualizadoEm: agora() }));
              UI.aviso('Leitura concluída. Que bom!'); App.estado.secaoBiblioteca = 'acervo'; App.ir('biblioteca');
            } } }, ico('ok'), 'Concluir leitura'));
        corpo.replaceChildren.apply(corpo, [cab].concat(avisos, paras, [nav]));
        salvar(k, par || 0, false);
        if (par) { var alvo = corpo.querySelector('[data-p="' + par + '"]'); if (alvo) setTimeout(function () { var y = alvo.getBoundingClientRect().top + window.scrollY - 90; window.scrollTo(0, Math.max(0, y)); }, 30); }
        else window.scrollTo(0, 0);
      }
      function aoRolar() {
        clearTimeout(salvarT);
        salvarT = setTimeout(function () {
          if (!corpo.isConnected) return;
          var ps = corpo.querySelectorAll('.obra-par'), par = 0;
          for (var q = 0; q < ps.length; q++) { if (ps[q].getBoundingClientRect().bottom > 100) { par = +ps[q].dataset.p; break; } }
          var fim = window.innerHeight + window.scrollY >= document.body.scrollHeight - 40;
          salvar(i, par, fim);
        }, 700);
      }
      window.addEventListener('scroll', aoRolar, { passive: true });
      App.aoSair(function () { window.removeEventListener('scroll', aoRolar); clearTimeout(salvarT); });
      mostrarSecao(i, parInicial);
      App.estado.obra = { id: p.id };
    }, function (erro) {
      corpo.replaceChildren(h('div.vazio-bib', h('span.vazio-ico', ico('livro')), h('b', 'O texto não abriu.'), h('p', erro.message),
        p.fonte && p.fonte.url ? link(p.fonte.url, 'Abrir a fonte original') : null, h('button.bt', { on: { click: function () { App.recarregar(); } } }, 'Tentar de novo')));
    });

    // ---- seleção de parágrafo: o mesmo painel inferior do leitor da Bíblia
    var painel = null;
    function fecharPainel() {
      document.querySelectorAll('.obra-par.sel').forEach(function (x) { x.classList.remove('sel'); });
      if (painel) { painel.remove(); painel = null; }
      document.body.classList.remove('selecionando');
    }
    function selecionar(k, j, el, txt) {
      if (el.classList.contains('sel')) { fecharPainel(); return; }
      fecharPainel(); el.classList.add('sel'); document.body.classList.add('selecionando');
      var plano = UI.plano(txt), trecho = plano.length > 600 ? plano.slice(0, 600) + '…' : plano;
      var chaveD = A.chaveDestaque(p.id, k, j), corAtual = (Dados.obter('destaques', chaveD) || {}).cor;
      var cores = h('div.cores-inline', { hidden: true }, CORES.map(function (c) {
        return h('button.cor-bolinha', { 'aria-label': c[1], 'aria-pressed': String(corAtual === c[0]), style: { background: 'var(--d-' + c[0] + ')' }, on: { click: function () {
          Dados.salvar('destaques', chaveD, { tipo: 'obra', obra: p.id, secao: k, par: j, cor: c[0], trecho: trecho, titulo: p.titulo, criadoEm: agora() });
          CORES.forEach(function (x) { el.classList.remove('d-' + x[0]); }); el.classList.add('d-' + c[0]); fecharPainel(); UI.aviso('Trecho destacado.');
        } } });
      }), corAtual ? h('button.bt.peq', { on: { click: function () { Dados.excluir('destaques', chaveD); CORES.forEach(function (x) { el.classList.remove('d-' + x[0]); }); fecharPainel(); } } }, 'Remover') : null);
      function acao(icone, rotulo, fn, id) { return h('button' + (id ? '#' + id : ''), { type: 'button', on: { click: fn } }, h('span.acao-ico', ico(icone)), rotulo); }
      painel = h('section.barra-sel.painel-estudo.painel-obra', { 'aria-label': 'Trecho selecionado', 'data-estado': 'compacto' },
        h('div.topo', h('div.ev-ref', h('span', p.titulo), h('small', 'Seção ' + (k + 1) + ' · parágrafo ' + (j + 1))), h('div.esp'),
          h('button.bt-ico', { 'aria-label': 'Fechar', on: { click: fecharPainel } }, ico('fechar'))),
        h('div.acoes',
          acao('marcador', 'Destacar', function () { cores.hidden = !cores.hidden; }, 'obra-destacar'),
          acao('editar', 'Anotar', function () { fecharPainel(); Telas.biblioteca.editarNota({ refs: [], texto: '', obra: { id: p.id, secao: k, par: j, trecho: trecho } }); }, 'obra-anotar'),
          acao('copiar', 'Copiar', function () { UI.copiar('“' + plano + '”\n— ' + p.autor + ', ' + p.titulo); fecharPainel(); }),
          acao('compartilhar', 'Compartilhar', function () { App.compartilhar('“' + plano + '”\n— ' + p.autor + ', ' + p.titulo + '\n\n' + A.citacao(p), 'Compartilhar trecho'); }),
          acao('brilho', 'Assistente', function () { estudar(p, { secao: k, par: j, texto: plano }); }, 'obra-assistente-trecho')),
        cores);
      document.body.appendChild(painel);
    }
  }
  function sumario(p, t, atual, ir) {
    UI.folha('Sumário', function (api) {
      var e = leitura(p.id) || {}, vistas = e.secoesVistas || {};
      return h('div.lista.sumario-obra', t.secoes.map(function (s, k) {
        return h('button.item' + (k === atual ? '.atual' : ''), { on: { click: function () { api.fechar(); ir(k); } } },
          vistas[k] ? ico('ok') : h('span.num-sec', String(k + 1)), h('div.corpo', h('span.titulo', s.titulo), h('span.meta', s.p.filter(function (x) { return typeof x === 'string'; }).length + ' parágrafos')));
      }));
    }, { cheia: true });
  }
  function tamanhoTexto() {
    UI.folha('Tamanho do texto', function () {
      var cfg = App.config(), v = h('b', cfg.fonteTam + ' px');
      function mudar(d) { var n = Math.max(15, Math.min(28, App.config().fonteTam + d)); App.salvarConfig({ fonteTam: n }); document.documentElement.style.setProperty('--tam-leitura', n + 'px'); v.textContent = n + ' px'; }
      return h('div.form', h('div.linha-bts', h('button.bt', { on: { click: function () { mudar(-1); } } }, 'A−'), v, h('button.bt', { on: { click: function () { mudar(1); } } }, 'A+')),
        h('p.sub', 'O mesmo tamanho vale para a Bíblia.'));
    });
  }

  // ---------------------------------------------------------------- Assistente Bíblico
  // trecho: { secao, par, texto } (só de obras com texto autorizado) ou null (referência bibliográfica)
  function estudar(p, trecho) {
    var autorizado = !!trecho && p.acesso === 'integral';
    UI.folha('Estudar com o Assistente Bíblico', function (api) {
      var c = h('div.form.estudo-obra');
      c.appendChild(h('div.bloco-original',
        h('span.rotulo', autorizado ? 'Conteúdo original do autor' : 'Referência bibliográfica'),
        autorizado ? h('blockquote', '“' + trecho.texto + '”') : h('p', p.descricao),
        h('small.sub', A.citacao(p) + (autorizado ? ' Seção ' + (trecho.secao + 1) + ', parágrafo ' + (trecho.par + 1) + '.' : ''))));
      var refs = autorizado ? (p.idioma === 'pt' ? A2Assistente.referenciasNoTexto(trecho.texto, function (s) { return Biblia.interpretar(s); }).map(function (r) { return { livro: r.ref.livro, cap: r.ref.cap, v: r.ref.v1 }; }) : A.referenciasIngles(trecho.texto)) : [];
      if (refs.length) c.appendChild(h('div.campo', h('span', 'Passagens bíblicas citadas no trecho'), h('div.chips.quebra', refs.map(function (r) {
        return h('button.chip', { on: { click: function () { api.fechar(); App.abrirBiblia(r.livro, r.cap, r.v); } } }, A2Ref.formatar({ livro: r.livro, cap: r.cap, v1: r.v, v2: r.v }, true));
      }))));
      var area = h('div.resposta-ia'), estado = h('p.sub', { role: 'status', 'aria-live': 'polite' });
      var bt = h('button.bt.pri#assist-obra-ia', ico('brilho'), autorizado ? 'Explicar este trecho' : 'Explicar o tema da obra');
      c.appendChild(h('div.linha-bts', bt)); c.appendChild(estado); c.appendChild(area);
      c.appendChild(h('div.aviso-ia', ico('brilho'), h('span', 'A explicação é gerada por IA e aparece separada do texto do autor. As referências bíblicas sugeridas são conferidas antes de aparecer; confira tudo nas Escrituras.')));
      bt.addEventListener('click', async function () {
        var sample = null; try { sample = root.claude && root.claude.use ? await root.claude.use('sample') : null; } catch (e) {}
        if (!sample) {
          estado.textContent = '';
          area.replaceChildren(h('div.cartao', h('p', 'Nesta versão o Assistente funciona sem IA. Você pode abrir as passagens citadas acima, verificar uma afirmação do autor no Modo Bereano ou estudar uma passagem no Assistente.'),
            h('div.linha-bts', h('button.bt', { on: { click: function () { api.fechar(); App.estado.assistenteModo = 'bereano'; App.ir('assistente'); } } }, ico('escudo'), 'Modo Bereano'),
              h('button.bt', { on: { click: function () { api.fechar(); App.estado.assistenteModo = 'estudar'; App.ir('assistente'); } } }, ico('livro'), 'Abrir o Assistente'))));
          return;
        }
        bt.disabled = true; estado.textContent = 'Preparando a explicação…'; area.replaceChildren(h('div.carregando', h('div.giro')));
        try {
          var j = await sample.json(promptObra(p, autorizado ? trecho : null), { modelTier: 'default' });
          var res = validarResposta(j);
          estado.textContent = res.descartadas ? res.descartadas + ' referência(s) sugerida(s) pela IA não existiam e foram descartadas.' : '';
          area.replaceChildren(mostrarResposta(p, res, api, autorizado ? trecho : null));
        } catch (e) { area.replaceChildren(); estado.textContent = e && e.code === 'rate_limited' ? 'Muitos pedidos seguidos. Aguarde um pouco e tente de novo.' : 'Não foi possível gerar a explicação agora.'; }
        finally { bt.disabled = false; }
      });
      return c;
    }, { cheia: true });
  }
  function promptObra(p, trecho) {
    var dados = 'Obra: ' + p.titulo + (p.tituloOriginal ? ' (' + p.tituloOriginal + ')' : '') + '\nAutor: ' + p.autor + (p.autorDatas ? ' (' + p.autorDatas + ')' : '') +
      '\nTradição do autor: ' + (p.tradicao || 'não identificada') + '\nData: ' + (p.ano || '') + '\nDescrição do acervo: ' + (p.descricao || '');
    return 'Você é o Assistente Bíblico do app ATOS 2 (português do Brasil, sem viés denominacional).\n' + dados + '\n\n' +
      (trecho ? 'Trecho original do autor (' + (p.idioma === 'en' ? 'em inglês' : 'em português') + '):\n"""' + String(trecho.texto).slice(0, 2500) + '"""\n\nExplique este trecho para um leitor brasileiro.'
        : 'Você NÃO tem o texto da obra. Explique o tema e o contexto da obra só a partir dos dados acima, sem fingir que leu nem resumir o conteúdo.') + '\n' +
      'Responda em JSON: {"resumo": string (até 90 palavras: o que o autor diz/argumenta' + (trecho ? '' : ' — aqui, o tema e o contexto da obra') + '), "conceitos": [{"termo": string, "explicacao": string (até 40 palavras)}] (até 4), ' +
      '"referencias": [{"ref": "Livro capítulo:versículo", "motivo": string (até 20 palavras)}] (até 5), "leituras": [{"tradicao": string, "leitura": string (até 35 palavras)}] (0 a 3, só se houver leituras diferentes entre cristãos), "perguntas": [string] (2 ou 3)}.\n' +
      'Regras: não invente citações do autor nem atribua a ele o que não está no trecho; não escreva o texto de versículos; use só referências bíblicas que existem; quando cristãos divergirem, apresente as posições de forma neutra, sem dizer qual é a correta; deixe claro o que é explicação e não palavra do autor.';
  }
  function validarResposta(j) {
    j = j || {};
    var t = function (s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return n && s.length > n ? s.slice(0, n - 1) + '…' : s; };
    var refs = [], desc = 0;
    (Array.isArray(j.referencias) ? j.referencias : []).slice(0, 6).forEach(function (r) { var x = Biblia.interpretar(String(r && r.ref || '')); if (x.ok && !x.soLivro) refs.push({ ref: A2Ref.formatar(x.ref), r: x.ref, motivo: t(r.motivo, 160) }); else desc++; });
    return { resumo: t(j.resumo, 900), conceitos: (Array.isArray(j.conceitos) ? j.conceitos : []).slice(0, 4).map(function (c) { return { termo: t(c && c.termo, 60), explicacao: t(c && c.explicacao, 300) }; }).filter(function (c) { return c.termo; }),
      referencias: refs, descartadas: desc, leituras: (Array.isArray(j.leituras) ? j.leituras : []).slice(0, 3).map(function (l) { return { tradicao: t(l && l.tradicao, 60), leitura: t(l && l.leitura, 300) }; }).filter(function (l) { return l.leitura; }),
      perguntas: (Array.isArray(j.perguntas) ? j.perguntas : []).slice(0, 3).map(function (q) { return t(q, 200); }).filter(Boolean) };
  }
  function mostrarResposta(p, res, api, trecho) {
    var c = h('div.cartao.explicacao-ia', h('span.selo.ia', 'Explicação gerada por IA'));
    if (res.resumo) c.appendChild(h('p', res.resumo));
    if (res.conceitos.length) c.appendChild(h('div', h('b', 'Conceitos'), h('ul', res.conceitos.map(function (x) { return h('li', h('b', x.termo + ': '), x.explicacao); }))));
    if (res.referencias.length) c.appendChild(h('div', h('b', 'Passagens para ler junto'), h('ul', res.referencias.map(function (x) {
      return h('li', h('button.ref-obra', { on: { click: function () { api.fechar(); App.abrirBiblia(x.r.livro, x.r.cap, x.r.v1); } } }, x.ref), x.motivo ? ' — ' + x.motivo : '');
    }))));
    if (res.leituras.length) c.appendChild(h('div', h('b', 'Leituras entre cristãos'), h('ul', res.leituras.map(function (l) { return h('li', h('b', l.tradicao + ': '), l.leitura); }))));
    if (res.perguntas.length) c.appendChild(h('div', h('b', 'Para refletir'), h('ul', res.perguntas.map(function (q) { return h('li', q); }))));
    c.appendChild(h('div.linha-bts', h('button.bt#salvar-estudo-obra', { on: { click: function () {
      var id = UI.uid();
      var corpo = (trecho ? 'Trecho (' + p.autor + ', ' + p.titulo + '):\n“' + trecho.texto + '”\n\n' : 'Obra: ' + p.titulo + ' — ' + p.autor + '\n\n') + 'Explicação gerada por IA:\n' + res.resumo +
        (res.conceitos.length ? '\n\nConceitos:\n' + res.conceitos.map(function (x) { return '• ' + x.termo + ': ' + x.explicacao; }).join('\n') : '') +
        (res.leituras.length ? '\n\nLeituras entre cristãos:\n' + res.leituras.map(function (l) { return '• ' + l.tradicao + ': ' + l.leitura; }).join('\n') : '') +
        (res.perguntas.length ? '\n\nPara refletir:\n' + res.perguntas.map(function (q) { return '• ' + q; }).join('\n') : '') + '\n\nFonte: ' + A.citacao(p);
      Dados.salvar('estudos', id, { titulo: 'Leitura: ' + p.titulo, categoria: 'Livros e artigos', corpo: corpo, refs: res.referencias.map(function (x) { return { ref: x.ref, nota: x.motivo }; }), origem: 'ia', obra: { id: p.id }, criadoEm: agora(), atualizadoEm: agora() });
      App.registrar('estudo', { titulo: 'Leitura: ' + p.titulo });
      UI.aviso('Salvo nos seus estudos da Biblioteca.');
    } } }, ico('nota'), 'Salvar nos meus estudos')));
    return c;
  }

  // ---------------------------------------------------------------- administração do acervo (editores)
  function quem() { var e = Dados.estado; return (e.conta && e.conta.email) || (e.dono ? 'Administração (claude.ai)' : 'Edição'); }
  function limpo(p) { var r = JSON.parse(JSON.stringify(p)); ['_origem', '_editado', '_rascunho', '_revisaoPendente', '_t'].forEach(function (k) { delete r[k]; }); delete r.id; return r; }
  async function gravar(area, id, dados) {
    try { await Dados.gravarConteudo(area, id, dados); return true; }
    catch (e) { UI.aviso('Não foi possível gravar: ' + (e.message || e), true); return false; }
  }
  function admin() {
    UI.folha('Administrar acervo', function (api) {
      var raiz = h('div.form.admin-acervo'), aba = 'revisao';
      function desenhar() {
        var lista = todas(), grupos = { revisao: [], publicado: [], retirado: [] };
        lista.forEach(function (p) { grupos[A.situacao(p)].push(p); if (p._revisaoPendente && A.situacao(p) !== 'revisao') grupos.revisao.push(p); });
        raiz.replaceChildren(
          h('p.sub', 'Toda publicação passa por verificação de direitos e revisão editorial antes de aparecer para os leitores. Textos integrais só de obras em domínio público ou com licença que permita reprodução; as demais entram com dados bibliográficos e link.'),
          h('div.linha-bts', h('button.bt.pri#acervo-nova', { on: { click: function () { api.fechar(); setTimeout(function () { editar(null); }, 30); } } }, ico('mais'), 'Nova publicação')),
          h('div.chips', [['revisao', 'Em revisão'], ['publicado', 'Publicados'], ['retirado', 'Retirados']].map(function (x) {
            return h('button.chip', { 'aria-pressed': String(aba === x[0]), 'data-admin': x[0], on: { click: function () { aba = x[0]; desenhar(); } } }, x[1], h('small.n', String(grupos[x[0]].length)));
          })),
          grupos[aba].length ? h('div.lista', grupos[aba].map(function (p) {
            return h('div.item.admin-item', h('div.corpo', h('span.titulo', p.titulo), h('span.meta', p.autor + ' · ' + A.TIPOS[p.tipo].nome + (p._revisaoPendente ? ' · edição pendente' : '') + (p.origem && p.origem.ia ? ' · tradução com IA' : ''))),
              h('div.linha-bts',
                aba === 'revisao' ? h('button.bt.peq.pri', { 'data-revisar': p.id, on: { click: function () { api.fechar(); setTimeout(function () { revisar(p.id); }, 30); } } }, 'Revisar') : null,
                h('button.bt.peq', { on: { click: function () { api.fechar(); setTimeout(function () { abrirFicha(p.id); }, 30); } } }, 'Ficha'),
                aba === 'retirado' ? h('button.bt.peq', { on: { click: async function () { var r = limpo(p); r.removido = false; if (await gravar('acervo', p.id, r)) { UI.aviso('Publicação restaurada.'); setTimeout(desenhar, 300); } } } }, 'Restaurar') : null,
                p._origem === 'editorial' ? h('button.bt.peq.perigo', { on: { click: async function () {
                  if (!(await UI.confirmar('Excluir publicação', 'O registro será apagado do acervo. Favoritos e coleções que apontam para ele deixam de mostrá-lo.', 'Excluir', true))) return;
                  await gravar('acervo', p.id, null); await gravar('acervoRevisao', p.id, null); UI.aviso('Excluída.'); setTimeout(desenhar, 300);
                } } }, 'Excluir') : null));
          })) : h('p.sub', 'Nada aqui.'));
      }
      desenhar(); return raiz;
    }, { cheia: true });
  }
  function revisar(id) {
    var base = todas().filter(function (x) { return x.id === id; })[0]; if (!base) return;
    var p = base._revisaoPendente ? Object.assign({}, base, base._revisaoPendente) : base;
    UI.folha('Revisar e publicar', function (api) {
      var c1 = h('input.interruptor#rev-direitos', { type: 'checkbox' }), c2 = h('input.interruptor#rev-conteudo', { type: 'checkbox' });
      var faltas = A.podePublicar(A.aprovar(p, quem(), agora())).faltas, erro = h('p.sub.erro', { 'aria-live': 'polite' });
      var bt = h('button.bt.pri#rev-publicar', { on: { click: async function () {
        if (!c1.checked || !c2.checked) { erro.textContent = 'Marque as duas confirmações.'; return; }
        var r = A.aprovar(p, quem(), agora());
        var f = A.podePublicar(r).faltas; if (f.length) { erro.textContent = 'Falta: ' + f.join(', ') + '.'; return; }
        bt.disabled = true;
        var id2 = r.id; delete r.id;
        if (await gravar('acervo', id2, r)) {
          if (base._rascunho || base._revisaoPendente) await gravar('acervoRevisao', id2, null);
          api.fechar(); UI.aviso('Publicado no acervo.');
        }
        bt.disabled = false;
      } } }, ico('ok'), 'Aprovar e publicar');
      return h('div.form',
        h('b', p.titulo), h('p.sub', p.autor),
        p.origem && p.origem.ia ? h('div.aviso-ia', ico('brilho'), h('span', 'Tradução feita com apoio de IA: confira com o original antes de aprovar.')) : null,
        faltas.length ? h('div.aviso', ico('info'), h('span', 'Antes de publicar falta: ' + faltas.join(', ') + '.')) : null,
        p.acesso === 'integral' ? h('button.bt', { on: { click: function () { api.fechar(); abrirLeitura(p.id); } } }, ico('livro'), 'Ler o texto') : p.fonte && p.fonte.url ? link(p.fonte.url, 'Abrir a fonte original') : null,
        h('label.chave', { for: 'rev-direitos' }, h('span', 'Conferi a procedência e a licença na fonte original (' + ((p.licenca || {}).nome || 'sem licença') + ').'), c1),
        h('label.chave', { for: 'rev-conteudo' }, h('span', 'Revisei os dados, a descrição' + (p.acesso === 'integral' ? ' e o texto' : '') + ' e estão de acordo com a linha editorial.'), c2),
        erro, h('div.linha-bts', bt));
    });
  }
  async function retirar(p, api) {
    if (!(await UI.confirmar('Retirar do acervo', '“' + p.titulo + '” deixa de aparecer para os leitores. Você pode restaurar depois na administração.', 'Retirar', true))) return;
    var r = limpo(p); r.removido = true; r.retiradoEm = agora();
    if (await gravar('acervo', p.id, r)) { if (api) api.fechar(); UI.aviso('Retirado do acervo.'); }
  }
  function editar(p) {
    var novo = !p, d = p ? Object.assign({}, p, p._revisaoPendente || {}) : { tipo: 'artigo', categoria: 'artigos', idioma: 'pt', acesso: 'link', licenca: { codigo: 'direitos-reservados' } };
    UI.folha(novo ? 'Nova publicação' : 'Editar publicação', function (api) {
      function campo(id, rot, valor, attrs) { var el = h('input.entrada#' + id, Object.assign({ type: 'text' }, attrs || {})); el.value = valor || ''; return [h('label.campo', { for: id }, h('span', rot), el), el]; }
      function sel(id, rot, opcoes, valor) { var el = h('select.entrada#' + id, opcoes.map(function (o) { var op = h('option', { value: o[0] }, o[1]); if (o[0] === valor) op.selected = true; return op; })); return [h('label.campo', { for: id }, h('span', rot), el), el]; }
      var tipo = sel('ad-tipo', 'Tipo de publicação', Object.keys(A.TIPOS).map(function (k) { return [k, A.TIPOS[k].nome]; }), d.tipo);
      var cat = sel('ad-cat', 'Categoria', A.CATEGORIAS.map(function (c) { return [c.id, c.nome]; }), d.categoria);
      var tit = campo('ad-tit', 'Título', d.titulo, { maxlength: 200 }), tor = campo('ad-tor', 'Título original (opcional)', d.tituloOriginal, { maxlength: 200 });
      var aut = campo('ad-aut', 'Autor(es)', d.autor, { maxlength: 160 }), dat = campo('ad-dat', 'Datas do autor (opcional)', d.autorDatas, { maxlength: 40 });
      var trd = campo('ad-trd', 'Tradutor (opcional)', d.tradutor, { maxlength: 120 }), tra = campo('ad-tra', 'Tradição teológica do autor', d.tradicao, { maxlength: 200, placeholder: 'Ex.: Luterana; Católica; Não identificada' });
      var ano = campo('ad-ano', 'Data da obra', d.ano, { maxlength: 40 }), edi = campo('ad-edi', 'Edição / dados da publicação', d.edicao, { maxlength: 300 });
      var des = h('textarea.entrada#ad-des', { rows: 4, maxlength: 900 }); des.value = d.descricao || '';
      var tem = campo('ad-tem', 'Temas (separados por vírgula)', (d.temas || []).join(', '));
      var idi = sel('ad-idi', 'Idioma', Object.keys(A.IDIOMAS).map(function (k) { return [k, A.IDIOMAS[k]]; }), d.idioma);
      var ace = sel('ad-ace', 'Acesso', [['link', 'Dados bibliográficos e link para a fonte'], ['integral', 'Texto integral no app (arquivo no repositório)']], d.acesso === 'integral' ? 'integral' : 'link');
      var arq = campo('ad-arq', 'Arquivo do texto (só texto integral)', d.arquivo, { placeholder: 'acervo/textos/<id>.json' });
      var fno = campo('ad-fno', 'Fonte original (nome)', d.fonte && d.fonte.nome, { maxlength: 160 }), url = campo('ad-url', 'Link da publicação original', d.fonte && d.fonte.url, { type: 'url', placeholder: 'https://' });
      var lic = sel('ad-lic', 'Licença', Object.keys(A.LICENCAS).map(function (k) { return [k, A.LICENCAS[k].nome]; }), (d.licenca || {}).codigo);
      var ldt = campo('ad-ldt', 'Detalhe da licença (onde foi conferida)', (d.licenca || {}).detalhe, { maxlength: 400 });
      var pro = campo('ad-pro', 'Procedência / observações', (d.procedencia || {}).tratamento, { maxlength: 400 });
      var erro = h('p.sub.erro', { 'aria-live': 'polite' });
      return h('form.form.form-acervo', { on: { submit: async function (ev) {
        ev.preventDefault();
        var v = A.validarCadastro({ tipo: tipo[1].value, categoria: cat[1].value, titulo: tit[1].value, tituloOriginal: tor[1].value, autor: aut[1].value, autorDatas: dat[1].value, tradutor: trd[1].value,
          tradicao: tra[1].value, ano: ano[1].value, edicao: edi[1].value, descricao: des.value, temas: tem[1].value, idioma: idi[1].value, acesso: ace[1].value, arquivo: arq[1].value,
          fonteNome: fno[1].value, url: url[1].value, licenca: lic[1].value, licencaDetalhe: ldt[1].value, procedencia: pro[1].value }, todas(), p && p.id);
        if (v.erro) { erro.textContent = v.erro; return; }
        var r = v.registro, id = r.id; delete r.id;
        r.situacao = 'revisao'; r.verificacao = { direitos: 'pendente' }; if (p && p.origem) r.origem = p.origem;
        if (p && p.rota) r.rota = p.rota;
        if (await gravar('acervoRevisao', id, r)) { api.fechar(); UI.aviso(novo ? 'Publicação enviada para revisão.' : 'Edição enviada para revisão. A versão publicada continua até a aprovação.'); }
      } } },
        h('div.aviso', ico('info'), h('span', 'O cadastro entra em revisão. Só aparece para os leitores depois de “Revisar e publicar”. Não cadastre texto integral de obras com direitos reservados: use os dados bibliográficos e o link.')),
        tipo[0], cat[0], tit[0], tor[0], aut[0], dat[0], trd[0], tra[0], ano[0], edi[0], h('label.campo', { for: 'ad-des' }, h('span', 'Descrição (escrita pelo ATOS 2, sem copiar o resumo do autor)'), des),
        tem[0], idi[0], ace[0], arq[0], fno[0], url[0], lic[0], ldt[0], pro[0], erro,
        h('div.linha-bts', h('button.bt.pri#ad-salvar', { type: 'submit' }, novo ? 'Enviar para revisão' : 'Salvar para revisão')));
    }, { cheia: true });
  }

  // ---------------------------------------------------------------- para a Biblioteca
  function itensBiblioteca() { return visiveis().map(function (p) { return A.itemBiblioteca(p); }); }

  root.Telas.acervo = { secao: secao, teaser: teaser, porId: porId, todas: todas, visiveis: visiveis, carregar: carregar, abrirFicha: abrirFicha, acoes: acoes,
    abrirLeitura: abrirLeitura, capa: capa, itensBiblioteca: itensBiblioteca, estudar: estudar, admin: admin, alternarFav: alternarFav, ehFav: ehFav };
  root.Telas.obra = { render: renderObra };
})(window);
