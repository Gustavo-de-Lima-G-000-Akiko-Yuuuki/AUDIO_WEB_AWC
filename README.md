# Simulador de Cancelamento de Ruído Ativo

## Visão Geral do Projeto

Este projeto é um simulador de cancelamento de ruído ativo (ANC) e processamento de áudio em tempo real, implementado como uma aplicação web. Ele permite aos usuários capturar áudio do microfone, aplicar diferentes algoritmos de processamento (como inversão de fase, redução de ruído e filtragem avançada) e visualizar os resultados em tempo real. A interface web oferece controles para ajustar parâmetros de processamento e monitorar métricas de áudio, como RMS, pico e frequência dominante.

## Funcionalidades Principais

*   **Captura de Áudio em Tempo Real:** Utiliza o microfone do dispositivo para capturar áudio continuamente.
*   **Processamento de Áudio Versátil:** Implementa múltiplos modos de operação para processamento de áudio:
    *   **Inversão de Fase (Simulação ANC):** Simula o cancelamento de ruído ativo invertendo a fase do sinal de áudio de entrada. Ideal para demonstrar o princípio básico do ANC.
    *   **Redução de Ruído do Microfone:** Combina um filtro passa-alta com uma técnica de _spectral gating_ para atenuar ruídos de baixa frequência e de fundo, melhorando a clareza da voz.
    *   **Filtro Avançado:** Permite a aplicação de filtros passa-alta, passa-baixa, passa-banda e rejeita-banda com parâmetros configuráveis (frequências de corte, ordem do filtro).
*   **Controles de Configuração:** Interface intuitiva para ajustar parâmetros como limiar de ruído, frequências de corte, ganho de volume e tipo de filtro.
*   **Métricas de Áudio em Tempo Real:** Exibe o valor RMS (Root Mean Square), pico e frequência dominante do áudio processado, fornecendo feedback quantitativo sobre o impacto do processamento.
*   **Visualização Gráfica:** Apresenta visualizações em tempo real da forma de onda (waveform) e do espectro de frequência (spectrum) do áudio, permitindo uma análise visual do processamento.
*   **Log de Sistema:** Um console de log integrado para exibir mensagens de status, erros e informações de depuração.
*   **Interface Web Responsiva:** Desenvolvido com HTML, CSS e JavaScript para uma experiência de usuário acessível via navegador web.
*   **Backend Robustos:** Utiliza FastAPI para o backend, oferecendo endpoints RESTful e comunicação WebSocket para processamento de áudio em tempo real e atualização de configurações.

## Arquitetura Técnica

O projeto é dividido em duas partes principais: o _backend_ (servidor) e o _frontend_ (interface do usuário).

### Backend

O _backend_ é construído com **FastAPI**, um _framework_ web moderno e rápido para construir APIs com Python 3.7+. Ele gerencia a lógica de processamento de áudio e a comunicação com o _frontend_.

*   **`web_server.py`**: Este é o arquivo principal do servidor FastAPI. Ele define os _endpoints_ RESTful para configuração e processamento de áudio, além de um _endpoint_ WebSocket para comunicação em tempo real. Integra a lógica de processamento de áudio diretamente, incorporando a classe `AudioProcessor`.
*   **`audio_processor_backend.py`**: Este arquivo contém a classe `AudioProcessor`, que encapsula toda a lógica de processamento de áudio. Inclui métodos para:
    *   **`butter_filter_coeffs`**: Calcula os coeficientes para filtros Butterworth (passa-alta, passa-baixa, passa-banda, rejeita-banda).
    *   **`apply_filter`**: Aplica os filtros Butterworth aos dados de áudio.
    *   **`reduce_noise_spectral_gating`**: Implementa uma técnica de redução de ruído baseada em _spectral gating_.
    *   **`calculate_metrics`**: Calcula métricas de áudio como RMS, pico e frequência dominante.
    *   **`process_audio_data`**: Orquestra as diferentes operações de processamento de áudio com base no modo de operação selecionado.
*   **`requirements.txt`**: Lista todas as dependências Python necessárias para o _backend_, incluindo `fastapi`, `uvicorn`, `numpy`, `scipy`, `matplotlib`, `sounddevice` e `websockets`.

### Frontend

O _frontend_ é uma aplicação web estática que interage com o _backend_ via requisições HTTP e WebSockets. É composto por arquivos HTML, CSS e JavaScript.

*   **`static/index.html`**: A estrutura principal da interface do usuário, contendo todos os elementos visuais e controles.
*   **`static/styles.css`**: Define o estilo e o layout da aplicação, garantindo uma experiência de usuário agradável e responsiva.
*   **`static/app.js`**: O script JavaScript principal que gerencia a lógica da interface do usuário, a comunicação com o _backend_ (via REST e WebSocket), a manipulação de eventos e a atualização dos elementos da UI.
*   **`static/audio-processor.js`**: Contém a lógica JavaScript para a captura de áudio do microfone do navegador, codificação/decodificação de áudio e envio/recebimento de dados para o _backend_.
*   **`static/visualization.js`**: Responsável pelas visualizações gráficas da forma de onda e do espectro de frequência, utilizando elementos `<canvas>` para renderizar os dados de áudio em tempo real.

