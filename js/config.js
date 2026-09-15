/* ============================================================
   Vegas — Ficha de admissão / configuração

   Aqui vai só o que pode ser público. O link da ficha é aberto
   pelo candidato, sem senha, então tudo neste arquivo é visível
   para quem abrir o código-fonte da página.

   A CHAVE DO RH NÃO ENTRA AQUI. Ela é digitada uma vez no
   painel e fica guardada no aparelho de quem usa o painel.
   Se ela estivesse neste arquivo, qualquer candidato conseguiria
   listar as fichas de todo mundo.
   ============================================================ */

window.ADM_CONFIG = {

  /* URL do aplicativo da web do Admissao.gs, terminada em /exec.
     É um Apps Script separado do sistema de levantamento. */
  url: '',

  /* Preenchimento automático do formulário do RH. Nada secreto:
     são dados que já saem impressos na ficha do candidato. */
  empresa: {
    razao: '',
    cnpj: '',
    telRh: ''
  },

  /* Prazo que aparece para o candidato, em horas corridas a
     partir do momento em que ele abre o link pela primeira vez.
     O texto original da ficha é "até às 10h do dia seguinte". */
  textoPrazo: 'Envie tudo até às 10h do próximo dia útil.'
};
