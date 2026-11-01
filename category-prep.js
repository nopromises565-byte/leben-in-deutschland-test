(()=>{
  const labels={
    de:{questions:'Fragen'},ar:{questions:'أسئلة'},ku:{questions:'Pirs'},en:{questions:'Questions'},tr:{questions:'Soru'},uk:{questions:'Питань'},ru:{questions:'Вопросов'}
  };
  function lang(){return document.getElementById('uiLanguage')?.value||'de'}
  function t(){return labels[lang()]||labels.de}

  renderLearnPool=function(){
    const term=searchInput.value.trim().toLowerCase();
    const fav=getSet(LS.fav),wrong=getSet(LS.wrong),learned=getSet(LS.learned);
    let pool=baseLearningQuestions().filter(q=>!term||q.de?.toLowerCase().includes(term)||q.options?.some(o=>o.de?.toLowerCase().includes(term)));
    if(learnFilter==='unlearned')pool=pool.filter(q=>!learned.has(qKey(q)));
    if(learnFilter==='wrong')pool=pool.filter(q=>wrong.has(qKey(q)));
    if(learnFilter==='favorites')pool=pool.filter(q=>fav.has(qKey(q)));
    learnPool=pool;
    if(filterCount)filterCount.textContent=`${learnPool.length} ${t().questions}`;
    showLearn(learnPool[0]||null);
  };
})();