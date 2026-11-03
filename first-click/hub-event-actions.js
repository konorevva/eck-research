/* Event-specific answers use the same demonstration data as the event details. */
(function (root) {
  'use strict';
  const credit = {account:'Счёт погашения кредита', payment:32000, available:20000, scheduled:8000, date:'14 октября'};
  const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
  const reminderTimes = {
    evening:{label:'Сегодня, в 18:00', date:'13 октября', time:'18:00'},
    late:{label:'Сегодня, в 21:00', date:'13 октября', time:'21:00'},
    morning:{label:'Завтра, в 09:00', date:'14 октября', time:'09:00'}
  };
  const labels = {balance:'Проверить, хватит ли денег', remind:'Напомнить о платеже', documents:'Какие документы нужны?', requirements:'Объяснить требования банка'};
  function balance(data=credit) {
    return {enough:data.available>=data.payment, deficit:Math.max(0,data.payment-data.available), remaining:Math.max(0,data.available-data.payment), projectedDeficit:Math.max(0,data.payment-Math.max(0,data.available-data.scheduled))};
  }
  function actions(type) {
    return (type==='credit'?['balance','remind']:['documents','requirements']).map(key=>'<button type="button" data-important-action="'+key+'"><img src="assets/figma/2026-09-29/arrow-dark.svg" alt="">'+labels[key]+'</button>').join('');
  }
  function answer(key) {
    let body;
    if(key==='balance') {
      const result=balance();
      body='<h2>'+(result.enough?'Денег на платёж хватает':'На платёж не хватает '+money(result.deficit))+'</h2><p>Счёт списания: '+credit.account+'.<br>Платёж '+credit.date+': '+money(credit.payment)+'.<br>Доступно сейчас: '+money(credit.available)+'.</p><p>'+(result.enough?'После платежа останется '+money(result.remaining)+'.':money(credit.payment)+' − '+money(credit.available)+' = '+money(result.deficit)+'. На счёт нужно внести эту сумму до списания.')+'</p><p>Также запланировано списание '+money(credit.scheduled)+' за тариф. Если оно пройдёт раньше кредитного платежа, без новых поступлений не будет хватать '+money(result.projectedDeficit)+'.</p>';
    } else if(key==='remind') {
      body='<h2>Когда напомнить о платеже?</h2><p>'+credit.date+' спишется '+money(credit.payment)+'. Выберите время напоминания, по Москве.</p>';
    } else if(key==='documents') {
      body='<h2>Осталось подготовить два пункта</h2><ol><li>Скан или фото акта по договору с ООО «Фанера-Опт» на 260 000 ₽.</li><li>Пояснение к переводу ИП Сидорову на 420 000 ₽ от 18 августа: за что был платёж и как он связан с вашей деятельностью.</li></ol><p>Семь договоров и два других акта уже собраны. Проверьте комплект и отправьте ответ до 3 октября, как указано в запросе банка.</p>';
    } else if(key==='requirements') {
      body='<h2>Что банк просит пояснить</h2><p>В этом запросе нужно подтвердить операции документами и объяснить их назначение.</p><p>Акт по договору с ООО «Фанера-Опт» нужен для подтверждения исполнения сделки на 260 000 ₽. В пояснении по переводу ИП Сидорову укажите, за что перечислены 420 000 ₽ и как эта операция связана с бизнесом.</p><p>Срок из уведомления — 3 октября. В нём указано, что без ответа банк может ограничить операции по счёту.</p>';
    } else return null;
    return '<div class="hub-event-answer"'+(key==='remind'?' data-event-question="credit-reminder"':'')+'>'+body+'</div>';
  }
  function reminder(key) {
    let selected=Object.hasOwn(reminderTimes,key)?reminderTimes[key]:Object.values(reminderTimes).find(item=>item.label===key);
    if(!selected && typeof key==='string') {
      const match=key.trim().replace(/\s/g,' ').toLocaleLowerCase('ru').match(/^(?:(сегодня|завтра)[, ]*?(?:в\s+)?)?([01]?\d|2[0-3]):([0-5]\d)$/);
      if(match) {
        const tomorrow=match[1]==='завтра',time=match[2].padStart(2,'0')+':'+match[3];
        selected={label:(tomorrow?'Завтра':'Сегодня')+', в '+time,date:tomorrow?'14 октября':'13 октября',time};
      }
    }
    if(!selected)return null;
    return {selection:selected.label,title:'Напомнить о платеже по кредиту', repeat:'Однократно', time:selected.date+', '+selected.time, bodyInstruction:'Напомнить о платеже '+money(credit.payment)+' '+credit.date+'.', confirmation:'<div class="hub-event-answer"><h2>Напоминание создано</h2><p>'+selected.date+', в '+selected.time+' по Москве напомню о платеже по кредиту '+money(credit.payment)+'.</p></div>'};
  }
  const reminderQuestions={time:['Когда напомнить о платеже?',Object.values(reminderTimes).map(item=>item.label)]};
  const reminderCaptions=Object.fromEntries(Object.values(reminderTimes).map(item=>[item.label,item.date+' · По Москве']));
  const api={credit,balance,labels,actions,answer,reminder,reminderQuestions,reminderCaptions};
  if(typeof module==='object' && module.exports)module.exports=api;
  root.SpotlightEventActions=api;
})(typeof window==='undefined'?globalThis:window);
