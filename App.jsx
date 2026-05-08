import { useState, useMemo, useEffect, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const SURAHS = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
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
      {s.notMemorized && <div style={{fontSize:12,color:"#e8a84c"}}>📗 لم يحفظ</div>}
      {!s.noNew&&!s.notMemorized&&(s.newItems||[]).filter(it=>it.surah).map((it,i)=>(
        <div key={i} style={{fontSize:12}}>📗 {it.surah}{it.from?` (${it.from}–${it.to})`:""}</div>
      ))}
      {s.noRev && <div style={{fontSize:12,color:"#e05c5c"}}>🔄 لا يوجد مراجعة</div>}
      {!s.noRev&&(s.revItems||[]).filter(it=>it.surah).map((it,i)=>(
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
  const noKey    = field==="newItems" ? "noNew" : "noRev";
  const isNone   = sessForm[noKey];
  const isNotMem = field==="newItems" && sessForm.notMemorized;

  const setNone   = v => setSessForm({...sessForm,[noKey]:v,notMemorized:false,[field]:v?[]:sessForm[field]});
  const setNotMem = v => setSessForm({...sessForm,notMemorized:v,noNew:false,[field]:v?[]:sessForm[field]});
  const addItem   = () => setSessForm({...sessForm,[field]:[...sessForm[field],mkItem()]});
  const remItem   = i  => setSessForm({...sessForm,[field]:sessForm[field].filter((_,x)=>x!==i)});
  const updItem   = (i,k,v) => { const a=[...sessForm[field]]; a[i]={...a[i],[k]:v}; setSessForm({...sessForm,[field]:a}); };

  const label = field==="newItems" ? "الحفظ الجديد" : "المراجعة";
  const icon  = field==="newItems" ? "📗" : "🔄";

  return (
    <div style={{background:"#0f1923",border:"1px solid #2a3a50",borderRadius:10,padding:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
        <div style={{color:"#c9a84c",fontSize:12,fontWeight:700}}>{icon} {label}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button type="button" className={`tog ${isNone?"on":""}`} onClick={()=>setNone(!isNone)}>لا يوجد</button>
          {field==="newItems" && (
            <button type="button" className={`tog ${isNotMem?"on-o":""}`} onClick={()=>setNotMem(!isNotMem)}>لم يحفظ</button>
          )}
          {!isNone&&!isNotMem && (
            <button type="button" onClick={addItem} style={{background:"rgba(201,168,76,.12)",border:"1px solid rgba(201,168,76,.3)",color:"#c9a84c",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:12}}>+ سورة</button>
          )}
        </div>
      </div>
      {isNone   && <div style={{fontSize:12,color:"#e05c5c",padding:"4px 0"}}>لا يوجد {label}</div>}
      {isNotMem && <div style={{fontSize:12,color:"#e8a84c",padding:"4px 0"}}>لم يحفظ في هذه الجلسة</div>}
      {!isNone&&!isNotMem&&sessForm[field].length===0&&(
        <div style={{fontSize:11,color:"#6a8090",padding:"4px 0"}}>اضغط "+ سورة" لإضافة</div>
      )}
      {!isNone&&!isNotMem&&sessForm[field].map((it,idx)=>(
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
<h1>مركز الإتقان لتحفيظ القرآن الكريم</h1>
<div class="sub">التقرير الشهري: ${mDisp} | الإصدار: ${today}</div>
<div class="sec"><h3>بيانات الطالب</h3><div class="g2">
  <div class="fld"><div class="k">الاسم</div><div class="v">${student.name}</div></div>
  <div class="fld"><div class="k">ولي الأمر</div><div class="v">${student.guardian||"—"}</div></div>
  <div class="fld"><div class="k">رقم التواصل</div><div class="v">${student.guardianPhone||"—"}</div></div>
  <div class="fld"><div class="k">اشتراك ${mDisp}</div><div class="v" style="color:${paid?"#2d7a4f":"#c0392b"}">${paid?"✓ مدفوع":"✗ غير مدفوع"}</div></div>
  <div class="fld"><div class="k">تاريخ الالتحاق</div><div class="v">${student.joinDate?toAr(student.joinDate):"—"}</div></div>
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

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [sec,         setSec]         = useState(() => LS.get("itq_last_sec","male"));
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
    setSessions(p=>[...p,{...sessForm,studentId:Number(sessForm.studentId),id:Date.now()}]);
    setShowAddSess(false); setSessForm(mkSession());
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
        {showAddSess&&<SessModal students={students} sessForm={sessForm} setSessForm={setSessForm} onSave={addSession} onClose={()=>setShowAddSess(false)}/>}
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
        {showAddSess&&<SessModal students={students} sessForm={sessForm} setSessForm={setSessForm} onSave={addSession} onClose={()=>setShowAddSess(false)}/>}
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
      <div style={{background:"linear-gradient(135deg,#1a2535,#0f1923)",borderBottom:"1px solid #2a3a50",padding:"13px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:24}}>🕌</div>
          <div>
            <div style={{fontFamily:"'Amiri',serif",fontSize:18,color:"#c9a84c"}}>مركز الإتقان · متابعة الحلقات</div>
            <div style={{fontSize:11,color:"#6a8090"}}>تحفيظ القرآن الكريم</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,color:"#6a8090"}}>الشهر:</span>
            <input type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{width:145,padding:"5px 8px",fontSize:12}}/>
          </div>
          {syncing&&<span style={{fontSize:11,color:"#4caf7d"}}>⏳ حفظ...</span>}
          <div style={{display:"flex",background:"#0f1923",border:"1px solid #2a3a50",borderRadius:10,padding:3,gap:3}}>
            <button onClick={()=>setSec("male")} style={{padding:"5px 14px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:sec==="male"?"linear-gradient(135deg,#3b82f6,#2563eb)":"transparent",color:sec==="male"?"#fff":"#6a8090",transition:"all .2s"}}>👦 الذكور</button>
            <button onClick={()=>setSec("female")} style={{padding:"5px 14px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:sec==="female"?"linear-gradient(135deg,#ec4899,#db2777)":"transparent",color:sec==="female"?"#fff":"#6a8090",transition:"all .2s"}}>👧 الإناث</button>
          </div>
        </div>
      </div>

      <div style={{display:"flex",minHeight:"calc(100vh - 60px)"}}>
        {/* Sidebar */}
        <div style={{width:178,background:"#141e2b",borderLeft:"1px solid #2a3a50",padding:"14px 10px",flexShrink:0}}>
          <div style={{margin:"0 0 12px 0",padding:"8px 10px",borderRadius:7,background:sc.bg,border:`1px solid ${sc.br}`,fontSize:12,fontWeight:700,color:sc.c,textAlign:"center"}}>{sc.lbl}</div>
          {[{k:"dashboard",i:"📊",l:"لوحة التحكم"},{k:"students",i:"👥",l:"الطلبة"},{k:"sessions",i:"📖",l:"الحصص"},{k:"attendance",i:"📅",l:"أيام التدريس"},{k:"reports",i:"📋",l:"التقارير"}].map(x=>(
            <div key={x.k} className={`nav ${page===x.k?"on":""}`} onClick={()=>setPage(x.k)}>{x.i} {x.l}</div>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,padding:20,overflowY:"auto"}}>

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
            <div style={{display:"grid",gap:9}}>
              {[...sessions].reverse().map(s=>{
                const st=students.find(x=>x.id===s.studentId);
                return (
                  <div key={s.id} className="card" style={{padding:13}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:7}}>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <span className={`bx ${s.present?"bx-g":"bx-r"}`}>{s.present?"حاضر":"غائب"}</span>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:"#c9a84c",cursor:"pointer"}} onClick={()=>setDetailSt(st)}>{st?.name}</div>
                          <div style={{fontSize:10,color:"#6a8090"}}>{toAr(s.date)}</div>
                        </div>
                      </div>
                      {s.notMemorized&&<span className="bx bx-o">لم يحفظ</span>}
                    </div>
                    {s.present&&<SessDetails s={s}/>}
                  </div>
                );
              })}
            </div>
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
      {showAddSess&&<SessModal students={students} sessForm={sessForm} setSessForm={setSessForm} onSave={addSession} onClose={()=>setShowAddSess(false)}/>}
      {editSt&&<EditModal editSt={editSt} setEditSt={setEditSt} onSave={saveEdit} filterMonth={filterMonth} toArShort={toArShort}/>}
      {reportSt&&<ReportModal student={reportSt} sessions={sessions} sc={sc} filterMonth={filterMonth} onClose={()=>setReportSt(null)} onExportPDF={(s,l)=>buildAndPrintPDF(s,sessions,sc,filterMonth,l)}/>}
    </div>
  );
}
