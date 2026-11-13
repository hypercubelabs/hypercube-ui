// Applies the saved theme before the page paints (no flash). Nothing saved: follow the system.
try {
  const t = localStorage.getItem('hc-theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch {
  /* no storage: follow the system */
}
// Applies the saved screen size (Adjust screen, <hc-zoom>) before the page paints.
try {
  const z = Number(localStorage.getItem('hc-zoom'));
  if (z >= 50 && z <= 200 && z !== 100) {
    document.documentElement.style.zoom = String(z / 100);
    document.documentElement.dataset.zoom = String(z);
  }
} catch {
  /* no storage: 100% */
}
