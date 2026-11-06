/* ATOS 2 — Biblioteca: favoritos e coleções, destaques, anotações, estudos, planos, devocionais e histórico. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;
  var SECOES = [['favoritos', 'Favoritos'], ['planos', 'Planos'], ['devocionais', 'Devocionais'], ['notas', 'Anotações'], ['estudos', 'Estudos'], ['destaques', 'Destaques'], ['historico', 'Histórico']];

  function render(tela) {
    var secao = App.estado.secaoBiblioteca || 'favoritos';
    tela.appendChild(h('header.cab', h('h1', 'Biblioteca'), h('div.esp'),
      h('button.bt-ico', { 'aria-label': 'Pesquisar no que você salvou', on: { click: buscarSalvos } }, ico('busca'))));
    tela.appendChild(h('div.chips', SECOES.map(function (s) {
      return h('button.chip', { 'aria-pressed': String(s[0] === secao), on: { click: function () { App.estado.secaoBiblioteca = s[0]; App.recarregar(); } } }, s[1]);
    })));
    var area = h('div', { style: { marginTop: '12px' } }); tela.appendChild(area);
    ({ favoritos: favoritos, planos: function (a) { Telas.planos.lista(a); }, devocionais: function (a) { Telas.devocionais.secao(a); }, notas: notas, estudos: estudos, destaques: destaques, historico: historico })[secao](area);
    App.aoMudar(function (c) {
      var relevantes = { favoritos: ['favoritos', 'colecoes'], notas: ['notas'], estudos: ['estudos'], destaques: ['destaques'], historico: ['historico'], planos: ['planos'], devocionais: ['devSalvos', 'devLidos'] }[secao] || [];
      if (relevantes.indexOf(c) >= 0 || c === '*') App.atualizar();
    });
  }

  // texto de uma chave de versículo
  function textoVersiculo(k, el) {
    var d = A2Ref.deChave(k);
    Biblia.livro(d.livro).then(function (lv) { el.textContent = UI.plano(lv.caps[d.cap - 1][d.v - 1] || ''); }, function () { el.textContent = '(texto indisponível sem conexão)'; });
  }
  function refDeChave(k) { var d = A2Ref.deChave(k); return { livro: d.livro, cap: d.cap, v1: d.v, v2: d.v }; }

  // ---------------------------------------------------------------- favoritos e coleções
  function favoritos(area) {
    var cols = Dados.todos('colecoes').sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    var filtro = App.estado.colecao || 'todas';
    var favs = Dados.todos('favoritos').sort(function (a, b) { return String(b.criadoEm).localeCompare(String(a.criadoEm)); });
    if (filtro !== 'todas') favs = favs.filter(function (f) { return (f.colecoes || []).indexOf(filtro) >= 0; });
    area.appendChild(h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
      h('div.chips', { style: { flex: 1 } },
        h('button.chip', { 'aria-pressed': String(filtro === 'todas'), on: { click: function () { App.estado.colecao = 'todas'; App.recarregar(); } } }, 'Todos'),
        cols.map(function (c) { return h('button.chip', { 'aria-pressed': String(filtro === c.id), on: { click: function () { App.estado.colecao = c.id; App.recarregar(); } } }, c.nome); })),
      h('button.bt.peq', { on: { click: novaColecao } }, ico('mais'), 'Coleção')));
    if (filtro !== 'todas') {
      var col = cols.filter(function (c) { return c.id === filtro; })[0];
      if (col) area.appendChild(h('div.linha-bts', { style: { margin: '8px 0' } },
        h('button.bt.peq', { on: { click: async function () { var n = await UI.perguntar('Renomear coleção', 'Nome', col.nome); if (n) Dados.salvar('colecoes', col.id, { nome: n }); } } }, ico('editar'), 'Renomear'),
        h('button.bt.peq.perigo', { on: { click: async function () { if (await UI.confirmar('Excluir coleção', 'Os versículos continuam nos favoritos; só a coleção é removida.', 'Excluir', true)) { Dados.todos('favoritos').forEach(function (f) { if ((f.colecoes || []).indexOf(col.id) >= 0) Dados.salvar('favoritos', f.id, Object.assign({}, f, { colecoes: f.colecoes.filter(function (x) { return x !== col.id; }) })); }); Dados.excluir('colecoes', col.id); App.estado.colecao = 'todas'; App.recarregar(); } } } }, ico('lixo'), 'Excluir coleção')));
    }
    if (!favs.length) { area.appendChild(h('div.vazio', h('b', filtro === 'todas' ? 'Nenhum versículo favorito.' : 'Esta coleção está vazia.'), h('span', 'Na Bíblia, toque em um versículo e escolha Favoritar.'), h('button.bt', { on: { click: function () { App.ir('biblia'); } } }, 'Abrir a Bíblia'))); return; }
    area.appendChild(h('p.sub', { style: { margin: '8px 2px' } }, favs.length + ' versículo' + (favs.length > 1 ? 's' : '')));
    area.appendChild(h('div.lista', favs.map(function (f) {
      var t = h('span.texto-vers', '…'); textoVersiculo(f.id, t);
      var nomesCol = (f.colecoes || []).map(function (id) { var c = cols.filter(function (x) { return x.id === id; })[0]; return c ? c.nome : null; }).filter(Boolean);
      return h('div.item',
        h('div.corpo', h('span.titulo', A2Ref.formatar(refDeChave(f.id))), t, nomesCol.length ? h('div.chips', nomesCol.map(function (n) { return h('span.selo', n); })) : null,
          h('div.linha-bts', { style: { marginTop: '4px' } },
            h('button.bt.peq', { on: { click: function () { var r = refDeChave(f.id); App.abrirBiblia(r.livro, r.cap, r.v1); } } }, ico('livro'), 'Abrir'),
            h('button.bt.peq', { on: { click: function () { escolherColecoes(f, cols); } } }, ico('colecao'), 'Coleções'),
            h('button.bt.peq', { on: { click: function () { Telas.criar.comVersiculo(A2Ref.formatar(refDeChave(f.id), true)); } } }, ico('imagem'), 'Arte'),
            h('button.bt.peq.fant.perigo', { 'aria-label': 'Remover dos favoritos', on: { click: function () { Dados.excluir('favoritos', f.id); } } }, ico('lixo')))));
    })));
  }
  async function novaColecao() {
    var n = await UI.perguntar('Nova coleção', 'Nome da coleção', '', { ok: 'Criar' });
    if (n) { var id = UI.uid(); Dados.salvar('colecoes', id, { nome: n }); App.estado.colecao = id; App.recarregar(); }
  }
  function escolherColecoes(f, cols) {
    UI.folha('Coleções de ' + A2Ref.formatar(refDeChave(f.id)), function (api) {
      var marcadas = new Set(f.colecoes || []);
      var lista = h('div.form', cols.length ? cols.map(function (c) {
        var cb = h('input.interruptor#col-' + c.id, { type: 'checkbox' }); cb.checked = marcadas.has(c.id);
        cb.addEventListener('change', function () { if (cb.checked) marcadas.add(c.id); else marcadas.delete(c.id); Dados.salvar('favoritos', f.id, Object.assign({}, f, { colecoes: Array.from(marcadas) })); });
        return h('label.chave', { for: 'col-' + c.id }, h('span', c.nome), cb);
      }) : h('p.sub', 'Você ainda não criou coleções.'));
      lista.appendChild(h('button.bt', { on: { click: async function () { api.fechar(); await novaColecao(); } } }, ico('mais'), 'Nova coleção'));
      return lista;
    });
  }

  // ---------------------------------------------------------------- destaques
  function destaques(area) {
    var ds = Dados.todos('destaques');
    if (!ds.length) { area.appendChild(h('div.vazio', h('b', 'Nenhum destaque.'), h('span', 'Na Bíblia, selecione versículos e escolha Destacar.'))); return; }
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
  function notas(area) {
    var ns = Dados.todos('notas').sort(function (a, b) { return String(b.atualizadoEm || '').localeCompare(String(a.atualizadoEm || '')); });
    area.appendChild(h('div.linha-bts', { style: { marginBottom: '10px' } }, h('button.bt.pri', { on: { click: function () { editarNota({ refs: [], texto: '' }); } } }, ico('mais'), 'Nova anotação')));
    if (!ns.length) { area.appendChild(h('div.vazio', h('b', 'Nenhuma anotação.'), h('span', 'Anote a partir de versículos na Bíblia ou crie uma anotação livre.'))); return; }
    area.appendChild(h('div.lista', ns.map(function (n) {
      return h('button.item', { on: { click: function () { editarNota(n); } } }, ico('nota'),
        h('div.corpo', h('span.titulo', rotuloRefs(n.refs) || 'Anotação livre'), h('span', { style: { whiteSpace: 'pre-line' } }, (n.texto || '').slice(0, 220) + ((n.texto || '').length > 220 ? '…' : '')), h('span.meta', 'Atualizada em ' + UI.dataCurta(n.atualizadoEm || n.criadoEm))));
    })));
  }
  function rotuloRefs(refs) {
    if (!refs || !refs.length) return '';
    var d = refs.map(A2Ref.deChave), mesmo = d.every(function (x) { return x.livro === d[0].livro && x.cap === d[0].cap; });
    if (mesmo) { var vs = d.map(function (x) { return x.v; }).sort(function (a, b) { return a - b; }); return A2Ref.POR_ID[d[0].livro].nome + ' ' + d[0].cap + ':' + (vs.length > 1 && vs[vs.length - 1] - vs[0] === vs.length - 1 ? vs[0] + '-' + vs[vs.length - 1] : vs.join(', ')); }
    return refs.map(function (k) { return A2Ref.formatar(refDeChave(k), true); }).join('; ');
  }
  function editarNota(n) {
    var novo = !n.id, id = n.id || UI.uid();
    UI.folha(novo ? 'Nova anotação' : 'Anotação', function (api) {
      var ta = h('textarea.entrada#nota-txt', { rows: 8, placeholder: 'Escreva o que você aprendeu, perguntas, aplicações…' }); ta.value = n.texto || '';
      var ver = h('div.cartao', { style: { font: '400 16px/1.6 var(--f-leitura)' } });
      if (n.refs && n.refs.length) { ver.textContent = '…'; Promise.all(n.refs.map(function (k) { var d = A2Ref.deChave(k); return Biblia.livro(d.livro).then(function (lv) { return d.v + ' ' + UI.plano(lv.caps[d.cap - 1][d.v - 1]); }); })).then(function (ts) { ver.textContent = ts.join('  '); }); }
      return h('form.form', { on: { submit: function (e) {
        e.preventDefault();
        if (!ta.value.trim()) { UI.aviso('Escreva algo antes de salvar.', true); return; }
        Dados.salvar('notas', id, { refs: n.refs || [], texto: ta.value.trim(), criadoEm: n.criadoEm || new Date().toISOString(), atualizadoEm: new Date().toISOString() });
        api.fechar(); UI.aviso('Anotação salva.');
      } } },
        n.refs && n.refs.length ? h('div.campo', h('span', rotuloRefs(n.refs)), ver) : null,
        h('label.campo', { for: 'nota-txt' }, h('span', 'Sua anotação'), ta),
        h('div.linha-bts', h('button.bt.pri', { type: 'submit' }, 'Salvar'),
          !novo ? h('button.bt.perigo', { type: 'button', on: { click: async function () { if (await UI.confirmar('Excluir anotação', 'Esta anotação será apagada.', 'Excluir', true)) { Dados.excluir('notas', id); api.fechar(); } } } }, ico('lixo'), 'Excluir') : null,
          n.refs && n.refs.length ? h('button.bt', { type: 'button', on: { click: function () { api.fechar(); var r = refDeChave(n.refs[0]); App.abrirBiblia(r.livro, r.cap, r.v1); } } }, ico('livro'), 'Abrir na Bíblia') : null));
    });
  }

  // ---------------------------------------------------------------- estudos pessoais
  function estudos(area) {
    var es = Dados.todos('estudos').sort(function (a, b) { return String(b.atualizadoEm || '').localeCompare(String(a.atualizadoEm || '')); });
    area.appendChild(h('div.linha-bts', { style: { marginBottom: '10px' } },
      h('button.bt.pri', { on: { click: function () { editarEstudo({}); } } }, ico('mais'), 'Novo estudo'),
      App.temIA ? h('button.bt', { on: { click: estudoComIA } }, ico('brilho'), 'Montar com IA') : null));
    if (!es.length) { area.appendChild(h('div.vazio', h('b', 'Nenhum estudo ainda.'), h('span', 'Organize um tema com suas passagens e anotações, por exemplo “Batismo em Atos”.'))); return; }
    var cats = Array.from(new Set(es.map(function (e) { return e.categoria; }).filter(Boolean))).sort(), f = App.estado.catEstudo || '';
    if (cats.length) area.appendChild(h('div.chips', h('button.chip', { 'aria-pressed': String(!f), on: { click: function () { App.estado.catEstudo = ''; App.recarregar(); } } }, 'Todas'),
      cats.map(function (c) { return h('button.chip', { 'aria-pressed': String(f === c), on: { click: function () { App.estado.catEstudo = c; App.recarregar(); } } }, c); })));
    area.appendChild(h('div.lista', { style: { marginTop: '8px' } }, es.filter(function (e) { return !f || e.categoria === f; }).map(function (e) {
      return h('button.item', { on: { click: function () { verEstudo(e); } } }, ico('nota'),
        h('div.corpo', h('span.titulo', e.titulo || 'Sem título'), h('span.meta', [(e.refs || []).length + ' passagens', e.categoria, e.origem === 'ia' ? 'rascunho com IA' : null].filter(Boolean).join(' · '))));
    })));
  }
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
        h('button.bt', { on: { click: function () { var txt = (e.titulo || '') + '\n\n' + (e.corpo || '') + '\n\n' + (e.refs || []).map(function (s) { return '• ' + (s.ref || s) + (s.nota ? ' — ' + s.nota : ''); }).join('\n'); UI.copiar(txt); } } }, ico('copiar'), 'Copiar'),
        h('button.bt.perigo', { on: { click: async function () { if (await UI.confirmar('Excluir estudo', 'O estudo será apagado.', 'Excluir', true)) { Dados.excluir('estudos', e.id); api.fechar(); } } } }, ico('lixo'), 'Excluir')));
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
    if (!itens.length) { area.appendChild(h('div.vazio', h('b', 'Nada registrado ainda.'), h('span', 'Leituras, devocionais, pesquisas e artes aparecem aqui.'))); return; }
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

  // ---------------------------------------------------------------- pesquisa no conteúdo salvo
  function buscarSalvos() {
    UI.folha('Pesquisar no que você salvou', function (api) {
      var q = h('input.entrada#q-salvos', { type: 'search', placeholder: 'Palavra, referência ou título' }), res = h('div.lista');
      var cacheTextos = null;
      async function textos() {
        if (cacheTextos) return cacheTextos;
        var keys = Dados.todos('favoritos').map(function (f) { return f.id; }).concat(Dados.todos('destaques').map(function (d) { return d.id; }));
        cacheTextos = {};
        for (var i = 0; i < keys.length; i++) { var d = A2Ref.deChave(keys[i]); try { var lv = await Biblia.livro(d.livro); cacheTextos[keys[i]] = UI.plano(lv.caps[d.cap - 1][d.v - 1] || ''); } catch (e) {} }
        return cacheTextos;
      }
      async function buscar() {
        var termo = A2Busca.normalizar(q.value.trim()); if (!termo) { res.replaceChildren(); return; }
        var tx = await textos(), achados = [];
        function casa(s) { return A2Busca.normalizar(String(s || '')).indexOf(termo) >= 0; }
        Dados.todos('favoritos').forEach(function (f) { var ref = A2Ref.formatar(refDeChave(f.id)); if (casa(tx[f.id]) || casa(ref)) achados.push(['Favorito', ref, tx[f.id], function () { var r = refDeChave(f.id); App.abrirBiblia(r.livro, r.cap, r.v1); }]); });
        Dados.todos('destaques').forEach(function (d) { var ref = A2Ref.formatar(refDeChave(d.id)); if (casa(tx[d.id]) || casa(ref)) achados.push(['Destaque', ref, tx[d.id], function () { var r = refDeChave(d.id); App.abrirBiblia(r.livro, r.cap, r.v1); }]); });
        Dados.todos('notas').forEach(function (n) { if (casa(n.texto) || casa(rotuloRefs(n.refs))) achados.push(['Anotação', rotuloRefs(n.refs) || 'Anotação livre', n.texto, function () { editarNota(n); }]); });
        Dados.todos('estudos').forEach(function (e) { if (casa(e.titulo) || casa(e.corpo) || casa(e.categoria)) achados.push(['Estudo', e.titulo, e.categoria, function () { verEstudo(e); }]); });
        Dados.todos('devSalvos').forEach(function (d) { if (casa(d.titulo) || casa(d.categoria)) achados.push(['Devocional', d.titulo, d.categoria, function () { Telas.devocionais.abrir(d.id); }]); });
        Dados.todos('artes').forEach(function (a) { if (casa(a.titulo)) achados.push(['Arte', a.titulo, '', function () { App.estado.secaoCriar = 'minhas'; App.ir('criar'); }]); });
        res.replaceChildren.apply(res, achados.length ? achados.map(function (x) { return h('button.item', { on: { click: function () { api.fechar(); x[3](); } } }, h('div.corpo', h('span.meta', x[0]), h('span.titulo', x[1]), x[2] ? h('span', String(x[2]).slice(0, 160)) : null)); }) : [h('div.vazio', 'Nada encontrado.')]);
      }
      var t; q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(buscar, 250); });
      return h('div.form', h('label.sr', { for: 'q-salvos' }, 'Pesquisar'), h('div.busca-campo', ico('busca'), q), res);
    }, { cheia: true });
  }

  root.Telas.biblioteca = { render: render, editarNota: editarNota };
})(window);
