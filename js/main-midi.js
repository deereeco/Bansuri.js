/**
 * Bansuri.js - MIDI Page Application
 * MIDI device input for bansuri fingering visualization
 */

import { getFingeringForMidi, midiToFrequency, midiToNoteName, BANSURI_KEYS } from './fingering-data.js';
import { createHorizontalBansuri } from './bansuri-svg.js';
import { initAudio, playMidi, stopNote } from './audio-engine.js';
import { createKeySelector, createOctaveShift, createRangeDisplay } from './input-handlers.js';
import { initMidi, onNoteOn, onNoteOff, createMidiStatusDisplay } from './midi-handler.js';
import { parseMIDI, createMIDIFileInput, createTempoControl, createTimedNoteSequencer, createPianoRoll } from './midi-file-parser.js';

// Application state
const state = {
  bansuriKey: 'G',
  octaveShift: 0,
  currentFingering: null,
  audioEnabled: true,
  activeTab: 'device',
  isFilePlayback: false,
  midiData: null
};

// UI Components
let bansuri = null;
let keySelector = null;
let octaveShiftControl = null;
let rangeDisplay = null;
let midiStatus = null;
let sequencer = null;
let pianoRoll = null;

// Audio engine reference that wraps audio functions
// This object is created immediately so sequencer can use it,
// but the functions it calls will initialize audio on first use
const audioEngineRef = {
  playMidi: (note, duration) => {
    const shiftedNote = note + (state.octaveShift * 12);
    return playMidi(shiftedNote, duration);
  },
  stopNote: () => stopNote()
};

/**
 * Initialize the application
 */
function init() {
  const bansuriContainer = document.getElementById('bansuri-display');
  const settingsContainer = document.getElementById('settings-bar');
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

  // Create note info display
  if (noteInfoContainer) {
    createNoteInfo(noteInfoContainer);
  }

  // Initialize tab switching
  initTabSwitching();

  // Initialize device tab
  initDeviceTab();

  // Initialize file tab
  initFileTab();

  // Initialize audio on first interaction
  document.addEventListener('click', () => initAudio(), { once: true });
  document.addEventListener('keydown', () => initAudio(), { once: true });

  // Initialize MIDI
  initMidi().then(available => {
    if (available) {
      setupMidiHandlers();
    }
  });

  // Load saved preferences
  loadPreferences();

  console.log('Bansuri.js MIDI page initialized (horizontal layout)');
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

/**
 * Initialize tab switching functionality
 */
function initTabSwitching() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;

      // Update active tab state
      state.activeTab = tabName;

      // Update button states
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Update content visibility
      tabContents.forEach(content => {
        if (content.id === `tab-${tabName}`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });

      // Stop file playback when switching away from file tab
      if (tabName === 'device' && sequencer) {
        sequencer.stop();
        state.isFilePlayback = false;
      }
    });
  });
}

/**
 * Initialize device input tab
 */
function initDeviceTab() {
  const midiStatusContainer = document.getElementById('midi-status');
  const noteButtonsContainer = document.getElementById('note-buttons');

  if (midiStatusContainer) {
    midiStatus = createMidiStatusDisplay(midiStatusContainer);

    const instructions = document.createElement('div');
    instructions.className = 'midi-instructions';
    instructions.innerHTML = `
      <p>Connect a MIDI device (keyboard, controller) to use this tab.</p>
      <p>Play notes on your MIDI device to see the corresponding bansuri fingerings.</p>
    `;
    midiStatusContainer.appendChild(instructions);
  }
}

/**
 * Initialize file import tab
 */
