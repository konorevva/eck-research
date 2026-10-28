/* Deterministic banking scenarios shared by the light/dark prototype and both skill UIs. */
(function (root) {
  'use strict';
  const accounts = ['Расчётный ••8080', 'Расчётный ••7435', 'Валютный ••2915'];
  const prompts = {details:'Для какого счёта показать реквизиты?', tariff:'По какому счёту рассказать о тарифе?'};
  const clean = value => String(value || '').replace(/\u00a0/g,' ').trim();
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const assetBase=root.document ? new URL('.',document.currentScript.src) : null;
  const asset=path=>assetBase?new URL(path,assetBase).href:path;
  function filename(data) {
    const extension={PDF:'pdf',Excel:'xls','1C':'txt',CSV:'csv'}[data.format] || 'csv';
    return 'Выписка-'+(data.account.match(/(?:8080|7435|2915)/)?.[0] || 'все-счета')+'.'+extension;
  }
  function choices(copy) { return Object.values(prompts).includes(clean(copy)) ? accounts.map(a=>[a,a]) : null; }
  function statement(answers) {
    if (answers.length !== 3 || answers.some(a=>!clean(a))) return 'Не все параметры выписки указаны. Для подготовки нужны счёт, период и формат.';
    const [account,period,format] = answers.map(clean);
    const payload=escape(JSON.stringify({account,period,format}));
    const name=filename({account,period,format});
    const letter={PDF:'P',Excel:'X','1C':'1C',CSV:'C'}[format] || 'C';
    const fileIcon='<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path fill="currentColor" d="M6 2h8a4 4 0 0 1 4 4v2h2a4 4 0 0 1 4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><text x="14" y="22" fill="white" text-anchor="middle" font-size="'+(letter.length>1?'11':'16')+'" font-weight="700" font-family="Arial,sans-serif">'+letter+'</text></svg>';
    const feedback=[['thumb-up','Полезный ответ'],['thumb-down','Неполезный ответ']].map(([key,label])=>'<button type="button" data-feedback="'+key+'" aria-label="'+label+'" aria-pressed="false"><img src="'+asset('assets/figma/feedback/'+key+'.svg')+'" alt=""></button>').join('');
    return '<div class="hub-statement-result" aria-label="Выписка готова"><button type="button" class="hub-statement-download" data-statement-download="'+payload+'" aria-label="Скачать '+escape(name)+'" title="'+escape(name)+' · '+escape(account)+' · '+escape(period)+'"><span class="hub-file-format" data-format="'+escape(format)+'">'+fileIcon+'</span><span class="hub-file-info"><span class="hub-file-name"><span>'+escape(name.slice(0,-8))+'</span><span>'+escape(name.slice(-8))+'</span></span><small class="hub-file-size" data-statement-meta>'+escape(format)+'</small></span></button><div class="hub-answer-feedback hub-file-actions" role="group" aria-label="Действия с выпиской">'+feedback+'<button type="button" data-statement-download="'+payload+'" aria-label="Скачать выписку"><img src="'+asset('assets/figma/v3/notification-download.svg')+'" alt=""></button></div></div>';
  }
  function reply(value, messages=[]) {
    const text=clean(value), lower=text.toLocaleLowerCase('ru');
    const last=messages.filter(m=>m.kind==='assistant').at(-1);
    const copy=clean(last?.text);
    const selected=accounts.find(a=>text.includes(a.slice(-4)));
    if (Object.values(prompts).includes(copy)) {
      if (!selected) {
        if (/выписк/.test(lower)) return null;
        if (/реквизит/.test(lower)) return {text:prompts.details,rich:false};
        if (/тариф/.test(lower)) return {text:prompts.tariff,rich:false};
        return {text:copy,rich:false};
      }
      if (copy===prompts.details) return {rich:true,text:'<div class="hub-account-result"><h2>Реквизиты счёта</h2><p>'+escape(selected)+'</p><dl><div><dt>Получатель</dt><dd>ИП Щиплецова Наталья Валентиновна</dd></div><div><dt>Счёт</dt><dd>'+escape(selected.startsWith('Валютный')?'40702840••••••••2915':'40702810••••••••'+selected.slice(-4))+'</dd></div><div><dt>Банк</dt><dd>АО «Альфа-Банк»</dd></div><div><dt>Валюта счёта</dt><dd>'+(selected.startsWith('Валютный')?'Доллары США':'Российские рубли')+'</dd></div></dl></div>'};
      return {rich:true,text:'<div class="hub-account-result"><h2>Тариф по счёту '+escape(selected.slice(-6))+'</h2><p>'+escape(selected)+'</p><p>'+(selected.startsWith('Валютный')?'По этому счёту доступны валютные переводы, конвертация и валютный контроль. Комиссия зависит от валюты, направления и суммы перевода.':'Тариф включает обслуживание расчётного счёта, платежи контрагентам, переводы и операции с бизнес-картой.')+'</p><p>Включённые лимиты и комиссия сверх них зависят от типа операции. Что разобрать подробнее: обслуживание счёта, платежи или переводы?</p></div>'};
    }
    if (/реквизит/.test(lower)) return {text:prompts.details,rich:false};
    if (/тариф/.test(lower)) return {text:prompts.tariff,rich:false};
    return null;
  }
  // The label follows the queued result, including when its dialogue is reopened.
  // Account/period/format selection and incomplete forms retain the default loader.
  function loadingLabel(copy, rich) {
    return rich && String(copy).startsWith('<div class="hub-statement-result"') ? 'Готовлю выписку' : null;
  }
  const api={accounts,prompts,choices,statement,reply,loadingLabel,filename};
  if(typeof module==='object' && module.exports) module.exports=api;
  root.SpotlightBanking=api;
  if(!root.document) return;

  // Downloads are generated locally from the selected prototype parameters.
  const sampleRows=[['Дата','Операция','Сумма']];
  async function pdf(lines) {
    await document.fonts.ready;
    const canvas=document.createElement('canvas');canvas.width=1190;canvas.height=1684;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1190,1684);ctx.fillStyle='#202124';ctx.font='28px "Alfa Interface", sans-serif';
    lines.forEach((line,i)=>ctx.fillText(line,80,110+i*58,1030));
    const jpeg=Uint8Array.from(atob(canvas.toDataURL('image/jpeg',.9).split(',')[1]),c=>c.charCodeAt(0));
    const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
    const push=x=>{const b=typeof x==='string'?enc.encode(x):x;parts.push(b);length+=b.length;};
    const object=(id,body)=>{offsets[id]=length;push(id+' 0 obj\n'+body+'\nendobj\n');};
    push('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    object(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    offsets[4]=length;push('4 0 obj\n<< /Type /XObject /Subtype /Image /Width 1190 /Height 1684 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n');push(jpeg);push('\nendstream\nendobj\n');
    const paint='q 595 0 0 842 0 0 cm /Im0 Do Q';object(5,'<< /Length '+paint.length+' >>\nstream\n'+paint+'\nendstream');
    const xref=length;push('xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
    return new Blob(parts,{type:'application/pdf'});
  }
  const files=new Map();
  function prepare(data) {
    const key=JSON.stringify(data);
    if(files.has(key))return files.get(key);
    const result=(async()=>{ 
      const lines=['Выписка по счёту',data.account,'Период: '+data.period,'Демонстрационные данные прототипа',...sampleRows.map(row=>row.join(' · '))];
      let blob,extension;
      if(data.format==='PDF'){blob=await pdf(lines);extension='pdf';}
      else if(data.format==='Excel'){
        const rows=lines.slice(0,4).map(line=>[line]).concat(sampleRows);
        blob=new Blob(['<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Выписка"><Table>'+rows.map(row=>'<Row>'+row.map(v=>'<Cell><Data ss:Type="String">'+escape(v)+'</Data></Cell>').join('')+'</Row>').join('')+'</Table></Worksheet></Workbook>'],{type:'application/vnd.ms-excel'});extension='xls';
      }else if(data.format==='1C'){
        blob=new Blob(['1CClientBankExchange\r\nВерсияФормата=1.03\r\nКодировка=UTF-8\r\nОтправитель=Демонстрационный прототип\r\nРасчСчет='+data.account+'\r\nПериод='+data.period+'\r\nКонецФайла'],{type:'text/plain;charset=utf-8'});extension='txt';
      }else{blob=new Blob(['\uFEFF'+lines.slice(0,4).join('\r\n')+'\r\n'+sampleRows.map(row=>row.map(v=>'"'+v.replace(/"/g,'""')+'"').join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});extension='csv';}
      return blob;
    })();
    files.set(key,result);
    result.catch(()=>files.delete(key));
    return result;
  }
  function updateFileMetadata() {
    document.querySelectorAll('[data-statement-meta]:not([data-ready])').forEach(label=>{
      label.dataset.ready='true';
      const button=label.closest('[data-statement-download]');
      prepare(JSON.parse(button.dataset.statementDownload)).then(blob=>{
        if(!label.isConnected)return;
        const megabytes=blob.size>=1024*1024;
        const size=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(blob.size/(megabytes?1024*1024:1024));
        label.textContent=size+(megabytes?' МБ':' КБ');
      }).catch(()=>{label.textContent='Не удалось подготовить файл';});
    });
  }
  // Generate once and use that same file for its displayed size and both download controls.
  new MutationObserver(updateFileMetadata).observe(document.getElementById('chatMessages'),{childList:true,subtree:true});
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-statement-download]');if(!button || button.disabled)return;
    button.disabled=true;
    try {
      const data=JSON.parse(button.dataset.statementDownload);
      const blob=await prepare(data);
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=filename(data);
      link.hidden=true;document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(error){
      window.dispatchEvent(new CustomEvent('spotlight-hub:toast',{detail:'Не удалось скачать выписку. Попробуйте ещё раз.'}));
    }finally{button.disabled=false;}
  });
})(typeof window==='undefined'?globalThis:window);
