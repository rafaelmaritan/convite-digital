# Backlog

## Objetivo

Desenvolver rapidamente o primeiro convite funcional e, depois, evoluir a solução para um produto reutilizável.

Prioridade:

1. experiência visual;
2. RSVP;
3. persistência;
4. generalização;
5. produto.

---

# FASE 0 — Preparação

- [ ] Criar repositório
- [ ] Criar estrutura frontend
- [ ] Criar estrutura backend
- [ ] Configurar Angular
- [ ] Configurar FastAPI
- [ ] Configurar PostgreSQL
- [ ] Configurar variáveis de ambiente
- [ ] Criar documentação inicial
- [ ] Configurar Git

---

# FASE 1 — Convite do Pedro

## Estrutura

- [ ] Criar página principal
- [ ] Criar layout mobile-first
- [ ] Criar design tokens
- [ ] Configurar fontes
- [ ] Configurar assets

## Hero

- [ ] Adicionar foto do Pedro
- [ ] Adicionar nome
- [ ] Adicionar idade
- [ ] Adicionar elementos decorativos
- [ ] Adicionar animais

## Informações

- [ ] Data
- [ ] Horário
- [ ] Cidade
- [ ] Local
- [ ] Endereço
- [ ] Abrir endereço no Google Maps
- [ ] Exibir prazo de RSVP configurável por evento

## Conteúdo

- [ ] Mensagem principal
- [ ] Mensagem de encerramento

## Interações

- [ ] Countdown
- [ ] Botão de RSVP
- [ ] Scroll até RSVP

---

# FASE 2 — RSVP

- [ ] Criar formulário
- [ ] Campo nome
- [ ] Campo presença
- [ ] Campo adultos
- [ ] Campo crianças
- [ ] Campo observação
- [ ] Usar prazo de confirmação do evento
- [ ] Validação
- [ ] Estado de loading
- [ ] Estado de sucesso
- [ ] Estado de erro

---

# FASE 3 — Backend

## API

- [ ] Criar aplicação FastAPI
- [ ] Criar health check
- [ ] Configurar CORS
- [ ] Criar endpoint de evento
- [ ] Criar endpoint de RSVP
- [ ] Criar endpoint de consulta de RSVPs

## Banco

- [ ] Criar tabela events
- [ ] Criar tabela rsvps
- [ ] Criar relacionamento
- [ ] Criar migrations
- [ ] Criar seed do evento do Pedro

---

# FASE 4 — Integração

O protótipo estático já envia RSVPs à API local. A listagem dos registros e a página do organizador não fazem parte da primeira entrega. A integração Angular permanece para a etapa do frontend.

O POST público já valida os campos, usa honeypot e limita tentativas em memória por IP. Antes de múltiplas instâncias, adicionar proteção de borda ou um limitador compartilhado.

Os testes automatizados da API ficam em `backend/tests/test_rsvps.py`; execute-os com `python -m pytest` dentro de `backend/`.

- [ ] Conectar Angular à API
- [ ] Buscar evento pela API
- [ ] Enviar RSVP
- [ ] Exibir confirmação
- [ ] Tratar erros
- [ ] Configurar environment de produção

---

# FASE 5 — Consulta do organizador (adiada)

Retomar depois da primeira entrega. Antes de expor a leitura, proteger a página e a rota da API com Cloudflare Access ou mecanismo equivalente.

- [ ] Criar página de RSVPs
- [ ] Mostrar total de confirmações
- [ ] Mostrar total de adultos
- [ ] Mostrar total de crianças
- [ ] Mostrar total de recusas
- [ ] Mostrar lista de convidados
- [ ] Mostrar observações

---

# FASE 6 — Deploy

O scaffold local está preparado em `backend/railway.toml` e `deployment/build-prototype.mjs`; o roteiro está em `deployment/README.md`. Ainda falta criar/enviar o repositório remoto, configurar os serviços e variáveis reais e validar os domínios gratuitos. Domínio próprio pode ficar para depois.

## Backend

- [ ] Criar serviço no Railway
- [ ] Configurar PostgreSQL
- [ ] Configurar variáveis
- [ ] Fazer deploy
- [ ] Testar API pública

## Frontend

- [ ] Criar projeto no Cloudflare
- [ ] Configurar build
- [ ] Configurar environment
- [ ] Fazer deploy
- [ ] Configurar domínio

## Testes

- [ ] Testar Android
- [ ] Testar iPhone
- [ ] Testar desktop
- [ ] Testar diferentes tamanhos de tela
- [ ] Testar formulário
- [ ] Testar erros
- [ ] Testar carregamento

---

# FASE 7 — Generalização

Somente depois que o convite do Pedro estiver funcionando.

- [ ] Transformar evento em entidade configurável
- [ ] Criar slug
- [ ] Criar rota dinâmica
- [ ] Remover dados hardcoded
- [ ] Criar configuração de tema
- [ ] Criar configuração de conteúdo
- [ ] Criar primeiro template reutilizável

Exemplo:

```text
/evento/pedro-1-ano
/evento/joao-5-anos
/evento/maria-3-anos
```

---

# FASE 8 — Produto

Somente após validação.

* [ ] Criar criação de evento
* [ ] Criar cadastro de cliente
* [ ] Criar autenticação
* [ ] Criar dashboard
* [ ] Criar seleção de template
* [ ] Criar personalização
* [ ] Criar preview
* [ ] Criar publicação
* [ ] Criar pagamento
* [ ] Criar domínio/link do evento

---

# FASE 9 — Funcionalidades futuras

Backlog sem prioridade:

* [ ] Lista de presentes
* [ ] QR Code
* [ ] Compartilhamento WhatsApp
* [ ] Integração WhatsApp
* [ ] Lembretes
* [ ] Analytics
* [ ] Música
* [ ] Galeria de fotos
* [ ] Mural de mensagens
* [ ] IA para criação de temas
* [ ] IA para personalização
* [ ] Recursos para buffets

---

# Milestones

## M1 — Convite visual

Critério de sucesso:

> O convite do Pedro pode ser aberto pelo celular e parece um produto pronto.

---

## M2 — RSVP

Critério de sucesso:

> Um convidado consegue confirmar presença sem dificuldade.

---

## M3 — Dados

Critério de sucesso:

> As confirmações ficam armazenadas e podem ser consultadas.

---

## M4 — Deploy

Critério de sucesso:

> O convite está disponível através de um link público.

---

## M5 — Produto

Critério de sucesso:

> É possível criar um segundo evento sem alterar o código da página.

---

# Regras do backlog

## Regra 1

Uma tarefa deve representar uma mudança pequena.

## Regra 2

Não implementar uma fase futura antes de validar a fase atual.

## Regra 3

Não adicionar tecnologia sem necessidade.

## Regra 4

Se uma tarefa começar a ficar grande, dividi-la.

## Regra 5

Manter o produto funcionando após cada incremento.
