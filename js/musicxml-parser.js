/**
 * Bansuri.js - MusicXML Parser
 * Parses MusicXML files to extract note information
 */

import { noteNameToMidi } from './fingering-data.js';

// Step-to-semitone mapping
const STEP_TO_SEMITONE = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
};

/**
 * Parse MusicXML string and extract notes
 * @param {string} xmlString - MusicXML content
 * @returns {Array} Array of note objects
 */
function parseMusicXML(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML: ' + parseError.textContent);
  }

  const notes = [];
  const noteElements = doc.querySelectorAll('note');

  noteElements.forEach((noteEl, index) => {
    // Skip rests
    if (noteEl.querySelector('rest')) {
      notes.push({
        index,
        type: 'rest',
        duration: parseDuration(noteEl)
      });
      return;
    }

    // Get pitch information
    const pitch = noteEl.querySelector('pitch');
    if (!pitch) return;

    const step = pitch.querySelector('step')?.textContent;
    const octave = parseInt(pitch.querySelector('octave')?.textContent || '4');
    const alter = parseInt(pitch.querySelector('alter')?.textContent || '0');

    if (!step) return;

    // Calculate MIDI note
    const baseSemitone = STEP_TO_SEMITONE[step.toUpperCase()];
    const midiNote = (octave + 1) * 12 + baseSemitone + alter;

    // Get Western note name
    let noteName = step.toUpperCase();
    if (alter === 1) noteName += '#';
    else if (alter === -1) noteName += 'b';
    noteName += octave;

    // Get duration info
    const duration = parseDuration(noteEl);
    const type = noteEl.querySelector('type')?.textContent || 'quarter';

    // Check for ties
    const tied = noteEl.querySelector('tie');
    const tieType = tied?.getAttribute('type');

    notes.push({
      index,
      type: 'note',
      step,
      octave,
      alter,
      midiNote,
      noteName,
      duration,
      noteType: type,
      tieStart: tieType === 'start',
      tieStop: tieType === 'stop'
    });
  });

  return notes;
}

/**
 * Parse duration from a note element
 * @param {Element} noteEl - Note element
 * @returns {number} Duration in divisions
 */
function parseDuration(noteEl) {
  const durationEl = noteEl.querySelector('duration');
  return durationEl ? parseInt(durationEl.textContent) : 1;
}

/**
 * Create file input for MusicXML
 * @param {HTMLElement} container - Container element
 * @param {Function} onParsed - Callback with parsed notes
 * @returns {object} Controller object
 */
function createMusicXMLInput(container, onParsed) {
  const wrapper = document.createElement('div');
  wrapper.className = 'musicxml-input-container';

  const label = document.createElement('label');
  label.className = 'file-input-label';
  label.textContent = 'Import MusicXML: ';

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xml,.musicxml,.mxl';
  input.className = 'musicxml-file-input';
  input.id = 'musicxml-input';

  const statusText = document.createElement('span');
  statusText.className = 'musicxml-status';

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusText.textContent = 'Loading...';
    statusText.className = 'musicxml-status loading';

    try {
      let xmlString;

      // Handle compressed MusicXML (.mxl)
      if (file.name.endsWith('.mxl')) {
        statusText.textContent = 'Compressed MusicXML (.mxl) not yet supported. Use .xml or .musicxml';
        statusText.className = 'musicxml-status error';
        return;
      }

      // Read as text
      xmlString = await file.text();

      // Parse
      const notes = parseMusicXML(xmlString);

      statusText.textContent = `Loaded ${notes.filter(n => n.type === 'note').length} notes`;
      statusText.className = 'musicxml-status success';

      onParsed(notes, file.name);
    } catch (error) {
      console.error('MusicXML parse error:', error);
      statusText.textContent = `Error: ${error.message}`;
      statusText.className = 'musicxml-status error';
    }
  });

  wrapper.appendChild(label);
  wrapper.appendChild(input);
  wrapper.appendChild(statusText);
  container.appendChild(wrapper);

  return {
    element: wrapper,
    clear() {
      input.value = '';
      statusText.textContent = '';
    }
  };
}

/**
 * Create note sequence player/stepper
 * @param {HTMLElement} container - Container element
 * @param {Function} onNoteChange - Callback when current note changes
 * @returns {object} Controller object
 */
