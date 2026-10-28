/* Thread data belongs to a request, independently of the currently displayed surface. */
(function () {
  'use strict';
  if (!window.SpotlightHubConfiguration) return;
  var key = 'spotlight-hub.mmb.threads.v1';
  var storage = window.SpotlightResearch ? window.SpotlightResearch.storage : {getItem: function(key){return sessionStorage.getItem(key);}, setItem: function(key,value){sessionStorage.setItem(key,value);}};
  var records = [];
  var deleted = [];
  var examples = [["Удалённая работа", "Собрала способы оценить продуктивность команды на удалёнке."], ["Тарифы в Альфа-Банке", "Сравним тарифы по обороту, платежам и переводам."], ["Аналитика за квартал", "В отчёте — поступления, расходы и динамика остатка."], ["Визуальный стиль бренда", "Разберём, как цветовая палитра влияет на восприятие бренда."], ["Гибкий график", "Собрала преимущества гибкого графика для команды."], ["Мобильные приложения", "Вот несколько идей для развития мобильного сервиса."], ["UX и поведение клиентов", "Посмотрим, где пользователи теряются на пути к покупке."], ["Обратная связь о CRM", "Подготовила вопросы для опроса клиентов после внедрения CRM."], ["Конкуренты на рынке SaaS", "Сравним продукты по цене, функциям и поддержке."], ["Соцсети и узнаваемость", "Для оценки бренда можно начать с охватов и упоминаний."], ["Спрос на сезонные товары", "Для прогноза сопоставим продажи за прошлые сезоны."], ["Текучесть команды", "Помогу выделить причины увольнений и точки роста."], ["ИИ в клиентском сервисе", "Начнём с типовых вопросов и передачи сложных обращений."], ["Проверка контрагента", "Собрала список сведений для проверки будущего партнёра."], ["Выписка по счёту", "Выберите период и формат, в котором нужна выписка."], ["Подключение эквайринга", "Для подбора решения уточним формат продаж и оборот."], ["Дополнительный счёт", "Подскажу, какие данные понадобятся для открытия счёта."], ["Валютный контроль", "Собрала перечень документов по внешнеторговому договору."], ["Комиссии за переводы", "Посмотрим на тариф и сумму планируемого перевода."], ["Зарплатный проект", "Подготовила план подключения сотрудников к проекту."], ["Лимиты бизнес-карты", "Можно отдельно настроить лимиты покупок и снятия наличных."], ["Сверка платежей", "Сопоставим поступления и списания за прошлый месяц."], ["Ошибочный платёж", "Начнём с проверки статуса и реквизитов платёжного поручения."], ["Справка о счетах", "Уточните, для какой организации требуется справка."], ["Международный перевод", "Проверим валюту, банк получателя и реквизиты перевода."], ["Электронная подпись", "Посмотрим срок действия сертификата и порядок продления."], ["Тариф для нового бизнеса", "Подберём варианты с учётом первых расходов компании."], ["Статус платежа", "Найдём поручение по дате, сумме или получателю."], ["Уведомления по счёту", "Выберите события, о которых хотите получать сообщения."], ["Доступ для сотрудника", "Помогу определить нужную роль и набор разрешений."], ["Расходы на банк", "Разберём комиссии за обслуживание, переводы и эквайринг."], ["План платежей", "Составим календарь обязательных расходов на следующий месяц."]];
  var timers = {};
  try {
    var removed = JSON.parse(storage.getItem(key + '.deleted'));
    if (Array.isArray(removed)) deleted = removed;
    var saved = JSON.parse(storage.getItem(key));
    if (Array.isArray(saved)) records = saved.filter(function (r) {
      return r && deleted.indexOf(r.id) === -1 && typeof r.id === 'string' && typeof r.title === 'string' && Array.isArray(r.messages);
    });
  } catch (_) { /* An unavailable browser store must not block local navigation. */ }
  function persist() {
    window.dispatchEvent(new Event('spotlight-hub:threads-changed'));
    try { storage.setItem(key, JSON.stringify(records)); storage.setItem(key + '.deleted', JSON.stringify(deleted)); } catch (_) {}
  }
  function get(id) { return records.find(function (r) { return r.id === id; }); }
  function create(title, type, id) {
    var record = {id:id || 'request-' + crypto.randomUUID(), title:title, type:type || 'reminder', messages:[], draft:'', turn:0, scroll:0, status:'conversation', created:Date.now(),updated:Date.now()};
    records.unshift(record); persist(); return record;
  }
  function update(id, values) {
    var record = get(id);
    if (!record) return;
    ['draft','turn','scroll','status','title','reminder','unread','operatorStatus','taskRun','questionnaire','insightKey','taskId','taskRunning','taskCompletedAt'].forEach(function (name) { if (values[name] !== undefined) record[name] = values[name]; });
    persist();
  }
  function append(id, kind, text, help) {
    var record = get(id);
    if (!record) return;
    record.messages.push({kind:kind === 'user' ? 'user' : 'assistant', text:String(text), help:!!help});
    record.updated = Date.now(); persist();
  }
  function seed(names, notes) {
    names = names || examples.map(function (entry) { return entry[0]; });
    notes = notes || examples.map(function (entry) { return entry[1]; });
    names.forEach(function (name, index) {
      var id = 'sample-' + index;
      if (deleted.indexOf(id) !== -1) return;
      var existing = get(id);
      // Upgrade only untouched demo conversations; user messages and drafts stay intact.
      if (existing && (existing.updated > 0 || existing.pending)) return;
      var messages = [{kind:'user',text:name,help:false},{kind:'assistant',text:notes[index] || 'Помогу разобраться с вашим вопросом.',help:false}];
      if (existing) { existing.title = name; existing.messages = messages; return; }
      records.push({id:id,title:name,type:'reminder',messages:messages,draft:'',turn:0,scroll:0,status:'conversation',updated:-index});
    });
    persist();
  }
  function remove(id) {
    if (!get(id)) return false;
    clearTimeout(timers[id]); delete timers[id];
    records = records.filter(function (record) { return record.id !== id; });
    if (deleted.indexOf(id) === -1) deleted.push(id);
    persist(); return true;
  }
  function resume(record) {
    if (!record.pending) return;
    clearTimeout(timers[record.id]);
    timers[record.id] = setTimeout(function () {
      if (!get(record.id) || !record.pending) return;
      var reply = record.pending;
      if (record.taskRunning) { record.taskRunning=false;record.taskCompletedAt=Date.now();record.unread=true; }
      if (record.operatorStatus === 'waiting' && reply.text.includes('experiment-operator-message')) {
        record.operatorStatus = 'connected';
        record.messages = record.messages.filter(function(m){return !m.text.includes('experiment-operator-wait');});
      }
      append(record.id, 'assistant', reply.text, reply.help);
      record.turn += reply.advance ? 1 : 0;
      record.status = 'conversation';
      delete record.pending;
      delete timers[record.id];
      persist();
      window.dispatchEvent(new CustomEvent('spotlight-hub:thread-reply', {detail:{id:record.id}}));
    }, Math.max(0, record.pending.due-Date.now()));
  }
  function queue(id, text, help, advance, delay) {
    var record = get(id);
    if (!record) return;
    record.pending = {text:text,help:help,advance:advance,due:Date.now()+delay};
    record.status = 'loading';
    persist(); resume(record);
  }
  function ensureReply(id) {
    var record = get(id);
    if (!record || record.pending || !record.messages.length) return;
    if (record.messages[record.messages.length-1].kind === 'user') {
      queue(id, 'Помогу разобраться с этим вопросом. Уточните детали, и мы посмотрим возможные варианты.', false, false, 3000);
    }
  }
  records.forEach(function(record){if(!Number.isFinite(record.created))record.created=Math.max(0,record.updated || 0);});
  // Replace legacy demo runs once; identified task runs and their read state persist.
  records = records.filter(function (record) {
    return !!record.reminder || !!record.taskId || (record.type !== 'regular' && !/^(Мои итоги недели в банке|Курс юаня ·|Неделя на маркетплейсах,)/.test(record.title));
  });
  persist();
  records.forEach(function(record){
    if (!record.operatorStatus) record.messages = record.messages.filter(function(m){return !m.text.includes('experiment-operator-message');});
  });
  persist();
  records.forEach(resume);
  window.SpotlightThreadStore = {
    create:create, get:get, update:update, append:append, seed:seed, queue:queue, remove:remove, ensureReply:ensureReply,
    list:function () { return records.slice().sort(function (a,b) { return b.updated-a.updated; }); }
  };
})();
