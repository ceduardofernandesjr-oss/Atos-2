/* ATOS 2 — Estudo teológico: textos originais (interlinear e palavra), doutrinas e controvérsias, modo Bereano.
   Funciona sem IA. Na prévia do claude.ai, a IA usa os mesmos dados (ver explorar.js). */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;

  // ---------------------------------------------------------------- dados dos originais (carregados sob demanda)
  var cache = {}, pedidos = {};
  function json(nome) {
    if (cache[nome]) return Promise.resolve(cache[nome]);
    if (pedidos[nome]) return pedidos[nome];
    pedidos[nome] = Dados.bibliaGet('orig:' + nome).then(function (salvo) {
      if (salvo) return (cache[nome] = salvo);
      return fetch('originais/' + nome + '.json').then(function (r) { if (!r.ok) throw new Error('Não foi possível carregar o texto original agora.'); return r.json(); })
        .then(function (j) { cache[nome] = j; Dados.bibliaPut('orig:' + nome, j); return j; });
    }).catch(function (e) { delete pedidos[nome]; throw e; });
    return pedidos[nome];
  }
  var Orig = {
    livro: function (id) { return json(id); },
    morfologia: function () { return json('morfologia'); },
    lexico: function (strong) { return json(A2Originais.lexicoDe(strong)); },
    palavras: async function (livro, cap, v) { var r = await Promise.all([json(livro), json('morfologia')]); return A2Originais.palavras(r[0], cap, v, r[1]); },
    entrada: async function (strong) {
      var lx = await Orig.lexico(strong), e = lx[strong];
      if (!e) { var b = A2Originais.base(strong); var k = Object.keys(lx).filter(function (x) { return A2Originais.base(x) === b; })[0]; e = k ? lx[k] : null; }
      return e ? { strong: strong, lema: e[0], translit: e[1], classe: A2Originais.classe(e[2]), glosa: e[3], total: e[4], refs: e[5] || [], termo: A2Originais.termo(strong) } : null;
    }
  };
  root.A2Orig = Orig;

  function rtl(strong) { return A2Originais.idioma(strong) === 'hebraico'; }

  // Interlinear de uma passagem (até 6 versículos)
  async function interlinear(ref, alvo) {
    var lista = A2Ref.versiculosDa(ref, Biblia.contagemSinc(Biblia.padrao())).slice(0, 6), el = h('div.interlinear');
    for (var i = 0; i < lista.length; i++) {
      var x = lista[i], ws = await Orig.palavras(x[0], x[1], x[2]);
      var linha = h('div.inter-vers' + (ws.length && rtl(ws[0].strong) ? '.rtl' : ''), h('span.inter-num', x[1] + ':' + x[2]));
      if (!ws.length) linha.appendChild(h('span.sub', 'Sem dados do original para este versículo nesta edição.'));
      ws.forEach(function (w) {
        linha.appendChild(h('button.inter-pal', { 'aria-label': w.original + ', ' + w.translit + ', ' + w.traducao, on: { click: function () { abrirPalavra(w.strong, w) } } },
          h('span.or', w.original), h('span.tl', w.translit), h('span.gl', w.traducao), A2Originais.termo(w.strong) ? h('span.marca-termo', { title: 'Tem explicação em português' }) : null));
      });
      el.appendChild(linha);
    }
    if (alvo) UI.trocar(alvo, el);
    return el;
  }
  function abrirInterlinear(ref) {
    UI.folha('No original — ' + A2Ref.formatar(ref), function () {
      var corpo = h('div.form', h('div.carregando', h('div.giro')));
      interlinear(ref).then(function (el) {
        UI.trocar(corpo, h('p.sub', 'Toque numa palavra para ver o significado, a gramática e onde mais ela aparece. A linha de baixo é uma tradução palavra por palavra em inglês, como na fonte.'), el, creditoEl());
      }, function (e) { UI.trocar(corpo, h('p', e.message)); });
      return corpo;
    }, { cheia: true });
  }
  function creditoEl() { return h('p.sub.credito-orig', A2Originais.CREDITO); }

  // Palavras-chave (com explicação em português) presentes numa passagem
  async function termosDaPassagem(ref) {
    var lista = A2Ref.versiculosDa(ref, Biblia.contagemSinc(Biblia.padrao())).slice(0, 20), vistos = {}, out = [];
    for (var i = 0; i < lista.length; i++) {
      (await Orig.palavras(lista[i][0], lista[i][1], lista[i][2])).forEach(function (w) {
        var b = A2Originais.base(w.strong);
        if (A2Originais.TERMOS[b] && !vistos[b] && !/^(G2316|G3588|G2962|H3068|H0430)$/.test(b)) { vistos[b] = 1; out.push(w); }
      });
    }
    return out;
  }

  // Ficha da palavra original
  function abrirPalavra(strong, ocorrencia) {
    UI.folha('Palavra original', function () {
      var corpo = h('div.form', h('div.carregando', h('div.giro')));
      Orig.entrada(strong).then(async function (e) {
        if (!e) { UI.trocar(corpo, h('p', 'Esta palavra não está no léxico.')); return; }
        var lista = h('div.lista'), mais = null, mostradas = 0;
        function mostrar(n) {
          e.refs.slice(mostradas, mostradas + n).forEach(function (s) {
            var r = A2Originais.refDaOcorrencia(s); if (!r) return;
            var t = h('span.texto-vers', '…');
            lista.appendChild(h('button.item', { on: { click: function () { UI.fecharTodas(); App.abrirBiblia(r.livro, r.cap, r.v1); } } }, h('div.corpo', h('span.titulo', A2Ref.formatar(r)), t)));
            Biblia.textoDe(r).then(function (vs) { t.textContent = vs.map(function (y) { return UI.plano(y.t); }).join(' '); }).catch(function () {});
          });
          mostradas += n;
          if (mais) mais.hidden = mostradas >= e.refs.length;
        }
        mais = h('button.bt.peq', { on: { click: function () { mostrar(20); } } }, 'Mostrar mais');
        mostrar(12);
        UI.trocar(corpo,
          h('div.palavra-topo' + (rtl(strong) ? '.rtl' : ''), h('span.or', e.lema), h('span.tl', e.translit)),
          h('p.sub', A2Originais.idioma(strong) === 'grego' ? 'Grego' : 'Hebraico ou aramaico', ' · ', e.classe, ' · Strong ', strong),
          e.termo ? h('div.cartao.termo-pt', h('span.rotulo', 'Significado'), h('p', e.termo)) : null,
          h('p', h('b', 'Sentido básico (inglês): '), e.glosa),
          ocorrencia ? h('div.cartao', h('span.rotulo', 'Nesta passagem'), h('p', h('b', ocorrencia.original), ' (', ocorrencia.translit, ') — ', ocorrencia.morfologia), h('p.sub', 'Tradução palavra por palavra (inglês): ' + ocorrencia.traducao)) : null,
          h('p.sub', 'O sentido de uma palavra depende do contexto: nem todos os significados possíveis valem em cada ocorrência. Compare as passagens abaixo.'),
          h('div.secao', h('h2', 'Onde aparece (' + e.total + ' ' + (e.total === 1 ? 'vez' : 'vezes') + ')')),
          e.refs.length ? lista : h('p.sub', 'Palavra muito frequente: a lista de ocorrências não é mostrada.'),
          e.refs.length > 12 ? mais : null,
          creditoEl());
      }, function (er) { UI.trocar(corpo, h('p', er.message)); });
      return corpo;
    }, { cheia: true });
  }

  // Busca de palavra original: Strong (G5485), lema, transliteração ou palavra em português das explicações
  async function procurarPalavra(q) {
    q = String(q || '').trim(); if (!q) return [];
    var m = /^([GH])\s?0*(\d{1,4})([A-Za-z]?)$/i.exec(q);
    var lg = await Orig.lexico('G0001'), lh = await Orig.lexico('H0001'), out = [];
    function add(s, lx) { if (lx[s] && out.every(function (o) { return o.strong !== s; })) out.push({ strong: s, lema: lx[s][0], translit: lx[s][1], glosa: lx[s][3], total: lx[s][4] }); }
    if (m) {
      var pre = m[1].toUpperCase(), num = pre + ('0000' + m[2]).slice(-4), lx = pre === 'G' ? lg : lh;
      Object.keys(lx).filter(function (k) { return A2Originais.base(k) === num; }).forEach(function (k) { add(k, lx); });
      return out;
    }
    var n = A2Busca.normalizar(q);
    Object.keys(A2Originais.TERMOS).forEach(function (b) {
      if (A2Busca.normalizar(A2Originais.TERMOS[b].split('.')[0]).split(/[^a-z]+/).indexOf(n) >= 0) {
        var lx = b[0] === 'G' ? lg : lh; Object.keys(lx).filter(function (k) { return A2Originais.base(k) === b; }).sort(function (a, c) { return lx[c][4] - lx[a][4]; }).slice(0, 1).forEach(function (k) { add(k, lx); });
      }
    });
    function semAcento(s) { return A2Busca.normalizar(String(s).normalize('NFD').replace(/[̀-֑ͯ-ׇ]/g, '')); }
    var alvo = semAcento(q);
    [lg, lh].forEach(function (lx) {
      Object.keys(lx).forEach(function (k) { if (out.length < 30 && (semAcento(lx[k][0]) === alvo || semAcento(lx[k][1]).replace(/[^a-z]/g, '') === alvo.replace(/[^a-z]/g, ''))) add(k, lx); });
    });
    return out.sort(function (a, b) { return b.total - a.total; });
  }

  // ---------------------------------------------------------------- doutrinas
  function listaDoutrinas(area) {
    UI.trocar(area,
      h('p.sub', 'Temas em que é importante ver onde está escrito, o contexto e como cada tradição cristã lê os textos. Nenhuma denominação é tratada como padrão.'),
      A2Doutrinas.GRUPOS.map(function (g) {
        return [h('div.secao', h('h2', g)), h('div.lista', A2Doutrinas.DOUTRINAS.filter(function (d) { return d.grupo === g; }).map(function (d) {
          return h('button.item', { on: { click: function () { abrirDoutrina(d.id, area); } } }, ico('livro'), h('div.corpo', h('span.titulo', d.nome), h('span.meta', d.definicao.split('. ')[0] + '.')), ico('direita'));
        }))];
      }));
  }
  function refLink(s) { var r = Biblia.interpretar(s); return r.ok ? h('button.link-ref', { on: { click: function () { App.abrirBiblia(r.ref.livro, r.ref.cap, r.ref.v1); } } }, A2Ref.formatar(r.ref, true)) : null; }
  function abrirDoutrina(id, area) {
    var d = A2Doutrinas.POR_ID[id]; if (!d) return;
    App.registrar('estudo', { titulo: 'Doutrina: ' + d.nome });
    var passagens = h('div.lista', d.p.map(function (x) {
      var r = Biblia.interpretar(x[0]); if (!r.ok) return null;
      var t = h('span.texto-vers', '…');
      Biblia.textoDe(r.ref).then(function (vs) { t.textContent = vs.map(function (y) { return UI.plano(y.t); }).join(' '); });
      return h('button.item', { on: { click: function () { App.abrirBiblia(r.ref.livro, r.ref.cap, r.ref.v1); } } }, h('div.corpo', h('span.titulo', A2Ref.formatar(r.ref)), t, h('span.meta', x[2])));
    }));
    var corte = d.conclusao.indexOf('. '), partes = corte > 0 ? [d.conclusao.slice(0, corte + 1), d.conclusao.slice(corte + 2)] : [d.conclusao];
    UI.trocar(area,
      h('button.bt.peq', { on: { click: function () { listaDoutrinas(area); window.scrollTo(0, 0); } } }, ico('esquerda'), 'Todos os temas'),
      h('div.estudo-topo', h('span.rotulo', 'Doutrinas e controvérsias · ' + d.grupo), h('h2', d.nome)),
      sec('Definição', h('p', d.definicao)),
      sec('Principais passagens', h('div', h('p.sub', 'Texto da ' + Biblia.versao(Biblia.padrao()).nome + '. Toque para ler no capítulo.'), passagens)),
      sec('Contexto', h('p', d.contexto)),
      sec('Como os cristãos leem', h('div', d.leituras.map(function (l) {
        return h('div.cartao.leitura', h('b', l.nome), h('p.sub', l.quem), h('p', l.resumo), h('div.chips', h('span.sub', 'Textos usados: '), l.textos.map(refLink)));
      }))),
      sec('Objeções e dificuldades', h('ul', d.objecoes.map(function (o) { return h('li', o); }))),
      sec('Conclusão equilibrada', h('div.cartao.conclusao', partes.map(function (p, i) { return h('p', i === 0 ? h('b', p) : p); }))),
      d.termos.length ? sec('Palavras nos originais', h('div.chips', d.termos.map(function (s) { var t = A2Originais.TERMOS[s]; return h('button.chip', { on: { click: function () { abrirPalavraBase(s); } } }, t.split('.')[0]); }))) : null,
      h('div.linha-bts', h('button.bt', { on: { click: function () { App.compartilhar(doutrinaEmTexto(d), 'Compartilhar estudo'); } } }, ico('compartilhar'), 'Compartilhar'),
        h('button.bt', { on: { click: function () { salvarDoutrina(d); } } }, ico('nota'), 'Salvar nos estudos'),
        h('button.bt', { on: { click: function () { App.estado.assistenteModo = 'bereano'; App.estado.bereanoTexto = ''; App.recarregar(); } } }, ico('escudo'), 'Examinar uma afirmação')));
    window.scrollTo(0, 0);
  }
  async function abrirPalavraBase(b) {
    var lx = await Orig.lexico(b), k = Object.keys(lx).filter(function (x) { return A2Originais.base(x) === b; }).sort(function (a, c) { return lx[c][4] - lx[a][4]; })[0];
    if (k) abrirPalavra(k);
  }
  function sec(t, c) { return c ? h('section.estudo-sec', h('h3', t), c) : null; }
  function doutrinaEmTexto(d) {
    return [d.nome, '', d.definicao, '', 'Passagens: ' + d.p.map(function (x) { return x[0]; }).join('; '), '',
      d.leituras.map(function (l) { return l.nome + ' (' + l.quem + '): ' + l.resumo; }).join('\n'), '', d.conclusao, '', '— ATOS 2 · Doutrinas e controvérsias. Examine nas Escrituras (At 17:11).'].join('\n');
  }
  function salvarDoutrina(d) {
    Dados.salvar('estudos', UI.uid(), { titulo: d.nome, categoria: 'Doutrinas', corpo: doutrinaEmTexto(d),
      refs: d.p.map(function (x) { var r = Biblia.interpretar(x[0]); return r.ok ? { ref: A2Ref.formatar(r.ref), nota: x[2] } : null; }).filter(Boolean),
      origem: 'pessoal', criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() });
    UI.aviso('Salvo em Biblioteca › Estudos.');
  }

  // ---------------------------------------------------------------- modo Bereano (sem IA)
  async function bereanoGuia(afirmacao, area) {
    UI.trocar(area, h('div.carregando', h('div.giro')));
    var temas = A2Doutrinas.procurar(afirmacao, A2Busca.normalizar);
    var termos = A2Assistente.termosDaPergunta(afirmacao, A2Busca.normalizar);
    var v = Biblia.padrao(), livros = await Biblia.todosOsLivros(v), opc = { limite: 300, grafiaAntiga: /^alm1911/.test(v) };
    var exata = A2Busca.pesquisar(livros, '"' + afirmacao.replace(/["“”?!.]/g, '').trim() + '"', opc);
    var todas = termos.length ? A2Busca.pesquisar(livros, termos.join(' '), opc) : { total: 0, resultados: [] };
    var cada = termos.map(function (t) { return { t: t, n: A2Busca.pesquisar(livros, t, { limite: 1, grafiaAntiga: opc.grafiaAntiga }).total }; });
    var achados = (todas.resultados.length ? todas.resultados : []).slice(0, 10);
    var lista = h('div.lista', achados.map(function (x) {
      return h('button.item', { on: { click: function () { App.abrirBiblia(x.livro, x.cap, x.v); } } }, h('div.corpo', h('span.titulo', A2Ref.formatar({ livro: x.livro, cap: x.cap, v1: x.v, v2: x.v })), h('span.texto-vers', x.texto)));
    }));
    App.registrar('estudo', { titulo: 'Bereano: ' + afirmacao.slice(0, 60) });
    UI.trocar(area,
      h('div.cartao.bereano-afirmacao', h('span.rotulo', 'Afirmação examinada'), h('p', h('b', '“' + afirmacao + '”'))),
      sec('1. Está escrito com essas palavras?', h('div',
        h('p', exata.total ? h('span', 'Sim. A frase aparece em ', h('b', exata.total + ' versículo(s)'), ' da ' + Biblia.versao(v).sigla + '. Confira se o contexto diz o mesmo que a afirmação.')
          : 'A frase exata não aparece na ' + Biblia.versao(v).sigla + '. Isso não a torna falsa: pode ser uma conclusão tirada de vários textos. Por isso, veja os passos seguintes.'),
        exata.resultados.slice(0, 5).map(function (x) { return h('p', refLink(A2Ref.formatar({ livro: x.livro, cap: x.cap, v1: x.v, v2: x.v }, true)), ' ', h('span.texto-vers', x.texto)); }),
        cada.length ? h('p.sub', 'Palavras da afirmação na Bíblia: ' + cada.map(function (c) { return c.t + ' (' + c.n + ')'; }).join(', ') + '.') : null)),
      sec('2. Passagens que falam disso', achados.length ? h('div', h('p.sub', 'Versículos com todas as palavras principais. Leia cada um no capítulo, não isolado.'), lista,
        todas.total > achados.length ? h('button.bt.peq', { on: { click: function () { Telas.pesquisa.abrir(termos.join(' ')); } } }, ico('busca'), 'Ver todos os ' + todas.total) : null)
        : h('p.sub', 'Nenhum versículo reúne todas as palavras principais. Tente palavras mais simples ou veja os temas abaixo.')),
      sec('3. O que os cristãos já estudaram sobre isso', temas.length ? h('div', temas.slice(0, 3).map(function (d) {
        return h('div.cartao.leitura', h('b', d.nome), h('p', d.conclusao), h('button.bt.peq', { on: { click: function () { App.estado.assistenteModo = 'doutrinas'; App.estado.doutrinaAberta = d.id; App.recarregar(); } } }, 'Ver passagens e leituras'));
      })) : h('p.sub', 'Não há um tema curado ligado a esta afirmação.')),
      sec('4. Perguntas para examinar', h('ol.passos-bereanos',
        h('li', 'O texto diz isso de forma explícita, ou essa é uma conclusão tirada dele?'),
        h('li', 'Quem fala, para quem e em que situação? Leia o capítulo inteiro.'),
        h('li', 'Outras passagens confirmam, equilibram ou limitam essa ideia?'),
        h('li', 'O sentido se mantém em outras traduções? Compare.'),
        h('li', 'Cristãos fiéis à Escritura leem esse ponto de formas diferentes? Então seja firme no que é claro e humilde no que é debatido.'),
        h('li', 'A afirmação leva a amar mais a Deus e ao próximo, como a Escritura ensina?'))),
      h('div.aviso-ia', ico('escudo'), h('span', '“Examinavam cada dia as Escrituras para ver se estas coisas eram assim” (At 17:11). O app mostra onde procurar; a conclusão é sua, com oração, estudo e conversa com sua igreja.')));
  }

  root.Teologia = { Orig: Orig, interlinear: interlinear, abrirInterlinear: abrirInterlinear, abrirPalavra: abrirPalavra, termosDaPassagem: termosDaPassagem, procurarPalavra: procurarPalavra,
    listaDoutrinas: listaDoutrinas, abrirDoutrina: abrirDoutrina, bereanoGuia: bereanoGuia, creditoEl: creditoEl };
})(window);
