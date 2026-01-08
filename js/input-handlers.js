/**
 * Bansuri.js - Input Handlers
 * Handles various input methods: buttons, text, dropdown, piano keyboard
 */

import { NOTES, BANSURI_KEYS, getFingeringForNote, getFingeringForSargam, isPlayable, noteNameToMidi } from './fingering-data.js';

// SVG namespace
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Create note buttons grid
 * @param {HTMLElement} container - Container element
 * @param {Function} onNoteSelect - Callback when note is selected
 * @param {object} options - Configuration options
 * @returns {object} Controller object
 */
function createNoteButtons(container, onNoteSelect, options = {}) {
  const { bansuriKey = 'G', octaveRange = [3, 5] } = options;

  const wrapper = document.createElement('div');
  wrapper.className = 'note-buttons-container';

  // Create buttons for each octave
  for (let octave = octaveRange[0]; octave <= octaveRange[1]; octave++) {
    const octaveDiv = document.createElement('div');
    octaveDiv.className = 'note-buttons-octave';

    const label = document.createElement('span');
    label.className = 'octave-label';
    label.textContent = `Octave ${octave}`;
    octaveDiv.appendChild(label);

    const buttonRow = document.createElement('div');
    buttonRow.className = 'note-buttons-row';

    NOTES.forEach(note => {
      const noteName = `${note}${octave}`;
      const midiNote = noteNameToMidi(noteName);
      const playable = isPlayable(midiNote, bansuriKey);

      const btn = document.createElement('button');
      btn.className = 'note-button';
      btn.textContent = note;
      btn.dataset.note = noteName;
      btn.dataset.midi = midiNote;

      if (!playable) {
        btn.classList.add('not-playable');
        btn.disabled = true;
        btn.title = 'Outside bansuri range';
      }

      if (note.includes('#')) {
        btn.classList.add('sharp');
      }

      btn.addEventListener('click', () => {
        if (playable) {
          onNoteSelect(noteName, midiNote);
          // Visual feedback
          wrapper.querySelectorAll('.note-button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });

      buttonRow.appendChild(btn);
    });

    octaveDiv.appendChild(buttonRow);
    wrapper.appendChild(octaveDiv);
  }

  container.appendChild(wrapper);

  return {
    element: wrapper,
    updatePlayableNotes(newBansuriKey) {
      wrapper.querySelectorAll('.note-button').forEach(btn => {
        const midiNote = parseInt(btn.dataset.midi);
        const playable = isPlayable(midiNote, newBansuriKey);
        btn.classList.toggle('not-playable', !playable);
        btn.disabled = !playable;
      });
    },
    clearSelection() {
      wrapper.querySelectorAll('.note-button').forEach(b => b.classList.remove('active'));
    }
  };
}

/**
 * Create text input for note names
 * @param {HTMLElement} container - Container element
 * @param {Function} onNoteInput - Callback when note is entered
 * @returns {object} Controller object
 */
function createTextInput(container, onNoteInput) {
  const wrapper = document.createElement('div');
  wrapper.className = 'text-input-container';

  const label = document.createElement('label');
  label.textContent = 'Enter note: ';
  label.htmlFor = 'note-input';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'note-input';
  input.className = 'note-text-input';
  input.placeholder = 'e.g., G4, C#5, Sa, Komal Re';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'submit-btn';
  submitBtn.textContent = 'Show';

  const errorSpan = document.createElement('span');
  errorSpan.className = 'error-message';

  const handleSubmit = () => {
    const value = input.value.trim();
    if (!value) return;

    errorSpan.textContent = '';

    // Try to parse as Western note first
    let midiNote = noteNameToMidi(value);
    if (midiNote !== null) {
      onNoteInput(value, midiNote);
      return;
    }

    // Try as Indian note
    const fingering = getFingeringForSargam(value);
    if (fingering) {
      onNoteInput(value, fingering.midiNote);
      return;
    }

    errorSpan.textContent = `Unknown note: ${value}`;
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSubmit();
  });

  submitBtn.addEventListener('click', handleSubmit);

  wrapper.appendChild(label);
  wrapper.appendChild(input);
  wrapper.appendChild(submitBtn);
  wrapper.appendChild(errorSpan);
  container.appendChild(wrapper);

  return {
    element: wrapper,
    setValue(value) {
      input.value = value;
    },
    clear() {
      input.value = '';
      errorSpan.textContent = '';
    }
  };
}

/**
 * Create bansuri key selector dropdown
 * @param {HTMLElement} container - Container element
 * @param {Function} onKeyChange - Callback when key is changed
 * @param {string} initialKey - Initial key selection
 * @returns {object} Controller object
 */
function createKeySelector(container, onKeyChange, initialKey = 'G') {
  const wrapper = document.createElement('div');
  wrapper.className = 'key-selector-container';

  const label = document.createElement('label');
  label.textContent = 'Bansuri Key: ';
  label.htmlFor = 'bansuri-key';

  const select = document.createElement('select');
  select.id = 'bansuri-key';
  select.className = 'key-selector';

  // Add options for each key
  Object.keys(BANSURI_KEYS).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = key;
    if (key === initialKey) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    onKeyChange(select.value);
  });

  // Add info text
  const info = document.createElement('span');
  info.className = 'key-info';
  info.textContent = '= Sa';

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  wrapper.appendChild(info);
  container.appendChild(wrapper);

  return {
    element: wrapper,
    getKey() {
      return select.value;
    },
    setKey(key) {
      if (BANSURI_KEYS[key]) {
        select.value = key;
      }
    }
  };
}

/**
 * Create piano keyboard input
 * @param {HTMLElement} container - Container element
 * @param {Function} onNoteSelect - Callback when note is selected
 * @param {object} options - Configuration options
 * @returns {object} Controller object
 */
function createPianoKeyboard(container, onNoteSelect, options = {}) {
  const {
    startOctave = 3,
    numOctaves = 2,
    bansuriKey = 'G',
    width = 600,
    height = 120
  } = options;

  const wrapper = document.createElement('div');
  wrapper.className = 'piano-keyboard-container';

  // Create SVG
  const svg = document.createElementNS(SVG_NS, 'svg');
  const whiteKeyWidth = width / (numOctaves * 7);
  const blackKeyWidth = whiteKeyWidth * 0.6;
  const blackKeyHeight = height * 0.6;

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'piano-keyboard');
  svg.style.width = '100%';
  svg.style.height = 'auto';

  const keys = [];

  // White keys first (so black keys render on top)
  const whiteNotes = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
  const blackNotes = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

  let whiteKeyIndex = 0;

  for (let octave = startOctave; octave < startOctave + numOctaves; octave++) {
    whiteNotes.forEach((noteOffset, i) => {
      const midiNote = (octave + 1) * 12 + noteOffset;
      const x = whiteKeyIndex * whiteKeyWidth;
      const playable = isPlayable(midiNote, bansuriKey);

      const key = document.createElementNS(SVG_NS, 'rect');
      key.setAttribute('x', x);
      key.setAttribute('y', 0);
      key.setAttribute('width', whiteKeyWidth - 1);
      key.setAttribute('height', height);
      key.setAttribute('fill', playable ? '#ffffff' : '#cccccc');
      key.setAttribute('stroke', '#333');
      key.setAttribute('stroke-width', 1);
      key.setAttribute('class', 'piano-key white-key');
      key.dataset.midi = midiNote;
      key.dataset.note = NOTES[noteOffset] + octave;

      if (!playable) {
        key.classList.add('not-playable');
      }

      key.addEventListener('mousedown', () => {
        if (playable) {
          key.classList.add('active');
          onNoteSelect(key.dataset.note, midiNote);
        }
      });

      key.addEventListener('mouseup', () => key.classList.remove('active'));
      key.addEventListener('mouseleave', () => key.classList.remove('active'));

      svg.appendChild(key);
      keys.push({ element: key, midiNote, isBlack: false });

      whiteKeyIndex++;
    });
  }

  // Black keys
  whiteKeyIndex = 0;
  for (let octave = startOctave; octave < startOctave + numOctaves; octave++) {
    const blackKeyPositions = [0, 1, 3, 4, 5]; // Positions after C, D, F, G, A

    blackKeyPositions.forEach((pos, i) => {
      const noteOffset = blackNotes[i];
      const midiNote = (octave + 1) * 12 + noteOffset;
      const x = (whiteKeyIndex + pos + 1) * whiteKeyWidth - blackKeyWidth / 2;
      const playable = isPlayable(midiNote, bansuriKey);

      const key = document.createElementNS(SVG_NS, 'rect');
      key.setAttribute('x', x);
      key.setAttribute('y', 0);
      key.setAttribute('width', blackKeyWidth);
      key.setAttribute('height', blackKeyHeight);
      key.setAttribute('fill', playable ? '#333333' : '#666666');
      key.setAttribute('stroke', '#000');
      key.setAttribute('stroke-width', 1);
      key.setAttribute('class', 'piano-key black-key');
      key.dataset.midi = midiNote;
      key.dataset.note = NOTES[noteOffset] + octave;

      if (!playable) {
        key.classList.add('not-playable');
      }

      key.addEventListener('mousedown', () => {
        if (playable) {
          key.classList.add('active');
          onNoteSelect(key.dataset.note, midiNote);
        }
      });

      key.addEventListener('mouseup', () => key.classList.remove('active'));
      key.addEventListener('mouseleave', () => key.classList.remove('active'));

      svg.appendChild(key);
      keys.push({ element: key, midiNote, isBlack: true });
    });

    whiteKeyIndex += 7;
  }

  wrapper.appendChild(svg);
  container.appendChild(wrapper);

  return {
    element: wrapper,
    svg,
    keys,
    updatePlayableNotes(newBansuriKey) {
      keys.forEach(({ element, midiNote, isBlack }) => {
        const playable = isPlayable(midiNote, newBansuriKey);
        element.classList.toggle('not-playable', !playable);

        if (isBlack) {
          element.setAttribute('fill', playable ? '#333333' : '#666666');
        } else {
          element.setAttribute('fill', playable ? '#ffffff' : '#cccccc');
        }
      });
    },
    highlightKey(midiNote) {
      keys.forEach(({ element, midiNote: keyMidi }) => {
        element.classList.toggle('highlighted', keyMidi === midiNote);
      });
    },
    clearHighlight() {
      keys.forEach(({ element }) => element.classList.remove('highlighted'));
    }
  };
}

