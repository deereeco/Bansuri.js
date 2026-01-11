/**
 * Bansuri.js - Piano Page Application
 * Piano keyboard input for bansuri fingering visualization
 */

import { getFingeringForMidi, midiToFrequency, midiToNoteName, BANSURI_KEYS } from './fingering-data.js';
import { createHorizontalBansuri } from './bansuri-svg.js';
import { initAudio, playTap } from './audio-engine.js';
import { createKeySelector, createOctaveShift, createRangeDisplay, createPianoKeyboard } from './input-handlers.js';

// Application state
const state = {
  bansuriKey: 'G',
  octaveShift: 0,
  currentFingering: null,
  audioEnabled: true
};

// UI Components
let bansuri = null;
let piano = null;
let keySelector = null;
let octaveShiftControl = null;
let rangeDisplay = null;

/**
 * Initialize the application
 */
function init() {
  const bansuriContainer = document.getElementById('bansuri-display');
  const settingsContainer = document.getElementById('settings-bar');
  const controlsContainer = document.getElementById('controls');
  const noteInfoContainer = document.getElementById('note-info');

  if (!bansuriContainer) {
    console.error('Bansuri container not found');
    return;
  }

  // Create horizontal bansuri SVG
  bansuri = createHorizontalBansuri(bansuriContainer);

  // Create settings bar
  if (settingsContainer) {
    createSettingsBar(settingsContainer);
  }

  // Create piano keyboard
  if (controlsContainer) {
    const pianoWrapper = document.createElement('div');
    pianoWrapper.className = 'piano-wrapper';
    controlsContainer.appendChild(pianoWrapper);

    piano = createPianoKeyboard(pianoWrapper, handleNoteSelect, {
      bansuriKey: state.bansuriKey,
      octaveShift: state.octaveShift,
      startOctave: 4,
      numOctaves: 4  // Show 4 octaves (C4-B7) - covers full bansuri range for all keys with fewer grey keys
    });
  }

  // Create note info display
  if (noteInfoContainer) {
    createNoteInfo(noteInfoContainer);
  }

  // Initialize audio on first interaction
  document.addEventListener('click', initAudioOnce, { once: true });
  document.addEventListener('keydown', initAudioOnce, { once: true });

  // Load saved preferences
  loadPreferences();

  console.log('Bansuri.js Piano page initialized (horizontal layout)');
}

function initAudioOnce() {
  initAudio();
}

/**
 * Create settings bar (key selector, octave shift, and range display)
 */
function createSettingsBar(container) {
  // Key selector
  keySelector = createKeySelector(container, handleKeyChange, state.bansuriKey);

  // Octave shift controls
  octaveShiftControl = createOctaveShift(container, handleOctaveShiftChange, state.octaveShift);

  // Range display
  rangeDisplay = createRangeDisplay(container, state.bansuriKey, state.octaveShift);
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

function handleNoteSelect(noteName, midiNote) {
  const shiftedMidiNote = midiNote + (state.octaveShift * 12);

  // Get fingering for the BASE (unshifted) note to show the fingering pattern
  const fingering = getFingeringForMidi(midiNote, state.bansuriKey);

  if (fingering) {
    state.currentFingering = fingering;
    bansuri.setFingering(fingering);

    // Create a display fingering object with shifted note info for the display
    const displayFingering = {
      ...fingering,
      midiNote: shiftedMidiNote,
      westernNote: midiToNoteName(shiftedMidiNote)
    };
    updateNoteInfo(displayFingering);
  }

  // Always play audio at the shifted pitch, even if outside fingering range
  if (state.audioEnabled) {
    playTap(shiftedMidiNote);
  }

  if (piano) {
    piano.highlightKey(midiNote);
  }
}

function handleKeyChange(newKey) {
  state.bansuriKey = newKey;

  // Update range display
  if (rangeDisplay) {
    rangeDisplay.update(newKey, state.octaveShift);
  }

  // Update piano keyboard playability
  if (piano) {
    piano.updatePlayableNotes(newKey, state.octaveShift);
  }

  if (state.currentFingering) {
    const newFingering = getFingeringForMidi(state.currentFingering.midiNote, newKey);
    if (newFingering) {
      bansuri.setFingering(newFingering);
      updateNoteInfo(newFingering);
    }
  }

  savePreferences();
}

function handleOctaveShiftChange(newShift) {
  state.octaveShift = newShift;

  // Update range display
  if (rangeDisplay) {
    rangeDisplay.update(state.bansuriKey, state.octaveShift);
  }

  // Update piano keyboard playability
  if (piano) {
    piano.updatePlayableNotes(state.bansuriKey, state.octaveShift);
  }

  // Re-display current fingering if exists
  if (state.currentFingering) {
    const newFingering = getFingeringForMidi(state.currentFingering.midiNote, state.bansuriKey);
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
    octaveShift: state.octaveShift
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
        // Update key selector if it exists
        if (keySelector) {
          keySelector.setKey(prefs.bansuriKey);
        }
      }
      if (typeof prefs.octaveShift === 'number' && prefs.octaveShift >= -2 && prefs.octaveShift <= 2) {
        state.octaveShift = prefs.octaveShift;
        // Update octave shift control if it exists
        if (octaveShiftControl) {
          octaveShiftControl.setShift(prefs.octaveShift);
        }
        // Update range display if it exists
        if (rangeDisplay) {
          rangeDisplay.update(state.bansuriKey, prefs.octaveShift);
        }
        // Update piano keyboard playability
        if (piano) {
          piano.updatePlayableNotes(state.bansuriKey, prefs.octaveShift);
        }
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
