(()=>{
  const categoryState={value:'all'};

  const labels={
    de:{title:'Prüfungsvorbereitung',sub:'Gezielt nach Themen lernen',all:'Alle Kategorien',democracy:'Leben in der Demokratie',history:'Geschichte & Verantwortung',society:'Mensch & Gesellschaft',state:'Dein Bundesland',questions:'Fragen'},
    ar:{title:'التحضير للاختبار',sub:'تعلّم حسب الموضوع',all:'كل الفئات',democracy:'الحياة في الديمقراطية',history:'التاريخ والمسؤولية',society:'الإنسان والمجتمع',state:'ولايتك',questions:'أسئلة'},
    ku:{title:'Amadekariya ezmûnê',sub:'Li gorî mijaran hîn bibe',all:'Hemû kategorî',democracy:'Jiyan di demokrasiyê de',history:'Dîrok û berpirsiyarî',society:'Mirov û civak',state:'Eyaleta te',questions:'Pirs'},
    en:{title:'Exam preparation',sub:'Study by topic',all:'All categories',democracy:'Life in democracy',history:'History & responsibility',society:'People & society',state:'Your federal state',questions:'Questions'},
    tr:{title:'Sınav hazırlığı',sub:'Konulara göre çalış',all:'Tüm kategoriler',democracy:'Demokraside yaşam',history:'Tarih ve sorumluluk',society:'İnsan ve toplum',state:'Eyaletin',questions:'Soru'},
    uk:{title:'Підготовка до іспиту',sub:'Вчитися за темами',all:'Усі категорії',democracy:'Життя в демократії',history:'Історія та відповідальність',society:'Людина і суспільство',state:'Ваша федеральна земля',questions:'Питань'},
    ru:{title:'Подготовка к экзамену',sub:'Учить по темам',all:'Все категории',democracy:'Жизнь в демократии',history:'История и ответственность',society:'Человек и общество',state:'Ваша федеральная земля',questions:'Вопросов'}
  };

  const defs=[
    {key:'all',icon:'📚'},
    {key:'democracy',icon:'🏛️'},
    {key:'history',icon:'📜'},
    {key:'society',icon:'👥'},
    {key:'state',icon:'📍'}
  ];

  function lang(){return document.getElementById('uiLanguage')?.value||'de'}
  function t(){return labels[lang()]||labels.de}
  function isGeneral(q){return (DATA?.general||[]).includes(q)}
  function matches(q,key){
    if(key==='all')return true;
    if(key==='state')return !isGeneral(q);
    if(!isGeneral(q))return false;
    const id=Number(q.id);
    if(key==='democracy')return id>=1&&id<=100;
    if(key==='history')return id>=101&&id<=200;
    if(key==='society')return id>=201&&id<=300;
    return true;
  }
  function countFor(key){return baseLearningQuestions().filter(q=>matches(q,key)).length}

  function injectStyles(){
    const s=document.createElement('style');
    s.textContent=`
      .prep-section{padding:42px 0 4px}.prep-head{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:16px}.prep-head h2{font-size:2rem;margin:4px 0 0}.prep-sub{color:#687587;font-weight:700}.prep-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.prep-card{border:1px solid #dfe5eb;background:#fff;border-radius:18px;padding:18px;text-align:left;cursor:pointer;box-shadow:0 8px 24px rgba(18,32,51,.05);transition:.18s ease;min-height:130px;display:flex;flex-direction:column;justify-content:space-between}.prep-card:hover{transform:translateY(-2px);border-color:#94b4a8}.prep-card.active{background:#164f3f;color:#fff;border-color:#164f3f;box-shadow:0 10px 26px rgba(22,79,63,.2)}.prep-icon{font-size:1.55rem}.prep-name{font-weight:900;line-height:1.25;margin-top:10px}.prep-count{font-size:.86rem;color:#748095;margin-top:10px;font-weight:700}.prep-card.active .prep-count{color:#dcebe6}@media(max-width:900px){.prep-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.prep-grid{grid-template-columns:1fr}.prep-card{min-height:105px}.prep-section{padding-top:34px}}
    `;
    document.head.appendChild(s);
  }

  function renderCards(){
    const box=document.getElementById('prepCategories');if(!box)return;
    const tx=t();
    box.querySelector('.prep-eyebrow').textContent=tx.sub;
    box.querySelector('h2').textContent=tx.title;
    box.querySelector('.prep-grid').innerHTML=defs.map(d=>`<button class="prep-card ${categoryState.value===d.key?'active':''}" data-cat="${d.key}"><span class="prep-icon">${d.icon}</span><span class="prep-name">${tx[d.key]}</span><span class="prep-count">${countFor(d.key)} ${tx.questions}</span></button>`).join('');
    box.querySelectorAll('[data-cat]').forEach(btn=>btn.onclick=()=>{
      categoryState.value=btn.dataset.cat;
      renderCards();
      renderLearnPool();
      document.getElementById('lernen')?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  function inject(){
    const learn=document.getElementById('lernen');if(!learn||document.getElementById('prepCategories'))return;
    const section=document.createElement('section');section.id='prepCategories';section.className='prep-section';
    section.innerHTML='<div class="prep-head"><div><span class="eyebrow prep-eyebrow"></span><h2></h2></div></div><div class="prep-grid"></div>';
    learn.before(section);renderCards();
  }

  const originalRender=renderLearnPool;
  renderLearnPool=function(){
    const term=searchInput.value.trim().toLowerCase();
    const fav=getSet(LS.fav),wrong=getSet(LS.wrong),learned=getSet(LS.learned);
    let pool=baseLearningQuestions().filter(q=>matches(q,categoryState.value)).filter(q=>!term||q.de?.toLowerCase().includes(term)||q.options?.some(o=>o.de?.toLowerCase().includes(term)));
    if(learnFilter==='unlearned')pool=pool.filter(q=>!learned.has(qKey(q)));
    if(learnFilter==='wrong')pool=pool.filter(q=>wrong.has(qKey(q)));
    if(learnFilter==='favorites')pool=pool.filter(q=>fav.has(qKey(q)));
    learnPool=pool;
    if(filterCount)filterCount.textContent=`${learnPool.length} ${t().questions}`;
    showLearn(learnPool[0]||null);
    if(document.getElementById('prepCategories'))renderCards();
  };

  injectStyles();
  const start=()=>{inject();renderCards();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  document.getElementById('uiLanguage')?.addEventListener('change',()=>setTimeout(renderCards,0));
})();