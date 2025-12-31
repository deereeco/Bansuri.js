/**
 * Bansuri.js - MIDI Page Application
 * MIDI device input for bansuri fingering visualization
 */

import { getFingeringForMidi, midiToFrequency, BANSURI_KEYS } from './fingering-data.js';
import { createBansuri } from './bansuri-svg.js';
import { initAudio, playMidi, stopNote, setVolume, getVolume, setWaveform, getWaveformTypes } from './audio-engine.js';
import { createKeySelector } from './input-handlers.js';
import { initMidi, onNoteOn, onNoteOff, createMidiStatusDisplay } from './midi-handler.js';

// Application state
const state = {
  bansuriKey: 'G',
  currentFingering: null,
  audioEnabled: true
};

// UI Components
let bansuri = null;
let keySelector = null;
let midiStatus = null;

/**
 * Initialize the application
 */
function init() {
  const bansuriContainer = document.getElementById('bansuri-display');
  const controlsContainer = document.getElementById('controls');
  const noteInfoContainer = document.getElementById('note-info');

  if (!bansuriContainer) {
    console.error('Bansuri container not found');
    return;
  }

  // Create bansuri SVG
  bansuri = createBansuri(bansuriContainer);

  // Create controls
  if (controlsContainer) {
    createControls(controlsContainer);
  }

  // Create note info display
  if (noteInfoContainer) {
    createNoteInfo(noteInfoContainer);
  }

  // Initialize audio on first interaction
  document.addEventListener('click', initAudioOnce, { once: true });
  document.addEventListener('keydown', initAudioOnce, { once: true });

  // Initialize MIDI
  initMidi().then(available => {
    if (available) {
      setupMidiHandlers();
    }
  });

  // Load saved preferences
  loadPreferences();

  console.log('Bansuri.js MIDI page initialized');
}

function initAudioOnce() {
  initAudio();
}

/**
 * Create control panel
 */
function createControls(container) {
  // Settings section
  const settingsSection = createSection(container, 'Settings');
  keySelector = createKeySelector(settingsSection, handleKeyChange, state.bansuriKey);
  createVolumeControl(settingsSection);
  createWaveformControl(settingsSection);

  // MIDI section
  const midiSection = createSection(container, 'MIDI Device');
  midiStatus = createMidiStatusDisplay(midiSection);

  // Instructions
  const instructions = document.createElement('div');
  instructions.className = 'midi-instructions';
  instructions.innerHTML = `
    <p>Connect a MIDI device (keyboard, controller) to use this page.</p>
    <p>Play notes on your MIDI device to see the corresponding bansuri fingerings.</p>
  `;
  midiSection.appendChild(instructions);
}

function createSection(container, title) {
  const section = document.createElement('div');
  section.className = 'control-section';

  const header = document.createElement('h3');
  header.className = 'section-header';
  header.textContent = title;

  section.appendChild(header);
  container.appendChild(section);

  return section;
}

function createVolumeControl(container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'volume-control';

  const label = document.createElement('label');
  label.textContent = 'Volume: ';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '100';
  slider.value = getVolume() * 100;
  slider.className = 'volume-slider';

  const value = document.createElement('span');
  value.className = 'volume-value';
  value.textContent = `${Math.round(getVolume() * 100)}%`;

  slider.addEventListener('input', () => {
    const vol = slider.value / 100;
    setVolume(vol);
    value.textContent = `${slider.value}%`;
    savePreferences();
  });

  wrapper.appendChild(label);
  wrapper.appendChild(slider);
  wrapper.appendChild(value);
  container.appendChild(wrapper);
}

function createWaveformControl(container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'waveform-control';

  const label = document.createElement('label');
  label.textContent = 'Sound: ';

  const select = document.createElement('select');
  select.className = 'waveform-select';

  const waveforms = getWaveformTypes();
  const labels = {
    'sine': 'Sine (Pure)',
    'triangle': 'Triangle (Flute-like)',
    'sawtooth': 'Sawtooth (Bright)',
    'square': 'Square (Hollow)'
  };

  waveforms.forEach(wf => {
    const option = document.createElement('option');
    option.value = wf;
    option.textContent = labels[wf] || wf;
    if (wf === 'triangle') option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    setWaveform(select.value);
    savePreferences();
  });

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  container.appendChild(wrapper);
}

function createNoteInfo(container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'note-info-display';
  wrapper.id = 'note-details';

  const western = document.createElement('div');
  western.className = 'info-western';
  western.innerHTML = '<span class="label">Western:</span> <span class="value">-</span>';

  const indian = document.createElement('div');
  indian.className = 'info-indian';
  indian.innerHTML = '<span class="label">Indian:</span> <span class="value">-</span>';

  const octave = document.createElement('div');
  octave.className = 'info-octave';
  octave.innerHTML = '<span class="label">Octave:</span> <span class="value">-</span>';

  const frequency = document.createElement('div');
  frequency.className = 'info-frequency';
  frequency.innerHTML = '<span class="label">Frequency:</span> <span class="value">-</span>';

  wrapper.appendChild(western);
  wrapper.appendChild(indian);
  wrapper.appendChild(octave);
  wrapper.appendChild(frequency);
  container.appendChild(wrapper);
}

function updateNoteInfo(fingering) {
  const container = document.getElementById('note-details');
  if (!container || !fingering) return;

  container.querySelector('.info-western .value').textContent = fingering.westernNote;
  container.querySelector('.info-indian .value').textContent = fingering.indianNote;
  container.querySelector('.info-octave .value').textContent = fingering.octave;
  container.querySelector('.info-frequency .value').textContent =
    `${midiToFrequency(fingering.midiNote).toFixed(1)} Hz`;
}

/**
 * Set up MIDI event handlers
 */
function setupMidiHandlers() {
  onNoteOn(({ note, velocity }) => {
    const fingering = getFingeringForMidi(note, state.bansuriKey);

    if (fingering) {
      state.currentFingering = fingering;
      bansuri.setFingering(fingering);
      updateNoteInfo(fingering);

      if (state.audioEnabled) {
        playMidi(note, 0); // Sustained until note off
      }
    }
  });

  onNoteOff(({ note }) => {
    stopNote();
  });
}

function handleKeyChange(newKey) {
  state.bansuriKey = newKey;

  if (state.currentFingering) {
    const newFingering = getFingeringForMidi(state.currentFingering.midiNote, newKey);
    if (newFingering) {
      bansuri.setFingering(newFingering);
      updateNoteInfo(newFingering);
    }
  }

  savePreferences();
}

function savePreferences() {
  const prefs = {
    bansuriKey: state.bansuriKey,
    volume: getVolume()
  };

  try {
    localStorage.setItem('bansuri-prefs', JSON.stringify(prefs));
  } catch (e) {}
}

function loadPreferences() {
  try {
    const prefs = JSON.parse(localStorage.getItem('bansuri-prefs'));
    if (prefs) {
      if (prefs.bansuriKey && BANSURI_KEYS[prefs.bansuriKey]) {
        state.bansuriKey = prefs.bansuriKey;
      }
      if (typeof prefs.volume === 'number') {
        setVolume(prefs.volume);
      }
    }
  } catch (e) {}
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { init, state };
