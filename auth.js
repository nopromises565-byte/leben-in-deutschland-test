const SUPABASE_URL='https://riyosejseejzvrbsfrbg.supabase.co';
const SUPABASE_KEY='sb_publishable_TcYKmsTTWj13glSQLb_bCg_wiKKXKao';
const SITE_URL='https://leben-in-deutschland-test-kappa.vercel.app';
const MEMBER_URL=`${SITE_URL}/mitglieder.html`;
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

function authMessage(message=''){
 const m=message.toLowerCase();
 if(m.includes('invalid login credentials'))return 'E-Mail oder Passwort ist falsch.';
 if(m.includes('email not confirmed'))return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
 if(m.includes('user already registered'))return 'Für diese E-Mail gibt es bereits ein Konto.';
 if(m.includes('password should be'))return 'Das Passwort ist zu kurz. Bitte mindestens 8 Zeichen verwenden.';
 if(m.includes('rate limit'))return 'Zu viele Versuche. Bitte später erneut versuchen.';
 return message||'Es ist ein Fehler aufgetreten.';
}
async function currentUser(){const {data}=await sb.auth.getUser();return data.user||null;}
async function signIn(email,password){
 const result=await sb.auth.signInWithPassword({email,password});
 if(result.error)return result;
 const user=result.data?.user;
 if(user){
  const {data:profile,error}=await sb.from('profiles').select('blocked').eq('id',user.id).single();
  if(!error&&profile?.blocked){await sb.auth.signOut();return {data:null,error:{message:'Dieses Konto wurde gesperrt.'}};}
 }
 return result;
}
async function signUp(name,email,password){return sb.auth.signUp({email,password,options:{data:{name},emailRedirectTo:MEMBER_URL}});}
async function requestPasswordReset(email){return sb.auth.resetPasswordForEmail(email,{redirectTo:MEMBER_URL});}
async function updatePassword(password){return sb.auth.updateUser({password});}
async function signOut(){await sb.auth.signOut();location.href='index.html';}
async function getProfile(userId){const {data,error}=await sb.from('profiles').select('id,name,email,role,blocked').eq('id',userId).single();return {data,error};}

async function initMemberPage(){
 const loginForm=document.getElementById('loginForm'),registerForm=document.getElementById('registerForm'),authArea=document.getElementById('authArea'),memberArea=document.getElementById('memberArea'),status=document.getElementById('authStatus');
 const forgotBtn=document.getElementById('forgotPasswordBtn'),resetArea=document.getElementById('resetPasswordArea'),resetForm=document.getElementById('resetPasswordForm');
 let recoveryMode=false;
 sb.auth.onAuthStateChange((event)=>{
  if(event==='PASSWORD_RECOVERY'){
   recoveryMode=true;
   if(authArea)authArea.classList.add('hidden');
   if(resetArea)resetArea.classList.remove('hidden');
   if(status)status.textContent='Lege jetzt dein neues Passwort fest.';
  }
 });
 const user=await currentUser();
 if(user&&!recoveryMode){const {data:profile}=await getProfile(user.id);if(profile?.blocked){await sb.auth.signOut();location.reload();return;}authArea.classList.add('hidden');memberArea.classList.remove('hidden');document.getElementById('memberEmail').textContent=user.email;document.getElementById('logoutBtn').onclick=signOut;return;}
 loginForm.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Anmeldung läuft …';const {error}=await signIn(loginForm.email.value.trim(),loginForm.password.value);if(error){status.textContent=authMessage(error.message);return;}location.reload();});
 registerForm.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Konto wird erstellt …';const {error}=await signUp(registerForm.name.value.trim(),registerForm.email.value.trim(),registerForm.password.value);status.textContent=error?authMessage(error.message):'Konto erstellt. Öffne die Bestätigungs-E-Mail. Der Link führt danach zurück auf diese Website.';});
 if(forgotBtn)forgotBtn.addEventListener('click',async()=>{
  const email=loginForm.email.value.trim();
  if(!email){status.textContent='Bitte zuerst deine E-Mail-Adresse im Anmeldefeld eingeben.';loginForm.email.focus();return;}
  status.textContent='E-Mail zum Zurücksetzen wird gesendet …';
  const {error}=await requestPasswordReset(email);
  status.textContent=error?authMessage(error.message):'E-Mail gesendet. Öffne den Link darin, um ein neues Passwort festzulegen.';
 });
 if(resetForm)resetForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const password=resetForm.password.value;
  const confirm=resetForm.confirmPassword.value;
  if(password!==confirm){status.textContent='Die beiden Passwörter stimmen nicht überein.';return;}
  if(password.length<8){status.textContent='Bitte mindestens 8 Zeichen verwenden.';return;}
  status.textContent='Passwort wird gespeichert …';
  const {error}=await updatePassword(password);
  if(error){status.textContent=authMessage(error.message);return;}
  status.textContent='Passwort geändert. Du bist jetzt angemeldet.';
  setTimeout(()=>location.href='mitglieder.html',500);
 });
}

async function initAdminPage(){
 const loginForm=document.getElementById('adminLoginForm'),loginArea=document.getElementById('adminLoginArea'),adminArea=document.getElementById('adminArea'),status=document.getElementById('adminStatus');
 let user=await currentUser();
 async function checkAdmin(){
  user=await currentUser();
  if(!user)return false;
  const {data,error}=await getProfile(user.id);
  if(error||!data){status.textContent='Admin-Rolle ist noch nicht eingerichtet.';return false;}
  if(data.blocked){await sb.auth.signOut();status.textContent='Dieses Konto wurde gesperrt.';return false;}
  if(data.role!=='admin'){status.textContent='Dieses Konto hat keine Admin-Berechtigung.';return false;}
  loginArea.classList.add('hidden');adminArea.classList.remove('hidden');document.getElementById('adminEmail').textContent=user.email;document.getElementById('adminLogoutBtn').onclick=signOut;return true;
 }
 if(await checkAdmin())return;
 loginForm.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Anmeldung läuft …';const {error}=await signIn(loginForm.email.value.trim(),loginForm.password.value);if(error){status.textContent=authMessage(error.message);return;}await checkAdmin();});
}
