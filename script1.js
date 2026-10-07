
const KEY='specnaz_tasks_v21', MAPKEY='specnaz_map_v20';
let tasks=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('specnaz_tasks_v20')||'[]');
if(!Array.isArray(tasks))tasks=[];
tasks=tasks.map(x=>({t:String(x.t||''),d:!!x.d,date:x.date||'' ,reminded:!!x.reminded}));
function tab(id,b){document.querySelectorAll('section').forEach(s=>s.classList.remove('show'));document.getElementById(id).classList.add('show');document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));if(b)b.classList.add('active');if(id==='mapsec'){if(!onlineMap)initOnlineMap();setTimeout(()=>onlineMap&&onlineMap.resize(),60)}if(id==='weather'&&!document.getElementById('weatherCurrent').innerHTML){renderCachedWeather()}if(id==='tasks')checkTaskReminders()}
function save(){localStorage.setItem(KEY,JSON.stringify(tasks));renderTasks()}
function dateLabel(d){if(!d)return 'Без даты';const [y,m,day]=d.split('-');return new Date(Number(y),Number(m)-1,Number(day)).toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}
function openTaskCalendar(){const overlay=document.getElementById('taskCalendarOverlay'),input=document.getElementById('taskCalendarInput'),main=document.getElementById('taskDate');if(!overlay||!input)return;input.value=main?.value||'';overlay.classList.add('show');setTimeout(()=>input.focus(),50)}
function closeTaskCalendar(){document.getElementById('taskCalendarOverlay')?.classList.remove('show')}
function confirmTaskCalendar(){const input=document.getElementById('taskCalendarInput'),main=document.getElementById('taskDate'),b=document.querySelector('#taskDateButton span');if(!input?.value)return;if(main)main.value=input.value;if(b)b.textContent=dateLabel(input.value);closeTaskCalendar()}
function addTask(){const v=document.getElementById('taskInput').value.trim(),date=document.getElementById('taskDate').value;if(!v){document.getElementById('taskInput').focus();return}if(!date){openTaskCalendar();return}tasks.push({t:v,d:false,date,reminded:false});document.getElementById('taskInput').value='';document.getElementById('taskDate').value='';const b=document.querySelector('#taskDateButton span');if(b)b.textContent='ВЫБРАТЬ ДАТУ';save();requestTaskNotifications();checkTaskReminders()}
function renderTasks(){const box=document.getElementById('taskList');if(!box)return;const sorted=tasks.map((x,i)=>({...x,_i:i})).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||Number(a.d)-Number(b.d));let last='';box.innerHTML=sorted.map(x=>{const h=x.date&&x.date!==last?`<div class="tag" style="margin-top:14px;border-bottom:1px solid #2c382e;padding-bottom:6px">${esc(dateLabel(x.date))}</div>`:'';last=x.date||last;return h+`<div class="task"><input type="checkbox" ${x.d?'checked':''} onchange="tasks[${x._i}].d=this.checked;save()"><span class="${x.d?'done':''}" style="flex:1;min-width:0">${esc(x.t)}${x.date?`<small style="display:block;color:#7f8c81;margin-top:3px">${esc(dateLabel(x.date))}</small>`:''}</span><button onclick="tasks.splice(${x._i},1);save()" style="margin-left:auto;background:none;border:0;color:#9aa39d;font-size:18px">✕</button></div>`}).join('')||'<div class="small muted">Задач пока нет.</div>'}
function requestTaskNotifications(){if('Notification' in window&&Notification.permission==='default')Notification.requestPermission().catch(()=>{})}
function checkTaskReminders(){const today=new Date();today.setHours(0,0,0,0);let changed=false,messages=[];for(const x of tasks){if(!x.date||x.d||x.reminded)continue;const due=new Date(x.date+'T00:00:00');const diff=Math.round((due-today)/86400000);if(diff===1){const msg='На завтра у вас: '+x.t;if('Notification' in window&&Notification.permission==='granted'){try{new Notification('Спецназ',{body:msg,tag:'task-'+x.date+'-'+x.t})}catch(e){}}messages.push(msg);x.reminded=true;changed=true}}const el=document.getElementById('taskReminderStatus');if(el)el.textContent=messages[0]||'';if(changed)localStorage.setItem(KEY,JSON.stringify(tasks))}
setInterval(checkTaskReminders,60000);
function esc(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function weather(){document.getElementById('weatherCurrent').innerHTML='';document.getElementById('weather24').innerHTML='';weatherProxyNote();}
function weatherText(code){const m={0:'Ясно',1:'Преимущественно ясно',2:'Переменная облачность',3:'Пасмурно',45:'Туман',48:'Изморозь',51:'Морось',53:'Морось',55:'Морось',61:'Дождь',63:'Дождь',65:'Сильный дождь',71:'Снег',73:'Снег',75:'Сильный снег',80:'Ливни',81:'Ливни',82:'Сильные ливни',95:'Гроза',96:'Гроза',99:'Гроза с градом'};return m[code]||'Погодные условия'}
function degDir(d){const dirs=['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'];return dirs[Math.round((Number(d)||0)/45)%8]}
function weatherLabel(p){return [p.name,p.admin1,p.country].filter(Boolean).join(', ')}
const CITY_HINTS=[
['Москва',55.7558,37.6173,'Россия'],['Санкт-Петербург',59.9343,30.3351,'Россия'],['Калининград',54.7104,20.4522,'Россия'],['Мурманск',68.9585,33.0827,'Россия'],['Архангельск',64.5393,40.5187,'Россия'],['Псков',57.8136,28.3496,'Россия'],['Смоленск',54.7826,32.0453,'Россия'],['Брянск',53.2436,34.3634,'Россия'],['Курск',51.7304,36.1926,'Россия'],['Белгород',50.5954,36.5873,'Россия'],['Воронеж',51.6755,39.2089,'Россия'],['Ростов-на-Дону',47.2357,39.7015,'Россия'],['Краснодар',45.0355,38.9753,'Россия'],['Сочи',43.6028,39.7342,'Россия'],['Волгоград',48.708,44.5133,'Россия'],['Саратов',51.5336,46.0343,'Россия'],['Самара',53.1959,50.1002,'Россия'],['Казань',55.7961,49.1064,'Россия'],['Нижний Новгород',56.2965,43.9361,'Россия'],['Екатеринбург',56.8389,60.6057,'Россия'],['Челябинск',55.1644,61.4368,'Россия'],['Омск',54.9885,73.3242,'Россия'],['Новосибирск',55.0084,82.9357,'Россия'],['Красноярск',56.0153,92.8932,'Россия'],['Иркутск',52.2864,104.2807,'Россия'],['Владивосток',43.1155,131.8855,'Россия'],['Минск',53.9,27.5667,'Беларусь'],['Киев',50.4501,30.5234,'Украина'],['Варшава',52.2297,21.0122,'Польша'],['Берлин',52.52,13.405,'Германия'],['Прага',50.0755,14.4378,'Чехия'],['Вена',48.2082,16.3738,'Австрия'],['Будапешт',47.4979,19.0402,'Венгрия'],['Париж',48.8566,2.3522,'Франция'],['Лондон',51.5074,-0.1278,'Великобритания'],['Рим',41.9028,12.4964,'Италия'],['Мадрид',40.4168,-3.7038,'Испания']
].map(x=>({name:x[0],latitude:x[1],longitude:x[2],country:x[3],admin1:''}));
function norm(s){return (s||'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/gi,'').trim()}
function lev(a,b){a=norm(a);b=norm(b);if(a===b)return 0;if(!a)return b.length;if(!b)return a.length;let p=Array(b.length+1).fill(0),c=Array(b.length+1);for(let j=0;j<=b.length;j++)p[j]=j;for(let i=1;i<=a.length;i++){c[0]=i;for(let j=1;j<=b.length;j++){c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1))} [p,c]=[c,p]}return p[b.length]}
function localSuggestions(q){const n=norm(q);if(n.length<3)return [];return CITY_HINTS.map(p=>({...p,_d:lev(n,p.name)})).filter(p=>p._d<=Math.max(1,Math.floor(n.length*.34))).sort((a,b)=>a._d-b._d).slice(0,5)}
function renderWeatherSuggestions(results,query){const box=document.getElementById('weatherSuggestions');if(!box)return;let top=(results||[]).slice(0,5);if(!top.length)top=localSuggestions(query||'');if(!top.length){box.innerHTML='';return}box.innerHTML='<div class="suggestTitle">Вы возможно искали:</div>'+top.map((p,i)=>`<button class="suggestItem" onclick="chooseWeather(${i})">${esc(weatherLabel(p))}</button>`).join('');window._weatherResults=top}
function chooseWeather(i){const p=(window._weatherResults||[])[i];if(!p)return;document.getElementById('weatherSearch').value=p.name||'';renderWeatherSuggestions([], '');loadWeatherForPlace(p)}
function saveWeatherCache(p,w){try{localStorage.setItem('specnaz_last_weather',JSON.stringify({p,w,ts:Date.now()}))}catch(e){}}
function weatherAge(ts){if(!ts)return '';const d=Math.max(0,Date.now()-Number(ts));const m=Math.floor(d/60000);if(m<1)return 'только что';if(m<60)return m+' мин назад';const h=Math.floor(m/60);return h+' ч назад'}
function renderCachedWeather(){try{const x=JSON.parse(localStorage.getItem('specnaz_last_weather')||'null');if(!x||!x.p||!x.w)return false;document.getElementById('weatherSearch').value=x.p.name||'';renderWeatherData(x.p,x.w,true,x.ts);return true}catch(e){return false}}
function ms(v){return Number.isFinite(Number(v))?(Number(v)/3.6).toFixed(1):'—'}
function wttrDescription(obj){return obj&&obj.weatherDesc&&obj.weatherDesc[0]&&obj.weatherDesc[0].value?obj.weatherDesc[0].value:'Погодные условия'}
function wttrToWeather(p,x){
  const cc=(x.current_condition&&x.current_condition[0])||{};
  const days=x.weather||[];
  const hours=[];
  days.slice(0,2).forEach(day=>(day.hourly||[]).forEach(h=>hours.push(h)));
  const baseDate=(days[0]&&days[0].date)||new Date().toISOString().slice(0,10);
  const current={
    temperature_2m:Number(cc.temp_C),
    apparent_temperature:Number(cc.FeelsLikeC),
    weather_code:String(cc.weatherCode||''),
    weather_text:wttrDescription(cc),
    wind_speed_10m:Number(cc.windspeedKmph)*1000/3600,
    wind_direction_10m:Number(cc.winddirDegree)||0,
    humidity:Number(cc.humidity)||0
  };
  const hourly={
    time:hours.slice(0,24).map(h=>baseDate+'T'+String(Math.round(Number(h.time||0)/100)).padStart(2,'0')+':00'),
    temperature_2m:hours.slice(0,24).map(h=>Number(h.tempC)),
    apparent_temperature:hours.slice(0,24).map(h=>Number(h.FeelsLikeC)),
    precipitation_probability:hours.slice(0,24).map(h=>Number(h.chanceofrain||h.chanceofsnow||0)),
    weather_code:hours.slice(0,24).map(h=>String(h.weatherCode||'')),
    weather_text:hours.slice(0,24).map(h=>wttrDescription(h)),
    wind_speed_10m:hours.slice(0,24).map(h=>Number(h.windspeedKmph)*1000/3600),
    wind_direction_10m:hours.slice(0,24).map(h=>Number(h.winddirDegree)||0)
  };
  return {current,hourly,source:'wttr.in'};
}
function weatherTextFor(w,code){return w&&w.weather_text||weatherText(code)}
function renderWeatherData(p,w,cached,ts){
  const status=document.getElementById('weatherStatus'),cur=document.getElementById('weatherCurrent'),grid=document.getElementById('weather24');
  const label=weatherLabel(p);
  status.textContent=(cached?'Последняя сохранённая погода: ':'Погода: ')+label+(cached&&ts?' · '+weatherAge(ts):'');
  cur.innerHTML='';grid.innerHTML='';
  const c=w.current;if(!c)return;
  const temp=Number(c.temperature_2m), feels=Number(c.apparent_temperature), wind=Number(c.wind_speed_10m)||0;
  cur.innerHTML='<div class="weatherBox"><div class="weatherTitle">'+esc(label)+'</div><div class="weatherNow">'+Math.round(temp)+'°C</div><div class="weatherMeta">'+esc(weatherTextFor(c,c.weather_code))+' · ощущается '+Math.round(feels)+'°C · ветер '+ms(wind)+' м/с '+degDir(c.wind_direction_10m)+(c.humidity?' · влажность '+Math.round(c.humidity)+'%':'')+'</div></div>';
  const h=w.hourly||{};const n=Math.min(24,(h.time||[]).length);
  for(let i=0;i<n;i++){
    const hh=(h.time[i]||'').slice(11,16)||'—:—';
    grid.innerHTML+=`<div class="wxHour"><b>${hh}</b><div class="wxTemp">${Math.round(Number(h.temperature_2m?.[i]??0))}°</div><div>${esc(weatherTextFor({weather_text:h.weather_text?.[i]},h.weather_code?.[i]))}</div><div class="wxWind">${ms(Number(h.wind_speed_10m?.[i]??0))} м/с</div><div>${h.precipitation_probability?.[i]??0}%</div></div>`;
  }
}
async function fetchWithTimeout(url,msTimeout=12000){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),msTimeout);try{return await fetch(url,{method:'GET',mode:'cors',cache:'no-store',signal:controller.signal})}finally{clearTimeout(timer)}}
async function fetchWeatherJSON(targetUrl){
  const enc=encodeURIComponent(targetUrl);
  // Network policy: try the original service first, then neutral relays.
  // VPN is never required by the app itself; availability still depends on
  // whether the current network can reach at least one route.
  const routes=[
    targetUrl,
    'https://proxy.cors.dev/'+targetUrl,
    'https://api.allorigins.win/raw?url='+enc,
    'https://api.allorigins.win/get?url='+enc,
    'https://r.jina.ai/'+targetUrl
  ];
  let lastErr=null;
  for(const url of routes){
    try{
      const r=await fetchWithTimeout(url,10000);
      if(!r.ok)throw new Error('weather route '+r.status);
      const text=await r.text();
      try{return JSON.parse(text)}catch(e){}
      try{
        const wrap=JSON.parse(text);
        if(wrap&&typeof wrap.contents==='string'){try{return JSON.parse(wrap.contents)}catch(e){}}
        if(wrap&&typeof wrap.content==='string'){
          const a=wrap.content.indexOf('{'),b=wrap.content.lastIndexOf('}');
          if(a>=0&&b>a)return JSON.parse(wrap.content.slice(a,b+1));
        }
      }catch(e){}
      const a=text.indexOf('{'),b=text.lastIndexOf('}');
      if(a>=0&&b>a){try{return JSON.parse(text.slice(a,b+1))}catch(e){}}
      throw new Error('weather response is not JSON');
    }catch(e){lastErr=e;}
  }
  throw lastErr||new Error('weather network error');
}
function weatherProxyNote(){
  const n=document.querySelector('.offlineNote');
  if(n)n.textContent='Погода: для получения свежих данных требуется VPN. Последние сохранённые данные доступны без сети. Ветер — м/с.';
}
async function loadWttrForPlace(p){
  const q=(p.name||'').trim(); if(!q)throw new Error('no city');
  const url='https://wttr.in/'+encodeURIComponent(q)+'?format=j1&lang=ru';
  const x=await fetchWeatherJSON(url); if(!x.current_condition||!x.current_condition[0])throw new Error('bad wttr response');
  const w=wttrToWeather(p,x); saveWeatherCache(p,w); renderWeatherData(p,w,false); return true;
}
async function searchWeather(){
  const q=document.getElementById('weatherSearch').value.trim();if(!q)return;
  const status=document.getElementById('weatherStatus'),cur=document.getElementById('weatherCurrent'),grid=document.getElementById('weather24');
  status.textContent='Ищу город…';cur.innerHTML='';grid.innerHTML='';renderWeatherSuggestions([],q);
  try{
    const gu='https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name:q,count:'10',language:'ru',format:'json'}).toString();
    const g=await fetchWeatherJSON(gu);const results=g.results||[];renderWeatherSuggestions(results,q);
    if(!results.length){
      const local=localSuggestions(q);
      if(local.length){window._weatherResults=local;renderWeatherSuggestions(local,q);status.textContent='Точного совпадения нет — выбери вариант ниже.';return}
      await loadWttrForPlace({name:q,country:''});return;
    }
    await loadWeatherForPlace(results[0]);
  }catch(e){
    const local=localSuggestions(q);
    if(local.length){window._weatherResults=local;renderWeatherSuggestions(local,q);status.textContent='Основной источник недоступен — выбери город ниже.';return}
    try{await loadWttrForPlace({name:q,country:''});return}catch(_){}
    if(renderCachedWeather())status.textContent='Нет связи — показана последняя сохранённая погода.';
    else status.textContent='Не удалось получить данные. Проверь интернет и повтори поиск.';
  }
}
async function loadWeatherForPlace(p){
  const status=document.getElementById('weatherStatus');status.textContent='Погода: '+weatherLabel(p)+' — загружаю…';
  try{
    const params=new URLSearchParams({latitude:p.latitude,longitude:p.longitude,current:'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m',hourly:'temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m',forecast_hours:'24',timezone:'auto'});
    const url='https://api.open-meteo.com/v1/forecast?'+params.toString();
    let w=await fetchWeatherJSON(url);if(!w.current||!w.hourly)throw new Error('bad response');
    saveWeatherCache(p,w);renderWeatherData(p,w,false);
  }catch(e){
    try{await loadWttrForPlace(p);return}catch(_){}
    try{const x=JSON.parse(localStorage.getItem('specnaz_last_weather')||'null');if(x&&x.p&&x.w){renderWeatherData(x.p,x.w,true,x.ts);status.textContent='Нет связи — показана последняя сохранённая погода.';return}}catch(_){}
    status.textContent='Не удалось загрузить погоду. Проверь интернет и нажми «НАЙТИ» ещё раз.';
  }
}
function clockLabel(h){let n=Math.round(h/30)%12;return n===0?'12':String(n)}
function clockPhrase(h){const n=Number(clockLabel(h));if(n===1)return '1 час';if(n>=2&&n<=4)return n+' часа';return n+' часов'}
function directionName(h){const d=['СЕВЕР','СЕВЕРО-ВОСТОК','ВОСТОК','ЮГО-ВОСТОК','ЮГ','ЮГО-ЗАПАД','ЗАПАД','СЕВЕРО-ЗАПАД'];return d[Math.round(h/45)%8]}

