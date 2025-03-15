import { 
  createAudioContext, 
  loadAudioFile, 
  generateReverbImpulse 
} from './AudioUtils';

/**
 * Enhanced Audio Service
 * Provides advanced audio playback features with transitions and effects
 */
class EnhancedAudioService {
  constructor() {
    this.audioContext = createAudioContext();
    this.sources = new Map();
    this.gainNodes = new Map();
    this.effectNodes = new Map();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    
    // Initialize effect factories
    this.effectFactories = {
      lowpass: this.createLowpassFilter.bind(this),
      highpass: this.createHighpassFilter.bind(this),
      reverb: this.createReverb.bind(this),
      delay: this.createDelay.bind(this),
      pitchShift: this.createPitchShifter.bind(this),
      spatialAudio: this.createSpatialAudio.bind(this)
    };
  }
  
  /**
   * Play audio with effects
   * @param {String} id - Unique identifier for this audio
   * @param {String} url - URL to audio file
   * @param {Object} options - Playback options
   */
  async playAudio(id, url, options = {}) {
    // Default options
    const defaultOptions = {
      loop: true,
      volume: 1.0,
      fadeIn: 0.5,
      effects: {}
    };
    
    const settings = { ...defaultOptions, ...options };
    
    try {
      // Fetch audio
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Create source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = settings.loop;
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0; // Start at 0 for fade-in
      
      // Store references
      this.sources.set(id, source);
      this.gainNodes.set(id, gainNode);
      this.effectNodes.set(id, new Map());
      
      // Connect source to gain
      source.connect(gainNode);
      
      // Create and connect effect chain
      let lastNode = gainNode;
      
      for (const [effectType, enabled] of Object.entries(settings.effects)) {
        if (enabled && this.effectFactories[effectType]) {
          const effectNode = this.effectFactories[effectType](settings.effects);
          
          lastNode.connect(effectNode.input);
          lastNode = effectNode.output;
          
          // Store effect nodes
          this.effectNodes.get(id).set(effectType, effectNode);
        }
      }
      
      // Connect to master gain
      lastNode.connect(this.masterGain);
      
      // Start playback
      source.start(0);
      
      // Fade in
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(settings.volume, now + settings.fadeIn);
      
      return true;
    } catch (error) {
      console.error(`Error playing audio ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Stop audio with fade out
   * @param {String} id - Audio identifier
   * @param {Number} fadeOut - Fade out duration in seconds
   */
  stopAudio(id, fadeOut = 0.5) {
    const source = this.sources.get(id);
    const gainNode = this.gainNodes.get(id);
    
    if (!source || !gainNode) return false;
    
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + fadeOut);
    
    // Schedule cleanup after fade
    setTimeout(() => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      
      this.sources.delete(id);
      this.gainNodes.delete(id);
      
      // Clean up effect nodes
      const effects = this.effectNodes.get(id);
      if (effects) {
        this.effectNodes.delete(id);
      }
    }, fadeOut * 1000);
    
    return true;
  }
  
  /**
   * Set volume for an audio source
   * @param {String} id - Audio identifier
   * @param {Number} volume - Volume level (0-1)
   */
  setVolume(id, volume) {
    const gainNode = this.gainNodes.get(id);
    if (!gainNode) return false;
    
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
    
    return true;
  }
  
  /**
   * Fade out audio
   * @param {String} id - Audio identifier
   * @param {Number} duration - Fade duration in seconds
   */
  fadeOutAudio(id, duration = 1.0) {
    const gainNode = this.gainNodes.get(id);
    if (!gainNode) return false;
    
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    // Schedule cleanup after fade
    setTimeout(() => {
      if (this.sources.has(id)) {
        this.stopAudio(id, 0);
      }
    }, duration * 1000);
    
    return true;
  }
  
  /**
   * Apply an effect to an active audio source
   * @param {String} id - Audio identifier
   * @param {String} effectType - Type of effect
   * @param {Object} parameters - Effect parameters
   */
  applyEffect(id, effectType, parameters) {
    const effectsMap = this.effectNodes.get(id);
    if (!effectsMap) return false;
    
    const effectNode = effectsMap.get(effectType);
    if (!effectNode) return false;
    
    // Apply parameters to effect node
    switch (effectType) {
      case 'lowpass':
        if (parameters.frequency) {
          effectNode.filter.frequency.setValueAtTime(
            parameters.frequency,
            this.audioContext.currentTime
          );
        }
        if (parameters.Q) {
          effectNode.filter.Q.setValueAtTime(
            parameters.Q,
            this.audioContext.currentTime
          );
        }
        break;
        
      case 'highpass':
        if (parameters.frequency) {
          effectNode.filter.frequency.setValueAtTime(
            parameters.frequency,
            this.audioContext.currentTime
          );
        }
        if (parameters.Q) {
          effectNode.filter.Q.setValueAtTime(
            parameters.Q,
            this.audioContext.currentTime
          );
        }
        break;
        
      case 'reverb':
        if (parameters.mix !== undefined) {
          effectNode.wetGain.gain.setValueAtTime(
            parameters.mix,
            this.audioContext.currentTime
          );
          effectNode.dryGain.gain.setValueAtTime(
            1 - parameters.mix,
            this.audioContext.currentTime
          );
        }
        break;
        
      case 'delay':
        if (parameters.time !== undefined) {
          effectNode.delay.delayTime.setValueAtTime(
            parameters.time,
            this.audioContext.currentTime
          );
        }
        if (parameters.feedback !== undefined) {
          effectNode.feedback.gain.setValueAtTime(
            parameters.feedback,
            this.audioContext.currentTime
          );
        }
        break;
        
      case 'pitchShift':
        // Pitch shifting requires complex DSP, 
        // this is a simplified version for demonstration
        if (parameters.amount !== undefined) {
          effectNode.pitchRatio = Math.pow(2, parameters.amount / 12);
        }
        break;
        
      case 'spatialAudio':
        if (parameters.pan !== undefined) {
          effectNode.panner.pan.setValueAtTime(
            parameters.pan,
            this.audioContext.currentTime
          );
        }
        break;
    }
    
    return true;
  }
  
  // Effect factory methods
  createLowpassFilter(parameters = {}) {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = parameters.lowpassFrequency || 20000;
    filter.Q.value = parameters.Q || 1.0;
    
    return {
      input: filter,
      output: filter,
      filter
    };
  }
  
  createHighpassFilter(parameters = {}) {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = parameters.highpassFrequency || 20;
    filter.Q.value = parameters.Q || 1.0;
    
    return {
      input: filter,
      output: filter,
      filter
    };
  }
  
  createReverb(parameters = {}) {
    // Create nodes
    const input = this.audioContext.createGain();
    const output = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();
    
    // Simple convolver-based reverb
    const convolver = this.audioContext.createConvolver();
    
    // Set mix levels
    const mix = parameters.reverbMix || 0.3;
    wetGain.gain.value = mix;
    dryGain.gain.value = 1 - mix;
    
    // Connect topology
    input.connect(dryGain);
    input.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(output);
    wetGain.connect(output);
    
    // Generate impulse response (simplified)
    this.generateReverbImpulse(parameters.reverbDecay || 2.0)
      .then(buffer => {
        convolver.buffer = buffer;
      })
      .catch(err => console.error('Error creating reverb:', err));
    
    return {
      input,
      output,
      wetGain,
      dryGain,
      convolver
    };
  }
  
  createDelay(parameters = {}) {
    const input = this.audioContext.createGain();
    const output = this.audioContext.createGain();
    const delay = this.audioContext.createDelay(5.0);
    const feedback = this.audioContext.createGain();
    
    delay.delayTime.value = parameters.delayTime || 0.3;
    feedback.gain.value = parameters.delayFeedback || 0.3;
    
    input.connect(output);
    input.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(output);
    
    return {
      input,
      output,
      delay,
      feedback
    };
  }
  
  createPitchShifter(parameters = {}) {
    // This is a simplified implementation for demonstration
    // Real pitch shifters use complex DSP algorithms like FFT
    
    const input = this.audioContext.createGain();
    const output = this.audioContext.createGain();
    
    // For simplicity, we'll just connect directly
    // In a real implementation, this would use a more complex graph
    input.connect(output);
    
    return {
      input,
      output,
      pitchRatio: Math.pow(2, (parameters.pitchAmount || 0) / 12)
    };
  }
  
  createSpatialAudio(parameters = {}) {
    const panner = this.audioContext.createStereoPanner();
    panner.pan.value = parameters.pan || 0;
    
    return {
      input: panner,
      output: panner,
      panner
    };
  }
  
  // Generate a simple reverb impulse response
  async generateReverbImpulse(duration = 2.0) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    const leftChannel = impulse.getChannelData(0);
    const rightChannel = impulse.getChannelData(1);
    
    // Fill with white noise with exponential decay
    for (let i = 0; i < length; i++) {
      const amplitude = Math.random() * 2 - 1;
      const decay = Math.exp(-i / (sampleRate * duration / 6));
      
      leftChannel[i] = amplitude * decay;
      rightChannel[i] = amplitude * decay;
    }
    
    return impulse;
  }
  
  // Get all currently active audio sources
  getActiveAudio() {
    const activeAudio = [];
    
    this.sources.forEach((source, id) => {
      const gainNode = this.gainNodes.get(id);
      const currentVolume = gainNode ? gainNode.gain.value : 0;
      
      activeAudio.push({
        id,
        volume: currentVolume,
        effects: Array.from(this.effectNodes.get(id) || []).map(([type]) => type)
      });
    });
    
    return activeAudio;
  }
  
  // Set master volume
  setMasterVolume(volume) {
    this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
  }
}

export default EnhancedAudioService;