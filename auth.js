const SUPABASE_URL='https://riyosejseejzvrbsfrbg.supabase.co';
const SUPABASE_KEY='sb_publishable_TcYKmsTTWj13glSQLb_bCg_wiKKXKao';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

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
async function signUp(name,email,password){return sb.auth.signUp({email,password,options:{data:{name}}});}
async function signOut(){await sb.auth.signOut();location.href='index.html';}
async function getProfile(userId){const {data,error}=await sb.from('profiles').select('id,name,email,role,blocked').eq('id',userId).single();return {data,error};}

async function initMemberPage(){
 const loginForm=document.getElementById('loginForm'),registerForm=document.getElementById('registerForm'),authArea=document.getElementById('authArea'),memberArea=document.getElementById('memberArea'),status=document.getElementById('authStatus');
 const user=await currentUser();
 if(user){const {data:profile}=await getProfile(user.id);if(profile?.blocked){await sb.auth.signOut();location.reload();return;}authArea.classList.add('hidden');memberArea.classList.remove('hidden');document.getElementById('memberEmail').textContent=user.email;document.getElementById('logoutBtn').onclick=signOut;return;}
 loginForm.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Anmeldung läuft …';const {error}=await signIn(loginForm.email.value,loginForm.password.value);if(error){status.textContent=error.message;return;}location.reload();});
 registerForm.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Konto wird erstellt …';const {error}=await signUp(registerForm.name.value,registerForm.email.value,registerForm.password.value);status.textContent=error?error.message:'Konto erstellt. Prüfe gegebenenfalls deine E-Mail zur Bestätigung.';});
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
 loginForm.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Anmeldung läuft …';const {error}=await signIn(loginForm.email.value,loginForm.password.value);if(error){status.textContent=error.message;return;}await checkAdmin();});
}
