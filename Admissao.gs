/**
 * ============================================================
 *  VEGAS — FICHA DE ADMISSÃO
 *  Backend em Google Apps Script. É separado do sistema de
 *  levantamento de segurança, de propósito: aqui tem CPF, dados
 *  bancários e nome de filho menor. Planilha separada, acesso
 *  separado, expurgo separado.
 *
 *  COMO INSTALAR
 *  1. script.google.com > Novo projeto
 *  2. Cole este arquivo inteiro por cima do Code.gs em branco
 *  3. Execute a função instalar() e autorize
 *  4. Copie a CHAVE DO RH que aparece no registro de execução
 *  5. Implantar > Nova implantação > Aplicativo da Web
 *       Executar como: Eu
 *       Quem pode acessar: Qualquer pessoa
 *  6. Copie a URL terminada em /exec e cole em js/config.js
 *
 *  A chave do RH NÃO vai no config.js. Ela é digitada uma vez
 *  no painel, por quem usa o painel.
 * ============================================================
 */

var CFG = {
  NOME_PLANILHA: 'Vegas — Admissões',
  /* meses até a ficha entrar no relatório de expurgo da LGPD */
  RETENCAO_MESES: 24,

  /* Usuário e senha criados na primeira vez que instalar() roda.
     Depois disso, mude pela função trocarSenha() — editar aqui
     não muda nada, porque a senha já foi gravada. */
  USUARIO_INICIAL: 'admin',
  SENHA_INICIAL: 'Vegas4747@',

  /* pasta do Drive onde ficam as fotos dos documentos */
  PASTA_RAIZ: 'Vegas — Documentos de admissão',

  /* tamanho máximo de cada arquivo já decodificado, em MB.
     O celular manda foto de 4 MB; o aplicativo reduz antes de
     subir, então na prática chega bem abaixo disso. */
  MAX_MB: 10
};

var COLUNAS = [
  'id', 'criadaEm', 'status', 'razao', 'cnpj', 'posto', 'candidato', 'whatsapp',
  'funcao', 'salario', 'horario', 'admissao', 'telRh',
  'enviadaEm', 'observacoes', 'dados', 'assinatura', 'pasta'
];

var CAMPOS_RH = ['razao', 'cnpj', 'posto', 'candidato', 'whatsapp', 'funcao',
                 'salario', 'horario', 'admissao', 'telRh'];

/* ============================================================
   INSTALAÇÃO
   ============================================================ */
function instalar() {
  var props = PropertiesService.getScriptProperties();

  var id = props.getProperty('PLANILHA_ID');
  var ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(CFG.NOME_PLANILHA);
    props.setProperty('PLANILHA_ID', ss.getId());
  }

  criarAbas_(ss);

  var chave = props.getProperty('CHAVE_RH');
  if (!chave) {
    chave = Utilities.getUuid().replace(/-/g, '').substring(0, 20).toUpperCase();
    props.setProperty('CHAVE_RH', chave);
  }

  var us = lerUsuarios_();
  var criouUsuario = false;
  if (!Object.keys(us).length) {
    us[CFG.USUARIO_INICIAL] = { hash: resumo_(CFG.SENHA_INICIAL), nome: 'Administrador' };
    gravarUsuarios_(us);
    criouUsuario = true;
  }

  var msg =
    '\n============================================================\n' +
    ' ADMISSÕES — INSTALAÇÃO CONCLUÍDA\n' +
    '============================================================\n' +
    ' PLANILHA    : ' + ss.getUrl() + '\n' +
    ' FOTOS EM    : Drive, pasta "' + CFG.PASTA_RAIZ + '"\n' +
    ' USUÁRIO     : ' + CFG.USUARIO_INICIAL + '\n' +
    ' SENHA       : ' + (criouUsuario ? CFG.SENHA_INICIAL : '(já existia, não foi mexida)') + '\n' +
    ' CHAVE DO RH : ' + chave + '\n' +
    '------------------------------------------------------------\n' +
    ' Agora publique: Implantar > Nova implantação >\n' +
    ' Aplicativo da Web, executar como Eu, acesso Qualquer pessoa.\n' +
    ' A URL /exec vai em js/config.js. Só ela.\n' +
    ' No painel, entre com o usuário e a senha acima.\n' +
    ' Para trocar a senha: trocarSenha(\'admin\', \'NovaSenha123\')\n' +
    '============================================================\n';
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
  return msg;
}

