# Ficha de admissão — Vegas

Substitui o check list em Word. O RH preenche o que era vermelho, manda um link,
o candidato termina de preencher no celular **e fotografa cada documento ali mesmo**.
As respostas caem numa planilha do Google e as fotos numa pasta do Drive, uma por
candidato. Do painel você acompanha, vê os documentos, anota e exporta o PDF.

É um sistema fechado em si: site próprio, planilha própria, Apps Script próprio,
chave própria. Não precisa de nada de fora para funcionar.

---

## O que tem dentro

| Arquivo | Para que serve |
|---|---|
| `index.html` | Painel do RH. Abrir ficha, acompanhar, exportar. |
| `ficha.html` | A tela que o candidato recebe pelo link. |
| `Admissao.gs` | Backend no Apps Script. Cria a planilha e responde às duas telas. |
| `js/config.js` | Endereço da planilha e dados fixos da empresa. **Você edita este.** |
| `js/chave.js` | Atalho para abrir o painel sem login. Vem em branco. Só o painel carrega. |
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

O script precisa de autorização para mexer na planilha **e no Drive**. Se você já
tinha instalado a versão anterior, que não usava o Drive, o Google vai pedir a
autorização de novo: rode `instalar()` uma vez no editor e aceite. Sem isso, o
envio de fotos falha e o resto continua funcionando, o que engana.


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

Crie um repositório novo no GitHub e suba o conteúdo desta pasta na raiz dele.
Em **Settings → Pages**, escolha a branch `main`. O painel do RH é o endereço do
site; a ficha do candidato é a mesma pasta com `/ficha.html?id=...`, e o próprio
painel monta esse link.

Use um repositório separado do resto. Assim o endereço da ficha é curto, o que
importa quando ele vai por WhatsApp, e você pode mexer numa coisa sem republicar
a outra.

### 3. Entrar no painel

Abra o endereço do site e entre com:

| Usuário | Senha |
|---|---|
| `admin` | `Vegas4747@` |

**Troque essa senha no primeiro dia.** No editor do Apps Script, escolha a função
`trocarSenha`, e rode assim:

```js
trocarSenha('admin', 'SuaNovaSenhaAqui')
```

Mínimo de 8 caracteres. Editar a `SENHA_INICIAL` no topo do `Admissao.gs` não muda
nada depois da instalação, porque a senha já foi gravada.

**Mais gente no painel.** A mesma função cria usuário novo:

```js
trocarSenha('marcia', 'SenhaDaMarcia123')
```

E para tirar o acesso de alguém: `removerUsuario('marcia')`. Para ver quem tem
acesso: `verUsuarios()` — mostra os nomes, nunca as senhas.

**Como a senha é guardada.** Não é. O que fica gravado é o resumo SHA-256 dela com
um sal próprio da sua instalação. Quem abrir as propriedades do script vê o resumo,
não a senha. E o navegador só recebe a chave de acesso às fichas depois de acertar
usuário e senha; ela fica na sessão da aba e some quando você fecha o navegador.

### Atalho sem login

Se algum dia você quiser que o painel abra direto, sem pedir nada, cole a chave do
RH em `js/chave.js`:

```js
window.ADM_CHAVE = 'A3F91C77B2E04D58C1A9';
```

O login some. Em compensação, quem chegar ao endereço do painel entra. Só faz
sentido se o endereço for conhecido por pouca gente. Deixando em branco, que é como
vem, o painel pede usuário e senha.

Note que a chave vai em `js/chave.js`, nunca no `config.js`. O `config.js` é
carregado também pela ficha do candidato; o `chave.js`, só pelo painel.

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

**Os documentos sobem pela própria ficha.** Cada documento tem a sua caixa. O
candidato toca, a câmera abre, ele fotografa e a imagem vai direto para a pasta dele
no Drive. Não passa por WhatsApp e não precisa de scanner.

O aplicativo reduz a foto para 1600 pixels antes de subir. Uma foto de 4 MB do
celular chega ao Drive com uns 250 KB, ainda legível para conferir um RG, e sobe
rápido mesmo em sinal ruim. Cada arquivo vai numa requisição própria: se a internet
cair no meio, só aquela foto falha e o candidato toca de novo.

Alguns documentos pedem mais de uma foto, e a ficha só considera completo quando
todas chegam: RG, CNH, reservista e CNV pedem frente e verso, e a caderneta de
vacinação pede a página de identificação e a página das doses. Certidão de
nascimento dos filhos, CPF dos filhos, frequência escolar, certidão criminal
estadual e documento de pensão aceitam várias — é só ir tocando em adicionar.

PDF também serve, e é o formato natural das três certidões negativas e da CTPS
digital.

**A foto 3x4 virou selfie com fundo branco.** É mais fácil de conseguir na hora,
não custa nada ao candidato e serve para o mesmo fim: o crachá e o reconhecimento
no posto. A ficha explica como tirar — de frente para parede branca, rosto inteiro,
sem boné, sem óculos escuros, luz de frente.

**Conferir.** Na aba Fichas você vê quem já respondeu. Abra uma ficha para ler tudo,
escrever a observação (documento que faltou e o motivo) e marcar como conferida.
A observação sai no PDF.

