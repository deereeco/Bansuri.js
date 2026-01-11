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
- `index.html` - Home page with combined Sargam/Western note grid
- `midi.html` - MIDI device input and MIDI file import
- `finder.html` - Flute finder page showing all notes on the bansuri at once

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

Creates SVG visualization of the bansuri. All pages now use the horizontal layout:

**Horizontal bansuri (used on all pages):**
- `createHorizontalBansuri()` - 6 holes arranged left-to-right, blowhole on left
- Large display, positioned at bottom of page, scales to fill container width
- Holes positioned toward right side with 1.5x spacing between R2-R3 (anatomically natural)
- No octave indicator (cleaner display - octave shown in note info instead)

**Legacy vertical orientation (not currently used):**
- `createBansuri()` - 6 holes arranged vertically, blowhole at top
- Includes octave indicator at bottom

Common features:
- 6 finger holes (labeled L1-L3 for left hand, R1-R3 for right hand)
- Hole states rendered via CSS classes: `hole-open`, `hole-closed`, `hole-half`
- SVG gradients for bamboo texture and half-hole patterns

Controller API:
- `setFingering(fingeringObject)` - Updates all holes and octave display
- `highlightHole(index, boolean)` - For teaching features

### Audio Engine (js/audio-engine.js)

Tone.js synthesis with flute-like envelope:
- Uses Tone.js library (loaded via CDN in all HTML pages)
- Generates reference tones using synth with envelope (not sampled audio)
- **Fixed configuration**: Sine wave with flute-optimized ADSR envelope
- **ADSR envelope**: attack 0.05s, decay 0.1s, sustain 0.7, release 0.3s
- **Fixed volume**: 70% (0.7) - users adjust system volume as needed
- No user-facing volume or waveform controls (simplified UI)
- `playMidi(midiNote, duration)` - Sustained playback (duration=0) or timed playback
- `playTap(midiNote)` - Short 0.3s note for UI feedback
- Audio context initialized on first user interaction (browser requirement)

### Input Modes

Three specialized main modules initialize different input interfaces:

1. **main.js** (Home) - Horizontal layout with combined Sargam/Western note grid spanning Mandra Pa to Taar Pa (25 chromatic notes)
2. **main-midi.js** (MIDI) - Web MIDI API device input + MIDI file import/playback, with horizontal bansuri display
   - Integrates `midi-handler.js` for live MIDI device input
   - Integrates `midi-file-parser.js` for Standard MIDI File (.mid) parsing and timed playback
3. **main-finder.js** (Finder) - Text input mode for finding notes on the bansuri
   - Users enter note names (e.g., "c,d,e,f,g,a") to see them highlighted on the bansuri
   - Shows all 12 chromatic notes labeled around the horizontal bansuri
   - Integrates `finder-note-labels.js` for note label positioning and highlighting

All pages share the same horizontal layout with compact settings bar at top and large horizontal bansuri at bottom. All modes share the fingering-data core.

### Input Handlers (js/input-handlers.js)

Reusable UI component factory functions:
- `createCombinedNoteGrid()` - Two-row grid with saptak (octave) groupings (used on home page):
  - Three labeled groups: Mandra (Pa–Ni), Madhya (Sa–Ni), Taar (Sa–Pa)
  - Fixed Sargam notes on top row, dynamic Western notes below (updates when key changes)
  - Range: Mandra Pa to Taar Pa (semitones 7-31, 25 chromatic notes)
  - `setHalfNotesVisible(boolean)` - Toggle visibility of komal/tivra notes (uses CSS visibility to maintain layout)
- `createKeySelector()` - Bansuri key picker (C-B) - used in settings bar on all pages
- `createPianoKeyboard()` - SVG piano keyboard (configurable octave range, default 4 octaves C4-B7) - available but not currently used
- `createNoteButtons()` - Western note grid (legacy, not currently used)
- `createSargamButtons()` - Indian note buttons (legacy, not currently used)
- `createOctaveSelector()` - Mandra/Madhya/Taar selector for Sargam input (legacy, not currently used)
- `createTextInput()` - Free-form note name input parser (legacy, not currently used)

Components maintain playability state - notes outside the bansuri's range (Mandra Pa to Taar Pa) are disabled.

### MIDI File Import (js/midi-file-parser.js)

Standard MIDI File (SMF) parser and timed sequencer:
- `parseMIDI(arrayBuffer)` - Parses binary MIDI file data into note events with timing
- Supports tempo map extraction and timing calculations
- `createMIDIFileInput(container, onParsed)` - File picker UI component
- `createTempoControl(container, onTempoChange)` - Playback speed slider (0.25x to 2.0x)
- `createTimedNoteSequencer(container, onNoteChange, audioEngine)` - Playback controls (Play, Pause, Stop, Prev, Next)
  - Schedules note playback with accurate timing using `setTimeout`
  - Calls `audioEngine.playMidi(note, duration)` for each note
  - Displays current position (e.g., "Note 5 / 120")

**MIDI page tabs:**
- **Device Input**: Live MIDI keyboard/controller input via Web MIDI API
- **File Import**: Load and play Standard MIDI Files with tempo control

### Flute Finder (js/finder-note-labels.js)

Visual note labeling system for the finder page that shows all 12 chromatic notes on the bansuri:

**Note Label System:**
- `createNoteLabels(svg, holes, config, bansuriKey)` - Creates SVG note labels positioned around the horizontal bansuri
- All 12 semitones (0-11) are labeled with Western note names
- Each label is an SVG group containing a background circle and text element
- Labels update dynamically when bansuri key changes

