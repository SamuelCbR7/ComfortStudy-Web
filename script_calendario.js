const KEY = "comfortstudy_calendar_events_v1";
const state = { date: new Date(), events: loadEvents(), selected: null };

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2,"0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today = new Date();
const typeLabel = { prova:"Prova", trabalho:"Trabalho", estudo:"Estudo", outro:"Outro" };

function loadEvents(){
  try { return JSON.parse(localStorage.getItem(KEY)) || demoEvents(); }
  catch { return demoEvents(); }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state.events)); }
function demoEvents(){
  return [
    {id:crypto.randomUUID(),title:"Exercícios de Álgebra Linear",date:iso(new Date(today.getFullYear(),today.getMonth(),today.getDate()+1)),time:"18:00",type:"estudo",subject:"Matemática",notes:"Resolver a lista 4",done:false},
    {id:crypto.randomUUID(),title:"Resumo sobre a Revolução Industrial",date:iso(new Date(today.getFullYear(),today.getMonth(),today.getDate()+3)),time:"14:00",type:"trabalho",subject:"História",notes:"Entregar no classroom",done:false},
    {id:crypto.randomUUID(),title:"Revisão para prova",date:iso(new Date(today.getFullYear(),today.getMonth(),today.getDate()+6)),time:"19:00",type:"estudo",subject:"Português",notes:"Capítulos 3 e 4",done:false}
  ];
}
function sameDay(a,b){return a===b}
function openModal(event=null, date=iso(state.date)){
  state.selected = event?.id || null;
  $("modalTitle").textContent = event ? "Editar atividade" : "Nova atividade";
  $("eventId").value = event?.id || "";
  $("eventTitle").value = event?.title || "";
  $("eventDate").value = event?.date || date;
  $("eventTime").value = event?.time || "";
  $("eventType").value = event?.type || "estudo";
  $("eventSubject").value = event?.subject || "";
  $("eventNotes").value = event?.notes || "";
  $("eventDone").checked = !!event?.done;
  $("deleteEvent").classList.toggle("hidden", !event);
  $("modal").classList.add("open");
  $("eventTitle").focus();
}
function closeModal(){ $("modal").classList.remove("open"); state.selected=null; }

function render(){
  const y=state.date.getFullYear(), m=state.date.getMonth();
  $("monthTitle").textContent = new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(state.date);
  const first=new Date(y,m,1), start=new Date(y,m,1-first.getDay());
  const days=$("calendarDays"); days.innerHTML="";
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const cell=document.createElement("div");
    const isCurrent=d.getMonth()===m, isToday=iso(d)===iso(today);
    cell.className=`day ${isCurrent?"":"muted"} ${isToday?"today":""}`;
    cell.dataset.date=iso(d);
    cell.innerHTML=`<div class="day-number">${d.getDate()}</div>`;
    const filter=$("filterType").value, q=$("searchInput").value.toLowerCase().trim();
    state.events.filter(e=>e.date===iso(d)&&!e.done&&(filter==="all"||e.type===filter)&&(!q||`${e.title} ${e.subject}`.toLowerCase().includes(q)))
      .slice(0,4).forEach(e=>{
        const el=document.createElement("div"); el.className=`event ${e.type}`; el.textContent=e.title;
        el.title=`${e.title}${e.time?" • "+e.time:""}`; el.onclick=ev=>{ev.stopPropagation();openModal(e)};
        cell.appendChild(el);
      });
    cell.onclick=()=>openModal(null,iso(d));
    days.appendChild(cell);
  }
  renderUpcoming();
  renderSummary();
}
function renderUpcoming(){
  const filter=$("filterType").value,q=$("searchInput").value.toLowerCase().trim();
  const list=state.events.filter(e=>{
    const okDate=e.date>=iso(today);
    const okType=filter==="all"||e.type===filter;
    const okQ=!q||`${e.title} ${e.subject}`.toLowerCase().includes(q);
    return okDate&&okType&&okQ;
  }).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,7);
  $("upcomingList").innerHTML=list.length?list.map(e=>{
    const d=new Date(e.date+"T12:00:00");
    return `<div class="up-item ${e.done?"done":""}">
      <div class="up-date"><strong>${d.getDate()}</strong><small>${new Intl.DateTimeFormat("pt-BR",{month:"short"}).format(d).replace(".","")}</small></div>
      <div class="up-info"><strong>${esc(e.title)}</strong><small>${typeLabel[e.type]}${e.subject?" • "+esc(e.subject):""}${e.time?" • "+e.time:""}</small></div>
      <input type="checkbox" ${e.done?"checked":""} aria-label="Concluir" onchange="toggleDone('${e.id}',this.checked)">
      <button class="text-btn" onclick="openById('${e.id}')">Abrir</button>
    </div>`;
  }).join(""):`<div class="empty">Nenhuma atividade encontrada.</div>`;
}
function renderSummary(){
  const y=state.date.getFullYear(),m=state.date.getMonth();
  const month=state.events.filter(e=>{const d=new Date(e.date+"T12:00:00");return d.getFullYear()===y&&d.getMonth()===m});
  $("monthCount").textContent=month.length;
  $("examCount").textContent=month.filter(e=>e.type==="prova").length;
  $("doneCount").textContent=month.filter(e=>e.done).length;
}
function esc(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
window.openById=id=>openModal(state.events.find(e=>e.id===id));
window.toggleDone=(id,done)=>{const e=state.events.find(e=>e.id===id);if(e){e.done=done;save();render()}};

$("prevMonth").onclick=()=>{state.date.setMonth(state.date.getMonth()-1);render()};
$("nextMonth").onclick=()=>{state.date.setMonth(state.date.getMonth()+1);render()};
$("todayBtn").onclick=()=>{state.date=new Date();render()};
$("newEventBtn").onclick=()=>openModal();
$("closeModal").onclick=closeModal;
$("cancelBtn").onclick=closeModal;
$("modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
$("searchInput").oninput=render;
$("filterType").onchange=render;
$("deleteEvent").onclick=()=>{
  if(!state.selected)return;
  if(confirm("Excluir esta atividade?")){
    state.events=state.events.filter(e=>e.id!==state.selected);save();closeModal();render();
  }
};
$("clearPastBtn").onclick=()=>{
  state.events=state.events.filter(e=>!e.done);save();render();
};
$("eventForm").onsubmit=e=>{
  e.preventDefault();
  const data={
    id:$("eventId").value||crypto.randomUUID(),
    title:$("eventTitle").value.trim(),date:$("eventDate").value,time:$("eventTime").value,
    type:$("eventType").value,subject:$("eventSubject").value.trim(),
    notes:$("eventNotes").value.trim(),done:$("eventDone").checked
  };
  const idx=state.events.findIndex(x=>x.id===data.id);
  if(idx>=0) state.events[idx]=data; else state.events.push(data);
  save(); closeModal(); state.date=new Date(data.date+"T12:00:00"); render();
};
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
render();
