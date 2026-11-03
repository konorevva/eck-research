/* Research has a deterministic configuration and a fresh in-memory session per load.
   It never reads, clears or writes Hub's participant-independent preview storage. */
(() => {
  const preset = document.currentScript?.dataset.preset === 'mvp' ? 'mvp' : 'target';
  const variant = window.SpotlightResearchVariant;
  const start = variant && new URLSearchParams(location.search).get('start') === 'center' ? 'center' : 'bank';
  const values = new Map();
  window.SpotlightResearch = {
    variant, start,
    storage: {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value))},
    height: () => Math.max(1, document.querySelector('#stage')?.clientHeight || innerHeight)
  };
  // Configuration must be seeded before the existing head scripts run.
  const query = new URLSearchParams('update=3&preset=' + preset);
  if (variant) {
    query.set('start', start);
    document.documentElement.dataset.researchVariant = variant.id;
  }
  history.replaceState(null, '', location.pathname + '?' + query);
  document.documentElement.dataset.research = preset;
})();
