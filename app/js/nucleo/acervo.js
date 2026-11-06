/*
 * ATOS 2 — Acervo da Biblioteca (Livros e Artigos): catálogo, regras de publicação, filtros, citação e referências.
 * Navegador: window.A2Acervo · Node: module.exports
 *
 * Catálogo inicial: app/acervo/catalogo.json. A administração grava por cima (mesmo id) em
 * pub/conteudo/acervo (publicado ou retirado) e cria rascunhos em editorial/rascunhos/acervo.
 * Uma publicação só aparece para os leitores com situacao "publicado", direitos verificados e revisão editorial registrada.
 */
(function (root) {
  'use strict';

  var CATEGORIAS = [
    { id: 'livros', nome: 'Livros cristãos', icone: 'livro', tipo: 'livro' },
    { id: 'artigos', nome: 'Artigos teológicos', icone: 'nota', tipo: 'artigo' },
    { id: 'comentarios', nome: 'Comentários bíblicos', icone: 'texto', tipo: 'comentario' },
    { id: 'estudos', nome: 'Estudos bíblicos', icone: 'planos', tipo: 'estudo' },
    { id: 'historia', nome: 'História da Igreja', icone: 'historico' },
    { id: 'pais', nome: 'Pais da Igreja', icone: 'pessoa' },
    { id: 'documentos', nome: 'Documentos históricos', icone: 'escudo', tipo: 'documento' },
    { id: 'cristocentrica', nome: 'Teologia cristocêntrica', icone: 'cruz' }
  ];
  var TIPOS = {
    livro: { nome: 'Livro', icone: 'livro' }, artigo: { nome: 'Artigo', icone: 'nota' }, documento: { nome: 'Documento', icone: 'escudo' },
    comentario: { nome: 'Comentário bíblico', icone: 'texto' }, estudo: { nome: 'Estudo', icone: 'planos' }
  };
  var IDIOMAS = { pt: 'Português', en: 'Inglês', es: 'Espanhol', la: 'Latim', el: 'Grego' };
  // permiteTexto: a licença permite reproduzir o texto integral dentro do app
  var LICENCAS = {
    'dominio-publico': { nome: 'Domínio público', permiteTexto: true },
    'cc-by-4.0': { nome: 'CC BY 4.0', permiteTexto: true },
    'cc-by-sa-4.0': { nome: 'CC BY-SA 4.0', permiteTexto: true },
    'cc-by-nc-nd-3.0': { nome: 'CC BY-NC-ND 3.0', permiteTexto: false },
    'cc-by-nc-nd-4.0': { nome: 'CC BY-NC-ND 4.0', permiteTexto: false },
    'cc': { nome: 'Creative Commons (versão não indicada)', permiteTexto: false },
    'direitos-reservados': { nome: 'Direitos reservados', permiteTexto: false }
  };
  var ACESSOS = { integral: 'Ler no app', app: 'Abrir no app', link: 'Ler na fonte' };

  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function copia(o) { return JSON.parse(JSON.stringify(o)); }

  // ---------------------------------------------------------------- catálogo efetivo
  // seed: catálogo do app; publicados: registros da área pública (sobrepõem o seed pelo id); rascunhos: área editorial
  function mesclar(seed, publicados, rascunhos) {
    var mapa = {}, ordem = [];
    (seed || []).forEach(function (p) { if (p && p.id && !mapa[p.id]) { mapa[p.id] = Object.assign(copia(p), { _origem: 'catalogo' }); ordem.push(p.id); } });
    (publicados || []).forEach(function (r) {
      if (!r || !r.id) return;
      var base = mapa[r.id];
      var dados = Object.assign({}, r); delete dados._t;
      if (base) mapa[r.id] = Object.assign(base, dados, { _origem: 'catalogo', _editado: true });
      else { mapa[r.id] = Object.assign(dados, { _origem: 'editorial' }); ordem.push(r.id); }
    });
    (rascunhos || []).forEach(function (r) {
      if (!r || !r.id) return;
      var dados = Object.assign({}, r, { situacao: 'revisao', _rascunho: true }); delete dados._t;
      if (mapa[r.id]) mapa[r.id]._revisaoPendente = dados;     // edição pendente de algo que já existe
      else { mapa[r.id] = Object.assign(dados, { _origem: 'editorial' }); ordem.push(r.id); }
    });
    return ordem.map(function (id) { return mapa[id]; });
  }

  // Regras para aparecer aos leitores (as mesmas da restrição do banco)
  function podePublicar(p) {
    var f = [];
    if (!p || !p.id) return { ok: false, faltas: ['identificador'] };
    if (!String(p.titulo || '').trim()) f.push('título');
    if (!String(p.autor || '').trim()) f.push('autor');
    if (!TIPOS[p.tipo]) f.push('tipo de publicação');
    if (!CATEGORIAS.some(function (c) { return c.id === p.categoria; })) f.push('categoria');
    if (!IDIOMAS[p.idioma]) f.push('idioma');
    if (!String(p.descricao || '').trim()) f.push('descrição');
    if (!p.fonte || !String(p.fonte.nome || '').trim()) f.push('fonte original');
    var lic = p.licenca && LICENCAS[p.licenca.codigo];
    if (!lic) f.push('licença');
    if (!ACESSOS[p.acesso]) f.push('forma de acesso');
    if (p.acesso === 'integral') {
      if (lic && !lic.permiteTexto) f.push('licença que permita reproduzir o texto (use “Ler na fonte”)');
      if (!p.arquivo) f.push('arquivo do texto');
    }
    if (p.acesso === 'link' && !/^https:\/\//.test((p.fonte && p.fonte.url) || '')) f.push('link https da publicação original');
    var v = p.verificacao || {};
    if (v.direitos !== 'verificado') f.push('verificação de direitos');
    if (!v.editorialEm) f.push('revisão editorial');
    return { ok: !f.length, faltas: f };
  }
  function visivel(p) { return !!p && p.situacao === 'publicado' && !p.removido && podePublicar(p).ok; }
  function situacao(p) { return p.removido ? 'retirado' : p.situacao === 'publicado' && podePublicar(p).ok ? 'publicado' : 'revisao'; }

  function naCategoria(p, cat) {
    if (!cat || cat === 'todas') return true;
    if (p.categoria === cat) return true;
    var c = CATEGORIAS.filter(function (x) { return x.id === cat; })[0];
    return !!(c && c.tipo && c.tipo === p.tipo);
  }

  // f: { categoria, tipo, idioma, acesso ('app' = integral ou app; 'link'), consulta }
  function filtrar(lista, f) {
    f = f || {};
    var termo = norm(f.consulta);
    return (lista || []).map(function (p) {
      if (!naCategoria(p, f.categoria)) return null;
      if (f.tipo && p.tipo !== f.tipo) return null;
      if (f.idioma && p.idioma !== f.idioma) return null;
      if (f.acesso === 'app' && !(p.acesso === 'integral' || p.acesso === 'app')) return null;
      if (f.acesso === 'link' && p.acesso !== 'link') return null;
      var pontos = 1;
      if (termo) {
        pontos = 0;
        if (norm(p.titulo).indexOf(termo) >= 0) pontos += 6;
        if (norm(p.tituloOriginal).indexOf(termo) >= 0) pontos += 3;
        if (norm(p.autor).indexOf(termo) >= 0) pontos += 5;
        if ((p.temas || []).some(function (t) { return norm(t).indexOf(termo) >= 0; })) pontos += 4;
        if (norm(p.tradicao).indexOf(termo) >= 0) pontos += 2;
        if (norm(p.descricao).indexOf(termo) >= 0) pontos += 2;
        if (norm(p.edicao).indexOf(termo) >= 0 || norm(p.tradutor).indexOf(termo) >= 0) pontos += 1;
        if (!pontos) return null;
      }
      return { p: p, pontos: pontos };
    }).filter(Boolean).sort(function (a, b) { return b.pontos - a.pontos; }).map(function (x) { return x.p; });
  }

  function anoNumero(p) { var m = /(\d{3,4})/.exec(String(p.ano || '')); return m ? +m[1] : 9999; }
  function ordenar(lista, modo) {
    var a = (lista || []).slice();
    if (modo === 'titulo') a.sort(function (x, y) { return norm(x.titulo).localeCompare(norm(y.titulo)); });
    else if (modo === 'autor') a.sort(function (x, y) { return norm(x.autor).localeCompare(norm(y.autor)) || norm(x.titulo).localeCompare(norm(y.titulo)); });
    else if (modo === 'ano') a.sort(function (x, y) { return anoNumero(x) - anoNumero(y); });
    else if (modo === 'portugues') a.sort(function (x, y) { return (x.idioma === 'pt' ? 0 : 1) - (y.idioma === 'pt' ? 0 : 1); });
    return a;
  }

  function resumo(lista) {
    var r = { total: 0, noApp: 0, portugues: 0, porCategoria: {} };
    (lista || []).forEach(function (p) {
      r.total++;
      if (p.acesso === 'integral' || p.acesso === 'app') r.noApp++;
      if (p.idioma === 'pt') r.portugues++;
      CATEGORIAS.forEach(function (c) { if (naCategoria(p, c.id)) r.porCategoria[c.id] = (r.porCategoria[c.id] || 0) + 1; });
    });
    return r;
  }

  // ---------------------------------------------------------------- leitura e progresso
  // estado: { secao, par, secoesVistas: {i: true}, concluidoEm }
  function progresso(estado, totalSecoes) {
    if (!estado || !totalSecoes) return 0;
    if (estado.concluidoEm) return 100;
    var vistas = Object.keys(estado.secoesVistas || {}).length;
    var pela = Math.max(vistas, (estado.secao || 0) + (estado.par ? 0.5 : 0));
    return Math.max(0, Math.min(99, Math.round(pela / totalSecoes * 100)));
  }

  // ---------------------------------------------------------------- citação (padrão próximo da ABNT)
  function citacao(p, acessoEm) {
    var partes = [];
    var autor = String(p.autor || '').trim();
    partes.push(autor ? autor.toUpperCase() + '.' : '');
    partes.push((p.titulo || '') + (p.tituloOriginal ? ' [' + p.tituloOriginal + ']' : '') + '.');
    var sobrenome = String(p.tradutor || '').replace(/\s*\(.*\)\s*$/, '').trim().split(/\s+/).pop();
    if (p.tradutor && !/ATOS 2/.test(p.tradutor) && !(sobrenome && String(p.edicao || '').indexOf(sobrenome) >= 0)) partes.push('Tradução: ' + p.tradutor.replace(/\s*\(.*\)\s*$/, '') + '.');
    if (p.edicao) partes.push(p.edicao.replace(/\.$/, '') + '.');
    if (p.fonte && p.fonte.url) partes.push('Disponível em: ' + p.fonte.url + '.' + (acessoEm ? ' Acesso em: ' + acessoEm + '.' : ''));
    return partes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  // ---------------------------------------------------------------- integração com a Biblioteca
  function chaveFavorito(id) { return 'obra-' + id; }
  function chaveDestaque(id, secao, par) { return 'obra-' + id + '-' + secao + '-' + par; }
  function ehObra(registro) { return !!registro && (registro.tipo === 'obra' || /^obra-/.test(String(registro.id || ''))); }
  function itemBiblioteca(p, extra) {
    return Object.assign({ tipo: 'obra', id: p.id, titulo: p.titulo, sub: [p.autor, TIPOS[p.tipo] ? TIPOS[p.tipo].nome : ''].filter(Boolean).join(' · '),
      texto: [p.descricao, (p.temas || []).join(' '), p.tradicao, p.tituloOriginal].filter(Boolean).join(' '), data: '', chaves: [], obra: p }, extra || {});
  }

  // ---------------------------------------------------------------- referências bíblicas em inglês (textos clássicos)
  var LIVROS_EN = [
    ['GEN', 'Genesis|Gen'], ['EXO', 'Exodus|Exod|Ex'], ['LEV', 'Leviticus|Lev'], ['NUM', 'Numbers|Num'], ['DEU', 'Deuteronomy|Deut'],
    ['JOS', 'Joshua|Josh'], ['JDG', 'Judges|Judg'], ['RUT', 'Ruth'], ['1SA', '1 Samuel|1 Sam|I Samuel|I Sam'], ['2SA', '2 Samuel|2 Sam|II Samuel|II Sam'],
    ['1KI', '1 Kings|I Kings|1 Kgs'], ['2KI', '2 Kings|II Kings|2 Kgs'], ['1CH', '1 Chronicles|1 Chron|I Chron'], ['2CH', '2 Chronicles|2 Chron|II Chron'],
    ['EZR', 'Ezra'], ['NEH', 'Nehemiah|Neh'], ['EST', 'Esther|Esth'], ['JOB', 'Job'], ['PSA', 'Psalms|Psalm|Ps|Psa'], ['PRO', 'Proverbs|Prov'],
    ['ECC', 'Ecclesiastes|Eccles|Eccl'], ['SNG', 'Song of Solomon|Canticles|Cant'], ['ISA', 'Isaiah|Isa'], ['JER', 'Jeremiah|Jer'], ['LAM', 'Lamentations|Lam'],
    ['EZK', 'Ezekiel|Ezek'], ['DAN', 'Daniel|Dan'], ['HOS', 'Hosea|Hos'], ['JOL', 'Joel'], ['AMO', 'Amos'], ['OBA', 'Obadiah|Obad'], ['JON', 'Jonah'],
    ['MIC', 'Micah|Mic'], ['NAM', 'Nahum|Nah'], ['HAB', 'Habakkuk|Hab'], ['ZEP', 'Zephaniah|Zeph'], ['HAG', 'Haggai|Hag'], ['ZEC', 'Zechariah|Zech'], ['MAL', 'Malachi|Mal'],
    ['MAT', 'Matthew|Matt|Mat'], ['MRK', 'Mark'], ['LUK', 'Luke'], ['JHN', 'John'], ['ACT', 'Acts'], ['ROM', 'Romans|Rom'],
    ['1CO', '1 Corinthians|1 Cor|I Corinthians|I Cor'], ['2CO', '2 Corinthians|2 Cor|II Corinthians|II Cor'], ['GAL', 'Galatians|Gal'], ['EPH', 'Ephesians|Eph'],
    ['PHP', 'Philippians|Phil'], ['COL', 'Colossians|Col'], ['1TH', '1 Thessalonians|1 Thess|I Thess'], ['2TH', '2 Thessalonians|2 Thess|II Thess'],
    ['1TI', '1 Timothy|1 Tim|I Tim'], ['2TI', '2 Timothy|2 Tim|II Tim'], ['TIT', 'Titus|Tit'], ['PHM', 'Philemon|Philem'], ['HEB', 'Hebrews|Heb'],
    ['JAS', 'James|Jas'], ['1PE', '1 Peter|1 Pet|I Pet|I Peter'], ['2PE', '2 Peter|2 Pet|II Pet|II Peter'], ['1JN', '1 John|I John'], ['2JN', '2 John|II John'],
    ['3JN', '3 John|III John'], ['JUD', 'Jude'], ['REV', 'Revelation|Revelations|Rev']
  ];
  var MAPA_EN = {}, NOMES_EN = [];
  LIVROS_EN.forEach(function (l) { l[1].split('|').forEach(function (n) { MAPA_EN[n.toLowerCase().replace(/\s+/g, ' ')] = l[0]; NOMES_EN.push(n.replace(/ /g, '\\s')); }); });
  NOMES_EN.sort(function (a, b) { return b.length - a.length; });
  var RE_EN = new RegExp('\\b(' + NOMES_EN.join('|') + ')\\.?\\s+([ivxlc]+|\\d{1,3})(?:\\.|:|,)\\s?(\\d{1,3})\\b', 'gi');
  function romano(s) {
    if (/^\d+$/.test(s)) return +s;
    var v = { i: 1, v: 5, x: 10, l: 50, c: 100 }, t = 0, a = String(s).toLowerCase();
    for (var i = 0; i < a.length; i++) { var x = v[a[i]], y = v[a[i + 1]] || 0; if (!x) return 0; t += x < y ? -x : x; }
    return t;
  }
  // Devolve [{ livro, cap, v, chave: 'JHN.8.12', trecho, inicio, fim }] (sem repetir)
  function referenciasIngles(texto) {
    var out = [], vistos = {}, m;
    RE_EN.lastIndex = 0;
    while ((m = RE_EN.exec(String(texto || '')))) {
      var livro = MAPA_EN[m[1].toLowerCase().replace(/\s+/g, ' ')], cap = romano(m[2]), v = +m[3];
      if (!livro || !cap || !v || cap > 150 || v > 176) continue;
      var k = livro + '.' + cap + '.' + v;
      if (vistos[k]) continue; vistos[k] = 1;
      out.push({ livro: livro, cap: cap, v: v, chave: k, trecho: m[0], inicio: m.index, fim: m.index + m[0].length });
    }
    return out;
  }

  // ---------------------------------------------------------------- cadastro pela administração
  function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'publicacao'; }
  function lista(s) { return String(s || '').split(/[,;\n]/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 8); }
  // dados vindos do formulário → registro; devolve { erro } ou { registro }
  function validarCadastro(d, existentes, idAtual) {
    d = d || {};
    var t = String(d.titulo || '').trim(), a = String(d.autor || '').trim();
    if (!t) return { erro: 'Informe o título.' };
    if (!a) return { erro: 'Informe o autor.' };
    if (!TIPOS[d.tipo]) return { erro: 'Escolha o tipo de publicação.' };
    if (!CATEGORIAS.some(function (c) { return c.id === d.categoria; })) return { erro: 'Escolha a categoria.' };
    if (!IDIOMAS[d.idioma]) return { erro: 'Escolha o idioma.' };
    if (!String(d.descricao || '').trim()) return { erro: 'Escreva uma descrição.' };
    if (!LICENCAS[d.licenca]) return { erro: 'Escolha a licença.' };
    var url = String(d.url || '').trim();
    if (d.acesso !== 'integral' && !/^https:\/\/[^\s]+\.[^\s]+/.test(url)) return { erro: 'Informe o link (https://) da publicação original.' };
    if (d.acesso === 'integral' && !LICENCAS[d.licenca].permiteTexto) return { erro: 'Esta licença não permite reproduzir o texto no app. Use “Ler na fonte”.' };
    var id = idAtual || slug(t + ' ' + a.split(/\s+/).slice(-1)[0]);
    if (!idAtual && (existentes || []).some(function (p) { return p.id === id; })) id = id + '-' + Math.random().toString(36).slice(2, 6);
    return { registro: {
      id: id, tipo: d.tipo, categoria: d.categoria, titulo: t.slice(0, 200), tituloOriginal: String(d.tituloOriginal || '').trim().slice(0, 200),
      autor: a.slice(0, 160), autorDatas: String(d.autorDatas || '').trim().slice(0, 40), tradutor: String(d.tradutor || '').trim().slice(0, 120),
      tradicao: String(d.tradicao || '').trim().slice(0, 200), ano: String(d.ano || '').trim().slice(0, 40), edicao: String(d.edicao || '').trim().slice(0, 300),
      descricao: String(d.descricao || '').trim().slice(0, 900), temas: lista(d.temas), idioma: d.idioma,
      acesso: d.acesso === 'integral' ? 'integral' : 'link', arquivo: d.acesso === 'integral' ? String(d.arquivo || '').trim() : undefined,
      fonte: { nome: String(d.fonteNome || '').trim().slice(0, 160) || 'Publicação original', url: url || undefined },
      licenca: { codigo: d.licenca, nome: String(d.licencaNome || '').trim() || LICENCAS[d.licenca].nome, detalhe: String(d.licencaDetalhe || '').trim().slice(0, 400) },
      procedencia: { arquivo: d.acesso === 'integral' ? 'Texto integral' : 'Somente dados bibliográficos e link', tratamento: String(d.procedencia || '').trim().slice(0, 400) }
    } };
  }
  // aprovação: devolve o registro pronto para a área pública
  function aprovar(p, quem, agora) {
    var r = copia(p);
    ['_origem', '_editado', '_rascunho', '_revisaoPendente', '_t'].forEach(function (k) { delete r[k]; });
    r.situacao = 'publicado'; r.removido = false;
    r.verificacao = Object.assign({}, r.verificacao || {}, { direitos: 'verificado', em: (r.verificacao && r.verificacao.em) || agora.slice(0, 10), por: (r.verificacao && r.verificacao.por) || quem, editorialEm: agora.slice(0, 10), editorialPor: quem });
    return r;
  }

  var API = { CATEGORIAS: CATEGORIAS, TIPOS: TIPOS, IDIOMAS: IDIOMAS, LICENCAS: LICENCAS, ACESSOS: ACESSOS, norm: norm,
    mesclar: mesclar, podePublicar: podePublicar, visivel: visivel, situacao: situacao, naCategoria: naCategoria, filtrar: filtrar, ordenar: ordenar, resumo: resumo,
    progresso: progresso, citacao: citacao, chaveFavorito: chaveFavorito, chaveDestaque: chaveDestaque, ehObra: ehObra, itemBiblioteca: itemBiblioteca,
    referenciasIngles: referenciasIngles, romano: romano, slug: slug, validarCadastro: validarCadastro, aprovar: aprovar };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Acervo = API;
})(typeof window !== 'undefined' ? window : this);
