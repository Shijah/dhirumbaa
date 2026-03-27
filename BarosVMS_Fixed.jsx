import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─── SUPABASE CLIENT ─── */
const SUPA_URL = "https://wcpbrbyiakwlnpwpelzi.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGJyYnlpYWt3bG5wd3BlbHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTg1OTgsImV4cCI6MjA5MDA5NDU5OH0.-ZCy1ZU70J772m6lZF_ltilGerN8EnFfhlDnQ9ZTJU4";
const db = createClient(SUPA_URL, SUPA_KEY);

const C = {
  sidebar:"#0b111f", bg:"#f0f4f8", card:"#fff",
  border:"#e2e8f0", borderLight:"#eef2f7",
  text:"#0f172a", mid:"#64748b", light:"#94a3b8",
  primary:"#0a6152", primaryLight:"#ecfdf5", primaryGlow:"rgba(10,97,82,.12)",
  gold:"#d97706", purple:"#7c3aed", green:"#16a34a",
  red:"#dc2626", orange:"#ea580c",
};

/* ─── ICONS ─── */
const Icon = ({ name, size=16, color="currentColor", sw=1.7 }) => {
  const s = { width:size, height:size, fill:"none", stroke:color, strokeWidth:sw, strokeLinecap:"round", strokeLinejoin:"round", display:"block", flexShrink:0 };
  const p = {
    dashboard:   <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21V12h6v9"/></>,
    movement:    <><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 12h10M14 8l4 4-4 4"/></>,
    fleet:       <><path d="M2 18h20M4 18V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10M10 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2M9 12h6M9 15h4"/></>,
    fuel:        <><path d="M4 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M4 22h12M16 8.5l2-2a2 2 0 1 1 2.8 2.8L19 11V16a1.5 1.5 0 0 0 3 0v-5M7 9h6M7 13h4"/></>,
    roster:      <><circle cx="9" cy="7" r="3.5"/><path d="M2 21v-1a7 7 0 0 1 14 0v1"/><circle cx="19" cy="8" r="2.5"/></>,
    maintenance: <><path d="M10.5 6.5L8 4a1.5 1.5 0 0 0-2 0L4.5 5.5a1.5 1.5 0 0 0 0 2L7 10M13.5 17.5l2.5 2.5a1.5 1.5 0 0 0 2 0l1.5-1.5a1.5 1.5 0 0 0 0-2L17 14M9 11l4 4M14 6l4 4-9 9-4-1-1-4z"/></>,
    checklist:   <><path d="M9 12l2 2 4-4"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 5V3.5A1.5 1.5 0 0 1 8.5 2h7A1.5 1.5 0 0 1 17 3.5V5"/></>,
    reports:     <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></>,
    mail:        <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/></>,
    bell:        <><path d="M6 10a6 6 0 0 1 12 0c0 5 2.5 7 2.5 7h-17S6 15 6 10z"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></>,
    menu:        <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    anchor:      <><circle cx="12" cy="6" r="3"/><path d="M12 9v13M5 15a7 7 0 0 0 14 0"/></>,
    logout:      <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
    plus:        <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    x:           <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check:       <><polyline points="20,6 9,17 4,12"/></>,
    edit:        <><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></>,
    save:        <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13"/><polyline points="7,3 7,8 15,8"/></>,
    upload:      <><path d="M12 15V3M8 7l4-4 4 4"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></>,
    download:    <><path d="M12 3v12M8 11l4 4 4-4"/><path d="M20 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"/></>,
    clock:       <><circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15,14"/></>,
    eye:         <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></>,
    send:        <><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></>,
    alert:       <><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    chevron_r:   <><polyline points="9,18 15,12 9,6"/></>,
    chevron_d:   <><polyline points="6,9 12,15 18,9"/></>,
    camera:      <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></>,
    pdf:         <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></>,
    inbox:       <><polyline points="22,12 16,12 14,15 10,15 8,12 2,12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>,
  };
  return <svg viewBox="0 0 24 24" style={s}>{p[name]||<circle cx="12" cy="12" r="9"/>}</svg>;
};

