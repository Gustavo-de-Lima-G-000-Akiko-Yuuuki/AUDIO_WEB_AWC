class AudioVisualizer {
    constructor(waveformCanvasId, spectrumCanvasId) {
        this.waveformCanvas = document.getElementById(waveformCanvasId);
        this.spectrumCanvas = document.getElementById(spectrumCanvasId);
        
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        this.spectrumCtx = this.spectrumCanvas.getContext('2d');
        
        this.animationId = null;
        this.isRunning = false;
        
        // Visualization settings
        this.waveformColor = '#667eea';
        this.processedWaveformColor = '#e74c3c';
        this.spectrumColor = '#00b894';
        this.backgroundColor = '#f8f9fa';
        this.gridColor = '#e0e0e0';
        
        this.setupCanvases();
    }
    
    setupCanvases() {
        // Set up high DPI rendering
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        [this.waveformCanvas, this.spectrumCanvas].forEach(canvas => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * devicePixelRatio;
            canvas.height = rect.height * devicePixelRatio;
            
            const ctx = canvas.getContext('2d');
            ctx.scale(devicePixelRatio, devicePixelRatio);
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
        });
    }
    
    start(audioProcessor) {
        this.audioProcessor = audioProcessor;
        this.isRunning = true;
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.drawWaveform();
        this.drawSpectrum();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    drawWaveform() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformCtx;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        
        // Clear canvas
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        this.drawGrid(ctx, width, height);
        
        if (!this.audioProcessor) return;
        
        const inputBuffer = this.audioProcessor.getInputBuffer();
        const outputBuffer = this.audioProcessor.getOutputBuffer();
        
        // Draw input waveform
        this.drawWaveformData(ctx, inputBuffer, width, height, this.waveformColor, 0.7);
        
        // Draw processed waveform
        this.drawWaveformData(ctx, outputBuffer, width, height, this.processedWaveformColor, 1.0);
        
        // Draw labels
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.fillText('Forma de Onda - Original (azul) vs Processado (vermelho)', 10, 20);
    }
    
    drawWaveformData(ctx, buffer, width, height, color, alpha) {
        if (!buffer || buffer.length === 0) return;
        
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const sliceWidth = width / buffer.length;
        let x = 0;
        
        for (let i = 0; i < buffer.length; i++) {
            const v = buffer[i] * 0.5; // Scale down amplitude
            const y = (v + 1) * height / 2; // Convert from [-1,1] to [0,height]
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
    
    drawSpectrum() {
        const canvas = this.spectrumCanvas;
        const ctx = this.spectrumCtx;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        
        // Clear canvas
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        this.drawGrid(ctx, width, height);
        
        if (!this.audioProcessor) return;
        
        const outputBuffer = this.audioProcessor.getOutputBuffer();
        
        // Calculate FFT for spectrum
        const spectrum = this.calculateSpectrum(outputBuffer);
        
        // Draw spectrum
        this.drawSpectrumData(ctx, spectrum, width, height);
        
        // Draw labels
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.fillText('Espectro de Frequência', 10, 20);
        
        // Draw frequency labels
        const sampleRate = this.audioProcessor ? this.audioProcessor.sampleRate : 44100;
        const nyquist = sampleRate / 2;
        
        ctx.font = '10px Arial';
        ctx.fillStyle = '#7f8c8d';
        
        // Draw frequency markers
        const freqMarkers = [0, nyquist * 0.25, nyquist * 0.5, nyquist * 0.75, nyquist];
        freqMarkers.forEach((freq, index) => {
            const x = (index / (freqMarkers.length - 1)) * width;
            ctx.fillText(`${Math.round(freq)}Hz`, x - 15, height - 5);
        });
    }
    
    calculateSpectrum(buffer) {
        if (!buffer || buffer.length === 0) return new Float32Array(256);
        
        // Simple FFT approximation using binning
        const spectrumSize = 256;
        const spectrum = new Float32Array(spectrumSize);
        const binSize = Math.floor(buffer.length / spectrumSize);
        
        for (let i = 0; i < spectrumSize; i++) {
            let sum = 0;
            const start = i * binSize;
            const end = Math.min(start + binSize, buffer.length);
            
            for (let j = start; j < end; j++) {
                sum += Math.abs(buffer[j]);
            }
            
            spectrum[i] = sum / binSize;
        }
        
        return spectrum;
    }
    
    drawSpectrumData(ctx, spectrum, width, height) {
        if (!spectrum || spectrum.length === 0) return;
        
        ctx.fillStyle = this.spectrumColor;
        
        const barWidth = width / spectrum.length;
        
        for (let i = 0; i < spectrum.length; i++) {
            const barHeight = spectrum[i] * height * 10; // Scale up for visibility
            const x = i * barWidth;
            const y = height - barHeight;
            
            ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
    }
    
    drawGrid(ctx, width, height) {
        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.5;
        
        // Horizontal lines
        const horizontalLines = 5;
        for (let i = 0; i <= horizontalLines; i++) {
            const y = (i / horizontalLines) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Vertical lines
        const verticalLines = 10;
        for (let i = 0; i <= verticalLines; i++) {
            const x = (i / verticalLines) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    resize() {
        this.setupCanvases();
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (window.visualizer) {
        window.visualizer.resize();
    }
});

