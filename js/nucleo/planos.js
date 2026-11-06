/*
 * ATOS 2 — Planos de leitura (funções puras).
 * Navegador: window.A2Planos · Node: module.exports
 *
 * Cronogramas são gerados a partir da contagem real de versículos: os capítulos são divididos
 * em dias contíguos com quantidade de texto equilibrada (por número de versículos).
 * Estado do usuário: { planoId, inicio:'aaaa-mm-dd', status:'ativo'|'pausado'|'concluido',
 *   pausas:[{de, ate|null}], feitos:{ '<índice do dia>': 'aaaa-mm-dd' }, lembrete:'hh:mm'|null }
 */
(function (root) {
  'use strict';

  var AT = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL'.split(' ');
  var NT = 'MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split(' ');

  var FUNDAMENTOS = [
    ['GEN', 1, 'A criação'], ['GEN', 3, 'A queda'], ['EXO', 20, 'Os dez mandamentos'], ['DEU', 6, 'Amar a Deus de todo o coração'],
    ['PSA', 51, 'Confissão e arrependimento'], ['ISA', 53, 'O servo sofredor'], ['JHN', 1, 'O Verbo se fez carne'],
    ['JHN', 3, 'O novo nascimento'], ['MAT', 5, 'O Sermão do Monte (1)'], ['MAT', 6, 'O Sermão do Monte (2)'],
    ['JHN', 14, 'O caminho, a verdade e a vida'], ['JHN', 16, 'A promessa do Espírito'], ['MAT', 28, 'A ressurreição e a grande comissão'],
    ['ACT', 2, 'Pentecostes e a igreja em Jerusalém'], ['ACT', 8, 'O evangelho em Samaria e o eunuco'], ['ACT', 10, 'O evangelho aos gentios'],
    ['ROM', 3, 'Todos pecaram; justificação pela fé'], ['ROM', 5, 'Paz com Deus'], ['ROM', 6, 'Mortos para o pecado'], ['ROM', 8, 'A vida no Espírito'],
    ['ROM', 12, 'Sacrifício vivo'], ['1CO', 13, 'O amor'], ['1CO', 15, 'A ressurreição dos mortos'], ['GAL', 5, 'Liberdade e fruto do Espírito'],
    ['EPH', 2, 'Salvos pela graça'], ['EPH', 4, 'Unidade do corpo'], ['HEB', 11, 'A fé'], ['JAS', 2, 'Fé e obras'],
    ['1TH', 4, 'Santificação e a vinda do Senhor'], ['REV', 21, 'Novo céu e nova terra']
  ];

  var DEFINICOES = [
    { id: 'biblia-365', nome: 'Bíblia completa em 365 dias', dias: 365, cor: ['#14284B', '#2C4A7C'], simbolo: 'livro',
      descricao: 'Toda a Bíblia, de Gênesis a Apocalipse, em ordem, com leituras diárias de tamanho equilibrado.',
      objetivo: 'Ler as Escrituras por inteiro em um ano.', livros: AT.concat(NT) },
    { id: 'nt-90', nome: 'Novo Testamento em 90 dias', dias: 90, cor: ['#1E3A5F', '#4C6A92'], simbolo: 'cruz',
      descricao: 'Os 27 livros do Novo Testamento, de Mateus a Apocalipse.', objetivo: 'Conhecer a vida de Jesus e o ensino dos apóstolos.', livros: NT },
    { id: 'evangelhos-30', nome: 'Evangelhos em 30 dias', dias: 30, cor: ['#3B2F1E', '#8A6A3B'], simbolo: 'pao',
      descricao: 'Mateus, Marcos, Lucas e João.', objetivo: 'Acompanhar a vida, o ensino, a morte e a ressurreição de Jesus.', livros: ['MAT', 'MRK', 'LUK', 'JHN'] },
    { id: 'salmos-30', nome: 'Salmos em 30 dias', dias: 30, cor: ['#24413A', '#5D8A7A'], simbolo: 'harpa',
      descricao: 'Os 150 salmos, divididos pelo tamanho de cada um (o Salmo 119 ocupa um dia inteiro).', objetivo: 'Aprender a orar e louvar com os Salmos.', livros: ['PSA'] },
    { id: 'proverbios-31', nome: 'Provérbios em 31 dias', dias: 31, cor: ['#5A3E12', '#B08D57'], simbolo: 'lampada',
      descricao: 'Um capítulo de Provérbios por dia.', objetivo: 'Buscar sabedoria para as decisões do dia a dia.', livros: ['PRO'], umPorDia: true },
    { id: 'conhecendo-jesus', nome: 'Conhecendo Jesus', dias: 21, cor: ['#2B2340', '#6B5A94'], simbolo: 'luz',
      descricao: 'O Evangelho de João, um capítulo por dia, com seus sinais e as declarações “Eu sou”.', objetivo: 'Conhecer quem Jesus é, para crer nele.', livros: ['JHN'], umPorDia: true },
    { id: 'fundamentos', nome: 'Fundamentos da fé cristã', dias: 30, cor: ['#14284B', '#B08D57'], simbolo: 'pedra',
      descricao: 'Trinta capítulos sobre criação, queda, lei, Cristo, salvação, Espírito Santo, igreja e esperança.', objetivo: 'Firmar a base da fé nas próprias Escrituras.', lista: FUNDAMENTOS },
    { id: 'atos-28', nome: 'Atos dos Apóstolos em 28 dias', dias: 28, cor: ['#7A2E1F', '#C2703D'], simbolo: 'chama',
      descricao: 'Um capítulo de Atos por dia: o Pentecostes, a igreja primitiva e as viagens missionárias.', objetivo: 'Perseverar na doutrina dos apóstolos (At 2:42).', livros: ['ACT'], umPorDia: true }
  ];

  // Divide unidades (com peso) em n grupos contíguos de peso equilibrado; cada grupo tem ao menos 1 unidade.
  function dividir(unidades, n) {
    if (unidades.length < n) throw new Error('Menos capítulos que dias');
    var restante = unidades.reduce(function (s, u) { return s + u.peso; }, 0), grupos = [], i = 0;
    for (var d = 0; d < n; d++) {
      var diasRest = n - d, alvo = restante / diasRest, g = [], soma = 0;
      var maximo = (unidades.length - i) - (diasRest - 1);      // deixa ao menos 1 capítulo para cada dia seguinte
      while (g.length < maximo) {
        var u = unidades[i];
        if (g.length && soma + u.peso / 2 > alvo) break;
        g.push(u); soma += u.peso; i++;
      }
      restante -= soma; grupos.push(g);
    }
    return grupos;
  }

  // contagem(id) -> [versículos por capítulo]
  function cronograma(def, contagem) {
    if (def.lista) return def.lista.map(function (x) { return [{ livro: x[0], cap: x[1], tema: x[2] }]; });
    var u = [];
    def.livros.forEach(function (b) { contagem(b).forEach(function (nv, i) { u.push({ livro: b, cap: i + 1, peso: nv }); }); });
    if (def.umPorDia) return u.map(function (x) { return [{ livro: x.livro, cap: x.cap }]; });
    return dividir(u, def.dias).map(function (g) { return g.map(function (x) { return { livro: x.livro, cap: x.cap }; }); });
  }

  // ---------- datas ----------
  function parse(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; }
  function dias(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function addDias(s, n) { return new Date(parse(s) + n * 86400000).toISOString().slice(0, 10); }

  function iniciar(def, hoje) { return { planoId: def.id, inicio: hoje, status: 'ativo', pausas: [], feitos: {}, lembrete: null }; }
  function pausar(est, hoje) {
    if (est.status !== 'ativo') return est;
    return Object.assign({}, est, { status: 'pausado', pausas: (est.pausas || []).concat([{ de: hoje, ate: null }]) });
  }
  function retomar(est, hoje) {
    if (est.status !== 'pausado') return est;
    var p = (est.pausas || []).map(function (x) { return Object.assign({}, x); });
    if (p.length && !p[p.length - 1].ate) p[p.length - 1].ate = hoje;
    return Object.assign({}, est, { status: 'ativo', pausas: p });
  }
  function marcar(est, i, feito, hoje, total) {
    var f = Object.assign({}, est.feitos || {});
    if (feito) f[i] = hoje; else delete f[i];
    var n = Object.keys(f).length;
    var status = n >= total ? 'concluido' : (est.status === 'concluido' ? 'ativo' : est.status);
    return Object.assign({}, est, { feitos: f, status: status, concluidoEm: n >= total ? (est.concluidoEm || hoje) : null });
  }
  // Dias pausados (contando o dia em que pausou; o dia da retomada já conta como ativo)
  function diasPausados(est, hoje) {
    return (est.pausas || []).reduce(function (s, p) { return s + Math.max(0, dias(p.de, p.ate || addDias(hoje, 1))); }, 0);
  }

  function resumo(est, total, hoje) {
    var set = {}, n = 0, lidoHoje = false;
    Object.keys(est.feitos || {}).forEach(function (k) {
      var i = +k;
      if (i >= 0 && i < total && !set[i]) { set[i] = 1; n++; }
      if (est.feitos[k] === hoje) lidoHoje = true;
    });
    var proximo = -1;
    for (var i = 0; i < total; i++) if (!set[i]) { proximo = i; break; }
    // Dias do calendário já decorridos (inclui hoje), descontando pausas
    var decorridos = Math.max(0, dias(est.inicio, hoje) + 1 - diasPausados(est, hoje));
    var esperado = Math.min(total, decorridos);
    var atrasados = 0;                                 // dias anteriores a hoje ainda não lidos
    for (var k = 0; k < esperado - 1; k++) if (!set[k]) atrasados++;
    var pend = total - n;
    return {
      total: total, concluidos: n, pendentes: pend,
      percentual: total ? n / total * 100 : 0,
      proximo: proximo,
      diaDoCalendario: Math.max(1, esperado),
      atrasados: atrasados,
      lidoHoje: lidoHoje,
      terminoPrevisto: pend === 0 ? (est.concluidoEm || hoje) : addDias(hoje, pend - 1 + (lidoHoje ? 1 : 0)),
      concluido: pend === 0
    };
  }

  function rotuloLeitura(itens, formatar) {
    // agrupa capítulos consecutivos do mesmo livro: "Gênesis 1-3; Êxodo 1"
    var out = [], i = 0;
    while (i < itens.length) {
      var a = itens[i], j = i;
      while (j + 1 < itens.length && itens[j + 1].livro === a.livro && itens[j + 1].cap === itens[j].cap + 1) j++;
      out.push(formatar({ livro: a.livro, cap: a.cap, cap2: itens[j].cap, v1: null, v2: null }));
      i = j + 1;
    }
    return out.join('; ');
  }

  var API = { DEFINICOES: DEFINICOES, AT: AT, NT: NT, dividir: dividir, cronograma: cronograma, iniciar: iniciar, pausar: pausar,
    retomar: retomar, marcar: marcar, resumo: resumo, diasPausados: diasPausados, rotuloLeitura: rotuloLeitura, addDias: addDias, dias: dias };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Planos = API;
})(typeof window !== 'undefined' ? window : this);
