import numpy as np
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


