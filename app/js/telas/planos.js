/* ATOS 2 — Central de planos de leitura: catálogo, progresso, pausa/retomada, cronograma diário e lembretes. */
(function (root) {
  'use strict';
  var h = UI.h, ico = UI.icone;
  function def(id) { return A2Planos.DEFINICOES.filter(function (d) { return d.id === id; })[0]; }
  function cron(d) { return A2Planos.cronograma(d, Biblia.contagemSinc('blivre')); }
  function capa(d, est, onclick) {
    var r = est ? A2Planos.resumo(est, d.dias, UI.hoje()) : null;
    return h('button.capa-plano', { style: { background: 'linear-gradient(140deg, ' + d.cor[0] + ', ' + d.cor[1] + ')' }, on: { click: onclick } },
      h('span.simbolo', { html: ico(d.simbolo === 'harpa' ? 'harpa' : d.simbolo).innerHTML }),
      est ? h('small', est.status === 'pausado' ? 'Pausado' : est.status === 'concluido' ? 'Concluído' : 'Em andamento · ' + UI.pct(r.percentual)) : h('small', d.dias + ' dias'),
      h('b', d.nome),
      est ? h('div.barra', { style: { background: 'rgba(255,255,255,.2)' } }, h('i', { style: { width: r.percentual + '%' } })) : null);
  }

  function lista(area) {
    var meus = Dados.todos('planos');
    var porId = {}; meus.forEach(function (p) { porId[p.planoId] = p; });
    if (meus.length) {
      area.appendChild(h('div.secao', { style: { marginTop: 0 } }, h('h2', 'Meus planos')));
      area.appendChild(h('div.grade.g2', meus.sort(function (a, b) { return (a.status === 'concluido') - (b.status === 'concluido'); }).map(function (p) { var d = def(p.planoId); return d ? capa(d, p, function () { abrir(d.id); }) : null; })));
    }
    area.appendChild(h('div.secao', h('h2', 'Planos disponíveis')));
    area.appendChild(h('p.sub', { style: { marginBottom: '10px' } }, 'Você pode seguir mais de um plano ao mesmo tempo. O progresso fica salvo e sincronizado.'));
    area.appendChild(h('div.grade.g2', A2Planos.DEFINICOES.filter(function (d) { return !porId[d.id]; }).map(function (d) { return capa(d, null, function () { abrir(d.id); }); })));
  }

  function abrir(id) {
    var d = def(id); if (!d) return;
    var dias = cron(d);
    UI.folha(d.nome, function (api) {
      var corpo = h('div.form');
      function desenhar() {
        var est = Dados.obter('planos', id), hoje = UI.hoje(), r = est ? A2Planos.resumo(est, d.dias, hoje) : null;
        var filhos = [
          h('div.capa-plano', { style: { background: 'linear-gradient(140deg, ' + d.cor[0] + ', ' + d.cor[1] + ')', minHeight: '150px', cursor: 'default' } },
            h('span.simbolo', { html: ico(d.simbolo).innerHTML }), h('small', d.dias + ' dias · ' + dias.reduce(function (s, x) { return s + x.length; }, 0) + ' capítulos'), h('b', { style: { fontSize: '24px' } }, d.nome)),
          h('p', d.descricao), h('p.sub', h('b', 'Objetivo: '), d.objetivo)
        ];
        if (!est) {
          var ini = h('input.entrada#plano-ini', { type: 'date', value: hoje });
          filhos.push(h('label.campo', { for: 'plano-ini' }, h('span', 'Data de início'), ini),
            h('button.bt.pri', { on: { click: function () {
              var e = A2Planos.iniciar(d, ini.value || hoje); Dados.salvar('planos', id, e); App.registrar('plano', { titulo: 'Iniciou: ' + d.nome }); UI.aviso('Plano iniciado.'); desenhar();
            } } }, ico('play'), 'Iniciar plano'));
        } else {
          filhos.push(h('div.numeros',
            numero(UI.pct(r.percentual), 'concluído'), numero(r.concluidos + '/' + r.total, 'dias lidos'), numero(String(r.pendentes), 'dias pendentes'),
            numero(est.status === 'pausado' ? '—' : String(r.atrasados), 'dias em atraso'),
            numero(UI.dataCurta(est.inicio), 'início'), numero(r.concluido ? UI.dataCurta(est.concluidoEm || hoje) : UI.dataCurta(r.terminoPrevisto), r.concluido ? 'concluído em' : 'término previsto')));
          filhos.push(h('div.barra', { style: { height: '8px' } }, h('i', { style: { width: r.percentual + '%' } })));
          if (est.status === 'pausado') filhos.push(h('div.aviso', ico('info'), h('span', 'Plano pausado desde ' + UI.dataCurta(est.pausas[est.pausas.length - 1].de) + '. Os dias de pausa não contam como atraso.')));
          var bts = h('div.linha-bts');
          if (!r.concluido && r.proximo >= 0) bts.appendChild(h('button.bt.pri', { on: { click: function () { api.fechar(); ler(r.proximo); } } }, ico('livro'), 'Continuar: dia ' + (r.proximo + 1)));
          if (est.status === 'ativo') bts.appendChild(h('button.bt', { on: { click: function () { Dados.salvar('planos', id, A2Planos.pausar(est, hoje)); desenhar(); } } }, ico('pausa'), 'Pausar'));
          if (est.status === 'pausado') bts.appendChild(h('button.bt', { on: { click: function () { Dados.salvar('planos', id, A2Planos.retomar(est, hoje)); desenhar(); } } }, ico('play'), 'Retomar'));
          bts.appendChild(h('button.bt.perigo', { on: { click: async function () {
            if (await UI.confirmar('Sair do plano', 'O progresso deste plano será apagado. Os capítulos marcados como lidos na Bíblia continuam marcados.', 'Sair do plano', true)) { Dados.excluir('planos', id); api.fechar(); }
          } } }, ico('lixo'), 'Sair do plano'));
          filhos.push(bts);
          var lemb = h('input.entrada#plano-lemb', { type: 'time', value: est.lembrete || App.config().notif.plano.hora });
          lemb.addEventListener('change', function () { Dados.salvar('planos', id, Object.assign({}, Dados.obter('planos', id), { lembrete: lemb.value })); UI.aviso('Lembrete às ' + lemb.value + '.'); });
          filhos.push(h('label.chave', { for: 'plano-lemb' }, h('div', h('span', 'Lembrete diário'), h('small', 'Aparece no Início e nos lembretes (ative em Perfil › Notificações)')), lemb));
        }
        filhos.push(h('div.secao', h('h2', 'Cronograma')));
        var listaDias = h('div.lista');
        var esperado = est ? Math.min(d.dias, Math.max(1, A2Planos.dias(est.inicio, hoje) + 1 - A2Planos.diasPausados(est, hoje))) - 1 : -1;
        dias.forEach(function (itens, i) {
          var feito = est && est.feitos && est.feitos[i];
          var cb = h('input.marcar', { type: 'checkbox', 'aria-label': 'Dia ' + (i + 1) + ' lido', disabled: !est });
          cb.checked = !!feito;
          cb.addEventListener('change', function () {
            var e = Dados.obter('planos', id); Dados.salvar('planos', id, A2Planos.marcar(e, i, cb.checked, UI.hoje(), d.dias));
            if (cb.checked) { itens.forEach(function (x) { Leitura.marcarLido(true, x.livro, x.cap); }); App.registrar('plano', { titulo: d.nome + ' — dia ' + (i + 1) }); }
            desenhar();
          });
          var dataDia = est ? A2Planos.addDias(est.inicio, i) : null;
          listaDias.appendChild(h('div.dia-plano' + (i === esperado ? '.hoje' : ''),
            h('span.n', String(i + 1)),
            h('div.corpo', h('b', A2Planos.rotuloLeitura(itens, A2Ref.formatar) + (itens[0].tema ? ' — ' + itens[0].tema : '')),
              h('small', feito ? 'Lido em ' + UI.dataCurta(feito) : (i === esperado ? 'Leitura de hoje' : dataDia && est.status !== 'pausado' && i > esperado ? 'Previsto para ' + UI.dataCurta(dataDia) : i < esperado ? 'Pendente' : ''))),
            h('button.bt-ico', { 'aria-label': 'Ler dia ' + (i + 1), on: { click: function () { api.fechar(); ler(i); } } }, ico('livro')),
            cb));
        });
        filhos.push(listaDias);
        corpo.replaceChildren.apply(corpo, filhos);
        if (esperado > 3) setTimeout(function () { var el = listaDias.children[esperado]; if (el) el.scrollIntoView({ block: 'center' }); }, 60);
      }
      function ler(i) { var x = dias[i][0]; App.abrirBiblia(x.livro, x.cap, null, { planoId: id, dia: i }); }
      desenhar();
      return corpo;
    }, { cheia: true });
  }
  function numero(v, r) { return h('div.numero', h('b', v), h('small', r)); }

  root.Telas.planos = { lista: lista, abrir: abrir };
})(window);
