/*
 * ATOS 2 — Pesquisa no texto bíblico (funções puras).
 * Navegador: window.A2Busca · Node: module.exports
 *
 * - Sem diferença de maiúsculas e acentos ("fe" encontra "fé").
 * - Palavras soltas: o versículo precisa conter TODAS, como palavras inteiras
 *   (opção "inicio": também aceita palavras que começam com o termo, ex. "batiz" → batizado).
 * - Expressão entre aspas: a sequência exata de palavras.
 * - Resultados trazem os trechos encontrados para destaque.
 */
(function (root) {
  'use strict';

  // Normaliza mantendo o mesmo comprimento (cada caractere vira exatamente um), para que as
  // posições encontradas no texto normalizado valham no texto original.
  function normChar(ch) {
    var n = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    return n.length === 1 ? n : ch.toLowerCase().charAt(0);
  }
  function normalizar(s) { var o = ''; for (var i = 0; i < s.length; i++) o += normChar(s[i]); return o; }
  var LETRA = /[a-z0-9ºª]/;
  function ehLetra(c) { return !!c && LETRA.test(c); }

  function interpretarConsulta(q) {
    var frases = [], resto = String(q || '').replace(/["“”]([^"“”]+)["“”]/g, function (_, f) { frases.push(f); return ' '; });
    var termos = normalizar(resto).split(/[^a-z0-9ºª]+/).filter(function (t) { return t.length > 0; });
    frases = frases.map(function (f) { return normalizar(f).split(/[^a-z0-9ºª]+/).filter(Boolean).join(' '); }).filter(Boolean);
    return { termos: termos, frases: frases };
  }

  // Procura "agulha" como palavra(s) inteira(s) (ou início de palavra) em "palheiro" normalizado.
  function ocorrencias(palheiro, agulha, inicio) {
    var out = [], de = 0, i;
    while ((i = palheiro.indexOf(agulha, de)) >= 0) {
      var antes = palheiro[i - 1], depois = palheiro[i + agulha.length];
      if (!ehLetra(antes) && (inicio || !ehLetra(depois))) {
        var fim = i + agulha.length;
        if (inicio) while (ehLetra(palheiro[fim])) fim++;
        out.push([i, fim]);
      }
      de = i + 1;
    }
    return out;
  }

  // Frase: palavras na ordem, separadas só por espaço/pontuação.
  function ocorrenciasFrase(palheiro, frase) {
    var palavras = frase.split(' '), out = [];
    var primeira = ocorrencias(palheiro, palavras[0], false);
    primeira.forEach(function (p) {
      var pos = p[1], ok = true;
      for (var k = 1; k < palavras.length && ok; k++) {
        var m = /^[^a-z0-9ºª]+/.exec(palheiro.slice(pos));
        if (!m) { ok = false; break; }
        pos += m[0].length;
        if (palheiro.substr(pos, palavras[k].length) !== palavras[k] || ehLetra(palheiro[pos + palavras[k].length])) ok = false;
        else pos += palavras[k].length;
      }
      if (ok) out.push([p[0], pos]);
    });
    return out;
  }

  // Grafia antiga (ex.: Almeida 1911): a palavra digitada na grafia atual também encontra
  // "Christo", "baptizado", "Egypto", "psalmo", "sancto", "elle", "phariseos", "egreja".
  // Cada letra vira um padrão que aceita as formas antigas; o texto continua com o mesmo
  // comprimento, então o destaque cai no lugar certo.
  var ANTIGA = {
    c: 'c{1,2}h?', f: '(?:ph|ff?)', t: '(?:[cp]?t{1,2}h?)', i: '[iy]', s: 's{1,2}', l: 'l{1,2}', m: 'm{1,2}', n: 'n{1,2}',
    b: 'b{1,2}', d: 'd{1,2}', g: 'g{1,2}', p: 'p{1,2}', r: 'r{1,2}h?'
  };
  var cacheRe = {};
  function padraoAntigo(palavra) {
    var out = '', i = 0;
    if (palavra[0] === 's') out = 'p?';               // salmo → psalmo
    for (; i < palavra.length; i++) {
      var ch = palavra[i], nx = palavra[i + 1];
      if (ch === 'i' && i === 0) { out += '[iye]'; continue; }        // igreja → egreja
      if (ch === 'u' && palavra[i - 1] === 'e') { out += '[uo]'; continue; } // fariseus → phariseos
      if (ANTIGA[ch]) {
        // duas letras iguais na grafia atual (raras): mantém
        if (nx === ch) { out += ch + ch; i++; continue; }
        out += ANTIGA[ch];
      } else out += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    return out;
  }
  function ocorrenciasAntigas(palheiro, palavras, inicio) {
    var k = palavras.join(' ') + (inicio ? '|i' : '');
    var re = cacheRe[k] || (cacheRe[k] = new RegExp('(?<![a-z0-9ºª])' + palavras.map(padraoAntigo).join('[^a-z0-9ºª]+') + (inicio ? '[a-z0-9ºª]*' : '(?![a-z0-9ºª])'), 'g'));
    var out = [], m;
    re.lastIndex = 0;
    while ((m = re.exec(palheiro))) { out.push([m.index, m.index + m[0].length]); if (!m[0].length) re.lastIndex++; }
    return out;
  }

  // textoPlano: versículo sem as chaves de itálico. Retorna lista de trechos [ini, fim] ou null.
  function casar(textoPlano, consulta, opcoes) {
    var n = normalizar(textoPlano), trechos = [];
    for (var i = 0; i < consulta.frases.length; i++) {
      var f = opcoes && opcoes.grafiaAntiga ? ocorrenciasAntigas(n, consulta.frases[i].split(' '), false) : ocorrenciasFrase(n, consulta.frases[i]);
      if (!f.length) return null;
      trechos = trechos.concat(f);
    }
    for (var j = 0; j < consulta.termos.length; j++) {
      var o = opcoes && opcoes.grafiaAntiga ? ocorrenciasAntigas(n, [consulta.termos[j]], opcoes.inicio) : ocorrencias(n, consulta.termos[j], opcoes && opcoes.inicio);
      if (!o.length) return null;
      trechos = trechos.concat(o);
    }
    trechos.sort(function (a, b) { return a[0] - b[0]; });
    return trechos;
  }

  /*
   * livros: [{ id, caps:[[texto...]] }] na ordem canônica (já carregados)
   * opcoes: { inicio, livros:Set|null (restringe), limite, grafiaAntiga }
   * Retorna { total, resultados:[{livro, cap, v, texto, trechos}], porLivro:{id:n} }
   */
  function pesquisar(livros, q, opcoes) {
    opcoes = opcoes || {};
    var c = interpretarConsulta(q), limite = opcoes.limite || 500;
    var res = [], total = 0, porLivro = {};
    if (!c.termos.length && !c.frases.length) return { total: 0, resultados: [], porLivro: {}, consulta: c };
    livros.forEach(function (lv) {
      if (opcoes.livros && !opcoes.livros.has(lv.id)) return;
      lv.caps.forEach(function (cap, ci) {
        cap.forEach(function (t, vi) {
          if (!t) return;
          var plano = t.replace(/[{}]/g, '');
          var tr = casar(plano, c, opcoes);
          if (!tr) return;
          total++; porLivro[lv.id] = (porLivro[lv.id] || 0) + 1;
          if (res.length < limite) res.push({ livro: lv.id, cap: ci + 1, v: vi + 1, texto: plano, trechos: tr });
        });
      });
    });
    return { total: total, resultados: res, porLivro: porLivro, consulta: c };
  }

  // Divide um texto em partes [{t, destaque}] para exibição
  function partes(texto, trechos) {
    var out = [], pos = 0;
    (trechos || []).forEach(function (r) {
      if (r[0] < pos) return;
      if (r[0] > pos) out.push({ t: texto.slice(pos, r[0]), destaque: false });
      out.push({ t: texto.slice(r[0], r[1]), destaque: true });
      pos = r[1];
    });
    if (pos < texto.length) out.push({ t: texto.slice(pos), destaque: false });
    return out;
  }

  var API = { normalizar: normalizar, padraoAntigo: padraoAntigo, interpretarConsulta: interpretarConsulta, casar: casar, pesquisar: pesquisar, partes: partes };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Busca = API;
})(typeof window !== 'undefined' ? window : this);