function setCompassStatus(t){const el=document.getElementById('compassStatus');if(el)el.textContent=t}
function setHeading(v){v=((Number(v)||0)%360+360)%360;lastHeading=v;sessionStorage.setItem('specnaz_heading',String(v));const dir=directionName(v),readout=document.getElementById('homeClockReadout'),direction=document.getElementById('homeDirection'),az=document.getElementById('homeAzimuthReadout'),needle=document.getElementById('homeNeedle'),dial=document.getElementById('homeCompass');if(readout)readout.textContent=clockPhrase(v);if(direction)direction.textContent=dir;if(az)az.textContent='АЗИМУТ '+Math.round(v)+'°';if(needle)needle.style.transform=`translate(-50%,-100%) rotate(${v}deg)`;if(dial)dial.style.transform=`rotate(${-v}deg)`;}
function orient(e){let h;if(typeof e.webkitCompassHeading==='number'&&isFinite(e.webkitCompassHeading)&&e.webkitCompassHeading>=0)h=e.webkitCompassHeading;else if(typeof e.alpha==='number')h=(360-e.alpha)%360;else return;setHeading(h)}
let compassStarted=false;
async function requestCompass(){try{if(typeof DeviceOrientationEvent==='undefined'){setCompassStatus('КОМПАС: датчики недоступны');return}if(typeof DeviceOrientationEvent.requestPermission==='function'){setCompassStatus('КОМПАС: запрашиваю доступ…');const p=await DeviceOrientationEvent.requestPermission();if(p!=='granted'){setCompassStatus('КОМПАС: разрешение отклонено. Включи датчики в настройках iPhone.');return}}window.removeEventListener('deviceorientation',orient,true);window.removeEventListener('deviceorientationabsolute',orient,true);window.addEventListener('deviceorientation',orient,true);window.addEventListener('deviceorientationabsolute',orient,true);compassStarted=true;setCompassStatus('КОМПАС: ВКЛЮЧЁН');}catch(e){setCompassStatus('КОМПАС: нажми кнопку ещё раз после открытия приложения')}}
let externalVideoTimer=null; let externalVideoLastProgress=0; let externalVideoUrl='';
function setVideoState(t){const e=document.getElementById('videoState');if(e)e.textContent=t}
function setVideoMessage(title,sub){const e=document.getElementById('externalVideoMsg');if(!e)return;e.querySelector('b').textContent=title;e.querySelector('span').textContent=sub;e.style.display='flex'}
function hideVideoMessage(){const e=document.getElementById('externalVideoMsg');if(e)e.style.display='none'}
function resetExternalVideo(message='НЕТ СОЕДИНЕНИЯ'){const v=document.getElementById('externalVideo');if(!v)return;v.pause();v.removeAttribute('src');v.load();externalVideoLastProgress=0;setVideoState('НЕТ ПОТОКА');setVideoMessage(message,'Проверь связь с внешним оборудованием и адрес видеопотока')}
async function connectExternalVideo(){const input=document.getElementById('streamUrl');const v=document.getElementById('externalVideo');const url=(input.value||'').trim();if(!url){setVideoMessage('НЕТ АДРЕСА','Введи адрес видеопотока внешнего оборудования');setVideoState('ОЖИДАНИЕ ПОТОКА');return}externalVideoUrl=url;try{localStorage.setItem('specnaz_stream_url',url)}catch(e){}clearInterval(externalVideoTimer);v.pause();v.removeAttribute('src');v.load();v.src=url;v.load();setVideoState('ПОДКЛЮЧЕНИЕ…');setVideoMessage('ПОДКЛЮЧЕНИЕ…','Ожидание видеопотока внешнего оборудования');externalVideoLastProgress=Date.now();try{await v.play()}catch(e){}externalVideoTimer=setInterval(()=>{if(!externalVideoUrl)return;if(!v.paused&&!v.ended&&v.readyState>=2){if(Date.now()-externalVideoLastProgress>5000)resetExternalVideo('СВЯЗЬ ПОТЕРЯНА')}},1000)}
function disconnectExternalVideo(){externalVideoUrl='';clearInterval(externalVideoTimer);resetExternalVideo('ВИДЕО ОТКЛЮЧЕНО')}
function fullscreenExternalVideo(){const card=document.querySelector('.videoCard');const v=document.getElementById('externalVideo');try{if(document.fullscreenElement){document.exitFullscreen();return}if(card&&card.requestFullscreen){card.requestFullscreen().then(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}});return}if(v&&v.webkitEnterFullscreen)v.webkitEnterFullscreen()}catch(e){if(v&&v.webkitEnterFullscreen)v.webkitEnterFullscreen()}}
(function initExternalVideo(){const v=document.getElementById('externalVideo');if(!v)return;try{const u=localStorage.getItem('specnaz_stream_url');if(u)document.getElementById('streamUrl').value=u}catch(e){}v.addEventListener('playing',()=>{externalVideoLastProgress=Date.now();hideVideoMessage();setVideoState('ВИДЕО • ПОДКЛЮЧЕНО')});v.addEventListener('timeupdate',()=>{externalVideoLastProgress=Date.now();if(!v.paused){hideVideoMessage();setVideoState('ВИДЕО • ПОДКЛЮЧЕНО')}});v.addEventListener('loadeddata',()=>{externalVideoLastProgress=Date.now();hideVideoMessage();setVideoState('ВИДЕО • ПОДКЛЮЧЕНО')});['error','abort','emptied'].forEach(ev=>v.addEventListener(ev,()=>{if(externalVideoUrl)resetExternalVideo('СВЯЗЬ ПОТЕРЯНА')}));v.addEventListener('stalled',()=>setVideoState('ПОТОК ПОДВИС'));})();

