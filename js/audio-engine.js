/**
 * Bansuri.js - Audio Engine (Tone.js)
 * Uses Tone.js to generate flute-like tones with envelope
 */

import { midiToFrequency } from './fingering-data.js';

// Tone.js synth and volume control
let synth = null;
let volume = null;
let isInitialized = false;

// Current note tracking
let currentNote = null;

// Default settings
const DEFAULT_SETTINGS = {
  volumeLevel: 0.5,  // 0.0 to 1.0
  waveform: 'triangle',  // 'sine', 'triangle', 'sawtooth', 'square'
};

let settings = { ...DEFAULT_SETTINGS };

// Flute-like envelope settings
// These create a smooth, airy sound similar to a bansuri
const FLUTE_ENVELOPE = {
  attack: 0.05,      // Quick but not instant attack
  decay: 0.1,        // Short decay
  sustain: 0.7,      // Moderate sustain level
  release: 0.3       // Gentle release
};

/**
 * Initialize Tone.js audio system
 * Must be called from a user interaction (click, keypress, etc.)
 */
function initAudio() {
  if (isInitialized) return true;

  try {
    // Create volume node (-20 to 0 dB range)
    volume = new Tone.Volume(-10).toDestination();

    // Create synth with flute-like envelope
    synth = new Tone.Synth({
      oscillator: {
        type: settings.waveform
      },
      envelope: FLUTE_ENVELOPE
    }).connect(volume);

    // Set initial volume
    setVolume(settings.volumeLevel);

    isInitialized = true;
    return true;
  } catch (e) {
    console.error('Tone.js initialization failed:', e);
    return false;
  }
}

/**
 * Ensure audio context is started (required by browsers)
 */
async function ensureStarted() {
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }
}

/**
 * Play a note by frequency
 * @param {number} frequency - Frequency in Hz
 * @param {number} duration - Duration in seconds (0 = sustained until stopNote)
 */
function playFrequency(frequency, duration = 0) {
  if (!isInitialized) {
    if (!initAudio()) return;
  }

  ensureStarted();

  // Stop any currently playing note
  stopNote();

  if (duration > 0) {
    // Play with specific duration
    synth.triggerAttackRelease(frequency, duration);
  } else {
    // Sustained note (until stopNote is called)
    synth.triggerAttack(frequency);
    currentNote = frequency;
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
  if (currentNote !== null) {
    try {
      synth.triggerRelease();
      currentNote = null;
    } catch (e) {
      // Note may already be released
    }
  }
}

/**
 * Set the master volume
 * @param {number} level - Volume level 0.0 to 1.0
 */
function setVolume(level) {
  settings.volumeLevel = Math.max(0, Math.min(1, level));

  if (volume) {
    // Convert 0-1 to decibels (-40 to 0 dB)
    // Using a logarithmic scale for natural volume perception
    const dbValue = settings.volumeLevel === 0
      ? -Infinity
      : -40 + (settings.volumeLevel * 40);
    volume.volume.value = dbValue;
  }
}

/**
 * Get current volume
 * @returns {number} Current volume level
 */
function getVolume() {
  return settings.volumeLevel;
}

/**
 * Set the waveform type
 * @param {string} type - 'sine', 'triangle', 'sawtooth', 'square'
 */
function setWaveform(type) {
  const validTypes = ['sine', 'triangle', 'sawtooth', 'square'];
  if (validTypes.includes(type)) {
    settings.waveform = type;

    // Update synth if already initialized
    if (synth) {
      synth.oscillator.type = type;
    }
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
 * @param {object} params - { attack, decay, sustain, release }
 */
function setEnvelope(params) {
  if (!synth) return;

  if (params.attack !== undefined) {
    synth.envelope.attack = Math.max(0.001, params.attack);
  }
  if (params.decay !== undefined) {
    synth.envelope.decay = Math.max(0.001, params.decay);
  }
  if (params.sustain !== undefined) {
    synth.envelope.sustain = Math.max(0, Math.min(1, params.sustain));
  }
  if (params.release !== undefined) {
    synth.envelope.release = Math.max(0.001, params.release);
  }
}

/**
 * Check if audio is initialized and ready
 * @returns {boolean}
 */
function isAudioReady() {
  return isInitialized && Tone.context.state === 'running';
}

/**
 * Resume audio context if suspended (required by browsers)
 */
async function resumeAudio() {
  await ensureStarted();
}

/**
 * Check if a note is currently playing
 * @returns {boolean}
 */
function isPlaying() {
  return currentNote !== null;
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
