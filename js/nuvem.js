/*
 * ATOS 2 — Nuvem da versão publicada (Supabase): conta (cadastro, login, recuperação de senha)
 * e um adaptador com o MESMO formato do banco da prévia do claude.ai, para que js/dados.js
 * sincronize sem saber qual banco está em uso.
 *   - data/users/<id>           → tabela documentos_usuario (função salvar_documento_usuario)
 *   - pub/conteudo/<área>       → conteudo_editorial (devocionais, reflexoes, galeria)
 *   - editorial/rascunhos/...   → conteudo_editorial (áreas rascunhos e acervo_revisao, só editores)
 *   - pub/conteudo/acervo       → conteudo_editorial (área acervo: Biblioteca › Livros e Artigos)
 * A biblioteca do Supabase só é carregada fora do claude.ai.
 */
(function (root) {
  'use strict';
  var CFG = root.ATOS2_CONFIG || {};
  var cliente = null, carregando = null, sessao = null, perfil = null, ouvintesConta = [], provedoresCache = null;

  function configurado() { return !!(CFG.supabaseUrl && CFG.supabaseChave); }
  function erroCod(error) {
    var e = new Error((error && error.message) || 'Erro no servidor.');
    var msg = String(e.message);
    e.code = /fetch|network|Load failed|timeout/i.test(msg) ? 'unavailable' : /JWT|not authorized|permission|RLS|row-level/i.test(msg) ? 'not_granted' : 'invalid_argument';
    return e;
  }

  function carregarBiblioteca() {
    if (root.supabase && root.supabase.createClient) return Promise.resolve();
    if (carregando) return carregando;
    carregando = new Promise(function (ok, falha) {
      var s = document.createElement('script');
      s.src = 'js/vendor/supabase.js'; s.onload = function () { ok(); }; s.onerror = function () { carregando = null; falha(new Error('Não foi possível carregar o módulo da conta.')); };
      document.head.appendChild(s);
    });
    return carregando;
  }

  async function iniciar() {
    if (!configurado()) return null;
    if (cliente) return cliente;
    await carregarBiblioteca();
    cliente = root.supabase.createClient(CFG.supabaseUrl, CFG.supabaseChave, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit', storageKey: 'atos2-conta' }
    });
    var r = await cliente.auth.getSession();
    sessao = r.data && r.data.session;
    if (sessao) await carregarPerfil();
    cliente.auth.onAuthStateChange(function (evento, s) {
      var antes = sessao && sessao.user && sessao.user.id;
      sessao = s;
      var depois = s && s.user && s.user.id;
      (depois ? carregarPerfil() : Promise.resolve(perfil = null)).then(function () {
        ouvintesConta.forEach(function (fn) { try { fn(evento, antes !== depois); } catch (e) { console.error(e); } });
      });
    });
    return cliente;
  }
  async function carregarPerfil() {
    if (!sessao) { perfil = null; return null; }
    var r = await cliente.from('perfis').select('nome, papel').eq('id', sessao.user.id).maybeSingle();
    perfil = r.data || { nome: null, papel: 'leitor' };
    return perfil;
  }
  function ouvirConta(fn) { ouvintesConta.push(fn); return function () { ouvintesConta = ouvintesConta.filter(function (x) { return x !== fn; }); }; }
  function conta() { return sessao ? { id: sessao.user.id, email: sessao.user.email, nome: (perfil && perfil.nome) || (sessao.user.user_metadata || {}).nome || (sessao.user.user_metadata || {}).full_name || (sessao.user.user_metadata || {}).name || '', papel: (perfil && perfil.papel) || 'leitor' } : null; }
  function enderecoApp() { return location.origin + location.pathname; }

  function mensagem(e) {
    var m = String((e && e.message) || e || '');
    if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
    if (/already registered|already been registered/i.test(m)) return 'Este e-mail já tem conta. Use “Entrar” ou “Esqueci minha senha”.';
    if (/Password should be at least|weak/i.test(m)) return 'A senha precisa ter pelo menos 8 caracteres, com letras e números.';
    if (/rate limit|too many/i.test(m)) return 'Muitas tentativas seguidas. Aguarde alguns minutos.';
    if (/invalid.*email|Unable to validate email/i.test(m)) return 'Informe um e-mail válido.';
    if (/fetch|network|Load failed/i.test(m)) return 'Sem conexão com o servidor. Verifique a internet.';
    return m || 'Não foi possível concluir agora.';
  }
  async function exec(p) { var r = await p; if (r.error) throw new Error(mensagem(r.error)); return r.data; }

  var Conta = {
    entrar: async function (email, senha) { await iniciar(); return exec(cliente.auth.signInWithPassword({ email: email, password: senha })); },
    cadastrar: async function (nome, email, senha) {
      await iniciar();
      var d = await exec(cliente.auth.signUp({ email: email, password: senha, options: { data: { nome: nome }, emailRedirectTo: enderecoApp() } }));
      return { precisaConfirmar: !d.session };
    },
    sair: async function () { await iniciar(); return exec(cliente.auth.signOut()); },
    // Login com Google (OAuth do Supabase): volta para o app já com a sessão na URL
    entrarComGoogle: async function () { await iniciar(); return exec(cliente.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: enderecoApp(), queryParams: { prompt: 'select_account' } } })); },
    // Provedores ativados no painel do Supabase (o botão do Google só aparece quando o Google está ligado)
    provedores: function () {
      if (provedoresCache) return provedoresCache;
      provedoresCache = fetch(CFG.supabaseUrl + '/auth/v1/settings', { headers: { apikey: CFG.supabaseChave } })
        .then(function (r) { if (!r.ok) throw new Error('settings ' + r.status); return r.json(); }).then(function (j) { return (j && j.external) || {}; })
        .catch(function () { provedoresCache = null; return { indisponivel: true }; });
      return provedoresCache;
    },
    recuperar: async function (email) { await iniciar(); return exec(cliente.auth.resetPasswordForEmail(email, { redirectTo: enderecoApp() })); },
    novaSenha: async function (senha) { await iniciar(); return exec(cliente.auth.updateUser({ password: senha })); },
    salvarNome: async function (nome) { if (!sessao) return; await exec(cliente.from('perfis').update({ nome: nome }).eq('id', sessao.user.id)); if (perfil) perfil.nome = nome; }
  };

  // ---------------------------------------------------------------- adaptador no formato do banco da prévia
  var AREAS = { 'pub/conteudo/devocionais': 'devocionais', 'pub/conteudo/reflexoes': 'reflexoes', 'pub/conteudo/galeria': 'galeria', 'editorial/rascunhos/devocionais': 'rascunhos',
    'pub/conteudo/acervo': 'acervo', 'editorial/rascunhos/acervo': 'acervo_revisao' };
  var contador = 0;

  function docUsuario(l) { var r = { c: l.colecao, id: l.id, d: l.dados, t: Number(l.t), x: !!l.excluido, dev: l.dev }; return { id: l.colecao + ':' + l.id, data: function () { return r; } }; }

  function colecaoUsuario() {
    return {
      doc: function () {
        return { set: async function (r) {
          var x = await cliente.rpc('salvar_documento_usuario', { p_colecao: r.c, p_id: String(r.id), p_dados: r.d || {}, p_t: r.t, p_dev: r.dev || null, p_excluido: !!r.x });
          if (x.error) throw erroCod(x.error);
        } };
      },
      onSnapshot: function (cb, falha) {
        var uid = sessao.user.id, canal = null, vivo = true;
        (async function () {
          try {
            var todos = [], de = 0;
            for (;;) {
              var r = await cliente.from('documentos_usuario').select('colecao,id,dados,t,dev,excluido').eq('usuario_id', uid).range(de, de + 999);
              if (r.error) throw erroCod(r.error);
              todos = todos.concat(r.data); if (r.data.length < 1000) break; de += 1000;
            }
            if (!vivo) return;
            cb({ docChanges: function () { return todos.map(function (l) { return { type: 'added', doc: docUsuario(l) }; }); }, metadata: { fromCache: false } });
            canal = cliente.channel('docs-' + uid + '-' + (++contador))
              .on('postgres_changes', { event: '*', schema: 'public', table: 'documentos_usuario', filter: 'usuario_id=eq.' + uid }, function (p) {
                if (!p.new || !p.new.colecao) return;
                cb({ docChanges: function () { return [{ type: 'modified', doc: docUsuario(p.new) }]; }, metadata: { fromCache: false } });
              }).subscribe();
          } catch (e) { if (falha) falha(e.code ? e : erroCod(e)); }
        })();
        return function () { vivo = false; if (canal) cliente.removeChannel(canal); };
      }
    };
  }

  function colecaoConteudo(area) {
    async function lista() {
      var r = await cliente.from('conteudo_editorial').select('id,dados').eq('area', area).limit(5000);
      if (r.error) throw erroCod(r.error);
      return r.data.map(function (l) { return { id: l.id, data: function () { return l.dados; } }; });
    }
    return {
      doc: function (id) {
        return {
          set: async function (dados) { var r = await cliente.from('conteudo_editorial').upsert({ area: area, id: String(id), dados: dados, atualizado_em: new Date().toISOString() }); if (r.error) throw erroCod(r.error); },
          delete: async function () { var r = await cliente.from('conteudo_editorial').delete().eq('area', area).eq('id', String(id)); if (r.error) throw erroCod(r.error); }
        };
      },
      onSnapshot: function (cb, falha) {
        var canal = null, vivo = true, t = null;
        function atualizar() { lista().then(function (docs) { if (vivo) cb({ docs: docs }); }, function (e) { if (falha) falha(e); }); }
        atualizar();
        canal = cliente.channel('conteudo-' + area + '-' + (++contador))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'conteudo_editorial', filter: 'area=eq.' + area }, function () { clearTimeout(t); t = setTimeout(atualizar, 300); })
          .subscribe();
        return function () { vivo = false; if (canal) cliente.removeChannel(canal); };
      }
    };
  }

  var banco = {
    collection: function (caminho) {
      if (/^data\/users\//.test(caminho)) return colecaoUsuario();
      if (AREAS[caminho]) return colecaoConteudo(AREAS[caminho]);
      throw new Error('Coleção desconhecida: ' + caminho);
    }
  };
  // "user" no formato da prévia
  var usuario = {
    id: async function () { return sessao ? sessao.user.id : null; },
    isOwner: function () { return !!perfil && perfil.papel === 'administrador'; },
    canEdit: function () { return !!perfil && (perfil.papel === 'editor' || perfil.papel === 'administrador'); }
  };

  // Jornada da Sabedoria: funções do servidor (pontos são calculados lá) e leitura de tabelas públicas
  async function rpc(nome, args) { await iniciar(); if (!sessao) throw new Error('Entre na sua conta para registrar seus pontos.'); return exec(cliente.rpc(nome, args || {})); }
  async function tabela(nome, filtro) { await iniciar(); var q = cliente.from(nome).select('*'); if (filtro) Object.keys(filtro).forEach(function (k) { q = q.eq(k, filtro[k]); }); return exec(q); }

  root.A2Nuvem = { rpc: rpc, tabela: tabela, configurado: configurado, iniciar: iniciar, conta: conta, ouvirConta: ouvirConta, Conta: Conta, banco: banco, usuario: usuario, mensagem: mensagem };
})(window);
