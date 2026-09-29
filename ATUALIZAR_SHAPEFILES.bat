@echo off
title Geoportal Mario Campos - Atualizar Dados dos Shapefiles
chcp 65001 > nul
cls

echo ====================================================================
echo        GEOPORTAL MARIO CAMPOS - ATUALIZACAO DE SHAPEFILES
echo ====================================================================
echo.
echo Processando os shapefiles da pasta de mapeamento original...
echo Aguarde alguns instantes...
echo.

set PYTHON_QGIS="C:\Program Files\QGIS 3.36.2\bin\python-qgis.bat"

if exist %PYTHON_QGIS% (
    %PYTHON_QGIS% "%~dp0build_geoportal_data.py"
) else (
    python "%~dp0build_geoportal_data.py"
)

echo.
echo ====================================================================
echo Processamento concluido!
echo ====================================================================
echo.
pause
