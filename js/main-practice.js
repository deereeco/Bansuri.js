/**
 * Bansuri.js - Practice Page Controller
 * Palta/Alankar practice exercises with tempo control and playback
 */

import { getFingeringForMidi, getFingeringBySemitone, BANSURI_KEYS } from './fingering-data.js';
import { createHorizontalBansuri } from './bansuri-svg.js';
import { initAudio, playMidi, stopNote } from './audio-engine.js';
import { createKeySelector, createOctaveShift, createRangeDisplay } from './input-handlers.js';
import { PRACTICE_PATTERNS, patternToNoteSequence } from './practice-patterns.js';

// Application state
const state = {
  bansuriKey: 'G',
  octaveShift: 0,
  currentFingering: null,
  audioEnabled: true,

  // Practice-specific state
  currentPattern: null,
  currentBPM: 80,
  isPlaying: false,
  isPaused: false,
  loopEnabled: false,
  currentSequence: [],
  sequencer: null
};

// UI Components
let bansuri = null;
let patternSelector = null;
let tempoControl = null;
let playbackControls = null;
let patternDescription = null;
let keySelector = null;
let octaveShiftControl = null;
let rangeDisplay = null;

/**
 * PracticeSequencer - Handles timed playback of practice patterns
 */
class PracticeSequencer {
  constructor(onNoteChange) {
    this.onNoteChange = onNoteChange;
    this.sequence = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.loopEnabled = false;
    this.scheduledTimeouts = [];
    this.playbackStartTime = 0;
    this.playbackStartOffset = 0;
  }

  setSequence(sequence) {
    this.stop();
    this.sequence = sequence;
    this.currentIndex = 0;
  }

  play() {
    if (this.sequence.length === 0) return;

    this.isPlaying = true;
    this.isPaused = false;

    // Start from current position or beginning
    if (this.playbackStartOffset === 0 && this.currentIndex < this.sequence.length) {
      this.playbackStartOffset = this.sequence[this.currentIndex].startTime;
    }
    this.playbackStartTime = Date.now();

    const startOffset = this.playbackStartOffset;

    // Schedule all remaining notes
    for (let i = this.currentIndex; i < this.sequence.length; i++) {
      const note = this.sequence[i];
      const delay = note.startTime - startOffset;

      const timeoutId = setTimeout(() => {
        if (!this.isPlaying) return;

        this.currentIndex = i;
        this.onNoteChange(note, i);
        playMidi(note.midiNote, note.duration / 1000);

        // If last note and loop enabled, restart
        if (i === this.sequence.length - 1) {
          setTimeout(() => {
            if (this.isPlaying && this.loopEnabled) {
              this.restart();
            } else if (this.isPlaying) {
              this.stop();
            }
          }, note.duration);
        }
      }, delay);

      this.scheduledTimeouts.push(timeoutId);
    }
  }

  pause() {
    this.isPlaying = false;
    this.isPaused = true;
    this.clearTimeouts();

    // Calculate current position
    if (this.currentIndex < this.sequence.length) {
      const elapsed = Date.now() - this.playbackStartTime;
      this.playbackStartOffset = this.playbackStartOffset + elapsed;
    }
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.clearTimeouts();
    this.currentIndex = 0;
    this.playbackStartOffset = 0;
    stopNote();
  }

  restart() {
    this.stop();
    this.play();
  }

  clearTimeouts() {
    this.scheduledTimeouts.forEach(id => clearTimeout(id));
    this.scheduledTimeouts = [];
  }

  setLoop(enabled) {
    this.loopEnabled = enabled;
  }

  getCurrentIndex() {
    return this.currentIndex;
  }

  getSequenceLength() {
    return this.sequence.length;
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

/**
 * Create pattern selector dropdown
 */
function createPatternSelector(container, onPatternSelect, patterns) {
  const wrapper = document.createElement('div');
  wrapper.className = 'pattern-selector';

  const label = document.createElement('label');
  label.textContent = 'Pattern: ';

  const select = document.createElement('select');
  select.className = 'pattern-dropdown';

  // Group by category
  const categories = ['Beginner', 'Intermediate', 'Advanced'];
  for (const category of categories) {
    const categoryPatterns = patterns.filter(p => p.category === category);
    if (categoryPatterns.length > 0) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = category;
      categoryPatterns.forEach(pattern => {
        const option = document.createElement('option');
        option.value = pattern.id;
        option.textContent = pattern.name;
        optgroup.appendChild(option);
      });
      select.appendChild(optgroup);
    }
  }

  select.addEventListener('change', (e) => {
    const pattern = patterns.find(p => p.id === e.target.value);
    if (pattern) onPatternSelect(pattern);
  });

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  container.appendChild(wrapper);

  return {
    element: wrapper,
    setPattern(id) {
      select.value = id;
      const pattern = patterns.find(p => p.id === id);
      if (pattern) onPatternSelect(pattern);
    },
    getPattern() {
      return patterns.find(p => p.id === select.value);
    }
  };
}

/**
 * Create tempo control (slider + number input)
 */
function createTempoControl(container, onTempoChange, initialBPM = 80) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tempo-control';

