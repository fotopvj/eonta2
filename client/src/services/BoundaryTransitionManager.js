/**
 * Boundary Transition Manager
 * Handles advanced transition settings for audio boundaries
 * including fade length, fade type, and transition effects
 */
class BoundaryTransitionManager {
  constructor(audioService) {
    this.audioService = audioService;
    
    // Available transition types
    this.transitionTypes = {
      VOLUME_FADE: 'volume_fade',           // Simple volume fade in/out
      LOWPASS_FILTER: 'lowpass_filter',     // Gradually apply lowpass filter (muffling)
      HIGHPASS_FILTER: 'highpass_filter',   // Gradually apply highpass filter (thinning)
      REVERB_TAIL: 'reverb_tail',           // Increase reverb as fading out
      PITCH_SHIFT: 'pitch_shift',           // Slight pitch shift during transition
      DELAY_FEEDBACK: 'delay_feedback',     // Increase delay feedback during transition
      CROSSFADE: 'crossfade',               // Crossfade between regions
      DOPPLER: 'doppler',                   // Doppler effect (pitch shifts as if moving past)
      SPATIAL_BLEND: 'spatial_blend'        // 3D audio panning based on direction
    };
    
    // Default transition settings for new boundaries
    this.defaultSettings = {
      fadeInLength: 1.5,         // seconds
      fadeOutLength: 2.0,        // seconds
      fadeInType: this.transitionTypes.VOLUME_FADE,
      fadeOutType: this.transitionTypes.VOLUME_FADE,
      transitionRadius: 10,      // meters
      blendingEnabled: true,
      crossfadeOverlap: true,    // enable overlapping transitions between regions
      advancedSettings: {
        // Filter settings
        lowpassFrequency: {
          start: 20000,           // Hz (fully open)
          end: 500                // Hz (very muffled)
        },
        highpassFrequency: {
          start: 20,              // Hz (fully open)
          end: 2000               // Hz (very thin)
        },
        // Reverb settings
        reverbMix: {
          start: 0.1,             // dry/wet ratio
          end: 0.7                // more wet
        },
        reverbDecay: {
          start: 1.0,             // seconds
          end: 3.0                // seconds
        },
        // Delay settings
        delayFeedback: {
          start: 0.1,             // feedback amount
          end: 0.7                // high feedback
        },
        delayTime: {
          start: 0.25,            // seconds
          end: 0.5                // seconds
        },
        // Pitch settings
        pitchShift: {
          start: 0,               // semitones
          end: -4                 // semitones lower
        },
        // Spatial settings
        spatialPosition: {
          x: 0,                   // relative position for 3D audio
          y: 0,
          z: 0
        }
      }
    };
  }
  
  /**
   * Create transition settings for a boundary
   * @param {Object} boundary - The audio boundary object
   * @param {Object} settings - Custom transition settings (optional)
   * @returns {Object} - The complete transition settings
   */
  createTransitionSettings(boundary, settings = {}) {
    // Merge custom settings with defaults
    const transitionSettings = {
      ...this.defaultSettings,
      ...settings
    };
    
    // If there are advanced settings, merge them separately to avoid losing nested properties
    if (settings.advancedSettings) {
      transitionSettings.advancedSettings = {
        ...this.defaultSettings.advancedSettings,
        ...settings.advancedSettings
      };
    }
    
    return transitionSettings;
  }
  
