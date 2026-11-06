/*
 * ATOS 2 — Quiz bíblico: banco de perguntas expansível, sorteio inteligente e desafio do dia.
 * Navegador: window.A2Quiz · Node: module.exports
 *
 * As perguntas ficam em app/quiz/*.json (uma lista por seção bíblica, descritas em app/quiz/indice.json)
 * e também na tabela public.sabedoria_perguntas do Supabase. Para crescer o banco basta acrescentar
 * perguntas no mesmo formato — o aplicativo não precisa mudar. Formato de cada pergunta:
 *   { id, secao, tema, dificuldade (1–4), formato, pergunta, opcoes:[...], certa (índice), resposta,
 *     ref, livro, capitulo, versiculo, explicacao, chave }
 * Toda resposta é conferida no texto da Bíblia Livre pelos testes (campo "chave").
 */
(function (root) {
  'use strict';

  var SECOES = [
    { id: 'pentateuco', nome: 'Pentateuco', curto: 'Pentateuco', livros: ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'] },
    { id: 'historicos', nome: 'Livros históricos', curto: 'Históricos', livros: ['JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST'] },
    { id: 'poeticos', nome: 'Poéticos e sabedoria', curto: 'Poéticos', livros: ['JOB', 'PSA', 'PRO', 'ECC', 'SNG'] },
    { id: 'profetas-maiores', nome: 'Profetas maiores', curto: 'Prof. maiores', livros: ['ISA', 'JER', 'LAM', 'EZK', 'DAN'] },
    { id: 'profetas-menores', nome: 'Profetas menores', curto: 'Prof. menores', livros: ['HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'] },
    { id: 'evangelhos', nome: 'Evangelhos', curto: 'Evangelhos', livros: ['MAT', 'MRK', 'LUK', 'JHN'] },
    { id: 'atos', nome: 'Atos e a igreja primitiva', curto: 'Atos', livros: ['ACT'] },
    { id: 'paulo', nome: 'Cartas de Paulo', curto: 'Paulo', livros: ['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM'] },
    { id: 'gerais', nome: 'Cartas gerais', curto: 'Cartas gerais', livros: ['HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD'] },
    { id: 'apocalipse', nome: 'Apocalipse', curto: 'Apocalipse', livros: ['REV'] }
  ];
  var TEMAS = [
    { id: 'personagens', nome: 'Personagens bíblicos' }, { id: 'mulheres', nome: 'Mulheres da Bíblia' },
    { id: 'reis-profetas', nome: 'Reis e profetas' }, { id: 'apostolos', nome: 'Discípulos e apóstolos' },
    { id: 'milagres', nome: 'Milagres' }, { id: 'parabolas', nome: 'Parábolas' }, { id: 'genealogias', nome: 'Genealogias' },
    { id: 'lugares', nome: 'Lugares bíblicos' }, { id: 'acontecimentos', nome: 'Acontecimentos históricos' },
    { id: 'doutrinas', nome: 'Doutrinas fundamentais' }, { id: 'ensinos-jesus', nome: 'Ensinamentos de Jesus' },
    { id: 'profecias', nome: 'Profecias' }, { id: 'contexto', nome: 'Contexto histórico e cultural' },
    { id: 'geral', nome: 'Conhecimento bíblico geral' }
  ];
  var DIFICULDADES = ['', 'Fácil', 'Intermediário', 'Difícil', 'Especialista'];
  var FORMATOS = {
    'multipla': 'Múltipla escolha', 'vf': 'Verdadeiro ou falso', 'complete': 'Complete o versículo',
    'quem-sou-eu': 'Quem sou eu?', 'identifique': 'Identifique o personagem', 'qual-livro': 'Em qual livro?',
    'relacione': 'Relacione', 'referencia': 'Qual é a referência?'
  };
  var LIVRO_SECAO = {};
  SECOES.forEach(function (s) { s.livros.forEach(function (l) { LIVRO_SECAO[l] = s.id; }); });
  function secaoDoLivro(livro) { return LIVRO_SECAO[livro] || null; }
  function secao(id) { return SECOES.filter(function (s) { return s.id === id; })[0] || null; }
  function tema(id) { return TEMAS.filter(function (t) { return t.id === id; })[0] || null; }

  // ---------------------------------------------------------------- banco
  var BANCO = [], POR_ID = {};
  function valida(x) {
    return x && x.id && LIVRO_SECAO[x.livro] && secao(x.secao) && tema(x.tema) && FORMATOS[x.formato] && x.dificuldade >= 1 && x.dificuldade <= 4 &&
      Array.isArray(x.opcoes) && x.opcoes.length >= 2 && x.certa >= 0 && x.certa < x.opcoes.length && x.opcoes[x.certa] === x.resposta && x.pergunta && x.ref;
  }
  /** Acrescenta (ou substitui, pelo id) perguntas ao banco. Devolve quantas entraram. */
  function carregar(lista) {
    var n = 0;
    (lista || []).forEach(function (x) {
      if (!valida(x)) return;
      if (POR_ID[x.id]) BANCO[BANCO.indexOf(POR_ID[x.id])] = x; else BANCO.push(x);
      POR_ID[x.id] = x; n++;
    });
    return n;
  }
  var carregando = null;
  /** Navegador: carrega app/quiz/indice.json e as listas de cada seção (uma vez). */
  function pronto(base) {
    if (carregando) return carregando;
    base = base || 'quiz/';
    carregando = fetch(base + 'indice.json').then(function (r) { if (!r.ok) throw new Error('indice'); return r.json(); }).then(function (ind) {
      return Promise.all(ind.arquivos.map(function (a) { return fetch(base + a.arquivo).then(function (r) { if (!r.ok) throw new Error(a.arquivo); return r.json(); }); }))
        .then(function (listas) { listas.forEach(carregar); API.INDICE = ind; return BANCO; });
    });
    carregando.catch(function () { carregando = null; });
    return carregando;
  }

  // ---------------------------------------------------------------- sorteio determinístico
  function semente(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function aleatorio(seed) { var a = semente(seed); return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function embaralhar(arr, rnd) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /** Prepara uma pergunta para exibir: opções embaralhadas (exceto verdadeiro/falso) e índice da certa. */
  function preparar(pergunta, seed) {
    if (pergunta.formato === 'vf') return Object.assign({}, pergunta);
    var rnd = aleatorio(seed + ':' + pergunta.id);
    var ordem = embaralhar(pergunta.opcoes.map(function (_, i) { return i; }), rnd);
    return Object.assign({}, pergunta, { opcoes: ordem.map(function (i) { return pergunta.opcoes[i]; }), certa: ordem.indexOf(pergunta.certa) });
  }

  function filtrar(f) {
    f = f || {};
    var sec = f.secoes && f.secoes.length ? f.secoes : null, tem = f.temas && f.temas.length ? f.temas : null;
    var fmt = f.formatos && f.formatos.length ? f.formatos : null;
    return BANCO.filter(function (x) {
      return (!sec || sec.indexOf(x.secao) >= 0) && (!tem || tem.indexOf(x.tema) >= 0) && (!fmt || fmt.indexOf(x.formato) >= 0) &&
        (!f.dificuldade || x.dificuldade === f.dificuldade) && (!f.dificuldadeMin || x.dificuldade >= f.dificuldadeMin);
    });
  }

  /** Sorteio simples. filtros: { secoes, temas, formatos, dificuldade, n:10, evitar:[ids] } — prefere as não vistas. */
  function rodada(seed, filtros) {
    filtros = filtros || {};
    var n = filtros.n || 10, evitar = {};
    (filtros.evitar || []).forEach(function (id) { evitar[id] = 1; });
    var base = filtrar(filtros), rnd = aleatorio(seed);
    var novas = embaralhar(base.filter(function (x) { return !evitar[x.id]; }), rnd);
    var vistas = embaralhar(base.filter(function (x) { return evitar[x.id]; }), rnd);
    var sel = variado(novas.concat(vistas), n);
    if (!filtros.dificuldade) sel.sort(function (a, b) { return a.dificuldade - b.dificuldade; });
    return sel.map(function (x) { return preparar(x, seed); });
  }

  // evita duas perguntas sobre o mesmo versículo e mais de 3 do mesmo livro na rodada
  function variado(lista, n) {
    var sel = [], refs = {}, livros = {}, resto = [];
    lista.forEach(function (x) {
      if (sel.length >= n) return;
      var r = x.livro + x.capitulo + ':' + x.versiculo;
      if (refs[r] || (livros[x.livro] || 0) >= 3) { resto.push(x); return; }
      refs[r] = 1; livros[x.livro] = (livros[x.livro] || 0) + 1; sel.push(x);
    });
    for (var i = 0; sel.length < n && i < resto.length; i++) sel.push(resto[i]);
    return sel;
  }

  /** Dificuldade preferida para cada nível da Jornada da Sabedoria (1–8): peso de cada dificuldade 1–4. */
  var PESO_DIFICULDADE = {
    1: [0, 6, 3, 1, 0.2], 2: [0, 5, 4, 1.5, 0.3], 3: [0, 3, 5, 2, 0.5], 4: [0, 2, 5, 3, 1],
    5: [0, 1.5, 4, 4, 1.5], 6: [0, 1, 3, 5, 2.5], 7: [0, 0.8, 2, 5, 4], 8: [0, 0.6, 1.5, 4.5, 5]
  };
  /**
   * Sorteio inteligente. perfil = { nivel:1–8, respostas: { id: {a, e, u} }, livrosLidos:[ids], hoje:'AAAA-MM-DD' }.
   * Prioriza perguntas inéditas, depois as que a pessoa errou; favorece seções com mais erros,
   * livros que ela tem lido e a dificuldade adequada ao seu nível.
   */
  function selecionar(seed, perfil, filtros) {
    perfil = perfil || {}; filtros = filtros || {};
    var n = filtros.n || 10, resp = perfil.respostas || {}, rnd = aleatorio(seed);
    var pesoDif = PESO_DIFICULDADE[Math.min(8, Math.max(1, perfil.nivel || 1))];
    var lidos = {}; (perfil.livrosLidos || []).forEach(function (l) { lidos[l] = 1; });
    var erroSecao = taxaDeErroPorSecao(resp);
    var hoje = perfil.hoje ? Date.parse(perfil.hoje) : 0;
    var base = filtrar(filtros).map(function (x) {
      var r = resp[x.id], w;
      if (!r) w = 30;                                  // inédita: prioridade
      else if (!r.a) w = 10;                           // só errou: revisar
      else if (r.e > r.a) w = 3;                       // acertou, mas erra mais do que acerta
      else w = 0.3;                                    // já domina
      if (r && r.u && hoje && hoje - Date.parse(r.u) < 3 * 864e5) w *= 0.25; // vista há pouco
      w *= filtros.dificuldade ? 1 : (pesoDif[x.dificuldade] || 0.1);
      w *= 1 + 1.5 * (erroSecao[x.secao] || 0);
      if (lidos[x.livro]) w *= 1.3;
      return { x: x, k: Math.pow(rnd(), 1 / Math.max(w, 1e-6)) }; // amostragem ponderada sem reposição
    });
    base.sort(function (a, b) { return b.k - a.k; });
    var sel = variado(base.map(function (o) { return o.x; }), n);
    if (!filtros.dificuldade) sel.sort(function (a, b) { return a.dificuldade - b.dificuldade; });
    return sel.map(function (x) { return preparar(x, seed); });
  }
  function taxaDeErroPorSecao(resp) {
    var t = {}, out = {};
    Object.keys(resp || {}).forEach(function (id) {
      var r = resp[id], s = r.s || (POR_ID[id] && POR_ID[id].secao); if (!s) return;
      t[s] = t[s] || { a: 0, e: 0 }; t[s].a += r.a || 0; t[s].e += r.e || 0;
    });
    Object.keys(t).forEach(function (s) { var n = t[s].a + t[s].e; out[s] = n >= 4 ? t[s].e / n : 0; });
    return out;
  }

  /** Desafio do dia: 5 perguntas iguais para todos no mesmo dia, de 5 seções diferentes, da mais fácil à mais difícil. */
  function desafioDoDia(data) {
    var rnd = aleatorio('desafio:' + data), difs = [1, 2, 2, 3, 3];
    var secs = embaralhar(SECOES.map(function (s) { return s.id; }), rnd).slice(0, 5);
    return secs.map(function (s, i) {
      var lista = BANCO.filter(function (x) { return x.secao === s && x.dificuldade === difs[i]; });
      if (!lista.length) lista = BANCO.filter(function (x) { return x.secao === s; });
      return preparar(lista[Math.floor(rnd() * lista.length)], 'desafio:' + data);
    });
  }

  /** Pontuação da partida (estatísticas antigas do quiz): 10 por acerto, +5 difícil/especialista, +2 intermediário, +2 em sequência ≥3. */
  function pontuar(respostas) {
    var pts = 0, seq = 0, melhorSeq = 0, acertos = 0;
    respostas.forEach(function (r) {
      var nv = r.dificuldade || r.nivel;
      if (r.certo) { acertos++; seq++; melhorSeq = Math.max(melhorSeq, seq); pts += 10 + (nv >= 3 ? 5 : nv === 2 ? 2 : 0) + (seq >= 3 ? 2 : 0); }
      else seq = 0;
    });
    return { pontos: pts, acertos: acertos, total: respostas.length, melhorSequencia: melhorSeq };
  }

  function mensagem(acertos, total) {
    var p = total ? acertos / total : 0;
    if (p === 1) return 'Gabaritou! Continue firme na Palavra.';
    if (p >= 0.8) return 'Muito bem! Você conhece bem as Escrituras.';
    if (p >= 0.5) return 'Bom resultado. Leia as passagens das que errou e tente de novo.';
    return 'Cada pergunta é um convite à leitura. Abra as passagens e tente outra rodada.';
  }

  /** Contagem do banco por seção, dificuldade, formato e tema. */
  function resumo(lista) {
    var r = { total: 0, secoes: {}, dificuldades: {}, formatos: {}, temas: {} };
    (lista || BANCO).forEach(function (x) {
      r.total++; r.secoes[x.secao] = (r.secoes[x.secao] || 0) + 1; r.dificuldades[x.dificuldade] = (r.dificuldades[x.dificuldade] || 0) + 1;
      r.formatos[x.formato] = (r.formatos[x.formato] || 0) + 1; r.temas[x.tema] = (r.temas[x.tema] || 0) + 1;
    });
    return r;
  }

  var API = {
    SECOES: SECOES, TEMAS: TEMAS, DIFICULDADES: DIFICULDADES, FORMATOS: FORMATOS, BANCO: BANCO, POR_ID: POR_ID, INDICE: null,
    secaoDoLivro: secaoDoLivro, secao: secao, tema: tema, valida: valida, carregar: carregar, pronto: pronto,
    preparar: preparar, filtrar: filtrar, rodada: rodada, selecionar: selecionar, taxaDeErroPorSecao: taxaDeErroPorSecao,
    desafioDoDia: desafioDoDia, pontuar: pontuar, mensagem: mensagem, resumo: resumo, aleatorio: aleatorio, embaralhar: embaralhar
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Quiz = API;
})(typeof window !== 'undefined' ? window : this);
