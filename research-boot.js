/* Research has a deterministic configuration and a fresh in-memory session per load.
   It never reads, clears or writes Hub's participant-independent preview storage. */
(() => {
  const values = new Map();
  window.SpotlightResearch = {
    storage: {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value))},
    height: () => Math.max(1, document.querySelector('#stage')?.clientHeight || innerHeight)
  };
  // Configuration must be seeded before the existing head scripts run.
  history.replaceState(null, '', location.pathname + '?update=3&preset=target');
  document.documentElement.dataset.research = 'target';
})();
