# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bansuri.js is an interactive web application for learning and visualizing 6-hole Indian bamboo flute (bansuri) fingering patterns. The application demonstrates the relationship between Western musical notation, Indian classical music (Sargam), and bansuri fingering positions across multiple input modes.

## Development Commands

This is a vanilla JavaScript project served via static files. No build step is required.

**Local development:**
```bash
# Serve locally (use any static server)
python -m http.server 8000
# or
npx serve
```

**Testing:**
Open in browser at `http://localhost:8000` and navigate between:
- `index.html` - Home page with note buttons and sargam input
- `piano.html` - Interactive piano keyboard interface
- `midi.html` - MIDI device input interface
- `musicxml.html` - MusicXML file import and note sequencing

## Architecture

### Core Data Model (js/fingering-data.js)

This module is the foundation of the entire application. It defines:

- **Universal fingering pattern**: All bansuris follow the same fingering pattern regardless of key. The pattern maps semitones from Sa (tonic) to 6-hole positions, creating a Lydian scale with natural fingerings
- **Hole states**: `OPEN` (0), `CLOSED` (1), `HALF` (0.5)
- **Three octave registers**: `mandra` (low/gentle breath), `madhya` (middle/normal breath), `taar` (high/strong breath/overblowing)
- **Bansuri keys**: Maps 12 chromatic keys to MIDI note numbers (Sa/tonic position). Default is G (MIDI 67)

Key functions:
- `getFingeringForMidi(midiNote, bansuriKey)` - Primary conversion function used throughout app
- `getFingeringForNote(noteName, bansuriKey)` - Converts Western note names (e.g., "G4")
- `getFingeringForSargam(indianNote, octaveOffset, bansuriKey)` - Converts Indian notes (e.g., "Re")

Returns fingering objects with: `{ midiNote, westernNote, indianNote, octave, holes: [6 values], bansuriKey, semitonesFromSa }`

### Visual Rendering (js/bansuri-svg.js)

Creates SVG visualization of the bansuri in two orientations:

**Vertical (default for piano/midi/musicxml pages):**
- `createBansuri()` - 6 holes arranged vertically, blowhole at top
- Octave indicator at bottom

**Horizontal (used on index.html home page):**
- `createHorizontalBansuri()` - 6 holes arranged left-to-right, blowhole on left
- Larger display, positioned at bottom of page
- Octave indicator on right side

Common features:
- 6 finger holes (labeled L1-L3 for left hand, R1-R3 for right hand)
- Hole states rendered via CSS classes: `hole-open`, `hole-closed`, `hole-half`
- SVG gradients for bamboo texture and half-hole patterns

Controller API:
- `setFingering(fingeringObject)` - Updates all holes and octave display
- `highlightHole(index, boolean)` - For teaching features

### Audio Engine (js/audio-engine.js)

Web Audio API synthesis:
- Generates reference tones using oscillators (not sampled audio)
- Default waveform: `triangle` (flute-like sound)
- ADSR envelope with attack/release for natural sound
- `playMidi(midiNote, duration)` - Sustained playback
- `playTap(midiNote)` - Short 0.3s note for UI feedback
- Audio context initialized on first user interaction (browser requirement)

### Input Modes

Four specialized main modules initialize different input interfaces:

1. **main.js** (Home) - Horizontal layout with combined Sargam/Western note grid spanning Mandra Pa to Taar Pa (25 chromatic notes = 2 octaves)
2. **main-piano.js** - Adds interactive piano keyboard visualization
3. **main-midi.js** - Integrates `midi-handler.js` for Web MIDI API device input
4. **main-musicxml.js** - Uses `musicxml-parser.js` to load and sequence notes from MusicXML files

All modes share the fingering-data core.

### Input Handlers (js/input-handlers.js)

Reusable UI component factory functions:
- `createCombinedNoteGrid()` - Two-row grid: fixed Sargam notes on top, dynamic Western notes below (updates when key changes). Range: Mandra Pa to Taar Pa (semitones 7-31)
- `createNoteButtons()` - Western note grid (C3-B5 range) - used by piano/midi/musicxml pages
- `createSargamButtons()` - Indian note buttons (Sa, Re, Ga, etc.)
- `createOctaveSelector()` - Mandra/Madhya/Taar selector for Sargam input
- `createKeySelector()` - Bansuri key picker (C-B)
- `createPianoKeyboard()` - SVG piano keyboard
- `createTextInput()` - Free-form note name input parser

Components maintain playability state - notes outside the bansuri's range are disabled.

### Shared Utilities

- **theme.js** - Dark/light theme toggle with localStorage persistence
- **nav.js** - Hamburger menu navigation between pages

## Key Concepts

**Bansuri Playability**: A bansuri can play ~2.5 octaves (31 semitones) from Sa to high Pa. Range check is critical - use `isPlayable(midiNote, bansuriKey)` before showing notes as available.

**Octave Calculation**: The same fingering pattern produces three registers based on breath pressure:
- 0-11 semitones from Sa = mandra (low octave)
- 12-23 semitones = madhya (middle octave)
- 24-30 semitones = taar (high octave, up to Pa)

**Half-holes**: Chromatic notes (sharps/flats not in the natural Lydian scale) require half-covering finger holes. The fingering-data module encodes these as `HALF` (0.5) values.

**Key Independence**: The fingering pattern is universal. When the bansuri key changes, MIDI notes change but finger positions remain constant relative to Sa. This is why `getFingeringForMidi()` requires the `bansuriKey` parameter.

## State Management

Each main module maintains application state in a `state` object:
```javascript
const state = {
  bansuriKey: 'G',           // Current bansuri key
  currentFingering: null,    // Last displayed fingering
  audioEnabled: true         // Audio playback toggle
};
```

The home page (main.js) uses a fixed range (Mandra Pa to Taar Pa) so no octave selector is needed. Other pages may include `currentOctaveOffset` for Sargam input.

Preferences (key, volume, waveform) are persisted to localStorage on change.

## Web APIs Used

- **Web Audio API**: Audio synthesis (js/audio-engine.js)
- **Web MIDI API**: MIDI device input (js/midi-handler.js)
- **DOMParser**: MusicXML parsing (js/musicxml-parser.js)
- **localStorage**: User preferences persistence

## Notes

- All JavaScript modules use ES6 modules (`import`/`export`)
- No transpilation or bundling - runs directly in modern browsers
- SVG rendering uses namespace methods (`createElementNS`)
- CSS custom properties enable theme switching without JavaScript color management
