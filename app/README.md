# Zanshin 3D Studio · app de gestão

App interno do estúdio: orçamentos, pedidos, fila da impressora, filamentos,
catálogo, clientes e financeiro. Usado no celular ao lado da impressora e no
computador. Fica separado do site (que continua HTML puro na raiz do
repositório).

**Stack:** React + Vite + TypeScript, Tailwind v4, componentes próprios sobre
Radix (mesma base do shadcn/ui, com visual da Zanshin), ícones Phosphor,
animações com Motion (respeitam o "reduzir movimento" do aparelho),
Supabase (Auth, Postgres com RLS e Storage) e PWA instalável. Títulos em
Archivo itálico, a mesma fonte do site.

## Módulos

| Tela | O que faz |
|---|---|
| Início | Prazos atrasados e dos próximos 3 dias, o que está imprimindo, próximos da fila, estoque baixo e faturamento do mês |
| Orçamentos | Calculadora por peça com detalhamento do custo, preço à mão, número ZAN-0001, validade, texto do WhatsApp, botão wa.me, imagem e PDF com a marca. Aprovado vira pedido com um toque |
| Pedidos | Quadro (arrastar no desktop, botão de avançar no celular) e lista com filtros. Pagamentos, entrega com rastreio, fotos, falhas, histórico e link do cliente. Pedido direto sem orçamento e edição dos itens depois de aprovado |
| Fila | Placas em ordem, previsão encadeada a partir de agora, reordenar arrastando, iniciar, concluir (desconta do carretel) e registrar falha |
| Filamentos | Carretéis com cor, preço, peso, custo por grama automático e alerta de estoque baixo |
| Catálogo | Peças recorrentes com foto e preço base; exporta JSON no formato do `js/pecas-data.js` do site |
| Modelos 3D | Envia STL, OBJ, 3MF ou o `.gcode.3mf` do Bambu Studio: vê em 3D na cor do carretel, mede, avisa se não cabe na mesa, estima gramas pelo volume e, no arquivo fatiado, leva tempo e gramas de cada placa para o orçamento e a fila |
| Clientes | Contatos, origem, histórico e total gasto |
| Financeiro | Faturamento, custos, lucro estimado, ticket médio, mais vendidos, taxa de falha real e CSV |
| Mensagens | Textos prontos para o cliente em cada etapa (confirmado, na fila, imprimindo, acabamento, pronto, entregue, restante, rastreio), editáveis em Configurações. Ao mudar o status, o app oferece abrir o WhatsApp com a mensagem da etapa |
| Backup | Em Configurações: baixa um .zip com todos os dados (backup.json) e uma planilha por tabela. O Início lembra quando passa de 30 dias |
| `/acompanhar/<token>` | Página pública do cliente: número, itens, andamento, prazo e fotos. Sem valores nem dados de outros clientes |
| `/orcamento/<token>` | Orçamento para o cliente aprovar sozinho: peças, preços e total (sem custos). Aprovar cria o pedido e leva ao acompanhamento; vencido ou encerrado não aprova. O app mostra quando o cliente abriu e avisa no Início quando ele aprova |

### Cena 3D da impressão

No mesmo estilo do site, uma peça é impressa camada por camada, com o bico
percorrendo o contorno de cada camada. As peças são geradas por código: kabuto
samurai, carro de F1 e kunai ninja, sem personagens nem marcas. A cena aparece:

- no login, com as peças se revezando;
- no Início e na Fila, na placa que está imprimindo, sempre com a mesma peça
  para a mesma placa, na cor do carretel e no progresso estimado;
- no link do cliente, enquanto o pedido está imprimindo.

Só desenha enquanto aparece na tela. Com "reduzir movimento" ligado, mostra um
quadro parado. Sem WebGL, fica só o fundo com linhas de camada. O three.js só é
baixado nas telas que usam a cena.

### Como o preço é calculado

Por unidade de cada peça:

```
material    = gramas × custo por grama do carretel
energia     = horas × potência média da impressora (kW) × tarifa (R$/kWh)
máquina     = horas × desgaste (R$/h)
mão de obra = horas de pós × valor da hora
preço       = soma × (1 + falha%) × (1 + margem%) [× (1 + urgência%)] + extras
              arredondado para cima no final ,90 ou ,00
```

Os parâmetros ficam em **Configurações** e começam vazios: enquanto faltar
algum, a calculadora avisa o que falta e aceita preço digitado à mão. Cada item
de orçamento guarda uma cópia dos parâmetros usados, então mudar a tarifa
amanhã não altera os orçamentos já feitos.

## Rodar no computador

Precisa de Node 20+ e Docker (para o Supabase local).

