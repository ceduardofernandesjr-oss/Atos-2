/* ATOS 2 — Início: versículo do dia, atalhos e lembretes. Também ações comuns de compartilhamento e favoritos. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;

  // ---------- ações comuns ----------
  App.compartilhar = function (texto, titulo) {
    UI.folha(titulo || 'Compartilhar', function (api) {
      var opcoes = h('div.lista');
      if (navigator.share) opcoes.appendChild(h('button.item', { on: { click: function () {
        navigator.share({ text: texto }).then(api.fechar, function () { UI.aviso('O compartilhamento direto não está disponível aqui. Use Copiar ou WhatsApp.', true); });
      } } }, ico('compartilhar'), h('div.corpo', h('span.titulo', 'Compartilhar pelo aparelho'), h('span.meta', 'Abre as opções do seu celular'))));
      opcoes.appendChild(h('a.item', { href: 'https://wa.me/?text=' + encodeURIComponent(texto), target: '_blank', rel: 'noopener', style: { textDecoration: 'none' } },
        ico('compartilhar'), h('div.corpo', h('span.titulo', 'Enviar pelo WhatsApp'), h('span.meta', 'Abre o WhatsApp com o texto pronto'))));
      opcoes.appendChild(h('button.item', { on: { click: function () { UI.copiar(texto); api.fechar(); } } }, ico('copiar'), h('div.corpo', h('span.titulo', 'Copiar texto'), h('span.meta', 'Para colar em qualquer aplicativo'))));
      return h('div.form', h('div.cartao', { style: { whiteSpace: 'pre-line', fontFamily: 'var(--f-leitura)' } }, texto), opcoes);
    });
  };
  App.ehFavorito = function (k) { return !!Dados.obter('favoritos', k); };
  App.alternarFavorito = function (k) {
    if (App.ehFavorito(k)) { Dados.excluir('favoritos', k); UI.aviso('Removido dos favoritos.'); return false; }
    Dados.salvar('favoritos', k, { ref: k, colecoes: [], criadoEm: new Date().toISOString() });
    UI.aviso('Salvo nos favoritos.'); return true;
  };

  function saudacao() { var hr = new Date().getHours(); return hr < 5 ? 'Boa noite' : hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite'; }

  function render(tela) {
    var perfil = App.perfil(), hoje = UI.hoje(), lembretes = App.lembretesPendentes();
    var sino = h('button.bt-ico', { 'aria-label': 'Lembretes (' + lembretes.length + ')', on: { click: abrirLembretes } }, ico('sino'),
      lembretes.length ? h('span', { style: { position: 'absolute', marginLeft: '18px', marginTop: '-16px', width: '9px', height: '9px', borderRadius: '50%', background: 'var(--ouro)' } }) : null);
    tela.appendChild(h('header.cab', h('div.marca-peq', { html: UI.logo(36) + '<b>ATOS 2</b>' }), h('div.esp'),
      h('button.bt-ico', { 'aria-label': 'Pesquisar na Bíblia', on: { click: function () { Telas.pesquisa.abrir(); } } }, ico('busca')), sino));
    tela.appendChild(h('div', { style: { margin: '4px 0 16px' } },
      h('h1', { style: { font: '700 28px/1.15 var(--f-display)', color: 'var(--azul-texto)' } }, saudacao() + (perfil.nome ? ', ' + perfil.nome.split(' ')[0] : '') + '.'),
      h('p.sub', capital(new Date().toLocaleDateString('pt-BR', { weekday: 'long' })) + ', ' + UI.dataLonga(hoje))));

    // Versículo do dia
    var cartao = h('section.vdia', { 'aria-label': 'Versículo do dia' }, h('span.rotulo', 'Versículo do dia'), h('div.carregando', { style: { padding: '24px' } }, h('div.giro')));
    tela.appendChild(cartao);
    montarVersiculoDia(cartao, hoje);

    // Atalhos
    tela.appendChild(h('div.secao', h('h2', 'Continue')));
    var grade = h('div.grade.g2');
    tela.appendChild(grade);
    var ult = Dados.obter('leitura', 'ultima');
    grade.appendChild(atalho('livro', 'Última leitura', ult ? A2Ref.formatar({ livro: ult.livro, cap: ult.cap }) + ' · continuar de onde parou' : 'Comece por João 1, ou escolha um livro',
      function () { if (ult) App.abrirBiblia(ult.livro, ult.cap, ult.v); else App.abrirBiblia('JHN', 1); }));
    var plano = planoEmDestaque();
    grade.appendChild(atalho('planos', plano ? plano.def.nome : 'Plano de leitura',
      plano ? (plano.r.concluido ? 'Plano concluído.' : 'Dia ' + (plano.r.proximo + 1) + ': ' + A2Planos.rotuloLeitura(plano.cron[plano.r.proximo], A2Ref.formatar)) : 'Escolha entre 8 planos e acompanhe o progresso',
      function () { if (plano) { location.hash = 'biblioteca'; setTimeout(function () { Telas.planos.abrir(plano.def.id); }, 50); } else { App.estado.secaoBiblioteca = 'planos'; App.ir('biblioteca'); } },
      plano ? plano.r.percentual : null));
    var dev = Telas.devocionais.doDia();
    grade.appendChild(atalho('luz', 'Devocional', dev ? dev.titulo : 'O devocional de hoje ainda não foi publicado', function () {
      location.hash = 'biblioteca'; setTimeout(function () { if (dev) Telas.devocionais.abrir(dev.id); else { App.estado.secaoBiblioteca = 'devocionais'; App.recarregar(); } }, 50);
    }));
    grade.appendChild(atalho('pincel', 'Estúdio de artes', 'Transforme um versículo em imagem para compartilhar', function () { App.ir('criar'); }));

    // Explorar
    tela.appendChild(h('div.secao', h('h2', 'Explorar')));
    tela.appendChild(h('div.grade.g3.explorar',
      atalho('brilho', 'Assistente bíblico', 'Pesquise e entenda o contexto de uma passagem', function () { App.ir('assistente'); }),
      atalho('estrela', 'Quiz bíblico', 'Perguntas e respostas conferidas na Bíblia', function () { App.ir('quiz'); }),
      atalho('colecao', 'Mural', 'Curiosidades e as 95 Teses de Lutero', function () { App.ir('mural'); })));

    if (lembretes.length) {
      tela.appendChild(h('div.secao', h('h2', 'Lembretes de hoje')));
      tela.appendChild(h('div.lista', lembretes.map(function (l) {
        return h('button.item', { on: { click: function () { App.abrirLembrete(l); } } }, ico('sino'), h('div.corpo', h('span', l.texto)), ico('direita'));
      })));
    }

    App.aoMudar(function (c) { if (c === 'planos' || c === 'leitura' || c === '*') App.atualizar(); });
    App.aoSair(Dados.ouvirConteudo(function (nome) { if (App.estado.aba === 'inicio' && (nome === 'reflexoes' || nome === 'devocionais')) App.atualizar(); }));
  }
  function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function atalho(icone, titulo, texto, acao, progresso) {
    return h('button.atalho', { on: { click: acao } }, ico(icone), h('b', titulo), h('small', texto),
      progresso != null ? h('div.barra', { role: 'progressbar', 'aria-valuenow': Math.round(progresso), 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: { width: progresso + '%' } })) : null);
  }

  function planoEmDestaque() {
    var ativos = Dados.todos('planos').sort(function (a, b) { return (b._t || 0) - (a._t || 0); });
    var ativo = ativos.filter(function (p) { return p.status === 'ativo'; })[0] || ativos[0];
    if (!ativo) return null;
    var def = A2Planos.DEFINICOES.filter(function (d) { return d.id === ativo.planoId; })[0];
    if (!def) return null;
    var cron = A2Planos.cronograma(def, Biblia.contagemSinc('blivre'));
    return { def: def, est: ativo, cron: cron, r: A2Planos.resumo(ativo, def.dias, UI.hoje()) };
  }

  async function montarVersiculoDia(cartao, data) {
    var s = A2Conteudo.versiculoDoDia(data), sigla = Biblia.versao(App.config().traducao).sigla;
    try {
      var r = await Biblia.textoDeString(s, App.config().traducao);
      var chave = A2Ref.chave(r.ref.livro, r.ref.cap, r.ref.v1);
      var vistos = Dados.obter('vdia', 'vistos') || { datas: {} };
      if (!vistos.datas || !vistos.datas[data]) { var d = Object.assign({}, vistos.datas || {}); d[data] = s; Dados.salvar('vdia', 'vistos', { datas: d }); App.registrar('versiculo', { ref: s }); }
      var texto = h('blockquote');
      r.versos.forEach(function (x, i) { if (i) texto.appendChild(document.createTextNode(' ')); texto.appendChild(UI.textoComItalico(x.t)); });
      var fav = h('button.bt-ico' + (App.ehFavorito(chave) ? '.ativo' : ''), { 'aria-label': 'Favoritar', 'aria-pressed': String(App.ehFavorito(chave)) }, ico(App.ehFavorito(chave) ? 'coracaoCheio' : 'coracao'));
      fav.addEventListener('click', function () { var on = App.alternarFavorito(chave); fav.classList.toggle('ativo', on); fav.setAttribute('aria-pressed', String(on)); fav.replaceChildren(ico(on ? 'coracaoCheio' : 'coracao')); });
      var reflexao = (Dados.conteudo.reflexoes || []).filter(function (x) { return x.id === data && x.publicado; })[0];
      var dono = Dados.estado.dono || Dados.estado.podeEditar;
      UI.trocar(cartao,
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, h('span.rotulo', 'Versículo do dia'), h('span', { style: { fontSize: '12px', color: '#CBBF9F' } }, UI.dataLonga(data))),
        texto,
        h('div.ref', A2Ref.formatar(r.ref) + ' · ' + sigla),
        reflexao ? h('p.refl', reflexao.texto, reflexao.origem === 'ia' ? h('span', { style: { display: 'block', marginTop: '6px', fontSize: '11.5px', color: '#BFB49A' } }, 'Reflexão redigida com apoio de IA e revisada pela edição.') : null) : null,
        h('div.acoes', h('div.acoes-ico',
          fav,
          h('button.bt-ico', { 'aria-label': 'Compartilhar', on: { click: function () { A2Cartao.abrir({ versos: r.versos, ref: A2Ref.formatar(r.ref), sigla: sigla, data: UI.dataLonga(data) }, Biblia.citacao(r.versos, r.ref, sigla)); } } }, ico('compartilhar')),
          h('button.bt-ico', { 'aria-label': 'Criar arte com este versículo', on: { click: function () { Telas.criar.comVersiculo(s); } } }, ico('imagem')),
          h('button.bt-ico', { 'aria-label': 'Abrir na Bíblia', on: { click: function () { App.abrirBiblia(r.ref.livro, r.ref.cap, r.ref.v1); } } }, ico('livro'))),
          h('div.acoes-txt',
            dono && !reflexao ? h('button.bt.peq', { on: { click: function () { Telas.devocionais.editarReflexao(data, s); } } }, 'Escrever reflexão') : null,
            h('button.bt.peq', { on: { click: anteriores } }, 'Anteriores'))));
    } catch (e) {
      cartao.replaceChildren(h('span.rotulo', 'Versículo do dia'), h('p', { style: { margin: '12px 0' } }, 'Não foi possível carregar o texto agora: ' + e.message),
        h('button.bt.peq', { on: { click: function () { montarVersiculoDia(cartao, data); } } }, 'Tentar de novo'));
    }
  }

  function anteriores() {
    UI.folha('Versículos anteriores', function () {
      var lista = h('div.lista'), vistos = (Dados.obter('vdia', 'vistos') || {}).datas || {};
      A2Conteudo.anteriores(UI.hoje(), 21).forEach(function (x) {
        var item = h('button.item', { on: { click: function () { var r = Biblia.interpretar(x.ref); App.abrirBiblia(r.ref.livro, r.ref.cap, r.ref.v1); } } },
          h('div.corpo', h('span.meta', UI.dataLonga(x.data) + (vistos[x.data] ? ' · visto' : '')), h('span.titulo', A2Ref.formatar(Biblia.interpretar(x.ref).ref)), h('span.texto-vers', '…')));
        lista.appendChild(item);
        Biblia.textoDeString(x.ref).then(function (r) { item.querySelector('.texto-vers').textContent = r.versos.map(function (v) { return UI.plano(v.t); }).join(' '); });
      });
      return h('div.form', h('p.sub', 'Os versículos seguem um ciclo de ' + A2Conteudo.VERSICULOS_DIA.length + ' passagens; nenhum se repete antes de todos terem aparecido.'), lista);
    });
  }

  function abrirLembretes() {
    var l = App.lembretesPendentes();
    UI.folha('Lembretes', function (api) {
      if (!l.length) return h('div.vazio', h('b', 'Nada pendente agora.'), h('span', 'Escolha horários e tipos de lembrete em Perfil › Notificações.'));
      return h('div.lista', l.map(function (x) { return h('button.item', { on: { click: function () { api.fechar(); App.abrirLembrete(x); } } }, ico('sino'), h('div.corpo', x.texto)); }));
    });
  }

  root.Telas.inicio = { render: render };
})(window);
