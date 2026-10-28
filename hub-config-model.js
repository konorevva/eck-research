/* Shared, pure configuration contract. No chat state or storage belongs here. */
(function (root) {
  'use strict';
  const presets = {
    mvp: {stories:true, proactiveCommunication:false, unifiedTabbar:true, connectionDisplay:'list', manager:false, notifications:false, supportAccess:'preview', skillsUpdate:false, important:false, insights:false, tasks:false, overviewRequests:true, sectionLayout:'separate', segments:false},
    target: {stories:false, proactiveCommunication:true, unifiedTabbar:false, connectionDisplay:'buttons', manager:true, notifications:true, supportAccess:'thread', skillsUpdate:true, important:true, insights:true, tasks:true, overviewRequests:true, sectionLayout:'combined', segments:true}
  };
  Object.values(presets).forEach(Object.freeze); Object.freeze(presets);
  const keys = Object.keys(presets.mvp);
  const enums = {connectionDisplay:['buttons','list'], supportAccess:['preview','button','thread'], sectionLayout:['separate','combined']};
  const params = {stories:'stories', proactiveCommunication:'proactive', unifiedTabbar:'tabbar', connectionDisplay:'connection', manager:'manager', notifications:'notifications', supportAccess:'support', skillsUpdate:'skills', important:'important', insights:'insights', tasks:'tasks', overviewRequests:'overviewRequests', sectionLayout:'layout', segments:'segments'};
  function normalize(input = {}, base = input.preset === 'mvp' ? 'mvp' : 'target') {
    const preset = input.preset === 'mvp' || input.preset === 'target' ? input.preset : base;
    const result = {preset, ...presets[preset]};
    keys.forEach(key => {
      if (enums[key] ? enums[key].includes(input[key]) : typeof input[key] === 'boolean') result[key] = input[key];
    });
    // Button layouts always contain four channels. Support and notifications share
    // the fourth slot; manager, call and letters are present in every button layout.
    result.unifiedTabbar = preset === 'mvp';
    if (result.supportAccess !== 'preview') result.connectionDisplay = 'buttons';
    if (result.connectionDisplay === 'buttons') result.manager = true;
    else result.sectionLayout = 'separate';
    result.notifications = result.connectionDisplay === 'buttons' && result.supportAccess !== 'button';
    if (result.supportAccess !== 'preview') {
      result.sectionLayout = 'combined';
      result.overviewRequests = true;
    }
    return result;
  }
  function update(config, key, value) {
    const next = {...config, [key]:value};
    // Changing the presentation chooses its matching default support entry.
    // Choosing support afterwards may move the whole connection block to buttons.
    if (key === 'connectionDisplay' && value !== config.connectionDisplay) {
      next.supportAccess = value === 'list' ? 'preview' : 'button';
    }
    return normalize(next);
  }
  function fromURL(query) {
    const q = typeof query === 'string' ? new URLSearchParams(query) : query;
    const explicit = ['mvp','target'].includes(q.get('preset'));
    const legacyMvp = !explicit && q.get('mvp') === '1';
    const preset = explicit ? q.get('preset') : legacyMvp ? 'mvp' : 'target';
    const value = {preset, ...presets[preset]};
    if (!explicit && !legacyMvp) {
      // Old operator links selected the combined shell as well as support mode.
      Object.assign(value, {supportAccess:q.get('operator') === '1' ? 'thread' : 'preview', sectionLayout:q.get('operator') === '1' || q.get('merged') === '1' ? 'combined' : 'separate', proactiveCommunication:false});
      if (q.has('events')) value.important = value.insights = q.get('events') !== '0';
      if (q.has('reminders')) value.notifications = q.get('reminders') !== '0';
    }
    for (const key of keys) {
      const param = params[key];
      if (!q.has(param)) continue;
      // Legacy MVP URLs carried stale, overridden values. Preserve their effective
      // baseline. New constructor URLs always include preset and explicit values.
      if (legacyMvp && ['stories','proactiveCommunication','unifiedTabbar','connectionDisplay','segments'].includes(key)) continue;
      const raw = q.get(param);
      if (key === 'unifiedTabbar') { if (['unified','split'].includes(raw)) value[key] = raw === 'unified'; }
      else if (enums[key]) { if (enums[key].includes(raw)) value[key] = raw; }
      else if (raw === '1' || raw === '0') value[key] = raw === '1';
    }
    // Previous constructor links used insights for both important events and insights.
    if (explicit && !q.has('important') && q.has('insights')) value.important = value.insights;
    return normalize(value);
  }
  function writeURL(q, config) {
    const c = normalize(config);
    ['mvp','operator','events','reminders','merged','seller'].forEach(key => q.delete(key));
    q.set('preset', c.preset);
    keys.forEach(key => q.set(params[key], key === 'unifiedTabbar' ? c[key] ? 'unified' : 'split' : typeof c[key] === 'boolean' ? c[key] ? '1' : '0' : c[key]));
    return q;
  }
  function derive(c) {
    const requestsOnly = !c.insights && !c.tasks;
    const inlineRequests = c.supportAccess !== 'preview';
    const overviewEnabled = inlineRequests || c.important || c.insights || c.tasks;
    const categories = ['requests', ...(c.insights ? ['insights'] : []), ...(c.tasks ? ['tasks'] : [])];
    return {
      requestsOnly, overviewEnabled, inlineRequests, operatorInThread:c.supportAccess === 'thread',
      // Outer navigation and inner content segmentation are separate decisions.
      mainSegments:overviewEnabled && c.sectionLayout === 'separate',
      overviewCategories:overviewEnabled ? categories.filter(key => key !== 'requests' || c.overviewRequests) : [],
      connectionEntries:[...(c.supportAccess === 'button' ? ['support'] : []), ...(c.manager ? ['manager'] : []), 'call','letters', ...(c.notifications ? ['notifications'] : [])],
      categories
    };
  }
  function chips(c) {
    const result = [];
    if(c.important) result.push({key:'important',label:'Замечен высокий риск'});
    if(c.insights) result.push({key:'insights',label:'4 инсайта'});
    if(c.tasks) result.push({key:'tasks',label:'Задачи'});
    const skills = {
      statement:'Скачать выписку', tariff:'Расскажи про тариф', forecast:'Прогноз кассовых разрывов',
      details:'Показать реквизиты', currency:'Покажи курс валют', limits:'Лимиты переводов', create:'Создать задачу'
    };
    const pool = result.length ? [c.proactiveCommunication?'forecast':'statement', ...(c.tasks?['create']:[]),'statement','details','tariff','forecast','currency','limits'] : ['statement','tariff','forecast','details','currency','limits'];
    for(const key of new Set(pool)) { if(result.length === 6) break; result.push({key,label:skills[key]}); }
    return result;
  }
  function modified(c) { return keys.some(key => c[key] !== presets[c.preset][key]); }
  const api = {presets, keys, normalize, update, fromURL, writeURL, derive, chips, modified};
  root.SpotlightConfigModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
