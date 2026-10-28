/* Size layout boxes to the visible viewport; do not scale the scene or duplicate keyboard insets. */
(() => {
  const root = document.documentElement;
  function viewport() {
    const vv = window.visualViewport;
    root.style.setProperty('--research-height', (vv?.height || innerHeight) + 'px');
    root.style.setProperty('--research-offset', (vv?.offsetTop || 0) + 'px');
    // Runtime remeasures its sheet scroll range and composer after CSS dimensions update.
    window.dispatchEvent(new Event('resize'));
  }
  window.visualViewport?.addEventListener('resize', viewport);
  window.visualViewport?.addEventListener('scroll', viewport);
  window.addEventListener('orientationchange', viewport);
  viewport();
})();
