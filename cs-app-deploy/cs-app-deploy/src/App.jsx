import { useState, useEffect, useRef, useCallback } from "react";

var CARR = [
  {id:"usps",name:"USPS",contact:"1-800-275-8777",lk:"https://tools.usps.com/go/TrackConfirmAction?tLabels={t}",pt:["^9[2-5]\\d{20,}$"]},
  {id:"ups",name:"UPS",contact:"1-800-742-5877",lk:"https://www.ups.com/track?tracknum={t}",pt:["^1Z[A-Z0-9]{16}$"]},
  {id:"fedex",name:"FedEx",contact:"1-800-463-3339",lk:"https://www.fedex.com/fedextrack/?trknbr={t}",pt:["^\\d{12}$","^\\d{15}$"]},
  {id:"dhl",name:"DHL",contact:"1-800-225-5345",lk:"https://www.dhl.com/en/express/tracking.html?AWB={t}",pt:["^\\d{10}$"]},
  {id:"4px",name:"4PX",contact:"4px.com",lk:"https://track.4px.com/#/result/0/{t}",pt:["^4PX\\w+$"]},
  {id:"yun",name:"YunExpress",contact:"yunexpress.com",lk:"https://www.yuntrack.com/track/detail?id={t}",pt:["^YT\\d{16}$"]}
];

function detC(t,list){
  if(!t||t.length<8)return null;
  var c=t.replace(/\s/g,"");
  for(var i=0;i<list.length;i++){
    var cr=list[i];
    var pts=cr.pt||[];
    for(var j=0;j<pts.length;j++){
      if(new RegExp(pts[j],"i").test(c))return{name:cr.name,contact:cr.contact,link:(cr.lk||"").replace("{t}",c),id:cr.id};
    }
  }
  return null;
}

var T={
ss:"Dear {customerName},\n\nThank you for reaching out regarding your order **{orderName}**.\n\nYour order has been shipped!\n\n**Carrier:** {carrier}\n**Tracking:** {trackingNumber}\n**Link:** {trackingLink}\n**ETA:** {estimatedDelivery}\n\nAllow **24-48 hours** for tracking to update.",
sp:"Dear {customerName},\n\nYour order **{orderName}** is being processed. You will receive tracking info once shipped.\n\nProcessing: **3-7 business days**.",
sd:"Dear {customerName},\n\nYour order **{orderName}** was delivered on **{estimatedDelivery}**.\n\n**Carrier:** {carrier} | **Tracking:** {trackingNumber}\n\nIf not received, contact **{carrier}** at **{carrierContact}**.",
ec:"Dear {customerName},\n\nRequest for **{orderName}**: {customDetail}.\n\nWe can make this change. No further action needed.",
en:"Dear {customerName},\n\nOrder **{orderName}** has entered production. We cannot make changes.\n\nPlease reply to discuss options.",
au:"Dear {customerName},\n\nAddress for **{orderName}** updated to:\n\n**{newAddress}**",
as:"Dear {customerName},\n\nOrder **{orderName}** already shipped to:\n{oldAddress}\n\nContact carrier to redirect.",
oe:"Dear {customerName},\n\nThe item is free - you only pay **shipping and handling** for packaging and delivery. This was shown at checkout.",
cw:"Dear {customerName},\n\nBefore cancelling **{orderName}** - is there anything we can help with?\n\nPlease reply with details or confirm cancellation.",
cc:"Dear {customerName},\n\nOrder **{orderName}** cancelled. Refund of **{refundAmount}** initiated. Allow **5-10 business days**.",
cx:"Dear {customerName},\n\nOrder **{orderName}** has shipped and cannot be cancelled. Refuse delivery for full refund of **{refundAmount}**.",
ip:"Dear {customerName},\n\nWe need to verify your address for **{orderName}**:\n{currentAddress}\n\nReply with complete address within **{deadline}**.",
ir:"Dear {customerName},\n\nOrder **{orderName}** returned due to address issues:\n{currentAddress}\n\nReply with corrected address within **{deadline}**.",
ic:"Dear {customerName},\n\n**{carrier}** could not deliver **{orderName}**: {addressIssue}.\n\n**Contact:** {carrierContact} | **Tracking:** {trackingNumber}\n\nAct within **5 business days**.",
og:"Dear {customerName},\n\nThank you for reaching out.\n\n{responseDetails}",
fa:"Dear {customerName},\n\nFollow-up on **{orderName}**: we previously requested your address but have not heard back.\n\nPlease reply to avoid cancellation.",
fc:"Dear {customerName},\n\nFollow-up on **{orderName}**: have you reached **{carrier}** at **{carrierContact}** for pickup?\n\nTracking: **{trackingNumber}**.",
fe:"Dear {customerName},\n\nFollow-up on **{orderName}**: we are awaiting your response on the customization issue.\n\nPlease reply so we can finalize your order."
};