/* ─── HOOKS ─── */
const useWidth = () => {
  const [w,setW] = useState(typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return w;
};
const useMobile = () => useWidth() < 640;

/* ─── DATA ─── */
const USERS = [
  { username:"superadmin",  password:"Baros@2026",   name:"Super Admin",        role:"Super Admin",  initials:"SA", color:"#6d28d9", isAdmin:true  },
  { username:"ops.manager", password:"Ops@2026",     name:"Ops Manager",        role:"Admin",        initials:"OM", color:"#0a6152", isAdmin:true  },
  { username:"nasru",       password:"Captain@2026", name:"NASRU",              role:"Captain",      initials:"NA", color:"#1d6fa4", isAdmin:false },
  { username:"azuhan",      password:"Captain@2026", name:"AZUHAN",             role:"Captain",      initials:"AZ", color:"#15803d", isAdmin:false },
  { username:"shafeeq",     password:"Captain@2026", name:"SHAFEEQ",            role:"Captain",      initials:"SH", color:"#d4950a", isAdmin:false },
  { username:"saleem",      password:"Captain@2026", name:"SALEEM",             role:"Captain",      initials:"SL", color:"#b91c1c", isAdmin:false },
  { username:"david",       password:"Captain@2026", name:"DAVID",              role:"Captain",      initials:"DA", color:"#6d28d9", isAdmin:false },
  { username:"mirsad",      password:"Captain@2026", name:"MIRSAD",             role:"Captain",      initials:"MI", color:"#0d9488", isAdmin:false },
  { username:"tamanager",   password:"TAMgr@2026",   name:"Transport Asst. Mgr",role:"TA Manager",   initials:"TM", color:"#15803d", isAdmin:true  },
  { username:"tmanager",    password:"TMgr@2026",    name:"Transport Manager",  role:"T Manager",    initials:"TG", color:"#c2410c", isAdmin:true  },
];

const FLEET = [
  { id:"Serenity",    type:"Luxury Yacht",      color:"#d4950a", fuelCap:800, cons:90,  pax:10, refuelAfter:8,  fuelMin:120, status:"active",      runHrs:145, eng:"VOLVO D6-370",  engMake:"VOLVO"   },
  { id:"Ixora",       type:"Luxury Speedboat",  color:"#0d9488", fuelCap:400, cons:97,  pax:8,  refuelAfter:10, fuelMin:80,  status:"active",      runHrs:323, eng:"MERCURY 300HP", engMake:"YAMAHA"  },
  { id:"Vitesse",     type:"Luxury Speedboat",  color:"#1d6fa4", fuelCap:400, cons:116, pax:6,  refuelAfter:10, fuelMin:80,  status:"standby",     runHrs:44,  eng:"MERCURY 300HP", engMake:"MERCURY" },
  { id:"Tara",        type:"Speedboat",         color:"#15803d", fuelCap:500, cons:90,  pax:12, refuelAfter:12, fuelMin:100, status:"active",      runHrs:363, eng:"YAMAHA 300HP",  engMake:"YAMAHA"  },
  { id:"Xari",        type:"Speedboat",         color:"#6d28d9", fuelCap:600, cons:85,  pax:8,  refuelAfter:15, fuelMin:100, status:"active",      runHrs:387, eng:"CUMMINS QSB",   engMake:"CUMMINS" },
  { id:"Heliconia",   type:"Dive Boat",         color:"#0891b2", fuelCap:300, cons:60,  pax:10, refuelAfter:8,  fuelMin:60,  status:"active",      runHrs:277, eng:"YAMAHA 150HP",  engMake:"YAMAHA"  },
  { id:"Isadora",     type:"Snorkel Boat",      color:"#c2410c", fuelCap:250, cons:55,  pax:14, refuelAfter:8,  fuelMin:50,  status:"active",      runHrs:227, eng:"YAMAHA 150HP",  engMake:"YAMAHA"  },
  { id:"Nooma",       type:"Traditional Dhoni", color:"#65a30d", fuelCap:200, cons:40,  pax:12, refuelAfter:6,  fuelMin:40,  status:"maintenance", runHrs:65,  eng:"CUMMINS 4BT",   engMake:"CUMMINS" },
  { id:"Areena",      type:"Supply Dhoni",      color:"#64748b", fuelCap:400, cons:50,  pax:6,  refuelAfter:8,  fuelMin:80,  status:"active",      runHrs:166, eng:"ISUZU 4BG1",    engMake:"ISUZU"   },
  { id:"Wahoo",       type:"Sport Fishing",     color:"#b91c1c", fuelCap:200, cons:70,  pax:6,  refuelAfter:6,  fuelMin:40,  status:"standby",     runHrs:32,  eng:"YAMAHA 200HP",  engMake:"YAMAHA"  },
  { id:"Party Craft", type:"Party Boat",        color:"#7c3aed", fuelCap:300, cons:45,  pax:20, refuelAfter:10, fuelMin:60,  status:"active",      runHrs:25,  eng:"YAMAHA 115HP",  engMake:"YAMAHA"  },
  { id:"Dingy",       type:"Rescue Tender",     color:"#475569", fuelCap:80,  cons:20,  pax:4,  refuelAfter:10, fuelMin:15,  status:"standby",     runHrs:47,  eng:"YAMAHA 40HP",   engMake:"YAMAHA"  },
];

const MOVEMENTS = {
  "Guest Transfers":[
    { time:"05:45", vessel:"Ixora",    type:"Guest Transfer", details:"02 PAX DEP & ARR AK74 at 10:00 + 03 PAX ARR BA61 at 09:30", vip:false },
    { time:"06:30", vessel:"Tara",     type:"Guest Transfer", details:"02 PAX DEP & ARR OS21 at 08:50", vip:false },
    { time:"07:45", vessel:"Serenity", type:"VIP Transfer",   details:"03 PAX VIP ARR EK658 at 09:25 + MS AYE MON ARR at 10:00", vip:true },
    { time:"10:45", vessel:"Tara",     type:"Guest Transfer", details:"02 PAX ARR MILAIDHOO at 13:30", vip:false },
    { time:"18:45", vessel:"Ixora",    type:"Guest Transfer", details:"02 PAX DEP MALE JETTY 7 at 20:30", vip:false },
  ],
  "Activities":[
    { time:"08:00", vessel:"Heliconia",   type:"Diving",      details:"04 PAX DIVING (02 TANK) at 08:30", vip:false },
    { time:"08:00", vessel:"Party Craft", type:"F&B Setup",   details:"PIANO BREAKFAST SETUP + GUEST TRANSFER", vip:false },
    { time:"13:45", vessel:"Heliconia",   type:"Snorkelling", details:"04 PAX SNORKELLING SAFARI at 14:00", vip:false },
    { time:"16:45", vessel:"Isadora",     type:"Excursion",   details:"04 PAX SUNSET CRUISE at 17:00", vip:false },
    { time:"17:15", vessel:"Heliconia",   type:"Fishing",     details:"02 PAX SUNSET FISHING at 17:30", vip:false },
  ],
  "Staff Ferries":[
    { time:"07:00", vessel:"Xari", type:"Staff Ferry", details:"BM 07:00 → MAL 08:00", vip:false },
    { time:"16:15", vessel:"Xari", type:"Staff Ferry", details:"BM 16:15 → MAL 17:00 + BAND ARR", vip:false },
    { time:"22:30", vessel:"Xari", type:"Staff Ferry", details:"BM 22:30 → MAL 23:30", vip:false },
  ],
  "Supply Ops":[
    { time:"10:00", vessel:"Areena", type:"Supply",   details:"SEA CARGO SUPPLY", vip:false },
    { time:"20:30", vessel:"Areena", type:"Disposal", details:"WET GARBAGE DISPOSE", vip:false },
  ],
};

const MAINTENANCE_DATA = [
  { vessel:"Tara",      task:"Engine Service",          due:"2026-04-01", priority:"High",   status:"due-soon"  },
  { vessel:"Ixora",     task:"Safety Equipment Check",  due:"2026-03-30", priority:"High",   status:"due-soon"  },
  { vessel:"Nooma",     task:"Engine Overhaul",         due:"2026-03-18", priority:"High",   status:"overdue"   },
  { vessel:"Heliconia", task:"Dive Compressor Service", due:"2026-04-15", priority:"Medium", status:"scheduled" },
];

const EMAIL_RCPT = { checklist:["tamanager@baros.com","transport@baros.com"], fuel:["ops@baros.com","transport@baros.com"] };
const mkEmail = ({ to, subject, body, type="system" }) => ({ id:Date.now()+Math.random(), to, from:"vms@baros.com", subject, body, type, timestamp:new Date().toISOString(), read:false });

const CHECKLIST_ITEMS = [
  { id:1,  desc:"Check engine oil level",                                           type:"HLN",  unit:"",    limit:null },
  { id:2,  desc:"Check engine coolant level",                                       type:"HLN",  unit:"",    limit:null },
  { id:3,  desc:"Check gearbox oil level",                                          type:"HLN",  unit:"",    limit:null },
  { id:4,  desc:"Check DG oil level",                                               type:"HLN",  unit:"",    limit:null },
  { id:5,  desc:"Check fuel level in fuel tank",                                    type:"LN",   unit:"",    limit:null },
  { id:6,  desc:"Check DG coolant level",                                           type:"HLN",  unit:"",    limit:null },
  { id:7,  desc:"Check steering system for proper functioning",                     type:"YN",   unit:"",    limit:null },
  { id:8,  desc:"Check the battery voltage",                                        type:"VOLT", unit:"V",   limit:null },
  { id:9,  desc:"Check trim tabs for proper functioning",                           type:"YN",   unit:"",    limit:null },
  { id:10, desc:"Check leakages of sea water or fuel in engine & rudder room",      type:"LEAK", unit:"",    limit:null },
  { id:11, desc:"Check navigational lights for proper functioning",                 type:"WP",   unit:"",    limit:null },
  { id:12, desc:"Check bilge pump auto/manual functioning",                         type:"WP",   unit:"",    limit:null },
  { id:13, desc:"Check any alarm indication",                                       type:"ALARM",unit:"",    limit:null },
  { id:14, desc:"Proper functioning of AC units",                                   type:"WP",   unit:"",    limit:null },
  { id:15, desc:"Operate engine room blower before starting the engine",            type:"WP",   unit:"",    limit:null },
  { id:16, desc:"Check oil pressure of Engine [Should not exceed 80 Psi]",         type:"KPA",  unit:"KPA", limit:80   },
  { id:17, desc:"Check engine temperature [Should not exceed 85°]",                type:"TEMP", unit:"°C",  limit:85   },
  { id:18, desc:"Check oil pressure of DG [Should not exceed 80 Psi]",             type:"KPA",  unit:"KPA", limit:80   },
  { id:19, desc:"Check DG temperature [Should not exceed 85°]",                    type:"TEMP", unit:"°C",  limit:85   },
  { id:20, desc:"Electrical Equipment (Lights, horn, pump, bow thruster)",         type:"WP",   unit:"",    limit:null },
];

const FUEL_LOG_INIT = [
  { id:1, date:"2026-03-24", vessel:"Tara",     supplier:"Resort Fuel Store", litres:380, cost:684, notes:"Post-ops refuel" },
  { id:2, date:"2026-03-24", vessel:"Xari",     supplier:"Resort Fuel Store", litres:420, cost:840, notes:"Staff ferry ops" },
  { id:3, date:"2026-03-23", vessel:"Ixora",    supplier:"FSM Hulhumale'",    litres:290, cost:551, notes:"Guest transfers" },
  { id:4, date:"2026-03-23", vessel:"Serenity", supplier:"FSM Hulhumale'",    litres:510, cost:918, notes:"VIP charter"     },
];

/* ─── ROSTER DATA ─── */
const CAPTAINS = [
  { id:"NASRU",   name:"Nasru",   phone:"9461017", color:"#1d6fa4", initials:"NA" },
  { id:"AZUHAN",  name:"Azuhan",  phone:"7932155", color:"#15803d", initials:"AZ" },
  { id:"SHAFEEQ", name:"Shafeeq", phone:"9883885", color:"#d4950a", initials:"SH" },
  { id:"SALEEM",  name:"Saleem",  phone:"7950200", color:"#b91c1c", initials:"SL" },
  { id:"DAVID",   name:"David",   phone:"7901716", color:"#6d28d9", initials:"DA" },
  { id:"MIRSAD",  name:"Mirsad",  phone:"9410773", color:"#0d9488", initials:"MI" },
  { id:"SIRUHAN", name:"Siruhan", phone:"7929255", color:"#0891b2", initials:"SI" },
  { id:"MODE",    name:"Mode",    phone:"7667621", color:"#7c3aed", initials:"MO" },
  { id:"SHIREY",  name:"Shirey",  phone:"9992994", color:"#c2410c", initials:"SR" },
  { id:"DHONA",   name:"Dhona",   phone:"7783056", color:"#65a30d", initials:"DH" },
];
const SHIFTS = [
  { id:"AM",    label:"Morning",   time:"05:00–14:00", color:"#0891b2", bg:"#e0f2fe" },
  { id:"PM",    label:"Afternoon", time:"13:00–22:00", color:"#7c3aed", bg:"#ede9fe" },
  { id:"FULL",  label:"Full Day",  time:"05:00–22:00", color:"#15803d", bg:"#dcfce7" },
  { id:"OFF",   label:"Day Off",   time:"",            color:"#94a3b8", bg:"#f1f5f9" },
  { id:"LEAVE", label:"Leave",     time:"",            color:"#dc2626", bg:"#fee2e2" },
];
function weekDates(offset) {
  const a = new Date(2026,2,25); a.setDate(a.getDate()+offset*7);
  const dow=a.getDay(); const diff=dow===0?-6:1-dow; a.setDate(a.getDate()+diff);
  return Array.from({length:7},(_,i)=>{ const d=new Date(a); d.setDate(a.getDate()+i); return d; });
}
function dk(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function initRoster() {
  const cfg=[
    {v:"Serenity",cap:"NASRU",sh:"FULL"},{v:"Ixora",cap:"AZUHAN",sh:"AM"},{v:"Vitesse",cap:"SALEEM",sh:"AM"},
    {v:"Tara",cap:"SHIREY",sh:"AM"},{v:"Xari",cap:"DAVID",sh:"FULL"},{v:"Heliconia",cap:"SHAFEEQ",sh:"AM"},
    {v:"Isadora",cap:"SHAFEEQ",sh:"AM"},{v:"Nooma",cap:"SIRUHAN",sh:"PM"},{v:"Areena",cap:"MIRSAD",sh:"FULL"},
    {v:"Wahoo",cap:"MODE",sh:"AM"},{v:"Party Craft",cap:"DHONA",sh:"PM"},{v:"Dingy",cap:null,sh:"OFF"},
  ];
  const roster={};
  cfg.forEach(({v,cap,sh})=>{
    roster[v]={};
    for(let w=-1;w<=2;w++){
      weekDates(w).forEach((d,di)=>{
        const isOff=cap&&((di===6&&w%2===0)||(di===0&&w%2===1));
        roster[v][dk(d)]={cap:isOff?null:cap,sh:isOff?"OFF":sh};
      });
    }
  });
  return roster;
}

/* ─── UI PRIMITIVES ─── */
const Card = ({children,style={}}) => (
  <div style={{background:C.card,borderRadius:14,border:`1px solid ${C.border}`,boxShadow:"0 1px 4px rgba(0,0,0,.05)",...style}}>{children}</div>
);
const Btn = ({children,onClick,variant="primary",iconName,full,disabled,small,style={}}) => {
  const vs={
    primary:{background:"linear-gradient(135deg,#0f7a67,#0a6152)",color:"#fff",border:"none",shadow:"0 2px 8px rgba(10,97,82,.28)"},
    outline:{background:"#fff",color:C.mid,border:`1px solid ${C.border}`,shadow:"none"},
    danger: {background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",border:"none",shadow:"0 2px 6px rgba(220,38,38,.28)"},
    green:  {background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",border:"none",shadow:"0 2px 6px rgba(22,163,74,.28)"},
  };
  const v=vs[variant]||vs.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:small?"6px 12px":"10px 16px",borderRadius:10,fontWeight:700,fontSize:small?11:13,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,width:full?"100%":"auto",boxShadow:v.shadow,...v,border:v.border||"none",...style}}>
      {iconName&&<Icon name={iconName} size={small?12:14} color={v.color}/>}{children}
    </button>
  );
};
const Tabs = ({tabs,active,onChange}) => (
  <div style={{display:"flex",gap:2,marginBottom:16,background:"rgba(0,0,0,.04)",borderRadius:11,padding:4,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
    {tabs.map(t=>(
      <button key={t} onClick={()=>onChange(t)} style={{padding:"7px 14px",borderRadius:8,border:"none",background:active===t?"#fff":"transparent",color:active===t?C.text:C.mid,fontSize:12,fontWeight:active===t?700:500,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,boxShadow:active===t?"0 1px 4px rgba(0,0,0,.08)":"none",transition:"all .15s"}}>{t}</button>
    ))}
  </div>
);
const Modal = ({title,children,onClose}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:0}}>
    <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,.25)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 18px 12px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:"#fff",zIndex:1}}>
        <span style={{fontWeight:800,fontSize:15,color:C.text}}>{title}</span>
        <button onClick={onClose} style={{background:"rgba(0,0,0,.05)",border:"none",cursor:"pointer",width:28,height:28,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="x" size={14} color={C.mid}/></button>
      </div>
      <div style={{padding:"16px 18px 32px"}}>{children}</div>
    </div>
  </div>
);
const Field = ({label,children}) => (
  <div style={{marginBottom:14}}>
    <label style={{display:"block",fontSize:11,fontWeight:700,color:C.mid,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</label>
    {children}
  </div>
);
const Inp = ({value,onChange,placeholder,type="text",style={}}) => (
  <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type}
    style={{width:"100%",padding:"11px 13px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:14,color:C.text,background:"#fafbfc",outline:"none",...style}}/>
);

/* ─── CIRCULAR GAUGE ─── */
function Gauge({value,max,label,unit,color="#0a6152",size=120,warn=0.25,crit=0.1}) {
  const r=(size/2)-10, cx=size/2, cy=size/2, sa=-215, sw=250;
  const pct=Math.min(Math.max(value/max,0),1);
  const toR=a=>(a*Math.PI)/180;
  const pt=a=>({x:cx+r*Math.cos(toR(a)),y:cy+r*Math.sin(toR(a))});
  const arc=(f,t)=>{const s=pt(f),e=pt(t),lg=(t-f)>180?1:0;return `M ${s.x} ${s.y} A ${r} ${r} 0 ${lg} 1 ${e.x} ${e.y}`;};
  const fa=sa+sw*pct;
  const gc=pct<=crit?"#b91c1c":pct<=warn?"#d4950a":color;
  const ts=size<110?14:18;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
      <svg width={size} height={size} style={{overflow:"visible"}}>
        <path d={arc(sa,sa+sw)} fill="none" stroke="#e2e8f0" strokeWidth={size<110?7:9} strokeLinecap="round"/>
        {pct>0&&<path d={arc(sa,fa)} fill="none" stroke={gc} strokeWidth={size<110?7:9} strokeLinecap="round"/>}
        <text x={cx} y={cy+4} textAnchor="middle" fontSize={ts} fontWeight="900" fill={gc} fontFamily="monospace">
          {typeof value==="number"?value.toLocaleString():value}
        </text>
        <text x={cx} y={cy+ts*0.95+4} textAnchor="middle" fontSize={9} fill="#94a3b8" fontFamily="sans-serif">{unit}</text>
      </svg>
      <div style={{fontSize:11,fontWeight:700,color:C.mid,marginTop:2,textAlign:"center",lineHeight:1.2}}>{label}</div>
      <div style={{fontSize:10,color:gc,fontWeight:600,marginTop:1}}>{Math.round(pct*100)}%{pct<=warn?" LOW":""}</div>
    </div>
  );
}

/* ════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════ */
function Dashboard({setPage,fleet,fuelBal,trips}) {
  const m = useMobile();
  const [now,setNow]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),10000);return()=>clearInterval(t);},[]);
  const active=fleet.filter(v=>v.status==="active").length;
  const alerts=fleet.filter(v=>fuelBal[v.id]<=v.fuelMin||(trips[v.id]||0)>=v.refuelAfter).length;
  const total=Object.values(MOVEMENTS).reduce((a,b)=>a+b.length,0);
  const sched=[
    {time:"05:45",label:"Ixora – Guest Transfer",done:true,c:"#2563eb"},
    {time:"06:30",label:"Tara – Guest Transfer",done:true,c:"#2563eb"},
    {time:"07:45",label:"Serenity – VIP Transfer ⭐",done:true,c:"#d97706"},
    {time:"08:00",label:"Heliconia – Diving",done:true,c:"#7c3aed"},
    {time:"10:45",label:"Tara – Guest Transfer",done:false,c:"#2563eb"},
    {time:"13:45",label:"Heliconia – Snorkelling",done:false,c:"#7c3aed"},
    {time:"16:45",label:"Isadora – Sunset Cruise",done:false,c:"#7c3aed"},
    {time:"18:45",label:"Ixora – Guest Transfer",done:false,c:"#2563eb"},
  ];
  const done=sched.filter(s=>s.done).length;
  return (
    <div>
      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#0d1f3c 0%,#0a6152 100%)",borderRadius:16,padding:m?"16px 18px":"20px 24px",marginBottom:14,color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-20,top:-20,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative"}}>
          <div>
            <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,.5)",marginBottom:4}}>Wed 25 Mar 2026</div>
            <h1 style={{margin:0,fontSize:m?18:22,fontWeight:900,letterSpacing:"-0.02em"}}>Operations Dashboard</h1>
            <p style={{margin:"4px 0 0",fontSize:11,color:"rgba(255,255,255,.5)"}}>Baros Maldives · VMS</p>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:m?26:32,fontWeight:900,fontFamily:"monospace",letterSpacing:"-0.03em",lineHeight:1}}>{now.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",timeZone:"Indian/Maldives"})}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.4)",marginTop:2}}>MVT</div>
          </div>
        </div>
        <div style={{display:"flex",gap:7,marginTop:14,flexWrap:"wrap"}}>
          {[{l:`${active} Active`,c:"#dcfce7"},{l:`${fleet.filter(v=>v.status==="maintenance").length} Maint.`,c:"#fee2e2"},{l:`${total} Trips`,c:"rgba(255,255,255,.15)"}].map(p=>(
            <div key={p.l} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.12)",borderRadius:20,padding:"4px 11px"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:p.c}}/>
              <span style={{fontSize:11,fontWeight:700,color:"#fff"}}>{p.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs — 2×2 on mobile, 4-col on desktop */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[
          {label:"Trips Today",  value:total,    sub:"Active & scheduled",    icon:"movement",c:"#2563eb",bg:"#eff6ff"},
          {label:"Fleet Active", value:active,   sub:`of ${fleet.length} vessels`, icon:"fleet",   c:"#0a6152",bg:"#f0fdf4"},
          {label:"Staff On Duty",value:17,       sub:"2 off today",            icon:"roster",  c:"#7c3aed",bg:"#f5f3ff"},
          {label:"Fuel Alerts",  value:alerts,   sub:"Need refuelling",        icon:"fuel",    c:"#d97706",bg:"#fffbeb"},
        ].map(k=>(
          <Card key={k.label} style={{padding:"14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{width:32,height:32,borderRadius:9,background:k.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name={k.icon} size={15} color={k.c}/></div>
              <span style={{fontSize:m?22:26,fontWeight:900,color:k.c,letterSpacing:"-0.03em"}}>{k.value}</span>
            </div>
            <div style={{fontSize:12,fontWeight:700,color:C.text}}>{k.label}</div>
            <div style={{fontSize:10,color:C.light,marginTop:1}}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Schedule — full width on mobile */}
      <Card style={{padding:"16px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><div style={{fontWeight:800,fontSize:14,color:C.text}}>Today's Schedule</div><div style={{fontSize:11,color:C.light,marginTop:1}}>{done}/{sched.length} completed</div></div>
          <button onClick={()=>setPage("movement")} style={{background:"#f0fdf4",border:"none",color:C.primary,fontWeight:700,fontSize:11,cursor:"pointer",padding:"5px 10px",borderRadius:7}}>Full →</button>
        </div>
        <div style={{height:4,background:"#f1f5f9",borderRadius:2,overflow:"hidden",marginBottom:12}}>
          <div style={{height:"100%",width:`${(done/sched.length)*100}%`,background:"linear-gradient(90deg,#0a6152,#22c55e)",borderRadius:2}}/>
        </div>
        {sched.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 0",borderBottom:i<sched.length-1?`1px solid ${C.borderLight}`:"none"}}>
            <span style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:s.done?C.light:s.c,minWidth:36,opacity:s.done?.5:1}}>{s.time}</span>
            <div style={{width:7,height:7,borderRadius:"50%",flexShrink:0,background:s.done?"#d1d5db":s.c}}/>
            <span style={{fontSize:12,color:s.done?C.light:C.text,fontWeight:s.done?400:600,textDecoration:s.done?"line-through":"none",flex:1}}>{s.label}</span>
            {s.done&&<span style={{fontSize:10,color:"#22c55e"}}>✓</span>}
          </div>
        ))}
      </Card>

      {/* Fleet Status */}
      <Card style={{padding:"16px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:14,color:C.text}}>Fleet Status</div>
          <button onClick={()=>setPage("fleet")} style={{background:"none",border:"none",color:C.primary,fontWeight:700,fontSize:11,cursor:"pointer"}}>Manage →</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {fleet.map(v=>{
            const sc=v.status==="active"?{dot:"#22c55e",bg:"#f0fdf4"}:v.status==="maintenance"?{dot:"#ef4444",bg:"#fff1f2"}:{dot:"#f59e0b",bg:"#fffbeb"};
            return (
              <div key={v.id} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 9px",borderRadius:9,background:sc.bg}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:sc.dot,flexShrink:0}}/>
                <div style={{minWidth:0}}><div style={{fontSize:11,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.id}</div><div style={{fontSize:9,color:C.light}}>{v.type}</div></div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Maintenance alerts */}
      <Card style={{padding:"16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:14,color:C.text}}>Maintenance Alerts</div>
          <button onClick={()=>setPage("maintenance")} style={{background:"none",border:"none",color:C.primary,fontWeight:700,fontSize:11,cursor:"pointer"}}>View →</button>
        </div>
        {MAINTENANCE_DATA.filter(m=>m.status!=="scheduled").map((m,i,arr)=>(
          <div key={i} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:i<arr.length-1?`1px solid ${C.borderLight}`:"none",alignItems:"flex-start"}}>
            <div style={{width:30,height:30,borderRadius:8,background:m.status==="overdue"?"#fee2e2":"#fff7ed",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="alert" size={14} color={m.status==="overdue"?"#dc2626":"#d97706"}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:12,color:C.text}}>{m.vessel}</div>
              <div style={{fontSize:11,color:m.status==="overdue"?C.red:C.orange,marginTop:1}}>{m.task}</div>
              <div style={{fontSize:10,color:C.light,fontFamily:"monospace"}}>Due: {m.due}</div>
            </div>
            <span style={{fontSize:9,fontWeight:800,color:m.status==="overdue"?C.red:C.orange,background:m.status==="overdue"?"#fee2e2":"#fff7ed",padding:"2px 7px",borderRadius:12,whiteSpace:"nowrap"}}>{m.status.toUpperCase()}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════
   BOAT MOVEMENT
════════════════════════════════════════ */
function BoatMovement() {
  const [open,setOpen]=useState("Guest Transfers");
  const sC={"Guest Transfers":"#2563eb","Activities":"#7c3aed","Staff Ferries":"#0d9488","Supply Ops":"#d97706"};
  return (
    <div>
      <div style={{marginBottom:16}}>
        <h1 style={{margin:0,fontSize:20,fontWeight:900,color:C.text}}>Boat Movement</h1>
        <p style={{margin:"4px 0 0",fontSize:12,color:C.light}}>Wednesday 25 March 2026</p>
      </div>
      {Object.entries(MOVEMENTS).map(([sec,rows])=>(
        <Card key={sec} style={{marginBottom:10,overflow:"hidden"}}>
          <button onClick={()=>setOpen(open===sec?null:sec)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"14px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
            <div style={{width:4,height:20,borderRadius:2,background:sC[sec],flexShrink:0}}/>
            <span style={{fontWeight:800,fontSize:14,color:C.text,flex:1}}>{sec}</span>
            <span style={{background:sC[sec],color:"#fff",borderRadius:"50%",width:22,height:22,fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{rows.length}</span>
            <Icon name="chevron_d" size={16} color={C.light}/>
          </button>
          {open===sec&&(
            <div style={{borderTop:`1px solid ${C.borderLight}`}}>
              {rows.map((r,i)=>(
                <div key={i} style={{padding:"13px 16px",background:r.vip?"#fffbeb":i%2?"#fafaf8":"#fff",borderBottom:i<rows.length-1?`1px solid ${C.borderLight}`:"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,gap:8}}>
                    <span style={{fontFamily:"monospace",fontSize:17,fontWeight:900,color:C.text}}>{r.time}{r.vip?" ⭐":""}</span>
                    <span style={{background:r.vip?"#fef3c7":"#f1f5f9",color:r.vip?"#92400e":C.mid,padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:700,flexShrink:0}}>{r.type}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:C.text}}>{r.vessel}</div>
                  <div style={{fontSize:12,color:C.mid,marginTop:3,lineHeight:1.4}}>{r.details}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════
   FLEET PROFILES
════════════════════════════════════════ */
function Fleet({fleet,setFleet,user}) {
  const m = useMobile();
  const [editId,setEditId]=useState(null);
  const [editVals,setEditVals]=useState({});
  const [photos,setPhotos]=useState({});
  const canEdit=user?.isAdmin;
  const imgRef=useRef({});
  const startEdit=v=>{setEditId(v.id);setEditVals({fuelCap:v.fuelCap,cons:v.cons,pax:v.pax,refuelAfter:v.refuelAfter,fuelMin:v.fuelMin,status:v.status});};
  const saveEdit=id=>{setFleet(f=>f.map(v=>v.id===id?{...v,...editVals,fuelCap:+editVals.fuelCap,cons:+editVals.cons,pax:+editVals.pax,refuelAfter:+editVals.refuelAfter,fuelMin:+editVals.fuelMin}:v));setEditId(null);};
  return (
    <div>
      <div style={{marginBottom:16}}><h1 style={{margin:0,fontSize:20,fontWeight:900,color:C.text}}>Fleet Profiles</h1><p style={{margin:"4px 0 0",fontSize:12,color:C.light}}>12 vessels · Baros Maldives</p></div>
      {/* Single column on mobile, 2-col on tablet+ */}
      <div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:12}}>
        {fleet.map(v=>(
          <Card key={v.id} style={{overflow:"hidden"}}>
            <div style={{height:110,background:photos[v.id]?`url(${photos[v.id]}) center/cover`:`linear-gradient(135deg,${v.color}22,${v.color}44)`,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {!photos[v.id]&&<div style={{fontSize:30,opacity:.4}}>⚓</div>}
              <div style={{position:"absolute",top:8,right:8}}><span style={{background:v.status==="active"?"#dcfce7":v.status==="maintenance"?"#fee2e2":"#fef3c7",color:v.status==="active"?"#15803d":v.status==="maintenance"?"#dc2626":"#92400e",padding:"3px 9px",borderRadius:12,fontSize:10,fontWeight:700}}>{v.status}</span></div>
              {canEdit&&(
                <><input ref={el=>imgRef.current[v.id]=el} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=x=>setPhotos(p=>({...p,[v.id]:x.target.result}));r.readAsDataURL(f);}}}/>
                <button onClick={()=>imgRef.current[v.id]?.click()} style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,.5)",border:"none",borderRadius:7,padding:"5px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:"#fff",fontSize:10,fontWeight:700}}><Icon name="camera" size={12} color="#fff"/>Photo</button></>
              )}
            </div>
            <div style={{padding:"13px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div><div style={{fontWeight:800,fontSize:15,color:C.text}}>{v.id}</div><div style={{fontSize:11,color:C.light}}>{v.type}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:10,color:C.light}}>{v.engMake}</div><div style={{fontSize:11,fontWeight:700,color:C.mid}}>{v.eng}</div></div>
              </div>
              {editId===v.id?(
                <div>
                  {[["fuelCap","Fuel Cap (L)"],["cons","Consumption/hr"],["pax","Pax"],["refuelAfter","Refuel After"],["fuelMin","Fuel Min (L)"]].map(([k,lbl])=>(
                    <div key={k} style={{marginBottom:8}}>
                      <label style={{fontSize:10,fontWeight:700,color:C.mid,textTransform:"uppercase",letterSpacing:"0.06em"}}>{lbl}</label>
                      <input value={editVals[k]||""} onChange={e=>setEditVals(ev=>({...ev,[k]:e.target.value}))} type="number" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,marginTop:3,outline:"none"}}/>
                    </div>
                  ))}
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:10,fontWeight:700,color:C.mid,textTransform:"uppercase",letterSpacing:"0.06em"}}>Status</label>
                    <select value={editVals.status||""} onChange={e=>setEditVals(ev=>({...ev,status:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,marginTop:3}}>
                      {["active","standby","maintenance"].map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{display:"flex",gap:8}}><Btn full onClick={()=>saveEdit(v.id)} iconName="save">Save</Btn><Btn variant="outline" onClick={()=>setEditId(null)} style={{padding:"10px 14px"}}>Cancel</Btn></div>
                </div>
              ):(
                <div>
                  {[["Fuel Cap",`${v.fuelCap}L`],["Consumption",`${v.cons}L/hr`],["Passengers",`${v.pax}pax`],["Refuel After",`${v.refuelAfter} trips`],["Fuel Min",`${v.fuelMin}L`]].map(([k,val])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.borderLight}`}}>
                      <span style={{fontSize:11,color:C.light}}>{k}</span><span style={{fontSize:12,fontWeight:700,color:C.text}}>{val}</span>
                    </div>
                  ))}
                  {canEdit&&<Btn variant="outline" onClick={()=>startEdit(v)} style={{width:"100%",marginTop:10,padding:"9px",fontSize:12}} iconName="edit">Edit</Btn>}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   FUEL LOG
════════════════════════════════════════ */
function FuelLog({fleet,fuelLog,setFuelLog,fuelBal,setFuelBal,trips,setTrips,sendEmail,saveFuelEntry}) {
  const m = useMobile();
  const [tab,setTab]=useState("Overview");
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({vessel:fleet[0]?.id||"",date:new Date().toISOString().slice(0,10),supplier:"",litres:"",cost:"",notes:""});
  const setF=k=>v=>setForm(f=>({...f,[k]:v}));
  const addEntry=()=>{
    const e={id:Date.now(),date:form.date,vessel:form.vessel,supplier:form.supplier,litres:+form.litres,cost:+form.cost,notes:form.notes};
    if(saveFuelEntry) {
      saveFuelEntry(e);
    } else {
      setFuelLog(l=>[e,...l]);
      setFuelBal(b=>({...b,[form.vessel]:Math.min((b[form.vessel]||0)+e.litres,fleet.find(v=>v.id===form.vessel)?.fuelCap||999)}));
      setTrips(t=>({...t,[form.vessel]:0}));
    }
    sendEmail(mkEmail({to:EMAIL_RCPT.fuel.join(","),subject:`Fuel Log – ${form.vessel}`,body:`${form.vessel} refuelled.\nLitres: ${form.litres}\nSupplier: ${form.supplier}\nDate: ${form.date}`,type:"fuel"}));
    setShowAdd(false);setForm({vessel:fleet[0]?.id||"",date:new Date().toISOString().slice(0,10),supplier:"",litres:"",cost:"",notes:""});
  };
  // gauge cols: 2 on mobile, 3 on tablet, 4 on desktop
  const gaugeCols = m ? "1fr 1fr" : "repeat(4,1fr)";
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div><h1 style={{margin:0,fontSize:20,fontWeight:900,color:C.text}}>Fuel Log</h1><p style={{margin:"4px 0 0",fontSize:12,color:C.light}}>Fuel tracking & gauges</p></div>
        <Btn iconName="plus" onClick={()=>setShowAdd(true)} small={m}>Add Entry</Btn>
      </div>
      <Tabs tabs={["Overview","Fuel Log"]} active={tab} onChange={setTab}/>
      {tab==="Overview"&&(
        <div>
          {fleet.some(v=>fuelBal[v.id]<=v.fuelMin||(trips[v.id]||0)>=v.refuelAfter)&&(
            <div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:12,padding:"12px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
              <Icon name="alert" size={18} color="#d97706"/>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:"#92400e"}}>Fuel Alert</div>
                <div style={{fontSize:12,color:"#b45309",marginTop:2}}>{fleet.filter(v=>fuelBal[v.id]<=v.fuelMin||(trips[v.id]||0)>=v.refuelAfter).map(v=>v.id).join(", ")} need refuelling</div>
              </div>
            </div>
          )}
          <Card style={{padding:"16px",marginBottom:12}}>
            <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:14}}>Fuel Levels</div>
            <div style={{display:"grid",gridTemplateColumns:gaugeCols,gap:12}}>
              {fleet.map(v=>{
                const bal=fuelBal[v.id]||0;
                const need=bal<=v.fuelMin||(trips[v.id]||0)>=v.refuelAfter;
                return (
                  <div key={v.id} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 6px",borderRadius:12,background:need?"#fff7ed":"#fafbfd",border:`1px solid ${need?"#fed7aa":C.borderLight}`}}>
                    <Gauge value={bal} max={v.fuelCap} label={v.id} unit="L" color={v.color} size={m?90:100} warn={0.3} crit={0.15}/>
                    {need&&<span style={{fontSize:9,fontWeight:700,color:"#d97706",marginTop:4,background:"#fef3c7",padding:"2px 6px",borderRadius:5}}>REFUEL</span>}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card style={{padding:"16px"}}>
            <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:14}}>Running Hours</div>
            <div style={{display:"grid",gridTemplateColumns:gaugeCols,gap:12}}>
              {fleet.map(v=>(
                <div key={v.id} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 6px",borderRadius:12,background:"#fafbfd",border:`1px solid ${C.borderLight}`}}>
                  <Gauge value={v.runHrs} max={500} label={v.id} unit="hrs" color="#1d6fa4" size={m?90:100} warn={0.3} crit={0.15}/>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      {tab==="Fuel Log"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {fuelLog.length===0&&<Card style={{padding:"40px 20px",textAlign:"center",color:C.light}}><Icon name="fuel" size={40} color="#d1d5db"/><div style={{marginTop:12,fontWeight:600}}>No entries yet</div></Card>}
          {fuelLog.map(e=>(
            <Card key={e.id} style={{padding:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div><div style={{fontWeight:800,fontSize:14,color:C.text}}>{e.vessel}</div><div style={{fontSize:11,color:C.light,marginTop:2,fontFamily:"monospace"}}>{e.date}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:20,fontWeight:900,color:C.primary}}>{e.litres}L</div>{e.cost>0&&<div style={{fontSize:11,color:C.mid}}>MVR {e.cost.toLocaleString()}</div>}</div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {e.supplier&&<span style={{fontSize:11,fontWeight:600,color:C.mid,background:"#f1f5f9",padding:"3px 9px",borderRadius:6}}>{e.supplier}</span>}
                {e.notes&&<span style={{fontSize:11,color:C.light}}>{e.notes}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
      {showAdd&&(
        <Modal title="Add Fuel Entry" onClose={()=>setShowAdd(false)}>
          <Field label="Vessel"><select value={form.vessel} onChange={e=>setF("vessel")(e.target.value)} style={{width:"100%",padding:"11px 13px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:14,background:"#fafbfc",outline:"none"}}>{fleet.map(v=><option key={v.id} value={v.id}>{v.id}</option>)}</select></Field>
          <Field label="Date"><Inp value={form.date} onChange={setF("date")} type="date"/></Field>
          <Field label="Supplier"><Inp value={form.supplier} onChange={setF("supplier")} placeholder="e.g. FSM Hulhumale'"/></Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="Litres"><Inp value={form.litres} onChange={setF("litres")} type="number" placeholder="0"/></Field>
            <Field label="Cost (MVR)"><Inp value={form.cost} onChange={setF("cost")} type="number" placeholder="0"/></Field>
          </div>
          <Field label="Notes"><Inp value={form.notes} onChange={setF("notes")} placeholder="Optional notes"/></Field>
          <Btn full onClick={addEntry} disabled={!form.vessel||!form.litres}>Save Fuel Entry</Btn>
        </Modal>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   DUTY ROSTER
════════════════════════════════════════ */
function DutyRoster({user}) {
  const m = useMobile();
  const canEdit=user?.isAdmin||user?.role==="Super Admin"||user?.role==="T Manager"||user?.role==="TA Manager";
  const [tab,setTab]=useState("Weekly Grid");
  const [offset,setOffset]=useState(0);
  const [roster,setRoster]=useState(initRoster);
  const [editCell,setEditCell]=useState(null);
  const week=weekDates(offset);
  const todayStr=dk(new Date(2026,2,25));
  const DAY=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  useEffect(()=>{
    setRoster(prev=>{let ch=false;const next={...prev};Object.keys(next).forEach(v=>{week.forEach(d=>{const k=dk(d);if(!next[v][k]){next[v][k]={cap:null,sh:"OFF"};ch=true;}});});return ch?next:prev;});
  },[offset]);
  const getCap=id=>CAPTAINS.find(c=>c.id===id);
  const getSh=id=>SHIFTS.find(s=>s.id===id)||SHIFTS[3];
  const vessels=FLEET.map(v=>v.id);
  const onDuty=new Set(Object.values(roster).map(d=>d[todayStr]?.cap).filter(Boolean));
  const crewed=Object.values(roster).filter(d=>d[todayStr]?.cap).length;
  const wl=`${week[0].getDate()} ${MO[week[0].getMonth()]} – ${week[6].getDate()} ${MO[week[6].getMonth()]}`;
  const save=(v,k,cap,sh)=>{setRoster(p=>({...p,[v]:{...p[v],[k]:{cap,sh}}}));setEditCell(null);};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div><h1 style={{margin:0,fontSize:20,fontWeight:900,color:C.text}}>Duty Roster</h1><p style={{margin:"4px 0 0",fontSize:12,color:C.light}}>Week of {wl}</p></div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={()=>setOffset(o=>o-1)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{transform:"rotate(180deg)",display:"flex"}}><Icon name="chevron_r" size={14} color={C.mid}/></div></button>
          <button onClick={()=>setOffset(0)} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${offset===0?C.primary:C.border}`,background:offset===0?C.primary:"#fff",color:offset===0?"#fff":C.mid,fontSize:11,fontWeight:700,cursor:"pointer"}}>Now</button>
          <button onClick={()=>setOffset(o=>o+1)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="chevron_r" size={14} color={C.mid}/></button>
        </div>
      </div>
      {/* KPIs — 2×2 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {[{l:"On Duty Today",v:onDuty.size,c:"#15803d",bg:"#dcfce7"},{l:"Captains Off",v:CAPTAINS.length-onDuty.size,c:"#d97706",bg:"#fef3c7"},{l:"Vessels Crewed",v:crewed,c:"#2563eb",bg:"#dbeafe"},{l:"Total Captains",v:CAPTAINS.length,c:"#6d28d9",bg:"#ede9fe"}].map(k=>(
          <Card key={k.l} style={{padding:"14px"}}>
            <div style={{fontSize:26,fontWeight:900,color:k.c,lineHeight:1}}>{k.v}</div>
            <div style={{fontSize:11,color:C.light,marginTop:4}}>{k.l}</div>
          </Card>
        ))}
      </div>
      <Tabs tabs={["Weekly Grid","Captains","Shifts"]} active={tab} onChange={setTab}/>
      {/* Weekly Grid — horizontally scrollable on mobile */}
      {tab==="Weekly Grid"&&(
        <Card style={{overflow:"hidden"}}>
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <div style={{minWidth:520}}>
              <div style={{display:"grid",gridTemplateColumns:"100px repeat(7,1fr)",background:"#f8fafc",borderBottom:`1px solid ${C.border}`}}>
                <div style={{padding:"9px 10px",fontSize:10,fontWeight:700,color:C.light,textTransform:"uppercase",borderRight:`1px solid ${C.borderLight}`}}>Vessel</div>
                {week.map((d,di)=>{
                  const isT=dk(d)===todayStr;
                  return (
                    <div key={di} style={{padding:"7px 3px",textAlign:"center",borderRight:di<6?`1px solid ${C.borderLight}`:"none",background:isT?"rgba(10,97,82,.07)":"transparent"}}>
                      <div style={{fontSize:9,fontWeight:700,color:isT?C.primary:C.light,textTransform:"uppercase"}}>{DAY[di]}</div>
                      <div style={{fontSize:13,fontWeight:900,color:isT?C.primary:C.text}}>{d.getDate()}</div>
                      {isT&&<div style={{width:4,height:4,borderRadius:"50%",background:C.primary,margin:"2px auto 0"}}/>}
                    </div>
                  );
                })}
              </div>
              {vessels.map((vessel,vi)=>{
                const fi=FLEET.find(f=>f.id===vessel);
                return (
                  <div key={vessel} style={{display:"grid",gridTemplateColumns:"100px repeat(7,1fr)",borderBottom:vi<vessels.length-1?`1px solid ${C.borderLight}`:"none",background:vi%2===0?"#fff":"#fafbfd"}}>
                    <div style={{padding:"9px 10px",borderRight:`1px solid ${C.borderLight}`,display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:fi?.color||C.mid,flexShrink:0}}/>
                      <div><div style={{fontSize:11,fontWeight:700,color:C.text,lineHeight:1.2}}>{vessel}</div><div style={{fontSize:8.5,color:C.light}}>{fi?.type?.split(" ")[0]||""}</div></div>
                    </div>
                    {week.map((d,di)=>{
                      const k=dk(d);
                      const entry=roster[vessel]?.[k]||{cap:null,sh:"OFF"};
                      const cap=entry.cap?getCap(entry.cap):null;
                      const sh=getSh(entry.sh);
                      const isT=k===todayStr;
                      return (
                        <div key={di} onClick={()=>canEdit&&setEditCell({vessel,k})}
                          style={{padding:"6px 3px",borderRight:di<6?`1px solid ${C.borderLight}`:"none",background:isT?"rgba(10,97,82,.04)":"transparent",cursor:canEdit?"pointer":"default",minHeight:46,display:"flex",alignItems:"center",justifyContent:"center"}}
                          onMouseEnter={e=>{if(canEdit)e.currentTarget.style.background=isT?"rgba(10,97,82,.08)":"rgba(0,0,0,.03)";}}
                          onMouseLeave={e=>{e.currentTarget.style.background=isT?"rgba(10,97,82,.04)":"transparent";}}>
                          {entry.sh==="OFF"||entry.sh==="LEAVE"?(
                            <span style={{fontSize:9,fontWeight:600,color:entry.sh==="LEAVE"?C.red:C.light,background:entry.sh==="LEAVE"?"#fee2e2":"#f1f5f9",padding:"2px 5px",borderRadius:4}}>{entry.sh==="LEAVE"?"Leave":"Off"}</span>
                          ):cap?(
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                              <div style={{width:24,height:24,borderRadius:7,background:cap.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8.5,fontWeight:800,color:"#fff"}}>{cap.initials}</div>
                              <span style={{fontSize:7.5,fontWeight:700,color:sh.color,background:sh.bg,padding:"1px 4px",borderRadius:3}}>{sh.id}</span>
                            </div>
                          ):(
                            <span style={{fontSize:10,color:"#cbd5e1"}}>—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          {canEdit&&<div style={{padding:"8px 12px",background:"#f8fafc",borderTop:`1px solid ${C.borderLight}`,fontSize:11,color:C.light}}>Tap any cell to assign a captain</div>}
        </Card>
      )}
      {tab==="Captains"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {CAPTAINS.map(cap=>{
            let days=0;const vs=new Set();
            week.forEach(d=>{const k=dk(d);vessels.forEach(v=>{if(roster[v]?.[k]?.cap===cap.id){days++;vs.add(v);}});});
            return (
              <Card key={cap.id} style={{padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:cap.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>{cap.initials}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <div><div style={{fontWeight:800,fontSize:14,color:C.text}}>{cap.name}</div><div style={{fontSize:11,color:C.light,fontFamily:"monospace"}}>{cap.phone}</div></div>
                      <span style={{fontSize:14,fontWeight:800,color:cap.color}}>{days}<span style={{fontSize:10,color:C.light,fontWeight:400}}>/7d</span></span>
                    </div>
                    <div style={{height:4,background:"#f1f5f9",borderRadius:2,overflow:"hidden",marginBottom:7}}>
                      <div style={{height:"100%",width:`${Math.round((days/7)*100)}%`,background:cap.color,borderRadius:2}}/>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {[...vs].length>0?[...vs].map(v=><span key={v} style={{fontSize:10,fontWeight:600,color:C.mid,background:"#f1f5f9",padding:"2px 7px",borderRadius:5}}>{v}</span>):<span style={{fontSize:10,color:C.light}}>No assignments</span>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {tab==="Shifts"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {SHIFTS.map(st=>(
            <div key={st.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:st.bg,borderRadius:12,border:`1px solid ${st.color}22`}}>
              <div style={{width:36,height:36,borderRadius:9,background:st.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:800,color:"#fff"}}>{st.id}</span></div>
              <div><div style={{fontWeight:700,fontSize:13,color:C.text}}>{st.label}</div>{st.time&&<div style={{fontSize:11,color:C.mid,marginTop:1,fontFamily:"monospace"}}>{st.time}</div>}</div>
            </div>
          ))}
          <Card style={{padding:"16px",marginTop:6}}>
            <div style={{fontWeight:800,fontSize:13,color:C.text,marginBottom:10}}>Captain Directory</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {CAPTAINS.map(cap=>(
                <div key={cap.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#f8fafc",borderRadius:9}}>
                  <div style={{width:28,height:28,borderRadius:7,background:cap.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9.5,fontWeight:800,color:"#fff",flexShrink:0}}>{cap.initials}</div>
                  <div><div style={{fontSize:11,fontWeight:700,color:C.text}}>{cap.name}</div><div style={{fontSize:10,color:C.light,fontFamily:"monospace"}}>{cap.phone}</div></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      {editCell&&(
        <Modal title={`Assign – ${editCell.vessel}`} onClose={()=>setEditCell(null)}>
          <RosterEdit vessel={editCell.vessel} dayKey={editCell.k} current={roster[editCell.vessel]?.[editCell.k]||{cap:null,sh:"AM"}} onSave={save} onClose={()=>setEditCell(null)}/>
        </Modal>
      )}
    </div>
  );
}
function RosterEdit({vessel,dayKey,current,onSave,onClose}) {
  const [capId,setCapId]=useState(current.cap||"");
  const [sh,setSh]=useState(current.sh||"AM");
  const pts=dayKey.split("-");const MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return (
    <div>
      <div style={{fontSize:12,color:C.mid,marginBottom:14,fontWeight:600}}>{parseInt(pts[2])} {MO[parseInt(pts[1])-1]} {pts[0]}</div>
      <Field label="Captain">
        <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:220,overflowY:"auto"}}>
          {CAPTAINS.map(cap=>(
            <button key={cap.id} onClick={()=>setCapId(cap.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",borderRadius:10,border:`1px solid ${capId===cap.id?cap.color:C.border}`,background:capId===cap.id?`${cap.color}11`:"#fff",cursor:"pointer",textAlign:"left"}}>
              <div style={{width:28,height:28,borderRadius:7,background:cap.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0}}>{cap.initials}</div>
              <span style={{fontSize:13,fontWeight:600,color:C.text,flex:1}}>{cap.name}</span>
              <span style={{fontSize:11,color:C.light,fontFamily:"monospace"}}>{cap.phone}</span>
              {capId===cap.id&&<Icon name="check" size={14} color={cap.color} sw={2.5}/>}
            </button>
          ))}
          <button onClick={()=>setCapId("")} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",borderRadius:10,border:`1px solid ${!capId?C.red:C.border}`,background:!capId?"#fff1f2":"#fff",cursor:"pointer"}}>
            <div style={{width:28,height:28,borderRadius:7,background:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="x" size={11} color={C.red}/></div>
            <span style={{fontSize:13,fontWeight:600,color:C.red}}>Unassigned / Off</span>
          </button>
        </div>
      </Field>
      <Field label="Shift">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {SHIFTS.map(s=>(
            <button key={s.id} onClick={()=>setSh(s.id)} style={{padding:"10px 8px",borderRadius:10,border:`1px solid ${sh===s.id?s.color:C.border}`,background:sh===s.id?s.bg:"#fff",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:12,fontWeight:700,color:sh===s.id?s.color:C.text}}>{s.label}</div>
              {s.time&&<div style={{fontSize:9.5,color:sh===s.id?s.color:C.light,marginTop:1,fontFamily:"monospace"}}>{s.time}</div>}
            </button>
          ))}
        </div>
      </Field>
      <div style={{display:"flex",gap:8}}>
        <Btn full onClick={()=>onSave(vessel,dayKey,capId||null,sh)}>Save</Btn>
        <Btn variant="outline" onClick={onClose} style={{padding:"10px 16px"}}>Cancel</Btn>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAINTENANCE
════════════════════════════════════════ */
function Maintenance() {
  const sc={overdue:"#dc2626","due-soon":"#d97706",scheduled:"#0a6152"};
  const pc={High:["#fee2e2","#dc2626"],Medium:["#fff7ed","#d97706"],Low:["#dcfce7","#15803d"]};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><h1 style={{margin:0,fontSize:20,fontWeight:900,color:C.text}}>Maintenance</h1><p style={{margin:"4px 0 0",fontSize:12,color:C.light}}>Preventive maintenance schedule</p></div>
        <Btn iconName="plus" small>Add Task</Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {MAINTENANCE_DATA.map((m,i)=>(
          <Card key={i} style={{padding:"14px 16px",borderLeft:`4px solid ${sc[m.status]||C.mid}`,background:m.status==="due-soon"?"#fffbeb":m.status==="overdue"?"#fff1f2":"#fff"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div style={{fontWeight:800,fontSize:14,color:C.text}}>{m.vessel}</div>
              <span style={{background:pc[m.priority][0],color:pc[m.priority][1],padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,flexShrink:0}}>{m.priority}</span>
            </div>
            <div style={{fontSize:13,color:C.mid,marginBottom:8}}>{m.task}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:sc[m.status]}}>Due: {m.due}</span>
              <span style={{color:sc[m.status],fontWeight:700,fontSize:11,background:m.status==="overdue"?"#fee2e2":m.status==="due-soon"?"#fff7ed":"#dcfce7",padding:"2px 8px",borderRadius:10}}>{m.status}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   CHECKLISTS
════════════════════════════════════════ */
function Checklists({user,completedChecklists,setCompletedChecklists,sendEmail,saveChecklist,updateChecklist}) {
  const m = useMobile();
  const [tab,setTab]=useState("New Checklist");
  const [sel,setSel]=useState(null);
  const [vals,setVals]=useState({});
  const [portHrs,setPortHrs]=useState("");
  const [stbdHrs,setStbdHrs]=useState("");
  const [approvals,setApprovals]=useState([]);
  const isReviewer=user?.isAdmin;
  const setV=(id,v)=>setVals(p=>({...p,[id]:v}));
  const answered=CHECKLIST_ITEMS.filter(item=>{const v=vals[item.id];return v&&v!==""}).length;
  const allDone=answered===CHECKLIST_ITEMS.length;
  const hasWarn=CHECKLIST_ITEMS.some(item=>{
    const v=vals[item.id];if(!v)return false;
    return (item.type==="HLN"&&(v==="High"||v==="Low"))||(item.type==="LN"&&v==="Low")||(item.type==="YN"&&v==="No")||(item.type==="LEAK"&&v==="Yes")||(item.type==="WP"&&v==="No")||(item.type==="ALARM"&&v==="Yes")||((item.type==="KPA"||item.type==="TEMP")&&item.limit&&Number(v)>item.limit);
  });
  const submit=()=>{
    const r={id:Date.now(),vessel:sel,date:new Date().toLocaleDateString(),by:user?.name,hasWarn,taStatus:"Pending",tmStatus:"Pending"};
    setApprovals(a=>[r,...a]);
    if(saveChecklist) saveChecklist(r); else setCompletedChecklists(c=>[r,...c]);
    sendEmail(mkEmail({to:EMAIL_RCPT.checklist.join(","),subject:`Checklist – ${sel}`,body:`Daily checklist submitted for ${sel}.\nBy: ${user?.name}${hasWarn?"\n⚠ Issues flagged.":""}`,type:"checklist"}));
    setSel(null);setVals({});setPortHrs("");setStbdHrs("");setTab("Completed");
  };
  const approve=(id,step,action)=>{
    const key=step===1?"taStatus":"tmStatus";
    setApprovals(a=>a.map(r=>r.id===id?{...r,[key]:action}:r));
    if(updateChecklist) updateChecklist(id,key,action);
    else setCompletedChecklists(c=>c.map(r=>r.id===id?{...r,[key]:action}:r));
  };
  const renderInput=(item)=>{
    const v=vals[item.id]||"";
    const bad=(item.type==="HLN"&&(v==="High"||v==="Low"))||(item.type==="LN"&&v==="Low")||(item.type==="YN"&&v==="No")||(item.type==="LEAK"&&v==="Yes")||(item.type==="WP"&&v==="No")||(item.type==="ALARM"&&v==="Yes")||((item.type==="KPA"||item.type==="TEMP")&&item.limit&&Number(v)>item.limit);
    const ob=(lbl,isAct,isGood,isBad)=>(<button onClick={()=>setV(item.id,lbl)} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",background:isAct?(isBad?"#fee2e2":isGood?"#dcfce7":"#dbeafe"):"#f1f5f9",color:isAct?(isBad?"#dc2626":isGood?"#15803d":"#1d4ed8"):C.mid}}>{lbl}</button>);
    if(item.type==="HLN") return <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{ob("High",v==="High",false,true)}{ob("Low",v==="Low",false,true)}{ob("Normal",v==="Normal",true,false)}</div>;
    if(item.type==="LN") return <div style={{display:"flex",gap:6}}>{ob("Low",v==="Low",false,true)}{ob("Normal",v==="Normal",true,false)}</div>;
    if(item.type==="YN") return <div style={{display:"flex",gap:6}}>{ob("Yes",v==="Yes",true,false)}{ob("No",v==="No",false,true)}</div>;
    if(item.type==="LEAK") return <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>{ob("No",v==="No",true,false)}{ob("Yes",v==="Yes",false,true)}{v==="Yes"&&<span style={{fontSize:11,color:C.red,fontWeight:700}}>⚠ Check immediately</span>}</div>;
    if(item.type==="WP") return <div style={{display:"flex",gap:6}}>{ob("Yes",v==="Yes",true,false)}{ob("No",v==="No",false,true)}</div>;
    if(item.type==="ALARM") return <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>{ob("No",v==="No",true,false)}{ob("Yes",v==="Yes",false,true)}{v==="Yes"&&<span style={{fontSize:11,color:C.red,fontWeight:700}}>⚠ Investigate</span>}</div>;
    if(item.type==="VOLT") return <div style={{display:"flex",alignItems:"center",gap:7}}><input value={v} onChange={e=>setV(item.id,e.target.value)} type="number" placeholder="12.6" style={{width:80,padding:"6px 9px",borderRadius:7,border:`1px solid ${v?C.primary:C.border}`,fontSize:13,fontFamily:"monospace",outline:"none"}}/><span style={{fontSize:11,color:C.mid}}>V</span>{v&&<span style={{fontSize:10,color:Number(v)>=12&&Number(v)<=14.4?"#15803d":C.red,fontWeight:700}}>{Number(v)>=12&&Number(v)<=14.4?"✓":"⚠"}</span>}</div>;
    if(item.type==="KPA"||item.type==="TEMP") return <div style={{display:"flex",alignItems:"center",gap:7}}><input value={v} onChange={e=>setV(item.id,e.target.value)} type="number" placeholder="0" style={{width:72,padding:"6px 9px",borderRadius:7,border:`1px solid ${v?(bad?C.red:C.primary):C.border}`,fontSize:13,fontFamily:"monospace",outline:"none"}}/><span style={{fontSize:11,color:C.mid}}>{item.unit}</span>{v&&item.limit&&<span style={{fontSize:10,color:bad?C.red:"#15803d",fontWeight:700}}>{bad?`⚠ Exceeds ${item.limit}`:"✓ OK"}</span>}</div>;
    return null;
  };
  return (
    <div>
      <div style={{marginBottom:14}}><h1 style={{margin:0,fontSize:20,fontWeight:900,color:C.text}}>Daily Checklist</h1><p style={{margin:"4px 0 0",fontSize:12,color:C.light}}>Baros Daily Maintenance Check Sheet</p></div>
      <Tabs tabs={["New Checklist","Completed",...(isReviewer?["Approvals"]:[])]} active={tab} onChange={setTab}/>

      {tab==="New Checklist"&&!sel&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {FLEET.map(v=>(
            <button key={v.id} onClick={()=>{setSel(v.id);setVals({});}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:12,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",textAlign:"left"}}>
              <div style={{width:38,height:38,borderRadius:10,background:`${v.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>⚓</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,color:C.text}}>{v.id}</div>
                <div style={{fontSize:11,color:C.light,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.eng} · {v.engMake}</div>
              </div>
              <span style={{background:v.status==="active"?"#dcfce7":v.status==="maintenance"?"#fee2e2":"#fef3c7",color:v.status==="active"?"#15803d":v.status==="maintenance"?"#dc2626":"#92400e",padding:"3px 9px",borderRadius:12,fontSize:10,fontWeight:700,flexShrink:0}}>{v.status}</span>
              <Icon name="chevron_r" size={16} color={C.light}/>
            </button>
          ))}
        </div>
      )}

      {tab==="New Checklist"&&sel&&(
        <div>
          {/* Header */}
          <div style={{background:"#0d1f3c",borderRadius:14,padding:"14px 16px",marginBottom:12,color:"#fff"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div><div style={{fontSize:10,color:"rgba(255,255,255,.45)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>Daily Maintenance Check List</div><div style={{fontSize:17,fontWeight:900}}>{sel}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"rgba(255,255,255,.4)"}}>Date</div><div style={{fontSize:12,fontWeight:700}}>{new Date().toLocaleDateString("en-GB")}</div></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["Port Running Hrs",portHrs,setPortHrs],["Stbd Running Hrs",stbdHrs,setStbdHrs]].map(([lbl,val,setter])=>(
                <div key={lbl} style={{background:"rgba(255,255,255,.08)",borderRadius:8,padding:"7px 10px"}}>
                  <div style={{fontSize:9,color:"rgba(255,255,255,.4)",textTransform:"uppercase",marginBottom:3}}>{lbl}</div>
                  <input value={val} onChange={e=>setter(e.target.value)} placeholder="hours" type="number" style={{width:"100%",background:"rgba(255,255,255,.12)",border:"none",borderRadius:5,padding:"4px 7px",color:"#fff",fontSize:13,fontFamily:"monospace",outline:"none"}}/>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5,padding:0}}>
              ← Back
            </button>
            <span style={{background:"#f0fdf4",color:C.primary,padding:"3px 10px",borderRadius:12,fontSize:10,fontWeight:700}}>{answered}/20 complete</span>
          </div>
          <div style={{height:4,background:"#f1f5f9",borderRadius:2,overflow:"hidden",marginBottom:12}}>
            <div style={{height:"100%",width:`${(answered/20)*100}%`,background:hasWarn?"linear-gradient(90deg,#ea580c,#ef4444)":"linear-gradient(90deg,#0a6152,#22c55e)",borderRadius:2}}/>
          </div>

          {/* Mobile-friendly: each item is a card */}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
            {CHECKLIST_ITEMS.map((item)=>{
              const v=vals[item.id]||"";
              const bad=(item.type==="HLN"&&(v==="High"||v==="Low"))||(item.type==="LN"&&v==="Low")||(item.type==="YN"&&v==="No")||(item.type==="LEAK"&&v==="Yes")||(item.type==="WP"&&v==="No")||(item.type==="ALARM"&&v==="Yes")||((item.type==="KPA"||item.type==="TEMP")&&item.limit&&Number(v)>item.limit);
              const good=v!==""&&!bad;
              return (
                <div key={item.id} style={{padding:"13px 14px",borderRadius:12,background:bad?"#fff8f5":good?"#fafffe":"#fff",border:`1px solid ${bad?"#fca5a5":good?"#bbf7d0":C.border}`}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                    <div style={{width:24,height:24,borderRadius:7,background:bad?"#fee2e2":good?"#dcfce7":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:bad?"#dc2626":good?"#15803d":C.light,flexShrink:0}}>{String(item.id).padStart(2,"0")}</div>
                    <div style={{fontSize:13,fontWeight:600,color:C.text,lineHeight:1.4,flex:1}}>{item.desc}</div>
                  </div>
                  <div style={{paddingLeft:34}}>
                    {renderInput(item)}
                    <input placeholder="Remarks…" style={{width:"100%",padding:"7px 10px",borderRadius:8,border:`1px solid ${C.borderLight}`,fontSize:12,color:C.text,background:"transparent",outline:"none",marginTop:8}}/>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{background:"#f8f7f4",borderRadius:10,padding:"11px 13px",marginBottom:12,fontSize:12,color:C.mid,lineHeight:1.5}}>
            <strong>Instructions:</strong> Put tick mark after checking. Make remarks if any repair/damage happen.
          </div>
          {allDone&&(
            <div style={{background:hasWarn?"#fff7ed":"#f0fdf4",border:`1px solid ${hasWarn?"#fed7aa":"#bbf7d0"}`,borderRadius:12,padding:"16px"}}>
              <div style={{fontWeight:800,fontSize:14,color:hasWarn?"#c2410c":"#15803d",marginBottom:6}}>{hasWarn?"⚠ Issues noted":"✓ All 20 checks complete"}</div>
              <p style={{fontSize:12,color:hasWarn?"#92400e":"#166534",marginBottom:12}}>Will be sent to Transport Asst. Manager → Transport Manager for approval.</p>
              <Btn full onClick={submit} iconName="send">Submit for Approval</Btn>
            </div>
          )}
        </div>
      )}

      {tab==="Completed"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {completedChecklists.length===0&&<Card style={{padding:"40px 20px",textAlign:"center",color:C.light}}><Icon name="checklist" size={40} color="#d1d5db"/><div style={{marginTop:12,fontWeight:600}}>No completed checklists yet</div></Card>}
          {completedChecklists.map(cl=>(
            <Card key={cl.id} style={{padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div><div style={{fontWeight:800,fontSize:14,color:C.text}}>{cl.vessel}</div><div style={{fontSize:11,color:C.light,marginTop:2}}>{cl.date} · {cl.by}</div></div>
                {cl.hasWarn&&<span style={{background:"#fff7ed",color:"#c2410c",padding:"3px 9px",borderRadius:12,fontSize:10,fontWeight:700}}>⚠ Issues</span>}
              </div>
              {[{role:"TA Manager",key:"taStatus"},{role:"T Manager",key:"tmStatus"}].map(({role,key})=>(
                <div key={key} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderTop:`1px solid ${C.borderLight}`}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:cl[key]==="Approved"?"#16a34a":cl[key]==="Rejected"?C.red:"#f59e0b"}}/>
                  <span style={{fontSize:12,color:C.mid,flex:1}}>{role}</span>
                  <span style={{fontSize:11,fontWeight:700,color:cl[key]==="Approved"?"#16a34a":cl[key]==="Rejected"?C.red:"#f59e0b"}}>{cl[key]}</span>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}

      {tab==="Approvals"&&isReviewer&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {approvals.length===0&&<Card style={{padding:"40px 20px",textAlign:"center",color:C.light}}><Icon name="mail" size={40} color="#d1d5db"/><div style={{marginTop:12,fontWeight:600}}>No pending approvals</div></Card>}
          {approvals.map(cl=>(
            <Card key={cl.id} style={{padding:"14px 16px"}}>
              <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:2}}>{cl.vessel}</div>
              <div style={{fontSize:11,color:C.light,marginBottom:12}}>{cl.date} · {cl.by}{cl.hasWarn?" · ⚠ Issues noted":""}</div>
              {(user?.role==="TA Manager"||user?.isAdmin)&&cl.taStatus==="Pending"&&(
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.mid,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.06em"}}>TA Manager Review</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><Btn variant="green" onClick={()=>approve(cl.id,1,"Approved")}>✓ Approve</Btn><Btn variant="danger" onClick={()=>approve(cl.id,1,"Rejected")}>✕ Reject</Btn></div>
                </div>
              )}
              {(user?.role==="T Manager"||user?.isAdmin)&&cl.taStatus==="Approved"&&cl.tmStatus==="Pending"&&(
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:C.mid,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.06em"}}>T Manager – Final Review</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><Btn variant="green" onClick={()=>approve(cl.id,2,"Approved")}>✓ Final Approve</Btn><Btn variant="danger" onClick={()=>approve(cl.id,2,"Rejected")}>✕ Reject</Btn></div>
                </div>
              )}
              {[{role:"TA Manager",key:"taStatus"},{role:"T Manager",key:"tmStatus"}].map(({role,key})=>(
                <div key={key} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderTop:`1px solid ${C.borderLight}`}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:cl[key]==="Approved"?"#16a34a":cl[key]==="Rejected"?C.red:"#f59e0b"}}/>
                  <span style={{fontSize:12,color:C.mid,flex:1}}>{role}</span>
                  <span style={{fontSize:11,fontWeight:700,color:cl[key]==="Approved"?"#16a34a":cl[key]==="Rejected"?C.red:"#f59e0b"}}>{cl[key]}</span>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   REPORTS
════════════════════════════════════════ */
function Reports({completedChecklists}) {
  const [tab,setTab]=useState("Export");
  const rpts=[{label:"Daily Movement Report",icon:"movement"},{label:"Monthly Fuel Summary",icon:"fuel"},{label:"Fleet Fuel Balance",icon:"fleet"},{label:"Activity Log",icon:"checklist"},{label:"Maintenance Report",icon:"maintenance"},{label:"Crew Hours Report",icon:"roster"}];
  const dlCSV=name=>{const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent("Date,Vessel,Details\n2026-03-25,Ixora,Guest Transfer");a.download=name.replace(/ /g,"_")+".csv";a.click();};
  return (
    <div>
      <div style={{marginBottom:16}}><h1 style={{margin:0,fontSize:20,fontWeight:900,color:C.text}}>Reports</h1><p style={{margin:"4px 0 0",fontSize:12,color:C.light}}>Export & download reports</p></div>
      <Tabs tabs={["Export","Completed Checklists"]} active={tab} onChange={setTab}/>
      {tab==="Export"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {rpts.map(r=>(
            <Card key={r.label} style={{padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:38,height:38,borderRadius:10,background:C.primaryGlow,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name={r.icon} size={18} color={C.primary}/></div>
                <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:14,color:C.text}}>{r.label}</div><div style={{fontSize:11,color:C.light,marginTop:1}}>Export as CSV or PDF</div></div>
                <div style={{display:"flex",gap:7,flexShrink:0}}>
                  <Btn small variant="outline" iconName="download" onClick={()=>dlCSV(r.label)}>CSV</Btn>
                  <Btn small variant="outline" iconName="pdf">PDF</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {tab==="Completed Checklists"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {completedChecklists.length===0&&<Card style={{padding:"40px 20px",textAlign:"center",color:C.light}}><Icon name="reports" size={40} color="#d1d5db"/><div style={{marginTop:12,fontWeight:600}}>No completed checklists</div></Card>}
          {completedChecklists.map(cl=>(
            <Card key={cl.id} style={{padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <div><div style={{fontWeight:700,fontSize:14,color:C.text}}>{cl.vessel}</div><div style={{fontSize:11,color:C.light}}>{cl.date} · {cl.by}</div></div>
                <div style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
                  <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:12,background:cl.tmStatus==="Approved"?"#dcfce7":cl.tmStatus==="Rejected"?"#fee2e2":"#fef3c7",color:cl.tmStatus==="Approved"?"#15803d":cl.tmStatus==="Rejected"?C.red:"#92400e"}}>{cl.tmStatus}</span>
                  <Btn small variant="outline" iconName="download">Export</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   MAIL CENTRE
════════════════════════════════════════ */
function MailCentre({emails,onCompose}) {
  const m = useMobile();
  const [tab,setTab]=useState("Inbox");
  const [sel,setSel]=useState(null);
  const [composing,setComposing]=useState(false);
  const [draft,setDraft]=useState({to:"",subject:"",body:""});
  const tC={system:"#1d6fa4",checklist:"#15803d",fuel:"#d97706",manual:"#6d28d9"};
  const list=tab==="Inbox"?emails.filter(e=>e.type!=="manual"):emails.filter(e=>e.type==="manual");
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div><h1 style={{margin:0,fontSize:20,fontWeight:900,color:C.text}}>Mail Centre</h1><p style={{margin:"4px 0 0",fontSize:12,color:C.light}}>Automated & manual emails</p></div>
        <Btn iconName="send" onClick={()=>setComposing(true)} small={m}>Compose</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {[{l:"Total",v:emails.length,c:"#1d6fa4"},{l:"Unread",v:emails.filter(e=>!e.read).length,c:"#d97706"},{l:"Automated",v:emails.filter(e=>e.type!=="manual").length,c:"#15803d"}].map(s=>(
          <Card key={s.l} style={{padding:"12px 14px"}}>
            <div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:C.light,marginTop:2}}>{s.l}</div>
          </Card>
        ))}
      </div>
      <Tabs tabs={["Inbox","Sent"]} active={tab} onChange={t=>{setTab(t);setSel(null);}}/>
      {/* On mobile: list full width, detail opens as overlay */}
      <Card style={{overflow:"hidden"}}>
        {list.length===0&&<div style={{padding:"40px 20px",textAlign:"center",color:C.light}}><Icon name="inbox" size={36} color="#d1d5db"/><div style={{marginTop:10,fontWeight:600}}>No emails</div></div>}
        {list.map(em=>(
          <div key={em.id} onClick={()=>setSel(em)} style={{padding:"13px 16px",borderBottom:`1px solid ${C.borderLight}`,cursor:"pointer",background:sel?.id===em.id?"#f0fdf4":"#fff",borderLeft:`3px solid ${tC[em.type]||C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,gap:8}}>
              <span style={{fontWeight:em.read?600:800,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{em.subject}</span>
              <span style={{fontSize:10,color:C.light,flexShrink:0}}>{new Date(em.timestamp).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</span>
            </div>
            <div style={{fontSize:11,color:C.mid}}>To: {em.to.split(",")[0]}{em.to.includes(",")?" +more":""}</div>
            <div style={{fontSize:11,color:C.light,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{em.body.slice(0,60)}…</div>
          </div>
        ))}
      </Card>
      {/* Email detail — as modal/sheet on mobile */}
      {sel&&(
        <Modal title={sel.subject} onClose={()=>setSel(null)}>
          <div style={{fontSize:11,color:C.light,marginBottom:3}}>To: <strong style={{color:C.mid}}>{sel.to}</strong></div>
          <div style={{fontSize:11,color:C.light,marginBottom:16}}>{new Date(sel.timestamp).toLocaleString("en-GB")} MVT</div>
          <div style={{fontSize:13,color:C.text,lineHeight:1.7,whiteSpace:"pre-wrap",background:"#faf9f7",borderRadius:9,padding:"13px 14px",border:`1px solid ${C.border}`}}>{sel.body}</div>
        </Modal>
      )}
      {composing&&(
        <Modal title="Compose Email" onClose={()=>setComposing(false)}>
          <Field label="To"><Inp value={draft.to} onChange={v=>setDraft(d=>({...d,to:v}))} placeholder="recipient@baros.com"/></Field>
          <Field label="Subject"><Inp value={draft.subject} onChange={v=>setDraft(d=>({...d,subject:v}))} placeholder="Subject…"/></Field>
          <Field label="Message"><textarea value={draft.body} onChange={e=>setDraft(d=>({...d,body:e.target.value}))} placeholder="Write your message…" style={{width:"100%",padding:"11px 13px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:14,color:C.text,background:"#fafbfc",outline:"none",minHeight:130,resize:"vertical",fontFamily:"inherit"}}/></Field>
          <Btn full iconName="send" onClick={()=>{onCompose(mkEmail({to:draft.to,subject:draft.subject,body:draft.body,type:"manual"}));setComposing(false);setDraft({to:"",subject:"",body:""});}}>Send Email</Btn>
        </Modal>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   APP SHELL
════════════════════════════════════════ */
const NAV=[
  {id:"dashboard",  label:"Dashboard",    icon:"dashboard"},
  {id:"movement",   label:"Boat Movement",icon:"movement"},
  {id:"fleet",      label:"Fleet",        icon:"fleet"},
  {id:"fuel",       label:"Fuel Log",     icon:"fuel"},
  {id:"roster",     label:"Duty Roster",  icon:"roster"},
  {id:"maintenance",label:"Maintenance",  icon:"maintenance"},
  {id:"checklists", label:"Checklists",   icon:"checklist"},
  {id:"reports",    label:"Reports",      icon:"reports"},
  {id:"mail",       label:"Mail",         icon:"mail"},
];
const BOTTOM_NAV=[
  {id:"dashboard",  label:"Home",    icon:"dashboard"},
  {id:"movement",   label:"Movement",icon:"movement"},
  {id:"fuel",       label:"Fuel",    icon:"fuel"},
  {id:"checklists", label:"Checklist",icon:"checklist"},
  {id:"more",       label:"More",    icon:"menu"},
];
const DRAWER_NAV=[
  {id:"fleet",      label:"Fleet",      icon:"fleet"},
  {id:"roster",     label:"Roster",     icon:"roster"},
  {id:"maintenance",label:"Maintenance",icon:"maintenance"},
  {id:"reports",    label:"Reports",    icon:"reports"},
  {id:"mail",       label:"Mail",       icon:"mail"},
];

function Login({onLogin}) {
  const [un,setUn]=useState(""); const [pw,setPw]=useState(""); const [err,setErr]=useState(""); const [ld,setLd]=useState(false); const [show,setShow]=useState(false);
  const go=()=>{setErr("");setLd(true);setTimeout(()=>{const u=USERS.find(u=>u.username===un.trim()&&u.password===pw);if(u)onLogin(u);else setErr("Invalid credentials.");setLd(false);},600);};
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a1120 0%,#0f1f38 50%,#082018 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Plus Jakarta Sans','Segoe UI',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{width:"100%",maxWidth:390}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#0f7a67,#0a6152)",marginBottom:14,boxShadow:"0 8px 24px rgba(10,97,82,.5)"}}>
            <Icon name="anchor" size={28} color="#fff" sw={1.8}/>
          </div>
          <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"0.1em"}}>BAROS</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:"0.2em",fontWeight:600,marginTop:4}}>VESSEL MANAGEMENT SYSTEM</div>
        </div>
        <div style={{background:"rgba(255,255,255,.07)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.1)",borderRadius:20,padding:"24px 22px",boxShadow:"0 20px 60px rgba(0,0,0,.4)"}}>
          <h2 style={{fontSize:17,fontWeight:800,color:"#fff",marginBottom:4}}>Welcome back</h2>
          <p style={{fontSize:12,color:"rgba(255,255,255,.38)",marginBottom:20}}>Sign in to your VMS account</p>
          {err&&<div style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",color:"#fca5a5",borderRadius:9,padding:"9px 13px",fontSize:13,fontWeight:600,marginBottom:14}}>{err}</div>}
          <div style={{marginBottom:12}}>
            <label style={{display:"block",fontSize:10,fontWeight:700,color:"rgba(255,255,255,.38)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.08em"}}>Username</label>
            <input value={un} onChange={e=>setUn(e.target.value)} placeholder="Enter username" onKeyDown={e=>e.key==="Enter"&&go()} style={{width:"100%",padding:"12px 13px",borderRadius:11,border:"1px solid rgba(255,255,255,.12)",fontSize:14,color:"#fff",background:"rgba(255,255,255,.07)",outline:"none"}}/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:10,fontWeight:700,color:"rgba(255,255,255,.38)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.08em"}}>Password</label>
            <div style={{position:"relative"}}>
              <input value={pw} onChange={e=>setPw(e.target.value)} type={show?"text":"password"} placeholder="Enter password" onKeyDown={e=>e.key==="Enter"&&go()} style={{width:"100%",padding:"12px 42px 12px 13px",borderRadius:11,border:"1px solid rgba(255,255,255,.12)",fontSize:14,color:"#fff",background:"rgba(255,255,255,.07)",outline:"none"}}/>
              <button onClick={()=>setShow(!show)} style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",display:"flex"}}><Icon name="eye" size={16} color="rgba(255,255,255,.35)"/></button>
            </div>
          </div>
          <button onClick={go} disabled={ld||!un||!pw} style={{width:"100%",padding:"13px",borderRadius:11,background:!ld&&un&&pw?"linear-gradient(135deg,#0f7a67,#0a6152)":"rgba(255,255,255,.08)",color:!ld&&un&&pw?"#fff":"rgba(255,255,255,.3)",border:"none",fontSize:14,fontWeight:700,cursor:ld||!un||!pw?"not-allowed":"pointer",boxShadow:!ld&&un&&pw?"0 4px 14px rgba(10,97,82,.45)":"none"}}>{ld?"Signing in…":"Sign In →"}</button>
          <div style={{marginTop:20,background:"rgba(255,255,255,.04)",borderRadius:10,padding:"12px 13px",border:"1px solid rgba(255,255,255,.07)"}}>
            <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.25)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.1em"}}>Quick access</div>
            {[["superadmin","Baros@2026","Super Admin"],["ops.manager","Ops@2026","Admin"],["nasru","Captain@2026","Captain"],["tamanager","TAMgr@2026","TA Manager"]].map(([u,p,r])=>(
              <div key={u} onClick={()=>{setUn(u);setPw(p);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <span style={{fontSize:12,fontFamily:"monospace",color:"rgba(255,255,255,.6)"}}>{u}</span>
                <span style={{fontSize:10,color:"rgba(255,255,255,.25)",background:"rgba(255,255,255,.07)",padding:"2px 7px",borderRadius:5}}>{r}</span>
              </div>
            ))}
            <div style={{fontSize:10,color:"rgba(255,255,255,.18)",marginTop:7}}>Tap any row to auto-fill</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user,setUser]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [fleet,setFleet]=useState(FLEET);
  const [fuelLog,setFuelLog]=useState(FUEL_LOG_INIT);
  const [fuelBal,setFuelBal]=useState({Serenity:280,Ixora:85,Vitesse:310,Tara:110,Xari:420,Heliconia:180,Isadora:160,Nooma:120,Areena:240,Wahoo:140,"Party Craft":200,Dingy:50});
  const [trips,setTrips]=useState({Serenity:5,Ixora:11,Vitesse:2,Tara:13,Xari:8,Heliconia:6,Isadora:7,Nooma:4,Areena:5,Wahoo:3,"Party Craft":9,Dingy:4});
  const [completedChecklists,setCompletedChecklists]=useState([]);
  const [emails,setEmails]=useState([
    mkEmail({to:"tamanager@baros.com",subject:"System: VMS Platform Activated",body:"Baros VMS is now active. Automated emails operational.",type:"system"}),
    mkEmail({to:"ops@baros.com,transport@baros.com",subject:"Fuel Alert – Ixora & Tara",body:"Ixora: 85L remaining (lower cap: 80L)\nTara: 110L remaining (lower cap: 100L)\n\nPlease arrange refuelling.",type:"fuel"}),
  ]);
  const [dbReady,setDbReady]=useState(false);
  const [now,setNow]=useState(new Date());
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [drawerOpen,setDrawerOpen]=useState(false);
  const w=useWidth();
  const isMobile=w<768;
  const isTablet=w>=768&&w<1100;

  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),10000);return()=>clearInterval(t);},[]);

  /* ── Load all data from Supabase on mount ── */
  useEffect(()=>{
    async function loadAll() {
      try {
        // Fleet
        const {data:fleetData} = await db.from("fleet").select("*");
        if(fleetData&&fleetData.length>0) {
          setFleet(fleetData.map(v=>({
            id:v.id, type:v.type, color:v.color,
            fuelCap:v.fuel_cap, cons:v.cons, pax:v.pax,
            refuelAfter:v.refuel_after, fuelMin:v.fuel_min,
            status:v.status, runHrs:v.run_hrs,
            eng:v.eng, engMake:v.eng_make, photo:null,
          })));
        }
        // Fuel balances
        const {data:balData} = await db.from("fuel_balances").select("*");
        if(balData&&balData.length>0) {
          const bal={}, tc={};
          balData.forEach(r=>{bal[r.vessel_id]=r.balance; tc[r.vessel_id]=r.trip_count;});
          setFuelBal(bal); setTrips(tc);
        }
        // Fuel log
        const {data:logData} = await db.from("fuel_log").select("*").order("created_at",{ascending:false}).limit(50);
        if(logData&&logData.length>0) {
          setFuelLog(logData.map(r=>({id:r.id,date:r.date,vessel:r.vessel,supplier:r.supplier,litres:r.litres,cost:r.cost,notes:r.notes})));
        }
        // Checklists
        const {data:clData} = await db.from("checklists").select("*").order("created_at",{ascending:false}).limit(50);
        if(clData&&clData.length>0) {
          setCompletedChecklists(clData.map(r=>({id:r.id,vessel:r.vessel,date:new Date(r.created_at).toLocaleDateString(),by:r.submitted_by,hasWarn:r.has_warning,taStatus:r.ta_status,tmStatus:r.tm_status})));
        }
        // Emails
        const {data:emailData} = await db.from("emails").select("*").order("created_at",{ascending:false}).limit(30);
        if(emailData&&emailData.length>0) {
          setEmails(emailData.map(r=>({id:r.id,to:r.to_addr,from:r.from_addr,subject:r.subject,body:r.body,type:r.type,read:r.read,timestamp:r.created_at})));
        }
        setDbReady(true);
      } catch(err) {
        console.error("Supabase load error:",err);
        setDbReady(true); // still show app with local data
      }
    }
    loadAll();
  },[]);

  /* ── Save email to Supabase ── */
  const sendEmail=useCallback(async (email)=>{
    setEmails(prev=>[email,...prev]);
    try {
      await db.from("emails").insert({
        to_addr:email.to, from_addr:email.from,
        subject:email.subject, body:email.body, type:email.type,
      });
    } catch(err){console.error("Email save error:",err);}
  },[]);

  /* ── Save fuel entry to Supabase ── */
  const saveFuelEntry=useCallback(async (entry)=>{
    setFuelLog(l=>[entry,...l]);
    setFuelBal(b=>({...b,[entry.vessel]:Math.min((b[entry.vessel]||0)+entry.litres, fleet.find(v=>v.id===entry.vessel)?.fuelCap||999)}));
    setTrips(t=>({...t,[entry.vessel]:0}));
    try {
      await db.from("fuel_log").insert({
        date:entry.date, vessel:entry.vessel,
        supplier:entry.supplier, litres:entry.litres,
        cost:entry.cost, notes:entry.notes,
        created_by:user?.name||"VMS",
      });
      await db.from("fuel_balances").upsert({
        vessel_id:entry.vessel,
        balance:Math.min((fuelBal[entry.vessel]||0)+entry.litres, fleet.find(v=>v.id===entry.vessel)?.fuelCap||999),
        trip_count:0,
        updated_at:new Date().toISOString(),
      });
    } catch(err){console.error("Fuel save error:",err);}
  },[fleet,fuelBal,user]);

  /* ── Save checklist to Supabase ── */
  const saveChecklist=useCallback(async (cl)=>{
    setCompletedChecklists(c=>[cl,...c]);
    try {
      const {data} = await db.from("checklists").insert({
        vessel:cl.vessel, submitted_by:cl.by,
        has_warning:cl.hasWarn,
        ta_status:"Pending", tm_status:"Pending",
      }).select().single();
      if(data) {
        setCompletedChecklists(c=>c.map(r=>r.id===cl.id?{...r,id:data.id}:r));
      }
    } catch(err){console.error("Checklist save error:",err);}
  },[]);

  /* ── Update checklist approval in Supabase ── */
  const updateChecklist=useCallback(async (id,key,value)=>{
    setCompletedChecklists(c=>c.map(r=>r.id===id?{...r,[key]:value}:r));
    try {
      const dbKey = key==="taStatus"?"ta_status":"tm_status";
      await db.from("checklists").update({[dbKey]:value}).eq("id",id);
    } catch(err){console.error("Checklist update error:",err);}
  },[]);

  const nav=p=>{if(p==="more"){setDrawerOpen(true);return;}setPage(p);setSidebarOpen(false);setDrawerOpen(false);};

  if(!user) return <Login onLogin={u=>{setUser(u);setPage("dashboard");}}/>;

  /* ── Loading screen while DB connects ── */
  if(!dbReady) return (
    <div style={{minHeight:"100vh",background:"#0a1120",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#0f7a67,#0a6152)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,boxShadow:"0 8px 24px rgba(10,97,82,.5)"}}>
        <Icon name="anchor" size={26} color="#fff" sw={1.8}/>
      </div>
      <div style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"0.08em",marginBottom:8}}>BAROS VMS</div>
      <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:32}}>Connecting to database…</div>
      <div style={{display:"flex",gap:6}}>
        {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#0a6152",animation:`pulse 1.2s ${i*0.2}s infinite`}}/>)}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );

  const unread=emails.filter(e=>!e.read).length;
  const pageLabel=NAV.find(n=>n.id===page)?.label||"Dashboard";
  const PAGES={
    dashboard:   <Dashboard setPage={nav} fleet={fleet} fuelBal={fuelBal} trips={trips}/>,
    movement:    <BoatMovement/>,
    fleet:       <Fleet fleet={fleet} setFleet={setFleet} user={user}/>,
    fuel:        <FuelLog fleet={fleet} fuelLog={fuelLog} setFuelLog={setFuelLog} fuelBal={fuelBal} setFuelBal={setFuelBal} trips={trips} setTrips={setTrips} sendEmail={sendEmail} saveFuelEntry={saveFuelEntry}/>,
    roster:      <DutyRoster user={user}/>,
    maintenance: <Maintenance/>,
    checklists:  <Checklists user={user} completedChecklists={completedChecklists} setCompletedChecklists={setCompletedChecklists} sendEmail={sendEmail} saveChecklist={saveChecklist} updateChecklist={updateChecklist}/>,
    reports:     <Reports completedChecklists={completedChecklists}/>,
    mail:        <MailCentre emails={emails} onCompose={sendEmail}/>,
  };

  return (
    <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"'Plus Jakarta Sans','Segoe UI',sans-serif",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(0,0,0,.14);border-radius:3px}
        button,input,select,textarea{font-family:inherit;-webkit-tap-highlight-color:transparent;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @keyframes drawerUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .snav:hover{background:rgba(255,255,255,.07)!important}
        input[type=number]{-moz-appearance:textfield;}
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
      `}</style>

      {/* SIDEBAR (desktop only) */}
      {!isMobile&&(
        <aside style={{width:isTablet?62:244,background:"linear-gradient(180deg,#0d1526 0%,#080f1c 100%)",display:"flex",flexDirection:"column",flexShrink:0,borderRight:"1px solid rgba(255,255,255,.05)",boxShadow:"2px 0 18px rgba(0,0,0,.2)"}}>
          <div style={{padding:isTablet?"18px 12px":"20px 18px 16px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:11,background:"linear-gradient(135deg,#0f7a67,#0a5547)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 10px rgba(10,97,82,.4)"}}>
              <Icon name="anchor" size={17} color="#fff" sw={1.9}/>
            </div>
            {!isTablet&&<div><div style={{fontSize:14,fontWeight:800,color:"#fff",letterSpacing:"0.1em",lineHeight:1}}>BAROS</div><div style={{fontSize:8.5,color:"rgba(255,255,255,.3)",letterSpacing:"0.2em",fontWeight:600,marginTop:3}}>MALDIVES · VMS</div></div>}
          </div>
          <nav style={{flex:1,overflowY:"auto",padding:isTablet?"8px 7px":"10px 10px",scrollbarWidth:"none"}}>
            {NAV.map(n=>{
              const active=page===n.id;
              const badge=n.id==="mail"?unread:0;
              return (
                <button key={n.id} onClick={()=>nav(n.id)} className="snav" title={isTablet?n.label:undefined}
                  style={{display:"flex",alignItems:"center",width:"100%",padding:isTablet?"10px 0":"8px 10px",borderRadius:10,border:"none",cursor:"pointer",gap:isTablet?0:9,marginBottom:1,background:active?"rgba(255,255,255,.1)":"transparent",color:active?"rgba(255,255,255,.95)":"rgba(255,255,255,.4)",justifyContent:isTablet?"center":"flex-start",position:"relative",transition:"all .15s"}}>
                  {active&&!isTablet&&<div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:3,height:18,borderRadius:"0 2px 2px 0",background:"linear-gradient(180deg,#34d399,#10b981)"}}/>}
                  <div style={{width:isTablet?30:26,height:isTablet?30:26,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:active?"rgba(255,255,255,.12)":"transparent",flexShrink:0}}>
                    <Icon name={n.icon} size={isTablet?15:14} color={active?"rgba(255,255,255,.95)":"rgba(255,255,255,.42)"} sw={active?2:1.7}/>
                  </div>
                  {!isTablet&&<span style={{fontSize:12.5,fontWeight:active?700:400,flex:1}}>{n.label}</span>}
                  {!isTablet&&badge>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{badge}</span>}
                </button>
              );
            })}
          </nav>
          {!isTablet&&(
            <div style={{padding:"10px 12px 14px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{background:"rgba(255,255,255,.06)",borderRadius:12,padding:"10px 12px",border:"1px solid rgba(255,255,255,.07)"}}>
                <div style={{display:"flex",alignItems:"center",gap:9}}>
                  <div style={{width:32,height:32,borderRadius:9,background:user.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>{user.initials}</div>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.88)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div><div style={{fontSize:10,color:"rgba(255,255,255,.32)",marginTop:1}}>{user.role}</div></div>
                  <button onClick={()=>setUser(null)} style={{background:"rgba(255,255,255,.07)",border:"none",cursor:"pointer",display:"flex",padding:6,borderRadius:7}}><Icon name="logout" size={13} color="rgba(255,255,255,.45)"/></button>
                </div>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobile&&sidebarOpen&&(
        <>
          <div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:40}}/>
          <aside style={{position:"fixed",left:0,top:0,bottom:0,width:260,background:"linear-gradient(180deg,#0d1526,#080f1c)",zIndex:50,animation:"slideIn .25s ease",display:"flex",flexDirection:"column",boxShadow:"6px 0 30px rgba(0,0,0,.4)"}}>
            <div style={{padding:"20px 16px 14px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#0f7a67,#0a5547)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="anchor" size={16} color="#fff" sw={1.9}/></div>
                <div><div style={{fontSize:14,fontWeight:800,color:"#fff",letterSpacing:"0.1em"}}>BAROS</div><div style={{fontSize:8.5,color:"rgba(255,255,255,.28)",letterSpacing:"0.18em"}}>MALDIVES · VMS</div></div>
              </div>
              <button onClick={()=>setSidebarOpen(false)} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,padding:8,cursor:"pointer",display:"flex"}}><Icon name="x" size={15} color="rgba(255,255,255,.6)"/></button>
            </div>
            <nav style={{flex:1,padding:"10px",overflowY:"auto"}}>
              {NAV.map(n=>{
                const active=page===n.id;
                return (
                  <button key={n.id} onClick={()=>nav(n.id)} style={{display:"flex",alignItems:"center",width:"100%",padding:"12px 12px",borderRadius:10,border:"none",cursor:"pointer",gap:11,marginBottom:1,background:active?"rgba(255,255,255,.1)":"transparent",color:active?"rgba(255,255,255,.95)":"rgba(255,255,255,.44)",position:"relative",textAlign:"left"}}>
                    {active&&<div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:3,height:16,borderRadius:"0 2px 2px 0",background:"linear-gradient(180deg,#34d399,#10b981)"}}/>}
                    <div style={{width:30,height:30,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",background:active?"rgba(255,255,255,.13)":"transparent",flexShrink:0}}><Icon name={n.icon} size={15} color={active?"rgba(255,255,255,.95)":"rgba(255,255,255,.44)"} sw={active?2:1.7}/></div>
                    <span style={{fontSize:14,fontWeight:active?700:400,flex:1}}>{n.label}</span>
                  </button>
                );
              })}
            </nav>
            <div style={{padding:"12px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:9,padding:"10px 11px",background:"rgba(255,255,255,.06)",borderRadius:11}}>
                <div style={{width:34,height:34,borderRadius:9,background:user.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>{user.initials}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,.88)"}}>{user.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,.32)"}}>{user.role}</div></div>
                <button onClick={()=>{setUser(null);setSidebarOpen(false);}} style={{background:"rgba(255,255,255,.08)",border:"none",cursor:"pointer",display:"flex",padding:7,borderRadius:7}}><Icon name="logout" size={14} color="rgba(255,255,255,.45)"/></button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* TOPBAR */}
        <header style={{background:"rgba(255,255,255,.9)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderBottom:"1px solid rgba(0,0,0,.07)",padding:"0 16px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 1px 0 rgba(0,0,0,.04),0 2px 8px rgba(0,0,0,.03)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {isMobile&&<button onClick={()=>setSidebarOpen(true)} style={{width:36,height:36,borderRadius:10,border:"1px solid rgba(0,0,0,.08)",background:"rgba(255,255,255,.8)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="menu" size={16} color={C.mid}/></button>}
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              {!isMobile&&<><span style={{fontSize:11,color:"#c8d0da",fontWeight:500}}>Baros VMS</span><span style={{fontSize:11,color:"#dde2e8"}}>›</span></>}
              <div style={{width:24,height:24,borderRadius:7,background:C.primaryGlow,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name={NAV.find(n=>n.id===page)?.icon||"dashboard"} size={12} color={C.primary} sw={2}/></div>
              <span style={{fontSize:14,fontWeight:700,color:C.text,letterSpacing:"-0.01em"}}>{pageLabel}</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {!isMobile&&<span style={{background:"rgba(124,58,237,.09)",color:C.purple,border:"1px solid rgba(124,58,237,.14)",padding:"4px 10px",borderRadius:20,fontSize:10,fontWeight:700}}>{user.role}</span>}
            <button onClick={()=>nav("mail")} style={{position:"relative",width:34,height:34,borderRadius:9,border:"1px solid rgba(0,0,0,.07)",background:unread>0?"rgba(217,119,6,.07)":"rgba(255,255,255,.7)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon name="bell" size={15} color={unread>0?C.gold:C.mid}/>
              {unread>0&&<span style={{position:"absolute",top:7,right:7,width:7,height:7,borderRadius:"50%",background:"#ef4444",border:"1.5px solid #fff"}}/>}
            </button>
            {!isMobile&&(
              <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(0,0,0,.04)",border:"1px solid rgba(0,0,0,.06)",borderRadius:9,padding:"5px 10px"}}>
                <Icon name="clock" size={11} color={C.light}/>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:C.text}}>{now.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",timeZone:"Indian/Maldives"})}</span>
                <span style={{fontSize:9.5,color:C.light}}>MVT</span>
              </div>
            )}
            <div style={{width:30,height:30,borderRadius:9,background:user.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>{user.initials}</div>
            {!isMobile&&<button onClick={()=>setUser(null)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",border:"1px solid rgba(0,0,0,.08)",borderRadius:8,background:"rgba(255,255,255,.8)",fontSize:11,color:C.mid,cursor:"pointer",fontWeight:600}}><Icon name="logout" size={12} color={C.mid}/>Sign out</button>}
          </div>
        </header>

        <main key={page} style={{flex:1,overflowY:"auto",padding:isMobile?"14px 14px":"22px 26px",paddingBottom:isMobile?"76px":"22px",animation:"fadeIn .2s ease",WebkitOverflowScrolling:"touch"}}>
          {PAGES[page]||<div style={{padding:40,textAlign:"center",color:C.mid,fontWeight:600}}>Page not found</div>}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      {isMobile&&(
        <nav style={{position:"fixed",bottom:0,left:0,right:0,height:62,background:"rgba(255,255,255,.92)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:"1px solid rgba(0,0,0,.08)",display:"flex",alignItems:"stretch",zIndex:30,boxShadow:"0 -4px 20px rgba(0,0,0,.07)"}}>
          {BOTTOM_NAV.map(n=>{
            const active=n.id!=="more"&&page===n.id;
            return (
              <button key={n.id} onClick={()=>nav(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"6px 4px",color:active?C.primary:C.light,position:"relative",WebkitTapHighlightColor:"transparent"}}>
                {active&&<div style={{position:"absolute",inset:"6px 50%",width:40,transform:"translateX(-50%)",background:C.primaryGlow,borderRadius:10,zIndex:0}}/>}
                <div style={{position:"relative",zIndex:1}}><Icon name={n.icon} size={20} color={active?C.primary:C.light} sw={active?2:1.7}/></div>
                <span style={{fontSize:9.5,fontWeight:active?800:500,whiteSpace:"nowrap",position:"relative",zIndex:1}}>{n.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* MORE DRAWER */}
      {isMobile&&drawerOpen&&(
        <>
          <div onClick={()=>setDrawerOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:40}}/>
          <div style={{position:"fixed",bottom:62,left:0,right:0,background:"rgba(248,250,252,.97)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRadius:"22px 22px 0 0",zIndex:50,padding:"14px 16px 28px",animation:"drawerUp .25s ease",borderTop:"1px solid rgba(0,0,0,.08)",boxShadow:"0 -8px 30px rgba(0,0,0,.12)"}}>
            <div style={{width:36,height:4,borderRadius:2,background:"#d1d5db",margin:"0 auto 14px"}}/>
            <div style={{fontSize:10,fontWeight:700,color:C.light,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.1em"}}>More Modules</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>
              {DRAWER_NAV.map(n=>{
                const active=page===n.id;
                const badge=n.id==="mail"?unread:0;
                return (
                  <button key={n.id} onClick={()=>nav(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"15px 8px",borderRadius:14,border:`1px solid ${active?"rgba(10,97,82,.2)":C.border}`,background:active?C.primaryLight:"#fff",cursor:"pointer",gap:7,position:"relative",boxShadow:active?"0 2px 10px rgba(10,97,82,.1)":"0 1px 3px rgba(0,0,0,.04)"}}>
                    <div style={{width:38,height:38,borderRadius:11,background:active?C.primaryGlow:"rgba(0,0,0,.04)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name={n.icon} size={19} color={active?C.primary:C.mid} sw={active?2:1.7}/></div>
                    <span style={{fontSize:11,fontWeight:700,color:active?C.primary:C.text,textAlign:"center"}}>{n.label}</span>
                    {badge>0&&<span style={{position:"absolute",top:7,right:7,background:"#ef4444",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{badge}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
