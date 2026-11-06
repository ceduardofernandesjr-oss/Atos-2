/* ATOS 2 — Devocionais: devocional do dia, arquivo, busca por tema, salvos e fluxo editorial
   (rascunho → revisão → publicação). Conteúdo com apoio de IA é identificado e só aparece aos leitores depois de revisado. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;
  var CAMPOS = [['contexto', 'Contexto histórico e bíblico'], ['explicacao', 'Explicação do texto'], ['reflexao', 'Reflexão'], ['aplicacao', 'Aplicação prática'], ['pergunta', 'Pergunta para reflexão'], ['oracao', 'Oração']];

  function publicados() { return (Dados.conteudo.devocionais || []).filter(function (d) { return d.publicado && d.data; }).sort(function (a, b) { return b.data.localeCompare(a.data); }); }
  function doDia() { var hoje = UI.hoje(), l = publicados().filter(function (d) { return d.data <= hoje; }); return l.filter(function (d) { return d.data === hoje; })[0] || l[0] || null; }
  function editor() { return Dados.estado.dono || Dados.estado.podeEditar; }

  function secao(area) {
    var aba = App.estado.abaDevo || 'hoje';
    var abas = [['hoje', 'Hoje'], ['arquivo', 'Arquivo'], ['salvos', 'Salvos']].concat(editor() ? [['edicao', 'Edição']] : []);
    area.appendChild(h('div.chips', abas.map(function (a) { return h('button.chip', { 'aria-pressed': String(a[0] === aba), on: { click: function () { App.estado.abaDevo = a[0]; App.recarregar(); } } }, a[1]); })));
    var c = h('div', { style: { marginTop: '10px' } }); area.appendChild(c);
    if (aba === 'hoje') hoje(c); else if (aba === 'arquivo') arquivo(c); else if (aba === 'salvos') salvos(c); else edicao(c);
    App.aoSair(Dados.ouvirConteudo(function (n) { if ((n === 'devocionais' || n === 'rascunhos') && App.estado.aba === 'biblioteca') App.atualizar(); }));
  }

  function cartaoDevo(d, destaque) {
    var lido = !!Dados.obter('devLidos', d.id);
    return h('button.item', { style: destaque ? { borderColor: 'var(--ouro)' } : null, on: { click: function () { abrir(d.id); } } }, ico('luz'),
      h('div.corpo', h('span.meta', UI.dataLonga(d.data) + ' · ' + (d.categoria || '')), h('span.titulo', d.titulo), h('span.meta', 'Passagem: ' + d.passagem + (lido ? ' · lido' : ''))), ico('direita'));
  }
  function hoje(c) {
    var d = doDia();
    if (!d) { c.appendChild(h('div.vazio', h('b', 'Nenhum devocional publicado ainda.'), h('span', editor() ? 'Abra a aba Edição para revisar e publicar os devocionais.' : 'Os devocionais aparecem aqui assim que a edição publicar.'))); return; }
    if (d.data !== UI.hoje()) c.appendChild(h('p.sub', { style: { marginBottom: '8px' } }, 'Ainda não há devocional para hoje. Este é o mais recente:'));
    c.appendChild(cartaoDevo(d, true));
    var outros = publicados().filter(function (x) { return x.id !== d.id && x.data <= UI.hoje(); }).slice(0, 4);
    if (outros.length) { c.appendChild(h('div.secao', h('h2', 'Anteriores'))); c.appendChild(h('div.lista', outros.map(function (x) { return cartaoDevo(x); }))); }
  }
  function arquivo(c) {
    var cat = App.estado.catDevo || '', q = h('input.entrada#q-devo', { type: 'search', placeholder: 'Buscar por tema, título ou passagem' });
    q.value = App.estado.qDevo || '';
    var lista = h('div.lista', { style: { marginTop: '8px' } });
    c.appendChild(h('div.busca-campo', ico('busca'), h('label.sr', { for: 'q-devo' }, 'Buscar devocionais'), q));
    c.appendChild(h('div.chips', { style: { marginTop: '8px' } }, h('button.chip', { 'aria-pressed': String(!cat), on: { click: function () { App.estado.catDevo = ''; App.recarregar(); } } }, 'Todos'),
      A2Conteudo.CATEGORIAS_DEVOCIONAL.map(function (k) { return h('button.chip', { 'aria-pressed': String(cat === k), on: { click: function () { App.estado.catDevo = k; App.recarregar(); } } }, k); })));
    c.appendChild(lista);
    function filtrar() {
      App.estado.qDevo = q.value;
      var t = A2Busca.normalizar(q.value.trim());
      var l = publicados().filter(function (d) { return d.data <= UI.hoje() && (!cat || d.categoria === cat) && (!t || A2Busca.normalizar([d.titulo, d.categoria, d.passagem, d.reflexao].join(' ')).indexOf(t) >= 0); });
      lista.replaceChildren.apply(lista, l.length ? l.map(function (d) { return cartaoDevo(d); }) : [h('div.vazio', 'Nenhum devocional encontrado.')]);
    }
    q.addEventListener('input', filtrar); filtrar();
  }
  function salvos(c) {
    var s = Dados.todos('devSalvos');
    if (!s.length) { c.appendChild(h('div.vazio', h('b', 'Nenhum devocional salvo.'), h('span', 'Toque em Salvar dentro de um devocional para guardá-lo aqui.'))); return; }
    c.appendChild(h('div.lista', s.map(function (x) { return h('button.item', { on: { click: function () { abrir(x.id); } } }, ico('coracaoCheio'), h('div.corpo', h('span.titulo', x.titulo), h('span.meta', (x.categoria || '') + ' · ' + UI.dataLonga(x.data)))); })));
  }

  // ---------------------------------------------------------------- leitura
  function abrir(id) {
    var d = (Dados.conteudo.devocionais || []).filter(function (x) { return x.id === id; })[0] || (editor() ? (Dados.conteudo.rascunhos || []).filter(function (x) { return x.id === id; })[0] : null);
    if (!d) { UI.aviso('Devocional não encontrado. Ele pode ter sido despublicado.', true); return; }
    UI.folha('Devocional', function (api) {
      var art = h('article.devo.form');
      art.appendChild(h('div', h('span.rotulo', (d.categoria || '') + ' · ' + UI.dataLonga(d.data || UI.hoje())), h('h1', d.titulo)));
      if (d.origem === 'ia') art.appendChild(h('div.aviso-ia', ico('brilho'), h('span', d.publicado ? 'Texto redigido com apoio de inteligência artificial e revisado pela edição' + (d.revisadoEm ? ' em ' + UI.dataCurta(d.revisadoEm) : '') + '. As citações bíblicas vêm da tradução, não da IA.' : 'Rascunho gerado por IA: ainda não revisado nem publicado.')));
      else if (!d.publicado) art.appendChild(h('div.aviso', ico('info'), h('span', 'Rascunho: ainda não publicado.')));
      art.appendChild(h('h3', 'Passagem bíblica'));
      var pass = h('div.passagem', '…'); art.appendChild(pass);
      Biblia.textoDeString(d.passagem).then(function (r) {
        pass.replaceChildren();
        r.versos.forEach(function (x, i) { if (i) pass.appendChild(document.createTextNode(' ')); if (r.versos.length > 1) pass.appendChild(h('sup', { style: { color: 'var(--ouro)', fontWeight: 700, marginRight: '3px' } }, String(x.v))); pass.appendChild(UI.textoComItalico(x.t)); });
        pass.appendChild(h('div', { style: { marginTop: '8px', font: '600 14px var(--f-ui)', color: 'var(--azul-texto)' } }, A2Ref.formatar(r.ref) + ' (' + Biblia.versao(Biblia.padrao()).sigla + ')'));
      }, function (e) { pass.textContent = 'Referência inválida: ' + d.passagem + ' — ' + e.message; });
      CAMPOS.forEach(function (c) { if (!d[c[0]]) return; art.appendChild(h('h3', c[1])); art.appendChild(h(c[0] === 'oracao' ? 'p.oracao' : 'p.prosa', d[c[0]])); });
      var salvo = !!Dados.obter('devSalvos', d.id);
      var bSalvar = h('button.bt', { on: { click: function () {
        if (salvo) Dados.excluir('devSalvos', d.id); else Dados.salvar('devSalvos', d.id, { titulo: d.titulo, categoria: d.categoria, data: d.data });
        salvo = !salvo; bSalvar.replaceChildren(ico(salvo ? 'coracaoCheio' : 'coracao'), salvo ? 'Salvo' : 'Salvar'); UI.aviso(salvo ? 'Devocional salvo.' : 'Removido dos salvos.');
      } } }, ico(salvo ? 'coracaoCheio' : 'coracao'), salvo ? 'Salvo' : 'Salvar');
      var concluido = !!Dados.obter('devLidos', d.id);
      var bConcluir = h('button.bt' + (concluido ? '' : '.pri') + '#devo-concluir', { 'aria-pressed': String(concluido), on: { click: function () {
        if (concluido) { Dados.excluir('devLidos', d.id); App.removerDoHistorico(function (x) { return x.tipo === 'devocional' && x.id === d.id; }); }
        else { Dados.salvar('devLidos', d.id, { em: new Date().toISOString(), titulo: d.titulo }); App.registrar('devocional', { titulo: d.titulo, id: d.id }); }
        concluido = !concluido;
        bConcluir.className = 'bt' + (concluido ? '' : ' pri'); bConcluir.setAttribute('aria-pressed', String(concluido));
        bConcluir.replaceChildren(ico('ok'), concluido ? 'Devocional concluído' : 'Concluir devocional');
        UI.aviso(concluido ? 'Devocional concluído. Ele entra na sua jornada.' : 'Marcação desfeita.');
      } } }, ico('ok'), concluido ? 'Devocional concluído' : 'Concluir devocional');
      if (d.publicado) art.appendChild(h('div.concluir-devo', bConcluir, h('small', 'Conclua depois de ler e meditar. Só devocionais concluídos contam na sua jornada.')));
      art.appendChild(h('div.linha-bts', { style: { marginTop: '18px' } }, d.publicado ? bSalvar : null,
        h('button.bt', { on: { click: function () { App.compartilhar(d.titulo + '\n\nPassagem: ' + d.passagem + '\n\n' + (d.reflexao || '').slice(0, 600) + ((d.reflexao || '').length > 600 ? '…' : '') + (d.pergunta ? '\n\nPara pensar: ' + d.pergunta : '') + '\n\n— ATOS 2', 'Compartilhar devocional'); } } }, ico('compartilhar'), 'Compartilhar'),
        h('button.bt', { on: { click: function () { api.fechar(); Telas.criar.comVersiculo(d.versiculoArte || d.passagem); } } }, ico('imagem'), 'Criar arte'),
        editor() ? h('button.bt', { on: { click: function () { api.fechar(); editar(d); } } }, ico('editar'), 'Editar') : null));
      return art;
    }, { cheia: true });
  }

  // ---------------------------------------------------------------- edição (proprietário e editores)
  function edicao(c) {
    var r = (Dados.conteudo.rascunhos || []).slice().sort(function (a, b) { return String(a.data || '9').localeCompare(String(b.data || '9')); });
    c.appendChild(h('div.aviso', ico('escudo'), h('span', 'Só você (e editores) veem esta aba. Rascunhos não aparecem aos leitores. Ao publicar, você confirma que revisou o texto e conferiu que ele está fundamentado na passagem.')));
    c.appendChild(h('div.linha-bts', { style: { margin: '10px 0' } },
      h('button.bt.pri', { on: { click: function () { editar({ origem: 'humano' }); } } }, ico('mais'), 'Novo devocional'),
      App.temIA ? h('button.bt', { on: { click: gerarIA } }, ico('brilho'), 'Rascunho com IA') : null));
    c.appendChild(h('div.secao', { style: { marginTop: '6px' } }, h('h2', 'Rascunhos (' + r.length + ')')));
    c.appendChild(r.length ? h('div.lista', r.map(function (d) {
      return h('button.item', { on: { click: function () { editar(d); } } }, ico('nota'),
        h('div.corpo', h('span.titulo', d.titulo || 'Sem título'), h('span.meta', [d.categoria, d.passagem, d.data ? 'para ' + UI.dataCurta(d.data) : 'sem data'].filter(Boolean).join(' · ')), d.origem === 'ia' ? h('span.selo.ia', 'IA · aguardando revisão') : null));
    })) : h('p.sub', 'Nenhum rascunho.'));
    var pub = publicados();
    c.appendChild(h('div.secao', h('h2', 'Publicados (' + pub.length + ')')));
    c.appendChild(pub.length ? h('div.lista', pub.map(function (d) { return h('button.item', { on: { click: function () { editar(d); } } }, ico('ok'), h('div.corpo', h('span.titulo', d.titulo), h('span.meta', UI.dataCurta(d.data) + ' · ' + d.categoria + (d.origem === 'ia' ? ' · revisado (IA)' : '')))); })) : h('p.sub', 'Nada publicado ainda.'));
  }

  // Referências citadas no texto que não existem (para o revisor conferir)
  function refsSuspeitas(texto) {
    var out = [], re = /\b((?:[1-3]\s?)?[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]{1,14})\.?\s(\d{1,3})[:.](\d{1,3})(?:-(\d{1,3}))?/g, m;
    while ((m = re.exec(texto || ''))) { var r = Biblia.interpretar(m[0]); if (A2Ref.lerLivro(m[1]) && !r.ok) out.push(m[0] + ' (' + r.erro + ')'); }
    return out;
  }

  function editar(d) {
    var id = d.id || UI.uid();
    UI.folha(d.publicado ? 'Editar devocional publicado' : 'Revisar devocional', function (api) {
      var f = {};
      function campo(nome, rotulo, tipo, extra) {
        var el = tipo === 'area' ? h('textarea.entrada#dv-' + nome, { rows: nome === 'reflexao' || nome === 'explicacao' ? 7 : 4 }) : h('input.entrada#dv-' + nome, Object.assign({ type: tipo || 'text' }, extra || {}));
        el.value = d[nome] || ''; f[nome] = el;
        return h('label.campo', { for: 'dv-' + nome }, h('span', rotulo), el);
      }
      var cat = h('select.entrada#dv-categoria', A2Conteudo.CATEGORIAS_DEVOCIONAL.map(function (k) { var o = h('option', { value: k }, k); if (k === d.categoria) o.selected = true; return o; }));
      f.categoria = cat;
      var prev = h('p.sub'), avisos = h('div');
      function conferir() {
        var r = Biblia.interpretar(f.passagem.value);
        prev.textContent = r.ok ? '✓ ' + A2Ref.formatar(r.ref) : 'Passagem inválida: ' + r.erro;
        var sus = refsSuspeitas(CAMPOS.map(function (c) { return f[c[0]].value; }).join('\n'));
        avisos.replaceChildren(sus.length ? h('div.aviso', ico('info'), h('span', 'Confira estas referências citadas no texto: ' + sus.join('; '))) : '');
        return r.ok;
      }
      var revisado = h('input.interruptor#dv-rev', { type: 'checkbox' });
      var form = h('form.form', { on: { submit: function (e) { e.preventDefault(); } } },
        d.origem === 'ia' ? h('div.aviso-ia', ico('brilho'), h('span', 'Gerado por IA. Leia com atenção: confira se cada afirmação está no texto bíblico, corrija o que for interpretação apresentada como fato e remova o que não tiver fundamento.')) : null,
        campo('titulo', 'Título', 'text', { maxlength: 120 }),
        h('label.campo', { for: 'dv-categoria' }, h('span', 'Tema'), cat),
        campo('passagem', 'Passagem bíblica principal (ex.: At 2:42-47)'), prev,
        campo('versiculoArte', 'Versículo para a arte (opcional, ex.: At 2:42)'),
        CAMPOS.map(function (c) { return campo(c[0], c[1], 'area'); }),
        avisos,
        campo('data', 'Data de publicação', 'date'),
        h('label.chave', { for: 'dv-rev' }, h('div', h('span', 'Revisei o conteúdo'), h('small', 'Confirmo que o texto está fundamentado na passagem e não atribui à Bíblia o que ela não diz.')), revisado));
      f.passagem.addEventListener('change', conferir); conferir();
      function dados() { var o = { origem: d.origem || 'humano' }; Object.keys(f).forEach(function (k) { o[k] = f[k].value.trim(); }); return o; }
      async function salvarRascunho() {
        try { await Dados.gravarConteudo('rascunhos', id, Object.assign(dados(), { publicado: false, atualizadoEm: new Date().toISOString() })); UI.aviso('Rascunho salvo.'); api.fechar(); }
        catch (e) { UI.aviso('Não foi possível salvar: ' + (e.message || e.code), true); }
      }
      async function publicar() {
        var o = dados();
        if (!o.titulo || !o.data || !o.reflexao) { UI.aviso('Preencha título, reflexão e data antes de publicar.', true); return; }
        if (!conferir()) { UI.aviso('Corrija a passagem bíblica.', true); return; }
        if (!revisado.checked) { UI.aviso('Marque “Revisei o conteúdo” para publicar.', true); return; }
        try {
          await Dados.gravarConteudo('devocionais', id, Object.assign(o, { publicado: true, revisadoEm: new Date().toISOString() }));
          if (!d.publicado) await Dados.gravarConteudo('rascunhos', id, null);
          UI.aviso('Devocional publicado para ' + UI.dataCurta(o.data) + '.'); api.fechar();
        } catch (e) { UI.aviso('Não foi possível publicar: ' + (e.message || e.code), true); }
      }
      async function despublicar() {
        if (!(await UI.confirmar('Despublicar', 'O devocional sai do ar e volta para os rascunhos.', 'Despublicar'))) return;
        try { await Dados.gravarConteudo('rascunhos', id, Object.assign(dados(), { publicado: false })); await Dados.gravarConteudo('devocionais', id, null); api.fechar(); }
        catch (e) { UI.aviso('Não foi possível: ' + (e.message || e.code), true); }
      }
      async function excluir() {
        if (!(await UI.confirmar('Excluir rascunho', 'O rascunho será apagado.', 'Excluir', true))) return;
        try { await Dados.gravarConteudo('rascunhos', id, null); api.fechar(); } catch (e) { UI.aviso('Não foi possível: ' + (e.message || e.code), true); }
      }
      form.appendChild(h('div.linha-bts',
        h('button.bt.pri', { type: 'button', on: { click: publicar } }, ico('ok'), d.publicado ? 'Salvar publicação' : 'Publicar'),
        d.publicado ? h('button.bt', { type: 'button', on: { click: despublicar } }, 'Despublicar') : h('button.bt', { type: 'button', on: { click: salvarRascunho } }, 'Salvar rascunho'),
        h('button.bt', { type: 'button', on: { click: function () { var o = dados(); o.id = id; o.publicado = !!d.publicado; api.fechar(); Dados.conteudo.rascunhos = (Dados.conteudo.rascunhos || []).filter(function (x) { return x.id !== id; }).concat(d.publicado ? [] : [o]); abrir(id); } } }, 'Pré-visualizar'),
        !d.publicado && d.id ? h('button.bt.perigo', { type: 'button', on: { click: excluir } }, ico('lixo'), 'Excluir') : null));
      return form;
    }, { cheia: true });
  }

  // Rascunho com IA: a passagem (texto exato da tradução) vai no pedido; o resultado é sempre rascunho.
  function gerarIA() {
    UI.folha('Rascunho de devocional com IA', function (api) {
      var cat = h('select.entrada#ia-cat', A2Conteudo.CATEGORIAS_DEVOCIONAL.map(function (k) { return h('option', { value: k }, k); }));
      var pass = h('input.entrada#ia-pass', { type: 'text', placeholder: 'Ex.: At 2:42-47' }), data = h('input.entrada#ia-data', { type: 'date', value: UI.hoje() });
      var estado = h('p.sub'), bt;
      async function gerar() {
        var sample = root.claude && root.claude.use ? await root.claude.use('sample') : null;
        if (!sample) { estado.textContent = 'A IA não está disponível nesta visualização.'; return; }
        var r = Biblia.interpretar(pass.value); if (!r.ok) { estado.textContent = r.erro; return; }
        var versos = await Biblia.textoDe(r.ref), texto = versos.map(function (x) { return x.v + ' ' + UI.plano(x.t); }).join(' ');
        bt.disabled = true; estado.textContent = 'Escrevendo o rascunho…';
        try {
          var j = await sample.json('Escreva um devocional cristão em português do Brasil para o aplicativo ATOS 2 ("De volta à doutrina dos apóstolos"), sem vínculo com denominação.\n' +
            'Tema: ' + cat.value + '\nPassagem principal: ' + A2Ref.formatar(r.ref) + ' (Bíblia Livre): ' + texto + '\n\n' +
            'Responda em JSON com as chaves: titulo (até 8 palavras), contexto (contexto histórico e literário da passagem, 60-110 palavras), explicacao (o que o texto diz, 90-140 palavras), reflexao (120-180 palavras), aplicacao (2 a 3 ações concretas, 50-90 palavras), pergunta (uma pergunta), oracao (50-80 palavras, em primeira pessoa), versiculoArte (a referência de um versículo da passagem, ex.: "At 2:42").\n' +
            'Regras: fundamente tudo no texto e no contexto da passagem; não invente fatos históricos; quando algo for interpretação, apresente como reflexão, não como afirmação da Bíblia; NÃO reproduza versículos por extenso (cite só referências no formato Livro capítulo:versículo, e só referências reais); evite temas de controvérsia entre denominações; linguagem acolhedora e simples.', { modelTier: 'complex' });
          var o = { titulo: String(j.titulo || '').slice(0, 120), categoria: cat.value, passagem: A2Ref.formatar(r.ref), versiculoArte: Biblia.interpretar(String(j.versiculoArte || '')).ok ? String(j.versiculoArte) : '', data: data.value, origem: 'ia', publicado: false, geradoEm: new Date().toISOString() };
          CAMPOS.forEach(function (c) { o[c[0]] = String(j[c[0]] || '').slice(0, 2500); });
          var id = UI.uid();
          await Dados.gravarConteudo('rascunhos', id, o);
          api.fechar(); UI.aviso('Rascunho criado. Revise antes de publicar.'); editar(Object.assign({ id: id }, o));
        } catch (e) { estado.textContent = e && e.code === 'rate_limited' ? 'Muitos pedidos seguidos. Aguarde e tente de novo.' : (e.message || 'Não foi possível gerar agora.'); }
        finally { bt.disabled = false; }
      }
      bt = h('button.bt.pri', { on: { click: gerar } }, ico('brilho'), 'Gerar rascunho');
      return h('div.form', h('label.campo', { for: 'ia-cat' }, h('span', 'Tema'), cat), h('label.campo', { for: 'ia-pass' }, h('span', 'Passagem principal'), pass),
        h('label.campo', { for: 'ia-data' }, h('span', 'Data prevista'), data), bt, estado,
        h('div.aviso-ia', ico('brilho'), h('span', 'O texto gerado é um rascunho identificado como IA. Ele só aparece aos leitores depois que você revisar e publicar.')));
    });
  }

  // Reflexão curta do versículo do dia (proprietário/editores)
  function editarReflexao(data, refStr) {
    UI.folha('Reflexão do versículo do dia', function (api) {
      var atual = (Dados.conteudo.reflexoes || []).filter(function (x) { return x.id === data; })[0] || {};
      var ta = h('textarea.entrada#refl-txt', { rows: 5, maxlength: 600, placeholder: 'Uma ou duas frases que ajudem a meditar no versículo' }); ta.value = atual.texto || '';
      var origem = atual.origem || 'humano', estado = h('p.sub'), revisado = h('input.interruptor#refl-rev', { type: 'checkbox' });
      async function ia() {
        var sample = root.claude && root.claude.use ? await root.claude.use('sample') : null;
        if (!sample) { estado.textContent = 'A IA não está disponível nesta visualização.'; return; }
        var r = await Biblia.textoDeString(refStr); estado.textContent = 'Escrevendo…';
        try {
          var out = await sample('Escreva uma reflexão breve (2 frases, até 45 palavras), em português do Brasil, sobre ' + A2Ref.formatar(r.ref) + ' (Bíblia Livre): "' + r.versos.map(function (x) { return UI.plano(x.t); }).join(' ') + '". Fundamente no texto, sem citar outros versículos por extenso, sem vínculo denominacional. Responda só com a reflexão.', { modelTier: 'default' });
          ta.value = String(out.text || '').trim().slice(0, 600); origem = 'ia'; estado.textContent = 'Rascunho gerado por IA. Revise antes de publicar.';
        } catch (e) { estado.textContent = e.message || 'Não foi possível gerar.'; }
      }
      return h('div.form', h('p.sub', UI.dataLonga(data) + ' · ' + A2Ref.formatar(Biblia.interpretar(refStr).ref)),
        h('label.campo', { for: 'refl-txt' }, h('span', 'Reflexão'), ta), estado,
        h('label.chave', { for: 'refl-rev' }, h('div', h('span', 'Revisei a reflexão'), h('small', 'Ela está fundamentada no versículo.')), revisado),
        h('div.linha-bts',
          h('button.bt.pri', { on: { click: async function () {
            if (!ta.value.trim()) return; if (!revisado.checked) { UI.aviso('Marque “Revisei a reflexão”.', true); return; }
            try { await Dados.gravarConteudo('reflexoes', data, { texto: ta.value.trim(), ref: refStr, origem: origem, publicado: true, revisadoEm: new Date().toISOString() }); api.fechar(); UI.aviso('Reflexão publicada.'); }
            catch (e) { UI.aviso('Não foi possível publicar: ' + (e.message || e.code), true); }
          } } }, 'Publicar'),
          App.temIA ? h('button.bt', { on: { click: ia } }, ico('brilho'), 'Sugerir com IA') : null,
          atual.texto ? h('button.bt.perigo', { on: { click: async function () { await Dados.gravarConteudo('reflexoes', data, null); api.fechar(); } } }, 'Remover') : null));
    });
  }

  root.Telas.devocionais = { secao: secao, abrir: abrir, doDia: doDia, editarReflexao: editarReflexao };
})(window);