var SC={
  shipping:{l:"Shipping / status",e:"\u{1F4E6}",p:"~90%",
    f:[{k:"customerName",l:"Customer",r:1,ac:1},{k:"orderName",l:"Order #",r:1},{k:"trackingNumber",l:"Tracking #",tc:1},{k:"trackingLink",l:"Link",af:1},{k:"carrier",l:"Carrier",cs:1},{k:"carrierContact",l:"Contact",af:1},{k:"estimatedDelivery",l:"ETA"}],
    v:[{n:"Shipped",t:"ss"},{n:"Processing",t:"sp"},{n:"Delivered",t:"sd"}]},
  edit:{l:"Edit custom",e:"\u{1F3A8}",
    f:[{k:"customerName",l:"Customer",r:1,ac:1},{k:"orderName",l:"Order #",r:1},{k:"customDetail",l:"Change",ml:1}],
    v:[{n:"Can modify",t:"ec"},{n:"Cannot",t:"en"},{n:"Follow-up",t:"fe"}]},
  addr:{l:"Change address",e:"\u{1F4CD}",
    f:[{k:"customerName",l:"Customer",r:1,ac:1},{k:"orderName",l:"Order #",r:1},{k:"oldAddress",l:"Old",ml:1},{k:"newAddress",l:"New",ml:1}],
    v:[{n:"Updated",t:"au"},{n:"Shipped",t:"as"}]},
  offer:{l:"Offer complaint",e:"\u{1F4AC}",
    f:[{k:"customerName",l:"Customer",r:1,ac:1},{k:"orderName",l:"Order(opt)"}],
    v:[{n:"Explain",t:"oe"}]},
  cancel:{l:"Cancel order",e:"\u274C",
    f:[{k:"customerName",l:"Customer",r:1,ac:1},{k:"orderName",l:"Order #",r:1},{k:"refundAmount",l:"Refund"}],
    v:[{n:"Ask why",t:"cw"},{n:"Confirmed",t:"cc"},{n:"Cannot",t:"cx"}]},
  iaddr:{l:"Issue: address",e:"\u26A0\uFE0F",
    f:[{k:"customerName",l:"Customer",r:1,ac:1},{k:"orderName",l:"Order #",r:1},{k:"currentAddress",l:"Address",ml:1},{k:"deadline",l:"Deadline"}],
    v:[{n:"Pre-prod",t:"ip"},{n:"Returned",t:"ir"},{n:"Follow-up",t:"fa"}]},
  icarr:{l:"Issue: carrier",e:"\u{1F69A}",
    f:[{k:"customerName",l:"Customer",r:1,ac:1},{k:"orderName",l:"Order #",r:1},{k:"trackingNumber",l:"Tracking",tc:1},{k:"carrier",l:"Carrier",cs:1},{k:"carrierContact",l:"Contact",af:1},{k:"addressIssue",l:"Issue",ml:1}],
    v:[{n:"Contact",t:"ic"},{n:"Follow-up",t:"fc"}]},
  other:{l:"Other",e:"\u{1F4A1}",
    f:[{k:"customerName",l:"Customer",r:1,ac:1},{k:"orderName",l:"Order(opt)"},{k:"responseDetails",l:"Response",ml:1}],
    v:[{n:"General",t:"og"}]}
};

var H3=3*3600000;
function fill(t,d){return(t||"").replace(/\{(\w+)\}/g,function(_,k){return d[k]||""})}
function subj(sc,d){var o=d.orderName||"order";var m={shipping:"Re: "+o+" - Shipping",edit:"Re: "+o+" - Custom",addr:"Re: "+o+" - Address",offer:"Re: Inquiry",cancel:"Re: "+o+" - Cancel",iaddr:"Action: "+o+" - Address",icarr:"Action: "+o+" - Carrier",other:"Re: Inquiry"};return m[sc]||"Re: "+o}
function plain(t){return(t||"").replace(/\*\*(.*?)\*\*/g,"$1")}
function rB(t){if(!t)return null;return t.split(/(\*\*.*?\*\*)/g).map(function(p,i){if(p.startsWith("**")&&p.endsWith("**"))return <strong key={i}>{p.slice(2,-2)}</strong>;return <span key={i}>{p}</span>})}
function ago(ts){var m=Math.floor((Date.now()-new Date(ts).getTime())/60000);if(m<1)return"now";if(m<60)return m+"m";return Math.floor(m/60)+"h"}

function CB(props){
  var _a = useState(false), ok = _a[0], set = _a[1];
  return <button onClick={function(){navigator.clipboard.writeText(props.text).catch(function(){});set(true);setTimeout(function(){set(false)},1500)}} style={{background:ok?"#10b981":"#6366f1",color:"#fff",border:"none",borderRadius:7,padding:props.sm?"3px 7px":"5px 10px",cursor:"pointer",fontSize:props.sm?10:11,fontWeight:600}}>{ok?"\u2713":props.label}</button>;
}