  /**
   * Apply transition when entering a boundary
   * @param {String} regionId - ID of the region being entered
   * @param {Object} audioData - Audio data including URL
   * @param {Object} transitionSettings - Transition settings for the region
   * @param {Number} distanceToEdge - Distance to the boundary edge in meters
   */
  applyEntryTransition(regionId, audioData, transitionSettings, distanceToEdge = 0) {
    const { fadeInLength, fadeInType, transitionRadius, advancedSettings } = transitionSettings;
    
    // Calculate transition progress based on distance (0 = edge of region, 1 = fully inside)
    const progress = Math.min(1, Math.max(0, (transitionRadius - distanceToEdge) / transitionRadius));
    
    // Set up audio node with appropriate transition type
    switch (fadeInType) {
      case this.transitionTypes.VOLUME_FADE:
        // Simple volume fade
        this.audioService.playAudio(regionId, audioData.url, {
          fadeIn: fadeInLength,
          volume: progress, // Start at current progress level
          loop: true
        });
        break;
        
      case this.transitionTypes.LOWPASS_FILTER:
        // Frequency rises as you enter (opening up)
        const startFreq = advancedSettings.lowpassFrequency.end;
        const endFreq = advancedSettings.lowpassFrequency.start;
        const currentFreq = startFreq + progress * (endFreq - startFreq);
        
        this.audioService.playAudio(regionId, audioData.url, {
          fadeIn: fadeInLength,
          volume: progress,
          loop: true,
          effects: {
            lowpass: true,
            lowpassFrequency: currentFreq
          }
        });
        break;
        
      case this.transitionTypes.HIGHPASS_FILTER:
        // Frequency lowers as you enter (opening up)
        const hpStartFreq = advancedSettings.highpassFrequency.end;
        const hpEndFreq = advancedSettings.highpassFrequency.start;
        const hpCurrentFreq = hpStartFreq + progress * (hpEndFreq - hpStartFreq);
        
        this.audioService.playAudio(regionId, audioData.url, {
          fadeIn: fadeInLength,
          volume: progress,
          loop: true,
          effects: {
            highpass: true,
            highpassFrequency: hpCurrentFreq
          }
        });
        break;
        
      case this.transitionTypes.REVERB_TAIL:
        // Reverb decreases as you enter
        const reverbStart = advancedSettings.reverbMix.end;
        const reverbEnd = advancedSettings.reverbMix.start;
        const currentReverb = reverbStart + progress * (reverbEnd - reverbStart);
        
        this.audioService.playAudio(regionId, audioData.url, {
          fadeIn: fadeInLength,
          volume: progress,
          loop: true,
          effects: {
            reverb: true,
            reverbMix: currentReverb,
            reverbDecay: advancedSettings.reverbDecay.start
          }
        });
        break;
        
      case this.transitionTypes.PITCH_SHIFT:
        // Pitch normalizes as you enter
        const pitchStart = advancedSettings.pitchShift.end;
        const pitchEnd = advancedSettings.pitchShift.start;
        const currentPitch = pitchStart + progress * (pitchEnd - pitchStart);
        
        this.audioService.playAudio(regionId, audioData.url, {
          fadeIn: fadeInLength,
          volume: progress,
          loop: true,
          effects: {
            pitchShift: true,
            pitchAmount: currentPitch
          }
        });
        break;
        
      case this.transitionTypes.DELAY_FEEDBACK:
        // Delay feedback decreases as you enter
        const delayStart = advancedSettings.delayFeedback.end;
        const delayEnd = advancedSettings.delayFeedback.start;
        const currentDelay = delayStart + progress * (delayEnd - delayStart);
        
        this.audioService.playAudio(regionId, audioData.url, {
          fadeIn: fadeInLength,
          volume: progress,
          loop: true,
          effects: {
            delay: true,
            delayFeedback: currentDelay,
            delayTime: advancedSettings.delayTime.start
          }
        });
        break;
        
      case this.transitionTypes.DOPPLER:
        // Doppler effect simulates moving toward sound source
        const dopplerShift = progress < 0.5 ? 1 + (0.5 - progress) * 0.1 : 1;
        
        this.audioService.playAudio(regionId, audioData.url, {
          fadeIn: fadeInLength,
          volume: progress,
          loop: true,
          effects: {
            pitchShift: true,
            pitchAmount: dopplerShift - 1
          }
        });
        break;
        
      case this.transitionTypes.SPATIAL_BLEND:
        // 3D audio panning
        const pan = Math.cos(progress * Math.PI) * 0.8; // -0.8 to 0.8
        
        this.audioService.playAudio(regionId, audioData.url, {
          fadeIn: fadeInLength,
          volume: progress,
          loop: true,
          effects: {
            spatialAudio: true,
            pan: pan
          }
        });
        break;
        
      default:
        // Default to simple volume fade
        this.audioService.playAudio(regionId, audioData.url, {
          fadeIn: fadeInLength,
          volume: progress,
          loop: true
        });
    }
  }
  
