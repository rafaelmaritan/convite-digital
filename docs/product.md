# Product

## 1. Visão do produto

Criar uma solução simples para pais criarem uma experiência digital bonita para festas infantis.

A solução combina:

- convite digital;
- página do evento;
- confirmação de presença;
- informações da festa.

A proposta não é competir inicialmente como uma ferramenta genérica de convites.

O diferencial desejado é a combinação de:

**identidade visual + experiência digital + simplicidade.**

---

# 2. Problema

Organizar uma festa infantil envolve diversas tarefas.

Entre elas:

- criar o convite;
- divulgar o evento;
- saber quem irá;
- saber quantos adultos irão;
- saber quantas crianças irão;
- compartilhar informações;
- atualizar informações posteriormente.

Muitas soluções existentes são focadas em templates ou ferramentas de organização.

A oportunidade explorada neste projeto é oferecer uma experiência mais simples e visualmente personalizada.

---

# 3. Público-alvo

Inicialmente:

**Pais organizando festas infantis.**

Principalmente:

- aniversários de 1 ano;
- aniversários infantis;
- festas familiares;
- eventos pequenos e médios.

Possíveis clientes futuros:

- buffets infantis;
- decoradores;
- fotógrafos;
- organizadores de eventos;
- empresas de festas.

---

# 4. Proposta de valor

### Proposta principal

> Crie um convite único para a festa do seu filho e tenha uma página linda para seus convidados confirmarem presença.

Outra possibilidade de posicionamento:

> Seu convite + página + confirmação de presença em uma experiência única.

---

# 5. Primeiro caso de uso

O primeiro evento será o aniversário de 1 ano do Pedro.

Objetivo:

validar se uma página personalizada consegue proporcionar uma experiência melhor do que simplesmente enviar uma imagem de convite pelo WhatsApp.

---

# 6. Jornada do convidado

```text
Recebe convite pelo WhatsApp
        ↓
Abre o link
        ↓
Visualiza a página
        ↓
Vê informações do evento
        ↓
Clica em "Confirmar presença"
        ↓
Preenche formulário
        ↓
Envia
        ↓
Recebe confirmação
```

A jornada deve ser curta.

Não deve exigir:

* cadastro;
* senha;
* aplicativo;
* login;
* download.

---

# 7. Jornada do organizador

Inicialmente:

```text
Evento criado
      ↓
Compartilha convite
      ↓
Convidados respondem
      ↓
Organizador consulta confirmações
      ↓
Obtém quantidade de pessoas
```

---

# 8. MVP

## Página pública

A página deve apresentar:

* fotografia;
* nome da criança;
* idade;
* mensagem;
* data;
* horário;
* local;
* endereço;
* link do endereço para abrir a localização no Google Maps;
* countdown;
* botão de RSVP.

---

## RSVP

Campos:

### Nome

Obrigatório.

### Presença

Opções:

* Sim, estarei presente
* Não poderei comparecer

Obrigatório.

### Adultos

Quantidade.

### Crianças

Quantidade.

### Observação

Campo opcional.

### Prazo para confirmação

A data limite para responder deve ser configurável por evento e exibida na página do convite.

## Consulta do organizador

Fica fora da primeira entrega. Quando for retomada, a visão do organizador deve resumir as respostas recebidas:

* quantidade de RSVPs confirmados (`attending = true`);
* quantidade de pessoas esperadas, somando adultos e crianças apenas de quem confirmou;
* totais de adultos e crianças entre os confirmados;
* quantidade de recusas (`attending = false`);
* lista com nome, resposta, quantidades, observação e data de envio.

O modelo registra somente quem enviou uma resposta. Uma pessoa sem RSVP não deve ser contabilizada como recusa.

---

# 9. Regras de negócio

## RSVP

Um RSVP deve possuir:

* evento;
* nome;
* status de presença;
* quantidade de adultos;
* quantidade de crianças;
* observação;
* data de criação.

---

## Presença

Quando:

```text
attending = true
```

adultos e crianças devem representar a quantidade de pessoas que comparecerão.

