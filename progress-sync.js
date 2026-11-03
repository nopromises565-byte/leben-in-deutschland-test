const PROGRESS_KEYS={fav:'lid_favorites',wrong:'lid_wrong',learned:'lid_learned'};
let progressUser=null;let progressReady=false;let syncingProgress=false;let lastExamSignature='';
function readIds(key){try{return [...new Set(JSON.parse(localStorage.getItem(key)||'[]').map(String))];}catch{return [];}}
function writeIds(key,ids){localStorage.setItem(key,JSON.stringify([...new Set((ids||[]).map(String))]));}
function union(a,b){return [...new Set([...(a||[]),...(b||[])].map(String))];}
async function loadRemoteProgress(){progressUser=await currentUser();if(!progressUser){progressReady=true;return;}const {data,error}=await sb.from('user_progress').select('learned_ids,wrong_ids,favorite_ids').eq('user_id',progressUser.id).maybeSingle();if(error){console.warn('Progress laden:',error.message);progressReady=true;return;}if(data){writeIds(PROGRESS_KEYS.learned,union(readIds(PROGRESS_KEYS.learned),data.learned_ids));writeIds(PROGRESS_KEYS.wrong,union(readIds(PROGRESS_KEYS.wrong),data.wrong_ids));writeIds(PROGRESS_KEYS.fav,union(readIds(PROGRESS_KEYS.fav),data.favorite_ids));}await saveRemoteProgress();progressReady=true;try{if(typeof refreshLists==='function')refreshLists();if(typeof renderLearnPool==='function')renderLearnPool();}catch{}}
async function saveRemoteProgress(){if(syncingProgress||!progressUser)return;syncingProgress=true;try{const payload={user_id:progressUser.id,learned_ids:readIds(PROGRESS_KEYS.learned),wrong_ids:readIds(PROGRESS_KEYS.wrong),favorite_ids:readIds(PROGRESS_KEYS.fav),updated_at:new Date().toISOString()};const {error}=await sb.from('user_progress').upsert(payload,{onConflict:'user_id'});if(error)console.warn('Progress speichern:',error.message);}finally{syncingProgress=false;}}
const originalSetItem=localStorage.setItem.bind(localStorage);localStorage.setItem=function(key,value){originalSetItem(key,value);if(progressReady&&Object.values(PROGRESS_KEYS).includes(key))setTimeout(saveRemoteProgress,0);};
async function saveExamFromResult(){if(!progressUser)progressUser=await currentUser();if(!progressUser)return;const el=document.getElementById('examResult');if(!el||el.classList.contains('hidden'))return;const m=el.textContent.match(/(\d+)\s+von\s+33/i);if(!m)return;const score=Number(m[1]);const signature=`${score}|${el.textContent.trim()}`;if(signature===lastExamSignature)return;lastExamSignature=signature;const state=document.getElementById('state')?.value||null;const {error}=await sb.from('exam_results').insert({user_id:progressUser.id,score,passed:score>=17,state_slug:state});if(error)console.warn('Prüfung speichern:',error.message);}
function watchExamResults(){const el=document.getElementById('examResult');if(!el)return;new MutationObserver(()=>{saveExamFromResult();}).observe(el,{childList:true,subtree:true,attributes:true,characterData:true});}

/* Robust explanation display. This runs independently from the learning-card renderer,
   so translations/audio enhancements cannot leave the feedback stuck on "Erklärung wird geladen …". */
async function forceQuestionExplanation(q,selectedIndex){
 if(!q||typeof sb==='undefined')return;
 const allowed=['de','ar','ku','tr','uk','ru'];
 const lang=(typeof i18nLang==='string'&&allowed.includes(i18nLang))?i18nLang:'de';
 const langColumn=`explanation_${lang}`;
 try{
  const {data,error}=await sb.from('questions').select(`${langColumn},explanation_de`).eq('id',String(q.id)).maybeSingle();
  if(error)throw error;
  const explanation=(data?.[langColumn]||data?.explanation_de||'').trim();
  if(!explanation)return;
  const feedback=document.getElementById('learnFeedback');
  if(!feedback||typeof current==='undefined'||String(current?.id)!==String(q.id))return;
  const box=document.createElement('div');box.className='feedback';
  const strong=document.createElement('strong');
  const isRight=Number(selectedIndex)===Number(q.correct);
  strong.textContent=typeof i18nT==='function'?i18nT(isRight?'right':'wrongMsg'):(isRight?'Richtig!':'Leider falsch.');
  const br=document.createElement('br');
  const label=document.createElement('span');label.className='explanation-label';
  label.textContent=lang==='de'?'Erklärung: ':'';
  const text=document.createElement('span');text.id='explanationText';text.textContent=explanation;
  box.append(strong,br,label,text);feedback.replaceChildren(box);
 }catch(e){console.error('Erklärung anzeigen:',e);}
}
function installExplanationFix(){
 const card=document.getElementById('learnCard');if(!card)return;
 card.addEventListener('click',e=>{
  const btn=e.target.closest('.answer');if(!btn||btn.disabled)return;
  const q=(typeof current!=='undefined')?current:null;
  const selectedIndex=Number(btn.dataset.i);
  if(q)setTimeout(()=>forceQuestionExplanation(q,selectedIndex),0);
 },true);
 const observer=new MutationObserver(()=>{
  const feedback=document.getElementById('learnFeedback');
  if(!feedback||!feedback.textContent.includes('Erklärung wird geladen'))return;
  const q=(typeof current!=='undefined')?current:null;if(!q)return;
  const selected=[...card.querySelectorAll('.answer')].findIndex(b=>b.classList.contains('wrong')||b.classList.contains('correct')&&b.disabled);
  forceQuestionExplanation(q,selected>=0?selected:q.correct);
 });
 observer.observe(card,{childList:true,subtree:true,characterData:true});
}

document.addEventListener('DOMContentLoaded',async()=>{watchExamResults();installExplanationFix();await loadRemoteProgress();});