let onlineMap=null; let mapMarker=null; let placeTimer=null; let mapMode='satellite';
let mapPoints=[]; let mapPointMarkers=[]; let mapPointLayer=null; let mapRouteLine=null; let pointMode=false;
const MAP_POINTS_KEY='specnaz_map_points_v21';
function loadMapPoints(){try{mapPoints=JSON.parse(localStorage.getItem(MAP_POINTS_KEY)||'[]');if(!Array.isArray(mapPoints))mapPoints=[]}catch(_){mapPoints=[]}}
function saveMapPoints(){try{localStorage.setItem(MAP_POINTS_KEY,JSON.stringify(mapPoints))}catch(_){} renderMapPoints()}
function haversine(a,b){const R=6371;const p=Math.PI/180;const dLat=(b.lat-a.lat)*p,dLon=(b.lon-a.lon)*p;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function mapRouteDistance(){let km=0;for(let i=1;i<mapPoints.length;i++)km+=haversine(mapPoints[i-1],mapPoints[i]);return km}
function updateMapMeasure(){const el=document.getElementById('mapMeasure');if(!el)return;const km=mapRouteDistance();el.textContent='ТОЧКИ: '+mapPoints.length+' · '+(mapPoints.length>1?'МАРШРУТ: '+(km<1?Math.round(km*1000)+' м':km.toFixed(2)+' км'):'РАССТОЯНИЕ: 0 м')}
function renderMapPoints(){if(!onlineMap)return;if(!mapPointLayer){mapPointLayer=L.layerGroup().addTo(onlineMap)}mapPointLayer.clearLayers();mapPointMarkers=[];mapPoints.forEach((p,i)=>{const m=L.marker([p.lat,p.lon],{pane:'markerPane',riseOnHover:true,autoPanOnFocus:false,keyboard:false}).bindPopup('<b>Точка '+(i+1)+'</b><br>'+Number(p.lat).toFixed(5)+', '+Number(p.lon).toFixed(5)+'<br><button style="margin-top:6px;border:0;border-radius:7px;padding:5px 8px;background:#080b09;color:#dbe5d7" onclick="deleteMapPoint('+i+')">✕ Удалить точку</button>');m.addTo(mapPointLayer);mapPointMarkers.push(m)});if(mapRouteLine){onlineMap.removeLayer(mapRouteLine);mapRouteLine=null}if(mapPoints.length>1){mapRouteLine=L.polyline(mapPoints.map(p=>[p.lat,p.lon]),{pane:'mapRoutePane',color:'#d5b15d',weight:3,opacity:.9,dashArray:'8 7',interactive:false}).addTo(onlineMap)}updateMapMeasure();if(onlineMap)onlineMap.invalidateSize({animate:false})}
function deleteMapPoint(i){if(i<0||i>=mapPoints.length)return;mapPoints.splice(i,1);saveMapPoints();if(onlineMap)renderMapPoints()}
function addMapPoint(lat,lon){mapPoints.push({lat:Number(lat),lon:Number(lon)});saveMapPoints();renderMapPoints()}
function toggleMapPointMode(){pointMode=!pointMode;document.getElementById('pointModeBtn')?.classList.toggle('active',pointMode);document.getElementById('searchResult').textContent=pointMode?'РЕЖИМ ТОЧЕК: нажми на карту':'Режим точек выключен'}
function clearMapPoints(){mapPoints=[];pointMode=false;document.getElementById('pointModeBtn')?.classList.remove('active');saveMapPoints()}
function confirmClearMapPoints(){if(!mapPoints.length)return;if(window.confirm('Удалить все точки?'))clearMapPoints()}

const MAP_CACHE_KEY='specnaz_last_place';
const ESRI_STREET='https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const OSM_DETAIL='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ESRI_IMAGERY='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_TOPO='https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
const ESRI_LABELS='https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
let mapLayers={detail:null,topo:null,satellite:null,labels:null};
function initOnlineMap(){
  if(onlineMap)return;
  try{
    onlineMap=L.map('onlineMap',{zoomControl:false,attributionControl:true,preferCanvas:true,zoomSnap:0.25,zoomDelta:0.5,zoomAnimation:true,fadeAnimation:true,markerZoomAnimation:true,touchZoom:true,doubleClickZoom:true,scrollWheelZoom:false,boxZoom:false,keyboard:false,dragging:true,minZoom:2,maxZoom:19,worldCopyJump:true});
    mapLayers.detail=L.tileLayer(ESRI_STREET,{maxZoom:19,maxNativeZoom:19,tileSize:256,detectRetina:true,updateWhenIdle:true,keepBuffer:4,attribution:'Tiles © Esri'});
    mapLayers.topo=L.tileLayer(ESRI_TOPO,{maxZoom:19,maxNativeZoom:19,tileSize:256,detectRetina:true,updateWhenIdle:true,keepBuffer:3,attribution:'Tiles © Esri'});
    mapLayers.satellite=L.tileLayer(ESRI_IMAGERY,{maxZoom:19,maxNativeZoom:19,tileSize:256,detectRetina:true,updateWhenIdle:true,keepBuffer:3,attribution:'Imagery © Esri'});
    mapLayers.labels=L.tileLayer(ESRI_LABELS,{maxZoom:19,maxNativeZoom:19,tileSize:256,opacity:0.95,updateWhenIdle:true,keepBuffer:3,attribution:'Labels © Esri'});
    mapLayers.satellite.addTo(onlineMap);
    document.querySelectorAll('.mapLayers button').forEach(b=>b.classList.remove('active'));
    document.getElementById('layerSatellite')?.classList.add('active');
    onlineMap.setView([50,10],4); loadMapPoints();
    onlineMap.on('load',()=>restoreMapPlace());
    onlineMap.whenReady(()=>{document.getElementById('searchResult').textContent='Карта готова: улицы и адреса доступны в детальном масштабе.';restoreMapPlace();renderMapPoints();});
    onlineMap.on('click',e=>{if(pointMode)addMapPoint(e.latlng.lat,e.latlng.lng)});
    onlineMap.on('zoomend moveend resize',()=>{if(mapPoints.length)renderMapPoints()});
    onlineMap.on('tileerror',()=>{const el=document.getElementById('searchResult');if(el&&!/Найдено:/.test(el.textContent))el.textContent='Часть картографических тайлов недоступна — попробуйте ещё раз.'});
  }catch(e){document.getElementById('searchResult').textContent='Не удалось загрузить карту: '+e.message}
}
function restoreMapPlace(){try{const x=JSON.parse(localStorage.getItem(MAP_CACHE_KEY)||'null');if(x&&Number.isFinite(x.lat)&&Number.isFinite(x.lon)){onlineMap.setView([x.lat,x.lon],Math.min(19,x.zoom||14),{animate:false});showMapPlace(x.lat,x.lon,x.label,false)}}catch(_){}
}
function clearBaseLayers(){Object.values(mapLayers).forEach(l=>{if(l&&onlineMap.hasLayer(l))onlineMap.removeLayer(l)})}
function addHybrid(){mapLayers.satellite.addTo(onlineMap);mapLayers.labels.addTo(onlineMap)}
function setMapLayer(name,btn){
  if(!onlineMap)return;
  document.querySelectorAll('.mapLayers button').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');
  mapMode=name;clearBaseLayers();
  if(name==='scheme')mapLayers.detail.addTo(onlineMap);
  else if(name==='topo')mapLayers.topo.addTo(onlineMap);
  else if(name==='satellite')mapLayers.satellite.addTo(onlineMap);
  else if(name==='hybrid')addHybrid();
  setTimeout(()=>onlineMap&&onlineMap.invalidateSize({animate:false}),80);
}
function showMapPlace(lat,lon,label,animate=true){
  if(!onlineMap)return;
  const target=[Number(lat),Number(lon)];
  if(animate)onlineMap.flyTo(target,14,{duration:0.55,animate:true});else onlineMap.setView(target,14,{animate:false});
  if(mapMarker){mapMarker.remove();mapMarker=null}
  mapMarker=L.marker(target).addTo(onlineMap).bindPopup(esc(label)).openPopup();
  document.getElementById('searchResult').textContent='Найдено: '+label;
  try{localStorage.setItem(MAP_CACHE_KEY,JSON.stringify({lat:Number(lat),lon:Number(lon),label,zoom:14}))}catch(_){}
}
function clearMapSuggestions(){const el=document.getElementById('mapSuggestions');if(el)el.innerHTML=''}
function showMapSuggestions(items){const el=document.getElementById('mapSuggestions');if(!el)return;el.innerHTML='';if(!items||!items.length)return;const title=document.createElement('div');title.className='suggestTitle';title.textContent='Возможно, вы искали';el.appendChild(title);items.slice(0,5).forEach((p)=>{const b=document.createElement('button');b.type='button';b.className='mapSuggestion';b.innerHTML=esc(p.display_name||'');b.addEventListener('click',()=>{showMapPlace(Number(p.lat),Number(p.lon),p.display_name||'Найденное место',true);clearMapSuggestions()});el.appendChild(b)})}
async function searchPlace(){
  const q=document.getElementById('placeSearch').value.trim();
  if(!q||q.length<2)return;
  if(!onlineMap)initOnlineMap();
  const out=document.getElementById('searchResult'); out.textContent='Поиск адреса: '+q+'…'; clearMapSuggestions();
  try{
    const url='https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&accept-language=ru&q='+encodeURIComponent(q)+'&limit=8';
    const r=await fetch(url,{headers:{'Accept':'application/json'}});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const a=await r.json();
    if(!a.length){
      out.textContent='Точное совпадение не найдено';
      // Fallback to city search for misspelled city names.
      try{
        const fr=await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)+'&count=5&language=ru&format=json');
        const fa=await fr.json();
        const fallback=(fa.results||[]).map(x=>({lat:x.latitude,lon:x.longitude,display_name:weatherLabel(x)}));
        showMapSuggestions(fallback);
      }catch(_){ }
      return;
    }
    const best=a[0];
    showMapPlace(Number(best.lat),Number(best.lon),best.display_name,true);
    if(a.length>1)showMapSuggestions(a.slice(1));
  }catch(e){
    out.textContent='Не удалось получить адрес. Проверь подключение к интернету.';
    try{const x=JSON.parse(localStorage.getItem(MAP_CACHE_KEY)||'null');if(x){out.textContent+=' Открыта последняя сохранённая точка.';showMapPlace(x.lat,x.lon,x.label,false)}}catch(_){ }
  }
}
let deferredInstallPrompt=null;
function isStandalone(){return window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true}
function installBrowserName(){const ua=navigator.userAgent||'';if(/YaBrowser/i.test(ua))return 'Яндекс Браузер';if(/CriOS|Chrome/i.test(ua))return 'Chrome';if(/Safari/i.test(ua)&&/iPhone|iPad|iPod/i.test(ua))return 'Safari на iPhone/iPad';return 'этого браузера'}
function showInstallPanel(){const panel=document.getElementById('installPanel'),text=document.getElementById('installText'),now=document.getElementById('installNow');if(!panel||!text)return;if(isStandalone()){text.textContent='«Спецназ» уже добавлен на экран и открыт как приложение.';if(now)now.style.display='none';panel.classList.add('show');return}if(deferredInstallPrompt){text.textContent='Можно установить «Спецназ» прямо сейчас.';if(now)now.style.display='block'}else{const b=installBrowserName();if(b==='Safari на iPhone/iPad')text.textContent='Safari: нажми «Поделиться» → «На экран Домой» → «Добавить».';else if(b==='Яндекс Браузер')text.textContent='Яндекс Браузер: открой меню браузера → «Добавить на главный экран» или «Установить приложение».';else if(b==='Chrome')text.textContent='Chrome: открой меню ⋮ → «Добавить на главный экран» или «Установить приложение».';else text.textContent='Открой меню браузера и выбери «Добавить на экран» / «Установить приложение».';if(now)now.style.display='none'}panel.classList.add('show')}
function closeInstallPanel(){document.getElementById('installPanel')?.classList.remove('show')}
async function installApp(){if(isStandalone()){showInstallPanel();return}if(deferredInstallPrompt){try{deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice}catch(e){}deferredInstallPrompt=null;closeInstallPanel();return}showInstallPanel()}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;const b=document.getElementById('installAppBtn');if(b)b.style.display='inline-block'});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;const b=document.getElementById('installAppBtn');if(b)b.textContent='УЖЕ НА ЭКРАНЕ';closeInstallPanel()});
function initBattery(){
  const el=document.getElementById('batteryStatus');
  const setBattery=(pct,charging=false)=>{
    if(typeof pct!=='number' || !isFinite(pct)) return false;
    pct=Math.max(0,Math.min(100,Math.round(pct)));
    el.textContent=(charging?'⚡ ':'BAT ')+pct+'%';
    el.classList.toggle('batteryLow',pct<=20&&!charging);
    el.classList.toggle('batteryCharge',!!charging);
    el.title=charging?'Зарядка':'Уровень заряда устройства';
    return true;
  };
  // Native iOS/Android wrapper bridge: the native shell can push real battery data here.
  window.SpecnazBattery={update:(pct,charging)=>setBattery(pct,charging)};
  window.addEventListener('specnaz-battery',e=>{
    const d=e&&e.detail||{};
    setBattery(Number(d.level),!!d.charging);
  });
  if(navigator.getBattery){
    navigator.getBattery().then(b=>{
      const update=()=>setBattery(b.level*100,b.charging);
      update();
      b.addEventListener('levelchange',update);
      b.addEventListener('chargingchange',update);
    }).catch(()=>{});
  }
  // On iOS Safari/PWA there is intentionally no fake percentage: real device battery
  // access requires the native iOS/Android shell. Keep the indicator visible.
  if(el.textContent==='BAT —%') el.title='Для точного процента на iPhone нужна нативная версия приложения';
}
function toggleCompassNight(){const home=document.getElementById('home');const on=!home.classList.contains('compass-night');home.classList.toggle('compass-night',on);try{localStorage.setItem('specnaz_compass_night',on?'1':'0')}catch(e){}const b=document.getElementById('compassNightToggle');if(b){b.setAttribute('aria-pressed',on?'true':'false');b.textContent=on?'НОЧНОЙ РЕЖИМ ВКЛ':'НОЧНОЙ РЕЖИМ'}}
function initCompassNight(){let on=false;try{on=localStorage.getItem('specnaz_compass_night')==='1'}catch(e){}if(on)document.getElementById('home')?.classList.add('compass-night');const b=document.getElementById('compassNightToggle');if(b){b.setAttribute('aria-pressed',on?'true':'false');b.textContent=on?'НОЧНОЙ РЕЖИМ ВКЛ':'НОЧНОЙ РЕЖИМ'}}
function moonInfo(date=new Date()){const known=Date.UTC(2000,0,6,18,14,0),days=(date.getTime()-known)/86400000;const syn=29.530588853,age=((days%syn)+syn)%syn,illum=(1-Math.cos(2*Math.PI*age/syn))/2;return {age,illum,phase:age<1.85?'Новолуние':age<7.38?'Растущая луна':age<9.23?'Первая четверть':age<14.77?'Растущая луна':age<16.62?'Полнолуние':age<22.15?'Убывающая луна':age<23.99?'Последняя четверть':'Убывающая луна'}}
function renderMoonAdvice(){}
let lastHeading=Number(sessionStorage.getItem('specnaz_heading')||0);
function handleViewportChange(){
  if(onlineMap){setTimeout(()=>onlineMap.resize(),120)}
  // DOM state (поиск, погода, задачи и текущий курс) сохраняется при повороте;
  // повторно применяем последний курс, чтобы стрелка не сбрасывалась.
  setHeading(lastHeading);
}
function autoCompassSetup(){setHeading(lastHeading);if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission!=='function'){window.addEventListener('deviceorientation',orient,true);window.addEventListener('deviceorientationabsolute',orient,true);setCompassStatus('КОМПАС: ВКЛЮЧЁН')}}
function applyAppTheme(dark){
  const btn=document.getElementById('appThemeToggle');
  document.body.classList.toggle('theme-dark',!!dark);
  if(btn){
    btn.textContent=dark?'☀':'☾';
    btn.setAttribute('aria-pressed',dark?'true':'false');
    btn.setAttribute('aria-label',dark?'Выключить тёмную тему':'Включить тёмную тему');
    btn.title=dark?'Обычная тема':'Тёмная тема';
  }
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',dark?'#010201':'#0b0e0d');
}
function toggleAppTheme(e){
  if(e){e.preventDefault();e.stopPropagation();}
  const dark=!document.body.classList.contains('theme-dark');
  try{localStorage.setItem('specnaz_dark_theme',dark?'1':'0')}catch(err){}
  applyAppTheme(dark);
}
function initThemeToggle(){
  const btn=document.getElementById('appThemeToggle');
  if(!btn)return;
  let dark=false;
  try{dark=localStorage.getItem('specnaz_dark_theme')==='1'}catch(e){}
  applyAppTheme(dark);
}
renderTasks();checkTaskReminders();initCompassNight();initBattery();autoCompassSetup();initThemeToggle();if(isStandalone()){const b=document.getElementById('installAppBtn');if(b)b.textContent='УЖЕ НА ЭКРАНЕ';}

window.addEventListener('orientationchange',handleViewportChange,{passive:true});
window.addEventListener('resize',handleViewportChange,{passive:true});
document.getElementById('placeSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){searchPlace()}});document.getElementById('weatherSearch').addEventListener('input',()=>{clearTimeout(weatherTimer);const q=document.getElementById('weatherSearch').value.trim();weatherTimer=setTimeout(()=>{if(q.length>=3)renderWeatherSuggestions([],q)},450)});document.getElementById('weatherSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){clearTimeout(weatherTimer);searchWeather()}});