/**
 * Create Indian note (Sargam) buttons
 * @param {HTMLElement} container - Container element
 * @param {Function} onNoteSelect - Callback when note is selected
 * @returns {object} Controller object
 */
function createSargamButtons(container, onNoteSelect) {
  const wrapper = document.createElement('div');
  wrapper.className = 'sargam-buttons-container';

  const notes = [
    { name: 'Sa', label: 'Sa', komal: false },
    { name: 'Komal Re', label: 're', komal: true },
    { name: 'Re', label: 'Re', komal: false },
    { name: 'Komal Ga', label: 'ga', komal: true },
    { name: 'Ga', label: 'Ga', komal: false },
    { name: 'Ma', label: 'Ma', komal: false },
    { name: 'Tivra Ma', label: 'Ma\'', komal: false, tivra: true },
    { name: 'Pa', label: 'Pa', komal: false },
    { name: 'Komal Dha', label: 'dha', komal: true },
    { name: 'Dha', label: 'Dha', komal: false },
    { name: 'Komal Ni', label: 'ni', komal: true },
    { name: 'Ni', label: 'Ni', komal: false }
  ];

  notes.forEach(({ name, label, komal, tivra }) => {
    const btn = document.createElement('button');
    btn.className = 'sargam-button';
    btn.textContent = label;
    btn.title = name;
    btn.dataset.sargam = name;

    if (komal) btn.classList.add('komal');
    if (tivra) btn.classList.add('tivra');

    btn.addEventListener('click', () => {
      wrapper.querySelectorAll('.sargam-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onNoteSelect(name);
    });

    wrapper.appendChild(btn);
  });

  container.appendChild(wrapper);

  return {
    element: wrapper,
    clearSelection() {
      wrapper.querySelectorAll('.sargam-button').forEach(b => b.classList.remove('active'));
    }
  };
}

/**
 * Create octave selector for Sargam input
 * @param {HTMLElement} container - Container element
 * @param {Function} onChange - Callback when octave changes
 * @returns {object} Controller object
 */
function createOctaveSelector(container, onChange) {
  const wrapper = document.createElement('div');
  wrapper.className = 'octave-selector-container';

  const label = document.createElement('label');
  label.textContent = 'Octave: ';

  const buttons = [];
  const octaves = [
    { value: -1, label: 'Low (Mandra)' },
    { value: 0, label: 'Mid (Madhya)' },
    { value: 1, label: 'High (Taar)' }
  ];

  octaves.forEach(({ value, label: text }, i) => {
    const btn = document.createElement('button');
    btn.className = 'octave-button';
    btn.textContent = text;
    btn.dataset.octave = value;

    if (i === 1) btn.classList.add('active'); // Middle octave default

    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(value);
    });

    buttons.push(btn);
    wrapper.appendChild(btn);
  });

  wrapper.insertBefore(label, wrapper.firstChild);
  container.appendChild(wrapper);

  return {
    element: wrapper,
    getOctave() {
      const active = wrapper.querySelector('.octave-button.active');
      return active ? parseInt(active.dataset.octave) : 0;
    },
    setOctave(value) {
      buttons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.octave) === value);
      });
    }
  };
}

