/* Shared AI surface details for the current Hub configuration. */
(function () {
  'use strict';
  if (!window.SpotlightHubConfiguration || !window.Spotlight) return;
  var glassDefinitions=document.createElement('div');
  glassDefinitions.setAttribute('aria-hidden','true');
  glassDefinitions.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  glassDefinitions.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"><defs><filter id="hub-edge-refraction" x="-10%" y="-20%" width="120%" height="140%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.045" numOctaves="1" seed="7" result="ripple"/><feDisplacementMap in="SourceGraphic" in2="ripple" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter></defs></svg>';
  document.body.appendChild(glassDefinitions);
  var base = new URL('.', document.currentScript.src);
  var app = window.Spotlight;
  var stage = document.getElementById('stage');
  var chat = document.getElementById('chatView');
  var input = document.getElementById('chatInput');
  document.addEventListener('pointerdown',function(event){
    if(event.target.closest('.chip,.hub-statement-options button')) event.preventDefault();
  },true);
  // Keep the submit target still until click; the submit handler then dismisses the keyboard.
  document.getElementById('chatSend').addEventListener('pointerdown', function (event) { event.preventDefault(); });
  var directory = document.getElementById('directoryView');
  // Short titles share the viewport centre. Longer titles use the space after Back.
  var titles = [chat.querySelector('.flow-header h1'), directory.querySelector('.native-header h1')];
  var titleMeasure = document.createElement('canvas').getContext('2d');
  function syncTitles() {
    titles.forEach(function (title) {
      var style = getComputedStyle(title);
      titleMeasure.font = style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily;
      var text = (title.querySelector('.hub-dialogue-title') || title).textContent;
      var width = titleMeasure.measureText(text).width + (parseFloat(style.letterSpacing) || 0) * Math.max(0, text.length - 1);
      var centredWidth = title.parentElement.clientWidth - 248;
      title.classList.toggle('hub-title-long', width > centredWidth);
    });
  }
  var titleChanges = new MutationObserver(syncTitles);
  var titleSize = new ResizeObserver(syncTitles);
  titles.forEach(function (title) {
    titleChanges.observe(title, {childList:true, subtree:true, characterData:true});
    titleSize.observe(title.parentElement);
  });
  document.fonts.ready.then(syncTitles);
  syncTitles();
  var suggestions = document.createElement('section');
  suggestions.className = 'hub-suggestions';
  suggestions.setAttribute('aria-label', 'Предложения к запросу');
  suggestions.hidden = true;
  [
    ['Платежи', 'assets/figma/mvp/banknote.svg'],
    ['Депозиты', 'assets/figma/mvp/safe-box.svg'],
    ['Как закрыть депозит', 'assets/icons/search.svg'],
    ['Какие есть типы депозитов', 'assets/icons/search.svg'],
    ['Как открыть депозит', 'assets/icons/search.svg']
  ].forEach(function (entry) {
    var button = document.createElement('button');
    button.type = 'button';
    var icon = document.createElement('img');
    icon.src = new URL(entry[1], base).href; icon.alt = '';
    var label = document.createElement('span'); label.textContent = entry[0];
    button.append(icon, label);
    button.addEventListener('click', function () {
      input.value = entry[0];
      input.dispatchEvent(new Event('input', {bubbles:true}));
      input.focus({preventScroll:true});
    });
    suggestions.appendChild(button);
  });
  suggestions.addEventListener('pointerdown', function (event) { event.preventDefault(); });
  chat.appendChild(suggestions);
  function sync() {
    var show = app.activeView() === 'chatView' && app.appState().spotlight !== 'closed' && chat.dataset.aiStatus === 'new' && !!input.value.trim();
    suggestions.hidden = !show;
    stage.classList.toggle('has-hub-suggestions', show);
  }
  input.addEventListener('input', sync);
  new MutationObserver(sync).observe(chat, {attributes:true, attributeFilter:['class','data-ai-status']});

  var glass = document.createElement('div');
  glass.className = 'hub-directory-glass'; glass.setAttribute('aria-hidden','true');
  directory.appendChild(glass);
  // The older dark shell has no global input dock; reuse its existing new-request action.
  if (!directory.querySelector('.page-input-dock')) {
    var dock = document.createElement('button');
    dock.type = 'button'; dock.className = 'hub-request-input';
    dock.innerHTML = '<img src="' + new URL('assets/figma/v3/plus.svg', base).href + '" alt=""><span>Спросите что угодно</span>';
    dock.addEventListener('click', app.newRequest);
    directory.appendChild(dock);
  }
  var statementOptions = document.createElement('div');
  statementOptions.className='hub-statement-options';
  statementOptions.setAttribute('aria-label','Варианты ответа');
  statementOptions.hidden=true;
  statementOptions.addEventListener('pointerdown',function(event){if(!event.target.closest('.hub-task-card'))event.preventDefault();});
  document.getElementById('chatMessages').after(statementOptions);
  const taskCaptions = {
    ...window.SpotlightRegular.taskExamples,
    'Сводка новостей':'Собрать новости по теме и прислать краткую сводку',
    'Черновик поста':'Подготовить текст для Telegram или соцсетей',
    'Напоминание':'Напомнить о важном деле в выбранное время',
    'Обзор документов':'Проверить документы и подвести итоги',
    'Ежедневно':'Каждый день, включая выходные', 'По будням':'С понедельника по пятницу',
    'Раз в неделю':'В выбранный день недели', 'Один раз':'Выполнить в выбранную дату',
    'Утром, 9:00':'В начале рабочего дня', 'Днём, 13:00':'В середине дня', 'Вечером, 19:00':'Подвести итоги дня',
    'Push и email':'Уведомление на устройстве и письмо на почту', 'Только push':'Уведомление на устройстве',
    'Только email':'Письмо на электронную почту', 'Без уведомлений':'Результат будет доступен в чате',
    'AI и нейросети':'Новые модели, продукты и релизы', 'Финтех и банки':'Новости банковского сектора и финтеха',
    'Продукт и стартапы':'Запуски продуктов, команды и инвестиции', 'Общие новости':'Главные события дня',
    'Понедельник':'В начале недели', 'Пятница':'Перед выходными', 'Воскресенье':'В конце недели',
    'Русский, все источники':'Сводка на русском по русско- и англоязычным источникам',
    'Русский, только RU-источники':'Сводка по русскоязычным источникам', 'Английский':'Сводка на английском языке',
    'Сегодня':'В выбранное время сегодня', 'Завтра':'В выбранное время завтра'
  };
  const statementQuestions = {
    account:['С какого счёта нужна выписка?', ['Расчётный ••8080','Расчётный ••7435','Валютный ••2915','Все счета']],
    period:['За какой период нужна выписка?', ['Сегодня','Вчера','Этот месяц','Прошлый месяц','Этот год']],
    format:['В каком формате скачать выписку?', ['PDF','Excel','CSV','1C']]
  };
  const statementCaptions = {
    'Расчётный ••8080':'Доступно 50 000,00 ₽', 'Расчётный ••7435':'Доступно 1 000,00 ₽',
    'Валютный ••2915':'Доступно 300,00 $', 'Все счета':'Операции по всем вашим счетам',
    'Сегодня':'Операции за текущий день', 'Вчера':'Операции за предыдущий день',
    'Этот месяц':'С начала месяца по сегодня', 'Прошлый месяц':'За предыдущий календарный месяц',
    'Этот год':'С начала года по сегодня', 'PDF':'Для просмотра и печати',
    'Excel':'Для анализа в таблице', 'CSV':'Для загрузки в другие системы', '1C':'Для импорта в бухгалтерию'
  };
  const statementPrompts={'Давайте выберем счёт':'account','Какой период вам нужен?':'period','Остался формат — какой подойдёт?':'format'};
  var disposeQuestionnaire = null;
  function renderTaskCard(mode='task',currentQuestion='') {
    const isStatement=mode==='statement',isEventReminder=mode==='event-reminder';
    const questions=isStatement?statementQuestions:isEventReminder?window.SpotlightEventActions.reminderQuestions:window.SpotlightRegular.questions;
    const captions=isStatement?statementCaptions:isEventReminder?window.SpotlightEventActions.reminderCaptions:taskCaptions;
    const values={}; let step=0, advanceTimer, resizeAnimation, finished=false;
    const threadId=app.currentThread(), store=window.SpotlightThreadStore;
    const checkpoint=store.get(threadId)?.messages.length;
    const saveProgress=()=>{if(!finished && threadId)store.update(threadId,{questionnaire:{mode,values:{...values},step,checkpoint}});};
    const finishProgress=()=>{finished=true;if(threadId)store.update(threadId,{questionnaire:null});};
    const cancelAdvance=()=>clearTimeout(advanceTimer);
    disposeQuestionnaire=()=>{saveProgress();cancelAdvance();if(resizeAnimation)resizeAnimation.cancel();};
    const path=()=>isEventReminder?['time']:isStatement?['account','period','format']:['kind','repeat','time','notify',...(values.kind==='Сводка новостей'?['news']:[]),
      ...(/недел/i.test(values.repeat||'')?['weekday']:values.repeat==='Один раз'?['date']:[]),
      ...(values.kind==='Сводка новостей'?['language']:[])];
    // Rebuild answered steps when switching from inline chips during a conversation.
    const questionKey=text=>(isStatement?statementPrompts[text]:null)||Object.keys(questions).find(key=>questions[key][0]===text);
    let askedKey=null;
    document.querySelectorAll('#chatMessages .chat-message').forEach(message=>{
      const text=message.textContent.replace(/\s+/g,' ').trim();
      if(message.classList.contains('assistant')) {askedKey=questionKey(text)||null;if(askedKey===(isStatement?'account':'kind'))Object.keys(values).forEach(key=>delete values[key]);}
      else if(message.classList.contains('user')) {
        const summary=message.querySelector('.hub-task-answer-summary');
        if(summary) {
          summary.querySelectorAll('div').forEach(row=>{const key=questionKey(row.querySelector('dt')?.textContent.trim());if(key)values[key]=window.SpotlightRegular.cleanTaskAnswer(row.querySelector('dd')?.textContent,key);});
          askedKey=null;
        } else if(askedKey){values[askedKey]=text;askedKey=null;}
      }
    });
    const currentKey=questionKey(currentQuestion);
    step=Math.max(0,path().indexOf(currentKey));
    const saved=store.get(threadId)?.questionnaire;
    if(saved?.mode===mode && saved.checkpoint===checkpoint){Object.assign(values,saved.values);step=Math.min(saved.step,path().length-1);}
    const card=document.createElement('section');card.className='hub-task-card';card.setAttribute('aria-label',isStatement?'Скачать выписку':isEventReminder?'Напоминание о платеже':'Создание задачи');
    statementOptions.appendChild(card);statementOptions.hidden=false;statementOptions.classList.add('is-questionnaire');
    chat.appendChild(statementOptions);
    chat.classList.add('has-task-questionnaire');
    const draw=()=>{
      cancelAdvance();saveProgress();
      const previousHeight=card.offsetHeight;
      const hadContent=card.childElementCount>0;
      if(resizeAnimation)resizeAnimation.cancel();
      window.Spotlight.taskKeyboard(false);
      const steps=path(),key=steps[step],question=questions[key];card.replaceChildren();
      const nav=document.createElement('div');nav.className='hub-task-nav';
      const control=(label,text,action)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);b.textContent=text;b.addEventListener('click',action);return b;};
      const prev=control('Предыдущий вопрос','',()=>{step--;draw();});prev.className='hub-task-prev';prev.disabled=step===0;
      const count=document.createElement('span');count.textContent=(step+1)+' из '+steps.length;count.setAttribute('aria-live','polite');
      const forward=control('Следующий вопрос','',()=>next.click());forward.className='hub-task-forward';forward.disabled=!values[key];
      const close=control('Отменить '+(isStatement?'подготовку выписки':isEventReminder?'создание напоминания':'создание задачи'),'',()=>{finishProgress();cancelAdvance();if(resizeAnimation)resizeAnimation.cancel();window.Spotlight.taskKeyboard(false);statementOptions.hidden=true;chat.classList.remove('has-task-questionnaire');window.Spotlight.cancelQuestionnaire(mode);});close.className='hub-task-close';
      nav.append(prev,count,forward,close);card.append(nav);
      const title=document.createElement('h2');title.textContent=question[0];card.append(title);
      const choices=document.createElement('div');choices.className='hub-task-choices';card.append(choices);
      const custom=document.createElement('textarea');custom.rows=1;custom.placeholder=isStatement&&key==='period'?'Укажите даты…':isEventReminder?'Сегодня, 19:00':'Свой ответ…';custom.setAttribute('aria-label','Свой ответ');
      const listed=question[1].filter(x=>x!=='Другое');if(values[key]&&!listed.includes(values[key]))custom.value=values[key];
      const next=control('Пропустить','Пропустить',()=>{
        cancelAdvance();
        if(isEventReminder && !window.SpotlightEventActions.reminder(values[key])){error.textContent='Выберите время или укажите, например: завтра, 09:00';return;}
        if(key==='time'&&values[key]?.trim()&&!/(?:^|[^\d])([01]?\d|2[0-3]):([0-5]\d)(?!\d)/.test(values[key])) {error.textContent='Укажите время в формате ЧЧ:ММ';return;}
        if(step<path().length-1){step++;draw();return;}
        finishProgress();next.disabled=true;statementOptions.hidden=true;chat.classList.remove('has-task-questionnaire');
        const answers=path().map(k=>values[k]);
        if(isEventReminder)window.Spotlight.completeEventReminder(values.time);
        else if(isStatement)window.Spotlight.completeStatementQuestionnaire(answers,window.SpotlightRegular.answerSummary(answers,path(),questions));
        else window.Spotlight.completeTaskQuestionnaire(answers,path());
      });next.className='hub-task-next';
      const updateNext=()=>{const label=isEventReminder?'Создать':values[key]?.trim()&&!listed.includes(values[key])?'Ответить':'Пропустить';next.textContent=label;next.setAttribute('aria-label',label);next.disabled=isEventReminder&&!values[key]?.trim();};updateNext();
      listed.forEach(label=>{
        const b=control(label,'',()=>{values[key]=label;saveProgress();custom.value='';choices.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));updateNext();forward.disabled=false;cancelAdvance();advanceTimer=setTimeout(()=>{if(card.isConnected&&!card.hidden&&chat.classList.contains('is-active'))next.click();},320);});
        b.setAttribute('aria-pressed',String(values[key]===label));
        const strong=document.createElement('span');strong.textContent=label;
        const caption=document.createElement('small');caption.textContent=captions[label]||'';b.append(strong,caption);choices.append(b);
      });
      custom.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();if(custom.value.trim())next.click();}});
      custom.addEventListener('focus',()=>{cancelAdvance();window.Spotlight.taskKeyboard(true);});
      custom.addEventListener('blur',()=>{window.Spotlight.taskKeyboard(false);});
      custom.addEventListener('input',()=>{values[key]=custom.value;saveProgress();choices.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false'));updateNext();forward.disabled=!custom.value.trim();});card.append(custom);
      const error=document.createElement('p');error.className='hub-task-error';error.setAttribute('role','alert');card.append(error);
      const footer=document.createElement('div');footer.className='hub-task-footer';footer.append(custom,next);card.append(footer,error);
      const scroll=document.getElementById('chatScroll');
      const nextHeight=card.offsetHeight;
      if(hadContent&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        resizeAnimation=card.animate([{height:previousHeight+'px'},{height:nextHeight+'px'}],{duration:280,easing:'cubic-bezier(.22,.68,0,1)'});
        Array.from(card.children).filter(el=>el!==nav).forEach(el=>el.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'}));
      }
      chat.style.setProperty('--task-card-height',nextHeight+'px');
      if(!hadContent)requestAnimationFrame(()=>{scroll.scrollTop=scroll.scrollHeight;});
    };draw();
  }
  var optionKey='';
  function syncStatementOptions() {
    if(app.activeView()!=='chatView') return;
    var messages=Array.from(document.querySelectorAll('#chatMessages .chat-message'));
    const useForms=window.SpotlightHubConfiguration.state.skillsUpdate;
    const record=window.SpotlightThreadStore.get(app.currentThread());
    const saved=record?.questionnaire;
    if(!useForms && saved && saved.checkpoint===record.messages.length) {
      if(disposeQuestionnaire){disposeQuestionnaire();disposeQuestionnaire=null;}
      const statement=saved.mode==='statement',eventReminder=saved.mode==='event-reminder';
      const questions=statement?statementQuestions:eventReminder?window.SpotlightEventActions.reminderQuestions:window.SpotlightRegular.questions;
      const v=saved.values;
      const keys=eventReminder?['time']:statement?['account','period','format']:['kind','repeat','time','notify',...(v.kind==='Сводка новостей'?['news']:[]),...(/недел/i.test(v.repeat||'')?['weekday']:v.repeat==='Один раз'?['date']:[]),...(v.kind==='Сводка новостей'?['language']:[])];
      const last=messages.at(-1)?.textContent.trim();
      const key=statement?statementPrompts[last]:Object.keys(questions).find(k=>questions[k][0]===last);
      optionKey='';statementOptions.hidden=true;chat.classList.remove('has-task-questionnaire');
      app.resumeInlineQuestionnaire(saved,keys,statement?Object.fromEntries(Object.entries(statementPrompts).map(([prompt,k])=>[k,[prompt]])):questions,Math.max(0,keys.indexOf(key)));
      messages=Array.from(document.querySelectorAll('#chatMessages .chat-message'));
    }
    const formIntros=[...Object.values(window.SpotlightRegular.questions),...Object.values(statementQuestions)].map(question=>question[0]).concat(Object.keys(statementPrompts));
    messages.forEach(message=>{
      // Restore old saved prompts through the same skill UI, without legacy action rows.
      const oldOptions=message.querySelector('.hub-event-reminder-options');
      if(oldOptions){message.querySelector('.hub-event-answer').dataset.eventQuestion='credit-reminder';oldOptions.remove();message.querySelector('.hub-answer-feedback')?.remove();}
      if(message.classList.contains('assistant')&&!message.classList.contains('is-loading')&&(message.querySelector('[data-event-question="credit-reminder"]') || formIntros.includes(message.textContent.replace(/\s+/g,' ').trim()))) {
        const hide=useForms && (message===messages.at(-1) || message.classList.contains('hub-task-question-intro'));
        message.classList.toggle('hub-task-question-intro',hide);
        message.hidden=hide;
      }
    });
    var last=messages[messages.length-1];
    var copy=last && last.classList.contains('assistant') && !last.classList.contains('is-loading') ? last.textContent.replace(/\u00a0/g, ' ').trim() : '';
    const eventReminderQuestion=!!last?.classList.contains('assistant') && !!last.querySelector('[data-event-question="credit-reminder"]');
    var options=copy==='Давайте выберем счёт' ? [
      ['Расчётный ••8080 — 50 000,00 ₽','Расчётный ••8080'],
      ['Расчётный ••7435 — 1 000,00 ₽','Расчётный ••7435'],
      ['Валютный ••2915 — 300,00 $','Валютный ••2915'],['Все счета','Все счета']
    ] : copy==='Какой период вам нужен?' ? ['Сегодня','Вчера','Этот месяц','Прошлый месяц','Этот год','Выбрать период'].map(function(x){return [x,x];}) : copy==='Остался формат — какой подойдёт?' ? ['PDF','Excel','CSV','1C'].map(function(x){return [x,x];}) : [];
    if(copy==='Как часто выполнять задачу?') options=['Ежедневно','Еженедельно','По будням','По выходным'].map(function(x){return [x,x];});
    if(copy==='В какой день недели?') options=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'].map(function(x){return [x,x];});
    var accountOptions = window.SpotlightBanking?.choices(copy);
    if(accountOptions) options=accountOptions;
    if(eventReminderQuestion)options=window.SpotlightEventActions.reminderQuestions.time[1].map(label=>[label,label]);
    var taskOptions = window.SpotlightRegular.options(copy);
    if(taskOptions) options=taskOptions;
    var placeholder = options.length ? 'Напишите свой вариант' : copy.includes('О чём вы хотите') || copy.includes('О чём вы хотите') ? 'Какую задачу выполнить?' : copy.includes('время напоминать') || copy.includes('формате ЧЧ:ММ') ? 'Введите время, например 09:00' : 'Спросите что угодно';
    input.dataset.contextPlaceholder = placeholder;
    input.placeholder = placeholder;
    const nextKey=app.currentThread()+':'+String(useForms)+':'+copy;
    if(nextKey===optionKey) return;
    if(disposeQuestionnaire){disposeQuestionnaire();disposeQuestionnaire=null;}
    optionKey=nextKey;document.getElementById('chatMessages').after(statementOptions);statementOptions.replaceChildren();statementOptions.hidden=!options.length;
    statementOptions.classList.remove('is-questionnaire');chat.classList.remove('has-task-questionnaire');
    if(useForms && eventReminderQuestion){last.classList.add('hub-task-question-intro');renderTaskCard('event-reminder',copy);return;}
    if(useForms && statementPrompts[copy]) {last.classList.add('hub-task-question-intro');renderTaskCard('statement',copy);return;}
    if(useForms && taskOptions) {last.classList.add('hub-task-question-intro');renderTaskCard('task',copy);return;}
    options.forEach(function(option){
      var button=document.createElement('button');button.type='button';button.textContent=option[0];
      button.addEventListener('click',function(){
        if(eventReminderQuestion){if(app.completeEventReminder(option[1]))statementOptions.hidden=true;return;}
        if(option[0]==='Выбрать период') return;
        if(option[0]==='Другое'){statementOptions.hidden=true;input.focus();return;}
        statementOptions.hidden=true;
        input.value=option[1];input.dispatchEvent(new Event('input',{bubbles:true}));
        document.getElementById('assistantComposer').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
      });statementOptions.appendChild(button);
    });
    if(options.length) requestAnimationFrame(function(){var scroll=document.getElementById('chatScroll');scroll.scrollTop=scroll.scrollHeight;});
  }
  new MutationObserver(syncStatementOptions).observe(document.getElementById('chatMessages'),{childList:true,subtree:true,characterData:true});
  window.addEventListener('spotlight-hub:skills',()=>{window.Spotlight.taskKeyboard(false);syncStatementOptions();});
  window.addEventListener('spotlight-hub:configuration-applied',()=>{if(app.activeView()!=='chatView'){if(disposeQuestionnaire){disposeQuestionnaire();disposeQuestionnaire=null;}optionKey='';statementOptions.hidden=true;chat.classList.remove('has-task-questionnaire');window.Spotlight.taskKeyboard(false);}});
  syncStatementOptions();
  sync();
})();
