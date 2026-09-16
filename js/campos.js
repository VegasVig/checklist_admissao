/* ============================================================
   Vegas — Ficha de admissão
   Definição única dos campos. Usada pela ficha do candidato,
   pelo painel do RH e pelo gerador de PDF. Mexer aqui muda
   as três telas de uma vez.
   ============================================================ */

/* ---------- o que o RH preenche antes de mandar o link ---------- */
window.CAMPOS_RH = [
  { id: 'razao',     rot: 'Razão social',            tipo: 'texto',  obrig: true,  larg: 'cheia',
    ajuda: 'Como aparece no contrato e no cabeçalho da ficha.' },
  { id: 'cnpj',      rot: 'CNPJ',                    tipo: 'cnpj',   obrig: true },
  { id: 'posto',     rot: 'Posto de serviço',        tipo: 'texto',  obrig: true },
  { id: 'candidato', rot: 'Nome do candidato',       tipo: 'texto',  obrig: true,  larg: 'cheia' },
  { id: 'whatsapp',  rot: 'WhatsApp do candidato',   tipo: 'tel',    obrig: false,
    ajuda: 'Com DDD. Libera o botão de enviar o link direto.' },
  { id: 'funcao',    rot: 'Função',                  tipo: 'texto',  obrig: true },
  { id: 'salario',   rot: 'Salário',                 tipo: 'texto',  obrig: true,  dica: 'R$ 0,00' },
  { id: 'horario',   rot: 'Horário de trabalho',     tipo: 'texto',  obrig: true,  dica: '12x36 diurno, 7h às 19h' },
  { id: 'admissao',  rot: 'Data de admissão prevista', tipo: 'data', obrig: true,
    ajuda: 'Pode ter alteração. O candidato vê esse aviso.' },
  { id: 'telRh',     rot: 'Telefone do RH para contato', tipo: 'tel', obrig: true, larg: 'cheia',
    ajuda: 'Aparece na ficha, para o candidato tirar dúvidas. Os documentos ele manda pelo próprio formulário.' }
];

/* ---------- seções do candidato ----------
   tipos: check | simnao | texto | tel | data | email | cpf | num | moeda | area | opcao
   'se' esconde o campo até a condição bater.                    */
