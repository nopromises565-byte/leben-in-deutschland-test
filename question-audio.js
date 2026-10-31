(()=>{
  const supported='speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let speakingButton=null;
  let currentQuestionText='';

  function resetButton(button){
    if(!button)return;
    const type=button.dataset.audioType;
    button.textContent=type==='question'?'🔊 Frage anhören':'🔊';
    button.setAttribute('aria-pressed','false');
  }

  function stopSpeech(){
    if(!supported)return;
    window.speechSynthesis.cancel();
    if(speakingButton){
      resetButton(speakingButton);
      speakingButton=null;
    }
  }

  function pickGermanVoice(){
    const voices=window.speechSynthesis.getVoices();
    return voices.find(v=>/^de-DE$/i.test(v.lang))
      || voices.find(v=>/^de(-|_)/i.test(v.lang))
      || voices.find(v=>/german|deutsch/i.test(v.name))
      || null;
  }

  function speakText(button,text){
    if(!supported)return;
    if(speakingButton===button && window.speechSynthesis.speaking){stopSpeech();return;}
    stopSpeech();
    text=(text||'').trim();
    if(!text)return;

    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang='de-DE';
    utterance.rate=0.9;
    utterance.pitch=1;
    utterance.volume=1;
    const germanVoice=pickGermanVoice();
    if(germanVoice)utterance.voice=germanVoice;

    speakingButton=button;
    button.textContent='⏹';
    button.setAttribute('aria-pressed','true');

    const done=()=>{if(speakingButton===button){resetButton(button);speakingButton=null;}};
    utterance.onend=done;
    utterance.onerror=done;
    try{window.speechSynthesis.resume();}catch{}
    window.speechSynthesis.speak(utterance);
  }

  function addQuestionAudio(card,title){
    if(card.querySelector('.question-audio-btn'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='btn question-audio-btn';
    button.dataset.audioType='question';
    button.textContent=supported?'🔊 Frage anhören':'🔇 Audio nicht unterstützt';
    button.disabled=!supported;
    button.setAttribute('aria-label','Deutsche Frage vorlesen');
    button.setAttribute('aria-pressed','false');
    button.style.margin='0 0 16px 0';
    title.insertAdjacentElement('afterend',button);
    if(supported)button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();speakText(button,title.textContent);});
  }

  function addAnswerAudio(card){
    card.querySelectorAll('.answer').forEach((answer,index)=>{
      if(answer.querySelector('.answer-audio-btn'))return;
      const textSpan=answer.querySelector('span:last-child');
      if(!textSpan)return;
      const audio=document.createElement('button');
      audio.type='button';
      audio.className='answer-audio-btn';
      audio.dataset.audioType='answer';
      audio.textContent=supported?'🔊':'🔇';
      audio.disabled=!supported;
      audio.setAttribute('aria-label',`Antwort ${String.fromCharCode(65+index)} vorlesen`);
      audio.setAttribute('aria-pressed','false');
      audio.style.marginLeft='10px';
      audio.style.border='0';
      audio.style.background='transparent';
      audio.style.cursor=supported?'pointer':'default';
      audio.style.fontSize='18px';
      audio.style.flex='0 0 auto';
      audio.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        speakText(audio,textSpan.textContent);
      });
      answer.appendChild(audio);
    });
  }

  function enhanceCard(card){
    if(!card)return;
    const title=card.querySelector('.question-title');
    if(!title)return;
    const questionText=(title.textContent||'').trim();
    if(questionText!==currentQuestionText){stopSpeech();currentQuestionText=questionText;}
    addQuestionAudio(card,title);
    addAnswerAudio(card);
  }

  const learnCard=document.getElementById('learnCard');
  if(!learnCard)return;
  const observer=new MutationObserver(()=>requestAnimationFrame(()=>enhanceCard(learnCard)));
  observer.observe(learnCard,{childList:true,subtree:true});
  enhanceCard(learnCard);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpeech();});
  window.addEventListener('beforeunload',stopSpeech);
})();