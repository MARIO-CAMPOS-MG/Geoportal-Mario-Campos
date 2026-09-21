@echo off
chcp 65001 > nul
title Publicar Geoportal no MARIO-CAMPOS-MG
color 0a

echo ===================================================================
echo   PUBLICADOR GEOPORTAL MARIO CAMPOS - CONTA MARIO-CAMPOS-MG
echo ===================================================================
echo.
echo Repositorio de destino:
echo https://github.com/MARIO-CAMPOS-MG/Geoportal-Mario-Campos.git
echo.
echo [1/3] Entrando na pasta do projeto...
cd /d "C:\Users\RAFAEL PC\.gemini\antigravity\scratch\geoportal-mario-campos"

set "GIT_EXE=C:\Users\RAFAEL PC\.gemini\antigravity\scratch\tools\mingit\cmd\git.exe"

echo.
echo [2/3] Enviando branch main para MARIO-CAMPOS-MG...
echo * Se abrir a janela do navegador, faca login com a conta MARIO-CAMPOS-MG.
echo.
"%GIT_EXE%" push https://github.com/MARIO-CAMPOS-MG/Geoportal-Mario-Campos.git main --force

if %ERRORLEVEL% equ 0 (
    echo.
    echo [3/3] Enviando branch gh-pages para publicacao online...
    "%GIT_EXE%" push https://github.com/MARIO-CAMPOS-MG/Geoportal-Mario-Campos.git main:gh-pages --force
    
    echo.
    echo ===================================================================
    echo  [SUCESSO] GEOPORTAL ENVIADO COM SUCESSO PARA MARIO-CAMPOS-MG!
    echo ===================================================================
    echo.
    echo 1. Repositorio atualizado:
    echo    https://github.com/MARIO-CAMPOS-MG/Geoportal-Mario-Campos
    echo.
    echo 2. Para ativar o Geoportal Online no GitHub Pages:
    echo    - Acesse: https://github.com/MARIO-CAMPOS-MG/Geoportal-Mario-Campos/settings/pages
    echo    - Em 'Build and deployment' -> 'Source': Selecione 'Deploy from a branch'
    echo    - Em 'Branch': Selecione 'gh-pages' e pasta '/ (root)' e clique em 'Save'
    echo.
    echo 3. Seu link online ficara disponivel em instantes em:
    echo    https://mario-campos-mg.github.io/Geoportal-Mario-Campos/
    echo.
) else (
    echo.
    echo ===================================================================
    echo  [AVISO DE PERMISSAO]
    echo ===================================================================
    echo  O Git informou que a conta conectada nao tem permissao no repositorio.
    echo.
    echo  SOLUCAO RECOMENDADA:
    echo  1. Acesse: https://github.com/MARIO-CAMPOS-MG/Geoportal-Mario-Campos/settings/access
    echo  2. Clique em 'Add people' e adicione o usuario: rafaelrocknrollgnr-lab
    echo  3. Apos convidar, execute este arquivo novamente ou avise no chat!
    echo.
)

echo Pressione qualquer tecla para sair...
pause > nul
