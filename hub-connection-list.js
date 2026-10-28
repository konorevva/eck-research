/* Authored Connection content from UCC MVP. Shared by the existing light/dark runtimes. */
(() => {
  if (!window.SpotlightHubConfiguration) return;
  const base = new URL('.', document.currentScript.src);
  const data = {
  "managers": [
    {
      "name": "Екатерина Андреева",
      "role": "Клиентский менеджер",
      "image": "assets/figma/mvp/manager-7671.png"
    },
    {
      "name": "Александр Краснов",
      "role": "Клиентский менеджер",
      "image": "assets/figma/mvp/manager-7672.png"
    },
    {
      "name": "Кирилл Петров",
      "role": "Клиентский менеджер",
      "image": "assets/figma/mvp/manager-7673.png"
    },
    {
      "name": "Евгения Чижова",
      "role": "Клиентский менеджер",
      "image": "assets/figma/mvp/manager-7674.png"
    },
    {
      "name": "Роман Данилов",
      "role": "Клиентский менеджер",
      "image": "assets/figma/mvp/manager-7675.png"
    },
    {
      "name": "Сергей Иванов",
      "role": "Валютный контролёр",
      "image": "assets/figma/mvp/manager-7677.png"
    }
  ],
  "chatsHTML": "<button type=\"button\" class=\"chat-row chat-row--wrap\" data-contact-chat=\"support\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v3/bubble-lines.svg\" alt=\"\"></span><span class=\"chat-row-text\"><span class=\"chat-row-title\">Чат с поддержкой</span><span class=\"chat-row-sub\">Евгений, назовите последние 4 цифры вашей кредитки</span></span><span class=\"chat-row-meta hub-support-pin\" aria-label=\"Закреплено\"><time>12:55</time><i class=\"hub-pin-icon\" aria-hidden=\"true\"></i></span></button>\n<button type=\"button\" class=\"chat-row\" data-contact-chat=\"krasnov\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v3/user-tie.svg\" alt=\"\"></span><span class=\"chat-row-text\"><span class=\"chat-row-title\">Александр Краснов</span><span class=\"chat-row-sub\">Всегда пожалуйста! ☺️</span></span><span class=\"chat-row-meta\"><time>12:55</time><b class=\"chat-row-badge\" aria-label=\"1 непрочитанное сообщение\">1</b></span></button>\n            <button type=\"button\" class=\"chat-row\" data-contact-chat=\"manager\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v3/user-tie.svg\" alt=\"\"></span><span class=\"chat-row-text\"><span class=\"chat-row-title\">Екатерина Андреева</span><span class=\"chat-row-sub\">Отправьте ваши реквизиты</span></span><span class=\"chat-row-meta\"><time>12:55</time></span></button>\n            ",
  "lettersHTML": "<div class=\"mvp-letter\"><span class=\"chat-row-tile\"><img src=\"assets/figma/refresh/event-alert.svg\" alt=\"\"></span><span class=\"mvp-letter-copy\"><b>ИП ЩИПЛЕЦОВА НАТАЛЬЯ ВАЛЕНТИНОВНА</b><span>Альфа Конфа для предпринимателей Архангельска</span><small>Без категории. Здравствуйте! Приглашаем вас на событие года для бизнеса - АЛЬФА КОНФУ. Она покорила уже много городов, Архангельск на очереди.</small></span><time>12:55</time></div><div class=\"mvp-letter\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v2/mail.svg\" alt=\"\"></span><span class=\"mvp-letter-copy\"><b>ИП ЩИПЛЕЦОВА НАТАЛЬЯ ВАЛЕНТИНОВНА</b><span>Альфа Конфа для предпринимателей Архангельска</span><small>Без категории. Здравствуйте! Приглашаем вас на событие года для бизнеса - АЛЬФА КОНФУ. Она покорила уже много городов, Архангельск на очереди.</small><em>📄 Выписка.xml <span>+3</span></em></span><time>12:55</time></div><div class=\"mvp-letter\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v2/mail.svg\" alt=\"\"></span><span class=\"mvp-letter-copy\"><b>ИП ЩИПЛЕЦОВА НАТАЛЬЯ ВАЛЕНТИНОВНА</b><span>Альфа Конфа для предпринимателей Архангельска</span><small>Без категории. Здравствуйте! Приглашаем вас на событие года для бизнеса - АЛЬФА КОНФУ. Она покорила уже много городов, Архангельск на очереди.</small></span><time>12:55</time></div><div class=\"mvp-letter\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v2/mail.svg\" alt=\"\"></span><span class=\"mvp-letter-copy\"><b>ЗАО СТАРТПРОЕКТ</b><span>Технологический саммит IT-инноваций</span><small>Встреча лидеров индустрии для обмена опытом и презентации новых решений в IT-сфере.</small></span><time>15:30</time></div><div class=\"mvp-letter\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v2/mail.svg\" alt=\"\"></span><span class=\"mvp-letter-copy\"><b>ООО РОСТ ЭНЕРГИЯ</b><span>Эко-Форум Северо-Запада</span><small>Экологические инновации и устойчивое развитие. Присоединяйтесь к дискуссиям и мастер-классам на форуме.</small></span><time>14:10</time></div><div class=\"mvp-letter\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v2/mail.svg\" alt=\"\"></span><span class=\"mvp-letter-copy\"><b>ЗАО СТАРТПРОЕКТ</b><span>Технологический саммит IT-инноваций</span><small>Встреча лидеров индустрии для обмена опытом и презентации новых решений в IT-сфере.</small></span><time>15:30</time></div>",
  "connectionHTML": "<section class=\"v2-connection hub-connection-list\" aria-label=\"Связь\">\n            \n            \n            <button class=\"mvp-section-title\" data-open-chats type=\"button\">Чаты <img src=\"assets/figma/2026-09-29/chevron-section.svg\" alt=\"\"></button>\n            <button type=\"button\" class=\"chat-row chat-row--wrap\" data-contact-chat=\"support\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v3/bubble-lines.svg\" alt=\"\"></span><span class=\"chat-row-text\"><span class=\"chat-row-title\">Чат с поддержкой</span><span class=\"chat-row-sub\">Евгений, назовите последние 4 цифры вашей кредитки</span></span><span class=\"chat-row-meta hub-support-pin\" aria-label=\"Закреплено\"><time>12:55</time><i class=\"hub-pin-icon\" aria-hidden=\"true\"></i></span></button>\n<button type=\"button\" class=\"chat-row\" data-contact-chat=\"krasnov\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v3/user-tie.svg\" alt=\"\"></span><span class=\"chat-row-text\"><span class=\"chat-row-title\">Александр Краснов</span><span class=\"chat-row-sub\">Всегда пожалуйста! ☺️</span></span><span class=\"chat-row-meta\"><time>12:55</time><b class=\"chat-row-badge\" aria-label=\"1 непрочитанное сообщение\">1</b></span></button>\n            <button type=\"button\" class=\"chat-row\" data-contact-chat=\"manager\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v3/user-tie.svg\" alt=\"\"></span><span class=\"chat-row-text\"><span class=\"chat-row-title\">Екатерина Андреева</span><span class=\"chat-row-sub\">Отправьте ваши реквизиты</span></span><span class=\"chat-row-meta\"><time>12:55</time></span></button>\n            \n            <button type=\"button\" class=\"mvp-section-title\" data-open-managers>Менеджеры <img src=\"assets/figma/2026-09-29/chevron-section.svg\" alt=\"\"></button><button class=\"mvp-manager-preview\" data-manager-profile=\"Екатерина Андреева\" type=\"button\"><img src=\"assets/figma/mvp/manager-7671.png\" alt=\"\"><span>Екатерина Андреева<small>Клиентский менеджер</small></span></button><button class=\"mvp-manager-preview\" data-manager-profile=\"Александр Краснов\" type=\"button\"><img src=\"assets/figma/mvp/manager-7672.png\" alt=\"\"><span>Александр Краснов<small>Клиентский менеджер</small></span></button><button class=\"mvp-manager-preview\" data-manager-profile=\"Кирилл Петров\" type=\"button\"><img src=\"assets/figma/mvp/manager-7673.png\" alt=\"\"><span>Кирилл Петров<small>Клиентский менеджер</small></span></button><h2 class=\"mvp-section-title\">Звонок</h2><div class=\"mvp-call\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v2/phone.svg\" alt=\"\"></span><span>Для Москвы и области<small>+7 (495) 755-58-58</small></span></div><div class=\"mvp-call\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v2/phone.svg\" alt=\"\"></span><span>Для регионов России<small>8 (800) 100-77-33</small></span></div><button type=\"button\" class=\"mvp-section-title\" data-open-letters>Письма <img src=\"assets/figma/2026-09-29/chevron-section.svg\" alt=\"\"></button><div class=\"mvp-letter\"><span class=\"chat-row-tile\"><img src=\"assets/figma/refresh/event-alert.svg\" alt=\"\"></span><span class=\"mvp-letter-copy\"><b>ЗАО СТАРТПРОЕКТ</b><span>Технологический саммит IT-инноваций</span><small>Встреча лидеров индустрии для обмена опытом и презентации новых решений в IT-сфере.</small></span><time>12:55</time></div><div class=\"mvp-letter\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v2/mail.svg\" alt=\"\"></span><span class=\"mvp-letter-copy\"><b>ИП ЩИПЛЕЦОВА НАТАЛЬЯ ВАЛЕНТИНОВНА</b><span>Альфа Конфа для предпринимателей Архангельска</span><small>Без категории. Здравствуйте! Приглашаем вас на событие года для бизнеса - АЛЬФА КОНФУ. Она покорила уже много городов, Архангельск на очереди.</small><em>📄 Выписка.xml <span>+3</span></em></span><time>12:55</time></div><div class=\"mvp-letter\"><span class=\"chat-row-tile\"><img src=\"assets/figma/v2/mail.svg\" alt=\"\"></span><span class=\"mvp-letter-copy\"><b>ООО РОСТ ЭНЕРГИЯ</b><span>Эко-Форум Северо-Запада</span><small>Экологические инновации и устойчивое развитие. Присоединяйтесь к дискуссиям и мастер-классам на форуме.</small></span><time>14:10</time></div></section>"
};
  const sampleChats = [
    ['ivanov', 'Сергей Иванов', 'Документы по валютному переводу проверены', '11:40'],
    ['petrov', 'Кирилл Петров', 'Подготовил для вас предложение по эквайрингу', 'Вчера']
  ].map(([id, name, preview, time]) => `<button type="button" class="chat-row" data-contact-chat="${id}"><span class="chat-row-tile"><img src="assets/figma/v3/user-tie.svg" alt=""></span><span class="chat-row-text"><span class="chat-row-title">${name}</span><span class="chat-row-sub">${preview}</span></span><span class="chat-row-meta"><time>${time}</time></span></button>`).join('');
  data.chatsHTML += sampleChats;
  data.connectionHTML = data.connectionHTML.replace('<button type="button" class="mvp-section-title" data-open-managers', sampleChats + '<button type="button" class="mvp-section-title" data-open-managers');
  // Attachments use the existing monochrome icon, never a platform emoji.
  for (const key of ['connectionHTML', 'lettersHTML']) {
    data[key] = data[key].replaceAll('📄 ', '<img class="mvp-attachment-icon" src="assets/figma/refresh/paperclip.svg" alt="">');
  }
  const resolveAssets = html => html.replace(/src="(assets\/[^"]+)"/g, (_, path) => 'src="' + new URL(path, base).href + '"');
  for (const key of ['connectionHTML', 'chatsHTML', 'lettersHTML']) data[key] = resolveAssets(data[key]);
  data.managers.forEach(manager => { manager.image = new URL(manager.image, base).href; });
  const fullConnection = data.connectionHTML;
  const fullChats = data.chatsHTML;
  const fullManagers = data.managers;
  const preview = document.createElement('template');
  preview.innerHTML = fullConnection;
  preview.content.querySelectorAll('[data-contact-chat]:not([data-contact-chat="support"]), [data-manager-profile]').forEach(node => node.remove());
  preview.content.querySelectorAll('[data-open-chats], [data-open-managers]').forEach(node => node.remove());
  preview.content.querySelectorAll('.mvp-call').forEach((row, i) => {
    const link = document.createElement('a'); link.className = row.className;
    link.href = i === 0 ? 'tel:+74957555858' : 'tel:88001007733'; link.innerHTML = row.innerHTML;
    row.replaceWith(link);
  });
  const mvpConnection = preview.innerHTML;
  const chats = document.createElement('template'); chats.innerHTML = fullChats;
  chats.content.querySelectorAll('[data-contact-chat]:not([data-contact-chat="support"])').forEach(node => node.remove());
  const managerTemplate=document.createElement('template');managerTemplate.innerHTML=fullChats;
  const managerRow=managerTemplate.content.querySelector('[data-contact-chat="manager"]').outerHTML;
  const config = () => window.SpotlightHubConfiguration.state;
  const supportRow = chats.content.querySelector('[data-contact-chat="support"]').outerHTML;
  function supportPreview() {
    if (config().preset !== 'mvp') return supportRow;
    const row = document.createElement('template'); row.innerHTML = supportRow;
    row.content.querySelector('.hub-pin-icon')?.remove();
    const meta = row.content.querySelector('.hub-support-pin');
    meta?.classList.remove('hub-support-pin'); meta?.removeAttribute('aria-label');
    return row.innerHTML;
  }
  const detailTemplate = document.createElement('template'); detailTemplate.innerHTML = mvpConnection;
  detailTemplate.content.querySelector('[data-contact-chat="support"]').remove();
  const details = detailTemplate.innerHTML;
  const labels = {support:'Поддержка', manager:'Менеджер', call:'Звонок', letters:'Письма', notifications:'Уведомления'};
  const icons = {support:'assets/figma/v3/bubble-lines.svg', manager:'assets/figma/refresh/managers.svg', call:'assets/figma/v2/phone.svg', letters:'assets/figma/v2/mail.svg', notifications:'assets/figma/bell.svg'};
  const actions = {support:'data-contact-chat="support"',manager:'data-contact-chat="manager"',call:'data-open-call aria-haspopup="dialog"',letters:'data-open-letters',notifications:''};
  function shortcut(key, compact = false) {
    const icon = '<img src="'+new URL(icons[key],base).href+'" alt="">';
    const notification = key === 'notifications' ? ' hub-reminder-action' : '';
    const label = labels[key];
    if (compact) return '<button type="button" class="chat-row hub-connection-entry'+notification+'" '+actions[key]+'><span class="chat-row-tile">'+icon+'</span><span class="chat-row-text"><span class="chat-row-title">'+label+'</span></span></button>';
    return '<button type="button" class="communication-action'+notification+'" '+actions[key]+'><span class="communication-tile">'+icon+(key==='letters'?'<i class="hub-mail-dot" aria-label="1 непрочитанное письмо">1</i>':'')+'</span><span>'+label+'</span></button>';
  }
  function render() {
    const c=config();
    const hasPreview=c.supportAccess==='preview';
    const showChatTitle=hasPreview&&(c.connectionDisplay==='buttons'||c.overviewEnabled);
    const chatTitle=showChatTitle?'<h2 class="hub-contact-section-title">'+(c.manager?'Чаты':'Чат')+'</h2>':'';
    const preview=hasPreview?supportPreview()+(c.manager?managerRow:''):'';
    const heading=c.overviewEnabled&&c.sectionLayout==='combined'?'<h2 class="hub-merged-connection-title">Связь с банком</h2>':'';
    if(c.connectionDisplay==='buttons') return '<section class="hub-connection-buttons">'+heading+'<nav class="communication-actions communication-actions--v3" aria-label="Быстрая связь">'+c.connectionEntries.map(key=>shortcut(key)).join('')+'</nav>'+(preview?'<div class="hub-connection-list">'+chatTitle+preview+'</div>':'')+'</section>';
    const prefix=heading+chatTitle+preview;
    const body=document.createElement('div');body.innerHTML=details;
    const section=body.firstElementChild;section.insertAdjacentHTML('afterbegin',prefix);
    if(c.notifications)section.insertAdjacentHTML('beforeend',shortcut('notifications',true));
    return body.innerHTML;
  }
  Object.defineProperties(data, {
    connectionHTML: {get:render},
    chatsHTML: {get:()=> (config().supportAccess!=='thread'?supportPreview():'')},
    managers: {get:()=> fullManagers.slice(0,1)}
  });
  data.render=render;
  window.SpotlightConnectionList = data;
})();