window.SECOES_CANDIDATO = [

  {
    id: 'documentos',
    nome: 'Documentos pessoais',
    texto: 'Fotografe cada documento com o próprio celular. Apoie numa superfície clara, ' +
           'sem sombra em cima, e confira se dá para ler antes de enviar.',
    campos: [
      { id: 'doc_ctps',     rot: 'Carteira de Trabalho Digital', tipo: 'foto', obrig: true,
        ajuda: 'No aplicativo CTPS Digital, toque em Contratos e depois em compartilhar. Serve a foto da tela ou o PDF.' },
      { id: 'doc_cpf',      rot: 'CPF',                          tipo: 'foto', obrig: true,
        ajuda: 'Se o número já estiver no seu RG ou na CNH, pode mandar o mesmo documento aqui.' },
      { id: 'doc_rg',       rot: 'RG',                           tipo: 'foto', obrig: true,
        partes: ['Frente', 'Verso'] },

      { id: 'tem_cnh',      rot: 'Você tem CNH válida?',         tipo: 'simnao', obrig: true },
      { id: 'doc_cnh',      rot: 'CNH',                          tipo: 'foto', se: 'tem_cnh=Sim', obrig: true,
        partes: ['Frente', 'Verso'],
        ajuda: 'Se usa a CNH digital, o PDF do aplicativo Carteira Digital de Trânsito também serve.' },

      { id: 'doc_residencia', rot: 'Comprovante de residência',  tipo: 'foto', obrig: true,
        ajuda: 'Conta de luz, água ou telefone dos últimos três meses. Pode estar no nome de outra pessoa da casa.' },
      { id: 'doc_titulo',   rot: 'Título de eleitor',            tipo: 'foto', obrig: true },
      { id: 'doc_reservista', rot: 'Certificado de reservista',  tipo: 'foto',
        nota: 'só homens até 45 anos', partes: ['Frente', 'Verso'] },

      { id: 'doc_ata',      rot: 'ATA — curso de formação de vigilante', tipo: 'foto',
        nota: 'obrigatório para vigilante' },
      { id: 'doc_cnv',      rot: 'CNV — Carteira Nacional de Vigilante', tipo: 'foto',
        nota: 'se você já tem', partes: ['Frente', 'Verso'] },

      { id: 'doc_escolaridade', rot: 'Comprovante de escolaridade', tipo: 'foto', obrig: true,
        ajuda: 'Histórico, diploma ou declaração da escola.' },
      { id: 'doc_certidao', rot: 'Certidão de nascimento ou casamento', tipo: 'foto', obrig: true },

      { id: 'doc_selfie',   rot: 'Selfie com fundo branco',      tipo: 'foto', obrig: true,
        camera: 'user',
        ajuda: 'Fica no lugar da antiga foto 3x4. De frente para uma parede branca, rosto inteiro, ' +
               'sem boné, sem óculos escuros e sem ninguém atrás. Luz de frente, não de costas.' }
    ]
  },

  {
    id: 'familia',
    nome: 'Cônjuge e filhos',
    texto: 'Serve para o imposto de renda e para o salário-família.',
    campos: [
      { id: 'conjuge_dep',  rot: 'Cônjuge será seu dependente no imposto de renda?', tipo: 'simnao', obrig: true },
      { id: 'conjuge_nome', rot: 'Nome do cônjuge',              tipo: 'texto', se: 'conjuge_dep=Sim', obrig: true, larg: 'cheia' },
      { id: 'conjuge_nasc', rot: 'Data de nascimento do cônjuge', tipo: 'data',  se: 'conjuge_dep=Sim', obrig: true },

      { id: 'tem_filhos',   rot: 'Tem filhos menores de 14 anos?', tipo: 'simnao', obrig: true },
      { id: 'filhos',       rot: 'Filhos',                       tipo: 'filhos', se: 'tem_filhos=Sim', obrig: true },

      { id: 'dep_certidao', rot: 'Certidão de nascimento dos filhos', tipo: 'foto', se: 'tem_filhos=Sim', obrig: true,
        varios: true, ajuda: 'Uma foto por filho. Toque em adicionar para mandar a próxima.' },
      { id: 'dep_cpf',      rot: 'CPF dos filhos',               tipo: 'foto', se: 'tem_filhos=Sim',
        varios: true, nota: 'se já tiverem CPF emitido' },
      { id: 'dep_escola',   rot: 'Comprovante de frequência escolar', tipo: 'foto', se: 'tem_filhos=Sim',
        varios: true, nota: 'filhos de 7 a 14 anos',
        ajuda: 'A declaração que a escola emite. Uma por filho nessa idade.' },
      { id: 'dep_vacina',   rot: 'Caderneta de vacinação',       tipo: 'foto', se: 'tem_filhos=Sim',
        nota: 'filhos de até 7 anos',
        partes: ['Página de identificação', 'Página das vacinas'],
        ajuda: 'São duas fotos: a página com o nome da criança e a página onde ficam as doses carimbadas.' }
    ]
  },

  {
    id: 'transporte',
    nome: 'Vale transporte',
    campos: [
      { id: 'vt',           rot: 'Você quer receber vale transporte?', tipo: 'simnao', obrig: true },
      { id: 'vt_qtd',       rot: 'Quantas passagens por dia',    tipo: 'num',   se: 'vt=Sim', obrig: true,
        ajuda: 'Conte ida e volta. Dois ônibus na ida e dois na volta são 4.' },
      { id: 'vt_valor',     rot: 'Valor gasto por dia',          tipo: 'moeda', se: 'vt=Sim', obrig: true, dica: 'R$ 0,00' },
      { id: 'vt_linhas',    rot: 'Quais linhas você pega',       tipo: 'texto', se: 'vt=Sim', larg: 'cheia' },
      { id: 'vt_cartao',    rot: 'Você já tem cartão de passagem?', tipo: 'simnao', se: 'vt=Sim', obrig: true },
      { id: 'vt_cartao_foto', rot: 'Foto do cartão de passagem', tipo: 'foto', se: 'vt_cartao=Sim', obrig: true,
        ajuda: 'O lado onde aparece o número.' }
    ]
  },

  {
    id: 'uniforme',
    nome: 'Uniforme',
    campos: [
      { id: 'uni_blusa',  rot: 'Blusa',  tipo: 'opcao', obrig: true, opcoes: ['PP', 'P', 'M', 'G', 'GG', 'XG'] },
      { id: 'uni_calca',  rot: 'Calça',  tipo: 'texto', obrig: true, dica: '42' },
      { id: 'uni_sapato', rot: 'Sapato', tipo: 'texto', obrig: true, dica: '41' },
      { id: 'tatuagem',   rot: 'Tem tatuagem nas mãos?', tipo: 'simnao', obrig: true,
        ajuda: 'Não impede a contratação. O RH precisa saber por causa da norma de alguns postos.' }
    ]
  },

  {
    id: 'banco',
    nome: 'Dados bancários',
    texto: 'É por onde entra o seu salário. Confira dígito por dígito.',
    campos: [
      { id: 'pix',        rot: 'Chave PIX',        tipo: 'texto', larg: 'cheia',
        ajuda: 'CPF, telefone, e-mail ou chave aleatória. Preencha o PIX ou a conta abaixo.' },
      { id: 'banco',      rot: 'Banco',            tipo: 'texto' },
      { id: 'agencia',    rot: 'Agência',          tipo: 'texto' },
      { id: 'conta',      rot: 'Número da conta',  tipo: 'texto', ajuda: 'Com o dígito.' },
      { id: 'tipo_conta', rot: 'Tipo de conta',    tipo: 'opcao', opcoes: ['Conta corrente', 'Poupança'] },
      { id: 'email_ponto', rot: 'E-mail para o aplicativo de ponto', tipo: 'email', obrig: true, larg: 'cheia',
        ajuda: 'É por ele que você recebe o acesso para bater o ponto.' }
    ]
  },

  {
    id: 'pensao',
    nome: 'Pensão alimentícia',
    campos: [
      { id: 'pensao',     rot: 'Você paga pensão descontada em folha?', tipo: 'simnao', obrig: true },
      { id: 'pensao_doc', rot: 'Decisão judicial ou acordo', tipo: 'foto', se: 'pensao=Sim', obrig: true,
        varios: true, ajuda: 'Sem o documento, o desconto não pode ser feito. Pode mandar mais de uma página.' }
    ]
  },

  {
    id: 'certidoes',
    nome: 'Certidões negativas',
    texto: 'Três certidões, todas gratuitas e emitidas na hora. Toque no link, baixe o PDF e envie aqui mesmo.',
    campos: [
      { id: 'cert_eleitoral', rot: 'Justiça Eleitoral', tipo: 'foto', obrig: true,
        link: 'https://www.tse.jus.br/servicos-eleitorais/certidoes/certidao-de-quitacao-eleitoral',
        linkRot: 'Emitir no site do TSE' },
      { id: 'cert_federal',   rot: 'Justiça Federal',   tipo: 'foto', obrig: true,
        link: 'https://certidao-unificada.cjf.jus.br/#/solicitacao-certidao',
        linkRot: 'Emitir no site do CJF' },
      { id: 'cert_estadual',  rot: 'Justiça Criminal Estadual', tipo: 'foto', obrig: true, varios: true,
        link: 'https://www3.tjrj.jus.br/CJE/certidao',
        linkRot: 'Emitir no site do TJRJ',
        ajuda: 'O link é do Rio de Janeiro. Se você morou em outro estado nos últimos 5 anos, emita também no tribunal de lá.' }
    ]
  },

  {
    id: 'declaracao',
    nome: 'Declaração',
    campos: [
      { id: 'dec_nome', rot: 'Seu nome completo', tipo: 'texto', obrig: true, larg: 'cheia' },
      { id: 'dec_cpf',  rot: 'Seu CPF',           tipo: 'cpf',   obrig: true },
      { id: 'dec_ciente', rot: 'Li o checklist inteiro e entendi os prazos', tipo: 'check', obrig: true },
      { id: 'dec_verdade', rot: 'As informações que preenchi são verdadeiras', tipo: 'check', obrig: true },
      { id: 'dec_prazo', rot: 'Entendi que documento faltando pode inviabilizar a admissão', tipo: 'check', obrig: true },
      { id: 'dec_lgpd', rot: 'Autorizo o uso dos meus dados para a admissão, conforme a LGPD', tipo: 'check', obrig: true },
      { id: 'assinatura', rot: 'Assinatura', tipo: 'assinatura', obrig: true }
    ]
  }
];

