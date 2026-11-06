// ATOS 2 — monta o banco de perguntas (app/quiz/*.json) a partir de ferramentas/quiz/fontes/*.js
// e confere cada pergunta no texto da Bíblia Livre. Uso: node ferramentas/quiz/gerar.js [--checar]
'use strict';
const fs = require('fs'), path = require('path');
const B = require('../../test/biblia-node.js');
const S = require('../../app/js/nucleo/busca.js');
const R = require('../../app/js/nucleo/referencias.js');
const Q = require('../../app/js/nucleo/quiz.js');
const A = require('../../app/js/nucleo/assistente.js');
const temaLivro = id => { const i = A.INTRODUCOES[id]; return i ? ' Tema do livro de ' + LIVROS[POS[id]].nome + ': ' + i.tema.replace(/\.$/, '') + '.' : ''; };

const RAIZ = path.join(__dirname, '..', '..');
const SAIDA = path.join(RAIZ, 'app', 'quiz');
const norm = s => S.normalizar(String(s)).replace(/\s+/g, ' ').trim();
const LIVROS = B.indice.livros, POS = {}; LIVROS.forEach((l, i) => { POS[l.id] = i; });
const nomeLivro = id => LIVROS[POS[id]].nome;
const erros = [], avisos = [];

function interp(ref) { const r = R.interpretar(ref, B.contagem); if (!r.ok) throw new Error('referência inválida: ' + ref + ' — ' + r.erro); return r.ref; }
function textoDe(ref) { const r = typeof ref === 'string' ? interp(ref) : ref; return R.versiculosDa(r, B.contagem).map(([l, c, v]) => B.plano(B.texto(l, c, v))).join(' '); }
function fmtRef(r) { return R.formatar(r); }

// todos os versículos normalizados (para conferir se um trecho é único)
const TODOS = [];
for (const l of LIVROS) B.livro(l.id).caps.forEach((c, ci) => c.forEach((t, vi) => TODOS.push({ l: l.id, c: ci + 1, v: vi + 1, n: norm(B.plano(t)) })));
function ondeAparece(trecho) { const t = norm(trecho); return TODOS.filter(x => x.n.includes(t)); }

function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function escolher(lista, n, seed) { const a = lista.slice(); let h = hash(seed); const out = []; while (a.length && out.length < n) { h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; out.push(a.splice(h % a.length, 1)[0]); } return out; }

function conferirChave(ref, chave, id) {
  if (!chave) { erros.push(id + ': sem chave de conferência'); return; }
  const t = norm(textoDe(ref));
  for (const k of chave.split(';')) {
    if (k.startsWith('#caps=')) { const r = interp(ref); if (B.contagem(r.livro).length !== +k.slice(6)) erros.push(`${id}: ${ref} não tem ${k.slice(6)} capítulos`); continue; }
    if (k.startsWith('#ordem=')) { const r = interp(ref); if (LIVROS[POS[k.slice(7)] + 1].id !== r.livro) erros.push(`${id}: ordem errada`); continue; }
    if (!k.split('|').some(alt => t.includes(norm(alt)))) erros.push(`${id} ${ref}: “${k}” não está no texto — ${t.slice(0, 200)}`);
  }
}

const banco = [], porId = {}, textos = new Map();
function adicionar(o) {
  const r = interp(o.ref);
  const x = {
    id: o.id, secao: o.secao || Q.secaoDoLivro(r.livro), tema: o.tema, dificuldade: o.dificuldade, formato: o.formato,
    pergunta: o.pergunta.trim(), opcoes: o.opcoes, certa: o.certa, resposta: o.opcoes[o.certa],
    ref: fmtRef(r), livro: r.livro, capitulo: r.cap, versiculo: r.v1 || 1, explicacao: o.explicacao.trim()
  };
  if (o.chave) x.chave = o.chave;
  if (o.conferir) x.conferir = o.conferir;
  const id = x.id;
  if (porId[id]) erros.push('id repetido: ' + id);
  if (!Q.tema(x.tema)) erros.push(id + ': tema desconhecido ' + x.tema);
  if (!(x.dificuldade >= 1 && x.dificuldade <= 4)) erros.push(id + ': dificuldade ' + x.dificuldade);
  const nOps = x.formato === 'vf' ? 2 : 4;
  if (x.opcoes.length !== nOps) erros.push(`${id}: ${x.opcoes.length} opções`);
  if (new Set(x.opcoes.map(norm)).size !== x.opcoes.length) erros.push(id + ': opções repetidas ' + JSON.stringify(x.opcoes));
  if (x.explicacao.length < 20) erros.push(id + ': explicação curta');
  const chaveTexto = norm(x.pergunta).replace(/[^a-z0-9 ]/g, '');
  if (textos.has(chaveTexto)) erros.push(`${id}: pergunta repetida de ${textos.get(chaveTexto)}`); else textos.set(chaveTexto, id);
  if (o.chave) conferirChave(o.ref, o.chave, id);
  (o.conferir || []).forEach(c => conferirChave(c.ref, c.chave, id));
  if (!Q.valida(x)) erros.push(id + ': formato inválido');
  porId[id] = x; banco.push(x);
  return x;
}

