/**
 * MIDI File Parser and Sequencer
 * Parses Standard MIDI Files (SMF) and provides timing-accurate playback
 */

/**
 * Parse a MIDI file from ArrayBuffer
 * @param {ArrayBuffer} arrayBuffer - Binary MIDI file data
 * @returns {Object} Parsed MIDI data with notes array
 */
export function parseMIDI(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  let offset = 0;

  // Validate minimum file size
  if (arrayBuffer.byteLength < 14) {
    throw new Error('File too small to be a valid MIDI file');
  }

  // Read header chunk
  const headerType = readChunkType(view, offset);
  if (headerType !== 'MThd') {
    throw new Error('Invalid MIDI file: Missing MThd header');
  }
  offset += 4;

  const headerLength = view.getUint32(offset);
  offset += 4;

  const format = view.getUint16(offset);
  offset += 2;

  const trackCount = view.getUint16(offset);
  offset += 2;

  const division = view.getUint16(offset);
  offset += 2;

  // Check for unsupported SMPTE timing
  if (division & 0x8000) {
    throw new Error('SMPTE timing format not supported');
  }

  // Parse all tracks
  const tracks = [];
  for (let i = 0; i < trackCount; i++) {
    const track = readTrack(view, offset);
    tracks.push(track.events);
    offset = track.newOffset;
  }

  // Build tempo map from meta events
  const tempoMap = buildTempoMap(tracks, division);

  // Assemble notes from all tracks
  const notes = assembleNotes(tracks, division, tempoMap);

  return {
    format,
    trackCount,
    division,
    tempoMap,
    notes
  };
}

/**
 * Read 4-byte chunk type as string
 */
function readChunkType(view, offset) {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}

/**
 * Read a variable length quantity (VLQ)
 */
function readVLQ(view, offset) {
  let value = 0;
  let byte;
  let bytesRead = 0;

  do {
    byte = view.getUint8(offset + bytesRead);
    value = (value << 7) | (byte & 0x7F);
    bytesRead++;
  } while (byte & 0x80);

  return { value, bytesRead };
}

/**
 * Read a single MIDI track
 */
function readTrack(view, offset) {
  const chunkType = readChunkType(view, offset);
  if (chunkType !== 'MTrk') {
    throw new Error('Invalid track: Missing MTrk header');
  }
  offset += 4;

  const trackLength = view.getUint32(offset);
  offset += 4;

  const trackEnd = offset + trackLength;
  const events = [];
  let runningStatus = null;

  while (offset < trackEnd) {
    // Read delta time
    const deltaTime = readVLQ(view, offset);
    offset += deltaTime.bytesRead;

    // Read event
    let eventType = view.getUint8(offset);

    // Handle running status
    if (eventType < 0x80) {
      if (runningStatus === null) {
        throw new Error('Running status without previous status');
      }
      eventType = runningStatus;
    } else {
      offset++;
    }

    const event = { deltaTime: deltaTime.value };

    // Meta event
    if (eventType === 0xFF) {
      const metaType = view.getUint8(offset);
      offset++;
      const length = readVLQ(view, offset);
      offset += length.bytesRead;

      event.type = 'meta';
      event.metaType = metaType;
      event.data = new Uint8Array(view.buffer, offset, length.value);
      offset += length.value;

      // Parse Set Tempo meta event (0x51)
      if (metaType === 0x51 && length.value === 3) {
        event.tempo = (event.data[0] << 16) | (event.data[1] << 8) | event.data[2];
      }
    }
    // SysEx event
    else if (eventType === 0xF0 || eventType === 0xF7) {
      const length = readVLQ(view, offset);
      offset += length.bytesRead;
      event.type = 'sysex';
      event.data = new Uint8Array(view.buffer, offset, length.value);
      offset += length.value;
    }
    // Channel event
    else {
      const status = eventType >> 4;
      const channel = eventType & 0x0F;

      event.type = 'channel';
      event.channel = channel;

      if (status === 0x8 || status === 0x9 || status === 0xA || status === 0xB || status === 0xE) {
        // Two-byte events
        event.data1 = view.getUint8(offset);
        offset++;
        event.data2 = view.getUint8(offset);
        offset++;

        if (status === 0x8 || (status === 0x9 && event.data2 === 0)) {
          event.subtype = 'noteOff';
          event.note = event.data1;
          event.velocity = event.data2;
        } else if (status === 0x9) {
          event.subtype = 'noteOn';
          event.note = event.data1;
          event.velocity = event.data2;
        }

        runningStatus = eventType;
      } else if (status === 0xC || status === 0xD) {
        // One-byte events
        event.data1 = view.getUint8(offset);
        offset++;
        runningStatus = eventType;
      }
    }

    events.push(event);
  }

  return { events, newOffset: offset };
}

/**
 * Build tempo map from meta events
 */
