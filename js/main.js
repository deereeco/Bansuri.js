/**
 * Bansuri.js - Main Application (Home Page)
 * Simple inputs: Western notes, Sargam, text input
 */

import { getFingeringForMidi, getFingeringForSargam, midiToFrequency, BANSURI_KEYS } from './fingering-data.js';
import { createBansuri } from './bansuri-svg.js';
import { initAudio, playTap, setVolume, getVolume, setWaveform, getWaveformTypes } from './audio-engine.js';
import { createNoteButtons, createTextInput, createKeySelector, createSargamButtons, createOctaveSelector } from './input-handlers.js';

// Application state
const state = {
  bansuriKey: 'G',
  currentOctaveOffset: 0,
  currentFingering: null,
  audioEnabled: true
};

// UI Components
let bansuri = null;
let noteButtons = null;
let keySelector = null;
let textInput = null;
let sargamButtons = null;
let octaveSelector = null;

/**
 * Initialize the application
 */
function init() {
  // Get container elements
  const bansuriContainer = document.getElementById('bansuri-display');
  const controlsContainer = document.getElementById('controls');
  const noteInfoContainer = document.getElementById('note-info');

  if (!bansuriContainer) {
    console.error('Bansuri container not found');
    return;
  }

  // Create bansuri SVG
  bansuri = createBansuri(bansuriContainer);

  // Create controls if container exists
  if (controlsContainer) {
    createControls(controlsContainer);
  }

  // Create note info display if container exists
  if (noteInfoContainer) {
    createNoteInfo(noteInfoContainer);
  }

  // Initialize audio on first interaction
  document.addEventListener('click', initAudioOnce, { once: true });
  document.addEventListener('keydown', initAudioOnce, { once: true });

  // Load saved preferences
  loadPreferences();

  console.log('Bansuri.js initialized');
}

/**
 * Initialize audio on first user interaction
 */
function initAudioOnce() {
  initAudio();
}

/**
 * Create control panel
 */
function createControls(container) {
  // Settings section (key, volume, waveform)
  const settingsSection = createSection(container, 'Settings');
  keySelector = createKeySelector(settingsSection, handleKeyChange, state.bansuriKey);
  createVolumeControl(settingsSection);
  createWaveformControl(settingsSection);

  // Western notes section
  const westernSection = createSection(container, 'Western Notes');
  noteButtons = createNoteButtons(westernSection, handleNoteSelect, {
    bansuriKey: state.bansuriKey,
    octaveRange: [3, 5]
  });

  // Indian notes section
  const indianSection = createSection(container, 'Indian Notes (Sargam)');
  octaveSelector = createOctaveSelector(indianSection, (offset) => {
    state.currentOctaveOffset = offset;
  });
  sargamButtons = createSargamButtons(indianSection, handleSargamSelect);

  // Text input section
  const textSection = createSection(container, 'Text Input');
  textInput = createTextInput(textSection, handleNoteSelect);
}

/**
 * Create a section with header
 */
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

/**
 * Create volume control
 */
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

  return wrapper;
}

/**
 * Create waveform selector
 */
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

  return wrapper;
}

/**
 * Create note information display
 */
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

/**
 * Update note information display
 */
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
 * Handle note selection (from buttons or text input)
 */
function handleNoteSelect(noteName, midiNote) {
  const fingering = getFingeringForMidi(midiNote, state.bansuriKey);

  if (fingering) {
    state.currentFingering = fingering;
    bansuri.setFingering(fingering);
    updateNoteInfo(fingering);

    // Play audio
    if (state.audioEnabled) {
      playTap(midiNote);
    }
  }
}

/**
 * Handle Sargam (Indian note) selection
 */
function handleSargamSelect(indianNote) {
  const fingering = getFingeringForSargam(indianNote, state.currentOctaveOffset, state.bansuriKey);

  if (fingering) {
    state.currentFingering = fingering;
    bansuri.setFingering(fingering);
    updateNoteInfo(fingering);

    if (state.audioEnabled) {
      playTap(fingering.midiNote);
    }

    // Clear note button selection
    if (noteButtons) {
      noteButtons.clearSelection();
    }
  }
}

/**
 * Handle bansuri key change
 */
function handleKeyChange(newKey) {
  state.bansuriKey = newKey;

  // Update playable notes in UI components
  if (noteButtons) {
    noteButtons.updatePlayableNotes(newKey);
  }

  // Re-apply current fingering if there is one
  if (state.currentFingering) {
    const newFingering = getFingeringForMidi(state.currentFingering.midiNote, newKey);
    if (newFingering) {
      bansuri.setFingering(newFingering);
      updateNoteInfo(newFingering);
    }
  }

  savePreferences();
}

/**
 * Save user preferences to localStorage
 */
function savePreferences() {
  const prefs = {
    bansuriKey: state.bansuriKey,
    volume: getVolume()
  };

  try {
    localStorage.setItem('bansuri-prefs', JSON.stringify(prefs));
  } catch (e) {
    // localStorage not available
  }
}

/**
 * Load user preferences from localStorage
 */
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
  } catch (e) {
    // localStorage not available or invalid data
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for external use
export { init, state };
