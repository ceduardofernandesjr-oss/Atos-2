/*
 * ATOS 2 — Jornada da Sabedoria: níveis, pontos, medalhas e domínio bíblico.
 * Navegador: window.A2Sabedoria · Node: module.exports
 *
 * Mesmas regras da função public.sabedoria_registrar_rodada (Supabase), que é a fonte oficial
 * dos pontos de quem tem conta: o aparelho calcula uma prévia e o servidor confirma.
 * Pontos nunca diminuem e o nível nunca regride.
 */
(function (root) {
  'use strict';

  var AVISO = 'Os títulos da Jornada da Sabedoria são conquistas simbólicas de conhecimento bíblico. Não representam ordenação, autoridade espiritual nem cargo eclesiástico.';

  var NIVEIS = [
    { n: 1, id: 'aprendiz', nome: 'Aprendiz das Escrituras', min: 0, emblema: 'lampada',
      descricao: 'Os primeiros passos na Palavra. Como a lâmpada para os pés (Sl 119:105), cada pergunta ilumina mais um trecho do caminho.' },
    { n: 2, id: 'discipulo', nome: 'Discípulo', min: 100, emblema: 'pergaminho',
      descricao: 'Quem segue aprende. Você já volta às Escrituras com constância, como a igreja que perseverava na doutrina dos apóstolos (At 2:42).' },
    { n: 3, id: 'conhecedor', nome: 'Conhecedor da Palavra', min: 250, emblema: 'livro',
      descricao: 'Personagens, lugares e ensinos começam a se ligar. Como os de Bereia, você examina as Escrituras para ver se as coisas são assim (At 17:11).' },
    { n: 4, id: 'servo', nome: 'Servo Fiel', min: 500, emblema: 'oliveira',
      descricao: 'Fidelidade no pouco que se torna muito (Mt 25:21). Seu conhecimento cresce firme, como a oliveira plantada na casa de Deus (Sl 52:8).' },
    { n: 5, id: 'evangelista', nome: 'Evangelista', min: 850, emblema: 'pomba',
      descricao: 'Conhecer para anunciar. Você reúne o que é preciso para dar razão da esperança com mansidão e respeito (1Pe 3:15).' },
    { n: 6, id: 'mestre', nome: 'Mestre das Escrituras', min: 1300, emblema: 'tabuas',
      descricao: 'Profundidade e precisão: alguém que maneja bem a palavra da verdade (2Tm 2:15), da Lei aos Profetas e às cartas.' },
    { n: 7, id: 'anciao', nome: 'Ancião na Palavra', min: 1900, emblema: 'cajado',
      descricao: 'Maturidade que se firma com o tempo. Que a palavra de Cristo habite em você abundantemente (Cl 3:16).' },
    { n: 8, id: 'guardiao', nome: 'Guardião da Palavra', min: 2700, emblema: 'coroa',
      descricao: 'O ponto mais alto da jornada: guardar a Palavra no coração (Sl 119:11) e permanecer na fé entregue aos santos (Jd 1:3).' }
  ];

  var REGRAS = {
    acerto: 10,          // primeira vez que acerta a pergunta
    sequencia: 15,       // a cada 5 acertos seguidos na mesma rodada
    conclusao: 20,       // rodada concluída (mínimo de 5 respostas)
    avancado: 30,        // desafio avançado: 10 perguntas difíceis/especialista e ao menos 7 acertos
    minRodada: 5, maxRespostas: 15, conclusoesDia: 5, sequenciasDia: 6, rodadasDia: 40,
    avancadoPerguntas: 10, avancadoMinAcertos: 7, avancadoDificuldade: 3
  };

  /** Desafios especiais configuráveis (os oficiais vêm da tabela public.sabedoria_desafios). */
  var ESPECIAIS = [
    { id: 'desafio-do-dia', titulo: 'Desafio do dia', descricao: '5 perguntas iguais para todos hoje.', pontos: 25, perguntas: 5, minAcertos: 3, periodo: 'dia', ativo: true },
    { id: 'profetas', titulo: 'Desafio dos Profetas', descricao: '10 perguntas dos profetas maiores e menores. Acerte 8 para conquistar.', pontos: 50, perguntas: 10, minAcertos: 8, secoes: ['profetas-maiores', 'profetas-menores'], dificuldadeMin: 2, periodo: 'unico', ativo: true },
    { id: 'evangelhos', titulo: 'Desafio dos Evangelhos', descricao: '10 perguntas de Mateus, Marcos, Lucas e João. Acerte 8 para conquistar.', pontos: 50, perguntas: 10, minAcertos: 8, secoes: ['evangelhos'], dificuldadeMin: 2, periodo: 'unico', ativo: true }
  ];

  var MEDALHAS = [
    { id: 'primeiro-passo', nome: 'Primeiro Passo', descricao: 'Concluiu o primeiro quiz.', icone: 'passo', valor: function (e) { return [e.rodadas, 1]; } },
    { id: 'mente-atenta', nome: 'Mente Atenta', descricao: 'Acertou 10 perguntas seguidas.', icone: 'olho', valor: function (e) { return [e.seqMax, 10]; } },
    { id: 'estudioso', nome: 'Estudioso', descricao: 'Concluiu 50 quizzes.', icone: 'livros', valor: function (e) { return [e.rodadas, 50]; } },
    { id: 'conhecedor', nome: 'Conhecedor', descricao: 'Somou 100 respostas corretas.', icone: 'chave', valor: function (e) { return [e.acertos, 100]; } },
    { id: 'perseverante', nome: 'Perseverante', descricao: 'Jogou 7 dias seguidos.', icone: 'chama', valor: function (e) { return [e.maiorDias, 7]; } },
    { id: 'dedicado', nome: 'Dedicado', descricao: 'Jogou 30 dias seguidos.', icone: 'calendario', valor: function (e) { return [e.maiorDias, 30]; } },
    { id: 'guardiao', nome: 'Guardião', descricao: 'Alcançou o nível máximo da jornada.', icone: 'coroa', valor: function (e) { return [e.nivel, 8]; } }
  ];

  var GRAUS = [[90, 'Domínio pleno'], [70, 'Avançado'], [40, 'Intermediário'], [15, 'Em formação'], [0, 'Iniciante']];

  function nivelDe(pontos) { var r = NIVEIS[0]; NIVEIS.forEach(function (n) { if (pontos >= n.min) r = n; }); return r; }
  function nivel(n) { return NIVEIS[Math.min(8, Math.max(1, n || 1)) - 1]; }

  /** Progresso para a barra: nunca abaixo do nível já conquistado. */
  function progresso(pontos, nivelGuardado) {
    pontos = pontos || 0;
    var atual = nivelDe(pontos);
    if (nivelGuardado && nivelGuardado > atual.n) atual = nivel(nivelGuardado);
    var prox = NIVEIS[atual.n] || null;
    var pct = prox ? Math.max(0, Math.min(100, 100 * (pontos - atual.min) / (prox.min - atual.min))) : 100;
    return { pontos: pontos, nivel: atual, proximo: prox, faltam: prox ? Math.max(0, prox.min - pontos) : 0, pct: Math.round(pct * 10) / 10 };
  }

  function estadoInicial() {
    return { versao: 1, pontos: 0, nivel: 1, iniciadoEm: null, rodadas: 0, respondidas: 0, acertos: 0, seqAtual: 0, seqMax: 0,
      diasSeguidos: 0, maiorDias: 0, ultimoDia: null, medalhas: {}, especiais: {}, diario: {}, respostas: {}, historico: [], rodadasIds: [] };
  }
  function normalizar(e) { return Object.assign(estadoInicial(), e || {}); }

  function diaNum(d) { var p = String(d).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5; }
  function diffDias(a, b) { return diaNum(a) - diaNum(b); }

  function clonar(e) { return JSON.parse(JSON.stringify(e)); }

  /**
   * Registra uma rodada concluída.
   * rodada = { id, modo: 'livre'|'avancado'|'especial', especial: id, dia: 'AAAA-MM-DD', respostas: [{ p: idPergunta, r: textoEscolhido }] }
   * opts = { porId: { id: pergunta }, hoje: 'AAAA-MM-DD', agora: ISO, especiais: [configs] }
   * Devolve { estado, ganhos, eventos, detalhe, acertos, total } ou lança Error com o motivo.
   */
  function registrar(estadoAntes, rodada, opts) {
    opts = opts || {};
    var e = clonar(normalizar(estadoAntes)), porId = opts.porId || {}, hoje = opts.hoje, agora = opts.agora || new Date().toISOString();
    var resp = rodada && rodada.respostas;
    if (!rodada || !rodada.id) throw new Error('Rodada sem identificação.');
    if (e.rodadasIds.indexOf(rodada.id) >= 0) throw new Error('Esta rodada já foi registrada.');
    if (!resp || !resp.length) throw new Error('Rodada sem respostas.');
    if (resp.length > REGRAS.maxRespostas) throw new Error('Respostas demais numa só rodada.');
    var vistos = {};
    resp.forEach(function (r) {
      if (!porId[r.p]) throw new Error('Pergunta desconhecida: ' + r.p);
      if (vistos[r.p]) throw new Error('Pergunta repetida na rodada.');
      vistos[r.p] = 1;
    });
    var dia = rodada.dia || hoje, d = diffDias(hoje, dia);
    if (d < -1) throw new Error('Data da rodada inválida.');
    var antigo = d > 1;
    var diario = e.diario[dia] = e.diario[dia] || { rodadas: 0, conclusoes: 0, sequencias: 0, avancado: false, especiais: {} };
    if (!antigo && diario.rodadas >= REGRAS.rodadasDia) throw new Error('Limite de rodadas do dia atingido. Volte amanhã!');
    diario.rodadas++;

    var nivelAntes = e.nivel, ganhos = [], detalhe = [], acertos = 0, rseq = 0, pontosAcerto = 0, novos = 0, seqBonus = 0;
    resp.forEach(function (r) {
      var q = porId[r.p], certo = r.r === q.resposta, reg = e.respostas[r.p] || { a: 0, e: 0, s: q.secao };
      var pts = 0;
      e.respondidas++;
      if (certo) {
        acertos++; e.acertos++; rseq++; e.seqAtual++; e.seqMax = Math.max(e.seqMax, e.seqAtual);
        if (!reg.a) { pts += REGRAS.acerto; pontosAcerto += REGRAS.acerto; novos++; }
        reg.a++;
        if (rseq % 5 === 0 && !antigo && diario.sequencias < REGRAS.sequenciasDia) { diario.sequencias++; seqBonus++; pts += REGRAS.sequencia; }
      } else { rseq = 0; e.seqAtual = 0; reg.e++; }
      reg.u = dia; reg.s = q.secao;
      e.respostas[r.p] = reg;
      detalhe.push({ p: r.p, certo: certo, pontos: pts });
    });
    if (pontosAcerto) ganhos.push({ tipo: 'acerto', pontos: pontosAcerto, rotulo: novos + (novos === 1 ? ' acerto inédito' : ' acertos inéditos') });
    if (seqBonus) ganhos.push({ tipo: 'sequencia', pontos: seqBonus * REGRAS.sequencia, rotulo: seqBonus === 1 ? '5 acertos seguidos' : seqBonus + ' sequências de 5 acertos' });

    var concluida = resp.length >= REGRAS.minRodada;
    if (concluida) {
      e.rodadas++;
      if (!antigo && diario.conclusoes < REGRAS.conclusoesDia) { diario.conclusoes++; ganhos.push({ tipo: 'conclusao', pontos: REGRAS.conclusao, rotulo: 'Quiz concluído' }); }
    }
    if (rodada.modo === 'avancado' && !antigo && !diario.avancado && resp.length === REGRAS.avancadoPerguntas && acertos >= REGRAS.avancadoMinAcertos &&
      resp.every(function (r) { return porId[r.p].dificuldade >= REGRAS.avancadoDificuldade; })) {
      diario.avancado = true; ganhos.push({ tipo: 'avancado', pontos: REGRAS.avancado, rotulo: 'Desafio avançado' });
    }
    if (rodada.modo === 'especial' && !antigo) {
      var cfg = (opts.especiais || ESPECIAIS).filter(function (x) { return x.id === rodada.especial && x.ativo !== false; })[0];
      var jaFez = cfg && (cfg.periodo === 'unico' ? e.especiais[cfg.id] : diario.especiais[cfg.id]);
      if (cfg && !jaFez && resp.length === cfg.perguntas && acertos >= (cfg.minAcertos || 0) &&
        resp.every(function (r) { var q = porId[r.p]; return (!cfg.secoes || cfg.secoes.indexOf(q.secao) >= 0) && (!cfg.dificuldadeMin || q.dificuldade >= cfg.dificuldadeMin); })) {
        diario.especiais[cfg.id] = true; if (cfg.periodo === 'unico') e.especiais[cfg.id] = dia;
        ganhos.push({ tipo: 'especial', pontos: cfg.pontos, rotulo: cfg.titulo });
      }
    }
    // dias seguidos (só rodadas concluídas, de hoje ou ontem)
    if (concluida && !antigo) {
      if (!e.ultimoDia) e.diasSeguidos = 1;
      else {
        var gap = diffDias(dia, e.ultimoDia);
        if (gap === 1) e.diasSeguidos++;
        else if (gap > 1) e.diasSeguidos = 1;
      }
      if (!e.ultimoDia || diffDias(dia, e.ultimoDia) > 0) e.ultimoDia = dia;
      e.maiorDias = Math.max(e.maiorDias, e.diasSeguidos);
    }
    var ganho = ganhos.reduce(function (s, g) { return s + g.pontos; }, 0);
    e.pontos += ganho;
    if (!e.iniciadoEm) e.iniciadoEm = agora;
    e.nivel = Math.max(e.nivel, nivelDe(e.pontos).n);

    var eventos = [];
    e.historico.unshift({ em: agora, tipo: 'rodada', modo: rodada.modo || 'livre', pontos: ganho, acertos: acertos, total: resp.length });
    if (e.nivel > nivelAntes) { eventos.push({ tipo: 'nivel', de: nivelAntes, para: e.nivel }); e.historico.unshift({ em: agora, tipo: 'nivel', nivel: e.nivel }); }
    MEDALHAS.forEach(function (m) {
      if (e.medalhas[m.id]) return;
      var v = m.valor(e);
      if (v[0] >= v[1]) { e.medalhas[m.id] = agora; eventos.push({ tipo: 'medalha', id: m.id }); e.historico.unshift({ em: agora, tipo: 'medalha', id: m.id }); }
    });
    e.historico = e.historico.slice(0, 100);
    e.rodadasIds = e.rodadasIds.concat([rodada.id]).slice(-300);
    Object.keys(e.diario).forEach(function (k) { if (diffDias(hoje, k) > 2) delete e.diario[k]; });
    return { estado: e, ganhos: ganhos, pontos: ganho, eventos: eventos, detalhe: detalhe, acertos: acertos, total: resp.length };
  }

  /** Domínio por seção: proporção das perguntas da seção já acertadas ao menos uma vez. */
  function dominio(estado, totais, secoes) {
    var e = normalizar(estado), por = {};
    Object.keys(e.respostas).forEach(function (id) {
      var r = e.respostas[id]; if (!r.s) return;
      var p = por[r.s] = por[r.s] || { acertadas: 0, respondidas: 0, a: 0, e: 0 };
      p.respondidas++; if (r.a) p.acertadas++; p.a += r.a || 0; p.e += r.e || 0;
    });
    return (secoes || []).map(function (s) {
      var p = por[s.id] || { acertadas: 0, respondidas: 0, a: 0, e: 0 }, total = (totais && totais[s.id]) || 0;
      var pct = total ? Math.min(100, Math.round(100 * p.acertadas / total)) : 0;
      var grau = GRAUS.filter(function (g) { return pct >= g[0]; })[0][1];
      return { secao: s.id, nome: s.nome, total: total, acertadas: p.acertadas, respondidas: p.respondidas, pct: pct,
        taxa: p.a + p.e ? Math.round(100 * p.a / (p.a + p.e)) : null, grau: grau };
    });
  }

  function medalhas(estado) {
    var e = normalizar(estado);
    return MEDALHAS.map(function (m) { var v = m.valor(e); return { id: m.id, nome: m.nome, descricao: m.descricao, icone: m.icone, em: e.medalhas[m.id] || null, atual: Math.min(v[0], v[1]), meta: v[1] }; });
  }

  /** Converte a linha da tabela public.sabedoria (+ respostas) no formato do aparelho. */
  function doServidor(linha, respostas, eventos) {
    var e = estadoInicial();
    if (linha) Object.assign(e, {
      pontos: linha.pontos, nivel: linha.nivel, iniciadoEm: linha.iniciado_em, rodadas: linha.rodadas, respondidas: linha.respondidas,
      acertos: linha.acertos, seqAtual: linha.seq_atual, seqMax: linha.seq_max, diasSeguidos: linha.dias_seguidos, maiorDias: linha.maior_dias,
      ultimoDia: linha.ultimo_dia, medalhas: linha.medalhas || {}, especiais: linha.especiais || {}, diario: linha.diario || {}
    });
    (respostas || []).forEach(function (r) { e.respostas[r.pergunta_id] = { a: r.acertos, e: r.erros, u: r.ultima_em, s: r.secao }; });
    e.historico = (eventos || []).map(function (x) { return Object.assign({ em: x.criado_em, tipo: x.tipo }, x.dados || {}); });
    e.servidor = true;
    return e;
  }

  var API = { AVISO: AVISO, NIVEIS: NIVEIS, REGRAS: REGRAS, ESPECIAIS: ESPECIAIS, MEDALHAS: MEDALHAS, GRAUS: GRAUS,
    nivelDe: nivelDe, nivel: nivel, progresso: progresso, estadoInicial: estadoInicial, normalizar: normalizar,
    registrar: registrar, dominio: dominio, medalhas: medalhas, doServidor: doServidor, diffDias: diffDias };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Sabedoria = API;
})(typeof window !== 'undefined' ? window : this);
