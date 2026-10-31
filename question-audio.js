(()=>{
  const supported='speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let speakingButton=null;

  function stopSpeech(){
    if(!supported)return;
    window.speechSynthesis.cancel();
    if(speakingButton){
      speakingButton.textContent='🔊 Frage anhören';
      speakingButton.setAttribute('aria-pressed','false');
      speakingButton=null;
    }
  }

  function speakQuestion(button,title){
    if(!supported)return;
    if(speakingButton===button && window.speechSynthesis.speaking){
      stopSpeech();
      return;
    }
    stopSpeech();
    const text=(title?.textContent||'').trim();
    if(!text)return;
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang='de-DE';
    utterance.rate=0.9;
    utterance.pitch=1;
    const voices=window.speechSynthesis.getVoices();
    const germanVoice=voices.find(v=>/^de(-|_)/i.test(v.lang))||voices.find(v=>/german|deutsch/i.test(v.name));
    if(germanVoice)utterance.voice=germanVoice;
    speakingButton=button;
    button.textContent='⏹ Audio stoppen';
    button.setAttribute('aria-pressed','true');
    utterance.onend=()=>{if(speakingButton===button){button.textContent='🔊 Frage anhören';button.setAttribute('aria-pressed','false');speakingButton=null;}};
    utterance.onerror=()=>{if(speakingButton===button){button.textContent='🔊 Frage anhören';button.setAttribute('aria-pressed','false');speakingButton=null;}};
    window.speechSynthesis.speak(utterance);
  }

  function enhanceCard(card){
    if(!card)return;
    const title=card.querySelector('.question-title');
    if(!title)return;
    if(card.querySelector('.question-audio-btn'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='btn question-audio-btn';
    button.textContent=supported?'🔊 Frage anhören':'🔇 Audio nicht unterstützt';
    button.disabled=!supported;
    button.setAttribute('aria-label','Deutsche Frage vorlesen');
    button.setAttribute('aria-pressed','false');
    button.style.margin='0 0 16px 0';
    title.insertAdjacentElement('afterend',button);
    if(supported)button.addEventListener('click',()=>speakQuestion(button,title));
  }

  const learnCard=document.getElementById('learnCard');
  if(!learnCard)return;

  const observer=new MutationObserver(()=>{
    stopSpeech();
    requestAnimationFrame(()=>enhanceCard(learnCard));
  });
  observer.observe(learnCard,{childList:true,subtree:true});
  enhanceCard(learnCard);

  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpeech();});
  window.addEventListener('beforeunload',stopSpeech);
})();