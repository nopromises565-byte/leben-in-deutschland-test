async function initAdminSection(){
  const status=document.getElementById('sectionStatus');
  const content=document.getElementById('sectionContent');
  const user=await currentUser();
  if(!user){location.href='admin.html';return;}
  const {data,error}=await getProfile(user.id);
  if(error||!data||data.role!=='admin'){location.href='admin.html';return;}
  if(status) status.textContent=`Angemeldet als ${user.email}`;
  if(content) content.classList.remove('hidden');
}