/**
 * Create combined Sargam/Western note grid with saptak groupings
 * Three groups: Mandra, Madhya, Taar
 * @param {HTMLElement} container - Container element
 * @param {Function} onNoteSelect - Callback when note is selected
 * @param {object} options - Configuration options
 * @returns {object} Controller object
 */
function createCombinedNoteGrid(container, onNoteSelect, options = {}) {
  const { bansuriKey = 'G' } = options;

  // Define saptak groups with their notes
  const SAPTAK_GROUPS = [
    {
      name: 'Mandra',
      label: 'Mandra',
      notes: [
        { semitone: 7, sargam: 'Pa', label: 'Pa' },
        { semitone: 8, sargam: 'Komal Dha', label: 'dha', komal: true },
        { semitone: 9, sargam: 'Dha', label: 'Dha' },
        { semitone: 10, sargam: 'Komal Ni', label: 'ni', komal: true },
        { semitone: 11, sargam: 'Ni', label: 'Ni' }
      ]
    },
    {
      name: 'Madhya',
      label: 'Madhya',
      notes: [
        { semitone: 12, sargam: 'Sa', label: 'Sa' },
        { semitone: 13, sargam: 'Komal Re', label: 're', komal: true },
        { semitone: 14, sargam: 'Re', label: 'Re' },
        { semitone: 15, sargam: 'Komal Ga', label: 'ga', komal: true },
        { semitone: 16, sargam: 'Ga', label: 'Ga' },
        { semitone: 17, sargam: 'Ma', label: 'Ma' },
        { semitone: 18, sargam: 'Tivra Ma', label: "Ma'", tivra: true },
        { semitone: 19, sargam: 'Pa', label: 'Pa' },
        { semitone: 20, sargam: 'Komal Dha', label: 'dha', komal: true },
        { semitone: 21, sargam: 'Dha', label: 'Dha' },
        { semitone: 22, sargam: 'Komal Ni', label: 'ni', komal: true },
        { semitone: 23, sargam: 'Ni', label: 'Ni' }
      ]
    },
    {
      name: 'Taar',
      label: 'Taar',
      notes: [
        { semitone: 24, sargam: 'Sa', label: 'Sa' },
        { semitone: 25, sargam: 'Komal Re', label: 're', komal: true },
        { semitone: 26, sargam: 'Re', label: 'Re' },
        { semitone: 27, sargam: 'Komal Ga', label: 'ga', komal: true },
        { semitone: 28, sargam: 'Ga', label: 'Ga' },
        { semitone: 29, sargam: 'Ma', label: 'Ma' },
        { semitone: 30, sargam: 'Tivra Ma', label: "Ma'", tivra: true },
        { semitone: 31, sargam: 'Pa', label: 'Pa' }
      ]
    }
  ];

  const wrapper = document.createElement('div');
  wrapper.className = 'combined-note-grid';

  const saptakContainer = document.createElement('div');
  saptakContainer.className = 'saptak-groups';

  const allSargamButtons = [];
  const allWesternButtons = [];
  let currentBansuriKey = bansuriKey;

  // Helper to get Western note from MIDI
  function midiToNoteName(midi) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    return { note: noteNames[noteIndex], octave, full: noteNames[noteIndex] + octave };
  }

  // Create each saptak group
  SAPTAK_GROUPS.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'saptak-group';
    groupDiv.dataset.saptak = group.name.toLowerCase();

    const labelDiv = document.createElement('div');
    labelDiv.className = 'saptak-label';
    labelDiv.textContent = group.label;
    groupDiv.appendChild(labelDiv);

    const notesDiv = document.createElement('div');
    notesDiv.className = 'saptak-notes';

    const sargamRow = document.createElement('div');
    sargamRow.className = 'saptak-row sargam-row';

    const westernRow = document.createElement('div');
    westernRow.className = 'saptak-row western-row';

    group.notes.forEach(noteInfo => {
      const { semitone, sargam, label, komal, tivra } = noteInfo;

      // Sargam button
      const sargamBtn = document.createElement('button');
      sargamBtn.className = 'note-cell sargam-cell';
      sargamBtn.textContent = label;
      sargamBtn.title = sargam;
      sargamBtn.dataset.semitone = semitone;
      sargamBtn.dataset.sargam = sargam;

      if (komal) sargamBtn.classList.add('komal');
      if (tivra) sargamBtn.classList.add('tivra');

      // Western button
      const westernBtn = document.createElement('button');
      westernBtn.className = 'note-cell western-cell';
      westernBtn.dataset.semitone = semitone;

      // Calculate initial Western note
      const baseMidi = BANSURI_KEYS[currentBansuriKey];
      const midiNote = baseMidi + semitone;
      const western = midiToNoteName(midiNote);
      westernBtn.textContent = western.note;
      westernBtn.title = western.full;
      westernBtn.dataset.midi = midiNote;

      // Click handlers
      const handleClick = () => {
        // Clear previous selections
        allSargamButtons.forEach(b => b.classList.remove('active'));
        allWesternButtons.forEach(b => b.classList.remove('active'));

        // Highlight both corresponding buttons
        sargamBtn.classList.add('active');
        westernBtn.classList.add('active');

        // Get current MIDI note based on current key
        const currentBaseMidi = BANSURI_KEYS[currentBansuriKey];
        const currentMidiNote = currentBaseMidi + semitone;

        onNoteSelect(sargam, currentMidiNote, semitone);
      };

      sargamBtn.addEventListener('click', handleClick);
      westernBtn.addEventListener('click', handleClick);

      sargamRow.appendChild(sargamBtn);
      westernRow.appendChild(westernBtn);
      allSargamButtons.push(sargamBtn);
      allWesternButtons.push(westernBtn);
    });

    notesDiv.appendChild(sargamRow);
    notesDiv.appendChild(westernRow);
    groupDiv.appendChild(notesDiv);
    saptakContainer.appendChild(groupDiv);
  });

  wrapper.appendChild(saptakContainer);
  container.appendChild(wrapper);

  return {
    element: wrapper,

    updateWesternNotes(newBansuriKey) {
      currentBansuriKey = newBansuriKey;
      const baseMidi = BANSURI_KEYS[newBansuriKey];

      allWesternButtons.forEach(btn => {
        const semitone = parseInt(btn.dataset.semitone);
        const midiNote = baseMidi + semitone;
        const western = midiToNoteName(midiNote);
        btn.textContent = western.note;
        btn.title = western.full;
        btn.dataset.midi = midiNote;
      });
    },

    setActiveNote(semitone) {
      allSargamButtons.forEach(b => b.classList.remove('active'));
      allWesternButtons.forEach(b => b.classList.remove('active'));

      const sargamBtn = allSargamButtons.find(b => parseInt(b.dataset.semitone) === semitone);
      const westernBtn = allWesternButtons.find(b => parseInt(b.dataset.semitone) === semitone);

      if (sargamBtn) sargamBtn.classList.add('active');
      if (westernBtn) westernBtn.classList.add('active');
    },

    clearSelection() {
      allSargamButtons.forEach(b => b.classList.remove('active'));
      allWesternButtons.forEach(b => b.classList.remove('active'));
    },

    setHalfNotesVisible(visible) {
      // Toggle visibility on komal and tivra notes
      // Use visibility: hidden to maintain layout
      allSargamButtons.forEach(btn => {
        if (btn.classList.contains('komal') || btn.classList.contains('tivra')) {
          btn.classList.toggle('half-note-hidden', !visible);
        }
      });
      allWesternButtons.forEach((btn, i) => {
        // Western buttons don't have komal/tivra classes, so check corresponding sargam button
        const sargamBtn = allSargamButtons[i];
        if (sargamBtn && (sargamBtn.classList.contains('komal') || sargamBtn.classList.contains('tivra'))) {
          btn.classList.toggle('half-note-hidden', !visible);
        }
      });
    }
  };
}

// Export
export {
  createNoteButtons,
  createTextInput,
  createKeySelector,
  createPianoKeyboard,
  createSargamButtons,
  createOctaveSelector,
  createCombinedNoteGrid
};
