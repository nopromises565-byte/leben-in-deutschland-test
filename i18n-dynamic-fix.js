function lidRefreshDynamicLanguage(){
  if(!window.LID_I18N)return;
  const t=window.LID_I18N.t;
  try{
    const count=document.getElementById('filterCount');
    if(count&&typeof learnPool!=='undefined'){
      const next=`${learnPool.length} ${t('questions')}`;
      if(count.textContent!==next)count.textContent=next;
    }
    const pText=document.getElementById('progressText');
    if(pText&&typeof baseLearningQuestions==='function'&&typeof getSet==='function'&&typeof LS!=='undefined'){
      const base=baseLearningQuestions();
      const learned=getSet(LS.learned);
      const learnedHere=base.filter(q=>learned.has(qKey(q))).length;
      const next=`${learnedHere} ${t('of')} ${base.length} ${t('learned')}`;
      if(pText.textContent!==next)pText.textContent=next;
    }
    const nextBtn=document.getElementById('nextLearn');
    if(nextBtn)nextBtn.textContent=t('next');
    const favBtn=document.getElementById('favBtn');
    if(favBtn){
      const active=favBtn.textContent.includes('★');
      favBtn.textContent=`${active?'★':'☆'} ${t('fav')}`;
    }
  }catch(e){console.warn('Sprach-Synchronisierung:',e);}
}

document.addEventListener('lid-language-change',()=>setTimeout(lidRefreshDynamicLanguage,0));
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(lidRefreshDynamicLanguage,50);
  const targets=['filterCount','progressText','learnCard'];
  const observer=new MutationObserver(()=>setTimeout(lidRefreshDynamicLanguage,0));
  targets.forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el,{childList:true,subtree:true,characterData:true});});
});
