@echo off
title Geoportal Mario Campos - Atualizar Shapefiles Local e Online
chcp 65001 > nul
color 0b
cls

echo ====================================================================
echo   GEOPORTAL MARIO CAMPOS - SINCRONIZACAO DE SHAPEFILES LOCAL E ONLINE
echo ====================================================================
echo.
echo 1. Lendo e reprocessando os Shapefiles da pasta de mapeamento...
echo 2. Sincronizando automaticamente com o Geoportal Online (GitHub)...
echo.

set PYTHON_QGIS="C:\Program Files\QGIS 3.36.2\bin\python-qgis.bat"

if exist %PYTHON_QGIS% (
    %PYTHON_QGIS% "%~dp0sync_manager.py"
) else (
    python "%~dp0sync_manager.py"
)

echo.
echo ====================================================================
echo   SINCRONIZACAO CONCLUIDA!
echo ====================================================================
echo.
echo Geoportal Online disponivel em:
echo https://mario-campos-mg.github.io/Geoportal-Mario-Campos/
echo.
echo Pressione qualquer tecla para sair...
pause > nul
