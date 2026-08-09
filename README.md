# Zanshin 3D Studio

Site institucional da **Zanshin 3D Studio** — impressão 3D sob encomenda em
Jaraguá do Sul, SC. HTML/CSS/JS puro, sem build, sem dependências.

Seções: hero, sobre, serviços, calculadora de orçamento (com envio para
WhatsApp), galeria e contato.

## Como visualizar localmente

Não precisa instalar nada. Duas opções:

1. Abra `index.html` diretamente no navegador; ou
2. Suba um servidor local (evita alguns bloqueios de navegador):
   ```bash
   python3 -m http.server 8080
   ```
   e acesse `http://localhost:8080`.

## Antes de publicar: dados a atualizar

Todo o contato do site é centralizado em **`js/script.js`**, no objeto
`CONFIG` (topo do arquivo):

```js
const CONFIG = {
  whatsappNumber: "5547991677070", // 55 + DDD + número, só dígitos
  instagramUser: "zanshin_3dstudio", // usuário do Instagram, sem @
  pricing: { ... } // valores da calculadora de orçamento
};
```

- **`whatsappNumber`** e **`instagramUser`** alimentam automaticamente todos
  os botões/links de WhatsApp e Instagram da página (menu, seção de
  contato, botão flutuante e o botão gerado pela calculadora) — já
  preenchidos com os dados reais.
- **`pricing`** calcula o orçamento a partir do custo real (filamento +
  energia) vezes uma margem:
  - `filamentCostPerKg`, `energyTariff` e `printerPowerWatts` vieram dos
    valores que você passou (R$100/kg, R$1,80/kWh, 180W da P2S).
  - `marginMultiplier` está em **2.25** (meio da faixa "200/250%" que você
    mencionou, interpretada como 2 a 2,5x o custo). Se você quis dizer
    outra coisa com "margem" (por exemplo, markup de 200% = 3x o custo),
    troque esse número — está comentado no arquivo.
  - `setupFee` e `finishFee` continuam sendo valores de exemplo meus
    (taxa fixa por pedido e acréscimo por acabamento) — ajuste à vontade.
  - a fórmula completa está em `estimatePrice()` no `js/script.js`.

## Fotos da galeria

As fotos ficam em `assets/img/gallery/`. Para adicionar uma peça nova,
copie o padrão já usado na seção **Galeria** (`index.html`, `#galeria`):

```html
<figure class="gallery-item reveal">
  <img loading="lazy" decoding="async" src="assets/img/gallery/nome-da-peca.jpg" alt="Descrição da peça para leitores de tela">
  <figcaption>Nome curto da peça</figcaption>
</figure>
```

## Imagem de capa para compartilhamento (opcional)

Ao compartilhar o link do site no WhatsApp/Instagram/Facebook, essas
plataformas exigem uma imagem PNG/JPG de capa (não aceitam SVG). Se quiser
essa pré-visualização, crie uma imagem de 1200×630px, salve como
`assets/img/og-cover.png` e descomente a tag `og:image` no `<head>` do
`index.html`.

## Publicar o site (grátis)

Qualquer serviço de hospedagem estática funciona, por exemplo:

- **GitHub Pages**: nas configurações do repositório, em *Settings → Pages*,
  selecione a branch e a pasta raiz (`/`).
- **Netlify** ou **Vercel**: conecte o repositório e faça o deploy — não é
  necessário configurar comando de build (site estático).

## Marca

A paleta do site (vermelho `#d01010` e prata `#c7cdd3`, variáveis `--accent`
e `--accent-2` no topo do `css/style.css`) foi extraída da logo oficial.
Os arquivos da logo estão em `assets/img/brand/`:

- `icon.png` — símbolo isolado (favicon e ilustração da seção Sobre)
- `logo-horizontal-dark-bg.png` — versão com texto branco, para fundos
  escuros (usada no cabeçalho e rodapé do site)
- `logo-horizontal-light-bg.png` — versão com texto preto, para fundos
  claros (não usada no site em si, mas disponível para outras aplicações
  da marca, como papelaria ou documentos)
- `apple-touch-icon.png` — ícone para adicionar o site à tela de início do iPhone

## Assistentes personalizados (Claude Code)

Este repositório tem 4 subagentes configurados em `.claude/agents/`, prontos
pra usar sempre que você abrir o Claude Code aqui (em qualquer máquina —
basta clonar o repo):

| Agente | Pra que serve |
|---|---|
| `qa-tester` | Testa o site de verdade (roda local, clica nos fluxos) e reporta bugs — não corrige, só encontra. |
| `devops` | Publica o site: branch → PR → merge → GitHub Pages. Sabe o processo desse projeto e é explícito sobre o que precisa de um clique seu. |
| `ux-designer` | Revisão visual/UX — contraste, espaçamento, mobile. Ajusta coisas pequenas direto, avisa antes de mudar estrutura. |
| `business-assistant` | Escreve conteúdo pra WhatsApp, Instagram e descrições de peça, no tom da Zanshin e com base nos dados reais do site (nunca inventa preço). |

Chame um pelo nome ("usa o agente qa-tester pra conferir essa mudança") ou
deixe o Claude Code puxar automaticamente quando a tarefa combinar com a
descrição do agente. Esses agentes valem só pra este repositório — se você
quiser os mesmos papéis disponíveis em outros projetos seus, copie as pastas
`.claude/agents/*.md` pra `~/.claude/agents/` na sua máquina (config global).

## Estrutura do projeto

```
index.html            Página principal
css/style.css          Estilos
js/script.js            CONFIG, menu mobile, animações e calculadora de orçamento
assets/img/brand/        Arquivos da logo
assets/img/gallery/      Fotos da galeria
.claude/agents/          Subagentes personalizados do Claude Code
```
