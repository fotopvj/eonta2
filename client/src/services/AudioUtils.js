/**
 * Audio Utility Functions for EONTA
 * Contains helper functions for audio processing, effects, and conversions
 */

/**
 * Create a Web Audio API context
 * @returns {AudioContext} Audio context
 */
export function createAudioContext() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

/**
 * Load an audio file from URL
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {String} url - URL to audio file
 * @returns {Promise<AudioBuffer>} Decoded audio buffer
 */
export async function loadAudioFile(audioContext, url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('Error loading audio file:', error);
    throw error;
  }
}

/**
 * Create a gain node for volume control
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {Number} initialVolume - Initial volume value (0-1)
 * @returns {GainNode} Configured gain node
 */
export function createGainNode(audioContext, initialVolume = 1.0) {
  const gainNode = audioContext.createGain();
  gainNode.gain.value = initialVolume;
  return gainNode;
}

/**
 * Create a lowpass filter
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {Number} frequency - Cutoff frequency in Hz
 * @param {Number} Q - Q factor
 * @returns {BiquadFilterNode} Configured filter node
 */
export function createLowpassFilter(audioContext, frequency = 20000, Q = 1.0) {
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = frequency;
  filter.Q.value = Q;
  return filter;
}

/**
 * Create a highpass filter
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {Number} frequency - Cutoff frequency in Hz
 * @param {Number} Q - Q factor
 * @returns {BiquadFilterNode} Configured filter node
 */
export function createHighpassFilter(audioContext, frequency = 20, Q = 1.0) {
  const filter = audioContext.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = frequency;
  filter.Q.value = Q;
  return filter;
}

/**
 * Create a simple delay effect
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {Number} delayTime - Delay time in seconds
 * @param {Number} feedback - Feedback amount (0-1)
 * @returns {Object} Object containing input, output, and control nodes
 */
export function createDelay(audioContext, delayTime = 0.3, feedback = 0.3) {
  const input = audioContext.createGain();
  const output = audioContext.createGain();
  const delay = audioContext.createDelay(5.0);
  const feedbackGain = audioContext.createGain();
  
  delay.delayTime.value = delayTime;
  feedbackGain.gain.value = feedback;
  
  input.connect(output); // Direct signal
  input.connect(delay);
  delay.connect(feedbackGain);
  feedbackGain.connect(delay); // Feedback loop
  delay.connect(output);
  
  return {
    input,
    output,
    delay,
    feedback: feedbackGain
  };
}

/**
 * Generate a reverb impulse response
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {Number} duration - Duration in seconds
 * @param {Number} decay - Decay rate
 * @returns {AudioBuffer} Impulse response buffer
 */
export function generateReverbImpulse(audioContext, duration = 2.0, decay = 2.0) {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate);
  
  const leftChannel = impulse.getChannelData(0);
  const rightChannel = impulse.getChannelData(1);
  
  // Fill with white noise with exponential decay
  for (let i = 0; i < length; i++) {
    const amplitude = Math.random() * 2 - 1;
    const decayFactor = Math.exp(-i / (sampleRate * decay / 6));
    
    leftChannel[i] = amplitude * decayFactor;
    rightChannel[i] = amplitude * decayFactor;
  }
  
  return impulse;
}

/**
 * Create a reverb effect
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {Number} mix - Dry/wet mix (0-1)
 * @param {Number} decayTime - Reverb decay time in seconds
 * @returns {Object} Object containing input, output, and control nodes
 */
export async function createReverb(audioContext, mix = 0.3, decayTime = 2.0) {
  const input = audioContext.createGain();
  const output = audioContext.createGain();
  const wetGain = audioContext.createGain();
  const dryGain = audioContext.createGain();
  
  // Simple convolver-based reverb
  const convolver = audioContext.createConvolver();
  
  // Set mix levels
  wetGain.gain.value = mix;
  dryGain.gain.value = 1 - mix;
  
  // Connect topology
  input.connect(dryGain);
  input.connect(convolver);
  convolver.connect(wetGain);
  dryGain.connect(output);
  wetGain.connect(output);
  
  // Generate impulse response
  convolver.buffer = await generateReverbImpulse(audioContext, decayTime);
  
  return {
    input,
    output,
    wetGain,
    dryGain,
    convolver
  };
}

/**
 * Linear fade between two values over time
 * @param {AudioParam} param - Audio parameter to fade
 * @param {Number} startValue - Starting value
 * @param {Number} endValue - Ending value
 * @param {Number} duration - Duration in seconds
 * @param {AudioContext} audioContext - Web Audio API context
 */
export function linearFade(param, startValue, endValue, duration, audioContext) {
  const now = audioContext.currentTime;
  param.setValueAtTime(startValue, now);
  param.linearRampToValueAtTime(endValue, now + duration);
}

/**
 * Exponential fade between two values over time
 * @param {AudioParam} param - Audio parameter to fade
 * @param {Number} startValue - Starting value
 * @param {Number} endValue - Ending value
 * @param {Number} duration - Duration in seconds
 * @param {AudioContext} audioContext - Web Audio API context
 */
export function exponentialFade(param, startValue, endValue, duration, audioContext) {
  const now = audioContext.currentTime;
  // Avoid zero values for exponential fades
  const safeStart = Math.max(0.0001, startValue);
  const safeEnd = Math.max(0.0001, endValue);
  
  param.setValueAtTime(safeStart, now);
  param.exponentialRampToValueAtTime(safeEnd, now + duration);
}

/**
 * Connect audio nodes in sequence
 * @param {...AudioNode} nodes - Audio nodes to connect in sequence
 */
export function connectNodes(...nodes) {
  for (let i = 0; i < nodes.length - 1; i++) {
    nodes[i].connect(nodes[i + 1]);
  }
}

/**
 * Create a spatial audio panner
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {Number} pan - Initial pan value (-1 to 1)
 * @returns {StereoPannerNode} Configured panner node
 */
export function createStereoPanner(audioContext, pan = 0) {
  const panner = audioContext.createStereoPanner();
  panner.pan.value = pan;
  return panner;
}

/**
 * Convert seconds to time format (MM:SS)
 * @param {Number} seconds - Time in seconds
 * @returns {String} Formatted time string
 */
export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

export default {
  createAudioContext,
  loadAudioFile,
  createGainNode,
  createLowpassFilter,
  createHighpassFilter,
  createDelay,
  generateReverbImpulse,
  createReverb,
  linearFade,
  exponentialFade,
  connectNodes,
  createStereoPanner,
  formatTime
};
