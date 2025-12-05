# Guia de Deploy no Railway (com Persistência de Dados)

Como seu site usa arquivos locais para salvar posts e imagens, precisamos configurar "Volumes" no Railway, caso contrário você perderá tudo a cada atualização.

## Passo 1: Preparar o GitHub
1.  Certifique-se de que todo o seu código está salvo no GitHub.

## Passo 2: Criar Projeto no Railway
1.  Acesse [railway.app](https://railway.app) e faça login com GitHub.
2.  Clique em **"New Project"** -> **"Deploy from GitHub repo"**.
3.  Selecione seu repositório `biblia-online` (ou o nome que você deu).
4.  Clique em **"Deploy Now"**.

## Passo 3: Configurar Volumes (IMPORTANTE!)
Enquanto o deploy acontece (ou logo após), configure a persistência:

1.  No painel do seu projeto no Railway, clique no serviço (bloco retangular).
2.  Vá na aba **"Volumes"**.
3.  Clique em **"Add Volume"**.
4.  Crie DOIS volumes (ou um volume montado em múltiplos lugares, mas dois é mais fácil):
    *   **Volume 1:**
        *   Mount Path: `/app/src/data`
    *   **Volume 2:**
        *   Mount Path: `/app/uploads`

Isso garante que seus posts (`src/data`) e imagens (`uploads`) sejam salvos em um "disco virtual" que não é apagado quando você atualiza o site.

## Passo 4: Configurar Domínio
1.  Vá na aba **"Settings"**.
2.  Desça até **"Networking"** -> **"Public Networking"**.
3.  Você pode gerar um domínio `xxx.railway.app` para testar.
4.  Para usar seu domínio `bibliaonline.me`:
    *   Clique em **"Custom Domain"**.
    *   Digite `bibliaonline.me`.
    *   O Railway vai te dar os registros DNS (CNAME ou A) para configurar onde você comprou o domínio (GoDaddy, registro.br, etc).

## Passo 5: Testar
Acesse seu site. Tente criar um post e salvar. Reinicie o serviço no Railway e veja se o post continua lá. Se sumir, a configuração do Volume falhou.
