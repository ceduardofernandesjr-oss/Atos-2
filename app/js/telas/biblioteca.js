/* ATOS 2 — Biblioteca: central pessoal de conteúdo bíblico. Resumo, acesso rápido, adicionados recentemente,
   coleções com versículos, estudos, anotações e devocionais, pesquisa inteligente e categorias
   (favoritos, coleções, planos, devocionais, anotações, estudos, artes, destaques e histórico). */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone, B = A2Biblioteca;
  var CATEGORIAS = [['todos', 'Todos'], ['favoritos', 'Favoritos'], ['colecoes', 'Coleções'], ['planos', 'Planos'], ['devocionais', 'Devocionais'],
    ['notas', 'Anotações'], ['estudos', 'Estudos'], ['artes', 'Artes'], ['destaques', 'Destaques'], ['historico', 'Histórico']];
  var ORDENS = [['recentes', 'Mais recentes'], ['antigos', 'Mais antigos'], ['az', 'A–Z'], ['biblica', 'Ordem bíblica']];

  // ---------------------------------------------------------------- dados
  function refDeChave(k) { var d = A2Ref.deChave(k); return { livro: d.livro, cap: d.cap, v1: d.v, v2: d.v }; }
  function rotuloChave(k) { try { return A2Ref.formatar(refDeChave(k)); } catch (e) { return k; } }
  function chavesDe(s) {
    var r = Biblia.interpretar(String(s || ''));
    if (!r.ok) return [];
    if (r.ref.v1 == null) return [r.ref.livro + '.' + (r.ref.cap || 1)];
    var out = []; for (var v = r.ref.v1; v <= (r.ref.v2 || r.ref.v1) && out.length < 40; v++) out.push(r.ref.livro + '.' + r.ref.cap + '.' + v);
    return out;
  }
  function dadosBib() {
    return { favoritos: Dados.todos('favoritos'), notas: Dados.todos('notas'), estudos: Dados.todos('estudos'), devSalvos: Dados.todos('devSalvos'),
      artes: Dados.todos('artes'), devocionais: Dados.conteudo.devocionais || [], colecoes: Dados.todos('colecoes'), destaques: Dados.todos('destaques'),
      rotulo: rotuloChave, rotuloRefs: rotuloRefs, chavesDe: chavesDe };
  }
  function todosItens() { return B.itens(dadosBib()); }
  function colecoes() { return Dados.todos('colecoes').sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome)); }); }
  function sigla() { return Biblia.versao(Biblia.padrao()).sigla; }
  function dataCurta(iso) { return iso ? UI.dataCurta(String(iso).slice(0, 10)) : ''; }
  function ordemLivros() { return A2Ref.LIVROS.map(function (l) { return l.id; }); }

  // texto dos versículos (com cache para a pesquisa)
  var cacheTexto = {};
  function textoDe(k) {
    if (!cacheTexto[k]) {
      var d = A2Ref.deChave(k);
      cacheTexto[k] = Biblia.livro(d.livro).then(function (lv) { return UI.plano(lv.caps[d.cap - 1][d.v - 1] || ''); }, function () { delete cacheTexto[k]; return ''; });
    }
    return cacheTexto[k];
  }
  function textoVersiculo(k, el) { textoDe(k).then(function (t) { el.textContent = t || '(texto indisponível sem conexão)'; }); }

  // ---------------------------------------------------------------- tela
  function render(tela) {
    var secao = App.estado.secaoBiblioteca || 'todos';
    if (!CATEGORIAS.some(function (c) { return c[0] === secao; })) secao = 'todos';
    var busca = h('input.entrada#bib-busca', { type: 'search', placeholder: 'Pesquisar versículos, estudos, anotações…', autocomplete: 'off', enterkeyhint: 'search', 'aria-label': 'Pesquisar na Biblioteca' });
    busca.value = App.estado.bibBusca || '';
    tela.appendChild(h('header.cab.cab-bib', h('div.cab-bib-txt', h('h1', 'Biblioteca'), h('p.sub', 'Seus conteúdos organizados em um só lugar.')), h('div.esp'),
      h('button.bt-ico', { 'aria-label': 'Pesquisar na Biblioteca', on: { click: function () { busca.focus(); } } }, ico('busca'))));
    tela.appendChild(h('div.busca-campo.busca-bib', ico('busca'), busca));
    var cats = h('div.chips.cats-bib', { role: 'tablist', 'aria-label': 'Categorias' }, CATEGORIAS.map(function (c) {
      return h('button.chip', { role: 'tab', 'aria-selected': String(c[0] === secao), 'aria-pressed': String(c[0] === secao), 'data-cat': c[0],
        on: { click: function () { App.estado.secaoBiblioteca = c[0]; App.estado.bibBusca = ''; App.recarregar(); } } }, c[1]);
    }));
    tela.appendChild(cats);
    var area = h('div.bib-area'); tela.appendChild(area);
    function mostrar() {
      area.replaceChildren();
      if (busca.value.trim()) resultadosBusca(area, busca.value.trim());
      else SECOES[secao](area);
    }
    var t;
    busca.addEventListener('input', function () { App.estado.bibBusca = busca.value; clearTimeout(t); t = setTimeout(mostrar, 220); });
    mostrar();
    setTimeout(function () { var ch = cats.querySelector('[aria-pressed="true"]'); if (ch && ch.scrollIntoView && cats.scrollWidth > cats.clientWidth) ch.scrollIntoView({ inline: 'center', block: 'nearest' }); }, 0);
    // Atualiza quando algo salvo muda; se uma janela estiver aberta, espera ela fechar para não perder o que está na tela
    var espera = null;
    function atualizarQuandoLivre() {
      if (espera) return;
      espera = setInterval(function () {
        if (!tela.isConnected || App.estado.aba !== 'biblioteca') { clearInterval(espera); espera = null; return; }
        if (UI.temFolha() || document.activeElement === busca) return;
        clearInterval(espera); espera = null; App.atualizar();
      }, 250);
    }
    App.aoSair(function () { if (espera) clearInterval(espera); espera = null; });
    App.aoMudar(function (c) {
      var rel = ['favoritos', 'colecoes', 'notas', 'estudos', 'destaques', 'historico', 'planos', 'devSalvos', 'devLidos', 'artes', '*'];
      if (rel.indexOf(c) < 0) return;
      if (!UI.temFolha() && document.activeElement !== busca) App.atualizar(); else atualizarQuandoLivre();
    });
  }
  function irPara(cat) { App.estado.secaoBiblioteca = cat; App.estado.bibBusca = ''; App.recarregar(); window.scrollTo(0, 0); }
  function secaoTitulo(titulo, link, acao) { return h('div.secao', h('h2', titulo), h('div.esp'), link ? h('button.link-secao', { on: { click: acao } }, link, ico('direita')) : null); }
  function vazio(icone, titulo, texto, botao) {
    return h('div.vazio-bib', h('span.vazio-ico', ico(icone)), h('b', titulo), h('p', texto),
      botao ? h('button.bt.pri', { on: { click: botao[1] } }, botao[2] ? ico(botao[2]) : null, botao[0]) : null);
  }
  function seletorOrdem(atual, fn, opcoes) {
    var sel = h('select.entrada.ordem-bib', { 'aria-label': 'Ordenar' }, (opcoes || ORDENS).map(function (o) { var op = h('option', { value: o[0] }, o[1]); if (o[0] === atual) op.selected = true; return op; }));
    sel.addEventListener('change', function () { fn(sel.value); });
    return sel;
  }

  // ---------------------------------------------------------------- cartões de conteúdo
  function meta(it) {
    if (it.tipo === 'versiculo') return sigla() + ' · Favoritado em ' + dataCurta(it.data);
    if (it.tipo === 'estudo') return [it.sub, 'Criado em ' + dataCurta(it.data)].filter(Boolean).join(' · ');
    if (it.tipo === 'nota') return 'Atualizada em ' + dataCurta(it.data);
    if (it.tipo === 'devocional') return [it.ref, it.dataConteudo ? UI.dataCurta(it.dataConteudo) : ''].filter(Boolean).join(' · ');
    if (it.tipo === 'arte') return (it.estado === 'rascunho' ? 'Rascunho' : 'Finalizada') + ' · Criada em ' + dataCurta(it.data);
    return '';
  }
  function cartao(it, opcoes) {
    opcoes = opcoes || {};
    var corpo = h('div.bib-corpo', h('span.bib-tipo', B.TIPOS[it.tipo].nome + (it.motivo ? ' · ' + it.motivo : '')), h('b.bib-titulo', it.titulo));
    if (it.tipo === 'versiculo') { var tx = h('span.bib-texto', '…'); textoVersiculo(it.id, tx); corpo.appendChild(tx); }
    else if (it.tipo === 'nota') { var prev = (it.sub ? it.sub + ' — ' : '') + (it.texto || ''); if (prev) corpo.appendChild(h('span.bib-texto', prev.slice(0, 180) + (prev.length > 180 ? '…' : ''))); }
    else if (it.tipo === 'estudo' && it.texto) corpo.appendChild(h('span.bib-texto', it.texto.slice(0, 140) + (it.texto.length > 140 ? '…' : '')));
    corpo.appendChild(h('small.bib-meta', meta(it)));
    if (it.tipo === 'versiculo' && it.colecoes && it.colecoes.length) {
      var nomes = it.colecoes.map(function (id) { var c = Dados.obter('colecoes', id); return c ? c.nome : null; }).filter(Boolean);
      if (nomes.length) corpo.appendChild(h('div.bib-cols', nomes.map(function (n) { return h('span.selo', n); })));
    }
    var visual = it.tipo === 'arte' && it.miniatura ? h('img.bib-mini', { src: it.miniatura, alt: '' }) : h('span.bib-ico.t-' + it.tipo, ico(it.tipo === 'versiculo' ? 'coracaoCheio' : B.TIPOS[it.tipo].icone));
    return h('div.bib-item', { 'data-tipo': it.tipo, 'data-id': it.id },
      h('button.bib-abrir', { 'aria-label': 'Abrir ' + B.TIPOS[it.tipo].nome.toLowerCase() + ': ' + it.titulo, on: { click: function () { abrirItem(it); } } }, visual, corpo),
      opcoes.remover ? h('button.bt-ico.peq', { 'aria-label': 'Tirar da coleção', title: 'Tirar da coleção', on: { click: opcoes.remover } }, ico('fechar'))
        : h('button.bt-ico.peq.bib-menu', { 'aria-label': 'Mais ações para ' + it.titulo, on: { click: function () { acoesItem(it); } } }, ico('menu')));
  }
  function lista(itens, opcoes) { return h('div.bib-lista', itens.map(function (it) { return cartao(it, opcoes); })); }

  function abrirItem(it) {
    if (it.tipo === 'versiculo') { var r = refDeChave(it.id); App.abrirBiblia(r.livro, r.cap, r.v1); }
    else if (it.tipo === 'nota') editarNota(it.bruto);
    else if (it.tipo === 'estudo') verEstudo(Dados.obter('estudos', it.id) ? Object.assign({ id: it.id }, Dados.obter('estudos', it.id)) : it.bruto);
    else if (it.tipo === 'devocional') Telas.devocionais.abrir(it.id);
    else if (it.tipo === 'arte') Telas.criar.abrirArte(it.id);
  }
  function compartilharItem(it) {
    if (it.tipo === 'versiculo') { textoDe(it.id).then(function (t) { App.compartilhar('“' + t + '”\n— ' + it.titulo + ' (' + sigla() + ')', 'Compartilhar versículo'); }); }
    else if (it.tipo === 'nota') App.compartilhar((it.sub || (it.bruto.refs && it.bruto.refs.length ? rotuloRefs(it.bruto.refs) : '')) + (it.bruto.titulo ? '\n' + it.bruto.titulo : '') + '\n\n' + (it.texto || '') + '\n\n— Anotação no ATOS 2', 'Compartilhar anotação');
    else if (it.tipo === 'estudo') App.compartilhar(textoEstudo(it.bruto), 'Compartilhar estudo');
    else if (it.tipo === 'devocional') App.compartilhar(it.titulo + (it.ref ? '\nPassagem: ' + it.ref : '') + '\n\n— Devocional do ATOS 2', 'Compartilhar devocional');
    else if (it.tipo === 'arte') Telas.criar.compartilharArte(it.bruto.spec);
  }
  function textoEstudo(e) {
    return (e.titulo || '') + (e.categoria ? ' (' + e.categoria + ')' : '') + '\n\n' + (e.corpo || '') + '\n\n' + (e.refs || []).map(function (s) { return '• ' + (s.ref || s) + (s.nota ? ' — ' + s.nota : ''); }).join('\n') + '\n\n— Estudo no ATOS 2';
  }
  function limparDasColecoes(tipo, id) { B.semItem(Dados.todos('colecoes'), tipo, id).forEach(function (c) { var atual = Dados.obter('colecoes', c.id); if (atual) Dados.salvar('colecoes', c.id, Object.assign({}, atual, { itens: c.itens, atualizadoEm: new Date().toISOString() })); }); }
  async function excluirItem(it) {
    var txt = { versiculo: ['Remover dos favoritos', it.titulo + ' sai dos favoritos e das coleções.', 'Remover'], nota: ['Excluir anotação', 'Esta anotação será apagada.', 'Excluir'],
      estudo: ['Excluir estudo', 'O estudo será apagado.', 'Excluir'], devocional: ['Remover dos salvos', 'O devocional continua disponível no arquivo.', 'Remover'], arte: ['Excluir arte', 'Esta arte será removida de Minhas artes.', 'Excluir'] }[it.tipo];
    if (!(await UI.confirmar(txt[0], txt[1], txt[2], true))) return false;
    var col = { versiculo: 'favoritos', nota: 'notas', estudo: 'estudos', devocional: 'devSalvos', arte: 'artes' }[it.tipo];
    Dados.excluir(col, it.id);
    if (it.tipo !== 'versiculo' && it.tipo !== 'arte') limparDasColecoes(it.tipo, it.id);
    UI.aviso(it.tipo === 'versiculo' || it.tipo === 'devocional' ? 'Removido.' : 'Excluído.');
    return true;
  }
  function acoesItem(it) {
    UI.folha(it.titulo, function (api) {
      function item(icone, titulo, fn, perigo) { return h('button.item' + (perigo ? '.perigo' : ''), { on: { click: function () { api.fechar(); setTimeout(fn, 30); } } }, ico(icone), h('div.corpo', h('span.titulo', titulo))); }
      var colecionavel = B.COLECIONAVEIS.indexOf(it.tipo) >= 0;
      return h('div.lista',
        item(it.tipo === 'versiculo' ? 'livro' : 'direita', it.tipo === 'versiculo' ? 'Abrir na Bíblia' : 'Abrir', function () { abrirItem(it); }),
        it.tipo === 'nota' ? item('editar', 'Editar anotação', function () { editarNota(it.bruto); }) : null,
        it.tipo === 'estudo' ? item('editar', 'Editar estudo', function () { editarEstudo(Object.assign({ id: it.id }, Dados.obter('estudos', it.id) || it.bruto)); }) : null,
        it.tipo === 'arte' ? item('editar', 'Editar no estúdio', function () { Telas.criar.abrirArte(it.id); }) : null,
        colecionavel ? item('colecao', 'Adicionar a uma coleção', function () { escolherColecoes(it); }) : null,
        it.tipo === 'versiculo' ? item('imagem', 'Criar arte', function () { Telas.criar.comVersiculo(A2Ref.formatar(refDeChave(it.id), true)); }) : null,
        item('compartilhar', 'Compartilhar', function () { compartilharItem(it); }),
        it.tipo === 'arte' ? item('baixar', 'Baixar imagem', function () { Telas.criar.baixarArte(it.bruto.spec); }) : null,
        item(it.tipo === 'versiculo' ? 'coracao' : 'lixo', it.tipo === 'versiculo' ? 'Remover dos favoritos' : it.tipo === 'devocional' ? 'Remover dos salvos' : 'Excluir', function () { excluirItem(it); }, true));
    });
  }

  // ---------------------------------------------------------------- coleções
  function membrosDe(col) { return B.resolver(col, Dados.todos('favoritos'), todosItens()); }
  function cartaoColecao(col) {
    var n = membrosDe(col).length;
    return h('button.col-card', { 'data-col': col.id, on: { click: function () { abrirColecao(col.id); } } },
      h('span.col-ico', ico(col.icone || 'colecao')), h('b', col.nome), col.descricao ? h('small.col-desc', col.descricao) : null,
      h('small.col-n', n ? n + (n > 1 ? ' itens' : ' item') : 'Vazia'));
  }
  function cartaoNovaColecao() {
    return h('button.col-card.col-nova#nova-colecao', { on: { click: function () { editarColecao(null); } } }, h('span.col-ico', ico('mais')), h('b', 'Nova coleção'), h('small.col-desc', 'Organize por assunto: Fé, Oração, Pregações…'));
  }
  function editarColecao(col, depois) {
    var existentes = Dados.todos('colecoes');
    UI.folha(col ? 'Editar coleção' : 'Nova coleção', function (api) {
      var nome = h('input.entrada#col-nome', { type: 'text', maxlength: 40, placeholder: 'Ex.: Promessas de Deus' }); nome.value = col ? col.nome : '';
      var desc = h('textarea.entrada#col-desc', { rows: 2, maxlength: 160, placeholder: 'Para que serve esta coleção (opcional)' }); desc.value = col && col.descricao || '';
      var icone = col && col.icone || 'colecao', erro = h('p.sub.erro', { 'aria-live': 'polite' });
      var icones = h('div.icones-col', { role: 'radiogroup', 'aria-label': 'Ícone' }, B.ICONES_COLECAO.map(function (i) {
        return h('button.icone-col', { type: 'button', role: 'radio', 'aria-label': 'Ícone ' + i, 'aria-checked': String(i === icone), on: { click: function () {
          icone = i; icones.querySelectorAll('.icone-col').forEach(function (b) { b.setAttribute('aria-checked', String(b === this)); }, this);
        } } }, ico(i));
      }));
      var sugestoes = col ? null : h('div.chips.quebra', B.SUGESTOES.filter(function (s) { return !existentes.some(function (c) { return B.norm(c.nome) === B.norm(s); }); })
        .map(function (s) { return h('button.chip', { type: 'button', on: { click: function () { nome.value = s; nome.focus(); } } }, s); }));
      return h('form.form', { on: { submit: function (ev) {
        ev.preventDefault();
        var v = B.validarColecao({ nome: nome.value, descricao: desc.value, icone: icone }, existentes, col && col.id);
        if (v.erro) { erro.textContent = v.erro; nome.focus(); return; }
        var id = col ? col.id : UI.uid(), agora = new Date().toISOString();
        Dados.salvar('colecoes', id, Object.assign({}, col || { itens: [], criadoEm: agora }, v, { atualizadoEm: agora }));
        api.fechar(); UI.aviso(col ? 'Coleção atualizada.' : 'Coleção criada.');
        if (depois) depois(id); else if (!col) setTimeout(function () { abrirColecao(id); }, 60);
      } } },
        h('label.campo', { for: 'col-nome' }, h('span', 'Nome'), nome), sugestoes,
        h('label.campo', { for: 'col-desc' }, h('span', 'Descrição'), desc),
        h('div.campo', h('span', 'Ícone'), icones), erro,
        h('div.linha-bts', h('button.bt.pri#col-salvar', { type: 'submit' }, col ? 'Salvar' : 'Criar coleção')));
    });
  }
  function abrirColecao(id) {
    UI.folha('Coleção', function (api) {
      var raiz = h('div.form.col-folha'), modo = 'ver', filtro = '';
      function desenhar() {
        var col = Dados.obter('colecoes', id); if (!col) { api.fechar(); return; }
        col = Object.assign({ id: id }, col);
        raiz.replaceChildren();
        if (modo === 'ver') {
          var itens = membrosDe(col);
          raiz.appendChild(h('div.col-cab', h('span.col-ico.grande', ico(col.icone || 'colecao')), h('div', h('h2', col.nome), col.descricao ? h('p.sub', col.descricao) : null,
            h('small.col-n', itens.length ? itens.length + (itens.length > 1 ? ' itens' : ' item') : 'Coleção vazia'))));
          raiz.appendChild(h('div.linha-bts',
            h('button.bt.pri#col-adicionar', { on: { click: function () { modo = 'adicionar'; desenhar(); } } }, ico('mais'), 'Adicionar conteúdos'),
            h('button.bt', { on: { click: function () { api.fechar(); setTimeout(function () { editarColecao(col); }, 30); } } }, ico('editar'), 'Editar'),
            itens.length ? h('button.bt#col-compartilhar', { on: { click: function () { compartilharColecao(col, itens); } } }, ico('compartilhar'), 'Compartilhar') : null,
            h('button.bt.perigo#col-excluir', { on: { click: async function () {
              if (!(await UI.confirmar('Excluir coleção', 'Os conteúdos continuam salvos na Biblioteca; só a coleção é removida.', 'Excluir', true))) return;
              Dados.todos('favoritos').forEach(function (f) { if ((f.colecoes || []).indexOf(id) >= 0) Dados.salvar('favoritos', f.id, Object.assign({}, f, { colecoes: f.colecoes.filter(function (x) { return x !== id; }) })); });
              Dados.excluir('colecoes', id); api.fechar(); UI.aviso('Coleção excluída.');
            } } }, ico('lixo'), 'Excluir')));
          if (!itens.length) raiz.appendChild(vazio('colecao', 'Esta coleção ainda está vazia.', 'Junte versículos, estudos, anotações e devocionais sobre o mesmo assunto.', ['Adicionar conteúdos', function () { modo = 'adicionar'; desenhar(); }, 'mais']));
          else raiz.appendChild(h('div.bib-lista', itens.map(function (it) {
            return cartao(it, { remover: function () { alternarNaColecao(col, it, false); desenhar(); } });
          })));
        } else {
          var todos = B.ordenar(todosItens().filter(function (it) { return B.COLECIONAVEIS.indexOf(it.tipo) >= 0; }), 'recentes');
          var q = h('input.entrada#col-filtro', { type: 'search', placeholder: 'Filtrar conteúdos', value: filtro });
          var listaSel = h('div.lista-sel');
          function preencher() {
            listaSel.replaceChildren();
            var termo = B.norm(q.value), vis = todos.filter(function (it) { return !termo || B.norm(it.titulo + ' ' + (it.sub || '') + ' ' + (it.texto || '')).indexOf(termo) >= 0; });
            if (!todos.length) { listaSel.appendChild(vazio('livro', 'Nada salvo ainda.', 'Favorite versículos, salve estudos, anotações e devocionais para reuni-los aqui.')); return; }
            B.COLECIONAVEIS.forEach(function (tp) {
              var grupo = vis.filter(function (it) { return it.tipo === tp; }); if (!grupo.length) return;
              listaSel.appendChild(h('div.rotulo', B.TIPOS[tp].plural));
              grupo.forEach(function (it) {
                var idCb = 'sel-' + tp + '-' + String(it.id).replace(/[^a-z0-9]/gi, '_'), cb = h('input.interruptor#' + idCb, { type: 'checkbox' });
                cb.checked = B.contem(col, Dados.todos('favoritos'), it.tipo, it.id);
                cb.addEventListener('change', function () { alternarNaColecao(Object.assign({ id: id }, Dados.obter('colecoes', id)), it, cb.checked); col = Object.assign({ id: id }, Dados.obter('colecoes', id)); });
                listaSel.appendChild(h('label.chave.sel-item', { for: idCb }, h('div', h('b', it.titulo), it.sub ? h('small', it.sub) : null), cb));
              });
            });
          }
          q.addEventListener('input', function () { filtro = q.value; preencher(); });
          raiz.appendChild(h('div.col-cab', h('span.col-ico', ico(col.icone || 'colecao')), h('div', h('h2', 'Adicionar a “' + col.nome + '”'), h('p.sub', 'Marque o que deve fazer parte da coleção.'))));
          raiz.appendChild(q); raiz.appendChild(listaSel); preencher();
          raiz.appendChild(h('button.bt.pri#col-concluir', { on: { click: function () { modo = 'ver'; desenhar(); } } }, ico('ok'), 'Concluir'));
        }
      }
      desenhar();
      return raiz;
    }, { cheia: true });
  }
  function alternarNaColecao(col, it, dentro) {
    if (it.tipo === 'versiculo') {
      var f = Dados.obter('favoritos', it.id) || { ref: it.id, colecoes: [], criadoEm: new Date().toISOString() };
      var cs = (f.colecoes || []).filter(function (x) { return x !== col.id; }); if (dentro) cs.push(col.id);
      Dados.salvar('favoritos', it.id, Object.assign({}, f, { colecoes: cs }));
    } else Dados.salvar('colecoes', col.id, Object.assign({}, Dados.obter('colecoes', col.id), { itens: B.comItem(col, it.tipo, it.id, dentro), atualizadoEm: new Date().toISOString() }));
  }
  function escolherColecoes(it) {
    UI.folha('Coleções', function (api) {
      var raiz = h('div.form');
      function desenhar() {
        var cols = colecoes(); raiz.replaceChildren(h('p.sub', it.titulo));
        if (!cols.length) raiz.appendChild(h('p.sub', 'Você ainda não criou coleções.'));
        cols.forEach(function (c) {
          var cb = h('input.interruptor#ec-' + c.id, { type: 'checkbox' }); cb.checked = B.contem(c, Dados.todos('favoritos'), it.tipo, it.id);
          cb.addEventListener('change', function () { alternarNaColecao(c, it, cb.checked); UI.aviso(cb.checked ? 'Adicionado a ' + c.nome + '.' : 'Removido de ' + c.nome + '.'); });
          raiz.appendChild(h('label.chave', { for: 'ec-' + c.id }, h('span', h('span.col-ico.mini', ico(c.icone || 'colecao')), ' ', c.nome), cb));
        });
        raiz.appendChild(h('button.bt', { on: { click: function () { api.fechar(); setTimeout(function () { editarColecao(null, function (novo) { alternarNaColecao(Object.assign({ id: novo }, Dados.obter('colecoes', novo)), it, true); UI.aviso('Adicionado à nova coleção.'); }); }, 30); } } }, ico('mais'), 'Nova coleção'));
      }
      desenhar(); return raiz;
    });
  }
  async function compartilharColecao(col, itens) {
    var textos = {};
    await Promise.all(itens.filter(function (it) { return it.tipo === 'versiculo'; }).map(function (it) { return textoDe(it.id).then(function (t) { textos[it.id] = t; }); }));
    App.compartilhar(B.textoColecao(col, itens, textos, sigla()), 'Compartilhar coleção');
  }

  // ---------------------------------------------------------------- seções
  var SECOES = {};
  SECOES.todos = function (area) {
    var d = dadosBib(), c = B.contagens(d), itens = todosItens();
    area.appendChild(h('section.bib-resumo', { 'aria-label': 'Resumo da Biblioteca' },
      h('span.sobre', 'Sua biblioteca'),
      h('div.bib-nums', [['favoritos', c.versiculos, 'Versículos favoritos', 'coracao'], ['estudos', c.estudos, 'Estudos salvos', 'nota'], ['devocionais', c.devocionais, 'Devocionais salvos', 'luz'],
        ['notas', c.notas, 'Anotações', 'editar'], ['colecoes', c.colecoes, 'Coleções', 'colecao']].map(function (x) {
        return h('button.bib-num', { 'data-num': x[0], on: { click: function () { if (x[0] === 'devocionais') App.estado.abaDevo = 'salvos'; irPara(x[0]); } } }, ico(x[3]), h('b', String(x[1])), h('small', x[2]));
      }))));
    if (!itens.length && !c.colecoes) {
      area.appendChild(vazio('livro', 'Sua biblioteca está começando.', 'Tudo o que você salvar no Atos 2 aparece aqui: versículos favoritos, anotações, estudos, devocionais e artes.', ['Explorar a Bíblia', function () { App.ir('biblia'); }, 'livro']));
      area.appendChild(h('div.linha-bts.centro', h('button.bt', { on: { click: function () { editarNota({ refs: [], texto: '' }); } } }, ico('editar'), 'Criar anotação'),
        h('button.bt', { on: { click: function () { editarEstudo({}); } } }, ico('nota'), 'Novo estudo'), h('button.bt', { on: { click: function () { editarColecao(null); } } }, ico('colecao'), 'Nova coleção')));
      return;
    }
    area.appendChild(secaoTitulo('Acesso rápido'));
    area.appendChild(h('div.acesso-bib', [['favoritos', 'coracao', 'Versículos', c.versiculos, 'salvo', 'salvos', 'Nenhum ainda'], ['notas', 'editar', 'Anotações', c.notas, 'escrita', 'escritas', 'Nenhuma ainda'], ['estudos', 'nota', 'Estudos bíblicos', c.estudos, 'salvo', 'salvos', 'Nenhum ainda'], ['colecoes', 'colecao', 'Coleções', c.colecoes, 'criada', 'criadas', 'Nenhuma ainda']].map(function (x) {
      return h('button.acesso-card', { 'data-acesso': x[0], on: { click: function () { irPara(x[0]); } } }, h('span.acesso-ico', ico(x[1])), h('b', x[2]), h('small', x[3] ? x[3] + ' ' + (x[3] === 1 ? x[4] : x[5]) : x[6]));
    })));
    area.appendChild(secaoTitulo('Coleções', c.colecoes ? 'Ver todas' : null, function () { irPara('colecoes'); }));
    area.appendChild(h('div.cols-linha', [cartaoNovaColecao()].concat(colecoes().slice(0, 8).map(cartaoColecao))));
    var todosRec = App.estado.bibRecentesTodos;
    area.appendChild(secaoTitulo('Adicionados recentemente', itens.length > 6 ? (todosRec ? 'Mostrar menos' : 'Ver todos') : null, function () { App.estado.bibRecentesTodos = !todosRec; App.recarregar(); }));
    var rec = B.ordenar(itens, 'recentes').slice(0, todosRec ? 60 : 6);
    area.appendChild(rec.length ? lista(rec) : vazio('coracao', 'Nada adicionado ainda.', 'Favorite versículos durante a leitura e salve estudos e devocionais.', ['Explorar a Bíblia', function () { App.ir('biblia'); }, 'livro']));
  };
  SECOES.favoritos = function (area) {
    var cols = colecoes(), filtro = App.estado.colecao || 'todas', ordem = App.estado.bibOrdemFav || 'recentes';
    var itens = todosItens().filter(function (it) { return it.tipo === 'versiculo'; });
    var total = itens.length;
    if (filtro !== 'todas') itens = itens.filter(function (it) { return (it.colecoes || []).indexOf(filtro) >= 0; });
    if (!total) { area.appendChild(vazio('coracao', 'Nenhum versículo salvo ainda.', 'Salve passagens importantes durante sua leitura para encontrá-las facilmente depois.', ['Explorar Bíblia', function () { App.ir('biblia'); }, 'livro'])); return; }
    area.appendChild(h('div.barra-bib', h('p.sub', itens.length + ' versículo' + (itens.length !== 1 ? 's' : '')), h('div.esp'), seletorOrdem(ordem, function (v) { App.estado.bibOrdemFav = v; App.recarregar(); })));
    if (cols.length) area.appendChild(h('div.chips', h('button.chip', { 'aria-pressed': String(filtro === 'todas'), on: { click: function () { App.estado.colecao = 'todas'; App.recarregar(); } } }, 'Todas as coleções'),
      cols.map(function (c) { return h('button.chip', { 'aria-pressed': String(filtro === c.id), on: { click: function () { App.estado.colecao = c.id; App.recarregar(); } } }, c.nome); })));
    if (!itens.length) { area.appendChild(vazio('colecao', 'Nenhum versículo nesta coleção.', 'Abra o menu ⋮ de um versículo e escolha “Adicionar a uma coleção”.')); return; }
    area.appendChild(lista(B.ordenar(itens, ordem, ordemLivros())));
  };
  SECOES.colecoes = function (area) {
    var cols = colecoes();
    area.appendChild(h('div.cols-grade', [cartaoNovaColecao()].concat(cols.map(cartaoColecao))));
    if (!cols.length) area.appendChild(vazio('colecao', 'Nenhuma coleção ainda.', 'Coleções reúnem versículos, estudos, anotações e devocionais sobre o mesmo assunto, como Fé, Oração ou Pregações.', ['Criar a primeira coleção', function () { editarColecao(null); }, 'mais']));
  };
  SECOES.planos = function (area) { Telas.planos.lista(area); };
  SECOES.devocionais = function (area) { Telas.devocionais.secao(area); };
  SECOES.notas = function (area) {
    var ordem = App.estado.bibOrdemNotas || 'recentes', itens = todosItens().filter(function (it) { return it.tipo === 'nota'; });
    area.appendChild(h('div.barra-bib', h('button.bt.pri#nova-nota', { on: { click: function () { editarNota({ refs: [], texto: '' }); } } }, ico('mais'), 'Nova anotação'), h('div.esp'),
      itens.length ? seletorOrdem(ordem, function (v) { App.estado.bibOrdemNotas = v; App.recarregar(); }) : null));
    if (!itens.length) { area.appendChild(vazio('editar', 'Nenhuma anotação ainda.', 'Anote o que aprendeu: selecione versículos na Bíblia e toque em Anotar, ou crie uma anotação livre.', ['Criar anotação', function () { editarNota({ refs: [], texto: '' }); }, 'mais'])); return; }
    area.appendChild(lista(B.ordenar(itens, ordem, ordemLivros())));
  };
  SECOES.estudos = function (area) {
    var itens = todosItens().filter(function (it) { return it.tipo === 'estudo'; });
    area.appendChild(h('div.barra-bib', h('button.bt.pri', { on: { click: function () { editarEstudo({}); } } }, ico('mais'), 'Novo estudo'),
      App.temIA ? h('button.bt', { on: { click: estudoComIA } }, ico('brilho'), 'Montar com IA') : null));
    if (!itens.length) { area.appendChild(vazio('nota', 'Nenhum estudo salvo ainda.', 'Organize um tema com passagens e anotações, ou salve um estudo do Assistente bíblico.', ['Abrir o assistente', function () { App.ir('assistente'); }, 'brilho'])); return; }
    var cats = Array.from(new Set(itens.map(function (e) { return e.sub; }).filter(Boolean))).sort(), f = App.estado.catEstudo || '', ordem = App.estado.bibOrdemEst || 'recentes';
    area.appendChild(h('div.barra-bib', h('div.chips', { style: { flex: 1, minWidth: 0 } }, h('button.chip', { 'aria-pressed': String(!f), on: { click: function () { App.estado.catEstudo = ''; App.recarregar(); } } }, 'Todos os assuntos'),
      cats.map(function (c) { return h('button.chip', { 'aria-pressed': String(f === c), on: { click: function () { App.estado.catEstudo = c; App.recarregar(); } } }, c); })),
      seletorOrdem(ordem, function (v) { App.estado.bibOrdemEst = v; App.recarregar(); })));
    area.appendChild(lista(B.ordenar(itens.filter(function (e) { return !f || e.sub === f; }), ordem, ordemLivros())));
  };
  SECOES.artes = function (area) {
    var itens = B.ordenar(todosItens().filter(function (it) { return it.tipo === 'arte'; }), 'recentes');
    area.appendChild(h('div.barra-bib', h('button.bt.pri', { on: { click: function () { App.ir('criar'); } } }, ico('pincel'), 'Criar arte'), h('div.esp'), h('p.sub', itens.length ? itens.length + (itens.length > 1 ? ' artes' : ' arte') : '')));
    if (!itens.length) { area.appendChild(vazio('pincel', 'Nenhuma arte criada ainda.', 'Transforme um versículo em imagem para compartilhar no Estúdio de Criação.', ['Abrir o estúdio', function () { App.ir('criar'); }, 'pincel'])); return; }
    area.appendChild(h('div.artes-bib', itens.map(function (it) {
      return h('div.arte-bib', h('button.arte-bib-abrir', { 'aria-label': 'Abrir a arte ' + it.titulo, on: { click: function () { Telas.criar.abrirArte(it.id); } } },
        it.miniatura ? h('img', { src: it.miniatura, alt: '' }) : h('span.sem-mini'), h('b', it.titulo), h('small', meta(it))),
        h('button.bt-ico.peq.bib-menu', { 'aria-label': 'Mais ações para ' + it.titulo, on: { click: function () { acoesItem(it); } } }, ico('menu')));
    })));
  };

  // ---------------------------------------------------------------- pesquisa inteligente
  var FILTROS_BUSCA = [['', 'Tudo'], ['versiculo', 'Versículos'], ['estudo', 'Estudos'], ['nota', 'Anotações'], ['devocional', 'Devocionais'], ['arte', 'Artes'], ['colecao', 'Coleções']];
  async function resultadosBusca(area, consulta) {
    var tipo = App.estado.bibBuscaTipo || '', ordem = App.estado.bibBuscaOrdem || 'relevancia';
    var topo = h('div.busca-filtros', h('div.chips', FILTROS_BUSCA.map(function (f) {
      return h('button.chip', { 'aria-pressed': String(tipo === f[0]), on: { click: function () { App.estado.bibBuscaTipo = f[0]; area.replaceChildren(); resultadosBusca(area, consulta); } } }, f[1]);
    })), seletorOrdem(ordem, function (v) { App.estado.bibBuscaOrdem = v; area.replaceChildren(); resultadosBusca(area, consulta); }, [['relevancia', 'Mais relevantes']].concat(ORDENS)));
    var res = h('div', { 'aria-live': 'polite' }, h('div.carregando', h('div.giro')));
    area.appendChild(topo); area.appendChild(res);
    var r = Biblia.interpretar(consulta), ref = r.ok && /\d/.test(consulta) ? r.ref : (r.ok && r.soLivro ? { livro: r.ref.livro, cap: null } : null);
    var itens = todosItens(), textos = {};
    await Promise.all(itens.filter(function (it) { return it.tipo === 'versiculo'; }).map(function (it) { return textoDe(it.id).then(function (t) { textos[it.id] = t; }); }));
    if (!res.isConnected) return;
    var cols = colecoes().map(function (c) { return Object.assign({}, c, { membros: B.membros(c, Dados.todos('favoritos')).map(function (m) { return B.chaveItem(m.tipo, m.id); }) }); });
    var achados = B.pesquisar(itens, ref ? '' : consulta, { textos: textos, ref: ref, colecoes: cols });
    if (ref && !achados.length) achados = B.pesquisar(itens, consulta, { textos: textos, colecoes: cols });
    var colsAchadas = cols.filter(function (c) { var t = B.norm(consulta); return B.norm(c.nome).indexOf(t) >= 0 || B.norm(c.descricao).indexOf(t) >= 0; });
    if (tipo && tipo !== 'colecao') achados = achados.filter(function (it) { return it.tipo === tipo; });
    if (tipo === 'colecao') achados = [];
    if (tipo && tipo !== 'colecao') colsAchadas = [];
    if (ordem !== 'relevancia') achados = B.ordenar(achados, ordem, ordemLivros());
    res.replaceChildren();
    var total = achados.length + colsAchadas.length;
    res.appendChild(h('p.sub.busca-total', total ? total + ' resultado' + (total > 1 ? 's' : '') + ' para “' + consulta + '”' + (ref ? ' (referência ' + A2Ref.formatar(ref.cap ? ref : { livro: ref.livro, cap: 1 }).replace(/ 1$/, '') + ')' : '') : ''));
    if (colsAchadas.length) res.appendChild(h('div.cols-linha', colsAchadas.map(cartaoColecao)));
    if (achados.length) res.appendChild(lista(achados));
    if (!total) res.appendChild(vazio('busca', 'Nada encontrado.', 'Tente outra palavra, uma referência como Jo 3:16 ou o nome de um estudo, tema ou coleção.'));
  }

  // ---------------------------------------------------------------- destaques
  function destaques(area) {
    var ds = Dados.todos('destaques');
    if (!ds.length) { area.appendChild(vazio('marcador', 'Nenhum destaque ainda.', 'Na Bíblia, selecione versículos e escolha Destacar para marcá-los com cores.', ['Explorar Bíblia', function () { App.ir('biblia'); }, 'livro'])); return; }
    var ordem = A2Ref.LIVROS.map(function (l) { return l.id; });
    ds.sort(function (a, b) { var x = A2Ref.deChave(a.id), y = A2Ref.deChave(b.id); return ordem.indexOf(x.livro) - ordem.indexOf(y.livro) || x.cap - y.cap || x.v - y.v; });
    var cores = { amarelo: 'Amarelo', verde: 'Verde', azul: 'Azul', rosa: 'Rosa', lilas: 'Lilás' }, filtro = App.estado.corDestaque || '';
    area.appendChild(h('div.chips', h('button.chip', { 'aria-pressed': String(!filtro), on: { click: function () { App.estado.corDestaque = ''; App.recarregar(); } } }, 'Todas as cores'),
      Object.keys(cores).map(function (c) { return h('button.chip', { 'aria-pressed': String(filtro === c), on: { click: function () { App.estado.corDestaque = c; App.recarregar(); } } }, h('span', { style: { display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--d-' + c + ')', marginRight: '6px', boxShadow: '0 0 0 1px var(--linha)' } }), cores[c]); })));
    area.appendChild(h('div.lista', { style: { marginTop: '8px' } }, ds.filter(function (d) { return !filtro || d.cor === filtro; }).map(function (d) {
      var t = h('span.texto-vers', { style: { background: 'var(--d-' + d.cor + ')', borderRadius: '4px', padding: '0 3px' } }, '…'); textoVersiculo(d.id, t);
      return h('button.item', { on: { click: function () { var r = refDeChave(d.id); App.abrirBiblia(r.livro, r.cap, r.v1); } } }, h('div.corpo', h('span.titulo', A2Ref.formatar(refDeChave(d.id))), t));
    })));
  }

  // ---------------------------------------------------------------- anotações
  function rotuloRefs(refs) {
    if (!refs || !refs.length) return '';
    var d = refs.map(A2Ref.deChave), mesmo = d.every(function (x) { return x.livro === d[0].livro && x.cap === d[0].cap; });
    if (mesmo) { var vs = d.map(function (x) { return x.v; }).sort(function (a, b) { return a - b; }); return A2Ref.POR_ID[d[0].livro].nome + ' ' + d[0].cap + ':' + (vs.length > 1 && vs[vs.length - 1] - vs[0] === vs.length - 1 ? vs[0] + '-' + vs[vs.length - 1] : vs.join(', ')); }
    return refs.map(function (k) { return A2Ref.formatar(refDeChave(k), true); }).join('; ');
  }
  function editarNota(n) {
    var novo = !n.id, id = n.id || UI.uid();
    UI.folha(novo ? 'Nova anotação' : 'Anotação', function (api) {
      var tit = h('input.entrada#nota-tit', { type: 'text', maxlength: 80, placeholder: 'Ex.: O que aprendi sobre a graça' }); tit.value = n.titulo || '';
      var ta = h('textarea.entrada#nota-txt', { rows: 8, placeholder: 'Escreva o que você aprendeu, perguntas, aplicações…' }); ta.value = n.texto || '';
      var ver = h('div.cartao', { style: { font: '400 16px/1.6 var(--f-leitura)' } });
      if (n.refs && n.refs.length) { ver.textContent = '…'; Promise.all(n.refs.map(function (k) { var d = A2Ref.deChave(k); return Biblia.livro(d.livro).then(function (lv) { return d.v + ' ' + UI.plano(lv.caps[d.cap - 1][d.v - 1]); }); })).then(function (ts) { ver.textContent = ts.join('  '); }); }
      return h('form.form', { on: { submit: function (e) {
        e.preventDefault();
        if (!ta.value.trim()) { UI.aviso('Escreva algo antes de salvar.', true); return; }
        Dados.salvar('notas', id, { titulo: tit.value.trim(), refs: n.refs || [], texto: ta.value.trim(), criadoEm: n.criadoEm || new Date().toISOString(), atualizadoEm: new Date().toISOString() });
        api.fechar(); UI.aviso('Anotação salva.');
      } } },
        n.refs && n.refs.length ? h('div.campo', h('span', rotuloRefs(n.refs)), ver) : null,
        h('label.campo', { for: 'nota-tit' }, h('span', 'Título (opcional)'), tit),
        h('label.campo', { for: 'nota-txt' }, h('span', 'Sua anotação'), ta),
        h('div.linha-bts', h('button.bt.pri', { type: 'submit' }, 'Salvar'),
          !novo ? h('button.bt.perigo', { type: 'button', on: { click: async function () { if (await UI.confirmar('Excluir anotação', 'Esta anotação será apagada.', 'Excluir', true)) { Dados.excluir('notas', id); limparDasColecoes('nota', id); api.fechar(); } } } }, ico('lixo'), 'Excluir') : null,
          n.refs && n.refs.length ? h('button.bt', { type: 'button', on: { click: function () { api.fechar(); var r = refDeChave(n.refs[0]); App.abrirBiblia(r.livro, r.cap, r.v1); } } }, ico('livro'), 'Abrir na Bíblia') : null));
    });
  }

  // ---------------------------------------------------------------- estudos pessoais
  function verEstudo(e) {
    UI.folha(e.titulo || 'Estudo', function (api) {
      var c = h('div.form');
      if (e.origem === 'ia') c.appendChild(h('div.aviso-ia', ico('brilho'), h('span', 'Estrutura sugerida por IA. As passagens abaixo trazem o texto da tradução; os comentários são da IA e devem ser conferidos com as Escrituras.')));
      if (e.categoria) c.appendChild(h('span.selo', e.categoria));
      if (e.corpo) c.appendChild(h('p', { style: { whiteSpace: 'pre-line', font: '400 16px/1.65 var(--f-leitura)' } }, e.corpo));
      (e.refs || []).forEach(function (s) {
        var r = Biblia.interpretar(s.ref || s); if (!r.ok) return;
        var t = h('p.texto-vers', { style: { font: '400 16px/1.6 var(--f-leitura)' } }, '…');
        Biblia.textoDe(r.ref).then(function (vs) { t.textContent = vs.map(function (x) { return UI.plano(x.t); }).join(' '); });
        c.appendChild(h('div.cartao', h('button.bt.peq.fant', { style: { padding: 0, fontWeight: 800, color: 'var(--azul-texto)' }, on: { click: function () { api.fechar(); App.abrirBiblia(r.ref.livro, r.ref.cap, r.ref.v1); } } }, A2Ref.formatar(r.ref), ico('direita')), t,
          s.nota ? h('p.sub', { style: { marginTop: '6px' } }, s.nota) : null));
      });
      c.appendChild(h('div.linha-bts', h('button.bt.pri', { on: { click: function () { api.fechar(); editarEstudo(e); } } }, ico('editar'), 'Editar'),
        h('button.bt', { on: { click: function () { App.compartilhar(textoEstudo(e), 'Compartilhar estudo'); } } }, ico('compartilhar'), 'Compartilhar'),
        e.id ? h('button.bt', { on: { click: function () { api.fechar(); setTimeout(function () { escolherColecoes({ tipo: 'estudo', id: e.id, titulo: e.titulo || 'Estudo' }); }, 30); } } }, ico('colecao'), 'Coleção') : null,
        h('button.bt.perigo', { on: { click: async function () { if (await UI.confirmar('Excluir estudo', 'O estudo será apagado.', 'Excluir', true)) { Dados.excluir('estudos', e.id); limparDasColecoes('estudo', e.id); api.fechar(); } } } }, ico('lixo'), 'Excluir')));
      return c;
    });
  }
  function editarEstudo(e) {
    var id = e.id || UI.uid();
    UI.folha(e.id ? 'Editar estudo' : 'Novo estudo', function (api) {
      var tit = h('input.entrada#est-tit', { type: 'text', maxlength: 120 }); tit.value = e.titulo || '';
      var cat = h('input.entrada#est-cat', { type: 'text', maxlength: 40, list: 'est-cats', placeholder: 'Ex.: Doutrina, Personagens, Família' }); cat.value = e.categoria || '';
      var dl = h('datalist#est-cats', Array.from(new Set(Dados.todos('estudos').map(function (x) { return x.categoria; }).filter(Boolean))).map(function (c) { return h('option', { value: c }); }));
      var corpo = h('textarea.entrada#est-corpo', { rows: 7 }); corpo.value = e.corpo || '';
      var refs = (e.refs || []).map(function (s) { return typeof s === 'string' ? { ref: s } : Object.assign({}, s); });
      var listaRefs = h('div.lista'), nova = h('input.entrada#est-ref', { type: 'text', placeholder: 'Adicionar passagem, ex.: At 2:38-42' }), erro = h('p.sub', { style: { color: 'var(--perigo)' } });
      function desenharRefs() {
        listaRefs.replaceChildren.apply(listaRefs, refs.map(function (s, i) {
          return h('div.item', h('div.corpo', h('span.titulo', s.ref), s.nota ? h('span.meta', s.nota) : null),
            h('button.bt-ico', { type: 'button', 'aria-label': 'Remover ' + s.ref, on: { click: function () { refs.splice(i, 1); desenharRefs(); } } }, ico('fechar')));
        }));
      }
      desenharRefs();
      function adicionar() { var r = Biblia.interpretar(nova.value); if (!r.ok) { erro.textContent = r.erro; return; } erro.textContent = ''; refs.push({ ref: A2Ref.formatar(r.ref) }); nova.value = ''; desenharRefs(); }
      nova.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); adicionar(); } });
      return h('form.form', { on: { submit: function (ev) {
        ev.preventDefault();
        if (!tit.value.trim()) { UI.aviso('Dê um título ao estudo.', true); tit.focus(); return; }
        Dados.salvar('estudos', id, { titulo: tit.value.trim(), categoria: cat.value.trim(), corpo: corpo.value, refs: refs, origem: e.origem || 'pessoal', criadoEm: e.criadoEm || new Date().toISOString(), atualizadoEm: new Date().toISOString() });
        App.registrar('estudo', { titulo: tit.value.trim() });
        api.fechar(); UI.aviso('Estudo salvo.');
      } } },
        h('label.campo', { for: 'est-tit' }, h('span', 'Título'), tit),
        h('label.campo', { for: 'est-cat' }, h('span', 'Categoria'), cat, dl),
        h('label.campo', { for: 'est-corpo' }, h('span', 'Anotações do estudo'), corpo),
        h('div.campo', h('span', 'Passagens'), listaRefs, h('div', { style: { display: 'flex', gap: '8px' } }, h('label.sr', { for: 'est-ref' }, 'Passagem'), nova, h('button.bt', { type: 'button', on: { click: adicionar } }, 'Adicionar')), erro),
        h('div.linha-bts', h('button.bt.pri', { type: 'submit' }, 'Salvar estudo')));
    });
  }
  // Organização de pesquisa temática com IA: a IA sugere estrutura e REFERÊNCIAS; o texto vem sempre da Bíblia.
  function estudoComIA() {
    UI.folha('Montar estudo com IA', function (api) {
      var tema = h('input.entrada#ia-tema', { type: 'text', maxlength: 120, placeholder: 'Ex.: o batismo no livro de Atos' }), estado = h('p.sub'), bt;
      async function gerar() {
        var sample = root.claude && root.claude.use ? await root.claude.use('sample') : null;
        if (!sample) { estado.textContent = 'A IA não está disponível nesta visualização.'; return; }
        if (!tema.value.trim()) { estado.textContent = 'Informe um tema.'; return; }
        bt.disabled = true; estado.textContent = 'Organizando o estudo…';
        try {
          var j = await sample.json('Você ajuda a organizar um estudo bíblico pessoal em português do Brasil, sem viés denominacional.\n' +
            'Tema: ' + tema.value.trim() + '\n' +
            'Responda em JSON: {"titulo": string, "introducao": string (até 80 palavras, sem citar versículos por extenso), "passagens": [{"ref": "Livro capítulo:versículo(s)", "nota": string (até 30 palavras: o que observar na passagem)}]} com 6 a 10 passagens.\n' +
            'Regras: use apenas referências que existem; NÃO escreva o texto dos versículos; não atribua à Bíblia o que ela não diz; quando houver interpretações diferentes entre cristãos, diga isso de forma neutra.', { modelTier: 'default' });
          var refs = (j.passagens || []).map(function (p) { var r = Biblia.interpretar(String(p.ref || '')); return r.ok ? { ref: A2Ref.formatar(r.ref), nota: String(p.nota || '').slice(0, 300) } : null; }).filter(Boolean);
          var descartadas = (j.passagens || []).length - refs.length;
          if (!refs.length) throw new Error('A IA não trouxe referências válidas. Tente outro tema.');
          var id = UI.uid();
          Dados.salvar('estudos', id, { titulo: String(j.titulo || tema.value).slice(0, 120), categoria: 'Rascunho IA', corpo: String(j.introducao || '').slice(0, 1200), refs: refs, origem: 'ia', criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() });
          api.fechar(); UI.aviso('Rascunho criado' + (descartadas ? ' (' + descartadas + ' referência(s) inválida(s) descartada(s))' : '') + '. Revise antes de usar.');
          verEstudo(Dados.obter('estudos', id));
        } catch (e) { estado.textContent = e && e.code === 'rate_limited' ? 'Muitos pedidos seguidos. Aguarde e tente de novo.' : (e.message || 'Não foi possível gerar agora.'); }
        finally { bt.disabled = false; }
      }
      bt = h('button.bt.pri', { on: { click: gerar } }, ico('brilho'), 'Montar rascunho');
      return h('div.form', h('label.campo', { for: 'ia-tema' }, h('span', 'Tema do estudo'), tema), bt, estado,
        h('div.aviso-ia', ico('brilho'), h('span', 'A IA sugere a estrutura e as referências. Cada referência é conferida antes de entrar no estudo, e o texto mostrado é sempre o da tradução, nunca escrito pela IA.')));
    });
  }

  // ---------------------------------------------------------------- histórico
  function historico(area) {
    var meses = Dados.todos('historico').sort(function (a, b) { return b.id.localeCompare(a.id); }), itens = [];
    meses.forEach(function (m) { itens = itens.concat(m.itens || []); });
    itens.sort(function (a, b) { return b.em.localeCompare(a.em); });
    var tipo = App.estado.tipoHist || '';
    var TIPOS = { capitulo: ['ok', 'Capítulo concluído'], leitura: ['livro', 'Capítulo aberto'], versiculo: ['sol', 'Versículo do dia'], devocional: ['luz', 'Devocional'], plano: ['planos', 'Plano'], busca: ['busca', 'Pesquisa'], arte: ['pincel', 'Arte'], estudo: ['nota', 'Estudo'], quiz: ['estrela', 'Quiz'] };
    area.appendChild(h('div.chips', h('button.chip', { 'aria-pressed': String(!tipo), on: { click: function () { App.estado.tipoHist = ''; App.recarregar(); } } }, 'Tudo'),
      Object.keys(TIPOS).map(function (t) { return h('button.chip', { 'aria-pressed': String(tipo === t), on: { click: function () { App.estado.tipoHist = t; App.recarregar(); } } }, TIPOS[t][1]); })));
    itens = itens.filter(function (x) { return !tipo || x.tipo === tipo; }).slice(0, 300);
    if (!itens.length) { area.appendChild(vazio('historico', 'Nada registrado ainda.', 'Leituras, devocionais, pesquisas, estudos e artes aparecem aqui conforme você usa o app.')); return; }
    var dia = null, lista = h('div.lista', { style: { marginTop: '8px' } });
    itens.forEach(function (x) {
      var d = x.em.slice(0, 10);
      if (d !== dia) { dia = d; lista.appendChild(h('div.rotulo', { style: { marginTop: '10px' } }, d === UI.hoje() ? 'Hoje' : UI.dataLonga(d))); }
      var t = TIPOS[x.tipo] || ['info', x.tipo];
      lista.appendChild(h('button.item', { on: { click: function () { abrirHist(x); } } }, ico(t[0]), h('div.corpo', h('span', h('b', t[1] + ': '), x.ref || x.titulo || ''), h('span.meta', new Date(x.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })))));
    });
    area.appendChild(lista);
  }
  function abrirHist(x) {
    if (x.tipo === 'leitura' || x.tipo === 'versiculo' || x.tipo === 'capitulo') { var r = Biblia.interpretar(x.ref || ''); if (r.ok) App.abrirBiblia(r.ref.livro, r.ref.cap, r.ref.v1); }
    else if (x.tipo === 'busca') Telas.pesquisa.abrir(x.titulo);
    else if (x.tipo === 'devocional' && x.id) Telas.devocionais.abrir(x.id);
    else if (x.tipo === 'arte') { App.estado.secaoCriar = 'minhas'; App.ir('criar'); }
  }

  SECOES.destaques = destaques;
  SECOES.historico = historico;

  root.Telas.biblioteca = { render: render, editarNota: editarNota, abrirColecao: abrirColecao };
})(window);
