/**
 * Bansuri.js - Fingering Data Model
 * Maps notes to 6-hole bansuri fingering patterns
 *
 * Hole states: 0 = open, 1 = closed, 0.5 = half-closed
 * Holes are numbered 1-6 from blowhole end (left hand to right hand)
 */

// Hole state constants
const OPEN = 0;
const CLOSED = 1;
const HALF = 0.5;

// Indian note names (Sargam)
const SARGAM = {
  SA: 'Sa',
  KOMAL_RE: 'Komal Re',
  RE: 'Re',
  KOMAL_GA: 'Komal Ga',
  GA: 'Ga',
  MA: 'Ma',       // Shuddh Ma (Perfect 4th)
  TIVRA_MA: 'Tivra Ma', // Augmented 4th
  PA: 'Pa',
  KOMAL_DHA: 'Komal Dha',
  DHA: 'Dha',
  KOMAL_NI: 'Komal Ni',
  NI: 'Ni'
};

// Western note names
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Map semitones from Sa to fingering pattern
// The 6-hole bansuri naturally produces a Lydian scale with standard fingerings
// Half-hole techniques are used for chromatic notes
const FINGERING_PATTERNS = {
  // Semitones from Sa -> [hole1, hole2, hole3, hole4, hole5, hole6]
  0:  { holes: [CLOSED, CLOSED, CLOSED, OPEN, OPEN, OPEN], indian: SARGAM.SA },           // Sa - Tonic
  1:  { holes: [CLOSED, CLOSED, HALF, OPEN, OPEN, OPEN], indian: SARGAM.KOMAL_RE },       // Komal Re - minor 2nd
  2:  { holes: [CLOSED, CLOSED, OPEN, OPEN, OPEN, OPEN], indian: SARGAM.RE },             // Re - Major 2nd
  3:  { holes: [CLOSED, HALF, OPEN, OPEN, OPEN, OPEN], indian: SARGAM.KOMAL_GA },         // Komal Ga - minor 3rd
  4:  { holes: [CLOSED, OPEN, OPEN, OPEN, OPEN, OPEN], indian: SARGAM.GA },               // Ga - Major 3rd
  5:  { holes: [CLOSED, CLOSED, CLOSED, HALF, OPEN, OPEN], indian: SARGAM.MA },           // Shuddh Ma - Perfect 4th
  6:  { holes: [OPEN, OPEN, OPEN, OPEN, OPEN, OPEN], indian: SARGAM.TIVRA_MA },           // Tivra Ma - Augmented 4th
  7:  { holes: [CLOSED, CLOSED, CLOSED, CLOSED, CLOSED, CLOSED], indian: SARGAM.PA },     // Pa - Perfect 5th
  8:  { holes: [CLOSED, CLOSED, CLOSED, CLOSED, CLOSED, HALF], indian: SARGAM.KOMAL_DHA },// Komal Dha - minor 6th
  9:  { holes: [CLOSED, CLOSED, CLOSED, CLOSED, CLOSED, OPEN], indian: SARGAM.DHA },      // Dha - Major 6th
  10: { holes: [CLOSED, CLOSED, CLOSED, CLOSED, HALF, OPEN], indian: SARGAM.KOMAL_NI },   // Komal Ni - minor 7th
  11: { holes: [CLOSED, CLOSED, CLOSED, CLOSED, OPEN, OPEN], indian: SARGAM.NI }          // Ni - Major 7th
};

// Common bansuri keys and their base MIDI note numbers
// The key indicates what note Sa (tonic) corresponds to
const BANSURI_KEYS = {
  'C':  60,  // Middle C
  'C#': 61,
  'D':  62,
  'D#': 63,
  'E':  64,
  'F':  65,
  'F#': 66,
  'G':  67,  // Most common bansuri key
  'G#': 68,
  'A':  69,
  'A#': 70,
  'B':  71
};

// Octave names
const OCTAVES = {
  LOW: 'mandra',    // Low register - gentle breath
  MIDDLE: 'madhya', // Middle register - normal breath
  HIGH: 'taar'      // High register - strong breath/overblowing
};

/**
 * Get fingering for a specific MIDI note number
 * @param {number} midiNote - MIDI note number (0-127)
 * @param {string} bansuriKey - The key of the bansuri (default 'G')
 * @returns {object} Fingering information
 */
