/* ATOS 2 — Estudo do versículo: conteúdo das abas do painel que abre ao selecionar uma passagem na Bíblia.
   Contexto (livro, seção e versículos ao redor), Palavras (originais com explicação em português e interlinear),
   Referências (cruzadas da Almeida 1911 e outras traduções) e Interpretação (notas da tradução, doutrinas, temas
   e perguntas para examinar o texto). Tudo vem dos dados do app; nada é inventado e o texto é sempre o da tradução. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;
  var ABAS = [['contexto', 'Contexto', 'mapa'], ['palavras', 'Palavras', 'texto'], ['referencias', 'Referências', 'colecao'], ['interpretacao', 'Interpretação', 'luz']];
  var cache = {};

  function sigla(v) { return Biblia.versao(v || Biblia.padrao()).sigla; }
  function sec(titulo, sub, conteudo) { return conteudo ? h('section.ev-sec', h('h4', titulo), sub ? h('p.ev-sub', sub) : null, conteudo) : null; }
  function mesmaPassagem(a, b) {
    if (a.livro !== b.livro || a.cap !== b.cap) return false;
    if (a.v1 == null || b.v1 == null) return true;
    return a.v1 <= (b.v2 || b.v1) && b.v1 <= (a.v2 || a.v1);
  }
  function irPara(rr, fechar) { if (fechar) fechar(); App.abrirBiblia(rr.livro, rr.cap, rr.v1); }

  async function livro1911(livro) { await Biblia.indice('alm1911at'); return Biblia.livro(livro, 'alm1911at'); }
  function secoesDoCapitulo(l1911, cap) {
    var cabs = (l1911 && l1911.cab) || {}, out = [];
    Object.keys(cabs).forEach(function (k) { var cv = k.split(':'); if (+cv[0] === cap) cabs[k].forEach(function (c) { out.push({ v: +cv[1], t: c.t }); }); });
    return out.sort(function (a, b) { return a.v - b.v; });
  }

  // ---------------------------------------------------------------- Contexto
  async function contexto(ref, op) {
    var v = Biblia.padrao(), lv = A2Ref.POR_ID[ref.livro], intro = A2Assistente.INTRODUCOES[ref.livro];
    var nVs = Biblia.contagemSinc(v)(ref.livro)[ref.cap - 1], de = Math.max(1, ref.v1 - 2), ate = Math.min(nVs, ref.v2 + 2);
    var redor = await Biblia.textoDe({ livro: ref.livro, cap: ref.cap, v1: de, v2: ate, cap2: ref.cap }, v);
    var trecho = h('p.trecho.ev-trecho');
    redor.forEach(function (y, i) {
      if (i) trecho.appendChild(document.createTextNode(' '));
      var sp = h('span' + (y.v >= ref.v1 && y.v <= ref.v2 ? '.alvo' : '')); sp.appendChild(h('sup', y.v)); sp.appendChild(UI.textoComItalico(y.t)); trecho.appendChild(sp);
    });
    var estrutura = [], secao = null;
    try { estrutura = secoesDoCapitulo(await livro1911(ref.livro), ref.cap); } catch (e) { /* sem internet */ }
    estrutura.forEach(function (x) { if (x.v <= ref.v1) secao = x; });
    var nt = A2Ref.LIVROS.map(function (l) { return l.id; }).indexOf(ref.livro) >= 39;
    return h('div.ev-conteudo',
      secao ? h('div.ev-onde', h('span.ev-rot', 'Nesta parte do capítulo'), h('b', secao.t), h('small', 'a partir do v. ' + secao.v + ' · subtítulo da Almeida 1911')) : null,
      sec('Antes e depois', 'Leia o que vem antes e depois: o contexto ajuda a entender o sentido.', trecho),
      intro ? sec('O livro de ' + lv.nome, null, h('div.ev-ficha',
        h('p', h('b', 'Autoria. '), intro.autoria), h('p', h('b', 'Época. '), intro.epoca), h('p', h('b', 'Tema. '), intro.tema),
        h('p.ev-sub', (nt ? 'Novo' : 'Antigo') + ' Testamento · ficha redigida pela equipe do ATOS 2.'))) : null,
      estrutura.length > 1 ? sec('Estrutura do capítulo ' + ref.cap, null, h('ol.estrutura', estrutura.map(function (x) {
        return h('li' + (secao && x.v === secao.v ? '.atual' : ''), h('button.link-ref', { on: { click: function () { irPara({ livro: ref.livro, cap: ref.cap, v1: x.v }, op.fechar); } } }, 'v. ' + x.v), ' ', x.t);
      }))) : null);
  }

  // ---------------------------------------------------------------- Palavras
  async function palavras(ref) {
    var termos = [], erro = null;
    try { termos = await Teologia.termosDaPassagem(ref); } catch (e) { erro = e; }
    var inter = h('div', h('div.carregando', h('div.giro')));
    Teologia.interlinear(ref, inter).catch(function (e) { UI.trocar(inter, h('p.ev-sub', e.message)); });
    return h('div.ev-conteudo',
      termos.length ? sec('Palavras-chave', 'Explicação em português. Toque para ver a gramática e onde mais a palavra aparece.', h('div.ev-termos', termos.slice(0, 8).map(function (w) {
        return h('button.ev-termo', { on: { click: function () { Teologia.abrirPalavra(w.strong, w); } } },
          h('span.ev-or' + (A2Originais.idioma(w.strong) === 'hebraico' ? '.rtl' : ''), w.original), h('span.ev-tl', w.translit + ' · ' + w.strong), h('span.ev-exp', A2Originais.termo(w.strong)));
      }))) : (erro ? h('p.ev-sub', erro.message) : null),
      sec('Palavra por palavra', 'Texto ' + (A2Ref.LIVROS.map(function (l) { return l.id; }).indexOf(ref.livro) >= 39 ? 'grego (Textus Receptus)' : 'hebraico (Leningrado)') + '. A linha de baixo é a tradução palavra por palavra em inglês da fonte.', inter),
      Teologia.creditoEl());
  }

  // ---------------------------------------------------------------- Referências
  async function referencias(ref, op) {
    var v = Biblia.padrao(), lv = A2Ref.POR_ID[ref.livro], cruz = [];
    try {
      var l = await livro1911(ref.livro), vistos = {};
      A2Ref.versiculosDa(ref, Biblia.contagemSinc('alm1911at')).slice(0, 12).forEach(function (x) {
        ((l.notas || {})[x[1] + ':' + x[2]] || []).forEach(function (n) {
          if (n.tipo !== 'ref') return;
          A2Assistente.refsDaNota1911(n.t, lv.abrev, x[1]).forEach(function (s) {
            var rr = Biblia.interpretar(s);
            if (rr.ok && !rr.soLivro && !vistos[s] && cruz.length < 15 && !mesmaPassagem(rr.ref, ref)) { vistos[s] = 1; cruz.push(rr.ref); }
          });
        });
      });
    } catch (e) { /* sem internet */ }
    var lista = cruz.length ? h('div.ev-cruzadas', cruz.map(function (rr) {
      var t = h('span.ev-cruz-txt', '…');
      Biblia.textoDe(rr, v).then(function (vs) { t.textContent = vs.slice(0, 2).map(function (y) { return UI.plano(y.t); }).join(' ') + (vs.length > 2 ? ' …' : ''); }, function () { t.textContent = ''; });
      return h('button.ev-cruz', { on: { click: function () { irPara(rr, op.fechar); } } }, h('b', A2Ref.formatar(rr)), t);
    })) : h('p.ev-sub', 'A Almeida 1911 não indica referências cruzadas para este trecho.');
    var outras = h('div.ev-trads');
    Biblia.ativas().filter(function (x) { return x.id !== v && x.id !== 'alm1911'; }).forEach(function (x) {
      Biblia.indice(x.id).then(function () { return Biblia.textoDe(ref, x.id); }).then(function (vs) {
        var p = h('p'); vs.slice(0, 6).forEach(function (y, i) { if (i) p.appendChild(document.createTextNode(' ')); p.appendChild(h('sup', y.v)); p.appendChild(UI.textoComItalico(y.t)); });
        outras.appendChild(h('div.ev-trad', h('span.ev-rot', x.sigla), p));
      }).catch(function () {});
    });
    return h('div.ev-conteudo',
      sec('Referências cruzadas', 'Passagens sobre o mesmo assunto, indicadas pela edição Almeida de 1911. Toque para abrir.', lista),
      sec('Em outras traduções', 'Comparar traduções ajuda a perceber o sentido das palavras.', outras));
  }

  // ---------------------------------------------------------------- Interpretação
  async function interpretacao(ref, op) {
    var v = Biblia.padrao(), notas = [];
    try {
      var l = await Biblia.livro(ref.livro, v);
      A2Ref.versiculosDa(ref, Biblia.contagemSinc(v)).slice(0, 12).forEach(function (x) {
        ((l.notas || {})[x[1] + ':' + x[2]] || []).forEach(function (n) { if (n.tipo !== 'ref') notas.push({ v: x[2], t: n.t, k: n.k }); });
      });
    } catch (e) { /* sem internet */ }
    var noVers = [], noCap = [];
    A2Doutrinas.DOUTRINAS.forEach(function (d) {
      var achou = 0;
      d.p.forEach(function (x) { var rr = Biblia.interpretar(x[0]); if (!rr.ok) return; if (mesmaPassagem(rr.ref, ref)) achou = 2; else if (!achou && rr.ref.livro === ref.livro && rr.ref.cap === ref.cap) achou = 1; });
      if (achou === 2) noVers.push(d); else if (achou === 1) noCap.push(d);
    });
    var ligados = [];
    A2Conteudo.TEMAS.forEach(function (t) { if (t.refs.some(function (s) { var rr = Biblia.interpretar(s); return rr.ok && mesmaPassagem(rr.ref, ref); })) ligados.push(['Tema: ' + t.nome, function () { if (op.fechar) op.fechar(); Telas.pesquisa.abrir('', { tema: t.id }); }]); });
    A2Conteudo.PERSONAGENS.forEach(function (p) { if (p.refs.some(function (s) { var rr = Biblia.interpretar(s); return rr.ok && rr.ref.livro === ref.livro && rr.ref.cap === ref.cap; })) ligados.push([p.nome, function () { if (op.fechar) op.fechar(); Telas.pesquisa.abrir('', { personagem: p.nome }); }]); });
    function chipDoutrina(d) { return h('button.chip', { on: { click: function () { if (op.fechar) op.fechar(); App.estado.assistenteModo = 'doutrinas'; App.estado.doutrinaAberta = d.id; App.ir('assistente'); } } }, ico('colecao'), d.nome); }
    var refTxt = A2Ref.formatar(ref, true);
    return h('div.ev-conteudo',
      h('p.ev-aviso', ico('escudo'), h('span', 'O Atos 2 não impõe uma interpretação: mostra o texto, o contexto, as notas da tradução e onde as tradições cristãs divergem. Examine e conclua com oração e estudo.')),
      notas.length ? sec('Notas da tradução (' + sigla(v) + ')', null, h('div', notas.slice(0, 8).map(function (n) { return h('p.ev-nota', h('b', 'v. ' + n.v + (n.k ? ' “' + n.k + '”' : '') + ': '), n.t); }))) : null,
      noVers.length ? sec('Doutrinas que usam este texto', 'Cada doutrina mostra definição, passagens, leituras das tradições e objeções.', h('div.chips.quebra', noVers.map(chipDoutrina))) : null,
      noCap.length ? sec('Doutrinas ligadas a este capítulo', null, h('div.chips.quebra', noCap.slice(0, 6).map(chipDoutrina))) : null,
      ligados.length ? sec('Temas e personagens', null, h('div.chips.quebra', ligados.map(function (x) { return h('button.chip', { on: { click: x[1] } }, x[0]); }))) : null,
      sec('Para examinar o texto', 'Perguntas do estudo indutivo, para você responder com o próprio texto.', h('ol.ev-perguntas',
        h('li', 'Quem fala, a quem e em que situação?'), h('li', 'O que o texto diz, com as palavras dele? Que palavras se repetem?'),
        h('li', 'O que significava para os primeiros leitores, lido com os versículos ao redor?'), h('li', 'Que outras passagens tratam do mesmo assunto, e o que acrescentam?'),
        h('li', 'O que este texto ensina sobre Deus, e como ele muda a minha vida hoje?'))),
      h('div.linha-bts', h('button.bt.peq', { on: { click: function () { if (op.fechar) op.fechar(); App.estado.assistenteModo = 'bereano'; App.ir('assistente'); } } }, ico('escudo'), 'Examinar uma afirmação no Modo Bereano')),
      h('p.ev-sub', 'Para um estudo completo de ' + refTxt + ' (contexto, palavras-chave, leituras e aplicação), use “Estudar com o Assistente”.'));
  }

  var FUNCOES = { contexto: contexto, palavras: palavras, referencias: referencias, interpretacao: interpretacao };
  // Monta a aba no elemento; usa cache por passagem, tradução e aba
  async function mostrar(aba, ref, el, op) {
    op = op || {};
    var k = aba + '|' + Biblia.padrao() + '|' + A2Ref.formatar(ref, true);
    UI.trocar(el, h('div.carregando', h('div.giro'), h('span', 'Preparando o estudo…')));
    try {
      if (!cache[k]) cache[k] = FUNCOES[aba](ref, op);
      var conteudo = await cache[k];
      if (conteudo.isConnected && conteudo.parentNode !== el) { delete cache[k]; conteudo = await (cache[k] = FUNCOES[aba](ref, op)); }
      UI.trocar(el, conteudo);
    } catch (e) {
      delete cache[k];
      UI.trocar(el, h('p.ev-sub', 'Não foi possível montar esta parte agora: ' + e.message));
    }
  }
  root.EstudoVersiculo = { ABAS: ABAS, mostrar: mostrar, limparCache: function () { cache = {}; } };
})(window);