function B(props){
  var bg=props.active?"#6366f1":props.color||"var(--color-background-secondary)";
  var clr=props.active||props.color?"#fff":"var(--color-text-secondary)";
  var bdr=props.active||props.color?bg:"var(--color-border-tertiary)";
  return <button onClick={props.onClick} style={{background:bg,color:clr,border:"1px solid "+bdr,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:500,display:"inline-flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>{props.children}</button>;
}

function C(props){
  var base={background:"var(--color-background-primary)",border:"1px solid var(--color-border-tertiary)",borderRadius:10,padding:12};
  var st=props.st||{};
  return <div style={Object.assign({},base,st)}>{props.children}</div>;
}

function Lb(props){return <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:.7,color:"var(--color-text-tertiary)",marginBottom:4}}>{props.children}</div>}
function Bg(props){return <span style={{fontSize:9,padding:"2px 6px",borderRadius:6,background:props.bg||"rgba(99,102,241,.1)",color:props.bg?"#fff":"#6366f1",fontWeight:600}}>{props.children}</span>}

function ID(props){
  var ref=useRef(null);
  var onP=useCallback(function(e){
    var items=e.clipboardData&&e.clipboardData.items?e.clipboardData.items:[];
    for(var i=0;i<items.length;i++){
      if(items[i].type.indexOf("image")===0){
        e.preventDefault();var r=new FileReader();r.onload=function(){props.onImage(r.result)};r.readAsDataURL(items[i].getAsFile());return;
      }
    }
  },[props.onImage]);
  return <div onPaste={onP} tabIndex={0} onClick={function(){if(!props.image&&ref.current)ref.current.click()}} style={{border:"2px dashed var(--color-border-secondary)",borderRadius:8,padding:props.image?0:12,textAlign:"center",cursor:"pointer",background:"var(--color-background-secondary)",minHeight:props.image?"auto":44,outline:"none",overflow:"hidden"}}>
    <input ref={ref} type="file" accept="image/*" onChange={function(e){var f=e.target.files&&e.target.files[0];if(f){var r=new FileReader();r.onload=function(){props.onImage(r.result)};r.readAsDataURL(f)}}} style={{display:"none"}}/>
    {props.image?<div style={{position:"relative"}}><img src={props.image} alt="" style={{width:"100%",display:"block",borderRadius:6}}/><button onClick={function(e){e.stopPropagation();props.onImage(null)}} style={{position:"absolute",top:3,right:3,background:"rgba(0,0,0,.6)",color:"#fff",border:"none",borderRadius:5,width:18,height:18,cursor:"pointer",fontSize:12}}>x</button></div>:<div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>Click or Ctrl+V</div>}
  </div>;
}

