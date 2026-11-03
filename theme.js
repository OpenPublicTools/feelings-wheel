(() => {
  const root = document.documentElement;
  const storageKey = 'feeling-wheel-theme';
  let preference;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {}

  let system;
  try {
    system = window.matchMedia?.('(prefers-color-scheme: dark)');
  } catch {}

  function applyTheme(theme) {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#201e1b' : '#f3e8d5';
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
    }
  }

  applyTheme(preference || (system?.matches ? 'dark' : 'light'));
  system?.addEventListener?.('change', event => {
    if (!preference) applyTheme(event.matches ? 'dark' : 'light');
  });

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(root.dataset.theme);
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(preference);
      try { localStorage.setItem(storageKey, preference); } catch {}
    });
  });
})();
