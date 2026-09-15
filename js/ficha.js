/* ============================================================
   Vegas — Ficha do candidato
   ============================================================ */

var ID = new URLSearchParams(location.search).get('id') || '';
var FICHA = null;          /* dados de cabeçalho vindos do RH */
var R = {};                /* respostas do candidato */
var ENVIADA = false;
var assinaturaCanvas = null;

var $ = function (id) { return document.getElementById(id); };

/* ---------- abertura ---------- */
document.addEventListener('DOMContentLoaded', function () {
  $('logoTopo').src = window.VEGAS_LOGO.branca;

  if (!ID) return falhar('Link incompleto',
    'Este endereço não traz o código da ficha. Peça ao RH para reenviar o link.');
  if (!window.API.configurada()) return falhar('Ficha fora do ar',
    'O endereço da planilha não foi configurado em js/config.js. Avise o RH.');

  window.API.ler(ID).then(function (r) {
    FICHA = r.ficha;
    ENVIADA = FICHA.status !== 'aguardando';
    var rascunho = window.Rascunho.ler(ID);
    R = FICHA.dados && Object.keys(FICHA.dados).length ? FICHA.dados : (rascunho || {});
    if (!R.dec_nome && FICHA.rh.candidato) R.dec_nome = FICHA.rh.candidato;
    window.ajustarPorFuncao(FICHA.rh.funcao);
    montar();
  }).catch(function (e) {
    falhar('Não foi possível abrir a ficha', e.message +
      ' Se o problema continuar, chame o RH pelo WhatsApp.');
  });
});

function falhar(titulo, texto) {
  $('tela').innerHTML = '<div class="vazio"><h1 style="font-size:22px;margin:0 0 8px">' +
    esc(titulo) + '</h1><p>' + esc(texto) + '</p></div>';
}

/* ---------- montagem ---------- */
function montar() {
  var rh = FICHA.rh;
  var html = '';

  html += '<section class="abertura">' +
    '<h1>' + esc(primeiroNome(rh.candidato)) + ', falta pouco para sua admissão</h1>' +
    '<p class="posto">' + esc(rh.funcao) + ' — ' + esc(rh.posto) + '</p>' +
    '<dl>' +
      linha('Empresa', rh.razao) +
      linha('CNPJ', rh.cnpj) +
      linha('Salário', rh.salario) +
      linha('Horário', rh.horario) +
      linha('Admissão prevista', window.dataBr(rh.admissao) + ' (pode mudar)') +
    '</dl></section>';

  html += '<div class="prazo">' +
    '<div><b>Os documentos vão pelo WhatsApp, não por aqui.</b>' +
    'Esta ficha guarda as suas respostas. Os arquivos digitalizados você manda para o RH no ' +
    esc(window.formatarTel(rh.telRh)) + ', em PDF, com o seu nome e o nome do documento em cada arquivo. ' +
    esc((window.ADM_CONFIG && window.ADM_CONFIG.textoPrazo) || '') +
    (rh.telRh ? '<br><a class="zap" target="_blank" rel="noopener" href="' + zapLink(rh.telRh, rh.candidato) + '">Abrir conversa com o RH</a>' : '') +
    '</div></div>';

  if (ENVIADA) {
    html += '<div class="aviso bom">Você já enviou esta ficha em ' +
      esc(quando(FICHA.enviadaEm)) + '. Pode corrigir o que precisar e enviar de novo.</div>';
  }

  window.SECOES_CANDIDATO.forEach(function (s) {
    html += '<section class="secao" id="sec_' + s.id + '">' +
      '<h2><span class="marca"></span><span class="tit">' + esc(s.nome) + '</span>' +
      '<span class="cont"></span></h2>' +
      (s.texto ? '<p class="intro">' + esc(s.texto) + '</p>' : '') +
      (s.id === 'declaracao' ? blocoDeclaracoes() : '') +
      '<div class="corpo">' + s.campos.map(campoHtml).join('') + '</div>' +
      '</section>';
  });

  html += '<div class="espaco-rodape"></div>';
  $('tela').innerHTML = html;
  $('rodape').hidden = false;

  ligarEventos();
  document.querySelectorAll('.marcar input').forEach(function (el) {
    el.closest('.marcar').classList.toggle('marcada', el.checked);
  });
  prepararAssinatura();
  atualizar();
}

