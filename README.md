# Simulador de Cancelamento de Ruído Ativo

## Visão Geral do Projeto

Este projeto é um simulador de cancelamento de ruído ativo (ANC) e processamento de áudio em tempo real, implementado como uma aplicação web. Ele permite aos usuários capturar áudio do microfone, aplicar diferentes algoritmos de processamento (como inversão de fase, redução de ruído e filtragem avançada) e visualizar os resultados em tempo real. A interface web oferece controles para ajustar parâmetros de processamento e monitorar métricas de áudio, como RMS, pico e frequência dominante.




## Funcionalidades Principais

- **Captura de Áudio em Tempo Real:** Utiliza o microfone do dispositivo para capturar áudio continuamente.
- **Processamento de Áudio Versátil:** Implementa múltiplos modos de operação para processamento de áudio:
    - **Inversão de Fase (Simulação ANC):** Simula o cancelamento de ruído ativo invertendo a fase do sinal de áudio de entrada. Ideal para demonstrar o princípio básico do ANC.
    - **Redução de Ruído do Microfone:** Combina um filtro passa-alta com uma técnica de *spectral gating* para atenuar ruídos de baixa frequência e de fundo, melhorando a clareza da voz.
    - **Filtro Avançado:** Permite a aplicação de filtros passa-alta, passa-baixa, passa-banda e rejeita-banda com parâmetros configuráveis (frequências de corte, ordem do filtro).
- **Controles de Configuração:** Interface intuitiva para ajustar parâmetros como limiar de ruído, frequências de corte, ganho de volume e tipo de filtro.
- **Métricas de Áudio em Tempo Real:** Exibe o valor RMS (Root Mean Square), pico e frequência dominante do áudio processado, fornecendo feedback quantitativo sobre o impacto do processamento.
- **Visualização Gráfica:** Apresenta visualizações em tempo real da forma de onda (waveform) e do espectro de frequência (spectrum) do áudio, permitindo uma análise visual do processamento.
- **Log de Sistema:** Um console de log integrado para exibir mensagens de status, erros e informações de depuração.
- **Interface Web Responsiva:** Desenvolvido com HTML, CSS e JavaScript para uma experiência de usuário acessível via navegador web.
- **Backend Robustos:** Utiliza FastAPI para o backend, oferecendo endpoints RESTful e comunicação WebSocket para processamento de áudio em tempo real e atualização de configurações.




## Arquitetura Técnica

O projeto é dividido em duas partes principais: o *backend* (servidor) e o *frontend* (interface do usuário).

### Backend

O *backend* é construído com **FastAPI**, um *framework* web moderno e rápido para construir APIs com Python 3.7+. Ele gerencia a lógica de processamento de áudio e a comunicação com o *frontend*.

- **`web_server.py`**: Este é o arquivo principal do servidor FastAPI. Ele define os *endpoints* RESTful para configuração e processamento de áudio, além de um *endpoint* WebSocket para comunicação em tempo real. Integra a lógica de processamento de áudio diretamente, incorporando a classe `AudioProcessor`.
- **`audio_processor_backend.py`**: Este arquivo contém a classe `AudioProcessor`, que encapsula toda a lógica de processamento de áudio. Inclui métodos para:
    - **`butter_filter_coeffs`**: Calcula os coeficientes para filtros Butterworth (passa-alta, passa-baixa, passa-banda, rejeita-banda).
    - **`apply_filter`**: Aplica os filtros Butterworth aos dados de áudio.
    - **`reduce_noise_spectral_gating`**: Implementa uma técnica de redução de ruído baseada em *spectral gating*.
    - **`calculate_metrics`**: Calcula métricas de áudio como RMS, pico e frequência dominante.
    - **`process_audio_data`**: Orquestra as diferentes operações de processamento de áudio com base no modo de operação selecionado.
- **`requirements.txt`**: Lista todas as dependências Python necessárias para o *backend*, incluindo `fastapi`, `uvicorn`, `numpy`, `scipy`, `matplotlib`, `sounddevice` e `websockets`.

### Frontend

O *frontend* é uma aplicação web estática que interage com o *backend* via requisições HTTP e WebSockets. É composto por arquivos HTML, CSS e JavaScript.

