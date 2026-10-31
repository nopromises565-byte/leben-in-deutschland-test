const LID_LEARN_LANG_COLUMNS={
  de:{exp:'explanation_de',mem:'mnemonic_de',expLabel:'Erklärung',memLabel:'Eselsbrücke'},
  ar:{exp:'explanation_ar',mem:'mnemonic_ar',expLabel:'الشرح',memLabel:'جسر التذكّر'},
  ku:{exp:'explanation_ku',mem:'mnemonic_ku',expLabel:'Ravekirin',memLabel:'Alîkariya bîranînê'},
  tr:{exp:'explanation_tr',mem:'mnemonic_tr',expLabel:'Açıklama',memLabel:'Hatırlama ipucu'},
  uk:{exp:'explanation_uk',mem:'mnemonic_uk',expLabel:'Пояснення',memLabel:'Підказка для запам’ятовування'},
  ru:{exp:'explanation_ru',mem:'mnemonic_ru',expLabel:'Объяснение',memLabel:'Подсказка для запоминания'}
};
let lidLastAnsweredQuestion=null;
let lidLastAnsweredCorrect=false;
let lidLearningRowCache=new Map();

async function lidGetLearningRow(q){
  const id=String(q.id);
  if(lidLearningRowCache.has(id))return lidLearningRowCache.get(id);
  try{
    if(typeof sb==='undefined')return null;
    const cols='explanation_de,explanation_ar,explanation_ku,explanation_tr,explanation_uk,explanation_ru,mnemonic_de,mnemonic_ar,mnemonic_ku,mnemonic_tr,mnemonic_uk,mnemonic_ru';
    const {data,error}=await sb.from('questions').select(cols).eq('id',id).maybeSingle();
    if(error)return null;
    lidLearningRowCache.set(id,data||null);
    return data||null;
  }catch{return null;}
}

function lidCurrentLearnLang(){
  const lang=window.LID_I18N?.language||'de';
  return LID_LEARN_LANG_COLUMNS[lang]?lang:(lang==='en'?'de':'de');
}

function lidFeedbackTitle(correct){
  const t=window.LID_I18N?.t;
  if(typeof t==='function')return correct?t('right'):t('wrongMsg');
  return correct?'Richtig!':'Leider falsch.';
}

async function lidRenderLearningFeedback(q,correct){
  const feedback=document.getElementById('learnFeedback');
  const area=document.getElementById('mnemonicArea');
  if(!feedback||!area)return;
  const row=await lidGetLearningRow(q);
  const lang=lidCurrentLearnLang();
  const cfg=LID_LEARN_LANG_COLUMNS[lang];
  let explanation=(row?.[cfg.exp]||'').trim();
  let mnemonic=(row?.[cfg.mem]||'').trim();
  if(!explanation)explanation=(row?.explanation_de||q.exp_de||'').trim();
  if(!mnemonic)mnemonic=(row?.mnemonic_de||'').trim();
  if(!mnemonic&&typeof automaticMnemonic==='function')mnemonic=automaticMnemonic(q,lang);
  const rtl=lang==='ar';
  feedback.innerHTML=`<div class="feedback"><strong>${lidFeedbackTitle(correct)}</strong></div>`;
  area.innerHTML=`<div class="learning-extras" dir="${rtl?'rtl':'ltr'}" style="margin-top:16px;display:grid;gap:12px">
    <div class="learning-extra explanation-box" style="padding:16px;border:1px solid #d9e2e7;border-radius:14px;background:#f7faf9">
      <strong style="display:block;margin-bottom:8px">💡 ${cfg.expLabel}</strong>
      <div>${escapeLearnHtml(explanation||'—')}</div>
    </div>
    <div class="learning-extra mnemonic-box-visible" style="padding:16px;border:1px solid #ead9a8;border-radius:14px;background:#fffaf0">
      <strong style="display:block;margin-bottom:8px">🧠 ${cfg.memLabel}</strong>
      <div>${escapeLearnHtml(mnemonic||'—')}</div>
    </div>
  </div>`;
}

function escapeLearnHtml(value=''){
  return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

answerLearn=async function(q,i){
  learnCard.querySelectorAll('.answer').forEach((b,idx)=>{
    b.disabled=true;
    if(idx===q.correct)b.classList.add('correct');
    if(idx===i&&i!==q.correct)b.classList.add('wrong');
  });
  const learned=getSet(LS.learned);learned.add(qKey(q));saveSet(LS.learned,learned);
  const wrong=getSet(LS.wrong);if(i!==q.correct)wrong.add(qKey(q));else wrong.delete(qKey(q));saveSet(LS.wrong,wrong);
  lidLastAnsweredQuestion=q;
  lidLastAnsweredCorrect=i===q.correct;
  const feedback=document.getElementById('learnFeedback');
  const area=document.getElementById('mnemonicArea');
  if(feedback)feedback.innerHTML=`<div class="feedback"><strong>${lidFeedbackTitle(lidLastAnsweredCorrect)}</strong><br><small>Erklärung wird geladen …</small></div>`;
  if(area)area.innerHTML='';
  await lidRenderLearningFeedback(q,lidLastAnsweredCorrect);
  refreshLists();
  if(learnFilter==='wrong'||learnFilter==='unlearned')setTimeout(()=>{
    const key=qKey(q);learnPool=learnPool.filter(x=>qKey(x)!==key);if(filterCount)filterCount.textContent=`${learnPool.length} Fragen`;
  },0);
};

document.addEventListener('lid-language-change',()=>{
  if(lidLastAnsweredQuestion&&document.getElementById('learnFeedback'))lidRenderLearningFeedback(lidLastAnsweredQuestion,lidLastAnsweredCorrect);
});
