// Testes das traduções Almeida 1911 (ALM1911) e Biblica® Open Nova Bíblia Viva (ONBV).
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path');
const S = require('../app/js/nucleo/busca.js');
const BASE = path.join(__dirname, '..', 'app', 'biblia');
function carregar(v) {
  const ix = JSON.parse(fs.readFileSync(path.join(BASE, v, 'indice.json'), 'utf8'));
  const livros = ix.livros.map(l => Object.assign({ id: l.id }, JSON.parse(fs.readFileSync(path.join(BASE, v, l.id + '.json'), 'utf8'))));
  return { ix, livros, por: Object.fromEntries(livros.map(l => [l.id, l])) };
}
const T = { alm1911: carregar('alm1911'), alm1911at: carregar('alm1911at'), onbv: carregar('onbv'), blivre: carregar('blivre') };
const txt = (v, b, c, n) => T[v].por[b].caps[c - 1][n - 1];

for (const v of ['alm1911', 'alm1911at', 'onbv']) {
  test(v + ': 66 livros, mesmos capítulos da Bíblia Livre, índice coerente, sem versículos vazios nem marcação', () => {
    const { ix, livros } = T[v];
    assert.strictEqual(livros.length, 66);
    let total = 0;
    livros.forEach((l, i) => {
      assert.strictEqual(l.caps.length, T.blivre.livros[i].caps.length, l.id + ' capítulos');
      assert.deepStrictEqual(l.caps.map(c => c.length), ix.livros[i].versos, l.id + ' índice');
      l.caps.forEach((c, ci) => c.forEach((t, vi) => {
        total++;
        assert.ok(t && t.trim().length > 1, `${l.id} ${ci + 1}:${vi + 1} vazio`);
        assert.ok(!/[\\<>]|\|/.test(t), `${l.id} ${ci + 1}:${vi + 1} com marcação: ${t}`);
        assert.ok(!new RegExp('^\\s*' + (vi + 1) + '\\s').test(t), `${l.id} ${ci + 1}:${vi + 1} começa com o número do versículo`);
        assert.strictEqual((t.match(/\{/g) || []).length, (t.match(/\}/g) || []).length, `${l.id} ${ci + 1}:${vi + 1} chaves`);
      }));
      // notas e cabeçalhos apontam para versículos existentes e posições válidas
      for (const campo of ['notas', 'cab']) for (const k of Object.keys(l[campo] || {})) {
        const [c, n] = k.split(':').map(Number), t = (l.caps[c - 1] || [])[n - 1];
        assert.ok(t, `${l.id} ${campo} ${k} sem versículo`);
        for (const x of l[campo][k]) assert.ok(x.o >= 0 && x.o <= t.replace(/[{}]/g, '').length && x.t, `${l.id} ${campo} ${k} posição ${x.o}`);
      }
    });
    assert.strictEqual(total, 31105);
    assert.ok(ix.credito && ix.licenca && ix.alteracoes);
  });
}

test('alm1911: trechos conferidos com a edição de 1911', () => {
  assert.match(txt('alm1911', 'ACT', 2, 42).replace(/[{}]/g, ''), /perseveravam na doutrina dos apostolos/);
  assert.match(txt('alm1911', 'JHN', 3, 16).replace(/[{}]/g, ''), /Deus amou o mundo/);
  // Os 11:5 vinha colado ao v. 4 depois de uma quebra de página na fonte
  assert.ok(!/Não tornará/.test(txt('alm1911', 'HOS', 11, 4)));
  assert.ok(txt('alm1911', 'HOS', 11, 5).length > 20);
  // letras do acróstico do Salmo 119 como cabeçalhos
  const cab = T.alm1911.por.PSA.cab;
  assert.match(T.alm1911.por.PSA.titulos['119'], /Aleph/);
  assert.ok((cab['119:169'] || []).some(x => /Tau/i.test(x.t)));
  // título do salmo separado do texto
  assert.ok(T.alm1911.por.PSA.titulos['3']);
  // referências cruzadas e leituras alternativas
  const notas = Object.values(T.alm1911.por.GEN.notas).flat();
  assert.ok(notas.some(n => n.tipo === 'ref') && notas.some(n => n.tipo === 'alt'));
});

