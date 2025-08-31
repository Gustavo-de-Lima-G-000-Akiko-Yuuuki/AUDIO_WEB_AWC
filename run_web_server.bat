@echo off
setlocal EnableDelayedExpansion

REM --- Configurações ---
set PYTHON_EMBEDDED_PATH=.\python_embeded\python.exe
set SERVER_SCRIPT=web_server.py
set REQUIREMENTS_FILE=requirements.txt
set HOST=0.0.0.0
set PORT=8000

REM--.\python_embeded\python.exe python_embeded\get-pip.py--
REM --- Título do Script ---
echo ===================================================
echo  Iniciando o Servidor Web do Simulador de ANC
echo ===================================================
echo.

REM --- 1. Verificar se o Python esta disponivel ---
set PYTHON_EXECUTABLE=

REM Tenta encontrar o Python embutido primeiro
if exist "%PYTHON_EMBEDDED_PATH%" (
    set PYTHON_EXECUTABLE="%PYTHON_EMBEDDED_PATH%"
    echo Python embutido encontrado: %PYTHON_EXECUTABLE%
) else (
    REM Se nao encontrar, procura no PATH
    for /f "delims=" %%a in (
        'where python.exe 2^>nul'
    ) do (
        if not defined PYTHON_EXECUTABLE (
            set PYTHON_EXECUTABLE=%%a
        )
    )
    if not defined PYTHON_EXECUTABLE (
        for /f "delims=" %%a in (
            'where python3.exe 2^>nul'
        ) do (
            if not defined PYTHON_EXECUTABLE (
                set PYTHON_EXECUTABLE=%%a
            )
        )
    )
    
    if defined PYTHON_EXECUTABLE (
        echo Python encontrado no PATH: %PYTHON_EXECUTABLE%
    ) else (
        echo ERRO: Python nao encontrado.
        echo Por favor, instale o Python 3.7 ou superior e adicione-o ao PATH.
        echo Voce pode baixar em: https://www.python.org/downloads/
        echo.
        echo Pressione qualquer tecla para sair...
        pause
        exit /b 1
    )
)

REM --- 2. Verificar e instalar dependencias ---
echo.
echo Verificando e instalando dependencias Python...
call %PYTHON_EXECUTABLE% -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo ERRO: Nao foi possivel atualizar o pip. Verifique sua conexao com a internet ou permissoes.
    echo Pressione qualquer tecla para sair...
    pause
    exit /b 1
)


echo Dependencias instaladas com sucesso!

REM --- 3. Verificar se os arquivos necessarios existem ---
echo.
echo Verificando arquivos do projeto...

if not exist "%SERVER_SCRIPT%" (
    echo ERRO: Arquivo %SERVER_SCRIPT% nao encontrado.
    echo Certifique-se de que todos os arquivos do projeto estao no diretorio correto.
    echo Pressione qualquer tecla para sair...
    pause
    exit /b 1
)

if not exist "audio_processor_backend.py" (
    echo ERRO: Arquivo audio_processor_backend.py nao encontrado.
    echo Certifique-se de que todos os arquivos do projeto estao no diretorio correto.
    echo Pressione qualquer tecla para sair...
    pause
    exit /b 1
)

if not exist "static" (
    echo ERRO: Diretorio static nao encontrado.
    echo Certifique-se de que todos os arquivos do projeto estao no diretorio correto.
    echo Pressione qualquer tecla para sair...
    pause
    exit /b 1
)

echo Todos os arquivos necessarios foram encontrados.

REM --- 4. Executar o servidor web ---
echo.

REM Adiciona o diretorio atual ao PYTHONPATH para garantir que os modulos locais sejam encontrados
set "CURRENT_DIR=%~dp0"
set "PYTHONPATH=%CURRENT_DIR%;%PYTHONPATH%"

REM Limpa caches do Python (arquivos .pyc) para evitar problemas de importacao
for /d /r . %%d in (__pycache__) do (rmdir /s /q "%%d" 2>nul)
for /f "delims=" %%f in (
    'dir /s /b *.pyc 2^>nul'
) do (del "%%f" 2>nul)

echo ===================================================
echo  Iniciando o servidor web...
echo ===================================================
echo.
echo Servidor sera executado em: http://%HOST%:%PORT%
echo.
echo Para acessar a aplicacao:
echo   - Abra seu navegador web
echo   - Va para: http://localhost:%PORT%
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.
echo ===================================================

call !PYTHON_EXECUTABLE! "%SERVER_SCRIPT%"

if %errorlevel% neq 0 (
    echo.
    echo ERRO: O servidor web encontrou um problema durante a execucao.
    echo Verifique a saida acima para detalhes.
    echo.
    echo Possiveis causas:
    echo   - Porta %PORT% ja esta em uso por outro programa
    echo   - Problemas de permissao de rede
    echo   - Erro no codigo do servidor
    echo.
)

echo.
echo Servidor web finalizado.
pause
endlocal