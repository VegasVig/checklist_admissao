# Ficha de admissão — Vegas

Substitui o check list em Word. O RH preenche o que era vermelho, manda um link,
o candidato termina de preencher no celular, e tudo cai numa planilha do Google.
Do painel você acompanha, anota e exporta o PDF da ficha.

Este módulo é **separado** do sistema de levantamento de segurança: outra planilha,
outro Apps Script, outra chave. É de propósito. Aqui trafegam CPF, conta bancária e
nome de filho menor de idade; misturar com os planos de segurança dos clientes
ampliaria quem tem acesso a esses dados sem necessidade.

---

## O que tem dentro

| Arquivo | Para que serve |
|---|---|
| `index.html` | Painel do RH. Abrir ficha, acompanhar, exportar. |
| `ficha.html` | A tela que o candidato recebe pelo link. |
| `Admissao.gs` | Backend no Apps Script. Cria a planilha e responde às duas telas. |
| `js/config.js` | Endereço da planilha e dados fixos da empresa. **Você edita este.** |
| `js/campos.js` | As perguntas da ficha. **Você edita este** para incluir ou tirar itens. |
| `js/ficha.js` | Montagem, validação e envio da ficha do candidato. |
| `js/rh.js` | Painel do RH. |
| `js/documento.js` | Monta o PDF da ficha. |
| `js/api.js` | Conversa com o Apps Script. |
| `js/logo.js` | A logo embutida, para funcionar offline e sair no PDF. |
| `exemplos/` | Uma ficha preenchida, para você ver o resultado antes de instalar. |

---

## Instalar

### 1. O backend

1. Acesse **script.google.com** e crie um projeto novo
2. Apague o `Code.gs` em branco e cole o conteúdo de **`Admissao.gs`** inteiro
3. Salve, escolha a função **`instalar`** na lista ao lado do botão Executar e rode
4. Autorize quando o Google pedir. Em "app não verificado", abra **Avançado** e
   continue: o app é seu
5. Anote a **CHAVE DO RH** que aparece no registro de execução. É uma sequência de
   20 letras e números
6. **Implantar → Nova implantação → Aplicativo da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
7. Copie a URL terminada em `/exec`

O passo 6 assusta, mas é necessário: o candidato abre o link sem ter conta Google.
Quem protege o painel é a chave, não a publicação.

### 2. O site

Abra `js/config.js` e cole:

```js
window.ADM_CONFIG = {
  url: 'https://script.google.com/macros/s/AKfy.../exec',
  empresa: {
    razao: 'Vegas Vigilância e Segurança Ltda',
    cnpj:  '00.000.000/0001-00',
    telRh: '(24) 0000-0000'
  },
  textoPrazo: 'Envie tudo até às 10h do próximo dia útil.'
};
```

O bloco `empresa` só preenche o formulário do RH automaticamente. Nada ali é secreto:
esses três dados já saem impressos na ficha do candidato.

Suba a pasta `admissao` para o mesmo repositório do GitHub onde está o sistema de
levantamento. O painel fica em `seu-site/admissao/`.

### 3. Entrar no painel

Abra `seu-site/admissao/`, digite a chave do RH e entre. A chave fica guardada
naquele aparelho e não é pedida de novo.

**A chave do RH não vai no `config.js`.** Se fosse, qualquer candidato que abrisse o
código-fonte da própria ficha conseguiria listar os dados de todos os outros. Cada
pessoa do RH digita a chave uma vez, no aparelho dela.

---

## Usar

**Abrir uma ficha.** Preencha os nove campos que eram vermelhos no Word. Razão social,
CNPJ, posto, telefone do RH e horário já vêm preenchidos do uso anterior. Toque em
**Gerar link do candidato**.

**Mandar.** Se você informou o WhatsApp do candidato, o botão abre a conversa com a
mensagem e o link já escritos. Senão, copie o link.

**O candidato preenche.** A ficha funciona em qualquer celular, sem instalar nada e sem
conta. O que ele digita fica salvo no aparelho a cada toque: se acabar a bateria ou
cair a internet, ele reabre o link e continua de onde parou. O rodapé mostra o tempo
todo quantos itens faltam e quais são.

**Os documentos continuam indo pelo WhatsApp.** A ficha registra as respostas, não
carrega arquivos. Isso foi mantido de propósito: os originais do check list mandam
enviar em PDF nomeado, e em caso urgente por mensagem temporária, o que não
funcionaria se os arquivos ficassem parados num Drive.

