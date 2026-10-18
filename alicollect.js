/* M-RES: read Alibaba Messenger conversations from the page the user has open (runs inside message.alibaba.com) */
(function(){
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const txt=e=>(e&&e.innerText||'').replace(/ /g,' ').trim();
function info(w){try{return JSON.parse(w.dataset.expinfo||'{}')}catch(e){return{}}}
const listScroller=()=>{let e=document.querySelector('.normal-list-container');while(e&&e!==document.body){const s=getComputedStyle(e);if(e.scrollHeight>e.clientHeight+10&&/auto|scroll/.test(s.overflowY))return e;e=e.parentElement}return null};
const chatScroller=()=>document.querySelector('.message-box .common-load-more');
function contactOf(el){return{cid:el.dataset.cid,name:el.dataset.name||txt(el.querySelector('.name')),company:txt(el.querySelector('.contact-company')),updated:+el.dataset.modifyTime||null,unread:+el.dataset.unreadCount||0,latest:txt(el.querySelector('.latest-msg')).replace(/^\[(Unread|Read)\]\s*/,'')}}
function readMessages(){return[...document.querySelectorAll('.message-box .message-item-wrapper')].map(w=>{const i=info(w);if(!i.messageId)return null;
  const me=w.classList.contains('item-right');let text=(w.dataset.original||'').trim();
  if(!text||/^</.test(text)){const c=w.querySelector('.user-content')||w;text=txt(c)}
  const t=i.messageType;const kind=t===1?'text':/<img/i.test(w.dataset.original||'')||w.querySelector('.user-content img')?'image':w.querySelector('a[href*="clouddisk"],.file-name,[class*="file"]')?'file':'card';
  const file=w.querySelector('[class*="file-name"],[class*="fileName"]');
  if(kind!=='text'){const label=file?txt(file):'';text=(kind==='image'?'[Image]':kind==='file'?'[File'+(label?': '+label:'')+']':'')+(text&&!/^</.test(text)?' '+text:'');text=text.trim()||'['+kind+']'}
  return{id:String(i.messageId),t:i.sendTime||null,me,type:t,kind,text:text.slice(0,4000)}}).filter(Boolean)}
async function loadHistory(maxRounds){const sc=chatScroller();if(!sc)return;let last=-1,same=0;
  for(let r=0;r<maxRounds;r++){const n=document.querySelectorAll('.message-box .message-item-wrapper').length;if(n===last){if(++same>=3)break}else same=0;last=n;
    sc.scrollTop=0;sc.dispatchEvent(new WheelEvent('wheel',{deltaY:-1200,bubbles:true}));sc.dispatchEvent(new Event('scroll',{bubbles:true}));await sleep(900);
    if(/Keep chats and transactions on Alibaba/.test(txt(sc.querySelector('.scroll-box')?.lastElementChild?.previousElementSibling))&&same>0)break}}
function agentPanel(){const p=[...document.querySelectorAll('div,section,aside')].find(e=>/Trade Agent/.test(e.firstElementChild?txt(e).slice(0,40):'')&&e.childElementCount>1&&txt(e).length<6000);const t=txt(p);
  const product=(t.match(/Product:\s*([^\n]+)/)||[])[1]||'';const req=(t.split(/Product Requirements/)[1]||'').split(/Notes are being updated|Ask Trade Agent/)[0]||'';return{product:product.trim(),requirements:req.trim().slice(0,2000)}}
async function openChat(el,name){el.scrollIntoView({block:'center'});el.click();for(let i=0;i<30;i++){await sleep(250);const h=txt(document.querySelector('.message-container')).split('\n')[0];if(h===name&&document.querySelector('.message-box .message-item-wrapper'))return true}return false}
async function current(){const act=document.querySelector('.contact-item-container.active,.contact-item-container.selected,.contact-item-container[class*="active"]');const name=txt(document.querySelector('.message-container')).split('\n')[0];
  const el=act||[...document.querySelectorAll('.contact-item-container')].find(e=>e.dataset.name===name);const c=el?contactOf(el):{cid:'chat:'+name,name,company:''};
  await loadHistory(25);return{...c,agent:agentPanel(),messages:readMessages()}}
async function all(opts={}){const since=Date.now()-(opts.days||120)*864e5,max=opts.max||200,onProgress=opts.onProgress||(()=>{});const ls=listScroller();const seen=new Map(),out=[];
  if(ls)ls.scrollTop=0;await sleep(600);let stuck=0;
  while(out.length<max&&stuck<4){const els=[...document.querySelectorAll('.contact-item-container')].filter(e=>e.dataset.cid&&!seen.has(e.dataset.cid));
    if(!els.length){if(!ls)break;const b=ls.scrollTop;ls.scrollTop+=ls.clientHeight*0.8;await sleep(700);if(ls.scrollTop===b)stuck++;continue}stuck=0;
    for(const el of els){const c=contactOf(el);seen.set(c.cid,1);if(c.updated&&c.updated<since){stuck=9;break}
      onProgress(out.length+1,c.name);const ok=await openChat(el,c.name);if(!ok){out.push({...c,messages:[],error:'did not open'});continue}
      await loadHistory(opts.rounds||12);out.push({...c,agent:agentPanel(),messages:readMessages()});if(out.length>=max)break}}
  return out}
window.__mresAli={current,all,readMessages,contactOf,version:1};
})();