**Note Positioning:**
- **Natural notes** (non-chromatic): Positioned below the flute at the corresponding finger hole
  - Examples: Sa, Re, Ga, Ma Tivra, Pa, Dha, Ni
- **Chromatic notes** (half-hole fingerings): Positioned on/inside the hole, displayed in italic
  - Examples: Komal Re, Komal Ga, Ma, Komal Dha, Komal Ni
- Special case: Tivra Ma (all holes open) positioned at the blowhole

**Note Highlighting:**
- `highlightNotes(semitones)` - Highlights specified notes with green background (#4ade80) and black text
- `clearHighlights()` - Removes all highlights
- Highlighted notes have a circular green background that stands out prominently
- Background circles are transparent by default, only visible when highlighted

**Input Parsing:**
- `parseNoteInput(input)` - Parses user input like "c,d,e" or "c d e f#" into note names
- `noteNameToSemitone(noteName, bansuriKey)` - Converts note names to semitone values (0-11) relative to Sa
- Supports comma-separated, space-separated, or mixed formats
- Accepts sharps (#) and flats (b), unicode sharp (♯) and flat (♭)

**Alignment Logic:**
- Notes positioned at the last closed hole in the fingering pattern
- Hole positions: L1(250), L2(350), L3(450), R1(550), R2(650), R3(800) with 1.5x spacing between R2-R3
- Y-axis: Natural notes below center, chromatic notes above center (on the holes)

### Shared Utilities

- **theme.js** - Dark/light theme toggle with localStorage persistence
- **nav.js** - Hamburger menu navigation between pages

## Key Concepts

**Bansuri Playability**: A 6-hole bansuri can play 25 semitones (2+ octaves) from **Mandra Pa (semitone 7) to Taar Pa (semitone 31)**. The lowest playable note is Pa in the mandra octave, NOT Sa. Notes below semitone 7 return `null` from `getFingeringForMidi()`. Range check is critical - use `isPlayable(midiNote, bansuriKey)` before showing notes as available.

**Playable range by flute key:**
- C flute: G4 (Mandra Pa) to G6 (Taar Pa)
- G flute: D5 (Mandra Pa) to D7 (Taar Pa)
- B flute: F#5 (Mandra Pa) to F#7 (Taar Pa)

**Octave Calculation**: The same fingering pattern produces three registers based on breath pressure:
- 7-11 semitones from Sa = mandra (low octave, only Pa through Ni are playable)
- 12-23 semitones = madhya (middle octave, full chromatic scale)
- 24-31 semitones = taar (high octave, Sa through Pa are playable)

**Half-holes**: Chromatic notes (sharps/flats not in the natural Lydian scale) require half-covering finger holes. The fingering-data module encodes these as `HALF` (0.5) values.

**Key Independence**: The fingering pattern is universal. When the bansuri key changes, MIDI notes change but finger positions remain constant relative to Sa. This is why `getFingeringForMidi()` requires the `bansuriKey` parameter.

## State Management

Each main module maintains application state in a `state` object:
```javascript
const state = {
  bansuriKey: 'G',           // Current bansuri key
  currentFingering: null,    // Last displayed fingering
  audioEnabled: true,        // Audio playback toggle
  showHalfNotes: true        // Show/hide chromatic (komal/tivra) notes
};
```

The home page (main.js) uses a fixed range (Mandra Pa to Taar Pa) so no octave selector is needed.

Preferences (key, showHalfNotes) are persisted to localStorage on change.

### Settings Bar (All Pages)

All pages feature a simplified horizontal settings bar at the top:

**Home and MIDI pages:**
- **Bansuri Key selector** - Changes which key the bansuri is tuned to (updates Western note labels)
- **Octave Shift controls** - Transpose audio output up/down by ±2 octaves (±24 semitones)
- **Range display** - Shows the current effective playable range based on key and octave shift

**Home page only:**
- **Scale toggle** - "Major Only" hides komal/tivra notes, "All Notes" shows all 12 chromatic notes (uses CSS visibility to maintain layout)

**Finder page only:**
- **Bansuri Key selector** - Changes which key the bansuri is tuned to (updates all note labels)
- **Text input field** - Enter note names (blank by default) to highlight them on the bansuri
  - Supports formats: "c,d,e", "c d e", "c# d e f#"
  - Invalid notes show error message below input
  - Highlights update in real-time as user types

**Removed controls** (simplified UI):
- Volume slider - Users adjust system volume instead
- Sound selector - Fixed to sine wave with envelope

## Web APIs and Libraries Used

- **Tone.js** (v14.8.49 via CDN): Audio synthesis with envelope (js/audio-engine.js)
- **Web MIDI API**: MIDI device input (js/midi-handler.js)
- **localStorage**: User preferences persistence (bansuri key, scale toggle, finder page key selection)

## Notes

- All JavaScript modules use ES6 modules (`import`/`export`)
- No transpilation or bundling - runs directly in modern browsers
- SVG rendering uses namespace methods (`createElementNS`)
- CSS custom properties enable theme switching without JavaScript color management
- **Unified layout**: All pages use `.horizontal-layout` class with compact settings bar at top and large horizontal bansuri at bottom
- **Finder page note labels**: Natural notes positioned below flute, chromatic notes positioned on/inside holes (not above)
  - Highlighted notes show green circular background (#4ade80) with black text for high visibility
  - Background circles are transparent by default, only visible when highlighted
- Tone.js is loaded via CDN (`<script>` tag) in all HTML pages before the module scripts
