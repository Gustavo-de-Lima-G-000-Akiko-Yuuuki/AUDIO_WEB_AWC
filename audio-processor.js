class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.sourceNode = null;
        this.processorNode = null;
        this.outputNode = null;
        this.websocket = null;
        this.isProcessing = false;
        this.bufferSize = 4096;
        this.sampleRate = 44100;
        
        // Audio buffers for visualization
        this.inputBuffer = new Float32Array(this.bufferSize);
        this.outputBuffer = new Float32Array(this.bufferSize);
        
        // Configuration
        this.config = {
            operation_mode: 1,
            noise_threshold: 0.05,
            low_cut_freq: 300,
            high_cut_freq: 8000,
            volume_gain: 1.0,
            filter_type: "highpass",
            samplerate: 44100
        };
        
        // Metrics
        this.metrics = {
            rms: 0,
            peak: 0,
            dominant_freq: 0
        };
        
        // Event callbacks
        this.onMetricsUpdate = null;
        this.onError = null;
        this.onStatusChange = null;
        this.onLog = null;
    }
    
    async initializeAudio() {
        try {
            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: this.sampleRate
                }
            });
            
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.sampleRate
            });
            
            // Create source node from microphone
            this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
            
            // Create script processor node for audio processing
            this.processorNode = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
            
            // Create output node (speakers)
            this.outputNode = this.audioContext.createGain();
            this.outputNode.connect(this.audioContext.destination);
            
            // Set up audio processing callback
            this.processorNode.onaudioprocess = (event) => {
                this.processAudioBuffer(event);
            };
            
            this.log('Áudio inicializado com sucesso', 'success');
            return true;
            
        } catch (error) {
            this.log(`Erro ao inicializar áudio: ${error.message}`, 'error');
            if (this.onError) this.onError(error);
            return false;
        }
    }
    
    connectWebSocket(url) {
        return new Promise((resolve, reject) => {
            try {
                this.websocket = new WebSocket(url);
                
                this.websocket.onopen = () => {
                    this.log('WebSocket conectado', 'success');
                    if (this.onStatusChange) this.onStatusChange('connected');
                    resolve();
                };
                
                this.websocket.onmessage = (event) => {
                    this.handleWebSocketMessage(event.data);
                };
                
                this.websocket.onclose = () => {
                    this.log('WebSocket desconectado', 'warning');
                    if (this.onStatusChange) this.onStatusChange('disconnected');
                };
                
                this.websocket.onerror = (error) => {
                    this.log(`Erro no WebSocket: ${error}`, 'error');
                    if (this.onError) this.onError(error);
                    reject(error);
                };
                
            } catch (error) {
                this.log(`Erro ao conectar WebSocket: ${error.message}`, 'error');
                reject(error);
            }
        });
    }
    
    disconnectWebSocket() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }
    
    startProcessing() {
        if (!this.audioContext || !this.sourceNode || !this.processorNode) {
            this.log('Áudio não inicializado', 'error');
            return false;
        }
        
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            this.log('WebSocket não conectado', 'error');
            return false;
        }
        
        try {
            // Connect audio nodes
            this.sourceNode.connect(this.processorNode);
            this.processorNode.connect(this.outputNode);
            
            this.isProcessing = true;
            this.log('Processamento de áudio iniciado', 'success');
            if (this.onStatusChange) this.onStatusChange('processing');
            return true;
            
        } catch (error) {
            this.log(`Erro ao iniciar processamento: ${error.message}`, 'error');
            if (this.onError) this.onError(error);
            return false;
        }
    }
    
    stopProcessing() {
        try {
            if (this.sourceNode && this.processorNode) {
                this.sourceNode.disconnect();
                this.processorNode.disconnect();
            }
            
            this.isProcessing = false;
            this.log('Processamento de áudio parado', 'info');
            if (this.onStatusChange) this.onStatusChange('connected');
            return true;
            
        } catch (error) {
            this.log(`Erro ao parar processamento: ${error.message}`, 'error');
            return false;
        }
    }
    
    processAudioBuffer(event) {
        if (!this.isProcessing || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            return;
        }
        
        const inputBuffer = event.inputBuffer.getChannelData(0);
        const outputBuffer = event.outputBuffer.getChannelData(0);
        
        // Store input buffer for visualization
        this.inputBuffer.set(inputBuffer);
        
        // Convert to base64 for transmission
        const audioBytes = new Float32Array(inputBuffer);
        const audioBase64 = this.arrayBufferToBase64(audioBytes.buffer);
        
        // Send to backend for processing
        const message = {
            type: 'audio_data',
            data: audioBase64
        };
        
        try {
            this.websocket.send(JSON.stringify(message));
        } catch (error) {
            this.log(`Erro ao enviar dados de áudio: ${error.message}`, 'error');
        }
        
        // For now, output the input (will be replaced by processed audio from backend)
        outputBuffer.set(this.outputBuffer);
    }
    
    handleWebSocketMessage(data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'processed_audio':
                    this.handleProcessedAudio(message);
                    break;
                    
                case 'config_updated':
                    this.config = message.config;
                    this.log('Configuração atualizada', 'info');
                    break;
                    
                case 'error':
                    this.log(`Erro do servidor: ${message.message}`, 'error');
                    if (this.onError) this.onError(new Error(message.message));
                    break;
                    
                default:
                    this.log(`Mensagem desconhecida: ${message.type}`, 'warning');
            }
            
        } catch (error) {
            this.log(`Erro ao processar mensagem: ${error.message}`, 'error');
        }
    }
    
    handleProcessedAudio(message) {
        try {
            // Decode base64 audio data
            const audioBytes = this.base64ToArrayBuffer(message.data);
            const audioArray = new Float32Array(audioBytes);
            
            // Store output buffer for visualization and playback
            this.outputBuffer.set(audioArray);
            
            // Update metrics
            if (message.metrics) {
                this.metrics = message.metrics;
                if (this.onMetricsUpdate) {
                    this.onMetricsUpdate(this.metrics);
                }
            }
            
        } catch (error) {
            this.log(`Erro ao processar áudio recebido: ${error.message}`, 'error');
        }
    }
    
    updateConfig(newConfig) {
        // Update local config
        Object.assign(this.config, newConfig);
        
        // Send to backend
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            const message = {
                type: 'config_update',
                config: newConfig
            };
            
            try {
                this.websocket.send(JSON.stringify(message));
                this.log('Configuração enviada para o servidor', 'info');
            } catch (error) {
                this.log(`Erro ao enviar configuração: ${error.message}`, 'error');
            }
        }
    }
    
    setOutputVolume(volume) {
        if (this.outputNode) {
            this.outputNode.gain.value = volume / 100;
        }
    }
    
    getInputBuffer() {
        return this.inputBuffer;
    }
    
    getOutputBuffer() {
        return this.outputBuffer;
    }
    
    getMetrics() {
        return this.metrics;
    }
    
    // Utility functions
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        
        if (this.onLog) {
            this.onLog(logMessage, type);
        }
        
        console.log(logMessage);
    }
    
    cleanup() {
        this.stopProcessing();
        this.disconnectWebSocket();
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.log('Recursos de áudio liberados', 'info');
    }
}

