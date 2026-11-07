/* ATOS 2 — núcleo do aplicativo: navegação, abertura, boas-vindas, configurações, histórico e lembretes. */
(function (root) {
  'use strict';
  var h = UI.h;
  var VERSAO_APP = '2.8.0';
  var ABAS = ['inicio', 'biblia', 'livros', 'criar', 'biblioteca', 'perfil', 'assistente', 'quiz', 'mural', 'jornada', 'obra'];
  var Telas = root.Telas = root.Telas || {};
  var limpezas = [];

  var CONFIG_PADRAO = {
    tema: 'sistema', fonteTam: 19, fonteLeitura: 'leitura', traducao: 'blivre', boasVindas: false,
    notif: {
      versiculo: { on: true, hora: '07:00' }, devocional: { on: true, hora: '07:30' }, leitura: { on: false, hora: '20:00' },
      plano: { on: true, hora: '19:00' }, estudos: { on: false, hora: '21:00' }
    },
    audio: { velocidade: 1 }
  };

  var App = root.App = Object.assign(root.App || {}, {
    versao: VERSAO_APP,
    estado: { aba: 'inicio', leitor: null, plano: null },
    config: function () {
      var c = Dados.obter('config', 'eu') || {};
      var out = Object.assign({}, CONFIG_PADRAO, c);
      out.notif = Object.assign({}, CONFIG_PADRAO.notif, c.notif || {});
      Object.keys(CONFIG_PADRAO.notif).forEach(function (k) { out.notif[k] = Object.assign({}, CONFIG_PADRAO.notif[k], (c.notif || {})[k] || {}); });
      out.audio = Object.assign({}, CONFIG_PADRAO.audio, c.audio || {});
      return out;
    },
    salvarConfig: function (patch) {
      var atual = Dados.obter('config', 'eu') || {};
      Dados.salvar('config', 'eu', Object.assign({}, atual, patch));
      aplicarAparencia();
    },
    perfil: function () { return Object.assign({ nome: '' }, Dados.obter('perfil', 'eu') || {}); },
    // Registra no histórico (um documento por mês, até 1000 itens)
    registrar: function (tipo, dados) {
      var mes = UI.hoje().slice(0, 7), doc = Dados.obter('historico', mes) || { itens: [] };
      var itens = (doc.itens || []).slice(-999);
      var ult = itens[itens.length - 1];
      var novo = Object.assign({ tipo: tipo, em: new Date().toISOString() }, dados || {});
      if (ult && ult.tipo === tipo && ult.ref === novo.ref && ult.titulo === novo.titulo && Date.parse(novo.em) - Date.parse(ult.em) < 10 * 60000) return;
      itens.push(novo);
      Dados.salvar('historico', mes, { itens: itens });
    },
    // Remove itens do histórico (ex.: conclusões de um capítulo que foi desmarcado)
    removerDoHistorico: function (filtro) {
      Dados.todos('historico').forEach(function (m) {
        var itens = m.itens || [], resto = itens.filter(function (x) { return !filtro(x); });
        if (resto.length !== itens.length) Dados.salvar('historico', m.id, { itens: resto });
      });
    },
    // Abre a Bíblia em uma referência; contexto opcional de plano de leitura
    abrirBiblia: function (livro, cap, v, contexto) {
      App.estado.leitor = { livro: livro, cap: cap, alvo: v || null };
      App.estado.plano = contexto || null;
      if (location.hash !== '#biblia') location.hash = 'biblia'; else mostrar();
    },
    aoMudar: function (fn) { var off = Dados.ouvir(fn); limpezas.push(off); return off; },
    aoSair: function (fn) { limpezas.push(fn); },
    recarregar: function () { mostrar(); },
    // Atualiza a tela atual após mudança de dados, sem fechar folhas abertas nem perder a rolagem
    atualizar: function () {
      if (UI.temFolha()) { pendenteAtualizar = true; return; }
      var y = window.scrollY; mostrar(true); window.scrollTo(0, y);
    },
    ir: function (aba) { if (location.hash !== '#' + aba) location.hash = aba; else mostrar(); }
  });

  function aplicarAparencia() {
    var c = App.config(), r = document.documentElement;
    if (c.tema === 'claro') r.setAttribute('data-tema', 'claro');
    else if (c.tema === 'escuro') r.setAttribute('data-tema', 'escuro');
    else r.removeAttribute('data-tema');
    r.style.setProperty('--tam-leitura', c.fonteTam + 'px');
  }
  App.aplicarAparencia = aplicarAparencia;
  // Botão de acesso rápido ao modo noturno (lua/sol): alterna entre claro e noturno a partir do que está na tela
  function temaEscuroAtivo() {
    var t = document.documentElement.getAttribute('data-tema');
    if (t) return t === 'escuro';
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  App.botaoTema = function () {
    var bt = UI.h('button.bt-ico.bt-tema', { type: 'button' });
    function desenhar() {
      var escuro = temaEscuroAtivo();
      bt.setAttribute('aria-pressed', String(escuro));
      bt.setAttribute('aria-label', escuro ? 'Desativar modo noturno' : 'Ativar modo noturno');
      bt.title = escuro ? 'Modo claro' : 'Modo noturno';
      bt.replaceChildren(UI.icone(escuro ? 'sol' : 'lua'));
    }
    bt.addEventListener('click', function () {
      var escuro = !temaEscuroAtivo();
      App.salvarConfig({ tema: escuro ? 'escuro' : 'claro' });
      desenhar();
      UI.aviso(escuro ? 'Modo noturno ativado.' : 'Modo claro ativado.');
    });
    desenhar();
    return bt;
  };

  // ---------------------------------------------------------------- navegação
  function abaAtual() { var a = location.hash.replace('#', '').split('/')[0]; return ABAS.indexOf(a) >= 0 ? a : 'inicio'; }
  var pendenteAtualizar = false;
  window.addEventListener('folhas-fechadas', function () { if (pendenteAtualizar) { pendenteAtualizar = false; App.atualizar(); } });
  function mostrar(manterFoco) {
    limpezas.splice(0).forEach(function (f) { try { f(); } catch (e) {} });
    UI.fecharTodas(); pendenteAtualizar = false;
    var aba = abaAtual(), tela = document.getElementById('tela');
    App.estado.aba = aba;
    var abaNav = aba === 'obra' ? 'biblioteca' : aba === 'livros' ? 'biblia' : aba;   // o leitor de livros pertence à Biblioteca; a seleção de livros, à Bíblia
    document.querySelectorAll('.abas a').forEach(function (a) { if (a.dataset.aba === abaNav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    tela.replaceChildren();
    try { Telas[aba].render(tela); }
    catch (e) { console.error(e); tela.appendChild(h('div.vazio', h('b', 'Algo deu errado ao abrir esta tela.'), h('span', String(e.message || e)), h('button.bt', { on: { click: mostrar } }, 'Tentar de novo'))); }
    if (manterFoco !== true) { tela.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  }
  window.addEventListener('hashchange', function () { mostrar(); });

  // Teclado aberto (celular): esconde a barra flutuante para não cobrir campos
  function verificarTeclado() {
    var vv = window.visualViewport, el = document.activeElement;
    var campo = el && (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && !/^(checkbox|radio|range|button|submit|color|file)$/.test(el.type)));
    var toque = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var reduzido = vv ? window.innerHeight - vv.height > 140 : false;
    document.body.classList.toggle('teclado', !!(reduzido || (campo && toque)));
  }
  document.addEventListener('focusin', verificarTeclado);
  document.addEventListener('focusout', function () { setTimeout(verificarTeclado, 120); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', verificarTeclado);

  // ---------------------------------------------------------------- boas-vindas
  function boasVindas() {
    return new Promise(function (fim) {
      var passos = [
        { ico: UI.logo(120), t: 'ATOS 2', p: '“E perseveravam na doutrina dos apóstolos, na comunhão, no partir do pão, e nas orações.” Atos 2:42 (BLIVRE)' },
        { icoNome: 'livro', t: 'A Bíblia completa', p: 'Leia, destaque, anote e pesquise as Escrituras. Use sem internet depois de baixar.' },
        { icoNome: 'planos', t: 'Planos e devocionais', p: 'Siga planos de leitura no seu ritmo e receba um devocional por dia.' },
        { icoNome: 'pincel', t: 'Artes com a Palavra', p: 'Crie imagens com versículos para compartilhar. O texto bíblico é sempre o da tradução escolhida, sem alterações.' }
      ];
      var i = 0, nome = h('input.entrada#bv-nome', { type: 'text', placeholder: 'Como podemos chamar você?', maxlength: 40, autocomplete: 'given-name' });
      var raiz = h('div.onboarding', { role: 'dialog', 'aria-label': 'Boas-vindas' });
      // entrar com o Google já nas boas-vindas (só aparece com o provedor ativo no Supabase)
      var googleMsg = h('small.bv-google-msg', { role: 'status' });
      var google = h('div.bv-google', { hidden: true },
        h('button.bt.bv-google-bt#bv-google', { on: { click: async function (ev) {
          var bt = ev.currentTarget; bt.disabled = true; googleMsg.textContent = 'Abrindo o Google…';
          if (nome.value.trim()) Dados.salvar('perfil', 'eu', Object.assign({}, App.perfil(), { nome: nome.value.trim() }));
          App.salvarConfig({ boasVindas: true });
          try { await A2Nuvem.Conta.entrarComGoogle(); } catch (e) { bt.disabled = false; googleMsg.textContent = A2Nuvem.mensagem(e); }
        } } }, h('span.conta-google-g', { 'aria-hidden': 'true' }, 'G'), 'Continuar com o Google'),
        h('small', 'Seus favoritos, planos e pontos ficam guardados na sua conta, em qualquer aparelho.'), googleMsg);
      if (root.A2Nuvem && A2Nuvem.configurado() && A2Nuvem.Conta && A2Nuvem.Conta.provedores && !/claude|claudeusercontent/.test(location.hostname))
        A2Nuvem.Conta.provedores().then(function (p) { if (p.google) { google.hidden = false; if (i === passos.length - 1) desenhar(); } });
      function desenhar() {
        var s = passos[i], ult = i === passos.length - 1;
        raiz.replaceChildren(
          h('div.slide',
            s.ico ? h('div', { html: s.ico }) : h('div', { html: UI.icone(s.icoNome).innerHTML.replace('<svg', '<svg class="grande"') }),
            h('h2', s.t), h('p', s.p),
            ult ? google : null,
            ult ? h('label.campo', { for: 'bv-nome', style: { width: '100%', textAlign: 'left' } }, h('span', { style: { color: '#E2C894' } }, google.hidden ? 'Seu nome (opcional)' : 'Ou só o seu nome (opcional)'), nome) : null),
          h('div', h('div.pontos', passos.map(function (_, k) { return h('i' + (k === i ? '.on' : '')); })),
            h('div.linha-bts', { style: { justifyContent: 'center' } },
              i > 0 ? h('button.bt', { on: { click: function () { i--; desenhar(); } } }, 'Voltar') : h('button.bt', { on: { click: concluir } }, 'Pular'),
              h('button.bt.ouro', { on: { click: function () { if (ult) concluir(); else { i++; desenhar(); } } } }, ult ? 'Começar' : 'Continuar'))));
      }
      function concluir() {
        if (nome.value.trim()) Dados.salvar('perfil', 'eu', Object.assign({}, App.perfil(), { nome: nome.value.trim() }));
        App.salvarConfig({ boasVindas: true });
        raiz.remove(); fim();
      }
      document.body.appendChild(raiz); desenhar();
    });
  }

  // ---------------------------------------------------------------- lembretes dentro do app
  App.lembretesPendentes = function () {
    var c = App.config(), agora = UI.agoraHora(), hoje = UI.hoje(), out = [];
    var vistos = (Dados.obter('vdia', 'vistos') || {}).datas || {};
    if (c.notif.versiculo.on && agora >= c.notif.versiculo.hora && !vistos[hoje]) out.push({ tipo: 'versiculo', texto: 'O versículo do dia está esperando por você.', ir: 'inicio' });
    var devHoje = Telas.devocionais && Telas.devocionais.doDia && Telas.devocionais.doDia();
    if (c.notif.devocional.on && agora >= c.notif.devocional.hora && devHoje && !Dados.obter('devLidos', devHoje.id)) out.push({ tipo: 'devocional', texto: 'Devocional de hoje: ' + devHoje.titulo, ir: 'devocional', id: devHoje.id });
    var ativos = Dados.todos('planos').filter(function (p) { return p.status === 'ativo'; });
    if (c.notif.plano.on) ativos.forEach(function (p) {
      var def = A2Planos.DEFINICOES.filter(function (d) { return d.id === p.planoId; })[0];
      var hr = p.lembrete || c.notif.plano.hora;
      if (def && agora >= hr && !A2Planos.resumo(p, def.dias, hoje).lidoHoje) out.push({ tipo: 'plano', texto: def.nome + ': leitura de hoje pendente.', ir: 'plano', id: def.id });
    });
    var leu = ((Dados.obter('historico', hoje.slice(0, 7)) || {}).itens || []).some(function (x) { return x.tipo === 'leitura' && x.em.slice(0, 10) === hoje; });
    if (c.notif.leitura.on && agora >= c.notif.leitura.hora && !leu) out.push({ tipo: 'leitura', texto: 'Que tal um capítulo hoje?', ir: 'biblia' });
    if (c.notif.estudos.on && agora >= c.notif.estudos.hora && Dados.todos('estudos').length) out.push({ tipo: 'estudos', texto: 'Continue seus estudos.', ir: 'estudos' });
    return out;
  };
  App.abrirLembrete = function (l) {
    if (l.ir === 'devocional') { location.hash = 'biblioteca'; setTimeout(function () { Telas.devocionais.abrir(l.id); }, 60); }
    else if (l.ir === 'plano') { location.hash = 'biblioteca'; setTimeout(function () { Telas.planos.abrir(l.id); }, 60); }
    else if (l.ir === 'estudos') { App.estado.secaoBiblioteca = 'estudos'; App.ir('biblioteca'); }
    else App.ir(l.ir);
  };
  // Notificação do navegador, quando o ambiente permitir (texto genérico)
  var notificados = {};
  function verificarNotificacoes() {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      App.lembretesPendentes().forEach(function (l) {
        var k = UI.hoje() + l.tipo + (l.id || '');
        if (notificados[k]) return; notificados[k] = 1;
        new Notification('ATOS 2', { body: l.texto, icon: 'icones/icone-192.png', tag: k });
      });
    } catch (e) { /* ambiente sem notificações */ }
  }

  // ---------------------------------------------------------------- nome e foto da conta Google
  // Na primeira vez que a pessoa entra com o Google (em qualquer aparelho), o perfil do app recebe o nome e a foto
  // da conta. Se depois ela mudar nome ou foto em Editar perfil, a escolha dela prevalece.
  function fotoComoDados(url) {
    return new Promise(function (res) {
      var img = new Image(), fim = setTimeout(function () { res(null); }, 8000);
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        clearTimeout(fim);
        try {
          var lado = 256, c = document.createElement('canvas'); c.width = c.height = lado;
          var k = Math.max(lado / img.width, lado / img.height);
          c.getContext('2d').drawImage(img, (lado - img.width * k) / 2, (lado - img.height * k) / 2, img.width * k, img.height * k);
          res(c.toDataURL('image/jpeg', 0.85));
        } catch (e) { res(null); }
      };
      img.onerror = function () { clearTimeout(fim); res(null); };
      img.src = /googleusercontent\.com/.test(url) ? url.replace(/=s\d+(-c)?$/, '=s256-c') : url;
    });
  }
  var aplicandoGoogle = false;
  App.perfilDoGoogle = async function () {
    if (aplicandoGoogle || !(root.A2Nuvem && A2Nuvem.configurado() && Dados.estado.tipo === 'nuvem')) return false;
    var c = A2Nuvem.conta();
    if (!c || c.provedores.indexOf('google') < 0 || !(c.nomeGoogle || c.fotoGoogle)) return false;
    var p = App.perfil();
    if (p.googleDe === c.id) return false;
    aplicandoGoogle = true;
    try {
      var novo = Object.assign({}, p, { googleDe: c.id });
      if (c.nomeGoogle && !p.nomeManual) novo.nome = c.nomeGoogle.trim().slice(0, 40);
      if (c.fotoGoogle && !p.fotoManual) { var f = await fotoComoDados(c.fotoGoogle); novo.foto = f || c.fotoGoogle; }
      Dados.salvar('perfil', 'eu', novo);
      if (!UI.temFolha()) App.recarregar();
      return true;
    } finally { aplicandoGoogle = false; }
  };

  // ---------------------------------------------------------------- partida
  async function iniciar() {
    document.querySelector('#abertura .abertura-marca').innerHTML = UI.logo(132);
    UI.preencherIcones();
    var t0 = Date.now();
    await Dados.iniciar();
    aplicarAparencia();
    try { await Biblia.indice('blivre'); if (Biblia.padrao() !== 'blivre') await Biblia.indice(Biblia.padrao()); } catch (e) { UI.aviso(e.message, true); }
    Dados.ouvir(function (c) {
      if (c === 'config') aplicarAparencia();
      if (c === '_estado' && Dados.estado.recuperarSenha && !UI.temFolha()) { Dados.estado.recuperarSenha = false; Telas.perfil.novaSenha(); }
    });
    await new Promise(function (r) { setTimeout(r, Math.max(0, 900 - (Date.now() - t0))); });
    document.getElementById('app').hidden = false;
    var ab = document.getElementById('abertura'); ab.classList.add('sai'); setTimeout(function () { ab.remove(); }, 600);
    if (!App.config().boasVindas) await boasVindas();
    mostrar();
    if (root.A2Nuvem && A2Nuvem.configurado()) {
      // espera a conta sincronizar o perfil antes de conferir se já recebeu os dados do Google
      setTimeout(function () { App.perfilDoGoogle(); }, 2500);
      A2Nuvem.ouvirConta(function (evento) { if (evento === 'SIGNED_IN' || evento === 'USER_UPDATED') setTimeout(function () { App.perfilDoGoogle(); }, 2500); });
    }
    setInterval(verificarNotificacoes, 60000); verificarNotificacoes();
    // versão instalada (GitHub Pages): guarda os arquivos do app para abrir sem internet
    try { if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude|claudeusercontent/.test(location.hostname)) navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) { reg.update(); });
      // quando uma versão nova do app assume, recarrega uma vez para já usar os arquivos novos
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        var recarregou = false;
        navigator.serviceWorker.addEventListener('controllerchange', function () { if (recarregou || UI.temFolha()) return; recarregou = true; location.reload(); });
      }
    } catch (e) {}
  }
  iniciar();
})(window);
