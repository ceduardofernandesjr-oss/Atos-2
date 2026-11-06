/*
 * ATOS 2 — Diagramação das artes (funções puras; a medição de texto vem do canvas).
 * Navegador: window.A2Arte · Node: module.exports
 * O texto bíblico é sempre composto pelo editor, por cima do fundo: nunca é desenhado por IA.
 */
(function (root) {
  'use strict';

  var FORMATOS = [
    { id: 'feed', nome: 'Instagram Feed', w: 1080, h: 1350 },
    { id: 'stories', nome: 'Instagram Stories', w: 1080, h: 1920 },
    { id: 'whatsapp', nome: 'WhatsApp', w: 1080, h: 1080 },
    { id: 'facebook', nome: 'Facebook (paisagem)', w: 1200, h: 630 },
    { id: 'facebook-quadrado', nome: 'Facebook (quadrado)', w: 1080, h: 1080 },
    { id: 'papel-celular', nome: 'Papel de parede do celular (Full HD)', w: 1080, h: 1920, papel: true },
    { id: 'papel-pc', nome: 'Papel de parede do computador (Full HD)', w: 1920, h: 1080, base: 1080, papel: true }
  ];

  // Quebra o texto em linhas que caibam em "largura". medir(texto) -> largura em px.
  // Respeita quebras de linha digitadas; palavra maior que a largura fica sozinha na linha.
  function quebrar(texto, largura, medir) {
    var linhas = [];
    String(texto || '').split('\n').forEach(function (par) {
      var palavras = par.split(/\s+/).filter(Boolean), atual = '';
      if (!palavras.length) { linhas.push(''); return; }
      palavras.forEach(function (p) {
        var teste = atual ? atual + ' ' + p : p;
        if (!atual || medir(teste) <= largura) atual = teste;
        else { linhas.push(atual); atual = p; }
      });
      linhas.push(atual);
    });
    return linhas;
  }

  // Maior tamanho de fonte (entre min e max) em que o texto cabe na caixa.
  // medirCom(tamanho) -> função medir para aquele tamanho. entrelinha: fator (ex.: 1.35)
  function ajustar(texto, caixa, medirCom, opcoes) {
    opcoes = opcoes || {};
    var min = opcoes.min || 18, max = opcoes.max || 120, ent = opcoes.entrelinha || 1.35;
    var melhor = { tamanho: min, linhas: quebrar(texto, caixa.w, medirCom(min)) };
    var lo = min, hi = max;
    while (lo <= hi) {
      var mid = Math.floor((lo + hi) / 2), med = medirCom(mid), l = quebrar(texto, caixa.w, med);
      var larguraOk = l.every(function (x) { return med(x) <= caixa.w; });
      if (larguraOk && l.length * mid * ent <= caixa.h) { melhor = { tamanho: mid, linhas: l }; lo = mid + 1; }
      else hi = mid - 1;
    }
    melhor.altura = melhor.linhas.length * melhor.tamanho * ent;
    return melhor;
  }

  // Texto do versículo para a arte: sem chaves de itálico, sem alterar palavras.
  function textoParaArte(versiculos) { return versiculos.map(function (t) { return String(t).replace(/[{}]/g, ''); }).join(' '); }

  // Remove de um SVG gerado por IA tudo que possa conter letras ou código (texto, scripts, links, imagens externas).
  function limparSvg(svg) {
    var s = String(svg || '');
    var m = /<svg[\s\S]*<\/svg>/i.exec(s);
    if (!m) return null;
    s = m[0]
      .replace(/<(text|tspan|textPath|script|foreignObject|style|a|image|use|title|desc|metadata)\b[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<(text|tspan|textPath|script|foreignObject|style|a|image|use|title|desc|metadata)\b[^>]*\/>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '')
      .replace(/(href|xlink:href)\s*=\s*("[^"]*"|'[^']*')/gi, '')
      .replace(/url\(\s*['"]?(?!#)[^)]*\)/gi, 'none');
    if (/<(text|script|foreignObject)\b/i.test(s)) return null;
    if (!/\sxmlns=/.test(s)) s = s.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    return s;
  }

  var API = { FORMATOS: FORMATOS, quebrar: quebrar, ajustar: ajustar, textoParaArte: textoParaArte, limparSvg: limparSvg };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Arte = API;
})(typeof window !== 'undefined' ? window : this);
