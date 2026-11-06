/* ATOS 2 — Perfil: identidade, progresso, preferências, notificações, dados, sincronização e licenças. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;

  function sequencia() {
    var dias = {};
    Dados.todos('historico').forEach(function (m) { (m.itens || []).forEach(function (x) { if (x.tipo === 'leitura' || x.tipo === 'devocional' || x.tipo === 'plano') dias[x.em.slice(0, 10)] = 1; }); });
    var n = 0, d = UI.hoje();
    if (!dias[d]) d = A2Planos.addDias(d, -1);
    while (dias[d]) { n++; d = A2Planos.addDias(d, -1); }
    return n;
  }

  function render(tela) {
    var p = App.perfil(), cfg = App.config(), est = Dados.estado;
    var lidos = Object.keys((Dados.obter('leitura', 'capitulos') || {}).lidos || {}).length;
    tela.appendChild(h('header.cab', h('h1', 'Perfil')));

    // identidade
    var foto = h('div', { style: { width: '76px', height: '76px', borderRadius: '50%', overflow: 'hidden', background: 'var(--azul)', display: 'grid', placeItems: 'center', flex: 'none', border: '2px solid var(--ouro)' } },
      p.foto ? h('img', { src: p.foto, alt: 'Sua foto', style: { width: '100%', height: '100%', objectFit: 'cover' } }) : h('span', { style: { font: '700 30px var(--f-display)', color: '#E9D3A1' } }, (p.nome || 'A').charAt(0).toUpperCase()));
    var arq = h('input#foto-perfil', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    arq.addEventListener('change', function () { if (arq.files[0]) trocarFoto(arq.files[0]); });
    tela.appendChild(h('section.cartao', { style: { display: 'flex', gap: '14px', alignItems: 'center' } }, foto,
      h('div', { style: { flex: 1, minWidth: 0, display: 'grid', gap: '6px' } },
        h('b', { style: { font: '700 24px var(--f-display)', color: 'var(--azul-texto)' } }, p.nome || 'Sem nome'),
        h('div.linha-bts', h('button.bt.peq', { on: { click: async function () { var n = await UI.perguntar('Seu nome', 'Nome', p.nome, { max: 40 }); if (n != null) { Dados.salvar('perfil', 'eu', Object.assign({}, App.perfil(), { nome: n })); App.recarregar(); } } } }, ico('editar'), 'Nome'),
          h('label.bt.peq', { for: 'foto-perfil' }, ico('imagem'), 'Foto'), arq,
          p.foto ? h('button.bt.peq.fant', { on: { click: function () { var q = App.perfil(); delete q.foto; Dados.salvar('perfil', 'eu', q); App.recarregar(); } } }, 'Remover foto') : null))));

    // números
    var ativos = Dados.todos('planos');
    tela.appendChild(h('div.numeros', { style: { marginTop: '10px' } },
      num(lidos + '', 'capítulos lidos de 1.189 (' + UI.pct(lidos / 1189 * 100) + ')'),
      num(sequencia() + '', 'dias seguidos com leitura'),
      num(Dados.todos('favoritos').length + '', 'versículos favoritos'),
      num(Dados.todos('artes').length + '', 'artes criadas')));
    tela.appendChild(h('div.barra', { style: { marginTop: '10px', height: '8px' }, role: 'progressbar', 'aria-label': 'Progresso na Bíblia', 'aria-valuenow': lidos, 'aria-valuemax': 1189 }, h('i', { style: { width: (lidos / 1189 * 100) + '%' } })));

    // atalhos pessoais
    tela.appendChild(h('div.secao', h('h2', 'Minha caminhada')));
    tela.appendChild(h('div.lista',
      linha('planos', 'Planos de leitura', ativos.length ? ativos.map(function (x) { var d = A2Planos.DEFINICOES.filter(function (y) { return y.id === x.planoId; })[0]; return d ? d.nome + ' (' + UI.pct(A2Planos.resumo(x, d.dias, UI.hoje()).percentual) + ')' : ''; }).join(' · ') : 'Nenhum plano ativo', function () { App.estado.secaoBiblioteca = 'planos'; App.ir('biblioteca'); }),
      linha('coracao', 'Versículos favoritos', Dados.todos('favoritos').length + ' salvos', function () { App.estado.secaoBiblioteca = 'favoritos'; App.ir('biblioteca'); }),
      linha('luz', 'Devocionais favoritos', Dados.todos('devSalvos').length + ' salvos', function () { App.estado.secaoBiblioteca = 'devocionais'; App.estado.abaDevo = 'salvos'; App.ir('biblioteca'); }),
      linha('pincel', 'Artes criadas', Dados.todos('artes').length + ' artes', function () { App.estado.secaoCriar = 'minhas'; App.ir('criar'); }),
      linha('historico', 'Histórico de leitura', 'Leituras, devocionais e pesquisas', function () { App.estado.secaoBiblioteca = 'historico'; App.ir('biblioteca'); })));

    // preferências
    tela.appendChild(h('div.secao', h('h2', 'Preferências')));
    var trad = h('select.entrada#pref-trad', Biblia.VERSOES.map(function (v) { var o = h('option', { value: v.id, disabled: !v.ativa }, v.nome + ' (' + v.sigla + ')' + (v.ativa ? '' : ' — licença pendente')); if (v.id === cfg.traducao) o.selected = true; return o; }));
    trad.addEventListener('change', function () { App.salvarConfig({ traducao: trad.value }); });
    var tema = h('select.entrada#pref-tema', [['sistema', 'Automático (do aparelho)'], ['claro', 'Claro'], ['escuro', 'Noturno']].map(function (t) { var o = h('option', { value: t[0] }, t[1]); if (t[0] === cfg.tema) o.selected = true; return o; }));
    tema.addEventListener('change', function () { App.salvarConfig({ tema: tema.value }); });
    var tam = h('input#pref-tam', { type: 'range', min: 15, max: 28, value: cfg.fonteTam }), tamV = h('b', cfg.fonteTam + ' px');
    tam.addEventListener('input', function () { tamV.textContent = tam.value + ' px'; }); tam.addEventListener('change', function () { App.salvarConfig({ fonteTam: +tam.value }); });
    tela.appendChild(h('section.cartao.form',
      h('label.campo', { for: 'pref-trad' }, h('span', 'Tradução preferida'), trad),
      h('label.campo', { for: 'pref-tema' }, h('span', 'Aparência'), tema),
      h('label.campo', { for: 'pref-tam' }, h('span', 'Tamanho do texto bíblico'), h('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } }, tam, tamV))));

    // notificações
    tela.appendChild(h('div.secao', h('h2', 'Notificações')));
    var notif = h('section.cartao');
    [['versiculo', 'Versículo do dia'], ['devocional', 'Devocional diário'], ['leitura', 'Lembrete de leitura'], ['plano', 'Plano de leitura'], ['estudos', 'Continuação de estudos']].forEach(function (n) {
      var c = cfg.notif[n[0]], on = h('input.interruptor#nt-' + n[0], { type: 'checkbox' }), hr = h('input.entrada#nh-' + n[0], { type: 'time', value: c.hora, 'aria-label': 'Horário: ' + n[1] });
      on.checked = c.on; hr.disabled = !c.on;
      function salvar() { var x = App.config().notif; x[n[0]] = { on: on.checked, hora: hr.value || c.hora }; hr.disabled = !on.checked; App.salvarConfig({ notif: x }); }
      on.addEventListener('change', salvar); hr.addEventListener('change', salvar);
      notif.appendChild(h('div.chave', h('label', { for: 'nt-' + n[0] }, n[1]), h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } }, hr, on)));
    });
    var permissao = h('div', { style: { marginTop: '10px' } });
    function estadoPermissao() {
      var suporta = 'Notification' in window, perm = suporta ? Notification.permission : 'indisponivel';
      UI.trocar(permissao, h('p.sub', 'Os lembretes aparecem no Início e no sino quando chega o horário. ' +
        (perm === 'granted' ? 'Notificações do navegador ativadas neste aparelho.' : perm === 'denied' ? 'O navegador bloqueou notificações para este app.' : perm === 'indisponivel' ? 'Este ambiente não permite notificações do sistema; na versão instalada no celular elas funcionam.' : '')),
        suporta && perm === 'default' ? h('button.bt.peq', { style: { marginTop: '8px' }, on: { click: function () { try { Notification.requestPermission().then(estadoPermissao, function () { UI.aviso('Este ambiente não permite notificações do sistema.', true); }); } catch (e) { UI.aviso('Este ambiente não permite notificações do sistema.', true); } } } }, ico('sino'), 'Permitir notificações do navegador') : null);
    }
    estadoPermissao(); notif.appendChild(permissao);
    tela.appendChild(notif);

    // dados e sincronização
    tela.appendChild(h('div.secao', h('h2', 'Dados e sincronização')));
    var sinc = h('section.cartao.form');
    function desenharSinc() {
      var modo = { sincronizado: ['ok', 'Sincronizado com sua conta'], conectando: ['', 'Conectando…'], offline: ['alerta', 'Sem conexão: salvando neste aparelho'], local: ['', 'Salvando neste aparelho'], memoria: ['alerta', 'Armazenamento do navegador indisponível: os dados podem se perder ao fechar'], iniciando: ['', 'Iniciando…'] }[est.modo] || ['', est.modo];
      UI.trocar(sinc,
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' } }, h('span.selo' + (modo[0] ? '.' + modo[0] : ''), modo[1]), est.pendentes ? h('span.selo', est.pendentes + ' alteração(ões) a enviar') : null),
        est.erro ? h('p.sub', { style: { color: 'var(--perigo)' } }, est.erro) : null,
        h('p.sub', est.modo === 'sincronizado' ? 'Seus favoritos, notas, planos e artes acompanham você em qualquer aparelho onde abrir este app com a mesma conta.' : 'Tudo é salvo primeiro no aparelho e enviado quando houver conexão.'),
        h('div.linha-bts', h('button.bt.peq', { on: { click: baixarBiblia } }, ico('baixar'), 'Guardar a Bíblia para usar sem internet'),
          h('button.bt.peq', { on: { click: exportar } }, ico('copiar'), 'Exportar meus dados'),
          h('button.bt.peq.perigo', { on: { click: async function () { if (await UI.confirmar('Apagar dados deste aparelho', est.modo === 'sincronizado' ? 'A cópia local será apagada; seus dados continuam na sua conta e voltam ao recarregar.' : 'Os dados que só existem neste aparelho serão perdidos.', 'Apagar', true)) { await Dados.apagarAparelho(); UI.aviso('Dados locais apagados.'); } } } }, ico('lixo'), 'Apagar dados deste aparelho')));
      Biblia.baixadosOffline().then(function (n) { sinc.appendChild(h('p.sub', (n >= 66 ? 'Bíblia completa' : n + ' de 66 livros') + ' (' + Biblia.versao(Biblia.padrao()).sigla + ') guardad' + (n >= 66 ? 'a' : 'os') + ' neste aparelho.')); });
    }
    desenharSinc();
    App.aoMudar(function (c) { if (c === '_estado') desenharSinc(); });
    tela.appendChild(sinc);

    // conta
    tela.appendChild(h('div.secao', h('h2', 'Conta')));
    var contaEl = h('section.cartao.form');
    function desenharConta() {
      var c = est.conta;
      if (est.tipo === 'claude') { UI.trocar(contaEl, h('p', est.usuario ? 'Você está identificado pela sua conta do claude.ai nesta versão de prévia.' : 'Nesta visualização não há conta conectada: os dados ficam só neste aparelho.')); return; }
      if (!(root.A2Nuvem && A2Nuvem.configurado())) { UI.trocar(contaEl, h('p', 'Os dados ficam só neste aparelho.')); return; }
      if (c) {
        UI.trocar(contaEl,
          h('p', 'Conectado como ', h('b', c.email), c.papel !== 'leitor' ? h('span.selo.ouro', { style: { marginLeft: '6px' } }, c.papel === 'administrador' ? 'Administração' : 'Edição') : null),
          h('p.sub', 'Favoritos, notas, planos, estudos e artes ficam guardados na sua conta e aparecem em qualquer aparelho em que você entrar.'),
          h('div.linha-bts', h('button.bt.peq', { on: { click: function () { Telas.perfil.novaSenha(); } } }, ico('escudo'), 'Trocar senha'),
            h('button.bt.peq', { on: { click: sair } }, 'Sair da conta')));
      } else {
        UI.trocar(contaEl,
          h('p', 'Crie uma conta gratuita para guardar seus favoritos, notas, planos e artes e usar em qualquer aparelho.'),
          h('p.sub', 'Sem conta, tudo continua funcionando e fica salvo só neste aparelho.'),
          h('div.linha-bts', h('button.bt.pri', { on: { click: function () { abrirConta('cadastro'); } } }, 'Criar conta'), h('button.bt', { on: { click: function () { abrirConta('entrar'); } } }, 'Entrar')));
      }
    }
    async function sair() {
      var apagar = await UI.confirmar('Sair da conta', 'Seus dados continuam guardados na conta. Deseja também apagar a cópia deste aparelho? (Recomendado em aparelho compartilhado.)', 'Sair e apagar deste aparelho', true);
      try { await A2Nuvem.Conta.sair(); if (apagar) await Dados.apagarAparelho(); UI.aviso('Você saiu da conta.'); } catch (e) { UI.aviso(e.message, true); }
    }
    desenharConta();
    App.aoMudar(function (c) { if (c === '_estado') desenharConta(); });
    tela.appendChild(contaEl);

    // editorial
    if (est.dono || est.podeEditar) {
      tela.appendChild(h('div.secao', h('h2', 'Edição de conteúdo')));
      tela.appendChild(h('div.lista',
        linha('luz', 'Devocionais', 'Revisar rascunhos e publicar', function () { App.estado.secaoBiblioteca = 'devocionais'; App.estado.abaDevo = 'edicao'; App.ir('biblioteca'); }),
        linha('sol', 'Reflexão do versículo de hoje', 'Escrever ou revisar', function () { Telas.devocionais.editarReflexao(UI.hoje(), A2Conteudo.versiculoDoDia(UI.hoje())); })));
    }

    // sobre
    tela.appendChild(h('div.secao', h('h2', 'Sobre e licenças')));
    var sobre = h('section.cartao.form', h('div.marca-peq', { html: UI.logo(40) + '<b>ATOS 2</b>' }), h('p', { style: { font: 'italic 500 18px var(--f-display)' } }, 'De volta à doutrina dos apóstolos.'),
      h('p.sub', 'O ATOS 2 não pertence a nenhuma denominação. As Escrituras vêm sempre das traduções, sem alterações; conteúdos com apoio de inteligência artificial são identificados e revisados antes de publicar.'));
    var creditos = h('div.lista');
    sobre.appendChild(creditos);
    Biblia.licenciadas().then(function (vs) {
      vs.forEach(function (v) {
        creditos.appendChild(h('div.item', { style: { alignItems: 'flex-start' } }, ico('livro'), h('div.corpo',
          h('span.titulo', v.nome + ' (' + v.sigla + ')'),
          h('span.meta', { style: { whiteSpace: 'normal' } }, v.credito),
          v.alteracoes ? h('span.meta', { style: { whiteSpace: 'normal' } }, v.alteracoes) : null)));
      });
    }, function () {});
    sobre.appendChild(h('div.aviso', ico('imagem'), h('span', A2Fotos.CREDITO)));
    sobre.appendChild(h('div.aviso', ico('texto'), h('span', A2Originais.CREDITO)));
    sobre.appendChild(h('div.aviso', ico('escudo'), h('span', 'As 95 Teses, as fichas dos livros, as explicações de palavras e os temas de doutrina são redação do ATOS 2. Confira tudo nas Escrituras.')));
    sobre.appendChild(h('div.rotulo', 'Aguardando licença'));
    sobre.appendChild(h('div.lista', Biblia.VERSOES.filter(function (v) { return !v.ativa; }).map(function (v) { return h('div.item', h('div.corpo', h('span.titulo', v.nome + ' (' + v.sigla + ')'), h('span.meta', v.situacao))); })));
    tela.appendChild(sobre);
  }
  function num(v, r) { return h('div.numero', h('b', v), h('small', r)); }
  function linha(i, t, s, fn) { return h('button.item', { on: { click: fn } }, ico(i), h('div.corpo', h('span.titulo', t), h('span.meta', s)), ico('direita')); }

  async function trocarFoto(arq) {
    try {
      var img = await new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = URL.createObjectURL(arq); });
      var lado = 256, c = h('canvas', { width: lado, height: lado }), s = Math.max(lado / img.width, lado / img.height);
      c.getContext('2d').drawImage(img, (lado - img.width * s) / 2, (lado - img.height * s) / 2, img.width * s, img.height * s);
      Dados.salvar('perfil', 'eu', Object.assign({}, App.perfil(), { foto: c.toDataURL('image/jpeg', 0.82) }));
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
      return h('form.form', { on: { submit: enviar } },
        modo === 'cadastro' ? h('label.campo', { for: 'conta-nome' }, h('span', 'Nome'), nome) : null,
        h('label.campo', { for: 'conta-email' }, h('span', 'E-mail'), email),
        modo !== 'recuperar' ? h('label.campo', { for: 'conta-senha' }, h('span', 'Senha' + (modo === 'cadastro' ? ' (mínimo 8 caracteres, com letras e números)' : '')), senha) : null,
        msg, h('div.linha-bts', bt),
        modo === 'entrar' ? h('div.linha-bts', h('button.bt.peq', { type: 'button', on: { click: function () { api.fechar(); abrirConta('recuperar'); } } }, 'Esqueci minha senha'), h('button.bt.peq', { type: 'button', on: { click: function () { api.fechar(); abrirConta('cadastro'); } } }, 'Criar conta')) : null,
        modo === 'cadastro' ? h('p.sub', 'Usamos seu e-mail só para entrar e recuperar a senha. Seus dados são privados: só você vê.') : null);
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

  root.Telas.perfil = { render: render, abrirConta: abrirConta, novaSenha: novaSenha };
})(window);