```bash
cd app
npm install
npx supabase start                 # sobe Postgres, Auth e Storage locais
cp .env.example .env               # cole a URL e a ANON_KEY que o comando acima mostrou
npx supabase db reset              # aplica as migrations e o seed de EXEMPLO
npm run dev                        # http://localhost:5173
```

Crie o usuário no painel local (http://127.0.0.1:54323 → Authentication →
Add user) ou pela API. O primeiro usuário que entrar vira o dono.

Testes:

```bash
npm test                                                             # cálculo de preço, datas, fila, financeiro
DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run db:test   # RLS e fluxo completo no banco
```

## Colocar no ar

### 1. Supabase

1. Crie um projeto em supabase.com (região São Paulo).
2. Crie as tabelas. Sem instalar nada: abra **SQL Editor → New query**, cole
   o arquivo `supabase/instalar-tudo.sql` inteiro e clique em **Run** (só num
   projeto novo e vazio). Com a CLI: `npx supabase link --project-ref <ref>` e
   `npx supabase db push`. **Não rode o `seed.sql` no projeto real**: ele é só
   exemplo.
3. Em **Authentication → Sign In / Providers**, desligue "Allow new users to
   sign up". Depois, em **Authentication → Users → Add user**, crie o seu
   usuário (e-mail e senha). O primeiro login dele vira o dono; qualquer outra
   conta que entrar depois é barrada pelo próprio banco.
4. Em **Authentication → URL Configuration**, coloque o endereço do app em
   "Site URL".

### 2. Hospedagem (Cloudflare)

Crie um app separado do site em **Workers & Pages → Create app → Import a
repository**, apontando para este repositório:

- Project name: `zanshin-gestao` (igual ao `name` do `wrangler.jsonc`)
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Advanced settings → Path: `app`
- Variáveis de build: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
  (Project Settings → Data API e API Keys no Supabase)

Depois de criado, em **Settings → Build → Branch control**, escolha o branch
que tem o app como branch de produção. O `wrangler.jsonc` publica o `dist/`
com as rotas do app caindo no `index.html`, e o `.node-version` fixa o Node 22.

Pelo fluxo de Pages também funciona: Root directory `app`, Build command
`npm run build`, Output directory `dist` e as mesmas variáveis.

O link de acompanhamento usa o endereço onde o app estiver publicado.

Problemas comuns na publicação:

- **"Failed: root directory not found"**: o build rodou num branch que ainda
  não tem a pasta `app` (por exemplo o `main`). Troque o branch de produção em
  Settings → Build → Branch control e publique de novo. "Retry build" repete o
  mesmo branch e falha outra vez.
- **Tela de login dizendo que o app não está ligado ao Supabase**: as variáveis
  `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não chegaram ao build. Elas
  precisam estar nas variáveis de build (Settings → Build), não nas de runtime,
  e o app precisa ser publicado de novo depois de criá-las.

### Atualizar um projeto que já está no ar

Quando chegar uma migration nova em `supabase/migrations`, rode só os arquivos
novos, em ordem, no **SQL Editor** do Supabase (ou `npx supabase db push`). O
`instalar-tudo.sql` é só para projeto novo e vazio.

### 3. Instalar no celular

Abra o endereço do app no navegador do celular e use "Adicionar à tela de
início" (Safari) ou "Instalar app" (Chrome).

## Segurança

- RLS ligado em todas as tabelas; só o usuário registrado em `app_owner` lê ou
  grava. A chave anon pública não abre nenhuma tabela.
- O cliente só enxerga o pedido pela função `public_order_tracking(token)`, que
  devolve número, itens, andamento, prazo, entrega e fotos marcadas para ele.
  O token tem 24 caracteres aleatórios.
- Fotos ficam no bucket `photos` com nome aleatório; o anônimo não consegue
  listar o bucket.

## Organização

```
app/
  supabase/migrations/   modelo de dados, RLS e funções (em ordem)
  supabase/seed.sql      dados de EXEMPLO para o banco local
  supabase/instalar-tudo.sql  todas as migrations num arquivo (gerado por npm run db:bundle)
  supabase/tests/        teste SQL de RLS e do fluxo
  src/lib/               cálculo de preço, formatação pt-BR, cliente Supabase
  src/components/        interface base e layout
  src/features/<tela>/   uma pasta por módulo
```

## Fase 2 (modelo já preparado)

- **Importar o `.gcode.3mf` do Bambu Studio:** feito na aba Modelos. O app lê
  `Metadata/slice_info.config` (tempo, gramas e filamentos por placa) e as
  miniaturas `Metadata/plate_N.png`.
- **Pedidos do formulário do site:** tabela `site_requests`, a ser alimentada
  por uma Edge Function com validação (não por insert anônimo).
- **Mais de uma impressora:** tabela `printers`, `printer_id` em itens e
  placas, fila separada por impressora e uma placa imprimindo por vez em cada
  uma. Já dá para cadastrar outra em Configurações.
