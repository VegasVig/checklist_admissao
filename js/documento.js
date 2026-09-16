/* ============================================================
   Vegas — Documento da ficha de admissão
   Monta um HTML com CSS de impressão e abre numa aba nova.
   O usuário imprime e escolhe salvar em PDF. Funciona offline
   e sai com tipografia melhor do que um PDF montado por script.
   ============================================================ */

(function () {

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function cx(marcado) { return marcado ? '☑' : '☐'; }

  function arqs(d, id) {
    var v = d[id];
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }

  function recebido(c, d) {
    var l = arqs(d, c.id);
    if (!l.length) return false;
    if (c.partes && c.partes.length) {
      return c.partes.every(function (pt) {
        return l.some(function (a) { return a.parte === pt; });
      });
    }
    return true;
  }

  function detalheArquivo(c, d) {
    var l = arqs(d, c.id);
    if (!l.length) return 'não enviado';
    if (c.partes && c.partes.length) {
      var faltam = c.partes.filter(function (pt) {
        return !l.some(function (a) { return a.parte === pt; });
      });
      if (faltam.length) return 'falta ' + faltam.join(' e ').toLowerCase();
      return c.partes.length + ' arquivos';
    }
    return l.length > 1 ? l.length + ' arquivos' : '1 arquivo';
  }

  function valorTexto(c, dados) {
    var v = dados[c.id];
    if (c.tipo === 'check') return cx(v === true);
    if (c.tipo === 'data') return window.dataBr(v) || '—';
    if (c.tipo === 'filhos') {
      if (!v || !v.length) return '—';
      return v.filter(function (f) { return f.nome; })
              .map(function (f) { return f.nome + (f.idade ? ' (' + f.idade + ' anos)' : ''); })
              .join('; ');
    }
    return v || '—';
  }

  window.gerarDocumento = function (ficha) {
    var w = window.open('', '_blank');
    if (!w) { alert('O navegador bloqueou a janela. Libere pop-ups para este site e tente de novo.'); return; }
    w.document.open();
    w.document.write(montar(ficha));
    w.document.close();
  };

  function montar(ficha) {
    var rh = ficha.rh || {};
    if (window.ajustarPorFuncao) window.ajustarPorFuncao(rh.funcao);
    var d = ficha.dados || {};
    var logo = window.VEGAS_LOGO.escura;
    var vazia = !Object.keys(d).length;

    var corpo = '';

    /* cabeçalho */
    var selfie = arqs(d, 'doc_selfie')[0];

    corpo += '<div class="capa">' +
      '<img class="logo" src="' + logo + '" alt="Vegas">' +
      '<h1>Check list de admissão</h1>' +
      (selfie && selfie.previa
        ? '<img class="retrato" src="' + selfie.previa + '" alt="">' : '') +
      '<table class="cab"><tbody>' +
      lin('Empresa', rh.razao) +
      lin('CNPJ', rh.cnpj) +
      lin('Posto de serviço', rh.posto) +
      lin('Candidato', rh.candidato) +
      lin('Função', rh.funcao) +
      lin('Salário', rh.salario) +
      lin('Horário', rh.horario) +
      lin('Admissão prevista', window.dataBr(rh.admissao) + ' (pode ter alteração)') +
      '</tbody></table></div>';

    /* orientações, como no documento original */
    corpo += '<div class="bloco"><h2>Orientações gerais</h2>' +
      '<p>Os documentos são enviados pelo próprio formulário eletrônico, em foto ou PDF, e ficam ' +
      'guardados na pasta do candidato no Drive da empresa. Recebidos os arquivos, o RH analisa a ' +
      'documentação. Dúvidas e pendências pelo contato ' + esc(window.formatarTel(rh.telRh)) + '. ' +
      'Este documento lista o que foi recebido; as imagens ficam no Drive, não aqui.</p></div>';

    if (vazia) {
      corpo += '<div class="bloco aviso">Ficha ainda não preenchida pelo candidato. ' +
        'As caixas abaixo estão em branco para preenchimento à mão.</div>';
    }

    /* seções */
    window.SECOES_CANDIDATO.forEach(function (s) {
      if (s.id === 'declaracao') return;
      var visiveis = s.campos.filter(function (c) { return vazia || window.campoVisivel(c, d); });
      if (!visiveis.length) return;

      corpo += '<div class="bloco"><h2>' + esc(s.nome) + '</h2>';

      var checks = visiveis.filter(function (c) { return c.tipo === 'check'; });
      var docs   = visiveis.filter(function (c) { return c.tipo === 'foto'; });
      var outros = visiveis.filter(function (c) { return c.tipo !== 'check' && c.tipo !== 'foto'; });

      if (checks.length) {
        corpo += '<ul class="checks">' + checks.map(function (c) {
          return '<li>' + cx(d[c.id] === true) + ' ' + esc(c.rot) +
            (c.nota ? ' <span class="nota">(' + esc(c.nota) + ')</span>' : '') + '</li>';
        }).join('') + '</ul>';
      }

      if (docs.length) {
        corpo += '<table class="dados docs"><tbody>' + docs.map(function (c) {
          return '<tr><th>' + cx(recebido(c, d)) + ' ' + esc(c.rot) +
            (c.nota ? ' <span class="nota">(' + esc(c.nota) + ')</span>' : '') + '</th>' +
            '<td class="leve">' + esc(detalheArquivo(c, d)) + '</td></tr>';
        }).join('') + '</tbody></table>';
      }
      if (outros.length) {
        corpo += '<table class="dados"><tbody>' + outros.map(function (c) {
          if (c.tipo === 'assinatura') return '';
          return '<tr><th>' + esc(c.rot) + '</th><td>' + esc(valorTexto(c, d)) + '</td></tr>';
        }).join('') + '</tbody></table>';
      }
      corpo += '</div>';
    });

    /* observações do RH */
    if (ficha.observacoes) {
      corpo += '<div class="bloco"><h2>Observações do RH</h2><p>' + esc(ficha.observacoes) + '</p></div>';
    }

    /* declaração */
    var nome = d.dec_nome || rh.candidato || '';
    corpo += '<div class="bloco quebra-antes"><h2>Ciência e declarações do candidato</h2>' +
      '<p>Eu, <b>' + esc(nome || '____________________________________') + '</b>, CPF <b>' +
      esc(d.dec_cpf || '__________________') + '</b>, declaro que li, compreendi e estou ciente de todas as ' +
      'informações, orientações e prazos descritos neste checklist de admissão.</p>' +
      '<ul class="checks">' +
      '<li>' + cx(d.dec_ciente) + ' A entrega dos documentos é obrigatória.</li>' +
      '<li>' + cx(d.dec_verdade) + ' As informações prestadas são verdadeiras.</li>' +
      '<li>' + cx(d.dec_prazo) + ' O não envio ou envio incompleto poderá inviabilizar a admissão.</li>' +
      '<li>' + cx(d.dec_lgpd) + ' Autorizo o tratamento dos meus dados pessoais conforme a LGPD.</li>' +
      '</ul>';

    corpo += '<div class="assinaturas">' +
      '<div class="assina-campo">' +
        (d.assinatura ? '<img class="rubrica" src="' + d.assinatura + '" alt="">' : '<div class="rubrica"></div>') +
        '<div class="reta"></div><div class="legenda">' + esc(nome || 'Assinatura do candidato') + '</div>' +
      '</div>' +
      '<div class="assina-campo">' +
        '<div class="rubrica"></div>' +
        '<div class="reta"></div><div class="legenda">Responsável pelo RH</div>' +
      '</div>' +
      '</div>';

    var quando = ficha.enviadaEm ? new Date(ficha.enviadaEm) : null;
    corpo += '<p class="rodape-doc">' +
      (quando && !isNaN(quando)
        ? 'Ficha enviada eletronicamente em ' + quando.toLocaleDateString('pt-BR') + ' às ' +
          quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '.'
        : 'Data: ____ / ____ / ______') +
      (ficha.id ? ' Protocolo ' + esc(ficha.id) + '.' : '') +
      '</p></div>';

    return pagina(corpo, rh.candidato || 'Ficha de admissão', logo);
  }

  function lin(k, v) {
    return '<tr><th>' + esc(k) + '</th><td>' + esc(v || '—') + '</td></tr>';
  }

  function pagina(corpo, titulo, logo) {
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Check list de admissão — ' + esc(titulo) + '</title><style>' + CSS + '</style></head><body>' +
      '<div class="barra no-print">' +
        '<span>Documento pronto. Toque em imprimir e escolha salvar em PDF.</span>' +
        '<button onclick="window.print()">Imprimir ou salvar em PDF</button>' +
      '</div>' +
      '<div class="doc">' +
        corpo +
      '</div></body></html>';
  }

  var CSS = [
    '@page{size:A4;margin:16mm 15mm 18mm}',
    '*{box-sizing:border-box}',
    'body{margin:0;background:#e9ecef;color:#14181d;',
    '  font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:11.5pt;line-height:1.5}',
    '.barra{position:sticky;top:0;z-index:5;background:#14181d;color:#fff;padding:10px 16px;',
    '  display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;font-size:14px}',
    '.barra button{background:#e8a317;color:#1a1205;border:0;border-radius:8px;padding:9px 16px;',
    '  font-weight:650;font-size:15px;cursor:pointer}',
    '.doc{max-width:820px;margin:20px auto;background:#fff;padding:34px 38px 44px;',
    '  box-shadow:0 2px 14px rgba(0,0,0,.14)}',
    '.corrente{display:none}',
    '.capa{border-bottom:2px solid #14181d;padding-bottom:18px;margin-bottom:22px}',
    '.capa .logo{height:44px;width:auto;display:block;margin-bottom:18px}',
    'h1{font-size:21pt;margin:0 0 16px;letter-spacing:-.01em;font-weight:650}',
    'h2{font-size:13pt;margin:0 0 10px;font-weight:620;letter-spacing:-.01em}',
    '.bloco{margin-bottom:22px}',
    'h2{break-after:avoid}',
    'tr,li{break-inside:avoid}',
    '.bloco.aviso{background:#fdf3e2;border-left:4px solid #e8a317;padding:12px 14px}',
    'table{width:100%;border-collapse:collapse}',
    '.cab th,.cab td{text-align:left;padding:4px 0;vertical-align:top;font-size:11pt}',
    '.cab th{width:180px;font-weight:550;color:#5b6570}',
    '.dados th,.dados td{text-align:left;padding:6px 8px;border-bottom:1px solid #dfe4e9;vertical-align:top;font-size:10.5pt}',
    '.dados th{width:52%;font-weight:500;color:#3d4650}',
    '.dados td{font-weight:600}',
    '.dados.docs th{width:70%;font-weight:500}',
    '.dados td.leve{font-weight:400;color:#5b6570;font-size:9.5pt}',
    '.capa{position:relative}',
    '.retrato{position:absolute;top:0;right:0;width:82px;height:104px;object-fit:cover;',
    '  border:1px solid #c9d0d7;border-radius:3px;background:#fff}',
    'ul.checks{list-style:none;margin:0 0 10px;padding:0;columns:2;column-gap:26px}',
    'ul.checks li{margin:0 0 5px;font-size:10.5pt;break-inside:avoid}',
    '.nota{color:#6b7580;font-size:9pt}',
    '.assinaturas{display:flex;gap:40px;margin-top:34px;break-inside:avoid}',
    '.assina-campo{flex:1}',
    '.rubrica{height:62px;display:block;max-width:100%;object-fit:contain;object-position:left bottom}',
    '.reta{border-bottom:1px solid #14181d}',
    '.legenda{font-size:9.5pt;color:#5b6570;padding-top:5px}',
    '.rodape-doc{font-size:9.5pt;color:#5b6570;margin-top:22px;border-top:1px solid #dfe4e9;padding-top:10px}',
    '.quebra-antes{break-before:auto}',
    '@media print{',
    '  body{background:#fff}',
    '  .no-print{display:none!important}',
    '  .doc{max-width:none;margin:0;padding:0;box-shadow:none}',
    '  ul.checks{columns:2}',
    '}'
  ].join('');

})();
