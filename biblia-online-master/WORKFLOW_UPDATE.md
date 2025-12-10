# Fluxo de Trabalho e Atualizações

## 1. Como Atualizar o Site (Workflow)

Agora que seu site está "automatizado" com Railway e GitHub, o fluxo mudou um pouco. Você **NÃO** edita nada diretamente no site (Railway). Você edita no seu computador.

**O Processo Correto:**
1.  **Edite no seu PC:** Faça as mudanças no VS Code (ou peça para mim).
2.  **Eu envio para o GitHub:** Eu rodo comandos `git add`, `git commit` e `git push`.
3.  **O Railway Atualiza Sozinho:** Assim que o código chega no GitHub, o Railway detecta, reconstrói o site e coloca a nova versão no ar em cerca de 2 minutos.

Isso garante que você sempre tenha um histórico (backup) de tudo e que o site em produção seja sempre fiel ao código.

## 2. A Volta da IA na Pesquisa ✨

Atendi seu pedido e **trouxe a inteligência de volta para a busca.**

**Como estava antes (o "problema"):**
O sistema estava priorizando velocidade. Se você digitasse "amor", ele achava versículos com a palavra "amor" instantaneamente no banco de dados local e *não* perguntava nada para a IA, para economizar tempo.

**Como ficou agora (A "Solução"):**
Agora, toda busca faz duas coisas ao mesmo tempo:
1.  **Busca Rápida:** Procura os versículos exatos no banco de dados.
2.  **Pergunta para a IA (Smart Summary):** Envia sua pergunta para o Gemini (IA) e pede uma explicação teológica, histórica ou resumo.

**Resultado:**
Quando você buscar "desânimo", ele vai trazer os versículos E um box no topo dizendo:
> "✨ **Resposta Inteligente:** A Bíblia trata o desânimo como um sentimento comum, mas passageiro. Em passagens como Salmos 42, vemos..."

Isso já foi enviado para o deploy e estará no ar em instantes.
