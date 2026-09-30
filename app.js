
const $=s=>document.querySelector(s), app=$("#app");
let session=JSON.parse(localStorage.getItem("cbt_session")||"null"), examState=null;
async function api(action,data={}){const res=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,...data,...(session?{role:session.role,user_id:session.id}: {})})});const x=await res.json();if(!x.ok)throw new Error(x.error||"Terjadi kesalahan");return x}
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function logout(){localStorage.removeItem("cbt_session");session=null;renderLogin()}
function renderLogin(){app.innerHTML=`<div class="login"><div class="loginbox card"><div class="logo">CBT Online</div><p class="muted">Ujian berbasis komputer</p><div class="field"><label>Role</label><select id="role"><option>ADMIN</option><option>PROKTOR</option><option>SISWA</option></select></div><div class="field"><label>Username</label><input id="user"></div><div class="field"><label>Password</label><input id="pass" type="password"></div><button id="login">Masuk</button><div id="msg" class="notice" style="display:none"></div></div></div>`;$("#login").onclick=async()=>{try{const x=await api("login",{role:$("#role").value,username:$("#user").value,password:$("#pass").value});session=x.user;localStorage.setItem("cbt_session",JSON.stringify(session));render()}catch(e){$("#msg").style.display="block";$("#msg").textContent=e.message}}}
function render(){if(!session)return renderLogin();if(session.role==="SISWA")return renderStudent();renderDashboard()}
async function renderDashboard(){app.innerHTML=`<div class="layout"><aside class="side"><h2>CBT Online</h2><div class="muted" style="color:#cbd5e1">${esc(session.nama)}</div><div class="nav" id="nav"></div><button onclick="logout()" style="margin-top:20px;background:#374151;width:100%">Keluar</button></aside><main class="main"><div class="top"><div><h1 id="title">Dashboard</h1><div class="muted">Sistem ujian online</div></div></div><section id="content"></section></main></div>`;const nav=$("#nav");let items=session.role==="ADMIN"?["Dashboard","Akun Proktor","Akun Siswa","Ujian","Hasil"]:["Dashboard","Data Siswa","Ujian","Soal","Analisis Soal","Hasil"];items.forEach(i=>{let b=document.createElement("button");b.textContent=i;b.onclick=()=>page(i);nav.appendChild(b)});page("Dashboard")}
async function page(p){$("#title").textContent=p;const c=$("#content");try{
if(p==="Dashboard"){const x=await api("dashboard");c.innerHTML=`<div class="grid"><div class="card stat">Siswa<strong>${x.stats.siswa}</strong></div><div class="card stat">Ujian<strong>${x.stats.ujian}</strong></div><div class="card stat">Hasil<strong>${x.stats.hasil}</strong></div></div>`}
else if(p==="Akun Proktor")accounts(c,"PROKTOR");else if(p==="Akun Siswa"||p==="Data Siswa")accounts(c,"SISWA");else if(p==="Ujian")ujian(c);else if(p==="Soal")soal(c);else if(p==="Analisis Soal")analysis(c);else if(p==="Hasil")results(c);
}catch(e){c.innerHTML=`<div class="card notice">${esc(e.message)}</div>`}}
async function accounts(c,type){const x=await api("listAccounts");const data=type==="PROKTOR"?x.proktor:x.siswa;c.innerHTML=`<div class="card"><div class="top"><h3>${type==="PROKTOR"?"Akun Proktor":"Data Siswa"}</h3><button onclick="accountForm('${type}')">+ Tambah</button></div><table class="table"><thead><tr><th>Nama</th><th>Username</th><th>${type==="PROKTOR"?"Kode":"NIS"}</th><th>Aksi</th></tr></thead><tbody>${data.map(a=>`<tr><td>${esc(a.nama)}</td><td>${esc(a.username)}</td><td>${esc(type==="PROKTOR"?a.kode_proktor:a.nis)}</td><td class="actions"><button onclick='accountForm(${JSON.stringify(type)},${JSON.stringify(a)})'>Edit</button><button class="danger" onclick="delAccount('${type}','${a.id}')">Hapus</button></td></tr>`).join("")}</tbody></table></div>`}
async function accountForm(type,a={}){const fields=type==="PROKTOR"?`<div class="field"><label>Nama</label><input id="n" value="${esc(a.nama)}"></div><div class="field"><label>Username</label><input id="u" value="${esc(a.username)}"></div><div class="field"><label>Password ${a.id?"(kosongkan jika tidak diubah)":""}</label><input id="p" type="password"></div>`:`<div class="field"><label>Nama</label><input id="n" value="${esc(a.nama)}"></div><div class="field"><label>Username</label><input id="u" value="${esc(a.username)}"></div><div class="field"><label>NIS</label><input id="nis" value="${esc(a.nis)}"></div><div class="field"><label>Password</label><input id="p" type="password"></div>`;const box=document.createElement("div");box.className="card";box.style="position:fixed;inset:8% 10%;z-index:9;overflow:auto";box.innerHTML=`<h3>${a.id?"Edit":"Tambah"} ${type}</h3>${fields}<div class="actions"><button id="save">Simpan</button><button onclick="this.closest('.card').remove()">Batal</button></div>`;document.body.appendChild(box);$("#save").onclick=async()=>{try{let d={type,id:a.id,nama:$("#n").value,username:$("#u").value,password:$("#p").value};if(type==="SISWA")d.nis=$("#nis").value;await api("saveAccount",d);box.remove();page(type==="PROKTOR"?"Akun Proktor":session.role==="PROKTOR"?"Data Siswa":"Akun Siswa")}catch(e){alert(e.message)}}}
async function delAccount(type,id){if(confirm("Hapus akun?")){try{await api("deleteAccount",{type,id});page(type==="PROKTOR"?"Akun Proktor":session.role==="PROKTOR"?"Data Siswa":"Akun Siswa")}catch(e){alert(e.message)}}}
async function ujian(c){const x=await api("listUjian");c.innerHTML=`<div class="card"><div class="top"><h3>Ujian</h3><button onclick="examForm()">+ Buat Ujian</button></div><table class="table"><tr><th>Nama</th><th>Kode</th><th>Durasi</th><th>Status</th><th>Aksi</th></tr>${x.data.map(u=>`<tr><td>${esc(u.nama)}</td><td><b>${esc(u.kode_ujian)}</b></td><td>${u.durasi_menit} menit</td><td><span class="pill">${esc(u.status)}</span></td><td class="actions"><button onclick='examForm(${JSON.stringify(u)})'>Edit</button><button onclick="openSoal('${u.kode_ujian}')">Soal</button><button onclick="openAnalysis('${u.kode_ujian}')">Analisis</button><button class="danger" onclick="delExam('${u.id}')">Hapus</button></td></tr>`).join("")}</table></div>`}
async function examForm(a={}){const box=document.createElement("div");box.className="card";box.style="position:fixed;inset:10% 15%;z-index:9";box.innerHTML=`<h3>${a.id?"Edit":"Buat"} Ujian</h3><div class="field"><label>Nama ujian</label><input id="n" value="${esc(a.nama)}"></div><div class="field"><label>Kode (kosong = otomatis)</label><input id="k" value="${esc(a.kode_ujian)}"></div><div class="field"><label>Durasi menit</label><input id="d" type="number" value="${a.durasi_menit||60}"></div><div class="field"><label>Acak soal</label><select id="as"><option ${a.acak_soal==="YA"?"selected":""}>TIDAK</option><option ${a.acak_soal==="YA"?"selected":""}>YA</option></select></div><div class="field"><label>Acak pilihan</label><select id="ap"><option>TIDAK</option><option ${a.acak_pilihan==="YA"?"selected":""}>YA</option></select></div><div class="field"><label>Status</label><select id="st"><option>AKTIF</option><option ${a.status==="NONAKTIF"?"selected":""}>NONAKTIF</option></select></div><div class="actions"><button id="save">Simpan</button><button onclick="this.closest('.card').remove()">Batal</button></div>`;document.body.appendChild(box);$("#save").onclick=async()=>{try{await api("saveUjian",{id:a.id,nama:$("#n").value,kode_ujian:$("#k").value,durasi_menit:$("#d").value,acak_soal:$("#as").value,acak_pilihan:$("#ap").value,status:$("#st").value});box.remove();page("Ujian")}catch(e){alert(e.message)}}}
async function delExam(id){if(confirm("Hapus ujian?")){await api("deleteUjian",{id});page("Ujian")}}
function openSoal(k){page("Soal");setTimeout(()=>loadSoal(k),50)}
async function soal(c){const u=await api("listUjian");c.innerHTML=`<div class="card"><div class="top"><div><h3>Bank Soal</h3><div class="muted">Tambah satuan atau impor massal dari Excel/Spreadsheet</div></div><div class="actions"><button class="secondary" onclick="downloadSoalTemplate()">Template Excel</button><button onclick="showImportGuide()">Cara Import</button></div></div><div class="field"><label>Pilih ujian</label><select id="sel"><option value="">-- pilih --</option>${u.data.map(x=>`<option value="${x.kode_ujian}">${esc(x.nama)} (${esc(x.kode_ujian)})</option>`).join("")}</select></div><div id="sq"></div></div>`;$("#sel").onchange=()=>loadSoal($("#sel").value)}
async function loadSoal(k){if(!k)return;const q=await api("listSoal",{kode_ujian:k});$("#sq").innerHTML=`<div class="top"><b>${q.data.length} soal</b><button onclick="addQuestion('${k}')">+ Tambah Soal</button></div><table class="table"><tr><th>No</th><th>Soal</th><th>Kunci</th></tr>${q.data.map(s=>`<tr><td>${s.nomor}</td><td>${esc(String(s.soal).slice(0,100))}</td><td>${esc(s.jawaban)}</td></tr>`).join("")}</table><div class="notice">Untuk impor massal, isi sheet SOAL sesuai header yang tersedia. Gambar dapat berupa URL gambar publik.</div>`}
async function addQuestion(k){const box=document.createElement("div");box.className="card";box.style="position:fixed;inset:5% 8%;z-index:9;overflow:auto";box.innerHTML=`<h3>Tambah Soal</h3><div class="field"><label>Nomor</label><input id="no" type="number"></div><div class="field"><label>Soal</label><textarea id="q" rows="4"></textarea></div><div class="field"><label>URL gambar soal</label><input id="qi"></div>${["A","B","C","D","E"].map(x=>`<div class="field"><label>Pilihan ${x}</label><input id="${x}"><label>URL gambar ${x}</label><input id="${x}i"></div>`).join("")}<div class="field"><label>Kunci</label><select id="key">${["A","B","C","D","E"].map(x=>`<option>${x}</option>`).join("")}</select></div><button id="save">Simpan</button> <button onclick="this.closest('.card').remove()">Batal</button>`;document.body.appendChild(box);$("#save").onclick=async()=>{const d={kode_ujian:k,nomor:$("#no").value,soal:$("#q").value,gambar_soal:$("#qi").value,jawaban:$("#key").value,bobot:1};["A","B","C","D","E"].forEach(x=>{d[x]=$( "#"+x).value;d["gambar_"+x]=$( "#"+x+"i").value});try{await api("saveSoal",d);box.remove();loadSoal(k)}catch(e){alert(e.message)}}}
async function analysis(c,k){const u=await api("listUjian");c.innerHTML=`<div class="card"><h3>Analisis Soal Otomatis</h3><div class="field"><select id="sel"><option value="">Pilih ujian</option>${u.data.map(x=>`<option value="${x.kode_ujian}">${esc(x.nama)}</option>`).join("")}</select></div><div id="an"></div></div>`;$("#sel").onchange=()=>openAnalysis($("#sel").value)}
async function openAnalysis(k){page("Analisis Soal");setTimeout(async()=>{const s=$("#sel");if(s){s.value=k;const x=await api("analysis",{kode_ujian:k});renderAnalysis(x)}} ,50)}
async function renderAnalysis(x){const a=$("#an");a.innerHTML=`<div class="grid"><div class="card stat">Peserta<strong>${x.summary.peserta}</strong></div><div class="card stat">Selesai<strong>${x.summary.selesai}</strong></div><div class="card stat">Rata-rata<strong>${x.summary.rata2}</strong></div><div class="card stat">Tertinggi<strong>${x.summary.tertinggi}</strong></div><div class="card stat">Terendah<strong>${x.summary.terendah}</strong></div></div><br><table class="table"><tr><th>No</th><th>Benar</th><th>Salah</th><th>Kosong</th><th>% Benar</th><th>Tingkat</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr>${x.detail.map(d=>`<tr><td>${d.nomor}</td><td>${d.benar}</td><td>${d.salah}</td><td>${d.kosong}</td><td>${d.persen_benar}%</td><td><span class="pill">${d.tingkat}</span></td><td>${d.pilihan.A}</td><td>${d.pilihan.B}</td><td>${d.pilihan.C}</td><td>${d.pilihan.D}</td><td>${d.pilihan.E}</td></tr>`).join("")}</table>`}
async function results(c){const u=await api("listUjian");c.innerHTML=`<div class="card"><h3>Hasil Ujian</h3><div class="field"><select id="sel"><option value="">Pilih ujian</option>${u.data.map(x=>`<option value="${x.kode_ujian}">${esc(x.nama)}</option>`).join("")}</select></div><div id="rs"></div></div>`;$("#sel").onchange=async()=>{const x=await api("results",{kode_ujian:$("#sel").value});$("#rs").innerHTML=`<table class="table"><tr><th>Nama</th><th>Benar</th><th>Salah</th><th>Kosong</th><th>Nilai</th><th>Status</th></tr>${x.data.map(d=>`<tr><td>${esc(d.nama)}</td><td>${d.benar}</td><td>${d.salah}</td><td>${d.kosong}</td><td><b>${d.nilai}</b></td><td>${d.status}</td></tr>`).join("")}</table>`}}
async function renderStudent(){
app.innerHTML=`<div class="student-home"><div class="student-card card">
  <div class="brand-row"><div><div class="logo">CBT Online</div><div class="muted">Computer Based Test</div></div>
  <button onclick="logout()" class="secondary">Keluar</button></div>
  <div class="field"><label>Kode Ujian</label><input id="code" placeholder="Masukkan kode dari proktor"></div>
  <button id="go" class="wide">Mulai Ujian</button>
</div></div>`;
$("#go").onclick=()=>startExam($("#code").value.trim())
}
async function startExam(code){
try{
 const x=await api("getExam",{kode_ujian:code});
 examState={...x,idx:0,answers:{},start:new Date().toISOString(),remaining:Number(x.ujian.durasi_menit)*60,submitted:false};
 renderExam();
}catch(e){alert(e.message)}
}
function renderExam(){
 clearInterval(timerId);
 const e=examState,q=e.soal[e.idx],answered=Object.keys(e.answers).length;
 const letters=["A","B","C","D","E"];
 app.innerHTML=`<div class="cbt-shell">
  <header class="cbt-top">
   <div class="cbt-title"><b>${esc(e.ujian.nama)}</b><span>${esc(session.nama)}</span></div>
   <div class="cbt-timer"><small>Sisa waktu</small><strong id="timer">--:--</strong></div>
  </header>
  <div class="cbt-body">
   <main class="cbt-main">
    <div class="question-head"><span>Soal ${e.idx+1} dari ${e.soal.length}</span><span>${answered} sudah dijawab</span></div>
    <div class="question-card">
      <div class="question-text">${esc(q.soal)}</div>
      ${q.gambar_soal?`<img class="qimg" src="${esc(q.gambar_soal)}" onerror="this.style.display='none'">`:""}
      <div class="choices">${letters.map(k=>q[k]?`<button class="choice ${e.answers[q.nomor]===k?"selected":""}" onclick="answer('${k}')"><span class="choice-letter">${k}</span><span class="choice-body">${esc(q[k])}${q["gambar_"+k]?`<img src="${esc(q["gambar_"+k])}" onerror="this.style.display='none'">`:""}</span></button>`:"").join("")}</div>
    </div>
    <div class="cbt-actions">
      <button class="secondary" onclick="prevQ()" ${e.idx===0?"disabled":""}>‹ Sebelumnya</button>
      <button class="secondary" onclick="clearAnswer()" ${e.answers[q.nomor]?"":"disabled"}>Hapus jawaban</button>
      ${e.idx===e.soal.length-1?`<button onclick="confirmSubmit()">Selesai & Kirim</button>`:`<button onclick="nextQ()">Berikutnya ›</button>`}
    </div>
   </main>
   <aside class="cbt-side">
    <div class="side-card"><h3>Daftar Soal</h3><div class="legend"><span><i class="dot answered"></i> Dijawab</span><span><i class="dot current"></i> Saat ini</span><span><i class="dot empty"></i> Belum</span></div>
    <div class="numbers">${e.soal.map((s,i)=>`<button class="${e.answers[s.nomor]?"done ":""}${i===e.idx?"current":""}" onclick="goQ(${i})">${i+1}</button>`).join("")}</div></div>
    <div class="side-card summary"><div><span>Jumlah soal</span><b>${e.soal.length}</b></div><div><span>Dijawab</span><b>${answered}</b></div><div><span>Belum dijawab</span><b>${e.soal.length-answered}</b></div></div>
   </aside>
  </div>
 </div>`;
 startTimer();
}
let timerId=null;
function startTimer(){
 clearInterval(timerId);
 const tick=()=>{
  let total=Math.max(0,examState.remaining),m=Math.floor(total/60),s=total%60;
  const el=$("#timer"); if(el) el.textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  if(total<=300 && el) el.classList.add("warning");
  if(total<=0){clearInterval(timerId);submit(true)}
  examState.remaining--;
 };
 tick(); timerId=setInterval(tick,1000);
}
function goQ(i){examState.idx=i;renderExam()}
function nextQ(){if(examState.idx<examState.soal.length-1){examState.idx++;renderExam()}}
function prevQ(){if(examState.idx>0){examState.idx--;renderExam()}}
async function answer(k){
 const q=examState.soal[examState.idx]; examState.answers[q.nomor]=k;
 try{await api("saveAnswer",{kode_ujian:examState.ujian.kode_ujian,nomor:q.nomor,jawaban:k})}catch(e){alert(e.message)}
 renderExam();
}
async function clearAnswer(){
 const q=examState.soal[examState.idx]; delete examState.answers[q.nomor];
 // A blank answer is stored so the server can keep the autosave state consistent.
 try{await api("saveAnswer",{kode_ujian:examState.ujian.kode_ujian,nomor:q.nomor,jawaban:""})}catch(e){}
 renderExam();
}
function confirmSubmit(){
 const unanswered=examState.soal.length-Object.keys(examState.answers).length;
 if(confirm(`Anda akan mengakhiri ujian. ${unanswered} soal belum dijawab. Lanjutkan?`)) submit(false);
}
async function submit(force){
 if(!force && !confirm("Kirim jawaban dan akhiri ujian?"))return;
 clearInterval(timerId);
 try{
  const x=await api("submitExam",{kode_ujian:examState.ujian.kode_ujian,mulai:examState.start});
  app.innerHTML=`<div class="result-screen"><div class="result-card card"><div class="result-icon">✓</div><h1>Ujian selesai</h1><p class="muted">${esc(examState.ujian.nama)}</p><div class="score">${x.hasil.nilai}</div><div class="result-grid"><div><b>${x.hasil.benar}</b><span>Benar</span></div><div><b>${x.hasil.salah}</b><span>Salah</span></div><div><b>${x.hasil.kosong}</b><span>Kosong</span></div></div><button onclick="renderStudent()">Kembali</button></div></div>`;
 }catch(e){alert(e.message)}
}

