/**
 * Bansuri.js - Practice Patterns (Paltas/Alankars)
 * Traditional Indian classical music practice exercises
 */

import { BANSURI_KEYS } from './fingering-data.js';

/**
 * Pattern data structure:
 * - id: unique identifier
 * - name: display name
 * - category: Beginner, Intermediate, or Advanced
 * - description: explanation of the pattern
 * - tempo: suggested default BPM
 * - notes: array of { semitone, beats }
 *   - semitone: offset from madhya Sa (0-11)
 *   - beats: duration in beat units
 */

export const PRACTICE_PATTERNS = [
  // Beginner patterns (5 to start)
  {
    id: 'basic-ascent-4',
    name: 'Basic 4-Note Ascent',
    category: 'Beginner',
    description: 'Sa Re Ga Ma, Re Ga Ma Pa, Ga Ma Pa Dha. Progressive 4-note ascending pattern - the foundation of Palta practice.',
    tempo: 80,
    notes: [
      // Sa Re Ga Ma
      { semitone: 0, beats: 1 },   // Sa
      { semitone: 2, beats: 1 },   // Re
      { semitone: 4, beats: 1 },   // Ga
      { semitone: 5, beats: 1 },   // Ma
      // Re Ga Ma Pa
      { semitone: 2, beats: 1 },   // Re
      { semitone: 4, beats: 1 },   // Ga
      { semitone: 5, beats: 1 },   // Ma
      { semitone: 7, beats: 1 },   // Pa
      // Ga Ma Pa Dha
      { semitone: 4, beats: 1 },   // Ga
      { semitone: 5, beats: 1 },   // Ma
      { semitone: 7, beats: 1 },   // Pa
      { semitone: 9, beats: 1 },   // Dha
      // Ma Pa Dha Ni
      { semitone: 5, beats: 1 },   // Ma
      { semitone: 7, beats: 1 },   // Pa
      { semitone: 9, beats: 1 },   // Dha
      { semitone: 11, beats: 1 },  // Ni
      // Pa Dha Ni Sa'
      { semitone: 7, beats: 1 },   // Pa
      { semitone: 9, beats: 1 },   // Dha
      { semitone: 11, beats: 1 },  // Ni
      { semitone: 12, beats: 2 },  // Sa' (upper octave, held longer)
    ]
  },

  {
    id: 'returning-2note',
    name: 'Returning 2-Note Pattern',
    category: 'Beginner',
    description: 'Sa Re Sa Re, Re Ga Re Ga, Ga Ma Ga Ma... Each note returns to the previous, building muscle memory.',
    tempo: 100,
    notes: [
      // Sa Re Sa Re
      { semitone: 0, beats: 1 }, { semitone: 2, beats: 1 },
      { semitone: 0, beats: 1 }, { semitone: 2, beats: 1 },
      // Re Ga Re Ga
      { semitone: 2, beats: 1 }, { semitone: 4, beats: 1 },
      { semitone: 2, beats: 1 }, { semitone: 4, beats: 1 },
      // Ga Ma Ga Ma
      { semitone: 4, beats: 1 }, { semitone: 5, beats: 1 },
      { semitone: 4, beats: 1 }, { semitone: 5, beats: 1 },
      // Ma Pa Ma Pa
      { semitone: 5, beats: 1 }, { semitone: 7, beats: 1 },
      { semitone: 5, beats: 1 }, { semitone: 7, beats: 1 },
      // Pa Dha Pa Dha
      { semitone: 7, beats: 1 }, { semitone: 9, beats: 1 },
      { semitone: 7, beats: 1 }, { semitone: 9, beats: 1 },
      // Dha Ni Dha Ni
      { semitone: 9, beats: 1 }, { semitone: 11, beats: 1 },
      { semitone: 9, beats: 1 }, { semitone: 11, beats: 1 },
      // Ni Sa' Ni Sa'
      { semitone: 11, beats: 1 }, { semitone: 12, beats: 1 },
      { semitone: 11, beats: 1 }, { semitone: 12, beats: 2 },
    ]
  },

  {
    id: 'full-scale-ascending',
    name: 'Full Ascending Scale',
    category: 'Beginner',
    description: 'Sa Re Ga Ma Pa Dha Ni Sa. Complete ascending major scale - builds familiarity with all natural notes.',
    tempo: 80,
    notes: [
      { semitone: 0, beats: 1 },   // Sa
      { semitone: 2, beats: 1 },   // Re
      { semitone: 4, beats: 1 },   // Ga
      { semitone: 5, beats: 1 },   // Ma
      { semitone: 7, beats: 1 },   // Pa
      { semitone: 9, beats: 1 },   // Dha
      { semitone: 11, beats: 1 },  // Ni
      { semitone: 12, beats: 2 },  // Sa' (held longer)
    ]
  },

  {
    id: 'full-scale-descending',
    name: 'Full Descending Scale',
    category: 'Beginner',
    description: 'Sa Ni Dha Pa Ma Ga Re Sa. Complete descending major scale - complements the ascending practice.',
    tempo: 80,
    notes: [
      { semitone: 12, beats: 1 },  // Sa' (upper octave)
      { semitone: 11, beats: 1 },  // Ni
      { semitone: 9, beats: 1 },   // Dha
      { semitone: 7, beats: 1 },   // Pa
      { semitone: 5, beats: 1 },   // Ma
      { semitone: 4, beats: 1 },   // Ga
      { semitone: 2, beats: 1 },   // Re
      { semitone: 0, beats: 2 },   // Sa (held longer)
    ]
  },

  {
    id: 'slow-tonic',
    name: 'Slow Tonic (Sa) Practice',
    category: 'Beginner',
    description: 'Sa Sa Sa Sa Sa Sa Sa Sa. Sustained tonic note practice for breath control and tone quality. Hold each note steady.',
    tempo: 60,
    notes: [
      { semitone: 0, beats: 2 },
      { semitone: 0, beats: 2 },
      { semitone: 0, beats: 2 },
      { semitone: 0, beats: 2 },
      { semitone: 0, beats: 2 },
      { semitone: 0, beats: 2 },
      { semitone: 0, beats: 2 },
      { semitone: 0, beats: 4 },  // Final Sa held longer
    ]
  },

  {
    id: 'basic-descent-4',
    name: 'Basic 4-Note Descent',
    category: 'Beginner',
    description: 'Sa Ni Dha Pa, Ni Dha Pa Ma, Dha Pa Ma Ga. Progressive 4-note descending pattern - complements ascending practice.',
    tempo: 80,
    notes: [
      // Sa Ni Dha Pa (from upper Sa)
      { semitone: 12, beats: 1 },  // Sa'
      { semitone: 11, beats: 1 },  // Ni
      { semitone: 9, beats: 1 },   // Dha
      { semitone: 7, beats: 1 },   // Pa
      // Ni Dha Pa Ma
      { semitone: 11, beats: 1 },  // Ni
      { semitone: 9, beats: 1 },   // Dha
      { semitone: 7, beats: 1 },   // Pa
      { semitone: 5, beats: 1 },   // Ma
      // Dha Pa Ma Ga
      { semitone: 9, beats: 1 },   // Dha
      { semitone: 7, beats: 1 },   // Pa
      { semitone: 5, beats: 1 },   // Ma
      { semitone: 4, beats: 1 },   // Ga
      // Pa Ma Ga Re
      { semitone: 7, beats: 1 },   // Pa
      { semitone: 5, beats: 1 },   // Ma
      { semitone: 4, beats: 1 },   // Ga
      { semitone: 2, beats: 1 },   // Re
      // Ma Ga Re Sa
      { semitone: 5, beats: 1 },   // Ma
      { semitone: 4, beats: 1 },   // Ga
      { semitone: 2, beats: 1 },   // Re
      { semitone: 0, beats: 2 },   // Sa (held longer)
    ]
  },

  {
    id: 'simple-3note',
    name: 'Simple 3-Note Groups',
    category: 'Beginner',
    description: 'Sa Re Ga, Re Ga Ma, Ga Ma Pa... Three-note ascending groups - shorter phrases for beginners.',
    tempo: 90,
    notes: [
      // Sa Re Ga
      { semitone: 0, beats: 1 }, { semitone: 2, beats: 1 }, { semitone: 4, beats: 1 },
      // Re Ga Ma
      { semitone: 2, beats: 1 }, { semitone: 4, beats: 1 }, { semitone: 5, beats: 1 },
      // Ga Ma Pa
      { semitone: 4, beats: 1 }, { semitone: 5, beats: 1 }, { semitone: 7, beats: 1 },
      // Ma Pa Dha
      { semitone: 5, beats: 1 }, { semitone: 7, beats: 1 }, { semitone: 9, beats: 1 },
      // Pa Dha Ni
      { semitone: 7, beats: 1 }, { semitone: 9, beats: 1 }, { semitone: 11, beats: 1 },
      // Dha Ni Sa'
      { semitone: 9, beats: 1 }, { semitone: 11, beats: 1 }, { semitone: 12, beats: 2 },
    ]
  },

  {
    id: 'pa-practice',
    name: 'Pa (Fifth) Practice',
    category: 'Beginner',
    description: 'Pa Pa Pa Pa Pa Pa Pa Pa. Sustained Pa note practice - important for establishing the fifth. Focus on steady tone.',
    tempo: 60,
    notes: [
      { semitone: 7, beats: 2 },
      { semitone: 7, beats: 2 },
      { semitone: 7, beats: 2 },
      { semitone: 7, beats: 2 },
      { semitone: 7, beats: 2 },
      { semitone: 7, beats: 2 },
      { semitone: 7, beats: 2 },
      { semitone: 7, beats: 4 },  // Final Pa held longer
    ]
  },

  // Intermediate patterns
  {
    id: '5note-groups',
    name: '5-Note Ascending Groups',
    category: 'Intermediate',
    description: 'Sa Re Ga Ma Pa, Re Ga Ma Pa Dha, Ga Ma Pa Dha Ni. Five-note progressive groups - builds stamina and fluidity.',
    tempo: 90,
    notes: [
      // Sa Re Ga Ma Pa
      { semitone: 0, beats: 0.75 }, { semitone: 2, beats: 0.75 }, { semitone: 4, beats: 0.75 },
      { semitone: 5, beats: 0.75 }, { semitone: 7, beats: 1 },
      // Re Ga Ma Pa Dha
      { semitone: 2, beats: 0.75 }, { semitone: 4, beats: 0.75 }, { semitone: 5, beats: 0.75 },
      { semitone: 7, beats: 0.75 }, { semitone: 9, beats: 1 },
      // Ga Ma Pa Dha Ni
      { semitone: 4, beats: 0.75 }, { semitone: 5, beats: 0.75 }, { semitone: 7, beats: 0.75 },
      { semitone: 9, beats: 0.75 }, { semitone: 11, beats: 1 },
      // Ma Pa Dha Ni Sa'
      { semitone: 5, beats: 0.75 }, { semitone: 7, beats: 0.75 }, { semitone: 9, beats: 0.75 },
      { semitone: 11, beats: 0.75 }, { semitone: 12, beats: 2 },
    ]
  },

  {
    id: 'reverse-groups',
    name: 'Reverse 4-Note Groups',
    category: 'Intermediate',
    description: 'Ma Ga Re Sa, Pa Ma Ga Re, Dha Pa Ma Ga. Descending groups starting from different notes - challenges finger patterns.',
    tempo: 85,
    notes: [
      // Ma Ga Re Sa
      { semitone: 5, beats: 1 }, { semitone: 4, beats: 1 }, { semitone: 2, beats: 1 }, { semitone: 0, beats: 1 },
      // Pa Ma Ga Re
      { semitone: 7, beats: 1 }, { semitone: 5, beats: 1 }, { semitone: 4, beats: 1 }, { semitone: 2, beats: 1 },
      // Dha Pa Ma Ga
      { semitone: 9, beats: 1 }, { semitone: 7, beats: 1 }, { semitone: 5, beats: 1 }, { semitone: 4, beats: 1 },
      // Ni Dha Pa Ma
      { semitone: 11, beats: 1 }, { semitone: 9, beats: 1 }, { semitone: 7, beats: 1 }, { semitone: 5, beats: 1 },
      // Sa' Ni Dha Pa
      { semitone: 12, beats: 1 }, { semitone: 11, beats: 1 }, { semitone: 9, beats: 1 }, { semitone: 7, beats: 2 },
    ]
  },

  {
    id: 'skip-patterns',
    name: 'Skip Interval Pattern',
    category: 'Intermediate',
    description: 'Sa Ga Pa Sa, Re Ma Dha Re, Ga Pa Ni Ga. Skipping notes builds agility and interval recognition.',
    tempo: 80,
    notes: [
      // Sa Ga Pa Sa
      { semitone: 0, beats: 1 }, { semitone: 4, beats: 1 }, { semitone: 7, beats: 1 }, { semitone: 0, beats: 1 },
      // Re Ma Dha Re
      { semitone: 2, beats: 1 }, { semitone: 5, beats: 1 }, { semitone: 9, beats: 1 }, { semitone: 2, beats: 1 },
      // Ga Pa Ni Ga
      { semitone: 4, beats: 1 }, { semitone: 7, beats: 1 }, { semitone: 11, beats: 1 }, { semitone: 4, beats: 1 },
      // Ma Dha Sa' Ma
      { semitone: 5, beats: 1 }, { semitone: 9, beats: 1 }, { semitone: 12, beats: 1 }, { semitone: 5, beats: 1 },
      // Pa Ni Re' Pa
      { semitone: 7, beats: 1 }, { semitone: 11, beats: 1 }, { semitone: 14, beats: 1 }, { semitone: 7, beats: 2 },
    ]
  },

  {
    id: 'octave-jumps',
    name: 'Octave Jump Exercise',
    category: 'Intermediate',
    description: 'Sa Sa\' Sa Sa\', Re Re\' Re Re\'... Jumping octaves builds breath control and register transitions.',
    tempo: 70,
    notes: [
      // Sa Sa' Sa Sa'
      { semitone: 0, beats: 1 }, { semitone: 12, beats: 1 }, { semitone: 0, beats: 1 }, { semitone: 12, beats: 1 },
      // Re Re' Re Re'
      { semitone: 2, beats: 1 }, { semitone: 14, beats: 1 }, { semitone: 2, beats: 1 }, { semitone: 14, beats: 1 },
      // Ga Ga' Ga Ga'
      { semitone: 4, beats: 1 }, { semitone: 16, beats: 1 }, { semitone: 4, beats: 1 }, { semitone: 16, beats: 1 },
      // Ma Ma' Ma Ma'
      { semitone: 5, beats: 1 }, { semitone: 17, beats: 1 }, { semitone: 5, beats: 1 }, { semitone: 17, beats: 1 },
      // Pa Pa' Pa Pa'
      { semitone: 7, beats: 1 }, { semitone: 19, beats: 1 }, { semitone: 7, beats: 1 }, { semitone: 19, beats: 2 },
    ]
  },

  {
    id: 'pendulum',
    name: 'Pendulum Pattern',
    category: 'Intermediate',
    description: 'Sa Re Ga Ma Ga Re, Re Ga Ma Pa Ma Ga. Swinging pattern that ascends then returns - develops smooth direction changes.',
    tempo: 85,
    notes: [
      // Sa Re Ga Ma Ga Re
      { semitone: 0, beats: 0.75 }, { semitone: 2, beats: 0.75 }, { semitone: 4, beats: 0.75 },
      { semitone: 5, beats: 0.75 }, { semitone: 4, beats: 0.75 }, { semitone: 2, beats: 0.75 },
      // Re Ga Ma Pa Ma Ga
      { semitone: 2, beats: 0.75 }, { semitone: 4, beats: 0.75 }, { semitone: 5, beats: 0.75 },
      { semitone: 7, beats: 0.75 }, { semitone: 5, beats: 0.75 }, { semitone: 4, beats: 0.75 },
      // Ga Ma Pa Dha Pa Ma
      { semitone: 4, beats: 0.75 }, { semitone: 5, beats: 0.75 }, { semitone: 7, beats: 0.75 },
      { semitone: 9, beats: 0.75 }, { semitone: 7, beats: 0.75 }, { semitone: 5, beats: 0.75 },
      // Ma Pa Dha Ni Dha Pa
      { semitone: 5, beats: 0.75 }, { semitone: 7, beats: 0.75 }, { semitone: 9, beats: 0.75 },
      { semitone: 11, beats: 0.75 }, { semitone: 9, beats: 0.75 }, { semitone: 7, beats: 1 },
    ]
  },

  {
    id: 'chromatic',
    name: 'Chromatic Scale Practice',
    category: 'Intermediate',
    description: 'Sa komal-Re Re komal-Ga Ga Ma tivra-Ma... All 12 semitones - introduces half-hole fingerings.',
    tempo: 70,
    notes: [
      { semitone: 0, beats: 1 },   // Sa
      { semitone: 1, beats: 1 },   // komal Re
      { semitone: 2, beats: 1 },   // Re
      { semitone: 3, beats: 1 },   // komal Ga
      { semitone: 4, beats: 1 },   // Ga
      { semitone: 5, beats: 1 },   // Ma
      { semitone: 6, beats: 1 },   // tivra Ma
      { semitone: 7, beats: 1 },   // Pa
      { semitone: 8, beats: 1 },   // komal Dha
      { semitone: 9, beats: 1 },   // Dha
      { semitone: 10, beats: 1 },  // komal Ni
      { semitone: 11, beats: 1 },  // Ni
      { semitone: 12, beats: 2 },  // Sa'
    ]
  },

  // Advanced patterns
  {
    id: 'fast-triplets',
    name: 'Fast Triplet Pattern',
    category: 'Advanced',
    description: 'Sa Re Ga Sa Re Ga Sa Re Ga... Rapid triplet groups ascending the scale - builds speed and evenness.',
    tempo: 120,
    notes: [
      // Sa Re Ga repeated ascending
      { semitone: 0, beats: 0.5 }, { semitone: 2, beats: 0.5 }, { semitone: 4, beats: 0.5 },
      { semitone: 0, beats: 0.5 }, { semitone: 2, beats: 0.5 }, { semitone: 4, beats: 0.5 },
      // Re Ga Ma
      { semitone: 2, beats: 0.5 }, { semitone: 4, beats: 0.5 }, { semitone: 5, beats: 0.5 },
      { semitone: 2, beats: 0.5 }, { semitone: 4, beats: 0.5 }, { semitone: 5, beats: 0.5 },
      // Ga Ma Pa
      { semitone: 4, beats: 0.5 }, { semitone: 5, beats: 0.5 }, { semitone: 7, beats: 0.5 },
      { semitone: 4, beats: 0.5 }, { semitone: 5, beats: 0.5 }, { semitone: 7, beats: 0.5 },
      // Ma Pa Dha
      { semitone: 5, beats: 0.5 }, { semitone: 7, beats: 0.5 }, { semitone: 9, beats: 0.5 },
      { semitone: 5, beats: 0.5 }, { semitone: 7, beats: 0.5 }, { semitone: 9, beats: 0.5 },
      // Pa Dha Ni
      { semitone: 7, beats: 0.5 }, { semitone: 9, beats: 0.5 }, { semitone: 11, beats: 0.5 },
      { semitone: 7, beats: 0.5 }, { semitone: 9, beats: 0.5 }, { semitone: 11, beats: 0.5 },
      // Dha Ni Sa'
      { semitone: 9, beats: 0.5 }, { semitone: 11, beats: 0.5 }, { semitone: 12, beats: 0.5 },
      { semitone: 9, beats: 0.5 }, { semitone: 11, beats: 0.5 }, { semitone: 12, beats: 2 },
    ]
  },

  {
    id: 'complex-ascending',
    name: 'Complex Ascending Palta',
    category: 'Advanced',
    description: 'Sa Re Ga Ma Pa Ma Ga Re, Re Ga Ma Pa Dha Pa Ma Ga... Advanced pattern with direction reversals.',
    tempo: 90,
    notes: [
      // Sa Re Ga Ma Pa Ma Ga Re
      { semitone: 0, beats: 0.75 }, { semitone: 2, beats: 0.75 }, { semitone: 4, beats: 0.75 }, { semitone: 5, beats: 0.75 },
      { semitone: 7, beats: 0.75 }, { semitone: 5, beats: 0.75 }, { semitone: 4, beats: 0.75 }, { semitone: 2, beats: 0.75 },
      // Re Ga Ma Pa Dha Pa Ma Ga
      { semitone: 2, beats: 0.75 }, { semitone: 4, beats: 0.75 }, { semitone: 5, beats: 0.75 }, { semitone: 7, beats: 0.75 },
      { semitone: 9, beats: 0.75 }, { semitone: 7, beats: 0.75 }, { semitone: 5, beats: 0.75 }, { semitone: 4, beats: 0.75 },
      // Ga Ma Pa Dha Ni Dha Pa Ma
      { semitone: 4, beats: 0.75 }, { semitone: 5, beats: 0.75 }, { semitone: 7, beats: 0.75 }, { semitone: 9, beats: 0.75 },
      { semitone: 11, beats: 0.75 }, { semitone: 9, beats: 0.75 }, { semitone: 7, beats: 0.75 }, { semitone: 5, beats: 1 },
    ]
  },

  {
    id: 'taan-simulation',
    name: 'Taan Simulation',
    category: 'Advanced',
    description: 'Sa Re Sa Ga Sa Ma Sa Pa Sa Ma Sa Ga Sa Re Sa. Rapid taan-like pattern returning to Sa - mimics classical improvisation.',
    tempo: 110,
    notes: [
      { semitone: 0, beats: 0.5 }, { semitone: 2, beats: 0.5 }, { semitone: 0, beats: 0.5 }, { semitone: 4, beats: 0.5 },
      { semitone: 0, beats: 0.5 }, { semitone: 5, beats: 0.5 }, { semitone: 0, beats: 0.5 }, { semitone: 7, beats: 0.5 },
      { semitone: 0, beats: 0.5 }, { semitone: 9, beats: 0.5 }, { semitone: 0, beats: 0.5 }, { semitone: 11, beats: 0.5 },
      { semitone: 0, beats: 0.5 }, { semitone: 12, beats: 0.5 }, { semitone: 0, beats: 0.5 }, { semitone: 12, beats: 0.5 },
      { semitone: 0, beats: 0.5 }, { semitone: 11, beats: 0.5 }, { semitone: 0, beats: 0.5 }, { semitone: 9, beats: 0.5 },
      { semitone: 0, beats: 0.5 }, { semitone: 7, beats: 0.5 }, { semitone: 0, beats: 0.5 }, { semitone: 5, beats: 0.5 },
      { semitone: 0, beats: 0.5 }, { semitone: 4, beats: 0.5 }, { semitone: 0, beats: 0.5 }, { semitone: 2, beats: 0.5 },
      { semitone: 0, beats: 2 },
    ]
  },

  {
    id: 'full-range',
    name: 'Full Range Exercise',
    category: 'Advanced',
    description: 'Mandra Pa through Taar Pa. Complete playable range of the bansuri - ultimate breath and control challenge.',
    tempo: 75,
    notes: [
      // Start from mandra Pa (semitone -5 from madhya Sa)
      { semitone: -5, beats: 1 },  // Mandra Pa
      { semitone: -3, beats: 1 },  // Mandra Dha
      { semitone: -1, beats: 1 },  // Mandra Ni
      // Madhya octave
      { semitone: 0, beats: 1 },   // Sa
      { semitone: 2, beats: 1 },   // Re
      { semitone: 4, beats: 1 },   // Ga
      { semitone: 5, beats: 1 },   // Ma
      { semitone: 7, beats: 1 },   // Pa
      { semitone: 9, beats: 1 },   // Dha
      { semitone: 11, beats: 1 },  // Ni
      // Taar octave
      { semitone: 12, beats: 1 },  // Taar Sa
      { semitone: 14, beats: 1 },  // Taar Re
      { semitone: 16, beats: 1 },  // Taar Ga
      { semitone: 17, beats: 1 },  // Taar Ma
      { semitone: 19, beats: 2 },  // Taar Pa (held longer)
    ]
  }
];

