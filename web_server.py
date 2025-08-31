from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import base64
import json
import asyncio

# Conteúdo de audio_processor_backend.py
from scipy.signal import butter, lfilter, welch

class AudioProcessor:
    def __init__(self, samplerate=44100):
        self.samplerate = samplerate

    def butter_filter_coeffs(self, cutoff_freqs, btype, order=5):
        nyq = 0.5 * self.samplerate
        if isinstance(cutoff_freqs, (list, tuple)):
            normal_cutoff = [freq / nyq for freq in cutoff_freqs]
        else:
            normal_cutoff = cutoff_freqs / nyq
        b, a = butter(order, normal_cutoff, btype=btype, analog=False)
        return b, a

    def apply_filter(self, data, filter_type, low_freq, high_freq, order=5):
        if filter_type == "highpass":
            b, a = self.butter_filter_coeffs(low_freq, 'high', order)
        elif filter_type == "lowpass":
            b, a = self.butter_filter_coeffs(high_freq, 'low', order)
        elif filter_type == "bandpass":
            b, a = self.butter_filter_coeffs([low_freq, high_freq], 'band', order)
        elif filter_type == "bandstop":
            b, a = self.butter_filter_coeffs([low_freq, high_freq], 'bandstop', order)
        else:
            # No filter applied, return original data
            return data
        
        # Ensure data is 1D for lfilter
        if data.ndim > 1:
            data = data.flatten()

        return lfilter(b, a, data)

    def reduce_noise_spectral_gating(self, audio_data, threshold):
        # Ensure audio_data is 1D
        if audio_data.ndim > 1:
            audio_data = audio_data.flatten()

        # Apply FFT
        fft_data = np.fft.fft(audio_data)
        magnitude = np.abs(fft_data)
        phase = np.angle(fft_data)

        # Identify and attenuate noise
        # Attenuate by a factor (e.g., 0.1) instead of setting to 0 to avoid harshness
        filtered_magnitude = np.where(magnitude < threshold, magnitude * 0.1, magnitude)

        # Reconstruct the signal in the frequency domain
        filtered_fft_data = filtered_magnitude * np.exp(1j * phase)

        # Apply iFFT to return to the time domain
        filtered_audio = np.fft.ifft(filtered_fft_data).real
        return filtered_audio

    def calculate_metrics(self, audio_data):
        # Ensure audio_data is 1D
        if audio_data.ndim > 1:
            audio_data = audio_data.flatten()

        rms = np.sqrt(np.mean(audio_data**2))
        peak = np.max(np.abs(audio_data))
        
        # Find dominant frequency
        if len(audio_data) > 0:
            # Use welch for PSD estimation, then find peak frequency
            freqs, psd = welch(audio_data, self.samplerate, nperseg=min(256, len(audio_data)))
            if len(psd) > 0:
                dominant_freq_idx = np.argmax(psd)
                dominant_freq = freqs[dominant_freq_idx]
            else:
                dominant_freq = 0
        else:
            dominant_freq = 0
            
        return rms, peak, abs(dominant_freq)

    def process_audio_data(self, indata, operation_mode, noise_threshold, low_cut_freq, high_cut_freq, volume_gain, filter_type):
        processed_audio = indata.copy()

        if operation_mode == 1:  # Phase Inversion (ANC Simulation)
            processed_audio = -indata
            
        elif operation_mode == 2:  # Microphone Noise Reduction (Spectral Gating + Highpass)
            # Apply highpass filter first
            processed_audio = self.apply_filter(indata, "highpass", low_cut_freq, high_cut_freq)
            # Apply spectral gating noise reduction
            processed_audio = self.reduce_noise_spectral_gating(processed_audio, noise_threshold)
            
        elif operation_mode == 3:  # Advanced Band Filter
            processed_audio = self.apply_filter(indata, filter_type, low_cut_freq, high_cut_freq)

        # Apply volume gain
        processed_audio *= volume_gain
        
        # Clip audio to prevent clipping (values outside -1.0 to 1.0)
        processed_audio = np.clip(processed_audio, -1.0, 1.0)
        
        return processed_audio


