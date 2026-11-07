/* ATOS 2 — Perfil: identidade, progresso, preferências, notificações, dados, sincronização e licenças. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;

  // v2.5: mesmo vocabulário visual do Início, Bíblia, Biblioteca e Criar (cabeçalho serifado, cartão azul-marinho de destaque,
  // cartões de acesso com ícone em azul, grupos de ajustes em cartão branco, chips com seleção em azul-marinho).
  var MODOS = { sincronizado: ['ok', 'Sincronizado com sua conta'], conectando: ['', 'Conectando…'], offline: ['alerta', 'Sem conexão: salvando neste aparelho'], local: ['', 'Salvo neste aparelho'], memoria: ['alerta', 'Armazenamento do navegador indisponível'], iniciando: ['', 'Iniciando…'] };
  function modoSinc() { var est = Dados.estado; return MODOS[est.modo] || ['', est.modo]; }

  function avatar(p, classe) {
    return h('div.' + (classe || 'perfil-foto'), p.foto ? h('img', { src: p.foto, alt: 'Sua foto' }) : h('span', (p.nome || 'A').trim().charAt(0).toUpperCase() || 'A'));
  }
  function ajusteIco(i) { return h('span.ajuste-ico', ico(i)); }
  // linha de ajuste com ação: ícone · título e descrição · seta
  function linhaAjuste(i, t, s, fn, extra) {
    return h('button.ajuste.ajuste-link' + (extra || ''), { on: { click: fn } }, ajusteIco(i), h('div.ajuste-txt', h('b', t), s ? h('small', s) : null), ico('direita'));
  }
  function grupo() { return h('section.cartao.grupo-ajustes', Array.prototype.slice.call(arguments)); }
  function secao(t, link) { return h('div.secao', h('h2', t), link ? h('div.esp') : null, link || null); }

  function render(tela) {
    var p = App.perfil(), cfg = App.config(), est = Dados.estado;
    tela.appendChild(h('header.cab.cab-bib', h('div.cab-bib-txt', h('h1', 'Perfil'), h('p.sub', 'Sua conta, sua jornada e suas preferências.'))));

    // destaque: identidade
    var arq = h('input#foto-perfil', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    arq.addEventListener('change', function () { if (arq.files[0]) trocarFoto(arq.files[0]); });
    var v = Biblia.versao(cfg.traducao || Biblia.padrao());
    var selo = h('span.perfil-sinc');
    function desenharSelo() { var m = modoSinc(); selo.className = 'perfil-sinc' + (m[0] ? ' ' + m[0] : ''); UI.trocar(selo, ico(est.modo === 'sincronizado' ? 'nuvem' : 'escudo'), m[1]); }
    desenharSelo(); App.aoMudar(function (c) { if (c === '_estado') desenharSelo(); });
    var nivelHero = h('button.perfil-nivel#perfil-nivel', { on: { click: function () { Jornada.abrir(); } } });
    function desenharNivelHero() { var j = Jornada.estado(), nv = A2Sabedoria.progresso(j.pontos, j.nivel).nivel; UI.trocar(nivelHero, Jornada.emblemaEl(nv.n, 22), h('span', nv.nome)); }
    desenharNivelHero();
    tela.appendChild(h('section.perfil-hero',
      h('div.perfil-id', avatar(p),
        h('div.perfil-nome', h('span.sobre', 'Meu perfil'), h('b#perfil-nome-txt', p.nome || 'Sem nome'), h('small', ico('livro'), 'Lendo a ' + (v ? v.nome + ' (' + v.sigla + ')' : 'Bíblia')),
          nivelHero)),
      h('div.perfil-rodape', selo, h('button.bt.perfil-editar#editar-perfil', { on: { click: function () { editarPerfil(arq); } } }, ico('editar'), 'Editar perfil')), arq));

    // Jornada da Sabedoria (gamificação do quiz): nível, emblema, pontos, barra e medalhas; painel completo em folha
    tela.appendChild(secao('Jornada da Sabedoria', h('button.link-secao#ir-quiz-perfil', { on: { click: function () { App.ir('quiz'); } } }, 'Jogar quiz', ico('direita'))));
    var jornadaEl = h('div#jornada-perfil', Jornada.cartao({ medalhas: true }));
    tela.appendChild(jornadaEl);
    App.aoSair(Jornada.ouvir(function () { if (jornadaEl.isConnected) { UI.trocar(jornadaEl, Jornada.cartao({ medalhas: true })); desenharNivelHero(); } }));
    Jornada.carregar();

    // Minha jornada (o mesmo resumo do Início; painel completo em #jornada)
    tela.appendChild(secao('Minha jornada', h('button.link-secao#ver-jornada', { on: { click: function () { App.ir('jornada'); } } }, 'Painel completo', ico('direita'))));
    tela.appendChild(Telas.jornada.cartaoResumo());

    // Minha caminhada: atalhos no padrão de Acesso rápido da Biblioteca
    var ativos = Dados.todos('planos').filter(function (x) { return x.status !== 'concluido'; });
    function n(qt, um, varios, nada) { return qt ? qt + ' ' + (qt === 1 ? um : varios) : nada; }
    function irBib(sec, extra) { return function () { App.estado.secaoBiblioteca = sec; if (extra) extra(); App.ir('biblioteca'); }; }
    tela.appendChild(secao('Minha caminhada'));
    tela.appendChild(h('div.acesso-bib.caminhada', [
      ['planos', 'planos', 'Planos de leitura', n(ativos.length, 'ativo', 'ativos', 'Nenhum ativo'), irBib('planos')],
      ['favoritos', 'coracao', 'Versículos', n(A2Biblioteca.favVersiculos(Dados.todos('favoritos')).length, 'favorito', 'favoritos', 'Nenhum ainda'), irBib('favoritos')],
      ['devocionais', 'luz', 'Devocionais', n(Dados.todos('devSalvos').length, 'salvo', 'salvos', 'Nenhum ainda'), irBib('devocionais', function () { App.estado.abaDevo = 'salvos'; })],
      ['artes', 'pincel', 'Minhas artes', n(Dados.todos('artes').length, 'arte', 'artes', 'Nenhuma ainda'), function () { App.estado.secaoCriar = 'minhas'; App.ir('criar'); }],
      ['colecoes', 'colecao', 'Coleções', n(Dados.todos('colecoes').length, 'coleção', 'coleções', 'Nenhuma ainda'), irBib('colecoes')],
      ['historico', 'historico', 'Histórico', 'Leituras e estudos', irBib('historico')]
    ].map(function (x) { return h('button.acesso-card', { 'data-acesso': x[0], on: { click: x[4] } }, h('span.acesso-ico', ico(x[1])), h('b', x[2]), h('small', x[3])); })));

    // Preferências
    tela.appendChild(secao('Preferências'));
    var trad = h('select.entrada#pref-trad', Biblia.VERSOES.map(function (x) { var o = h('option', { value: x.id, disabled: !x.ativa }, x.nome + ' (' + x.sigla + ')' + (x.ativa ? '' : ' — licença pendente')); if (x.id === cfg.traducao) o.selected = true; return o; }));
    trad.addEventListener('change', function () { App.salvarConfig({ traducao: trad.value }); });
    var temas = [['sistema', 'Automático'], ['claro', 'Claro'], ['escuro', 'Noturno']];
    var seg = h('div.seg-perfil#pref-tema', { role: 'group', 'aria-label': 'Aparência' }, temas.map(function (t) {
      return h('button.chip', { 'data-tema': t[0], 'aria-pressed': String((cfg.tema || 'sistema') === t[0]), on: { click: function () {
        seg.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.tema === t[0])); }); App.salvarConfig({ tema: t[0] }); } } }, t[1]);
    }));
    var tam = h('input#pref-tam', { type: 'range', min: 15, max: 28, value: cfg.fonteTam, 'aria-label': 'Tamanho do texto bíblico' });
    var amostra = h('span.amostra-tam', { style: { fontSize: cfg.fonteTam + 'px' } }, 'Aa'), tamV = h('b.tam-v', cfg.fonteTam + ' px');
    tam.addEventListener('input', function () { tamV.textContent = tam.value + ' px'; amostra.style.fontSize = tam.value + 'px'; });
    tam.addEventListener('change', function () { App.salvarConfig({ fonteTam: +tam.value }); });
    tela.appendChild(grupo(
      h('div.ajuste.empilhado', ajusteIco('livro'), h('label.ajuste-txt', { for: 'pref-trad' }, h('b', 'Tradução preferida'), h('small', 'Usada na leitura, no versículo do dia, na pesquisa e nas artes')), trad),
      h('div.ajuste.empilhado', ajusteIco('lua'), h('div.ajuste-txt', h('b', 'Aparência'), h('small', 'O automático segue o tema do aparelho')), seg),
      h('div.ajuste.empilhado', ajusteIco('texto'), h('label.ajuste-txt', { for: 'pref-tam' }, h('b', 'Tamanho do texto bíblico'), h('small', 'Vale para o leitor')), h('div.tam-linha', amostra, tam, tamV))));

    // Notificações
    tela.appendChild(secao('Notificações'));
    var notif = grupo();
    [['versiculo', 'Versículo do dia', 'marcador'], ['devocional', 'Devocional diário', 'luz'], ['leitura', 'Lembrete de leitura', 'livro'], ['plano', 'Plano de leitura', 'planos'], ['estudos', 'Continuação de estudos', 'nota']].forEach(function (x) {
      var c = cfg.notif[x[0]], on = h('input.interruptor#nt-' + x[0], { type: 'checkbox', 'aria-label': x[1] }), hr = h('input.entrada.hora#nh-' + x[0], { type: 'time', value: c.hora, 'aria-label': 'Horário: ' + x[1] });
      on.checked = c.on; hr.disabled = !c.on;
      function salvar() { var y = App.config().notif; y[x[0]] = { on: on.checked, hora: hr.value || c.hora }; hr.disabled = !on.checked; App.salvarConfig({ notif: y }); }
      on.addEventListener('change', salvar); hr.addEventListener('change', salvar);
      notif.appendChild(h('div.ajuste.notif', ajusteIco(x[2]), h('div.ajuste-txt', h('label', { for: 'nt-' + x[0] }, h('b', x[1])), h('div.hora-linha', ico('relogio'), hr)), on));
    });
    var permissao = h('div.ajuste-nota');
    function estadoPermissao() {
      var suporta = 'Notification' in window, perm = suporta ? Notification.permission : 'indisponivel';
      UI.trocar(permissao, h('p.sub', 'Os lembretes aparecem no Início e no sino quando chega o horário. ' +
        (perm === 'granted' ? 'Notificações do navegador ativadas neste aparelho.' : perm === 'denied' ? 'O navegador bloqueou notificações para este app.' : perm === 'indisponivel' ? 'Este ambiente não permite notificações do sistema; na versão instalada no celular elas funcionam.' : '')),
        suporta && perm === 'default' ? h('button.bt.peq', { on: { click: function () { try { Notification.requestPermission().then(estadoPermissao, function () { UI.aviso('Este ambiente não permite notificações do sistema.', true); }); } catch (e) { UI.aviso('Este ambiente não permite notificações do sistema.', true); } } } }, ico('sino'), 'Permitir notificações do navegador') : null);
    }
    estadoPermissao(); notif.appendChild(permissao);
    tela.appendChild(notif);

    // Conta
    tela.appendChild(secao('Conta'));
    var contaEl = h('section.cartao.grupo-ajustes.conta-perfil');
    function desenharConta() {
      var c = est.conta;
      if (est.tipo === 'claude') { UI.trocar(contaEl, h('div.ajuste', ajusteIco('pessoa'), h('div.ajuste-txt', h('b', est.usuario ? 'Conta do claude.ai' : 'Sem conta conectada'), h('small', est.usuario ? 'Nesta versão de prévia você é identificado pela sua conta do claude.ai.' : 'Nesta visualização os dados ficam só neste aparelho.')))); return; }
      if (!(root.A2Nuvem && A2Nuvem.configurado())) { UI.trocar(contaEl, h('div.ajuste', ajusteIco('pessoa'), h('div.ajuste-txt', h('b', 'Sem conta'), h('small', 'Os dados ficam só neste aparelho.')))); return; }
      if (c) {
        UI.trocar(contaEl,
          h('div.ajuste', ajusteIco('pessoa'), h('div.ajuste-txt', h('b', c.email), h('small', 'Favoritos, notas, planos, estudos e artes ficam na sua conta e aparecem em qualquer aparelho em que você entrar.')),
            c.papel !== 'leitor' ? h('span.selo.ouro', c.papel === 'administrador' ? 'Administração' : 'Edição') : null),
          linhaAjuste('cadeado', 'Trocar senha', null, function () { Telas.perfil.novaSenha(); }),
          linhaAjuste('esquerda', 'Sair da conta', 'Seus dados continuam guardados na conta', sair),
          linhaAjuste('lixo', 'Excluir minha conta', 'Apaga a conta e tudo o que está guardado nela', excluirConta));
      } else {
        UI.trocar(contaEl,
          h('div.ajuste', ajusteIco('nuvem'), h('div.ajuste-txt', h('b', 'Guarde tudo na sua conta'), h('small', 'Crie uma conta gratuita para usar seus favoritos, notas, planos e artes em qualquer aparelho. Sem conta, tudo continua funcionando e fica salvo só neste aparelho.'))),
          h('div.linha-bts.conta-bts', h('button.bt.pri', { on: { click: function () { abrirConta('cadastro'); } } }, 'Criar conta'), h('button.bt', { on: { click: function () { abrirConta('entrar'); } } }, 'Entrar')),
          botaoGoogle('Continuar com o Google', h('p.sub')));
      }
    }
    async function excluirConta() {
      var c = est.conta || {};
      var ok = await UI.confirmar('Excluir minha conta', 'Sua conta (' + (c.email || '') + ') e tudo o que está guardado nela serão apagados para sempre: perfil, favoritos, destaques, anotações, planos, estudos, artes, progresso de leitura e pontos da Jornada da Sabedoria. Isso não pode ser desfeito.', 'Continuar', true);
      if (!ok) return;
      var conf = await UI.perguntar('Confirme a exclusão', 'Para confirmar, digite EXCLUIR', '', { ok: 'Excluir para sempre' });
      if (conf == null) return;
      if (String(conf).trim().toUpperCase() !== 'EXCLUIR') { UI.aviso('A conta não foi excluída: a confirmação não confere.', true); return; }
      try {
        await A2Nuvem.Conta.excluir();
        try { await Dados.apagarAparelho(); } catch (e) {}
        UI.aviso('Sua conta e seus dados foram excluídos.');
        setTimeout(function () { location.reload(); }, 1200);
      } catch (e) { UI.aviso((e && e.message) || 'Não foi possível excluir a conta agora. Tente de novo.', true); }
    }
    async function sair() {
      var apagar = await UI.confirmar('Sair da conta', 'Seus dados continuam guardados na conta. Deseja também apagar a cópia deste aparelho? (Recomendado em aparelho compartilhado.)', 'Sair e apagar deste aparelho', true);
      try { await A2Nuvem.Conta.sair(); if (apagar) await Dados.apagarAparelho(); UI.aviso('Você saiu da conta.'); } catch (e) { UI.aviso(e.message, true); }
    }
    desenharConta();
    App.aoMudar(function (c) { if (c === '_estado') desenharConta(); });
    tela.appendChild(contaEl);

    // Dados e armazenamento
    tela.appendChild(secao('Dados e armazenamento'));
    var sinc = grupo();
    function desenharSinc() {
      var m = modoSinc();
      var offline = h('small', 'Conferindo…');
      UI.trocar(sinc,
        h('div.ajuste', ajusteIco(est.modo === 'sincronizado' ? 'nuvem' : 'escudo'), h('div.ajuste-txt', h('b', m[1]),
          h('small', est.modo === 'sincronizado' ? 'Tudo o que você salva acompanha você em qualquer aparelho com a mesma conta.' : 'Tudo é salvo primeiro no aparelho e enviado quando houver conexão.')),
          est.pendentes ? h('span.selo', est.pendentes + ' a enviar') : null),
        est.erro ? h('p.sub.ajuste-nota', { style: { color: 'var(--perigo)' } }, est.erro) : null,
        h('button.ajuste.ajuste-link#guardar-biblia', { on: { click: baixarBiblia } }, ajusteIco('baixar'), h('div.ajuste-txt', h('b', 'Guardar a Bíblia sem internet'), offline), ico('direita')),
        linhaAjuste('copiar', 'Exportar meus dados', 'Arquivo com tudo o que você salvou', exportar),
        linhaAjuste('lixo', 'Apagar dados deste aparelho', est.modo === 'sincronizado' ? 'A cópia local; a conta continua com tudo' : 'O que só existe aqui será perdido', async function () {
          if (await UI.confirmar('Apagar dados deste aparelho', est.modo === 'sincronizado' ? 'A cópia local será apagada; seus dados continuam na sua conta e voltam ao recarregar.' : 'Os dados que só existem neste aparelho serão perdidos.', 'Apagar', true)) { await Dados.apagarAparelho(); UI.aviso('Dados locais apagados.'); }
        }, '.perigo'));
      Biblia.baixadosOffline().then(function (q) { offline.textContent = (q >= 66 ? 'Bíblia completa guardada' : q + ' de 66 livros guardados') + ' · ' + Biblia.versao(Biblia.padrao()).sigla; });
    }
    desenharSinc();
    App.aoMudar(function (c) { if (c === '_estado') desenharSinc(); });
    tela.appendChild(sinc);

    // Edição de conteúdo
    if (est.dono || est.podeEditar) {
      tela.appendChild(secao('Edição de conteúdo'));
      tela.appendChild(grupo(
        linhaAjuste('luz', 'Devocionais', 'Revisar rascunhos e publicar', function () { App.estado.secaoBiblioteca = 'devocionais'; App.estado.abaDevo = 'edicao'; App.ir('biblioteca'); }),
        linhaAjuste('sol', 'Reflexão do versículo de hoje', 'Escrever ou revisar', function () { Telas.devocionais.editarReflexao(UI.hoje(), A2Conteudo.versiculoDoDia(UI.hoje())); })));
    }

    // Sobre
    tela.appendChild(secao('Sobre o Atos 2'));
    tela.appendChild(h('section.cartao.grupo-ajustes.sobre-perfil',
      h('div.sobre-marca', h('div.marca-peq', { html: UI.logo(40) + '<b>ATOS 2</b>' }), h('p.lema', 'De volta à doutrina dos apóstolos.'),
        h('p.sub', 'O ATOS 2 não pertence a nenhuma denominação. As Escrituras vêm sempre das traduções, sem alterações; conteúdos com apoio de inteligência artificial são identificados e revisados antes de publicar.')),
      linhaAjuste('escudo', 'Licenças e créditos', 'Traduções, textos originais, fotos e fontes', abrirLicencas, '#ver-licencas'),
      h('p.sub.versao-app.link-priv', h('a#link-privacidade', { href: 'privacidade.html', target: '_blank', rel: 'noopener' }, 'Política de privacidade'), ' · ', h('a#link-termos', { href: 'termos.html', target: '_blank', rel: 'noopener' }, 'Termos de uso')),
      h('p.sub.versao-app', 'Versão ' + (App.versao || '') + (root.A2Nuvem && A2Nuvem.Conta && A2Nuvem.Conta.provedores ? ' · login com Google disponível' : ''))));
  }

  function abrirLicencas() {
    UI.folha('Licenças e créditos', function () {
      var corpo = h('div.form.licencas');
      var creditos = h('div.lista');
      corpo.appendChild(h('div.rotulo', 'Traduções'));
      corpo.appendChild(creditos);
      Biblia.licenciadas().then(function (vs) {
        vs.forEach(function (v) {
          creditos.appendChild(h('div.item', { style: { alignItems: 'flex-start' } }, ico('livro'), h('div.corpo',
            h('span.titulo', v.nome + ' (' + v.sigla + ')'),
            h('span.meta', { style: { whiteSpace: 'normal' } }, v.credito),
            v.alteracoes ? h('span.meta', { style: { whiteSpace: 'normal' } }, v.alteracoes) : null)));
        });
      }, function () {});
      corpo.appendChild(h('div.rotulo', 'Outros conteúdos'));
      corpo.appendChild(h('div.aviso', ico('imagem'), h('span', A2Fotos.CREDITO)));
      corpo.appendChild(h('div.aviso', ico('texto'), h('span', A2Originais.CREDITO)));
      corpo.appendChild(h('div.aviso', ico('pincel'), h('span', 'Fontes das artes e do app: Cormorant Garamond, Literata, Manrope, Playfair Display, Lora, Libre Baskerville, Cinzel, Montserrat, Josefin Sans, Bebas Neue, Dancing Script e Great Vibes, sob a SIL Open Font License 1.1 (arquivos via Fontsource). Ícones e decorações das artes: desenho próprio do ATOS 2.')));
      corpo.appendChild(h('div.aviso', ico('escudo'), h('span', 'As 95 Teses, as fichas dos livros, as explicações de palavras e os temas de doutrina são redação do ATOS 2. Confira tudo nas Escrituras.')));
      return corpo;
    }, { cheia: true });
  }

  function editarPerfil(arq) {
    UI.folha('Editar perfil', function (api) {
      var p = App.perfil();
      var nome = h('input.entrada#perfil-nome', { type: 'text', maxlength: 40, value: p.nome || '', autocomplete: 'given-name' });
      return h('form.form.editar-perfil', { on: { submit: function (ev) {
        ev.preventDefault();
        var atual = App.perfil(), novoNome = nome.value.trim();
        Dados.salvar('perfil', 'eu', Object.assign({}, atual, { nome: novoNome }, novoNome !== (atual.nome || '') ? { nomeManual: true } : {}));
        api.fechar(); UI.aviso('Perfil atualizado.'); App.recarregar();
      } } },
        h('div.editar-foto', avatar(p),
          h('div.linha-bts', h('button.bt.peq', { type: 'button', on: { click: function () { api.fechar(); arq.click(); } } }, ico('imagem'), p.foto ? 'Trocar foto' : 'Escolher foto'),
            p.foto ? h('button.bt.peq.fant', { type: 'button', on: { click: function () { var q = App.perfil(); delete q.foto; q.fotoManual = true; Dados.salvar('perfil', 'eu', q); api.fechar(); App.recarregar(); } } }, 'Remover foto') : null)),
        h('label.campo', { for: 'perfil-nome' }, h('span', 'Nome'), nome),
        h('p.sub', 'A foto fica no seu perfil e aparece no Início. Ela é reduzida no aparelho antes de ser guardada.'),
        h('div.linha-bts', h('button.bt.pri', { type: 'submit' }, 'Salvar')));
    });
  }

  async function trocarFoto(arq) {
    try {
      var img = await new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = URL.createObjectURL(arq); });
      var lado = 256, c = h('canvas', { width: lado, height: lado }), s = Math.max(lado / img.width, lado / img.height);
      c.getContext('2d').drawImage(img, (lado - img.width * s) / 2, (lado - img.height * s) / 2, img.width * s, img.height * s);
      Dados.salvar('perfil', 'eu', Object.assign({}, App.perfil(), { foto: c.toDataURL('image/jpeg', 0.82), fotoManual: true }));
      App.recarregar();
    } catch (e) { UI.aviso('Não foi possível usar esta imagem.', true); }
  }
  async function baixarBiblia() {
    var f = UI.folha('Guardar a Bíblia', h('div.form', h('p', 'Baixando os 66 livros da ' + Biblia.versao(Biblia.padrao()).nome + ' para leitura sem internet…'), h('div.barra', { style: { height: '10px' } }, h('i#prog-bib', { style: { width: '0%' } })), h('p.sub#prog-txt', '0 de 66')));
    try {
      await Biblia.todosOsLivros(Biblia.padrao(), function (i, n) { var b = f.el.querySelector('#prog-bib'), t = f.el.querySelector('#prog-txt'); if (b) b.style.width = (i / n * 100) + '%'; if (t) t.textContent = i + ' de ' + n; });
      f.fechar(); UI.aviso('Bíblia guardada neste aparelho.'); App.recarregar();
    } catch (e) { f.fechar(); UI.aviso(e.message, true); }
  }
  async function exportar() {
    var json = JSON.stringify(Dados.exportar(), null, 2);
    var dl = root.claude && root.claude.use ? await root.claude.use('downloads') : null;
    if (dl) { try { await dl.save({ filename: 'atos2-meus-dados-' + UI.hoje() + '.json', data: json }); return; } catch (e) { if (e && e.code === 'declined') return; } }
    try { var a = h('a', { href: URL.createObjectURL(new Blob([json], { type: 'application/json' })), download: 'atos2-meus-dados.json' }); document.body.appendChild(a); a.click(); a.remove(); }
    catch (e) { UI.copiar(json); }
  }

  // ---------------------------------------------------------------- conta (versão publicada)
  // Botão "Continuar com o Google": só aparece quando o provedor está ativo no Supabase
  function botaoGoogle(rotulo, msg, comDivisor) {
    var bt = h('button.bt.conta-google-bt', { type: 'button', on: { click: async function () {
      bt.disabled = true; msg.style.color = ''; msg.textContent = 'Abrindo o Google…';
      try { await A2Nuvem.Conta.entrarComGoogle(); } catch (e) { bt.disabled = false; msg.style.color = 'var(--perigo)'; msg.textContent = A2Nuvem.mensagem(e); }
    } } }, h('span.conta-google-g', { 'aria-hidden': 'true' }, 'G'), rotulo);
    var caixa = h('div.conta-google', { hidden: true }, bt, comDivisor ? h('div.conta-ou', h('span', 'ou com e-mail')) : msg);
    if (root.A2Nuvem && A2Nuvem.Conta && A2Nuvem.Conta.provedores) A2Nuvem.Conta.provedores().then(function (p) { if (p.google || p.indisponivel) caixa.hidden = false; });
    return caixa;
  }
  function abrirConta(modo) {
    UI.folha(modo === 'cadastro' ? 'Criar conta' : modo === 'recuperar' ? 'Recuperar senha' : 'Entrar', function (api) {
      var nome = h('input.entrada#conta-nome', { type: 'text', maxlength: 40, autocomplete: 'given-name', value: App.perfil().nome || '' });
      var email = h('input.entrada#conta-email', { type: 'email', required: true, autocomplete: 'email', inputmode: 'email' });
      var senha = h('input.entrada#conta-senha', { type: 'password', minlength: 8, required: true, autocomplete: modo === 'cadastro' ? 'new-password' : 'current-password' });
      var msg = h('p.sub', { role: 'status' }), bt = h('button.bt.pri', { type: 'submit' }, modo === 'cadastro' ? 'Criar conta' : modo === 'recuperar' ? 'Enviar link' : 'Entrar');
      async function enviar(ev) {
        ev.preventDefault(); msg.style.color = ''; bt.disabled = true;
        try {
          if (modo === 'cadastro') {
            if (!/[a-zA-Z]/.test(senha.value) || !/\d/.test(senha.value) || senha.value.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres, com letras e números.');
            var r = await A2Nuvem.Conta.cadastrar(nome.value.trim(), email.value.trim(), senha.value);
            if (nome.value.trim()) Dados.salvar('perfil', 'eu', Object.assign({}, App.perfil(), { nome: nome.value.trim() }));
            if (r.precisaConfirmar) { UI.trocar(ev.target, h('div.form', h('p', 'Pronto! Enviamos um link de confirmação para ', h('b', email.value.trim()), '.'), h('p.sub', 'Abra o e-mail (veja também o lixo eletrônico), toque no link e depois entre com sua senha.'), h('button.bt.pri', { on: { click: function () { api.fechar(); abrirConta('entrar'); } } }, 'Já confirmei, entrar'))); return; }
            api.fechar(); UI.aviso('Conta criada. Seus dados começam a sincronizar.');
          } else if (modo === 'recuperar') {
            await A2Nuvem.Conta.recuperar(email.value.trim());
            msg.textContent = 'Se houver conta com esse e-mail, enviamos um link para criar uma nova senha.';
          } else {
            await A2Nuvem.Conta.entrar(email.value.trim(), senha.value);
            api.fechar(); UI.aviso('Bem-vindo de volta! Sincronizando seus dados…');
          }
        } catch (e) { msg.style.color = 'var(--perigo)'; msg.textContent = A2Nuvem.mensagem(e); }
        finally { bt.disabled = false; }
      }
      var google = botaoGoogle(modo === 'cadastro' ? 'Criar conta com o Google' : 'Continuar com o Google', msg, true);
      return h('form.form', { on: { submit: enviar } },
        modo !== 'recuperar' ? google : null,
        modo === 'cadastro' ? h('label.campo', { for: 'conta-nome' }, h('span', 'Nome'), nome) : null,
        h('label.campo', { for: 'conta-email' }, h('span', 'E-mail'), email),
        modo !== 'recuperar' ? h('label.campo', { for: 'conta-senha' }, h('span', 'Senha' + (modo === 'cadastro' ? ' (mínimo 8 caracteres, com letras e números)' : '')), senha) : null,
        msg, h('div.linha-bts', bt),
        modo === 'entrar' ? h('div.linha-bts', h('button.bt.peq', { type: 'button', on: { click: function () { api.fechar(); abrirConta('recuperar'); } } }, 'Esqueci minha senha'), h('button.bt.peq', { type: 'button', on: { click: function () { api.fechar(); abrirConta('cadastro'); } } }, 'Criar conta')) : null,
        modo === 'cadastro' ? h('p.sub', 'Usamos seu e-mail só para entrar e recuperar a senha. Com o Google, recebemos só nome, e-mail e foto da conta. Seus dados são privados: só você vê.') : null);
    });
  }
  function novaSenha() {
    UI.folha('Nova senha', function (api) {
      var s1 = h('input.entrada#nova-senha', { type: 'password', minlength: 8, required: true, autocomplete: 'new-password' });
      var s2 = h('input.entrada#nova-senha2', { type: 'password', minlength: 8, required: true, autocomplete: 'new-password' }), msg = h('p.sub', { role: 'status' });
      return h('form.form', { on: { submit: async function (ev) {
        ev.preventDefault();
        if (s1.value !== s2.value) { msg.textContent = 'As senhas não são iguais.'; return; }
        if (s1.value.length < 8 || !/[a-zA-Z]/.test(s1.value) || !/\d/.test(s1.value)) { msg.textContent = 'Use pelo menos 8 caracteres, com letras e números.'; return; }
        try { await A2Nuvem.Conta.novaSenha(s1.value); Dados.estado.recuperarSenha = false; api.fechar(); UI.aviso('Senha alterada.'); } catch (e) { msg.textContent = A2Nuvem.mensagem(e); }
      } } }, h('label.campo', { for: 'nova-senha' }, h('span', 'Nova senha'), s1), h('label.campo', { for: 'nova-senha2' }, h('span', 'Repita a nova senha'), s2), msg,
        h('div.linha-bts', h('button.bt.pri', { type: 'submit' }, 'Salvar senha')));
    });
  }

  root.Telas.perfil = { render: render, abrirConta: abrirConta, novaSenha: novaSenha, editarPerfil: editarPerfil, abrirLicencas: abrirLicencas };
})(window);