  /**
   * Apply transition when exiting a boundary
   * @param {String} regionId - ID of the region being exited
   * @param {Object} transitionSettings - Transition settings for the region
   * @param {Number} distanceToEdge - Distance to the boundary edge in meters
   */
  applyExitTransition(regionId, transitionSettings, distanceToEdge = 0) {
    const { fadeOutLength, fadeOutType, transitionRadius, advancedSettings } = transitionSettings;
    
    // Calculate transition progress based on distance (1 = edge of region, 0 = beyond transition radius)
    const progress = Math.min(1, Math.max(0, 1 - (distanceToEdge / transitionRadius)));
    
    // Set up exit transition based on type
    switch (fadeOutType) {
      case this.transitionTypes.VOLUME_FADE:
        // Simple volume fade
        this.audioService.fadeOutAudio(regionId, fadeOutLength);
        break;
        
      case this.transitionTypes.LOWPASS_FILTER:
        // Apply lowpass filter fade out
        const startFreq = advancedSettings.lowpassFrequency.start;
        const endFreq = advancedSettings.lowpassFrequency.end;
        const currentFreq = startFreq + (1 - progress) * (endFreq - startFreq);
        
        this.audioService.applyEffect(regionId, 'lowpass', {
          frequency: currentFreq,
          Q: 1.0
        });
        
        this.audioService.setVolume(regionId, progress);
        
        if (progress <= 0.05) {
          this.audioService.stopAudio(regionId, 0.5);
        }
        break;
        
      case this.transitionTypes.HIGHPASS_FILTER:
        // Apply highpass filter fade out
        const hpStartFreq = advancedSettings.highpassFrequency.start;
        const hpEndFreq = advancedSettings.highpassFrequency.end;
        const hpCurrentFreq = hpStartFreq + (1 - progress) * (hpEndFreq - hpStartFreq);
        
        this.audioService.applyEffect(regionId, 'highpass', {
          frequency: hpCurrentFreq,
          Q: 1.0
        });
        
        this.audioService.setVolume(regionId, progress);
        
        if (progress <= 0.05) {
          this.audioService.stopAudio(regionId, 0.5);
        }
        break;
        
      case this.transitionTypes.REVERB_TAIL:
        // Increase reverb as exiting
        const reverbStart = advancedSettings.reverbMix.start;
        const reverbEnd = advancedSettings.reverbMix.end;
        const currentReverb = reverbStart + (1 - progress) * (reverbEnd - reverbStart);
        
        const decayStart = advancedSettings.reverbDecay.start;
        const decayEnd = advancedSettings.reverbDecay.end;
        const currentDecay = decayStart + (1 - progress) * (decayEnd - decayStart);
        
        this.audioService.applyEffect(regionId, 'reverb', {
          mix: currentReverb,
          decay: currentDecay
        });
        
        this.audioService.setVolume(regionId, progress);
        
        if (progress <= 0.05) {
          // For reverb, use longer fade out to let tail decay naturally
          this.audioService.stopAudio(regionId, fadeOutLength * 1.5);
        }
        break;
        
      case this.transitionTypes.PITCH_SHIFT:
        // Pitch shifts as exiting
        const pitchStart = advancedSettings.pitchShift.start;
        const pitchEnd = advancedSettings.pitchShift.end;
        const currentPitch = pitchStart + (1 - progress) * (pitchEnd - pitchStart);
        
        this.audioService.applyEffect(regionId, 'pitchShift', {
          amount: currentPitch
        });
        
        this.audioService.setVolume(regionId, progress);
        
        if (progress <= 0.05) {
          this.audioService.stopAudio(regionId, fadeOutLength);
        }
        break;
        
      case this.transitionTypes.DELAY_FEEDBACK:
        // Increase delay feedback as exiting
        const delayStart = advancedSettings.delayFeedback.start;
        const delayEnd = advancedSettings.delayFeedback.end;
        const currentDelay = delayStart + (1 - progress) * (delayEnd - delayStart);
        
        const timeStart = advancedSettings.delayTime.start;
        const timeEnd = advancedSettings.delayTime.end;
        const currentTime = timeStart + (1 - progress) * (timeEnd - timeStart);
        
        this.audioService.applyEffect(regionId, 'delay', {
          feedback: currentDelay,
          time: currentTime
        });
        
        this.audioService.setVolume(regionId, progress);
        
        if (progress <= 0.05) {
          // For delay, use longer fade out to let echoes decay naturally
          this.audioService.stopAudio(regionId, fadeOutLength * 2);
        }
        break;
        
      case this.transitionTypes.DOPPLER:
        // Doppler effect simulates moving away from sound source
        const dopplerShift = progress > 0.5 ? 1 - (progress - 0.5) * 0.1 : 1;
        
        this.audioService.applyEffect(regionId, 'pitchShift', {
          amount: dopplerShift - 1
        });
        
        this.audioService.setVolume(regionId, progress);
        
        if (progress <= 0.05) {
          this.audioService.stopAudio(regionId, fadeOutLength);
        }
        break;
        
      case this.transitionTypes.SPATIAL_BLEND:
        // 3D audio panning as exiting
        const pan = Math.cos(progress * Math.PI) * 0.8; // Changes from 0 to 0.8 as exiting
        
        this.audioService.applyEffect(regionId, 'spatialAudio', {
          pan: pan
        });
        
        this.audioService.setVolume(regionId, progress);
        
        if (progress <= 0.05) {
          this.audioService.stopAudio(regionId, fadeOutLength);
        }
        break;
        
      default:
        // Default to simple volume fade
        this.audioService.fadeOutAudio(regionId, fadeOutLength);
    }
  }
  