## Configuração e Execução

Para configurar e executar este projeto, siga os passos abaixo:

### Pré-requisitos

Certifique-se de ter o Python 3.7+ e o `pip` instalados em seu sistema.

### Instalação das Dependências

1.  Navegue até o diretório raiz do projeto:
    
    ```shell
    cd APP-RUIDO-CLEARAUDIO
    ```
    
2.  Instale as dependências do Python usando o `requirements.txt`:
    
    ```shell
    pip install -r requirements.txt
    ```
    

### Execução do Backend

O _backend_ pode ser iniciado usando o `uvicorn`:

```shell
uvicorn web_server:app --host 0.0.0.0 --port 8000 --reload
```

*   `--host 0.0.0.0`: Permite que o servidor seja acessível de outras máquinas na rede (útil para testes em diferentes dispositivos).
*   `--port 8000`: Define a porta em que o servidor irá escutar as requisições.
*   `--reload`: (Opcional) Reinicia o servidor automaticamente a cada alteração no código-fonte, ideal para desenvolvimento.

Para usuários Windows, há um arquivo `run_web_server.bat` que pode ser executado para iniciar o servidor:

```shell
run_web_server.bat
```

### Acesso ao Frontend

Após iniciar o _backend_, abra seu navegador web e acesse:

    http://localhost:8000
    

Você verá a interface do simulador de cancelamento de ruído ativo.

## Modos de Operação e Uso

A interface do usuário permite interagir com o simulador de diversas maneiras:

### Conexão e Controle de Áudio

*   **Conectar/Desconectar:** Botões para estabelecer e encerrar a conexão WebSocket com o _backend_. O indicador de status mostra o estado atual da conexão.
*   **Iniciar/Parar Áudio:** Uma vez conectado, use esses botões para começar ou parar a captura e o processamento de áudio do microfone.
*   **Volume de Saída:** Ajuste o _slider_ para controlar o volume do áudio processado que será reproduzido nos seus alto-falantes ou fones de ouvido.

### Configurações de Processamento

Esta seção é o coração do simulador, onde você pode experimentar diferentes algoritmos:

1.  **Inversão de Fase (Simulação ANC):**
    
    *   Selecione este modo para simular o cancelamento de ruído ativo. O áudio do microfone é invertido em fase e reproduzido. Quando combinado com um som externo, idealmente, eles se cancelariam. Este modo é mais eficaz para ruídos de baixa frequência e contínuos.
2.  **Redução de Ruído do Microfone:**
    
    *   Este modo é projetado para limpar o áudio capturado pelo microfone. Ele aplica um filtro passa-alta para remover ruídos de baixa frequência (como zumbidos de equipamentos) e, em seguida, utiliza _spectral gating_ para atenuar ruídos de fundo. É útil para melhorar a clareza da fala em ambientes ruidosos.
    *   **Limiar de Ruído:** Ajuste este _slider_ para definir o nível de sinal abaixo do qual o áudio será atenuado. Valores mais altos podem resultar em maior redução de ruído, mas também podem cortar partes da fala ou do áudio desejado.
    *   **Atenuação:** Controla a intensidade da redução de ruído aplicada. Valores mais altos resultam em maior atenuação.
3.  **Filtro Avançado:**
    
    *   Este modo oferece controle granular sobre a filtragem de áudio, permitindo que você defina tipos de filtro específicos e suas frequências de corte.
    *   **Tipo de Filtro:** Escolha entre Passa-Alta (remove frequências baixas), Passa-Baixa (remove frequências altas), Passa-Banda (mantém um intervalo de frequências) e Rejeita-Banda (remove um intervalo de frequências).
    *   **Frequência de Corte 1 e 2:** Defina as frequências de corte para o filtro. Para filtros passa-banda e rejeita-banda, ambas as frequências são usadas para definir o intervalo. Para filtros passa-alta e passa-baixa, apenas a Frequência de Corte 1 é utilizada.
    *   **Ordem do Filtro:** Determina a inclinação da curva de atenuação do filtro. Ordens mais altas resultam em uma atenuação mais abrupta, mas podem introduzir artefatos.

### Métricas e Visualizações

*   **Métricas de Áudio:** Acompanhe o RMS, pico e frequência dominante do áudio processado em tempo real para avaliar a eficácia dos algoritmos.
*   **Visualização de Forma de Onda e Espectro:** Observe as mudanças no áudio através de gráficos dinâmicos que mostram a forma de onda e o espectro de frequência.

## Contribuições

Contribuições são bem-vindas! Se você tiver ideias para melhorias, novas funcionalidades ou encontrar bugs, sinta-se à vontade para abrir uma issue ou enviar um pull request. Sua colaboração é fundamental para o aprimoramento deste projeto.

## Licença

Este projeto é de código aberto e está licenciado sob a licença MIT. Consulte o arquivo `LICENSE` para obter mais detalhes.