// ---------------------------------------------------------------- API das fontes
function api(prefixo) {
  let n = 0;
  const novoId = () => { if (!prefixo) throw new Error('fonte sem prefixo'); return prefixo + (++n); };
  const base = (formato, tema, dificuldade, pergunta, opcoes, ref, chave, explicacao, certa) =>
    adicionar({ id: novoId(), formato, tema, dificuldade, pergunta, opcoes, certa: certa || 0, ref, chave, explicacao });
  const q = (tema, dif, p, ops, ref, chave, expl) => base('multipla', tema, dif, p, ops, ref, chave, expl);
  q.orig = (id, tema, dif, p, ops, ref, chave, expl) =>
    adicionar({ id, formato: /^Quem (disse|respondeu|perguntou|exclamou|orou|escreveu)/.test(p) ? 'identifique' : 'multipla', tema, dificuldade: dif, pergunta: p, opcoes: ops, certa: 0, ref, chave, explicacao: expl });
  q.vf = (tema, dif, afirmacao, verdadeiro, ref, chave, expl) => base('vf', tema, dif, afirmacao, ['Verdadeiro', 'Falso'], ref, chave, expl, verdadeiro ? 0 : 1);
  q.quem = (tema, dif, pistas, ops, ref, chave, expl) => base('quem-sou-eu', tema, dif, /\?$/.test(pistas.trim()) ? pistas : pistas.trim() + ' Quem sou eu?', ops, ref, chave, expl);
  q.disse = (tema, dif, p, ops, ref, chave, expl) => base('identifique', tema, dif, p, ops, ref, chave, expl);
  /** Relacione: 3 pares [esquerda, direita, ref, chave]; distratores = outras combinações. */
  q.rel = (tema, dif, enunciado, pares, expl) => {
    const L = pares.map(p => p[0]), Rr = pares.map(p => p[1]);
    const comb = ord => ord.map((j, i) => L[i] + ' → ' + Rr[j]).join(' · ');
    const opcoes = [comb([0, 1, 2]), comb([1, 2, 0]), comb([2, 0, 1]), comb([1, 0, 2])];
    return adicionar({ id: novoId(), formato: 'relacione', tema, dificuldade: dif, pergunta: enunciado, opcoes, certa: 0, ref: pares[0][2],
      conferir: pares.map(p => ({ ref: p[2], chave: p[3] })), explicacao: expl });
  };
  /** Complete o versículo: a palavra some do texto real da Bíblia Livre. */
  q.complete = (ref, palavra, distratores, o) => {
    o = o || {};
    const r = interp(ref), t = textoDe(r), id = 'cv-' + r.livro + '-' + r.cap + '-' + r.v1;
    const base = o.trecho ? o.trecho : t;
    if (o.trecho && !norm(t).includes(norm(o.trecho))) erros.push(id + ': trecho não está no versículo');
    const re = new RegExp('(^|[^\\p{L}])(' + palavra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=$|[^\\p{L}])', 'giu');
    const achados = [...base.matchAll(re)];
    if (achados.length !== 1) { erros.push(`${id}: “${palavra}” aparece ${achados.length} vez(es) em ${ref} — ${base}`); return; }
    const lacuna = base.replace(re, (m, a) => a + '______');
    const certa = achados[0][2];
    return adicionar({ id, formato: 'complete', tema: o.tema || 'geral', dificuldade: o.dif || 2, pergunta: 'Complete o versículo: “' + lacuna + '”',
      opcoes: [certa].concat(distratores), certa: 0, ref, chave: palavra,
      explicacao: (o.contexto ? o.contexto + ' ' : '') + 'A palavra que completa o texto é “' + certa + '”. ' + fmtRef(r) + ': “' + t.trim() + '”' });
  };
  const VIZINHOS = { atos: ['LUK', 'JHN', 'ROM', 'GAL'], apocalipse: ['DAN', 'EZK', 'ZEC', 'JUD', '1JN', 'ISA'] };
  /** Em qual livro: o trecho precisa aparecer só naquele livro. */
  q.livro = (ref, o) => {
    o = o || {};
    const r = interp(ref), t = o.trecho || textoDe(r), id = 'ql-' + r.livro + '-' + r.cap + '-' + r.v1;
    if (o.trecho && !norm(textoDe(r)).includes(norm(o.trecho))) erros.push(id + ': trecho não está no versículo');
    const outros = ondeAparece(t).filter(x => x.l !== r.livro);
    if (outros.length) { erros.push(`${id}: o trecho também aparece em ${outros.map(x => x.l + ' ' + x.c + ':' + x.v).join(', ')}`); return; }
    const sec = Q.secao(Q.secaoDoLivro(r.livro));
    let cand = o.distratores || sec.livros.filter(l => l !== r.livro);
    if (cand.length < 3) cand = cand.concat(VIZINHOS[sec.id] || []);
    const dis = o.distratores || escolher(cand, 3, id);
    return adicionar({ id, formato: 'qual-livro', tema: o.tema || 'geral', dificuldade: o.dif || 2, pergunta: 'Em qual livro da Bíblia está escrito: “' + t.trim() + '”?',
      opcoes: [nomeLivro(r.livro)].concat(dis.map(nomeLivro)), certa: 0, ref, chave: t.split(/\s+/).slice(0, 6).join(' '),
      explicacao: (o.contexto ? o.contexto + ' ' : '') + 'O texto está em ' + fmtRef(r) + '.' + temaLivro(r.livro) });
  };
  /** Qual é a referência: o trecho precisa ser único na Bíblia; distratores são versículos vizinhos que não o contêm. */
  q.ref = (ref, o) => {
    o = o || {};
    const r = interp(ref), t = o.trecho || textoDe(r), id = 'rf-' + r.livro + '-' + r.cap + '-' + r.v1;
    const onde = ondeAparece(t);
    if (onde.length !== 1 || onde[0].l !== r.livro || onde[0].c !== r.cap || onde[0].v !== r.v1) { erros.push(`${id}: o trecho não é exclusivo de ${ref} (${onde.map(x => x.l + x.c + ':' + x.v).join(', ')})`); return; }
    const cont = B.contagem(r.livro), sec = Q.secao(Q.secaoDoLivro(r.livro));
    const existe = (l, c, v) => B.contagem(l)[c - 1] >= v;
    const cand1 = [r.v1 + 1, r.v1 - 1, r.v1 + 2, r.v1 - 2, r.v1 + 3].filter(v => v >= 1 && v <= cont[r.cap - 1]).map(v => [r.livro, r.cap, v]);
    const cand2 = [r.cap + 1, r.cap - 1, r.cap + 2, r.cap - 2].filter(c => c >= 1 && c <= cont.length && existe(r.livro, c, r.v1)).map(c => [r.livro, c, r.v1]);
    const cand3 = sec.livros.concat(VIZINHOS[sec.id] || []).filter(l => l !== r.livro && existe(l, r.cap, r.v1)).map(l => [l, r.cap, r.v1]);
    const ok = x => !norm(B.plano(B.texto(x[0], x[1], x[2]))).includes(norm(t));
    const pegar = (lista, seed) => escolher(lista.filter(ok), 1, seed);
    let dis = [].concat(pegar(cand1, id + 'a'), pegar(cand2, id + 'b'), pegar(cand3, id + 'c'));
    const longe = [];
    for (let c = 1; c <= cont.length; c++) for (const v of [1, r.v1, cont[c - 1]]) if (v <= cont[c - 1] && !(c === r.cap && v === r.v1)) longe.push([r.livro, c, v]);
    const chave = x => x.join(':'), usados = new Set(dis.map(chave));
    if (dis.length < 3) dis = dis.concat(escolher(cand1.concat(cand2, longe).filter(ok).filter(x => !usados.has(chave(x))).filter((x, i, a) => a.findIndex(y => chave(y) === chave(x)) === i), 3 - dis.length, id + 'd'));
    const f = x => fmtRef({ livro: x[0], cap: x[1], v1: x[2] });
    return adicionar({ id, formato: 'referencia', tema: o.tema || 'geral', dificuldade: o.dif || 3, pergunta: 'Qual é a referência deste versículo: “' + t.trim() + '”?',
      opcoes: [fmtRef(r)].concat(dis.map(f)), certa: 0, ref, chave: t.split(/\s+/).slice(0, 6).join(' '),
      explicacao: (o.contexto ? o.contexto + ' ' : '') + 'O texto citado é ' + fmtRef(r) + '.' + temaLivro(r.livro) });
  };
  q.capitulos = (livro, dif) => {
    const n = B.contagem(livro).length, nome = nomeLivro(livro), id = 'cap-' + livro;
    const cand = [n + 1, n - 1, n + 2, n - 2, n + 3, n + 4, n - 4, n + 6, n - 6, n + 10, n - 10, n * 2].filter(x => x > 0 && x !== n);
    const dis = escolher([...new Set(cand)], 3, id);
    const versos = B.contagem(livro).reduce((a, b) => a + b, 0);
    return adicionar({ id, formato: 'multipla', tema: 'geral', dificuldade: dif, pergunta: 'Quantos capítulos tem o livro de ' + nome + '?',
      opcoes: [String(n)].concat(dis.map(String)), certa: 0, ref: R.formatar({ livro, cap: n, v1: 1 }, true), chave: '#caps=' + n,
      explicacao: nome + ' tem ' + n + (n === 1 ? ' capítulo' : ' capítulos') + ' e ' + versos + ' versículos.' + temaLivro(livro) });
  };
  q.ordem = (livro, dif) => {
    const i = POS[livro], prox = LIVROS[i + 1].id, id = 'ord-' + livro;
    const cand = [LIVROS[i + 2], LIVROS[i - 1], LIVROS[i + 3], LIVROS[i - 2], LIVROS[i + 4], LIVROS[i - 3]].filter(Boolean).map(l => l.id).filter(l => l !== livro && l !== prox);
    const dis = cand.slice(0, 3);
    const seq = [LIVROS[i - 1], LIVROS[i], LIVROS[i + 1], LIVROS[i + 2]].filter(Boolean).map(l => l.nome).join(', ');
    return adicionar({ id, secao: Q.secaoDoLivro(livro), formato: 'multipla', tema: 'geral', dificuldade: dif, pergunta: 'Na ordem das Bíblias em português, qual livro vem logo depois de ' + nomeLivro(livro) + '?',
      opcoes: [nomeLivro(prox)].concat(dis.map(nomeLivro)), certa: 0, ref: R.formatar({ livro: prox, cap: 1, v1: 1 }, true), chave: '#ordem=' + livro,
      explicacao: 'A sequência é ' + seq + '.' });
  };
  return q;
}

