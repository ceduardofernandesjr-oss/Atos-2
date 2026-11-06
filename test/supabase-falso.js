// Supabase falso para testes: o navegador recebe um cliente com a mesma API usada por js/nuvem.js;
// os dados ficam no Node (compartilhados entre abas), com regras equivalentes às do banco (RLS).
const crypto = require('crypto');
function criarServidor() {
  const usuarios = [{ id: 'u-teste', email: 'teste@atos2.invalid', senha: 'Senha123teste', nome: 'Teste', papel: 'leitor', confirmado: true }];
  const docs = new Map(), conteudo = new Map(), sessoes = new Map(), inscritos = [];
  function uid(page) { const s = sessoes.get(page); return s && s.user.id; }
  async function avisar(tabela, linha) {
    for (const i of inscritos.slice()) {
      if (i.tabela !== tabela) continue;
      const [campo, val] = i.filtro.replace('=eq.', '=').split('=');
      if (String(linha[campo]) !== val) continue;
      if (tabela === 'documentos_usuario' && uid(i.page) !== linha.usuario_id) continue;
      try { await i.page.evaluate(([id, l]) => window.__sbEvento && window.__sbEvento(id, l), [i.id, linha]); } catch (e) {}
    }
  }
  async function tratar(page, op, a) {
    const eu = uid(page);
    if (op === 'sessao') return sessoes.get(page) || null;
    if (op === 'entrar') {
      const u = usuarios.find(x => x.email === a.email);
      if (!u || u.senha !== a.senha) return { erro: 'Invalid login credentials' };
      const s = { user: { id: u.id, email: u.email, user_metadata: { nome: u.nome } }, access_token: 'tk' };
      sessoes.set(page, s); return { sessao: s };
    }
    if (op === 'cadastrar') {
      if (usuarios.some(x => x.email === a.email)) return { erro: 'User already registered' };
      usuarios.push({ id: 'u-' + crypto.randomUUID().slice(0, 8), email: a.email, senha: a.senha, nome: a.nome, papel: 'leitor', confirmado: false });
      return { sessao: null };
    }
    if (op === 'sair') { sessoes.delete(page); return {}; }
    if (op === 'consulta') {
      const f = Object.fromEntries(a.filtros);
      if (a.tabela === 'perfis') { const u = usuarios.find(x => x.id === f.id && x.id === eu); return { data: u ? { nome: u.nome, papel: u.papel } : null }; }
      if (a.tabela === 'documentos_usuario') {
        if (!eu) return { data: [] };
        const l = [...docs.values()].filter(d => d.usuario_id === eu);
        return { data: l.slice(a.range ? a.range[0] : 0, a.range ? a.range[1] + 1 : undefined) };
      }
      if (a.tabela === 'conteudo_editorial') {
        const editor = eu && ['editor', 'administrador'].includes(usuarios.find(x => x.id === eu).papel);
        if (a.acao === 'select') return { data: [...conteudo.values()].filter(c => c.area === f.area && (c.area !== 'rascunhos' || editor)) };
        if (!editor) return { erro: 'new row violates row-level security policy' };
        if (a.acao === 'upsert') { conteudo.set(a.corpo.area + ':' + a.corpo.id, a.corpo); await avisar('conteudo_editorial', a.corpo); return { data: null }; }
        if (a.acao === 'delete') { conteudo.delete(f.area + ':' + f.id); await avisar('conteudo_editorial', { area: f.area, id: f.id }); return { data: null }; }
      }
      return { erro: 'tabela desconhecida' };
    }
    if (op === 'rpc') {
      if (!eu) return { erro: 'JWT expired' };
      const k = eu + ':' + a.p_colecao + ':' + a.p_id, atual = docs.get(k);
      if (!atual || atual.t < a.p_t || (atual.t === a.p_t && (atual.dev || '') < (a.p_dev || ''))) {
        const l = { usuario_id: eu, colecao: a.p_colecao, id: a.p_id, dados: a.p_dados, t: a.p_t, dev: a.p_dev, excluido: a.p_excluido };
        docs.set(k, l); await avisar('documentos_usuario', l);
      }
      return {};
    }
    if (op === 'inscrever') { inscritos.push({ page, id: a.id, tabela: a.tabela, filtro: a.filtro }); return {}; }
    if (op === 'cancelar') { const i = inscritos.findIndex(x => x.page === page && x.id === a.id); if (i >= 0) inscritos.splice(i, 1); return {}; }
    return { erro: 'op desconhecida ' + op };
  }
  return { tratar, docs, conteudo, usuarios };
}

// Código injetado no navegador: substitui window.supabase antes de nuvem.js carregar a biblioteca
function clienteNavegador() {
  const ouvAuth = [], canais = {};
  window.__sbEvento = (id, linha) => { const c = canais[id]; if (c) c.cb({ new: linha }); };
  function q(tabela) {
    const st = { tabela, acao: 'select', filtros: [], range: null, corpo: null, unico: false };
    const b = {
      select() { return b; }, eq(c, v) { st.filtros.push([c, v]); return b; }, range(a, z) { st.range = [a, z]; return b; }, limit() { return b; },
      maybeSingle() { st.unico = true; return b; }, update(o) { st.acao = 'update'; st.corpo = o; return b; },
      upsert(o) { st.acao = 'upsert'; st.corpo = o; return b; }, delete() { st.acao = 'delete'; return b; },
      then(ok, falha) { return window.__sb('consulta', st).then(r => r.erro ? { data: null, error: { message: r.erro } } : { data: r.data, error: null }).then(ok, falha); }
    };
    return b;
  }
  let n = 0;
  window.supabase = { createClient() {
    return {
      auth: {
        getSession: async () => ({ data: { session: await window.__sb('sessao', {}) } }),
        onAuthStateChange(cb) { ouvAuth.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
        async signInWithPassword(a) { const r = await window.__sb('entrar', { email: a.email, senha: a.password }); if (r.erro) return { data: null, error: { message: r.erro } }; ouvAuth.forEach(f => f('SIGNED_IN', r.sessao)); return { data: { session: r.sessao }, error: null }; },
        async signUp(a) { const r = await window.__sb('cadastrar', { email: a.email, senha: a.password, nome: a.options.data.nome }); return r.erro ? { data: null, error: { message: r.erro } } : { data: { session: null, user: {} }, error: null }; },
        async signOut() { await window.__sb('sair', {}); ouvAuth.forEach(f => f('SIGNED_OUT', null)); return { error: null }; },
        async resetPasswordForEmail() { return { data: {}, error: null }; },
        async updateUser() { return { data: {}, error: null }; }
      },
      from: q,
      rpc: async (nome, args) => { const r = await window.__sb('rpc', args); return r.erro ? { error: { message: r.erro } } : { error: null, data: null }; },
      channel(nome) {
        const id = 'c' + (++n); let cfg = null;
        return { on(tipo, f, cb) { cfg = { tabela: f.table, filtro: f.filter, cb }; return this; }, subscribe() { canais[id] = cfg; window.__sb('inscrever', { id, tabela: cfg.tabela, filtro: cfg.filtro }); this.__id = id; return this; } };
      },
      removeChannel(c) { delete canais[c.__id]; window.__sb('cancelar', { id: c.__id }); }
    };
  } };
}
module.exports = { criarServidor, clienteNavegador };
