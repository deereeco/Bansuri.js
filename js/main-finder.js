/**
 * Flute Finder - Main Application
 * Helps users find the right bansuri by showing all notes at once
 */

import { BANSURI_KEYS } from './fingering-data.js';
import { createHorizontalBansuri } from './bansuri-svg.js';
import { createKeySelector } from './input-handlers.js';
import { createNoteLabels, parseNoteInput, noteNameToSemitone } from './finder-note-labels.js';

// Application state
const state = {
  bansuriKey: 'G',
  highlightedNotes: []
};

// UI Components
let bansuri = null;
let noteLabels = null;
let keySelector = null;
let textInput = null;

/**
 * Initialize the application
 */
function init() {
  // Get container elements
  const bansuriContainer = document.getElementById('bansuri-display');
  const settingsContainer = document.getElementById('settings-bar');

  if (!bansuriContainer) {
    console.error('Bansuri container not found');
    return;
  }

  // Create horizontal bansuri SVG
  bansuri = createHorizontalBansuri(bansuriContainer);

  // Remove finger labels (L1, L2, L3, R1, R2, R3) - not needed for finder
  const fingerLabels = bansuri.svg.querySelector('g.finger-labels');
  if (fingerLabels) {
    fingerLabels.remove();
  }

  // Expand SVG viewBox to fit labels above and below
  bansuri.svg.setAttribute('viewBox', '0 0 900 180');

  // Add note labels to the bansuri
  noteLabels = createNoteLabels(
    bansuri.svg,
    bansuri.holes,
    { width: 900, height: 180 }, // Increased height for labels
    state.bansuriKey
  );

  // Create settings bar
  if (settingsContainer) {
    createSettingsBar(settingsContainer);
  }

  // Load saved preferences
  loadPreferences();

  console.log('Flute Finder initialized');
}

/**
 * Create settings bar with key selector and text input
 */
function createSettingsBar(container) {
  // Key selector
  keySelector = createKeySelector(container, handleKeyChange, state.bansuriKey);

  // Text input container
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'finder-input-container';

  const label = document.createElement('label');
  label.textContent = 'Enter notes: ';
  label.htmlFor = 'note-finder-input';

  textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.id = 'note-finder-input';
  textInput.className = 'note-text-input';
  textInput.placeholder = '';

  const errorSpan = document.createElement('span');
  errorSpan.className = 'error-message';
  errorSpan.id = 'input-error';

  textInput.addEventListener('input', handleNoteInput);

  inputWrapper.appendChild(label);
  inputWrapper.appendChild(textInput);
  inputWrapper.appendChild(errorSpan);
  container.appendChild(inputWrapper);
}

/**
 * Handle note input changes
 */
function handleNoteInput() {
  const input = textInput.value;
  const errorSpan = document.getElementById('input-error');
  errorSpan.textContent = '';

  // Clear highlights if input is empty
  if (!input.trim()) {
    noteLabels.clearHighlights();
    state.highlightedNotes = [];
    return;
  }

  // Parse input
  const noteNames = parseNoteInput(input);

  if (noteNames.length === 0) {
    errorSpan.textContent = 'No valid notes found. Try: c,d,e or c d e';
    noteLabels.clearHighlights();
    return;
  }

  // Convert note names to semitones
  const semitones = [];
  for (const noteName of noteNames) {
    const semitone = noteNameToSemitone(noteName, state.bansuriKey);
    if (semitone !== null) {
      semitones.push(semitone);
    }
  }

  if (semitones.length === 0) {
    errorSpan.textContent = 'No matching notes found for this key';
    noteLabels.clearHighlights();
    return;
  }

  // Highlight matching note labels
  noteLabels.highlightNotes(semitones);
  state.highlightedNotes = semitones;
}

/**
 * Handle bansuri key change
 */
function handleKeyChange(newKey) {
  state.bansuriKey = newKey;

  // Update note labels to show new Western note names
  noteLabels.updateKey(newKey);

  // Re-process current input with new key
  handleNoteInput();

  savePreferences();
}

/**
 * Save preferences to localStorage
 */
function savePreferences() {
  try {
    localStorage.setItem('bansuri-finder-prefs', JSON.stringify({
      bansuriKey: state.bansuriKey
    }));
  } catch (e) {
    console.warn('Could not save preferences:', e);
  }
}

/**
 * Load preferences from localStorage
 */
function loadPreferences() {
  try {
    const prefs = JSON.parse(localStorage.getItem('bansuri-finder-prefs'));
    if (prefs && prefs.bansuriKey && BANSURI_KEYS[prefs.bansuriKey]) {
      state.bansuriKey = prefs.bansuriKey;
      if (keySelector) {
        keySelector.setKey(prefs.bansuriKey);
      }
      if (noteLabels) {
        noteLabels.updateKey(prefs.bansuriKey);
      }
    }
  } catch (e) {
    console.warn('Could not load preferences:', e);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { init, state };