- **`static/index.html`**: A estrutura principal da interface do usuário, contendo todos os elementos visuais e controles.
- **`static/styles.css`**: Define o estilo e o layout da aplicação, garantindo uma experiência de usuário agradável e responsiva.
- **`static/app.js`**: O script JavaScript principal que gerencia a lógica da interface do usuário, a comunicação com o *backend* (via REST e WebSocket), a manipulação de eventos e a atualização dos elementos da UI.
- **`static/audio-processor.js`**: Contém a lógica JavaScript para a captura de áudio do microfone do navegador, codificação/decodificação de áudio e envio/recebimento de dados para o *backend*.
- **`static/visualization.js`**: Responsável pelas visualizações gráficas da forma de onda e do espectro de frequência, utilizando elementos `<canvas>` para renderizar os dados de áudio em tempo real.




## Configuração e Execução

Para configurar e executar este projeto, siga os passos abaixo:

### Pré-requisitos

Certifique-se de ter o Python 3.7+ e o `pip` instalados em seu sistema.

### Instalação das Dependências

1. Navegue até o diretório raiz do projeto:
   ```bash
   cd APP-RUIDO-CLEARAUDIO
   ```

2. Instale as dependências do Python usando o `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```

### Execução do Backend

O *backend* pode ser iniciado usando o `uvicorn`:

```bash
uvicorn web_server:app --host 0.0.0.0 --port 8000 --reload
```

- `--host 0.0.0.0`: Permite que o servidor seja acessível de outras máquinas na rede (útil para testes em diferentes dispositivos).
- `--port 8000`: Define a porta em que o servidor irá escutar as requisições.
- `--reload`: (Opcional) Reinicia o servidor automaticamente a cada alteração no código-fonte, ideal para desenvolvimento.

Para usuários Windows, há um arquivo `run_web_server.bat` que pode ser executado para iniciar o servidor:

```bash
run_web_server.bat
```

### Acesso ao Frontend

Após iniciar o *backend*, abra seu navegador web e acesse:

```
http://localhost:8000
```

Você verá a interface do simulador de cancelamento de ruído ativo.




## Modos de Operação e Uso

A interface do usuário permite interagir com o simulador de diversas maneiras:

### Conexão e Controle de Áudio

- **Conectar/Desconectar:** Botões para estabelecer e encerrar a conexão WebSocket com o *backend*. O indicador de status mostra o estado atual da conexão.
- **Iniciar/Parar Áudio:** Uma vez conectado, use esses botões para começar ou parar a captura e o processamento de áudio do microfone.
- **Volume de Saída:** Ajuste o *slider* para controlar o volume do áudio processado que será reproduzido nos seus alto-falantes ou fones de ouvido.

### Configurações de Processamento

Esta seção é o coração do simulador, onde você pode experimentar diferentes algoritmos:

1.  **Inversão de Fase (Simulação ANC):**
    -   Selecione este modo para simular o cancelamento de ruído ativo. O áudio do microfone é invertido em fase e reproduzido. Quando combinado com um som externo, idealmente, eles se cancelariam. Este modo é mais eficaz para ruídos de baixa frequência e contínuos.

2.  **Redução de Ruído do Microfone:**
    -   Este modo é projetado para limpar o áudio capturado pelo microfone. Ele aplica um filtro passa-alta para remover ruídos de baixa frequência (como zumbidos de equipamentos) e, em seguida, utiliza *spectral gating* para atenuar ruídos de fundo. É útil para melhorar a clareza da fala em ambientes ruidosos.
    -   **Limiar de Ruído:** Ajuste este *slider* para definir o nível de sinal abaixo do qual o áído será atenuado. Valores mais altos resultam em maior redução de ruído, mas podem introduzir artefatos se muito agressivos.