/**
 * Convert a practice pattern to a timed MIDI note sequence
 * @param {object} pattern - Pattern object from PRACTICE_PATTERNS
 * @param {number} bpm - Beats per minute (tempo)
 * @param {string} bansuriKey - Bansuri key (e.g., 'G')
 * @param {number} octaveShift - Octave shift (-2 to +2)
 * @returns {Array} Array of note events: { midiNote, startTime, duration, semitone, beats }
 */
export function patternToNoteSequence(pattern, bpm, bansuriKey, octaveShift = 0) {
  if (!pattern || !pattern.notes || pattern.notes.length === 0) {
    return [];
  }

  const baseMidi = BANSURI_KEYS[bansuriKey];
  if (baseMidi === undefined) {
    console.error(`Invalid bansuri key: ${bansuriKey}`);
    return [];
  }

  const shiftSemitones = octaveShift * 12;
  const beatDuration = (60 / bpm) * 1000; // ms per beat

  let currentTime = 0;
  const sequence = [];

  for (const noteSpec of pattern.notes) {
    // Base note in madhya octave (add 12 to semitone to get madhya)
    const madhyaSemitone = noteSpec.semitone + 12;
    const midiNote = baseMidi + madhyaSemitone + shiftSemitones;
    const duration = noteSpec.beats * beatDuration;

    sequence.push({
      midiNote,
      startTime: currentTime,
      duration,
      semitone: noteSpec.semitone,  // Original semitone for reference
      beats: noteSpec.beats
    });

    currentTime += duration;
  }

  return sequence;
}

/**
 * Get pattern by ID
 * @param {string} id - Pattern ID
 * @returns {object|null} Pattern object or null if not found
 */
export function getPatternById(id) {
  return PRACTICE_PATTERNS.find(p => p.id === id) || null;
}

/**
 * Get patterns by category
 * @param {string} category - Category name
 * @returns {Array} Array of patterns in that category
 */
export function getPatternsByCategory(category) {
  return PRACTICE_PATTERNS.filter(p => p.category === category);
}
