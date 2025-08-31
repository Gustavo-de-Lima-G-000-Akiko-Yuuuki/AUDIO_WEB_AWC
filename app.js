// Global variables
let audioProcessor = null;
let visualizer = null;

// DOM elements
const elements = {
    // Status and connection
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    connectBtn: document.getElementById('connectBtn'),
    disconnectBtn: document.getElementById('disconnectBtn'),
    
    // Audio controls
    startAudioBtn: document.getElementById('startAudioBtn'),
    stopAudioBtn: document.getElementById('stopAudioBtn'),
    volumeSlider: document.getElementById('volumeSlider'),
    volumeValue: document.getElementById('volumeValue'),
    
    // Configuration
    operationModeRadios: document.querySelectorAll('input[name="operationMode"]'),
    filterType: document.getElementById('filterType'),
    noiseThreshold: document.getElementById('noiseThreshold'),
    noiseThresholdValue: document.getElementById('noiseThresholdValue'),
    lowCutFreq: document.getElementById('lowCutFreq'),
    lowCutFreqValue: document.getElementById('lowCutFreqValue'),
    highCutFreq: document.getElementById('highCutFreq'),
    highCutFreqValue: document.getElementById('highCutFreqValue'),
    volumeGain: document.getElementById('volumeGain'),
    volumeGainValue: document.getElementById('volumeGainValue'),
    
    // Metrics
    rmsValue: document.getElementById('rmsValue'),
    peakValue: document.getElementById('peakValue'),
    dominantFreqValue: document.getElementById('dominantFreqValue'),
    
    // Log
    logContainer: document.getElementById('logContainer'),
    clearLogBtn: document.getElementById('clearLogBtn')
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Create audio processor
    audioProcessor = new AudioProcessor();
    
    // Create visualizer
    visualizer = new AudioVisualizer('waveformCanvas', 'spectrumCanvas');
    window.visualizer = visualizer; // Make it global for resize handling
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up audio processor callbacks
    setupAudioProcessorCallbacks();
    
    // Initialize UI state
    updateUIState('disconnected');
    
    log('Aplicação inicializada', 'success');
}

function setupEventListeners() {
    // Connection controls
    elements.connectBtn.addEventListener('click', connectToServer);
    elements.disconnectBtn.addEventListener('click', disconnectFromServer);
    
    // Audio controls
    elements.startAudioBtn.addEventListener('click', startAudio);
    elements.stopAudioBtn.addEventListener('click', stopAudio);
    
    // Volume control
    elements.volumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value);
        elements.volumeValue.textContent = `${volume}%`;
        if (audioProcessor) {
            audioProcessor.setOutputVolume(volume);
        }
    });
    
    // Configuration controls
    elements.operationModeRadios.forEach(radio => {
        radio.addEventListener('change', updateConfiguration);
    });
    
    elements.filterType.addEventListener('change', updateConfiguration);
    
    // Range sliders
    setupRangeSlider(elements.noiseThreshold, elements.noiseThresholdValue, updateConfiguration);
    setupRangeSlider(elements.lowCutFreq, elements.lowCutFreqValue, updateConfiguration);
    setupRangeSlider(elements.highCutFreq, elements.highCutFreqValue, updateConfiguration);
    setupRangeSlider(elements.volumeGain, elements.volumeGainValue, updateConfiguration);
    
    // Log controls
    elements.clearLogBtn.addEventListener('click', clearLog);
    
    // Window events
    window.addEventListener('beforeunload', cleanup);
}

function setupRangeSlider(slider, valueDisplay, callback) {
    slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        valueDisplay.textContent = value.toString();
        if (callback) callback();
    });
}

function setupAudioProcessorCallbacks() {
    audioProcessor.onStatusChange = (status) => {
        updateUIState(status);
    };
    
    audioProcessor.onMetricsUpdate = (metrics) => {
        updateMetricsDisplay(metrics);
    };
    
    audioProcessor.onError = (error) => {
        log(`Erro: ${error.message}`, 'error');
    };
    
    audioProcessor.onLog = (message, type) => {
        log(message, type);
    };
}

async function connectToServer() {
    try {
        updateUIState('connecting');
        log('Conectando ao servidor...', 'info');
        
        // Initialize audio first
        const audioInitialized = await audioProcessor.initializeAudio();
        if (!audioInitialized) {
            throw new Error('Falha ao inicializar áudio');
        }
        
        // Connect to WebSocket
        const wsUrl = `ws://${window.location.host}/ws`;
        await audioProcessor.connectWebSocket(wsUrl);
        
        // Load current configuration from server
        await loadServerConfiguration();
        
        updateUIState('connected');
        log('Conectado ao servidor com sucesso', 'success');
        
    } catch (error) {
        updateUIState('disconnected');
        log(`Erro ao conectar: ${error.message}`, 'error');
    }
}

function disconnectFromServer() {
    if (audioProcessor) {
        audioProcessor.stopProcessing();
        audioProcessor.disconnectWebSocket();
    }
    
    if (visualizer) {
        visualizer.stop();
    }
    
    updateUIState('disconnected');
    log('Desconectado do servidor', 'info');
}

