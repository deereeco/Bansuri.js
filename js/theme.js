/**
 * Bansuri.js - Theme Toggle
 * Handles dark/light theme switching with localStorage persistence
 */

const THEME_KEY = 'bansuri-theme';
const DARK = 'dark';
const LIGHT = 'light';

/**
 * Initialize theme from localStorage or default to dark
 */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = saved || DARK;
  applyTheme(theme);
  updateToggleButton(theme);
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Toggle between dark and light theme
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === DARK ? LIGHT : DARK;
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
  updateToggleButton(next);
  return next;
}

/**
 * Update the toggle button icon
 */
function updateToggleButton(theme) {
  const btn = document.querySelector('.theme-toggle');
  if (btn) {
    btn.textContent = theme === DARK ? '☀️' : '🌙';
    btn.title = theme === DARK ? 'Switch to light mode' : 'Switch to dark mode';
  }
}

/**
 * Get current theme
 */
function getTheme() {
  return document.documentElement.getAttribute('data-theme') || DARK;
}

/**
 * Set up theme toggle button listener
 */
function setupThemeToggle() {
  const btn = document.querySelector('.theme-toggle');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTheme();
    });
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
  });
} else {
  initTheme();
  setupThemeToggle();
}

// Export for module use
export { initTheme, toggleTheme, getTheme, setupThemeToggle };
