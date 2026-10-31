// Verbesserungen für den Prüfungsmodus, ohne die bestehende Lernlogik zu verändern.
(function(){
  const originalStartExam=startExam;
  const originalFinishExam=finishExam;

  startExam=function(){
    originalStartExam();
    const result=document.getElementById('examResult');
    if(result) result.dataset.saved='false';
  };

  showExam=function(){
    if(examIndex>=exam.length) return finishExam();
    const q=exam[examIndex];
    const percent=Math.round((examIndex/33)*100);
    examCard.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <div class="question-number">Frage <strong>${examIndex+1}</strong> <span>von 33</span></div>
        <strong style="color:#536175">${examIndex} beantwortet · ${33-examIndex} offen</strong>
      </div>
      <div style="height:9px;background:#e4ebe7;border-radius:999px;overflow:hidden;margin-bottom:20px">
        <div style="height:100%;width:${percent}%;background:#164f3f;transition:width .2s ease"></div>
      </div>
      <p class="question-title">${q.de}</p>
      ${q.image?`<img src="https://raw.githubusercontent.com/abdullahbutt/leben-in-deutschland-test/html/${q.image}" alt="Abbildung zur Frage" style="max-width:100%;border-radius:14px;margin-bottom:16px">`:''}
      <div class="answers">${q.options.map((o,i)=>`<button class="answer" data-i="${i}"><span class="answer-letter">${String.fromCharCode(65+i)}</span><span>${o.de}</span></button>`).join('')}</div>`;

    examCard.querySelectorAll('.answer').forEach(b=>b.onclick=()=>{
      const chosen=+b.dataset.i;
      if(chosen===q.correct){
        examScore++;
        const wrong=getSet(LS.wrong);wrong.delete(qKey(q));saveSet(LS.wrong,wrong);
      }else{
        const wrong=getSet(LS.wrong);wrong.add(qKey(q));saveSet(LS.wrong,wrong);
      }
      examIndex++;
      showExam();
    });
  };

  startTimer=function(){
    clearInterval(timer);
    timerEl.textContent='60:00';
    timerEl.style.color='';
    timer=setInterval(()=>{
      seconds--;
      if(seconds<0) seconds=0;
      const m=String(Math.floor(seconds/60)).padStart(2,'0');
      const s=String(seconds%60).padStart(2,'0');
      timerEl.textContent=`${m}:${s}`;
      if(seconds<=300) timerEl.style.color='#b84242';
      if(seconds<=0){
        clearInterval(timer);
        finishExam(true);
      }
    },1000);
  };

  finishExam=function(timeExpired=false){
    if(examResult && !examResult.classList.contains('hidden')) return;
    clearInterval(timer);
    examCard.classList.add('hidden');
    examResult.classList.remove('hidden');
    const passed=examScore>=17;
    const percent=Math.round((examScore/33)*100);
    const answered=Math.min(examIndex,33);
    examResult.innerHTML=`
      <div style="padding:24px">
        <span class="eyebrow">Prüfung beendet</span>
        <h3 style="font-size:2rem;margin:8px 0 12px">${passed?'Bestanden 🎉':'Noch nicht bestanden'}</h3>
        ${timeExpired?'<p><strong>Die 60 Minuten sind abgelaufen.</strong></p>':''}
        <p>Du hast <strong>${examScore} von 33</strong> Fragen richtig beantwortet (${percent} %).</p>
        <p>${answered} Fragen beantwortet · ${33-answered} unbeantwortet.</p>
        <p><strong>${passed?'Die Bestehensgrenze von 17 richtigen Antworten wurde erreicht.':'Zum Bestehen brauchst du mindestens 17 richtige Antworten.'}</strong></p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
          <button id="restartExam" class="btn primary">Neue Prüfung starten</button>
          <a class="btn" href="mitglieder.html">Meine Ergebnisse</a>
        </div>
      </div>`;
    document.getElementById('restartExam').onclick=startExam;
    refreshLists();
    document.dispatchEvent(new CustomEvent('lid:exam-finished',{detail:{score:examScore,passed,state:stateSelect.value,answered,timeExpired}}));
  };
})();
