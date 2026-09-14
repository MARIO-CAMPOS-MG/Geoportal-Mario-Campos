@echo off
chcp 65001 > nul
title Publicar Geoportal Mario Campos no GitHub
color 0b

echo ===================================================================
echo     PUBLICADOR AUTOMATICO DO GEOPORTAL MARIO CAMPOS NO GITHUB
echo ===================================================================
echo.
echo [1/3] Verificando arquivos e repositorio local...
cd /d "C:\Users\RAFAEL PC\.gemini\antigravity\scratch\geoportal-mario-campos"

set "GIT_EXE=C:\Users\RAFAEL PC\.gemini\antigravity\scratch\tools\mingit\cmd\git.exe"

"%GIT_EXE%" status
echo.
echo [2/3] Conectando e enviando para o GitHub...
echo Repositorio: https://github.com/rafaelrocknrollgnr-lab/Geoportal-Mario-Campos.git
echo.
echo * Se o GitHub solicitar autorizacao, uma janela do seu navegador
echo   abrira para voce clicar em "Sign in with your browser".
echo.
"%GIT_EXE%" push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================================================
    echo  [SUCESSO] CODIGO ENVIADO COM SUCESSO PARA O GITHUB!
    echo ===================================================================
    echo.
    echo Seu repositorio esta atualizado em:
    echo https://github.com/rafaelrocknrollgnr-lab/Geoportal-Mario-Campos
    echo.
    echo O Geoportal ficara online em instantes via GitHub Pages em:
    echo https://rafaelrocknrollgnr-lab.github.io/Geoportal-Mario-Campos/
    echo.
) else (
    echo.
    echo ===================================================================
    echo  [AVISO] Verifique as credenciais ou permissao no GitHub.
    echo ===================================================================
    echo.
)

echo Pressione qualquer tecla para fechar esta janela...
pause > nul