export default function App(){
  var _v=useState("full"),v=_v[0],setV=_v[1];
  var _sc=useState("shipping"),sc=_sc[0],setSc=_sc[1];
  var _vr=useState(0),vr=_vr[0],setVr=_vr[1];
  var _fm=useState({}),fm=_fm[0],setFm=_fm[1];
  var _sig=useState("\n---\nBest regards,\nBRAVE Team"),sig=_sig[0],setSig=_sig[1];
  var _sI=useState(null),sI=_sI[0],setSI=_sI[1];
  var _eS=useState(null),eS=_eS[0],setES=_eS[1];
  var _pn=useState(null),pn=_pn[0],setPn=_pn[1];
  var _pt=useState(""),pt=_pt[0],setPt=_pt[1];
  var _hi=useState([]),hi=_hi[0],setHi=_hi[1];
  var _tp=useState(Object.assign({},T)),tp=_tp[0],setTp=_tp[1];
  var _eT=useState(null),eT=_eT[0],setET=_eT[1];
  var _eTx=useState(""),eTx=_eTx[0],setETx=_eTx[1];
  var _qf=useState({n:"",o:"",t:"",e:""}),qf=_qf[0],setQf=_qf[1];
  var _cu=useState([]),cu=_cu[0],setCu=_cu[1];
  var _cD=useState(false),cD=_cD[0],setCD=_cD[1];
  var _ca=useState(CARR),ca=_ca[0],setCa=_ca[1];
  var _aO=useState(false),aO=_aO[0],setAO=_aO[1];
  var _aP=useState(""),aP=_aP[0],setAP=_aP[1];
  var _aR=useState(""),aR=_aR[0],setAR=_aR[1];
  var _aL=useState(false),aL=_aL[0],setAL=_aL[1];
  var _re=useState([]),re=_re[0],setRe=_re[1];
  var _fr=useState(0),fr=_fr[1];

  var s=SC[sc];
  var sv2=vr<s.v.length?vr:0;
  var vt=s.v[sv2];
  var tt=tp[vt.t]||T[vt.t]||"";

  useEffect(function(){setFm({});setVr(0);setCD(false);setAO(false);setAR("")},[sc]);
  useEffect(function(){
    (async function(){
      var g=async function(k){try{var r=await window.storage.get(k);return r&&r.value?r.value:null}catch(e){return null}};
      var a=await g("v7s");if(a)setSig(a);
      var b=await g("v7i");if(b)setSI(b);
      var c=await g("v7h");if(c)setHi(JSON.parse(c));
      var d=await g("v7t");if(d)setTp(Object.assign({},T,JSON.parse(d)));
      var e=await g("v7c");if(e)setCu(JSON.parse(e));
      var f=await g("v7a");if(f)setCa(JSON.parse(f));
      var h=await g("v7r");if(h){var p=JSON.parse(h);var now=Date.now();setRe(p.filter(function(x){return now-new Date(x.d).getTime()<H3}))}
    })()
  },[]);
  useEffect(function(){var i=setInterval(function(){setRe(function(p){var now=Date.now();var v2=p.filter(function(x){return now-new Date(x.d).getTime()<H3});if(v2.length!==p.length)sv("v7r",v2);return v2});fr(function(n){return n+1})},30000);return function(){clearInterval(i)}},[]);

  var sv=async function(k,val){try{await window.storage.set(k,typeof val==="string"?val:JSON.stringify(val))}catch(e){}};
  var ok=s.f.filter(function(f){return f.r}).every(function(f){return fm[f.k]&&fm[f.k].trim()});
  var body=ok?fill(tt,fm):"";
  var su=ok?subj(sc,fm):"";
  var fB=body?plain(body)+"\n"+sig:"";
  var fS=su?plain(su):"";
  var qD=detC(qf.t,ca);
  var qDt={customerName:qf.n,orderName:qf.o,trackingNumber:qf.t||"N/A",carrier:qD?qD.name:"N/A",carrierContact:qD?qD.contact:"",trackingLink:qD?qD.link:"",estimatedDelivery:qf.e||"Check tracking"};
  var qO=qf.n.trim()&&qf.o.trim();
  var qB=qO?plain(fill(tp.ss,qDt))+"\n"+sig:"";
  var qS=qO?"Re: "+qf.o+" - Shipping":"";

  var addE=async function(su2,bo,cn,or,sn){
    var entry={id:Date.now(),d:new Date().toISOString(),s:sn,su:su2,bo:bo,c:cn,o:or};
    var now=Date.now();
    var up=[entry].concat(re).filter(function(x){return now-new Date(x.d).getTime()<H3});
    setRe(up);sv("v7r",up);
    var he={id:Date.now(),date:new Date().toISOString(),scenario:sn,subject:su2,customer:cn,order:or};
    var uh=[he].concat(hi).slice(0,300);setHi(uh);sv("v7h",uh);
    if(cn){
      var ex=cu.find(function(c){return c.name.toLowerCase()===cn.toLowerCase()});
      var up2;
      if(ex){up2=cu.map(function(c){return c.name.toLowerCase()===cn.toLowerCase()?Object.assign({},c,{lo:or||c.lo,ct:(c.ct||1)+1}):c})}
      else{up2=[{id:Date.now(),name:cn,lo:or||"",ct:1}].concat(cu).slice(0,500)}
      setCu(up2);sv("v7c",up2);
    }
  };

  var doAI=async function(){
    if(!aP.trim())return;setAL(true);setAR("");
    try{
      var ctx=ok?"Customer: "+fm.customerName+", Order: "+(fm.orderName||"N/A")+", Type: "+s.l:"No context";
      var r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:"CS email writer for BRAVE store. Formal, concise, bold **key info**. No subject/signature.\n\nContext: "+ctx+"\nTask: "+aP}]})});
      var d=await r.json();
      var txt=d.content?d.content.map(function(c){return c.text||""}).join(""):"Error";
      setAR(txt);
    }catch(e){setAR("Error.")}setAL(false)
  };

  var det=function(){var b=null,bc=0;var kw={shipping:["tracking","where is my order","shipped"],edit:["change design","edit","custom"],addr:["address","wrong address"],offer:["free","shipping and handling"],cancel:["cancel","refund"],iaddr:["incorrect address","returned"],icarr:["pickup","redelivery"]};Object.keys(kw).forEach(function(k){var c=kw[k].filter(function(w){return pt.toLowerCase().indexOf(w)>=0}).length;if(c>bc){b=k;bc=c}});if(b){setSc(b);setPn(null);setPt("");setV("full")}};

  var hT=function(val){var u=Object.assign({},fm,{trackingNumber:val});var d=detC(val,ca);if(d){u.carrier=d.name;u.carrierContact=d.contact;u.trackingLink=d.link}setFm(u)};
  var pC=function(id){var c=ca.find(function(x){return x.id===id});if(c){setFm(function(p){return Object.assign({},p,{carrier:c.name,carrierContact:c.contact,trackingLink:fm.trackingNumber?(c.lk||"").replace("{t}",fm.trackingNumber):""})})}};
  var fC=(fm.customerName||"").length>=1?cu.filter(function(c){return c.name.toLowerCase().indexOf((fm.customerName||"").toLowerCase())>=0}).slice(0,6):[];

  useEffect(function(){
    var h=function(e){
      if(!(e.ctrlKey||e.metaKey))return;
      if(e.key==="1"){e.preventDefault();navigator.clipboard.writeText(v==="quick"?qS:fS).catch(function(){})}
      else if(e.key==="2"){e.preventDefault();navigator.clipboard.writeText(v==="quick"?qB:fB).catch(function(){})}
      else if(e.key==="Enter"){e.preventDefault();if(v==="quick"&&qO)addE(qS,qB,qf.n,qf.o,"Quick");else if(ok)addE(fS,fB,fm.customerName,fm.orderName,s.l)}
    };window.addEventListener("keydown",h);return function(){window.removeEventListener("keydown",h)}
  });

  var gr={};re.forEach(function(x){if(!gr[x.s])gr[x.s]=[];gr[x.s].push(x)});

  var ist={width:"100%",background:"var(--color-background-secondary)",border:"1px solid var(--color-border-tertiary)",borderRadius:7,padding:"6px 8px",color:"var(--color-text-primary)",fontSize:12,boxSizing:"border-box",fontFamily:"inherit"};

  var rF=function(f){
    var lb=<label style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:2,display:"flex",gap:3,alignItems:"center"}}>{f.l}{f.r?<span style={{color:"#ef4444",fontSize:9}}>*</span>:null}{f.tc&&fm.trackingNumber&&detC(fm.trackingNumber,ca)?<Bg bg="#10b981">auto</Bg>:null}</label>;
    if(f.cs){
      var selVal="";
      var found=ca.find(function(c){return c.name===fm[f.k]});
      if(found)selVal=found.id;
      return <div key={f.k}>{lb}<select value={selVal} onChange={function(e){pC(e.target.value)}} style={ist}><option value="">Select carrier...</option>{ca.map(function(c){return <option key={c.id} value={c.id}>{c.name} - {c.contact}</option>})}</select></div>;
    }
    if(f.ac)return <div key={f.k} style={{position:"relative"}}>{lb}<input value={fm[f.k]||""} onChange={function(e){var u=Object.assign({},fm);u[f.k]=e.target.value;setFm(u);setCD(true)}} onFocus={function(){setCD(true)}} placeholder="Search saved..." style={ist}/>{cD&&fC.length>0?<div style={{position:"absolute",top:"100%",left:0,right:0,background:"var(--color-background-primary)",border:"1px solid var(--color-border-tertiary)",borderRadius:7,zIndex:10,maxHeight:140,overflowY:"auto",boxShadow:"0 4px 12px rgba(0,0,0,.1)"}}>{fC.map(function(c){return <div key={c.id} onClick={function(){var u=Object.assign({},fm,{customerName:c.name});setFm(u);setCD(false)}} style={{padding:"5px 10px",cursor:"pointer",borderBottom:"1px solid var(--color-border-tertiary)",fontSize:11,display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:500}}>{c.name}</span><span style={{color:"var(--color-text-tertiary)"}}>{c.ct}x</span></div>})}</div>:null}</div>;
    if(f.af)return <div key={f.k}>{lb}<input value={fm[f.k]||""} onChange={function(e){var u=Object.assign({},fm);u[f.k]=e.target.value;setFm(u)}} placeholder="Auto-filled" style={Object.assign({},ist,{background:"var(--color-background-info)"})}/></div>;
    if(f.ml)return <div key={f.k}>{lb}<textarea value={fm[f.k]||""} onChange={function(e){if(f.tc){hT(e.target.value)}else{var u=Object.assign({},fm);u[f.k]=e.target.value;setFm(u)}}} rows={2} style={Object.assign({},ist,{resize:"vertical"})}/></div>;
    return <div key={f.k}>{lb}<input value={fm[f.k]||""} onChange={function(e){if(f.tc){hT(e.target.value)}else{var u=Object.assign({},fm);u[f.k]=e.target.value;setFm(u)}}} style={ist}/></div>;
  };

  var RB=re.length===0?null:<C st={{marginTop:12,borderColor:"rgba(99,102,241,.2)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <Lb>Recent ({re.length}) - clears 3h</Lb>
      <B color="#ef4444" onClick={function(){setRe([]);sv("v7r",[])}}>Clear</B>
    </div>
    {Object.keys(gr).map(function(k){return <div key={k} style={{marginBottom:8}}>
      <div style={{display:"flex",gap:4,marginBottom:4}}><Bg>{k}</Bg><span style={{fontSize:10,color:"var(--color-text-tertiary)"}}>({gr[k].length})</span></div>
      {gr[k].map(function(em){return <div key={em.id} style={{background:"var(--color-background-secondary)",borderRadius:7,padding:"6px 8px",marginBottom:3,border:"1px solid var(--color-border-tertiary)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
          <div style={{fontSize:11,display:"flex",gap:5,alignItems:"center"}}><span style={{fontWeight:500}}>{em.c}</span><span style={{color:"var(--color-text-tertiary)",fontSize:10}}>{em.o}</span><span style={{fontSize:9,color:"var(--color-text-tertiary)"}}>{ago(em.d)}</span></div>
          <div style={{display:"flex",gap:2}}><CB text={em.su} label="Subj" sm={true}/><CB text={em.bo} label="Body" sm={true}/></div>
        </div>
        <details><summary style={{fontSize:10,color:"var(--color-text-tertiary)",cursor:"pointer"}}>{em.su}</summary><div style={{marginTop:3,fontSize:11,color:"var(--color-text-secondary)",whiteSpace:"pre-wrap",lineHeight:1.4,maxHeight:100,overflowY:"auto"}}>{em.bo}</div></details>
      </div>})}
    </div>})}
  </C>;

  return <div style={{fontFamily:"var(--font-sans)",color:"var(--color-text-primary)",minHeight:"100vh",background:"var(--color-background-tertiary)"}} onClick={function(){setCD(false)}}>
    <div style={{padding:"8px 12px",borderBottom:"1px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:15}}>{"\u2709"}</span>
        <div><div style={{fontSize:13,fontWeight:500}}>CS Email Gen <Bg>v7</Bg></div><div style={{fontSize:9,color:"var(--color-text-tertiary)"}}>^1 subj | ^2 body | ^Enter save</div></div>
        {re.length>0?<Bg bg="#6366f1">{re.length}</Bg>:null}
      </div>
      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
        <B color={v==="quick"?"#f59e0b":null} active={v==="quick"} onClick={function(){setV(v==="quick"?"full":"quick");setPn(null)}}>{"\u26A1"}Quick</B>
        <B active={v==="dash"} onClick={function(){setV(v==="dash"?"full":"dash");setPn(null)}}>Stats</B>
        <B active={pn==="pa"} onClick={function(){setPn(pn==="pa"?null:"pa")}}>Paste</B>
        <B active={pn==="si"} onClick={function(){setPn(pn==="si"?null:"si")}}>Sig</B>
        <B active={pn==="tp"} onClick={function(){setPn(pn==="tp"?null:"tp")}}>Tpl</B>
        <B active={pn==="cr"} onClick={function(){setPn(pn==="cr"?null:"cr")}}>{"\u{1F69A}"}</B>
        <B active={pn==="cu"} onClick={function(){setPn(pn==="cu"?null:"cu")}}>{"\u{1F465}"}{cu.length}</B>
        <B active={pn==="hi"} onClick={function(){setPn(pn==="hi"?null:"hi")}}>H{hi.length}</B>
      </div>
    </div>

    {pn==="pa"?<C st={{borderRadius:0,display:"flex",gap:10,flexWrap:"wrap"}}><div style={{flex:1,minWidth:180}}><Lb>Paste email</Lb><textarea value={pt} onChange={function(e){setPt(e.target.value)}} rows={3} style={Object.assign({},ist,{resize:"vertical"})}/><div style={{display:"flex",gap:3,marginTop:4}}><B color="#6366f1" onClick={det}>Detect</B><B onClick={function(){setPn(null)}}>Close</B></div></div><div style={{flex:1,minWidth:140}}><Lb>Screenshot</Lb><ID label="Paste or upload" image={eS} onImage={setES}/></div></C>:null}
    {pn==="si"?<C st={{borderRadius:0,display:"flex",gap:10,flexWrap:"wrap"}}><div style={{flex:1,minWidth:180}}><Lb>Signature</Lb><textarea value={sig} onChange={function(e){setSig(e.target.value);sv("v7s",e.target.value)}} rows={3} style={Object.assign({},ist,{fontSize:11,fontFamily:"var(--font-mono)",resize:"vertical"})}/></div><div style={{flex:1,minWidth:130}}><Lb>Image</Lb><ID label="Logo" image={sI} onImage={function(x){setSI(x);sv("v7i",x||"")}}/></div><B onClick={function(){setPn(null)}}>Close</B></C>:null}
    {pn==="tp"?<C st={{borderRadius:0}}>{eT?<div><div style={{fontSize:12,fontWeight:500,color:"#6366f1",marginBottom:3}}>{eT}</div><textarea value={eTx} onChange={function(e){setETx(e.target.value)}} rows={7} style={Object.assign({},ist,{fontSize:11,fontFamily:"var(--font-mono)",lineHeight:"1.4",resize:"vertical"})}/><div style={{display:"flex",gap:3,marginTop:4}}><B color="#6366f1" onClick={function(){var u=Object.assign({},tp);u[eT]=eTx;setTp(u);sv("v7t",u);setET(null)}}>Save</B><B onClick={function(){setETx(T[eT]||"")}}>Reset</B><B onClick={function(){setET(null)}}>Cancel</B></div></div>:<div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{Object.keys(tp).map(function(k){return <B key={k} onClick={function(){setET(k);setETx(tp[k])}}>{k}</B>})}<B onClick={function(){setPn(null)}}>Close</B></div>}</C>:null}
    {pn==="cr"?<C st={{borderRadius:0}}><Lb>Carriers</Lb>{ca.map(function(c,i){return <div key={c.id} style={{display:"flex",gap:3,marginBottom:3}}><input value={c.name} onChange={function(e){var u=ca.slice();u[i]=Object.assign({},u[i],{name:e.target.value});setCa(u);sv("v7a",u)}} style={{width:70,background:"var(--color-background-secondary)",border:"1px solid var(--color-border-tertiary)",borderRadius:6,padding:"3px 5px",fontSize:11,color:"var(--color-text-primary)",fontWeight:500}}/><input value={c.contact} onChange={function(e){var u=ca.slice();u[i]=Object.assign({},u[i],{contact:e.target.value});setCa(u);sv("v7a",u)}} style={{flex:1,background:"var(--color-background-secondary)",border:"1px solid var(--color-border-tertiary)",borderRadius:6,padding:"3px 5px",fontSize:11,color:"var(--color-text-primary)"}}/><B color="#ef4444" onClick={function(){var u=ca.filter(function(_,j){return j!==i});setCa(u);sv("v7a",u)}}>X</B></div>})}<div style={{display:"flex",gap:3,marginTop:3}}><B color="#6366f1" onClick={function(){var u=ca.concat([{id:"c"+Date.now(),name:"New",contact:"",lk:"",pt:[]}]);setCa(u);sv("v7a",u)}}>+Add</B><B onClick={function(){setCa(CARR);sv("v7a",CARR)}}>Reset</B><B onClick={function(){setPn(null)}}>Close</B></div></C>:null}
    {pn==="cu"?<C st={{borderRadius:0,maxHeight:180,overflowY:"auto"}}><Lb>Customers ({cu.length})</Lb>{cu.slice(0,25).map(function(c){return <div key={c.id} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",borderBottom:"1px solid var(--color-border-tertiary)",fontSize:11}}><span style={{fontWeight:500}}>{c.name}</span><span style={{color:"var(--color-text-tertiary)"}}>{c.ct}x|{c.lo}</span></div>})}<div style={{display:"flex",gap:3,marginTop:3}}><B color="#ef4444" onClick={function(){setCu([]);sv("v7c",[])}}>Clear</B><B onClick={function(){setPn(null)}}>Close</B></div></C>:null}
    {pn==="hi"?<C st={{borderRadius:0,maxHeight:180,overflowY:"auto"}}><Lb>History ({hi.length})</Lb>{hi.slice(0,25).map(function(h){return <div key={h.id} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",borderBottom:"1px solid var(--color-border-tertiary)",fontSize:11}}><div><span style={{fontWeight:500}}>{h.customer}</span> - {h.scenario}</div><span style={{color:"var(--color-text-tertiary)"}}>{new Date(h.date).toLocaleDateString()}</span></div>})}<B onClick={function(){setPn(null)}}>Close</B></C>:null}

    {v==="dash"?<div style={{padding:14,maxWidth:700,margin:"0 auto"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>{[{l:"Today",n:hi.filter(function(h){return h.date&&h.date.indexOf(new Date().toISOString().split("T")[0])===0}).length,c:"#6366f1"},{l:"Week",n:hi.filter(function(h){return new Date(h.date)>=new Date(Date.now()-604800000)}).length,c:"#10b981"},{l:"Total",n:hi.length,c:"#8b5cf6"}].map(function(x){return <C key={x.l} st={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:600,color:x.c,fontFamily:"var(--font-mono)"}}>{x.n}</div><div style={{fontSize:10,color:"var(--color-text-tertiary)",textTransform:"uppercase"}}>{x.l}</div></C>})}</div></div>:null}

    {v==="quick"?<div style={{padding:14,maxWidth:660,margin:"0 auto"}}>
      <C st={{marginBottom:10,background:"rgba(245,158,11,.06)",borderColor:"rgba(245,158,11,.2)"}}><div style={{fontSize:11,fontWeight:500,color:"#f59e0b"}}>{"\u26A1"} Quick shipping reply</div></C>
      {eS?<img src={eS} alt="" style={{width:"100%",maxWidth:400,borderRadius:7,border:"1px solid var(--color-border-tertiary)",marginBottom:10}}/>:null}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
        {[{l:"Customer*",k:"n"},{l:"Order#*",k:"o"},{l:"Tracking",k:"t"},{l:"ETA",k:"e"}].map(function(f){return <div key={f.k}><label style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",display:"flex",gap:3}}>{f.l}{f.k==="t"&&qD?<Bg bg="#10b981">auto:{qD.name}</Bg>:null}</label><input value={qf[f.k]} onChange={function(e){var u=Object.assign({},qf);u[f.k]=e.target.value;setQf(u)}} style={Object.assign({},ist,{background:"var(--color-background-primary)"})}/></div>})}
      </div>
      {qO?<div><C st={{marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><Lb>Subject</Lb><CB text={qS} label="Copy" sm={true}/></div><div style={{fontSize:13,fontWeight:500}}>{qS}</div></C><C><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><Lb>Body</Lb><div style={{display:"flex",gap:3}}><CB text={qB} label="Copy" sm={true}/><B color="#10b981" onClick={function(){addE(qS,qB,qf.n,qf.o,"Quick")}}>Save</B></div></div><div style={{fontSize:12,lineHeight:1.6,color:"var(--color-text-secondary)",whiteSpace:"pre-wrap"}}>{rB(fill(tp.ss,qDt))}{"\n"+sig}</div>{sI?<div style={{marginTop:8,borderTop:"1px solid var(--color-border-tertiary)",paddingTop:8}}><img src={sI} alt="" style={{maxWidth:180,borderRadius:5}}/></div>:null}</C></div>:null}
      {RB}
    </div>:null}

    {v==="full"?<div style={{display:"flex",minHeight:"calc(100vh - 46px)"}}>
      <div style={{width:290,minWidth:290,borderRight:"1px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",padding:10,overflowY:"auto"}} onClick={function(e){e.stopPropagation()}}>
        <Lb>Scenario</Lb>
        <div style={{display:"flex",flexDirection:"column",gap:1,marginBottom:8}}>{Object.keys(SC).map(function(k){var x=SC[k];return <B key={k} active={sc===k} onClick={function(){setSc(k)}}><span>{x.e}</span><span style={{flex:1}}>{x.l}</span>{x.p?<Bg>{x.p}</Bg>:null}</B>})}</div>
        {s.v.length>1?<div><Lb>Template</Lb><div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:8}}>{s.v.map(function(x,i){return <B key={i} active={sv2===i} onClick={function(){setVr(i)}}>{x.n}</B>})}</div></div>:null}
        <Lb>Details</Lb><div style={{display:"flex",flexDirection:"column",gap:5}}>{s.f.map(rF)}</div>
        <div style={{marginTop:12,borderTop:"1px solid var(--color-border-tertiary)",paddingTop:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}><Lb>AI gen</Lb><B active={aO} onClick={function(){setAO(!aO)}}>{"\u2728"}{aO?"On":"Off"}</B></div>
          {aO?<div><textarea value={aP} onChange={function(e){setAP(e.target.value)}} rows={3} placeholder="Describe situation..." style={Object.assign({},ist,{fontSize:11,resize:"vertical",marginBottom:5})}/><B color="#6366f1" onClick={doAI}>{aL?"...":"\u2728 Gen"}</B></div>:null}
        </div>
      </div>
      <div style={{flex:1,padding:12,overflowY:"auto",background:"var(--color-background-tertiary)"}}>
        {eS?<img src={eS} alt="" style={{width:"100%",maxWidth:420,borderRadius:7,border:"1px solid var(--color-border-tertiary)",marginBottom:10}}/>:null}
        {aO&&aR?<C st={{marginBottom:10,borderColor:"#6366f1"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><Lb>{"\u2728"} AI</Lb><div style={{display:"flex",gap:3}}><CB text={plain(aR)+"\n"+sig} label="Copy" sm={true}/><B color="#10b981" onClick={function(){addE("AI",plain(aR)+"\n"+sig,fm.customerName||"",fm.orderName||"","AI")}}>Save</B></div></div><div style={{fontSize:12,lineHeight:1.6,color:"var(--color-text-secondary)",whiteSpace:"pre-wrap"}}>{rB(aR)}{"\n"+sig}</div></C>:null}
        {!ok&&!aR?<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:180,flexDirection:"column",opacity:.3}}><span style={{fontSize:24}}>{"\u2709"}</span><div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>Fill required fields</div></div>:null}
        {ok?<div><C st={{marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><Lb>Subject</Lb><CB text={fS} label="Copy" sm={true}/></div><div style={{fontSize:13,fontWeight:500}}>{fS}</div></C><C><div style={{display:"flex",justifyContent:"space-between",marginBottom:5,flexWrap:"wrap",gap:3}}><Lb>Body</Lb><div style={{display:"flex",gap:3}}><CB text={fB} label="Copy" sm={true}/><B color="#10b981" onClick={function(){addE(fS,fB,fm.customerName,fm.orderName,s.l)}}>Save</B></div></div><div style={{fontSize:12,lineHeight:1.6,color:"var(--color-text-secondary)",whiteSpace:"pre-wrap"}}>{rB(body)}{"\n"+sig}</div>{sI?<div style={{marginTop:8,borderTop:"1px solid var(--color-border-tertiary)",paddingTop:8}}><img src={sI} alt="" style={{maxWidth:180,borderRadius:5}}/></div>:null}</C></div>:null}
        {RB}
      </div>
    </div>:null}
  </div>;
}
