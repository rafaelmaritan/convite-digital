# Convite Digital

Plataforma simples para criação de convites digitais personalizados para festas e eventos, com página pública e confirmação de presença (RSVP).

O primeiro caso de uso é o aniversário de 1 ano do Pedro.

O projeto será desenvolvido inicialmente como um produto real para validação e, posteriormente, poderá evoluir para uma plataforma comercial.

---

## Objetivo

Criar uma experiência digital simples e bonita para convidados de uma festa.

O convidado deve conseguir:

- abrir o convite pelo celular;
- visualizar as informações da festa;
- conhecer a identidade visual do evento;
- confirmar ou recusar presença;
- informar quantidade de adultos e crianças;
- enviar uma observação;
- receber uma confirmação após o envio.

O organizador deve conseguir:

- visualizar as confirmações;
- saber quantas pessoas irão;
- diferenciar adultos e crianças;
- consultar os dados dos convidados.

---

## Primeiro evento

O primeiro evento utilizado para validar o produto será:

**Pedro — 1 ano**

Data:

**05 de dezembro**

Local:

**São Paulo — SP**

O convite terá uma identidade visual infantil sofisticada, natural e artesanal.

A referência visual inclui:

- fotografia da criança;
- fundo creme;
- azul suave;
- verde oliva;
- bege;
- pequenos detalhes terracota;
- folhagens;
- sol;
- animais em estilo ilustrado;
- textura de papel;
- formas orgânicas.

---

## Stack

### Frontend

- Angular
- TypeScript
- SCSS
- Angular Reactive Forms

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy

### Banco de dados

- PostgreSQL

### Infraestrutura

- Frontend: Cloudflare
- Backend: Railway
- Banco de dados: PostgreSQL no Railway

---

## Arquitetura

```text
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │    Cloudflare   │
              │                 │
              │ Angular / SPA   │
              └────────┬────────┘
                       │
                       │ HTTPS
                       ▼
              ┌─────────────────┐
              │    Railway      │
              │                 │
              │    FastAPI      │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   PostgreSQL    │
              └─────────────────┘
```

---

## MVP

O MVP deve conter apenas o necessário para validar a proposta.

### Página do convite

* foto principal;
* nome;
* idade;
* mensagem;
* data;
* horário;
* localização;
* link do endereço para o Google Maps;
* identidade visual;
* countdown;
* botão de confirmação.

### RSVP

O convidado poderá informar:

* nome;
* presença;
* quantidade de adultos;
* quantidade de crianças;
* observação;
* prazo de confirmação configurável por evento.

### Organizador — fora da primeira entrega

O convite e o RSVP serão entregues primeiro. A página do organizador e a rota GET que listaria as respostas ficam adiadas; não publicar uma listagem pública de convidados nesta etapa.

As respostas continuam sendo gravadas no banco e poderão ser consultadas quando a área do organizador for retomada com proteção de acesso.

---

## Fora do MVP

Não implementar inicialmente:

* autenticação;
* cadastro de usuários;
* pagamentos;
* marketplace;
* aplicativo mobile;
* chat;
* notificações complexas;
* integração com WhatsApp;
* IA;
* editor visual;
* sistema complexo de templates;
* múltiplos níveis de permissão;
* sistema completo de administração;
* assinatura recorrente.

Essas funcionalidades poderão ser avaliadas posteriormente.

---

## Princípios do projeto

### 1. Simplicidade

A solução deve ser simples de entender, desenvolver e manter.

### 2. Mobile first

A maior parte dos convidados acessará o convite pelo celular, provavelmente através do WhatsApp.

### 3. Experiência visual

O convite deve parecer um produto cuidadosamente desenvolvido, e não apenas um formulário web.

### 4. Velocidade

A página deve carregar rapidamente e funcionar bem em dispositivos móveis.

### 5. Personalização

O conteúdo do evento deve ser separado da estrutura da página.

### 6. Evolução incremental

Primeiro validar o convite do Pedro.

Depois transformar a solução em produto.

---

## Desenvolvimento