Quando:

```text
attending = false
```

adultos e crianças podem ser armazenados como zero.

O resumo de pessoas esperadas inclui somente RSVPs com `attending = true`. A quantidade de recusas é calculada separadamente.

---

## Nome

O nome não pode ser vazio.

## Prazo de confirmação

Cada evento deve possuir uma data limite de RSVP configurável. A página pública deve exibir essa data.

## Proteção do RSVP público

O convidado não precisa de conta. O endpoint público deve validar os dados, usar um campo honeypot e limitar tentativas por IP. O limite simples em memória é adequado apenas a uma instância; antes de operar em múltiplas instâncias, adicionar rate limiting compartilhado ou na borda.

---

# 10. Modelo de dados

## Event

Campos mínimos:

```text
id
slug
name
age
date
time
location
address
rsvp_deadline
message
theme
created_at
updated_at
```

---

## RSVP

Campos mínimos:

```text
id
event_id
name
attending
adults
children
message
created_at
```

---

# 11. API

## Event

### GET

```http
GET /api/events/{slug}
```

Retorna os dados públicos do evento.

---

## RSVP

### POST

```http
POST /api/events/{slug}/rsvps
```

Cria uma confirmação.

---

## Administração

Fora da primeira entrega; implementar somente quando a página do organizador for retomada e protegida.

### GET

```http
GET /api/events/{slug}/rsvps
```

Retorna os RSVPs do evento.

Essa rota e a página do organizador não devem ser implementadas ou publicadas na primeira entrega. Quando forem adicionadas, proteger a leitura dos RSVPs com Cloudflare Access ou mecanismo equivalente; não disponibilizar os dados pessoais por uma rota pública.

---

# 12. Métricas futuras

Após validar o produto, acompanhar:

### Conversão

```text
visitantes → RSVPs
```

### Taxa de confirmação

```text
confirmados / visitantes
```

### Média de convidados

```text
pessoas por RSVP
```

### Uso

* eventos criados;
* eventos ativos;
* RSVPs por evento;
* visitantes por evento.

---

# 13. Hipóteses de negócio

## Hipótese 1

Pais valorizam uma experiência mais personalizada do que um convite estático.

## Hipótese 2

Pais estão dispostos a pagar por personalização.

## Hipótese 3

A confirmação de presença aumenta o valor percebido do convite.

## Hipótese 4

Uma solução simples pode ser mais atrativa do que uma plataforma cheia de funcionalidades.

---

# 14. Modelo comercial futuro

O primeiro modelo a ser testado provavelmente será:

**pagamento por evento.**

Exemplo:

```text
Convite digital
+
Página personalizada
+
RSVP
```

Preço inicial hipotético:

```text
R$ 49 – R$ 79
```

Uma versão premium poderá incluir:

```text
Identidade visual personalizada
+
Convite
+
Página
+
RSVP
+
Personalizações adicionais
```

Preço hipotético:

```text
R$ 99 – R$ 149
```

Os preços não são definitivos e deverão ser validados com clientes.

---

# 15. Evolução do produto

## V0

Convite do Pedro.

## V1

Convite + RSVP.

## V2

Evento configurável.

## V3

Templates.

## V4

Criação de eventos pelo próprio cliente.

## V5

Personalização visual.

## V6

Pagamento.

## V7

Recursos adicionais:

* lista de presentes;
* integração com WhatsApp;
* QR Code;
* lembretes;
* analytics;
* IA;
* recursos para buffets.

---

# 16. O que NÃO fazer agora

Não construir:

* sistema completo de usuários;
* painel administrativo complexo;
* editor drag-and-drop;
* marketplace;
* pagamentos;
* assinatura;
* CRM;
* integração com múltiplas plataformas;
* IA generativa;
* aplicativo mobile.

Esses recursos somente serão considerados após validação da proposta.

---

# 17. Princípio principal

Sempre perguntar:

> Isso ajuda a validar ou entregar o convite?

Se a resposta for não, provavelmente não deve entrar no MVP.
