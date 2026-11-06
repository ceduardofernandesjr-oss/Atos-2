/*
 * ATOS 2 — acesso ao texto bíblico.
 * Cada tradução é uma pasta biblia/<id>/ com indice.json e um JSON por livro (formato do conversor).
 * Os livros baixados ficam guardados no aparelho para leitura sem internet.
 */
(function (root) {
  'use strict';

  // Traduções. Só entram no app textos completos e licenciados; as demais aparecem com a situação.
  var VERSOES = [
    { id: 'blivre', sigla: 'BLIVRE', nome: 'Bíblia Livre', ativa: true,
      descricao: 'Revisão atual da Almeida (1819), Textus Receptus. Linguagem formal e literal. Licença aberta.' },
    { id: 'alm1911', sigla: 'ALM1911', nome: 'Almeida Revista e Corrigida (1911)', ativa: true, grafiaAntiga: true,
      descricao: 'Edição de Lisboa, 1911, com a grafia da época (ex.: Christo, baptizado). Tradicional e literal, da mesma família da ACF. Domínio público.' },
    { id: 'alm1911at', sigla: 'ALM1911AT', nome: 'Almeida 1911, ortografia atualizada', ativa: true,
      descricao: 'O mesmo texto da edição de 1911, com a grafia de hoje (Cristo, batizado, Egito, ele). Palavras e pontuação de 1911 mantidas.' },
    { id: 'onbv', sigla: 'ONBV', nome: 'Biblica® Open Nova Bíblia Viva', ativa: true,
      descricao: 'Português atual e simples, com foco no sentido (tradução dinâmica). Boa para leitura devocional. Licença aberta da Biblica.' },
    { id: 'acf', sigla: 'ACF', nome: 'Almeida Corrigida Fiel', ativa: false,
      situacao: 'Aguardando autorização da Sociedade Bíblica Trinitariana do Brasil, detentora dos direitos. O app já está pronto para importar o texto oficial quando a licença for concedida.' },
    { id: 'kja', sigla: 'KJA', nome: 'King James Atualizada', ativa: false,
      situacao: 'Edição a confirmar (King James Atualizada, Abba Press e Sociedade Bíblica Ibero-Americana, 2001, ou outra). Depende de autorização do detentor dos direitos.' },
    { id: 'ntlh', sigla: 'NTLH', nome: 'Nova Tradução na Linguagem de Hoje', ativa: false,
      situacao: 'Aguardando autorização da Sociedade Bíblica do Brasil, detentora dos direitos.' }
  ];
  var indices = {}, livros = {}, pedidos = {};

  function versao(id) { return VERSOES.filter(function (v) { return v.id === id; })[0] || VERSOES[0]; }
  function ativas() { return VERSOES.filter(function (v) { return v.ativa; }); }
  // Tradução padrão: a escolhida pelo usuário (se estiver ativa), senão a Bíblia Livre.
  function padrao(v) {
    if (v) return v;
    try { var t = root.App && root.App.config && root.App.config().traducao; if (t && versao(t).id === t && versao(t).ativa) return t; } catch (e) {}
    return 'blivre';
  }

  async function buscarJson(url, chaveCache) {
    try {
      var r = await fetch(url, { cache: 'force-cache' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var j = await r.json();
      if (chaveCache) Dados.bibliaPut(chaveCache, j);
      return j;
    } catch (e) {
      var c = chaveCache ? await Dados.bibliaGet(chaveCache) : null;
      if (c) return c;
      throw new Error('Sem conexão e este texto ainda não foi baixado para uso sem internet.');
    }
  }
  async function indice(v) {
    v = padrao(v);
    if (indices[v]) return indices[v];
    if (!pedidos['i' + v]) pedidos['i' + v] = buscarJson('biblia/' + v + '/indice.json', v + ':indice').then(function (j) { indices[v] = j; return j; });
    return pedidos['i' + v];
  }
  async function livro(id, v) {
    v = padrao(v);
    var k = v + ':' + id;
    if (livros[k]) return livros[k];
    if (!pedidos[k]) pedidos[k] = buscarJson('biblia/' + v + '/' + id + '.json', k).then(function (j) { livros[k] = j; return j; }, function (e) { delete pedidos[k]; throw e; });
    return pedidos[k];
  }
  function contagemSinc(v) {
    var ix = indices[padrao(v)];
    return function (id) { if (!ix) return null; var l = ix.livros.filter(function (x) { return x.id === id; })[0]; return l ? l.versos : null; };
  }
  function interpretar(txt, v) { return A2Ref.interpretar(txt, contagemSinc(v)); }

  // Texto de uma referência: [{livro, cap, v, t}]
  async function textoDe(ref, v) {
    v = padrao(v); await indice(v);
    var lista = A2Ref.versiculosDa(ref, contagemSinc(v)), out = [], cache = {};
    for (var i = 0; i < lista.length; i++) {
      var b = lista[i][0];
      cache[b] = cache[b] || await livro(b, v);
      out.push({ livro: b, cap: lista[i][1], v: lista[i][2], t: (cache[b].caps[lista[i][1] - 1] || [])[lista[i][2] - 1] || '' });
    }
    return out;
  }
  async function textoDeString(s, v) { v = padrao(v); await indice(v); var r = interpretar(s, v); if (!r.ok) throw new Error(r.erro); return { ref: r.ref, versos: await textoDe(r.ref, v) }; }

  function licenciadas() { return Promise.all(ativas().map(function (v) { return indice(v.id).then(function (ix) { return Object.assign({}, v, { credito: ix.credito, edicao: ix.edicao, licenca: ix.licenca, alteracoes: ix.alteracoes, fonte: ix.fonte }); }); })); }
  async function todosOsLivros(v, progresso) {
    v = padrao(v);
    var ix = await indice(v), out = [];
    for (var i = 0; i < ix.livros.length; i++) {
      out.push(await livro(ix.livros[i].id, v));
      if (progresso) progresso(i + 1, ix.livros.length);
    }
    return out;
  }
  async function baixadosOffline(v) {
    var ks = await Dados.bibliaChaves(), pref = padrao(v) + ':';
    return ks.filter(function (k) { return String(k).indexOf(pref) === 0 && k !== pref + 'indice'; }).length;
  }

  // "texto" — Referência (SIGLA)
  function citacao(versos, ref, sigla) {
    return '“' + versos.map(function (x) { return UI.plano(x.t); }).join(' ') + '”\n— ' + A2Ref.formatar(ref) + ' (' + (sigla || 'BLIVRE') + ')';
  }

  root.Biblia = { VERSOES: VERSOES, versao: versao, ativas: ativas, padrao: padrao, indice: indice, livro: livro, contagemSinc: contagemSinc, interpretar: interpretar,
    textoDe: textoDe, textoDeString: textoDeString, todosOsLivros: todosOsLivros, licenciadas: licenciadas, baixadosOffline: baixadosOffline, citacao: citacao };
})(window);
