/*
 * ATOS 2 — Biblioteca: conteúdos salvos num formato único, pesquisa, ordenação e coleções.
 * Navegador: window.A2Biblioteca · Node: module.exports
 *
 * Coleções (coleção "colecoes"): { nome, descricao, icone, itens: [{ tipo, id, em }], criadoEm, atualizadoEm }
 *  - Versículos continuam marcados no próprio favorito (favoritos[].colecoes = [idColecao]), como desde a v1;
 *  - estudos, anotações e devocionais ficam em colecao.itens. Nada é copiado: a coleção só aponta para o conteúdo.
 */
(function (root) {
  'use strict';

  var TIPOS = {
    versiculo: { nome: 'Versículo', plural: 'Versículos', icone: 'coracao' },
    estudo: { nome: 'Estudo', plural: 'Estudos', icone: 'nota' },
    nota: { nome: 'Anotação', plural: 'Anotações', icone: 'editar' },
    devocional: { nome: 'Devocional', plural: 'Devocionais', icone: 'luz' },
    arte: { nome: 'Arte', plural: 'Artes', icone: 'pincel' },
    obra: { nome: 'Livro ou artigo', plural: 'Livros e artigos', icone: 'livro' }
  };
  var COLECIONAVEIS = ['versiculo', 'estudo', 'nota', 'devocional', 'obra'];
  // Favoritos de livros e artigos ficam na mesma coleção "favoritos", com tipo "obra" (id "obra-<publicação>")
  function ehFavObra(f) { return !!f && (f.tipo === 'obra' || /^obra-/.test(String(f.id || ''))); }
  function favVersiculos(favs) { return (favs || []).filter(function (f) { return !ehFavObra(f); }); }
  var ICONES_COLECAO = ['colecao', 'coracao', 'livro', 'luz', 'chama', 'estrela', 'sol', 'escudo', 'nota', 'cruz', 'brilho', 'planos'];
  var SUGESTOES = ['Fé', 'Salvação', 'Oração', 'Espírito Santo', 'Promessas de Deus', 'Estudos pessoais', 'Pregações'];

  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function dataDe(x) { return x.criadoEm || x.salvoEm || x.atualizadoEm || x.em || (x._t ? new Date(x._t).toISOString() : '') || ''; }
  function chaveItem(tipo, id) { return tipo + ':' + id; }
  function primeiraLinha(s, n) { var t = String(s || '').trim().split('\n')[0]; return t.length > (n || 60) ? t.slice(0, n || 60).trim() + '…' : t; }

  // d: { favoritos, notas, estudos, devSalvos, artes, devocionais (publicados, para a passagem), rotulo(chave), rotuloRefs(chaves), chavesDe(refTexto),
  //      obra(id) → publicação do acervo (para favoritos e anotações de livros e artigos) }
  function itens(d) {
    d = d || {};
    var rot = d.rotulo || function (k) { return k; }, out = [];
    (d.favoritos || []).forEach(function (f) {
      if (ehFavObra(f)) {
        var idObra = f.obra || String(f.id).replace(/^obra-/, ''), p = d.obra ? d.obra(idObra) : null;
        if (!p) return;                       // publicação retirada do acervo: some sem quebrar nada
        out.push({ tipo: 'obra', id: idObra, titulo: p.titulo, sub: p.autor || '', texto: p.descricao || '', chaves: [], data: dataDe(f), favorito: true, obra: p, bruto: f });
        return;
      }
      out.push({ tipo: 'versiculo', id: f.id, titulo: rot(f.id), chaves: [f.id], data: dataDe(f), colecoes: f.colecoes || [], bruto: f });
    });
    (d.notas || []).forEach(function (n) {
      var refs = n.refs || [], obra = n.obra && d.obra ? d.obra(n.obra.id) : null;
      var tit = n.titulo || (refs.length && d.rotuloRefs ? d.rotuloRefs(refs) : '') || (obra ? 'Anotação em ' + obra.titulo : '') || primeiraLinha(n.texto) || 'Anotação';
      var sub = refs.length && n.titulo && d.rotuloRefs ? d.rotuloRefs(refs) : obra && n.titulo ? obra.titulo : '';
      out.push({ tipo: 'nota', id: n.id, titulo: tit, sub: sub, texto: n.texto || '', chaves: refs.slice(),
        data: n.atualizadoEm || dataDe(n), criadoEm: n.criadoEm || '', bruto: n });
    });
    (d.estudos || []).forEach(function (e) {
      var chaves = [];
      (e.refs || []).forEach(function (s) { var r = typeof s === 'string' ? s : s && s.ref; if (r && d.chavesDe) chaves = chaves.concat(d.chavesDe(r)); });
      out.push({ tipo: 'estudo', id: e.id, titulo: e.titulo || 'Estudo sem título', sub: e.categoria || '', texto: e.corpo || '', chaves: chaves,
        data: e.criadoEm || dataDe(e), atualizadoEm: e.atualizadoEm || '', origem: e.origem || '', bruto: e });
    });
    var pub = {}; (d.devocionais || []).forEach(function (x) { pub[x.id] = x; });
    (d.devSalvos || []).forEach(function (s) {
      var p = pub[s.id] || {};
      out.push({ tipo: 'devocional', id: s.id, titulo: s.titulo || p.titulo || 'Devocional', sub: s.categoria || p.categoria || '', ref: p.passagem || s.passagem || '',
        dataConteudo: s.data || p.data || '', data: s.salvoEm || dataDe(s), chaves: p.passagem && d.chavesDe ? d.chavesDe(p.passagem) : [], bruto: s });
    });
    (d.artes || []).forEach(function (a) {
      out.push({ tipo: 'arte', id: a.id, titulo: a.nome || a.titulo || 'Arte', miniatura: a.miniatura || '', estado: a.estado || 'finalizada', data: a.criadoEm || dataDe(a), bruto: a });
    });
    return out;
  }

  function contagens(d) {
    return { versiculos: favVersiculos(d.favoritos).length, obras: (d.favoritos || []).length - favVersiculos(d.favoritos).length, estudos: (d.estudos || []).length, devocionais: (d.devSalvos || []).length,
      notas: (d.notas || []).length, colecoes: (d.colecoes || []).length, artes: (d.artes || []).length, destaques: (d.destaques || []).length };
  }

  // modo: 'recentes' | 'antigos' | 'az' | 'biblica'. ordemLivros: ['GEN', 'EXO', …]
  function ordenar(lista, modo, ordemLivros) {
    var a = lista.slice(), ix = {};
    (ordemLivros || []).forEach(function (id, i) { ix[id] = i; });
    function posBiblica(it) {
      var k = (it.chaves || [])[0]; if (!k) return Infinity;
      var p = String(k).split('.'); return (ix[p[0]] != null ? ix[p[0]] : 999) * 1e6 + (+p[1] || 0) * 1e3 + (+p[2] || 0);
    }
    if (modo === 'antigos') a.sort(function (x, y) { return String(x.data).localeCompare(String(y.data)); });
    else if (modo === 'az') a.sort(function (x, y) { return norm(x.titulo).localeCompare(norm(y.titulo)); });
    else if (modo === 'biblica') a.sort(function (x, y) { return posBiblica(x) - posBiblica(y) || String(y.data).localeCompare(String(x.data)); });
    else a.sort(function (x, y) { return String(y.data).localeCompare(String(x.data)); });
    return a;
  }

  // Uma chave de versículo (LIVRO.cap.v) está dentro da referência {livro, cap, v1, v2}?
  function naRef(chave, ref) {
    var p = String(chave).split('.');
    if (p[0] !== ref.livro) return false;
    if (ref.cap == null) return true;
    if (+p[1] !== ref.cap) return false;
    if (ref.v1 == null || p[2] == null) return true;
    var v = +p[2]; return v >= ref.v1 && v <= (ref.v2 || ref.v1);
  }

  // opcoes: { textos: {chave: texto do versículo}, ref: {livro, cap, v1, v2} | null, colecoes: [{id, nome, descricao, membros: ['tipo:id']}] }
  function pesquisar(lista, consulta, opcoes) {
    opcoes = opcoes || {};
    var termo = norm(consulta), ref = opcoes.ref, textos = opcoes.textos || {};
    if (!termo && !ref) return [];
    var porColecao = {};
    (opcoes.colecoes || []).forEach(function (c) {
      if (termo && (norm(c.nome).indexOf(termo) >= 0 || norm(c.descricao).indexOf(termo) >= 0)) (c.membros || []).forEach(function (m) { porColecao[m] = c.nome; });
    });
    return lista.map(function (it) {
      var pontos = 0, motivo = '';
      if (ref && (it.chaves || []).some(function (k) { return naRef(k, ref); })) { pontos += 10; motivo = 'referência'; }
      if (termo) {
        if (norm(it.titulo).indexOf(termo) >= 0) { pontos += 6; motivo = motivo || 'título'; }
        if (norm(it.sub).indexOf(termo) >= 0) { pontos += 4; motivo = motivo || 'tema'; }
        if (norm(it.ref).indexOf(termo) >= 0) { pontos += 4; motivo = motivo || 'referência'; }
        if (norm(it.texto).indexOf(termo) >= 0) { pontos += 2; motivo = motivo || 'conteúdo'; }
        if (it.tipo === 'versiculo' && norm(textos[it.id]).indexOf(termo) >= 0) { pontos += 3; motivo = motivo || 'texto do versículo'; }
        var col = porColecao[chaveItem(it.tipo, it.id)];
        if (col) { pontos += 3; motivo = motivo || 'coleção ' + col; }
      }
      return pontos ? Object.assign({}, it, { pontos: pontos, motivo: motivo }) : null;
    }).filter(Boolean).sort(function (a, b) { return b.pontos - a.pontos || String(b.data).localeCompare(String(a.data)); });
  }

  // ---------------------------------------------------------------- coleções
  function membros(col, favoritos) {
    var out = [], vistos = {};
    favVersiculos(favoritos).forEach(function (f) { if ((f.colecoes || []).indexOf(col.id) >= 0) { var k = chaveItem('versiculo', f.id); if (!vistos[k]) { vistos[k] = 1; out.push({ tipo: 'versiculo', id: f.id }); } } });
    (col.itens || []).forEach(function (m) {
      if (!m || COLECIONAVEIS.indexOf(m.tipo) < 0 || m.tipo === 'versiculo') return;
      var k = chaveItem(m.tipo, m.id); if (!vistos[k]) { vistos[k] = 1; out.push({ tipo: m.tipo, id: m.id, em: m.em }); }
    });
    return out;
  }
  // Itens da coleção que ainda existem (conteúdo apagado some da coleção sem quebrar nada)
  function resolver(col, favoritos, todos) {
    var mapa = {}; (todos || []).forEach(function (it) { mapa[chaveItem(it.tipo, it.id)] = it; });
    return membros(col, favoritos).map(function (m) { return mapa[chaveItem(m.tipo, m.id)]; }).filter(Boolean);
  }
  function contem(col, favoritos, tipo, id) { return membros(col, favoritos).some(function (m) { return m.tipo === tipo && m.id === id; }); }
  // Para tipos que não são versículo: devolve a nova lista de itens da coleção
  function comItem(col, tipo, id, dentro, agora) {
    var itensCol = (col.itens || []).filter(function (m) { return !(m.tipo === tipo && m.id === id); });
    if (dentro) itensCol.push({ tipo: tipo, id: id, em: agora || new Date().toISOString() });
    return itensCol;
  }
  // Remove de todas as coleções um conteúdo que foi apagado
  function semItem(colecoes, tipo, id) {
    return (colecoes || []).filter(function (c) { return (c.itens || []).some(function (m) { return m.tipo === tipo && m.id === id; }); })
      .map(function (c) { return { id: c.id, itens: c.itens.filter(function (m) { return !(m.tipo === tipo && m.id === id); }) }; });
  }
  function validarColecao(dados, existentes, idAtual) {
    var nome = String(dados.nome || '').trim().replace(/\s+/g, ' ');
    if (!nome) return { erro: 'Dê um nome à coleção.' };
    if (nome.length > 40) return { erro: 'Use até 40 caracteres no nome.' };
    if ((existentes || []).some(function (c) { return c.id !== idAtual && norm(c.nome) === norm(nome); })) return { erro: 'Já existe uma coleção com esse nome.' };
    return { nome: nome, descricao: String(dados.descricao || '').trim().slice(0, 160), icone: ICONES_COLECAO.indexOf(dados.icone) >= 0 ? dados.icone : 'colecao' };
  }
  // Texto para compartilhar: versículos com o texto da tradução; demais conteúdos pelo título
  function textoColecao(col, resolvidos, textos, sigla) {
    var linhas = ['Coleção: ' + col.nome];
    if (col.descricao) linhas.push(col.descricao);
    linhas.push('');
    resolvidos.forEach(function (it) {
      if (it.tipo === 'versiculo') linhas.push('• ' + it.titulo + (sigla ? ' (' + sigla + ')' : '') + (textos && textos[it.id] ? ' — “' + textos[it.id] + '”' : ''));
      else if (it.tipo === 'obra') linhas.push('• ' + it.titulo + (it.obra && it.obra.autor ? ' — ' + it.obra.autor : '') + (it.obra && it.obra.fonte && it.obra.fonte.url ? ' (' + it.obra.fonte.url + ')' : ''));
      else linhas.push('• ' + TIPOS[it.tipo].nome + ': ' + it.titulo + (it.ref ? ' (' + it.ref + ')' : ''));
    });
    linhas.push('', '— Biblioteca do ATOS 2');
    return linhas.join('\n');
  }

  var API = { TIPOS: TIPOS, COLECIONAVEIS: COLECIONAVEIS, ehFavObra: ehFavObra, favVersiculos: favVersiculos, ICONES_COLECAO: ICONES_COLECAO, SUGESTOES: SUGESTOES, norm: norm, chaveItem: chaveItem,
    itens: itens, contagens: contagens, ordenar: ordenar, naRef: naRef, pesquisar: pesquisar,
    membros: membros, resolver: resolver, contem: contem, comItem: comItem, semItem: semItem, validarColecao: validarColecao, textoColecao: textoColecao };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Biblioteca = API;
})(typeof window !== 'undefined' ? window : this);
