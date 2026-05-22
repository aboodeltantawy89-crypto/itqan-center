import { useState, useMemo, useEffect, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const SURAHS = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
const SURAH_VERSES = {"الفاتحة":7,"البقرة":286,"آل عمران":200,"النساء":176,"المائدة":120,"الأنعام":165,"الأعراف":206,"الأنفال":75,"التوبة":129,"يونس":109,"هود":123,"يوسف":111,"الرعد":43,"إبراهيم":52,"الحجر":99,"النحل":128,"الإسراء":111,"الكهف":110,"مريم":98,"طه":135,"الأنبياء":112,"الحج":78,"المؤمنون":118,"النور":64,"الفرقان":77,"الشعراء":227,"النمل":93,"القصص":88,"العنكبوت":69,"الروم":60,"لقمان":34,"السجدة":30,"الأحزاب":73,"سبأ":54,"فاطر":45,"يس":83,"الصافات":182,"ص":88,"الزمر":75,"غافر":85,"فصلت":54,"الشورى":53,"الزخرف":89,"الدخان":59,"الجاثية":37,"الأحقاف":35,"محمد":38,"الفتح":29,"الحجرات":18,"ق":45,"الذاريات":60,"الطور":49,"النجم":62,"القمر":55,"الرحمن":78,"الواقعة":96,"الحديد":29,"المجادلة":22,"الحشر":24,"الممتحنة":13,"الصف":14,"الجمعة":11,"المنافقون":11,"التغابن":18,"الطلاق":12,"التحريم":12,"الملك":30,"القلم":52,"الحاقة":52,"المعارج":44,"نوح":28,"الجن":28,"المزمل":20,"المدثر":56,"القيامة":40,"الإنسان":31,"المرسلات":50,"النبأ":40,"النازعات":46,"عبس":42,"التكوير":29,"الانفطار":19,"المطففين":36,"الانشقاق":25,"البروج":22,"الطارق":17,"الأعلى":19,"الغاشية":26,"الفجر":30,"البلد":20,"الشمس":15,"الليل":21,"الضحى":11,"الشرح":8,"التين":8,"العلق":19,"القدر":5,"البينة":8,"الزلزلة":8,"العاديات":11,"القارعة":11,"التكاثر":8,"العصر":3,"الهمزة":9,"الفيل":5,"قريش":4,"الماعون":7,"الكوثر":3,"الكافرون":6,"النصر":3,"المسد":5,"الإخلاص":4,"الفلق":5,"الناس":6};
const GRADES = ["ممتاز","جيد جداً","جيد","مقبول","ضعيف"];
const GC = {"ممتاز":"#4caf7d","جيد جداً":"#6ec6a0","جيد":"#c9a84c","مقبول":"#e8a84c","ضعيف":"#e05c5c"};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const toAr      = d => { try { return new Date(d+"T12:00:00").toLocaleDateString("ar-SA-u-nu-arab",{year:"numeric",month:"long",day:"numeric"}); } catch{ return d; }};
const toArShort = d => { try { return new Date(d+"-01T12:00:00").toLocaleDateString("ar-SA-u-nu-arab",{month:"long",year:"numeric"}); } catch{ return d; }};
const toEn      = d => { try { return new Date(d+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}); } catch{ return d; }};
const monthKey  = d => d.slice(0,7);
const nowMonth  = () => new Date().toISOString().slice(0,7);
const nowDate   = () => new Date().toISOString().split("T")[0];

const LS = {
  get: (k,d) => { try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; }},
  set: (k,v) => { try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} },
};
const SUPA_URL = "https://arzdgjaeadthikkhrstk.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemRnamFlYWR0aGlra2hyc3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxOTAwNjMsImV4cCI6MjA5Mzc2NjA2M30.7YuNmQfHa1oRY05uOZrSOd6cP3a2p60zkjqDjf4Vk48";

