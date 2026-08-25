# Primeiro Plantão

Simulador clínico para médicos recém-formados e internos. O usuário atende um paciente
que fala, examina, pede exames que custam tempo e dinheiro, prescreve — e no fim recebe o
debriefing de um preceptor que viu tudo que ele fez e tudo que ele deixou de perguntar.

> Conteúdo clínico para fim educacional em simulação. **Não é dispositivo médico** e não
> deve ser usado para decisão sobre paciente real.

---

## Duas formas de abrir

### 1. Protótipo de arquivo único — para só ver funcionando

```
primeiro-plantao/leito-4.html
```

Abre com dois cliques em qualquer navegador. Não precisa de servidor, Node, nem instalação.
Traz o caso completo da Célia Ramos: conversa, exame físico, ausculta com som, exames com
fila, prescrição com curva farmacológica, debriefing e linha do tempo do atendimento.

É o arquivo para mandar para alguém que quer **usar**, não programar.

### 2. Aplicativo React — o produto

```bash
cd primeiro-plantao-app
npm install
npm run dev
```

Abre em `http://localhost:5177`. Além do atendimento, tem a camada que o arquivo único não
tem: sala de aula, cursos com aulas e objetivos, editor de curso, código de turma, prova
com nome de aluno e nota mínima, roster exportável em CSV/JSON, e dois casos —
dor torácica e anafilaxia.

---

## O que tem dentro

| Pasta | O que é |
|---|---|
| `primeiro-plantao-app/` | Aplicativo React + Vite. É o produto. |
| `primeiro-plantao/leito-4.html` | Protótipo jogável em arquivo único. |
| `primeiro-plantao/blueprint.html` | Arquitetura de dados, jornada de telas, farmacodinâmica e camada de cursos. |
| `primeiro-plantao/schema.sql` | DDL para Supabase: 22 tabelas, RLS e RPCs. Ainda não aplicado. |
| `primeiro-plantao/prompt-paciente-dor-toracica.md` | System prompt do paciente-IA, em três blocos. |
| `primeiro-plantao/ordem-de-servico.html` | Backlog em quatro fases, com esforço e critério de aceite. |
| `canvas/` | Pôster *Vigil Notation* e a filosofia visual que o gerou. |

## Como o motor funciona

**O estado fisiológico é função pura do tempo.** Os sinais vitais não são escritos numa
tabela: são a doença mais a soma das curvas de tudo que foi injetado. Cada fármaco carrega
início, pico, duração e o deslocamento de cada parâmetro no pico; a dose escala o efeito e a
interação do caso amplifica ou reduz. Mesma linha do tempo, mesmos números — é isso que
torna a sessão reproduzível e o debriefing auditável.

**A pontuação é determinística.** Anamnese, investigação e conduta saem de contas contra o
gabarito do caso. Só soft skills usa heurística (e, no produto, usaria o modelo com rubrica
fechada). Duas sessões idênticas produzem a mesma nota.

**A fala do paciente ainda não usa LLM.** Hoje é casamento por gatilho sobre o roteiro do
caso — o equivalente ao Bloco B do prompt. Trocar por Gemini é substituir a função
`responder()` em `primeiro-plantao-app/src/motor.js`; o resto do app não muda.

## Estado atual

- Sem backend. Cursos, turmas e progresso vivem em `localStorage` e **não sobrevivem a
  trocar de aparelho**. É a maior fragilidade — está como Fase 3 na ordem de serviço.
- Dois casos publicados. Cada caso novo precisa de revisor identificado e guideline citado.
- Os arquivos `.html` em `primeiro-plantao/` são documentos autocontidos: abrem sozinhos.

## Convenções

Há mais de uma frente mexendo no mesmo código. Três regras evitam colisão:

1. Componente novo em arquivo novo; bloco de CSS demarcado por comentário de seção.
2. O motor é puro e a tela é descartável — nenhuma decisão de apresentação escreve no motor.
3. Gabarito nunca no cliente. Vale para resultados de exame, `diagnostico_final` e
   `nota_do_preceptor`.
