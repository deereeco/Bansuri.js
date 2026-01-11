/**
 * Flute Finder - Note Label System
 * Positions and manages note labels around horizontal bansuri
 */

import { BANSURI_KEYS, FINGERING_PATTERNS, midiToNoteName } from './fingering-data.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Note positioning configuration
 * Maps each semitone (0-11) to its visual position relative to holes
 */
const NOTE_POSITIONS = {
  // Semitone: { holeIndex, offsetX, position, isChromatic }
  0:  { hole: 2, offset: 0,  position: 'below', chromatic: false },  // Sa (C)
  1:  { hole: 2, offset: 0,  position: 'above', chromatic: true },   // Komal Re (C#)
  2:  { hole: 1, offset: 0,  position: 'below', chromatic: false },  // Re (D)
  3:  { hole: 1, offset: 0,  position: 'above', chromatic: true },   // Komal Ga (D#)
  4:  { hole: 0, offset: 0,  position: 'below', chromatic: false },  // Ga (E)
  5:  { hole: 0, offset: 0,  position: 'above', chromatic: true },   // Ma (F) - half on L1
  6:  { hole: -1, offset: 0, position: 'below', chromatic: false },  // Tivra Ma (F#) - all open, at blowhole
  7:  { hole: 5, offset: 20, position: 'below', chromatic: false },  // Pa (G) - all closed, past R3
  8:  { hole: 5, offset: 0,  position: 'above', chromatic: true },   // Komal Dha (G#)
  9:  { hole: 5, offset: 0,  position: 'below', chromatic: false },  // Dha (A)
  10: { hole: 4, offset: 0,  position: 'above', chromatic: true },   // Komal Ni (A#)
  11: { hole: 4, offset: 0,  position: 'below', chromatic: false }   // Ni (B)
};

/**
 * Create note labels around horizontal bansuri
 * @param {SVGElement} svg - The bansuri SVG element
 * @param {Array} holes - Array of hole objects with x positions
 * @param {object} config - Bansuri configuration
 * @param {string} bansuriKey - Current bansuri key
 * @returns {object} Controller with update and highlight methods
 */
export function createNoteLabels(svg, holes, config, bansuriKey) {
  const labelGroup = document.createElementNS(SVG_NS, 'g');
  labelGroup.setAttribute('class', 'note-labels-group');

  const labels = {}; // Map semitone to label element
  const centerY = config.height / 2;
  const labelOffsetY = 45; // Distance from center line
  const blowholeX = 60; // Blowhole x position

  // Create label for each semitone (0-11)
  for (let semitone = 0; semitone < 12; semitone++) {
    const posInfo = NOTE_POSITIONS[semitone];
    const fingering = FINGERING_PATTERNS[semitone];

    // Calculate x position based on hole position
    let x;
    if (posInfo.hole === -1) {
      // Special case: Tivra Ma at blowhole
      x = blowholeX;
    } else {
      // Use hole x-position plus offset
      x = holes[posInfo.hole].x + posInfo.offset;
    }

    // Calculate y position (above or below)
    const y = posInfo.position === 'above'
      ? centerY - labelOffsetY
      : centerY + labelOffsetY;

    // Get Western note name for current key
    const baseMidi = BANSURI_KEYS[bansuriKey];
    const midiNote = baseMidi + semitone;
    const westernNote = midiToNoteName(midiNote).replace(/\d/g, ''); // Remove octave number

    // Create text element
    const text = createLabelText(x, y, westernNote, fingering.indian, semitone, posInfo.chromatic);
    labels[semitone] = text;
    labelGroup.appendChild(text);
  }

  svg.appendChild(labelGroup);

  // Controller API
  return {
    labelGroup,
    labels,

    /**
     * Update note names when bansuri key changes
     * @param {string} newBansuriKey - New key (C-B)
     */
    updateKey(newBansuriKey) {
      for (let semitone = 0; semitone < 12; semitone++) {
        const baseMidi = BANSURI_KEYS[newBansuriKey];
        const midiNote = baseMidi + semitone;
        const westernNote = midiToNoteName(midiNote).replace(/\d/g, ''); // Remove octave number
        labels[semitone].textContent = westernNote;
      }
    },

    /**
     * Highlight specified notes
     * @param {Array<number>} semitones - Array of semitone values (0-11)
     */
    highlightNotes(semitones) {
      // Clear all highlights first
      this.clearHighlights();

      // Highlight specified notes
      semitones.forEach(semitone => {
        if (labels[semitone]) {
          labels[semitone].classList.add('highlighted');
        }
      });
    },

    /**
     * Clear all highlights
     */
    clearHighlights() {
      Object.values(labels).forEach(label => {
        label.classList.remove('highlighted');
      });
    }
  };
}

/**
 * Create a note label text element
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} westernNote - Western note name (e.g., "C", "C#")
 * @param {string} indianNote - Indian note name (for tooltip)
 * @param {number} semitone - Semitone value (0-11)
 * @param {boolean} isChromatic - Whether this is a chromatic note
 * @returns {SVGTextElement}
 */
function createLabelText(x, y, westernNote, indianNote, semitone, isChromatic) {
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', x);
  text.setAttribute('y', y);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('class', isChromatic ? 'note-label chromatic' : 'note-label');
  text.dataset.semitone = semitone;
  text.dataset.indian = indianNote;
  text.textContent = westernNote;

  // Add title for tooltip
  const title = document.createElementNS(SVG_NS, 'title');
  title.textContent = indianNote;
  text.appendChild(title);

  return text;
}

/**
 * Parse user input and extract note names
 * Supports formats: "c,d,e", "c d e", "C#,D,E", "c# d e"
 * @param {string} input - User input string
 * @returns {Array<string>} Array of normalized note names (without octave)
 */
export function parseNoteInput(input) {
  if (!input || typeof input !== 'string') return [];

  // Split by comma, space, or combination
  const parts = input.split(/[,\s]+/).map(s => s.trim()).filter(s => s);

  const notes = [];
  for (const part of parts) {
    // Normalize to uppercase with optional #/b
    const normalized = part.toUpperCase()
      .replace(/♯/g, '#')
      .replace(/♭/g, 'b');

    // Validate note name (C-B with optional # or b)
    if (/^[A-G][#b]?$/.test(normalized)) {
      notes.push(normalized);
    }
  }

  return notes;
}

/**
 * Convert note name (without octave) to semitone from Sa
 * @param {string} noteName - Note name like "C", "C#", "Db"
 * @param {string} bansuriKey - Current bansuri key (Sa)
 * @returns {number|null} Semitone 0-11, or null if not found
 */
export function noteNameToSemitone(noteName, bansuriKey) {
  // Map note names to chromatic indices (0-11)
  const noteMap = {
    'C': 0, 'C#': 1, 'DB': 1,
    'D': 2, 'D#': 3, 'EB': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'GB': 6,
    'G': 7, 'G#': 8, 'AB': 8,
    'A': 9, 'A#': 10, 'BB': 10,
    'B': 11
  };

  const noteIndex = noteMap[noteName.toUpperCase()];
  if (noteIndex === undefined) return null;

  // Get Sa's note index
  const saIndex = BANSURI_KEYS[bansuriKey] % 12;

  // Calculate semitone offset from Sa
  let semitone = noteIndex - saIndex;
  if (semitone < 0) semitone += 12;

  return semitone;
}
