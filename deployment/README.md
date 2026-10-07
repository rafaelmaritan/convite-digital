# Deploy de teste

Este roteiro publica o protótipo estático em Cloudflare Pages e a API em Railway. Use primeiro os domínios gratuitos das plataformas; domínio próprio pode ser configurado depois.

## 0. Preparar o repositório

Railway e Cloudflare Pages precisam de um repositório Git remoto para fazer deploy automático. Este workspace ainda não tem Git inicializado. Crie um repositório privado no GitHub, inicialize o Git na pasta do projeto e envie os arquivos versionáveis. O `.gitignore` da raiz exclui o ambiente virtual e o SQLite local; não envie credenciais nem arquivos `.env`.

## Escopo e cautelas

- A API mantém público apenas o envio de RSVP e o health check.
- Não há rota para listar respostas nem página do organizador nesta entrega.
- A configuração de exemplo do evento deve ser substituída pelos dados reais antes de compartilhar o link.
- O limite local é em memória e atende somente um processo simples. Não aumente as réplicas Railway sem mover o rate limit para a borda ou um armazenamento compartilhado.
- Não copie o arquivo SQLite local para produção. O banco PostgreSQL Railway começa com os dados de evento configurados por ambiente e sem os RSVPs de teste locais.

## 1. API e PostgreSQL no Railway

1. Crie um projeto Railway e adicione um serviço PostgreSQL.
2. Adicione outro serviço conectado ao repositório e defina o **Root Directory** como `/backend`.
3. O serviço usa [railway.toml](../backend/railway.toml) para instalar dependências, iniciar Uvicorn na porta fornecida pelo Railway e verificar `/api/health`.
4. Configure as variáveis do serviço da API:

   O exemplo [railway-api.variables.example.json](railway-api.variables.example.json) pode ser colado no **RAW Editor** da aba Variables. Antes de aplicar, ajuste o nome do serviço PostgreSQL na referência `${{Postgres.DATABASE_URL}}` e substitua localização, endereço, cidade e prazo pelos dados reais. `CORS_ORIGINS` está vazio de propósito até o domínio Cloudflare Pages existir.

| Variável | Valor inicial |
| --- | --- |
| `DATABASE_URL` | Referência do serviço PostgreSQL, normalmente `${{Postgres.DATABASE_URL}}` (ajuste o nome ao serviço criado) |
| `CORS_ORIGINS` | Deixe temporariamente vazio/local; será substituído pelo domínio Pages no passo 3 |
| `EVENT_SLUG` | `pedro-1-ano` |
| `EVENT_NAME` | `Pedro` |
| `EVENT_AGE` | `1` |
| `EVENT_DATE` | `2026-12-05` |
| `EVENT_TIME` | `15:00` |
| `EVENT_LOCATION` | Nome real do local |
| `EVENT_ADDRESS` | Endereço real |
| `EVENT_CITY` | Cidade e estado |
| `EVENT_RSVP_DEADLINE` | Prazo real no formato `YYYY-MM-DD` |
| `RSVP_RATE_LIMIT_MAX_REQUESTS` | `10` |
| `RSVP_RATE_LIMIT_WINDOW_SECONDS` | `600` |

5. A API já está publicada em `https://convite-digital-production.up.railway.app`; o health check foi validado com `200 OK` em `https://convite-digital-production.up.railway.app/api/health`.

Railway fornece um valor padrão para `PORT`; não crie esse segredo manualmente. A aplicação converte URLs PostgreSQL `postgres://`/`postgresql://` para o driver psycopg 3 declarado em `requirements.txt`.

## 2. Protótipo em Cloudflare Pages

1. Crie um projeto Pages conectado ao mesmo repositório.
2. Deixe o diretório raiz como `/` e configure:
   - **Build command:** `node deployment/build-prototype.mjs`
   - **Build output directory:** `deployment/dist`
3. Configure estas variáveis de build (produção e preview, se usar ambos):

| Variável | Valor |
| --- | --- |
| `PUBLIC_API_BASE_URL` | `https://convite-digital-production.up.railway.app` |
| `EVENT_SLUG` | Mesmo slug configurado na API |
| `EVENT_RSVP_DEADLINE` | Mesma data limite configurada na API |
| `EVENT_LOCATION` | Mesmo nome do local da API |
| `EVENT_ADDRESS` | Mesmo endereço da API |
| `EVENT_CITY` | Mesma cidade e estado da API |

O build exige todos esses valores para evitar publicar a URL local ou dados de exemplo; gera uma configuração pública sem segredos e recusa URLs que apontem para `localhost`/HTTP. O código local em `prototype/event-config.js` não é alterado.

4. Faça o deploy e copie a origem Pages exata, por exemplo `https://nome-do-projeto.pages.dev`.

## 3. Restringir CORS e validar

1. Volte ao serviço da API no Railway e defina `CORS_ORIGINS` com a origem Pages exata, sem `/` no final. Se houver mais de uma origem de produção, separe-as por vírgula. Não use `*`.
2. Aguarde o redeploy da API.
3. Abra o domínio Pages e teste um RSVP real controlado. Confirme a mensagem de sucesso e confira a resposta `201` na aba Network do navegador.
4. Teste um nome em branco, a recusa e o prazo limite. Uma resposta após o prazo deve retornar `409`.
5. Confirme que uma solicitação de outro site não recebe `Access-Control-Allow-Origin` e que `GET /api/events/pedro-1-ano/rsvps` continua indisponível (`405`).
6. Antes de compartilhar publicamente, revise o limite no ambiente hospedado e configure rate limiting de borda adequado. O rate limit em memória não substitui uma proteção de produção.

## 4. Domínio próprio (opcional, depois do teste)

Depois de validar os domínios gratuitos, configure um domínio próprio em Cloudflare Pages. Atualize `CORS_ORIGINS` na API com a nova origem exata e gere um novo deploy. Não é necessário ter domínio próprio para validar o fluxo primeiro.