3.  **Filtro Avançado:**
    -   Oferece controle granular sobre a filtragem de áudio, permitindo isolar ou remover faixas de frequência específicas.
    -   **Tipo de Filtro:** Escolha entre:
        -   **Passa-Alta:** Permite a passagem de frequências acima da `Frequência de Corte Baixa`.
        -   **Passa-Baixa:** Permite a passagem de frequências abaixo da `Frequência de Corte Alta`.
        -   **Passa-Banda:** Permite a passagem de frequências entre a `Frequência de Corte Baixa` e a `Frequência de Corte Alta`.
        -   **Rejeita-Banda:** Atenua frequências entre a `Frequência de Corte Baixa` e a `Frequência de Corte Alta`.
    -   **Frequência de Corte Baixa (Hz):** Define o limite inferior para filtros passa-alta, passa-banda e rejeita-banda.
    -   **Frequência de Corte Alta (Hz):** Define o limite superior para filtros passa-baixa, passa-banda e rejeita-banda.
    -   **Ganho de Volume:** Aplica um multiplicador ao volume do áudio processado. Cuidado para não exceder 1.0 para evitar distorção (clipagem).

### Métricas em Tempo Real

-   **RMS (Root Mean Square):** Indica o nível médio de energia do sinal de áudio. Um RMS mais baixo geralmente significa menos ruído ou um sinal mais suave.
-   **Pico:** O valor máximo absoluto do sinal de áudio. Ajuda a identificar picos de volume que podem causar distorção.
-   **Frequência Dominante:** A frequência com maior energia no sinal de áudio. Útil para identificar a frequência principal de um ruído ou som.

### Visualização

-   **Forma de Onda (Waveform):** Exibe a amplitude do sinal de áudio ao longo do tempo, permitindo observar a forma do som e a presença de picos.
-   **Espectro de Frequência (Spectrum):** Mostra a distribuição de energia do sinal de áudio em diferentes frequências. É fundamental para entender como os filtros e a redução de ruído afetam o conteúdo espectral do áudio.




## Exemplos de Uso

### 1. Simulação de Cancelamento de Ruído Ativo (ANC)

**Cenário:** Você está em um ambiente com um ruído de baixa frequência constante (ex: barulho de motor, zumbido de ar condicionado).

**Passos:**
1.  Inicie o *backend* e acesse a interface web.
2.  Clique em "Conectar" e "Iniciar Áudio".
3.  Selecione o "Modo de Operação" como "Inversão de Fase (Simulação ANC)".
4.  Observe a forma de onda e o espectro. Idealmente, se você tiver um ruído externo constante, a inversão de fase tentará cancelá-lo. Experimente falar para ver como sua voz é afetada.

**Observação:** A eficácia do ANC em tempo real é limitada pela latência e pela complexidade do ruído. Este simulador demonstra o conceito, mas não substitui sistemas ANC dedicados.

### 2. Redução de Ruído para Gravação de Voz

**Cenário:** Você está gravando sua voz em um ambiente com ruído de fundo (ex: ventilador, conversa distante).

**Passos:**
1.  Inicie o *backend* e acesse a interface web.
2.  Clique em "Conectar" e "Iniciar Áudio".
3.  Selecione o "Modo de Operação" como "Redução de Ruído do Microfone".
4.  Ajuste o "Limiar de Ruído" gradualmente. Comece com um valor baixo (ex: 0.01) e aumente até que o ruído de fundo seja atenuado sem afetar significativamente sua voz. Observe as métricas RMS e Pico, e o espectro para ver a redução de energia nas frequências do ruído.

**Observação:** Um limiar muito alto pode cortar partes da sua voz, resultando em um som "robótico" ou com artefatos. Encontre o equilíbrio ideal.

### 3. Filtragem de Frequências Específicas

**Cenário:** Você deseja remover um ruído de alta frequência (ex: chiado) ou isolar uma banda de frequência específica (ex: voz humana).

**Passos:**
1.  Inicie o *backend* e acesse a interface web.
2.  Clique em "Conectar" e "Iniciar Áudio".
3.  Selecione o "Modo de Operação" como "Filtro Avançado".
4.  **Para remover chiado (filtro passa-baixa):**
    -   Selecione "Passa-Baixa" como "Tipo de Filtro".
    -   Ajuste a "Frequência de Corte Alta" para um valor abaixo da frequência do chiado (ex: 10000 Hz se o chiado estiver acima disso).
5.  **Para isolar a voz humana (filtro passa-banda):**
    -   Selecione "Passa-Banda" como "Tipo de Filtro".
    -   Defina a "Frequência de Corte Baixa" para aproximadamente 300 Hz e a "Frequência de Corte Alta" para 3000 Hz (faixa comum da voz humana).
