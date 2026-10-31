(()=>{
  const supported='speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let speakingButton=null;
  let currentQuestionText='';

  function resetButton(button){
    if(!button)return;
    button.textContent='🔊 Frage anhören';
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
    utterance.volume=1;

    const germanVoice=pickGermanVoice();
    if(germanVoice)utterance.voice=germanVoice;

    speakingButton=button;
    button.textContent='⏹ Audio stoppen';
    button.setAttribute('aria-pressed','true');

    utterance.onend=()=>{
      if(speakingButton===button){
        resetButton(button);
        speakingButton=null;
      }
    };
    utterance.onerror=()=>{
      if(speakingButton===button){
        resetButton(button);
        speakingButton=null;
      }
    };

    // Chrome/Android can occasionally keep speech synthesis paused.
    try{window.speechSynthesis.resume();}catch{}
    window.speechSynthesis.speak(utterance);
  }

  function enhanceCard(card){
    if(!card)return;
    const title=card.querySelector('.question-title');
    if(!title)return;

    const questionText=(title.textContent||'').trim();
    if(questionText!==currentQuestionText){
      stopSpeech();
      currentQuestionText=questionText;
    }

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

    if(supported){
      button.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        speakQuestion(button,title);
      });
    }
  }

  const learnCard=document.getElementById('learnCard');
  if(!learnCard)return;

  const observer=new MutationObserver(()=>{
    requestAnimationFrame(()=>enhanceCard(learnCard));
  });
  observer.observe(learnCard,{childList:true,subtree:true});
  enhanceCard(learnCard);

  // Some browsers load available voices asynchronously.
  if(supported && 'onvoiceschanged' in window.speechSynthesis){
    window.speechSynthesis.onvoiceschanged=()=>{};
  }

  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpeech();});
  window.addEventListener('beforeunload',stopSpeech);
})();