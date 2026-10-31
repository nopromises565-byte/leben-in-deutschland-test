const MEMBER_DATA_URL='https://raw.githubusercontent.com/abdullahbutt/leben-in-deutschland-test/html/quiz-data.json';

function memberSetText(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
function memberEsc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function memberAllQuestions(data){return [...(data?.general||[]),...Object.values(data?.states||{}).flatMap(s=>s.questions||[])];}
function renderQuestionList(el,ids,questions){if(!el)return;const set=new Set((ids||[]).map(String));const rows=questions.filter(q=>set.has(String(q.id))).slice(0,12);el.innerHTML=rows.length?rows.map(q=>`<div class="mini-item"><strong>Frage ${memberEsc(q.id)}</strong><br>${memberEsc(q.de||'')}</div>`).join(''):'<span>Noch nichts gespeichert.</span>';}
function renderExamList(el,rows){if(!el)return;if(!rows?.length){el.innerHTML='<span>Noch keine Prüfung abgeschlossen.</span>';return;}el.innerHTML=rows.slice(0,10).map(r=>{const date=new Date(r.created_at).toLocaleString('de-DE');return `<div class="mini-item"><strong>${r.passed?'✅ Bestanden':'❌ Nicht bestanden'} – ${r.score}/33</strong><br><span>${memberEsc(r.state_slug||'Bundesland')} · ${date}</span></div>`;}).join('');}

async function loadMemberDashboard(){
  const user=await currentUser();
  if(!user)return;
  const status=document.getElementById('memberStatus');
  const [{data:profile},{data:progress,error:progressError},{data:exams,error:examError},questionsResponse]=await Promise.all([
    getProfile(user.id),
    sb.from('user_progress').select('learned_ids,wrong_ids,favorite_ids,updated_at').eq('user_id',user.id).maybeSingle(),
    sb.from('exam_results').select('score,passed,state_slug,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50),
    fetch(MEMBER_DATA_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
  ]);

  memberSetText('memberName',profile?.name||'Mitglied');
  memberSetText('memberEmail',user.email||'');
  const learned=progress?.learned_ids||[];
  const wrong=progress?.wrong_ids||[];
  const favorites=progress?.favorite_ids||[];
  const examRows=exams||[];
  const passed=examRows.filter(e=>e.passed).length;
  const avg=examRows.length?(examRows.reduce((s,e)=>s+Number(e.score||0),0)/examRows.length):null;
  const pct=Math.min(100,Math.round((learned.length/460)*100));

  memberSetText('memberLearned',learned.length);
  memberSetText('memberWrong',wrong.length);
  memberSetText('memberFavorites',favorites.length);
  memberSetText('memberExams',examRows.length);
  memberSetText('progressLearned',`${learned.length} / 460`);
  memberSetText('progressPercent',`${pct} %`);
  const fill=document.getElementById('memberProgressFill');if(fill)fill.style.width=`${pct}%`;
  memberSetText('memberPassed',passed);
  memberSetText('memberPassRate',examRows.length?`${Math.round((passed/examRows.length)*100)} %`:'0 %');
  memberSetText('memberAvgScore',avg===null?'–':avg.toFixed(1)+' / 33');

  const all=memberAllQuestions(questionsResponse);
  renderQuestionList(document.getElementById('memberFavoriteList'),favorites,all);
  renderQuestionList(document.getElementById('memberWrongList'),wrong,all);
  renderExamList(document.getElementById('memberExamList'),examRows);

  if(progressError||examError){status.textContent='Einige persönliche Daten konnten nicht geladen werden.';}
  else status.textContent='Deine persönlichen Lerndaten sind aktuell.';
}

async function initMemberDashboard(){
  await initMemberPage();
  const user=await currentUser();
  if(user)await loadMemberDashboard();
}