test('alm1911at: grafia atualizada sem mudar palavras, pontuação, itálicos nem versificação', () => {
  const W = /[A-Za-zÀ-ÿ’'-]+/g;
  let mudadas = 0;
  T.alm1911.livros.forEach((l, i) => {
    const n = T.alm1911at.livros[i];
    l.caps.forEach((cap, ci) => cap.forEach((t, vi) => {
      const u = n.caps[ci][vi];
      const esq = s => s.replace(/[{}]/g, '').replace(W, 'w').replace(/w( w)*/g, 'w');
      assert.strictEqual(esq(u), esq(t), `${l.id} ${ci + 1}:${vi + 1} pontuação`);
      assert.strictEqual((u.match(/\{/g) || []).length, (t.match(/\{/g) || []).length, `${l.id} ${ci + 1}:${vi + 1} itálicos`);
      if (u !== t) mudadas++;
    }));
  });
  assert.ok(mudadas > 20000, 'versículos atualizados: ' + mudadas);
  assert.strictEqual(txt('alm1911at', 'ACT', 2, 42), 'E perseveravam na doutrina dos apóstolos, e na comunhão, e no partir do pão e nas orações.');
  assert.match(txt('alm1911at', 'JHN', 3, 16), /todo aquele que nele crê/);
  assert.match(txt('alm1911at', 'ACT', 2, 38), /batizado em nome de Jesus Cristo, para perdão dos pecados; e recebereis o dom do Espírito Santo/);
  assert.match(txt('alm1911at', 'PSA', 119, 7), /^Louvar-te-ei com retidão/);
  assert.match(txt('alm1911at', 'MAT', 28, 19), /ensinai todas as nações, batizando-as em nome do Pai/);
  assert.match(txt('alm1911at', 'MAT', 1, 1), /filho de Davi, filho de Abraão/);
  // nenhuma das grafias antigas mais comuns sobrou
  const antigas = /\b(elle|elles|ella|aquelle|Christo|peccado|baptiz\w*|Egypto|tambem|Moysés|d’elle|n’elle|comnosco|sancto|propheta)\b/;
  T.alm1911at.livros.forEach(l => l.caps.forEach((c, ci) => c.forEach((t, vi) => assert.ok(!antigas.test(t), `${l.id} ${ci + 1}:${vi + 1}: ${t}`))));
  // letras do Sl 119 como na Bíblia Livre; referências com as abreviações do app
  assert.strictEqual(T.alm1911at.por.PSA.titulos['119'], 'Álefe.');
  assert.strictEqual(T.alm1911at.por.MAT.notas['1:1'][0].t, 'Lc 3:23');
  // nenhuma divisão de testamento perdida no meio de Gênesis
  assert.ok(!(T.alm1911.por.GEN.cab['1:1'] || []).some(x => /TESTAMENTO/.test(x.t)));
});

test('onbv: trechos conferidos; títulos de salmos separados do texto', () => {
  assert.match(txt('onbv', 'JHN', 3, 16), /Deus amou/);
  assert.ok(Object.keys(T.onbv.por.PSA.titulos || {}).length > 100);
  assert.ok(!/\bnd\b|\\/.test(txt('onbv', 'GEN', 2, 4)));
});

test('busca com grafia antiga: palavra de hoje encontra a forma de 1911, com destaque no lugar certo', () => {
  const casos = { cristo: /^christo$/i, batismo: /^baptismo$/i, egito: /^egypto$/i, igreja: /^egreja$/i, fariseus: /^phariseos$/i, salmo: /^psalmo$/i, ano: /^anno$/i };
  for (const [q, re] of Object.entries(casos)) {
    const r = S.pesquisar(T.alm1911.livros, q, { grafiaAntiga: true, limite: 50 });
    assert.ok(r.total > 0, q);
    assert.ok(r.resultados.every(x => S.partes(x.texto, x.trechos).filter(p => p.destaque).every(p => re.test(p.t) || S.normalizar(p.t) === q)), q);
  }
  // sem a opção, a grafia antiga não é encontrada
  assert.strictEqual(S.pesquisar(T.alm1911.livros, 'cristo', {}).total, 0);
  // expressão exata também funciona
  assert.strictEqual(S.pesquisar(T.alm1911.livros, '"jesus cristo"', { grafiaAntiga: true }).total, S.pesquisar(T.alm1911.livros, '"jesus christo"', {}).total);
  // não confunde palavras: "fato" não deve achar "facto" fora da palavra inteira, e "ele" não acha "elles"
  const ele = S.pesquisar(T.alm1911.livros, 'ele', { grafiaAntiga: true, limite: 400 });
  assert.ok(ele.resultados.every(x => x.trechos.every(([a, b]) => /^el{1,2}e$/i.test(x.texto.slice(a, b)))));
});