const PS = {
  get: async (k) => {
    try {
      const res = await fetch(
        `${SUPA_URL}/rest/v1/itq_data?id=eq.${encodeURIComponent(k)}&select=value`,
        { headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` } }
      );
      const data = await res.json();
      if (data && data[0]) return JSON.parse(data[0].value);
    } catch {}
    return LS.get(k, null);
  },
  set: async (k, v) => {
    LS.set(k, v);
    try {
      await fetch(`${SUPA_URL}/rest/v1/itq_data`, {
        method: "POST",
        headers: {
          "apikey": SUPA_KEY,
          "Authorization": `Bearer ${SUPA_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({ id: k, value: JSON.stringify(v), updated_at: new Date().toISOString() })
      });
    } catch {}
  },
};

const mkCourse = () => ({id:0,name:"",goal:"",ageGroup:"",supervisor:"",teacher:"",days:0,hoursPerDay:0,mode:"حضوري",students:[],createdAt:nowDate()});
const mkCourseStudent = () => ({id:0,name:"",birthDate:"",age:"",guardianPhone:"",startSurah:"",startVerse:1,level:"مبتدئ"});
const mkStudent = g => ({name:"",guardian:"",guardianPhone:"",gender:g,notes:"",joinDate:nowDate(),payments:{}});
const mkSession = (sid="") => ({studentId:sid,date:nowDate(),present:true,newItems:[],revItems:[],grades:[],noNew:false,noRev:false,notMemorized:false,noGrade:false,notes:""});
const mkItem = () => ({surah:"",from:"",to:""});
const mkDay  = () => ({date:nowDate(),notes:""});

// ─── STYLES ──────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0f1923;font-family:'Cairo',sans-serif;color:#e8dcc8}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#1a2535}::-webkit-scrollbar-thumb{background:#c9a84c;border-radius:3px}
.card{background:#1a2535;border:1px solid #2a3a50;border-radius:12px}
.btn-gold{background:linear-gradient(135deg,#c9a84c,#e8c96e);color:#0f1923;border:none;border-radius:8px;padding:9px 18px;cursor:pointer;font-family:'Cairo',sans-serif;font-weight:700;font-size:13px;transition:all .2s;white-space:nowrap}
.btn-gold:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(201,168,76,.4)}
.btn-gold:disabled{opacity:.4;cursor:not-allowed;transform:none}
.btn-out{background:transparent;color:#c9a84c;border:1px solid #c9a84c;border-radius:8px;padding:7px 14px;cursor:pointer;font-family:'Cairo',sans-serif;font-size:13px;transition:all .2s;white-space:nowrap}
.btn-out:hover{background:rgba(201,168,76,.1)}
.btn-red{background:transparent;color:#e05c5c;border:1px solid #e05c5c;border-radius:8px;padding:7px 14px;cursor:pointer;font-family:'Cairo',sans-serif;font-size:13px;transition:all .2s}
.btn-red:hover{background:rgba(224,92,92,.1)}
input,select,textarea{background:#0f1923;border:1px solid #2a3a50;color:#e8dcc8;border-radius:8px;padding:9px 11px;font-family:'Cairo',sans-serif;font-size:13px;width:100%;outline:none;transition:border-color .2s}
input:focus,select:focus,textarea:focus{border-color:#c9a84c}
select option{background:#1a2535}
label{font-size:12px;color:#a0b0c0;margin-bottom:4px;display:block}
.nav{padding:10px 14px;cursor:pointer;border-radius:8px;font-size:13px;transition:all .2s;color:#a0b0c0;display:flex;align-items:center;gap:8px}
.nav:hover{background:rgba(201,168,76,.1);color:#c9a84c}
.nav.on{background:rgba(201,168,76,.15);color:#c9a84c;font-weight:600}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
.modal{background:#1a2535;border:1px solid #2a3a50;border-radius:16px;padding:24px;width:100%;max-width:540px;max-height:92vh;overflow-y:auto}
.bx{display:inline-block;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600}
.bx-g{background:rgba(76,175,125,.15);color:#4caf7d;border:1px solid rgba(76,175,125,.3)}
.bx-r{background:rgba(224,92,92,.15);color:#e05c5c;border:1px solid rgba(224,92,92,.3)}
.bx-y{background:rgba(201,168,76,.15);color:#c9a84c;border:1px solid rgba(201,168,76,.3)}
.bx-o{background:rgba(232,168,76,.15);color:#e8a84c;border:1px solid rgba(232,168,76,.3)}
.div{border:none;border-top:1px solid #2a3a50;margin:12px 0}
.rpt{background:#0f1923;border-radius:10px;padding:14px;margin-bottom:10px}
.hov:hover{border-color:#c9a84c !important}
.tog{padding:5px 12px;border-radius:6px;border:1px solid #2a3a50;background:transparent;cursor:pointer;font-family:'Cairo',sans-serif;font-size:12px;color:#6a8090;transition:all .15s}
.tog.on{background:rgba(224,92,92,.15);color:#e05c5c;border-color:rgba(224,92,92,.4)}
.tog.on-o{background:rgba(232,168,76,.15);color:#e8a84c;border-color:rgba(232,168,76,.4)}
@media(max-width:600px){
  .sidebar-desktop{display:none!important}
  .bottom-nav{display:flex!important}
  .content-area{padding:12px!important}
  .modal{padding:16px!important;max-height:96vh!important}
}
@media(min-width:601px){.bottom-nav{display:none!important}}
.bottom-nav{
  position:fixed;bottom:0;left:0;right:0;
  background:#141e2b;border-top:1px solid #2a3a50;
  display:none;z-index:100;
  padding:8px 4px max(8px,env(safe-area-inset-bottom));
}
.bottom-nav-item{
  flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
  cursor:pointer;padding:4px 0;
  font-family:'Cairo',sans-serif;font-size:9px;color:#6a8090;
  border:none;background:transparent;transition:color .2s;
}
.bottom-nav-item.active{color:#c9a84c}
.bottom-nav-item .nav-icon{font-size:20px}

`;

const PDF_CSS = `
@page{margin:1.5cm;size:A4}
@media print{head,header,footer{display:none!important}}
body{font-family:'Cairo',sans-serif;direction:rtl;background:#fff;color:#111;padding:28px 32px;font-size:13px;-webkit-print-color-adjust:exact}
h1{font-family:'Amiri',serif;color:#7a5200;font-size:22px;text-align:center;margin-bottom:3px}
.sub{text-align:center;color:#777;font-size:12px;margin-bottom:18px}
.sec{background:#faf6ee;border-radius:8px;padding:14px;margin-bottom:12px;border-right:4px solid #c9a84c}
.sec h3{color:#7a5200;font-size:13px;margin-bottom:10px;font-weight:700;border-bottom:1px solid #e8d9b0;padding-bottom:5px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.stat{text-align:center;background:#fff;border-radius:6px;padding:10px;border:1px solid #e8d9b0}
.stat .v{font-size:22px;font-weight:700;color:#7a5200}
.stat .l{font-size:11px;color:#999;margin-top:2px}
.fld .k{font-size:11px;color:#999}
.fld .v{font-size:13px;color:#111;font-weight:600;margin-top:1px}
table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}
th{background:#f2e6c8;padding:7px 8px;text-align:right;font-weight:700;color:#7a5200}
td{padding:6px 8px;border-bottom:1px solid #f0e5d0;vertical-align:top}
.letter{background:#fffdf5;border-right:4px solid #c9a84c;padding:14px 16px;border-radius:6px;font-family:'Amiri',serif;font-size:14px;line-height:2}
.footer{text-align:center;margin-top:20px;font-size:11px;color:#aaa;border-top:1px solid #e8d9b0;padding-top:10px}
`;

// ─── PURE HELPER COMPONENTS (outside App) ────────────────────────────────────

function SessDetails({ s }) {
  return (
    <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>
      {s.noNew && <div style={{fontSize:12,color:"#e05c5c"}}>📗 لا يوجد حفظ جديد</div>}
      {s.memorized && <div style={{fontSize:12,color:"#4caf7d"}}>📗 ✅ حافظ الجديد</div>}
      {s.notMemorized && <div style={{fontSize:12,color:"#e05c5c"}}>📗 لم يحفظ الجديد</div>}
      {!s.noNew&&!s.notMemorized&&!s.memorized&&(s.newItems||[]).filter(it=>it.surah).map((it,i)=>(
        <div key={i} style={{fontSize:12}}>📗 {it.surah}{it.from?` (${it.from}–${it.to})`:""}</div>
      ))}
      {s.noRev && <div style={{fontSize:12,color:"#e05c5c"}}>🔄 لا يوجد مراجعة</div>}
      {s.memorizedRev && <div style={{fontSize:12,color:"#4caf7d"}}>🔄 ✅ حافظ المراجعة</div>}
      {s.notMemorizedRev && <div style={{fontSize:12,color:"#e05c5c"}}>🔄 لم يحفظ المراجعة</div>}
      {!s.noRev&&!s.memorizedRev&&!s.notMemorizedRev&&(s.revItems||[]).filter(it=>it.surah).map((it,i)=>(
        <div key={i} style={{fontSize:12}}>🔄 {it.surah}{it.from?` (${it.from}–${it.to})`:""}</div>
      ))}
      {s.noGrade && <div style={{fontSize:12,color:"#e05c5c"}}>🎯 لا يوجد تجويد</div>}
      {!s.noGrade&&(s.grades||[]).length>0&&(
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {s.grades.map(g=><span key={g} className="bx" style={{background:`${GC[g]}22`,color:GC[g],border:`1px solid ${GC[g]}44`,fontSize:10}}>{g}</span>)}
        </div>
      )}
      {s.notes && <div style={{fontSize:12,color:"#a0b0c0"}}>📝 {s.notes}</div>}
    </div>
  );
}

function ItemRows({ field, sessForm, setSessForm }) {
  const noKey       = field==="newItems" ? "noNew" : "noRev";
  const isNone      = sessForm[noKey];
  const isNotMem    = field==="newItems" && sessForm.notMemorized;
  const isMem       = field==="newItems" && sessForm.memorized;
  const isNotMemRev = field==="revItems" && sessForm.notMemorizedRev;
  const isMemRev    = field==="revItems" && sessForm.memorizedRev;

  const setNone      = v => setSessForm({...sessForm,[noKey]:v,notMemorized:false,memorized:false,notMemorizedRev:false,memorizedRev:false,[field]:v?[]:sessForm[field]});
  const setNotMem    = v => setSessForm({...sessForm,notMemorized:v,memorized:false,noNew:false,[field]:v?[]:sessForm[field]});
  const setMem       = v => setSessForm({...sessForm,memorized:v,notMemorized:false,noNew:false,[field]:v?[]:sessForm[field]});
  const setNotMemRev = v => setSessForm({...sessForm,notMemorizedRev:v,memorizedRev:false,noRev:false,[field]:v?[]:sessForm[field]});
  const setMemRev    = v => setSessForm({...sessForm,memorizedRev:v,notMemorizedRev:false,noRev:false,[field]:v?[]:sessForm[field]});
  const addItem      = () => setSessForm({...sessForm,[field]:[...sessForm[field],mkItem()]});
  const remItem      = i  => setSessForm({...sessForm,[field]:sessForm[field].filter((_,x)=>x!==i)});
  const updItem      = (i,k,v) => { const a=[...sessForm[field]]; a[i]={...a[i],[k]:v}; setSessForm({...sessForm,[field]:a}); };

  const isBlocked = isNone || isNotMem || isMem || isNotMemRev || isMemRev;
  const label = field==="newItems" ? "الحفظ الجديد" : "المراجعة";
  const icon  = field==="newItems" ? "📗" : "🔄";

  return (
    <div style={{background:"#0f1923",border:"1px solid #2a3a50",borderRadius:10,padding:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
        <div style={{color:"#c9a84c",fontSize:12,fontWeight:700}}>{icon} {label}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button type="button" className={`tog ${isNone?"on":""}`} onClick={()=>setNone(!isNone)}>لا يوجد</button>
          {field==="newItems" && (<>
            <button type="button" className={`tog ${isMem?"on-g":""}`} onClick={()=>setMem(!isMem)}>حافظ ✅</button>
            <button type="button" className={`tog ${isNotMem?"on":""}`} onClick={()=>setNotMem(!isNotMem)}>لم يحفظ</button>
          </>)}
          {field==="revItems" && (<>
            <button type="button" className={`tog ${isMemRev?"on-g":""}`} onClick={()=>setMemRev(!isMemRev)}>حافظ ✅</button>
            <button type="button" className={`tog ${isNotMemRev?"on":""}`} onClick={()=>setNotMemRev(!isNotMemRev)}>لم يحفظ</button>
          </>)}
          {!isBlocked && (
            <button type="button" onClick={addItem} style={{background:"rgba(201,168,76,.12)",border:"1px solid rgba(201,168,76,.3)",color:"#c9a84c",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:12}}>+ سورة</button>
          )}
        </div>
      </div>
      {isNone      && <div style={{fontSize:12,color:"#e05c5c",padding:"4px 0"}}>لا يوجد {label}</div>}
      {isMem       && <div style={{fontSize:12,color:"#4caf7d",padding:"4px 0"}}>✅ حافظ الجديد</div>}
      {isMemRev    && <div style={{fontSize:12,color:"#4caf7d",padding:"4px 0"}}>✅ حافظ المراجعة</div>}
      {isNotMem    && <div style={{fontSize:12,color:"#e05c5c",padding:"4px 0"}}>لم يحفظ الجديد</div>}
      {isNotMemRev && <div style={{fontSize:12,color:"#e05c5c",padding:"4px 0"}}>لم يحفظ المراجعة</div>}
      {!isBlocked&&sessForm[field].length===0&&(
        <div style={{fontSize:11,color:"#6a8090",padding:"4px 0"}}>اضغط "+ سورة" لإضافة</div>
      )}
      {!isBlocked&&sessForm[field].map((it,idx)=>(
        <div key={idx} style={{display:"grid",gridTemplateColumns:"1fr 65px 65px 30px",gap:6,marginBottom:6,alignItems:"end"}}>
          <div>
            {idx===0&&<label>السورة</label>}
            <select value={it.surah} onChange={e=>updItem(idx,"surah",e.target.value)}>
              <option value="">اختر</option>
              {SURAHS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>{idx===0&&<label>من</label>}<input type="number" min="1" placeholder="1" value={it.from} onChange={e=>updItem(idx,"from",e.target.value)}/></div>
          <div>{idx===0&&<label>إلى</label>}<input type="number" min="1" placeholder="10" value={it.to} onChange={e=>updItem(idx,"to",e.target.value)}/></div>
          <div style={{paddingTop:idx===0?18:0}}>
            <button type="button" onClick={()=>remItem(idx)} style={{background:"rgba(224,92,92,.1)",border:"1px solid rgba(224,92,92,.25)",color:"#e05c5c",borderRadius:6,padding:"7px 8px",cursor:"pointer",fontSize:11,width:"100%"}}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function GradeSelect({ sessForm, setSessForm }) {
  const isNone = sessForm.noGrade;
  const toggle = g => {
    const c = sessForm.grades;
    setSessForm({...sessForm, grades: c.includes(g)?c.filter(x=>x!==g):[...c,g]});
  };
  return (
    <div style={{background:"#0f1923",border:"1px solid #2a3a50",borderRadius:10,padding:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{color:"#c9a84c",fontSize:12,fontWeight:700}}>🎯 تقييم التجويد</div>
        <button type="button" className={`tog ${isNone?"on":""}`} onClick={()=>setSessForm({...sessForm,noGrade:!isNone,grades:!isNone?[]:sessForm.grades})}>لا يوجد</button>
      </div>
      {!isNone&&(
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {GRADES.map(g=>{
            const sel=sessForm.grades.includes(g);
            return (
              <button key={g} type="button" onClick={()=>toggle(g)} style={{padding:"5px 13px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:600,transition:"all .15s",background:sel?`${GC[g]}33`:"transparent",color:sel?GC[g]:"#6a8090",border:`1px solid ${sel?GC[g]:"#2a3a50"}`}}>{g}</button>
            );
          })}
        </div>
      )}
      {!isNone&&sessForm.grades.length===0&&<div style={{fontSize:11,color:"#6a8090",marginTop:6}}>اختر تقييماً أو أكثر</div>}
    </div>
  );
}

function SessModal({ students, sessForm, setSessForm, onSave, onClose }) {
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"'Amiri',serif",fontSize:18,color:"#c9a84c",marginBottom:16}}>تسجيل حصة</div>
        <div style={{display:"grid",gap:12}}>
          <div>
            <label>الطالب *</label>
            <select value={sessForm.studentId} onChange={e=>setSessForm({...sessForm,studentId:e.target.value})}>
              <option value="">اختر الطالب</option>
              {students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label>التاريخ</label>
            <input type="date" value={sessForm.date} onChange={e=>setSessForm({...sessForm,date:e.target.value})}/>
            {sessForm.date&&<div style={{fontSize:11,color:"#c9a84c",marginTop:3}}>📅 {toAr(sessForm.date)} · {toEn(sessForm.date)}</div>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <input type="checkbox" id="prs" style={{width:"auto"}} checked={sessForm.present} onChange={e=>setSessForm({...sessForm,present:e.target.checked})}/>
            <label htmlFor="prs" style={{margin:0,cursor:"pointer"}}>الطالب حاضر</label>
          </div>
          {sessForm.present&&<>
            <hr className="div"/>
            <ItemRows field="newItems" sessForm={sessForm} setSessForm={setSessForm}/>
            <ItemRows field="revItems" sessForm={sessForm} setSessForm={setSessForm}/>
            <GradeSelect sessForm={sessForm} setSessForm={setSessForm}/>
            <div><label>ملاحظات</label><textarea rows={2} value={sessForm.notes} onChange={e=>setSessForm({...sessForm,notes:e.target.value})}/></div>
          </>}
        </div>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button className="btn-gold" onClick={onSave} disabled={!sessForm.studentId}>حفظ الحصة</button>
          <button className="btn-out" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ editSt, setEditSt, onSave, filterMonth, toArShort }) {
  return (
    <div className="ov" onClick={()=>setEditSt(null)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"'Amiri',serif",fontSize:18,color:"#c9a84c",marginBottom:16}}>تعديل بيانات الطالب</div>
        <div style={{display:"grid",gap:12}}>
          <div><label>الاسم *</label><input value={editSt.name} onChange={e=>setEditSt({...editSt,name:e.target.value})}/></div>
          <div><label>اسم ولي الأمر</label><input value={editSt.guardian||""} onChange={e=>setEditSt({...editSt,guardian:e.target.value})}/></div>
          <div><label>رقم الجوال</label><input value={editSt.guardianPhone||""} onChange={e=>setEditSt({...editSt,guardianPhone:e.target.value})}/></div>
          <div><label>تاريخ الالتحاق</label><input type="date" value={editSt.joinDate||""} onChange={e=>setEditSt({...editSt,joinDate:e.target.value})}/></div>
          <div><label>ملاحظات</label><textarea rows={2} value={editSt.notes||""} onChange={e=>setEditSt({...editSt,notes:e.target.value})} placeholder="مستواه، ملاحظات خاصة..."/></div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button className="btn-gold" onClick={onSave}>حفظ</button>
          <button className="btn-out" onClick={()=>setEditSt(null)}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function AddStudentModal({ sec, newSt, setNewSt, onSave, onClose }) {
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"'Amiri',serif",fontSize:18,color:"#c9a84c",marginBottom:16}}>إضافة {sec==="male"?"طالب":"طالبة"}</div>
        <div style={{display:"grid",gap:12}}>
          <div><label>الاسم *</label><input value={newSt.name} onChange={e=>setNewSt({...newSt,name:e.target.value})}/></div>
          <div><label>اسم ولي الأمر</label><input value={newSt.guardian||""} onChange={e=>setNewSt({...newSt,guardian:e.target.value})}/></div>
          <div><label>رقم الجوال</label><input value={newSt.guardianPhone||""} onChange={e=>setNewSt({...newSt,guardianPhone:e.target.value})}/></div>
          <div><label>تاريخ الالتحاق</label><input type="date" value={newSt.joinDate} onChange={e=>setNewSt({...newSt,joinDate:e.target.value})}/></div>
          <div><label>ملاحظات</label><textarea rows={2} value={newSt.notes||""} onChange={e=>setNewSt({...newSt,notes:e.target.value})} placeholder="مستواه، ملاحظات..."/></div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button className="btn-gold" onClick={onSave}>إضافة</button>
          <button className="btn-out" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function AddDayModal({ dayForm, setDayForm, studentCount, onSave, onClose }) {
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"'Amiri',serif",fontSize:18,color:"#c9a84c",marginBottom:16}}>إضافة يوم تدريس</div>
        <div style={{display:"grid",gap:12}}>
          <div>
            <label>التاريخ</label>
            <input type="date" value={dayForm.date} onChange={e=>setDayForm({...dayForm,date:e.target.value})}/>
            {dayForm.date&&<div style={{fontSize:11,color:"#c9a84c",marginTop:3}}>📅 {toAr(dayForm.date)} · {toEn(dayForm.date)}</div>}
          </div>
          <div><label>ملاحظات</label><textarea rows={2} value={dayForm.notes} onChange={e=>setDayForm({...dayForm,notes:e.target.value})} placeholder="موضوع اليوم..."/></div>
          <div style={{background:"#0f1923",borderRadius:8,padding:10,fontSize:11,color:"#6a8090"}}>سيتم إنشاء سجل حضور لـ {studentCount} طالب تلقائياً (الكل غائب افتراضياً)</div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button className="btn-gold" onClick={onSave}>إضافة</button>
          <button className="btn-out" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ student, sessions, sc, filterMonth, onClose, onExportPDF }) {
  const getStats = (id, month) => {
    let ss = sessions.filter(s=>s.studentId===id);
    if(month) ss=ss.filter(s=>monthKey(s.date)===month);
    const present      = ss.filter(s=>s.present).length;
    const absent       = ss.filter(s=>!s.present).length;
    const memorized    = ss.filter(s=>s.present&&!s.noNew&&!s.notMemorized&&(s.newItems||[]).some(it=>it.surah)).length;
    const notMemorized = ss.filter(s=>s.present&&s.notMemorized).length;
    const grades       = ss.filter(s=>s.present&&!s.noGrade&&(s.grades||[]).length>0).flatMap(s=>s.grades||[]);
    const topGrade     = grades.length ? grades[grades.length-1] : "—";
    const memSurahs    = {};
    ss.filter(s=>s.present&&!s.noNew&&!s.notMemorized).forEach(s=>{
      (s.newItems||[]).filter(it=>it.surah).forEach(it=>{
        if(!memSurahs[it.surah]) memSurahs[it.surah]=[];
        memSurahs[it.surah].push(`${it.from||"?"}–${it.to||"?"}`);
      });
    });
    return {present,absent,memorized,notMemorized,topGrade,total:ss.length,memSurahs};
  };
  const s        = getStats(student.id, filterMonth);
  const allS     = getStats(student.id, null);
  const stSess   = sessions.filter(ss=>ss.studentId===student.id&&monthKey(ss.date)===filterMonth);
  const presSess = stSess.filter(ss=>ss.present);
  const rate     = stSess.length>0?Math.round((s.present/stSess.length)*100):0;
  const paid     = !!(student.payments?.[filterMonth]);
  const mDisp    = toArShort(filterMonth);
  const defaultLetter = `السلام عليكم ورحمة الله وبركاته،\nيسعد مركز الإتقان أن يُطلعكم على تقرير ${student.gender==="female"?"ابنتكم":"نجلكم"} ${student.name} لشهر ${mDisp}.\n${rate>=80?"أبدى حضوراً منتظماً ومتميزاً يستحق الإشادة.":rate>=50?"الحضور متوسط ونأمل تحسينه.":"نأمل الاهتمام بانتظام الحضور."}${s.memorized>0?` تميّز بالحفظ في (${s.memorized}) جلسة.`:""}${s.notMemorized>0?` وكان بحاجة لمراجعة في (${s.notMemorized}) جلسة.`:""}${student.notes?`\nملاحظة: ${student.notes}`:""}\n\nنسأل الله أن يبارك في جهوده.\nجزاكم الله خيراً.`;
  const [letter, setLetter] = useState(defaultLetter);
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:14,borderBottom:"1px solid #2a3a50",paddingBottom:12}}>
          <div style={{fontSize:20,marginBottom:3}}>🕌</div>
          <div style={{fontFamily:"'Amiri',serif",fontSize:18,color:"#c9a84c"}}>التقرير الشهري · مركز الإتقان</div>
          <div style={{fontSize:11,color:"#6a8090",marginTop:2}}>{sc.lbl} · {toArShort(filterMonth)}</div>
        </div>
        <div className="rpt">
          <div style={{fontSize:11,color:"#c9a84c",fontWeight:700,marginBottom:8}}>بيانات الطالب</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {[["الاسم",student.name],["ولي الأمر",student.guardian||"—"],["الجوال",student.guardianPhone||"—"],["الاشتراك",paid?"✓ مدفوع":"✗ غير مدفوع"],["الالتحاق",student.joinDate?toAr(student.joinDate):"—"],["الحصص الكلية",allS.total+" حصة"]].map(([k,v])=>(
              <div key={k}><div style={{fontSize:10,color:"#6a8090"}}>{k}</div><div style={{fontSize:12,color:k==="الاشتراك"?(paid?"#4caf7d":"#e05c5c"):"#e8dcc8"}}>{v}</div></div>
            ))}
          </div>
        </div>
        <div className="rpt">
          <div style={{fontSize:11,color:"#c9a84c",fontWeight:700,marginBottom:8}}>إحصائيات الشهر</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
            {[{l:"أيام الحضور",v:s.present,c:"#4caf7d"},{l:"أيام الغياب",v:s.absent,c:"#e05c5c"},{l:"نسبة الحضور",v:`${rate}%`,c:"#c9a84c"},{l:"مرات الحفظ",v:s.memorized,c:"#4caf7d"},{l:'مرات "لم يحفظ"',v:s.notMemorized,c:"#e05c5c"},{l:"آخر تقييم",v:s.topGrade,c:GC[s.topGrade]||"#c9a84c"}].map(x=>(
              <div key={x.l} style={{textAlign:"center",background:"#141e2b",borderRadius:7,padding:8}}>
                <div style={{fontSize:16,fontWeight:700,color:x.c}}>{x.v}</div>
                <div style={{fontSize:10,color:"#6a8090",marginTop:2}}>{x.l}</div>
              </div>
            ))}
          </div>
        </div>
        {Object.keys(s.memSurahs).length>0&&(
          <div className="rpt">
            <div style={{fontSize:11,color:"#c9a84c",fontWeight:700,marginBottom:8}}>ملخص الحفظ هذا الشهر</div>
            {Object.entries(s.memSurahs).map(([surah,ranges])=>(
              <div key={surah} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #2a3a50",fontSize:12}}>
                <span style={{color:"#e8dcc8"}}>{surah}</span>
                <span style={{color:"#c9a84c"}}>{ranges.join("، ")}</span>
              </div>
            ))}
          </div>
        )}
        {presSess.length>0&&(
          <div className="rpt">
            <div style={{fontSize:11,color:"#c9a84c",fontWeight:700,marginBottom:8}}>تفاصيل الحصص ({presSess.length})</div>
            <div style={{maxHeight:160,overflowY:"auto"}}>
              {presSess.map(ss=>(
                <div key={ss.id} style={{padding:"6px 0",borderBottom:"1px solid #2a3a50",fontSize:12}}>
                  <span style={{color:"#6a8090",marginLeft:8}}>{toAr(ss.date)}</span>
                  <SessDetails s={ss}/>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="rpt" style={{borderRight:"3px solid #c9a84c"}}>
          <div style={{fontSize:11,color:"#c9a84c",fontWeight:700,marginBottom:8}}>✏️ رسالة لولي الأمر — قابلة للتعديل</div>
          <textarea
            value={letter}
            onChange={e=>setLetter(e.target.value)}
            rows={7}
            style={{width:"100%",background:"#141e2b",border:"1px solid #2a3a50",color:"#e8dcc8",borderRadius:8,padding:"10px 12px",fontFamily:"'Amiri',serif",fontSize:13,lineHeight:1.9,resize:"vertical",outline:"none"}}
          />
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button className="btn-gold" onClick={()=>onExportPDF(student, letter)}>📄 تصدير PDF</button>
          <button className="btn-out" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}

// ─── PDF EXPORT (pure function, no hooks) ────────────────────────────────────
function buildAndPrintPDF(student, sessions, sc, filterMonth, customLetter=null) {
  const getStats = (id, month) => {
    let ss = sessions.filter(s=>s.studentId===id);
    if(month) ss=ss.filter(s=>monthKey(s.date)===month);
    const present      = ss.filter(s=>s.present).length;
    const absent       = ss.filter(s=>!s.present).length;
    const memorized    = ss.filter(s=>s.present&&!s.noNew&&!s.notMemorized&&(s.newItems||[]).some(it=>it.surah)).length;
    const notMemorized = ss.filter(s=>s.present&&s.notMemorized).length;
    const grades       = ss.filter(s=>s.present&&!s.noGrade&&(s.grades||[]).length>0).flatMap(s=>s.grades||[]);
    const topGrade     = grades.length ? grades[grades.length-1] : "—";
    const memSurahs    = {};
    ss.filter(s=>s.present&&!s.noNew&&!s.notMemorized).forEach(s=>{
      (s.newItems||[]).filter(it=>it.surah).forEach(it=>{
        if(!memSurahs[it.surah]) memSurahs[it.surah]=[];
        memSurahs[it.surah].push(`${it.from||"?"}–${it.to||"?"}`);
      });
    });
    return {present,absent,memorized,notMemorized,topGrade,total:ss.length,memSurahs};
  };
  const s      = getStats(student.id, filterMonth);
  const allS   = getStats(student.id, null);
  const stSess = sessions.filter(ss=>ss.studentId===student.id&&monthKey(ss.date)===filterMonth);
  const pSess  = stSess.filter(ss=>ss.present);
  const rate   = stSess.length>0?Math.round((s.present/stSess.length)*100):0;
  const mDisp  = toArShort(filterMonth);
  const today  = toAr(nowDate());
  const paid   = !!(student.payments?.[filterMonth]);
  const memRows = Object.entries(s.memSurahs).map(([sr,rng])=>`<tr><td>${sr}</td><td>${rng.join("، ")}</td></tr>`).join("");

  const html=`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<style>@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;600;700&display=swap');${PDF_CSS}</style></head><body>
<div style="text-align:center;margin-bottom:10px">
  <img src="/logo_-_white.png" style="height:80px;filter:invert(1)" onerror="this.style.display='none'"/>
</div>
<h1>مركز الإتقان لتحفيظ القرآن الكريم</h1>
<div class="sub">التقرير الشهري: ${mDisp} | الإصدار: ${today}</div>
<div class="sec"><h3>بيانات الطالب</h3><div class="g2">
  <div class="fld"><div class="k">الاسم</div><div class="v">${student.name}</div></div>
  <div class="fld"><div class="k">اشتراك ${mDisp}</div><div class="v" style="color:${paid?"#2d7a4f":"#c0392b"}">${paid?"✓ مدفوع":"✗ غير مدفوع"}</div></div>
  <div class="fld"><div class="k">إجمالي الحصص</div><div class="v">${allS.total} حصة</div></div>
</div></div>
<div class="sec"><h3>إحصائيات ${mDisp}</h3><div class="g4" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
  <div class="stat"><div class="v" style="color:#2d7a4f">${s.present}</div><div class="l">أيام الحضور</div></div>
  <div class="stat"><div class="v" style="color:#c0392b">${s.absent}</div><div class="l">أيام الغياب</div></div>
  <div class="stat"><div class="v">${rate}%</div><div class="l">نسبة الحضور</div></div>
  <div class="stat"><div class="v" style="color:#2d7a4f">${s.memorized}</div><div class="l">مرات الحفظ</div></div>
  <div class="stat"><div class="v" style="color:#c0392b">${s.notMemorized}</div><div class="l">مرات "لم يحفظ"</div></div>
  <div class="stat"><div class="v" style="color:${GC[s.topGrade]||"#7a5200"}">${s.topGrade}</div><div class="l">آخر تقييم تجويد</div></div>
</div></div>
${memRows?`<div class="sec"><h3>ملخص الحفظ في ${mDisp}</h3><table><tr><th>السورة</th><th>الآيات المحفوظة</th></tr>${memRows}</table></div>`:""}
${pSess.length>0?`<div class="sec"><h3>تفاصيل الحصص</h3><table>
  <tr><th>التاريخ</th><th>الحفظ الجديد</th><th>المراجعة</th><th>التجويد</th><th>ملاحظات</th></tr>
  ${pSess.map(ss=>`<tr>
    <td>${toAr(ss.date)}</td>
    <td>${ss.noNew?"لا يوجد":ss.notMemorized?"لم يحفظ":(ss.newItems||[]).filter(it=>it.surah).map(it=>it.surah+(it.from?` (${it.from}–${it.to})`:"")).join("، ")||"—"}</td>
    <td>${ss.noRev?"لا يوجد":(ss.revItems||[]).filter(it=>it.surah).map(it=>it.surah+(it.from?` (${it.from}–${it.to})`:"")).join("، ")||"—"}</td>
    <td>${ss.noGrade?"لا يوجد":(ss.grades||[]).join("، ")||"—"}</td>
    <td>${ss.notes||"—"}</td>
  </tr>`).join("")}
</table></div>`:""}
<div class="sec"><h3>رسالة لولي الأمر</h3><div class="letter">
  ${(customLetter || (
    `السلام عليكم ورحمة الله وبركاته،\nيسعد مركز الإتقان أن يُطلعكم على تقرير ${student.gender==="female"?"ابنتكم":"نجلكم"} ${student.name} لشهر ${mDisp}.\n${rate>=80?"أبدى حضوراً منتظماً.":rate>=50?"الحضور متوسط.":"نأمل الاهتمام بالحضور."}\n\nنسأل الله أن يبارك في جهوده.\nجزاكم الله خيراً.`
  )).replace(/\n/g,"<br/>")}
</div></div>
<div class="footer">مركز الإتقان لتحفيظ القرآن الكريم · ${today}</div>
</body></html>`;
  const blob = new Blob([html], {type: "text/html;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
}

// ─── DAY SESSION GROUP (accordion) ───────────────────────────────────────────
function DaySessionGroup({ date, daySessions, trainDay, presCount, students, setDetailSt, setSessForm, setEditSessId, setShowAddSess, delSession, mkSession }) {
  const [expanded, setExpanded] = useState({});
  const toggleExpand = id => setExpanded(p=>({...p,[id]:!p[id]}));
  return (
    <div>
      {/* Day Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"8px 12px",background:"#1a2a3a",borderRadius:10,border:"1px solid #c9a84c44"}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#c9a84c"}}>{toAr(date)}</div>
          {trainDay?.notes&&<div style={{fontSize:11,color:"#6a8090"}}>{trainDay.notes}</div>}
        </div>
        <div style={{display:"flex",gap:7,alignItems:"center"}}>
          <span className="bx bx-g">{presCount} حاضر</span>
          <span className="bx bx-r">{daySessions.length-presCount} غائب</span>
        </div>
      </div>
      {/* Sessions */}
      <div style={{display:"grid",gap:8,paddingRight:10,borderRight:"3px solid #c9a84c44"}}>
        {daySessions.map(s=>{
          const st=students.find(x=>x.id===s.studentId);
          const isOpen=expanded[s.id];
          return (
            <div key={s.id} className="card" style={{padding:13}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:7}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span className={`bx ${s.present?"bx-g":"bx-r"}`}>{s.present?"حاضر":"غائب"}</span>
                  <div style={{fontSize:13,fontWeight:700,color:"#c9a84c",cursor:"pointer"}} onClick={()=>setDetailSt(st)}>{st?.name}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {s.notMemorized&&<span className="bx bx-r" style={{fontSize:10}}>لم يحفظ الجديد</span>}
                  {s.notMemorizedRev&&<span className="bx bx-r" style={{fontSize:10}}>لم يحفظ المراجعة</span>}
                  {s.memorized&&<span className="bx bx-g" style={{fontSize:10}}>✅ حافظ</span>}
                  <button className="btn-out" style={{fontSize:11,padding:"3px 9px"}} onClick={()=>{setSessForm({...s,studentId:String(s.studentId)});setEditSessId(s.id);setShowAddSess(true);}}>✏️</button>
                  <button className="btn-red" style={{fontSize:11,padding:"3px 9px"}} onClick={()=>delSession(s.id)}>🗑️</button>
                  {s.present&&<button onClick={()=>toggleExpand(s.id)} style={{background:isOpen?"rgba(201,168,76,.2)":"rgba(201,168,76,.08)",border:"1px solid rgba(201,168,76,.3)",color:"#c9a84c",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:14,transition:"all .2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)",display:"inline-block"}}>▾</button>}
                </div>
              </div>
              {isOpen&&s.present&&<SessDetails s={s}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const PASS_KEY        = "itq_auth_pass";
const DEFAULT_PASS    = "itqan_tantawy2026";
const RECOVERY_EMAIL  = "aboodtantawy89@gmail.com";
const SESSION_KEY     = "itq_session";
const EJS_SVC         = "service_dkvuqsc";
const EJS_TPL         = "template_v4ph01k";
const EJS_PUB         = "senH8D9_Fk1fJTXcy";

function loadEmailJS() {
  return new Promise((resolve, reject) => {
    if (window._ejsLoaded && window.emailjs) { resolve(); return; }
    const existing = document.getElementById("emailjs-sdk");
    if (existing) {
      const wait = setInterval(() => {
        if (window.emailjs) { clearInterval(wait); window.emailjs.init(EJS_PUB); window._ejsLoaded = true; resolve(); }
      }, 100);
      return;
    }
    const s = document.createElement("script");
    s.id = "emailjs-sdk";
    s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    s.onload = () => { window.emailjs.init(EJS_PUB); window._ejsLoaded = true; resolve(); };
    s.onerror = () => reject(new Error("فشل تحميل EmailJS"));
    document.head.appendChild(s);
  });
}

function genOTP() { return String(Math.floor(100000 + Math.random() * 900000)); }

function LoginScreen({ onLogin }) {
  const [input,     setInput]     = useState("");
  const [error,     setError]     = useState("");
  const [mode,      setMode]      = useState("login");
  const [newPass,   setNewPass]   = useState("");
  const [newPass2,  setNewPass2]  = useState("");
  const [otpInput,  setOtpInput]  = useState("");
  const [otpData,   setOtpData]   = useState(null);
  const [sending,   setSending]   = useState(false);
  const [msg,       setMsg]       = useState("");
  const [showP,     setShowP]     = useState(false);
  const [countdown, setCountdown] = useState(0);

  const storedPass = () => LS.get(PASS_KEY, DEFAULT_PASS);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleLogin = () => {
    if (input === storedPass()) { LS.set(SESSION_KEY, Date.now()); onLogin(); }
    else { setError("❌ رقم سري غير صحيح"); setInput(""); }
  };

  const sendOTP = async () => {
    setSending(true); setError(""); setMsg("");
    const code = genOTP();
    const expires = Date.now() + 10 * 60 * 1000;
    try {
      await loadEmailJS();
      await window.emailjs.send(EJS_SVC, EJS_TPL, { to_email: RECOVERY_EMAIL, otp_code: code });
      setOtpData({ code, expires });
      setMode("otp"); setCountdown(600);
      const masked = RECOVERY_EMAIL.replace(/(.{2}).+(@.+)/, "$1•••$2");
      setMsg(`تم إرسال رمز التحقق إلى ${masked}`);
    } catch (e) { setError("❌ فشل إرسال الإيميل، تحقق من الاتصال"); }
    setSending(false);
  };

  const verifyOTP = () => {
    if (!otpData) return setError("حدث خطأ، أعد الإرسال");
    if (Date.now() > otpData.expires) return setError("❌ انتهت صلاحية الرمز");
    if (otpInput.trim() !== otpData.code) return setError("❌ الرمز غير صحيح");
    setError(""); setMode("change_pass");
  };

  const handleChangePass = () => {
    if (!newPass) return setError("أدخل الرقم السري الجديد");
    if (newPass.length < 6) return setError("يجب أن يكون ٦ أحرف على الأقل");
    if (newPass !== newPass2) return setError("❌ كلمتا المرور غير متطابقتين");
    LS.set(PASS_KEY, newPass);
    setMsg("✅ تم تغيير الرقم السري بنجاح!");
    setOtpData(null); setNewPass(""); setNewPass2(""); setError("");
    setTimeout(() => { setMode("login"); setMsg(""); }, 2000);
  };

  const goLogin = () => { setMode("login"); setError(""); setMsg(""); setOtpInput(""); setOtpData(null); };

  return (
    <div style={{minHeight:"100vh",background:"#0f1923",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"'Cairo',sans-serif"}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <img src="/logo_-_white.png" style={{height:90,filter:"brightness(0) invert(1)",opacity:0.9,marginBottom:8}} onError={e=>e.target.style.display="none"}/>
          <div style={{fontFamily:"'Amiri',serif",fontSize:22,color:"#c9a84c",fontWeight:700}}>مركز الإتقان</div>
          <div style={{fontSize:12,color:"#6a8090",marginTop:3}}>لتحفيظ القرآن الكريم</div>
        </div>
        <div className="card" style={{padding:24}}>
          {mode === "login" && <>
            <div style={{fontSize:15,color:"#e8dcc8",fontWeight:600,marginBottom:20,textAlign:"center"}}>🔐 تسجيل الدخول</div>
            <div style={{marginBottom:12}}>
              <label>الرقم السري</label>
              <div style={{position:"relative"}}>
                <input type={showP?"text":"password"} value={input} onChange={e=>{setInput(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="أدخل الرقم السري" style={{paddingLeft:36}} autoFocus/>
                <span onClick={()=>setShowP(!showP)} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:15,color:"#6a8090",userSelect:"none"}}>{showP?"🙈":"👁️"}</span>
              </div>
            </div>
            {error && <div style={{color:"#e05c5c",fontSize:12,marginBottom:10,textAlign:"center"}}>{error}</div>}
            <button className="btn-gold" style={{width:"100%",padding:"11px"}} onClick={handleLogin}>دخول</button>
            <div style={{textAlign:"center",marginTop:14}}>
              <span onClick={()=>{setMode("change_req");setError("");setMsg("");}} style={{fontSize:12,color:"#c9a84c",cursor:"pointer",textDecoration:"underline"}}>تغيير الرقم السري</span>
            </div>
          </>}
          {mode === "change_req" && <>
            <div style={{fontSize:15,color:"#e8dcc8",fontWeight:600,marginBottom:12,textAlign:"center"}}>🔑 تغيير الرقم السري</div>
            <div style={{fontSize:13,color:"#a0b0c0",lineHeight:1.9,marginBottom:18,textAlign:"center",background:"#0f1923",borderRadius:8,padding:"10px 14px"}}>سيتم إرسال رمز تحقق إلى بريدك الإلكتروني.</div>
            {error && <div style={{color:"#e05c5c",fontSize:12,marginBottom:10,textAlign:"center"}}>{error}</div>}
            <button className="btn-gold" style={{width:"100%",padding:"11px"}} onClick={sendOTP} disabled={sending}>{sending?"⏳ جاري الإرسال...":"📧 إرسال رمز التحقق"}</button>
            <div style={{textAlign:"center",marginTop:14}}><span onClick={goLogin} style={{fontSize:12,color:"#6a8090",cursor:"pointer",textDecoration:"underline"}}>← رجوع</span></div>
          </>}
          {mode === "otp" && <>
            <div style={{fontSize:15,color:"#e8dcc8",fontWeight:600,marginBottom:12,textAlign:"center"}}>📩 أدخل رمز التحقق</div>
            {msg && <div style={{background:"rgba(76,175,125,.1)",border:"1px solid rgba(76,175,125,.3)",borderRadius:8,padding:"9px 12px",fontSize:12,color:"#4caf7d",textAlign:"center",marginBottom:14}}>{msg}</div>}
            <div style={{marginBottom:12}}>
              <label>الرمز المرسل (6 أرقام)</label>
              <input type="text" value={otpInput} onChange={e=>{setOtpInput(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&verifyOTP()} placeholder="مثال: 482951" maxLength={6} style={{textAlign:"center",fontSize:20,letterSpacing:6}} autoFocus/>
            </div>
            {countdown > 0 && <div style={{fontSize:11,color:"#6a8090",textAlign:"center",marginBottom:10}}>⏱ صالح لـ {Math.floor(countdown/60)}:{String(countdown%60).padStart(2,"0")}</div>}
            {error && <div style={{color:"#e05c5c",fontSize:12,marginBottom:10,textAlign:"center"}}>{error}</div>}
            <button className="btn-gold" style={{width:"100%",padding:"11px"}} onClick={verifyOTP}>تحقق من الرمز</button>
            <div style={{textAlign:"center",marginTop:12,display:"flex",justifyContent:"center",gap:16}}>
              <span onClick={sendOTP} style={{fontSize:12,color:"#c9a84c",cursor:"pointer",textDecoration:"underline"}}>إعادة الإرسال</span>
              <span onClick={goLogin} style={{fontSize:12,color:"#6a8090",cursor:"pointer",textDecoration:"underline"}}>← رجوع</span>
            </div>
          </>}
          {mode === "change_pass" && <>
            <div style={{fontSize:15,color:"#e8dcc8",fontWeight:600,marginBottom:16,textAlign:"center"}}>✅ الرقم السري الجديد</div>
            <div style={{display:"grid",gap:12,marginBottom:12}}>
              <div><label>الرقم السري الجديد</label><input type="password" value={newPass} onChange={e=>{setNewPass(e.target.value);setError("");}} placeholder="٦ أحرف على الأقل"/></div>
              <div><label>تأكيد الرقم السري</label><input type="password" value={newPass2} onChange={e=>{setNewPass2(e.target.value);setError("");}} placeholder="أعد كتابة الرقم السري"/></div>
            </div>
            {error && <div style={{color:"#e05c5c",fontSize:12,marginBottom:10,textAlign:"center"}}>{error}</div>}
            {msg   && <div style={{color:"#4caf7d",fontSize:13,marginBottom:10,textAlign:"center"}}>{msg}</div>}
            <button className="btn-gold" style={{width:"100%",padding:"11px"}} onClick={handleChangePass}>حفظ الرقم السري الجديد</button>
          </>}
        </div>
        <div style={{textAlign:"center",marginTop:16,fontSize:11,color:"#3a4a60"}}>مركز الإتقان © {new Date().getFullYear()}</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [sec,         setSec]         = useState(() => LS.get("itq_last_sec","male"));
  const [courses,     setCourses]     = useState(() => LS.get("itq_courses", []));
  const [courseView,  setCourseView]  = useState(null);   // null | "list" | "add" | "addStudent" | {course}
  const [courseForm,  setCourseForm]  = useState(mkCourse());
  const [courseStForm,setCourseStForm]= useState(mkCourseStudent());
  const [editCourseId,setEditCourseId]= useState(null);
  const [loggedIn,    setLoggedIn]    = useState(() => !!LS.get(SESSION_KEY, null));
  const [loading,     setLoading]     = useState(true);
  const [syncing,     setSyncing]     = useState(false);
  const [page,        setPage]        = useState(() => LS.get("itq_last_page","dashboard"));
  const [students,    setStudents]    = useState([]);
  const [sessions,    setSessions]    = useState([]);
  const [days,        setDays]        = useState([]);
  const [filterMonth, setFilterMonth] = useState(nowMonth());
  const [showAddSt,   setShowAddSt]   = useState(false);
  const [showAddSess, setShowAddSess] = useState(false);
  const [showAddDay,  setShowAddDay]  = useState(false);
  const [editSt,      setEditSt]      = useState(null);
  const [editSessId,  setEditSessId]  = useState(null);
  const [detailSt,    setDetailSt]    = useState(null);
  const [detailDay,   setDetailDay]   = useState(null);
  const [reportSt,    setReportSt]    = useState(null);
  const [newSt,       setNewSt]       = useState(mkStudent("male"));
  const [sessForm,    setSessForm]    = useState(mkSession());
  const [dayForm,     setDayForm]     = useState(mkDay());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const st = await PS.get(`itq_${sec}_students`) || [];
      const ss = await PS.get(`itq_${sec}_sessions`) || [];
      const dd = await PS.get(`itq_${sec}_days`)     || [];
      setStudents(st); setSessions(ss); setDays(dd);
      setLoading(false);
    })();
  }, [sec]);

  const syncData = useCallback(async (key,val) => {
    setSyncing(true); await PS.set(key,val); setSyncing(false);
  }, [sec]);

  useEffect(() => { if(!loading) syncData(`itq_${sec}_students`,students); }, [students]);
  useEffect(() => { if(!loading) syncData(`itq_${sec}_sessions`,sessions); }, [sessions]);
  useEffect(() => { if(!loading) syncData(`itq_${sec}_days`,    days);     }, [days]);
  useEffect(() => { LS.set("itq_last_sec", sec);  }, [sec]);
  useEffect(() => { LS.set("itq_courses", courses); }, [courses]);
  useEffect(() => { LS.set("itq_last_page",page); }, [page]);

  const sc = sec==="male"
    ? {c:"#3b82f6",bg:"rgba(59,130,246,.15)",br:"rgba(59,130,246,.3)",lbl:"👦 قسم الذكور"}
    : {c:"#ec4899",bg:"rgba(236,72,153,.15)",br:"rgba(236,72,153,.3)",lbl:"👧 قسم الإناث"};

  const getStats = useCallback((id, month=null) => {
    let ss = sessions.filter(s=>s.studentId===id);
    if(month) ss=ss.filter(s=>monthKey(s.date)===month);
    const present      = ss.filter(s=>s.present).length;
    const absent       = ss.filter(s=>!s.present).length;
    const memorized    = ss.filter(s=>s.present&&!s.noNew&&!s.notMemorized&&(s.newItems||[]).some(it=>it.surah)).length;
    const notMemorized = ss.filter(s=>s.present&&s.notMemorized).length;
    const grades       = ss.filter(s=>s.present&&!s.noGrade&&(s.grades||[]).length>0).flatMap(s=>s.grades||[]);
    const topGrade     = grades.length ? grades[grades.length-1] : "—";
    const memSurahs    = {};
    ss.filter(s=>s.present&&!s.noNew&&!s.notMemorized).forEach(s=>{
      (s.newItems||[]).filter(it=>it.surah).forEach(it=>{
        if(!memSurahs[it.surah]) memSurahs[it.surah]=[];
        memSurahs[it.surah].push(`${it.from||"?"}–${it.to||"?"}`);
      });
    });
    return {present,absent,memorized,notMemorized,topGrade,total:ss.length,memSurahs};
  }, [sessions]);

  const isPaid = st => !!(st.payments?.[filterMonth]);

  const monthlyStats = useMemo(() => {
    const paid = students.filter(s=>isPaid(s)).length;
    return {total:students.length, paid, unpaid:students.length-paid};
  }, [students, filterMonth]);

  // ── CRUD ─────────────────────────────────────────
  const addStudent = () => {
    if(!newSt.name.trim()) return;
    setStudents(p=>[...p,{...newSt,gender:sec,id:Date.now()}]);
    setNewSt(mkStudent(sec)); setShowAddSt(false);
  };
  const saveEdit = () => {
    setStudents(p=>p.map(s=>s.id===editSt.id?editSt:s));
    if(detailSt?.id===editSt.id) setDetailSt(editSt);
    setEditSt(null);
  };
  const delStudent = id => {
    if(!confirm("حذف الطالب وجميع بياناته؟")) return;
    setStudents(p=>p.filter(s=>s.id!==id));
    setSessions(p=>p.filter(s=>s.studentId!==id));
    if(detailSt?.id===id) setDetailSt(null);
  };
  const togglePaid = student => {
    const payments = {...(student.payments||{})};
    if(payments[filterMonth]) delete payments[filterMonth];
    else payments[filterMonth] = filterMonth;
    const upd = {...student,payments};
    setStudents(p=>p.map(s=>s.id===student.id?upd:s));
    if(detailSt?.id===student.id) setDetailSt(upd);
  };
  const addSession = () => {
    if(editSessId) {
      setSessions(p=>p.map(s=>s.id===editSessId?{...sessForm,studentId:Number(sessForm.studentId),id:editSessId}:s));
      setEditSessId(null);
    } else {
      setSessions(p=>[...p,{...sessForm,studentId:Number(sessForm.studentId),id:Date.now()}]);
    }
    setShowAddSess(false); setSessForm(mkSession());
  };
  const delSession = id => {
    if(!confirm("حذف هذه الحصة نهائياً؟")) return;
    setSessions(p=>p.filter(s=>s.id!==id));
  };
  const addDay = () => {
    if(!dayForm.date) return;
    if(days.find(d=>d.date===dayForm.date)){alert("هذا اليوم مسجل مسبقاً");return;}
    const att=students.map(s=>({studentId:s.id,present:false}));
    setDays(p=>[...p,{...dayForm,id:Date.now(),section:sec,attendance:att}]);
    setDayForm(mkDay()); setShowAddDay(false);
  };
  const toggleAtt = (dayId,studentId) => {
    setDays(p=>p.map(d=>d.id!==dayId?d:{...d,attendance:d.attendance.map(a=>a.studentId===studentId?{...a,present:!a.present}:a)}));
  };
  const saveAttToSessions = day => {
    const upd=[...sessions];
    day.attendance.forEach(a=>{
      const idx=upd.findIndex(s=>s.studentId===a.studentId&&s.date===day.date);
      if(idx>=0) upd[idx]={...upd[idx],present:a.present};
      else upd.push({...mkSession(String(a.studentId)),studentId:a.studentId,date:day.date,present:a.present,id:Date.now()+Math.random()});
    });
    setSessions(upd);
    alert("✓ تم الحفظ والربط بسجل كل طالب");
  };

  const secDays = days.filter(d=>d.section===sec).sort((a,b)=>b.date.localeCompare(a.date));

  if(!loggedIn) return <LoginScreen onLogin={()=>setLoggedIn(true)} />;

  if(loading) return (
    <div dir="rtl" style={{minHeight:"100vh",background:"#0f1923",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:12}}>⏳</div>
        <div style={{color:"#c9a84c",fontSize:15}}>جاري تحميل البيانات...</div>
      </div>
    </div>
  );

  // ── DAY DETAIL PAGE ───────────────────────────────
  if(detailDay) {
    const day = days.find(d=>d.id===detailDay.id)||detailDay;
    const att = day.attendance||[];
    const presCount = att.filter(a=>a.present).length;
    return (
      <div dir="rtl" style={{minHeight:"100vh",background:"#0f1923",color:"#e8dcc8"}}>
        <style>{CSS}</style>
        <div style={{background:"linear-gradient(135deg,#1a2535,#0f1923)",borderBottom:"1px solid #2a3a50",padding:"13px 20px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <button className="btn-out" style={{padding:"5px 12px",fontSize:12}} onClick={()=>setDetailDay(null)}>← رجوع</button>
          <div style={{fontFamily:"'Amiri',serif",fontSize:17,color:"#c9a84c"}}>يوم التدريس</div>
          <span style={{fontSize:12,color:"#a0b0c0"}}>{toAr(day.date)} · {toEn(day.date)}</span>
          <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:sc.bg,color:sc.c,border:`1px solid ${sc.br}`}}>{sc.lbl}</span>
          {syncing&&<span style={{fontSize:11,color:"#6a8090"}}>⏳ جاري الحفظ...</span>}
        </div>
        <div style={{padding:20,maxWidth:680,margin:"0 auto"}}>
          <div className="card" style={{padding:16,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontFamily:"'Amiri',serif",fontSize:19,color:"#c9a84c"}}>{toAr(day.date)}</div>
                {day.notes&&<div style={{fontSize:12,color:"#a0b0c0",marginTop:2}}>📝 {day.notes}</div>}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span className="bx bx-g">{presCount} حاضر</span>
                <span className="bx bx-r">{att.length-presCount} غائب</span>
                <button className="btn-gold" onClick={()=>saveAttToSessions(day)}>💾 حفظ وربط</button>
              </div>
            </div>
          </div>
          <div style={{fontSize:12,color:"#6a8090",marginBottom:10}}>اضغط على أي طالب لتغيير حضوره</div>
          {att.map(a=>{
            const st=students.find(s=>s.id===a.studentId);
            if(!st) return null;
            return (
              <div key={a.studentId} className="card" style={{padding:"12px 16px",marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",borderColor:a.present?"rgba(76,175,125,.35)":"#2a3a50",transition:"all .15s"}} onClick={()=>toggleAtt(day.id,a.studentId)}>
                <div style={{fontSize:14,fontWeight:600}}>{st.name}</div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span className={`bx ${a.present?"bx-g":"bx-r"}`}>{a.present?"✓ حاضر":"✗ غائب"}</span>
                  <div style={{width:28,height:28,borderRadius:7,border:`2px solid ${a.present?"#4caf7d":"#e05c5c"}`,background:a.present?"rgba(76,175,125,.18)":"rgba(224,92,92,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{a.present?"✓":"✗"}</div>
                </div>
              </div>
            );
          })}
        </div>
        {showAddSess&&<SessModal students={students} sessForm={sessForm} setSessForm={setSessForm} onSave={addSession} onClose={()=>{setShowAddSess(false);setEditSessId(null);setSessForm(mkSession());}}/>}
        {reportSt&&<ReportModal student={reportSt} sessions={sessions} sc={sc} filterMonth={filterMonth} onClose={()=>setReportSt(null)} onExportPDF={(s,l)=>buildAndPrintPDF(s,sessions,sc,filterMonth,l)}/>}
      </div>
    );
  }

  // ── STUDENT DETAIL PAGE ───────────────────────────
  if(detailSt) {
    const st     = detailSt;
    const stSess = [...sessions].filter(s=>s.studentId===st.id).sort((a,b)=>b.date.localeCompare(a.date));
    const s      = getStats(st.id);
    const rate   = stSess.length>0?Math.round((s.present/stSess.length)*100):0;
    const paid   = isPaid(st);
    return (
      <div dir="rtl" style={{minHeight:"100vh",background:"#0f1923",color:"#e8dcc8"}}>
        <style>{CSS}</style>
        <div style={{background:"linear-gradient(135deg,#1a2535,#0f1923)",borderBottom:"1px solid #2a3a50",padding:"13px 20px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <button className="btn-out" style={{padding:"5px 12px",fontSize:12}} onClick={()=>setDetailSt(null)}>← رجوع</button>
          <div style={{fontFamily:"'Amiri',serif",fontSize:17,color:"#c9a84c"}}>ملف الطالب</div>
          <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:sc.bg,color:sc.c,border:`1px solid ${sc.br}`}}>{sc.lbl}</span>
          {syncing&&<span style={{fontSize:11,color:"#6a8090"}}>⏳ جاري الحفظ...</span>}
        </div>
        <div style={{padding:20,maxWidth:780,margin:"0 auto"}}>
          <div className="card" style={{padding:20,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontFamily:"'Amiri',serif",fontSize:24,color:"#c9a84c",marginBottom:4}}>{st.name}</div>
                <div style={{fontSize:12,color:"#a0b0c0"}}>ولي الأمر: <span style={{color:"#e8dcc8"}}>{st.guardian||"—"}</span></div>
                <div style={{fontSize:12,color:"#a0b0c0",marginTop:2}}>الجوال: <span style={{color:"#e8dcc8"}}>{st.guardianPhone||"—"}</span></div>
                {st.joinDate&&<div style={{fontSize:11,color:"#6a8090",marginTop:2}}>التحق: {toAr(st.joinDate)} · {toEn(st.joinDate)}</div>}
                {st.notes&&<div style={{fontSize:12,color:"#a0b0c0",marginTop:6,background:"#0f1923",padding:"7px 10px",borderRadius:7,borderRight:"3px solid #c9a84c"}}>📝 {st.notes}</div>}
              </div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"flex-start"}}>
                <span className={`bx ${paid?"bx-g":"bx-r"}`}>{paid?"✓ مدفوع "+toArShort(filterMonth):"✗ غير مدفوع "+toArShort(filterMonth)}</span>
                <button className="btn-out" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>togglePaid(st)}>{paid?"إلغاء الدفع":"تسجيل الدفع"}</button>
                <button className="btn-out" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>setEditSt({...st})}>✏️ تعديل</button>
                <button className="btn-gold" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>setReportSt(st)}>📋 تقرير</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(95px,1fr))",gap:8,marginTop:14}}>
              {[{l:"حضور كلي",v:s.present,c:"#4caf7d"},{l:"غياب كلي",v:s.absent,c:"#e05c5c"},{l:"نسبة الحضور",v:`${rate}%`,c:"#c9a84c"},{l:"مرات الحفظ",v:s.memorized,c:"#4caf7d"},{l:'مرات "لم يحفظ"',v:s.notMemorized,c:"#e8a84c"},{l:"آخر تقييم",v:s.topGrade,c:GC[s.topGrade]||"#c9a84c"}].map(x=>(
                <div key={x.l} style={{textAlign:"center",background:"#0f1923",borderRadius:7,padding:"9px 5px",border:"1px solid #2a3a50"}}>
                  <div style={{fontSize:18,fontWeight:700,color:x.c}}>{x.v}</div>
                  <div style={{fontSize:10,color:"#6a8090",marginTop:2}}>{x.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:"#a0b0c0"}}>سجل الحصص ({stSess.length})</div>
            <button className="btn-gold" onClick={()=>{setSessForm({...mkSession(),studentId:String(st.id)});setShowAddSess(true);}}>+ تسجيل حصة</button>
          </div>
          {stSess.length===0&&<div className="card" style={{padding:22,textAlign:"center",color:"#6a8090",fontSize:13}}>لا توجد حصص</div>}
          {stSess.map(s=>(
            <div key={s.id} className="card" style={{padding:13,marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:7}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span className={`bx ${s.present?"bx-g":"bx-r"}`}>{s.present?"حاضر":"غائب"}</span>
                  <div><div style={{fontSize:12,fontWeight:600}}>{toAr(s.date)}</div><div style={{fontSize:10,color:"#6a8090"}}>{s.date}</div></div>
                </div>
                {s.notMemorized&&<span className="bx bx-o">لم يحفظ</span>}
              </div>
              {s.present&&<SessDetails s={s}/>}
            </div>
          ))}
        </div>
        {showAddSess&&<SessModal students={students} sessForm={sessForm} setSessForm={setSessForm} onSave={addSession} onClose={()=>{setShowAddSess(false);setEditSessId(null);setSessForm(mkSession());}}/>}
        {editSt&&<EditModal editSt={editSt} setEditSt={setEditSt} onSave={saveEdit} filterMonth={filterMonth} toArShort={toArShort}/>}
        {reportSt&&<ReportModal student={reportSt} sessions={sessions} sc={sc} filterMonth={filterMonth} onClose={()=>setReportSt(null)} onExportPDF={(s,l)=>buildAndPrintPDF(s,sessions,sc,filterMonth,l)}/>}
      </div>
    );
  }

  // ── MAIN LAYOUT ───────────────────────────────────
  return (
    <div dir="rtl" style={{minHeight:"100vh",background:"#0f1923",color:"#e8dcc8"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a2535,#0f1923)",borderBottom:"1px solid #2a3a50",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <img src="/logo_-_white.png" style={{height:40,filter:"brightness(0) invert(1)",opacity:0.9}} onError={e=>e.target.style.display="none"}/>
          <div>
            <div style={{fontFamily:"'Amiri',serif",fontSize:15,color:"#c9a84c",lineHeight:1.2}}>مركز الإتقان</div>
            <div style={{fontSize:10,color:"#6a8090"}}>متابعة الحلقات</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <input type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{width:130,padding:"5px 8px",fontSize:12}}/>
          {syncing&&<span style={{fontSize:11,color:"#4caf7d"}}>⏳</span>}
          <div style={{display:"flex",background:"#0f1923",border:"1px solid #2a3a50",borderRadius:10,padding:3,gap:3}}>
            <button onClick={()=>setSec("male")} style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:sec==="male"?"linear-gradient(135deg,#3b82f6,#2563eb)":"transparent",color:sec==="male"?"#fff":"#6a8090",transition:"all .2s"}}>👦 الذكور</button>
            <button onClick={()=>setSec("female")} style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:sec==="female"?"linear-gradient(135deg,#ec4899,#db2777)":"transparent",color:sec==="female"?"#fff":"#6a8090",transition:"all .2s"}}>👧 الإناث</button>
          </div>
        </div>
      </div>

      <div style={{display:"flex",minHeight:"calc(100vh - 60px)"}}>
        {/* Sidebar - desktop only */}
        <div className="sidebar-desktop" style={{width:178,background:"#141e2b",borderLeft:"1px solid #2a3a50",padding:"14px 10px",flexShrink:0}}>
          <div style={{margin:"0 0 12px 0",padding:"8px 10px",borderRadius:7,background:sc.bg,border:`1px solid ${sc.br}`,fontSize:12,fontWeight:700,color:sc.c,textAlign:"center"}}>{sc.lbl}</div>
          {[{k:"dashboard",i:"📊",l:"لوحة التحكم"},{k:"students",i:"👥",l:"الطلبة"},{k:"sessions",i:"📖",l:"الحصص"},{k:"attendance",i:"📅",l:"أيام التدريس"},{k:"courses",i:"🎓",l:"الدورات"},{k:"reports",i:"📋",l:"التقارير"}].map(x=>(
            <div key={x.k} className={`nav ${page===x.k?"on":""}`} onClick={()=>setPage(x.k)}>{x.i} {x.l}</div>
          ))}
          <div style={{marginTop:"auto",paddingTop:20}}>
            <div className="nav" style={{color:"#e05c5c",marginTop:8}} onClick={()=>{LS.set(SESSION_KEY,null);setLoggedIn(false);}}>🚪 تسجيل الخروج</div>
          </div>
        </div>

        {/* Content */}
        <div className="content-area" style={{flex:1,padding:20,overflowY:"auto",paddingBottom:80}}>

          {/* ─ DASHBOARD ─ */}
          {page==="dashboard"&&<>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
              <div style={{fontFamily:"'Amiri',serif",fontSize:20,color:"#c9a84c"}}>لوحة التحكم</div>
              <span style={{fontSize:11,color:"#6a8090"}}>{toArShort(filterMonth)}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",gap:12,marginBottom:18}}>
              {[{i:"👥",v:monthlyStats.total,l:"إجمالي الطلبة",s:"هذا الشهر",c:sc.c},{i:"✅",v:days.filter(d=>monthKey(d.date)===filterMonth).length,l:"أيام التدريس",s:"هذا الشهر",c:"#4caf7d"},{i:"💰",v:monthlyStats.paid,l:"دفعوا الاشتراك",s:toArShort(filterMonth),c:"#4caf7d"},{i:"⚠️",v:monthlyStats.unpaid,l:"لم يدفعوا",s:toArShort(filterMonth),c:"#e05c5c"}].map(x=>(
                <div key={x.l} style={{background:"linear-gradient(135deg,#1a2535,#1f2d40)",border:"1px solid #2a3a50",borderRadius:11,padding:16,textAlign:"center"}}>
                  <div style={{fontSize:24,marginBottom:6}}>{x.i}</div>
                  <div style={{fontSize:22,fontWeight:700,color:x.c}}>{x.v}</div>
                  <div style={{fontSize:11,color:"#e8dcc8",marginTop:2}}>{x.l}</div>
                  <div style={{fontSize:10,color:"#6a8090",marginTop:1}}>{x.s}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:12,color:"#a0b0c0",fontWeight:600,marginBottom:8}}>آخر الحصص</div>
            <div className="card" style={{overflow:"hidden"}}>
              {[...sessions].reverse().slice(0,6).filter(s=>students.find(x=>x.id===s.studentId)).length===0
                ?<div style={{padding:18,textAlign:"center",color:"#6a8090",fontSize:13}}>لا توجد حصص بعد</div>
                :[...sessions].reverse().slice(0,6).map(s=>{
                    const st=students.find(x=>x.id===s.studentId);
                    if(!st) return null;
                    return (
                      <div key={s.id} style={{padding:"11px 16px",borderBottom:"1px solid #2a3a50",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setDetailSt(st)}>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:"#c9a84c"}}>{st.name}</div>
                          <div style={{fontSize:11,color:"#6a8090"}}>{toAr(s.date)}{s.notMemorized?" · لم يحفظ":!s.noNew&&(s.newItems||[]).some(it=>it.surah)?` · 📗 ${(s.newItems||[]).filter(it=>it.surah).map(it=>it.surah).join("، ")}`:""}</div>
                        </div>
                        <span className={`bx ${s.present?"bx-g":"bx-r"}`}>{s.present?"حاضر":"غائب"}</span>
                      </div>
                    );
                  })}
            </div>
          </>}

          {/* ─ STUDENTS ─ */}
          {page==="students"&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontFamily:"'Amiri',serif",fontSize:19,color:"#c9a84c"}}>{sec==="male"?"الطلاب":"الطالبات"}</div>
                <span style={{padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:700,background:sc.bg,color:sc.c,border:`1px solid ${sc.br}`}}>{students.length}</span>
              </div>
              <button className="btn-gold" onClick={()=>{setNewSt(mkStudent(sec));setShowAddSt(true);}}>+ إضافة</button>
            </div>
            {students.length===0&&<div className="card" style={{padding:26,textAlign:"center",color:"#6a8090",fontSize:13}}>لا يوجد طلبة. أضف أول {sec==="male"?"طالب":"طالبة"}!</div>}
            <div style={{display:"grid",gap:11}}>
              {students.map(student=>{
                const s=getStats(student.id);
                const paid=isPaid(student);
                return (
                  <div key={student.id} className="card hov" style={{padding:15,cursor:"pointer",transition:"border-color .2s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                      <div onClick={()=>setDetailSt(student)} style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>{student.name}</div>
                        <div style={{fontSize:11,color:"#6a8090"}}>ولي الأمر: {student.guardian||"—"} · {student.guardianPhone||"—"}</div>
                        {student.joinDate&&<div style={{fontSize:11,color:"#6a8090",marginTop:1}}>التحق: {toAr(student.joinDate)}</div>}
                        {student.notes&&<div style={{fontSize:11,color:"#a0b0c0",marginTop:3}}>📝 {student.notes}</div>}
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                        <span className={`bx ${paid?"bx-g":"bx-r"}`}>{paid?"✓ مدفوع":"✗ غير مدفوع"}</span>
                        <button className="btn-out" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>togglePaid(student)}>{paid?"إلغاء":"دفع"}</button>
                        <button className="btn-out" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>setEditSt({...student})}>✏️</button>
                        <button className="btn-red" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>delStudent(student.id)}>🗑️</button>
                      </div>
                    </div>
                    <hr className="div"/>
                    <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{fontSize:12}}><span style={{color:"#6a8090"}}>حضور: </span><span style={{color:"#4caf7d"}}>{s.present}</span><span style={{color:"#6a8090"}}> · غياب: </span><span style={{color:"#e05c5c"}}>{s.absent}</span></span>
                      <span style={{fontSize:12}}><span style={{color:"#6a8090"}}>حفظ: </span><span style={{color:"#4caf7d"}}>{s.memorized}</span></span>
                      <span style={{fontSize:12}}><span style={{color:"#6a8090"}}>لم يحفظ: </span><span style={{color:"#e8a84c"}}>{s.notMemorized}</span></span>
                      <button className="btn-out" style={{fontSize:11,padding:"3px 10px",marginRight:"auto"}} onClick={()=>setDetailSt(student)}>عرض الملف ←</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>}

          {/* ─ SESSIONS ─ */}
          {page==="sessions"&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"'Amiri',serif",fontSize:19,color:"#c9a84c"}}>الحصص</div>
              <button className="btn-gold" onClick={()=>setShowAddSess(true)}>+ تسجيل حصة</button>
            </div>
            {sessions.length===0&&<div className="card" style={{padding:22,textAlign:"center",color:"#6a8090",fontSize:13}}>لا توجد حصص.</div>}
            {(()=>{
              const secSessions=[...sessions].filter(s=>{const st=students.find(x=>x.id===s.studentId);return st?.gender===sec;});
              const byDate={};
              secSessions.forEach(s=>{if(!byDate[s.date])byDate[s.date]=[];byDate[s.date].push(s);});
              const sortedDates=Object.keys(byDate).sort((a,b)=>b.localeCompare(a));
              if(sortedDates.length===0) return null;
              return (
                <div style={{display:"grid",gap:16}}>
                  {sortedDates.map(date=>{
                    const daySessions=[...byDate[date]].sort((a,b)=>{
                      const na=students.find(x=>x.id===a.studentId)?.name||"";
                      const nb=students.find(x=>x.id===b.studentId)?.name||"";
                      return na.localeCompare(nb,"ar");
                    });
                    const trainDay=secDays.find(d=>d.date===date);
                    const presCount=daySessions.filter(s=>s.present).length;
                    return (
                      <DaySessionGroup key={date} date={date} daySessions={daySessions} trainDay={trainDay} presCount={presCount} students={students} setDetailSt={setDetailSt} setSessForm={setSessForm} setEditSessId={setEditSessId} setShowAddSess={setShowAddSess} delSession={delSession} mkSession={mkSession}/>
                    );
                  })}
                </div>
              );
            })()}
          </>}

          {/* ─ ATTENDANCE ─ */}
          {page==="attendance"&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"'Amiri',serif",fontSize:19,color:"#c9a84c"}}>أيام التدريس</div>
              <button className="btn-gold" onClick={()=>setShowAddDay(true)}>+ إضافة يوم</button>
            </div>
            <div style={{fontSize:12,color:"#6a8090",marginBottom:10}}>اضغط على أي يوم لفتح سجل الحضور</div>
            {secDays.length===0&&<div className="card" style={{padding:22,textAlign:"center",color:"#6a8090",fontSize:13}}>لا توجد أيام.</div>}
            <div style={{display:"grid",gap:9}}>
              {secDays.map(day=>{
                const att=day.attendance||[];
                const pres=att.filter(a=>a.present).length;
                return (
                  <div key={day.id} className="card hov" style={{padding:15,cursor:"pointer",transition:"border-color .2s"}} onClick={()=>setDetailDay(day)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"#c9a84c"}}>{toAr(day.date)}</div>
                        <div style={{fontSize:11,color:"#6a8090"}}>{day.date}{day.notes?` · ${day.notes}`:""}</div>
                      </div>
                      <div style={{display:"flex",gap:7,alignItems:"center"}}>
                        <span className="bx bx-g">{pres} حاضر</span>
                        <span className="bx bx-r">{att.length-pres} غائب</span>
                        <span style={{fontSize:11,color:"#c9a84c"}}>←</span>
                      </div>
                    </div>
                    <div style={{marginTop:9,height:4,background:"#2a3a50",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:att.length>0?`${(pres/att.length)*100}%`:"0%",background:"#4caf7d",borderRadius:4}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </>}


          {/* ─ COURSES ─ */}
          {page==="courses"&&<>
            {/* LIST */}
            {!courseView&&<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontFamily:"'Amiri',serif",fontSize:19,color:"#c9a84c"}}>🎓 الدورات</div>
                <button className="btn-gold" onClick={()=>{setCourseForm(mkCourse());setCourseView("add");}}>+ إضافة دورة</button>
              </div>
              {courses.length===0&&<div className="card" style={{padding:28,textAlign:"center",color:"#6a8090",fontSize:13}}>لا توجد دورات. أضف أول دورة!</div>}
              <div style={{display:"grid",gap:11}}>
                {courses.map(c=>(
                  <div key={c.id} className="card hov" style={{padding:16,cursor:"pointer"}} onClick={()=>setCourseView(c)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                      <div>
                        <div style={{fontSize:15,fontWeight:700,color:"#c9a84c",marginBottom:3}}>{c.name}</div>
                        {c.goal&&<div style={{fontSize:12,color:"#a0b0c0",marginBottom:2}}>🎯 {c.goal}</div>}
                        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:5}}>
                          {c.teacher&&<span style={{fontSize:11,color:"#6a8090"}}>👨‍🏫 {c.teacher}</span>}
                          {c.supervisor&&<span style={{fontSize:11,color:"#6a8090"}}>👤 {c.supervisor}</span>}
                          {c.ageGroup&&<span style={{fontSize:11,color:"#6a8090"}}>👥 {c.ageGroup}</span>}
                          {c.days>0&&<span style={{fontSize:11,color:"#6a8090"}}>📅 {c.days} يوم</span>}
                          {c.hoursPerDay>0&&<span style={{fontSize:11,color:"#6a8090"}}>⏱ {c.hoursPerDay} ساعة/يوم</span>}
                          <span className={`bx ${c.mode==="أونلاين"?"bx-y":"bx-g"}`}>{c.mode}</span>
                        </div>
                      </div>
                      <div style={{textAlign:"center",background:"#0f1923",borderRadius:8,padding:"8px 14px",border:"1px solid #2a3a50"}}>
                        <div style={{fontSize:20,fontWeight:700,color:"#c9a84c"}}>{(c.students||[]).length}</div>
                        <div style={{fontSize:10,color:"#6a8090"}}>طالب</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>}

            {/* ADD COURSE FORM */}
            {courseView==="add"&&<>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <button className="btn-out" style={{padding:"5px 12px",fontSize:12}} onClick={()=>setCourseView(null)}>← رجوع</button>
                <div style={{fontFamily:"'Amiri',serif",fontSize:18,color:"#c9a84c"}}>{editCourseId?"تعديل الدورة":"إضافة دورة جديدة"}</div>
              </div>
              <div className="card" style={{padding:20}}>
                <div style={{display:"grid",gap:13}}>
                  <div><label>اسم الدورة *</label><input value={courseForm.name} onChange={e=>setCourseForm({...courseForm,name:e.target.value})} placeholder="مثال: دورة تحفيظ صيف ١٤٤٧"/></div>
                  <div><label>هدف الدورة</label><textarea rows={2} value={courseForm.goal} onChange={e=>setCourseForm({...courseForm,goal:e.target.value})} placeholder="مثال: حفظ جزء عم في ٣٠ يوم"/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div><label>الفئة العمرية المستهدفة</label><input value={courseForm.ageGroup} onChange={e=>setCourseForm({...courseForm,ageGroup:e.target.value})} placeholder="مثال: ٨–١٤ سنة"/></div>
                    <div><label>المشرف</label><input value={courseForm.supervisor} onChange={e=>setCourseForm({...courseForm,supervisor:e.target.value})} placeholder="اسم المشرف"/></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div><label>المعلم</label><input value={courseForm.teacher} onChange={e=>setCourseForm({...courseForm,teacher:e.target.value})} placeholder="اسم المعلم"/></div>
                    <div><label>نظام الحضور</label>
                      <div style={{display:"flex",gap:8,marginTop:4}}>
                        {["حضوري","أونلاين"].map(m=>(
                          <button key={m} type="button" className={`tog ${courseForm.mode===m?"on-g":""}`} style={{flex:1,padding:"8px"}} onClick={()=>setCourseForm({...courseForm,mode:m})}>{m==="حضوري"?"🏫 حضوري":"💻 أونلاين"}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div><label>عدد أيام الدورة</label><input type="number" min="1" value={courseForm.days||""} onChange={e=>setCourseForm({...courseForm,days:Number(e.target.value)})} placeholder="مثال: 30"/></div>
                    <div><label>عدد الساعات يومياً</label><input type="number" min="1" step="0.5" value={courseForm.hoursPerDay||""} onChange={e=>setCourseForm({...courseForm,hoursPerDay:Number(e.target.value)})} placeholder="مثال: 2"/></div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,marginTop:18}}>
                  <button className="btn-gold" style={{flex:1,padding:"11px"}} disabled={!courseForm.name.trim()} onClick={()=>{
                    if(editCourseId){
                      setCourses(p=>p.map(c=>c.id===editCourseId?{...courseForm,id:editCourseId,students:c.students}:c));
                      setEditCourseId(null); setCourseView(null);
                    } else {
                      const nc={...courseForm,id:Date.now(),students:[]};
                      setCourses(p=>[...p,nc]);
                      setCourseView("addStudent");
                      setCourseForm(nc);
                      setCourseStForm(mkCourseStudent());
                    }
                  }}>التالي: إضافة طلاب ←</button>
                  <button className="btn-out" onClick={()=>setCourseView(null)}>إلغاء</button>
                </div>
              </div>
            </>}

            {/* ADD STUDENTS TO COURSE */}
            {courseView==="addStudent"&&<>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <button className="btn-out" style={{padding:"5px 12px",fontSize:12}} onClick={()=>setCourseView(null)}>✓ حفظ والخروج</button>
                <div style={{fontFamily:"'Amiri',serif",fontSize:17,color:"#c9a84c"}}>إضافة طلاب · {courseForm.name}</div>
              </div>
              <div style={{display:"grid",gap:14,gridTemplateColumns:"1fr 1fr"}}>
                {/* Form */}
                <div className="card" style={{padding:16,gridColumn:"1/-1"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#c9a84c",marginBottom:12}}>بيانات الطالب</div>
                  <div style={{display:"grid",gap:10}}>
                    <div><label>الاسم ثلاثي *</label><input value={courseStForm.name} onChange={e=>setCourseStForm({...courseStForm,name:e.target.value})} placeholder="الاسم الأول والثاني والثالث"/></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div><label>تاريخ الميلاد</label>
                        <input type="date" value={courseStForm.birthDate} onChange={e=>{
                          const bd=e.target.value;
                          const age=bd?Math.floor((Date.now()-new Date(bd).getTime())/(365.25*24*3600*1000)):"";
                          setCourseStForm({...courseStForm,birthDate:bd,age:age});
                        }}/>
                      </div>
                      <div><label>العمر</label><input value={courseStForm.age?courseStForm.age+" سنة":""} readOnly style={{background:"#141e2b",color:"#c9a84c",fontWeight:700}} placeholder="يُحسب تلقائياً"/></div>
                    </div>
                    <div><label>رقم ولي الأمر</label><input type="tel" value={courseStForm.guardianPhone} onChange={e=>setCourseStForm({...courseStForm,guardianPhone:e.target.value})} placeholder="01xxxxxxxxx"/></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div><label>البداية من (سورة)</label>
                        <select value={courseStForm.startSurah} onChange={e=>setCourseStForm({...courseStForm,startSurah:e.target.value,startVerse:1})}>
                          <option value="">اختر السورة</option>
                          {SURAHS.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div><label>رقم الآية</label>
                        <select value={courseStForm.startVerse} onChange={e=>setCourseStForm({...courseStForm,startVerse:Number(e.target.value)})}>
                          {Array.from({length:courseStForm.startSurah?SURAH_VERSES[courseStForm.startSurah]||1:1},(_,i)=>i+1).map(v=>(
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div><label>المستوى</label>
                      <div style={{display:"flex",gap:8,marginTop:4}}>
                        {["مبتدئ","متوسط","متقدم"].map(lv=>(
                          <button key={lv} type="button" className={`tog ${courseStForm.level===lv?"on-g":""}`} style={{flex:1,padding:"8px"}} onClick={()=>setCourseStForm({...courseStForm,level:lv})}>{lv}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button className="btn-gold" style={{width:"100%",padding:"11px",marginTop:14}} disabled={!courseStForm.name.trim()} onClick={()=>{
                    const st={...courseStForm,id:Date.now()};
                    const updated=courses.map(c=>c.id===courseForm.id?{...c,students:[...(c.students||[]),st]}:c);
                    setCourses(updated);
                    setCourseForm(prev=>({...prev,students:[...(prev.students||[]),st]}));
                    setCourseStForm(mkCourseStudent());
                  }}>+ إضافة الطالب</button>
                </div>
                {/* Students list */}
                {(courseForm.students||[]).length>0&&<div className="card" style={{padding:16,gridColumn:"1/-1"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#c9a84c",marginBottom:10}}>الطلاب المضافون ({(courseForm.students||[]).length})</div>
                  <div style={{display:"grid",gap:8}}>
                    {[...(courseForm.students||[])].sort((a,b)=>a.name.localeCompare(b.name,"ar")).map(st=>(
                      <div key={st.id} style={{padding:"10px 12px",background:"#0f1923",borderRadius:8,border:"1px solid #2a3a50",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:600}}>{st.name}</div>
                          <div style={{fontSize:11,color:"#6a8090"}}>
                            {st.age?`${st.age} سنة · `:""}{st.level}
                            {st.startSurah?` · من ${st.startSurah} آية ${st.startVerse}`:""}
                          </div>
                        </div>
                        <button className="btn-red" style={{fontSize:11,padding:"3px 9px"}} onClick={()=>{
                          const upd=courses.map(c=>c.id===courseForm.id?{...c,students:(c.students||[]).filter(s=>s.id!==st.id)}:c);
                          setCourses(upd);
                          setCourseForm(prev=>({...prev,students:(prev.students||[]).filter(s=>s.id!==st.id)}));
                        }}>🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>}
              </div>
            </>}

            {/* COURSE DETAIL */}
            {courseView&&courseView!=="add"&&courseView!=="addStudent"&&<>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                <button className="btn-out" style={{padding:"5px 12px",fontSize:12}} onClick={()=>setCourseView(null)}>← رجوع</button>
                <div style={{fontFamily:"'Amiri',serif",fontSize:17,color:"#c9a84c",flex:1}}>{courseView.name}</div>
                <button className="btn-out" style={{fontSize:12,padding:"5px 10px"}} onClick={()=>{setEditCourseId(courseView.id);setCourseForm({...courseView});setCourseView("add");}}>✏️ تعديل</button>
                <button className="btn-red" style={{fontSize:12,padding:"5px 10px"}} onClick={()=>{if(confirm("حذف الدورة نهائياً؟")){setCourses(p=>p.filter(c=>c.id!==courseView.id));setCourseView(null);}}}>🗑️ حذف</button>
              </div>
              {/* Course Info */}
              <div className="card" style={{padding:16,marginBottom:12}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
                  {[["🎯 الهدف",courseView.goal],["👥 الفئة العمرية",courseView.ageGroup],["👤 المشرف",courseView.supervisor],["👨‍🏫 المعلم",courseView.teacher],["📅 عدد الأيام",courseView.days?courseView.days+" يوم":"—"],["⏱ ساعات يومياً",courseView.hoursPerDay?courseView.hoursPerDay+" ساعة":"—"],["🖥 نظام الحضور",courseView.mode]].filter(([,v])=>v).map(([k,v])=>(
                    <div key={k} style={{background:"#0f1923",borderRadius:8,padding:"10px",border:"1px solid #2a3a50"}}>
                      <div style={{fontSize:10,color:"#6a8090"}}>{k}</div>
                      <div style={{fontSize:13,color:"#e8dcc8",fontWeight:600,marginTop:2}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Students */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:"#a0b0c0"}}>الطلاب ({(courseView.students||[]).length})</div>
                <button className="btn-gold" style={{fontSize:12,padding:"6px 12px"}} onClick={()=>{setCourseForm({...courseView});setCourseStForm(mkCourseStudent());setCourseView("addStudent");}}>+ إضافة طالب</button>
              </div>
              {(courseView.students||[]).length===0&&<div className="card" style={{padding:18,textAlign:"center",color:"#6a8090",fontSize:13}}>لا يوجد طلاب في هذه الدورة</div>}
              <div style={{display:"grid",gap:9}}>
                {[...(courseView.students||[])].sort((a,b)=>a.name.localeCompare(b.name,"ar")).map(st=>(
                  <div key={st.id} className="card" style={{padding:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:700}}>{st.name}</div>
                        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:4}}>
                          {st.age&&<span style={{fontSize:11,color:"#6a8090"}}>🎂 {st.age} سنة</span>}
                          {st.guardianPhone&&<span style={{fontSize:11,color:"#6a8090"}}>📞 {st.guardianPhone}</span>}
                          {st.startSurah&&<span style={{fontSize:11,color:"#c9a84c"}}>📖 من {st.startSurah} آية {st.startVerse}</span>}
                          <span className={`bx ${st.level==="متقدم"?"bx-g":st.level==="متوسط"?"bx-y":"bx-o"}`}>{st.level}</span>
                        </div>
                      </div>
                      <button className="btn-red" style={{fontSize:11,padding:"3px 9px"}} onClick={()=>{
                        const upd=courses.map(c=>c.id===courseView.id?{...c,students:(c.students||[]).filter(s=>s.id!==st.id)}:c);
                        setCourses(upd);
                        setCourseView(upd.find(c=>c.id===courseView.id)||null);
                      }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </>}
          </>}
          {/* ─ REPORTS ─ */}
          {page==="reports"&&<>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{fontFamily:"'Amiri',serif",fontSize:19,color:"#c9a84c"}}>التقارير الشهرية</div>
              <span style={{fontSize:11,color:"#6a8090"}}>{toArShort(filterMonth)}</span>
            </div>
            {students.length===0&&<div className="card" style={{padding:22,textAlign:"center",color:"#6a8090",fontSize:13}}>لا يوجد طلبة.</div>}
            <div style={{display:"grid",gap:9}}>
              {students.map(student=>{
                const s=getStats(student.id,filterMonth);
                const stSess=sessions.filter(ss=>ss.studentId===student.id&&monthKey(ss.date)===filterMonth);
                const rate=stSess.length>0?Math.round((s.present/stSess.length)*100):0;
                return (
                  <div key={student.id} className="card" style={{padding:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:700}}>{student.name}</div>
                        <div style={{fontSize:11,color:"#6a8090"}}>ولي الأمر: {student.guardian||"—"}</div>
                        <div style={{display:"flex",gap:10,marginTop:5,flexWrap:"wrap"}}>
                          <span style={{fontSize:12,color:"#4caf7d"}}>حضور: {s.present}</span>
                          <span style={{fontSize:12,color:"#e05c5c"}}>غياب: {s.absent}</span>
                          <span style={{fontSize:12,color:"#c9a84c"}}>{rate}%</span>
                          <span style={{fontSize:12,color:"#4caf7d"}}>حفظ: {s.memorized}</span>
                          <span style={{fontSize:12,color:"#e8a84c"}}>لم يحفظ: {s.notMemorized}</span>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button className="btn-out" style={{fontSize:12,padding:"5px 10px"}} onClick={()=>setReportSt(student)}>👁️ عرض</button>
                        <button className="btn-gold" style={{fontSize:12,padding:"5px 10px"}} onClick={()=>buildAndPrintPDF(student,sessions,sc,filterMonth)}>📄 PDF</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>}

        </div>
      </div>

      {showAddSt&&<AddStudentModal sec={sec} newSt={newSt} setNewSt={setNewSt} onSave={addStudent} onClose={()=>setShowAddSt(false)}/>}
      {showAddDay&&<AddDayModal dayForm={dayForm} setDayForm={setDayForm} studentCount={students.length} onSave={addDay} onClose={()=>setShowAddDay(false)}/>}
      {showAddSess&&<SessModal students={students} sessForm={sessForm} setSessForm={setSessForm} onSave={addSession} onClose={()=>{setShowAddSess(false);setEditSessId(null);setSessForm(mkSession());}}/>}
      {editSt&&<EditModal editSt={editSt} setEditSt={setEditSt} onSave={saveEdit} filterMonth={filterMonth} toArShort={toArShort}/>}
      {reportSt&&<ReportModal student={reportSt} sessions={sessions} sc={sc} filterMonth={filterMonth} onClose={()=>setReportSt(null)} onExportPDF={(s,l)=>buildAndPrintPDF(s,sessions,sc,filterMonth,l)}/>}

      {/* Bottom Navigation - mobile only */}
      <nav className="bottom-nav">
        {[{k:"dashboard",i:"📊",l:"الرئيسية"},{k:"students",i:"👥",l:"الطلبة"},{k:"sessions",i:"📖",l:"الحصص"},{k:"attendance",i:"📅",l:"الحضور"},{k:"courses",i:"🎓",l:"الدورات"},{k:"reports",i:"📋",l:"التقارير"}].map(x=>(
          <button key={x.k} className={`bottom-nav-item ${page===x.k?"active":""}`} onClick={()=>setPage(x.k)}>
            <span className="nav-icon">{x.i}</span>
            <span>{x.l}</span>
          </button>
        ))}
        <button className="bottom-nav-item" onClick={()=>{LS.set(SESSION_KEY,null);setLoggedIn(false);}}>
          <span className="nav-icon">🚪</span>
          <span style={{color:"#e05c5c"}}>خروج</span>
        </button>
      </nav>
    </div>
  );
}
