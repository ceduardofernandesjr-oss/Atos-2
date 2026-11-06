/*
 * ATOS 2 — Livros da Bíblia e referências (funções puras).
 * Navegador: window.A2Ref · Node: module.exports
 *
 * Reconhece referências como "Jo 3:16", "joão 3.16-18", "1 Co 13", "Primeira Coríntios 13:4-7",
 * "Sl 23", "Gênesis", "Ap 21:1-22:5". Valida contra a contagem real de capítulos e versículos.
 * "Jó" (com acento) é o livro de Jó; "Jo" sem acento é João, como nas edições brasileiras.
 */
(function (root) {
  'use strict';

  // id, nome, abreviação de exibição, outros nomes aceitos
  var LIVROS = [
    ['GEN', 'Gênesis', 'Gn', 'gen genesis'], ['EXO', 'Êxodo', 'Êx', 'ex exo exodo'], ['LEV', 'Levítico', 'Lv', 'lev levitico'],
    ['NUM', 'Números', 'Nm', 'num numeros'], ['DEU', 'Deuteronômio', 'Dt', 'deut deuteronomio'], ['JOS', 'Josué', 'Js', 'josue'],
    ['JDG', 'Juízes', 'Jz', 'juizes'], ['RUT', 'Rute', 'Rt', 'rute'], ['1SA', '1 Samuel', '1Sm', '1sam 1samuel 1sa'],
    ['2SA', '2 Samuel', '2Sm', '2sam 2samuel 2sa'], ['1KI', '1 Reis', '1Rs', '1reis 1re'], ['2KI', '2 Reis', '2Rs', '2reis 2re'],
    ['1CH', '1 Crônicas', '1Cr', '1cronicas 1cro'], ['2CH', '2 Crônicas', '2Cr', '2cronicas 2cro'], ['EZR', 'Esdras', 'Ed', 'esd esdras'],
    ['NEH', 'Neemias', 'Ne', 'nee neemias'], ['EST', 'Ester', 'Et', 'est ester'], ['JOB', 'Jó', 'Jó', ''],
    ['PSA', 'Salmos', 'Sl', 'sal salmo salmos sls'], ['PRO', 'Provérbios', 'Pv', 'prv prov proverbios'], ['ECC', 'Eclesiastes', 'Ec', 'ecl eclesiastes'],
    ['SNG', 'Cantares', 'Ct', 'cant cantares canticos cantico cantares-de-salomao'], ['ISA', 'Isaías', 'Is', 'isa isaias'],
    ['JER', 'Jeremias', 'Jr', 'jer jeremias'], ['LAM', 'Lamentações', 'Lm', 'lam lamentacoes'], ['EZK', 'Ezequiel', 'Ez', 'eze ezequiel'],
    ['DAN', 'Daniel', 'Dn', 'dan daniel'], ['HOS', 'Oseias', 'Os', 'ose oseias'], ['JOL', 'Joel', 'Jl', 'joel'], ['AMO', 'Amós', 'Am', 'amos'],
    ['OBA', 'Obadias', 'Ob', 'obd obadias'], ['JON', 'Jonas', 'Jn', 'jonas'], ['MIC', 'Miqueias', 'Mq', 'miq miqueias'],
    ['NAM', 'Naum', 'Na', 'naum'], ['HAB', 'Habacuque', 'Hc', 'hab habacuque'], ['ZEP', 'Sofonias', 'Sf', 'sof sofonias'],
    ['HAG', 'Ageu', 'Ag', 'ageu'], ['ZEC', 'Zacarias', 'Zc', 'zac zacarias'], ['MAL', 'Malaquias', 'Ml', 'mal malaquias'],
    ['MAT', 'Mateus', 'Mt', 'mat mateus'], ['MRK', 'Marcos', 'Mc', 'mar marcos'], ['LUK', 'Lucas', 'Lc', 'luc lucas'],
    ['JHN', 'João', 'Jo', 'joao'], ['ACT', 'Atos', 'At', 'atos atos-dos-apostolos'], ['ROM', 'Romanos', 'Rm', 'rom romanos'],
    ['1CO', '1 Coríntios', '1Co', '1cor 1corintios'], ['2CO', '2 Coríntios', '2Co', '2cor 2corintios'], ['GAL', 'Gálatas', 'Gl', 'gal galatas'],
    ['EPH', 'Efésios', 'Ef', 'efe efesios'], ['PHP', 'Filipenses', 'Fp', 'fil filipenses'], ['COL', 'Colossenses', 'Cl', 'col colossenses'],
    ['1TH', '1 Tessalonicenses', '1Ts', '1tes 1tessalonicenses'], ['2TH', '2 Tessalonicenses', '2Ts', '2tes 2tessalonicenses'],
    ['1TI', '1 Timóteo', '1Tm', '1tim 1timoteo'], ['2TI', '2 Timóteo', '2Tm', '2tim 2timoteo'], ['TIT', 'Tito', 'Tt', 'tito'],
    ['PHM', 'Filemom', 'Fm', 'flm filemom filemon'], ['HEB', 'Hebreus', 'Hb', 'heb hebreus'], ['JAS', 'Tiago', 'Tg', 'tiago'],
    ['1PE', '1 Pedro', '1Pe', '1pd 1ped 1pedro'], ['2PE', '2 Pedro', '2Pe', '2pd 2ped 2pedro'], ['1JN', '1 João', '1Jo', '1joao'],
    ['2JN', '2 João', '2Jo', '2joao'], ['3JN', '3 João', '3Jo', '3joao'], ['JUD', 'Judas', 'Jd', 'judas'], ['REV', 'Apocalipse', 'Ap', 'apo apocalipse apoc']
  ];
  var POR_ID = {}, ALIAS = {};
  function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function chaveNome(s) { return norm(s).replace(/[\s.\-]+/g, ''); }
  LIVROS.forEach(function (l, i) {
    var o = { id: l[0], nome: l[1], abrev: l[2], ordem: i, test: i < 39 ? 'AT' : 'NT' };
    POR_ID[l[0]] = o;
    [l[1], l[2]].concat(l[3] ? l[3].split(' ') : []).forEach(function (a) {
      var k = chaveNome(a);
      if (k && !(k in ALIAS)) ALIAS[k] = l[0];
    });
  });
  ALIAS.jo = 'JHN';        // "Jo" = João

  var ORDINAIS = { primeira: '1', primeiro: '1', segunda: '2', segundo: '2', terceira: '3', terceiro: '3', i: '1', ii: '2', iii: '3' };

  // Identifica o livro no início do texto. Retorna { id, resto } ou null.
  function lerLivro(txt) {
    var t = String(txt || '').trim().replace(/\s+/g, ' ');
    // Jó com acento (antes de normalizar)
    var mJo = /^j[óÓ](?=$|[\s\d.:])/i.exec(t);
    if (mJo) return { id: 'JOB', resto: t.slice(mJo[0].length) };
    var n = norm(t);
    // prefixo ordinal: "1", "1ª", "1a", "primeira", "i", "ii"
    var mo = /^(?:(primeir[ao]|segund[ao]|terceir[ao]|i{1,3})\s+|([123])\s*(?:ª\s*|º\s*|a\s+|o\s+)?)(?=[a-z])/.exec(n);
    var pref = '', base = n, consumidoPref = 0;
    if (mo) {
      var p = mo[1] ? ORDINAIS[mo[1]] : mo[2];
      // "i" só conta como ordinal se o que vem depois for um livro com número
      pref = p; base = n.slice(mo[0].length); consumidoPref = mo[0].length;
    }
    // nome: sequência de letras/espaços até o primeiro dígito, ':' ou fim
    var mn = /^([a-z][a-z\s.\-]*?)(?=\s*\d|\s*$)/.exec(base);
    if (!mn) return null;
    var nomeTxt = mn[1];
    var tentativas = [];
    if (pref) tentativas.push([pref + chaveNome(nomeTxt), consumidoPref + mn[0].length]);
    tentativas.push([chaveNome(nomeTxt), (pref ? 0 : 0) + mn[0].length, true]);
    for (var i = 0; i < tentativas.length; i++) {
      var k = tentativas[i][0];
      if (tentativas[i][2] && pref) continue; // com ordinal, o livro precisa existir com o número
      if (ALIAS[k]) return { id: ALIAS[k], resto: n.slice(tentativas[i][1]) };
    }
    // nomes parciais (ex.: "deuteron", "apoc"): prefixo único com 3+ letras
    var kk = (pref || '') + chaveNome(nomeTxt);
    if (kk.replace(/\d/g, '').length >= 3) {
      var cands = {};
      Object.keys(ALIAS).forEach(function (a) { if (ALIAS[a] && a.indexOf(kk) === 0) cands[ALIAS[a]] = 1; });
      var ids = Object.keys(cands);
      if (ids.length === 1) return { id: ids[0], resto: n.slice((pref ? consumidoPref : 0) + mn[0].length) };
    }
    return null;
  }

  /*
   * Interpreta uma referência. contagem: função (id) -> [nº de versículos por capítulo]
   * Retorna { ok:true, ref:{livro, cap, v1, cap2, v2} } ou { ok:false, erro }.
   * v1/v2 nulos = capítulo inteiro. cap2 > cap = intervalo de capítulos.
   */
  function interpretar(txt, contagem) {
    var lv = lerLivro(txt);
    if (!lv) return { ok: false, erro: 'Livro não reconhecido.' };
    var vs = contagem(lv.id);
    if (!vs) return { ok: false, erro: 'Livro indisponível.' };
    var r = lv.resto.replace(/\s+/g, '').replace(/[–—]/g, '-').replace(/,/g, ':').replace(/\./g, ':');
    if (!r) return { ok: true, ref: { livro: lv.id, cap: 1, v1: null, cap2: 1, v2: null }, soLivro: true };
    // Livros de um só capítulo (Obadias, Filemom, 2 e 3 João, Judas): "Jd 24" e "Jd 24-25" são versículos;
    // "Jd 1" continua sendo o capítulo inteiro.
    if (vs.length === 1 && r.indexOf(':') < 0) {
      var um = /^(\d+)(?:-(\d+))?$/.exec(r);
      if (um && !(+um[1] === 1 && !um[2])) r = '1:' + r;
    }
    var m = /^(\d+)(?::(\d+))?(?:-(\d+)(?::(\d+))?)?$/.exec(r);
    if (!m) return { ok: false, erro: 'Use o formato Livro capítulo:versículo, por exemplo João 3:16.' };
    var c = +m[1], v1 = m[2] ? +m[2] : null, c2 = c, v2 = null;
    if (m[3]) {
      if (m[4]) { c2 = +m[3]; v2 = +m[4]; }
      else if (v1 != null) v2 = +m[3];
      else c2 = +m[3];
    }
    if (v1 != null && v2 == null && !m[3]) v2 = v1;
    if (c < 1 || c > vs.length) return { ok: false, erro: POR_ID[lv.id].nome + ' tem ' + vs.length + ' capítulo' + (vs.length > 1 ? 's' : '') + '.' };
    if (c2 < c || c2 > vs.length) return { ok: false, erro: 'Intervalo de capítulos inválido.' };
    if (v1 != null) {
      if (v1 < 1 || v1 > vs[c - 1]) return { ok: false, erro: POR_ID[lv.id].nome + ' ' + c + ' tem ' + vs[c - 1] + ' versículos.' };
      if (v2 < 1 || v2 > vs[c2 - 1] || (c2 === c && v2 < v1)) return { ok: false, erro: 'Intervalo de versículos inválido.' };
    }
    return { ok: true, ref: { livro: lv.id, cap: c, v1: v1, cap2: c2, v2: v2 } };
  }

  function formatar(ref, curto) {
    if (!ref) return '';
    var l = POR_ID[ref.livro], nome = curto ? l.abrev : l.nome;
    var s = nome + ' ' + ref.cap;
    var c2 = ref.cap2 || ref.cap;
    if (ref.v1 != null) {
      s += ':' + ref.v1;
      if (c2 !== ref.cap) s += '-' + c2 + ':' + ref.v2;
      else if (ref.v2 != null && ref.v2 !== ref.v1) s += '-' + ref.v2;
    } else if (c2 !== ref.cap) s += '-' + c2;
    return s;
  }

  // Lista de [livro, cap, v] cobertos por uma referência (para buscar o texto)
  function versiculosDa(ref, contagem) {
    var vs = contagem(ref.livro), out = [], c2 = ref.cap2 || ref.cap;
    for (var c = ref.cap; c <= c2; c++) {
      var ini = (c === ref.cap && ref.v1 != null) ? ref.v1 : 1;
      var fim = (c === c2 && ref.v2 != null) ? ref.v2 : vs[c - 1];
      for (var v = ini; v <= fim; v++) out.push([ref.livro, c, v]);
    }
    return out;
  }

  // "JHN.3.16" <-> objeto
  function chave(livro, cap, v) { return livro + '.' + cap + (v != null ? '.' + v : ''); }
  function deChave(k) { var p = String(k).split('.'); return { livro: p[0], cap: +p[1], v: p[2] != null ? +p[2] : null }; }

  var API = { LIVROS: LIVROS.map(function (l) { return POR_ID[l[0]]; }), POR_ID: POR_ID, norm: norm, lerLivro: lerLivro,
    interpretar: interpretar, formatar: formatar, versiculosDa: versiculosDa, chave: chave, deChave: deChave };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Ref = API;
})(typeof window !== 'undefined' ? window : this);
