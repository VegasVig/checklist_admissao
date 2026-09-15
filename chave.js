/* ============================================================
   Vegas — Ficha de admissão / chave do painel

   Cole aqui a CHAVE DO RH que a função instalar() mostrou no
   Apps Script. Feito isso, o painel abre direto, sem pedir nada
   a ninguém, em qualquer aparelho.

   POR QUE ESTE ARQUIVO É SEPARADO DO config.js

   O config.js é carregado pelas duas telas: o painel e a ficha
   do candidato. Este aqui é carregado só pelo painel.

   Se a chave estivesse no config.js, ela iria junto na ficha do
   candidato. Qualquer candidato que abrisse o código-fonte da
   própria ficha teria a chave, e com ela leria CPF, conta
   bancária e nome de filho de todos os outros candidatos.

   Então: URL no config.js, chave aqui. Não junte os dois.

   AINDA ASSIM, LEIA ISTO

   Num site publicado no GitHub Pages, todo arquivo é público.
   Quem souber o endereço deste arquivo consegue baixá-lo e ler
   a chave. Manter o painel num repositório separado da ficha
   ajuda, porque o candidato nunca vê o endereço do painel, mas
   não é uma parede.

   Se algum dia isso incomodar, é só deixar em branco: o painel
   volta a pedir a chave uma vez por aparelho.

   Trocou alguém do RH? Rode gerarNovaChave() no Apps Script,
   atualize a linha abaixo e publique. A chave velha morre na hora.
   ============================================================ */

window.ADM_CHAVE = '';
