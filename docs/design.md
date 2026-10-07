# Design

## 1. Objetivo visual

O produto deve transmitir:

- carinho;
- celebração;
- delicadeza;
- personalidade;
- sofisticação;
- naturalidade.

Evitar aparência de:

- sistema corporativo;
- formulário tradicional;
- template genérico;
- página infantil excessivamente colorida.

---

# 2. Referência visual

O primeiro evento é o aniversário de 1 ano do Pedro.

A identidade visual utilizada nesse evento servirá como referência para o produto.

Características:

- infantil sofisticado;
- natural;
- artesanal;
- delicado;
- editorial;
- fotográfico.

---

# 3. Paleta

Paleta inicial:

### Creme

Usado como fundo principal.

```text
#F5F0E8
```

### Bege

Usado para áreas secundárias.

```text
#E8DDCC
```

### Azul suave

Usado como cor de destaque.

```text
#8FA8B8
```

### Verde oliva

Usado em elementos naturais.

```text
#7D8660
```

### Terracota

Usado em pequenos detalhes.

```text
#B9785F
```

As cores podem ser ajustadas conforme a identidade visual do evento.

---

# 4. Tipografia

A tipografia deve combinar:

### Títulos

Uma fonte com personalidade, podendo ser:

* serifada;
* manuscrita;
* display.

### Texto

Fonte simples e altamente legível.

Preferência:

* sans-serif;
* boa leitura em telas pequenas.

Evitar utilizar muitas fontes diferentes.

Regra:

**máximo de duas famílias tipográficas por tema.**

---

# 5. Layout

O layout deve ser:

* mobile-first;
* vertical;
* respirado;
* centrado;
* visualmente leve.

A página deve funcionar bem em:

```text
320px
375px
390px
414px
```

Também deve funcionar em desktop.

---

# 6. Estrutura visual

A página poderá seguir:

```text
┌─────────────────────────────┐
│                             │
│          FOTO               │
│                             │
│          PEDRO              │
│          1 ANO              │
│                             │
│    mensagem principal       │
│                             │
├─────────────────────────────┤
│                             │
│       DATA / LOCAL          │
│                             │
├─────────────────────────────┤
│                             │
│       COUNTDOWN             │
│                             │
├─────────────────────────────┤
│                             │
│   detalhes do evento        │
│                             │
├─────────────────────────────┤
│                             │
│   CONFIRMAR PRESENÇA        │
│                             │
└─────────────────────────────┘
```

---

# 7. Fotografia

A fotografia da criança deve ser um dos elementos principais da página.

Regras:

* não distorcer a imagem;
* preservar proporções;
* evitar filtros exagerados;
* manter boa qualidade;
* utilizar bordas ou máscaras apenas quando fizer sentido para o tema.

---

# 8. Ilustrações

Podem ser utilizados:

* animais;
* folhagens;
* flores;
* sol;
* elementos naturais;
* formas orgânicas.

As ilustrações devem complementar a fotografia.

Não devem competir com ela.

---

# 9. Animaizinhos

Os animais utilizados no convite do Pedro devem manter suas características principais.

Podem ser adaptados para:

* mesma paleta;
* mesma textura;
* mesmo estilo;
* mesma composição visual.

O objetivo é criar uma identidade consistente.

---

# 10. Botões

O CTA principal deve ser evidente.

Exemplo:

```text
CONFIRMAR PRESENÇA
```

Características:

* grande área clicável;
* contraste suficiente;
* bordas arredondadas;
* feedback visual;
* fácil utilização com uma mão.

---

# 11. Formulário

O formulário deve ser curto.

Exemplo:

```text
Seu nome

( ) Sim, estarei presente
( ) Não poderei comparecer

Adultos: [-] 1 [+]

Crianças: [-] 0 [+]

Alguma observação?

[____________________]

CONFIRMAR
```

Não pedir informações desnecessárias.

---

# 12. Estados

Todos os componentes interativos devem possuir estados claros.

## Loading

Indicar carregamento.

## Success

Mostrar mensagem de sucesso.

Exemplo:

> Presença confirmada!
>
> Será uma alegria ter vocês conosco.

## Error

Mostrar mensagem amigável.

Exemplo:

> Não conseguimos registrar sua confirmação. Tente novamente.

---

# 13. Acessibilidade

Garantir:

* contraste adequado;
* textos legíveis;
* botões com tamanho adequado;
* labels nos campos;
* navegação por teclado;
* mensagens de erro claras;
* imagens com `alt`.

---

# 14. Performance

Priorizar:

* imagens otimizadas;
* lazy loading quando apropriado;
* CSS simples;
* poucos scripts;
* fontes otimizadas;
* bundle pequeno.

A experiência deve ser rápida em redes móveis.

---

# 15. Responsividade

Mobile é prioridade.

Desktop deve ser uma adaptação do layout mobile.

Não criar duas interfaces completamente diferentes.

---

# 16. Design tokens

Centralizar variáveis de design.

Exemplo:

```scss
:root {
  --color-background: #F5F0E8;
  --color-surface: #E8DDCC;
  --color-primary: #8FA8B8;
  --color-secondary: #7D8660;
  --color-accent: #B9785F;

  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 40px;
}
```

Os valores podem evoluir.

---

# 17. Componentes

Manter poucos componentes.

Exemplo:

```text
InvitationPage
├── InvitationHero
├── EventInfo
├── Countdown
├── InvitationMessage
└── RsvpSection
```

Não criar componentes para elementos triviais sem necessidade.

---

# 18. Princípio visual

A página deve parecer:

> uma experiência de convite

e não:

> um sistema que possui um convite.

Essa diferença deve orientar as decisões de design.
