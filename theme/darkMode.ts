
export function setDarkMode (darkMode: boolean) {
  const currentTheme = darkMode ? 'dark' : 'light';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }
}