### Protótipo visual

O protótipo em `prototype/` envia as confirmações à API FastAPI. O backend usa SQLite local por padrão; os dados ficam em `backend/rsvps.sqlite3`. A página do organizador e a listagem GET não fazem parte desta primeira entrega.

Inicie o backend em um terminal:

```bash
cd backend
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Inicie o servidor estático do protótipo em outro terminal, na raiz do projeto:

```bash
python -m http.server 4173 --directory prototype
```

Abra `http://localhost:4173` para o convite. A URL da API e o slug do evento ficam em `prototype/event-config.js`.

Os endpoints locais estão disponíveis em `http://localhost:8000`; a documentação interativa do FastAPI fica em `http://localhost:8000/docs`.

### Preparar deploy de teste

O roteiro de deploy para Railway e Cloudflare Pages está em [deployment/README.md](deployment/README.md). Antes de conectar as plataformas, crie um repositório remoto e envie o projeto. O workspace ainda não tem um repositório Git inicializado.

### Frontend

```bash
cd frontend
npm install
npm start
```

### Backend

```bash
cd backend

python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

### Testes da API

Execute a partir da raiz do projeto:

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest
```

Os testes usam SQLite em memória e não alteram `backend/rsvps.sqlite3`.

---

## Variáveis de ambiente

### Frontend

```text
API_URL=http://localhost:8000
```

### Backend

```text
DATABASE_URL=sqlite:///./rsvps.sqlite3
CORS_ORIGINS=http://localhost:4173,http://127.0.0.1:4173
EVENT_SLUG=pedro-1-ano
EVENT_RSVP_DEADLINE=2026-11-20
RSVP_RATE_LIMIT_MAX_REQUESTS=10
RSVP_RATE_LIMIT_WINDOW_SECONDS=600
```

`DATABASE_URL` é opcional no protótipo: sem essa variável, a API cria o banco SQLite em `backend/rsvps.sqlite3`. Para PostgreSQL, configurar uma URL SQLAlchemy como `postgresql+psycopg://...`. Nunca colocar credenciais diretamente no código.

O POST público aceita até 10 tentativas por IP em uma janela de 10 minutos por padrão. O limite é mantido em memória por processo; antes de escalar ou publicar em múltiplas instâncias, configurar rate limiting na borda (por exemplo, Cloudflare).

---

## API inicial

### Health check

```http
GET /api/health
```

### Criar RSVP

```http
POST /api/events/{slug}/rsvps
```

O endpoint retorna `201 Created` e o RSVP persistido.
Um envio que aciona o honeypot recebe uma confirmação genérica `202 Accepted`, sem gravar dados. Excesso de tentativas retorna `429 Too Many Requests`.

---

## Estrutura inicial

```text
.
├── .github/
│   └── copilot-instructions.md
│
├── docs/
│   ├── product.md
│   ├── design.md
│   └── backlog.md
│
├── frontend/
│   └── ...
│
├── backend/
│   └── ...
│
├── deployment/
│   ├── build-prototype.mjs
│   └── README.md
│
└── README.md
```

---

## Estratégia de desenvolvimento

O projeto será desenvolvido em pequenos incrementos.

Cada tarefa deve:

1. ter um objetivo claro;
2. alterar somente o necessário;
3. manter o projeto funcionando;
4. ser testável isoladamente.

Evitar implementar várias funcionalidades simultaneamente.

---

## Roadmap

### Fase 1 — Convite

Criar a página visual do convite do Pedro.

### Fase 2 — RSVP

Adicionar confirmação de presença.

### Fase 3 — Persistência

Salvar os RSVPs no PostgreSQL.

### Fase 4 — Consulta

Criar uma página simples para o organizador consultar os convidados.

### Fase 5 — Generalização

Transformar o convite específico do Pedro em uma página dinâmica baseada em evento.

### Fase 6 — Produto

Avaliar templates, personalização, criação de eventos e modelo comercial.

---

## Status

Projeto em desenvolvimento.

O foco atual é o MVP do convite do Pedro.