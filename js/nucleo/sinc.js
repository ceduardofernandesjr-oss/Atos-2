/*
 * ATOS 2 — Regras de sincronização (funções puras).
 * Navegador: window.A2Sinc · Node: module.exports
 * Cada item: { c: coleção, id, d: dados, t: atualizado em (ms), x: excluído (marca), dev: aparelho }
 * Vale a alteração mais recente; empate é decidido pelo aparelho, para todos chegarem ao mesmo resultado.
 */
(function (root) {
  'use strict';
  function chave(c, id) { return c + ':' + id; }
  function vence(a, b) {           // true se "a" deve prevalecer sobre "b"
    if (!b) return true;
    if (!a) return false;
    if (a.t !== b.t) return a.t > b.t;
    return String(a.dev || '') > String(b.dev || '');
  }
  // Mescla um item remoto no mapa local; devolve 'remoto' | 'local' | 'igual'
  function mesclar(local, remoto) {
    if (!remoto) return 'local';
    if (local && local.t === remoto.t && String(local.dev || '') === String(remoto.dev || '')) return 'igual';
    return vence(remoto, local) ? 'remoto' : 'local';
  }
  // Itens locais que ainda precisam subir (mais novos que a versão remota conhecida)
  function pendentes(locais, remotos) {
    var out = [];
    Object.keys(locais).forEach(function (k) { if (vence(locais[k], remotos[k]) && mesclar(remotos[k], locais[k]) !== 'igual') out.push(k); });
    return out;
  }
  // Id de documento válido para o banco do claude.ai (letras, dígitos e _ - . ~ : @ +)
  function idDoc(c, id) { return (c + ':' + id).replace(/[^A-Za-z0-9_\-.~:@+]/g, '_').slice(0, 190); }
  var API = { chave: chave, vence: vence, mesclar: mesclar, pendentes: pendentes, idDoc: idDoc };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Sinc = API;
})(typeof window !== 'undefined' ? window : this);