function criarAbas_(ss) {
  var fichas = ss.getSheetByName('Fichas');
  if (!fichas) {
    fichas = ss.getSheets()[0];
    fichas.setName('Fichas');
  }

  /* planilha que já existia: acrescenta as colunas que faltarem,
     sem mexer no que já está gravado */
  if (fichas.getLastRow() > 0) {
    var largura = Math.max(fichas.getLastColumn(), 1);
    var atuais = fichas.getRange(1, 1, 1, largura).getValues()[0];
    for (var i = 0; i < COLUNAS.length; i++) {
      if (atuais.indexOf(COLUNAS[i]) === -1) {
        fichas.getRange(1, atuais.length + 1).setValue(COLUNAS[i])
          .setFontWeight('bold').setBackground('#14181d').setFontColor('#ffffff');
        atuais.push(COLUNAS[i]);
      }
    }
  }

  if (fichas.getLastRow() === 0) {
    fichas.getRange(1, 1, 1, COLUNAS.length).setValues([COLUNAS]);
    fichas.getRange(1, 1, 1, COLUNAS.length).setFontWeight('bold').setBackground('#14181d').setFontColor('#ffffff');
    fichas.setFrozenRows(1);
    fichas.setColumnWidth(1, 250);
    fichas.setColumnWidth(COLUNAS.indexOf('dados') + 1, 90);
    fichas.setColumnWidth(COLUNAS.indexOf('assinatura') + 1, 90);
  }

  if (!ss.getSheetByName('Log')) {
    var log = ss.insertSheet('Log');
    log.getRange(1, 1, 1, 4).setValues([['quando', 'acao', 'ficha', 'detalhe']]);
    log.getRange(1, 1, 1, 4).setFontWeight('bold');
    log.setFrozenRows(1);
  }
}

function verChave() {
  var p = PropertiesService.getScriptProperties();
  var m = 'CHAVE DO RH: ' + p.getProperty('CHAVE_RH') +
    '\nPLANILHA: ' + SpreadsheetApp.openById(p.getProperty('PLANILHA_ID')).getUrl();
  Logger.log(m);
  return m;
}

function gerarNovaChave() {
  var nova = Utilities.getUuid().replace(/-/g, '').substring(0, 20).toUpperCase();
  PropertiesService.getScriptProperties().setProperty('CHAVE_RH', nova);
  Logger.log('Nova chave do RH: ' + nova + '\nQuem usa o painel precisa entrar de novo.');
  return nova;
}

/**
 * Relatório de expurgo. Lista fichas mais velhas que a retenção
 * configurada. Rode de tempos em tempos e apague o que já cumpriu
 * a finalidade: guardar CPF e conta bancária de quem não foi
 * contratado, sem prazo, é passivo de LGPD.
 */
function fichasParaExpurgo() {
  var sh = aba_('Fichas');
  var dados = sh.getDataRange().getValues();
  var limite = new Date();
  limite.setMonth(limite.getMonth() - CFG.RETENCAO_MESES);
  var linhas = [];
  for (var i = 1; i < dados.length; i++) {
    var criada = new Date(dados[i][1]);
    if (!isNaN(criada) && criada < limite) {
      linhas.push('linha ' + (i + 1) + ' — ' + dados[i][6] + ' — aberta em ' + dados[i][1]);
    }
  }
  var m = linhas.length
    ? 'Fichas com mais de ' + CFG.RETENCAO_MESES + ' meses:\n' + linhas.join('\n')
    : 'Nenhuma ficha passou de ' + CFG.RETENCAO_MESES + ' meses.';
  Logger.log(m);
  return m;
}

/* ============================================================
   ROTEAMENTO
   ============================================================ */
function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<div style="font-family:system-ui;padding:32px;max-width:520px">' +
    '<h2>Vegas — Admissões</h2>' +
    '<p>Este endereço é o servidor das fichas. Ele não abre ficha nenhuma sozinho.</p>' +
    '<p>Cole esta URL em <b>js/config.js</b> e use o painel para gerar o link de cada candidato.</p>' +
    '</div>');
}