function buildTempoMap(tracks, division) {
  const tempoMap = [];
  let currentTick = 0;
  let currentTempo = 500000; // Default: 120 BPM

  // Flatten all events with absolute tick times
  const allEvents = [];
  for (const track of tracks) {
    let tick = 0;
    for (const event of track) {
      tick += event.deltaTime;
      allEvents.push({ tick, event });
    }
  }

  // Sort by tick time
  allEvents.sort((a, b) => a.tick - b.tick);

  // Extract tempo changes
  for (const { tick, event } of allEvents) {
    if (event.type === 'meta' && event.metaType === 0x51 && event.tempo) {
      tempoMap.push({ tick, tempo: event.tempo });
    }
  }

  // Ensure we have at least one tempo entry
  if (tempoMap.length === 0 || tempoMap[0].tick !== 0) {
    tempoMap.unshift({ tick: 0, tempo: 500000 });
  }

  return tempoMap;
}

/**
 * Convert MIDI ticks to milliseconds
 */
function ticksToMilliseconds(ticks, division, tempoMap) {
  let ms = 0;
  let currentTick = 0;
  let tempoIndex = 0;

  while (tempoIndex < tempoMap.length - 1 && tempoMap[tempoIndex + 1].tick <= ticks) {
    const nextTempo = tempoMap[tempoIndex + 1];
    const ticksInSegment = nextTempo.tick - currentTick;
    const microsecondsPerTick = tempoMap[tempoIndex].tempo / division;
    ms += (ticksInSegment * microsecondsPerTick) / 1000;
    currentTick = nextTempo.tick;
    tempoIndex++;
  }

  // Add remaining ticks
  const remainingTicks = ticks - currentTick;
  const microsecondsPerTick = tempoMap[tempoIndex].tempo / division;
  ms += (remainingTicks * microsecondsPerTick) / 1000;

  return ms;
}

/**
 * Assemble notes from Note On/Off events
 */
function assembleNotes(tracks, division, tempoMap) {
  const allEvents = [];

  // Flatten all events with absolute tick times
  for (const track of tracks) {
    let tick = 0;
    for (const event of track) {
      tick += event.deltaTime;
      if (event.type === 'channel' && (event.subtype === 'noteOn' || event.subtype === 'noteOff')) {
        allEvents.push({
          tick,
          channel: event.channel,
          subtype: event.subtype,
          note: event.note,
          velocity: event.velocity
        });
      }
    }
  }

  // Sort by tick time
  allEvents.sort((a, b) => a.tick - b.tick);

  // Match Note On with Note Off
  const activeNotes = new Map(); // Key: "channel-note"
  const notes = [];

  for (const event of allEvents) {
    const key = `${event.channel}-${event.note}`;

    if (event.subtype === 'noteOn' && event.velocity > 0) {
      // Start a new note
      activeNotes.set(key, {
        midiNote: event.note,
        startTick: event.tick,
        startTime: ticksToMilliseconds(event.tick, division, tempoMap),
        channel: event.channel
      });
    } else if (event.subtype === 'noteOff' || (event.subtype === 'noteOn' && event.velocity === 0)) {
      // End the note
      const activeNote = activeNotes.get(key);
      if (activeNote) {
        const endTick = event.tick;
        const endTime = ticksToMilliseconds(endTick, division, tempoMap);
        const duration = endTime - activeNote.startTime;

        notes.push({
          index: notes.length,
          type: 'note',
          midiNote: activeNote.midiNote,
          noteName: midiNoteToName(activeNote.midiNote),
          startTime: activeNote.startTime,
          duration: Math.max(duration, 100) // Minimum 100ms duration
        });

        activeNotes.delete(key);
      }
    }
  }

  return notes;
}

/**
 * Convert MIDI note number to Western note name
 */
function midiNoteToName(midiNote) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = noteNames[midiNote % 12];
  return `${noteName}${octave}`;
}

/**
 * Create MIDI file input component
 */
export function createMIDIFileInput(container, onParsed) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.mid,.midi';
  fileInput.style.display = 'none';

  const button = document.createElement('button');
  button.textContent = 'Choose MIDI File';
  button.className = 'file-input-btn';

  const status = document.createElement('div');
  status.className = 'file-status';
  status.textContent = 'No file loaded';

  button.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      status.textContent = `Loading ${file.name}...`;
      status.className = 'file-status loading';

      const arrayBuffer = await file.arrayBuffer();
      const midiData = parseMIDI(arrayBuffer);

      status.textContent = `Loaded: ${file.name} (${midiData.notes.length} notes)`;
      status.className = 'file-status success';

      onParsed(midiData);
    } catch (error) {
      status.textContent = `Error: ${error.message}`;
      status.className = 'file-status error';
      console.error('MIDI parse error:', error);
    }
  });

  container.appendChild(button);
  container.appendChild(fileInput);
  container.appendChild(status);

  return { fileInput, button, status };
}

