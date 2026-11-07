/* ATOS 2 — Organização dos livros da Bíblia para a tela de seleção: testamentos, categorias,
   número de capítulos, busca de livros e progresso de leitura (a partir dos capítulos marcados como lidos).
   Módulo puro (sem DOM). Depende de A2Ref para nomes e ordem. */
(function (root, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./referencias.js'));
  else root.A2Canon = fabrica(root.A2Ref);
})(typeof self !== 'undefined' ? self : this, function (A2Ref) {
  'use strict';

  // Capítulos por livro (cânon protestante de 66 livros; conferido com o índice da BLIVRE nos testes)
  var CAPITULOS = {
    GEN: 50, EXO: 40, LEV: 27, NUM: 36, DEU: 34, JOS: 24, JDG: 21, RUT: 4, '1SA': 31, '2SA': 24, '1KI': 22, '2KI': 25,
    '1CH': 29, '2CH': 36, EZR: 10, NEH: 13, EST: 10, JOB: 42, PSA: 150, PRO: 31, ECC: 12, SNG: 8, ISA: 66, JER: 52,
    LAM: 5, EZK: 48, DAN: 12, HOS: 14, JOL: 3, AMO: 9, OBA: 1, JON: 4, MIC: 7, NAM: 3, HAB: 3, ZEP: 3, HAG: 2, ZEC: 14, MAL: 4,
    MAT: 28, MRK: 16, LUK: 24, JHN: 21, ACT: 28, ROM: 16, '1CO': 16, '2CO': 13, GAL: 6, EPH: 6, PHP: 4, COL: 4, '1TH': 5,
    '2TH': 3, '1TI': 6, '2TI': 4, TIT: 3, PHM: 1, HEB: 13, JAS: 5, '1PE': 5, '2PE': 3, '1JN': 5, '2JN': 1, '3JN': 1, JUD: 1, REV: 22
  };

  var TESTAMENTOS = [
    { id: 'AT', nome: 'Antigo Testamento', descricao: 'A história da criação, das alianças e das promessas de Deus' },
    { id: 'NT', nome: 'Novo Testamento', descricao: 'A vida de Jesus Cristo, a Igreja e a esperança da salvação' }
  ];

  // Categorias na ordem dos livros; cada uma cobre um intervalo contínuo
  var CATEGORIAS = [
    { id: 'pentateuco', test: 'AT', nome: 'Pentateuco', descricao: 'A criação, os patriarcas e a Lei', icone: 'tabuas', de: 'GEN', ate: 'DEU' },
    { id: 'historicos', test: 'AT', nome: 'Livros históricos', descricao: 'A história de Israel na terra prometida', icone: 'coroa', de: 'JOS', ate: 'EST' },
    { id: 'poeticos', test: 'AT', nome: 'Livros poéticos', descricao: 'Orações, cânticos e sabedoria', icone: 'harpa', de: 'JOB', ate: 'SNG' },
    { id: 'profetas-maiores', test: 'AT', nome: 'Profetas maiores', descricao: 'Chamados ao arrependimento e promessas do Messias', icone: 'pergaminho', de: 'ISA', ate: 'DAN' },
    { id: 'profetas-menores', test: 'AT', nome: 'Profetas menores', descricao: 'Doze vozes de juízo e de esperança', icone: 'lampada', de: 'HOS', ate: 'MAL' },
    { id: 'evangelhos', test: 'NT', nome: 'Evangelhos', descricao: 'A vida, a morte e a ressurreição de Jesus', icone: 'cruz', de: 'MAT', ate: 'JHN' },
    { id: 'historia-igreja', test: 'NT', nome: 'História da Igreja', descricao: 'O Espírito Santo e o nascimento da Igreja', icone: 'chama', de: 'ACT', ate: 'ACT' },
    { id: 'cartas-paulo', test: 'NT', nome: 'Cartas de Paulo', descricao: 'Doutrina e cuidado pastoral às igrejas', icone: 'carta', de: 'ROM', ate: 'PHM' },
    { id: 'cartas-gerais', test: 'NT', nome: 'Cartas gerais', descricao: 'Fé perseverante e vida cristã', icone: 'pena', de: 'HEB', ate: 'JUD' },
    { id: 'profecia', test: 'NT', nome: 'Profecia', descricao: 'A vitória final do Cordeiro', icone: 'estrela', de: 'REV', ate: 'REV' }
  ];
  var CAT_DO_LIVRO = {};
  CATEGORIAS.forEach(function (c) {
    var i = A2Ref.POR_ID[c.de].ordem, f = A2Ref.POR_ID[c.ate].ordem;
    c.livros = A2Ref.LIVROS.slice(i, f + 1).map(function (l) { return l.id; });
    c.livros.forEach(function (id) { CAT_DO_LIVRO[id] = c; });
  });

  function capitulos(id, contagem) {
    var v = contagem && contagem(id);
    return (v && v.length) || CAPITULOS[id] || 0;
  }
  function categoriasDo(test) { return CATEGORIAS.filter(function (c) { return c.test === test; }); }
  function livrosDo(test) { return A2Ref.LIVROS.filter(function (l) { return l.test === test; }); }
  function categoriaDe(id) { return CAT_DO_LIVRO[id] || null; }
  function testamento(id) { return TESTAMENTOS.filter(function (t) { return t.id === id; })[0] || null; }

  // Progresso real: conta os capítulos marcados como lidos ({ 'GEN.1': true, ... })
  function progresso(lidos, ids, contagem) {
    lidos = lidos || {};
    var feitos = 0, total = 0;
    ids.forEach(function (id) {
      var n = capitulos(id, contagem); total += n;
      for (var c = 1; c <= n; c++) if (lidos[id + '.' + c]) feitos++;
    });
    return { lidos: feitos, total: total, fracao: total ? feitos / total : 0, completo: total > 0 && feitos === total };
  }
  function progressoLivro(lidos, id, contagem) { return progresso(lidos, [id], contagem); }
  function progressoTestamento(lidos, test, contagem) { return progresso(lidos, livrosDo(test).map(function (l) { return l.id; }), contagem); }

  // ---------- busca de livros ----------
  function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
  function compacto(s) { return norm(s).replace(/[\s.\-]+/g, ''); }
  var ALIASES = {};   // id -> nomes alternativos aceitos pela busca
  (function () {
    var extras = { JHN: 'jo|joao', '1JN': '1jo|1joao', '2JN': '2jo|2joao', '3JN': '3jo|3joao', SNG: 'cantico dos canticos|cantares de salomao', PSA: 'salmo', ACT: 'atos dos apostolos', REV: 'revelacao', PHM: 'filemon' };
    A2Ref.LIVROS.forEach(function (l) { ALIASES[l.id] = [l.nome, l.abrev].concat((extras[l.id] || '').split('|').filter(Boolean)); });
  })();

  // Pontua um livro para a consulta; 0 = não combina
  function pontuar(l, q, qc, exato) {
    var nome = norm(l.nome), nomeC = compacto(l.nome), best = 0;
    if (exato === l.id) return 100;
    if (nome === q || nomeC === qc) return 95;
    if (compacto(l.abrev) === qc) best = Math.max(best, 90);
    if (nomeC.indexOf(qc) === 0) best = Math.max(best, 80);
    nome.split(/\s+/).forEach(function (p) { if (p.indexOf(q) === 0) best = Math.max(best, 55); });
    ALIASES[l.id].forEach(function (a) { var ac = compacto(a); if (ac === qc) best = Math.max(best, 85); else if (ac.indexOf(qc) === 0) best = Math.max(best, 45); });
    if (!best && qc.length >= 3 && nomeC.indexOf(qc) > 0) best = 20;
    return best;
  }
  function buscar(consulta, limite) {
    var q = norm(consulta).replace(/\s+/g, ' '), qc = compacto(consulta);
    if (!qc) return [];
    // o livro que o leitor de referências reconhece vem primeiro (“Jo” = João, “Jó” = Jó)
    var lido = A2Ref.lerLivro(consulta), exato = lido && lido.id && !String(lido.resto || '').trim() ? lido.id : null;
    return A2Ref.LIVROS.map(function (l) { return { l: l, p: pontuar(l, q, qc, exato) }; })
      .filter(function (x) { return x.p > 0; })
      .sort(function (a, b) { return b.p - a.p || a.l.ordem - b.l.ordem; })
      .slice(0, limite || 12).map(function (x) { return x.l; });
  }
  // A consulta parece uma referência com capítulo (“Jo 3:16”, “Sl 23”, “1 Co 13”)?
  function pareceReferencia(consulta) { return /[a-zà-ú]\.?\s*\d/i.test(String(consulta || '')); }

  return {
    CAPITULOS: CAPITULOS, TESTAMENTOS: TESTAMENTOS, CATEGORIAS: CATEGORIAS,
    capitulos: capitulos, categoriasDo: categoriasDo, livrosDo: livrosDo, categoriaDe: categoriaDe, testamento: testamento,
    progresso: progresso, progressoLivro: progressoLivro, progressoTestamento: progressoTestamento,
    buscar: buscar, pareceReferencia: pareceReferencia, norm: norm
  };
});
