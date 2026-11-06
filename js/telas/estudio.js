/* ATOS 2 — Estúdio de Criação (v2): 1. versículo · 2. modelo · 3. personalizar · 4. exportar e compartilhar.
   Regra central: o texto bíblico vem sempre da tradução escolhida, sem alterações. A IA (somente na prévia do
   claude.ai) sugere apenas a composição — fundo, fontes, cores e elementos —, nunca o texto. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;
  var clonar = A2Arte.clonar;

  // ================================================================ legado: artes prontas (Inspirações) usam os modelos de foto da v1
  var FONTES_MODELO = ['Cormorant Garamond', 'Playfair Display', 'Literata', 'Cormorant Garamond', 'Josefin Sans', 'Playfair Display', 'Manrope'];
  function modeloFoto(ft, i, formato) {
    var pc = formato === 'papel-pc', cel = formato === 'papel-celular', fonte = FONTES_MODELO[i % FONTES_MODELO.length];
    var y = cel ? Math.min(0.8, Math.max(0.42, ft.y || 0.56)) : (ft.y || (pc ? 0.45 : 0.47));
    return { id: (cel ? 'pc-' : pc ? 'pp-' : 'f-') + ft.id, nome: ft.nome, formato: formato || null, papel: !!(cel || pc),
      fundo: { tipo: 'banco', id: ft.id }, escurecer: ft.escurecer,
      estilo: { fonte: fonte, cor: ft.cor, alinhar: 'center', sombra: ft.cor === '#FFFFFF', maiusculas: fonte === 'Josefin Sans', entrelinha: fonte === 'Josefin Sans' ? 1.45 : 1.3, largura: pc ? 0.56 : 0.8 },
      pos: { x: 0.5, y: y } };
  }
  var LEGADO = A2Fotos.LISTA.map(function (ft, i) { return modeloFoto(ft, i); });
  var PAPEIS = A2Fotos.LISTA.map(function (ft, i) { return modeloFoto(ft, i, 'papel-celular'); });
  LEGADO = LEGADO.concat(PAPEIS);
  function specV1(m, ref) {
    var s = { formato: m.formato || 'feed', conteudo: { tipo: 'versiculo', ref: ref, versao: Biblia.padrao() }, fundo: clonar(m.fundo), escurecer: m.escurecer,
      estilo: clonar(m.estilo), pos: clonar(m.pos), referencia: { mostrar: true }, assinatura: {}, marca: true };
    return A2Arte.migrar(s);
  }

  // ================================================================ estado do estúdio (fica na memória enquanto o app está aberto)
  var E = { etapa: 'inicio', spec: null, id: null, sel: 'versiculo', painel: 'texto', painelAberto: true, sub: {}, zoom: 1, guias: true,
    hist: null, status: 'salvo', voltar: null, novo: null, catModelo: 'todos', abaMinhas: 'recentes', catGaleria: null };
  var ED = {};   // elementos do editor montado

  function ir(etapa) { E.etapa = etapa; App.recarregar(); }

  // ================================================================ exportação e compartilhamento
  function nomeArquivo(spec, cont, ext) {
    var base = spec.nome || (cont && cont.refObj ? A2Ref.formatar(cont.refObj) : 'arte');
    return 'atos2-' + base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() + '-' + spec.formato + '.' + (ext || 'png');
  }
  // Licença do Pixabay: a foto da biblioteca não pode sair sozinha, sem texto por cima.
  async function fotoSemTexto(spec) {
    if (spec.fundo.tipo !== 'banco') return false;
    var cont = await A2Desenho.textoDaArte(spec).catch(function () { return { texto: '' }; });
    return !A2Arte.temTextoVisivel(spec, cont);
  }
  function avisarFotoSemTexto() { UI.aviso('Mostre o versículo ou um texto: as fotos da biblioteca só podem sair com texto por cima.', true); }

  // Salva uma imagem: pelo download do claude.ai, pelo navegador ou, em último caso, mostrando a imagem.
  async function salvarImagem(blob, nome, ref) {
    var dl = root.claude && root.claude.use ? await root.claude.use('downloads') : null;
    if (dl) {
      try { await dl.save({ filename: nome, data: blob }); UI.aviso('Imagem salva.'); App.registrar('arte', { titulo: 'Arte exportada', ref: ref }); return true; }
      catch (e) { if (e && e.code === 'declined') return false; }
    } else {
      try { var a = h('a', { href: URL.createObjectURL(blob), download: nome }); document.body.appendChild(a); a.click(); a.remove(); App.registrar('arte', { titulo: 'Arte exportada', ref: ref }); }
      catch (e) { /* segue para a visualização */ }
    }
    var url = URL.createObjectURL(blob);
    UI.folha('Salvar imagem', h('div.form', h('p.sub', 'Se o download não começou, toque e segure a imagem para salvar na galeria do aparelho.'), h('img', { src: url, alt: 'Arte gerada', style: { width: '100%', borderRadius: '12px' } })));
    return true;
  }
  // Compartilha uma imagem pelo menu do aparelho; sem suporte, oferece o texto.
  async function compartilharImagem(blob, nome, texto) {
    try {
      var arq = new File([blob], nome, { type: blob.type || 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [arq] })) { await navigator.share({ files: [arq] }); return true; }
    } catch (e) { if (e && e.name === 'AbortError') return false; }
    UI.aviso('Neste ambiente, baixe a imagem e compartilhe pela galeria. O texto pode ser enviado agora.');
    if (texto) App.compartilhar(texto, 'Compartilhar');
    return false;
  }
  async function gerarArquivo(spec, opcoes) {
    opcoes = opcoes || {};
    var cont = await A2Desenho.textoDaArte(spec).catch(function () { return null; });
    var blob = await A2Desenho.exportar(spec, opcoes);
    return { blob: blob, nome: nomeArquivo(spec, cont, opcoes.tipo === 'jpeg' ? 'jpg' : 'png'), cont: cont };
  }
  async function baixarArte(specEntrada, opcoes) {
    var spec = A2Arte.migrar(specEntrada);
    if (await fotoSemTexto(spec)) { avisarFotoSemTexto(); return false; }
    UI.aviso('Gerando a imagem…');
    var a = await gerarArquivo(spec, opcoes);
    return salvarImagem(a.blob, a.nome, a.cont && a.cont.ref);
  }
  async function compartilharArte(specEntrada, opcoes) {
    var spec = A2Arte.migrar(specEntrada);
    if (await fotoSemTexto(spec)) { avisarFotoSemTexto(); return false; }
    var a = await gerarArquivo(spec, opcoes), c = a.cont;
    var texto = c ? (c.livre ? c.texto : '“' + c.texto + '”\n— ' + c.ref) : '';
    return compartilharImagem(a.blob, a.nome, texto);
  }
  async function miniatura(spec) {
    var c = document.createElement('canvas'); await A2Desenho.desenhar(c, spec, 240);
    return c.toDataURL('image/jpeg', 0.8);
  }

  // ================================================================ dados: artes e modelos
  function artes() {
    return Dados.todos('artes').map(function (a) { return Object.assign({ estado: 'finalizada' }, a); })
      .sort(function (a, b) { return String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)); });
  }
  function modeloDeRegistro(r) {
    if (r.v === 2) return { id: 'meu:' + r.id, idRegistro: r.id, nome: r.nome, fundo: r.fundo, camadas: r.camadas, formato: r.formato, meu: true };
    var s = A2Arte.migrar({ fundo: r.fundo, escurecer: r.escurecer, estilo: r.estilo, pos: r.pos, assinatura: r.assinatura, formato: r.formato, conteudo: { tipo: 'versiculo', ref: 'At 2:42' } });
    return { id: 'meu:' + r.id, idRegistro: r.id, nome: r.nome, fundo: s.fundo, camadas: s.camadas, formato: r.formato, meu: true };
  }
  function meusModelos() { return Dados.todos('modelos').map(modeloDeRegistro); }
  function modelosFavoritos() { return Dados.todos('modelosFav').map(function (f) { return A2Modelos.POR_ID[f.id] || null; }).filter(Boolean); }
  function ehFavorito(m) { return !!Dados.obter('modelosFav', m.id); }
  function alternarFavorito(m) { if (ehFavorito(m)) Dados.excluir('modelosFav', m.id); else Dados.salvar('modelosFav', m.id, { em: new Date().toISOString() }); return ehFavorito(m); }
  var BRANCO = { id: 'branco', nome: 'Em branco', fundo: { tipo: 'cor', cor: '#FFFFFF' },
    camadas: [{ papel: 'versiculo', cor: '#192D50', sombra: 0 }, { papel: 'referencia', cor: '#A58A57', sombra: 0 }] };

  function conteudoInicial() { return { tipo: 'versiculo', ref: '', versao: Biblia.padrao(), rotulo: '' }; }
  function baseNova(n) { return A2Arte.normalizar({ formato: n.formato || 'feed', personalizado: n.personalizado, conteudo: n.conteudo, camadas: [] }); }

  // Abre uma arte no editor
  function abrirNoEditor(spec, id) {
    E.spec = A2Arte.migrar(spec); E.id = id || null; E.sel = 'versiculo'; E.hist = null; E.status = id ? 'salvo' : 'pendente'; E.zoom = 1; E.voltar = null;
    E.painel = 'texto'; E.painelAberto = true; E.sub = {};
    ir('editor');
    if (!id) setTimeout(function () { salvarAgora(); }, 50);
  }
  function abrirArte(reg) { abrirNoEditor(reg.spec, reg.id); }
  function novaArte(modelo) { E.novo = { conteudo: conteudoInicial(), formato: 'feed', modelo: modelo || null }; E.voltar = null; ir('versiculo'); }

  var tSalvar = null, salvando = null;
  function agendarSalvar() { E.status = 'pendente'; mostrarStatus(); clearTimeout(tSalvar); tSalvar = setTimeout(function () { salvarAgora(); }, 1200); }
  async function salvarAgora(estado) {
    clearTimeout(tSalvar); tSalvar = null;
    if (!E.spec) return;
    var spec = clonar(E.spec), id = E.id || (E.id = UI.uid());
    E.status = 'salvando'; mostrarStatus();
    var trabalho = (async function () {
      var atual = Dados.obter('artes', id) || {}, agora = new Date().toISOString();
      var mini = await miniatura(spec).catch(function () { return atual.miniatura || ''; });
      var cont = await A2Desenho.textoDaArte(spec).catch(function () { return null; });
      Dados.salvar('artes', id, { spec: spec, miniatura: mini, titulo: spec.nome || (cont && (cont.livre ? (cont.texto || '').slice(0, 40) : cont.refBase)) || 'Arte',
        nome: spec.nome || '', estado: estado || atual.estado || 'rascunho', atualizadoEm: agora, criadoEm: atual.criadoEm || agora });
    })();
    salvando = trabalho; await trabalho; if (salvando === trabalho) salvando = null;
    if (!tSalvar) { E.status = 'salvo'; mostrarStatus(); }
  }
  function mostrarStatus() {
    if (!ED.status || !ED.status.isConnected) return;
    ED.status.textContent = E.status === 'salvando' ? 'Salvando…' : E.status === 'pendente' ? 'Alterações não salvas' : 'Salvo automaticamente';
    ED.status.dataset.estado = E.status;
  }

  // ================================================================ componentes comuns
  var NOMES_PASSOS = ['Versículo', 'Modelo', 'Personalizar', 'Exportar'];
  function passos(n) {
    return h('ol.passos', { 'aria-label': 'Etapa ' + n + ' de 4' }, NOMES_PASSOS.map(function (t, i) {
      return h('li' + (i + 1 === n ? '.atual' : i + 1 < n ? '.feito' : ''), { 'aria-current': i + 1 === n ? 'step' : null }, h('b', i + 1 < n ? '✓' : String(i + 1)), h('span', t));
    }));
  }
  function cabEtapa(titulo, n, voltar) {
    return h('div', h('header.cab', h('button.bt-ico', { 'aria-label': 'Voltar', on: { click: voltar } }, ico('esquerda')), h('h1', titulo), h('div.esp')), n ? passos(n) : null);
  }
  function marcar(pai, el) { pai.querySelectorAll('[aria-pressed]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === el)); }); }
  function chips(lista, atual, fn, extra) {
    return h('div.chips' + (extra || ''), lista.map(function (x) {
      return h('button.chip', { type: 'button', 'aria-pressed': String(x[0] === atual), on: { click: function () { marcar(this.parentNode, this); fn(x[0]); } } }, x[1]);
    }));
  }
  function chave(id, rotulo, valor, fn) {
    var i = h('input.interruptor#' + id, { type: 'checkbox' }); i.checked = !!valor;
    i.addEventListener('change', function () { fn(i.checked); });
    return h('label.chave', { for: id }, h('span', rotulo), i);
  }

  // ================================================================ início (hub)
  function hub(tela) {
    tela.appendChild(h('header.cab', h('h1', 'Criar'), h('div.esp')));
    tela.appendChild(h('section.criar-hero',
      h('span.sobretitulo', 'Estúdio de Criação'),
      h('h2', 'Transforme a Palavra em arte'),
      h('p', 'Escolha o versículo, um modelo e personalize cada detalhe. O texto bíblico sai exatamente como na tradução.'),
      h('ol.passos-hero', NOMES_PASSOS.map(function (t, i) { return h('li', h('b', String(i + 1)), t); })),
      h('div.linha-bts',
        h('button.bt.ouro#nova-arte', { on: { click: function () { novaArte(); } } }, ico('mais'), 'Nova arte'),
        App.temIA ? h('button.bt.claro#criar-ia', { on: { click: function () { criarComIA(); } } }, ico('brilho'), 'Criar com IA') : null)));
    var lista = artes(), rasc = lista.filter(function (a) { return a.estado === 'rascunho'; })[0];
    if (rasc) tela.appendChild(h('button.continuar-arte', { on: { click: function () { abrirArte(rasc); } } },
      rasc.miniatura ? h('img', { src: rasc.miniatura, alt: '' }) : h('span'), h('div', h('span.meta', 'Continuar editando'), h('b', rasc.titulo || 'Arte'), h('span.meta', 'Rascunho · ' + UI.dataCurta(rasc.atualizadoEm))), ico('direita')));
    tela.appendChild(h('button.item.inspira', { on: { click: function () { ir('galeria'); } } }, ico('colecao'),
      h('div.corpo', h('span.titulo', 'Inspirações prontas'), h('span.meta', 'Artes com versículos para baixar, compartilhar ou personalizar')), ico('direita')));

    tela.appendChild(h('h2.secao-criar', 'Minhas artes'));
    var abas = [['recentes', 'Recentes'], ['rascunhos', 'Rascunhos'], ['finalizadas', 'Finalizadas'], ['favoritos', 'Modelos favoritos'], ['meus', 'Meus modelos']];
    var area = h('div.area-minhas');
    tela.appendChild(chips(abas, E.abaMinhas, function (a) { E.abaMinhas = a; mostrarMinhas(area); }, '.abas-minhas'));
    tela.appendChild(area);
    mostrarMinhas(area);
  }
  function mostrarMinhas(area) {
    var aba = E.abaMinhas, lista = artes();
    area.replaceChildren();
    if (aba === 'favoritos' || aba === 'meus') {
      var mods = aba === 'favoritos' ? modelosFavoritos() : meusModelos();
      if (!mods.length) { area.appendChild(h('div.vazio', h('b', aba === 'favoritos' ? 'Nenhum modelo favorito.' : 'Nenhum modelo seu ainda.'),
        h('span', aba === 'favoritos' ? 'Na escolha de modelos, toque no coração para guardar os que você mais usa.' : 'No editor, abra o menu ⋮ e toque em “Salvar como modelo”.'))); return; }
      var base = A2Arte.normalizar({ formato: 'feed', conteudo: { tipo: 'versiculo', ref: 'At 2:42', versao: Biblia.padrao() } });
      var grade = h('div.artes-grade'); area.appendChild(grade);
      var fila = mods.map(function (m) {
        var cv = h('canvas');
        grade.appendChild(h('button.arte-card', { on: { click: function () { acoesModelo(m, area); } } }, cv, h('small', m.nome)));
        return function () { return cv.isConnected ? A2Desenho.desenhar(cv, A2Arte.aplicarModelo(base, m), 300) : Promise.resolve(); };
      });
      (async function () { for (var i = 0; i < fila.length; i++) await fila[i]().catch(function () {}); })();
      return;
    }
    var itens = aba === 'rascunhos' ? lista.filter(function (a) { return a.estado === 'rascunho'; }) : aba === 'finalizadas' ? lista.filter(function (a) { return a.estado !== 'rascunho'; }) : lista.slice(0, 12);
    if (!itens.length) {
      area.appendChild(h('div.vazio', h('b', aba === 'rascunhos' ? 'Nenhum rascunho.' : aba === 'finalizadas' ? 'Nenhuma arte finalizada.' : 'Nenhuma arte ainda.'),
        h('span', 'Suas artes são salvas automaticamente enquanto você edita. Ao exportar, elas passam para Finalizadas.'),
        h('button.bt.pri', { on: { click: function () { novaArte(); } } }, ico('mais'), 'Criar a primeira arte')));
      return;
    }
    area.appendChild(h('div.artes-grade', itens.map(function (a) {
      return h('button.arte-card.minha', { on: { click: function () { acoesArte(a, area); } } },
        a.miniatura ? h('img', { src: a.miniatura, alt: a.titulo }) : h('span.sem-mini'),
        h('small', a.estado === 'rascunho' ? h('span.selo', 'Rascunho') : null, ' ', a.titulo + ' · ' + UI.dataCurta(a.atualizadoEm)));
    })));
  }
  function acoesArte(a, area) {
    UI.folha(a.titulo || 'Arte', function (api) {
      return h('div.form', a.miniatura ? h('img', { src: a.miniatura, alt: a.titulo, style: { width: '100%', maxWidth: '300px', borderRadius: '12px', justifySelf: 'center' } }) : null,
        h('p.sub', { style: { textAlign: 'center' } }, (a.estado === 'rascunho' ? 'Rascunho' : 'Finalizada') + ' · atualizada em ' + UI.dataCurta(a.atualizadoEm)),
        h('div.linha-bts', { style: { justifyContent: 'center' } },
          h('button.bt.pri', { on: { click: function () { api.fechar(); abrirArte(a); } } }, ico('editar'), 'Abrir e editar'),
          h('button.bt', { on: { click: function () { compartilharArte(a.spec); } } }, ico('compartilhar'), 'Compartilhar'),
          h('button.bt', { on: { click: function () { baixarArte(a.spec); } } }, ico('baixar'), 'Baixar'),
          h('button.bt', { on: { click: function () {
            var id = UI.uid(), agora = new Date().toISOString(), s = A2Arte.migrar(a.spec);
            s.nome = (s.nome || a.titulo || 'Arte') + ' (cópia)';
            Dados.salvar('artes', id, { spec: s, miniatura: a.miniatura, titulo: s.nome, nome: s.nome, estado: 'rascunho', atualizadoEm: agora, criadoEm: agora });
            api.fechar(); UI.aviso('Arte duplicada.'); if (area) mostrarMinhas(area);
          } } }, ico('duplicar'), 'Duplicar'),
          h('button.bt.perigo', { on: { click: async function () {
            if (await UI.confirmar('Excluir arte', 'Esta arte será removida de Minhas artes.', 'Excluir', true)) { Dados.excluir('artes', a.id); if (E.id === a.id) { E.spec = null; E.id = null; } api.fechar(); if (area) mostrarMinhas(area); }
          } } }, ico('lixo'), 'Excluir')));
    });
  }
  function acoesModelo(m, area) {
    UI.folha(m.nome, function (api) {
      var cv = h('canvas.previa-grande');
      A2Desenho.desenhar(cv, A2Arte.aplicarModelo(A2Arte.normalizar({ formato: m.formato || 'feed', conteudo: { tipo: 'versiculo', ref: 'At 2:42', versao: Biblia.padrao() } }), m), 640);
      return h('div.form', cv, h('div.linha-bts', { style: { justifyContent: 'center' } },
        h('button.bt.pri', { on: { click: function () { api.fechar(); novaArte(m); } } }, ico('mais'), 'Criar com este modelo'),
        m.meu ? h('button.bt.perigo', { on: { click: async function () { if (await UI.confirmar('Excluir modelo', 'O modelo “' + m.nome + '” será removido.', 'Excluir', true)) { Dados.excluir('modelos', m.idRegistro); api.fechar(); mostrarMinhas(area); } } } }, ico('lixo'), 'Excluir')
          : h('button.bt', { on: { click: function () { alternarFavorito(m); api.fechar(); mostrarMinhas(area); } } }, ico('coracaoCheio'), 'Remover dos favoritos')));
    });
  }

  // ================================================================ etapa 1 — versículo
  var SUGESTOES = ['At 2:42', 'Sl 23:1', 'Jo 3:16', 'Fp 4:13', 'Is 41:10', 'Rm 8:28', 'Js 1:9', 'Mt 11:28'];
  function etapaVersiculo(tela) {
    var n = E.novo || (E.novo = { conteudo: conteudoInicial(), formato: 'feed' });
    var c = n.conteudo;
    function voltar() { if (E.voltar === 'editor' && E.spec) { E.voltar = null; ir('editor'); } else ir('inicio'); }
    tela.appendChild(cabEtapa(E.voltar === 'editor' ? 'Trocar o versículo' : 'Escolha o versículo', 1, voltar));
    var area = h('div.form.etapa'), previa = h('div.previa-vers', { 'aria-live': 'polite' }), bContinuar;
    tela.appendChild(chips([['versiculo', 'Da Bíblia'], ['livre', 'Texto próprio']], c.tipo, function (t) {
      if (t === 'livre') n.conteudo = { tipo: 'livre', texto: c.texto || '', legenda: c.legenda || '' };
      else n.conteudo = Object.assign(conteudoInicial(), c.tipo === 'versiculo' ? c : {});
      c = n.conteudo; montar();
    }));
    tela.appendChild(area); tela.appendChild(previa);
    tela.appendChild(h('div.rodape-etapa', bContinuar = h('button.bt.pri.grande#continuar-1', { on: { click: continuar } }, E.voltar === 'editor' ? 'Aplicar à arte' : 'Continuar', ico('direita'))));

    function montar() {
      area.replaceChildren();
      if (c.tipo === 'livre') {
        var ta = h('textarea.entrada#arte-livre', { rows: 4, maxlength: 600, placeholder: 'Escreva sua frase, reflexão ou convite' }); ta.value = c.texto || '';
        var leg = h('input.entrada#arte-leg', { type: 'text', maxlength: 80, placeholder: 'Ex.: Culto de domingo, 19h' }); leg.value = c.legenda || '';
        ta.addEventListener('input', function () { c.texto = ta.value; mostrarPrevia(); });
        leg.addEventListener('input', function () { c.legenda = leg.value; mostrarPrevia(); });
        area.appendChild(h('label.campo', { for: 'arte-livre' }, h('span', 'Seu texto'), ta));
        area.appendChild(h('label.campo', { for: 'arte-leg' }, h('span', 'Legenda (opcional)'), leg));
        area.appendChild(h('div.aviso', ico('info'), h('span', 'Texto próprio é seu: ele não é apresentado como versículo bíblico. Para citar a Bíblia, use “Da Bíblia”, que traz o texto exato da tradução.')));
        mostrarPrevia(); return;
      }
      // busca por referência ou palavra
      var busca = h('input.entrada#arte-busca', { type: 'search', placeholder: 'Referência ou palavra (ex.: Jo 3:16, paz, pastor)', autocomplete: 'off', enterkeyhint: 'search' });
      var resultados = h('div.resultados-busca'), t = null, livros = null;
      busca.addEventListener('input', function () { clearTimeout(t); t = setTimeout(buscar, 380); });
      busca.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(t); buscar(); } });
      async function buscar() {
        var q = busca.value.trim(); resultados.replaceChildren();
        if (!q) return;
        var r = Biblia.interpretar(q, c.versao);
        if (r.ok && /\d/.test(q)) {
          if (r.ref.v1 == null) { resultados.appendChild(h('p.sub', 'Indique também os versículos, por exemplo ' + A2Ref.formatar(r.ref) + ':1-3.')); return; }
          var it = h('button.item', { on: { click: function () { escolher(A2Ref.formatar(r.ref, true)); resultados.replaceChildren(); busca.value = ''; } } }, ico('livro'),
            h('div.corpo', h('span.titulo', A2Ref.formatar(r.ref)), h('span.texto-vers', '…')), ico('ok'));
          resultados.appendChild(it);
          Biblia.textoDe(r.ref, c.versao).then(function (vs) { it.querySelector('.texto-vers').textContent = vs.map(function (x) { return UI.plano(x.t); }).join(' '); }, function () {});
          return;
        }
        if (q.length < 3) { resultados.appendChild(h('p.sub', 'Digite pelo menos 3 letras para procurar uma palavra.')); return; }
        resultados.appendChild(h('div.carregando', h('div.giro'), h('span.prog', 'Procurando na Bíblia…')));
        try { livros = livros || await Biblia.todosOsLivros(c.versao, function (i, tot) { var p = resultados.querySelector('.prog'); if (p) p.textContent = 'Carregando a Bíblia (' + i + ' de ' + tot + ')…'; }); }
        catch (e) { resultados.replaceChildren(h('p.sub', 'Não foi possível procurar agora: ' + e.message)); return; }
        if (q !== busca.value.trim()) return;
        var res = A2Busca.pesquisar(livros, q, { limite: 40, grafiaAntiga: !!Biblia.versao(c.versao).grafiaAntiga });
        resultados.replaceChildren(h('p.sub', res.total ? res.total + ' versículo' + (res.total > 1 ? 's' : '') + (res.total > 40 ? ' (mostrando 40)' : '') : 'Nada encontrado. Tente outra palavra.'));
        res.resultados.forEach(function (x) {
          var ref = { livro: x.livro, cap: x.cap, v1: x.v, v2: x.v }, tx = h('span.texto-vers');
          A2Busca.partes(x.texto, x.trechos).forEach(function (p) { tx.appendChild(p.destaque ? h('mark', p.t) : document.createTextNode(p.t)); });
          resultados.appendChild(h('button.item', { on: { click: function () { escolher(A2Ref.formatar(ref, true)); resultados.replaceChildren(); busca.value = ''; } } }, h('div.corpo', h('span.titulo', A2Ref.formatar(ref)), tx)));
        });
      }
      area.appendChild(h('label.campo', { for: 'arte-busca' }, h('span', 'Procurar'), busca));
      area.appendChild(resultados);

      // livro, capítulo e versículos
      var selLivro = h('select.entrada#sel-livro', { 'aria-label': 'Livro' }), selCap = h('select.entrada#sel-cap', { 'aria-label': 'Capítulo' }),
        selV1 = h('select.entrada#sel-v1', { 'aria-label': 'Do versículo' }), selV2 = h('select.entrada#sel-v2', { 'aria-label': 'Até o versículo' });
      var cont = Biblia.contagemSinc(c.versao);
      A2Ref.LIVROS.forEach(function (l) { if (cont(l.id)) selLivro.appendChild(h('option', { value: l.id }, l.nome)); });
      var atual = c.ref ? Biblia.interpretar(c.ref, c.versao) : null, ref0 = atual && atual.ok ? atual.ref : { livro: 'ACT', cap: 2, v1: 42, v2: 42 };
      function opcoes(sel, n0, n1, v) { sel.replaceChildren(); for (var i = n0; i <= n1; i++) { var o = h('option', { value: i }, String(i)); if (i === v) o.selected = true; sel.appendChild(o); } }
      function encher(ref) {
        selLivro.value = ref.livro;
        var vs = cont(ref.livro) || [1]; opcoes(selCap, 1, vs.length, ref.cap);
        var nv = vs[ref.cap - 1] || 1; opcoes(selV1, 1, nv, ref.v1 || 1); opcoes(selV2, ref.v1 || 1, Math.min(nv, (ref.v1 || 1) + 5), ref.v2 || ref.v1 || 1);
      }
      encher(ref0);
      function doSeletor(muda) {
        var livro = selLivro.value, vs = cont(livro) || [1], cap = muda === 'livro' ? 1 : +selCap.value;
        var v1 = muda === 'livro' || muda === 'cap' ? 1 : +selV1.value, v2 = muda === 'v2' ? +selV2.value : v1;
        encher({ livro: livro, cap: Math.min(cap, vs.length), v1: v1, v2: v2 });
        escolher(A2Ref.formatar({ livro: livro, cap: +selCap.value, v1: +selV1.value, v2: +selV2.value }, true), true);
      }
      selLivro.addEventListener('change', function () { doSeletor('livro'); });
      selCap.addEventListener('change', function () { doSeletor('cap'); });
      selV1.addEventListener('change', function () { doSeletor('v1'); });
      selV2.addEventListener('change', function () { doSeletor('v2'); });
      area.appendChild(h('div.campo', h('span', 'Ou escolha por livro, capítulo e versículos'),
        h('div.seletor-ref', selLivro, selCap, h('div.seletor-vs', selV1, h('span', 'até'), selV2))));

      var trad = h('select.entrada#arte-trad', Biblia.VERSOES.map(function (v) { var o = h('option', { value: v.id, disabled: !v.ativa }, v.nome + (v.ativa ? '' : ' (licença pendente)')); if (v.id === c.versao) o.selected = true; return o; }));
      trad.addEventListener('change', async function () { c.versao = trad.value; livros = null; try { await Biblia.indice(c.versao); } catch (e) {} mostrarPrevia(); });
      area.appendChild(h('label.campo', { for: 'arte-trad' }, h('span', 'Tradução'), trad));
      area.appendChild(h('div.campo', h('span', 'Sugestões'), h('div.chips', SUGESTOES.map(function (s) { return h('button.chip', { type: 'button', on: { click: function () { escolher(s); } } }, s); }).concat([
        h('button.chip', { type: 'button', on: { click: escolherFavorito } }, ico('coracao'), ' Favoritos')]))));

      function escolher(refStr, doSel) {
        var r = Biblia.interpretar(refStr, c.versao);
        if (!r.ok || r.ref.v1 == null) { UI.aviso(r.ok ? 'Indique os versículos, por exemplo Sl 23:1-3.' : r.erro, true); return; }
        var qtd = A2Ref.versiculosDa(r.ref, Biblia.contagemSinc(c.versao)).length;
        if (qtd > 6) { UI.aviso('Para caber na arte, escolha até 6 versículos.', true); return; }
        c.ref = A2Ref.formatar(r.ref, true); c.rotulo = '';
        if (!doSel) encher(r.ref);
        mostrarPrevia();
      }
      function escolherFavorito() {
        UI.folha('Versículos favoritos', function (api) {
          var favs = Dados.todos('favoritos');
          if (!favs.length) return h('div.vazio', h('b', 'Você ainda não tem favoritos.'), h('span', 'Na Bíblia, toque em um versículo e escolha Favoritar.'));
          return h('div.lista', favs.map(function (f) {
            var k = A2Ref.deChave(f.id), r = { livro: k.livro, cap: k.cap, v1: k.v, v2: k.v }, t = h('span.texto-vers', '…');
            Biblia.textoDe(r).then(function (vs) { t.textContent = UI.plano(vs[0].t); }, function () {});
            return h('button.item', { on: { click: function () { api.fechar(); escolher(A2Ref.formatar(r, true)); } } }, h('div.corpo', h('span.titulo', A2Ref.formatar(r)), t));
          }));
        });
      }
      mostrarPrevia();
    }

    var ultimoPedido = 0;
    async function mostrarPrevia() {
      var pedido = ++ultimoPedido;
      if (c.tipo === 'livre') {
        previa.replaceChildren(h('span.rotulo', 'Prévia do texto'), h('p.texto', c.texto || 'Seu texto aparecerá aqui.'), c.legenda ? h('p.ref', c.legenda) : null);
        bContinuar.disabled = !String(c.texto || '').trim(); return;
      }
      if (!c.ref) { previa.replaceChildren(h('span.rotulo', 'Prévia'), h('p.sub', 'Escolha um versículo pela busca, pelo livro ou pelas sugestões.')); bContinuar.disabled = true; return; }
      previa.replaceChildren(h('span.rotulo', 'Prévia'), h('p.sub', 'Carregando…'));
      try {
        var r = await Biblia.textoDeString(c.ref, c.versao);
        if (pedido !== ultimoPedido) return;
        var auto = A2Ref.formatar(r.ref), rot = h('input.entrada#arte-rotulo', { type: 'text', maxlength: 60, placeholder: auto }); rot.value = c.rotulo || '';
        var refLinha = h('p.ref', (c.rotulo || auto) + ' · ' + Biblia.versao(c.versao).sigla);
        rot.addEventListener('input', function () { c.rotulo = rot.value.trim(); refLinha.textContent = (c.rotulo || auto) + ' · ' + Biblia.versao(c.versao).sigla; });
        previa.replaceChildren(h('span.rotulo', 'Texto que vai na arte (exato da tradução)'),
          h('p.texto', r.versos.map(function (x) { return UI.plano(x.t); }).join(' ')), refLinha,
          h('label.campo', { for: 'arte-rotulo' }, h('span', 'Referência exibida na arte (opcional)'), rot),
          h('p.sub', ico('escudo'), ' O texto bíblico não pode ser editado; você pode ajustar apenas como a referência aparece.'));
        bContinuar.disabled = false;
      } catch (e) { if (pedido === ultimoPedido) { previa.replaceChildren(h('span.rotulo', 'Prévia'), h('p.sub.erro', e.message)); bContinuar.disabled = true; } }
    }

    function continuar() {
      if (bContinuar.disabled) return;
      var conteudo = clonar(c);
      if (E.voltar === 'editor' && E.spec) {
        E.spec.conteudo = A2Arte.normalizar({ conteudo: conteudo }).conteudo; E.voltar = null; E.novo = null;
        E.etapa = 'editor'; App.recarregar(); commit(); return;
      }
      if (n.modelo) { var m = n.modelo; E.novo = null; abrirNoEditor(Object.assign(A2Arte.aplicarModelo(baseNova(n), m), { nome: '' }), null); return; }
      ir('modelo');
    }
    montar();
  }

  // ================================================================ etapa 2 — modelo
  var FORMATOS_RAPIDOS = [['feed', 'Feed'], ['quadrado', 'Quadrado'], ['stories', 'Stories'], ['status', 'Status']];
  function etapaModelo(tela) {
    var trocando = E.voltar === 'editor' && E.spec;
    var n = trocando ? { conteudo: E.spec.conteudo, formato: E.spec.formato, personalizado: E.spec.personalizado } : E.novo;
    if (!n) { E.etapa = 'versiculo'; etapaVersiculo(tela); return; }
    tela.appendChild(cabEtapa(trocando ? 'Trocar o modelo' : 'Escolha um modelo', 2, function () { if (trocando) { E.voltar = null; ir('editor'); } else ir('versiculo'); }));
    if (!trocando) tela.appendChild(chips(FORMATOS_RAPIDOS, n.formato, function (f) { n.formato = f; desenharGrade(); }, '.formatos-rapidos'));
    var cats = [['todos', 'Todos'], ['favoritos', '♥ Favoritos'], ['meus', 'Meus modelos']].concat(A2Modelos.CATEGORIAS.map(function (c) { return [c.id, c.nome]; }));
    tela.appendChild(chips(cats, E.catModelo, function (c) { E.catModelo = c; desenharGrade(); }, '.cats-modelo'));
    if (App.temIA && !trocando) tela.appendChild(h('button.item.ia-card', { on: { click: function () { criarComIA(n); } } }, ico('brilho'),
      h('div.corpo', h('span.titulo', 'Criar com IA'), h('span.meta', 'Descreva o clima da arte; a IA monta a composição com camadas editáveis.')), ico('direita')));
    var grade = h('div.modelos-grade'); tela.appendChild(grade);
    if (trocando) tela.appendChild(h('p.sub', { style: { marginTop: '10px' } }, 'O modelo troca fundo, fontes, cores e elementos. O versículo e o formato continuam os mesmos.'));

    var fila = [], ocupado = false, obs = null;
    function processar() {
      if (ocupado) return; var f = fila.shift(); if (!f) return; ocupado = true;
      f().catch(function () {}).then(function () { ocupado = false; processar(); });
    }
    function desenharGrade() {
      if (obs) obs.disconnect(); fila = [];
      grade.replaceChildren();
      var base = baseNova(n), cat = E.catModelo, lista;
      if (cat === 'favoritos') lista = modelosFavoritos();
      else if (cat === 'meus') lista = meusModelos();
      else if (cat === 'todos') lista = [BRANCO].concat(A2Modelos.MODELOS);
      else lista = A2Modelos.daCategoria(cat);
      if (!lista.length) { grade.appendChild(h('div.vazio', h('b', cat === 'favoritos' ? 'Nenhum favorito ainda.' : 'Nenhum modelo seu ainda.'), h('span', cat === 'favoritos' ? 'Toque no coração de um modelo para guardá-lo aqui.' : 'No editor, use ⋮ › Salvar como modelo.'))); return; }
      obs = 'IntersectionObserver' in window ? new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) { obs.unobserve(en.target); fila.push(en.target._desenhar); processar(); } });
      }, { rootMargin: '300px' }) : null;
      lista.forEach(function (m) {
        var spec = A2Arte.aplicarModelo(base, m), cv = h('canvas', { 'aria-hidden': 'true' });
        var bFav = m.meu || m.id === 'branco' ? null : h('button.bt-ico.peq.mc-fav', { 'aria-label': 'Favoritar ' + m.nome, 'aria-pressed': String(ehFavorito(m)),
          on: { click: function (e) { e.stopPropagation(); var f = alternarFavorito(m); bFav.setAttribute('aria-pressed', String(f)); bFav.replaceChildren(ico(f ? 'coracaoCheio' : 'coracao')); UI.aviso(f ? 'Modelo favoritado.' : 'Removido dos favoritos.'); } } }, ico(ehFavorito(m) ? 'coracaoCheio' : 'coracao'));
        var card = h('div.modelo-card', { 'data-modelo': m.id },
          h('button.mc-usar', { 'aria-label': 'Usar o modelo ' + m.nome, on: { click: function () { usarModelo(m); } } }, cv),
          h('div.mc-rodape', h('small', m.nome), bFav,
            h('button.bt-ico.peq', { 'aria-label': 'Ver ' + m.nome + ' em tela cheia', on: { click: function () { verModelo(m, spec); } } }, ico('expandir'))));
        card._desenhar = function () { return card.isConnected ? A2Desenho.desenhar(cv, spec, 300) : Promise.resolve(); };
        grade.appendChild(card);
        if (obs) obs.observe(card); else fila.push(card._desenhar);
      });
      processar();
    }
    App.aoSair(function () { if (obs) obs.disconnect(); fila = []; });
    function usarModelo(m) {
      if (trocando) {
        var nova = A2Arte.aplicarModelo(E.spec, m); nova.nome = E.spec.nome;
        E.spec = nova; E.sel = 'versiculo'; E.voltar = null; E.etapa = 'editor'; App.recarregar(); commit(); return;
      }
      var s = A2Arte.aplicarModelo(baseNova(n), m); E.novo = null; abrirNoEditor(s, null);
    }
    function verModelo(m, spec) {
      UI.folha(m.nome, function (api) {
        var cv = h('canvas.previa-grande'); A2Desenho.desenhar(cv, spec, 760);
        var fav = ehFavorito(m);
        var bFav = m.meu || m.id === 'branco' ? null : h('button.bt', { on: { click: function () { fav = alternarFavorito(m); bFav.replaceChildren(ico(fav ? 'coracaoCheio' : 'coracao'), fav ? 'Favorito' : 'Favoritar'); desenharGrade(); } } }, ico(fav ? 'coracaoCheio' : 'coracao'), fav ? 'Favorito' : 'Favoritar');
        return h('div.form', cv, h('div.linha-bts', { style: { justifyContent: 'center' } },
          h('button.bt.pri', { on: { click: function () { api.fechar(); usarModelo(m); } } }, ico('ok'), 'Usar este modelo'), bFav));
      }, { cheia: true });
    }
    desenharGrade();
  }

  // ================================================================ Criar com IA (somente onde a IA está disponível)
  function criarComIA(n) {
    if (!App.temIA) return;
    n = n || E.novo || { conteudo: conteudoInicial(), formato: 'feed' };
    UI.folha('Criar com IA', function (api) {
      var ref = h('input.entrada#ia-ref', { type: 'text', placeholder: 'Ex.: Sl 23:1-3', autocomplete: 'off' }); ref.value = n.conteudo.tipo === 'versiculo' ? (n.conteudo.ref || '') : '';
      var desc = h('textarea.entrada#ia-desc', { rows: 3, maxlength: 300, placeholder: 'Ex.: calma e esperança, tons de amanhecer, estilo elegante' });
      var fmt = n.formato || 'feed', estado = h('p.sub', { 'aria-live': 'polite' }), bt = h('button.bt.pri#ia-criar', { on: { click: gerar } }, ico('brilho'), 'Criar arte');
      async function gerar() {
        var sample = root.claude && root.claude.use ? await root.claude.use('sample') : null;
        if (!sample) { estado.textContent = 'A criação com IA não está disponível aqui.'; return; }
        var r = Biblia.interpretar(ref.value.trim() || 'At 2:42');
        if (!r.ok || r.ref.v1 == null) { estado.textContent = 'Informe um versículo válido, por exemplo Sl 23:1.'; return; }
        if (A2Ref.versiculosDa(r.ref, Biblia.contagemSinc()).length > 6) { estado.textContent = 'Para caber na arte, escolha até 6 versículos.'; return; }
        if (!desc.value.trim()) { estado.textContent = 'Descreva como você imagina a arte.'; return; }
        bt.disabled = true; estado.textContent = 'Montando a composição…';
        try {
          var refStr = A2Ref.formatar(r.ref, true), versao = n.conteudo.versao || Biblia.padrao(), tx = await Biblia.textoDeString(refStr, versao);
          var F = A2Arte.formatoDe({ formato: fmt });
          var resp = await sample(promptIA(desc.value.trim(), tx.versos.map(function (x) { return UI.plano(x.t); }).join(' '), F), { modelTier: 'default' });
          var modelo = A2Arte.validarDesenhoIA(A2Arte.lerJson(resp && resp.text), A2Fotos.LISTA.map(function (f) { return f.id; }));
          if (!modelo) throw new Error('A resposta não trouxe uma composição válida. Tente descrever de outro jeito.');
          var base = A2Arte.normalizar({ formato: fmt, conteudo: { tipo: 'versiculo', ref: refStr, versao: versao } });
          var s = A2Arte.aplicarModelo(base, modelo); s.nome = modelo.nome; s.criadaComIA = true;
          api.fechar(); E.novo = null; abrirNoEditor(s, null);
          UI.aviso('Composição criada. Tudo é editável; o versículo veio da tradução.');
        } catch (e) {
          estado.textContent = e && e.code === 'rate_limited' ? 'Muitos pedidos seguidos. Aguarde um pouco e tente de novo.' : e && e.code === 'not_granted' ? 'A criação com IA não foi autorizada aqui.' : (e.message || 'Não foi possível criar agora.');
        } finally { bt.disabled = false; }
      }
      return h('div.form', h('label.campo', { for: 'ia-ref' }, h('span', 'Versículo'), ref),
        h('label.campo', { for: 'ia-desc' }, h('span', 'Como deve ser a arte?'), desc),
        h('div.campo', h('span', 'Formato'), chips(FORMATOS_RAPIDOS, fmt, function (f) { fmt = f; })),
        bt, estado,
        h('div.aviso-ia', ico('brilho'), h('span', 'A IA sugere só a composição (fundo, fontes, cores e elementos). O versículo é sempre inserido pelo app, exatamente como na tradução.')));
    });
  }
  function promptIA(pedido, versiculo, F) {
    return 'Você é diretor de arte de um aplicativo cristão. Monte a COMPOSIÇÃO de uma arte de ' + F.w + '×' + F.h + ' px para um versículo bíblico.\n' +
      'O texto do versículo é inserido pelo aplicativo: você NÃO escreve, resume nem altera nenhum texto.\n' +
      'Pedido do usuário: ' + pedido + '\n' +
      'Versículo (só para inspirar o clima): ' + versiculo + '\n' +
      'Responda SOMENTE com JSON válido, sem comentários, neste formato:\n' +
      '{"nome":"título curto","fundo":{"tipo":"gradiente|cor|foto","cores":["#RRGGBB","#RRGGBB"],"angulo":0,"radial":false,"cor":"#RRGGBB","foto":"id","sobreposicao":0.3},' +
      '"texto":{"fonte":"nome","cor":"#RRGGBB","alinhar":"left|center|right","y":0.5,"maiusculas":false,"italico":false,"negrito":false},"referencia":{"cor":"#RRGGBB"},' +
      '"elementos":[{"forma":"icone|linha|moldura|circulo|retangulo|ornamento|textura","icone":"nome","estilo":"nome","x":0.5,"y":0.1,"w":0.1,"h":0.1,"cor":"#RRGGBB","opacidade":1}]}\n' +
      'Fontes: ' + A2Arte.FONTES.map(function (f) { return f.fam; }).join(', ') + '.\n' +
      'Ícones: ' + A2Arte.ICONES.join(', ') + '. Ornamentos (estilo): ' + A2Arte.ORNAMENTOS.join(', ') + '. Texturas (estilo): ' + A2Arte.TEXTURAS.join(', ') + '.\n' +
      'Fotos (fundo.tipo "foto"): ' + A2Fotos.LISTA.map(function (f) { return f.id + ' (' + f.nome + ')'; }).join(', ') + '.\n' +
      'Regras: no máximo 5 elementos, fora do centro onde fica o texto; contraste forte entre texto e fundo; cores harmoniosas; x, y, w e h são frações de 0 a 1 da largura e da altura.';
  }

  // ================================================================ etapa 3 — editor
  function camada(id) { return E.spec && E.spec.camadas.filter(function (c) { return c.id === id; })[0]; }
  function camadaSel() { return E.sel ? camada(E.sel) : null; }
  var NOMES_FORMAS = { retangulo: 'Retângulo', circulo: 'Círculo', linha: 'Linha', moldura: 'Moldura', icone: 'Ícone', ornamento: 'Decoração', textura: 'Textura' };
  var NOMES_ICONES = { cruz: 'Cruz', coracao: 'Coração', estrela: 'Estrela', sol: 'Sol', chama: 'Chama', pomba: 'Pomba', folha: 'Folha', coroa: 'Coroa', peixe: 'Peixe', ancora: 'Âncora', livro: 'Livro', calice: 'Cálice', trigo: 'Trigo', montanha: 'Montanha' };
  function nomeCamada(c) {
    if (!c) return '';
    if (c.tipo === 'texto') {
      if (c.papel === 'versiculo') return E.spec.conteudo.tipo === 'livre' ? 'Texto principal' : 'Versículo';
      if (c.papel === 'referencia') return E.spec.conteudo.tipo === 'livre' ? 'Legenda' : 'Referência';
      if (c.papel === 'assinatura') return 'Assinatura';
      if (c.papel === 'marca') return 'Marca Atos 2';
      return 'Texto: ' + (String(c.texto || '').slice(0, 18) || 'vazio');
    }
    if (c.nome) return c.nome;
    if (c.forma === 'icone') return 'Ícone: ' + (NOMES_ICONES[c.icone] || c.icone);
    return NOMES_FORMAS[c.forma] || 'Elemento';
  }

  function commit() {
    if (!E.spec || !E.hist) return;
    if (E.hist.registrar(JSON.stringify(E.spec))) { atualizarHist(); agendarSalvar(); }
  }
  function aplicarEstado(s) {
    if (!s) return;
    E.spec = JSON.parse(s);
    if (E.sel && !camada(E.sel)) E.sel = null;
    atualizarHist(); montarPainel(); agendar(); agendarSalvar();
  }
  function desfazer() { aplicarEstado(E.hist && E.hist.desfazer()); }
  function refazer() { aplicarEstado(E.hist && E.hist.refazer()); }
  function atualizarHist() {
    if (!ED.bDesfazer) return;
    ED.bDesfazer.disabled = !E.hist.podeDesfazer(); ED.bRefazer.disabled = !E.hist.podeRefazer();
  }

  function editor(tela) {
    if (!E.spec) { E.etapa = 'inicio'; hub(tela); return; }
    if (!E.hist) { E.hist = A2Arte.Historico(80); E.hist.registrar(JSON.stringify(E.spec)); }
    document.body.classList.add('imersivo');
    ED = {};
    ED.canvas = h('canvas', { 'aria-label': 'Arte em edição. Toque em um elemento para selecionar; arraste para mover.', role: 'img' });
    ED.sobre = h('div.ed-sobre', { 'aria-hidden': 'true' });
    ED.mesa = h('div.ed-mesa', ED.canvas, ED.sobre);
    ED.palco = h('div.ed-palco', ED.mesa);
    ED.status = h('small.ed-status');
    ED.nome = h('b', E.spec.nome || 'Arte sem título');
    ED.bDesfazer = h('button.bt-ico#ed-desfazer', { 'aria-label': 'Desfazer', title: 'Desfazer', on: { click: desfazer } }, ico('desfazer'));
    ED.bRefazer = h('button.bt-ico#ed-refazer', { 'aria-label': 'Refazer', title: 'Refazer', on: { click: refazer } }, ico('refazer'));
    ED.zoom = h('button.ed-zoom', { 'aria-label': 'Ajustar à tela', title: 'Ajustar à tela', on: { click: function () { mudarZoom(0); } } }, Math.round(E.zoom * 100) + '%');
    ED.bGuias = h('button.bt-ico', { 'aria-label': 'Guias', title: 'Guias de alinhamento', 'aria-pressed': String(E.guias), on: { click: function () { E.guias = !E.guias; ED.bGuias.setAttribute('aria-pressed', String(E.guias)); desenharSobre(); } } }, ico('grade'));
    var cab = h('header.ed-cab',
      h('button.bt-ico', { 'aria-label': 'Voltar para Criar', on: { click: sairDoEditor } }, ico('esquerda')),
      h('button.ed-nome', { 'aria-label': 'Renomear a arte', on: { click: renomear } }, ED.nome, ED.status),
      h('button.bt-ico#ed-menu', { 'aria-label': 'Mais opções', on: { click: menuEditor } }, ico('menu')),
      h('button.bt.ouro.peq#ed-exportar', { on: { click: abrirExportar } }, ico('compartilhar'), 'Exportar'));
    var ferr = h('div.ed-ferr', { role: 'toolbar', 'aria-label': 'Edição' },
      ED.bDesfazer, ED.bRefazer, h('span.sep'),
      h('button.bt-ico', { 'aria-label': 'Diminuir zoom', on: { click: function () { mudarZoom(-1); } } }, ico('zoomMenos')), ED.zoom,
      h('button.bt-ico', { 'aria-label': 'Aumentar zoom', on: { click: function () { mudarZoom(1); } } }, ico('zoomMais')), h('span.sep'),
      h('button.bt-ico#ed-duplicar', { 'aria-label': 'Duplicar o elemento selecionado', title: 'Duplicar', on: { click: duplicarSel } }, ico('duplicar')),
      h('button.bt-ico#ed-centro', { 'aria-label': 'Centralizar o elemento selecionado', title: 'Centralizar', on: { click: centralizarSel } }, ico('centralizar')),
      ED.bGuias);
    ED.painel = h('div.ed-painel', { role: 'region', 'aria-label': 'Painel de edição' });
    var BARRA = [['texto', 'Texto', 'texto'], ['fundo', 'Fundo', 'imagem'], ['cores', 'Cores', 'paleta'], ['elementos', 'Elementos', 'forma'], ['camadas', 'Camadas', 'camadas']];
    ED.barra = h('nav.ed-barra', { 'aria-label': 'Ferramentas' }, BARRA.map(function (b) {
      return h('button', { type: 'button', 'data-painel': b[0], 'aria-pressed': 'false', on: { click: function () {
        if (E.painel === b[0] && E.painelAberto) E.painelAberto = false; else { E.painel = b[0]; E.painelAberto = true; }
        montarPainel();
      } } }, ico(b[2]), h('span', b[1]));
    }));
    ED.raiz = h('div.editor-arte', cab, ferr, ED.palco, ED.painel, ED.barra);
    tela.appendChild(ED.raiz);
    mostrarStatus(); atualizarHist(); montarPainel();
    ligarPonteiro();
    var ro = 'ResizeObserver' in window ? new ResizeObserver(function () { dimensionar(); }) : null;
    if (ro) ro.observe(ED.palco); else window.addEventListener('resize', dimensionar);
    document.addEventListener('keydown', atalhos);
    App.aoSair(function () {
      document.body.classList.remove('imersivo'); document.removeEventListener('keydown', atalhos);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', dimensionar);
      if (tSalvar) salvarAgora();
      ED = {};
    });
    requestAnimationFrame(function () { dimensionar(); });
  }
  function sairDoEditor() { if (tSalvar) salvarAgora(); E.etapa = 'inicio'; E.abaMinhas = 'recentes'; App.recarregar(); }
  async function renomear() {
    var nome = await UI.perguntar('Nome da arte', 'Nome', E.spec.nome || '', { ok: 'Salvar', max: 60 });
    if (nome == null) return;
    E.spec.nome = nome.trim(); if (ED.nome) ED.nome.textContent = E.spec.nome || 'Arte sem título'; commit();
  }

  // ---------------------------------------------------------------- tamanho, zoom e desenho
  var desenho = { ocupado: false, pendente: false, caixas: {}, guiaX: false, guiaY: false };
  function dimensionar() {
    if (!ED.palco || !ED.palco.isConnected) return;
    var r = ED.palco.getBoundingClientRect(), F = A2Arte.formatoDe(E.spec);
    var aw = Math.max(120, r.width - 32), ah = Math.max(120, r.height - 32), k = Math.min(aw / F.w, ah / F.h);
    var w = Math.round(F.w * k * E.zoom), hh = Math.round(F.h * k * E.zoom);
    if (ED.mesa.style.width !== w + 'px' || ED.mesa.style.height !== hh + 'px') { ED.mesa.style.width = w + 'px'; ED.mesa.style.height = hh + 'px'; }
    agendar();
  }
  function mudarZoom(d) {
    var niveis = [1, 1.5, 2, 3], i = niveis.indexOf(E.zoom);
    E.zoom = d === 0 ? 1 : niveis[Math.max(0, Math.min(niveis.length - 1, (i < 0 ? 0 : i) + d))];
    ED.zoom.textContent = Math.round(E.zoom * 100) + '%'; dimensionar();
  }
  function larguraPx() {
    var F = A2Arte.formatoDe(E.spec), css = ED.mesa.clientWidth || 320, dpr = Math.min(2, window.devicePixelRatio || 1);
    return Math.round(Math.min(F.w, Math.max(320, css * dpr)));
  }
  function agendar() {
    if (!ED.canvas) return;
    if (desenho.ocupado) { desenho.pendente = true; return; }
    desenho.ocupado = true;
    requestAnimationFrame(async function () {
      try { if (ED.canvas && E.spec) { var r = await A2Desenho.desenhar(ED.canvas, E.spec, larguraPx()); desenho.caixas = r.caixas; desenho.cont = r.conteudo; desenharSobre(); } }
      catch (e) { console.error(e); }
      desenho.ocupado = false;
      if (desenho.pendente) { desenho.pendente = false; agendar(); }
    });
  }
  function desenharSobre() {
    if (!ED.sobre || !ED.canvas.width) return;
    var k = ED.mesa.clientWidth / ED.canvas.width, F = A2Arte.formatoDe(E.spec);
    ED.sobre.replaceChildren();
    if (E.guias && F.papel) {
      var zonas = E.spec.formato === 'papel-celular' ? [[0.06, 0.3, 'Relógio e data'], [0.87, 0.985, 'Atalhos']] : [[0.94, 1, 'Barra de tarefas']];
      zonas.forEach(function (z) { ED.sobre.appendChild(h('div.zona-papel', { style: { top: (z[0] * 100) + '%', height: ((z[1] - z[0]) * 100) + '%' } }, z[2])); });
    }
    if (E.guias) ED.sobre.appendChild(h('div.margem-segura'));
    if (desenho.guiaX) ED.sobre.appendChild(h('div.guia-v'));
    if (desenho.guiaY) ED.sobre.appendChild(h('div.guia-h'));
    var L = camadaSel(), b = L && desenho.caixas[L.id];
    if (!L || !b || L.visivel === false || b.textura) return;
    var sel = h('div.sel' + (L.bloqueado ? '.travada' : ''), { style: { left: (b.x * k) + 'px', top: (b.y * k) + 'px', width: Math.max(8, b.w * k) + 'px', height: Math.max(8, b.h * k) + 'px',
      transform: 'rotate(' + b.rot + 'rad)', transformOrigin: ((b.px - b.x) * k) + 'px ' + ((b.py - b.y) * k) + 'px' } });
    if (L.bloqueado) sel.appendChild(h('span.trava', ico('cadeado')));
    else {
      ['no', 'ne', 'so', 'se'].forEach(function (c) { sel.appendChild(h('span.alca.' + c, { 'data-alca': 'escala' })); });
      sel.appendChild(h('span.alca-rot', { 'data-alca': 'girar', title: 'Girar' }));
    }
    ED.sobre.appendChild(sel);
  }

  // ---------------------------------------------------------------- seleção e gestos no canvas
  function selecionar(id, abrirPainel) {
    E.sel = id;
    var L = camadaSel();
    if (L && abrirPainel !== false) {
      var alvo = L.tipo === 'texto' ? 'texto' : 'elementos';
      if (E.painel !== 'camadas' && E.painel !== 'cores') E.painel = alvo;
      E.painelAberto = true;
    }
    montarPainel(); desenharSobre();
  }
  function pontoCanvas(e) {
    var r = ED.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * ED.canvas.width / r.width, y: (e.clientY - r.top) * ED.canvas.height / r.height };
  }
  function dentro(p, b, tol) {
    var c = Math.cos(-b.rot), s = Math.sin(-b.rot), dx = p.x - b.px, dy = p.y - b.py;
    var x = b.px + dx * c - dy * s, y = b.py + dx * s + dy * c;
    return x >= b.x - tol && x <= b.x + b.w + tol && y >= b.y - tol && y <= b.y + b.h + tol;
  }
  function acertar(p) {
    var tol = 6 * ED.canvas.width / Math.max(1, ED.mesa.clientWidth), cs = E.spec.camadas;
    // a seleção atual tem prioridade (facilita mover o que já está escolhido)
    if (E.sel && desenho.caixas[E.sel] && !desenho.caixas[E.sel].textura && camadaSel() && camadaSel().visivel !== false && dentro(p, desenho.caixas[E.sel], tol)) return E.sel;
    for (var i = cs.length - 1; i >= 0; i--) {
      var c = cs[i], b = desenho.caixas[c.id];
      if (!b || b.textura || c.visivel === false) continue;
      if (dentro(p, b, tol)) return c.id;
    }
    return null;
  }
  // Ao mexer na referência presa ao versículo, ela passa a ser um texto livre na mesma posição.
  function soltarReferencia(L) {
    if (L.papel !== 'referencia' || L.ancora !== 'versiculo') return;
    var b = desenho.caixas[L.id], V = camada('versiculo'); if (!b) return;
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2, c = Math.cos(b.rot), s = Math.sin(b.rot), dx = cx - b.px, dy = cy - b.py;
    L.x = (b.px + dx * c - dy * s) / ED.canvas.width; L.y = (b.py + dx * s + dy * c) / ED.canvas.height;
    L.ancora = null; L.alinhar = V ? V.alinhar : L.alinhar; L.largura = V ? V.largura : L.largura; L.rotacao = V ? V.rotacao : 0;
    var F = A2Arte.formatoDe(E.spec), escala = ED.canvas.width / F.w, u = F.base / 1080;
    if (!(L.tamanho > 0)) {
      var linhas = Math.max(1, Math.round(b.h / escala / (32 * u * 1.25)));
      L.tamanho = Math.round(Math.max(18, Math.min(60, b.h / escala / u / (linhas * 1.3))));
    }
    L.entrelinha = 1.25;
  }
  function ligarPonteiro() {
    var g = null;
    ED.mesa.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      var p = pontoCanvas(e), alca = e.target.closest && e.target.closest('[data-alca]');
      var L = camadaSel();
      if (alca && L && !L.bloqueado) {
        soltarReferencia(L);
        var b = desenho.caixas[L.id]; if (!b) return;
        g = { modo: alca.dataset.alca, L: L, p0: p, centro: { x: b.px, y: b.py }, ini: clonar(L) };
      } else {
        var id = acertar(p);
        if (id !== E.sel) selecionar(id, !!id);
        L = camadaSel();
        if (!L || L.bloqueado) { g = null; return; }
        g = { modo: 'mover', L: L, p0: p, ini: clonar(L), moveu: false };
      }
      ED.mesa.setPointerCapture(e.pointerId); ED.mesa.classList.add('arrastando'); e.preventDefault();
    });
    ED.mesa.addEventListener('pointermove', function (e) {
      if (!g) return;
      var p = pontoCanvas(e), W = ED.canvas.width, H = ED.canvas.height, L = g.L;
      if (g.modo === 'mover') {
        if (!g.moveu && Math.hypot(p.x - g.p0.x, p.y - g.p0.y) < 3) return;
        if (!g.moveu) { soltarReferencia(L); g.ini = clonar(L); g.moveu = true; }
        var nx = g.ini.x + (p.x - g.p0.x) / W, ny = g.ini.y + (p.y - g.p0.y) / H, tol = 0.012;
        desenho.guiaX = Math.abs(nx - 0.5) < tol; desenho.guiaY = Math.abs(ny - 0.5) < tol;
        if (desenho.guiaX) nx = 0.5; if (desenho.guiaY) ny = 0.5;
        var minimo = L.tipo === 'texto' ? 0 : -0.3, maximo = L.tipo === 'texto' ? 1 : 1.3;
        L.x = Math.max(minimo, Math.min(maximo, nx)); L.y = Math.max(minimo, Math.min(maximo, ny));
      } else if (g.modo === 'escala') {
        var d0 = Math.hypot(g.p0.x - g.centro.x, g.p0.y - g.centro.y) || 1, k = Math.hypot(p.x - g.centro.x, p.y - g.centro.y) / d0;
        k = Math.max(0.15, Math.min(6, k));
        if (L.tipo === 'texto') {
          L.largura = Math.max(0.12, Math.min(1, g.ini.largura * k));
          if (L.papel === 'versiculo') L.altura = Math.max(0.08, Math.min(0.95, g.ini.altura * k));
          if (g.ini.tamanho > 0) L.tamanho = Math.max(8, Math.min(400, Math.round(g.ini.tamanho * k)));
        } else { L.w = Math.max(0.01, Math.min(2, g.ini.w * k)); L.h = Math.max(0.003, Math.min(2, g.ini.h * k)); }
      } else if (g.modo === 'girar') {
        var a0 = Math.atan2(g.p0.y - g.centro.y, g.p0.x - g.centro.x), a1 = Math.atan2(p.y - g.centro.y, p.x - g.centro.x);
        var ang = g.ini.rotacao + (a1 - a0) * 180 / Math.PI;
        ang = ((ang + 540) % 360) - 180;
        var alvo = Math.round(ang / 45) * 45; if (Math.abs(ang - alvo) < 4) ang = alvo;
        L.rotacao = Math.round(ang);
      }
      agendar();
    });
    function fim(e) {
      if (!g) return;
      var mudou = g.modo !== 'mover' || g.moveu;
      g = null; desenho.guiaX = desenho.guiaY = false; ED.mesa.classList.remove('arrastando');
      if (mudou) { commit(); if (E.painelAberto && (E.painel === 'texto' || E.painel === 'elementos')) montarPainel(); }
      agendar();
    }
    ED.mesa.addEventListener('pointerup', fim); ED.mesa.addEventListener('pointercancel', fim);
    ED.mesa.addEventListener('dblclick', function () {
      var L = camadaSel(); if (!L || L.tipo !== 'texto') return;
      E.painel = 'texto'; E.sub.texto = 'conteudo'; E.painelAberto = true; montarPainel();
      var campo = ED.painel.querySelector('textarea, input[type=text]'); if (campo) campo.focus();
    });
  }
  function atalhos(e) {
    if (!ED.raiz || UI.temFolha()) return;
    var alvo = e.target, campo = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.tagName === 'SELECT');
    var mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !campo) { e.preventDefault(); if (e.shiftKey) refazer(); else desfazer(); return; }
    if (mod && e.key.toLowerCase() === 'y' && !campo) { e.preventDefault(); refazer(); return; }
    if (mod && e.key.toLowerCase() === 'd' && !campo) { e.preventDefault(); duplicarSel(); return; }
    if (campo) return;
    var L = camadaSel(); if (!L || L.bloqueado) return;
    var d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (d) { e.preventDefault(); var passo = e.shiftKey ? 0.05 : 0.01; soltarReferencia(L); L.x = Math.max(0, Math.min(1, L.x + d[0] * passo)); L.y = Math.max(0, Math.min(1, L.y + d[1] * passo)); agendar(); commit(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && L.papel !== 'versiculo') { e.preventDefault(); excluirSel(); }
  }

  // ---------------------------------------------------------------- ações sobre a seleção
  function duplicarSel() {
    var L = camadaSel();
    if (!L) { UI.aviso('Selecione um elemento para duplicar.'); return; }
    var r = A2Arte.duplicarCamada(E.spec.camadas, L.id);
    if (!r.id) { UI.aviso(L.papel === 'versiculo' ? 'O versículo não pode ser duplicado.' : 'A referência não pode ser duplicada.'); return; }
    E.spec.camadas = r.camadas; E.sel = r.id; commit(); montarPainel(); agendar();
  }
  function excluirSel() {
    var L = camadaSel(); if (!L) return;
    if (L.papel === 'versiculo') { UI.aviso('O versículo não pode ser excluído; você pode ocultá-lo em Camadas.'); return; }
    E.spec.camadas = A2Arte.removerCamada(E.spec.camadas, L.id); E.sel = null; commit(); montarPainel(); agendar();
  }
  function centralizarSel() {
    var L = camadaSel(); if (!L) { UI.aviso('Selecione um elemento para centralizar.'); return; }
    if (L.bloqueado) { UI.aviso('Este elemento está bloqueado.'); return; }
    soltarReferencia(L); L.x = 0.5; if (L.tipo !== 'texto' || L.papel === 'versiculo') L.y = 0.5; commit(); agendar();
  }

  // ---------------------------------------------------------------- painéis
  function montarPainel() {
    if (!ED.painel) return;
    ED.barra.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(E.painelAberto && b.dataset.painel === E.painel)); });
    ED.painel.hidden = !E.painelAberto;
    if (!E.painelAberto) { dimensionar(); return; }
    var topo = ED.painel.scrollTop, mesmo = ED.painel.dataset.painel === E.painel + ':' + (E.sel || '');
    ED.painel.replaceChildren(PAINEIS[E.painel]());
    ED.painel.dataset.painel = E.painel + ':' + (E.sel || '');
    if (mesmo) ED.painel.scrollTop = topo;
  }
  function subAbas(painel, lista, atual) {
    return chips(lista, atual, function (id) { E.sub[painel] = id; montarPainel(); }, '.sub-abas');
  }
  var contIds = 0;
  function deslizador(rotulo, valor, min, max, passo, fmt, fn) {
    var id = 'ed-r' + (++contIds), saida = h('output', { for: id }, fmt(valor));
    var r = h('input#' + id, { type: 'range', min: min, max: max, step: passo, value: valor });
    r.addEventListener('input', function () { fn(+r.value); saida.textContent = fmt(+r.value); agendar(); });
    r.addEventListener('change', function () { commit(); });
    return h('label.campo.deslizador', { for: id }, h('span', rotulo, saida), r);
  }
  var pct = function (v) { return Math.round(v * 100) + '%'; };
  var CORES_RAPIDAS = ['#FFFFFF', '#F4F0E5', '#E9D8B4', '#A58A57', '#C8642D', '#B5646B', '#5E7A62', '#2F6B4F', '#3C7DBF', '#192D50', '#3B2E5A', '#111111'];
  function seletorCor(atual, fn, extras) {
    var lista = (extras || []).concat(CORES_RAPIDAS).filter(function (c, i, a) { return a.indexOf(c) === i; }).slice(0, 18);
    var hex = h('input.entrada.hex', { type: 'text', maxlength: 7, value: String(atual || '').toUpperCase(), 'aria-label': 'Código da cor (hex)', spellcheck: 'false' });
    var pick = h('input.cor-livre', { type: 'color', value: A2Arte.hexValido(atual) ? A2Arte.hexValido(atual).toLowerCase() : '#ffffff', 'aria-label': 'Escolher outra cor' });
    var amostras = h('div.amostras', lista.map(function (c) {
      return h('button.amostra', { type: 'button', style: { background: c }, 'aria-label': 'Cor ' + c, 'aria-pressed': String(String(atual).toUpperCase() === c.toUpperCase()),
        on: { click: function () { marcar(amostras, this); hex.value = c; pick.value = c.toLowerCase(); fn(c); agendar(); commit(); } } });
    }), pick);
    pick.addEventListener('input', function () { hex.value = pick.value.toUpperCase(); fn(pick.value.toUpperCase()); agendar(); });
    pick.addEventListener('change', function () { commit(); });
    hex.addEventListener('change', function () { var v = A2Arte.hexValido(hex.value); if (!v) { UI.aviso('Use um código como #A58A57.', true); return; } hex.value = v; pick.value = v.toLowerCase(); fn(v); agendar(); commit(); });
    return h('div.seletor-cor', amostras, hex);
  }
  function alternador(rotulo, ativo, fn, titulo) {
    return h('button.chip.alternar', { type: 'button', 'aria-pressed': String(!!ativo), title: titulo || rotulo, on: { click: function () { var v = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', String(v)); fn(v); agendar(); commit(); } } }, rotulo);
  }
  function grupo(titulo) { return h('div.grupo-painel', h('span.rot-grupo', titulo), Array.prototype.slice.call(arguments, 1)); }

  var PAINEIS = {};

  // ---------- TEXTO
  PAINEIS.texto = function () {
    var L = camadaSel();
    if (!L || L.tipo !== 'texto') { L = camada('versiculo'); E.sel = L.id; desenharSobre(); }
    var aba = E.sub.texto || 'conteudo', wrap = h('div.pn');
    wrap.appendChild(h('div.pn-topo', h('b', nomeCamada(L)), h('div.esp'), h('button.bt.peq#ed-add-texto', { on: { click: function () { adicionarTexto(); } } }, ico('mais'), 'Texto')));
    wrap.appendChild(subAbas('texto', [['conteudo', 'Conteúdo'], ['fonte', 'Fonte'], ['estilo', 'Estilo'], ['efeitos', 'Efeitos'], ['posicao', 'Posição']], aba));
    var corpo = h('div.pn-corpo'); wrap.appendChild(corpo);
    var c = E.spec.conteudo;
    function campoTexto(id, rotulo, valor, linhas, fn, max) {
      var el = linhas ? h('textarea.entrada#' + id, { rows: linhas, maxlength: max || 600 }) : h('input.entrada#' + id, { type: 'text', maxlength: max || 80 });
      el.value = valor || ''; el.addEventListener('input', function () { fn(el.value); agendar(); }); el.addEventListener('change', commit);
      return h('label.campo', { for: id }, h('span', rotulo), el);
    }
    if (aba === 'conteudo') {
      if (L.papel === 'versiculo' && c.tipo === 'versiculo') {
        var tx = h('p.texto-exato', '…'), rf = h('p.ref-exata');
        A2Desenho.textoDaArte(E.spec).then(function (r) { tx.textContent = r.texto; rf.textContent = r.ref; }, function (e) { tx.textContent = e.message; });
        var trad = h('select.entrada#ed-trad', Biblia.VERSOES.map(function (v) { var o = h('option', { value: v.id, disabled: !v.ativa }, v.nome); if (v.id === c.versao) o.selected = true; return o; }));
        trad.addEventListener('change', async function () { c.versao = trad.value; try { await Biblia.indice(c.versao); } catch (e) {} agendar(); commit(); montarPainel(); });
        corpo.appendChild(h('div.previa-vers.compacta', tx, rf));
        corpo.appendChild(h('div.aviso', ico('escudo'), h('span', 'O texto bíblico vem da tradução e não pode ser editado.')));
        corpo.appendChild(h('div.linha-bts', h('button.bt.peq#ed-trocar-vers', { on: { click: trocarVersiculo } }, ico('livro'), 'Trocar versículo')));
        corpo.appendChild(h('label.campo', { for: 'ed-trad' }, h('span', 'Tradução'), trad));
      } else if (L.papel === 'versiculo') {
        corpo.appendChild(campoTexto('ed-livre', 'Seu texto', c.texto, 4, function (v) { c.texto = v; }));
        corpo.appendChild(h('div.linha-bts', h('button.bt.peq', { on: { click: trocarVersiculo } }, ico('livro'), 'Usar um versículo')));
      } else if (L.papel === 'referencia' && c.tipo === 'versiculo') {
        corpo.appendChild(campoTexto('ed-rotulo', 'Referência exibida (deixe vazio para a automática)', c.rotulo, 0, function (v) { c.rotulo = v.trim(); }, 60));
        corpo.appendChild(chave('ed-sigla', 'Mostrar a sigla da tradução', L.mostrarVersao !== false, function (v) { L.mostrarVersao = v; agendar(); commit(); }));
        corpo.appendChild(chave('ed-ancora', 'Acompanhar o versículo', L.ancora === 'versiculo', function (v) {
          if (v) { L.ancora = 'versiculo'; L.tamanho = 0; } else soltarReferencia(L);
          agendar(); commit();
        }));
      } else if (L.papel === 'referencia') {
        corpo.appendChild(campoTexto('ed-legenda', 'Legenda', c.legenda, 0, function (v) { c.legenda = v; }, 80));
      } else if (L.papel === 'marca') {
        corpo.appendChild(h('p.sub', 'Assinatura discreta do aplicativo. Você pode mover, mudar a cor ou ocultar em Camadas.'));
      } else {
        corpo.appendChild(campoTexto('ed-texto', L.papel === 'assinatura' ? 'Assinatura (ex.: @seuperfil, nome da igreja)' : 'Texto', L.texto, L.papel === 'assinatura' ? 0 : 3, function (v) { L.texto = v; }, L.papel === 'assinatura' ? 60 : 400));
        if (L.papel === 'livre') corpo.appendChild(h('p.sub', 'Textos adicionados por você não são apresentados como versículo bíblico.'));
      }
    } else if (aba === 'fonte') {
      corpo.appendChild(h('div.fontes', A2Arte.FONTES.map(function (f) {
        return h('button', { type: 'button', style: { fontFamily: '"' + f.fam + '"', fontWeight: f.peso }, 'aria-pressed': String(L.fonte === f.fam), on: { click: function () {
          marcar(this.parentNode, this); L.fonte = f.fam; agendar(); commit();
        } } }, f.nome);
      })));
      var auto = !(L.tamanho > 0);
      var rTam = deslizador('Tamanho', L.tamanho || (L.papel === 'referencia' ? 30 : 60), 10, 220, 1, function (v) { return Math.round(v) + ' px'; }, function (v) { L.tamanho = v; });
      rTam.querySelector('input').disabled = auto;
      corpo.appendChild(chave('ed-auto', L.papel === 'versiculo' ? 'Tamanho automático (cabe na arte)' : 'Tamanho automático', auto, function (v) {
        rTam.querySelector('input').disabled = v; L.tamanho = v ? 0 : +rTam.querySelector('input').value; agendar(); commit();
      }));
      corpo.appendChild(rTam);
    } else if (aba === 'estilo') {
      corpo.appendChild(grupo('Cor', seletorCor(L.cor, function (v) { L.cor = v; }, paletaAtual())));
      corpo.appendChild(grupo('Estilo', h('div.chips.quebra',
        alternador('B', L.negrito, function (v) { L.negrito = v; }, 'Negrito'), alternador('I', L.italico, function (v) { L.italico = v; }, 'Itálico'),
        alternador('AA', L.maiusculas, function (v) { L.maiusculas = v; }, 'Letras maiúsculas'),
        L.papel === 'versiculo' && c.tipo === 'versiculo' ? alternador('“ ”', L.aspas, function (v) { L.aspas = v; }, 'Aspas no versículo') : null)));
      if (!(L.papel === 'referencia' && L.ancora === 'versiculo')) corpo.appendChild(grupo('Alinhamento', chips([['left', 'Esquerda'], ['center', 'Centro'], ['right', 'Direita']], L.alinhar, function (a) { L.alinhar = a; agendar(); commit(); })));
      else corpo.appendChild(h('p.sub', 'A referência acompanha o alinhamento do versículo. Desligue “Acompanhar o versículo” em Conteúdo para alinhar à parte.'));
    } else if (aba === 'efeitos') {
      corpo.appendChild(deslizador('Sombra', L.sombra || 0, 0, 1, 0.05, pct, function (v) { L.sombra = v; }));
      corpo.appendChild(deslizador('Contorno', L.contorno || 0, 0, 10, 0.5, function (v) { return v + ' px'; }, function (v) { L.contorno = v; }));
      corpo.appendChild(grupo('Cor do contorno', seletorCor(L.corContorno, function (v) { L.corContorno = v; })));
      corpo.appendChild(deslizador('Transparência', 1 - L.opacidade, 0, 0.9, 0.05, pct, function (v) { L.opacidade = Math.round((1 - v) * 100) / 100; }));
    } else {
      corpo.appendChild(deslizador('Espaço entre letras', L.espacamento || 0, -0.05, 0.5, 0.01, function (v) { return Math.round(v * 100) + '%'; }, function (v) { L.espacamento = v; }));
      corpo.appendChild(deslizador('Espaço entre linhas', L.entrelinha || 1.3, 0.9, 2.2, 0.05, function (v) { return v.toFixed(2) + '×'; }, function (v) { L.entrelinha = v; }));
      if (!(L.papel === 'referencia' && L.ancora === 'versiculo')) {
        corpo.appendChild(deslizador('Largura da caixa', L.largura, 0.15, 1, 0.01, pct, function (v) { L.largura = v; }));
        if (L.papel === 'versiculo') corpo.appendChild(deslizador('Altura máxima do texto', L.altura, 0.1, 0.95, 0.01, pct, function (v) { L.altura = v; }));
        corpo.appendChild(deslizador('Rotação', L.rotacao || 0, -180, 180, 1, function (v) { return Math.round(v) + '°'; }, function (v) { L.rotacao = v; }));
        corpo.appendChild(h('div.linha-bts',
          h('button.bt.peq', { on: { click: function () { L.x = 0.5; agendar(); commit(); } } }, 'Centralizar na horizontal'),
          h('button.bt.peq', { on: { click: function () { L.y = 0.5; agendar(); commit(); } } }, 'Centralizar na vertical'),
          h('button.bt.peq', { on: { click: function () { L.rotacao = 0; agendar(); commit(); montarPainel(); } } }, 'Sem rotação')));
      } else corpo.appendChild(h('p.sub', 'A referência está presa ao versículo. Arraste-a no canvas para soltá-la e posicionar livremente.'));
    }
    return wrap;
  };
  function trocarVersiculo() {
    E.voltar = 'editor'; E.novo = { conteudo: clonar(E.spec.conteudo), formato: E.spec.formato };
    if (E.novo.conteudo.tipo === 'livre') E.novo.conteudo = Object.assign(conteudoInicial(), { tipo: 'versiculo' });
    if (tSalvar) salvarAgora();
    ir('versiculo');
  }
  function adicionarTexto(papel) {
    papel = papel || 'livre';
    var V = camada('versiculo'), cor = V ? V.cor : '#FFFFFF';
    if (papel === 'marca' && E.spec.camadas.some(function (c) { return c.papel === 'marca'; })) { var m = E.spec.camadas.filter(function (c) { return c.papel === 'marca'; })[0]; m.visivel = true; selecionar(m.id); agendar(); commit(); return; }
    var nova = A2Arte.camadaTexto(papel, papel === 'livre' ? { texto: 'Seu texto aqui', cor: cor, y: 0.16, sombra: V ? V.sombra : 0 } : { cor: cor, texto: papel === 'assinatura' ? (App.perfil().nome || '@seuperfil') : undefined });
    E.spec.camadas.push(nova); E.sel = nova.id; E.painel = 'texto'; E.sub.texto = 'conteudo'; E.painelAberto = true;
    commit(); montarPainel(); agendar();
    setTimeout(function () { var f = ED.painel && ED.painel.querySelector('#ed-texto'); if (f) { f.focus(); if (f.select) f.select(); } }, 30);
  }
  function paletaAtual() {
    var p = A2Arte.PALETAS.filter(function (x) { return x.id === E.spec.paleta; })[0];
    var cores = p ? [p.fundo, p.texto, p.destaque, p.apoio] : [];
    E.spec.camadas.forEach(function (c) { if (c.cor && cores.indexOf(c.cor) < 0) cores.push(c.cor); });
    return cores.slice(0, 6);
  }

  // ---------- FUNDO
  var TAGS_FOTOS = { mar: ['rochas-mar', 'praia', 'pier', 'fiorde', 'iceberg'], céu: ['aurora-boreal', 'vulcao', 'pier', 'cidade', 'lago-amanhecer'], noite: ['aurora-boreal', 'vulcao', 'vela'],
    flores: ['urzes', 'papoulas', 'margaridas', 'flores-vermelhas', 'jardim'], água: ['lago-amanhecer', 'lago-outono', 'cisnes', 'fiorde', 'praia', 'rochas-mar', 'jardim'],
    outono: ['lago-outono', 'caminho-outono'], caminho: ['caminho-outono', 'caminho-estreito'], animais: ['leao', 'cisnes'], natureza: ['floresta-nevoa', 'capim', 'folha', 'urzes', 'margaridas'],
    luz: ['vela', 'telhado', 'pier', 'lago-amanhecer'], sol: ['pier', 'papoulas', 'lago-amanhecer', 'cidade'], montanha: ['fiorde', 'vulcao', 'urzes'], cidade: ['cidade', 'telhado'], mundo: ['mapa-mundi'], gelo: ['iceberg', 'aurora-boreal'] };
  function normal(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  var DEGRADES = [['#192D50', '#0C1628', 180], ['#F4F0E5', '#E7D9B8', 135], ['#F6A65A', '#6E3B7E', 180], ['#9CC6E8', '#FBE3C3', 180], ['#0F4C5C', '#1F8A8A', 135], ['#FBEBD3', '#F0C99A', 180],
    ['#1F3B2D', '#56643F', 160], ['#4A1C2A', '#192D50', 135], ['#E7E1F2', '#C9DDF0', 120], ['#FFD3A5', '#A8E6CF', 135], ['#0E1424', '#3B2E5A', 180], ['#A58A57', '#192D50', 200]];
  var CORES_FUNDO = ['#192D50', '#0E1424', '#111111', '#4A1C2A', '#1F3B2D', '#0F4C5C', '#3B2E5A', '#A58A57', '#C8A27A', '#F4F0E5', '#FFFFFF', '#E9E1D3', '#DCE3D3', '#DCEBF7', '#F3DDD8', '#FFE08A'];
  function mudarFundo(fn) { fn(E.spec.fundo); agendar(); commit(); montarPainel(); }
  PAINEIS.fundo = function () {
    var f = E.spec.fundo, wrap = h('div.pn');
    var abas = [['fotos', 'Fotos'], ['cores', 'Cores'], ['degrades', 'Degradês'], ['imagens', 'Minhas imagens']];
    if (App.temIA) abas.push(['ia', 'Criar com IA']);
    abas = abas.concat([['ajustes', 'Ajustes'], ['sobrepor', 'Sobreposição']]);
    if (f.tipo === 'banco' || f.tipo === 'imagem' || f.tipo === 'ia') abas.push(['enquadrar', 'Enquadrar']);
    var aba = E.sub.fundo || (f.tipo === 'cor' ? 'cores' : f.tipo === 'gradiente' ? 'degrades' : f.tipo === 'imagem' ? 'imagens' : f.tipo === 'ia' ? 'ia' : 'fotos');
    if (!abas.some(function (a) { return a[0] === aba; })) aba = 'fotos';
    wrap.appendChild(subAbas('fundo', abas, aba));
    var corpo = h('div.pn-corpo'); wrap.appendChild(corpo);
    if (aba === 'fotos') {
      var busca = h('input.entrada#fundo-busca', { type: 'search', placeholder: 'Procurar: mar, flores, céu, luz…', autocomplete: 'off' });
      var grade = h('div.fundos.papeis');
      function filtrar() {
        var q = normal(busca.value.trim()), tag = Object.keys(TAGS_FOTOS).filter(function (k) { return q && normal(k).indexOf(q) === 0; });
        var ids = tag.reduce(function (a, k) { return a.concat(TAGS_FOTOS[k]); }, []);
        grade.replaceChildren();
        var lista = A2Fotos.LISTA.filter(function (ft) { return !q || normal(ft.nome).indexOf(q) >= 0 || ids.indexOf(ft.id) >= 0; });
        if (!lista.length) grade.appendChild(h('p.sub', 'Nenhuma foto para “' + busca.value + '”.'));
        lista.forEach(function (ft) {
          grade.appendChild(h('button', { type: 'button', 'aria-label': ft.nome, title: ft.nome, 'aria-pressed': String(f.tipo === 'banco' && f.id === ft.id), on: { click: function () {
            marcar(grade, this);
            mudarFundo(function (x) { x.tipo = 'banco'; x.id = ft.id; x.zoom = 1; x.dx = 0; x.dy = 0; if (!(x.sobreposicao.opacidade > 0)) x.sobreposicao = { cor: '#000000', opacidade: ft.escurecer, estilo: 'uniforme' }; });
          } } }, h('img', { src: 'fundos/fotos/' + ft.id + '-mini.jpg', alt: '', loading: 'lazy', width: 180, height: 320 }), h('small', ft.nome)));
        });
      }
      busca.addEventListener('input', filtrar);
      corpo.appendChild(busca); corpo.appendChild(grade); filtrar();
      corpo.appendChild(h('p.sub', A2Fotos.CREDITO + ' A foto sai sempre com o versículo ou o seu texto por cima.'));
    } else if (aba === 'cores') {
      corpo.appendChild(grupo('Cor sólida', seletorCor(f.tipo === 'cor' ? f.cor : '', function (v) { f.tipo = 'cor'; f.cor = v; }, CORES_FUNDO)));
    } else if (aba === 'degrades') {
      corpo.appendChild(h('div.degrades', DEGRADES.map(function (d) {
        return h('button', { type: 'button', 'aria-label': 'Degradê de ' + d[0] + ' a ' + d[1], style: { background: 'linear-gradient(' + d[2] + 'deg,' + d[0] + ',' + d[1] + ')' },
          'aria-pressed': String(f.tipo === 'gradiente' && f.cores[0] === d[0] && f.cores[1] === d[1]), on: { click: function () { mudarFundo(function (x) { x.tipo = 'gradiente'; x.cores = [d[0], d[1]]; x.angulo = d[2]; x.radial = false; }); } } });
      })));
      if (f.tipo === 'gradiente') {
        corpo.appendChild(grupo('Cor inicial', seletorCor(f.cores[0], function (v) { f.cores[0] = v; })));
        corpo.appendChild(grupo('Cor final', seletorCor(f.cores[1], function (v) { f.cores[1] = v; })));
        corpo.appendChild(deslizador('Ângulo', f.angulo, 0, 360, 5, function (v) { return Math.round(v) + '°'; }, function (v) { f.angulo = v; }));
        corpo.appendChild(chave('ed-radial', 'Degradê circular', f.radial, function (v) { f.radial = v; agendar(); commit(); }));
      } else corpo.appendChild(h('p.sub', 'Escolha um degradê para ajustar as cores e o ângulo.'));
    } else if (aba === 'imagens') {
      var arquivo = h('input#fundo-upload', { type: 'file', accept: 'image/*', hidden: true });
      arquivo.addEventListener('change', async function () {
        var a = arquivo.files && arquivo.files[0]; if (!a) return;
        try { var id = await guardarImagem(a); mudarFundo(function (x) { x.tipo = 'imagem'; x.imagem = id; x.zoom = 1; x.dx = 0; x.dy = 0; }); UI.aviso('Imagem aplicada ao fundo.'); }
        catch (e) { UI.aviso(e.message || 'Não foi possível usar esta imagem.', true); }
      });
      corpo.appendChild(h('div.linha-bts', h('button.bt.pri.peq', { on: { click: function () { arquivo.click(); } } }, ico('enviarImagem'), 'Enviar imagem'), arquivo));
      var minhas = Dados.todos('_imagensArte').sort(function (a, b) { return String(b.criadoEm).localeCompare(String(a.criadoEm)); });
      if (minhas.length) corpo.appendChild(h('div.fundos.papeis', minhas.map(function (im) {
        return h('div.minha-imagem', h('button', { type: 'button', 'aria-label': 'Usar imagem ' + (im.nome || ''), 'aria-pressed': String(f.tipo === 'imagem' && f.imagem === im.id),
          on: { click: function () { mudarFundo(function (x) { x.tipo = 'imagem'; x.imagem = im.id; x.zoom = 1; x.dx = 0; x.dy = 0; }); } } }, h('img', { src: im.mini || im.dados, alt: '' })),
          h('button.bt-ico.peq.excluir-img', { 'aria-label': 'Excluir imagem', on: { click: async function () {
            if (await UI.confirmar('Excluir imagem', 'A imagem será removida deste aparelho. Artes que a usam ficarão sem esse fundo.', 'Excluir', true)) { Dados.excluir('_imagensArte', im.id); montarPainel(); }
          } } }, ico('lixo')));
      })));
      corpo.appendChild(h('p.sub', 'Suas imagens ficam guardadas só neste aparelho e não são enviadas para a nuvem. Use apenas imagens que você tem direito de usar.'));
    } else if (aba === 'ia') {
      corpo.appendChild(painelIA());
    } else if (aba === 'ajustes') {
      corpo.appendChild(deslizador('Desfoque', f.desfoque, 0, 24, 0.5, function (v) { return v + ' px'; }, function (v) { f.desfoque = v; }));
      corpo.appendChild(deslizador('Brilho', f.brilho, 0.4, 1.6, 0.02, pct, function (v) { f.brilho = v; }));
      corpo.appendChild(deslizador('Contraste', f.contraste, 0.4, 1.6, 0.02, pct, function (v) { f.contraste = v; }));
      corpo.appendChild(deslizador('Saturação', f.saturacao, 0, 2, 0.05, pct, function (v) { f.saturacao = v; }));
      corpo.appendChild(deslizador('Transparência', 1 - f.opacidade, 0, 0.9, 0.05, pct, function (v) { f.opacidade = Math.round((1 - v) * 100) / 100; }));
      if (f.opacidade < 1) corpo.appendChild(grupo('Cor por trás', seletorCor(f.base, function (v) { f.base = v; }, ['#192D50', '#FFFFFF', '#F4F0E5', '#000000'])));
      corpo.appendChild(h('button.bt.peq', { on: { click: function () { mudarFundo(function (x) { x.desfoque = 0; x.brilho = 1; x.contraste = 1; x.saturacao = 1; x.opacidade = 1; }); } } }, 'Redefinir ajustes'));
    } else if (aba === 'sobrepor') {
      var o = f.sobreposicao;
      corpo.appendChild(deslizador('Intensidade (melhora a leitura)', o.opacidade, 0, 0.9, 0.05, pct, function (v) { o.opacidade = v; }));
      corpo.appendChild(grupo('Estilo', chips([['uniforme', 'Uniforme'], ['base', 'Embaixo'], ['topo', 'Em cima'], ['vinheta', 'Vinheta']], o.estilo, function (v) { o.estilo = v; agendar(); commit(); })));
      corpo.appendChild(grupo('Cor', seletorCor(o.cor, function (v) { o.cor = v; }, ['#000000', '#FFFFFF', '#192D50', '#A58A57', '#4A1C2A'])));
    } else if (aba === 'enquadrar') {
      corpo.appendChild(deslizador('Zoom', f.zoom, 1, 3, 0.05, function (v) { return v.toFixed(2) + '×'; }, function (v) { f.zoom = v; }));
      corpo.appendChild(deslizador('Horizontal', f.dx, -1, 1, 0.02, function (v) { return Math.round(v * 100); }, function (v) { f.dx = v; }));
      corpo.appendChild(deslizador('Vertical', f.dy, -1, 1, 0.02, function (v) { return Math.round(v * 100); }, function (v) { f.dy = v; }));
      corpo.appendChild(h('button.bt.peq', { on: { click: function () { mudarFundo(function (x) { x.zoom = 1; x.dx = 0; x.dy = 0; }); } } }, 'Redefinir enquadramento'));
    }
    return wrap;
  };
  // Imagem própria: reduzida (até 2160 px) e guardada só no aparelho
  function guardarImagem(arquivo) {
    return new Promise(function (res, rej) {
      if (!/^image\//.test(arquivo.type)) { rej(new Error('Escolha um arquivo de imagem.')); return; }
      if (arquivo.size > 25 * 1024 * 1024) { rej(new Error('A imagem é grande demais (máximo de 25 MB).')); return; }
      var url = URL.createObjectURL(arquivo), img = new Image();
      img.onload = function () {
        function reduzir(max, q) {
          var k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', q);
        }
        var id = UI.uid();
        Dados.salvar('_imagensArte', id, { dados: reduzir(2160, 0.88), mini: reduzir(240, 0.75), nome: arquivo.name, w: img.width, h: img.height, criadoEm: new Date().toISOString() });
        URL.revokeObjectURL(url); res(id);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Não foi possível abrir esta imagem.')); };
      img.src = url;
    });
  }
  // Fundo criado por IA: a IA devolve apenas um SVG abstrato/paisagem, SEM texto; o texto é aplicado depois pelo editor.
  function painelIA() {
    var desc = h('textarea.entrada#ia-fundo', { rows: 3, maxlength: 300, placeholder: 'Descreva o fundo. Ex.: amanhecer dourado sobre colinas com névoa suave' });
    var estado = h('p.sub'), bt = h('button.bt.pri.peq', { on: { click: gerar } }, ico('brilho'), 'Gerar fundo');
    async function gerar() {
      var sample = root.claude && root.claude.use ? await root.claude.use('sample') : null;
      if (!sample) { estado.textContent = 'A criação com IA não está disponível aqui. Use uma foto, cor ou degradê.'; return; }
      if (!desc.value.trim()) { estado.textContent = 'Descreva o fundo que você quer.'; return; }
      var F = A2Arte.formatoDe(E.spec);
      bt.disabled = true; estado.textContent = 'Criando o fundo…';
      try {
        var r = await sample('Crie UM fundo decorativo em SVG para uma arte de versículo bíblico.\n' +
          'Descrição do usuário: ' + desc.value.trim() + '\n' +
          'Regras obrigatórias: responda SOMENTE com o código <svg>…</svg>; viewBox="0 0 ' + F.w + ' ' + F.h + '"; use formas, gradientes (linearGradient/radialGradient) e filtros simples; ' +
          'NÃO inclua nenhum texto, letra, número, palavra, elemento <text>, imagem externa, script, link ou estilo CSS; não desenhe rostos de pessoas nem figuras de Jesus; ' +
          'deixe a área central mais calma e sem detalhes fortes, pois um versículo será aplicado por cima; no máximo 60 elementos; cores harmoniosas.', { modelTier: 'default' });
        var svg = A2Arte.limparSvg(r && r.text);
        if (!svg) throw new Error('A resposta não trouxe um fundo válido. Tente descrever de outro jeito.');
        if (svg.length > 120000) throw new Error('O fundo ficou complexo demais. Tente uma descrição mais simples.');
        var x = E.spec.fundo; x.tipo = 'ia'; x.svg = svg; x.descricao = desc.value.trim(); x.zoom = 1; x.dx = 0; x.dy = 0; if (!(x.sobreposicao.opacidade >= 0.15)) x.sobreposicao.opacidade = 0.2;
        agendar(); commit();
        estado.textContent = 'Pronto. Fundo gerado por IA, sem texto; o versículo é aplicado pelo editor.';
      } catch (e) {
        estado.textContent = e && e.code === 'rate_limited' ? 'Muitos pedidos seguidos. Aguarde um pouco e tente de novo.' : e && e.code === 'not_granted' ? 'A criação com IA não foi autorizada aqui.' : (e.message || 'Não foi possível gerar agora.');
      } finally { bt.disabled = false; }
    }
    return h('div.form', h('label.campo', { for: 'ia-fundo' }, h('span', 'Como deve ser o fundo?'), desc), bt, estado,
      h('div.aviso-ia', ico('brilho'), h('span', 'A IA cria só a imagem de fundo. Ela nunca escreve o versículo.')));
  }

  // ---------- CORES
  PAINEIS.cores = function () {
    var wrap = h('div.pn'), L = camadaSel();
    wrap.appendChild(h('div.pn-topo', h('b', 'Paletas harmonizadas')));
    wrap.appendChild(h('div.paletas', A2Arte.PALETAS.map(function (p) {
      return h('button.paleta', { type: 'button', 'aria-pressed': String(E.spec.paleta === p.id), 'aria-label': 'Aplicar a paleta ' + p.nome, on: { click: function () {
        E.spec = A2Arte.aplicarPaleta(E.spec, p); agendar(); commit(); montarPainel();
      } } }, h('span.faixas', [p.fundo, p.apoio, p.destaque, p.texto].map(function (c) { return h('i', { style: { background: c } }); })), h('small', p.nome));
    })));
    if (E.spec.fundo.tipo === 'banco' || E.spec.fundo.tipo === 'imagem') wrap.appendChild(h('p.sub', 'Com foto no fundo, a paleta muda os textos e os elementos; o fundo continua a foto.'));
    var alvo = L || camada('versiculo'), corAtual = alvo.cor || '#FFFFFF';
    wrap.appendChild(h('div.pn-topo', h('b', 'Cor de: ' + nomeCamada(alvo))));
    wrap.appendChild(seletorCor(corAtual, function (v) { alvo.cor = v; }, paletaAtual()));
    var harm = A2Arte.harmonias(corAtual);
    wrap.appendChild(h('div.harmonias', harm.map(function (hm) {
      return h('div.harmonia', h('small', hm.nome), h('div.amostras', hm.cores.map(function (c) {
        return h('button.amostra', { type: 'button', style: { background: c }, 'aria-label': hm.nome + ' ' + c, title: c, on: { click: function () { alvo.cor = c; agendar(); commit(); montarPainel(); } } });
      })));
    })));
    var fundoCor = E.spec.fundo.tipo === 'cor' ? E.spec.fundo.cor : E.spec.fundo.tipo === 'gradiente' ? E.spec.fundo.cores[0] : null;
    if (fundoCor && alvo.tipo === 'texto') {
      var ct = A2Arte.contraste(corAtual, fundoCor);
      wrap.appendChild(h('p.sub' + (ct < 3 ? '.erro' : ''), 'Contraste com o fundo: ' + ct.toFixed(1) + ':1 ' + (ct >= 4.5 ? '(ótima leitura)' : ct >= 3 ? '(boa para textos grandes)' : '(pouca leitura — escolha outra cor)')));
    }
    return wrap;
  };

  // ---------- ELEMENTOS
  var BIBLIOTECA = [
    { grupo: 'Formas', itens: [['retangulo', { nome: 'Retângulo', w: 0.5, h: 0.25 }], ['retangulo', { nome: 'Cantos arredondados', w: 0.5, h: 0.25, raio: 48 }], ['circulo', { nome: 'Círculo', w: 0.4, h: 0.32 }],
      ['circulo', { nome: 'Anel', w: 0.4, h: 0.32, preenchido: false, espessura: 6 }], ['retangulo', { nome: 'Faixa', w: 1, h: 0.16 }]] },
    { grupo: 'Linhas', itens: [['linha', { nome: 'Linha', w: 0.4, h: 0.01, espessura: 4 }], ['linha', { nome: 'Linha dupla', estilo: 'dupla', w: 0.4, h: 0.01, espessura: 4 }], ['ornamento', { nome: 'Divisor', estilo: 'divisor', w: 0.36, h: 0.035, espessura: 2 }]] },
    { grupo: 'Molduras', itens: [['moldura', { nome: 'Moldura simples', w: 0.9, h: 0.92, espessura: 3 }], ['moldura', { nome: 'Moldura dupla', estilo: 'dupla', w: 0.9, h: 0.92, espessura: 3 }], ['moldura', { nome: 'Cantos ornamentais', estilo: 'cantos', w: 0.88, h: 0.9, espessura: 4 }]] },
    { grupo: 'Ícones', itens: A2Arte.ICONES.map(function (n) { return ['icone', { icone: n, nome: NOMES_ICONES[n], w: 0.12, h: 0.12, y: 0.13 }]; }) },
    { grupo: 'Decorações', itens: [['ornamento', { estilo: 'ramos', nome: 'Ramos', w: 0.34, h: 0.08, y: 0.86 }], ['ornamento', { estilo: 'aspas', nome: 'Aspas', w: 0.16, h: 0.12, y: 0.16 }],
      ['ornamento', { estilo: 'raios', nome: 'Raios de luz', w: 1.3, h: 0.5, y: 0.2, opacidade: 0.4 }], ['ornamento', { estilo: 'selo', nome: 'Selo', w: 0.3, h: 0.24, espessura: 3 }]] },
    { grupo: 'Texturas', itens: [['textura', { estilo: 'granulado', nome: 'Granulado', opacidade: 0.3, cor: '#FFFFFF' }], ['textura', { estilo: 'papel', nome: 'Papel', opacidade: 0.5, cor: '#8A6A3A' }],
      ['textura', { estilo: 'linhas', nome: 'Linhas', opacidade: 0.12, cor: '#FFFFFF' }], ['textura', { estilo: 'pontos', nome: 'Pontos', opacidade: 0.15, cor: '#FFFFFF' }],
      ['textura', { estilo: 'vinheta', nome: 'Vinheta', opacidade: 0.5, cor: '#000000' }], ['textura', { estilo: 'luz', nome: 'Luz suave', opacidade: 0.45, cor: '#FFF4DC' }]] }
  ];
  function corDestaque() {
    var p = A2Arte.PALETAS.filter(function (x) { return x.id === E.spec.paleta; })[0];
    if (p) return p.destaque;
    var R = camada('referencia'); return R && R.visivel !== false ? R.cor : '#A58A57';
  }
  function adicionarElemento(forma, o) {
    var e = A2Arte.camadaElemento(forma, Object.assign({}, o, { cor: o.cor && forma === 'textura' ? o.cor : corDestaque() }));
    var cs = E.spec.camadas, iV = cs.findIndex(function (c) { return c.tipo === 'texto'; });
    if (forma === 'textura') cs.unshift(e); else cs.splice(iV < 0 ? cs.length : iV, 0, e);   // o texto continua por cima
    E.sel = e.id; commit(); montarPainel(); agendar();
    UI.aviso((o.nome || NOMES_FORMAS[forma]) + ' adicionado. Arraste para posicionar.');
  }
  PAINEIS.elementos = function () {
    var wrap = h('div.pn'), L = camadaSel();
    if (L && L.tipo === 'elemento') {
      wrap.appendChild(h('div.pn-topo', h('b', nomeCamada(L)), h('div.esp'),
        h('button.bt-ico.peq', { 'aria-label': 'Duplicar', title: 'Duplicar', on: { click: duplicarSel } }, ico('duplicar')),
        h('button.bt-ico.peq', { 'aria-label': 'Trazer para frente', title: 'Trazer para frente', on: { click: function () { E.spec.camadas = A2Arte.moverCamada(E.spec.camadas, L.id, 1); agendar(); commit(); } } }, ico('subir')),
        h('button.bt-ico.peq', { 'aria-label': 'Enviar para trás', title: 'Enviar para trás', on: { click: function () { E.spec.camadas = A2Arte.moverCamada(E.spec.camadas, L.id, -1); agendar(); commit(); } } }, ico('descer')),
        h('button.bt-ico.peq.perigo#ed-excluir-el', { 'aria-label': 'Excluir', title: 'Excluir', on: { click: excluirSel } }, ico('lixo'))));
      var props = h('div.pn-corpo');
      props.appendChild(grupo('Cor', seletorCor(L.cor, function (v) { L.cor = v; }, paletaAtual())));
      props.appendChild(deslizador('Transparência', 1 - L.opacidade, 0, 0.95, 0.05, pct, function (v) { L.opacidade = Math.round((1 - v) * 100) / 100; }));
      if (L.forma !== 'textura') {
        props.appendChild(deslizador('Largura', L.w, 0.02, 1.3, 0.01, pct, function (v) { L.w = v; if (L.forma === 'icone') L.h = v * A2Arte.formatoDe(E.spec).w / A2Arte.formatoDe(E.spec).h; }));
        if (L.forma !== 'icone' && L.forma !== 'linha') props.appendChild(deslizador('Altura', L.h, 0.02, 1.3, 0.01, pct, function (v) { L.h = v; }));
        props.appendChild(deslizador('Rotação', L.rotacao || 0, -180, 180, 1, function (v) { return Math.round(v) + '°'; }, function (v) { L.rotacao = v; }));
      }
      if (['linha', 'moldura', 'ornamento'].indexOf(L.forma) >= 0 || L.preenchido === false) props.appendChild(deslizador('Espessura', L.espessura, 1, 16, 0.5, function (v) { return v + ' px'; }, function (v) { L.espessura = v; }));
      if (L.forma === 'retangulo') props.appendChild(deslizador('Arredondamento', L.raio || 0, 0, 200, 2, function (v) { return Math.round(v) + ' px'; }, function (v) { L.raio = v; }));
      if (L.forma === 'retangulo' || L.forma === 'circulo') props.appendChild(chave('ed-preench', 'Preenchido', L.preenchido !== false, function (v) { L.preenchido = v; agendar(); commit(); montarPainel(); }));
      wrap.appendChild(props);
      wrap.appendChild(h('div.pn-topo', h('b', 'Adicionar outro')));
    }
    wrap.appendChild(h('div.grupo-painel', h('span.rot-grupo', 'Texto'), h('div.linha-bts',
      h('button.bt.peq', { on: { click: function () { adicionarTexto('livre'); } } }, ico('texto'), 'Texto'),
      h('button.bt.peq', { on: { click: function () { adicionarTexto('assinatura'); } } }, ico('editar'), 'Assinatura'),
      h('button.bt.peq#ed-add-marca', { on: { click: function () { adicionarTexto('marca'); } } }, ico('cruz'), 'Marca Atos 2'))));
    BIBLIOTECA.forEach(function (g) {
      wrap.appendChild(h('div.grupo-painel', h('span.rot-grupo', g.grupo), h('div.biblioteca', g.itens.map(function (it) {
        var cv = h('canvas', { width: 112, height: 112, 'aria-hidden': 'true' });
        try { A2Desenho.previaElemento(cv, Object.assign({ forma: it[0] }, it[1]), '#192D50'); } catch (e) {}
        return h('button.item-bib', { type: 'button', title: it[1].nome, 'aria-label': 'Adicionar ' + it[1].nome, on: { click: function () { adicionarElemento(it[0], it[1]); } } }, cv, h('small', it[1].nome));
      }))));
    });
    return wrap;
  };

  // ---------- CAMADAS
  PAINEIS.camadas = function () {
    var wrap = h('div.pn'), cs = E.spec.camadas;
    wrap.appendChild(h('div.pn-topo', h('b', 'Camadas'), h('div.esp'), h('small.sub', 'A de cima aparece na frente')));
    var lista = h('ul.lista-camadas');
    cs.slice().reverse().forEach(function (c) {
      var sel = c.id === E.sel;
      var li = h('li' + (sel ? '.sel' : ''),
        h('button.cam-nome', { type: 'button', 'aria-pressed': String(sel), on: { click: function () { E.sel = c.id; montarPainel(); desenharSobre(); } } },
          ico(c.tipo === 'texto' ? 'texto' : c.forma === 'icone' ? 'estrela' : c.forma === 'textura' ? 'grade' : 'forma'), h('span', nomeCamada(c))),
        h('button.bt-ico.peq', { 'aria-label': (c.visivel === false ? 'Mostrar ' : 'Ocultar ') + nomeCamada(c), 'aria-pressed': String(c.visivel !== false),
          on: { click: function () { c.visivel = c.visivel === false; agendar(); commit(); montarPainel(); } } }, ico(c.visivel === false ? 'olhoOff' : 'olho')),
        h('button.bt-ico.peq', { 'aria-label': (c.bloqueado ? 'Desbloquear ' : 'Bloquear ') + nomeCamada(c), 'aria-pressed': String(!!c.bloqueado),
          on: { click: function () { c.bloqueado = !c.bloqueado; commit(); montarPainel(); desenharSobre(); } } }, ico(c.bloqueado ? 'cadeado' : 'cadeadoAberto')));
      if (sel) li.appendChild(h('div.cam-acoes',
        h('button.bt.peq', { on: { click: function () { E.spec.camadas = A2Arte.moverCamada(E.spec.camadas, c.id, 1); agendar(); commit(); montarPainel(); } } }, ico('subir'), 'Subir'),
        h('button.bt.peq', { on: { click: function () { E.spec.camadas = A2Arte.moverCamada(E.spec.camadas, c.id, -1); agendar(); commit(); montarPainel(); } } }, ico('descer'), 'Descer'),
        c.papel !== 'versiculo' && c.papel !== 'referencia' ? h('button.bt.peq', { on: { click: duplicarSel } }, ico('duplicar'), 'Duplicar') : null,
        c.papel !== 'versiculo' ? h('button.bt.peq.perigo', { on: { click: excluirSel } }, ico('lixo'), 'Excluir') : null));
      lista.appendChild(li);
    });
    lista.appendChild(h('li.fundo-cam', h('button.cam-nome', { type: 'button', on: { click: function () { E.painel = 'fundo'; montarPainel(); } } }, ico('imagem'), h('span', 'Fundo')), h('small.sub', 'Toque para editar')));
    wrap.appendChild(lista);
    return wrap;
  };

  // ---------------------------------------------------------------- menu ⋮
  function menuEditor() {
    UI.folha('Opções da arte', function (api) {
      function item(icone, titulo, desc, fn, perigo) {
        return h('button.item' + (perigo ? '.perigo' : ''), { on: { click: function () { api.fechar(); fn(); } } }, ico(icone), h('div.corpo', h('span.titulo', titulo), desc ? h('span.meta', desc) : null));
      }
      return h('div.lista',
        item('livro', 'Trocar versículo', 'Mantém o visual e troca o texto', trocarVersiculo),
        item('colecao', 'Trocar modelo', 'Mantém o versículo e troca o visual', function () { E.voltar = 'editor'; if (tSalvar) salvarAgora(); ir('modelo'); }),
        item('grade', 'Formato', A2Arte.formatoDe(E.spec).nome + ' · ' + A2Arte.formatoDe(E.spec).w + ' × ' + A2Arte.formatoDe(E.spec).h, escolherFormato),
        item('editar', 'Renomear', E.spec.nome || 'Arte sem título', renomear),
        item('estrela', 'Salvar como modelo', 'Reutilize este visual em outras artes', salvarModelo),
        item('duplicar', 'Duplicar arte', 'Cria uma cópia para editar', duplicarArte),
        item('mais', 'Nova arte', 'Começa do versículo', function () { if (tSalvar) salvarAgora(); novaArte(); }),
        item('lixo', 'Excluir arte', null, excluirArte, true));
    });
  }
  function escolherFormato() {
    UI.folha('Formato', function (api) {
      var F = A2Arte.formatoDe(E.spec);
      var w = h('input.entrada#fmt-w', { type: 'number', min: 200, max: A2Arte.LIMITE_PX, value: F.w, 'aria-label': 'Largura em pixels' });
      var hh = h('input.entrada#fmt-h', { type: 'number', min: 200, max: A2Arte.LIMITE_PX, value: F.h, 'aria-label': 'Altura em pixels' });
      function aplicar(id) {
        E.spec.formato = id;
        if (id === 'personalizado') E.spec.personalizado = { w: Math.round(Math.max(200, Math.min(A2Arte.LIMITE_PX, +w.value || 1080))), h: Math.round(Math.max(200, Math.min(A2Arte.LIMITE_PX, +hh.value || 1350))) };
        api.fechar(); commit(); dimensionar(); UI.aviso('Formato: ' + A2Arte.formatoDe(E.spec).nome + '.');
      }
      return h('div.form', h('div.lista', A2Arte.FORMATOS.filter(function (f) { return !f.oculto && !f.livre; }).map(function (f) {
        return h('button.item', { 'aria-pressed': String(E.spec.formato === f.id), on: { click: function () { aplicar(f.id); } } },
          h('div.mini-formato', h('i', { style: { width: (26 * Math.min(1, f.w / f.h)) + 'px', height: (26 * Math.min(1, f.h / f.w)) + 'px' } })),
          h('div.corpo', h('span.titulo', f.nome), h('span.meta', f.w + ' × ' + f.h + ' px · ' + f.descricao)), E.spec.formato === f.id ? ico('ok') : null);
      })), h('div.campo', h('span', 'Personalizado (px)'), h('div.seletor-vs', w, h('span', '×'), hh, h('button.bt.peq', { on: { click: function () { aplicar('personalizado'); } } }, 'Aplicar'))),
        h('p.sub', 'Os elementos se reposicionam proporcionalmente; o texto se ajusta ao novo tamanho.'));
    });
  }
  async function salvarModelo() {
    var nome = await UI.perguntar('Salvar como modelo', 'Nome do modelo', E.spec.nome || '', { ok: 'Salvar modelo', max: 40 });
    if (!nome) return;
    var camadas = clonar(E.spec.camadas).map(function (c) { if (c.papel === 'livre') c.manter = false; return c; });
    Dados.salvar('modelos', UI.uid(), { v: 2, nome: nome.trim(), fundo: clonar(E.spec.fundo), camadas: camadas, formato: E.spec.formato, criadoEm: new Date().toISOString() });
    UI.aviso('Modelo salvo em Meus modelos.');
  }
  async function duplicarArte() {
    if (tSalvar) await salvarAgora();
    var s = clonar(E.spec); s.nome = (s.nome || 'Arte') + ' (cópia)';
    abrirNoEditor(s, null); UI.aviso('Cópia criada. Você está editando a cópia.');
  }
  async function excluirArte() {
    if (!(await UI.confirmar('Excluir arte', 'Esta arte será removida de Minhas artes.', 'Excluir', true))) return;
    clearTimeout(tSalvar); tSalvar = null;
    if (E.id) Dados.excluir('artes', E.id);
    E.spec = null; E.id = null; E.etapa = 'inicio'; App.recarregar(); UI.aviso('Arte excluída.');
  }

  // ================================================================ etapa 4 — exportar e compartilhar
  function abrirExportar() {
    var spec = E.spec, op = { tipo: 'png', qualidade: 0.92 };
    UI.folha('Exportar e compartilhar', function (api) {
      var img = h('img.previa-export', { alt: 'Prévia da arte' }), info = h('p.sub', { style: { textAlign: 'center' } });
      function atualizar() {
        var F = A2Arte.formatoDe(spec); info.textContent = F.nome + ' · ' + F.w + ' × ' + F.h + ' px · ' + (op.tipo === 'jpeg' ? 'JPG ' + Math.round(op.qualidade * 100) + '%' : 'PNG');
        var c = document.createElement('canvas'); A2Desenho.desenhar(c, spec, 640).then(function () { img.src = c.toDataURL('image/jpeg', 0.85); });
      }
      var qual = h('div', deslizadorSimples('Qualidade do JPG', op.qualidade, 0.6, 1, 0.01, pct, function (v) { op.qualidade = v; atualizar(); }));
      qual.hidden = true;
      var formatos = A2Arte.FORMATOS.filter(function (f) { return !f.oculto && (!f.livre || spec.formato === 'personalizado'); }).map(function (f) { return [f.id, f.nome]; });
      async function acao(fn, marcarFinal) {
        var ok = await fn(spec, op);
        if (ok !== false && marcarFinal) { await salvarAgora('finalizada'); }
      }
      atualizar();
      return h('div.form.exportar', passos(4), img, info,
        h('div.campo', h('span', 'Formato'), chips(formatos, spec.formato, function (id) { spec.formato = id; commit(); dimensionar(); atualizar(); })),
        h('div.campo', h('span', 'Tipo de arquivo'), chips([['png', 'PNG (máxima qualidade)'], ['jpeg', 'JPG (arquivo menor)']], op.tipo, function (t) { op.tipo = t; qual.hidden = t !== 'jpeg'; atualizar(); })),
        qual,
        h('div.linha-bts.acoes-export',
          h('button.bt.pri#exp-compartilhar', { on: { click: function () { acao(compartilharArte, true); } } }, ico('compartilhar'), 'Compartilhar'),
          h('button.bt#exp-baixar', { on: { click: function () { acao(baixarArte, true); } } }, ico('baixar'), 'Baixar ' + (op.tipo === 'jpeg' ? 'JPG' : 'imagem')),
          h('button.bt#exp-salvar', { on: { click: async function () { await salvarAgora('finalizada'); UI.aviso('Arte salva em Minhas artes › Finalizadas.'); } } }, ico('ok'), 'Salvar em Minhas artes'),
          h('button.bt#exp-modelo', { on: { click: function () { api.fechar(); salvarModelo(); } } }, ico('estrela'), 'Salvar como modelo')),
        h('p.sub', 'Ao baixar ou compartilhar, a arte vai para Minhas artes › Finalizadas. Ela continua editável.'));
    });
  }
  function deslizadorSimples(rotulo, valor, min, max, passo, fmt, fn) {
    var id = 'ed-r' + (++contIds), saida = h('output', { for: id }, fmt(valor));
    var r = h('input#' + id, { type: 'range', min: min, max: max, step: passo, value: valor });
    r.addEventListener('input', function () { saida.textContent = fmt(+r.value); }); r.addEventListener('change', function () { fn(+r.value); });
    return h('label.campo.deslizador', { for: id }, h('span', rotulo, saida), r);
  }

  // ================================================================ Inspirações (artes prontas da galeria editorial)
  function galeria(tela) {
    tela.appendChild(cabEtapa('Inspirações', 0, function () { ir('inicio'); }));
    var area = h('div'); tela.appendChild(area);
    var cat = E.catGaleria || 'favoritas';
    var extras = (Dados.conteudo.galeria || []).filter(function (x) { return x.publicado; });
    var favs = Dados.todos('galeriaFav');
    if (cat === 'favoritas' && !favs.length) cat = A2Conteudo.GALERIA[0].id;
    var cats = (favs.length ? [{ id: 'favoritas', nome: 'Favoritas' }] : []).concat(A2Conteudo.GALERIA, extras.length ? [{ id: 'novidades', nome: 'Novidades' }] : []);
    area.appendChild(chips(cats.map(function (c) { return [c.id, c.nome]; }), cat, function (id) { E.catGaleria = id; App.recarregar(); }));
    var itens;
    if (cat === 'favoritas') itens = favs.map(function (f) { return { id: f.id, ref: f.ref, modelo: f.modelo }; });
    else if (cat === 'novidades') itens = extras.map(function (x) { return { id: 'n:' + x.id, ref: x.ref, modelo: x.modelo }; });
    else {
      var g = A2Conteudo.GALERIA.filter(function (x) { return x.id === cat; })[0];
      if (g.fotos) itens = g.refs.map(function (r, i) { return { id: cat + ':' + r, ref: r, modelo: 'foto:' + g.fotos[i % g.fotos.length] }; });
      else {
        var base = g.papel ? PAPEIS : LEGADO.filter(function (m) { return !m.papel; });
        if (g.papel) { var ordem = ['aurora-boreal', 'pier', 'leao', 'fiorde', 'cisnes', 'floresta-nevoa', 'vulcao', 'lago-amanhecer', 'caminho-outono', 'margaridas', 'iceberg', 'praia'];
          base = ordem.map(function (id) { return base.filter(function (m) { return m.fundo.id === id; })[0]; }).filter(Boolean); }
        itens = g.refs.map(function (r, i) { return { id: cat + ':' + r, ref: r, modelo: base[(i + (g.papel ? 0 : A2Conteudo.GALERIA.indexOf(g))) % base.length].id }; });
      }
    }
    var grade = h('div.artes-grade', { style: { marginTop: '10px' } }); area.appendChild(grade);
    itens.forEach(function (it) {
      var spec = specGaleria(it), cv = h('canvas');
      it._spec = spec; it._cv = cv;
      grade.appendChild(h('button.arte-card' + (A2Arte.formatoDe(spec).papel ? '.papel' : ''), { on: { click: function () { abrirGaleria(it); } } }, cv, h('small', A2Ref.formatar(Biblia.interpretar(it.ref).ref))));
    });
    (async function () { for (var i = 0; i < itens.length; i++) { if (!itens[i]._cv.isConnected) return; await A2Desenho.desenhar(itens[i]._cv, itens[i]._spec, 300).catch(function () {}); } })();
  }
  function specGaleria(it) {
    if (/^foto:/.test(it.modelo || '')) {
      var ft = A2Fotos.POR_ID[it.modelo.slice(5)] || A2Fotos.LISTA[0];
      return specV1({ fundo: { tipo: 'banco', id: ft.id }, escurecer: ft.escurecer, estilo: { fonte: 'Cormorant Garamond', cor: ft.cor, sombra: ft.cor === '#FFFFFF' }, pos: { x: 0.5, y: ft.y || 0.47 } }, it.ref);
    }
    var m = LEGADO.filter(function (x) { return x.id === it.modelo; })[0] || LEGADO[0];
    return specV1(m, it.ref);
  }
  function abrirGaleria(it) {
    var fav = !!Dados.obter('galeriaFav', it.id.replace(/^n:/, ''));
    UI.folha(A2Ref.formatar(Biblia.interpretar(it.ref).ref), function (api) {
      var cv = h('canvas.previa-grande');
      A2Desenho.desenhar(cv, it._spec, 760);
      var bFav = h('button.bt', { on: { click: function () {
        var k = it.id.replace(/^n:/, '');
        if (fav) Dados.excluir('galeriaFav', k); else Dados.salvar('galeriaFav', k, { ref: it.ref, modelo: it.modelo });
        fav = !fav; bFav.replaceChildren(ico(fav ? 'coracaoCheio' : 'coracao'), fav ? 'Favorita' : 'Favoritar');
      } } }, ico(fav ? 'coracaoCheio' : 'coracao'), fav ? 'Favorita' : 'Favoritar');
      return h('div.form', cv, h('div.linha-bts', { style: { justifyContent: 'center' } },
        h('button.bt.pri', { on: { click: function () { baixarArte(it._spec); } } }, ico('baixar'), 'Baixar'),
        h('button.bt', { on: { click: function () { compartilharArte(it._spec); } } }, ico('compartilhar'), 'Compartilhar'),
        h('button.bt', { on: { click: function () { api.fechar(); abrirNoEditor(clonar(it._spec), null); } } }, ico('editar'), 'Personalizar'),
        bFav));
    });
  }

  // ================================================================ entrada
  function migrarRascunhoAntigo() {
    var r = Dados.obter('_rascunhoArte', 'atual');
    if (!r) return;
    Dados.excluir('_rascunhoArte', 'atual');
    if (r.idArte || !r.spec || !r.spec.conteudo || r.spec.conteudo.ref === 'At 2:42') return;   // rascunho vazio da v1
    var id = UI.uid(), agora = new Date().toISOString(), s = A2Arte.migrar(r.spec);
    Dados.salvar('artes', id, { spec: s, miniatura: '', titulo: s.conteudo.ref || 'Arte', nome: '', estado: 'rascunho', atualizadoEm: agora, criadoEm: agora });
    miniatura(s).then(function (m) { var a = Dados.obter('artes', id); if (a) Dados.salvar('artes', id, Object.assign({}, a, { miniatura: m })); }, function () {});
  }
  function render(tela) {
    migrarRascunhoAntigo();
    tela.classList.toggle('tela-criar', true);
    App.aoSair(function () { tela.classList.remove('tela-criar'); });
    switch (E.etapa) {
      case 'versiculo': etapaVersiculo(tela); break;
      case 'modelo': etapaModelo(tela); break;
      case 'editor': editor(tela); break;
      case 'galeria': galeria(tela); break;
      default: hub(tela);
    }
  }
  // Atalho de outras telas (Bíblia, Início, devocionais): começa uma arte com o versículo e vai para os modelos
  function comVersiculo(refStr) {
    if (tSalvar) salvarAgora();
    E.novo = { conteudo: { tipo: 'versiculo', ref: refStr, versao: Biblia.padrao(), rotulo: '' }, formato: 'feed' };
    E.voltar = null; E.etapa = 'modelo';
    App.ir('criar');
  }
  // Compatível com a v1: desenha qualquer arte (v1 ou v2) num canvas
  function desenharArte(canvas, spec, largura) { return A2Desenho.desenhar(canvas, spec, largura); }

  root.Telas.criar = { render: render, comVersiculo: comVersiculo, desenharArte: desenharArte, salvarImagem: salvarImagem, compartilharImagem: compartilharImagem,
    _estado: function () { return E; } };
})(window);