// ---------------------------------------------------------------- executar
const DIR_FONTES = path.join(__dirname, 'fontes');
for (const f of fs.readdirSync(DIR_FONTES).filter(f => f.endsWith('.js')).sort()) {
  const m = require(path.join(DIR_FONTES, f));
  m.fonte(api(m.prefixo));
}

// perguntas sobre o mesmo versículo com a mesma resposta tendem a ser repetição
const parRef = {};
for (const x of banco) { if (/^(ord|cap)-/.test(x.id)) continue; const k = x.livro + x.capitulo + ':' + x.versiculo + '=' + norm(x.resposta); if (parRef[k] && x.formato !== 'relacione') avisos.push(`possível repetição: ${parRef[k]} e ${x.id} (${x.ref} → ${x.resposta})`); else parRef[k] = x.id; }

const res = Q.resumo(banco);
console.log('perguntas:', res.total, JSON.stringify(res.secoes));
console.log('dificuldades:', JSON.stringify(res.dificuldades), 'formatos:', JSON.stringify(res.formatos));
console.log('temas:', JSON.stringify(res.temas));
avisos.forEach(a => console.log('AVISO', a));
if (erros.length) { erros.forEach(e => console.log('ERRO', e)); console.log(erros.length + ' erro(s)'); process.exit(1); }
if (process.argv.includes('--checar')) process.exit(0);

fs.mkdirSync(SAIDA, { recursive: true });
const arquivos = Q.SECOES.map(s => {
  const lista = banco.filter(x => x.secao === s.id), arquivo = s.id + '.json';
  fs.writeFileSync(path.join(SAIDA, arquivo), '[\n' + lista.map(x => JSON.stringify(x)).join(',\n') + '\n]\n');
  return { secao: s.id, arquivo, total: lista.length };
});
fs.writeFileSync(path.join(SAIDA, 'indice.json'), JSON.stringify({ versao: 1, total: banco.length, fonte: 'Bíblia Livre (conferência das respostas)', arquivos, resumo: res }, null, 1) + '\n');
console.log('gravado em app/quiz/ (' + arquivos.length + ' arquivos)');
