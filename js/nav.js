/**
 * Bansuri.js - Navigation
 * Hamburger menu for navigating between pages
 */

const PAGES = [
  { href: 'index.html', label: 'Home', icon: '🏠' },
  { href: 'piano.html', label: 'Piano', icon: '🎹' },
  { href: 'midi.html', label: 'MIDI', icon: '🎛️' },
  { href: 'musicxml.html', label: 'MusicXML', icon: '📄' }
];

/**
 * Initialize navigation
 */
function initNav() {
  const hamburger = document.querySelector('.hamburger-btn');
  const nav = document.querySelector('.nav-dropdown');

  if (!hamburger || !nav) return;

  // Toggle dropdown on hamburger click
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !nav.hidden;
    nav.hidden = isOpen;
    hamburger.setAttribute('aria-expanded', !isOpen);
    hamburger.classList.toggle('open', !isOpen);
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.app-header')) {
      nav.hidden = true;
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.classList.remove('open');
    }
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !nav.hidden) {
      nav.hidden = true;
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.classList.remove('open');
      hamburger.focus();
    }
  });

  // Highlight current page
  highlightCurrentPage(nav);
}

/**
 * Highlight the current page in the navigation
 */
function highlightCurrentPage(nav) {
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop() || 'index.html';

  nav.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/**
 * Create navigation HTML (can be used to inject nav dynamically)
 */
function createNavHTML() {
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop() || 'index.html';

  const links = PAGES.map(page => {
    const isActive = page.href === currentPage;
    const activeClass = isActive ? ' active' : '';
    const ariaCurrent = isActive ? ' aria-current="page"' : '';
    return `<a href="${page.href}" class="nav-link${activeClass}"${ariaCurrent}>
      <span class="nav-icon">${page.icon}</span>
      <span class="nav-label">${page.label}</span>
    </a>`;
  }).join('\n    ');

  return `<nav class="nav-dropdown" hidden>
    ${links}
  </nav>`;
}

/**
 * Create the full header HTML
 */
function createHeaderHTML(title = 'Bansuri.js') {
  return `<header class="app-header">
  <button class="hamburger-btn" aria-label="Menu" aria-expanded="false">
    <span class="hamburger-icon">☰</span>
  </button>
  <h1 class="app-title">${title}</h1>
  <button class="theme-toggle" aria-label="Toggle theme">🌙</button>
  ${createNavHTML()}
</header>`;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNav);
} else {
  initNav();
}

// Export for module use
export { initNav, createNavHTML, createHeaderHTML, PAGES };
