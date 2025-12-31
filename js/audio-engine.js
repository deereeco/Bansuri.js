/**
 * Bansuri.js - Audio Engine
 * Uses Web Audio API to generate reference tones for notes
 */

import { midiToFrequency } from './fingering-data.js';

// Audio context (created on first user interaction)
let audioContext = null;
let masterGain = null;
let currentOscillator = null;
let currentGain = null;

// Default settings
const DEFAULT_SETTINGS = {
  volume: 0.5,
  waveform: 'triangle',  // 'sine', 'triangle', 'sawtooth', 'square'
  attackTime: 0.05,      // seconds
  releaseTime: 0.3,      // seconds
  sustainLevel: 0.7
};

let settings = { ...DEFAULT_SETTINGS };

/**
 * Initialize the audio context
 * Must be called from a user interaction (click, keypress, etc.)
 */
function initAudio() {
  if (audioContext) return true;

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create master gain node
    masterGain = audioContext.createGain();
    masterGain.gain.value = settings.volume;
    masterGain.connect(audioContext.destination);

    return true;
  } catch (e) {
    console.error('Web Audio API not supported:', e);
    return false;
  }
}

/**
 * Resume audio context if suspended (required by browsers)
 */
async function resumeAudio() {
  if (audioContext && audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}

/**
 * Play a note by frequency
 * @param {number} frequency - Frequency in Hz
 * @param {number} duration - Duration in seconds (0 = sustained until stopNote)
 */
function playFrequency(frequency, duration = 0) {
  if (!audioContext) {
    if (!initAudio()) return;
  }

  resumeAudio();

  // Stop any currently playing note
  stopNote();

  // Create oscillator
  currentOscillator = audioContext.createOscillator();
  currentOscillator.type = settings.waveform;
  currentOscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  // Create gain node for envelope
  currentGain = audioContext.createGain();
  currentGain.gain.setValueAtTime(0, audioContext.currentTime);

  // Connect: oscillator -> gain -> master -> destination
  currentOscillator.connect(currentGain);
  currentGain.connect(masterGain);

  // Attack envelope
  currentGain.gain.linearRampToValueAtTime(
    settings.sustainLevel,
    audioContext.currentTime + settings.attackTime
  );

  // Start oscillator
  currentOscillator.start();

  // If duration specified, schedule stop
  if (duration > 0) {
    const stopTime = audioContext.currentTime + duration;

    // Release envelope
    currentGain.gain.setValueAtTime(settings.sustainLevel, stopTime - settings.releaseTime);
    currentGain.gain.exponentialRampToValueAtTime(0.001, stopTime);

    currentOscillator.stop(stopTime);

    // Clean up reference after stop
    const osc = currentOscillator;
    osc.onended = () => {
      if (currentOscillator === osc) {
        currentOscillator = null;
        currentGain = null;
      }
    };
  }
}

/**
 * Play a note by MIDI note number
 * @param {number} midiNote - MIDI note number (0-127)
 * @param {number} duration - Duration in seconds (0 = sustained)
 */
function playMidi(midiNote, duration = 0) {
  const frequency = midiToFrequency(midiNote);
  playFrequency(frequency, duration);
}

/**
 * Play a short tap sound for a note
 * @param {number} midiNote - MIDI note number
 */
function playTap(midiNote) {
  playMidi(midiNote, 0.3);
}

/**
 * Stop the currently playing note with release envelope
 */
function stopNote() {
  if (currentOscillator && currentGain) {
    try {
      const now = audioContext.currentTime;

      // Cancel any scheduled changes
      currentGain.gain.cancelScheduledValues(now);

      // Quick release
      currentGain.gain.setValueAtTime(currentGain.gain.value, now);
      currentGain.gain.exponentialRampToValueAtTime(0.001, now + settings.releaseTime);

      // Stop oscillator after release
      currentOscillator.stop(now + settings.releaseTime + 0.01);
    } catch (e) {
      // Oscillator may already be stopped
    }

    currentOscillator = null;
    currentGain = null;
  }
}

/**
 * Set the master volume
 * @param {number} level - Volume level 0.0 to 1.0
 */
function setVolume(level) {
  settings.volume = Math.max(0, Math.min(1, level));
  if (masterGain) {
    masterGain.gain.setValueAtTime(settings.volume, audioContext.currentTime);
  }
}

/**
 * Get current volume
 * @returns {number} Current volume level
 */
function getVolume() {
  return settings.volume;
}

/**
 * Set the waveform type
 * @param {string} type - 'sine', 'triangle', 'sawtooth', 'square'
 */
function setWaveform(type) {
  const validTypes = ['sine', 'triangle', 'sawtooth', 'square'];
  if (validTypes.includes(type)) {
    settings.waveform = type;
  }
}

/**
 * Get current waveform
 * @returns {string} Current waveform type
 */
function getWaveform() {
  return settings.waveform;
}

/**
 * Set envelope parameters
 * @param {object} params - { attackTime, releaseTime, sustainLevel }
 */
function setEnvelope(params) {
  if (params.attackTime !== undefined) {
    settings.attackTime = Math.max(0.001, params.attackTime);
  }
  if (params.releaseTime !== undefined) {
    settings.releaseTime = Math.max(0.001, params.releaseTime);
  }
  if (params.sustainLevel !== undefined) {
    settings.sustainLevel = Math.max(0, Math.min(1, params.sustainLevel));
  }
}

/**
 * Check if audio is initialized and ready
 * @returns {boolean}
 */
function isAudioReady() {
  return audioContext !== null && audioContext.state === 'running';
}

/**
 * Check if a note is currently playing
 * @returns {boolean}
 */
function isPlaying() {
  return currentOscillator !== null;
}

/**
 * Get available waveform types
 * @returns {string[]}
 */
function getWaveformTypes() {
  return ['sine', 'triangle', 'sawtooth', 'square'];
}

/**
 * Play a scale for testing (C major scale)
 * @param {number} startMidi - Starting MIDI note
 * @param {number} noteDuration - Duration of each note
 */
function playScale(startMidi = 60, noteDuration = 0.4) {
  const scaleIntervals = [0, 2, 4, 5, 7, 9, 11, 12]; // Major scale
  let delay = 0;

  scaleIntervals.forEach(interval => {
    setTimeout(() => {
      playMidi(startMidi + interval, noteDuration);
    }, delay);
    delay += noteDuration * 1000 + 50;
  });
}

// Export
export {
  initAudio,
  resumeAudio,
  playFrequency,
  playMidi,
  playTap,
  stopNote,
  setVolume,
  getVolume,
  setWaveform,
  getWaveform,
  setEnvelope,
  isAudioReady,
  isPlaying,
  getWaveformTypes,
  playScale
};
