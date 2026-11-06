/*
 * ATOS 2 — Minha jornada: estatísticas calculadas só a partir de dados reais do usuário.
 * Navegador: window.A2Jornada · Node: module.exports
 *
 * Critérios de conclusão (nada é contado só por abrir):
 *  - Capítulo lido: o usuário marca "Marcar como lido", avança com "Próximo" num plano ou conclui o dia do plano.
 *    Fonte: leitura.capitulos.lidos (capítulo → data) + eventos "capitulo" do histórico (uma conclusão por capítulo por dia).
 *    Se o capítulo for desmarcado, as conclusões dele deixam de contar.
 *  - Dia de plano: dia marcado como feito no plano (planos[].feitos).
 *  - Devocional: concluído com "Concluir devocional" (devLidos; registros antigos, de quando abrir já marcava, são mantidos).
 *  - Estudo: estudo com o assistente, guia, doutrina, Modo Bereano ou estudo salvo na Biblioteca (um por título por dia).
 *  - Quiz: rodada ou desafio terminado (o histórico só registra no fim).
 *  - Dia de leitura: dia com pelo menos um capítulo concluído ou um dia de plano feito.
 */
(function (root) {
  'use strict';

  var TIPOS = {
    capitulo: { nome: 'Leitura bíblica', plural: 'Leituras bíblicas' },
    plano: { nome: 'Plano de leitura', plural: 'Dias de plano' },
    estudo: { nome: 'Estudo', plural: 'Estudos' },
    devocional: { nome: 'Devocional', plural: 'Devocionais' },
    quiz: { nome: 'Quiz', plural: 'Quizzes' }
  };
  var DATA = /^\d{4}-\d{2}-\d{2}$/;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function addDias(iso, n) { var d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function diasEntre(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5); }
  // Data local (o dia do usuário, não o UTC) de um carimbo ISO; datas puras passam direto
  function diaDe(em) {
    var s = String(em || '');
    if (DATA.test(s)) return s;
    var t = Date.parse(s);
    if (!isFinite(t)) return null;
    var d = new Date(t);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // dados: { historico: [{itens}], lidos: {LIVRO.cap: 'AAAA-MM-DD'}, planos: [{id, nome, feitos: {i: data}}],
  //          devLidos: [{id, em, titulo}], rotulo: function(chave) -> 'Rm 8' }
  function eventos(dados) {
    dados = dados || {};
    var out = [], vistos = {}, lidos = dados.lidos || {}, comEvento = {}, titulosDevo = {};
    function add(e) {
      var k = e.tipo + '|' + e.chave + '|' + e.dia;
      if (!e.dia || vistos[k]) return;
      vistos[k] = 1; out.push(e);
    }
    var itens = [];
    (dados.historico || []).forEach(function (m) { (m && m.itens || []).forEach(function (x) { if (x) itens.push(x); }); });
    itens.forEach(function (x) {
      var dia = diaDe(x.em);
      if (!dia) return;
      if (x.tipo === 'capitulo') {
        var k = x.chave || (x.livro && x.cap ? x.livro + '.' + x.cap : null);
        if (!k || !lidos[k]) return;                       // desmarcado: não conta
        comEvento[k] = 1;
        add({ tipo: 'capitulo', dia: dia, em: x.em, chave: k, titulo: x.ref || (dados.rotulo ? dados.rotulo(k) : k) });
      } else if (x.tipo === 'estudo') {
        var t = String(x.titulo || 'Estudo').trim();
        add({ tipo: 'estudo', dia: dia, em: x.em, chave: t.toLowerCase(), titulo: t });
      } else if (x.tipo === 'quiz') {
        add({ tipo: 'quiz', dia: dia, em: x.em, chave: x.em, titulo: x.titulo || 'Quiz' });
      } else if (x.tipo === 'devocional' && x.id) titulosDevo[x.id] = x.titulo;
    });
    // capítulos marcados antes dos eventos existirem: a data da marcação vale como conclusão
    Object.keys(lidos).forEach(function (k) {
      if (comEvento[k]) return;
      var dia = diaDe(lidos[k]);
      if (dia) add({ tipo: 'capitulo', dia: dia, em: dia + 'T12:00:00', chave: k, titulo: dados.rotulo ? dados.rotulo(k) : k, anterior: true });
    });
    (dados.planos || []).forEach(function (p) {
      Object.keys(p.feitos || {}).forEach(function (i) {
        var dia = diaDe(p.feitos[i]);
        if (dia) add({ tipo: 'plano', dia: dia, em: dia + 'T12:00:00', chave: p.id + ':' + i, titulo: (p.nome || 'Plano') + ' — dia ' + (+i + 1) });
      });
    });
    (dados.devLidos || []).forEach(function (d) {
      var dia = diaDe(d.em);
      if (dia) add({ tipo: 'devocional', dia: dia, em: d.em, chave: d.id, titulo: d.titulo || titulosDevo[d.id] || 'Devocional' });
    });
    out.sort(function (a, b) { return a.em < b.em ? 1 : a.em > b.em ? -1 : 0; });
    return out;
  }

  function periodo(id, hoje, ev) {
    var n = { '7': 7, '30': 30, '90': 90 }[id];
    if (n) return { id: id, inicio: addDias(hoje, -(n - 1)), fim: hoje, dias: n };
    var primeiro = hoje;
    (ev || []).forEach(function (e) { if (e.dia < primeiro) primeiro = e.dia; });
    return { id: 'tudo', inicio: primeiro, fim: hoje, dias: diasEntre(primeiro, hoje) + 1 };
  }
  function dentro(e, p) { return e.dia >= p.inicio && e.dia <= p.fim; }
  function ehLeitura(e) { return e.tipo === 'capitulo' || e.tipo === 'plano'; }

  function resumo(ev, p) {
    var r = { capitulos: 0, diasPlano: 0, estudos: 0, devocionais: 0, quizzes: 0, diasLeitura: 0, diasAtivos: 0 }, dl = {}, da = {};
    ev.forEach(function (e) {
      if (p && !dentro(e, p)) return;
      if (e.tipo === 'capitulo') r.capitulos++;
      else if (e.tipo === 'plano') r.diasPlano++;
      else if (e.tipo === 'estudo') r.estudos++;
      else if (e.tipo === 'devocional') r.devocionais++;
      else if (e.tipo === 'quiz') r.quizzes++;
      if (ehLeitura(e)) dl[e.dia] = 1;
      da[e.dia] = 1;
    });
    r.diasLeitura = Object.keys(dl).length; r.diasAtivos = Object.keys(da).length;
    return r;
  }

  // Série para o gráfico: por dia (até 31 dias), por semana (até 120) ou por mês
  function serie(ev, p, tipos) {
    var filtro = tipos ? function (e) { return tipos.indexOf(e.tipo) >= 0; } : function () { return true; };
    var baldes = [], dias = diasEntre(p.inicio, p.fim) + 1, gran;
    if (dias <= 31) { gran = 'dia'; for (var i = 0; i < dias; i++) { var d = addDias(p.inicio, i); baldes.push({ inicio: d, fim: d }); } }
    else if (dias <= 120) {
      gran = 'semana';
      for (var f = p.fim; f >= p.inicio; f = addDias(f, -7)) baldes.unshift({ inicio: addDias(f, -6) < p.inicio ? p.inicio : addDias(f, -6), fim: f });
    } else {
      gran = 'mes';
      var a = +p.inicio.slice(0, 4), m = +p.inicio.slice(5, 7), fimMes = p.fim.slice(0, 7);
      while (true) {
        var ini = a + '-' + pad(m) + '-01', prox = (m === 12 ? (a + 1) + '-01' : a + '-' + pad(m + 1)) + '-01';
        baldes.push({ inicio: ini < p.inicio ? p.inicio : ini, fim: addDias(prox, -1) > p.fim ? p.fim : addDias(prox, -1) });
        if ((a + '-' + pad(m)) >= fimMes) break;
        m++; if (m > 12) { m = 1; a++; }
      }
      if (baldes.length > 24) baldes = baldes.slice(-24);
    }
    baldes.forEach(function (b) { b.valor = 0; b.porTipo = {}; });
    ev.forEach(function (e) {
      if (!filtro(e) || !dentro(e, p)) return;
      for (var i = 0; i < baldes.length; i++) if (e.dia >= baldes[i].inicio && e.dia <= baldes[i].fim) { baldes[i].valor++; baldes[i].porTipo[e.tipo] = (baldes[i].porTipo[e.tipo] || 0) + 1; break; }
    });
    return { granularidade: gran, baldes: baldes, maximo: baldes.reduce(function (m, b) { return Math.max(m, b.valor); }, 0) };
  }

  // Dias seguidos com leitura (hoje ainda sem leitura não quebra a sequência)
  function sequencia(ev, hoje) {
    var dias = {};
    ev.forEach(function (e) { if (ehLeitura(e)) dias[e.dia] = 1; });
    var n = 0, d = dias[hoje] ? hoje : addDias(hoje, -1);
    while (dias[d]) { n++; d = addDias(d, -1); }
    return n;
  }
  function melhorSequencia(ev) {
    var dias = {}; ev.forEach(function (e) { if (ehLeitura(e)) dias[e.dia] = 1; });
    var ks = Object.keys(dias).sort(), melhor = 0, atual = 0;
    ks.forEach(function (d, i) { atual = i && diasEntre(ks[i - 1], d) === 1 ? atual + 1 : 1; if (atual > melhor) melhor = atual; });
    return melhor;
  }

  // Leitura: livro atual, capítulos concluídos nele, próxima leitura (primeiro capítulo não lido depois do último)
  // livros: [{id, nome, caps}] em ordem canônica
  function progressoLeitura(lidos, ultima, livros) {
    lidos = lidos || {};
    var total = livros.reduce(function (s, l) { return s + l.caps; }, 0), lidosN = Object.keys(lidos).filter(function (k) {
      var p = k.split('.'), l = livros.filter(function (x) { return x.id === p[0]; })[0]; return l && +p[1] >= 1 && +p[1] <= l.caps;
    }).length;
    var out = { biblia: { lidos: lidosN, total: total, pct: total ? lidosN / total * 100 : 0 }, livro: null, proxima: null };
    var iL = ultima ? livros.map(function (l) { return l.id; }).indexOf(ultima.livro) : -1;
    if (iL < 0) iL = livros.map(function (l) { return l.id; }).indexOf('JHN');
    if (iL < 0) return out;
    var L = livros[iL], feitos = 0;
    for (var c = 1; c <= L.caps; c++) if (lidos[L.id + '.' + c]) feitos++;
    out.livro = { id: L.id, nome: L.nome, cap: ultima && ultima.livro === L.id ? ultima.cap : null, concluidos: feitos, total: L.caps, pct: feitos / L.caps * 100 };
    var inicioCap = ultima && ultima.livro === L.id ? ultima.cap : 1;
    for (var n = 0; n < livros.length && !out.proxima; n++) {
      var LL = livros[(iL + n) % livros.length];
      for (var cc = n === 0 ? inicioCap : 1; cc <= LL.caps; cc++) if (!lidos[LL.id + '.' + cc]) { out.proxima = { livro: LL.id, nome: LL.nome, cap: cc }; break; }
    }
    return out;
  }

  // Linha do tempo agrupada por dia
  function linhaDoTempo(ev, p, tipo, limite) {
    var grupos = [], porDia = {}, n = 0;
    ev.forEach(function (e) {
      if (p && !dentro(e, p)) return;
      if (tipo && tipo !== 'todas' && e.tipo !== tipo) return;
      if (limite && n >= limite) return;
      n++;
      if (!porDia[e.dia]) { porDia[e.dia] = { dia: e.dia, itens: [] }; grupos.push(porDia[e.dia]); }
      porDia[e.dia].itens.push(e);
    });
    return { grupos: grupos, total: ev.filter(function (e) { return (!p || dentro(e, p)) && (!tipo || tipo === 'todas' || e.tipo === tipo); }).length };
  }

  var API = { TIPOS: TIPOS, addDias: addDias, diasEntre: diasEntre, diaDe: diaDe, eventos: eventos, periodo: periodo, resumo: resumo, serie: serie,
    sequencia: sequencia, melhorSequencia: melhorSequencia, progressoLeitura: progressoLeitura, linhaDoTempo: linhaDoTempo };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Jornada = API;
})(typeof window !== 'undefined' ? window : this);
