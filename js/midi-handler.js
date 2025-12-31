/**
 * Bansuri.js - MIDI Handler
 * Uses Web MIDI API to receive input from MIDI devices
 */

// MIDI state
let midiAccess = null;
let midiInputs = [];
let onNoteOnCallback = null;
let onNoteOffCallback = null;
let onMidiStatusCallback = null;

// MIDI message types
const MIDI_NOTE_ON = 0x90;
const MIDI_NOTE_OFF = 0x80;
const MIDI_CONTROL_CHANGE = 0xB0;

/**
 * Initialize MIDI access
 * @returns {Promise<boolean>} True if MIDI is available
 */
async function initMidi() {
  if (!navigator.requestMIDIAccess) {
    console.log('Web MIDI API not supported in this browser');
    if (onMidiStatusCallback) {
      onMidiStatusCallback({ available: false, message: 'Web MIDI API not supported' });
    }
    return false;
  }

  try {
    midiAccess = await navigator.requestMIDIAccess();

    // Set up input listeners
    updateInputs();

    // Listen for connection changes
    midiAccess.onstatechange = handleStateChange;

    if (onMidiStatusCallback) {
      onMidiStatusCallback({
        available: true,
        message: `MIDI ready. ${midiInputs.length} input(s) found.`,
        inputs: midiInputs.map(i => i.name)
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to get MIDI access:', error);
    if (onMidiStatusCallback) {
      onMidiStatusCallback({ available: false, message: error.message });
    }
    return false;
  }
}

/**
 * Update the list of MIDI inputs and attach listeners
 */
function updateInputs() {
  // Remove old listeners
  midiInputs.forEach(input => {
    input.onmidimessage = null;
  });

  midiInputs = [];

  if (!midiAccess) return;

  // Get all inputs
  for (const input of midiAccess.inputs.values()) {
    if (input.state === 'connected') {
      input.onmidimessage = handleMidiMessage;
      midiInputs.push(input);
    }
  }
}

/**
 * Handle MIDI state changes (device connect/disconnect)
 */
function handleStateChange(event) {
  const port = event.port;

  if (port.type === 'input') {
    updateInputs();

    if (onMidiStatusCallback) {
      onMidiStatusCallback({
        available: true,
        message: `${port.name} ${port.state}`,
        inputs: midiInputs.map(i => i.name)
      });
    }
  }
}

/**
 * Handle incoming MIDI messages
 */
function handleMidiMessage(event) {
  const [status, data1, data2] = event.data;
  const command = status & 0xF0;
  const channel = status & 0x0F;

  switch (command) {
    case MIDI_NOTE_ON:
      // Note on with velocity 0 is treated as note off
      if (data2 > 0) {
        if (onNoteOnCallback) {
          onNoteOnCallback({
            note: data1,
            velocity: data2,
            channel
          });
        }
      } else {
        if (onNoteOffCallback) {
          onNoteOffCallback({
            note: data1,
            velocity: 0,
            channel
          });
        }
      }
      break;

    case MIDI_NOTE_OFF:
      if (onNoteOffCallback) {
        onNoteOffCallback({
          note: data1,
          velocity: data2,
          channel
        });
      }
      break;

    case MIDI_CONTROL_CHANGE:
      // Could handle sustain pedal, modulation, etc.
      break;
  }
}

/**
 * Set callback for note on events
 * @param {Function} callback - Called with { note, velocity, channel }
 */
function onNoteOn(callback) {
  onNoteOnCallback = callback;
}

/**
 * Set callback for note off events
 * @param {Function} callback - Called with { note, velocity, channel }
 */
function onNoteOff(callback) {
  onNoteOffCallback = callback;
}

/**
 * Set callback for MIDI status updates
 * @param {Function} callback - Called with status info
 */
function onMidiStatus(callback) {
  onMidiStatusCallback = callback;
}

/**
 * Get list of connected MIDI inputs
 * @returns {Array} Array of input names
 */
function getInputs() {
  return midiInputs.map(input => ({
    id: input.id,
    name: input.name,
    manufacturer: input.manufacturer
  }));
}

/**
 * Check if MIDI is available and initialized
 * @returns {boolean}
 */
function isMidiAvailable() {
  return midiAccess !== null;
}

/**
 * Check if any MIDI inputs are connected
 * @returns {boolean}
 */
function hasInputs() {
  return midiInputs.length > 0;
}

/**
 * Create MIDI status display element
 * @param {HTMLElement} container - Container element
 * @returns {object} Status display controller
 */
function createMidiStatusDisplay(container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'midi-status-container';

  const statusIcon = document.createElement('span');
  statusIcon.className = 'midi-status-icon';
  statusIcon.textContent = '🎹';

  const statusText = document.createElement('span');
  statusText.className = 'midi-status-text';
  statusText.textContent = 'MIDI: Not initialized';

  const inputsList = document.createElement('div');
  inputsList.className = 'midi-inputs-list';

  wrapper.appendChild(statusIcon);
  wrapper.appendChild(statusText);
  wrapper.appendChild(inputsList);
  container.appendChild(wrapper);

  // Set up status callback
  onMidiStatus((status) => {
    if (status.available) {
      wrapper.classList.add('available');
      wrapper.classList.remove('unavailable');
      statusText.textContent = status.message;

      // Update inputs list
      inputsList.innerHTML = '';
      if (status.inputs && status.inputs.length > 0) {
        status.inputs.forEach(name => {
          const item = document.createElement('div');
          item.className = 'midi-input-item';
          item.textContent = name;
          inputsList.appendChild(item);
        });
      }
    } else {
      wrapper.classList.add('unavailable');
      wrapper.classList.remove('available');
      statusText.textContent = `MIDI: ${status.message}`;
      inputsList.innerHTML = '';
    }
  });

  return {
    element: wrapper,
    refresh() {
      if (midiAccess) {
        updateInputs();
        onMidiStatusCallback({
          available: true,
          message: `${midiInputs.length} input(s) connected`,
          inputs: midiInputs.map(i => i.name)
        });
      }
    }
  };
}

// Export
export {
  initMidi,
  onNoteOn,
  onNoteOff,
  onMidiStatus,
  getInputs,
  isMidiAvailable,
  hasInputs,
  createMidiStatusDisplay
};