  const label = document.createElement('label');
  label.textContent = 'Tempo: ';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '40';
  slider.max = '200';
  slider.step = '5';
  slider.value = initialBPM;
  slider.className = 'tempo-slider';

  const numberInput = document.createElement('input');
  numberInput.type = 'number';
  numberInput.min = '40';
  numberInput.max = '200';
  numberInput.step = '5';
  numberInput.value = initialBPM;
  numberInput.className = 'bpm-input';

  const bpmLabel = document.createElement('span');
  bpmLabel.textContent = ' BPM';
  bpmLabel.className = 'bpm-label';

  const syncInputs = (value) => {
    const bpm = Math.max(40, Math.min(200, parseInt(value) || 80));
    slider.value = bpm;
    numberInput.value = bpm;
    onTempoChange(bpm);
  };

  slider.addEventListener('input', (e) => syncInputs(e.target.value));
  numberInput.addEventListener('change', (e) => syncInputs(e.target.value));

  wrapper.appendChild(label);
  wrapper.appendChild(slider);
  wrapper.appendChild(numberInput);
  wrapper.appendChild(bpmLabel);
  container.appendChild(wrapper);

  return {
    element: wrapper,
    setBPM(bpm) { syncInputs(bpm); },
    getBPM() { return parseInt(slider.value); }
  };
}

/**
 * Create playback controls (play/pause/stop/loop)
 */
function createPlaybackControls(container, callbacks) {
  const wrapper = document.createElement('div');
  wrapper.className = 'playback-controls';

  const playBtn = document.createElement('button');
  playBtn.textContent = '▶ Play';
  playBtn.className = 'control-btn play-btn';

  const pauseBtn = document.createElement('button');
  pauseBtn.textContent = '⏸ Pause';
  pauseBtn.className = 'control-btn pause-btn';
  pauseBtn.disabled = true;

  const stopBtn = document.createElement('button');
  stopBtn.textContent = '⏹ Stop';
  stopBtn.className = 'control-btn stop-btn';
  stopBtn.disabled = true;

  const loopToggle = document.createElement('label');
  loopToggle.className = 'loop-toggle';
  const loopCheckbox = document.createElement('input');
  loopCheckbox.type = 'checkbox';
  loopCheckbox.checked = false;
  loopToggle.appendChild(loopCheckbox);
  loopToggle.appendChild(document.createTextNode(' Loop'));

  const progress = document.createElement('div');
  progress.className = 'progress-display';
  progress.textContent = 'Ready';

  playBtn.addEventListener('click', callbacks.onPlay);
  pauseBtn.addEventListener('click', callbacks.onPause);
  stopBtn.addEventListener('click', callbacks.onStop);
  loopCheckbox.addEventListener('change', (e) => {
    if (callbacks.onLoopChange) {
      callbacks.onLoopChange(e.target.checked);
    }
  });

  wrapper.appendChild(playBtn);
  wrapper.appendChild(pauseBtn);
  wrapper.appendChild(stopBtn);
  wrapper.appendChild(loopToggle);
  wrapper.appendChild(progress);
  container.appendChild(wrapper);

  return {
    element: wrapper,
    setPlaying(isPlaying) {
      playBtn.disabled = isPlaying;
      pauseBtn.disabled = !isPlaying;
      stopBtn.disabled = !isPlaying;
    },
    setLoopEnabled(enabled) {
      loopCheckbox.checked = enabled;
    },
    getLoopEnabled() {
      return loopCheckbox.checked;
    },
    setProgress(current, total) {
      progress.textContent = `Note ${current + 1} / ${total}`;
    },
    setReady() {
      progress.textContent = 'Ready';
    }
  };
}

/**
 * Create pattern description display
 */
function createPatternDescription(container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'pattern-description';

  const name = document.createElement('h3');
  name.className = 'pattern-name';

  const description = document.createElement('p');
  description.className = 'pattern-desc';

  wrapper.appendChild(name);
  wrapper.appendChild(description);
  container.appendChild(wrapper);

  return {
    element: wrapper,
    setPattern(pattern) {
      if (pattern) {
        name.textContent = pattern.name;
        description.textContent = pattern.description;
      } else {
        name.textContent = '';
        description.textContent = 'Select a pattern to begin practicing.';
      }
    }
  };
}

