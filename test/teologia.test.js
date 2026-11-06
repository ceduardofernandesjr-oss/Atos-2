// ATOS 2 — doutrinas e idiomas originais: referências conferidas no texto e dados alinhados.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const R = require('../app/js/nucleo/referencias.js');
const S = require('../app/js/nucleo/busca.js');
const D = require('../app/js/nucleo/doutrinas.js');
const O = require('../app/js/nucleo/originais.js');
const B = require('./biblia-node.js');
const interp = s => R.interpretar(s, B.contagem);
const texto = s => { const r = interp(s); assert.ok(r.ok, s + ': ' + r.erro); return S.normalizar(R.versiculosDa(r.ref, B.contagem).map(([b, c, v]) => B.plano(B.texto(b, c, v))).join(' ')); };
const ORIG = path.join(__dirname, '..', 'app', 'originais');
const lex = { G: JSON.parse(fs.readFileSync(path.join(ORIG, 'lexico-g.json'))), H: JSON.parse(fs.readFileSync(path.join(ORIG, 'lexico-h.json'))) };

test('Doutrinas: estrutura completa e passagens conferidas na Bíblia Livre', () => {
  assert.ok(D.DOUTRINAS.length >= 19);
  const falhas = [];
  for (const d of D.DOUTRINAS) {
    assert.ok(D.GRUPOS.includes(d.grupo), d.id);
    for (const k of ['definicao', 'contexto', 'conclusao']) assert.ok(d[k] && d[k].length > 60, d.id + ' ' + k);
    assert.ok(d.p.length >= 5 && d.leituras.length >= 2 && d.objecoes.length >= 1, d.id);
    assert.match(d.conclusao, /Explícito no texto/, d.id + ': conclusão separa texto de interpretação');
    for (const [ref, chave] of d.p) { const t = texto(ref); if (!chave.split('|').some(c => t.includes(S.normalizar(c)))) falhas.push(`${d.id} ${ref}: “${chave}” — ${t.slice(0, 120)}`); }
    for (const l of d.leituras) { assert.ok(l.nome && l.quem && l.resumo, d.id); l.textos.forEach(texto); }
    for (const s of d.termos) assert.ok(O.TERMOS[s] && (lex[s[0]][s] || Object.keys(lex[s[0]]).some(k => O.base(k) === s)), d.id + ' termo ' + s);
  }
  assert.deepEqual(falhas, []);
  assert.deepEqual(D.procurar('o dízimo é obrigatório para o cristão?', S.normalizar).map(d => d.id).slice(0, 1), ['dizimos']);
  assert.deepEqual(D.procurar('quem morre vai direto para o céu?', S.normalizar).map(d => d.id).includes('ceu-inferno'), true);
});

test('Originais: todos os versículos (exceto poucos documentados) têm o texto original', () => {
  const sem = [];
  for (const l of B.indice.livros) {
    const o = JSON.parse(fs.readFileSync(path.join(ORIG, l.id + '.json')));
    l.versos.forEach((n, c) => { for (let v = 1; v <= n; v++) if (!o.v[(c + 1) + ':' + v]) sem.push(l.id + ' ' + (c + 1) + ':' + v); });
  }
  assert.ok(sem.length <= 10, sem.join(', '));
});

test('Originais: palavras conferidas e explicações ligadas ao léxico certo', () => {
  const jo = JSON.parse(fs.readFileSync(path.join(ORIG, 'JHN.json'))).v['3:16'];
  assert.ok(jo.some(w => w[2] === 'G0025' && w[0].includes('ἠγάπησεν') && w[3] === 'V-AAI-3S'));
  const gn = JSON.parse(fs.readFileSync(path.join(ORIG, 'GEN.json'))).v['1:1'];
  assert.deepEqual(gn.map(w => w[2]).slice(0, 3), ['H7225G', 'H1254A', 'H0430G']);
  const morf = JSON.parse(fs.readFileSync(path.join(ORIG, 'morfologia.json')));
  assert.equal(morf['V-AAI-3S'], 'verbo, aoristo, voz ativa, indicativo, 3ª pessoa, singular');
  assert.match(morf['HVqp3ms'], /^verbo, tronco Qal/);
  const lemas = { G0025: 'ἀγαπάω', G4102: 'πίστις', G5485: 'χάρις', G3056: 'λόγος', H2617: 'חֶ֫סֶד', H7965: 'שָׁלוֹם', H3068: 'יְהֹוָה', H3820: 'לֵב' };
  for (const [s, lema] of Object.entries(lemas)) {
    const k = Object.keys(lex[s[0]]).find(x => O.base(x) === s);
    assert.ok(k, s); assert.equal(lex[s[0]][k][0], lema, s);
  }
  for (const s of Object.keys(O.TERMOS)) assert.ok(Object.keys(lex[s[0]]).some(k => O.base(k) === s), 'termo sem léxico: ' + s);
  const p = O.palavras({ v: { '3:16': jo } }, 3, 16, morf);
  assert.equal(p[2].morfologia, 'verbo, aoristo, voz ativa, indicativo, 3ª pessoa, singular');
  for (const r of lex.G.G0025[5]) assert.ok(interp(r.replace(/^(\w+) /, (m, l) => R.POR_ID[l].abrev + ' ')).ok, r);
});
