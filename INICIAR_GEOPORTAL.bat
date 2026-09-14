@echo off
title Geoportal Mario Campos - Cadastro Tecnico Imobiliario 2023
chcp 65001 > nul
cls

echo ====================================================================
echo        GEOPORTAL MARIO CAMPOS - CADASTRO TECNICO IMOBILIARIO 2023
echo ====================================================================
echo.
echo Iniciando o servidor local e abrindo o navegador...
echo.

set PYTHON_QGIS="C:\Program Files\QGIS 3.36.2\bin\python-qgis.bat"

if exist %PYTHON_QGIS% (
    %PYTHON_QGIS% "%~dp0server.py"
) else (
    python "%~dp0server.py"
)

pause