function getFingeringForMidi(midiNote, bansuriKey = 'G') {
  const saNote = BANSURI_KEYS[bansuriKey];

  // Calculate semitones from Sa
  const semitonesFromSa = midiNote - saNote;

  // Determine octave
  let octave;
  let normalizedSemitones = semitonesFromSa;

  if (semitonesFromSa < 0) {
    // Below lowest Sa - not playable
    return null;
  } else if (semitonesFromSa < 12) {
    octave = OCTAVES.LOW;
  } else if (semitonesFromSa < 24) {
    octave = OCTAVES.MIDDLE;
    normalizedSemitones = semitonesFromSa - 12;
  } else if (semitonesFromSa < 31) {
    // High octave goes up to about Pa (5th)
    octave = OCTAVES.HIGH;
    normalizedSemitones = semitonesFromSa - 24;
  } else {
    // Above playable range
    return null;
  }

  // Get fingering pattern
  const pattern = FINGERING_PATTERNS[normalizedSemitones];
  if (!pattern) return null;

  // Get Western note name
  const noteIndex = midiNote % 12;
  const octaveNumber = Math.floor(midiNote / 12) - 1;
  const westernNote = NOTES[noteIndex] + octaveNumber;

  return {
    midiNote,
    westernNote,
    indianNote: pattern.indian,
    octave,
    holes: [...pattern.holes],
    bansuriKey,
    semitonesFromSa: normalizedSemitones
  };
}

/**
 * Get fingering for a Western note name
 * @param {string} noteName - Note name like 'G4', 'C#5', 'Bb3'
 * @param {string} bansuriKey - The key of the bansuri
 * @returns {object} Fingering information
 */
function getFingeringForNote(noteName, bansuriKey = 'G') {
  const midiNote = noteNameToMidi(noteName);
  if (midiNote === null) return null;
  return getFingeringForMidi(midiNote, bansuriKey);
}

/**
 * Get fingering for an Indian note name
 * @param {string} indianNote - Indian note like 'Sa', 'Re', 'Komal Ga'
 * @param {number} octaveOffset - 0 for middle, -1 for low, +1 for high
 * @param {string} bansuriKey - The key of the bansuri
 * @returns {object} Fingering information
 */
function getFingeringForSargam(indianNote, octaveOffset = 0, bansuriKey = 'G') {
  // Find semitones for this Indian note
  let semitones = null;
  for (const [st, pattern] of Object.entries(FINGERING_PATTERNS)) {
    if (pattern.indian.toLowerCase() === indianNote.toLowerCase()) {
      semitones = parseInt(st);
      break;
    }
  }

  if (semitones === null) return null;

  // Calculate MIDI note
  const saNote = BANSURI_KEYS[bansuriKey];
  const midiNote = saNote + semitones + (octaveOffset + 1) * 12;

  return getFingeringForMidi(midiNote, bansuriKey);
}

/**
 * Convert Western note name to MIDI number
 * @param {string} noteName - Note name like 'G4', 'C#5', 'Bb3'
 * @returns {number|null} MIDI note number or null if invalid
 */
function noteNameToMidi(noteName) {
  // Parse note name
  const match = noteName.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;

  let note = match[1].toUpperCase();
  const accidental = match[2];
  const octave = parseInt(match[3]);

  // Find base note index
  const baseNotes = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
  let noteIndex = baseNotes[note];

  // Apply accidental
  if (accidental === '#') noteIndex += 1;
  if (accidental === 'b') noteIndex -= 1;

  // Handle wraparound
  noteIndex = ((noteIndex % 12) + 12) % 12;

  // Calculate MIDI note
  return (octave + 1) * 12 + noteIndex;
}

/**
 * Convert MIDI note number to frequency in Hz
 * @param {number} midiNote - MIDI note number
 * @returns {number} Frequency in Hz
 */
function midiToFrequency(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Get all playable notes for a given bansuri key
 * @param {string} bansuriKey - The key of the bansuri
 * @returns {Array} Array of playable note information
 */
function getPlayableRange(bansuriKey = 'G') {
  const saNote = BANSURI_KEYS[bansuriKey];
  const notes = [];

  // Low octave Sa to high octave Pa (about 2.5 octaves)
  // That's 12 + 12 + 7 = 31 semitones
  for (let i = 0; i < 31; i++) {
    const fingering = getFingeringForMidi(saNote + i, bansuriKey);
    if (fingering) {
      fingering.frequency = midiToFrequency(fingering.midiNote);
      notes.push(fingering);
    }
  }

  return notes;
}

/**
 * Check if a note is playable on the bansuri
 * @param {number} midiNote - MIDI note number
 * @param {string} bansuriKey - The key of the bansuri
 * @returns {boolean} True if playable
 */
function isPlayable(midiNote, bansuriKey = 'G') {
  return getFingeringForMidi(midiNote, bansuriKey) !== null;
}

// Export for use in other modules
export {
  OPEN,
  CLOSED,
  HALF,
  SARGAM,
  NOTES,
  FINGERING_PATTERNS,
  BANSURI_KEYS,
  OCTAVES,
  getFingeringForMidi,
  getFingeringForNote,
  getFingeringForSargam,
  noteNameToMidi,
  midiToFrequency,
  getPlayableRange,
  isPlayable
};
