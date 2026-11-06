/* ATOS 2 — service worker da versão instalada: guarda os arquivos do app (nunca dados do usuário).
   A Bíblia é guardada pelo próprio app (IndexedDB) quando o usuário escolhe "Guardar a Bíblia". */
var VERSAO = 'atos2-v21';
var ARQUIVOS = ['./', 'index.html', 'css/app.css', 'css/fontes.css', 'fontes/manrope-latin-400-normal.woff2', 'fontes/manrope-latin-500-normal.woff2', 'fontes/manrope-latin-600-normal.woff2', 'fontes/manrope-latin-700-normal.woff2', 'fontes/cormorant-garamond-latin-600-normal.woff2', 'fontes/cormorant-garamond-latin-700-normal.woff2', 'fontes/literata-latin-opsz-normal.woff2', 'fontes/literata-latin-opsz-italic.woff2', 'manifest.webmanifest', 'icones/icone.svg',
  'js/nucleo/referencias.js', 'js/nucleo/conteudo.js', 'js/nucleo/planos.js', 'js/nucleo/busca.js', 'js/nucleo/arte.js', 'js/nucleo/modelos-arte.js', 'js/nucleo/sinc.js', 'js/nucleo/quiz.js', 'js/nucleo/mural.js', 'js/nucleo/assistente.js', 'js/nucleo/originais.js', 'js/nucleo/doutrinas.js', 'js/nucleo/jornada.js', 'js/nucleo/biblioteca.js', 'js/nucleo/acervo.js',
  'js/ui.js', 'js/config.js', 'js/nuvem.js', 'js/vendor/supabase.js', 'js/dados.js', 'js/biblia.js', 'js/telas/inicio.js', 'js/telas/estudo-versiculo.js', 'js/telas/leitor.js', 'js/telas/pesquisa.js', 'js/telas/fotos.js', 'js/telas/cartao.js', 
  'js/telas/arte-desenho.js', 'js/telas/estudio.js', 'js/telas/biblioteca.js', 'js/telas/acervo.js', 'acervo/catalogo.json', 'js/telas/planos.js', 'js/telas/devocionais.js', 'js/telas/perfil.js', 'js/telas/teologia.js', 'js/telas/explorar.js', 'js/telas/jornada.js', 'js/app.js',
  'biblia/blivre/indice.json', 'biblia/alm1911/indice.json', 'biblia/alm1911at/indice.json', 'biblia/onbv/indice.json'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(VERSAO).then(function (c) { return c.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSAO; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then(function (r) {
    var rede = fetch(e.request).then(function (resp) { if (resp.ok) { var cp = resp.clone(); caches.open(VERSAO).then(function (c) { c.put(e.request, cp); }); } return resp; });
    return r || rede;
  }));
});