app = FastAPI(title="Simulador de Cancelamento de Ruído Ativo", version="1.0.0")

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (for serving HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Global audio processor instance
audio_processor = AudioProcessor()

# Global configuration
config = {
    "operation_mode": 1,
    "noise_threshold": 0.05,
    "low_cut_freq": 300,
    "high_cut_freq": 8000,
    "volume_gain": 1.0,
    "filter_type": "highpass",
    "samplerate": 44100
}

@app.get("/")
async def read_root():
    """Serve the main HTML page"""
    with open("static/index.html", "r", encoding="utf-8") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

@app.get("/config")
async def get_config():
    """Get current audio processing configuration"""
    return config

@app.post("/config")
async def update_config(new_config: dict):
    """Update audio processing configuration"""
    global config
    
    # Validate and update configuration
    valid_keys = ["operation_mode", "noise_threshold", "low_cut_freq", 
                  "high_cut_freq", "volume_gain", "filter_type", "samplerate"]
    
    for key, value in new_config.items():
        if key in valid_keys:
            config[key] = value
    
    # Update audio processor samplerate if changed
    if "samplerate" in new_config:
        audio_processor.samplerate = new_config["samplerate"]
    
    return {"status": "success", "config": config}

@app.post("/process_audio")
async def process_audio_endpoint(audio_data: dict):
    """Process audio data via REST API"""
    try:
        # Decode base64 audio data
        audio_bytes = base64.b64decode(audio_data["data"])
        audio_array = np.frombuffer(audio_bytes, dtype=np.float32)
        
        # Process audio
        processed_audio = audio_processor.process_audio_data(
            audio_array,
            config["operation_mode"],
            config["noise_threshold"],
            config["low_cut_freq"],
            config["high_cut_freq"],
            config["volume_gain"],
            config["filter_type"]
        )
        
        # Calculate metrics
        rms, peak, dominant_freq = audio_processor.calculate_metrics(processed_audio)
        
        # Encode processed audio back to base64
        processed_bytes = processed_audio.astype(np.float32).tobytes()
        processed_b64 = base64.b64encode(processed_bytes).decode('utf-8')
        
        return {
            "processed_audio": processed_b64,
            "metrics": {
                "rms": float(rms),
                "peak": float(peak),
                "dominant_freq": float(dominant_freq)
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time audio processing"""
    await manager.connect(websocket)
    try:
        while True:
            # Receive audio data from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "audio_data":
                try:
                    # Decode base64 audio data
                    audio_bytes = base64.b64decode(message["data"])
                    audio_array = np.frombuffer(audio_bytes, dtype=np.float32)
                    
                    # Process audio
                    processed_audio = audio_processor.process_audio_data(
                        audio_array,
                        config["operation_mode"],
                        config["noise_threshold"],
                        config["low_cut_freq"],
                        config["high_cut_freq"],
                        config["volume_gain"],
                        config["filter_type"]
                    )
                    
                    # Calculate metrics
                    rms, peak, dominant_freq = audio_processor.calculate_metrics(processed_audio)
                    
                    # Encode processed audio back to base64
                    processed_bytes = processed_audio.astype(np.float32).tobytes()
                    processed_b64 = base64.b64encode(processed_bytes).decode('utf-8')
                    
                    # Send processed audio back to client
                    response = {
                        "type": "processed_audio",
                        "data": processed_b64,
                        "metrics": {
                            "rms": float(rms),
                            "peak": float(peak),
                            "dominant_freq": float(dominant_freq)
                        }
                    }
                    
                    await manager.send_personal_message(json.dumps(response), websocket)
                    
                except Exception as e:
                    error_response = {
                        "type": "error",
                        "message": str(e)
                    }
                    await manager.send_personal_message(json.dumps(error_response), websocket)
            
            elif message["type"] == "config_update":
                # Update configuration
                for key, value in message["config"].items():
                    if key in config:
                        config[key] = value
                
                # Update audio processor samplerate if changed
                if "samplerate" in message["config"]:
                    audio_processor.samplerate = message["config"]["samplerate"]
                
                # Send confirmation
                response = {
                    "type": "config_updated",
                    "config": config
                }
                await manager.send_personal_message(json.dumps(response), websocket)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Audio Processor Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