/* as quatro linhas da declaração, como saem no PDF */
window.TEXTO_DECLARACOES = [
  'A entrega dos documentos é obrigatória.',
  'As informações prestadas são verdadeiras.',
  'O não envio ou o envio incompleto pode inviabilizar a admissão.',
  'Autorizo o tratamento dos meus dados pessoais conforme a LGPD.'
];

/* ---------- utilidades ---------- */

/* A ATA é o curso de formação. Sem ela, vigilante não entra em
   posto: Lei 7.102/1983 e Portaria 3.233/2012 da Polícia Federal.
   Então, se a função que o RH digitou for de vigilante, ela deixa
   de ser opcional. */
window.ajustarPorFuncao = function (funcao) {
  var ehVigilante = /vigilante|seguran[çc]a\s*patrimonial/i.test(String(funcao || ''));
  window.SECOES_CANDIDATO.forEach(function (s) {
    s.campos.forEach(function (c) {
      if (c.id === 'doc_ata') c.obrig = ehVigilante;
    });
  });
  return ehVigilante;
};

window.todosCampos = function () {
  var t = [];
  window.SECOES_CANDIDATO.forEach(function (s) {
    s.campos.forEach(function (c) { t.push(Object.assign({ secao: s.id }, c)); });
  });
  return t;
};

