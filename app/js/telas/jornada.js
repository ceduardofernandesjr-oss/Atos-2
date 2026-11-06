/* ATOS 2 — Minha jornada: resumo (Início e Perfil) e painel completo com períodos, evolução, leitura, planos e histórico.
   Todos os números saem de A2Jornada a partir dos dados reais do usuário (nada é estimado nem demonstrativo). */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;
  var AT_N = 39;   // Gênesis a Malaquias

  // ---------------------------------------------------------------- dados
  function livros() {
    var cont = Biblia.contagemSinc('blivre');
    return A2Ref.LIVROS.map(function (l) { return { id: l.id, nome: l.nome, caps: (cont(l.id) || []).length }; }).filter(function (l) { return l.caps; });
  }
  function rotulo(k) { var p = String(k).split('.'); try { return A2Ref.formatar({ livro: p[0], cap: +p[1] }); } catch (e) { return k; } }
  function defPlano(id) { return A2Planos.DEFINICOES.filter(function (d) { return d.id === id; })[0] || null; }
  function lidos() { return (Dados.obter('leitura', 'capitulos') || {}).lidos || {}; }
  function dados() {
    return {
      historico: Dados.todos('historico'), lidos: lidos(), rotulo: rotulo,
      planos: Dados.todos('planos').map(function (p) { var d = defPlano(p.planoId || p.id); return { id: p.planoId || p.id, nome: d ? d.nome : 'Plano', feitos: p.feitos }; }),
      devLidos: Dados.todos('devLidos')
    };
  }
  function eventos() { return A2Jornada.eventos(dados()); }
  function planos() {
    var hoje = UI.hoje(), cont = Biblia.contagemSinc('blivre');
    return Dados.todos('planos').map(function (est) {
      var def = defPlano(est.planoId); if (!def) return null;
      var cron = A2Planos.cronograma(def, cont);
      return { def: def, est: est, cron: cron, r: A2Planos.resumo(est, def.dias, hoje) };
    }).filter(Boolean).sort(function (a, b) {
      var ordem = function (p) { return p.r.concluido ? 2 : p.est.status === 'ativo' ? 0 : 1; };
      return ordem(a) - ordem(b) || (b.est._t || 0) - (a.est._t || 0);
    });
  }
  function totais(ev) {
    var tudo = A2Jornada.resumo(ev, null);
    return {
      capitulos: Object.keys(lidos()).length, diasLeitura: tudo.diasLeitura, estudos: tudo.estudos,
      planosConcluidos: planos().filter(function (p) { return p.r.concluido; }).length,
      favoritos: Dados.todos('favoritos').length, devocionais: tudo.devocionais, quizzes: tudo.quizzes
    };
  }
  function abrirPlano(p) { location.hash = 'biblioteca'; setTimeout(function () { Telas.planos.abrir(p.def.id); }, 50); }
  function semana(iso) { var n = new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''); return n.charAt(0).toUpperCase() + n.slice(1, 3); }
  function n(v) { return Number(v || 0).toLocaleString('pt-BR'); }

  // ---------------------------------------------------------------- componentes
  function kpi(icone, valor, rotuloTxt, id) { return h('div.kpi' + (id ? '#' + id : ''), h('span.kpi-ico', ico(icone)), h('b', n(valor)), h('small', rotuloTxt)); }
  function grafico(serie, opcoes) {
    opcoes = opcoes || {};
    var max = Math.max(1, serie.maximo), tipos = opcoes.tipos;
    var desc = serie.baldes.map(function (b) { return opcoes.rotulo(b) + ': ' + b.valor; }).join(', ');
    var el = h('div.grafico' + (serie.baldes.length > 12 ? '.denso' : ''), { role: 'img', 'aria-label': (opcoes.titulo || 'Atividade') + '. ' + desc });
    serie.baldes.forEach(function (b, i) {
      var col = h('div.coluna' + (b.fim === UI.hoje() ? '.hoje' : ''), { title: opcoes.rotuloLongo ? opcoes.rotuloLongo(b) + ': ' + b.valor : '' });
      var barra = h('div.barra-col', { style: { height: (b.valor / max * 100) + '%' } });
      if (tipos && b.valor) tipos.forEach(function (t) { var v = b.porTipo[t] || 0; if (v) barra.appendChild(h('i.seg-' + t, { style: { height: (v / b.valor * 100) + '%' } })); });
      else if (b.valor) barra.appendChild(h('i.seg-capitulo', { style: { height: '100%' } }));
      var mostrarRotulo = serie.baldes.length <= 12 || i % Math.ceil(serie.baldes.length / 8) === 0 || i === serie.baldes.length - 1;
      col.appendChild(h('span.valor', b.valor ? String(b.valor) : ''));
      col.appendChild(h('div.trilho', barra));
      col.appendChild(h('small', mostrarRotulo ? opcoes.rotulo(b) : ''));
      el.appendChild(col);
    });
    return el;
  }

  // Resumo usado no Início e no Perfil
  function cartaoResumo() {
    var ev = eventos(), t = totais(ev), hoje = UI.hoje(), seq = A2Jornada.sequencia(ev, hoje);
    var s7 = A2Jornada.serie(ev, A2Jornada.periodo('7', hoje, ev), ['capitulo']);
    var vazio = !ev.length;
    return h('section.jornada2', { 'aria-label': 'Minha jornada' },
      h('div.j-topo', h('div', h('span.j-sobre', 'Atividade'), h('b.j-titulo', 'Seu progresso no Atos 2')),
        seq ? h('span.selo-seq', ico('chama'), seq + (seq > 1 ? ' dias seguidos' : ' dia')) : null),
      h('div.kpis',
        kpi('livro', t.capitulos, 'Capítulos lidos', 'kpi-capitulos'), kpi('sol', t.diasLeitura, 'Dias de leitura', 'kpi-dias'), kpi('nota', t.estudos, 'Estudos realizados', 'kpi-estudos'),
        kpi('planos', t.planosConcluidos, 'Planos concluídos', 'kpi-planos'), kpi('coracao', t.favoritos, 'Versículos favoritos', 'kpi-favoritos'), kpi('luz', t.devocionais, 'Devocionais concluídos', 'kpi-devocionais')),
      h('div.j-graf',
        h('div.j-graf-cab', h('b', 'Atividade de leitura'), h('small', 'Últimos 7 dias · capítulos por dia')),
        grafico(s7, { titulo: 'Capítulos concluídos nos últimos 7 dias', rotulo: function (b) { return semana(b.inicio); }, rotuloLongo: function (b) { return UI.dataCurta(b.inicio); } }),
        vazio ? h('p.j-dica', 'Ao terminar um capítulo, toque em “Marcar como lido”. Só leituras concluídas entram na sua jornada.') : null));
  }

  // ---------------------------------------------------------------- painel completo
  var ROTULOS_PERIODO = [['7', '7 dias'], ['30', '30 dias'], ['90', '90 dias'], ['tudo', 'Todo o período']];
  var TIPOS_FILTRO = [['todas', 'Todas'], ['capitulo', 'Leituras'], ['plano', 'Planos'], ['estudo', 'Estudos'], ['devocional', 'Devocionais'], ['quiz', 'Quizzes']];
  var ICONE_TIPO = { capitulo: 'livro', plano: 'planos', estudo: 'nota', devocional: 'luz', quiz: 'estrela' };
  var CORES_TIPOS = ['capitulo', 'plano', 'estudo', 'devocional', 'quiz'];

  function render(tela) {
    var hoje = UI.hoje(), ev = eventos();
    var per = App.estado.jornadaPeriodo || '7', metrica = App.estado.jornadaMetrica || 'capitulo', filtro = App.estado.jornadaFiltro || 'todas';
    var P = A2Jornada.periodo(per, hoje, ev);
    tela.appendChild(h('header.cab', h('button.bt-ico', { 'aria-label': 'Voltar', on: { click: function () { if (history.length > 1) history.back(); else App.ir('inicio'); } } }, ico('esquerda')),
      h('h1', 'Minha jornada'), h('div.esp')));
    tela.appendChild(h('p.sub.j-intro', 'Seu desenvolvimento no Atos 2, calculado só com o que você concluiu no app.'));
    tela.appendChild(h('div.chips.j-periodos', { role: 'tablist', 'aria-label': 'Período' }, ROTULOS_PERIODO.map(function (p) {
      return h('button.chip', { role: 'tab', 'aria-selected': String(per === p[0]), 'aria-pressed': String(per === p[0]), on: { click: function () { App.estado.jornadaPeriodo = p[0]; App.recarregar(); } } }, p[1]);
    })));
    var r = A2Jornada.resumo(ev, P), seq = A2Jornada.sequencia(ev, hoje), melhor = A2Jornada.melhorSequencia(ev);
    tela.appendChild(h('p.j-periodo-txt', per === 'tudo' ? (ev.length ? 'Desde ' + UI.dataLonga(P.inicio) : 'Nenhuma atividade concluída ainda') : UI.dataCurta(P.inicio) + ' a ' + UI.dataCurta(P.fim)));
    tela.appendChild(h('section.jornada2.painel-j',
      h('div.kpis',
        kpi('livro', r.capitulos, 'Capítulos concluídos', 'p-capitulos'), kpi('sol', r.diasLeitura, 'Dias de leitura', 'p-dias'), kpi('nota', r.estudos, 'Estudos', 'p-estudos'),
        kpi('luz', r.devocionais, 'Devocionais', 'p-devocionais'), kpi('estrela', r.quizzes, 'Quizzes', 'p-quizzes'), kpi('planos', r.diasPlano, 'Dias de plano', 'p-planos')),
      h('div.j-seq', h('div', h('b', n(seq)), h('small', seq === 1 ? 'dia seguido agora' : 'dias seguidos agora')), h('div', h('b', n(melhor)), h('small', 'maior sequência')),
        h('div', h('b', n(r.diasAtivos)), h('small', 'dias com alguma atividade')))));

    // evolução
    var serie = A2Jornada.serie(ev, P, metrica === 'todas' ? null : ['capitulo']);
    var rot = serie.granularidade === 'dia' ? (P.dias <= 7 ? function (b) { return semana(b.inicio); } : function (b) { return b.inicio.slice(8, 10); })
      : serie.granularidade === 'semana' ? function (b) { return b.inicio.slice(8, 10) + '/' + b.inicio.slice(5, 7); }
        : function (b) { return new Date(b.inicio + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''); };
    var rotLongo = serie.granularidade === 'mes' ? function (b) { return new Date(b.inicio + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); }
      : function (b) { return b.inicio === b.fim ? UI.dataCurta(b.inicio) : UI.dataCurta(b.inicio) + ' a ' + UI.dataCurta(b.fim); };
    tela.appendChild(h('div.secao', h('h2', 'Evolução'), h('div.esp')));
    tela.appendChild(h('section.jornada2',
      h('div.chips', [['capitulo', 'Capítulos'], ['todas', 'Todas as atividades']].map(function (m) {
        return h('button.chip', { 'aria-pressed': String(metrica === m[0]), on: { click: function () { App.estado.jornadaMetrica = m[0]; App.recarregar(); } } }, m[1]);
      })),
      h('small.j-gran', serie.granularidade === 'dia' ? 'Por dia' : serie.granularidade === 'semana' ? 'Por semana' : 'Por mês'),
      grafico(serie, { titulo: metrica === 'todas' ? 'Atividades concluídas' : 'Capítulos concluídos', rotulo: rot, rotuloLongo: rotLongo, tipos: metrica === 'todas' ? CORES_TIPOS : null }),
      metrica === 'todas' ? h('div.legenda', CORES_TIPOS.map(function (t) { return h('span', h('i.seg-' + t), A2Jornada.TIPOS[t].plural); })) : null));

    // leitura bíblica
    var LV = livros(), pl = A2Jornada.progressoLeitura(lidos(), Dados.obter('leitura', 'ultima'), LV), L = lidos();
    function parte(lista) { var tot = 0, fe = 0; lista.forEach(function (l) { tot += l.caps; for (var c = 1; c <= l.caps; c++) if (L[l.id + '.' + c]) fe++; }); return { fe: fe, tot: tot }; }
    var at = parte(LV.slice(0, AT_N)), nt = parte(LV.slice(AT_N));
    function barra(rotuloTxt, fe, tot) {
      return h('div.j-barra', h('div.j-barra-txt', h('span', rotuloTxt), h('b', UI.pct(tot ? fe / tot * 100 : 0))),
        h('div.barra', { role: 'progressbar', 'aria-label': rotuloTxt, 'aria-valuenow': fe, 'aria-valuemin': 0, 'aria-valuemax': tot }, h('i', { style: { width: (tot ? fe / tot * 100 : 0) + '%' } })),
        h('small', n(fe) + ' de ' + n(tot) + ' capítulos'));
    }
    tela.appendChild(h('div.secao', h('h2', 'Leitura bíblica'), h('div.esp')));
    tela.appendChild(h('section.jornada2.j-leitura',
      pl.livro ? h('div.j-livro', h('span.cont-ico', ico('livro')), h('div', h('span.j-sobre', Dados.obter('leitura', 'ultima') ? 'Lendo agora' : 'Sugestão para começar'),
        h('b.j-titulo', pl.livro.nome), h('small', pl.livro.cap ? 'Último capítulo acessado: ' + pl.livro.cap : 'Nenhum capítulo acessado ainda'))) : null,
      pl.livro ? barra('Capítulos concluídos em ' + pl.livro.nome, pl.livro.concluidos, pl.livro.total) : null,
      pl.proxima ? h('button.bt.pri#j-proxima', { on: { click: function () { App.abrirBiblia(pl.proxima.livro, pl.proxima.cap); } } }, ico('livro'), 'Próxima leitura: ' + pl.proxima.nome + ' ' + pl.proxima.cap) : null,
      barra('Bíblia inteira', pl.biblia.lidos, pl.biblia.total), barra('Antigo Testamento', at.fe, at.tot), barra('Novo Testamento', nt.fe, nt.tot)));

    // planos
    var ps = planos();
    tela.appendChild(h('div.secao', h('h2', 'Planos de leitura'), h('div.esp'), h('button.link-secao', { on: { click: function () { App.estado.secaoBiblioteca = 'planos'; App.ir('biblioteca'); } } }, 'Todos', ico('direita'))));
    if (!ps.length) tela.appendChild(h('div.vazio', h('b', 'Nenhum plano iniciado.'), h('span', 'Escolha um dos 8 planos e acompanhe o progresso aqui.'),
      h('button.bt.pri', { on: { click: function () { App.estado.secaoBiblioteca = 'planos'; App.ir('biblioteca'); } } }, 'Ver planos')));
    ps.forEach(function (p) {
      var rr = p.r, prox = rr.proximo >= 0 ? A2Planos.rotuloLeitura(p.cron[rr.proximo], A2Ref.formatar) : null;
      var status = rr.concluido ? ['ok', 'Concluído'] : p.est.status === 'pausado' ? ['', 'Pausado'] : rr.atrasados ? ['alerta', rr.atrasados + (rr.atrasados > 1 ? ' dias' : ' dia') + ' em atraso'] : ['ouro', 'Em dia'];
      tela.appendChild(h('section.jornada2.j-plano',
        h('div.j-plano-topo', h('b.j-titulo', p.def.nome), h('span.selo' + (status[0] ? '.' + status[0] : ''), status[1])),
        h('div.barra', { role: 'progressbar', 'aria-label': 'Progresso do plano ' + p.def.nome, 'aria-valuenow': Math.round(rr.percentual), 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: { width: rr.percentual + '%' } })),
        h('div.j-plano-nums', h('span', h('b', UI.pct(rr.percentual))), h('span', h('b', n(rr.concluidos)), ' dias concluídos'), h('span', h('b', n(rr.pendentes)), ' restantes')),
        prox ? h('p.j-prox', h('span', 'Próxima leitura: '), prox) : null,
        rr.concluido ? h('small', 'Concluído em ' + UI.dataLonga(rr.terminoPrevisto)) : h('small', 'Término previsto: ' + UI.dataLonga(rr.terminoPrevisto)),
        h('button.bt' + (rr.concluido ? '' : '.pri') + '.peq', { on: { click: function () { abrirPlano(p); } } }, rr.concluido ? 'Ver plano' : 'Continuar o plano', ico('direita'))));
    });

    // histórico
    tela.appendChild(h('div.secao', h('h2', 'Histórico de atividades'), h('div.esp')));
    tela.appendChild(h('div.chips', TIPOS_FILTRO.map(function (t) {
      return h('button.chip', { 'aria-pressed': String(filtro === t[0]), on: { click: function () { App.estado.jornadaFiltro = t[0]; App.estado.jornadaLimite = 40; App.recarregar(); } } }, t[1]);
    })));
    var limite = App.estado.jornadaLimite || 40, lt = A2Jornada.linhaDoTempo(ev, P, filtro, limite), lista = h('div.j-tempo');
    if (!lt.total) lista.appendChild(h('div.vazio', h('b', 'Nada concluído neste período.'), h('span', 'Leituras marcadas como lidas, dias de plano, estudos, devocionais concluídos e quizzes terminados aparecem aqui.')));
    lt.grupos.forEach(function (g) {
      lista.appendChild(h('div.rotulo.j-dia', g.dia === hoje ? 'Hoje' : g.dia === A2Jornada.addDias(hoje, -1) ? 'Ontem' : UI.dataLonga(g.dia)));
      g.itens.forEach(function (e) {
        var hora = e.anterior || /T12:00:00$/.test(e.em) ? '' : new Date(e.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        var acao = e.tipo === 'capitulo' ? function () { var pp = e.chave.split('.'); App.abrirBiblia(pp[0], +pp[1]); }
          : e.tipo === 'devocional' ? function () { location.hash = 'biblioteca'; setTimeout(function () { Telas.devocionais.abrir(e.chave); }, 50); }
            : e.tipo === 'plano' ? function () { var p = ps.filter(function (x) { return x.def.id === e.chave.split(':')[0]; })[0]; if (p) abrirPlano(p); } : null;
        lista.appendChild(h(acao ? 'button.j-item' : 'div.j-item', acao ? { on: { click: acao } } : {}, h('span.j-item-ico.t-' + e.tipo, ico(ICONE_TIPO[e.tipo])),
          h('div', h('span.j-item-tipo', A2Jornada.TIPOS[e.tipo].nome), h('b', e.titulo)), hora ? h('small', hora) : null));
      });
    });
    tela.appendChild(lista);
    if (lt.total > limite) tela.appendChild(h('button.bt#j-mais', { style: { marginTop: '10px' }, on: { click: function () { App.estado.jornadaLimite = limite + 40; App.recarregar(); } } }, 'Mostrar mais (' + (lt.total - limite) + ')'));

    tela.appendChild(h('details.j-criterios', h('summary', 'Como a jornada é contada'),
      h('ul',
        h('li', h('b', 'Capítulo lido: '), 'quando você toca em “Marcar como lido”, avança com “Próximo” num plano ou conclui o dia do plano. Só abrir o capítulo não conta. Se desmarcar, ele sai da contagem.'),
        h('li', h('b', 'Dia de leitura: '), 'dia com pelo menos um capítulo concluído ou um dia de plano feito.'),
        h('li', h('b', 'Devocional: '), 'conta quando você toca em “Concluir devocional” no fim da leitura.'),
        h('li', h('b', 'Estudo: '), 'estudo com o assistente, guia de passagem, doutrina, Modo Bereano ou estudo salvo na Biblioteca; o mesmo estudo no mesmo dia conta uma vez.'),
        h('li', h('b', 'Quiz: '), 'rodada ou desafio do dia terminado.'),
        h('li', h('b', 'Privacidade: '), 'estes dados ficam no seu aparelho e, se você entrar com sua conta, na sua conta, protegidos para que só você os veja. Eles não são publicados nem comparados com outras pessoas.'))));
  }

  root.Telas.jornada = { render: render, cartaoResumo: cartaoResumo, eventos: eventos };
})(window);