/**
 * Initialize the application
 */
function init() {
  // Get container elements
  const bansuriContainer = document.getElementById('bansuri-display');
  const settingsContainer = document.getElementById('settings-bar');
  const patternSelectorContainer = document.getElementById('pattern-selector');
  const tempoControlContainer = document.getElementById('tempo-control');
  const playbackControlsContainer = document.getElementById('playback-controls');
  const patternDescContainer = document.getElementById('pattern-description');

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

  // Create pattern selector
  if (patternSelectorContainer) {
    patternSelector = createPatternSelector(
      patternSelectorContainer,
      handlePatternSelect,
      PRACTICE_PATTERNS
    );
  }

  // Create tempo control
  if (tempoControlContainer) {
    tempoControl = createTempoControl(
      tempoControlContainer,
      handleTempoChange,
      state.currentBPM
    );
  }

  // Create playback controls
  if (playbackControlsContainer) {
    playbackControls = createPlaybackControls(playbackControlsContainer, {
      onPlay: handlePlay,
      onPause: handlePause,
      onStop: handleStop,
      onLoopChange: handleLoopChange
    });
  }

  // Create pattern description
  if (patternDescContainer) {
    patternDescription = createPatternDescription(patternDescContainer);
  }

  // Create sequencer
  state.sequencer = new PracticeSequencer(handleNoteChange);

  // Initialize audio on first interaction
  document.addEventListener('click', initAudioOnce, { once: true });
  document.addEventListener('keydown', initAudioOnce, { once: true });

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (state.sequencer) {
      state.sequencer.stop();
    }
  });

  // Load saved preferences
  loadPreferences();

  console.log('Practice page initialized');
}

/**
 * Initialize audio on first user interaction
 */
function initAudioOnce() {
  initAudio();
}

/**
 * Create settings bar
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
 * Handle pattern selection
 */
function handlePatternSelect(pattern) {
  // Stop current playback
  if (state.sequencer && state.isPlaying) {
    state.sequencer.stop();
    state.isPlaying = false;
    if (playbackControls) {
      playbackControls.setPlaying(false);
      playbackControls.setReady();
    }
  }

  state.currentPattern = pattern;

  // Update description
  if (patternDescription) {
    patternDescription.setPattern(pattern);
  }

  // Update tempo to pattern's suggested tempo
  if (pattern && tempoControl && pattern.tempo) {
    state.currentBPM = pattern.tempo;
    tempoControl.setBPM(pattern.tempo);
  }

  // Regenerate sequence
  regenerateSequence();

  // Save preference
  savePreferences();
}

/**
 * Handle tempo change
 */
function handleTempoChange(bpm) {
  state.currentBPM = bpm;

  // If playing, stop and restart with new tempo
  const wasPlaying = state.isPlaying;
  if (wasPlaying && state.sequencer) {
    state.sequencer.stop();
    state.isPlaying = false;
  }

  // Regenerate sequence
  regenerateSequence();

  // Restart if it was playing
  if (wasPlaying && state.sequencer) {
    state.sequencer.play();
    state.isPlaying = true;
    if (playbackControls) {
      playbackControls.setPlaying(true);
    }
  }

  // Save preference
  savePreferences();
}

/**
 * Handle bansuri key change
 */
function handleKeyChange(newKey) {
  state.bansuriKey = newKey;

  // Stop playback (fingering patterns will change)
  if (state.sequencer && state.isPlaying) {
    state.sequencer.stop();
    state.isPlaying = false;
    if (playbackControls) {
      playbackControls.setPlaying(false);
      playbackControls.setReady();
    }
  }

  // Update range display
  if (rangeDisplay) {
    rangeDisplay.update(state.bansuriKey, state.octaveShift);
  }

  // Regenerate sequence
  regenerateSequence();

  // Save preference
  savePreferences();
}

/**
 * Handle octave shift change
 */
function handleOctaveShiftChange(newShift) {
  state.octaveShift = newShift;

  // Stop playback
  if (state.sequencer && state.isPlaying) {
    state.sequencer.stop();
    state.isPlaying = false;
    if (playbackControls) {
      playbackControls.setPlaying(false);
      playbackControls.setReady();
    }
  }

  // Update range display
  if (rangeDisplay) {
    rangeDisplay.update(state.bansuriKey, state.octaveShift);
  }

  // Regenerate sequence
  regenerateSequence();

  // Save preference
  savePreferences();
}

/**
 * Handle play button
 */
function handlePlay() {
  if (!state.sequencer || !state.currentPattern) return;

  // Initialize audio if needed
  initAudio();

  state.sequencer.play();
  state.isPlaying = true;

  if (playbackControls) {
    playbackControls.setPlaying(true);
  }
}