/* o campo está visível com as respostas atuais? */
window.campoVisivel = function (campo, resp) {
  if (!campo.se) return true;
  var p = campo.se.split('=');
  return (resp[p[0]] || '') === p[1];
};

/* quantas fotos aquele campo espera, e quais os rótulos delas */
window.partesDe = function (campo) {
  if (campo.partes && campo.partes.length) return campo.partes.slice();
  return [''];
};

/* arquivos já enviados de um campo: sempre uma lista */
window.arquivosDe = function (resp, id) {
  var v = resp[id];
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
};

/* o campo de foto está completo? */
window.fotoCompleta = function (campo, resp) {
  var arqs = window.arquivosDe(resp, campo.id);
  if (!arqs.length) return false;
  if (campo.partes && campo.partes.length) {
    return campo.partes.every(function (p) {
      return arqs.some(function (a) { return a.parte === p; });
    });
  }
  return true;
};

/* o que falta da foto, dito em uma linha */
window.faltaNaFoto = function (campo, resp) {
  var arqs = window.arquivosDe(resp, campo.id);
  if (campo.partes && campo.partes.length) {
    var faltando = campo.partes.filter(function (p) {
      return !arqs.some(function (a) { return a.parte === p; });
    });
    if (!faltando.length) return '';
    if (faltando.length === campo.partes.length) return campo.rot;
    return campo.rot + ' (' + faltando.join(' e ') + ')';
  }
  return arqs.length ? '' : campo.rot;
};

/* lista do que ainda falta, em linguagem de quem preenche */
window.pendencias = function (resp) {
  var faltas = [];
  window.SECOES_CANDIDATO.forEach(function (s) {
    s.campos.forEach(function (c) {
      if (!c.obrig || !window.campoVisivel(c, resp)) return;

      if (c.tipo === 'foto') {
        var falta = window.faltaNaFoto(c, resp);
        if (falta) faltas.push({ secao: s.id, secaoNome: s.nome, id: c.id, rot: falta });
        return;
      }

      var v = resp[c.id];
      var vazio = (c.tipo === 'check') ? v !== true
                : (c.tipo === 'filhos') ? !(v && v.length && v.every(function (f) { return f.nome; }))
                : !v;
      if (vazio) faltas.push({ secao: s.id, secaoNome: s.nome, id: c.id, rot: c.rot });
    });
  });
  /* PIX ou conta: um dos dois */
  var temPix = !!resp.pix;
  var temConta = !!(resp.banco && resp.agencia && resp.conta && resp.tipo_conta);
  if (!temPix && !temConta) {
    faltas.push({ secao: 'banco', secaoNome: 'Dados bancários', id: 'pix',
      rot: 'Chave PIX ou banco, agência e conta' });
  }
  return faltas;
};

window.cpfValido = function (cpf) {
  var s = String(cpf || '').replace(/\D/g, '');
  if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;
  var i, soma = 0;
  for (i = 0; i < 9; i++) soma += parseInt(s.charAt(i), 10) * (10 - i);
  var d1 = (soma * 10) % 11; if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(s.charAt(9), 10)) return false;
  soma = 0;
  for (i = 0; i < 10; i++) soma += parseInt(s.charAt(i), 10) * (11 - i);
  var d2 = (soma * 10) % 11; if (d2 === 10) d2 = 0;
  return d2 === parseInt(s.charAt(10), 10);
};

window.cnpjValido = function (cnpj) {
  var s = String(cnpj || '').replace(/\D/g, '');
  if (s.length !== 14 || /^(\d)\1{13}$/.test(s)) return false;
  var calc = function (base, pesos) {
    var soma = 0;
    for (var i = 0; i < pesos.length; i++) soma += parseInt(base.charAt(i), 10) * pesos[i];
    var r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  var d1 = calc(s, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  var d2 = calc(s, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === parseInt(s.charAt(12), 10) && d2 === parseInt(s.charAt(13), 10);
};

window.formatarCpf = function (v) {
  var s = String(v || '').replace(/\D/g, '').slice(0, 11);
  return s.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};
window.formatarCnpj = function (v) {
  var s = String(v || '').replace(/\D/g, '').slice(0, 14);
  return s.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};
window.formatarTel = function (v) {
  var s = String(v || '').replace(/\D/g, '').slice(0, 11);
  if (s.length <= 10) return s.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  return s.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};
window.dataBr = function (iso) {
  if (!iso) return '';
  var p = String(iso).slice(0, 10).split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
};