**Ver os documentos.** Dentro da ficha, os documentos aparecem em cartões com a
miniatura. Clicar abre em tamanho grande. A imagem vem do Drive na hora, e só para
quem entrou com usuário e senha — os arquivos nunca ficam públicos.

**Exportar.** O botão PDF abre o documento pronto numa aba nova. Toque em imprimir e
escolha salvar em PDF. Funciona no celular e no computador. Sai com a logo, os
dados do posto, todas as respostas, as quatro declarações e a assinatura do candidato.

---

## Mexer nas perguntas

Tudo está em `js/campos.js`, num formato legível. Para acrescentar uma pergunta,
copie uma linha parecida e mude o `id`, o `rot` e o `tipo`.

Tipos disponíveis: `foto` (envio de imagem ou PDF), `check` (caixa de marcar),
`simnao`, `texto`, `tel`, `email`, `cpf`, `data`, `num`, `moeda`, `opcao` (lista),
`area` (texto longo), `filhos` e `assinatura`.

- `obrig: true` faz o item entrar na conta do que falta
- `se: 'campo=Valor'` só mostra a pergunta quando a outra foi respondida assim
- `nota: 'texto'` põe uma observação cinza ao lado do rótulo
- `link` e `linkRot` colocam um link, como nas certidões
- nos campos `foto`: `partes: ['Frente','Verso']` pede uma foto para cada parte e
  só dá o documento por completo quando todas chegam; `varios: true` deixa o
  candidato mandar quantas quiser; `camera: 'user'` abre a câmera frontal, que é o
  que a selfie usa

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

**O painel é protegido por usuário e senha.** Cada pessoa do RH com o seu próprio
usuário: o registro de acesso na aba Log mostra quem entrou e quando. Saiu alguém,
`removerUsuario('nome')` e acabou. Se desconfiar que a senha vazou, troque com
`trocarSenha`.

**A planilha é o cofre.** Compartilhe com o mínimo de pessoas. Ela tem CPF, conta
bancária e nome de filho menor.

**As fotos ficam privadas.** Elas vão para a pasta `Vegas — Documentos de admissão`
no Drive da conta que instalou o script, organizadas por mês e por candidato.
Ninguém acessa por link: quem precisa ver, vê pelo painel, depois de entrar com
usuário e senha. Compartilhe essa pasta do Drive com o mínimo de gente.

**Apague o que não serve mais.** Guardar RG, CPF e conta bancária de quem não foi
contratado, sem prazo, é passivo. A função `fichasParaExpurgo` lista o que passou de
24 meses; o prazo está em `CFG.RETENCAO_MESES`, no começo do `Admissao.gs`. Rode de
vez em quando e apague o que já cumpriu a finalidade. Apagar a ficha no painel manda
a pasta de documentos dela para a lixeira do Drive junto.

**Ficha cancelada.** Apagar a ficha no painel tira a linha da planilha e derruba o
link. Use quando a vaga cair.

---

## Quando der problema

| Sintoma | O que é |
|---|---|
| *Usuário ou senha incorretos* | Rode `verUsuarios()` no Apps Script para ver quem existe, e `trocarSenha('admin','NovaSenha123')` para redefinir. |
| *Chave do RH inválida* | Acontece se você usou o atalho do `js/chave.js` e a chave mudou. Rode `verChave` e atualize o arquivo. |
| *Falta o endereço da planilha* | A chave está preenchida mas a URL não. Cole a URL `/exec` em `js/config.js`. |
| *Ficha não encontrada* no link do candidato | A ficha foi apagada no painel, ou o link veio cortado pelo WhatsApp. Gere de novo. |
| *O servidor respondeu em formato inesperado* | A publicação não está como "Qualquer pessoa". Refaça o passo 6. |
| O painel some depois de editar o `Admissao.gs` | Você criou implantação nova. Volte para a implantação antiga ou atualize a URL no `config.js`. |
| O PDF não abre | O navegador bloqueou a aba nova. Libere pop-ups para o endereço do site. Acontece uma vez por aparelho. |
| A foto não sobe e dá erro | Quase sempre é autorização do Drive faltando. Rode `instalar()` uma vez no editor do Apps Script e aceite as permissões. |
| *Arquivo acima de 10 MB* | PDF grande demais. Fotos o aplicativo reduz sozinho; PDF vai como veio. Peça para fotografar em vez de anexar o PDF. |
| A data aparece mm/dd/aaaa | É o idioma do navegador, não do site. Em celular configurado em português sai dd/mm/aaaa. |
| Candidato diz que perdeu o que preencheu | Peça para reabrir o mesmo link no mesmo navegador. O rascunho fica no aparelho. Se ele trocou de celular, aí perdeu mesmo. |

---

## Antes de rodar com todo mundo

1. Faça uma ficha de teste com o seu próprio nome e preencha até o fim, no celular.
   Você vê o que o candidato vê e descobre o que falta perguntar.
2. Leia as quatro declarações com o jurídico. Elas são o que sustenta a ficha se a
   admissão der problema depois.
3. Troque a senha do `admin` e crie um usuário para cada pessoa do RH. Senha
   compartilhada não diz quem fez o quê.
