/**
 * Bansuri.js - Main Application (Home Page)
 * New horizontal layout with combined Sargam/Western note grid
 */

import { getFingeringForMidi, midiToFrequency, midiToNoteName, BANSURI_KEYS } from './fingering-data.js';
import { createHorizontalBansuri } from './bansuri-svg.js';
import { initAudio, playTap } from './audio-engine.js';
import { createKeySelector, createOctaveShift, createRangeDisplay, createCombinedNoteGrid } from './input-handlers.js';

// Application state
const state = {
  bansuriKey: 'G',
  octaveShift: 0,
  currentFingering: null,
  audioEnabled: true,
  showHalfNotes: false
};

// UI Components
let bansuri = null;
let combinedNoteGrid = null;
let keySelector = null;
let octaveShiftControl = null;
let rangeDisplay = null;

/**
 * Initialize the application
 */
function init() {
  // Get container elements
  const bansuriContainer = document.getElementById('bansuri-display');
  const settingsContainer = document.getElementById('settings-bar');
  const noteGridContainer = document.getElementById('note-grid');
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

  // Create combined note grid
  if (noteGridContainer) {
    combinedNoteGrid = createCombinedNoteGrid(noteGridContainer, handleNoteSelect, {
      bansuriKey: state.bansuriKey
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

  console.log('Bansuri.js initialized (horizontal layout)');
}

/**
 * Initialize audio on first user interaction
 */
function initAudioOnce() {
  initAudio();
}

/**
 * Create settings bar (key selector, octave shift, range display, and scale toggle)
 */
function createSettingsBar(container) {
  // Key selector
  keySelector = createKeySelector(container, handleKeyChange, state.bansuriKey);

  // Octave shift controls
  octaveShiftControl = createOctaveShift(container, handleOctaveShiftChange, state.octaveShift);

  // Range display
  rangeDisplay = createRangeDisplay(container, state.bansuriKey, state.octaveShift);

  // Half notes toggle
  createHalfNotesToggle(container);
}

/**
 * Create half notes visibility toggle
 */
function createHalfNotesToggle(container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'half-notes-toggle';

  const label = document.createElement('label');
  label.textContent = 'Scale: ';

  const btn = document.createElement('button');
  btn.className = 'toggle-btn';
  btn.textContent = state.showHalfNotes ? 'All Notes' : 'Major Only';
  btn.title = 'Toggle between all chromatic notes and major scale only';

  btn.addEventListener('click', () => {
    state.showHalfNotes = !state.showHalfNotes;
    btn.textContent = state.showHalfNotes ? 'All Notes' : 'Major Only';

    if (combinedNoteGrid) {
      combinedNoteGrid.setHalfNotesVisible(state.showHalfNotes);
    }
    savePreferences();
  });

  wrapper.appendChild(label);
  wrapper.appendChild(btn);
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
 * Handle note selection from combined grid
 * @param {string} sargamNote - The Indian note name
 * @param {number} midiNote - The MIDI note number
 * @param {number} semitone - Semitones from low Sa
 */
function handleNoteSelect(sargamNote, midiNote, semitone) {
  const baseMidi = BANSURI_KEYS[state.bansuriKey];
  const shiftSemitones = state.octaveShift * 12;
  const shiftedMidiNote = baseMidi + semitone + shiftSemitones;

  // Get fingering for the BASE (unshifted) note to show the fingering pattern
  const baseNote = baseMidi + semitone;
  const fingering = getFingeringForMidi(baseNote, state.bansuriKey);

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
}

/**
 * Handle bansuri key change
 */
function handleKeyChange(newKey) {
  state.bansuriKey = newKey;

  // Update range display
  if (rangeDisplay) {
    rangeDisplay.update(newKey, state.octaveShift);
  }

  // Update Western notes in the combined grid
  if (combinedNoteGrid) {
    combinedNoteGrid.updateWesternNotes(newKey);
  }

  // Re-apply current fingering if there is one
  if (state.currentFingering) {
    // Get the semitone offset from the current fingering
    const semitone = state.currentFingering.semitonesFromSa;
    if (semitone !== undefined) {
      // Recalculate based on new key
      const baseMidi = BANSURI_KEYS[newKey];
      const newMidiNote = baseMidi + semitone +
        (state.currentFingering.octave === 'madhya' ? 12 :
         state.currentFingering.octave === 'taar' ? 24 : 0);

      const newFingering = getFingeringForMidi(newMidiNote, newKey);
      if (newFingering) {
        bansuri.setFingering(newFingering);
        updateNoteInfo(newFingering);
      }
    }
  }

  savePreferences();
}

/**
 * Handle octave shift change
 */
function handleOctaveShiftChange(newShift) {
  state.octaveShift = newShift;

  // Update range display
  if (rangeDisplay) {
    rangeDisplay.update(state.bansuriKey, state.octaveShift);
  }

  // Re-display current fingering if exists
  if (state.currentFingering) {
    const semitone = state.currentFingering.semitonesFromSa;
    const baseMidi = BANSURI_KEYS[state.bansuriKey];
    const octaveOffset = state.currentFingering.octave === 'madhya' ? 12 :
                         state.currentFingering.octave === 'taar' ? 24 : 0;
    const newMidiNote = baseMidi + semitone + octaveOffset;

    const newFingering = getFingeringForMidi(newMidiNote, state.bansuriKey);
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
    octaveShift: state.octaveShift,
    showHalfNotes: state.showHalfNotes
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
        // Update key selector if it exists
        if (keySelector) {
          keySelector.setKey(prefs.bansuriKey);
        }
        // Update combined note grid
        if (combinedNoteGrid) {
          combinedNoteGrid.updateWesternNotes(prefs.bansuriKey);
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
      }
      if (typeof prefs.showHalfNotes === 'boolean') {
        state.showHalfNotes = prefs.showHalfNotes;
        if (combinedNoteGrid) {
          combinedNoteGrid.setHalfNotesVisible(prefs.showHalfNotes);
        }
        // Update button text if it exists
        const toggleBtn = document.querySelector('.half-notes-toggle .toggle-btn');
        if (toggleBtn) {
          toggleBtn.textContent = prefs.showHalfNotes ? 'All Notes' : 'Major Only';
        }
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