**Conferir.** Na aba Fichas você vê quem já respondeu. Abra uma ficha para ler tudo,
escrever a observação (documento que faltou e o motivo) e marcar como conferida.
A observação sai no PDF.

**Exportar.** O botão PDF abre o documento pronto numa aba nova. Toque em imprimir e
escolha salvar em PDF. Funciona no celular e no computador. Sai com a logo, os
dados do posto, todas as respostas, as quatro declarações e a assinatura do candidato.

---

## Mexer nas perguntas

Tudo está em `js/campos.js`, num formato legível. Para acrescentar uma pergunta,
copie uma linha parecida e mude o `id`, o `rot` e o `tipo`.

Tipos disponíveis: `check` (caixa de marcar), `simnao`, `texto`, `tel`, `email`,
`cpf`, `data`, `num`, `moeda`, `opcao` (lista), `area` (texto longo),
`filhos` e `assinatura`.

- `obrig: true` faz o item entrar na conta do que falta
- `se: 'campo=Valor'` só mostra a pergunta quando a outra foi respondida assim
- `nota: 'texto'` põe uma observação cinza ao lado do rótulo
- `link` e `linkRot` colocam um link, como nas certidões

Uma regra especial: a ATA vira obrigatória sozinha quando a função digitada pelo RH
contém "vigilante". É a exigência da Lei 7.102/1983 e da Portaria 3.233/2012 da
Polícia Federal. Está em `ajustarPorFuncao`, no fim do `campos.js`.

Mexeu no arquivo, suba para o GitHub. As três telas mudam juntas.

---

## Atualizar o Admissao.gs depois

**Implantar → Gerenciar implantações → editar (lápis) a existente → Versão: Nova
versão → Implantar.**

Criar implantação nova gera outra URL e os links já enviados aos candidatos param de
funcionar.

---

## Proteção de dados

Esta ficha guarda dado sensível de pessoa física. Vale tratar com cuidado.

**O link é a senha.** Cada ficha tem um código aleatório de 36 caracteres. Quem tem o
link vê aquela ficha, e só aquela. Mande pelo WhatsApp do candidato, não em grupo.

**O painel é protegido pela chave.** Trocou alguém do RH? Rode `gerarNovaChave` no
Apps Script. Quem usava o painel entra de novo com a chave nova, e quem saiu perde o
acesso na hora.

**A planilha é o cofre.** Compartilhe com o mínimo de pessoas. Ela tem CPF, conta
bancária e nome de filho menor.

**Apague o que não serve mais.** Guardar dado bancário de quem não foi contratado,
sem prazo, é passivo. A função `fichasParaExpurgo` lista o que passou de 24 meses;
o prazo está em `CFG.RETENCAO_MESES`, no começo do `Admissao.gs`. Rode de vez em
quando e apague o que já cumpriu a finalidade.

**Ficha cancelada.** Apagar a ficha no painel tira a linha da planilha e derruba o
link. Use quando a vaga cair.

---

## Quando der problema

| Sintoma | O que é |
|---|---|
| *Chave do RH inválida* | Rode `verChave` no Apps Script e confira. Depois de `gerarNovaChave`, todo mundo entra de novo. |
| *Ficha não encontrada* no link do candidato | A ficha foi apagada no painel, ou o link veio cortado pelo WhatsApp. Gere de novo. |
| *O servidor respondeu em formato inesperado* | A publicação não está como "Qualquer pessoa". Refaça o passo 6. |
| O painel some depois de editar o `Admissao.gs` | Você criou implantação nova. Volte para a implantação antiga ou atualize a URL no `config.js`. |
| O PDF não abre | O navegador bloqueou a aba nova. Libere pop-ups para o endereço do site. Acontece uma vez por aparelho. |
| A data aparece mm/dd/aaaa | É o idioma do navegador, não do site. Em celular configurado em português sai dd/mm/aaaa. |
| Candidato diz que perdeu o que preencheu | Peça para reabrir o mesmo link no mesmo navegador. O rascunho fica no aparelho. Se ele trocou de celular, aí perdeu mesmo. |

---

## Antes de rodar com todo mundo

1. Faça uma ficha de teste com o seu próprio nome e preencha até o fim, no celular.
   Você vê o que o candidato vê e descobre o que falta perguntar.
2. Leia as quatro declarações com o jurídico. Elas são o que sustenta a ficha se a
   admissão der problema depois.
3. Decida quem do RH tem a chave. Cada pessoa a mais é uma cópia a mais dos dados.
