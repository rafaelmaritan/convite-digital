# Copilot Instructions

## Contexto

Este projeto é uma plataforma simples de convites digitais personalizados para festas infantis.

O primeiro caso de uso é o aniversário de 1 ano do Pedro.

O objetivo atual é criar rapidamente um MVP funcional e visualmente bonito.

Não construir um SaaS completo neste momento.

---

# Princípios gerais

## Simplicidade

Priorize a solução mais simples que resolva o problema.

Não introduza abstrações desnecessárias.

Não crie frameworks, camadas ou padrões apenas por "boa prática".

---

## MVP first

Sempre considere:

> Qual é a menor implementação que resolve esta tarefa?

Implementar primeiro essa solução.

---

## Não over-engineer

Evitar:

- factories desnecessárias;
- repositories desnecessários;
- services genéricos sem necessidade;
- abstrações prematuras;
- sistemas de configuração complexos;
- componentes excessivamente genéricos;
- bibliotecas para funcionalidades simples.

---

# Stack

## Frontend

- Angular
- TypeScript
- SCSS
- Reactive Forms

Preferir:

- standalone components;
- signals quando fizer sentido;
- serviços pequenos;
- tipagem forte.

---

## Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL

---

# Arquitetura

Arquitetura inicial:

```text
Angular
   ↓
FastAPI
   ↓
PostgreSQL
```

Frontend:

```text
components
pages
services
models
```

Backend:

```text
api
models
schemas
services
database
```

Não criar camadas adicionais sem necessidade.

---

# Frontend

## Componentes

Criar componentes pequenos e focados.

Exemplo:

```text
InvitationPage
InvitationHero
EventInfo
Countdown
RsvpForm
```

Não criar componentes para elementos extremamente simples se isso aumentar a complexidade.

---

## Forms

Utilizar Angular Reactive Forms.

Validar:

* campos obrigatórios;
* valores numéricos;
* estados inválidos.

As mensagens devem ser claras para o usuário.

---

## HTTP

Centralizar chamadas à API em services.

Exemplo:

```text
EventService
RsvpService
```

Evitar chamadas HTTP diretamente dentro de componentes quando puderem ser encapsuladas em um service simples.

---

# Backend

## FastAPI

Utilizar:

* routers;
* schemas Pydantic;
* services somente quando agregarem valor;
* SQLAlchemy para persistência.

Manter endpoints REST simples.

Exemplo:

```text
GET /api/events/{slug}

POST /api/events/{slug}/rsvps
```

---

# Banco de dados

Modelo inicial:

```text
events
rsvps
```

Relacionamento:

```text
events 1 ───── N rsvps
```

Não criar outras entidades sem necessidade.

---

# API

Responses devem ser previsíveis e simples.

Utilizar HTTP status codes adequados.

Exemplo:

```text
200 - sucesso
201 - recurso criado
400 - requisição inválida
404 - recurso não encontrado
500 - erro interno
```

Não expor informações internas ou stack traces para o frontend.

---

# Segurança

O MVP pode ser simples, mas:

* nunca colocar secrets no código;
* nunca commitar senhas;
* usar environment variables;
* validar dados recebidos;
* evitar SQL injection;
* configurar CORS corretamente.

O RSVP público não exige login, mas deve validar os dados, usar honeypot e limitar tentativas.

Na primeira entrega, não implementar nem expor uma rota GET para listar RSVPs ou uma página do organizador. Quando essa consulta for adicionada, protegê-la com Cloudflare Access ou mecanismo equivalente.

O rate limit atual em memória é de 10 tentativas por IP em 10 minutos e serve apenas para uma instância simples; antes de escalar ou operar em múltiplas instâncias, usar um limitador compartilhado ou uma proteção de borda. Não confiar diretamente em cabeçalhos de IP encaminhado sem configurar proxies confiáveis.

Antes de transformar o sistema em produto público, revisar segurança e autenticação.

---

# UX

A aplicação é mobile-first.

O usuário provavelmente chegará através do WhatsApp.

Priorizar:

* carregamento rápido;
* textos curtos;
* botões grandes;
* boa legibilidade;
* poucos campos;
* feedback imediato.

