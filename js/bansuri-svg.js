/**
 * Bansuri.js - SVG Flute Rendering Component (Vertical)
 * Creates an interactive SVG visualization of a 6-hole bansuri
 */

import { OPEN, CLOSED, HALF, OCTAVES } from './fingering-data.js';

// SVG namespace
const SVG_NS = 'http://www.w3.org/2000/svg';

// Default dimensions (vertical orientation)
const DEFAULT_CONFIG = {
  width: 120,
  height: 520,
  tubeColor: '#8B4513',      // Saddle brown (bamboo-like)
  tubeHighlight: '#DEB887',  // Burlywood
  holeRadius: 22,
  holeSpacing: 60,
  holeFillClosed: '#2C1810', // Dark brown (finger covering hole)
  holeFillOpen: '#1a1a1a',   // Dark interior
  holeFillHalf: 'url(#halfHoleGradient)',
  holeStroke: '#5D3A1A',
  blowHoleRadius: 14,
  animationDuration: 150     // ms
};

/**
 * Create the main bansuri SVG element (vertical orientation)
 * @param {HTMLElement} container - Container element to append SVG to
 * @param {object} config - Configuration options
 * @returns {object} Bansuri controller object
 */
function createBansuri(container, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Create SVG element
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${cfg.width} ${cfg.height}`);
  svg.setAttribute('class', 'bansuri-svg');

  // Create definitions for gradients
  const defs = document.createElementNS(SVG_NS, 'defs');

  // Bamboo gradient for tube (horizontal gradient for 3D effect on vertical tube)
  const tubeGradient = createLinearGradient('tubeGradient', [
    { offset: '0%', color: cfg.tubeHighlight },
    { offset: '30%', color: cfg.tubeColor },
    { offset: '70%', color: cfg.tubeColor },
    { offset: '100%', color: cfg.tubeHighlight }
  ], 0); // horizontal gradient
  defs.appendChild(tubeGradient);

  // Half-hole gradient (half covered - left to right for vertical)
  // Using high-contrast colors that work in both light and dark themes
  const halfHoleGradient = createLinearGradient('halfHoleGradient', [
    { offset: '0%', color: '#8B4513' },    // Brown (closed/finger)
    { offset: '50%', color: '#8B4513' },
    { offset: '50%', color: '#2a2a2a' },   // Dark gray (open)
    { offset: '100%', color: '#2a2a2a' }
  ], 0); // horizontal gradient
  defs.appendChild(halfHoleGradient);

  // Hole inner shadow
  const holeShadow = createRadialGradient('holeShadow', [
    { offset: '0%', color: '#000000' },
    { offset: '70%', color: '#1a1a1a' },
    { offset: '100%', color: '#333333' }
  ]);
  defs.appendChild(holeShadow);

  svg.appendChild(defs);

  // Draw bamboo tube (vertical)
  const tube = createTube(cfg);
  svg.appendChild(tube);

  // Draw blowhole (at top)
  const blowhole = createBlowhole(cfg);
  svg.appendChild(blowhole);

  // Draw 6 finger holes (vertical arrangement)
  const holes = [];
  const startY = 140; // Start position for first hole from top
  const centerX = cfg.width / 2;

  for (let i = 0; i < 6; i++) {
    const y = startY + i * cfg.holeSpacing;
    const hole = createHole(centerX, y, cfg.holeRadius, i + 1, cfg);
    holes.push(hole);
    svg.appendChild(hole.group);
  }

  // Create octave indicator (at bottom)
  const octaveIndicator = createOctaveIndicator(cfg);
  svg.appendChild(octaveIndicator.group);

  // Create finger labels (on the right side)
  const fingerLabels = createFingerLabels(startY, cfg);
  svg.appendChild(fingerLabels);

  // Append to container
  container.appendChild(svg);

  // Current state
  let currentFingering = null;

  // Controller object
  const controller = {
    svg,
    holes,
    octaveIndicator,

    /**
     * Set the fingering pattern
     * @param {object} fingering - Fingering object from fingering-data.js
     */
    setFingering(fingering) {
      currentFingering = fingering;

      if (!fingering) {
        // Clear all holes
        holes.forEach(hole => setHoleState(hole, OPEN, cfg));
        octaveIndicator.setText('');
        return;
      }

      // Set each hole state
      fingering.holes.forEach((state, index) => {
        setHoleState(holes[index], state, cfg);
      });

      // Set octave indicator
      const octaveText = getOctaveDisplayText(fingering.octave);
      octaveIndicator.setText(octaveText);
      octaveIndicator.setBreathLevel(fingering.octave);
    },

    /**
     * Get current fingering
     */
    getFingering() {
      return currentFingering;
    },

    /**
     * Highlight a specific hole (for teaching)
     * @param {number} holeIndex - 0-5
     * @param {boolean} highlight - Whether to highlight
     */
    highlightHole(holeIndex, highlight) {
      if (holeIndex >= 0 && holeIndex < 6) {
        const hole = holes[holeIndex];
        if (highlight) {
          hole.circle.classList.add('highlighted');
        } else {
          hole.circle.classList.remove('highlighted');
        }
      }
    },

    /**
     * Clear all highlights
     */
    clearHighlights() {
      holes.forEach(hole => hole.circle.classList.remove('highlighted'));
    }
  };

  return controller;
}

/**
 * Create the main bamboo tube (vertical)
 */
function createTube(cfg) {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', 'bansuri-tube');

  // Main tube body (vertical)
  const tubeWidth = 55;
  const tubeX = (cfg.width - tubeWidth) / 2;

  const tube = document.createElementNS(SVG_NS, 'rect');
  tube.setAttribute('x', tubeX);
  tube.setAttribute('y', 20);
  tube.setAttribute('width', tubeWidth);
  tube.setAttribute('height', cfg.height - 40);
  tube.setAttribute('rx', tubeWidth / 2);
  tube.setAttribute('ry', tubeWidth / 2);
  tube.setAttribute('fill', 'url(#tubeGradient)');
  tube.setAttribute('stroke', '#5D3A1A');
  tube.setAttribute('stroke-width', 2);

  // Bamboo node lines (decorative, horizontal)
  const nodes = [100, 260, 420];
  nodes.forEach(y => {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', tubeX + 5);
    line.setAttribute('y1', y);
    line.setAttribute('x2', tubeX + tubeWidth - 5);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#6B4423');
    line.setAttribute('stroke-width', 2);
    line.setAttribute('opacity', 0.5);
    group.appendChild(line);
  });

  group.appendChild(tube);
  return group;
}

/**
 * Create the blowhole (at top)
 */
function createBlowhole(cfg) {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', 'bansuri-blowhole');

  const x = cfg.width / 2;
  const y = 60;

  // Blowhole is typically oval/rectangular
  const blowhole = document.createElementNS(SVG_NS, 'ellipse');
  blowhole.setAttribute('cx', x);
  blowhole.setAttribute('cy', y);
  blowhole.setAttribute('rx', cfg.blowHoleRadius * 0.6);
  blowhole.setAttribute('ry', cfg.blowHoleRadius);
  blowhole.setAttribute('fill', 'url(#holeShadow)');
  blowhole.setAttribute('stroke', cfg.holeStroke);
  blowhole.setAttribute('stroke-width', 1.5);

  group.appendChild(blowhole);
  return group;
}

/**
 * Create a finger hole
 */
function createHole(x, y, radius, number, cfg) {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', `bansuri-hole hole-${number}`);
  group.setAttribute('data-hole', number);

  // Hole circle - the fill color is controlled by CSS classes
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', x);
  circle.setAttribute('cy', y);
  circle.setAttribute('r', radius);
  circle.setAttribute('stroke-width', 3);
  circle.classList.add('bansuri-hole-circle', 'hole-open');

  group.appendChild(circle);

  return { group, circle, x, y, radius, number };
}

/**
 * Set the state of a hole (open, closed, half)
 */
function setHoleState(hole, state, cfg) {
  const circle = hole.circle;

  // Remove existing state classes
  circle.classList.remove('hole-open', 'hole-closed', 'hole-half');

  // Add appropriate state class (CSS handles fill colors via variables)
  if (state === CLOSED) {
    circle.classList.add('hole-closed');
  } else if (state === HALF) {
    circle.classList.add('hole-half');
  } else {
    circle.classList.add('hole-open');
  }
}

/**
 * Create octave indicator (at bottom)
 */
function createOctaveIndicator(cfg) {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', 'octave-indicator');

  const centerX = cfg.width / 2;
  const y = cfg.height - 35;

  // Background
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', centerX - 45);
  bg.setAttribute('y', y - 12);
  bg.setAttribute('width', 90);
  bg.setAttribute('height', 28);
  bg.setAttribute('rx', 4);
  bg.setAttribute('fill', 'rgba(0, 0, 0, 0.3)');
  group.appendChild(bg);

  // Octave text
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', centerX);
  text.setAttribute('y', y + 4);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '12');
  text.setAttribute('font-family', 'Arial, sans-serif');
  text.setAttribute('fill', '#ffffff');
  text.textContent = '';
  group.appendChild(text);

  // Breath indicator (simple bar)
  const breathBar = document.createElementNS(SVG_NS, 'rect');
  breathBar.setAttribute('x', centerX - 43);
  breathBar.setAttribute('y', y + 10);
  breathBar.setAttribute('width', 0);
  breathBar.setAttribute('height', 3);
  breathBar.setAttribute('fill', '#4CAF50');
  group.appendChild(breathBar);

  return {
    group,
    text,
    breathBar,
    setText(str) {
      text.textContent = str;
    },
    setBreathLevel(octave) {
      let width = 0;
      let color = '#4CAF50';

      if (octave === OCTAVES.LOW) {
        width = 28;
        color = '#4CAF50'; // Green - gentle
      } else if (octave === OCTAVES.MIDDLE) {
        width = 56;
        color = '#FFC107'; // Amber - normal
      } else if (octave === OCTAVES.HIGH) {
        width = 86;
        color = '#F44336'; // Red - strong
      }

      breathBar.setAttribute('width', width);
      breathBar.setAttribute('fill', color);
    }
  };
}

/**
 * Create finger position labels (on the right side)
 */
function createFingerLabels(startY, cfg) {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', 'finger-labels');

  const labels = ['L1', 'L2', 'L3', 'R1', 'R2', 'R3']; // Left/Right hand fingers
  const x = cfg.width - 12;

  labels.forEach((label, i) => {
    const y = startY + i * cfg.holeSpacing;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y + 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.setAttribute('fill', '#888');
    text.textContent = label;
    group.appendChild(text);
  });

  return group;
}

/**
 * Create a linear gradient
 */
function createLinearGradient(id, stops, angle = 0) {
  const gradient = document.createElementNS(SVG_NS, 'linearGradient');
  gradient.setAttribute('id', id);

  // Set direction based on angle
  if (angle === 90) {
    // Vertical gradient (top to bottom)
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '100%');
  } else {
    // Horizontal gradient (left to right)
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '0%');
  }

  stops.forEach(({ offset, color }) => {
    const stop = document.createElementNS(SVG_NS, 'stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    gradient.appendChild(stop);
  });

  return gradient;
}

/**
 * Create a radial gradient
 */
function createRadialGradient(id, stops) {
  const gradient = document.createElementNS(SVG_NS, 'radialGradient');
  gradient.setAttribute('id', id);

  stops.forEach(({ offset, color }) => {
    const stop = document.createElementNS(SVG_NS, 'stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    gradient.appendChild(stop);
  });

  return gradient;
}

/**
 * Get display text for octave
 */
function getOctaveDisplayText(octave) {
  switch (octave) {
    case OCTAVES.LOW:
      return 'Low (Mandra)';
    case OCTAVES.MIDDLE:
      return 'Mid (Madhya)';
    case OCTAVES.HIGH:
      return 'High (Taar)';
    default:
      return '';
  }
}

// Export
export { createBansuri, DEFAULT_CONFIG };