/**
 * Handle pause button
 */
function handlePause() {
  if (!state.sequencer) return;

  state.sequencer.pause();
  state.isPlaying = false;
  state.isPaused = true;

  if (playbackControls) {
    playbackControls.setPlaying(false);
  }
}

/**
 * Handle stop button
 */
function handleStop() {
  if (!state.sequencer) return;

  state.sequencer.stop();
  state.isPlaying = false;
  state.isPaused = false;

  if (playbackControls) {
    playbackControls.setPlaying(false);
    playbackControls.setReady();
  }
}

/**
 * Handle loop toggle
 */
function handleLoopChange(enabled) {
  state.loopEnabled = enabled;
  if (state.sequencer) {
    state.sequencer.setLoop(enabled);
  }
  savePreferences();
}

/**
 * Handle note change during playback
 */
function handleNoteChange(noteData, index) {
  // Update bansuri display
  // Calculate semitones from Sa for this MIDI note
  const baseMidi = BANSURI_KEYS[state.bansuriKey];
  const semitonesFromSa = noteData.midiNote - baseMidi;

  // Use getFingeringBySemitone to always show fingering regardless of octave/range
  const fingering = getFingeringBySemitone(semitonesFromSa, noteData.midiNote, state.bansuriKey);
  if (fingering && bansuri) {
    bansuri.setFingering(fingering);
    state.currentFingering = fingering;
  }

  // Update progress
  if (playbackControls && state.sequencer) {
    playbackControls.setProgress(index, state.sequencer.getSequenceLength());
  }
}

/**
 * Regenerate note sequence from current pattern
 */
function regenerateSequence() {
  if (!state.currentPattern) {
    state.currentSequence = [];
    if (state.sequencer) {
      state.sequencer.setSequence([]);
    }
    return;
  }

  const sequence = patternToNoteSequence(
    state.currentPattern,
    state.currentBPM,
    state.bansuriKey,
    state.octaveShift
  );

  state.currentSequence = sequence;

  if (state.sequencer) {
    state.sequencer.setSequence(sequence);
  }
}

/**
 * Save preferences to localStorage
 */
function savePreferences() {
  const prefs = {
    bansuriKey: state.bansuriKey,
    octaveShift: state.octaveShift,
    lastPatternId: state.currentPattern ? state.currentPattern.id : null,
    lastBPM: state.currentBPM,
    loopEnabled: state.loopEnabled
  };

  try {
    localStorage.setItem('bansuri-prefs', JSON.stringify({ bansuriKey: state.bansuriKey }));
    localStorage.setItem('bansuri-practice-prefs', JSON.stringify(prefs));
  } catch (e) {
    console.warn('Could not save preferences:', e);
  }
}

/**
 * Load preferences from localStorage
 */
function loadPreferences() {
  try {
    // Load general prefs
    const generalPrefs = JSON.parse(localStorage.getItem('bansuri-prefs'));
    if (generalPrefs && generalPrefs.bansuriKey && BANSURI_KEYS[generalPrefs.bansuriKey]) {
      state.bansuriKey = generalPrefs.bansuriKey;
      if (keySelector) keySelector.setKey(generalPrefs.bansuriKey);
      if (rangeDisplay) rangeDisplay.update(state.bansuriKey, state.octaveShift);
    }

    // Load practice-specific prefs
    const practicePrefs = JSON.parse(localStorage.getItem('bansuri-practice-prefs'));
    if (practicePrefs) {
      if (practicePrefs.lastBPM) {
        state.currentBPM = practicePrefs.lastBPM;
        if (tempoControl) tempoControl.setBPM(practicePrefs.lastBPM);
      }

      if (practicePrefs.loopEnabled !== undefined) {
        state.loopEnabled = practicePrefs.loopEnabled;
        if (playbackControls) playbackControls.setLoopEnabled(practicePrefs.loopEnabled);
        if (state.sequencer) state.sequencer.setLoop(practicePrefs.loopEnabled);
      }

      if (practicePrefs.lastPatternId && patternSelector) {
        patternSelector.setPattern(practicePrefs.lastPatternId);
      } else if (patternSelector) {
        // Load first pattern by default
        patternSelector.setPattern(PRACTICE_PATTERNS[0].id);
      }
    } else if (patternSelector) {
      // Load first pattern by default
      patternSelector.setPattern(PRACTICE_PATTERNS[0].id);
    }
  } catch (e) {
    console.warn('Could not load preferences:', e);
    // Load first pattern as fallback
    if (patternSelector && PRACTICE_PATTERNS.length > 0) {
      patternSelector.setPattern(PRACTICE_PATTERNS[0].id);
    }
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
