/* ATOS 2 — Pesquisa bíblica: referência, palavras, expressão exata, temas e personagens. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;
  var todosPor = {}; // texto completo carregado, por tradução

  // opcoes: { tema: id } ou { personagem: nome } abre direto o tema/personagem curado
  function abrir(inicial, opcoes) {
    UI.folha('Pesquisar', function (api) {
      var entrada = h('input.entrada#pesq', { type: 'search', placeholder: 'Palavra, “expressão exata” ou referência', autocomplete: 'off', enterkeyhint: 'search' });
      entrada.value = inicial || '';
      var escopo = 'todos', inicio = false;
      var resultados = h('div.lista', { 'aria-live': 'polite' });
      var chipsEscopo = h('div.chips', [['todos', 'Toda a Bíblia'], ['AT', 'Antigo Testamento'], ['NT', 'Novo Testamento'], ['evangelhos', 'Evangelhos'], ['atos-cartas', 'Atos e cartas']].map(function (e) {
        return h('button.chip', { 'aria-pressed': String(e[0] === escopo), on: { click: function (ev) { escopo = e[0]; marcar(ev.target); executar(); } } }, e[1]);
      }));
      var variacoes = h('input.interruptor#pesq-var', { type: 'checkbox' });
      variacoes.addEventListener('change', function () { inicio = variacoes.checked; executar(); });
      function marcar(b) { b.parentNode.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }

      var form = h('form', { role: 'search', on: { submit: function (e) { e.preventDefault(); entrada.blur(); executar(); } } },
        h('label.sr', { for: 'pesq' }, 'Pesquisar'), h('div.busca-campo', ico('busca'), entrada));
      var sugestoes = h('div.form',
        h('div.rotulo', 'Temas'),
        h('div.chips', { style: { flexWrap: 'wrap' } }, A2Conteudo.TEMAS.map(function (t) { return h('button.chip', { on: { click: function () { tema(t); } } }, t.nome); })),
        h('div.rotulo', 'Personagens'),
        h('div.chips', { style: { flexWrap: 'wrap' } }, A2Conteudo.PERSONAGENS.map(function (p) { return h('button.chip', { on: { click: function () { personagem(p); } } }, p.nome); })),
        h('p.sub', 'Dicas: “partir do pão” entre aspas procura a expressão exata. Uma referência como Jo 3:16 ou Sl 23 abre direto o capítulo. A pesquisa ignora acentos e maiúsculas.'));

      var timer;
      entrada.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(executar, 350); });

      function livrosDoEscopo() {
        var m = { AT: A2Planos.AT, NT: A2Planos.NT, evangelhos: ['MAT', 'MRK', 'LUK', 'JHN'], 'atos-cartas': A2Planos.NT.filter(function (x) { return ['MAT', 'MRK', 'LUK', 'JHN', 'REV'].indexOf(x) < 0; }) };
        return m[escopo] ? new Set(m[escopo]) : null;
      }

      async function executar() {
        var q = entrada.value.trim();
        if (!q) { resultados.replaceChildren(); sugestoes.hidden = false; return; }
        sugestoes.hidden = true;
        var itens = [];
        // referência?
        var r = Biblia.interpretar(q);
        if (r.ok && (/\d/.test(q) || (r.soLivro && !A2Ref.lerLivro(q).resto.trim()))) {
          itens.push(h('button.item', { on: { click: function () { api.fechar(); App.abrirBiblia(r.ref.livro, r.ref.cap, r.ref.v1); } } }, ico('livro'),
            h('div.corpo', h('span.meta', 'Referência'), h('span.titulo', 'Abrir ' + A2Ref.formatar(r.ref)), r.ref.v1 ? h('span.texto-vers.prev', '…') : null), ico('direita')));
          if (r.ref.v1) Biblia.textoDe(r.ref).then(function (vs) { var el = itens[0].querySelector('.prev'); if (el) el.textContent = vs.map(function (x) { return UI.plano(x.t); }).join(' '); });
        }
        resultados.replaceChildren.apply(resultados, itens.concat([h('div.carregando', h('div.giro'), h('span.prog', 'Preparando a pesquisa…'))]));
        try {
          var vId = Biblia.padrao();
          if (!todosPor[vId]) todosPor[vId] = await Biblia.todosOsLivros(vId, function (i, n) { var p = resultados.querySelector('.prog'); if (p) p.textContent = 'Carregando a Bíblia para pesquisar (' + i + ' de ' + n + ')…'; });
        } catch (e) { resultados.replaceChildren.apply(resultados, itens.concat([h('div.vazio', h('b', 'Não foi possível pesquisar agora.'), e.message)])); return; }
        if (q !== entrada.value.trim()) return;
        var antiga = !!Biblia.versao(vId).grafiaAntiga;
        var res = A2Busca.pesquisar(todosPor[vId], q, { inicio: inicio, livros: livrosDoEscopo(), limite: 300, grafiaAntiga: antiga });
        App.registrar('busca', { titulo: q });
        var cab = h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 2px' } },
          h('b', res.total ? res.total + ' versículo' + (res.total > 1 ? 's' : '') : 'Nenhum versículo encontrado'),
          res.total > res.resultados.length ? h('span.sub', '(mostrando os primeiros ' + res.resultados.length + ')') : null,
          h('span.sub', { style: { marginLeft: 'auto' } }, Biblia.versao(vId).sigla));
        var dicaAntiga = antiga ? h('p.sub', { style: { margin: '0 2px 6px' } }, 'Almeida 1911: pode digitar na grafia de hoje. “cristo” também encontra “Christo”; “batismo”, “baptismo”; “igreja”, “egreja”.') : null;
        var porLivro = Object.keys(res.porLivro).length > 1 ? h('div.chips', Object.keys(res.porLivro).map(function (b) { return h('span.selo', A2Ref.POR_ID[b].abrev + ' ' + res.porLivro[b]); })) : null;
        var lista = res.resultados.map(function (x) {
          var t = h('span.texto-vers');
          A2Busca.partes(x.texto, x.trechos).forEach(function (p) { t.appendChild(p.destaque ? h('mark', p.t) : document.createTextNode(p.t)); });
          return h('button.item', { on: { click: function () { api.fechar(); App.abrirBiblia(x.livro, x.cap, x.v); } } },
            h('div.corpo', h('span.titulo', A2Ref.formatar({ livro: x.livro, cap: x.cap, v1: x.v, v2: x.v })), t));
        });
        if (!res.total && !itens.length) lista = [h('div.vazio', h('b', 'Nada encontrado.'), h('span', inicio ? 'Tente outra palavra.' : 'Ative “Incluir variações” para achar também palavras que começam assim (ex.: batiz → batizado, batismo).'))];
        resultados.replaceChildren.apply(resultados, itens.concat([cab, dicaAntiga, porLivro], lista).filter(Boolean));
      }

      function tema(t) {
        sugestoes.hidden = true;
        var lista = h('div.lista');
        resultados.replaceChildren(h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, h('b', { style: { fontSize: '18px' } }, t.nome), h('div', { style: { flex: 1 } }),
          h('button.bt.peq', { on: { click: function () { entrada.value = t.termos[0].replace(/[^a-zà-ú]/gi, ''); variacoes.checked = inicio = true; executar(); } } }, 'Buscar a palavra em toda a Bíblia')),
          h('p.sub', 'Passagens selecionadas sobre o tema. O texto é sempre o da tradução, sem comentários.'), lista);
        t.refs.forEach(function (s) {
          var r = Biblia.interpretar(s).ref, t2 = h('span.texto-vers', '…');
          lista.appendChild(h('button.item', { on: { click: function () { api.fechar(); App.abrirBiblia(r.livro, r.cap, r.v1); } } }, h('div.corpo', h('span.titulo', A2Ref.formatar(r)), t2)));
          Biblia.textoDe(r).then(function (vs) { t2.textContent = vs.map(function (x) { return UI.plano(x.t); }).join(' '); });
        });
      }
      function personagem(p) {
        sugestoes.hidden = true;
        resultados.replaceChildren(h('b', { style: { fontSize: '18px' } }, p.nome),
          h('p.sub', 'Capítulos onde a história de ' + p.nome.split(',')[0] + ' é contada:'),
          h('div.lista', p.refs.map(function (s) { var r = Biblia.interpretar(s).ref; return h('button.item', { on: { click: function () { api.fechar(); App.abrirBiblia(r.livro, r.cap); } } }, ico('livro'), h('div.corpo', h('span.titulo', A2Ref.formatar(r))), ico('direita')); })),
          h('button.bt', { on: { click: function () { entrada.value = p.termo; executar(); } } }, ico('busca'), 'Todas as menções de “' + p.termo + '”'));
      }

      if (inicial) setTimeout(executar, 0);
      if (opcoes && opcoes.tema) { var tt = A2Conteudo.TEMAS.filter(function (x) { return x.id === opcoes.tema; })[0]; if (tt) setTimeout(function () { tema(tt); }, 0); }
      if (opcoes && opcoes.personagem) { var pp = A2Conteudo.PERSONAGENS.filter(function (x) { return x.nome === opcoes.personagem; })[0]; if (pp) setTimeout(function () { personagem(pp); }, 0); }
      return h('div.form', form, chipsEscopo, h('label.chave', { for: 'pesq-var' }, h('div', h('span', 'Incluir variações'), h('small', 'Palavras que começam com o termo')), variacoes), sugestoes, resultados);
    }, { cheia: true });
  }

  root.Telas.pesquisa = { abrir: abrir };
})(window);