function showImportGuide(){
 const box=document.createElement("div");box.className="modal";
 box.innerHTML=`<div class="modal-box card"><h3>Import Soal Massal</h3>
 <p>Gunakan template Excel. Satu baris = satu soal. Kolom gambar diisi URL gambar yang dapat diakses browser.</p>
 <pre>kode_ujian | nomor | soal | gambar_soal | A | gambar_A | B | gambar_B | C | gambar_C | D | gambar_D | E | gambar_E | jawaban | bobot</pre>
 <ol><li>Download template.</li><li>Isi soal sebanyak yang diperlukan.</li><li>Pastikan kode_ujian sama dengan kode ujian.</li><li>Upload/salin data ke sheet <b>SOAL</b> pada Spreadsheet.</li><li>Klik refresh Bank Soal.</li></ol>
 <div class="notice">Jika Excel berisi URL gambar publik, gambar akan tampil otomatis saat ujian.</div>
 <button onclick="this.closest('.modal').remove()">Tutup</button></div>`;
 document.body.appendChild(box);
}
function downloadSoalTemplate(){
 const csv=`id,kode_ujian,nomor,soal,gambar_soal,A,gambar_A,B,gambar_B,C,gambar_C,D,gambar_D,E,gambar_E,jawaban,bobot\\n,CONTOH001,1,Contoh soal,,Pilihan A,,Pilihan B,,Pilihan C,,Pilihan D,,Pilihan E,,A,1\\n`;
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="template-soal-cbt.csv";a.click();URL.revokeObjectURL(a.href);
}
render();