function initFileTab() {
  const fileInputContainer = document.getElementById('file-input-container');
  const tempoControlContainer = document.getElementById('tempo-control-container');
  const pianoRollContainer = document.getElementById('piano-roll-container');
  const sequencerContainer = document.getElementById('sequencer-container');

  // Create file input
  if (fileInputContainer) {
    createMIDIFileInput(fileInputContainer, handleMIDIFileParsed);
  }

  // Create tempo control
  if (tempoControlContainer) {
    createTempoControl(tempoControlContainer, handleTempoChange);
  }

  // Create piano roll visualization
  if (pianoRollContainer) {
    pianoRoll = createPianoRoll(pianoRollContainer, {
      width: 800,
      height: 200,
      bansuriKey: state.bansuriKey
    });
  }

  // Create sequencer
  if (sequencerContainer) {
    sequencer = createTimedNoteSequencer(
      sequencerContainer,
      handleSequencerNoteChange,
      audioEngineRef,
      handleTimeUpdate  // Pass time update callback for piano roll
    );
  }
}

/**
 * Handle MIDI file parsed
 */
function handleMIDIFileParsed(midiData) {
  state.midiData = midiData;
  if (sequencer) {
    sequencer.setNotes(midiData.notes);
  }
  if (pianoRoll) {
    pianoRoll.setNotes(midiData.notes, state.bansuriKey);
  }
}

/**
 * Handle time updates during playback (for piano roll playhead)
 */
function handleTimeUpdate(currentTime) {
  if (pianoRoll) {
    pianoRoll.setCurrentTime(currentTime);
  }
}

/**
 * Handle tempo multiplier change
 */
function handleTempoChange(multiplier) {
  if (sequencer) {
    sequencer.setTempoMultiplier(multiplier);
  }
}

/**
 * Handle sequencer note change
 */
function handleSequencerNoteChange(noteData) {
  const shiftedNote = noteData.midiNote + (state.octaveShift * 12);

  // Get fingering for the BASE (unshifted) note to show the fingering pattern
  const fingering = getFingeringForMidi(noteData.midiNote, state.bansuriKey);

  if (fingering) {
    state.currentFingering = fingering;
    bansuri.setFingering(fingering);

    // Create a display fingering object with shifted note info for the display
    const displayFingering = {
      ...fingering,
      midiNote: shiftedNote,
      westernNote: midiToNoteName(shiftedNote)
    };
    updateNoteInfo(displayFingering);
  }

  // Update playback state
  state.isFilePlayback = sequencer ? sequencer.isPlaying() : false;
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
    // Block device input during file playback
    if (state.isFilePlayback) return;

    const shiftedNote = note + (state.octaveShift * 12);

    // Get fingering for the BASE (unshifted) note to show the fingering pattern
    const fingering = getFingeringForMidi(note, state.bansuriKey);

    if (fingering) {
      state.currentFingering = fingering;
      bansuri.setFingering(fingering);

      // Create a display fingering object with shifted note info for the display
      const displayFingering = {
        ...fingering,
        midiNote: shiftedNote,
        westernNote: midiToNoteName(shiftedNote)
      };
      updateNoteInfo(displayFingering);
    }

    // Always play audio at the shifted pitch, even if outside fingering range
    if (state.audioEnabled) {
      playMidi(shiftedNote, 0); // Sustained until note off
    }
  });

  onNoteOff(({ note }) => {
    // Block device input during file playback
    if (state.isFilePlayback) return;

    stopNote();
  });
}

function handleKeyChange(newKey) {
  state.bansuriKey = newKey;

  // Update range display
  if (rangeDisplay) {
    rangeDisplay.update(newKey, state.octaveShift);
  }

  if (state.currentFingering) {
    const newFingering = getFingeringForMidi(state.currentFingering.midiNote, newKey);
    if (newFingering) {
      bansuri.setFingering(newFingering);
      updateNoteInfo(newFingering);
    }
  }

  // Update piano roll to show new playable notes
  if (pianoRoll) {
    pianoRoll.updateBansuriKey(newKey);
  }

  savePreferences();
}

function handleOctaveShiftChange(newShift) {
  state.octaveShift = newShift;

  // Update range display
  if (rangeDisplay) {
    rangeDisplay.update(state.bansuriKey, state.octaveShift);
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