---

# Design

A referência inicial é o convite do Pedro.

Estética:

* infantil sofisticada;
* natural;
* artesanal;
* delicada;
* editorial.

Paleta inicial:

* creme;
* bege;
* azul suave;
* verde oliva;
* terracota.

Evitar:

* excesso de cores;
* gradientes exagerados;
* aparência de dashboard;
* excesso de animações;
* componentes visuais genéricos.

---

# Performance

Priorizar:

* imagens otimizadas;
* lazy loading quando apropriado;
* bundle pequeno;
* poucas dependências;
* CSS simples.

Não adicionar uma biblioteca para resolver algo que pode ser feito facilmente com CSS ou Angular.

---

# Acessibilidade

Sempre que criar UI:

* utilizar HTML semântico;
* adicionar labels aos inputs;
* utilizar alt nas imagens;
* garantir foco visível;
* garantir contraste;
* não depender somente de cor para transmitir informação.

---

# Responsividade

Sempre implementar primeiro para mobile.

Validar pelo menos:

```text
320px
375px
390px
414px
768px
1024px+
```

---

# Código

Utilizar nomes claros.

Preferir código simples a código "inteligente".

Evitar:

* funções gigantes;
* componentes gigantes;
* duplicação desnecessária;
* comentários óbvios;
* números mágicos;
* strings espalhadas pelo código.

---

# Comentários

Não adicionar comentários explicando código óbvio.

Adicionar comentários somente quando explicarem:

* uma decisão importante;
* uma regra de negócio;
* uma limitação técnica;
* comportamento não intuitivo.

---

# Tratamento de erros

Sempre considerar:

* API indisponível;
* evento inexistente;
* formulário inválido;
* erro ao salvar RSVP;
* timeout.

O usuário final deve receber uma mensagem amigável.

Nunca mostrar stack trace.

---

# Configuração

Não hardcodar:

* URLs de API;
* credenciais;
* secrets;
* configurações de produção.

Utilizar environment variables.

---

# Git

Preferir commits pequenos e relacionados a uma única alteração.

Exemplos:

```text
feat: create invitation layout

feat: add event information

feat: add countdown

feat: add rsvp form

feat: persist rsvp

feat: add rsvp summary

chore: configure railway deployment

chore: configure cloudflare deployment
```

Evitar commits gigantes.

---

# Processo de implementação

Antes de implementar uma tarefa:

1. Ler README.md.
2. Ler os documentos relevantes em `docs/`.
3. Inspecionar a estrutura existente.
4. Identificar componentes/services existentes que podem ser reutilizados.
5. Implementar somente a tarefa solicitada.
6. Testar.
7. Verificar se não quebrou funcionalidades existentes.
8. Explicar as alterações realizadas.

---

# Regra importante

Quando o usuário solicitar uma funcionalidade específica:

**NÃO implementar funcionalidades adicionais por iniciativa própria.**

Exemplo:

Se o pedido for:

> Criar o formulário de RSVP.

Não implementar também:

* dashboard;
* autenticação;
* analytics;
* notificações;
* WhatsApp.

Essas funcionalidades pertencem a outras tarefas.

---

# Quando houver dúvida

Preferir:

1. solução simples;
2. solução já utilizada no projeto;
3. solução nativa do Angular/Python;
4. somente depois adicionar dependência.

---

# Não introduzir novas tecnologias sem justificativa

Antes de adicionar uma biblioteca ou serviço externo, verificar se:

* realmente é necessário;
* existe solução nativa;
* aumenta significativamente a complexidade.

O objetivo do MVP é velocidade.

---

# Critério de sucesso

Uma implementação é boa quando:

* resolve a tarefa;
* é fácil de entender;
* é fácil de modificar;
* não adiciona complexidade desnecessária;
* mantém o projeto funcionando.

---

# Produto

Lembrar que este projeto poderá evoluir para um produto comercial.

Porém:

**não antecipar problemas de escala que ainda não existem.**

Primeiro validar o produto.

Depois otimizar a arquitetura conforme as necessidades reais.