6.  Observe as visualizações de forma de onda e espectro para confirmar o efeito do filtro.

**Observação:** A escolha das frequências de corte depende do tipo de ruído ou sinal que você deseja manipular. Use a visualização do espectro para identificar as frequências relevantes.




## Melhorias Potenciais

Este projeto serve como uma base sólida para experimentação com processamento de áudio em tempo real. Abaixo estão algumas sugestões para futuras melhorias e expansões:

### 1. Algoritmos de Processamento de Áudio

-   **ANC Adaptativo:** Implementar algoritmos de Cancelamento de Ruído Ativo adaptativos (ex: Filtro LMS - Least Mean Squares) que ajustam dinamicamente os parâmetros do filtro para otimizar o cancelamento de ruído em ambientes variáveis. Isso exigiria uma referência de ruído mais precisa e um algoritmo de adaptação em tempo real.
-   **Redução de Ruído Baseada em IA/Machine Learning:** Explorar modelos de aprendizado de máquina (ex: redes neurais recorrentes, U-Net) treinados para separar fala de ruído. Isso poderia oferecer uma redução de ruído mais robusta e com menos artefatos do que as técnicas tradicionais.
-   **Cancelamento de Eco Acústico (AEC):** Adicionar um módulo para cancelar o eco gerado pela reprodução do próprio áudio do sistema, comum em sistemas de viva-voz.
-   **Normalização de Volume:** Implementar normalização de volume em tempo real para manter o nível de saída consistente, independentamente do volume de entrada.

### 2. Funcionalidades do Frontend

-   **Controles Mais Detalhados:** Adicionar controles para a ordem dos filtros Butterworth, tipo de janela para análise espectral (ex: Hanning, Blackman) e tamanho do buffer de áudio.
-   **Predefinições de Configuração:** Permitir que os usuários salvem e carreguem conjuntos de configurações para diferentes cenários de uso (ex: "Reunião Online", "Música", "Ambiente Ruidoso").
-   **Visualizações Aprimoradas:**
    -   **Espectrograma:** Uma visualização 3D (tempo, frequência, amplitude) que mostra como o espectro de frequência muda ao longo do tempo, útil para analisar sons dinâmicos.
    -   **Medidores de Nível:** Medidores VU ou de pico mais precisos e visualmente atraentes.
    -   **Gráficos Interativos:** Permitir zoom, pan e seleção de regiões nos gráficos de forma de onda e espectro.
-   **Gravação e Reprodução:** Adicionar a capacidade de gravar o áudio processado e reproduzi-lo diretamente na interface, facilitando a comparação entre o áudio original e o processado.
-   **Seleção de Dispositivo de Áudio:** Permitir que o usuário selecione o dispositivo de entrada (microfone) e saída (alto-falantes) diretamente na interface web.

### 3. Robustez e Desempenho

-   **Otimização de Desempenho:** Para aplicações de áudio em tempo real, a latência é crítica. Otimizar o código Python e JavaScript para minimizar o atraso no processamento. Considerar o uso de bibliotecas de processamento de sinal digital (DSP) mais otimizadas.
-   **Tratamento de Erros Aprimorado:** Implementar um tratamento de erros mais robusto no *backend* e *frontend* para lidar com desconexões, falhas de hardware de áudio e outros problemas de forma mais graciosa.
-   **Testes Automatizados:** Adicionar testes unitários e de integração para garantir a estabilidade e a correção dos algoritmos de processamento de áudio e da comunicação entre *frontend* e *backend*.
-   **Dockerização:** Empacotar a aplicação em contêineres Docker para facilitar a implantação e garantir um ambiente de execução consistente.

### 4. Documentação e Usabilidade

-   **Documentação da API:** Gerar automaticamente a documentação da API do FastAPI (via Swagger UI/ReDoc) e incluí-la como parte do projeto.
-   **Tutoriais Interativos:** Adicionar pequenos tutoriais ou dicas na interface para guiar novos usuários sobre como usar os diferentes modos e configurações.
-   **Internacionalização (i18n):** Suporte a múltiplos idiomas para a interface do usuário.




## Licença

Este projeto está licenciado sob a Licença MIT. Consulte o arquivo `LICENSE` (se aplicável) para mais detalhes.

---

**Desenvolvido por Manus AI**


