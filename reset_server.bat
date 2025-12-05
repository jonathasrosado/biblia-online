@echo off
echo Parando todos os processos Node.js...
taskkill /F /IM node.exe
echo.
echo Todos os processos Node foram encerrados.
echo Agora execute "npm run dev" novamente.
pause
