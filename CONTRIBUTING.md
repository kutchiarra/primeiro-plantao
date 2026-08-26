# Como trabalhar neste repositório

Somos três. Isto existe para o trabalho de um não apagar o do outro.

## O fluxo

```bash
git switch -c prancha-vista-posterior    # branch por assunto, nome curto
# ... trabalha ...
npm run lint && npm run build            # antes de propor
git push -u origin prancha-vista-posterior
gh pr create                             # ou pelo site
```

Ninguém empurra direto para `main`. **Isso não está travado no GitHub** — o
travamento exige plano pago em repositório privado, então aqui é combinado, não
imposto. Um `git push origin main` distraído passa. Por isso: branch sempre.

Toda proposta roda `oxlint` e `vite build` automaticamente. Se aparecer o X
vermelho, o problema é seu, não do CI.

## As três regras que evitam colisão

**1. Componente novo em arquivo novo.** `Atendimento.jsx` e `estilo.css` são os
arquivos quentes — quase toda mudança passa por eles. Se der para nascer em
arquivo próprio, nasce. No CSS, bloco demarcado por comentário de seção.

**2. O motor é puro; a tela é descartável.** O estado fisiológico é função pura
do tempo e das administrações — mesma linha do tempo, mesmos números. É isso que
torna a sessão reproduzível e o debriefing auditável. Nenhuma decisão de
apresentação escreve no motor.

**3. Gabarito nunca no cliente.** Vale para resultados de exame,
`diagnostico_final` e `nota_do_preceptor`. Hoje o protótipo carrega tudo no
navegador porque é protótipo; quando o Supabase entrar, essa fronteira é a
primeira coisa a respeitar.

## Duas frentes, código separado

`primeiro-plantao/leito-4.html` **não é gerado** pelo app React. São dois
códigos que compartilham a identidade visual: o arquivo único é o que se manda
para alguém usar, o app é o produto. Mudança de comportamento precisa entrar nos
dois, ou eles divergem em uma semana.

## Conteúdo clínico

Caso novo só entra com **revisor identificado** e **guideline citado**. Um
simulador que ensina errado é pior que simulador nenhum.
