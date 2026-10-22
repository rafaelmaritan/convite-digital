# Acesso do organizador

A página pública do convite e o `POST /api/events/{slug}/rsvps` permanecem sem login. A listagem dos RSVP contém dados pessoais e só deve ser acessada pelo organizador autenticado.

## Caminho da consulta

```text
Organizador
  -> Cloudflare Access (e-mail autorizado)
  -> página /organizer.html
  -> Pages Function /api/admin/events/{slug}/rsvps
  -> valida assinatura, issuer, audience, validade e e-mail do JWT Access
  -> Railway /api/admin/events/{slug}/rsvps com X-Organizer-Key
  -> API compara a chave em tempo constante e consulta o PostgreSQL
```

A chave `ORGANIZER_API_KEY` só existe como secret nos runtimes Cloudflare Pages e Railway. Ela nunca é escrita no HTML/JavaScript entregue ao navegador. A Pages Function valida o JWT do Access; o backend valida a chave server-to-server. Portanto, uma chamada direta ao domínio Railway não consegue ler os RSVPs sem a chave, que deve ser longa e aleatória.

## Configurar o segredo entre Pages e Railway

Gere uma chave aleatória de pelo menos 32 bytes, por exemplo com `openssl rand -hex 32` ou `python -c "import secrets; print(secrets.token_hex(32))"`.

1. Em Railway, defina `ORGANIZER_API_KEY` no serviço da API.
2. Em Cloudflare Pages, adicione `ORGANIZER_API_KEY` em **Settings > Variables and Secrets** como secret para Production.
3. Defina também no Pages:
   - `RSVP_API_BASE_URL=https://convite-digital-production.up.railway.app`
   - `ACCESS_TEAM_DOMAIN=https://<seu-time>.cloudflareaccess.com`
   - `ACCESS_AUDIENCE=<AUD da aplicação Access>`
   - `ORGANIZER_EMAIL=<seu e-mail autorizado>`
4. Use exatamente o mesmo valor de `ORGANIZER_API_KEY` nos dois serviços. Não coloque essa chave em `PUBLIC_API_BASE_URL`, `event-config.js`, HTML, JS, CORS ou Git.

## Proteger paths sem fechar o convite

No Cloudflare Zero Trust, crie aplicações self-hosted com política **Allow** limitada ao seu e-mail:

- `https://<projeto>.pages.dev/organizer.html`
- `https://<projeto>.pages.dev/api/admin/*`

Mantenha a raiz pública do Pages acessível aos convidados. Confirme as regras de path e o domínio `pages.dev` no painel antes de liberar, pois proteger o hostname inteiro bloquearia também o convite público. A Pages Function valida o JWT `Cf-Access-Jwt-Assertion` e o e-mail/AUD; assim, se a política Access estiver ausente ou mal configurada, a função ainda nega o acesso sem um token assinado válido.

## Implantação e verificações

1. Salve as secrets e variables de runtime no Pages e no Railway.
2. Faça deploy do commit que contém `functions/` e `prototype/organizer.html`.
3. Teste `/api/admin/events/pedro-1-ano/rsvps` sem Access: deve retornar `401`/`403`; sem secret no Railway a rota não retorna dados.
4. Entre com o e-mail autorizado e abra `/organizer.html`. A Function deve carregar a lista por `GET` no path `/api/admin/...`.
5. Confirme que a raiz pública do convite continua acessível sem login e que `GET /api/events/pedro-1-ano/rsvps` continua indisponível (`405`).
6. Verifique que respostas incluem `Cache-Control: private, no-store` e que nenhum HTML/JS baixado pelo browser contém `ORGANIZER_API_KEY`.

Se o hostname `pages.dev` não permitir as políticas de path desejadas na conta, não proteja o hostname inteiro enquanto o convite público usar o mesmo domínio. Nesse caso, use um domínio próprio no Pages e crie Access para os paths privados, ou coloque a página do organizador em um hostname separado atrás do Access.
