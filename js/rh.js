/* ============================================================
   Vegas — Painel de admissões (RH)
   ============================================================ */

var $ = function (id) { return document.getElementById(id); };
var ABA = 'nova';
var FICHAS = [];
var FILTRO = { status: '', busca: '' };
var ORDEM = { col: 'criadaEm', desc: true };

document.addEventListener('DOMContentLoaded', function () {
  $('logoTopo').src = window.VEGAS_LOGO.branca;

  $('abas').addEventListener('click', function (e) {
    var b = e.target.closest('[data-aba]'); if (!b) return;
    ABA = b.dataset.aba;
    Array.prototype.forEach.call($('abas').children, function (x) { x.classList.toggle('on', x === b); });
    render();
  });

  $('janFechar').addEventListener('click', function () { $('janela').close(); });

  render();
});

function render() {
  if (!window.API.autenticado()) { $('abas').hidden = true; return telaAcesso(); }
  $('abas').hidden = false;
  if (ABA === 'nova') telaNova(); else telaFichas();
}

/* ============================================================
   acesso
   ============================================================ */
function telaAcesso() {
  var temUrl = !!(window.ADM_CONFIG && window.ADM_CONFIG.url);

  /* chave no arquivo mas sem endereço: o que falta é o config.js */
  if (window.API.chaveFixa() && !window.API.url()) {
    $('tela').innerHTML =
      '<div style="max-width:560px;margin:40px auto">' +
      '<h1 style="font-size:26px;margin:0 0 6px;letter-spacing:-.02em">Falta o endereço da planilha</h1>' +
      '<p style="color:var(--fraco)">A chave já está em <b>js/chave.js</b>. Agora cole em <b>js/config.js</b> ' +
      'a URL do aplicativo da web, aquela que termina em <b>/exec</b>, e publique.</p>' +
      '<div class="campo cheia" style="margin-top:18px"><label for="inUrl">Ou use este endereço só neste aparelho</label>' +
      '<input type="text" id="inUrl" value="' + esc(localStorage.getItem('adm_url') || '') + '"></div>' +
      '<div class="btn-linha" style="margin-top:14px"><button class="btn" id="btnSoUrl">Usar este endereço</button></div>' +
      '<div id="acessoMsg"></div></div>';
    $('btnSoUrl').addEventListener('click', function () {
      var u = $('inUrl').value.trim();
      if (!u) return ($('acessoMsg').innerHTML = '<div class="aviso erro">Cole a URL terminada em /exec.</div>');
      window.API.guardarUrl(u);
      render();
    });
    return;
  }
  $('tela').innerHTML =
    '<div style="max-width:520px;margin:40px auto">' +
    '<h1 style="font-size:26px;margin:0 0 6px;letter-spacing:-.02em">Entrar no painel</h1>' +
    '<p style="color:var(--fraco);margin:0 0 24px">A chave fica guardada só neste aparelho. ' +
    'Ela não vai para o link do candidato.</p>' +

    (temUrl ? '' :
      '<div class="campo cheia" style="margin-bottom:16px"><label for="inUrl">Endereço do aplicativo da web</label>' +
      '<p class="ajuda">Termina em /exec. Vem do Admissao.gs publicado.</p>' +
      '<input type="text" id="inUrl" value="' + esc(localStorage.getItem('adm_url') || '') + '"></div>') +

    '<div class="campo cheia"><label for="inChave">Chave do RH</label>' +
    '<p class="ajuda">A função instalar() mostra a chave no registro de execução.</p>' +
    '<input type="text" id="inChave" autocomplete="off"></div>' +
    '<div class="btn-linha" style="margin-top:18px"><button class="btn" id="btnEntrar">Entrar</button></div>' +
    '<div id="acessoMsg"></div></div>';

  $('btnEntrar').addEventListener('click', function () {
    var u = $('inUrl'); if (u) window.API.guardarUrl(u.value);
    var k = $('inChave').value.trim();
    if (!k) return ($('acessoMsg').innerHTML = '<div class="aviso erro">Digite a chave.</div>');
    window.API.guardarChave(k);
    $('acessoMsg').innerHTML = '<div class="aviso info">Conferindo…</div>';
    window.API.ping().then(function () {
      $('acessoMsg').innerHTML = '';
      render();
    }).catch(function (e) {
      window.API.guardarChave('');
      $('acessoMsg').innerHTML = '<div class="aviso erro">' + esc(e.message) + '</div>';
    });
  });
}