function createNoteSequencer(container, onNoteChange) {
  const wrapper = document.createElement('div');
  wrapper.className = 'note-sequencer-container';
  wrapper.style.display = 'none'; // Hidden until notes are loaded

  // Controls
  const controls = document.createElement('div');
  controls.className = 'sequencer-controls';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'seq-btn prev-btn';
  prevBtn.textContent = '◀ Prev';

  const playBtn = document.createElement('button');
  playBtn.className = 'seq-btn play-btn';
  playBtn.textContent = '▶ Play';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'seq-btn next-btn';
  nextBtn.textContent = 'Next ▶';

  const stopBtn = document.createElement('button');
  stopBtn.className = 'seq-btn stop-btn';
  stopBtn.textContent = '■ Stop';

  controls.appendChild(prevBtn);
  controls.appendChild(playBtn);
  controls.appendChild(stopBtn);
  controls.appendChild(nextBtn);

  // Progress display
  const progress = document.createElement('div');
  progress.className = 'sequencer-progress';

  const progressText = document.createElement('span');
  progressText.className = 'progress-text';
  progressText.textContent = '0 / 0';

  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';

  const progressFill = document.createElement('div');
  progressFill.className = 'progress-fill';

  progressBar.appendChild(progressFill);
  progress.appendChild(progressText);
  progress.appendChild(progressBar);

  // Note display
  const noteDisplay = document.createElement('div');
  noteDisplay.className = 'current-note-display';

  wrapper.appendChild(controls);
  wrapper.appendChild(progress);
  wrapper.appendChild(noteDisplay);
  container.appendChild(wrapper);

  // State
  let notes = [];
  let currentIndex = 0;
  let isPlaying = false;
  let playInterval = null;
  let tempo = 120; // BPM

  // Update display
  function updateDisplay() {
    const noteNotes = notes.filter(n => n.type === 'note');
    const noteIndex = notes.slice(0, currentIndex + 1).filter(n => n.type === 'note').length;

    progressText.textContent = `${noteIndex} / ${noteNotes.length}`;
    progressFill.style.width = `${(noteIndex / noteNotes.length) * 100}%`;

    const current = notes[currentIndex];
    if (current && current.type === 'note') {
      noteDisplay.textContent = current.noteName;
    } else if (current && current.type === 'rest') {
      noteDisplay.textContent = '(rest)';
    } else {
      noteDisplay.textContent = '';
    }
  }

  // Navigate to note
  function goToNote(index) {
    if (index < 0) index = 0;
    if (index >= notes.length) index = notes.length - 1;

    currentIndex = index;
    updateDisplay();

    const current = notes[currentIndex];
    if (current && current.type === 'note') {
      onNoteChange(current);
    }
  }

  // Play sequence
  function play() {
    if (isPlaying) return;
    isPlaying = true;
    playBtn.textContent = '⏸ Pause';

    const msPerBeat = 60000 / tempo;

    playInterval = setInterval(() => {
      currentIndex++;
      if (currentIndex >= notes.length) {
        stop();
        currentIndex = 0;
        updateDisplay();
        return;
      }

      goToNote(currentIndex);
    }, msPerBeat);
  }

  // Stop playback
  function stop() {
    isPlaying = false;
    playBtn.textContent = '▶ Play';
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
  }

  // Button handlers
  prevBtn.addEventListener('click', () => {
    stop();
    // Find previous note (skip rests)
    let idx = currentIndex - 1;
    while (idx >= 0 && notes[idx]?.type === 'rest') idx--;
    if (idx >= 0) goToNote(idx);
  });

  nextBtn.addEventListener('click', () => {
    stop();
    // Find next note (skip rests)
    let idx = currentIndex + 1;
    while (idx < notes.length && notes[idx]?.type === 'rest') idx++;
    if (idx < notes.length) goToNote(idx);
  });

  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  });

  stopBtn.addEventListener('click', () => {
    stop();
    currentIndex = 0;
    updateDisplay();
  });

  return {
    element: wrapper,
    setNotes(noteArray) {
      notes = noteArray;
      currentIndex = 0;
      wrapper.style.display = notes.length > 0 ? 'block' : 'none';
      updateDisplay();

      // Go to first note
      if (notes.length > 0 && notes[0].type === 'note') {
        onNoteChange(notes[0]);
      }
    },
    setTempo(bpm) {
      tempo = bpm;
      if (isPlaying) {
        stop();
        play();
      }
    },
    stop,
    getCurrentNote() {
      return notes[currentIndex];
    },
    clear() {
      stop();
      notes = [];
      currentIndex = 0;
      wrapper.style.display = 'none';
    }
  };
}

// Export
export {
  parseMusicXML,
  createMusicXMLInput,
  createNoteSequencer
};