function primeiroNome(n) { return String(n || '').trim().split(/\s+/)[0] || 'Olá'; }
function linha(k, v) { return v ? '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>' : ''; }
function quando(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function zapLink(tel, nome) {
  var n = String(tel).replace(/\D/g, '');
  if (n.length <= 11) n = '55' + n;
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent('Olá, sou ' + nome + '. Vou enviar os documentos da admissão.');
}

function blocoDeclaracoes() {
  return '<div style="padding:14px 18px 0"><div class="declaracoes">' +
    'Ao assinar, você declara que leu e entendeu este checklist e que:' +
    '<ul>' + window.TEXTO_DECLARACOES.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
    '</div></div>';
}

/* ---------- um campo ---------- */
function campoHtml(c) {
  var vis = window.campoVisivel(c, R);
  var larg = (c.larg === 'cheia' || c.tipo === 'check' || c.tipo === 'filhos' ||
              c.tipo === 'assinatura' || c.tipo === 'area') ? ' cheia' : '';
  var abre = '<div class="campo' + larg + '" data-campo="' + c.id + '"' + (vis ? '' : ' hidden') + '>';
  var ajuda = c.ajuda ? '<p class="ajuda">' + esc(c.ajuda) + '</p>' : '';
  var v = R[c.id];

  if (c.tipo === 'check') {
    return abre +
      '<label class="marcar"><input type="checkbox" data-id="' + c.id + '"' + (v === true ? ' checked' : '') + '>' +
      '<span><span class="rot">' + esc(c.rot) +
      (c.nota ? ' <span style="color:var(--fraco);font-weight:400">— ' + esc(c.nota) + '</span>' : '') + '</span>' +
      ajuda +
      (c.link ? '<br><a href="' + c.link + '" target="_blank" rel="noopener">' + esc(c.linkRot || 'Abrir site') + '</a>' : '') +
      '</span></label></div>';
  }

  if (c.tipo === 'simnao') {
    return abre + '<label>' + esc(c.rot) + '</label>' + ajuda +
      '<div class="simnao" data-id="' + c.id + '">' +
      '<button type="button" data-v="Sim"' + (v === 'Sim' ? ' class="on"' : '') + '>Sim</button>' +
      '<button type="button" data-v="Não"' + (v === 'Não' ? ' class="on"' : '') + '>Não</button>' +
      '</div><p class="msg-erro" hidden></p></div>';
  }

  if (c.tipo === 'opcao') {
    return abre + '<label for="f_' + c.id + '">' + esc(c.rot) + '</label>' + ajuda +
      '<select id="f_' + c.id + '" data-id="' + c.id + '"><option value="">Escolha</option>' +
      c.opcoes.map(function (o) { return '<option' + (v === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
      '</select><p class="msg-erro" hidden></p></div>';
  }

  if (c.tipo === 'filhos') {
    return abre + '<label>' + esc(c.rot) + '</label>' + ajuda +
      '<div id="listaFilhos"></div>' +
      '<button type="button" class="mais" id="btnMaisFilho">Adicionar filho</button>' +
      '<p class="msg-erro" hidden></p></div>';
  }

  if (c.tipo === 'assinatura') {
    return abre + '<label>' + esc(c.rot) + '</label>' +
      '<p class="ajuda">Assine com o dedo, do jeito que você assina no papel.</p>' +
      '<canvas class="assina" id="canvasAssina"></canvas>' +
      '<div class="assina-acoes"><span class="ajuda" id="assinaData"></span>' +
      '<button type="button" id="btnLimparAssina">Apagar e assinar de novo</button></div>' +
      '<p class="msg-erro" hidden></p></div>';
  }

  if (c.tipo === 'area') {
    return abre + '<label for="f_' + c.id + '">' + esc(c.rot) + '</label>' + ajuda +
      '<textarea id="f_' + c.id + '" data-id="' + c.id + '">' + esc(v || '') + '</textarea>' +
      '<p class="msg-erro" hidden></p></div>';
  }

  var tipoHtml = c.tipo === 'data' ? 'date' : c.tipo === 'email' ? 'email'
               : c.tipo === 'num' ? 'number' : (c.tipo === 'tel' || c.tipo === 'cpf' || c.tipo === 'cnpj') ? 'tel' : 'text';
  var extra = c.tipo === 'num' ? ' min="1" max="20" inputmode="numeric"' : '';
  return abre + '<label for="f_' + c.id + '">' + esc(c.rot) + '</label>' + ajuda +
    '<input type="' + tipoHtml + '" id="f_' + c.id + '" data-id="' + c.id + '" data-tipo="' + c.tipo + '"' +
    (c.dica ? ' placeholder="' + esc(c.dica) + '"' : '') + extra +
    ' value="' + esc(v || '') + '"><p class="msg-erro" hidden></p></div>';
}

/* ---------- eventos ---------- */
function ligarEventos() {
  var tela = $('tela');

  tela.addEventListener('input', function (e) {
    var el = e.target;
    if (!el.dataset.id) return;
    var t = el.dataset.tipo;
    if (t === 'cpf') el.value = window.formatarCpf(el.value);
    if (t === 'cnpj') el.value = window.formatarCnpj(el.value);
    if (t === 'tel') el.value = window.formatarTel(el.value);
    if (t === 'moeda') el.value = formatarMoeda(el.value);
    R[el.dataset.id] = el.type === 'checkbox' ? el.checked : el.value;
    marcarErro(el.closest('.campo'), '');
    agendar();
  });

  tela.addEventListener('change', function (e) {
    var el = e.target;
    if (el.tagName === 'SELECT' && el.dataset.id) { R[el.dataset.id] = el.value; agendar(); }
    if (el.type === 'checkbox' && el.dataset.id) {
      R[el.dataset.id] = el.checked;
      el.closest('.marcar').classList.toggle('marcada', el.checked);
      agendar();
    }
  });

  tela.addEventListener('click', function (e) {
    var b = e.target.closest('.simnao button');
    if (b) {
      var id = b.parentNode.dataset.id;
      R[id] = b.dataset.v;
      Array.prototype.forEach.call(b.parentNode.children, function (x) { x.classList.toggle('on', x === b); });
      marcarErro(b.closest('.campo'), '');
      agendar();
      return;
    }
    if (e.target.id === 'btnMaisFilho') { addFilho(); return; }
    var rm = e.target.closest('[data-rmfilho]');
    if (rm) {
      R.filhos.splice(parseInt(rm.dataset.rmfilho, 10), 1);
      renderFilhos(); agendar(); return;
    }
    if (e.target.id === 'btnLimparAssina') { limparAssinatura(); return; }
  });

  $('btnEnviar').addEventListener('click', enviar);
  renderFilhos();
}

var timer = null;
function agendar() {
  clearTimeout(timer);
  timer = setTimeout(function () { window.Rascunho.gravar(ID, R); atualizar(); }, 120);
}

function formatarMoeda(v) {
  var n = String(v).replace(/\D/g, '');
  if (!n) return '';
  return 'R$ ' + (parseInt(n, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ---------- filhos ---------- */
function addFilho() {
  if (!R.filhos) R.filhos = [];
  if (R.filhos.length >= 12) return;
  R.filhos.push({ nome: '', idade: '' });
  renderFilhos(); agendar();
  var ul = $('listaFilhos');
  if (ul && ul.lastElementChild) ul.lastElementChild.querySelector('input').focus();
}

function renderFilhos() {
  var ul = $('listaFilhos');
  if (!ul) return;
  if (!R.filhos || !R.filhos.length) R.filhos = [{ nome: '', idade: '' }];
  ul.innerHTML = R.filhos.map(function (f, i) {
    return '<div class="filho">' +
      '<input placeholder="Nome do filho" data-fi="' + i + '" data-fk="nome" value="' + esc(f.nome) + '">' +
      '<input placeholder="Idade" inputmode="numeric" data-fi="' + i + '" data-fk="idade" value="' + esc(f.idade) + '">' +
      '<button type="button" data-rmfilho="' + i + '" aria-label="Remover filho">×</button>' +
      '</div>';
  }).join('');
  Array.prototype.forEach.call(ul.querySelectorAll('input'), function (el) {
    el.addEventListener('input', function () {
      R.filhos[parseInt(el.dataset.fi, 10)][el.dataset.fk] = el.value;
      agendar();
    });
  });
}

/* ---------- assinatura ---------- */
function prepararAssinatura() {
  var c = $('canvasAssina');
  if (!c) return;
  assinaturaCanvas = c;
  var ratio = Math.min(window.devicePixelRatio || 1, 2);
  c.width = c.offsetWidth * ratio;
  c.height = c.offsetHeight * ratio;
  var ctx = c.getContext('2d');
  ctx.scale(ratio, ratio);
  ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#14181d';
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.offsetWidth, c.offsetHeight);

  if (R.assinatura) {
    var img = new Image();
    img.onload = function () { ctx.drawImage(img, 0, 0, c.offsetWidth, c.offsetHeight); };
    img.src = R.assinatura;
  }

  var desenhando = false, ux = 0, uy = 0, sujo = false;
  function pos(e) {
    var r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  c.addEventListener('pointerdown', function (e) {
    desenhando = true; c.setPointerCapture(e.pointerId);
    var p = pos(e); ux = p.x; uy = p.y;
    ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux + .1, uy + .1); ctx.stroke();
    sujo = true;
  });
  c.addEventListener('pointermove', function (e) {
    if (!desenhando) return;
    e.preventDefault();
    var p = pos(e);
    ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(p.x, p.y); ctx.stroke();
    ux = p.x; uy = p.y;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
    c.addEventListener(ev, function () {
      if (!desenhando) return;
      desenhando = false;
      if (sujo) { R.assinatura = comprimir(c); R.assinaturaEm = new Date().toISOString(); agendar(); }
    });
  });
  atualizarDataAssinatura();
}

/* reduz a assinatura para caber com folga numa célula da planilha */
function comprimir(c) {
  var alvo = document.createElement('canvas');
  var larg = 440, alt = Math.round(c.offsetHeight * (larg / c.offsetWidth));
  alvo.width = larg; alvo.height = alt;
  var x = alvo.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, larg, alt);
  x.drawImage(c, 0, 0, larg, alt);
  var d = alvo.toDataURL('image/png');
  return d.length > 42000 ? alvo.toDataURL('image/jpeg', 0.6) : d;
}

function limparAssinatura() {
  var c = assinaturaCanvas; if (!c) return;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.offsetWidth, c.offsetHeight);
  delete R.assinatura; delete R.assinaturaEm;
  atualizarDataAssinatura(); agendar();
}

function atualizarDataAssinatura() {
  var el = $('assinaData');
  if (el) el.textContent = R.assinaturaEm ? 'Assinado em ' + quando(R.assinaturaEm) : '';
}

/* ---------- estado ---------- */
function atualizar() {
  /* mostra e esconde condicionais */
  window.todosCampos().forEach(function (c) {
    var el = document.querySelector('[data-campo="' + c.id + '"]');
    if (el) el.hidden = !window.campoVisivel(c, R);
  });

  var faltas = window.pendencias(R);
  var porSecao = {};
  faltas.forEach(function (f) { porSecao[f.secao] = (porSecao[f.secao] || 0) + 1; });

  window.SECOES_CANDIDATO.forEach(function (s) {
    var el = $('sec_' + s.id); if (!el) return;
    var n = porSecao[s.id] || 0;
    el.classList.toggle('completa', n === 0);
    el.querySelector('.cont').textContent = n === 0 ? 'completo' : (n === 1 ? 'falta 1' : 'faltam ' + n);
  });

  var est = $('estado');
  if (faltas.length === 0) {
    est.className = 'estado pronta';
    est.innerHTML = '<b>Tudo preenchido</b><span class="lista">Confira a assinatura e envie.</span>';
    $('btnEnviar').disabled = false;
  } else {
    est.className = 'estado';
    est.innerHTML = '<b>' + (faltas.length === 1 ? 'Falta 1 item' : 'Faltam ' + faltas.length + ' itens') + '</b>' +
      '<span class="lista">' + esc(faltas.slice(0, 3).map(function (f) { return f.rot; }).join(' · ')) +
      (faltas.length > 3 ? ' e mais ' + (faltas.length - 3) : '') + '</span>';
    $('btnEnviar').disabled = false;   /* deixa tentar: o erro aponta onde está */
  }
  atualizarDataAssinatura();
}

function marcarErro(campo, msg) {
  if (!campo) return;
  campo.classList.toggle('erro', !!msg);
  var p = campo.querySelector('.msg-erro');
  if (p) { p.textContent = msg; p.hidden = !msg; }
}

/* ---------- envio ---------- */
function enviar() {
  var faltas = window.pendencias(R);

  /* validações que não são só "está vazio" */
  var erros = [];
  if (R.dec_cpf && !window.cpfValido(R.dec_cpf)) erros.push({ id: 'dec_cpf', msg: 'Esse CPF não confere. Confira os números.' });
  if (R.email_ponto && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(R.email_ponto)) erros.push({ id: 'email_ponto', msg: 'E-mail incompleto.' });
  if (R.vt === 'Sim' && R.vt_qtd && (+R.vt_qtd < 1 || +R.vt_qtd > 20)) erros.push({ id: 'vt_qtd', msg: 'Informe de 1 a 20 passagens.' });

  document.querySelectorAll('.campo.erro').forEach(function (el) { marcarErro(el, ''); });
  erros.forEach(function (e) {
    marcarErro(document.querySelector('[data-campo="' + e.id + '"]'), e.msg);
  });

  var primeiro = erros.length ? erros[0].id : (faltas.length ? faltas[0].id : null);
  if (primeiro) {
    if (!erros.length) {
      faltas.forEach(function (f) {
        marcarErro(document.querySelector('[data-campo="' + f.id + '"]'), 'Precisa preencher.');
      });
    }
    var alvo = document.querySelector('[data-campo="' + primeiro + '"]');
    if (alvo) {
      alvo.scrollIntoView({ block: 'center', behavior: 'smooth' });
      var foco = alvo.querySelector('input,select,textarea,button');
      if (foco) setTimeout(function () { foco.focus({ preventScroll: true }); }, 350);
    }
    toast(erros.length ? 'Confira o campo destacado' :
      (faltas.length === 1 ? 'Falta 1 item' : 'Faltam ' + faltas.length + ' itens'));
    return;
  }

  var btn = $('btnEnviar');
  btn.disabled = true; btn.textContent = 'Enviando…';
  window.API.salvar(ID, R).then(function () {
    window.Rascunho.limpar(ID);
    sucesso();
  }).catch(function (e) {
    btn.disabled = false; btn.textContent = 'Enviar ficha';
    toast('Não enviou. ' + e.message);
  });
}

function sucesso() {
  $('rodape').hidden = true;
  var rh = FICHA.rh;
  window.scrollTo(0, 0);
  $('tela').innerHTML =
    '<section class="abertura"><h1>Ficha enviada</h1>' +
    '<p class="posto">' + esc(rh.candidato) + ' — ' + esc(rh.posto) + '</p></section>' +

    '<div class="aviso bom">O RH já recebeu o que você preencheu.</div>' +

    '<div class="prazo"><div><b>Agora mande os documentos.</b>' +
    'Esta ficha não carrega arquivos. Os documentos digitalizados vão em PDF para o WhatsApp do RH, ' +
    'cada arquivo nomeado com o seu nome e o nome do documento. ' +
    esc((window.ADM_CONFIG && window.ADM_CONFIG.textoPrazo) || '') +
    (rh.telRh ? '<br><a class="zap" target="_blank" rel="noopener" href="' + zapLink(rh.telRh, rh.candidato) + '">Abrir conversa com o RH</a>' : '') +
    '</div></div>' +

    '<div class="btn-linha" style="margin-top:20px">' +
    '<button class="btn" id="btnPdf">Baixar minha ficha em PDF</button>' +
    '<button class="btn sec" id="btnVoltar">Corrigir alguma coisa</button>' +
    '</div>' +
    '<p class="ajuda" style="margin-top:14px">Guarde o PDF. Ele é o comprovante do que você declarou.</p>';

  $('btnPdf').addEventListener('click', function () {
    window.gerarDocumento({ rh: FICHA.rh, dados: R, id: ID, enviadaEm: new Date().toISOString() });
  });
  $('btnVoltar').addEventListener('click', function () { ENVIADA = true; montar(); });
}
