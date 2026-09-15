/* ============================================================
   Vegas — Ficha de admissão / comunicação com a planilha
   O Apps Script não aceita preflight de CORS, por isso o corpo
   vai como text/plain e a ação viaja dentro do próprio JSON.
   ============================================================ */

window.API = {

  url: function () {
    return (window.ADM_CONFIG && window.ADM_CONFIG.url) || localStorage.getItem('adm_url') || '';
  },

  /* Atalho opcional: chave escrita em js/chave.js entra sem login.
     Em branco, o painel pede usuário e senha. */
  chaveFixa: function () { return (window.ADM_CHAVE || '').trim(); },

  /* O token devolvido pelo login é a própria chave do RH. Ele fica
     na sessão do navegador, e some quando a aba fecha. */
  sessao: function () {
    try { return JSON.parse(sessionStorage.getItem('adm_sessao')) || null; }
    catch (e) { return null; }
  },
  abrirSessao: function (s) { sessionStorage.setItem('adm_sessao', JSON.stringify(s)); },
  fecharSessao: function () { sessionStorage.removeItem('adm_sessao'); },

  chaveRh: function () {
    var s = this.sessao();
    return this.chaveFixa() || (s && s.token) || '';
  },
  quem: function () {
    var s = this.sessao();
    return this.chaveFixa() ? '' : (s ? (s.nome || s.usuario) : '');
  },
  guardarUrl: function (u) { localStorage.setItem('adm_url', u.trim()); },

  configurada: function () { return !!this.url(); },
  autenticado: function () { return !!(this.url() && this.chaveRh()); },

  chamar: function (acao, dados, comChave) {
    var u = this.url();
    if (!u) return Promise.reject(new Error('Endereço da planilha não configurado.'));
    var corpo = Object.assign({ acao: acao }, dados || {});
    if (comChave) corpo.chave = this.chaveRh();

    return fetch(u, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(corpo)
    })
    .then(function (r) { return r.text(); })
    .then(function (t) {
      var j;
      try { j = JSON.parse(t); }
      catch (e) { throw new Error('O servidor respondeu em formato inesperado. Verifique se a publicação está como "Qualquer pessoa".'); }
      if (!j.ok) throw new Error(j.erro || 'Erro no servidor.');
      return j;
    })
    .catch(function (e) {
      if (e.message === 'Failed to fetch') throw new Error('Sem conexão com a planilha. Verifique a internet e o endereço publicado.');
      throw e;
    });
  },

  entrar: function (usuario, senha) {
    var eu = this;
    return this.chamar('login', { usuario: usuario, senha: senha }, false)
      .then(function (r) {
        eu.abrirSessao({ token: r.token, usuario: r.usuario, nome: r.nome });
        return r;
      });
  },

  ping:      function ()          { return this.chamar('ping', {}, true); },
  criar:     function (rh)        { return this.chamar('criar', { rh: rh }, true); },
  ler:       function (id)        { return this.chamar('ler', { id: id }, false); },
  salvar:    function (id, dados) { return this.chamar('salvar', { id: id, dados: dados }, false); },
  listar:    function ()          { return this.chamar('listar', {}, true); },
  detalhe:   function (id)        { return this.chamar('detalhe', { id: id }, true); },
  anotar:    function (id, obs, status) { return this.chamar('anotar', { id: id, observacoes: obs, status: status }, true); },
  apagar:    function (id)        { return this.chamar('apagar', { id: id }, true); }
};

/* ---------- rascunho local, para o candidato não perder o que digitou ---------- */
window.Rascunho = {
  chave: function (id) { return 'adm_rascunho_' + id; },
  ler: function (id) {
    try { return JSON.parse(localStorage.getItem(this.chave(id))) || null; }
    catch (e) { return null; }
  },
  gravar: function (id, dados) {
    try { localStorage.setItem(this.chave(id), JSON.stringify(dados)); } catch (e) {}
  },
  limpar: function (id) { try { localStorage.removeItem(this.chave(id)); } catch (e) {} }
};

window.toast = function (texto) {
  var el = document.createElement('div');
  el.className = 'toast'; el.textContent = texto;
  el.setAttribute('role', 'status');
  document.body.appendChild(el);
  setTimeout(function () { el.remove(); }, 2800);
};

window.esc = function (s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
