/* Prototype editions, not a live scheduler. */
(() => {
  const tasks = [
    {id:'yuan', created:1791446400000, title:'Курс юаня', schedule:'Каждое утро, 09:00', icon:'💱'},
    {id:'weekly', created:1791360000000, title:'Мои итоги недели в банке', schedule:'Пятница, 18:00', icon:'🗓', preview:'Внутреннее саммари · история выпусков'},
    {id:'marketplaces', created:1791273600000, title:'Маркетплейсы для продавцов', schedule:'Пятница, 17:00', icon:'🛒', preview:'Маркетплейсы: итоги недели'}
  ];
  const savedReminders = (window.SpotlightThreadStore?.list() || []).filter(record => record.reminder?.phase === 'saved');
  tasks.unshift(...savedReminders.map(record => ({id:record.id, title:record.reminder.title, schedule:record.reminder.repeat + ', ' + record.reminder.time, icon:'💱'})));
  function saveEventReminder(source, details) {
    const store=window.SpotlightThreadStore;
    let record=store.list().find(item=>item.reminder?.eventSource===source);
    if(!record)record=store.create(details.title,'regular');
    store.update(record.id,{title:details.title,reminder:{phase:'saved',eventSource:source,title:details.title,repeat:details.repeat,time:details.time,bodyInstruction:details.bodyInstruction,instruction:details.bodyInstruction}});
    store.append(record.id,'assistant',details.confirmation,true);
    const task={id:record.id,title:details.title,schedule:details.repeat+', '+details.time,icon:'💳'};
    const index=tasks.findIndex(item=>item.id===record.id);
    if(index<0)tasks.unshift(task);else tasks[index]=task;
    taskDescriptions[record.id]=details.bodyInstruction;
    window.dispatchEvent(new Event('spotlight-hub:seller'));
    return record;
  }
  const connected = () => window.SpotlightHubConfiguration?.state.sellerConnected !== false;
  const prompt = text => '<button type="button" data-insight-prompt><img src="assets/figma/2026-09-29/arrow-dark.svg" alt=""><span>' + text + '</span></button>';
  const actions = texts => '<div class="detail-actions hub-digest-actions">' + texts.map(prompt).join('') + '</div>';
  function preview(calm) {
    return calm ? 'Маркетплейсы: всё спокойно · +690 000 ₽ выплат' : '+690 000 ₽ выплат · WB поднимает комиссию' + (connected() ? ' · заканчивается диван «Лофт»' : '');
  }
  const removedTasks = new Set();
  function removeTask(record) {
    const task = tasks.find(task => task.id === record.id || long(task.id).title === record.title);
    if (!task) return;
    removedTasks.add(task.id);
    tasks.splice(tasks.indexOf(task), 1);
    window.SpotlightThreadStore.list().forEach(item => {
      if (item.id === record.id || item.title === record.title) window.SpotlightThreadStore.remove(item.id);
    });
    window.dispatchEvent(new Event('spotlight-hub:seller'));
    syncUnreadIndicators();
  }
  const escapeCard = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const taskDescriptions = {
    yuan:'Проверять курс юаня и присылать краткую сводку об изменениях.',
    weekly:'Собирать поступления, расходы и важные события в банке за неделю.',
    marketplaces:'Подводить итоги продаж, выплат и изменений на маркетплейсах за неделю.'
  };
  savedReminders.forEach(record=>{if(record.reminder.bodyInstruction)taskDescriptions[record.id]=record.reminder.bodyInstruction;});
  function formatSchedule(value) {
    const schedule = String(value || '').trim();
    if (!schedule) return 'Расписание не задано';
    const parts = schedule.split(/,\s*/);
    const repeat = parts.shift();
    const time = parts.join(', ');
    const weekdays = {'По понедельникам':'Понедельник','По вторникам':'Вторник','По средам':'Среда','По четвергам':'Четверг','По пятницам':'Пятница','По субботам':'Суббота','По воскресеньям':'Воскресенье'};
    const day = weekdays[repeat] || (/^(Понедельник|Вторник|Среда|Четверг|Пятница|Суббота|Воскресенье)$/.test(repeat) ? repeat : '');
    if (day) return 'Еженедельно · ' + day + (time ? ', ' + time : '');
    const label = /^(Каждое утро|Каждый день|Ежедневно)$/.test(repeat) ? 'Ежедневно' : repeat === 'Раз в неделю' ? 'Еженедельно' : repeat;
    return label + (time ? ' · ' + time : '');
  }
  function taskEmoji(title) {
    if (/юан|валют|курс|cny/i.test(title)) return '💱';
    if (/маркетплейс|wildberries|ozon/i.test(title)) return '🛒';
    if (/итог|отчёт|отчет|аналит|сводк|продаж/i.test(title)) return '📊';
    if (/выплат|плат[её]ж|сч[её]т/i.test(title)) return '💳';
    if (/отзыв|вопрос|сообщен/i.test(title)) return '💬';
    if (/остат|постав|закуп/i.test(title)) return '📦';
    if (/новост|дайджест/i.test(title)) return '📰';
    return '🗓️';
  }
  function taskRecord(id) {
    return window.SpotlightThreadStore.get(id) || window.SpotlightThreadStore.list().find(record => record.taskId === id);
  }
  function sortedTasks() {
    return tasks.slice().sort((a,b) => (taskRecord(b.id)?.created || b.created || 0) - (taskRecord(a.id)?.created || a.created || 0));
  }
  function cards() {
    const rows = sortedTasks().map(task => {
      const record=taskRecord(task.id);
      const completed=record?.taskCompletedAt && record.unread && !record.taskRunning;
      return '<button type="button" class="event-card hub-regular-card" data-task-created="'+(record?.created || task.created || 0)+'" data-regular-task="'+escapeCard(task.id)+'"><b class="hub-task-title-row"><span class="hub-task-name"><span aria-hidden="true">'+taskEmoji(task.title)+'</span> '+escapeCard(task.title)+'</span>'+(completed?'<span class="hub-task-completed">Выполнена</span>':'')+'</b><span class="hub-task-summary">'+escapeCard(taskDescriptions[task.id] || 'Выполнять задачу по выбранному расписанию и присылать результат.')+'</span><span class="hub-regular-schedule">'+escapeCard(formatSchedule(task.schedule))+'</span></button>';
    }).join('');
    return '<section class="hub-regular"><h2 class="content-title"><button type="button" class="hub-overview-section-link" data-open-overview-segment="tasks">Задачи<span aria-hidden="true" class="hub-overview-chevron"></span></button></h2><div class="event-strip-clip"><div class="event-strip">'+rows+'</div></div></section>';
  }
  function detail(id, edition = 'current') {
    const task = tasks.find(task => task.id === id);
    if (!task) return '';
    const history = '<section class="hub-regular-history"><h2>История выпусков</h2><button type="button" data-regular-edition="current" data-regular-task="' + id + '" aria-pressed="' + (edition === 'current') + '">6–10 октября · последний выпуск</button><button type="button" data-regular-edition="previous" data-regular-task="' + id + '" aria-pressed="' + (edition === 'previous') + '">29 сентября – 3 октября</button></section>';
    if (id !== 'marketplaces') return '<time>' + task.schedule + '</time><h1>' + task.title + '</h1><p>' + (id === 'yuan' ? 'Задача: проверять курс юаня каждое утро в 9:00.' : 'Сводка поступлений, расходов и важных событий в банке за неделю.') + '</p><div class="detail-actions"><button type="button" data-regular-long="' + id + '">Подробнее в Альфа-Интеллекте</button></div>' + (id === 'weekly' ? history : '');
    const calm = edition === 'previous';
    return '<time>Пятница, 17:00</time><h1>Маркетплейсы · ' + (calm ? '29 сентября – 3 октября' : '6–10 октября') + '</h1><p>' + (calm ? preview(true) : (connected() ? 'Выплаты в норме, два момента требуют внимания' : 'Выплаты в норме, изменение комиссии требует внимания')) + '</p><div class="hub-digest-sections"><section><h2>💰 +690 000 ₽ за неделю</h2><p>На 8% больше прошлой. Следующие выплаты: WB вт ~450 000 ₽ · Ozon чт ~190 000 ₽.</p></section>' + (calm ? '' : '<section><h2>⚠️ WB поднимает комиссию в «Мебели» с 1 ноября</h2><p>Для вас около −40 000 ₽ в месяц.</p></section>' + (connected() ? '<section><h2>📦 Диван «Лофт» закончится через 6 дней</h2><p>На закупку нужно 180 000 ₽, на счёте хватает.</p></section>' : '')) + '<p>✅ Остальное спокойно: ' + (connected() ? 'возвраты в норме, ' : '') + 'новых правил для вас нет.</p></div><div class="detail-actions"><button type="button" data-regular-long="marketplaces">Подробнее в Альфа-Интеллекте</button></div>' + history;
  }
  function long(id, edition) {
    const custom = window.SpotlightThreadStore?.get(id);
    if (custom?.reminder) return {title:custom.title, body:custom.messages.find(message => message.kind === 'assistant')?.text || ''};
    if (id === 'yuan') return {title:'Курс юаня · утренняя задача',body:"<h2>Юань утром · 9 октября, 9:00</h2><h3>💱 1 ¥ = 11,40 ₽</h3><p>На 0,12 ₽ ниже вчерашнего уровня 11,52 ₽ — снижение примерно на 1%.</p><h3>📦 Что это значит для закупки</h3><p>Партия фурнитуры на 50 000 ¥ сегодня обошлась бы в 570 000 ₽ — на 6 000 ₽ меньше, чем вчера. Комиссия и фактический курс банка в расчёт не включены.</p><h3>📅 На что обратить внимание</h3><p>Если расчёт с поставщиком уже запланирован, можно сверить сумму счёта с текущим курсом банка. Утреннее снижение не гарантирует, что юань продолжит дешеветь.</p>" + actions(['Рассчитай стоимость закупки','Покажи изменение курса за неделю'])};
    if (id === 'weekly') return {title:'Мои итоги недели в банке · ' + (edition === 'previous' ? '29 сентября – 3 октября' : '6–10 октября'),body:"<h2>Итоги недели · 6–10 октября</h2><p>Анна, неделя для вашего мебельного магазина завершилась с положительным денежным потоком. Вот что произошло по счетам.</p><h3>💰 Поступило 1 240 000 ₽</h3><p>690 000 ₽ — выплаты WB и Ozon, 410 000 ₽ — продажи в магазине, 140 000 ₽ — оплаты заказов по счёту.</p><h3>🧾 Ушло 980 000 ₽</h3><p>Поставщикам — 560 000 ₽, сотрудникам — 240 000 ₽, за аренду — 100 000 ₽, на логистику — 60 000 ₽, на комиссии и обслуживание — 20 000 ₽.</p><h3>📊 Итог по деньгам: +260 000 ₽</h3><p>Остаток вырос с 420 000 ₽ до 680 000 ₽. Это разница поступлений и списаний, а не прибыль магазина.</p><h3>📅 На следующей неделе</h3><p>Запланировано 320 000 ₽ обязательных платежей: 180 000 ₽ поставщику и 140 000 ₽ налогов. После них останется 360 000 ₽ без учёта новых поступлений. Ожидаемые выплаты маркетплейсов — ещё около 640 000 ₽.</p><h3>⚠️ Стоит проверить</h3><p>Покупатель задержал оплату заказа на 90 000 ₽. Задача поможет уточнить дату поступления и точнее спланировать закупку.</p><h3>💡 Фокус на неделю</h3><p>Зарезервировать 320 000 ₽ под обязательные платежи и напомнить об оплате просроченного заказа.</p>" + actions(['Разбери расходы недели','Покажи ближайшие платежи','Подготовь сообщение покупателю'])};
    const title = 'Неделя на маркетплейсах, ' + (edition === 'previous' ? '29 сентября – 3 октября' : '6–10 октября');
    if (edition === 'previous') return {title,body:'<h2>' + title + '</h2><p>' + preview(true) + '</p><p>Выплаты в норме, новых правил для вас нет.</p>'};
    return {title,body:'<h2>' + title + '</h2><h3>💰 Деньги</h3><p>Поступило 690 000 ₽: WB 480 000 ₽, Ozon 210 000 ₽. Это на 8% больше прошлой недели. На следующей ожидаю около 640 000 ₽, задержек нет.</p><h3>⚠️ Комиссия WB</h3><p>С 1 ноября в «Мебели» 19% вместо 17%, для вас это около −40 000 ₽ в месяц.' + (connected() ? ' Сильнее всего заденет диван «Лофт»: маржа упадёт примерно до 6%.' : '') + '</p>' + (connected() ? '<h3>📦 Товары</h3><p>«Лофт» закончится через 6 дней. На закупку нужно 180 000 ₽, денег хватает с учётом налога. Возвраты в норме.</p>' : '') + '<h3>📢 Что ещё изменилось</h3><p>Ozon снизил тариф на доставку крупногабарита. WB требует новые фото в карточках мебели' + (connected() ? ': 4 ваших товара не подходят.' : '.') + '</p><h3>📅 Следующая неделя</h3><p>Выплаты во вторник и четверг.' + (connected() ? ' В акции WB со скидкой 25% участвовать невыгодно.' : '') + '</p>' + (connected() ? '<h3>💡 Совет недели</h3><p>Перенести шкафы на Ozon и пересчитать цену на «Лофт» до 1 ноября.</p>' : '') + '<div class="detail-actions hub-digest-actions">' + (connected() ? ['Пересчитай цены с новой комиссией','Сравни WB и Ozon по моим товарам','Какие карточки исправить?','Оформить закупку'] : ['Как изменятся выплаты с новой комиссией?','Какие правила изменились?']).map(prompt).join('') + '</div>'};
  }
  const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function editor(initial, creating, save) {
    const dialog = document.createElement('dialog');
    dialog.className = 'hub-reminder-settings';
    dialog.innerHTML = '<form><h2>' + (creating ? 'Новая задача' : 'Настроить задачу') + '</h2><label>Название<input name="title" type="text" required maxlength="100" placeholder="Следить за курсом юаня"></label><label>Повтор<input name="repeat" type="text" required maxlength="80" placeholder="Каждый день"></label><label>Время<input name="time" type="text" inputmode="numeric" required pattern="([01][0-9]|2[0-3]):[0-5][0-9]" placeholder="09:00" maxlength="5" aria-describedby="reminder-time-hint"></label><p id="reminder-time-hint" class="hub-reminder-time-hint">По московскому времени</p><div><button type="button" data-cancel>Отмена</button><button type="submit" class="hub-reminder-primary">' + (creating ? 'Создать' : 'Сохранить') + '</button></div></form>';
    document.getElementById('stage').appendChild(dialog);
    for (const key of ['title','repeat','time']) dialog.querySelector('[name="' + key + '"]').value = initial[key] || '';
    dialog.querySelector('[data-cancel]').onclick = () => dialog.close();
    dialog.querySelector('form').onsubmit = event => {
      event.preventDefault();
      const values = Object.fromEntries(['title','repeat','time'].map(key => [key, dialog.querySelector('[name="' + key + '"]').value.trim()]));
      if (!values.title || !values.repeat) return;
      dialog.close(); save(values);
    };
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
  }
  function configure(record) {
    const task = tasks.find(task => record.title.startsWith(task.id === 'marketplaces' ? 'Неделя на маркетплейсах' : task.title));
    const initial = record.reminder || {title:task?.title || record.title, repeat:task?.schedule.includes('утро') ? 'Каждый день' : 'По пятницам', time:task?.schedule.match(/\d{1,2}:\d{2}/)?.[0].padStart(5,'0') || '09:00'};
    editor(initial, false, values => {
      const reminder = {...record.reminder, ...values};
      if (reminder.instruction) reminder.instruction = 'Задача: ' + values.title + '. Расписание: ' + values.repeat + ', ' + values.time + ' по Москве. ' + reminder.bodyInstruction;
      window.SpotlightThreadStore.update(record.id, {title:values.title, reminder});
      if (task) { task.title = values.title; task.schedule = values.repeat + ', ' + values.time; }
      window.dispatchEvent(new Event('spotlight-hub:seller'));
    });
  }
  const taskExamples = {
    'Сводка продаж': 'Продажи, возвраты и выручка на Wildberries и Ozon',
    'Контроль остатков': 'Какие товары заканчиваются и пора поставить на склад',
    'Проверка выплат': 'Поступления от площадок, комиссии и удержания',
    'Отзывы покупателей': 'Новые отзывы и вопросы, на которые нужно ответить'
  };
  const taskQuestions = {
    kind: ['Что должна делать запланированная задача?', [...Object.keys(taskExamples),'Другое']],
    repeat: ['Как часто запускать задачу?', ['Ежедневно','По будням','Раз в неделю','Один раз','Другое']],
    time: ['В какое время запускать?', ['Утром, 9:00','Днём, 13:00','Вечером, 19:00','Другое']],
    notify: ['Как сообщать вам о результате?', ['Push и email','Только push','Только email','Без уведомлений','Другое']],
    news: ['По какой теме собирать новости?', ['AI и нейросети','Финтех и банки','Продукт и стартапы','Общие новости','Другое']],
    weekday: ['В какой день недели запускать?', ['Понедельник','Пятница','Воскресенье','Другое']],
    language: ['На каком языке сводка и какие источники?', ['Русский, все источники','Русский, только RU-источники','Английский','Другое']],
    date: ['В какой день запустить задачу?', ['Сегодня','Завтра','Другое']],
    details: ['Что нужно подготовить для задачи?', ['Другое']]
  };
  function question(phase = 'kind') { return '<p>' + taskQuestions[phase][0] + '</p>'; }
  function questionnaireIntent(text) {
    const value=text.toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
    if (/(?:не\s+(?:надо|нужно|хочу|созда|дела|скач|формир)|отмен|не нужна)/.test(value)) return null;
    const request=/(?:созда|сдела|настро|добав|завед|запланир|постав|сформир|подготов|получ|скач|закаж|хочу|нужн|можно|давай)/.test(value);
    if (/выписк/.test(value) && (request || /^выписк[ауи]?[.!?]*$/.test(value))) return 'statement';
    if ((/(?:задач|напоминан)/.test(value) && request) || /^(?:пожалуйста[, ]+)?напомни/.test(value)) return 'task';
    return null;
  }
  // A transcript summary is structured data, never a single answer to the next wizard.
  function cleanTaskAnswer(value, key) {
    let text=String(value || '').trim();
    const prompt=taskQuestions[key]?.[0];
    if(prompt && text.startsWith(prompt)) {
      text=text.slice(prompt.length);
      const ends=Object.values(taskQuestions).map(q=>text.indexOf(q[0])).filter(i=>i>=0);
      if(ends.length)text=text.slice(0,Math.min(...ends));
    }
    return text.trim();
  }
  function confirmation(r) {
    const actions={
      'Контроль остатков':'проверять остатки на Wildberries и Ozon и собирать сводку товаров, которые заканчиваются и требуют пополнения',
      'Сводка продаж':'собирать сводку продаж, возвратов и выручки на Wildberries и Ozon',
      'Проверка выплат':'проверять поступления от площадок, комиссии и удержания и собирать сводку выплат',
      'Отзывы покупателей':'собирать новые отзывы и вопросы покупателей, на которые нужно ответить',
      'Сводка новостей':'собирать краткую сводку новостей'+(r.details?' по теме «'+r.details+'»':'')
    };
    const weekdays={'Понедельник':'по понедельникам','Пятница':'по пятницам','Воскресенье':'по воскресеньям'};
    const repeat=r.repeat==='Ежедневно'?'Каждый день':r.repeat==='По будням'?'По будням':r.repeat==='Раз в неделю'?'Каждую неделю, '+(weekdays[r.day] || r.day || 'в выбранный день'):r.repeat==='Один раз'?(r.day || 'В выбранный день'):r.repeat;
    const when=repeat+' в '+r.time+' по Москве';
    const action=actions[r.kind] || 'выполнять задачу «'+r.title+'» и готовить результат';
    const notify={'Push и email':'О готовности сообщу push-уведомлением и письмом на email.','Только push':'О готовности сообщу push-уведомлением.','Только email':'Готовую сводку пришлю на email.','Без уведомлений':'Результат будет ждать вас в этом диалоге, без дополнительных уведомлений.'};
    return '<h2>Задача создана</h2><p>'+escape(when+' буду '+action+'.')+'</p><p>'+escape(notify[r.notify] || 'Результат сохраню в этом диалоге.')+'</p>'+(r.language?'<p>'+escape('Язык и источники: '+r.language+'.')+'</p>':'');
  }
  function answerSummary(answers, keys, questions = taskQuestions) { return '<dl class="hub-task-answer-summary">' + answers.map((answer,index) => '<div><dt>' + escape(questions[keys[index]]?.[0] || 'Ответ') + '</dt><dd>' + escape(cleanTaskAnswer(answer, keys[index]) || 'Пропущено') + '</dd></div>').join('') + '</dl>'; }
  function options(copy) { const item = Object.values(taskQuestions).find(item => item[0] === copy); return item ? item[1].map(title => [title,title]) : null; }
  function clarifyWizard(record, value) {
    const r = record.reminder;
    value=cleanTaskAnswer(value,r.phase);
    const update = () => window.SpotlightThreadStore.update(record.id,{title:r.title || 'Новая задача',reminder:r});
    const next = phase => {r.phase=phase;update();return question(phase);};
    const afterDetails = () => /недел|пятниц|понедельник|воскресенье/i.test(r.repeat) ? next('weekday') : r.repeat === 'Один раз' ? next('date') : finish();
    const finish = () => {
      if (r.kind === 'Сводка новостей' && !r.language) return next('language');
      r.phase='saved';
      r.bodyInstruction = [r.kind, taskExamples[r.kind], r.details, r.language].filter(Boolean).join('. ');
      r.instruction = r.bodyInstruction + '. Расписание: ' + r.repeat + (r.day ? ', '+r.day : '') + ', '+r.time+' по Москве. Уведомления: '+r.notify;
      update();
      if (!tasks.some(task => task.id === record.id)) tasks.unshift({id:record.id,title:r.title,schedule:r.repeat+', '+r.time,icon:'🗓'});
      window.dispatchEvent(new Event('spotlight-hub:seller'));
      return confirmation(r);
    };
    switch(r.phase) {
      case 'kind': r.kind=value;r.title=value;return next('repeat');
      case 'repeat': r.repeat=value;return next('time');
      case 'time': {
        const match=value.match(/(?:^|[^\d])([01]?\d|2[0-3]):([0-5]\d)(?!\d)/);
        if(!match) return '<p>Укажите время в формате ЧЧ:ММ, например 09:00. По Москве.</p>';
        r.time=match[1].padStart(2,'0')+':'+match[2];return next('notify');
      }
      case 'notify': r.notify=value;return r.kind==='Сводка новостей' ? next('news') : afterDetails();
      case 'news': case 'details': r.details=value;r.title=r.kind+' · '+value;return afterDetails();
      case 'weekday': r.day=value;return finish();
      case 'date': r.day=value;return finish();
      case 'language': r.language=value;return finish();
    }
    return null;
  }
  function clarify(record, text) {
    const reminder = record.reminder;
    if (!reminder || reminder.phase === 'saved') return null;
    const value = text.trim();
    if (reminder.wizard) return clarifyWizard(record, value);
    const update = () => window.SpotlightThreadStore.update(record.id, {title:reminder.title || record.title, reminder});
    if (reminder.phase === 'topic') {
      reminder.title = value;
      reminder.phase = 'repeat'; update();
      return '<p>Как часто выполнять задачу?</p>';
    }
    if (reminder.phase === 'repeat') {
      reminder.repeat = value;
      reminder.phase = value === 'Еженедельно' ? 'weekday' : 'time'; update();
      return '<p>' + (reminder.phase === 'weekday' ? 'В какой день недели?' : 'В какое время выполнять задачу? Напишите время, например 09:00. По Москве.') + '</p>';
    }
    if (reminder.phase === 'weekday') {
      reminder.repeat = 'Еженедельно, ' + value.toLocaleLowerCase('ru');
      reminder.phase = 'time'; update();
      return '<p>В какое время выполнять задачу? Напишите время, например 09:00. По Москве.</p>';
    }
    if (reminder.phase === 'time') {
      const match = value.match(/^(?:в\s*)?([01]?\d|2[0-3])(?:[:.]([0-5]\d))?(?:\s*(?:часов|часа|час))?$/i);
      if (!match) return '<p>Напишите время в формате ЧЧ:ММ, например 09:00. По Москве.</p>';
      reminder.time = match[1].padStart(2,'0') + ':' + (match[2] || '00');
      reminder.bodyInstruction = /юан|cny/i.test(reminder.title) ? 'Сообщать курс CNY/RUB, изменение за сутки, источник и время обновления курса.' : 'Выполнять задачу: «' + reminder.title + '». Присылать готовый результат или сводку по теме.';
      reminder.instruction = 'Задача: ' + reminder.title + '. Расписание: ' + reminder.repeat + ', ' + reminder.time + ' по Москве. ' + reminder.bodyInstruction;
      reminder.phase = 'saved'; update();
      if (!tasks.some(task => task.id === record.id)) tasks.unshift({id:record.id,title:reminder.title,schedule:reminder.repeat + ', ' + reminder.time,icon:'🗓'});
      window.dispatchEvent(new Event('spotlight-hub:seller'));
      return '<h2>Задача сохранена</h2><p>' + escape(reminder.title) + '</p><p>' + escape(reminder.repeat) + ', в ' + escape(reminder.time) + ' по Москве.</p><h3>Инструкция для следующих выпусков</h3><p>' + escape(reminder.bodyInstruction) + '</p>';
    }
    return null;
  }
  const store = window.SpotlightThreadStore;
  function runResult(record) {
    const id=record.taskId;
    if (['yuan','weekly','marketplaces'].includes(id)) return long(id).body;
    const title=record.reminder?.title || record.title;
    if (/проверка выплат|выплат/i.test(title)) return '<h2>Проверка выплат завершена</h2><p>За последнюю неделю поступило 690 000 ₽: Wildberries — 480 000 ₽, Ozon — 210 000 ₽.</p><p>Суммы совпадают с ожидаемыми выплатами. Задержек и расхождений в демонстрационных данных нет.</p><p>Следующие ожидаемые выплаты — около 640 000 ₽.</p>';
    if (/юан|валют|курс/i.test(title)) return long('yuan').body;
    if (/итог.*недел|сводк.*банк/i.test(title)) return long('weekly').body;
    if (record.reminder?.eventSource) return '<h2>'+escapeCard(title)+'</h2><p>'+escapeCard(record.reminder.bodyInstruction || 'Напоминание по задаче.')+'</p><p>Это пробный запуск. Напоминание по расписанию сохранено.</p>';
    return '<h2>Результат пробного запуска</h2><p>'+escapeCard(title)+'</p><p>В демонстрационных данных новых событий по этой задаче нет. Дополнительных действий не требуется.</p><p>Следующий запуск — по сохранённому расписанию: '+escapeCard([record.reminder?.repeat,record.reminder?.time].filter(Boolean).join(', '))+'.</p>';
  }
  function canRun(record) {
    return !!record && !record.pending && !record.taskRunning && (record.reminder?.phase === 'saved' || ['yuan','weekly','marketplaces'].includes(record.taskId));
  }
  function startRun(record) {
    if (!canRun(record)) return null;
    const body=runResult(record);
    store.update(record.id,{taskId:record.taskId || record.id,taskRun:true,taskRunning:true,taskCompletedAt:null,unread:false});
    return body;
  }
  ['marketplaces','weekly','yuan'].forEach(id => {
    const digest=long(id),task=tasks.find(task=>task.id===id);
    let record=store.list().find(item=>item.taskId===id || item.title===digest.title);
    if (!record) {
      record=store.create(digest.title,'regular');record.created=task.created;
      store.append(record.id,'assistant',digest.body,true);
      store.update(record.id,{unread:true,taskRun:true,taskId:id,taskCompletedAt:Date.now()});
    } else if (!record.taskId) store.update(record.id,{taskId:id,taskCompletedAt:record.updated});
  });
  // Existing demonstration payout checks start with one completed, unread result.
  savedReminders.filter(record=>/^Проверка выплат(?:$| ·)/i.test(record.reminder.title) && record.taskCompletedAt === undefined).forEach(record=>{
    store.append(record.id,'assistant',runResult(record),true);
    store.update(record.id,{taskId:record.id,taskRun:true,unread:true,taskCompletedAt:Date.now()});
  });
  store.list().filter(record=>record.reminder?.wizard).forEach(record=>{
    const r=record.reminder,broken=r.kind || r.title;
    const clean=cleanTaskAnswer(broken,'kind');
    if(!broken || clean===broken)return;
    r.kind=clean;r.title=clean;
    r.bodyInstruction=[clean,taskExamples[clean],r.details,r.language].filter(Boolean).join('. ');
    r.instruction=r.bodyInstruction+'. Расписание: '+r.repeat+', '+r.time+' по Москве. Уведомления: '+r.notify;
    record.messages.forEach(message=>{
      if(message.kind==='user')message.text=message.text.split(escape(broken)).join(escape(clean));
      if(message.kind==='assistant' && message.text.includes('<h2>Задача создана</h2>'))message.text=confirmation(r);
    });
    store.update(record.id,{title:clean,reminder:r});
    const task=tasks.find(task=>task.id===record.id);if(task)task.title=clean;
  });
  function syncUnreadIndicators() {
    const count = store.list().filter(record=>record.taskCompletedAt && record.unread && !record.taskRunning).length;
    document.querySelectorAll('[data-open-digests]').forEach(button => {
      const label = count ? count + (count === 1 ? ' задача выполнена' : ' задачи выполнено') : 'Мои задачи';
      const text = Array.from(button.childNodes).find(node => node.nodeType === 3);
      if (text && text.textContent !== label) text.textContent = label;
    });
    const unread = store.list().filter(record => record.unread).length;
    document.querySelectorAll('button').forEach(button => {
      const history = button.matches('.hub-history, [data-open-threads], [data-request-action="history"]');
      if(history && !button.closest('.hub-more-items')) {
        button.classList.toggle('hub-has-unread', unread > 0);
        button.dataset.unreadCount = String(unread);
        button.setAttribute('aria-label',(!window.SpotlightHubConfiguration.state.requestsOnly?'Обзор':window.SpotlightHubConfiguration.state.preset==='mvp'?'Все запросы':'Все диалоги')+(unread?', есть новые дайджесты':''));
      }
    });
  }
  new MutationObserver(syncUnreadIndicators).observe(document.getElementById('stage'), {childList:true,subtree:true});
  window.addEventListener('spotlight-hub:thread-read',syncUnreadIndicators);
  syncUnreadIndicators();
  window.SpotlightRegular = {taskRecord,sortedTasks,canRun,startRun,runResult,saveEventReminder,cards,formatSchedule,taskEmoji,detail,long,configure,question,options,questions:taskQuestions,taskExamples,questionnaireIntent,answerSummary,cleanTaskAnswer,confirmation,clarify,remove:removeTask,hasTask:id=>!removedTasks.has(id)};
})();