/* ============================================================
   nova ficha
   ============================================================ */
function telaNova() {
  var emp = (window.ADM_CONFIG && window.ADM_CONFIG.empresa) || {};
  var ult = lerUltima();

  $('tela').innerHTML =
    '<div style="max-width:720px">' +
    '<h1 style="font-size:27px;margin:0 0 6px;letter-spacing:-.02em">Abrir uma ficha</h1>' +
    '<p style="color:var(--fraco);margin:0 0 22px">Preencha o que era vermelho no documento. ' +
    'O resto é o candidato que responde, pelo link.</p>' +
    '<section class="secao"><div class="corpo">' +
      window.CAMPOS_RH.map(function (c) {
        var v = emp[c.id] || ult[c.id] || '';
        if (c.id === 'candidato' || c.id === 'whatsapp') v = '';
        return campoRh(c, v);
      }).join('') +
    '</div></section>' +
    '<div class="btn-linha" style="margin-top:18px">' +
    '<button class="btn" id="btnCriar">Gerar link do candidato</button></div>' +
    '<div id="novaMsg"></div></div>';

  $('tela').addEventListener('input', function (e) {
    var el = e.target, t = el.dataset.tipo;
    if (t === 'cnpj') el.value = window.formatarCnpj(el.value);
    if (t === 'tel') el.value = window.formatarTel(el.value);
    if (el.closest('.campo')) el.closest('.campo').classList.remove('erro');
  });

  $('btnCriar').addEventListener('click', criar);
}

function campoRh(c, v) {
  var larg = c.larg === 'cheia' ? ' cheia' : '';
  var tipo = c.tipo === 'data' ? 'date' : (c.tipo === 'tel' || c.tipo === 'cnpj') ? 'tel' : 'text';
  return '<div class="campo' + larg + '" data-campo="' + c.id + '">' +
    '<label for="r_' + c.id + '">' + esc(c.rot) + (c.obrig ? '' : ' <span style="color:var(--fraco);font-weight:400">(opcional)</span>') + '</label>' +
    (c.ajuda ? '<p class="ajuda">' + esc(c.ajuda) + '</p>' : '') +
    '<input type="' + tipo + '" id="r_' + c.id + '" data-id="' + c.id + '" data-tipo="' + c.tipo + '"' +
    (c.dica ? ' placeholder="' + esc(c.dica) + '"' : '') + ' value="' + esc(v) + '">' +
    '<p class="msg-erro" hidden></p></div>';
}

function criar() {
  var rh = {}, faltou = null;
  window.CAMPOS_RH.forEach(function (c) {
    var el = $('r_' + c.id);
    rh[c.id] = (el.value || '').trim();
    var campo = el.closest('.campo');
    var erro = '';
    if (c.obrig && !rh[c.id]) erro = 'Precisa preencher.';
    else if (c.id === 'cnpj' && rh.cnpj && !window.cnpjValido(rh.cnpj)) erro = 'CNPJ não confere.';
    campo.classList.toggle('erro', !!erro);
    var p = campo.querySelector('.msg-erro');
    p.textContent = erro; p.hidden = !erro;
    if (erro && !faltou) faltou = c.id;
  });
  if (faltou) {
    $('r_' + faltou).focus();
    return toast('Confira os campos destacados');
  }

  gravarUltima(rh);
  var b = $('btnCriar'); b.disabled = true; b.textContent = 'Criando…';

  window.API.criar(rh).then(function (r) {
    b.disabled = false; b.textContent = 'Gerar link do candidato';
    mostrarLink(r.id, rh);
  }).catch(function (e) {
    b.disabled = false; b.textContent = 'Gerar link do candidato';
    $('novaMsg').innerHTML = '<div class="aviso erro">' + esc(e.message) + '</div>';
  });
}