/**
 * Create tempo control component
 */
export function createTempoControl(container, onTempoChange) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tempo-control';

  const label = document.createElement('label');
  label.textContent = 'Playback Speed:';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0.25';
  slider.max = '2.0';
  slider.step = '0.25';
  slider.value = '1.0';

  const valueDisplay = document.createElement('span');
  valueDisplay.className = 'tempo-value';
  valueDisplay.textContent = '1.0x';

  slider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    valueDisplay.textContent = `${value.toFixed(2)}x`;
    onTempoChange(value);
  });

  wrapper.appendChild(label);
  wrapper.appendChild(slider);
  wrapper.appendChild(valueDisplay);
  container.appendChild(wrapper);

  return { slider, valueDisplay };
}

/**
 * Create timed note sequencer component
 */
export function createTimedNoteSequencer(container, onNoteChange, audioEngine) {
  let notes = [];
  let currentIndex = 0;
  let isPlaying = false;
  let tempoMultiplier = 1.0;
  let scheduledTimeouts = [];

  const controls = document.createElement('div');
  controls.className = 'sequencer-controls';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '⏮ Prev';
  prevBtn.disabled = true;

  const playBtn = document.createElement('button');
  playBtn.textContent = '▶ Play';
  playBtn.disabled = true;

  const pauseBtn = document.createElement('button');
  pauseBtn.textContent = '⏸ Pause';
  pauseBtn.disabled = true;

  const stopBtn = document.createElement('button');
  stopBtn.textContent = '⏹ Stop';
  stopBtn.disabled = true;

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next ⏭';
  nextBtn.disabled = true;

  const position = document.createElement('div');
  position.className = 'sequencer-position';
  position.textContent = 'No notes loaded';

  function updatePosition() {
    if (notes.length > 0) {
      position.textContent = `Note ${currentIndex + 1} / ${notes.length}`;
    } else {
      position.textContent = 'No notes loaded';
    }
  }

  function clearScheduledNotes() {
    scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    scheduledTimeouts = [];
  }

  function stop() {
    isPlaying = false;
    clearScheduledNotes();
    currentIndex = 0;
    updatePosition();
    playBtn.disabled = notes.length === 0;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    prevBtn.disabled = true;
    nextBtn.disabled = notes.length === 0;
    playBtn.textContent = '▶ Play';
  }

  function pause() {
    isPlaying = false;
    clearScheduledNotes();
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    playBtn.textContent = '▶ Resume';
  }

  function play() {
    if (notes.length === 0) return;

    isPlaying = true;
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    const startOffset = notes[currentIndex].startTime;
    const tempoScale = 1 / tempoMultiplier;

    for (let i = currentIndex; i < notes.length; i++) {
      const note = notes[i];
      const adjustedStart = (note.startTime - startOffset) * tempoScale;
      const adjustedDuration = note.duration * tempoScale;

      const timeoutId = setTimeout(() => {
        if (!isPlaying) return;

        currentIndex = i;
        updatePosition();
        onNoteChange(note);
        if (audioEngine) {
          audioEngine.playMidi(note.midiNote, adjustedDuration / 1000);
        }

        // If this was the last note, stop playback
        if (i === notes.length - 1) {
          setTimeout(() => {
            if (isPlaying) {
              stop();
            }
          }, adjustedDuration);
        }
      }, adjustedStart);

      scheduledTimeouts.push(timeoutId);
    }
  }

  function prev() {
    if (currentIndex > 0) {
      currentIndex--;
      updatePosition();
      if (notes[currentIndex]) {
        onNoteChange(notes[currentIndex]);
      }
    }
  }

  function next() {
    if (currentIndex < notes.length - 1) {
      currentIndex++;
      updatePosition();
      if (notes[currentIndex]) {
        onNoteChange(notes[currentIndex]);
      }
    }
  }

  prevBtn.addEventListener('click', prev);
  playBtn.addEventListener('click', play);
  pauseBtn.addEventListener('click', pause);
  stopBtn.addEventListener('click', stop);
  nextBtn.addEventListener('click', next);

  controls.appendChild(prevBtn);
  controls.appendChild(playBtn);
  controls.appendChild(pauseBtn);
  controls.appendChild(stopBtn);
  controls.appendChild(nextBtn);
  controls.appendChild(position);

  container.appendChild(controls);

  return {
    setNotes(newNotes) {
      notes = newNotes;
      currentIndex = 0;
      stop();
      updatePosition();
      playBtn.disabled = notes.length === 0;
      prevBtn.disabled = true;
      nextBtn.disabled = notes.length === 0;
    },
    setTempoMultiplier(multiplier) {
      const wasPlaying = isPlaying;
      if (wasPlaying) {
        pause();
      }
      tempoMultiplier = multiplier;
      if (wasPlaying) {
        play();
      }
    },
    stop,
    isPlaying() {
      return isPlaying;
    }
  };
}