function doPost(e) {
  var dados;
  try { dados = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false, erro: 'Requisição inválida.' }); }

  var acao = dados.acao;

  try {
    /* ações abertas: o candidato não tem chave, tem o link */
    if (acao === 'ler')    return json_(lerFicha_(dados.id));
    if (acao === 'salvar') return json_(salvarFicha_(dados.id, dados.dados));
    if (acao === 'login')   return json_(login_(dados.usuario, dados.senha));
    if (acao === 'arquivo') return json_(guardarArquivo_(dados));
    if (acao === 'tirarArquivo') return json_(tirarArquivo_(dados.id, dados.driveId));

    /* daqui para baixo, só com a chave do RH */
    if (!conferirChave_(dados.chave)) return json_({ ok: false, erro: 'Chave do RH inválida.' });

    if (acao === 'ping')    return json_({ ok: true, versao: 1 });
    if (acao === 'criar')   return json_(criarFicha_(dados.rh));
    if (acao === 'listar')  return json_(listarFichas_());
    if (acao === 'detalhe') return json_(detalheFicha_(dados.id));
    if (acao === 'anotar')  return json_(anotar_(dados.id, dados.observacoes, dados.status));
    if (acao === 'apagar')  return json_(apagarFicha_(dados.id));
    if (acao === 'baixar')  return json_(baixarArquivo_(dados.driveId));

    return json_({ ok: false, erro: 'Ação desconhecida: ' + acao });
  } catch (err) {
    return json_({ ok: false, erro: String(err && err.message ? err.message : err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function conferirChave_(chave) {
  var certa = PropertiesService.getScriptProperties().getProperty('CHAVE_RH');
  return !!certa && chave === certa;
}

function aba_(nome) {
  var id = PropertiesService.getScriptProperties().getProperty('PLANILHA_ID');
  if (!id) throw new Error('Rode a função instalar() antes de usar.');
  var sh = SpreadsheetApp.openById(id).getSheetByName(nome);
  if (!sh) throw new Error('Aba ' + nome + ' não encontrada. Rode instalar() de novo.');
  return sh;
}

function registrar_(acao, ficha, detalhe) {
  try {
    aba_('Log').appendRow([new Date(), acao, ficha || '', detalhe || '']);
  } catch (e) {}
}

/* acha a linha de uma ficha pelo id. devolve 0 se não existir */
function linhaDaFicha_(sh, id) {
  if (!id) return 0;
  var ultima = sh.getLastRow();
  if (ultima < 2) return 0;
  var ids = sh.getRange(2, 1, ultima - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return 0;
}

function obj_(valores) {
  var o = {};
  for (var i = 0; i < COLUNAS.length; i++) o[COLUNAS[i]] = valores[i];
  return o;
}

function montarFicha_(o) {
  var rh = {};
  for (var i = 0; i < CAMPOS_RH.length; i++) rh[CAMPOS_RH[i]] = o[CAMPOS_RH[i]] || '';
  if (rh.admissao instanceof Date) rh.admissao = Utilities.formatDate(rh.admissao, 'GMT-3', 'yyyy-MM-dd');

  var d = {};
  if (o.dados) { try { d = JSON.parse(o.dados); } catch (e) { d = {}; } }
  if (o.assinatura) d.assinatura = o.assinatura;

  return {
    id: o.id,
    status: o.status || 'aguardando',
    criadaEm: iso_(o.criadaEm),
    enviadaEm: iso_(o.enviadaEm),
    observacoes: o.observacoes || '',
    rh: rh,
    dados: d
  };
}

function iso_(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

/* ============================================================
   USUÁRIOS DO PAINEL

   A senha não fica guardada em lugar nenhum: o que se guarda é
   o resumo SHA-256 dela com um sal próprio desta instalação.
   Se alguém abrir a planilha ou as propriedades do script, vê o
   resumo, não a senha. E o navegador nunca recebe a chave do RH
   sem antes acertar usuário e senha.
   ============================================================ */

function sal_() {
  var p = PropertiesService.getScriptProperties();
  var s = p.getProperty('SAL');
  if (!s) { s = Utilities.getUuid(); p.setProperty('SAL', s); }
  return s;
}

function resumo_(senha) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, sal_() + '|' + senha, Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    hex += ('0' + (bytes[i] & 0xFF).toString(16)).slice(-2);
  }
  return hex;
}

function lerUsuarios_() {
  var t = PropertiesService.getScriptProperties().getProperty('USUARIOS');
  if (!t) return {};
  try { return JSON.parse(t); } catch (e) { return {}; }
}

function gravarUsuarios_(u) {
  PropertiesService.getScriptProperties().setProperty('USUARIOS', JSON.stringify(u));
}

function login_(usuario, senha) {
  var nome = String(usuario || '').trim().toLowerCase();
  if (!nome || !senha) return { ok: false, erro: 'Informe usuário e senha.' };

  var us = lerUsuarios_();
  var u = us[nome];

  /* a espera vale tanto para usuário inexistente quanto para senha
     errada: sem ela, o tempo de resposta diria qual dos dois é */
  if (!u || u.hash !== resumo_(senha)) {
    Utilities.sleep(800);
    registrar_('login negado', '', nome);
    return { ok: false, erro: 'Usuário ou senha incorretos.' };
  }

  registrar_('login', '', nome);
  return {
    ok: true,
    usuario: nome,
    nome: u.nome || nome,
    token: PropertiesService.getScriptProperties().getProperty('CHAVE_RH')
  };
}

/** Cria ou troca a senha de um usuário do painel.
 *  Rode assim, direto no editor do Apps Script:
 *      trocarSenha('admin', 'NovaSenhaForte123')            */
function trocarSenha(usuario, novaSenha) {
  var nome = String(usuario || '').trim().toLowerCase();
  if (!nome) throw new Error('Informe o usuário.');
  if (!novaSenha || String(novaSenha).length < 8) {
    throw new Error('A senha precisa de pelo menos 8 caracteres.');
  }
  var us = lerUsuarios_();
  var novo = !us[nome];
  us[nome] = { hash: resumo_(novaSenha), nome: (us[nome] && us[nome].nome) || nome };
  gravarUsuarios_(us);
  var m = novo ? 'Usuário ' + nome + ' criado.' : 'Senha de ' + nome + ' trocada.';
  Logger.log(m);
  return m;
}

/** Tira um usuário do painel. */
function removerUsuario(usuario) {
  var nome = String(usuario || '').trim().toLowerCase();
  var us = lerUsuarios_();
  if (!us[nome]) { Logger.log('Não existe usuário ' + nome + '.'); return; }
  delete us[nome];
  gravarUsuarios_(us);
  Logger.log('Usuário ' + nome + ' removido.');
}

/** Lista quem tem acesso ao painel. Mostra os nomes, nunca as senhas. */
function verUsuarios() {
  var us = lerUsuarios_();
  var nomes = Object.keys(us);
  var m = nomes.length ? 'Usuários do painel: ' + nomes.join(', ') : 'Nenhum usuário cadastrado.';
  Logger.log(m);
  return m;
}

/* ============================================================
   ARQUIVOS NO DRIVE

   Cada ficha ganha uma pasta própria dentro de uma pasta por mês.
   As fotos nunca ficam públicas: quem precisa ver, vê pelo painel,
   e o painel só devolve a imagem para quem entrou com usuário e
   senha. Apagar a ficha manda a pasta para a lixeira do Drive.
   ============================================================ */

function pastaRaiz_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('PASTA_RAIZ_ID');
  if (id) {
    try {
      var f = DriveApp.getFolderById(id);
      if (!f.isTrashed()) return f;
    } catch (e) {}
  }
  var nova = DriveApp.createFolder(CFG.PASTA_RAIZ);
  props.setProperty('PASTA_RAIZ_ID', nova.getId());
  return nova;
}

function subPasta_(pai, nome) {
  var it = pai.getFoldersByName(nome);
  return it.hasNext() ? it.next() : pai.createFolder(nome);
}

/* pasta da ficha, criada na primeira foto que chega */
function pastaDaFicha_(sh, linha, o) {
  var col = COLUNAS.indexOf('pasta') + 1;
  var id = sh.getRange(linha, col).getValue();
  if (id) {
    try {
      var f = DriveApp.getFolderById(id);
      if (!f.isTrashed()) return f;
    } catch (e) {}
  }
  var criada = o.criadaEm instanceof Date ? o.criadaEm : new Date();
  var mes = Utilities.formatDate(criada, 'GMT-3', 'yyyy-MM');
  var nome = limparNome_(o.candidato || 'sem nome') + ' - ' + String(o.id).substring(0, 8);
  var pasta = subPasta_(subPasta_(pastaRaiz_(), mes), nome);
  sh.getRange(linha, col).setValue(pasta.getId());
  return pasta;
}

function limparNome_(t) {
  return String(t).replace(/[\\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim().substring(0, 80);
}

function extensao_(mime) {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function guardarArquivo_(d) {
  var sh = aba_('Fichas');
  var n = linhaDaFicha_(sh, d.id);
  if (!n) return { ok: false, erro: 'Ficha não encontrada. O link pode ter sido cancelado pelo RH.' };
  if (!d.dados) return { ok: false, erro: 'Arquivo vazio.' };

  var mime = d.mime || 'image/jpeg';
  if (mime.indexOf('image/') !== 0 && mime !== 'application/pdf') {
    return { ok: false, erro: 'Só entram fotos e PDF.' };
  }

  /* base64 cresce um terço; volta ao tamanho real antes de conferir */
  var bytesAprox = Math.floor(String(d.dados).length * 0.75);
  if (bytesAprox > CFG.MAX_MB * 1024 * 1024) {
    return { ok: false, erro: 'Arquivo acima de ' + CFG.MAX_MB + ' MB.' };
  }

  var o = obj_(sh.getRange(n, 1, 1, COLUNAS.length).getValues()[0]);
  var pasta = pastaDaFicha_(sh, n, o);

  var rotulo = limparNome_((d.rot || d.campo || 'documento') + (d.parte ? ' - ' + d.parte : ''));
  var nomeArq = rotulo + '.' + extensao_(mime);

  /* mesma parte enviada de novo substitui a anterior */
  var antigos = pasta.getFilesByName(nomeArq);
  while (antigos.hasNext()) antigos.next().setTrashed(true);

  var blob = Utilities.newBlob(Utilities.base64Decode(d.dados), mime, nomeArq);
  var arq = pasta.createFile(blob);

  registrar_('arquivo', d.id, nomeArq);
  return {
    ok: true,
    arquivo: {
      campo: d.campo || '',
      parte: d.parte || '',
      driveId: arq.getId(),
      nome: nomeArq,
      mime: mime,
      tamanho: arq.getSize(),
      em: new Date().toISOString()
    }
  };
}

function tirarArquivo_(idFicha, driveId) {
  var sh = aba_('Fichas');
  if (!linhaDaFicha_(sh, idFicha)) return { ok: false, erro: 'Ficha não encontrada.' };
  try { DriveApp.getFileById(driveId).setTrashed(true); } catch (e) {}
  registrar_('arquivo removido', idFicha, driveId);
  return { ok: true };
}

/* só o painel chama: devolve a imagem para exibir sem abrir o Drive */
function baixarArquivo_(driveId) {
  try {
    var arq = DriveApp.getFileById(driveId);
    var b = arq.getBlob();
    return {
      ok: true,
      mime: b.getContentType(),
      nome: arq.getName(),
      dados: Utilities.base64Encode(b.getBytes())
    };
  } catch (e) {
    return { ok: false, erro: 'Arquivo não encontrado no Drive.' };
  }
}

/* ============================================================
   AÇÕES
   ============================================================ */

function criarFicha_(rh) {
  if (!rh || !rh.candidato) return { ok: false, erro: 'Informe ao menos o nome do candidato.' };

  var sh = aba_('Fichas');
  var id = Utilities.getUuid();
  var linha = [];
  for (var i = 0; i < COLUNAS.length; i++) {
    var c = COLUNAS[i];
    if (c === 'id') linha.push(id);
    else if (c === 'criadaEm') linha.push(new Date());
    else if (c === 'status') linha.push('aguardando');
    else if (CAMPOS_RH.indexOf(c) > -1) linha.push(rh[c] || '');
    else linha.push('');
  }
  sh.appendRow(linha);
  registrar_('criar', id, rh.candidato + ' — ' + (rh.posto || ''));
  return { ok: true, id: id };
}

function lerFicha_(id) {
  var sh = aba_('Fichas');
  var n = linhaDaFicha_(sh, id);
  if (!n) return { ok: false, erro: 'Ficha não encontrada. O link pode ter sido cancelado pelo RH.' };
  var o = obj_(sh.getRange(n, 1, 1, COLUNAS.length).getValues()[0]);
  var f = montarFicha_(o);
  /* o candidato não precisa ver a anotação interna do RH */
  delete f.observacoes;
  return { ok: true, ficha: f };
}

function salvarFicha_(id, dados) {
  if (!dados || typeof dados !== 'object') return { ok: false, erro: 'Nada para salvar.' };

  var sh = aba_('Fichas');
  var n = linhaDaFicha_(sh, id);
  if (!n) return { ok: false, erro: 'Ficha não encontrada. O link pode ter sido cancelado pelo RH.' };

  var assinatura = dados.assinatura || '';
  var copia = {};
  for (var k in dados) {
    if (dados.hasOwnProperty(k) && k !== 'assinatura') copia[k] = dados[k];
  }

  var texto = JSON.stringify(copia);
  if (texto.length > 45000) return { ok: false, erro: 'Ficha grande demais para salvar. Avise o RH.' };
  if (assinatura.length > 45000) assinatura = '';

  var atual = obj_(sh.getRange(n, 1, 1, COLUNAS.length).getValues()[0]);
  var agora = new Date();

  sh.getRange(n, COLUNAS.indexOf('dados') + 1).setValue(texto);
  sh.getRange(n, COLUNAS.indexOf('assinatura') + 1).setValue(assinatura);
  sh.getRange(n, COLUNAS.indexOf('enviadaEm') + 1).setValue(agora);
  if (atual.status !== 'conferida') {
    sh.getRange(n, COLUNAS.indexOf('status') + 1).setValue('preenchida');
  }

  registrar_('salvar', id, atual.candidato);
  return { ok: true, enviadaEm: agora.toISOString() };
}

function listarFichas_() {
  var sh = aba_('Fichas');
  var ultima = sh.getLastRow();
  if (ultima < 2) return { ok: true, fichas: [] };

  var valores = sh.getRange(2, 1, ultima - 1, COLUNAS.length).getValues();
  var fora = { dados: 1, assinatura: 1, pasta: 1 };
  var lista = [];

  for (var i = 0; i < valores.length; i++) {
    var o = obj_(valores[i]);
    if (!o.id) continue;
    var item = {};
    for (var j = 0; j < COLUNAS.length; j++) {
      var c = COLUNAS[j];
      if (fora[c]) continue;
      item[c] = (o[c] instanceof Date) ? iso_(o[c]) : (o[c] || '');
    }
    if (o.admissao instanceof Date) {
      item.admissao = Utilities.formatDate(o.admissao, 'GMT-3', 'yyyy-MM-dd');
    }
    item.status = item.status || 'aguardando';
    lista.push(item);
  }
  return { ok: true, fichas: lista };
}

function detalheFicha_(id) {
  var sh = aba_('Fichas');
  var n = linhaDaFicha_(sh, id);
  if (!n) return { ok: false, erro: 'Ficha não encontrada.' };
  var o = obj_(sh.getRange(n, 1, 1, COLUNAS.length).getValues()[0]);
  return { ok: true, ficha: montarFicha_(o) };
}

function anotar_(id, observacoes, status) {
  var sh = aba_('Fichas');
  var n = linhaDaFicha_(sh, id);
  if (!n) return { ok: false, erro: 'Ficha não encontrada.' };

  if (typeof observacoes === 'string') {
    sh.getRange(n, COLUNAS.indexOf('observacoes') + 1).setValue(observacoes.substring(0, 5000));
  }
  if (status && ['aguardando', 'preenchida', 'conferida'].indexOf(status) > -1) {
    sh.getRange(n, COLUNAS.indexOf('status') + 1).setValue(status);
  }
  registrar_('anotar', id, status || 'observação');
  return { ok: true };
}

function apagarFicha_(id) {
  var sh = aba_('Fichas');
  var n = linhaDaFicha_(sh, id);
  if (!n) return { ok: false, erro: 'Ficha não encontrada.' };
  var nome = sh.getRange(n, COLUNAS.indexOf('candidato') + 1).getValue();
  var pasta = sh.getRange(n, COLUNAS.indexOf('pasta') + 1).getValue();
  if (pasta) {
    try { DriveApp.getFolderById(pasta).setTrashed(true); } catch (e) {}
  }
  sh.deleteRow(n);
  registrar_('apagar', id, nome);
  return { ok: true };
}