function linkDa(id) {
  return location.href.replace(/\/[^\/]*(\?.*)?$/, '/') + 'ficha.html?id=' + id;
}

function mostrarLink(id, rh) {
  var link = linkDa(id);
  var zap = '';
  if (rh.whatsapp) {
    var n = rh.whatsapp.replace(/\D/g, ''); if (n.length <= 11) n = '55' + n;
    var msg = 'Olá ' + rh.candidato.split(' ')[0] + '! Aqui é o RH da ' + rh.razao +
      '. Segue a ficha de admissão para o posto ' + rh.posto + '. Preencha pelo link: ' + link;
    zap = '<a class="btn" style="text-decoration:none;display:inline-block" target="_blank" rel="noopener" href="https://wa.me/' +
      n + '?text=' + encodeURIComponent(msg) + '">Enviar no WhatsApp</a>';
  }
  $('novaMsg').innerHTML =
    '<div class="aviso bom" style="margin-top:20px"><b>Ficha criada para ' + esc(rh.candidato) + '.</b></div>' +
    '<div class="link-caixa"><input id="inLink" readonly value="' + esc(link) + '">' +
    '<button class="btn mini" id="btnCopiar">Copiar</button></div>' +
    '<div class="btn-linha">' + zap +
    '<button class="btn sec" id="btnOutra">Abrir outra ficha</button>' +
    '<button class="btn sec" id="btnIrFichas">Ver fichas</button></div>';

  $('btnCopiar').addEventListener('click', function () {
    var el = $('inLink'); el.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    if (navigator.clipboard) navigator.clipboard.writeText(el.value).catch(function () {});
    toast(ok || navigator.clipboard ? 'Link copiado' : 'Copie o link com o dedo');
  });
  $('btnOutra').addEventListener('click', telaNova);
  $('btnIrFichas').addEventListener('click', function () {
    ABA = 'fichas';
    Array.prototype.forEach.call($('abas').children, function (x) { x.classList.toggle('on', x.dataset.aba === 'fichas'); });
    render();
  });
  $('novaMsg').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function lerUltima() {
  try { return JSON.parse(localStorage.getItem('adm_ultima')) || {}; } catch (e) { return {}; }
}
function gravarUltima(rh) {
  var g = { razao: rh.razao, cnpj: rh.cnpj, posto: rh.posto, telRh: rh.telRh, horario: rh.horario, funcao: rh.funcao };
  try { localStorage.setItem('adm_ultima', JSON.stringify(g)); } catch (e) {}
}

/* ============================================================
   lista de fichas
   ============================================================ */
function telaFichas() {
  $('tela').innerHTML = '<p class="vazio">Carregando fichas…</p>';
  window.API.listar().then(function (r) {
    FICHAS = r.fichas || [];
    desenharFichas();
  }).catch(function (e) {
    $('tela').innerHTML = '<div class="aviso erro">' + esc(e.message) + '</div>' +
      (window.API.chaveFixa()
        ? '<p class="ajuda">A chave está escrita em <b>js/chave.js</b>. Rode <b>verChave</b> no Apps Script, ' +
          'confira, corrija o arquivo e publique.</p>' +
          '<div class="btn-linha"><button class="btn sec" id="btnRetentar">Tentar de novo</button></div>'
        : '<div class="btn-linha"><button class="btn sec" id="btnSair">Trocar a chave</button></div>');
    if ($('btnSair')) $('btnSair').addEventListener('click', sair);
    if ($('btnRetentar')) $('btnRetentar').addEventListener('click', telaFichas);
  });
}

function desenharFichas() {
  var t = FICHAS.length;
  var ag = FICHAS.filter(function (f) { return f.status === 'aguardando'; }).length;
  var pr = FICHAS.filter(function (f) { return f.status === 'preenchida'; }).length;
  var cf = FICHAS.filter(function (f) { return f.status === 'conferida'; }).length;

  var html =
    '<div style="display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:18px">' +
    '<h1 style="font-size:27px;margin:0;letter-spacing:-.02em">Fichas</h1>' +
    '<div class="btn-linha" style="margin-left:auto">' +
    '<button class="btn sec mini" id="btnAtualizar">Atualizar</button>' +
    '<button class="btn sec mini" id="btnCsv">Exportar CSV</button>' +
    (window.API.chaveFixa() ? '' : '<button class="btn sec mini" id="btnSair">Sair</button>') +
    '</div></div>' +

    '<div class="kpis">' +
    kpi(t, t === 1 ? 'ficha aberta' : 'fichas abertas', '') +
    kpi(ag, 'esperando o candidato', ag ? 'alerta' : '') +
    kpi(pr, 'preenchidas, a conferir', '') +
    kpi(cf, 'conferidas', '') +
    '</div>';

  if (!t) {
    html += '<div class="vazio"><p>Nenhuma ficha ainda. Abra a primeira na aba ao lado.</p></div>';
    $('tela').innerHTML = html;
    $('btnAtualizar').addEventListener('click', telaFichas);
    $('btnCsv').addEventListener('click', csv);
    if ($('btnSair')) $('btnSair').addEventListener('click', sair);
    return;
  }

  html += '<div class="btn-linha" style="margin-bottom:14px">' +
    '<select id="fStatus" style="padding:9px 11px;background:var(--campo);border:1px solid var(--campo-linha);border-radius:9px">' +
    ['', 'aguardando', 'preenchida', 'conferida'].map(function (s) {
      return '<option value="' + s + '"' + (FILTRO.status === s ? ' selected' : '') + '>' +
        (s ? rotStatus(s) : 'Todos os status') + '</option>';
    }).join('') + '</select>' +
    '<input id="fBusca" placeholder="Buscar por nome ou posto" value="' + esc(FILTRO.busca) + '" ' +
    'style="flex:1;min-width:200px;padding:9px 11px;background:var(--campo);border:1px solid var(--campo-linha);border-radius:9px">' +
    '</div>';

  var lista = filtrar();
  html += '<div class="rolagem"><table class="tabela"><thead><tr>' +
    th('candidato', 'Candidato') + th('posto', 'Posto') + th('funcao', 'Função') +
    th('admissao', 'Admissão') + th('status', 'Status') + th('criadaEm', 'Aberta em') +
    '<th style="cursor:default">Ações</th></tr></thead><tbody>' +
    (lista.length ? lista.map(linhaFicha).join('')
      : '<tr><td colspan="7" style="padding:26px;text-align:center;color:var(--fraco)">Nada com esse filtro.</td></tr>') +
    '</tbody></table></div>';

  $('tela').innerHTML = html;

  $('btnAtualizar').addEventListener('click', telaFichas);
  $('btnCsv').addEventListener('click', csv);
  if ($('btnSair')) $('btnSair').addEventListener('click', sair);
  $('fStatus').addEventListener('change', function () { FILTRO.status = this.value; desenharFichas(); });
  $('fBusca').addEventListener('input', function () {
    FILTRO.busca = this.value;
    clearTimeout(window._tb);
    window._tb = setTimeout(desenharFichas, 180);
  });
  Array.prototype.forEach.call($('tela').querySelectorAll('[data-ord]'), function (el) {
    el.addEventListener('click', function () {
      var c = el.dataset.ord;
      ORDEM = { col: c, desc: ORDEM.col === c ? !ORDEM.desc : false };
      desenharFichas();
    });
  });
  $('tela').addEventListener('click', function (e) {
    var b = e.target.closest('[data-acao]'); if (!b) return;
    var id = b.dataset.id;
    if (b.dataset.acao === 'ver') abrirFicha(id);
    if (b.dataset.acao === 'link') copiarLink(id);
    if (b.dataset.acao === 'pdf') pdfDe(id);
  });
}

function kpi(n, r, cls) {
  return '<div class="kpi ' + cls + '"><div class="n">' + n + '</div><div class="r">' + r + '</div></div>';
}
function th(col, rot) {
  var seta = ORDEM.col === col ? (ORDEM.desc ? ' ↓' : ' ↑') : '';
  return '<th data-ord="' + col + '">' + rot + seta + '</th>';
}
function rotStatus(s) {
  return s === 'aguardando' ? 'Esperando o candidato'
       : s === 'preenchida' ? 'Preenchida' : 'Conferida';
}

function filtrar() {
  var b = FILTRO.busca.toLowerCase().trim();
  var l = FICHAS.filter(function (f) {
    if (FILTRO.status && f.status !== FILTRO.status) return false;
    if (!b) return true;
    return (f.candidato + ' ' + f.posto + ' ' + f.funcao).toLowerCase().indexOf(b) > -1;
  });
  var c = ORDEM.col;
  l.sort(function (a, z) {
    var x = String(a[c] || ''), y = String(z[c] || '');
    return ORDEM.desc ? y.localeCompare(x, 'pt-BR') : x.localeCompare(y, 'pt-BR');
  });
  return l;
}

function linhaFicha(f) {
  return '<tr>' +
    '<td><b>' + esc(f.candidato) + '</b></td>' +
    '<td>' + esc(f.posto) + '</td>' +
    '<td>' + esc(f.funcao) + '</td>' +
    '<td>' + esc(window.dataBr(f.admissao)) + '</td>' +
    '<td><span class="selo ' + f.status + '">' + rotStatus(f.status) + '</span></td>' +
    '<td>' + esc(window.dataBr(f.criadaEm)) + '</td>' +
    '<td style="white-space:nowrap">' +
      '<button class="btn sec mini" data-acao="ver" data-id="' + f.id + '">Ver</button> ' +
      '<button class="btn sec mini" data-acao="pdf" data-id="' + f.id + '">PDF</button> ' +
      '<button class="btn sec mini" data-acao="link" data-id="' + f.id + '">Link</button>' +
    '</td></tr>';
}

function copiarLink(id) {
  var l = linkDa(id);
  if (navigator.clipboard) navigator.clipboard.writeText(l).then(function () { toast('Link copiado'); })
    .catch(function () { prompt('Copie o link:', l); });
  else prompt('Copie o link:', l);
}

/* ---------- detalhe ---------- */
var CACHE = {};

function carregar(id) {
  if (CACHE[id]) return Promise.resolve(CACHE[id]);
  return window.API.detalhe(id).then(function (r) { CACHE[id] = r.ficha; return r.ficha; });
}

function pdfDe(id) {
  toast('Montando o documento');
  carregar(id).then(function (f) { window.gerarDocumento(f); })
    .catch(function (e) { toast(e.message); });
}

function abrirFicha(id) {
  $('janTitulo').textContent = 'Carregando…';
  $('janCorpo').innerHTML = '<p class="vazio">Um instante.</p>';
  $('janPe').innerHTML = '';
  $('janela').showModal();

  carregar(id).then(function (f) {
    window.ajustarPorFuncao(f.rh.funcao);
    $('janTitulo').textContent = f.rh.candidato;
    $('janCorpo').innerHTML = detalheHtml(f);
    $('janPe').innerHTML =
      '<button class="btn sec" data-d="apagar">Apagar</button>' +
      '<button class="btn sec" data-d="pdf">Gerar PDF</button>' +
      (f.status === 'preenchida' ? '<button class="btn" data-d="conferir">Marcar como conferida</button>' : '');

    $('janPe').onclick = function (e) {
      var b = e.target.closest('[data-d]'); if (!b) return;
      if (b.dataset.d === 'pdf') { f.observacoes = $('obsTxt') ? $('obsTxt').value : f.observacoes; window.gerarDocumento(f); }
      if (b.dataset.d === 'conferir') salvarAnotacao(id, 'conferida');
      if (b.dataset.d === 'apagar') apagar(id, f.rh.candidato);
    };
    var obs = $('obsSalvar');
    if (obs) obs.addEventListener('click', function () { salvarAnotacao(id, null); });
  }).catch(function (e) {
    $('janCorpo').innerHTML = '<div class="aviso erro">' + esc(e.message) + '</div>';
  });
}

function detalheHtml(f) {
  var d = f.dados || {};
  var h = '';

  h += '<div class="resp"><h3>Dados do posto</h3>' +
    window.CAMPOS_RH.map(function (c) {
      var v = f.rh[c.id]; if (!v) return '';
      return li(c.rot, c.tipo === 'data' ? window.dataBr(v) : v);
    }).join('') + '</div>';

  if (f.status === 'aguardando') {
    h += '<div class="aviso info">O candidato ainda não preencheu. O link continua valendo.</div>';
  } else {
    window.SECOES_CANDIDATO.forEach(function (s) {
      var campos = s.campos.filter(function (c) { return window.campoVisivel(c, d); });
      if (!campos.length) return;
      h += '<div class="resp"><h3>' + esc(s.nome) + '</h3>' +
        campos.map(function (c) {
          if (c.tipo === 'assinatura') {
            return d.assinatura
              ? '<div class="li"><span class="k">Assinatura</span><span class="v">' +
                '<img src="' + d.assinatura + '" alt="" style="height:52px;background:#fff;border-radius:6px;padding:3px"></span></div>'
              : li('Assinatura', 'não assinada');
          }
          var v = d[c.id];
          if (c.tipo === 'check') v = v === true ? 'sim' : 'não';
          else if (c.tipo === 'data') v = window.dataBr(v);
          else if (c.tipo === 'filhos') v = (v || []).filter(function (x) { return x.nome; })
            .map(function (x) { return x.nome + (x.idade ? ' (' + x.idade + ')' : ''); }).join('; ');
          return li(c.rot, v || '—');
        }).join('') + '</div>';
    });
  }

  h += '<div class="campo cheia"><label for="obsTxt">Observações do RH</label>' +
    '<p class="ajuda">Documento não enviado, motivo, pendência combinada. Sai no PDF.</p>' +
    '<textarea id="obsTxt">' + esc(f.observacoes || '') + '</textarea>' +
    '<div class="btn-linha" style="margin-top:8px"><button class="btn sec mini" id="obsSalvar">Salvar observação</button></div></div>';

  return h;
}

function li(k, v) {
  return '<div class="li"><span class="k">' + esc(k) + '</span><span class="v">' + esc(v) + '</span></div>';
}

function salvarAnotacao(id, novoStatus) {
  var obs = $('obsTxt') ? $('obsTxt').value : '';
  window.API.anotar(id, obs, novoStatus).then(function () {
    delete CACHE[id];
    toast(novoStatus ? 'Ficha conferida' : 'Observação salva');
    if (novoStatus) { $('janela').close(); telaFichas(); }
  }).catch(function (e) { toast(e.message); });
}

function apagar(id, nome) {
  if (!confirm('Apagar a ficha de ' + nome + '? O link para de funcionar e os dados saem da planilha.')) return;
  window.API.apagar(id).then(function () {
    delete CACHE[id];
    $('janela').close();
    toast('Ficha apagada');
    telaFichas();
  }).catch(function (e) { toast(e.message); });
}

function sair() {
  if (!confirm('Sair do painel neste aparelho?')) return;
  window.API.guardarChave('');
  ABA = 'nova';
  render();
}

/* ---------- csv ---------- */
function csv() {
  var cols = ['candidato', 'posto', 'funcao', 'salario', 'horario', 'admissao', 'status', 'criadaEm', 'enviadaEm'];
  var linhas = [cols.join(';')].concat(filtrar().map(function (f) {
    return cols.map(function (c) { return '"' + String(f[c] == null ? '' : f[c]).replace(/"/g, '""') + '"'; }).join(';');
  }));
  var blob = new Blob(['\ufeff' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'admissoes-vegas.csv';
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
}
