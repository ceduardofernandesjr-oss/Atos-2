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

  // Cartão discreto abaixo do Versículo do Dia (o cartão do versículo não muda). Some com a conta ou com “Agora não”.
  function conviteGoogle() {
    if (!(root.A2Nuvem && A2Nuvem.configurado() && Dados.estado.tipo === 'nuvem') || A2Nuvem.conta() || App.config().ocultarConviteGoogle) return null;
    var msg = h('small.convite-google-msg', { role: 'status' });
    var bt = h('button.bt.pri.convite-google-bt#inicio-google', { on: { click: async function () {
      bt.disabled = true; msg.textContent = 'Abrindo o Google…';
      try { await A2Nuvem.Conta.entrarComGoogle(); } catch (e) { bt.disabled = false; msg.textContent = A2Nuvem.mensagem(e); }
    } } }, h('span.conta-google-g', { 'aria-hidden': 'true' }, 'G'), 'Continuar com o Google');
    var el = h('section.cartao.convite-google', { hidden: true, 'aria-label': 'Entrar com o Google' },
      h('div.convite-google-topo', h('span.acesso-ico', ico('nuvem')),
        h('div', h('b', 'Guarde tudo na sua conta'), h('small', 'Entre com o Google e veja favoritos, planos, anotações e pontos da Jornada em qualquer aparelho.'))),
      h('div.linha-bts', bt, h('button.bt.fant#inicio-google-depois', { on: { click: function () { App.salvarConfig({ ocultarConviteGoogle: true }); el.remove(); UI.aviso('Você pode entrar quando quiser em Perfil › Conta.'); } } }, 'Agora não')),
      msg);
    if (A2Nuvem.Conta && A2Nuvem.Conta.provedores) A2Nuvem.Conta.provedores().then(function (p) { if (p.google) el.hidden = false; });
    return el;
  }

  function render(tela) {
    var perfil = App.perfil(), hoje = UI.hoje(), lembretes = App.lembretesPendentes(), diaN = A2Conteudo.diaNumero(hoje);

    // ---------------------------------------------------------------- cabeçalho e saudação
    var sino = h('button.bt-ico.sino-inicio', { 'aria-label': 'Lembretes (' + lembretes.length + ')', on: { click: abrirLembretes } }, ico('sino'),
      lembretes.length ? h('span.ponto-aviso', { 'aria-hidden': 'true' }) : null);
    var avatar = h('button.avatar-inicio', { 'aria-label': 'Abrir o perfil', on: { click: function () { App.ir('perfil'); } } },
      perfil.foto ? h('img', { src: perfil.foto, alt: '' }) : h('span', (perfil.nome || 'A').charAt(0).toUpperCase()));
    tela.appendChild(h('header.cab.cab-inicio', h('div.marca-peq', { html: UI.logo(36) + '<b>ATOS 2</b>' }), h('div.esp'),
      App.botaoTema(), h('button.bt-ico', { 'aria-label': 'Pesquisar na Bíblia', on: { click: function () { Telas.pesquisa.abrir(); } } }, ico('busca')), sino, avatar));
    var seq = sequencia();
    tela.appendChild(h('section.saudacao',
      h('span.sobre', capital(new Date().toLocaleDateString('pt-BR', { weekday: 'long' })) + ' · ' + UI.dataLonga(hoje)),
      h('h1', saudacao() + (perfil.nome ? ', ' + perfil.nome.split(' ')[0] : '') + '.'),
      h('p', seq > 1 ? h('span.selo-seq', ico('chama'), seq + ' dias seguidos') : null, h('span.lema', 'De volta à doutrina dos apóstolos.'))));

    // ---------------------------------------------------------------- Versículo do dia (componente preservado)
    var cartao = h('section.vdia', { 'aria-label': 'Versículo do dia' }, h('span.rotulo', 'Versículo do dia'), h('div.carregando', { style: { padding: '24px' } }, h('div.giro')));
    tela.appendChild(cartao);
    montarVersiculoDia(cartao, hoje);

    if (lembretes.length) tela.appendChild(h('div.lembretes-hoje', lembretes.map(function (l) {
      return h('button.lembrete-chip', { on: { click: function () { App.abrirLembrete(l); } } }, ico('sino'), h('span', l.texto), ico('direita'));
    })));

    // ---------------------------------------------------------------- convite para entrar com o Google (sem conta)
    var convite = conviteGoogle();
    if (convite) tela.appendChild(convite);

    // ---------------------------------------------------------------- Continue: última leitura e plano
    tela.appendChild(secao('Continue'));
    var cont = h('div.continue');
    tela.appendChild(cont);
    cont.appendChild(cardLeitura());
    cont.appendChild(cardPlano());

    // ---------------------------------------------------------------- Devocional
    tela.appendChild(secao('Devocional de hoje', 'Arquivo', function () { App.estado.secaoBiblioteca = 'devocionais'; App.estado.abaDevo = 'arquivo'; App.ir('biblioteca'); }));
    tela.appendChild(cardDevocional());

    // ---------------------------------------------------------------- Estúdio de artes
    tela.appendChild(cardEstudio(hoje));

    // ---------------------------------------------------------------- Explorar (acessos rápidos)
    tela.appendChild(secao('Explorar'));
    var q = estatQuiz(), desafio = q.desafios[hoje];
    tela.appendChild(h('div.grade.g3.explorar',
      atalho('brilho', 'Assistente bíblico', 'Estude uma passagem e o contexto', function () { App.ir('assistente'); }),
      atalho('estrela', 'Quiz bíblico', desafio ? 'Desafio de hoje: ' + desafio.acertos + ' de 5' : 'Desafio do dia: 5 perguntas', function () { App.ir('quiz'); }, null, desafio ? 'feito' : 'novo'),
      atalho('colecao', 'Mural', 'Curiosidades e as 95 Teses', function () { App.estado.muralAba = 'curiosidades'; App.ir('mural'); })));
    tela.appendChild(h('div.chips.atalhos-estudo', { 'aria-label': 'Atalhos do assistente' },
      [['bereano', 'Modo Bereano', 'escudo'], ['doutrinas', 'Doutrinas', 'colecao'], ['original', 'Grego e hebraico', 'texto']].map(function (m) {
        return h('button.chip', { on: { click: function () { App.estado.assistenteModo = m[0]; App.estado.doutrinaAberta = null; App.ir('assistente'); } } }, ico(m[2]), m[1]);
      })));

    // ---------------------------------------------------------------- Descubra mais
    tela.appendChild(secao('Descubra mais'));
    tela.appendChild(descubra(diaN));

    // ---------------------------------------------------------------- Minha jornada (resumo; o painel completo fica no Perfil)
    tela.appendChild(secao('Minha jornada', 'Ver tudo', function () { App.ir('jornada'); }));
    tela.appendChild(Telas.jornada.cartaoResumo());

    App.aoMudar(function (c) { if (c === 'planos' || c === 'leitura' || c === '*') App.atualizar(); });
    App.aoSair(Dados.ouvirConteudo(function (nome) { if (App.estado.aba === 'inicio' && (nome === 'reflexoes' || nome === 'devocionais')) App.atualizar(); }));
  }
  function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function secao(titulo, link, acao) {
    return h('div.secao', h('h2', titulo), h('div.esp'), link ? h('button.link-secao', { on: { click: acao } }, link, ico('direita')) : null);
  }

  function atalho(icone, titulo, texto, acao, progresso, selo) {
    return h('button.atalho', { on: { click: acao } }, h('span.atalho-ico', ico(icone), selo === 'feito' ? h('i.marca-ok', { 'aria-label': 'feito' }, '✓') : selo === 'novo' ? h('i.marca-novo', { 'aria-hidden': 'true' }) : null),
      h('b', titulo), h('small', texto),
      progresso != null ? h('div.barra', { role: 'progressbar', 'aria-valuenow': Math.round(progresso), 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: { width: progresso + '%' } })) : null);
  }
  function anel(pct, rotulo) {
    var r = 22, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, pct || 0));
    var el = h('div.anel', { role: 'progressbar', 'aria-valuenow': Math.round(v), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': rotulo });
    el.innerHTML = '<svg viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="' + r + '" class="anel-fundo"/><circle cx="27" cy="27" r="' + r + '" class="anel-valor" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + (c * (1 - v / 100)).toFixed(2) + '"/></svg><span>' + Math.round(v) + '%</span>';
    return el;
  }

  function cardLeitura() {
    var ult = Dados.obter('leitura', 'ultima'), lidos = (Dados.obter('leitura', 'capitulos') || {}).lidos || {};
    var livro = ult ? ult.livro : 'JHN', cap = ult ? ult.cap : 1, info = A2Ref.LIVROS.filter(function (l) { return l.id === livro; })[0] || { nome: 'João' };
    var total = (Biblia.contagemSinc()(livro) || []).length || 1, feitos = 0;
    for (var i = 1; i <= total; i++) if (lidos[livro + '.' + i]) feitos++;
    var pct = feitos / total * 100;
    return h('button.cont-card.leitura', { on: { click: function () { App.abrirBiblia(livro, cap, ult ? ult.v : null); } } },
      h('div.cont-topo', h('span.cont-ico', ico('livro')), h('span.cont-rotulo', ult ? 'Última leitura' : 'Comece a ler')),
      h('b.cont-titulo', info.nome), h('span.cont-sub', ult ? 'Capítulo ' + cap + (ult.v ? ', versículo ' + ult.v : '') : 'O Evangelho de João, capítulo 1'),
      h('div.cont-prog', h('div.barra', { role: 'progressbar', 'aria-label': 'Capítulos lidos de ' + info.nome, 'aria-valuenow': feitos, 'aria-valuemin': 0, 'aria-valuemax': total }, h('i', { style: { width: pct + '%' } })),
        h('small', feitos + ' de ' + total + ' capítulos')),
      h('span.cont-acao', ult ? 'Continuar' : 'Começar', ico('direita')));
  }
  function cardPlano() {
    var plano = planoEmDestaque();
    if (!plano) return h('button.cont-card.plano.vazio', { on: { click: function () { App.estado.secaoBiblioteca = 'planos'; App.ir('biblioteca'); } } },
      h('div.cont-topo', h('span.cont-ico', ico('planos')), h('span.cont-rotulo', 'Plano de leitura')),
      h('b.cont-titulo', 'Escolha um plano'), h('span.cont-sub', '8 planos, de 28 a 365 dias, com progresso e lembretes'),
      h('span.cont-acao', 'Ver planos', ico('direita')));
    var r = plano.r, status = r.concluido ? 'Concluído' : r.lidoHoje ? 'Leitura de hoje feita' : r.atrasados ? r.atrasados + (r.atrasados > 1 ? ' dias' : ' dia') + ' em atraso' : 'Em dia';
    return h('button.cont-card.plano', { on: { click: function () { location.hash = 'biblioteca'; setTimeout(function () { Telas.planos.abrir(plano.def.id); }, 50); } } },
      h('div.cont-topo', h('span.cont-ico', ico('planos')), h('span.cont-rotulo', 'Seu plano'), anel(r.percentual, 'Progresso do plano de leitura')),
      h('b.cont-titulo', plano.def.nome),
      h('span.cont-sub', r.concluido ? 'Você concluiu os ' + r.total + ' dias.' : 'Dia ' + (r.proximo + 1) + ' de ' + r.total + ': ' + A2Planos.rotuloLeitura(plano.cron[r.proximo], A2Ref.formatar)),
      h('span.selo' + (r.concluido || r.lidoHoje ? '.ok' : r.atrasados ? '.alerta' : '.ouro'), status),
      h('span.cont-acao', r.concluido ? 'Ver plano' : 'Ler agora', ico('direita')));
  }
  function cardDevocional() {
    var dev = Telas.devocionais.doDia();
    function abrirDev() { location.hash = 'biblioteca'; setTimeout(function () { if (dev) Telas.devocionais.abrir(dev.id); else { App.estado.secaoBiblioteca = 'devocionais'; App.recarregar(); } }, 50); }
    if (!dev) return h('button.devo-card.vazio', { on: { click: abrirDev } }, h('span.devo-ico', ico('luz')),
      h('div.devo-corpo', h('b', 'O devocional de hoje ainda não foi publicado'), h('small', 'Enquanto isso, leia os devocionais anteriores.')), ico('direita'));
    var lido = !!Dados.obter('devLidos', dev.id), ref = Biblia.interpretar(dev.passagem || '');
    return h('button.devo-card', { on: { click: abrirDev } }, h('span.devo-ico', ico('luz')),
      h('div.devo-corpo', h('span.devo-cat', (dev.categoria || 'Devocional') + (dev.data && dev.data !== UI.hoje() ? ' · ' + UI.dataCurta(dev.data) : '')),
        h('b', dev.titulo), ref.ok ? h('small', ico('livro'), ' ' + A2Ref.formatar(ref.ref)) : null),
      lido ? h('span.selo.ok', 'Lido') : h('span.devo-ler', 'Ler'));
  }
  function cardEstudio(hoje) {
    var ref = A2Conteudo.versiculoDoDia(hoje), artes = Dados.todos('artes'), rasc = artes.filter(function (a) { return a.estado === 'rascunho'; }).length;
    var cv = h('canvas.estudio-mini', { 'aria-hidden': 'true' });
    var card = h('section.estudio-card', { 'aria-label': 'Estúdio de artes' },
      h('div.estudio-texto',
        h('span.sobre', 'Estúdio de artes'),
        h('h3', 'O versículo de hoje vira arte'),
        h('p', artes.length ? artes.length + (artes.length > 1 ? ' artes criadas' : ' arte criada') + (rasc ? ' · ' + rasc + (rasc > 1 ? ' rascunhos' : ' rascunho') : '') : '64 modelos, fontes, cores e elementos para personalizar.'),
        h('div.linha-bts', h('button.bt.ouro.peq#inicio-criar-arte', { on: { click: function () { Telas.criar.comVersiculo(ref); } } }, ico('pincel'), 'Criar arte'),
          h('button.bt.claro.peq', { on: { click: function () { App.ir('criar'); } } }, artes.length ? 'Minhas artes' : 'Abrir estúdio'))),
      h('button.estudio-previa', { 'aria-label': 'Criar arte com o versículo de hoje', on: { click: function () { Telas.criar.comVersiculo(ref); } } }, cv));
    // prévia real: o versículo de hoje num modelo do estúdio
    setTimeout(function () {
      if (!cv.isConnected || !root.A2Desenho) return;
      var base = A2Arte.normalizar({ formato: 'feed', conteudo: { tipo: 'versiculo', ref: ref, versao: App.config().traducao || Biblia.padrao() } });
      var modelos = ['pai-lago', 'ceu-pier', 'nat-floresta', 'dev-cruz', 'esc-aurora', 'pai-fiorde', 'cla-outono'];
      A2Desenho.desenhar(cv, A2Arte.aplicarModelo(base, A2Modelos.POR_ID[modelos[A2Conteudo.diaNumero(hoje) % modelos.length]]), 300).catch(function () {});
    }, 60);
    return card;
  }

  function descubra(diaN) {
    var cur = A2Mural.CURIOSIDADES[((diaN % A2Mural.CURIOSIDADES.length) + A2Mural.CURIOSIDADES.length) % A2Mural.CURIOSIDADES.length];
    var semana = Math.floor(diaN / 7), tema = A2Conteudo.TEMAS[((semana % A2Conteudo.TEMAS.length) + A2Conteudo.TEMAS.length) % A2Conteudo.TEMAS.length];
    var pers = A2Conteudo.PERSONAGENS[((diaN % A2Conteudo.PERSONAGENS.length) + A2Conteudo.PERSONAGENS.length) % A2Conteudo.PERSONAGENS.length];
    var itens = [
      { foto: 'mapa-mundi', sobre: 'Curiosidade do dia', titulo: cur.titulo, acao: function () { App.estado.muralAba = 'curiosidades'; App.ir('mural'); } },
      { foto: 'lago-amanhecer', sobre: 'Tema da semana', titulo: tema.nome + ': o que a Bíblia diz', acao: function () { Telas.pesquisa.abrir('', { tema: tema.id }); } },
      { foto: 'caminho-estreito', sobre: 'Personagem', titulo: 'A história de ' + pers.nome.split(',')[0], acao: function () { Telas.pesquisa.abrir('', { personagem: pers.nome }); } },
      { foto: 'vela', sobre: 'Reforma', titulo: 'As 95 Teses de Lutero', acao: function () { App.estado.muralAba = 'teses'; App.ir('mural'); } },
      { foto: 'folha', sobre: 'Originais', titulo: 'Palavras em grego e hebraico', acao: function () { App.estado.assistenteModo = 'original'; App.ir('assistente'); } },
      { foto: 'aurora-boreal', sobre: 'Inspirações', titulo: 'Papéis de parede e artes prontas', acao: function () { Telas.criar.abrirInspiracoes(); } },
      { foto: 'fiorde', sobre: 'Números da Bíblia', titulo: 'Livros, capítulos e o versículo do meio', acao: function () { App.estado.muralAba = 'numeros'; App.ir('mural'); } }
    ];
    return h('div.descubra', { role: 'list' }, itens.map(function (it) {
      return h('button.descubra-card', { role: 'listitem', on: { click: it.acao } },
        h('img', { src: 'fundos/fotos/' + it.foto + '-mini.jpg', alt: '', loading: 'lazy', width: 180, height: 320 }),
        h('span.descubra-sobre', it.sobre), h('b', it.titulo));
    }));
  }

  function sequencia() { return A2Jornada.sequencia(Telas.jornada.eventos(), UI.hoje()); }
  function estatQuiz() { return Object.assign({ jogos: 0, pontos: 0, desafios: {} }, Dados.obter('quiz', 'estatisticas') || {}); }
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