async function startAudio() {
    try {
        if (!audioProcessor) {
            throw new Error('Processador de áudio não inicializado');
        }
        
        const started = audioProcessor.startProcessing();
        if (started) {
            visualizer.start(audioProcessor);
            updateUIState('processing');
            log('Processamento de áudio iniciado', 'success');
        } else {
            throw new Error('Falha ao iniciar processamento');
        }
        
    } catch (error) {
        log(`Erro ao iniciar áudio: ${error.message}`, 'error');
    }
}

function stopAudio() {
    if (audioProcessor) {
        audioProcessor.stopProcessing();
    }
    
    if (visualizer) {
        visualizer.stop();
    }
    
    updateUIState('connected');
    log('Processamento de áudio parado', 'info');
}

function updateConfiguration() {
    if (!audioProcessor) return;
    
    // Get current configuration from UI
    const config = {
        operation_mode: parseInt(document.querySelector('input[name="operationMode"]:checked').value),
        filter_type: elements.filterType.value,
        noise_threshold: parseFloat(elements.noiseThreshold.value),
        low_cut_freq: parseFloat(elements.lowCutFreq.value),
        high_cut_freq: parseFloat(elements.highCutFreq.value),
        volume_gain: parseFloat(elements.volumeGain.value)
    };
    
    // Send to audio processor
    audioProcessor.updateConfig(config);
    
    log('Configuração atualizada', 'info');
}

async function loadServerConfiguration() {
    try {
        const response = await fetch('/config');
        const config = await response.json();
        
        // Update UI with server configuration
        updateUIFromConfig(config);
        
        log('Configuração carregada do servidor', 'info');
        
    } catch (error) {
        log(`Erro ao carregar configuração: ${error.message}`, 'warning');
    }
}

function updateUIFromConfig(config) {
    // Update operation mode
    const operationModeRadio = document.querySelector(`input[name="operationMode"][value="${config.operation_mode}"]`);
    if (operationModeRadio) {
        operationModeRadio.checked = true;
    }
    
    // Update other controls
    elements.filterType.value = config.filter_type || 'highpass';
    elements.noiseThreshold.value = config.noise_threshold || 0.05;
    elements.noiseThresholdValue.textContent = config.noise_threshold || 0.05;
    elements.lowCutFreq.value = config.low_cut_freq || 300;
    elements.lowCutFreqValue.textContent = config.low_cut_freq || 300;
    elements.highCutFreq.value = config.high_cut_freq || 8000;
    elements.highCutFreqValue.textContent = config.high_cut_freq || 8000;
    elements.volumeGain.value = config.volume_gain || 1.0;
    elements.volumeGainValue.textContent = config.volume_gain || 1.0;
}

function updateUIState(state) {
    // Update status indicator
    elements.statusDot.className = 'status-dot';
    
    switch (state) {
        case 'disconnected':
            elements.statusDot.classList.add('disconnected');
            elements.statusText.textContent = 'Desconectado';
            elements.connectBtn.disabled = false;
            elements.disconnectBtn.disabled = true;
            elements.startAudioBtn.disabled = true;
            elements.stopAudioBtn.disabled = true;
            break;
            
        case 'connecting':
            elements.statusDot.classList.add('connecting');
            elements.statusText.textContent = 'Conectando...';
            elements.connectBtn.disabled = true;
            elements.disconnectBtn.disabled = true;
            elements.startAudioBtn.disabled = true;
            elements.stopAudioBtn.disabled = true;
            break;
            
        case 'connected':
            elements.statusDot.classList.add('connected');
            elements.statusText.textContent = 'Conectado';
            elements.connectBtn.disabled = true;
            elements.disconnectBtn.disabled = false;
            elements.startAudioBtn.disabled = false;
            elements.stopAudioBtn.disabled = true;
            break;
            
        case 'processing':
            elements.statusDot.classList.add('connected');
            elements.statusText.textContent = 'Processando Áudio';
            elements.connectBtn.disabled = true;
            elements.disconnectBtn.disabled = false;
            elements.startAudioBtn.disabled = true;
            elements.stopAudioBtn.disabled = false;
            break;
    }
}

function updateMetricsDisplay(metrics) {
    elements.rmsValue.textContent = metrics.rms.toFixed(3);
    elements.peakValue.textContent = metrics.peak.toFixed(3);
    elements.dominantFreqValue.textContent = `${Math.round(metrics.dominant_freq)} Hz`;
}

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('p');
    logEntry.className = type;
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    elements.logContainer.appendChild(logEntry);
    elements.logContainer.scrollTop = elements.logContainer.scrollHeight;
    
    // Limit log entries to prevent memory issues
    const maxEntries = 100;
    while (elements.logContainer.children.length > maxEntries) {
        elements.logContainer.removeChild(elements.logContainer.firstChild);
    }
}

function clearLog() {
    elements.logContainer.innerHTML = '<p>Log limpo.</p>';
}

function cleanup() {
    if (audioProcessor) {
        audioProcessor.cleanup();
    }
    
    if (visualizer) {
        visualizer.stop();
    }
}

