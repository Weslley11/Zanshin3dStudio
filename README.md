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
  whatsappNumber: "5547900000000", // seu número real: 55 + DDD + número, só dígitos
  instagramUser: "zanshin3dstudio", // seu usuário real do Instagram, sem @
  pricing: { ... } // valores de referência da calculadora de orçamento
};
```

- **`whatsappNumber`** e **`instagramUser`** alimentam automaticamente todos
  os botões/links de WhatsApp e Instagram da página (menu, seção de
  contato, botão flutuante e o botão gerado pela calculadora).
- **`pricing`** são valores de exemplo (preço por grama de cada material,
  taxa por hora de máquina, taxa fixa e acabamento extra). Ajuste conforme
  o custo real do seu filamento/energia e a margem que você quer praticar
  — a fórmula usada está em `estimatePrice()` no `js/script.js`.

## Fotos da galeria

A seção **Galeria** (`index.html`, `#galeria`) está com placeholders (ícones
+ "Adicione uma foto"). Para trocar por fotos reais dos seus trabalhos,
troque o conteúdo de um `.gallery-item` por uma imagem, por exemplo:

```html
<div class="gallery-item">
  <img src="assets/img/trabalho-01.jpg" alt="Suporte de celular impresso em PETG preto">
</div>
```

Coloque os arquivos de imagem em `assets/img/`.

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

## Estrutura do projeto

```
index.html            Página principal
css/style.css          Estilos
js/script.js            CONFIG, menu mobile, animações e calculadora de orçamento
assets/img/brand/        Arquivos da logo
assets/img/              Demais imagens (adicione as fotos da galeria aqui)
```