  /**
   * Handle crossfade between multiple regions
   * @param {Array} activeRegions - Currently active audio regions
   * @param {Object} position - Current user position
   */
  handleCrossfades(activeRegions, position) {
    if (!activeRegions || activeRegions.length <= 1) return;
    
    // For each pair of active regions, calculate crossfade settings
    for (let i = 0; i < activeRegions.length; i++) {
      for (let j = i + 1; j < activeRegions.length; j++) {
        const region1 = activeRegions[i];
        const region2 = activeRegions[j];
        
        // Skip if either region doesn't have crossfade enabled
        if (!region1.settings.crossfadeOverlap || !region2.settings.crossfadeOverlap) {
          continue;
        }
        
        // Calculate distances to both region centers
        const distance1 = this.calculateDistance(position, region1.center);
        const distance2 = this.calculateDistance(position, region2.center);
        
        // Calculate crossfade ratio based on relative distances
        const totalDistance = distance1 + distance2;
        if (totalDistance === 0) continue;
        
        const ratio1 = 1 - (distance1 / totalDistance);
        const ratio2 = 1 - (distance2 / totalDistance);
        
        // Apply volume adjustments for crossfade
        // This creates an inverse relationship - as you move toward one region,
        // its volume increases while the other decreases proportionally
        const baseVolume1 = region1.settings.volume || 1.0;
        const baseVolume2 = region2.settings.volume || 1.0;
        
        const crossfadeVolume1 = baseVolume1 * (0.7 + 0.3 * ratio1);
        const crossfadeVolume2 = baseVolume2 * (0.7 + 0.3 * ratio2);
        
        this.audioService.setVolume(region1.id, crossfadeVolume1);
        this.audioService.setVolume(region2.id, crossfadeVolume2);
      }
    }
  }
  
  // Utility method to calculate distance between points
  calculateDistance(point1, point2) {
    return Math.sqrt(
      Math.pow(point2.lat - point1.lat, 2) + 
      Math.pow(point2.lng - point1.lng, 2)
    );
  }
}

export default BoundaryTransitionManager;