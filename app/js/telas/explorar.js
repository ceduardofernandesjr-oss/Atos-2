/* ATOS 2 — Explorar: assistente bíblico com IA, quiz bíblico e mural de curiosidades (95 Teses). */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;
  var Telas = root.Telas;

  function cabecalho(titulo, selo) {
    return h('header.cab', h('button.bt-ico', { 'aria-label': 'Voltar ao início', on: { click: function () { App.ir('inicio'); } } }, ico('esquerda')),
      h('h1', titulo), selo || null, h('div.esp'));
  }
  function sigla() { return Biblia.versao(Biblia.padrao()).sigla; }
  function refCurta(r) { return A2Ref.formatar(r, true); }
  function linkRef(r, rotulo) {
    return h('button.link-ref', { on: { click: function () { App.abrirBiblia(r.livro, r.cap, r.v1); } } }, rotulo || A2Ref.formatar(r));
  }
  // Texto com referências “Livro cap:vers” clicáveis
  function textoComRefs(s) {
    var frag = document.createDocumentFragment(), pos = 0;
    A2Assistente.referenciasNoTexto(s, function (x) { return Biblia.interpretar(x); }).forEach(function (m) {
      if (m.inicio < pos) return;
      frag.appendChild(document.createTextNode(s.slice(pos, m.inicio)));
      frag.appendChild(linkRef(m.ref, s.slice(m.inicio, m.fim)));
      pos = m.fim;
    });
    frag.appendChild(document.createTextNode(s.slice(pos)));
    return frag;
  }
  async function versosEl(r, max) {
    var vs = await Biblia.textoDe(r), el = h('p.trecho');
    vs.slice(0, max || 40).forEach(function (x, i) {
      if (i) el.appendChild(document.createTextNode(' '));
      el.appendChild(h('sup', x.v)); el.appendChild(UI.textoComItalico(x.t));
    });
    if (max && vs.length > max) el.appendChild(h('span.sub', ' … (' + (vs.length - max) + ' versículos a mais na Bíblia)'));
    return el;
  }
  async function obterSample() {
    try { return root.claude && root.claude.use ? await root.claude.use('sample') : null; } catch (e) { return null; }
  }
  function erroIA(e) {
    if (e && e.code === 'rate_limited') return 'Muitos pedidos seguidos. Aguarde um pouco e tente de novo.';
    if (e && e.code === 'not_granted') return 'O uso da IA não foi autorizado nesta visualização.';
    return (e && e.message) || 'Não foi possível concluir agora. Tente de novo.';
  }
  function hash(s) { var x = 2166136261; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); }

  // ====================================================================== ASSISTENTE
  var livrosCache = {};
  async function livrosDe(v) { return livrosCache[v] || (livrosCache[v] = await Biblia.todosOsLivros(v)); }

  // Ferramentas que a IA usa para ler a Bíblia dentro do app (o texto vem sempre da tradução)
  function ferramentas(status) {
    var v = Biblia.padrao();
    return [
      { name: 'ler_passagem', description: 'Lê o texto bíblico de uma referência na tradução do usuário (ex.: "Jo 3:1-21", "Rm 8", "Sl 23:1"). Use para a passagem e para o capítulo inteiro.',
        inputSchema: { type: 'object', properties: { referencia: { type: 'string' } }, required: ['referencia'] },
        execute: async function (i) {
          var r = Biblia.interpretar(String(i.referencia || ''));
          if (!r.ok) throw new Error('Referência inválida: ' + r.erro);
          status('Lendo ' + A2Ref.formatar(r.ref) + '…');
          var vs = await Biblia.textoDe(r.ref, v);
          return { referencia: A2Ref.formatar(r.ref), traducao: sigla(), versiculos: vs.slice(0, 90).map(function (x) { return x.cap + ':' + x.v + ' ' + UI.plano(x.t); }).join('\n'), cortado: vs.length > 90 };
        } },
      { name: 'introducao_livro', description: 'Ficha curada do livro bíblico (autoria, época, tema), redigida pela equipe do app com cautela onde há debate.',
        inputSchema: { type: 'object', properties: { livro: { type: 'string', description: 'Nome ou abreviação do livro, ex.: "Romanos", "1 Co"' } }, required: ['livro'] },
        execute: async function (i) {
          var l = A2Ref.lerLivro(String(i.livro || '') + ' 1');
          if (!l) throw new Error('Livro não reconhecido.');
          status('Consultando a ficha de ' + A2Ref.POR_ID[l.id].nome + '…');
          return Object.assign({ nome: A2Ref.POR_ID[l.id].nome }, A2Assistente.INTRODUCOES[l.id]);
        } },
      { name: 'referencias_cruzadas', description: 'Referências cruzadas impressas na edição Almeida de 1911 para os versículos indicados. As abreviações são antigas (ex.: Psa. = Salmos, Act. = Atos, Pro. = Provérbios; "cap." e "ver." indicam o mesmo livro).',
        inputSchema: { type: 'object', properties: { referencia: { type: 'string' } }, required: ['referencia'] },
        execute: async function (i) {
          var r = Biblia.interpretar(String(i.referencia || ''));
          if (!r.ok) throw new Error('Referência inválida.');
          status('Buscando referências cruzadas…');
          await Biblia.indice('alm1911');
          var lv = await Biblia.livro(r.ref.livro, 'alm1911'), out = [];
          A2Ref.versiculosDa(r.ref, Biblia.contagemSinc('alm1911')).slice(0, 30).forEach(function (x) {
            ((lv.notas || {})[x[1] + ':' + x[2]] || []).forEach(function (n) { if (n.tipo === 'ref') out.push(x[1] + ':' + x[2] + ' → ' + n.t); });
          });
          return { referencia: A2Ref.formatar(r.ref), referencias: out.slice(0, 40) };
        } },
      { name: 'buscar_texto', description: 'Pesquisa palavras no texto bíblico da tradução do usuário (sem acentos; aspas para expressão exata). Devolve até 25 versículos e o total encontrado.',
        inputSchema: { type: 'object', properties: { consulta: { type: 'string' } }, required: ['consulta'] },
        execute: async function (i) {
          status('Pesquisando “' + String(i.consulta).slice(0, 40) + '” na Bíblia…');
          var res = A2Busca.pesquisar(await livrosDe(v), String(i.consulta || ''), { limite: 25, grafiaAntiga: /^alm1911/.test(v) });
          return { total: res.total, resultados: res.resultados.map(function (x) { return A2Ref.formatar({ livro: x.livro, cap: x.cap, v1: x.v, v2: x.v }, true) + ' ' + x.texto; }) };
        } }
    ];
  }

  function guardar(id, doc) {
    Dados.salvar('assistente', id, Object.assign({ criadoEm: new Date().toISOString(), versao: Biblia.padrao() }, doc));
    var todos = Dados.todos('assistente').sort(function (a, b) { return (b._t || 0) - (a._t || 0); });
    todos.slice(30).forEach(function (x) { Dados.excluir('assistente', x.id); });
  }

  var assist = { area: null, status: null };

  function renderAssistente(tela) {
    tela.appendChild(cabecalho('Assistente bíblico', App.temIA ? h('span.selo.ia', 'IA') : null));
    var entrada = h('textarea.entrada#assist-q', { rows: 2, maxlength: 300, placeholder: 'Ex.: versículos sobre ansiedade · o que a Bíblia diz sobre perdão · Rm 8:28' });
    var bt = h('button.bt.pri', { on: { click: enviar } }, ico('brilho'), 'Perguntar');
    entrada.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } });
    function enviar() {
      var q = entrada.value.trim();
      if (!q) { entrada.focus(); return; }
      var r = Biblia.interpretar(q);
      pronto.then(function () {
        if (r.ok) (assist.guia ? estudarGuia : estudar)(A2Ref.formatar(r.ref, true)); else (assist.guia ? pesquisarGuia : pesquisar)(q);
      });
    }
    tela.appendChild(h('div.cartao.assist-caixa',
      h('p.sub', 'Pesquise versículos por tema ou digite uma passagem para ver o contexto histórico, a cultura da época e o sentido do texto.'),
      h('label.sr', { for: 'assist-q' }, 'Pergunta ou passagem'), entrada,
      h('div.linha-bts', bt),
      h('div.chips', ['Versículos sobre ansiedade', 'O que a Bíblia diz sobre perdão', 'Promessas de Deus para a família', 'Jo 3:1-16', 'Sl 23', 'At 2:42'].map(function (x) {
        return h('button.chip', { on: { click: function () { entrada.value = x; enviar(); } } }, x);
      }))));
    assist.status = h('p.sub.assist-status', { role: 'status', 'aria-live': 'polite' });
    assist.area = h('div.assist-area');
    tela.appendChild(assist.status); tela.appendChild(assist.area);
    var aviso = h('div.aviso-ia', ico('brilho'), h('span', 'As respostas são geradas por IA a partir do texto bíblico lido pelo app. Cada referência é conferida, o texto dos versículos é sempre o da tradução e as obras sugeridas vêm de uma lista fixa. Mesmo assim, examine tudo nas Escrituras, como os bereanos (At 17:11).'));
    tela.appendChild(aviso);
    assist.guia = false;
    var pronto = obterSample().then(function (s) {
      if (s) return;
      assist.guia = true;
      bt.replaceChildren(ico('busca'), 'Buscar');
      UI.trocar(aviso, ico('livro'), h('span', 'Modo guia: aqui o assistente não usa IA. Ele encontra passagens pelos temas curados e pela busca no texto, e para cada passagem mostra o texto em outras traduções, a ficha do livro, o capítulo ao redor e as referências cruzadas da Almeida 1911. Confira tudo nas Escrituras (At 17:11).'));
    });
    historicoAssist(tela);
    var pedido = App.estado.assistentePedido; App.estado.assistentePedido = null;
    if (pedido) { entrada.value = pedido.ref; pronto.then(function () { if (assist.guia) estudarGuia(pedido.ref); else estudar(pedido.ref, pedido.foco); }); }
  }

  function historicoAssist(tela) {
    var itens = Dados.todos('assistente').sort(function (a, b) { return (b._t || 0) - (a._t || 0); });
    if (!itens.length) return;
    tela.appendChild(h('div.secao', h('h2', 'Recentes')));
    tela.appendChild(h('div.lista', itens.slice(0, 12).map(function (x) {
      return h('button.item', { on: { click: function () { window.scrollTo(0, 0); if (x.tipo === 'estudo') mostrarEstudo(x.ref, x.estudo, x.id, x.conversa || []); else mostrarPesquisa(x.pergunta, x.resultado); } } },
        ico(x.tipo === 'estudo' ? 'livro' : 'busca'),
        h('div.corpo', h('span.titulo', x.tipo === 'estudo' ? x.ref + (x.estudo && x.estudo.titulo ? ' — ' + x.estudo.titulo : '') : x.pergunta),
          h('span.meta', (x.tipo === 'estudo' ? 'Estudo' : 'Pesquisa') + ' · ' + UI.dataCurta(x.criadoEm || ''))));
    })));
  }

  async function pesquisar(pergunta) {
    var id = 'p' + hash(Biblia.padrao() + '|' + pergunta.toLowerCase());
    var salvo = Dados.obter('assistente', id);
    if (salvo) { mostrarPesquisa(pergunta, salvo.resultado); return; }
    if (A2Assistente.sinalDeCrise(pergunta)) mostrarApoio();
    var sample = await obterSample();
    if (!sample) { assist.status.textContent = 'A IA não está disponível nesta visualização.'; return; }
    UI.trocar(assist.area, h('div.carregando', h('div.giro')));
    assist.status.textContent = 'Procurando nas Escrituras…';
    try {
      var j = await sample.json(A2Assistente.promptPesquisa(pergunta, sigla()), { tools: ferramentas(function (s) { assist.status.textContent = s; }), modelTier: 'default' });
      var res = A2Assistente.validarPesquisa(j, function (s) { return Biblia.interpretar(s); });
      if (!res.versiculos.length) throw new Error('Não encontrei passagens conferidas para esse pedido. Tente dizer de outro jeito.');
      res.versiculos = res.versiculos.map(function (x) { return { ref: refCurta(x.ref), motivo: x.motivo }; });
      guardar(id, { tipo: 'pesquisa', pergunta: pergunta, resultado: res });
      App.registrar('busca', { titulo: 'Assistente: ' + pergunta.slice(0, 60) });
      mostrarPesquisa(pergunta, res);
    } catch (e) { assist.area.replaceChildren(); assist.status.textContent = erroIA(e); }
  }

  function mostrarPesquisa(pergunta, res) {
    assist.status.textContent = res.descartadas && res.descartadas.length ? res.descartadas.length + ' referência(s) sugerida(s) pela IA não existiam e foram descartadas.' : '';
    var lista = h('div.lista');
    res.versiculos.forEach(function (x) {
      var r = Biblia.interpretar(x.ref); if (!r.ok) return;
      var corpo = h('div.corpo', h('span.titulo', A2Ref.formatar(r.ref)), h('span.texto-vers', '…'), x.motivo ? h('span.meta', x.motivo) : null);
      lista.appendChild(h('div.item.res-assist', ico('livro'), corpo,
        h('div.res-acoes', h('button.bt.peq', { on: { click: function () { window.scrollTo(0, 0); (assist.guia ? estudarGuia : estudar)(x.ref); } } }, ico(assist.guia ? 'livro' : 'brilho'), 'Estudar'),
          h('button.bt.peq', { on: { click: function () { App.abrirBiblia(r.ref.livro, r.ref.cap, r.ref.v1); } } }, 'Abrir'))));
      Biblia.textoDe(r.ref).then(function (vs) { corpo.querySelector('.texto-vers').textContent = vs.map(function (v) { return UI.plano(v.t); }).join(' ') + ' (' + sigla() + ')'; });
    });
    UI.trocar(assist.area,
      h('div.secao', h('h2', pergunta)),
      res.resumo ? h('div.cartao', h('p', textoComRefs(res.resumo))) : null,
      lista,
      res.sugestoes && res.sugestoes.length ? h('div.chips', { style: { marginTop: '10px' } }, res.sugestoes.map(function (s) { return h('button.chip', { on: { click: function () { pesquisar(s); } } }, s); })) : null);
  }

  async function estudar(refStr, foco) {
    var r = Biblia.interpretar(refStr);
    if (!r.ok) { assist.status.textContent = r.erro; return; }
    var ref = refCurta(r.ref), id = 'e' + hash(Biblia.padrao() + '|' + ref + '|' + (foco || ''));
    var salvo = Dados.obter('assistente', id);
    if (salvo) { mostrarEstudo(salvo.ref, salvo.estudo, id, salvo.conversa || []); return; }
    var sample = await obterSample();
    if (!sample) { assist.status.textContent = 'A IA não está disponível nesta visualização.'; return; }
    UI.trocar(assist.area, h('div.cartao', h('b', A2Ref.formatar(r.ref)), await versosEl(r.ref, 30)), h('div.carregando', h('div.giro')));
    assist.status.textContent = 'Preparando o estudo…';
    try {
      var j = await sample.json(A2Assistente.promptEstudo(A2Ref.formatar(r.ref), sigla(), foco), { tools: ferramentas(function (s) { assist.status.textContent = s; }), modelTier: 'complex' });
      var v = A2Assistente.validarEstudo(j, function (s) { return Biblia.interpretar(s); });
      var estudo = Object.assign({}, v.estudo, { ligacoes: v.estudo.ligacoes.map(function (l) { return { ref: refCurta(l.ref), nota: l.nota }; }), descartadas: v.descartadas });
      guardar(id, { tipo: 'estudo', ref: ref, foco: foco || '', estudo: estudo, conversa: [] });
      App.registrar('estudo', { titulo: 'Assistente: ' + A2Ref.formatar(r.ref) });
      mostrarEstudo(ref, estudo, id, []);
    } catch (e) { assist.status.textContent = erroIA(e); var g = assist.area.querySelector('.carregando'); if (g) g.remove(); }
  }

  function secao(titulo, conteudo) { return conteudo ? h('section.estudo-sec', h('h3', titulo), conteudo) : null; }
  function par(s) { return s ? h('p', textoComRefs(s)) : null; }

  async function mostrarEstudo(ref, e, id, conversa) {
    var r = Biblia.interpretar(ref).ref, intro = A2Assistente.INTRODUCOES[r.livro];
    assist.status.textContent = e.descartadas && e.descartadas.length ? e.descartadas.length + ' referência(s) sugerida(s) pela IA não existiam e foram descartadas.' : '';
    var ligacoes = e.ligacoes && e.ligacoes.length ? h('div.lista', e.ligacoes.map(function (l) {
      var rr = Biblia.interpretar(l.ref); if (!rr.ok) return null;
      var txt = h('span.texto-vers');
      var it = h('button.item', { on: { click: function () { App.abrirBiblia(rr.ref.livro, rr.ref.cap, rr.ref.v1); } } }, h('div.corpo', h('span.titulo', A2Ref.formatar(rr.ref)), txt, l.nota ? h('span.meta', l.nota) : null));
      Biblia.textoDe(rr.ref).then(function (vs) { txt.textContent = vs.slice(0, 4).map(function (v) { return UI.plano(v.t); }).join(' ') + (vs.length > 4 ? ' …' : ''); });
      return it;
    })) : null;
    var conversaEl = h('div.conversa');
    (conversa || []).forEach(function (c) { conversaEl.appendChild(bolha(c)); });
    var perg = h('input.entrada#assist-perg', { type: 'text', maxlength: 240, placeholder: 'Pergunte algo sobre esta passagem' });
    var btPerg = h('button.bt', { on: { click: perguntar } }, 'Enviar');
    perg.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); perguntar(); } });
    async function perguntar() {
      var q = perg.value.trim(); if (!q) return;
      if (A2Assistente.sinalDeCrise(q)) mostrarApoio();
      var sample = await obterSample();
      if (!sample) { assist.status.textContent = 'A IA não está disponível nesta visualização.'; return; }
      btPerg.disabled = true; perg.value = '';
      var item = { p: q, r: '' }, el = bolha(item); conversaEl.appendChild(el);
      try {
        var out = await sample(A2Assistente.promptPergunta(A2Ref.formatar(r), e, q, conversa), { tools: ferramentas(function (s) { el.querySelector('.r').textContent = s; }), modelTier: 'default', cache: false });
        item.r = A2Assistente.txt(out && out.text, 1600);
        conversa = (conversa || []).concat([item]).slice(-8);
        var doc = Dados.obter('assistente', id); if (doc) Dados.salvar('assistente', id, Object.assign({}, doc, { conversa: conversa }));
        el.replaceWith(bolha(item));
      } catch (er) { el.querySelector('.r').textContent = erroIA(er); }
      finally { btPerg.disabled = false; }
    }
    function bolha(c) { return h('div.bolha', h('p.p', c.p), h('p.r', c.r ? textoComRefs(c.r) : 'Pensando…')); }

    UI.trocar(assist.area,
      h('div.estudo-topo', h('span.rotulo', 'Estudo · ' + sigla()), h('h2', A2Ref.formatar(r) + (e.titulo ? ' — ' + e.titulo : ''))),
      h('div.cartao.trecho-cartao', await versosEl(r, 30), h('div.linha-bts', h('button.bt.peq', { on: { click: function () { App.abrirBiblia(r.livro, r.cap, r.v1); } } }, ico('livro'), 'Ler no capítulo'))),
      secao('Em resumo', par(e.resumo)),
      secao('Contexto histórico', par(e.contexto_historico)),
      secao('Cultura e costumes', par(e.cultura)),
      secao('O sentido no texto', par(e.sentido)),
      secao('Palavras-chave', e.palavras && e.palavras.length ? h('dl.palavras', e.palavras.map(function (p) { return [h('dt', p.termo), h('dd', p.explicacao)]; })) : null),
      secao('Passagens relacionadas', ligacoes),
      secao('Leituras entre cristãos', e.interpretacoes && e.interpretacoes.length ? h('div', h('p.sub', 'Cristãos que respeitam as Escrituras entendem este ponto de maneiras diferentes:'),
        e.interpretacoes.map(function (x) { return h('p', h('b', x.leitura + ': '), x.explicacao); })) : null),
      secao('Para a vida', par(e.aplicacao)),
      secao('Para refletir', e.perguntas && e.perguntas.length ? h('ul', e.perguntas.map(function (p) { return h('li', p); })) : null),
      intro ? secao('Ficha do livro de ' + A2Ref.POR_ID[r.livro].nome, h('div', h('p', h('b', 'Autoria: '), intro.autoria), h('p', h('b', 'Época: '), intro.epoca), h('p', h('b', 'Tema: '), intro.tema),
        h('p.sub', 'Ficha redigida pela equipe do ATOS 2.'))) : null,
      secao('Para aprofundar', e.obras && e.obras.length ? h('ul.obras', e.obras.map(function (o) { var x = A2Assistente.OBRA_POR_ID[o]; return x ? h('li', h('i', x.titulo), ' — ', x.autor, ' (', x.editora, ')') : null; })) : null),
      h('div.linha-bts',
        h('button.bt', { on: { click: function () { salvarComoEstudo(r, e); } } }, ico('nota'), 'Salvar nos estudos'),
        h('button.bt', { on: { click: function () { App.compartilhar(estudoEmTexto(r, e), 'Compartilhar estudo'); } } }, ico('compartilhar'), 'Compartilhar'),
        h('button.bt', { on: { click: function () { var d = Dados.obter('assistente', id) || {}; Dados.excluir('assistente', id); window.scrollTo(0, 0); estudar(ref, d.foco || ''); } } }, ico('historico'), 'Refazer')),
      h('section.estudo-sec', h('h3', 'Perguntas sobre a passagem'), conversaEl, h('div.pergunta-linha', h('label.sr', { for: 'assist-perg' }, 'Sua pergunta'), perg, btPerg)));
  }

  function estudoEmTexto(r, e) {
    var l = [A2Ref.formatar(r) + (e.titulo ? ' — ' + e.titulo : ''), ''];
    [['Resumo', e.resumo], ['Contexto histórico', e.contexto_historico], ['Cultura e costumes', e.cultura], ['Sentido no texto', e.sentido], ['Para a vida', e.aplicacao]].forEach(function (x) { if (x[1]) l.push(x[0] + ': ' + x[1], ''); });
    if (e.ligacoes && e.ligacoes.length) l.push('Passagens relacionadas: ' + e.ligacoes.map(function (x) { return x.ref; }).join('; '), '');
    l.push('Estudo gerado com IA no app ATOS 2. Confira nas Escrituras (At 17:11).');
    return l.join('\n');
  }
  function salvarComoEstudo(r, e) {
    var id = UI.uid(), corpo = estudoEmTexto(r, e);
    Dados.salvar('estudos', id, { titulo: (A2Ref.formatar(r) + (e.titulo ? ' — ' + e.titulo : '')).slice(0, 120), categoria: 'Assistente (IA)', corpo: corpo,
      refs: [{ ref: A2Ref.formatar(r), nota: 'Passagem estudada' }].concat((e.ligacoes || []).map(function (x) { return { ref: A2Ref.formatar(Biblia.interpretar(x.ref).ref), nota: x.nota }; })),
      origem: 'ia', criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() });
    UI.aviso('Salvo em Biblioteca › Estudos.');
  }
  function mostrarApoio() {
    UI.folha('Você não está sozinho', h('div.form',
      h('p', 'Se você está pensando em se ferir ou em tirar a própria vida, fale agora com alguém. No Brasil, o CVV atende de graça, 24 horas, pelo telefone 188 ou pelo site cvv.org.br. Em emergência, ligue 192 (SAMU).'),
      h('p', 'Procure também alguém de confiança: um familiar, um amigo, seu pastor ou um profissional de saúde.'),
      h('a.bt.pri', { href: 'tel:188' }, 'Ligar 188')));
  }


  // ---------------------------------------------------------------- modo guia (sem IA)
  async function pesquisarGuia(pergunta) {
    UI.trocar(assist.area, h('div.carregando', h('div.giro')));
    assist.status.textContent = 'Procurando nas Escrituras…';
    try {
      var temas = A2Assistente.temasDaPergunta(pergunta, A2Conteudo.TEMAS, A2Busca.normalizar);
      var termos = A2Assistente.termosDaPergunta(pergunta, A2Busca.normalizar);
      var v = Biblia.padrao(), livros = termos.length ? await livrosDe(v) : [], opc = { limite: 400, grafiaAntiga: /^alm1911/.test(v) };
      var busca = termos.length ? A2Busca.pesquisar(livros, termos.join(' '), opc) : { total: 0, resultados: [] };
      if (!busca.total && termos.length > 1) {                      // nenhuma passagem com todas as palavras: tenta cada uma
        var junto = { total: 0, resultados: [] };
        termos.forEach(function (t) { var r = A2Busca.pesquisar(livros, t, opc); junto.total += r.total; junto.resultados = junto.resultados.concat(r.resultados); });
        busca = junto;
      }
      var vistos = {}, versiculos = [];
      temas.forEach(function (t) { t.refs.forEach(function (s) { var r = Biblia.interpretar(s); if (r.ok && !vistos[s]) { vistos[s] = 1; versiculos.push({ ref: refCurta(r.ref), motivo: 'Tema: ' + t.nome }); } }); });
      busca.resultados.slice(0, 400).forEach(function (x) {
        if (versiculos.length >= 24) return;
        var s = A2Ref.formatar({ livro: x.livro, cap: x.cap, v1: x.v, v2: x.v }, true);
        if (!vistos[s]) { vistos[s] = 1; versiculos.push({ ref: s, motivo: '' }); }
      });
      if (!versiculos.length) { assist.area.replaceChildren(); assist.status.textContent = 'Não encontrei passagens com essas palavras. Tente outra palavra ou um dos temas abaixo.'; mostrarTemas(); return; }
      App.registrar('busca', { titulo: 'Assistente: ' + pergunta.slice(0, 60) });
      mostrarPesquisa(pergunta, { resumo: '', versiculos: versiculos, sugestoes: [] });
      assist.status.textContent = (temas.length ? 'Temas: ' + temas.map(function (t) { return t.nome; }).join(', ') + '. ' : '') + (busca.total ? busca.total + ' versículo(s) com essas palavras.' : '');
      assist.area.appendChild(h('p.sub', { style: { marginTop: '6px' } }, 'Passagens dos temas curados vêm primeiro; depois, as que contêm as palavras pesquisadas. Abra cada uma no capítulo para ler o contexto.'));
      if (busca.total > versiculos.length) assist.area.appendChild(h('button.bt.peq', { on: { click: function () { Telas.pesquisa.abrir(termos.join(' ')); } } }, ico('busca'), 'Ver todos os ' + busca.total + ' versículos na pesquisa'));
    } catch (e) { assist.area.replaceChildren(); assist.status.textContent = 'Não foi possível pesquisar agora: ' + e.message; }
  }
  function mostrarTemas() {
    assist.area.appendChild(h('div.chips', A2Conteudo.TEMAS.map(function (t) { return h('button.chip', { on: { click: function () { pesquisarGuia(t.nome); } } }, t.nome); })));
  }

  async function estudarGuia(refStr) {
    var r = Biblia.interpretar(refStr);
    if (!r.ok) { assist.status.textContent = r.erro; return; }
    var ref = r.ref, v = Biblia.padrao(), lv = A2Ref.POR_ID[ref.livro], intro = A2Assistente.INTRODUCOES[ref.livro];
    if (ref.v1 == null) { ref = Object.assign({}, ref, { v1: 1, v2: Biblia.contagemSinc(v)(ref.livro)[ref.cap - 1], cap2: ref.cap }); }
    assist.status.textContent = '';
    UI.trocar(assist.area, h('div.carregando', h('div.giro')));
    App.registrar('estudo', { titulo: 'Guia: ' + A2Ref.formatar(ref) });
    // outras traduções
    var outras = h('div');
    Biblia.ativas().filter(function (x) { return x.id !== v && x.id !== 'alm1911'; }).forEach(function (x) {
      Biblia.indice(x.id).then(function () { return Biblia.textoDe(ref, x.id); }).then(function (vs) {
        var p = h('p.trecho'); vs.slice(0, 12).forEach(function (y, i) { if (i) p.appendChild(document.createTextNode(' ')); p.appendChild(h('sup', y.v)); p.appendChild(UI.textoComItalico(y.t)); });
        outras.appendChild(h('div.cartao.outra-trad', h('span.rotulo', x.nome + ' (' + x.sigla + ')'), p));
      }).catch(function () {});
    });
    // capítulo ao redor
    var nVs = Biblia.contagemSinc(v)(ref.livro)[ref.cap - 1], de = Math.max(1, ref.v1 - 3), ate = Math.min(nVs, (ref.cap2 === ref.cap ? ref.v2 : nVs) + 3);
    var redor = await Biblia.textoDe({ livro: ref.livro, cap: ref.cap, v1: de, v2: ate, cap2: ref.cap }, v);
    var redorEl = h('p.trecho');
    redor.forEach(function (y, i) {
      if (i) redorEl.appendChild(document.createTextNode(' '));
      var dentro = y.v >= ref.v1 && (ref.cap2 !== ref.cap || y.v <= ref.v2);
      var sp = h('span' + (dentro ? '.alvo' : '')); sp.appendChild(h('sup', y.v)); sp.appendChild(UI.textoComItalico(y.t)); redorEl.appendChild(sp);
    });
    // referências cruzadas (Almeida 1911, grafia atualizada) e notas da tradução
    var cruzadas = [], notas = [];
    try {
      await Biblia.indice('alm1911at');
      var l1911 = await Biblia.livro(ref.livro, 'alm1911at'), vistos = {};
      A2Ref.versiculosDa(ref, Biblia.contagemSinc('alm1911at')).slice(0, 20).forEach(function (x) {
        ((l1911.notas || {})[x[1] + ':' + x[2]] || []).forEach(function (n) {
          if (n.tipo !== 'ref') return;
          A2Assistente.refsDaNota1911(n.t, lv.abrev, x[1]).forEach(function (s) { var rr = Biblia.interpretar(s); if (rr.ok && !rr.soLivro && !vistos[s] && cruzadas.length < 12) { vistos[s] = 1; cruzadas.push(rr.ref); } });
        });
      });
      var lAtual = await Biblia.livro(ref.livro, v);
      A2Ref.versiculosDa(ref, Biblia.contagemSinc(v)).slice(0, 20).forEach(function (x) {
        ((lAtual.notas || {})[x[1] + ':' + x[2]] || []).forEach(function (n) { if (n.tipo !== 'ref') notas.push({ v: x[2], t: n.t, k: n.k }); });
      });
    } catch (e) { /* sem internet: seções opcionais ficam de fora */ }
    var listaCruz = cruzadas.length ? h('div.lista', cruzadas.map(function (rr) {
      var txt = h('span.texto-vers');
      Biblia.textoDe(rr).then(function (vs) { txt.textContent = vs.slice(0, 3).map(function (y) { return UI.plano(y.t); }).join(' ') + (vs.length > 3 ? ' …' : ''); });
      return h('button.item', { on: { click: function () { App.abrirBiblia(rr.livro, rr.cap, rr.v1); } } }, h('div.corpo', h('span.titulo', A2Ref.formatar(rr)), txt));
    })) : null;
    // temas e personagens ligados à passagem
    var ligados = [];
    A2Conteudo.TEMAS.forEach(function (t) { if (t.refs.some(function (s) { var rr = Biblia.interpretar(s); return rr.ok && rr.ref.livro === ref.livro && rr.ref.cap === ref.cap; })) ligados.push({ nome: 'Tema: ' + t.nome, acao: function () { pesquisarGuia(t.nome); } }); });
    A2Conteudo.PERSONAGENS.forEach(function (p) { if (p.refs.some(function (s) { var rr = Biblia.interpretar(s); return rr.ok && rr.ref.livro === ref.livro && rr.ref.cap === ref.cap; })) ligados.push({ nome: p.nome, acao: function () { Telas.pesquisa.abrir(p.nome); } }); });
    var nt = A2Ref.LIVROS.map(function (l) { return l.id; }).indexOf(ref.livro) >= 39;
    var obras = ['ndb', nt ? 'chc-nt' : 'chc-at', nt ? 'int-nt' : 'int-at', 'fee'].map(function (id) { return A2Assistente.OBRA_POR_ID[id]; });

    UI.trocar(assist.area,
      h('div.estudo-topo', h('span.rotulo', 'Guia de estudo · ' + sigla()), h('h2', A2Ref.formatar(ref))),
      h('div.cartao.trecho-cartao', await versosEl(ref, 30), h('div.linha-bts',
        h('button.bt.peq', { on: { click: function () { App.abrirBiblia(ref.livro, ref.cap, ref.v1); } } }, ico('livro'), 'Ler no capítulo'),
        h('button.bt.peq', { on: { click: async function () { App.compartilhar(Biblia.citacao(await Biblia.textoDe(ref), ref, sigla()), 'Compartilhar passagem'); } } }, ico('compartilhar'), 'Compartilhar'))),
      intro ? secao('Sobre o livro de ' + lv.nome, h('div', h('p', h('b', 'Autoria: '), intro.autoria), h('p', h('b', 'Época: '), intro.epoca), h('p', h('b', 'Tema: '), intro.tema), h('p.sub', 'Ficha redigida pela equipe do ATOS 2.'))) : null,
      secao('No capítulo', h('div', h('p.sub', 'Os versículos ao redor ajudam a entender o sentido: leia o que vem antes e depois.'), redorEl)),
      secao('Em outras traduções', h('div', h('p.sub', 'Comparar traduções ajuda a perceber o sentido das palavras.'), outras)),
      notas.length ? secao('Notas da tradução', h('div', notas.slice(0, 8).map(function (n) { return h('p', h('b', 'v. ' + n.v + (n.k ? ' “' + n.k + '”' : '') + ': '), n.t); }))) : null,
      listaCruz ? secao('Referências cruzadas', h('div', h('p.sub', 'Indicadas pela edição Almeida de 1911: passagens que tratam do mesmo assunto.'), listaCruz)) : null,
      ligados.length ? secao('Temas e personagens', h('div.chips', ligados.map(function (x) { return h('button.chip', { on: { click: x.acao } }, x.nome); }))) : null,
      secao('Para aprofundar', h('ul.obras', obras.map(function (x) { return h('li', h('i', x.titulo), ' — ', x.autor, ' (', x.editora, ')'); }))));
  }

  Telas.assistente = { render: renderAssistente, estudar: function (ref, foco) { App.estado.assistentePedido = { ref: ref, foco: foco || '' }; if (App.estado.aba === 'assistente') App.recarregar(); else App.ir('assistente'); } };

  // ====================================================================== QUIZ
  var jogo = null;
  function estatQuiz() { return Object.assign({ jogos: 0, pontos: 0, melhor: 0, acertos: 0, respondidas: 0, vistas: [], desafios: {} }, Dados.obter('quiz', 'estatisticas') || {}); }

  function renderQuiz(tela) {
    tela.appendChild(cabecalho('Quiz bíblico'));
    var area = h('div.quiz');
    tela.appendChild(area);
    if (jogo && !jogo.fim) { desenharPergunta(area); return; }
    jogo = null;
    menuQuiz(area);
  }

  function menuQuiz(area) {
    var e = estatQuiz(), hoje = UI.hoje(), feito = e.desafios[hoje];
    var filtro = App.estado.quizFiltro || { cats: [], nivel: 0 };
    function chipsCat() {
      return h('div.chips', h('button.chip', { 'aria-pressed': String(!filtro.cats.length), on: { click: function () { filtro.cats = []; App.estado.quizFiltro = filtro; App.recarregar(); } } }, 'Todas'),
        A2Quiz.CATEGORIAS.map(function (c) {
          var on = filtro.cats.indexOf(c.id) >= 0;
          return h('button.chip', { 'aria-pressed': String(on), on: { click: function () { filtro.cats = on ? filtro.cats.filter(function (x) { return x !== c.id; }) : filtro.cats.concat([c.id]); App.estado.quizFiltro = filtro; App.recarregar(); } } }, c.nome);
        }));
    }
    UI.trocar(area,
      h('div.cartao.quiz-desafio',
        h('span.rotulo', 'Desafio do dia'), h('h2', feito ? 'Feito: ' + feito.acertos + ' de 5' : '5 perguntas, uma de cada tema'),
        h('p.sub', feito ? 'Volte amanhã para um novo desafio. Você pode jogar rodadas livres à vontade.' : 'As mesmas perguntas para todos hoje.'),
        feito ? null : h('button.bt.ouro', { on: { click: function () { iniciar(A2Quiz.desafioDoDia(hoje), 'desafio'); } } }, ico('estrela'), 'Começar desafio')),
      h('div.secao', h('h2', 'Rodada livre')),
      h('p.sub', 'Temas'), chipsCat(),
      h('p.sub', { style: { marginTop: '10px' } }, 'Nível'),
      h('div.chips', [0, 1, 2, 3].map(function (n) { return h('button.chip', { 'aria-pressed': String(filtro.nivel === n), on: { click: function () { filtro.nivel = n; App.estado.quizFiltro = filtro; App.recarregar(); } } }, n ? A2Quiz.NIVEIS[n] : 'Misto'); })),
      h('div.linha-bts', { style: { marginTop: '14px' } }, h('button.bt.pri', { on: { click: function () {
        var p = A2Quiz.rodada(Date.now() + ':' + Math.random(), { cats: filtro.cats, nivel: filtro.nivel, n: 10, evitar: estatQuiz().vistas });
        if (!p.length) { UI.aviso('Nenhuma pergunta com esses filtros.', true); return; }
        iniciar(p, 'livre');
      } } }, ico('play'), 'Jogar 10 perguntas')),
      h('div.secao', h('h2', 'Seu desempenho')),
      h('div.grade.g3.quiz-numeros',
        numero(e.jogos, 'partidas'), numero(e.respondidas ? UI.pct(100 * e.acertos / e.respondidas) : '—', 'de acertos'), numero(e.melhor, 'melhor pontuação')),
      h('p.sub', { style: { marginTop: '12px' } }, A2Quiz.BANCO.length + ' perguntas. Cada resposta foi conferida no texto bíblico, e depois de responder você lê o versículo na sua tradução.'));
  }
  function numero(n, r) { return h('div.cartao.numero-cartao', h('b', String(n)), h('span', r)); }

  function iniciar(perguntas, modo) {
    jogo = { perguntas: perguntas, i: 0, respostas: [], modo: modo, fim: false };
    App.recarregar();
  }

  async function desenharPergunta(area) {
    var p = jogo.perguntas[jogo.i], cat = A2Quiz.CATEGORIAS.filter(function (c) { return c.id === p.cat; })[0];
    var feedback = h('div.quiz-feedback', { 'aria-live': 'polite' });
    var botoes = p.opcoes.map(function (o, k) {
      return h('button.opcao', { on: { click: function () { responder(k); } } }, h('span.letra', 'ABCD'[k]), h('span', o));
    });
    UI.trocar(area,
      h('div.quiz-topo', h('span', 'Pergunta ' + (jogo.i + 1) + ' de ' + jogo.perguntas.length), h('div.esp'), h('span.selo', cat.nome), h('span.selo', A2Quiz.NIVEIS[p.nivel])),
      h('div.barra', { role: 'progressbar', 'aria-valuenow': jogo.i, 'aria-valuemin': 0, 'aria-valuemax': jogo.perguntas.length }, h('i', { style: { width: (100 * jogo.i / jogo.perguntas.length) + '%' } })),
      h('h2.quiz-pergunta', p.p),
      h('div.opcoes', botoes), feedback,
      h('div.linha-bts', h('button.bt', { on: { click: function () { jogo = null; App.recarregar(); } } }, 'Sair')));
    function responder(k) {
      var certo = k === p.certa;
      botoes.forEach(function (b, i) { b.disabled = true; if (i === p.certa) b.classList.add('certa'); else if (i === k) b.classList.add('errada'); });
      jogo.respostas.push({ id: p.id, certo: certo, nivel: p.nivel, escolha: p.opcoes[k] });
      var r = Biblia.interpretar(p.ref), txt = h('p.trecho', '…');
      UI.trocar(feedback, h('div.cartao.' + (certo ? 'ok' : 'erro'),
        h('b', certo ? 'Isso mesmo!' : 'Resposta certa: ' + p.opcoes[p.certa]),
        r.ok ? h('p.sub', A2Ref.formatar(r.ref) + ' · ' + sigla()) : null, txt, p.nota ? h('p.sub', p.nota) : null,
        h('div.linha-bts', r.ok ? h('button.bt.peq', { on: { click: function () { App.abrirBiblia(r.ref.livro, r.ref.cap, r.ref.v1); } } }, ico('livro'), 'Ler') : null,
          h('button.bt.pri', { on: { click: proxima } }, jogo.i + 1 < jogo.perguntas.length ? 'Próxima' : 'Ver resultado'))));
      if (r.ok) versosEl(r.ref, 8).then(function (el) { txt.replaceWith(el); });
      setTimeout(function () { var b = feedback.querySelector('.bt.pri'); if (b) b.focus(); }, 50);
    }
    function proxima() { jogo.i++; if (jogo.i >= jogo.perguntas.length) concluir(area); else desenharPergunta(area); window.scrollTo(0, 0); }
  }

  function concluir(area) {
    jogo.fim = true;
    var res = A2Quiz.pontuar(jogo.respostas), e = estatQuiz();
    e.jogos++; e.pontos += res.pontos; e.melhor = Math.max(e.melhor, res.pontos); e.acertos += res.acertos; e.respondidas += res.total;
    e.vistas = e.vistas.concat(jogo.perguntas.map(function (p) { return p.id; })).slice(-60);
    if (jogo.modo === 'desafio') { var d = Object.assign({}, e.desafios); d[UI.hoje()] = { acertos: res.acertos, pontos: res.pontos }; var ks = Object.keys(d).sort(); ks.slice(0, Math.max(0, ks.length - 60)).forEach(function (k) { delete d[k]; }); e.desafios = d; }
    Dados.salvar('quiz', 'estatisticas', e);
    App.registrar('quiz', { titulo: (jogo.modo === 'desafio' ? 'Desafio do dia' : 'Quiz') + ': ' + res.acertos + '/' + res.total });
    var texto = 'Fiz ' + res.acertos + ' de ' + res.total + ' no ' + (jogo.modo === 'desafio' ? 'desafio bíblico do dia' : 'quiz bíblico') + ' do ATOS 2 (' + res.pontos + ' pontos). Topa o desafio?';
    var perguntas = jogo.perguntas, respostas = jogo.respostas;
    UI.trocar(area,
      h('div.cartao.quiz-final', h('span.rotulo', jogo.modo === 'desafio' ? 'Desafio do dia' : 'Resultado'),
        h('div.placar', h('b', res.acertos + '/' + res.total), h('span', res.pontos + ' pontos')),
        h('p', A2Quiz.mensagem(res.acertos, res.total)),
        res.melhorSequencia >= 3 ? h('p.sub', 'Melhor sequência: ' + res.melhorSequencia + ' acertos seguidos.') : null),
      h('div.lista', perguntas.map(function (p, i) {
        var r = Biblia.interpretar(p.ref), ok = respostas[i] && respostas[i].certo;
        return h('button.item', { on: { click: function () { if (r.ok) App.abrirBiblia(r.ref.livro, r.ref.cap, r.ref.v1); } } }, h('span.marca-res.' + (ok ? 'ok' : 'erro'), ok ? '✓' : '✗'),
          h('div.corpo', h('span', p.p), h('span.meta', p.opcoes[p.certa] + (r.ok ? ' · ' + A2Ref.formatar(r.ref) : ''))));
      })),
      h('div.linha-bts', h('button.bt.pri', { on: { click: function () { jogo = null; App.recarregar(); } } }, 'Jogar de novo'),
        h('button.bt', { on: { click: function () { App.compartilhar(texto, 'Compartilhar resultado'); } } }, ico('compartilhar'), 'Compartilhar')));
    jogo = null;
  }

  Telas.quiz = { render: renderQuiz };

  // ====================================================================== MURAL
  function renderMural(tela) {
    tela.appendChild(cabecalho('Mural de curiosidades'));
    var aba = App.estado.muralAba || 'curiosidades';
    tela.appendChild(h('div.chips', [['curiosidades', 'Curiosidades'], ['teses', '95 Teses de Lutero'], ['numeros', 'Números da Bíblia']].map(function (x) {
      return h('button.chip', { 'aria-pressed': String(aba === x[0]), on: { click: function () { App.estado.muralAba = x[0]; App.recarregar(); } } }, x[1]);
    })));
    var area = h('div.mural');
    tela.appendChild(area);
    if (aba === 'teses') muralTeses(area); else if (aba === 'numeros') muralNumeros(area); else muralCuriosidades(area);
  }

  function cardCuriosidade(c, destaque) {
    return h('article.cartao.curio' + (destaque ? '.destaque' : ''),
      h('span.selo', c.tema), h('h3', c.titulo), h('p', c.texto),
      c.refs.length ? h('div.chips', c.refs.map(function (s) { var r = Biblia.interpretar(s); return r.ok ? linkRef(r.ref) : null; })) : null,
      h('p.fonte', 'Fonte: ' + c.fontes.join('; ')),
      h('div.linha-bts', h('button.bt.peq', { on: { click: function () { App.compartilhar(c.titulo + '\n\n' + c.texto + '\n\nFonte: ' + c.fontes.join('; ') + '\n— Mural de curiosidades, ATOS 2', 'Compartilhar curiosidade'); } } }, ico('compartilhar'), 'Compartilhar')));
  }

  function muralCuriosidades(area) {
    var lista = A2Mural.CURIOSIDADES, dia = Math.floor(Date.parse(UI.hoje()) / 864e5) % lista.length;
    area.appendChild(h('div.secao', h('h2', 'Curiosidade do dia')));
    area.appendChild(cardCuriosidade(lista[dia], true));
    area.appendChild(h('div.cartao.curio.teses-chamada', h('span.selo', 'Reforma'), h('h3', 'As 95 Teses de Martinho Lutero'),
      h('p', 'O documento de 1517 que deu início à Reforma Protestante, em tradução própria para o português, com contexto, glossário e as passagens bíblicas citadas.'),
      h('button.bt.ouro', { on: { click: function () { App.estado.muralAba = 'teses'; App.recarregar(); } } }, 'Ler as 95 Teses')));
    area.appendChild(h('div.secao', h('h2', 'Todas as curiosidades')));
    lista.forEach(function (c, i) { if (i !== dia) area.appendChild(cardCuriosidade(c)); });
    area.appendChild(h('p.sub', { style: { marginTop: '12px' } }, 'As curiosidades históricas foram conferidas nas fontes indicadas. Datas antigas costumam ser aproximadas.'));
  }

  function muralTeses(area) {
    var I = A2Mural.TESES_INTRO, grupo = App.estado.tesesGrupo || 0, busca = App.estado.tesesBusca || '';
    area.appendChild(h('div.teses-capa', h('span.rotulo', 'Wittenberg, 1517'), h('h2', I.titulo), h('p', h('i', I.original)), h('p.sub', I.traducaoTitulo)));
    var contexto = h('details.cartao.contexto', h('summary', 'Contexto histórico'), I.paragrafos.map(function (p) { return h('p', p); }));
    if (!busca && !grupo) contexto.open = true;
    area.appendChild(contexto);
    area.appendChild(h('div.linha-bts', h('button.bt.peq', { on: { click: glossario } }, ico('info'), 'Glossário'),
      h('button.bt.peq', { on: { click: function () { App.compartilhar(A2Mural.TESES.map(function (t, i) { return (i + 1) + '. ' + t.t; }).join('\n'), 'Compartilhar as 95 Teses'); } } }, ico('copiar'), 'Copiar todas')));
    var campo = h('input.entrada#teses-busca', { type: 'search', placeholder: 'Procurar nas teses (ex.: evangelho, pobre, cruz)', value: busca });
    var lista = h('ol.teses');
    function desenhar() {
      var q = A2Busca.normalizar(campo.value.trim()), g = A2Mural.TESES_GRUPOS[grupo - 1];
      lista.replaceChildren();
      A2Mural.TESES.forEach(function (t, i) {
        var n = i + 1;
        if (g && (n < g.de || n > g.ate)) return;
        if (q && A2Busca.normalizar(t.t).indexOf(q) < 0) return;
        A2Mural.TESES_GRUPOS.forEach(function (gr) { if (gr.de === n && !q) lista.appendChild(h('li.grupo', { 'aria-hidden': 'true' }, gr.nome)); });
        lista.appendChild(h('li.tese', { value: n },
          h('span.n', String(n)), h('div', h('p', t.t),
            h('div.tese-acoes', (t.refs || []).map(function (s) { var r = Biblia.interpretar(s); return r.ok ? linkRef(r.ref, 'Ver ' + A2Ref.formatar(r.ref, true)) : null; }),
              h('button.bt-ico.peq', { 'aria-label': 'Compartilhar tese ' + n, on: { click: function () { App.compartilhar('Tese ' + n + ' de Martinho Lutero (1517):\n“' + t.t + '”\n— 95 Teses, tradução ATOS 2', 'Compartilhar tese'); } } }, ico('compartilhar'))))));
      });
      if (!lista.children.length) lista.appendChild(h('li.vazio', 'Nenhuma tese encontrada.'));
    }
    campo.addEventListener('input', function () { App.estado.tesesBusca = campo.value; desenhar(); });
    area.appendChild(h('label.sr', { for: 'teses-busca' }, 'Procurar nas teses'));
    area.appendChild(campo);
    area.appendChild(h('div.chips', { style: { marginTop: '10px' } }, h('button.chip', { 'aria-pressed': String(!grupo), on: { click: function () { App.estado.tesesGrupo = 0; App.recarregar(); } } }, 'Todas'),
      A2Mural.TESES_GRUPOS.map(function (g, i) { return h('button.chip', { 'aria-pressed': String(grupo === i + 1), on: { click: function () { App.estado.tesesGrupo = i + 1; App.recarregar(); } } }, g.de + '–' + g.ate + ' · ' + g.nome); })));
    area.appendChild(lista);
    desenhar();
    area.appendChild(h('p.sub.traducao-nota', I.traducao));
  }
  function glossario() {
    UI.folha('Glossário das Teses', h('dl.palavras', A2Mural.GLOSSARIO.map(function (g) { return [h('dt', g.termo), h('dd', g.def)]; })));
  }

  async function muralNumeros(area) {
    var v = Biblia.padrao(), ix = await Biblia.indice(v), s = A2Mural.estatisticas(ix), nome = function (id) { return A2Ref.POR_ID[id].nome; };
    var fmt = function (n) { return n.toLocaleString('pt-BR'); };
    area.appendChild(h('p.sub', 'Números calculados a partir da ' + Biblia.versao(v).nome + ' (' + sigla() + '). Outras traduções podem dividir alguns versículos de outro modo.'));
    area.appendChild(h('div.grade.g3.quiz-numeros', numero(s.livros, 'livros'), numero(fmt(s.capitulos), 'capítulos'), numero(fmt(s.versiculos), 'versículos')));
    var fatos = [
      ['Antigo e Novo Testamento', s.at.livros + ' livros e ' + fmt(s.at.versiculos) + ' versículos no Antigo; ' + s.nt.livros + ' livros e ' + fmt(s.nt.versiculos) + ' versículos no Novo.'],
      ['Maior capítulo', nome(s.maiorCapitulo.livro) + ' ' + s.maiorCapitulo.cap + ', com ' + s.maiorCapitulo.n + ' versículos.', { livro: s.maiorCapitulo.livro, cap: s.maiorCapitulo.cap }],
      ['Menor capítulo', nome(s.menorCapitulo.livro) + ' ' + s.menorCapitulo.cap + ', com ' + s.menorCapitulo.n + ' versículos.', { livro: s.menorCapitulo.livro, cap: s.menorCapitulo.cap }],
      ['Capítulo do meio', (s.capitulosDoMeio.length === 1 ? nome(s.capitulosDoMeio[0].livro) + ' ' + s.capitulosDoMeio[0].cap + ' fica exatamente no meio dos ' : 'Os capítulos do meio são ' + s.capitulosDoMeio.map(function (x) { return nome(x.livro) + ' ' + x.cap; }).join(' e ') + ', entre os ') + fmt(s.capitulos) + ' capítulos.', s.capitulosDoMeio[0]],
      ['Versículos do meio', (s.versiculosDoMeio.length === 2 ? 'Com ' + fmt(s.versiculos) + ' versículos (número par), o meio cai entre ' : 'O versículo do meio é ') + s.versiculosDoMeio.map(function (x) { return A2Ref.formatar({ livro: x.livro, cap: x.cap, v1: x.v, v2: x.v }); }).join(' e ') + '. Cuidado com listas que circulam por aí: o resultado depende da contagem de cada tradução.', { livro: s.versiculosDoMeio[0].livro, cap: s.versiculosDoMeio[0].cap, v: s.versiculosDoMeio[0].v }],
      ['Livro com mais capítulos', nome(s.livroMaisCapitulos.livro) + ', com ' + s.livroMaisCapitulos.n + '.'],
      ['Livro com mais versículos', nome(s.livroMaisVersiculos.livro) + ', com ' + fmt(s.livroMaisVersiculos.n) + '.'],
      ['Livro com menos versículos', nome(s.livroMenosVersiculos.livro) + ', com ' + s.livroMenosVersiculos.n + '.', { livro: s.livroMenosVersiculos.livro, cap: 1 }]
    ];
    area.appendChild(h('div.lista', fatos.map(function (f) {
      return h(f[2] ? 'button.item' : 'div.item', f[2] ? { on: { click: function () { App.abrirBiblia(f[2].livro, f[2].cap, f[2].v); } } } : null, ico('info'), h('div.corpo', h('span.titulo', f[0]), h('span', f[1])));
    })));
    var extremos = h('div');
    area.appendChild(h('div.secao', h('h2', 'No texto')));
    area.appendChild(extremos);
    UI.trocar(extremos, h('button.bt', { on: { click: analisar } }, ico('busca'), 'Analisar o texto completo'), h('p.sub', 'Descobre o versículo mais longo e os mais curtos. Na primeira vez, carrega todos os livros.'));
    async function analisar() {
      UI.trocar(extremos, h('p.sub', 'Carregando os livros…'));
      try {
        var livros = await Biblia.todosOsLivros(v, function (i, n) { extremos.firstChild.textContent = 'Carregando os livros… ' + i + ' de ' + n; });
        livrosCache[v] = livros;
        var x = A2Mural.extremosDoTexto(livros, UI.plano), ref = function (y) { return { livro: y.livro, cap: y.cap, v1: y.v, v2: y.v }; };
        UI.trocar(extremos, h('div.lista',
          h('button.item', { on: { click: function () { App.abrirBiblia(x.maisLongo.livro, x.maisLongo.cap, x.maisLongo.v); } } }, ico('texto'), h('div.corpo', h('span.titulo', 'Versículo mais longo'), h('span', A2Ref.formatar(ref(x.maisLongo)) + ', com ' + x.maisLongo.n + ' palavras.'))),
          h('div.item', ico('texto'), h('div.corpo', h('span.titulo', 'Versículos mais curtos (' + x.maisCurto.n + ' palavras)'), h('span', x.maisCurtos.slice(0, 8).map(function (y) { return A2Ref.formatar(ref(y), true); }).join(', ') + '.'))),
          h('div.item', ico('texto'), h('div.corpo', h('span.titulo', 'Total de palavras'), h('span', 'Cerca de ' + fmt(Math.round(x.palavras / 1000) * 1000) + ' palavras nesta tradução.')))));
      } catch (e) { UI.trocar(extremos, h('p.sub', 'Não foi possível carregar agora: ' + e.message)); }
    }
    // Contador de palavras
    area.appendChild(h('div.secao', h('h2', 'Quantas vezes aparece?')));
    var campo = h('input.entrada#mural-palavra', { type: 'search', placeholder: 'Digite uma palavra, ex.: amor, graça, fé' }), saida = h('div');
    var form = h('form.pergunta-linha', { on: { submit: async function (e) {
      e.preventDefault(); var q = campo.value.trim(); if (!q) return;
      saida.textContent = 'Contando…';
      try {
        var res = A2Busca.pesquisar(await livrosDe(v), q, { limite: 1, grafiaAntiga: /^alm1911/.test(v) });
        var top = Object.keys(res.porLivro).sort(function (a, b) { return res.porLivro[b] - res.porLivro[a]; }).slice(0, 3);
        UI.trocar(saida, h('div.cartao', h('p', h('b', '“' + q + '”'), ' aparece em ', h('b', fmt(res.total)), ' versículo' + (res.total === 1 ? '' : 's') + ' da ' + sigla() + '.'),
          top.length ? h('p.sub', 'Mais frequente em: ' + top.map(function (id) { return nome(id) + ' (' + res.porLivro[id] + ')'; }).join(', ') + '.') : null,
          res.total ? h('button.bt.peq', { type: 'button', on: { click: function () { Telas.pesquisa.abrir(q); } } }, ico('busca'), 'Ver os versículos') : null));
      } catch (er) { saida.textContent = 'Não foi possível contar agora.'; }
    } } }, h('label.sr', { for: 'mural-palavra' }, 'Palavra'), campo, h('button.bt.pri', { type: 'submit' }, 'Contar'));
    area.appendChild(form); area.appendChild(saida);
  }

  Telas.mural = { render: renderMural };
})(window);
