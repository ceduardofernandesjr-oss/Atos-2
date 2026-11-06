/*
 * ATOS 2 — Dados do usuário (local primeiro, com sincronização).
 *
 * - Tudo é gravado primeiro no aparelho (IndexedDB) e aparece na hora.
 * - Quando há banco disponível, cada item vira um documento privado do usuário em
 *   data/users/<id>/<coleção:id>. Vale a alteração mais recente (A2Sinc); exclusões são marcas.
 * - Hoje o banco é o do claude.ai (prévia). Na versão de produção, o mesmo contrato é atendido pelo
 *   Supabase (ver docs/schema.sql). As telas não sabem qual banco está em uso.
 * - Conteúdo editorial (devocionais publicados, reflexões, galeria) é compartilhado e só o
 *   proprietário publica; rascunhos ficam em área visível apenas para a edição.
 */
(function (root) {
  'use strict';
  var S = root.A2Sinc;
  var BANCO = 'atos2', VERSAO = 1;
  var itens = new Map();          // chave -> {c, id, d, t, x, dev}
  var remotos = {};               // chave -> {t, dev} conhecido no servidor
  var ouvintes = [];
  var idb = null, dev = null;
  var estado = { modo: 'iniciando', tipo: null, conta: null, recuperarSenha: false, pendentes: 0, erro: null, usuario: null, dono: false, podeEditar: false, sincronizadoEm: null };
  var db = null, user = null, uidUsuario = null;
  var fila = new Map(), gravando = false, temporizador = null;
  var conteudo = { devocionais: [], rascunhos: [], reflexoes: [], galeria: [], acervo: [], acervoRevisao: [] }, ouvintesConteudo = [];

  // ---------------------------------------------------------------- IndexedDB
  function abrirIdb() {
    return new Promise(function (res) {
      try {
        var r = indexedDB.open(BANCO, VERSAO);
        r.onupgradeneeded = function () {
          var b = r.result;
          if (!b.objectStoreNames.contains('itens')) b.createObjectStore('itens', { keyPath: 'k' });
          if (!b.objectStoreNames.contains('meta')) b.createObjectStore('meta', { keyPath: 'k' });
          if (!b.objectStoreNames.contains('biblia')) b.createObjectStore('biblia', { keyPath: 'k' });
        };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { res(null); };
        r.onblocked = function () { res(null); };
      } catch (e) { res(null); }
    });
  }
  function tx(loja, modo, fn) {
    return new Promise(function (res) {
      if (!idb) return res(null);
      try {
        var t = idb.transaction(loja, modo), s = t.objectStore(loja), out = fn(s);
        t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); };
        t.onerror = t.onabort = function () { res(null); };
      } catch (e) { res(null); }
    });
  }
  function meta(k, v) {
    if (arguments.length === 1) return tx('meta', 'readonly', function (s) { return s.get(k); }).then(function (r) { return r ? r.v : undefined; });
    return tx('meta', 'readwrite', function (s) { s.put({ k: k, v: v }); });
  }

  // ---------------------------------------------------------------- API local
  function notificar(c) { ouvintes.forEach(function (fn) { try { fn(c); } catch (e) { console.error(e); } }); }
  function ouvir(fn) { ouvintes.push(fn); return function () { ouvintes = ouvintes.filter(function (x) { return x !== fn; }); }; }
  function todos(c) {
    var out = [];
    itens.forEach(function (it) { if (it.c === c && !it.x) out.push(Object.assign({ id: it.id, _t: it.t }, it.d)); });
    return out;
  }
  function obter(c, id) { var it = itens.get(S.chave(c, id)); return it && !it.x ? Object.assign({ id: it.id, _t: it.t }, it.d) : null; }
  function gravarLocal(it) { itens.set(S.chave(it.c, it.id), it); return tx('itens', 'readwrite', function (s) { s.put(Object.assign({ k: S.chave(it.c, it.id) }, it)); }); }
  function salvar(c, id, d) {
    var limpo = JSON.parse(JSON.stringify(d || {}));
    delete limpo.id; delete limpo._t;
    var it = { c: c, id: String(id), d: limpo, t: Date.now(), x: false, dev: dev };
    gravarLocal(it); enfileirar(it); notificar(c);
    return Object.assign({ id: it.id }, limpo);
  }
  function excluir(c, id) {
    var k = S.chave(c, id), velho = itens.get(k);
    if (!velho) return;
    var it = { c: c, id: String(id), d: {}, t: Date.now(), x: true, dev: dev };
    gravarLocal(it); enfileirar(it); notificar(c);
  }

  // ---------------------------------------------------------------- sincronização
  function colecaoUsuario() { return db.collection('data/users/' + uidUsuario); }
  function soLocal(c) { return String(c).charAt(0) === '_'; }   // ex.: _fotos, _rascunhoArte: ficam só no aparelho
  function enfileirar(it) {
    if (soLocal(it.c)) return;
    if (!db) { atualizarPendentes(); return; }
    fila.set(S.chave(it.c, it.id), it);
    atualizarPendentes();
    clearTimeout(temporizador);
    temporizador = setTimeout(esvaziar, 700);
  }
  function atualizarPendentes() {
    var n = 0;
    itens.forEach(function (it, k) { if (!soLocal(it.c) && S.vence(it, remotos[k]) && S.mesclar(remotos[k], it) !== 'igual') n++; });
    estado.pendentes = n; notificar('_estado');
  }
  async function esvaziar() {
    if (gravando || !db) return;
    gravando = true;
    try {
      while (fila.size) {
        var k = fila.keys().next().value, it = fila.get(k);
        fila.delete(k);
        var atual = itens.get(k);
        if (!atual || atual !== it) { if (atual && !fila.has(k)) fila.set(k, atual); continue; }
        try {
          await colecaoUsuario().doc(S.idDoc(it.c, it.id)).set({ c: it.c, id: it.id, d: it.d, t: it.t, x: !!it.x, dev: it.dev });
          remotos[k] = { t: it.t, dev: it.dev };
        } catch (e) {
          if (e && e.code === 'unavailable') { fila.set(k, it); await espera(1500 + Math.random() * 1500); continue; }
          if (e && e.code === 'quota_exceeded') { estado.erro = 'O espaço de sincronização está cheio. Seus dados continuam neste aparelho.'; }
          else if (e && (e.code === 'invalid_argument')) { estado.erro = 'Sua conta não tem permissão para salvar na nuvem desta prévia. Seus dados ficam neste aparelho.'; desligarSync(); }
          else if (e && (e.code === 'revoked' || e.code === 'not_granted' || e.code === 'capability_disabled')) { desligarSync(); }
          console.warn('sincronização', e);
          break;
        }
      }
      estado.sincronizadoEm = Date.now();
    } finally { gravando = false; atualizarPendentes(); }
  }
  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function desligarSync() { db = null; estado.modo = 'local'; notificar('_estado'); }

  function aplicarRemoto(doc) {
    var r = doc.data(); if (!r || !r.c || r.id == null) return null;
    var k = S.chave(r.c, r.id);
    remotos[k] = { t: r.t, dev: r.dev };
    var local = itens.get(k), q = S.mesclar(local, r);
    if (q === 'remoto') { gravarLocal({ c: r.c, id: String(r.id), d: r.d || {}, t: r.t, x: !!r.x, dev: r.dev }); return r.c; }
    if (q === 'local' && local) fila.set(k, local);
    return null;
  }

  // Fonte do banco: claude.ai (prévia) ou Supabase (versão publicada, A2Nuvem)
  var cancelarSnap = null, bancoConteudo = null, ouvindoConta = false;
  async function fonte() {
    if (root.claude && root.claude.use) {
      var u = await root.claude.use('user'), b = await root.claude.use('db');
      return { tipo: 'claude', user: u, db: b, conteudo: b };
    }
    if (root.A2Nuvem && root.A2Nuvem.configurado()) {
      await root.A2Nuvem.iniciar();
      if (!ouvindoConta) {
        ouvindoConta = true;
        root.A2Nuvem.ouvirConta(function (evento, trocou) {
          if (evento === 'PASSWORD_RECOVERY') { estado.recuperarSenha = true; notificar('_estado'); }
          if (trocou) reconectar(); else { atualizarConta(); notificar('_estado'); }
        });
      }
      var logado = !!root.A2Nuvem.conta();
      return { tipo: 'nuvem', user: logado ? root.A2Nuvem.usuario : null, db: logado ? root.A2Nuvem.banco : null, conteudo: root.A2Nuvem.banco };
    }
    return null;
  }
  function atualizarConta() {
    estado.conta = root.A2Nuvem && root.A2Nuvem.conta ? root.A2Nuvem.conta() : null;
    if (estado.tipo === 'nuvem') {
      estado.dono = !!(estado.conta && estado.conta.papel === 'administrador');
      estado.podeEditar = !!(estado.conta && (estado.conta.papel === 'editor' || estado.conta.papel === 'administrador'));
    }
  }
  function reconectar() {
    if (cancelarSnap) { try { cancelarSnap(); } catch (e) {} cancelarSnap = null; }
    db = null; user = null; uidUsuario = null; fila.clear();
    estado.usuario = null; estado.dono = false; estado.podeEditar = false; estado.erro = null; remotos = {};
    conectar();
  }

  async function conectar() {
    try {
      var f = await fonte();
      if (!f) { estado.modo = 'local'; notificar('_estado'); return; }
      estado.tipo = f.tipo; bancoConteudo = f.conteudo || null;
      user = f.user; db = f.db;
      if (f.tipo === 'nuvem') atualizarConta();
      if (user) {
        try { estado.dono = !!(user.isOwner && user.isOwner()); } catch (e) {}
        try { estado.podeEditar = !!(user.canEdit && user.canEdit()); } catch (e) {}
        try { uidUsuario = await user.id(); } catch (e) { uidUsuario = null; }
      }
      if (!db || !uidUsuario) { db = null; estado.modo = 'local'; notificar('_estado'); assinarConteudo(); return; }
      // outro usuário neste navegador: não mistura dados
      var anterior = await meta('usuario');
      if (anterior && anterior !== uidUsuario) { itens.clear(); await tx('itens', 'readwrite', function (s) { s.clear(); }); notificar('*'); }
      await meta('usuario', uidUsuario);
      estado.usuario = uidUsuario; estado.modo = 'conectando'; notificar('_estado');
      var limite = setTimeout(function () { if (estado.modo === 'conectando') { estado.modo = 'offline'; notificar('_estado'); } }, 10000);
      cancelarSnap = colecaoUsuario().onSnapshot(function (snap) {
        var mudou = {};
        snap.docChanges().forEach(function (ch) { if (ch.type !== 'removed') { var c = aplicarRemoto(ch.doc); if (c) mudou[c] = 1; } });
        if (!snap.metadata.fromCache) { clearTimeout(limite); estado.modo = 'sincronizado'; estado.sincronizadoEm = Date.now(); estado.erro = null; }
        // envia o que só existe aqui
        itens.forEach(function (it, k) { if (!soLocal(it.c) && S.vence(it, remotos[k]) && S.mesclar(remotos[k], it) !== 'igual') fila.set(k, it); });
        if (fila.size) { clearTimeout(temporizador); temporizador = setTimeout(esvaziar, 300); }
        atualizarPendentes();
        Object.keys(mudou).forEach(notificar);
      }, function (e) {
        clearTimeout(limite);
        estado.modo = 'offline'; estado.erro = 'Não foi possível sincronizar agora. Seus dados continuam neste aparelho.';
        notificar('_estado'); console.warn(e);
      });
      assinarConteudo();
    } catch (e) { console.warn(e); estado.modo = 'local'; estado.erro = estado.tipo === 'nuvem' ? 'Não foi possível conectar à conta agora. Seus dados continuam neste aparelho.' : null; notificar('_estado'); }
  }
  // sem internet ao abrir: tenta de novo quando a conexão voltar
  window.addEventListener('online', function () { if (estado.tipo === 'nuvem' && (estado.modo === 'offline' || (estado.modo === 'local' && estado.conta))) reconectar(); });

  // ---------------------------------------------------------------- conteúdo editorial compartilhado
  var CAMINHOS = { devocionais: 'pub/conteudo/devocionais', reflexoes: 'pub/conteudo/reflexoes', galeria: 'pub/conteudo/galeria', rascunhos: 'editorial/rascunhos/devocionais',
    acervo: 'pub/conteudo/acervo', acervoRevisao: 'editorial/rascunhos/acervo' };
  var SO_EDICAO = { rascunhos: 1, acervoRevisao: 1 };
  var cancelarConteudo = [];
  async function assinarConteudo() {
    var banco = bancoConteudo || db;
    if (!banco) return;
    cancelarConteudo.splice(0).forEach(function (f) { try { if (typeof f === 'function') f(); } catch (e) {} });
    Object.keys(CAMINHOS).forEach(function (nome) {
      if (SO_EDICAO[nome] && !estado.dono && !estado.podeEditar) return;
      try {
        cancelarConteudo.push(banco.collection(CAMINHOS[nome]).onSnapshot(function (snap) {
          conteudo[nome] = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
          ouvintesConteudo.forEach(function (fn) { fn(nome); });
        }, function (e) { console.warn('conteúdo', nome, e); }));
      } catch (e) { console.warn(e); }
    });
    root.__dbConteudo = banco;
  }
  function ouvirConteudo(fn) { ouvintesConteudo.push(fn); return function () { ouvintesConteudo = ouvintesConteudo.filter(function (x) { return x !== fn; }); }; }
  async function gravarConteudo(nome, id, dados) {
    var banco = root.__dbConteudo; if (!banco) throw new Error('Banco indisponível nesta visualização.');
    var ref = banco.collection(CAMINHOS[nome]).doc(id);
    if (dados === null) return ref.delete();
    return ref.set(dados);
  }

  // ---------------------------------------------------------------- cache da Bíblia (leitura sem internet)
  function bibliaGet(k) { return tx('biblia', 'readonly', function (s) { return s.get(k); }).then(function (r) { return r ? r.v : null; }); }
  function bibliaPut(k, v) { return tx('biblia', 'readwrite', function (s) { s.put({ k: k, v: v }); }); }
  function bibliaChaves() { return tx('biblia', 'readonly', function (s) { return s.getAllKeys(); }).then(function (r) { return r || []; }); }

  async function iniciar() {
    idb = await abrirIdb();
    dev = await meta('aparelho');
    if (!dev) { dev = UI.uid().slice(0, 10); await meta('aparelho', dev); }
    var lista = await tx('itens', 'readonly', function (s) { return s.getAll(); });
    (lista || []).forEach(function (it) { itens.set(it.k, { c: it.c, id: it.id, d: it.d, t: it.t, x: it.x, dev: it.dev }); });
    estado.modo = idb ? 'local' : 'memoria';
    conectar();                    // não espera: o app abre com os dados do aparelho
  }

  function exportar() {
    var out = {};
    itens.forEach(function (it) { if (!it.x && !soLocal(it.c)) (out[it.c] = out[it.c] || {})[it.id] = it.d; });
    return { app: 'ATOS 2', exportadoEm: new Date().toISOString(), dados: out };
  }
  async function apagarAparelho() {
    itens.clear(); await tx('itens', 'readwrite', function (s) { s.clear(); }); notificar('*');
  }

  root.Dados = { iniciar: iniciar, todos: todos, obter: obter, salvar: salvar, excluir: excluir, ouvir: ouvir, estado: estado,
    conteudo: conteudo, ouvirConteudo: ouvirConteudo, gravarConteudo: gravarConteudo, exportar: exportar, apagarAparelho: apagarAparelho,
    bibliaGet: bibliaGet, bibliaPut: bibliaPut, bibliaChaves: bibliaChaves, meta: meta, reconectar: reconectar };
})(window);
