import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase setup with safe fallback so app never crashes on missing key
let supabase
try {
  supabase = createClient(
    'https://wcpbrbyiakwlnpwpelzi.supabase.co',
    import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key-replace-me'
  )
} catch(e) {
  supabase = { auth: { signInWithPassword: async()=>({error:true}), signOut: async()=>{}, getSession: async()=>({data:{session:null}}), onAuthStateChange: ()=>({data:{subscription:{unsubscribe:()=>{}}}}) } }
}

const BAROS_RESORT_ID = 'f1ada214-1cc3-4634-a4cd-0d94c7c10b79'

// ─── Mobile responsive hook ───────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

// Inject global mobile CSS once
if (!document.getElementById('dhirumbaa-mobile-css')) {
  const style = document.createElement('style')
  style.id = 'dhirumbaa-mobile-css'
  style.textContent = `
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    input, select, textarea, button { font-family: inherit; }
    .mobile-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .mobile-card { background: #fff; border: 0.5px solid rgba(26,69,48,0.12); border-radius: 8px; padding: 14px; margin-bottom: 10px; }
    .mobile-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 0.5px solid rgba(26,69,48,0.08); }
    .mobile-row:last-child { border-bottom: none; }
    .mobile-label { font-size: 10px; color: #5A6B62; text-transform: uppercase; letter-spacing: .8px; font-weight: 500; margin-bottom: 4px; }
    @media (max-width: 767px) {
      .hide-mobile { display: none !important; }
      .full-mobile { width: 100% !important; }
      .stack-mobile { flex-direction: column !important; align-items: stretch !important; }
      .grid-1-mobile { grid-template-columns: 1fr !important; }
      .grid-2-mobile { grid-template-columns: 1fr 1fr !important; }
      .no-pad-mobile { padding: 12px !important; }
    }
  `
  document.head.appendChild(style)
}

// ─── Config ────────────────────────────────────────────────────────────────────
const RESORT = { id: 'baros', name: 'Baros Maldives', code: 'BAR' }

const NAV = [
  { id: 'dashboard', icon: '🌊', label: 'Dashboard'       },
  { id: 'flights',   icon: '✈️', label: 'Flight Tracker'  },
  { id: 'scheduler', icon: '🗓️', label: 'Smart Scheduler' },
  { id: 'roster',    icon: '📋', label: 'Duty Roster'     },
  { id: 'vessels',   icon: '⛵', label: 'Vessels'          },
  { id: 'team',      icon: '👥', label: 'Team'             },
  { id: 'fuel-log',  icon: '⛽', label: 'Fuel Log'         },
  { id: 'settings',  icon: '⚙️', label: 'Settings'         },
]

const VESSELS = [
  { name: 'Ixora',    type: 'Main transfer', cap: 12, status: 'active'  },
  { name: 'Tara',     type: 'Main transfer', cap: 12, status: 'active'  },
  { name: 'Serenity', type: 'VIP / Private', cap:  6, status: 'active'  },
  { name: 'Xari',     type: 'Staff ferry',   cap: 20, status: 'standby' },
]

// ─── Algorithm constants ───────────────────────────────────────────────────────
const ALGO = { JOURNEY:22, IMM:35, LJ:10, DEP:60, CW:20, RL:65 }
const LEAD = ALGO.JOURNEY + ALGO.IMM + ALGO.LJ + ALGO.DEP // 127 min

const VESSEL_CFG = {
  serenity: { label:'Serenity',     icon:'👑', bg:'rgba(164,162,96,0.1)',  border:'rgba(164,162,96,0.3)',  text:'#7A7840' },
  private:  { label:'Ixora (pvt)',  icon:'🔒', bg:'rgba(26,69,48,0.08)',   border:'rgba(26,69,48,0.2)',    text:'#1A4530' },
  luxury:   { label:'Ixora (lux)',  icon:'⭐', bg:'rgba(164,162,96,0.08)', border:'rgba(164,162,96,0.2)',  text:'#6A6830' },
  regular:  { label:'Ixora',        icon:'⚓', bg:'rgba(26,69,48,0.06)',   border:'rgba(26,69,48,0.15)',   text:'#2D6147' },
  other:    { label:'Other vessel', icon:'🗺️', bg:'rgba(90,107,98,0.07)',  border:'rgba(90,107,98,0.2)',   text:'#4A5E52' },
}

// ─── 7-day training data (22–28 Mar 2026) ─────────────────────────────────────
const SAMPLE_DATA = {
  '2026-03-22': [
    { trf:'06:45', flt:'LX8067', fltT:'09:30', room:'106', type:'DLX', name:'Schmid',          pax:2, vip:null,   tt:'regular', comment:'In-Villa Breakfast'    },
    { trf:'06:45', flt:'TK741',  fltT:'09:15', room:'316', type:'WPV', name:'Miculescu',        pax:2, vip:'VIP3', tt:'regular', comment:'In-Villa Breakfast'    },
    { trf:'08:00', flt:'OS022',  fltT:'10:25', room:'112', type:'DLX', name:'Da Rocha',         pax:2, vip:null,   tt:'regular', comment:''                      },
    { trf:'08:00', flt:'OS022',  fltT:'10:25', room:'206', type:'BS',  name:'Kühnel-Lorenz',    pax:1, vip:null,   tt:'regular', comment:''                      },
    { trf:'09:00', flt:'BA060',  fltT:'11:40', room:'201', type:'BV',  name:'Henderson',        pax:2, vip:'VIP3', tt:'regular', comment:''                      },
    { trf:'09:00', flt:'BA060',  fltT:'11:40', room:'319', type:'WPV', name:'Gisbourne',        pax:2, vip:null,   tt:'regular', comment:''                      },
    { trf:'09:00', flt:'MH484',  fltT:'12:00', room:'317', type:'WPV', name:'Then/Tang',        pax:2, vip:null,   tt:'regular', comment:''                      },
    { trf:'10:15', flt:'SQ431',  fltT:'12:55', room:'208', type:'BS',  name:'Boekeman',         pax:2, vip:'VIP5', tt:'luxury',  comment:'Luxury Transfer'       },
    { trf:'19:00', flt:'TK735',  fltT:'21:55', room:'207', type:'BS',  name:'Erbak',            pax:2, vip:'VIP5', tt:'luxury',  comment:'LCO | Luxury Transfer' },
    { trf:'20:30', flt:'SQ437',  fltT:'23:30', room:'309', type:'WV',  name:'Coldebella',       pax:2, vip:null,   tt:'regular', comment:'LCO'                   },
    { trf:'20:30', flt:'SQ437',  fltT:'23:30', room:'304', type:'WV',  name:'De Almeida',       pax:2, vip:null,   tt:'regular', comment:'LCO'                   },
  ],
  '2026-03-23': [
    { trf:'09:00', flt:'BA060',        fltT:'11:40', room:'305', type:'WV',  name:'Gribbon',       pax:2, vip:'VIP4', tt:'regular', comment:''                   },
    { trf:'09:00', flt:'BA060',        fltT:'11:40', room:'325', type:'WPV', name:'De Wolff',       pax:2, vip:null,   tt:'regular', comment:''                   },
    { trf:'09:00', flt:'BA060',        fltT:'11:40', room:'214', type:'BS',  name:'Patel',          pax:3, vip:'VIP3', tt:'luxury',  comment:'Luxury Transfer'    },
    { trf:'09:00', flt:'Huvafen Fushi',fltT:'09:30', room:'310', type:'WV',  name:'Westley',        pax:1, vip:'VIP2', tt:'other',   comment:'Dep. to Huvafen'    },
    { trf:'10:30', flt:'SQ431',        fltT:'12:55', room:'205', type:'BS',  name:'Acason',         pax:2, vip:'VIP5', tt:'luxury',  comment:'Luxury Transfer'    },
    { trf:'19:00', flt:'TK735',        fltT:'21:55', room:'108', type:'DLX', name:'Aydogdu (×2)',   pax:2, vip:null,   tt:'private', comment:'LCO | PVT Transfer' },
    { trf:'19:00', flt:'TK735',        fltT:'21:55', room:'107', type:'DLX', name:'Aydogdu (×2)',   pax:2, vip:null,   tt:'private', comment:'LCO | PVT Transfer' },
    { trf:'19:30', flt:'TK735',        fltT:'21:55', room:'320', type:'WPV', name:'Rahimi',         pax:2, vip:null,   tt:'regular', comment:'LCO'                },
  ],
  '2026-03-24': [
    { trf:'09:00', flt:'BA060',  fltT:'11:40', room:'218', type:'BPV', name:'McHugh (D+A)',    pax:2, vip:null, tt:'regular', comment:'02 Villa Family'      },
    { trf:'09:00', flt:'MH484',  fltT:'12:00', room:'110', type:'DLX', name:'McHugh (Harold)', pax:1, vip:null, tt:'regular', comment:'02 Villa Family'      },
    { trf:'10:30', flt:'SQ431',  fltT:'12:55', room:'120', type:'DLX', name:'Schwab',          pax:2, vip:null, tt:'regular', comment:''                     },
    { trf:'10:30', flt:'SQ431',  fltT:'12:55', room:'113', type:'DLX', name:'Doucha',          pax:2, vip:null, tt:'regular', comment:''                     },
    { trf:'12:30', flt:'UL116',  fltT:'15:30', room:'317', type:'WPV', name:'Khairy',          pax:2, vip:null, tt:'regular', comment:'LCO Until Departure'  },
    { trf:'17:00', flt:'3U3924', fltT:'20:30', room:'301', type:'WV',  name:'Deng/Liu',        pax:2, vip:null, tt:'regular', comment:'LCO Until Departure'  },
    { trf:'19:30', flt:'TK735',  fltT:'22:00', room:'119', type:'DLX', name:'Hihn/Bareiss',    pax:2, vip:null, tt:'regular', comment:'LCO Until Departure'  },
    { trf:'21:00', flt:'SQ437',  fltT:'23:30', room:'324', type:'WPV', name:'Rayner',          pax:2, vip:null, tt:'regular', comment:'LCO Until Departure'  },
  ],
  '2026-03-25': [
    { trf:'06:30', flt:'EK657',  fltT:'09:05', room:'312/311', type:'WPV', name:'Wolf family (×3)',           pax:3, vip:'VIP3', tt:'serenity', comment:'Serenity | CIP Departure' },
    { trf:'08:00', flt:'SV3629', fltT:'10:40', room:'401',     type:'BR',  name:'Kassas family (×4)',         pax:4, vip:'VIP5', tt:'serenity', comment:'PVT by Serenity'          },
    { trf:'09:30', flt:'BA060',  fltT:'11:40', room:'114',     type:'DLX', name:'Sehver',                     pax:1, vip:null,   tt:'regular',  comment:''                        },
    { trf:'09:30', flt:'PG712',  fltT:'12:50', room:'319',     type:'WPV', name:'Dabrowski',                  pax:2, vip:null,   tt:'regular',  comment:''                        },
    { trf:'09:30', flt:'MH484',  fltT:'12:00', room:'306',     type:'WV',  name:'Chong/Tan',                  pax:2, vip:null,   tt:'regular',  comment:''                        },
    { trf:'11:00', flt:'SU325',  fltT:'14:10', room:'111',     type:'DLX', name:'Khadyka',                    pax:2, vip:null,   tt:'regular',  comment:''                        },
    { trf:'11:00', flt:'JD456',  fltT:'14:50', room:'309',     type:'WV',  name:'Han/Wang',                   pax:2, vip:null,   tt:'regular',  comment:''                        },
    { trf:'11:00', flt:'6E1130', fltT:'14:05', room:'302',     type:'WV',  name:'Keshava',                    pax:2, vip:null,   tt:'regular',  comment:''                        },
    { trf:'14:45', flt:'UL116',  fltT:'15:35', room:'315/321', type:'WPV', name:'Komori + Chistiakov + Gulik',pax:4, vip:null,   tt:'regular',  comment:'LCO Until Departure'     },
  ],
  '2026-03-26': [
    { trf:'08:00', flt:'LX8067', fltT:'10:30', room:'303', type:'WV', name:'Weilenmann', pax:2, vip:null,   tt:'regular', comment:''             },
    { trf:'11:00', flt:'VS385',  fltT:'13:25', room:'203', type:'BV', name:'Godwin',      pax:2, vip:'VIP3', tt:'private', comment:'PVT Transfer' },
  ],
  '2026-03-27': [
    { trf:'08:15', flt:'B4090',       fltT:'10:50', room:'314', type:'WPV', name:'Bürkle',      pax:2, vip:null,   tt:'regular', comment:''               },
    { trf:'09:15', flt:'MH484',       fltT:'12:00', room:'330', type:'WV',  name:'Lee/Mayumi',  pax:2, vip:null,   tt:'regular', comment:''               },
    { trf:'09:15', flt:'BA060',       fltT:'11:40', room:'104', type:'DLX', name:'Barrie',       pax:2, vip:'VIP3', tt:'regular', comment:''               },
    { trf:'09:15', flt:"Male'",       fltT:'09:45', room:'312', type:'WPV', name:'Shijah',       pax:2, vip:'VIP1', tt:'other',   comment:'Employee Rate'  },
    { trf:'10:00', flt:'Lily Beach',  fltT:'11:30', room:'212', type:'BPV', name:'Saputra (×3)', pax:3, vip:null,   tt:'other',   comment:'Dep. Lily Beach' },
    { trf:'11:00', flt:'VS385',       fltT:'13:25', room:'117', type:'DLX', name:'Linford',      pax:2, vip:null,   tt:'regular', comment:''               },
    { trf:'17:30', flt:'EY377',       fltT:'19:55', room:'211', type:'BPV', name:'Zamy/Wanke',  pax:2, vip:null,   tt:'regular', comment:'LCO'            },
    { trf:'21:00', flt:'SQ437',       fltT:'23:30', room:'307', type:'WV',  name:'Kang/Park',   pax:2, vip:null,   tt:'regular', comment:'LCO'            },
    { trf:'21:00', flt:'SQ437',       fltT:'23:30', room:'322', type:'WPV', name:'Morgan/Moe',  pax:2, vip:null,   tt:'regular', comment:'LCO'            },
  ],
  '2026-03-28': [
    { trf:'06:30', flt:'EY379',          fltT:'09:00', room:'209', type:'BPV', name:'Williams',      pax:2, vip:'VIP3', tt:'regular', comment:'IVD Breakfast'        },
    { trf:'07:45', flt:'OS22',           fltT:'10:25', room:'328', type:'WV',  name:'Heinrich',      pax:2, vip:null,   tt:'regular', comment:'Breakfast at Lime'    },
    { trf:'09:00', flt:'BA060',          fltT:'11:40', room:'313', type:'WPV', name:'Wood',          pax:2, vip:'VIP3', tt:'regular', comment:''                     },
    { trf:'09:00', flt:'BA060',          fltT:'11:40', room:'105', type:'DLX', name:'Foulds',        pax:2, vip:'VIP3', tt:'regular', comment:''                     },
    { trf:'09:00', flt:'BA060',          fltT:'11:40', room:'215', type:'BPV', name:'King',          pax:2, vip:null,   tt:'regular', comment:''                     },
    { trf:'10:30', flt:'AI2240',         fltT:'12:50', room:'202', type:'BV',  name:'Brown',         pax:2, vip:null,   tt:'regular', comment:''                     },
    { trf:'10:30', flt:'VS385',          fltT:'13:25', room:'205', type:'BS',  name:'Fitzsimons',    pax:2, vip:null,   tt:'regular', comment:''                     },
    { trf:'15:30', flt:'Emperor Safari', fltT:'16:00', room:'117', type:'DLX', name:'Areano',        pax:1, vip:null,   tt:'other',   comment:'LCO Until Departure'  },
    { trf:'20:00', flt:'H4 8570',        fltT:'23:00', room:'122', type:'DLX', name:'Hartular (×2)', pax:2, vip:null,   tt:'regular', comment:'LCO Until Departure'  },
  ],
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const toM  = t => { if (!t?.includes(':')) return NaN; const [h,m]=t.split(':').map(Number); return h*60+m }
const toT  = m => { const h=Math.floor(m/60)%24,mn=m%60; return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}` }
const fmtB = n => { const a=Math.abs(Math.round(n)); return (n>=0?'+':'-')+a+' min' }

function groupByTrf(transfers) {
  const map = {}
  transfers.forEach(t => { if (!map[t.trf]) map[t.trf]=[]; map[t.trf].push(t) })
  return Object.entries(map).sort(([a],[b])=>toM(a)-toM(b)).map(([trf,ts])=>({trf,transfers:ts}))
}

function splitByVessel(transfers) {
  const order = ['serenity','private','luxury','regular','other']
  const map = {}
  transfers.forEach(t => { if (!map[t.tt]) map[t.tt]=[]; map[t.tt].push(t) })
  return order.filter(k => map[k]).map(k => ({ tt:k, transfers:map[k] }))
}

function calcBuf(trfStr, fltMs) {
  const valid = fltMs.filter(f => !isNaN(f))
  if (!valid.length) return null
  return toM(trfStr) - (Math.min(...valid) - LEAD)
}

// ─── Baros Brand Tokens ──────────────────────────────────────────────────────
const B = {
  freshPalm:    '#1A4530',
  freshPalmMid: '#2D6147',
  palmLight:    'rgba(26,69,48,0.08)',
  palmMid:      'rgba(26,69,48,0.15)',
  breeze:       '#E5EDED',
  breezeDeep:   '#C8D8D4',
  pearl:        '#F5F5F1',
  pearlDeep:    '#ECEAE4',
  gold:         '#A4A260',
  goldLight:    'rgba(164,162,96,0.12)',
  midnight:     '#0D0F0A',
  white:        '#FFFFFF',
  textPrimary:  '#1A1A18',
  textSecond:   '#5A6B62',
  textMuted:    '#8A9E96',
  border:       'rgba(26,69,48,0.12)',
  borderMid:    'rgba(26,69,48,0.2)',
  danger:       '#C0392B',
  dangerLight:  'rgba(192,57,43,0.08)',
  success:      '#1A6B3C',
  successLight: 'rgba(26,107,60,0.08)',
  warning:      '#A07820',
  warningLight: 'rgba(160,120,32,0.08)',
}

// ─── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  app:      { display:'flex', flexDirection:'column', height:'100vh', fontFamily:"'Work Sans', system-ui, sans-serif", background:B.pearl, color:B.textPrimary },
  topbar:   { display:'flex', alignItems:'center', gap:14, padding:'0 24px', height:58, background:B.freshPalm, color:B.white, flexShrink:0, borderBottom:`1px solid ${B.freshPalmMid}` },
  logo:     { fontSize:16, fontWeight:600, letterSpacing:'0.5px', color:B.white, fontFamily:"'Work Sans', sans-serif" },
  resort:   { fontSize:12, color:'rgba(255,255,255,0.55)', marginLeft:6, letterSpacing:'.3px' },
  topRight: { marginLeft:'auto', display:'flex', alignItems:'center', gap:12 },
  sidebar:  { width:210, background:B.midnight, display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' },
  navItem:  a => ({ display:'flex', alignItems:'center', gap:10, padding:'11px 18px', cursor:'pointer', background: a ? 'rgba(255,255,255,0.07)' : 'transparent', color: a ? B.white : 'rgba(255,255,255,0.45)', borderLeft: a ? `3px solid ${B.gold}` : '3px solid transparent', fontSize:13, transition:'all .15s', userSelect:'none', letterSpacing:'.2px' }),
  content:  { flex:1, overflow:'auto', padding:24 },
  card:     { background:B.white, border:`0.5px solid ${B.border}`, borderRadius:8, overflow:'hidden', marginBottom:16 },
  cardHdr:  { padding:'13px 18px', borderBottom:`0.5px solid ${B.border}`, fontWeight:500, fontSize:13, display:'flex', alignItems:'center', gap:8, color:B.textPrimary, letterSpacing:'.2px', background:B.pearl },
  cardBody: { padding:18 },
  table:    { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:       { padding:'9px 12px', textAlign:'left', fontSize:10, fontWeight:600, color:B.textMuted, borderBottom:`0.5px solid ${B.border}`, textTransform:'uppercase', letterSpacing:'1px', background:B.pearl },
  td:       { padding:'10px 12px', borderBottom:`0.5px solid ${B.border}`, verticalAlign:'middle', color:B.textPrimary },
  badge:    (bg,color) => ({ display:'inline-flex', alignItems:'center', padding:'2px 9px', borderRadius:99, fontSize:11, fontWeight:500, background:bg, color, letterSpacing:'.2px' }),
  pill:     { display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:99, fontSize:11, background:B.palmLight, color:B.freshPalm, fontWeight:500 },
  loginWrap:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:B.midnight },
  loginCard:  { background:'#151714', borderRadius:10, padding:40, width:380, border:'0.5px solid rgba(255,255,255,0.08)' },
  label:      { display:'block', fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:6, letterSpacing:'.8px', textTransform:'uppercase' },
  input:      { width:'100%', padding:'10px 14px', borderRadius:6, border:'0.5px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:B.white, fontSize:13, boxSizing:'border-box', outline:'none', fontFamily:"'Work Sans', sans-serif" },
  loginBtn:   { width:'100%', padding:'11px', borderRadius:6, border:'none', background:B.freshPalm, color:B.white, fontWeight:500, fontSize:14, cursor:'pointer', marginTop:22, letterSpacing:'.5px', fontFamily:"'Work Sans', sans-serif" },
  groupCard:  { background:B.white, border:`0.5px solid ${B.border}`, borderRadius:8, marginBottom:10, overflow:'hidden' },
  groupHdr:   { background:B.pearl, borderBottom:`0.5px solid ${B.border}`, padding:'8px 14px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', cursor:'pointer' },
  trfBadge:   { background:B.freshPalm, color:B.white, borderRadius:5, padding:'3px 12px', fontSize:14, fontFamily:'monospace', fontWeight:700, flexShrink:0, letterSpacing:'1px' },
  fltTag:     { background:B.palmLight, color:B.freshPalm, borderRadius:99, padding:'2px 9px', fontSize:11, fontWeight:500 },
  rlBadge:    { background:B.successLight, color:B.success, borderRadius:99, padding:'2px 9px', fontSize:11, fontWeight:500 },
  gapOk:      { background:B.successLight, color:B.success, borderRadius:99, padding:'2px 8px', fontSize:10 },
  gapWarn:    { background:B.warningLight, color:B.warning, borderRadius:99, padding:'2px 8px', fontSize:10 },
  runBlock:   { padding:'8px 14px', borderBottom:`0.5px dashed ${B.border}` },
  vTag: tt  => ({ display:'inline-flex', alignItems:'center', gap:5, borderRadius:99, padding:'2px 10px', fontSize:11, fontWeight:500, marginBottom:6, border:`0.5px solid ${VESSEL_CFG[tt].border}`, background:VESSEL_CFG[tt].bg, color:VESSEL_CFG[tt].text }),
  row:        { display:'flex', alignItems:'center', gap:6, padding:'4px 0', borderTop:`0.5px solid ${B.border}` },
  rmTag:      { background:B.pearlDeep, color:B.textSecond, borderRadius:4, padding:'2px 7px', fontSize:10, fontFamily:'monospace', minWidth:38, textAlign:'center', flexShrink:0 },
  typeTag:    { fontSize:10, color:B.textMuted, background:B.breeze, borderRadius:4, padding:'2px 6px', flexShrink:0 },
  guestName:  { fontSize:12, flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:B.textPrimary },
  commentTxt: { fontSize:10, color:B.textMuted, maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0 },
  timingBar:  { padding:'5px 14px', background:B.pearlDeep, borderTop:`0.5px solid ${B.border}`, display:'flex', gap:16, fontSize:10, color:B.textMuted, flexWrap:'wrap' },
  algoPanel:  { background:B.midnight, borderRadius:8, padding:18, marginBottom:16, fontSize:12 },
  statRow:    { display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' },
  stat:  a  => ({ background:B.white, border:`0.5px solid ${B.border}`, borderRadius:8, padding:'12px 16px', flex:'1', minWidth:100, borderTop:`2px solid ${a}` }),
}

const INP = { width:'100%', padding:'9px 12px', borderRadius:6, border:`0.5px solid rgba(26,69,48,0.2)`, background:'#FFFFFF', fontSize:13, boxSizing:'border-box', color:'#1A1A18', outline:'none', fontFamily:"'Work Sans', system-ui, sans-serif" }
const LBL = { fontSize:10, color:'#5A6B62', marginBottom:5, display:'block', letterSpacing:'.8px', textTransform:'uppercase', fontWeight:500 }
const BTN_PRIMARY = { padding:'9px 22px', borderRadius:6, border:'none', background:'#1A4530', color:'#fff', fontSize:13, cursor:'pointer', fontWeight:500, letterSpacing:'.3px', fontFamily:"'Work Sans', system-ui, sans-serif" }
const BTN_ADD     = { padding:'7px 16px', borderRadius:6, border:'none', background:'#1A4530', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:500, letterSpacing:'.3px', fontFamily:"'Work Sans', system-ui, sans-serif" }
const BTN_DEL     = { padding:'3px 10px', borderRadius:4, border:'0.5px solid rgba(192,57,43,0.25)', background:'rgba(192,57,43,0.05)', color:'#C0392B', fontSize:11, cursor:'pointer' }

const vipStyle = v => {
  const c = { VIP1:{bg:'rgba(164,162,96,0.1)',text:'#7A7840'}, VIP2:{bg:'rgba(164,162,96,0.12)',text:'#6A6830'}, VIP3:{bg:'rgba(26,69,48,0.1)',text:'#1A4530'}, VIP4:{bg:'rgba(26,69,48,0.12)',text:'#2D6147'}, VIP5:{bg:'rgba(13,15,10,0.08)',text:'#1A1A18'} }
  const cfg = c[v] || { bg:'rgba(26,69,48,0.06)', text:'#1A4530' }
  return { display:'inline-flex', borderRadius:99, padding:'1px 7px', fontSize:10, fontWeight:500, flexShrink:0, background:cfg.bg, color:cfg.text, letterSpacing:'.3px' }
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [creds, setCreds] = useState({ username:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const emailMap = { 'dhirumbaa':'dhirumbaa@dhirumbaa.com', 'baros.admin':'baros.admin@dhirumbaa.com' }

  const handle = async e => {
    e.preventDefault(); setLoading(true); setError('')
    const email = emailMap[creds.username.toLowerCase()]
    if (!email) { setError('Unknown username'); setLoading(false); return }
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: creds.password })
    if (err) {
      const ok = (creds.username==='dhirumbaa' && creds.password==='Dhirumbaa@2026') ||
                 (creds.username==='baros.admin' && creds.password==='Baros@2026')
      if (ok) onLogin({ username:creds.username, role:creds.username==='dhirumbaa'?'super_admin':'resort_admin' })
      else setError('Invalid credentials')
    } else {
      onLogin({ username:creds.username, role:creds.username==='dhirumbaa'?'super_admin':'resort_admin', session:data.session })
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:B.midnight, flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
      <div style={{ flex:1, background:`linear-gradient(160deg, ${B.freshPalm} 0%, #0D2318 100%)`, display: window.innerWidth < 768 ? 'none' : 'flex', flexDirection:'column', justifyContent:'flex-end', padding:48, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, opacity:.06, backgroundImage:'radial-gradient(circle at 30% 40%, #A4A260 0%, transparent 60%), radial-gradient(circle at 70% 80%, #E5EDED 0%, transparent 50%)' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:13, letterSpacing:'3px', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:16 }}>Dhirumbaa</div>
          <div style={{ fontSize:36, fontWeight:300, color:B.white, lineHeight:1.2, marginBottom:12 }}>Fleet Management<br/><span style={{ color:B.gold }}>System</span></div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7, maxWidth:300 }}>Intelligent boat operations for Maldives resort properties.</div>
          <div style={{ marginTop:40, display:'flex', gap:20 }}>
            {['Baros Maldives','Multi-resort','Maldives'].map(t => (
              <div key={t} style={{ fontSize:10, letterSpacing:'1px', color:'rgba(255,255,255,0.3)', textTransform:'uppercase' }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ width: window.innerWidth < 768 ? '100%' : 420, background:'#0F1210', display:'flex', alignItems:'center', justifyContent:'center', padding: window.innerWidth < 768 ? '32px 24px' : 48, flex: window.innerWidth < 768 ? 1 : 'none' }}>
        <div style={{ width:'100%' }}>
          <div style={{ width:40, height:3, background:B.gold, marginBottom:32, borderRadius:2 }} />
          <div style={{ fontSize:22, fontWeight:500, color:B.white, marginBottom:6, letterSpacing:'-0.3px' }}>Welcome back</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', marginBottom:36 }}>Sign in to your operations dashboard</div>
          <form onSubmit={handle}>
            <div style={{ marginBottom:18 }}>
              <label style={S.label}>Username</label>
              <input style={S.input} value={creds.username} onChange={e=>setCreds(p=>({...p,username:e.target.value}))} placeholder="dhirumbaa or baros.admin" autoFocus />
            </div>
            <div style={{ marginBottom:6 }}>
              <label style={S.label}>Password</label>
              <input style={S.input} type="password" value={creds.password} onChange={e=>setCreds(p=>({...p,password:e.target.value}))} placeholder="••••••••" />
            </div>
            {error && <div style={{ fontSize:12, color:'#E87070', marginTop:10 }}>{error}</div>}
            <button style={S.loginBtn} type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
          <div style={{ marginTop:32, padding:'14px 16px', background:'rgba(255,255,255,0.03)', borderRadius:6, border:'0.5px solid rgba(255,255,255,0.06)', fontSize:11, color:'rgba(255,255,255,0.25)' }}>
            <div>Super Admin: <span style={{ color:'rgba(255,255,255,0.4)' }}>dhirumbaa / Dhirumbaa@2026</span></div>
            <div style={{ marginTop:4 }}>Resort Admin: <span style={{ color:'rgba(255,255,255,0.4)' }}>baros.admin / Baros@2026</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user, isMobile }) {
  const today = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const stats = [
    { val:'9',  lbl:'Departures today', color:B.freshPalm },
    { val:'17', lbl:'Pax today',         color:B.gold      },
    { val:'3',  lbl:'Boat runs',          color:B.freshPalmMid },
    { val:'2',  lbl:'VIP transfers',      color:'#7B5EA7'  },
  ]
  const upcoming = [
    { time:'09:00', flt:'BA060',          vessel:'Ixora', pax:6,  type:'regular' },
    { time:'10:30', flt:'AI2240 / VS385', vessel:'Ixora', pax:4,  type:'regular' },
    { time:'15:30', flt:'Emperor Safari', vessel:'Other', pax:1,  type:'other'   },
    { time:'20:00', flt:'H4 8570',        vessel:'Tara',  pax:2,  type:'regular' },
  ]
  return (
    <>
      <div style={{ background:`linear-gradient(135deg, ${B.freshPalm} 0%, ${B.freshPalmMid} 100%)`, borderRadius:10, padding:isMobile?'16px 16px':'24px 28px', marginBottom:isMobile?14:20, display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:'2px', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', marginBottom:4 }}>Good morning</div>
          <div style={{ fontSize:isMobile?18:22, fontWeight:500, color:B.white, letterSpacing:'-0.3px' }}>{user.username === 'dhirumbaa' ? 'Admin' : 'Baros Team'}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:3 }}>{isMobile ? new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : today}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'1px', textTransform:'uppercase' }}>Property</div>
          <div style={{ fontSize:isMobile?12:14, color:B.gold, fontWeight:500, marginTop:2 }}>{isMobile ? 'Baros' : 'Baros Maldives'}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:isMobile?8:12, marginBottom:isMobile?14:20 }}>
        {stats.map(s => (
          <div key={s.lbl} style={{ background:B.white, border:`0.5px solid ${B.border}`, borderRadius:8, padding:isMobile?'12px 14px':'16px 18px', borderLeft:`3px solid ${s.color}` }}>
            <div style={{ fontSize:isMobile?22:26, fontWeight:300, color:s.color, letterSpacing:'-1px' }}>{s.val}</div>
            <div style={{ fontSize:isMobile?10:11, color:B.textMuted, marginTop:3, letterSpacing:'.3px' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.cardHdr}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:B.freshPalm, display:'inline-block', marginRight:4 }}></span>
          Today's Transfer Schedule
        </div>
        {isMobile ? (
          <div style={{ padding:8 }}>
            {upcoming.map((r,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 8px', borderBottom:i<upcoming.length-1?`0.5px solid ${B.border}`:'none' }}>
                <span style={{ fontFamily:'monospace', fontSize:14, fontWeight:700, color:B.freshPalm, minWidth:48 }}>{r.time}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.flt}</div>
                  <div style={{ fontSize:11, color:B.textMuted }}>{r.vessel} · {r.pax} pax</div>
                </div>
                <span style={S.badge(r.type==='other'?B.pearlDeep:B.palmLight, r.type==='other'?B.textSecond:B.freshPalm)}>{r.type}</span>
              </div>
            ))}
          </div>
        ) : (
          <table style={S.table}>
            <thead><tr>{['Time','Flight','Vessel','Pax','Type'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {upcoming.map((r,i) => (
                <tr key={i}>
                  <td style={S.td}><span style={{ fontFamily:'monospace', fontSize:13, fontWeight:600, color:B.freshPalm }}>{r.time}</span></td>
                  <td style={S.td}>{r.flt}</td>
                  <td style={S.td}><span style={S.pill}>{r.vessel}</span></td>
                  <td style={S.td}>{r.pax}</td>
                  <td style={S.td}><span style={S.badge(r.type==='other'?B.pearlDeep:B.palmLight, r.type==='other'?B.textSecond:B.freshPalm)}>{r.type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={S.card}>
        <div style={S.cardHdr}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:B.gold, display:'inline-block', marginRight:4 }}></span>
          Vessel Status
        </div>
        <div style={{ padding:isMobile?8:12, display:'flex', flexDirection:'column', gap:isMobile?6:8 }}>
          {VESSELS.map(v => (
            <div key={v.name} style={{ display:'flex', alignItems:'center', gap:10, padding:isMobile?'8px 10px':'10px 14px', background:B.pearl, borderRadius:6, border:`0.5px solid ${B.border}` }}>
              <div style={{ width:isMobile?30:36, height:isMobile?30:36, borderRadius:'50%', background: v.status==='active'?B.freshPalm:B.pearlDeep, display:'flex', alignItems:'center', justifyContent:'center', fontSize:isMobile?13:16, flexShrink:0 }}>⛵</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:500, fontSize:isMobile?12:13, color:B.textPrimary }}>{v.name}</div>
                <div style={{ fontSize:10, color:B.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.type} · {v.cap} pax</div>
              </div>
              <span style={S.badge(v.status==='active'?B.successLight:B.pearlDeep, v.status==='active'?B.success:B.textSecond)}>● {v.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsView({ isMobile }) {
  const consts = [['Journey Baros ↔ VIA','22','min'],['Immigration buffer','35','min'],['Lounge to jetty (VIA)','10','min'],['Depart airport before flight','60','min'],['Flight combine window','20','min'],['Return load max wait','65','min']]
  return (
    <>
      <div style={{ marginBottom:14, fontSize:isMobile?14:16, fontWeight:500 }}>⚙️ Settings</div>
      <div style={S.card}>
        <div style={S.cardHdr}>🧮 Algorithm Constants · {RESORT.name}</div>
        {isMobile ? (
          <div style={{ padding:12 }}>
            {consts.map(([n,v,u])=>(
              <div key={n} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:`0.5px solid ${B.border}`, fontSize:13 }}>
                <span style={{ color:B.textSecond }}>{n}</span>
                <span style={{ fontWeight:600, color:B.freshPalm }}>{v} <span style={{ fontSize:11, color:B.textMuted }}>{u}</span></span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', fontSize:13 }}>
              <span style={{ fontWeight:500 }}>Total lead time</span>
              <span style={{ fontWeight:700, color:B.freshPalm }}>127 <span style={{ fontSize:11, color:B.textMuted }}>min</span></span>
            </div>
          </div>
        ) : (
          <table style={S.table}>
            <thead><tr><th style={S.th}>Parameter</th><th style={S.th}>Value</th><th style={S.th}>Unit</th></tr></thead>
            <tbody>
              {consts.map(([n,v,u])=>(<tr key={n}><td style={S.td}>{n}</td><td style={S.td}><strong>{v}</strong></td><td style={S.td}>{u}</td></tr>))}
              <tr style={{ background:B.palmLight }}>
                <td style={{ ...S.td, fontWeight:500 }}>Total lead time (formula)</td>
                <td style={{ ...S.td, fontWeight:700, color:B.freshPalm }}>127</td>
                <td style={S.td}>min</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
      <div style={S.card}>
        <div style={S.cardHdr}>🏝️ Resort Info</div>
        <div style={{ ...S.cardBody, fontSize:13 }}>
          <div><strong>Resort:</strong> {RESORT.name} (code: {RESORT.code})</div>
          <div style={{ marginTop:6 }}><strong>Supabase:</strong> wcpbrbyiakwlnpwpelzi.supabase.co</div>
          <div style={{ marginTop:6 }}><strong>Platform:</strong> Dhirumbaa FMS Multi-Resort SaaS</div>
        </div>
      </div>
    </>
  )
}

// ─── Scheduler: Group Card ─────────────────────────────────────────────────────
function GroupCard({ group, allGroups, groupIdx }) {
  const [open, setOpen] = useState(true)
  const flts    = [...new Set(group.transfers.map(t=>t.flt))]
  const fltMs   = group.transfers.map(t=>toM(t.fltT)).filter(f=>!isNaN(f))
  const fltGap  = fltMs.length>1 ? Math.max(...fltMs)-Math.min(...fltMs) : 0
  const totalPax = group.transfers.reduce((s,t)=>s+t.pax,0)
  const arrVIA  = toM(group.trf)+ALGO.JOURNEY
  const buf     = calcBuf(group.trf,fltMs)
  const recTrf  = fltMs.length ? toT(Math.min(...fltMs)-LEAD) : null
  const next    = allGroups[groupIdx+1]
  const rlGap   = next ? toM(next.trf)-toM(group.trf) : 999
  const hasRL   = rlGap <= (ALGO.JOURNEY*2+ALGO.RL)
  const runs    = splitByVessel(group.transfers)

  return (
    <div style={S.groupCard}>
      <div style={S.groupHdr} onClick={()=>setOpen(o=>!o)}>
        <div style={S.trfBadge}>{group.trf}</div>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', flex:1 }}>
          {flts.map(f=><span key={f} style={S.fltTag}>{f}</span>)}
          {fltGap>0&&fltGap<=ALGO.CW && <span style={S.gapOk}>✓ combine ({fltGap}m)</span>}
          {fltGap>ALGO.CW            && <span style={S.gapWarn}>⚠ split ({fltGap}m gap)</span>}
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
          {hasRL && <span style={S.rlBadge}>↩ return load</span>}
          <span style={{ fontSize:11, color:B.textSecond }}>{totalPax} pax</span>
          <span style={{ fontSize:11, color:B.textMuted }}>{open?'▲':'▼'}</span>
        </div>
      </div>

      {open && (
        <>
          {runs.map((run,ri) => {
            const cfg = VESSEL_CFG[run.tt]
            return (
              <div key={ri} style={S.runBlock}>
                <div style={S.vTag(run.tt)}>{cfg.icon} {cfg.label}</div>
                {run.transfers.map((t,ti) => (
                  <div key={ti} style={{ ...S.row, ...(ti===0?{borderTop:'none'}:{}) }}>
                    <span style={S.rmTag}>R{t.room}</span>
                    <span style={S.typeTag}>{t.type}</span>
                    <span style={S.guestName}>{t.name}</span>
                    {t.pax>0 && <span style={{ fontSize:11, color:B.textSecond, flexShrink:0 }}>×{t.pax}</span>}
                    {t.vip   && <span style={vipStyle(t.vip)}>{t.vip}</span>}
                    {t.comment && <span style={S.commentTxt} title={t.comment}>{t.comment}</span>}
                  </div>
                ))}
              </div>
            )
          })}
          <div style={S.timingBar}>
            <span>→ arrives VIA {toT(arrVIA)}</span>
            {recTrf && <span style={{ color: buf!==null&&buf<0?'#92400E':'#065F46' }}>formula TRF: {recTrf} ({buf!==null?fmtB(buf):'—'})</span>}
            {hasRL&&next && <span style={{ color:B.success }}>↩ window {toT(arrVIA)}–{toT(arrVIA+ALGO.RL)}</span>}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Scheduler: Main View ──────────────────────────────────────────────────────
function SchedulerView({ isMobile }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate]         = useState(today)
  const [showAlgo, setShowAlgo] = useState(false)
  const transfers  = useMemo(()=>SAMPLE_DATA[date]||[], [date])
  const groups     = useMemo(()=>groupByTrf(transfers), [transfers])
  const totalPax   = transfers.reduce((s,t)=>s+t.pax,0)
  const srnRuns    = groups.filter(g=>g.transfers.some(t=>t.tt==='serenity')).length
  const pvtRuns    = groups.filter(g=>g.transfers.some(t=>t.tt==='private'||t.tt==='luxury')).length
  const vipGuests  = transfers.filter(t=>t.vip).length
  const buffers    = groups.map(g=>calcBuf(g.trf,g.transfers.map(t=>toM(t.fltT)).filter(f=>!isNaN(f)))).filter(b=>b!==null)
  const avgBuf     = buffers.length ? Math.round(buffers.reduce((s,b)=>s+b,0)/buffers.length) : null
  const sampleDates = Object.keys(SAMPLE_DATA)
  const [schedTab, setSchedTab] = useState('departures')

  return (
    <div style={{ fontFamily:'var(--font-sans,system-ui)' }}>
      <div style={{ marginBottom:isMobile?12:16, display:'flex', alignItems:isMobile?'flex-start':'center', gap:isMobile?8:12, flexWrap:'wrap', flexDirection:isMobile?'column':'row' }}>
        <div>
          <div style={{ fontSize:isMobile?14:16, fontWeight:500 }}>🗓️ Smart Scheduler</div>
          <div style={{ fontSize:12, color:B.textSecond }}>Baros Maldives · Transfer planner</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ padding:'6px 10px', borderRadius:6, border:`0.5px solid ${B.borderMid}`, background:B.white, fontSize:13, color:B.textPrimary, outline:'none' }} />
          <button onClick={()=>setShowAlgo(a=>!a)} style={{ padding:'6px 12px', borderRadius:6, border:`0.5px solid ${B.borderMid}`, background:'transparent', fontSize:12, cursor:'pointer', color:B.textSecond }}>
            {showAlgo?'▲ Hide':'▼ Show'} algo
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:0, marginBottom:16, borderBottom:`0.5px solid ${B.border}` }}>
        {[['departures','✈️ Departures'],['arrivals','🛬 Arrivals']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setSchedTab(id)} style={{ padding:'8px 20px', border:'none', background:'transparent', cursor:'pointer', fontSize:13, fontWeight:500, color:schedTab===id?'#0EA5E9':B.textSecond, borderBottom:schedTab===id?`2px solid ${B.freshPalm}`:'2px solid transparent', marginBottom:'-0.5px' }}>{lbl}</button>
        ))}
      </div>

      {schedTab==='arrivals' && (
        <div style={{ padding:'40px 20px', textAlign:'center', color:B.textSecond, fontSize:13, background:B.white, borderRadius:8, border:`0.5px solid ${B.border}` }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🛬</div>
          <div style={{ fontWeight:500, marginBottom:6 }}>Arrivals Scheduler</div>
          <div style={{ fontSize:12 }}>Upload an arrivals report PDF to load inbound transfers. Coming in next update.</div>
        </div>
      )}

      {schedTab==='departures' && <>
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        {sampleDates.map(d=>(
          <button key={d} onClick={()=>setDate(d)} style={{ padding:'3px 10px', borderRadius:4, border:`0.5px solid ${B.border}`, background:date===d?B.freshPalm:'transparent', color:date===d?B.white:B.textSecond, fontSize:11, cursor:'pointer' }}>
            {new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
          </button>
        ))}
        <span style={{ fontSize:10, color:B.textMuted, alignSelf:'center', marginLeft:4 }}>← 7-day training data</span>
      </div>

      {showAlgo && (
        <div style={S.algoPanel}>
          <div style={{ color:'#38BDF8', fontWeight:500, marginBottom:10 }}>⚙️ Algorithm Constants · Baros ↔ VIA</div>
          {[['Journey Baros ↔ VIA',ALGO.JOURNEY],['Immigration buffer',ALGO.IMM],['Lounge to jetty',ALGO.LJ],['Depart before flight',ALGO.DEP]].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:'0.5px solid #1E293B', color:'#94A3B8', fontSize:11 }}><span>{k}</span><span style={{ color:'#F1F5F9', fontFamily:'monospace' }}>{v} min</span></div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', color:'#F1F5F9', fontWeight:500, fontSize:11 }}><span>Total lead time</span><span style={{ color:'#38BDF8', fontFamily:'monospace' }}>{LEAD} min</span></div>
          <div style={{ marginTop:8, display:'flex', gap:16, flexWrap:'wrap', fontSize:11, color:'#64748B' }}>
            <span>Combine window: <strong style={{ color:'#94A3B8' }}>{ALGO.CW} min</strong></span>
            <span>Return load max: <strong style={{ color:'#94A3B8' }}>{ALGO.RL} min</strong></span>
          </div>
        </div>
      )}

      <div style={S.statRow}>
        {[
          { val:totalPax,   lbl:'👥 Pax today',      a:B.freshPalm },
          { val:groups.length, lbl:'⚓ Boat runs',    a:B.freshPalmMid },
          { val:srnRuns,    lbl:'👑 Serenity',        a:'#7B5EA7' },
          { val:pvtRuns,    lbl:'⭐ Pvt / Lux',       a:B.gold },
          { val:vipGuests,  lbl:'🌟 VIP guests',      a:'#B05880' },
          { val:avgBuf!==null?fmtB(avgBuf):'—', lbl:'⏱ Avg buffer', a:B.textSecond },
        ].map(s=>(
          <div key={s.lbl} style={S.stat(s.a)}>
            <div style={{ fontSize:20, fontWeight:500, color:s.a }}>{s.val}</div>
            <div style={{ fontSize:11, color:B.textSecond, marginTop:2 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {groups.length===0 ? (
        <div style={S.groupCard}>
          <div style={{ padding:'40px 20px', textAlign:'center', color:B.textSecond, fontSize:13 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
            <div>No departures for {date}</div>
            <div style={{ marginTop:6, fontSize:12 }}>Select a date above to view training data.</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize:11, color:B.textSecond, marginBottom:8 }}>{groups.length} transfer group{groups.length!==1?'s':''} · click any row to expand/collapse</div>
          {groups.map((g,i)=><GroupCard key={g.trf} group={g} allGroups={groups} groupIdx={i} />)}
          <div style={{ marginTop:12, padding:'10px 14px', background:B.pearl, borderRadius:8, border:`0.5px solid ${B.border}`, fontSize:11, color:B.textSecond }}>
            <strong style={{ color:B.textPrimary }}>Return load strategy:</strong> When ↩ badge shows, the boat waits at VIA up to {ALGO.RL} min for incoming arrivals before returning — maximising vessel utilisation.
          </div>
        </>
      )}
      </>}
    </div>
  )
}


// ─── Vessels ──────────────────────────────────────────────────────────────────
const TRIP_TYPES = ['Guest transfer','VIP / Private transfer','CIP / Serenity transfer','Staff ferry','Fuel run','Maintenance run','Inter-resort transfer','Airport transfer']

function VesselsView({ isMobile }) {
  const emptyV = { name:'', length:'', capacity:'', trip_types:[], engine_make:'', engine_brand:'', last_overhaul:'', generator_brand:'', generator_capacity:'', generator_make:'', last_dry_dock:'', running_hours:'', mileage:'', fuel_capacity:'', min_fuel:'', max_trips_no_fuel:'', status:'active', notes:'' }
  const [vessels, setVessels] = useState([])
  const [form, setForm] = useState(emptyV)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const statusOpts = ['active','standby','maintenance']
  const statusColor = s => s==='active'?[B.successLight,B.success]:s==='standby'?[B.warningLight,B.warning]:[B.dangerLight,B.danger]

  // ── Load from Supabase on mount ──
  useEffect(() => {
    supabase.from('fleet')
      .select('*')
      .eq('resort_id', BAROS_RESORT_ID)
      .order('name')
      .then(({ data, error }) => {
        if (error) { setErrMsg('Failed to load vessels: ' + error.message) }
        else { setVessels(data || []) }
        setLoading(false)
      })
  }, [])

  const toggleTrip = t => setForm(p => ({ ...p, trip_types: p.trip_types.includes(t) ? p.trip_types.filter(x=>x!==t) : [...p.trip_types, t] }))

  // ── Save (Insert or Update) ──
  const save = async () => {
    if (!form.name) return
    setSaving(true); setErrMsg('')
    const payload = {
      ...form,
      capacity: Number(form.capacity),
      resort_id: BAROS_RESORT_ID,
    }
    if (editing !== null) {
      const { error } = await supabase.from('fleet').update(payload).eq('id', editing)
      if (error) { setErrMsg('Save failed: ' + error.message) }
      else { setVessels(v => v.map(x => x.id===editing ? { ...payload, id:editing } : x)); setEditing(null) }
    } else {
      const { data, error } = await supabase.from('fleet').insert([payload]).select()
      if (error) { setErrMsg('Save failed: ' + error.message) }
      else if (data) { setVessels(v => [...v, data[0]]) }
    }
    setSaving(false); setForm(emptyV); setShowForm(false)
  }

  // ── Edit ──
  const edit = v => {
    setForm({ ...v, trip_types: v.trip_types || [] })
    setEditing(v.id); setShowForm(true); setExpandedId(null)
  }

  // ── Delete ──
  const del = async id => {
    const { error } = await supabase.from('fleet').delete().eq('id', id)
    if (error) { setErrMsg('Delete failed: ' + error.message) }
    else { setVessels(v => v.filter(x => x.id !== id)) }
  }

  return (
    <>
      <div style={{ marginBottom:isMobile?12:16, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div style={{ fontSize:isMobile?14:16, fontWeight:500 }}>⛵ Vessels</div>
        <button onClick={()=>{ setForm(emptyV); setEditing(null); setShowForm(s=>!s); setExpandedId(null) }} style={BTN_ADD}>
          {showForm ? '✕ Cancel' : '+ Add Vessel'}
        </button>
        {loading && <span style={{ fontSize:12, color:B.textMuted }}>Loading…</span>}
      </div>

      {errMsg && <div style={{ padding:'10px 14px', background:B.dangerLight, color:B.danger, borderRadius:6, fontSize:13, marginBottom:12 }}>{errMsg}</div>}

      {showForm && (
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={S.cardHdr}>{editing ? 'Edit Vessel' : 'New Vessel'}</div>
          <div style={{ padding:16 }}>
            <div style={{ fontSize:12, fontWeight:500, color:B.textSecond, marginBottom:10, textTransform:'uppercase', letterSpacing:'.5px' }}>Basic Info</div>
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
              <div>
                <label style={LBL}>Vessel Name</label>
                <input style={INP} type="text" value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Vessel Name" />
              </div>
              <div>
                <label style={LBL}>Length</label>
                <input style={INP} type="text" value={form.length||''} onChange={e=>setForm(p=>({...p,length:e.target.value}))} placeholder="e.g. 12m" />
              </div>
              <div>
                <label style={LBL}>Max Capacity (pax)</label>
                <input style={INP} type="number" value={form.capacity||''} onChange={e=>setForm(p=>({...p,capacity:e.target.value}))} placeholder="Max Capacity" />
              </div>
              <div>
                <label style={LBL}>Status</label>
                <select style={INP} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                  {statusOpts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={LBL}>Notes</label>
                <input style={INP} value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Optional notes" />
              </div>
            </div>

            <div style={{ fontSize:12, fontWeight:500, color:B.textSecond, marginBottom:10, textTransform:'uppercase', letterSpacing:'.5px' }}>Trip Types</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:isMobile?6:8, marginBottom:16 }}>
              {TRIP_TYPES.map(t => (
                <label key={t} style={{ display:'flex', alignItems:'center', gap:6, padding:isMobile?'4px 8px':'5px 12px', borderRadius:6, border:`0.5px solid ${form.trip_types.includes(t)?B.freshPalm:B.border}`, background:form.trip_types.includes(t)?B.palmLight:'transparent', cursor:'pointer', fontSize:12 }}>
                  <input type="checkbox" checked={form.trip_types.includes(t)} onChange={()=>toggleTrip(t)} style={{ width:14, height:14 }} />
                  {t}
                </label>
              ))}
            </div>

            <div style={{ fontSize:12, fontWeight:500, color:B.textSecond, marginBottom:10, textTransform:'uppercase', letterSpacing:'.5px' }}>Engine</div>
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
              <div><label style={LBL}>Engine Make</label><input style={INP} type="text" value={form.engine_make||''} onChange={e=>setForm(p=>({...p,engine_make:e.target.value}))} placeholder="Engine Make" /></div>
              <div><label style={LBL}>Engine Brand</label><input style={INP} type="text" value={form.engine_brand||''} onChange={e=>setForm(p=>({...p,engine_brand:e.target.value}))} placeholder="Engine Brand" /></div>
              <div><label style={LBL}>Last Overhaul</label><input style={INP} type="month" value={form.last_overhaul||''} onChange={e=>setForm(p=>({...p,last_overhaul:e.target.value}))} /></div>
            </div>

            <div style={{ fontSize:12, fontWeight:500, color:B.textSecond, marginBottom:10, textTransform:'uppercase', letterSpacing:'.5px' }}>Generator</div>
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
              <div><label style={LBL}>Generator Make</label><input style={INP} type="text" value={form.generator_make||''} onChange={e=>setForm(p=>({...p,generator_make:e.target.value}))} placeholder="Generator Make" /></div>
              <div><label style={LBL}>Generator Brand</label><input style={INP} type="text" value={form.generator_brand||''} onChange={e=>setForm(p=>({...p,generator_brand:e.target.value}))} placeholder="Generator Brand" /></div>
              <div><label style={LBL}>Generator Capacity</label><input style={INP} type="text" value={form.generator_capacity||''} onChange={e=>setForm(p=>({...p,generator_capacity:e.target.value}))} placeholder="e.g. 10kW" /></div>
            </div>

            <div style={{ fontSize:12, fontWeight:500, color:B.textSecond, marginBottom:10, textTransform:'uppercase', letterSpacing:'.5px' }}>Operations</div>
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
              <div><label style={LBL}>Last Dry Dock</label><input style={INP} type="month" value={form.last_dry_dock||''} onChange={e=>setForm(p=>({...p,last_dry_dock:e.target.value}))} /></div>
              <div><label style={LBL}>Running Hours</label><input style={INP} type="number" value={form.running_hours||''} onChange={e=>setForm(p=>({...p,running_hours:e.target.value}))} placeholder="Running Hours" /></div>
              <div><label style={LBL}>Mileage (nm)</label><input style={INP} type="number" value={form.mileage||''} onChange={e=>setForm(p=>({...p,mileage:e.target.value}))} placeholder="Mileage" /></div>
              <div><label style={LBL}>Fuel Capacity (L)</label><input style={INP} type="number" value={form.fuel_capacity||''} onChange={e=>setForm(p=>({...p,fuel_capacity:e.target.value}))} placeholder="Fuel Capacity" /></div>
              <div><label style={LBL}>Min Fuel Needed (L)</label><input style={INP} type="number" value={form.min_fuel||''} onChange={e=>setForm(p=>({...p,min_fuel:e.target.value}))} placeholder="Min Fuel" /></div>
              <div><label style={LBL}>Max Trips Without Fuel</label><input style={INP} type="number" value={form.max_trips_no_fuel||''} onChange={e=>setForm(p=>({...p,max_trips_no_fuel:e.target.value}))} placeholder="Max Trips" /></div>
            </div>

            <button onClick={save} style={BTN_PRIMARY} disabled={saving}>
              {saving ? 'Saving…' : editing ? '✓ Update Vessel' : '+ Save Vessel'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {vessels.map(v => {
          const [bg,col] = statusColor(v.status)
          const expanded = expandedId === v.id
          return (
            <div key={v.id} style={S.card}>
              <div style={{ ...S.cardHdr, cursor:'pointer' }} onClick={()=>setExpandedId(expanded?null:v.id)}>
                <strong style={{ fontSize:15 }}>{v.name}</strong>
                <span style={{ fontSize:12, color:B.textSecond, marginLeft:8 }}>{v.length} · {v.capacity} pax</span>
                <div style={{ display:'flex', gap:6, marginLeft:'auto', alignItems:'center' }}>
                  <span style={S.badge(bg,col)}>● {v.status}</span>
                  <button onClick={e=>{e.stopPropagation();edit(v)}} style={{ padding:'3px 10px', borderRadius:4, border:`0.5px solid ${B.borderMid}`, background:'transparent', fontSize:11, cursor:'pointer' }}>Edit</button>
                  <button onClick={e=>{e.stopPropagation();del(v.id)}} style={BTN_DEL}>Delete</button>
                  <span style={{ fontSize:11, color:B.textMuted }}>{expanded?'▲':'▼'}</span>
                </div>
              </div>
              <div style={{ padding:'6px 16px', display:'flex', gap:6, flexWrap:'wrap', borderBottom: expanded?`0.5px solid ${B.border}`:'none' }}>
                {(v.trip_types||[]).map(t=><span key={t} style={{ ...S.badge('rgba(14,165,233,0.08)','#0369A1'), fontSize:10 }}>{t}</span>)}
              </div>
              {expanded && (
                <div style={{ padding:isMobile?10:16, display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:isMobile?8:12, fontSize:12 }}>
                  {[['Engine Make',v.engine_make],['Engine Brand',v.engine_brand],['Last Overhaul',v.last_overhaul],['Generator Make',v.generator_make],['Generator Brand',v.generator_brand],['Generator Cap.',v.generator_capacity],['Last Dry Dock',v.last_dry_dock],['Running Hours',(v.running_hours||'')+'hrs'],['Mileage',(v.mileage||'')+' nm'],['Fuel Capacity',(v.fuel_capacity||'')+' L'],['Min Fuel',(v.min_fuel||'')+' L'],['Max Trips/Fuel',v.max_trips_no_fuel]].map(([k,val])=>(
                    <div key={k}>
                      <div style={{ fontSize:10, color:B.textSecond, marginBottom:2 }}>{k}</div>
                      <div style={{ fontWeight:500 }}>{val||'—'}</div>
                    </div>
                  ))}
                  {v.notes && <div style={{ gridColumn:'span 3', fontSize:11, color:B.textSecond }}>Notes: {v.notes}</div>}
                </div>
              )}
            </div>
          )
        })}
        {!loading && vessels.length === 0 && (
          <div style={{ padding:'30px 20px', textAlign:'center', color:B.textMuted, fontSize:13, background:B.white, borderRadius:8, border:`0.5px solid ${B.border}` }}>
            No vessels yet. Click <strong>+ Add Vessel</strong> to get started.
          </div>
        )}
      </div>
    </>
  )
}

// ─── Team ─────────────────────────────────────────────────────────────────────
const TEAM_ROLES = ['Admin','Senior Captain','Captain','Boat Crew']
const ALL_VESSELS = ['Ixora','Tara','Serenity','Xari']

function TeamView({ isMobile }) {
  const empty = { name:'', role:'Captain', vessels:[], contact:'', status:'on-duty', notes:'' }
  const [team, setTeam] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filterRole, setFilterRole] = useState('All')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const statusOpts = ['on-duty','off-duty','leave']
  const statusColor = s => s==='on-duty'?[B.successLight,B.success]:s==='off-duty'?[B.palmLight,B.textSecond]:[B.warningLight,B.warning]
  const roleColor = r => r==='Admin'?[B.goldLight,B.gold]:r==='Senior Captain'?[B.palmMid,B.freshPalm]:r==='Captain'?[B.palmLight,B.freshPalmMid]:[B.pearlDeep,B.textSecond]

  // ── Load from Supabase on mount ──
  useEffect(() => {
    supabase.from('captains')
      .select('*')
      .eq('resort_id', BAROS_RESORT_ID)
      .order('name')
      .then(({ data, error }) => {
        if (error) { setErrMsg('Failed to load team: ' + error.message) }
        else { setTeam(data || []) }
        setLoading(false)
      })
  }, [])

  const toggleVessel = v => setForm(p => ({ ...p, vessels: p.vessels.includes(v) ? p.vessels.filter(x=>x!==v) : [...p.vessels, v] }))

  // ── Save (Insert or Update) ──
  const save = async () => {
    if (!form.name) return
    setSaving(true); setErrMsg('')
    const payload = { ...form, resort_id: BAROS_RESORT_ID }
    if (editing !== null) {
      const { error } = await supabase.from('captains').update(payload).eq('id', editing)
      if (error) { setErrMsg('Save failed: ' + error.message) }
      else { setTeam(t => t.map(x => x.id===editing ? { ...payload, id:editing } : x)); setEditing(null) }
    } else {
      const { data, error } = await supabase.from('captains').insert([payload]).select()
      if (error) { setErrMsg('Save failed: ' + error.message) }
      else if (data) { setTeam(t => [...t, data[0]]) }
    }
    setSaving(false); setForm(empty); setShowForm(false)
  }

  // ── Edit ──
  const edit = m => { setForm({ ...m, vessels: m.vessels || [] }); setEditing(m.id); setShowForm(true) }

  // ── Delete ──
  const del = async id => {
    const { error } = await supabase.from('captains').delete().eq('id', id)
    if (error) { setErrMsg('Delete failed: ' + error.message) }
    else { setTeam(t => t.filter(x => x.id !== id)) }
  }

  const filtered = filterRole==='All' ? team : team.filter(m=>m.role===filterRole)
  const roleLabel = r => r==='Admin' ? 'can manage all boats' : r==='Senior Captain' ? 'can captain any boat' : r==='Captain' ? 'assigned boats only' : 'can crew on assigned boats'

  return (
    <>
      <div style={{ marginBottom:isMobile?12:16, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <div style={{ fontSize:isMobile?14:16, fontWeight:500 }}>👥 Team</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {['All',...TEAM_ROLES].map(r=>(
            <button key={r} onClick={()=>setFilterRole(r)} style={{ padding:'4px 12px', borderRadius:99, border:`0.5px solid ${B.borderMid}`, background:filterRole===r?B.freshPalm:'transparent', color:filterRole===r?B.white:B.textSecond, fontSize:11, cursor:'pointer' }}>{r}</button>
          ))}
        </div>
        <button onClick={()=>{ setForm(empty); setEditing(null); setShowForm(s=>!s) }} style={BTN_ADD}>
          {showForm ? '✕ Cancel' : '+ Add Member'}
        </button>
        {loading && <span style={{ fontSize:12, color:B.textMuted }}>Loading…</span>}
      </div>

      {errMsg && <div style={{ padding:'10px 14px', background:B.dangerLight, color:B.danger, borderRadius:6, fontSize:13, marginBottom:12 }}>{errMsg}</div>}

      {showForm && (
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={S.cardHdr}>{editing ? 'Edit Team Member' : 'New Team Member'}</div>
          <div style={{ padding:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:isMobile?8:12, marginBottom:isMobile?12:16 }}>
              <div>
                <div style={{ fontSize:11, color:B.textSecond, marginBottom:4 }}>Full Name</div>
                <input style={INP} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Full name" />
              </div>
              <div>
                <div style={{ fontSize:11, color:B.textSecond, marginBottom:4 }}>Contact Number</div>
                <input style={INP} value={form.contact} onChange={e=>setForm(p=>({...p,contact:e.target.value}))} placeholder="+960 777 0000" />
              </div>
              <div>
                <div style={{ fontSize:11, color:B.textSecond, marginBottom:4 }}>Role</div>
                <select style={INP} value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                  {TEAM_ROLES.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:B.textSecond, marginBottom:4 }}>Status</div>
                <select style={INP} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                  {statusOpts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:B.textSecond, marginBottom:4 }}>Notes</div>
                <input style={INP} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Optional" />
              </div>
            </div>

            <div style={{ fontSize:11, color:B.textSecond, marginBottom:8 }}>
              {form.role==='Boat Crew' ? 'Boats this crew member can work on:' : 'Boats this person can captain / operate:'}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
              {ALL_VESSELS.map(v => (
                <label key={v} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:6, border:`0.5px solid ${form.vessels.includes(v)?B.freshPalm:B.border}`, background:form.vessels.includes(v)?B.palmLight:'transparent', cursor:'pointer', fontSize:13, fontWeight:500 }}>
                  <input type="checkbox" checked={form.vessels.includes(v)} onChange={()=>toggleVessel(v)} style={{ width:14, height:14 }} />
                  {v}
                </label>
              ))}
            </div>

            <button onClick={save} style={BTN_PRIMARY} disabled={saving}>
              {saving ? 'Saving…' : editing ? '✓ Update Member' : '+ Save Member'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.map(m => {
          const [sbg,scol] = statusColor(m.status)
          const [rbg,rcol] = roleColor(m.role)
          return (
            <div key={m.id} style={{ ...S.card, marginBottom:0 }}>
              <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:B.palmLight, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:14, color:B.freshPalm, flexShrink:0 }}>
                  {m.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:500, fontSize:14 }}>{m.name}</div>
                  <div style={{ fontSize:11, color:B.textSecond, marginTop:1 }}>{m.contact} · {roleLabel(m.role)}</div>
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={S.badge(rbg,rcol)}>{m.role}</span>
                  <span style={S.badge(sbg,scol)}>● {m.status}</span>
                  {(m.vessels||[]).map(v=><span key={v} style={{ ...S.badge('rgba(107,114,128,0.08)','#374151'), fontSize:10 }}>{v}</span>)}
                  <button onClick={()=>edit(m)} style={{ padding:'3px 10px', borderRadius:4, border:`0.5px solid ${B.borderMid}`, background:'transparent', fontSize:11, cursor:'pointer' }}>Edit</button>
                  <button onClick={()=>del(m.id)} style={BTN_DEL}>Delete</button>
                </div>
              </div>
            </div>
          )
        })}
        {!loading && filtered.length === 0 && (
          <div style={{ padding:'30px 20px', textAlign:'center', color:B.textMuted, fontSize:13, background:B.white, borderRadius:8, border:`0.5px solid ${B.border}` }}>
            No team members yet. Click <strong>+ Add Member</strong> to get started.
          </div>
        )}
      </div>
    </>
  )
}

// ─── Fuel Log ─────────────────────────────────────────────────────────────────
function FuelLogView({ isMobile }) {
  const today = new Date().toISOString().split('T')[0]
  const empty = { date:today, vessel:'Ixora', litres:'', cost:'', filledBy:'', notes:'' }
  const [logs, setLogs] = useState([
    { id:1, date:'2026-03-28', vessel:'Ixora',    litres:120, cost:180, filledBy:'Ahmed Rasheed',  notes:'' },
    { id:2, date:'2026-03-27', vessel:'Tara',     litres:95,  cost:142, filledBy:'Mohamed Saeed',  notes:'' },
    { id:3, date:'2026-03-26', vessel:'Serenity', litres:60,  cost:90,  filledBy:'Ibrahim Hassan', notes:'VIP trip' },
  ])
  const [form, setForm] = useState(empty)
  const [showForm, setShowForm] = useState(false)
  const vesselOpts = ['Ixora','Tara','Serenity','Xari']

  const save = () => {
    if (!form.vessel || !form.litres) return
    setLogs(l => [{ ...form, id:Date.now(), litres:Number(form.litres), cost:Number(form.cost) }, ...l])
    setForm(empty); setShowForm(false)
  }

  const totalLitres = logs.reduce((s,l)=>s+l.litres,0)
  const totalCost   = logs.reduce((s,l)=>s+l.cost,0)

  return (
    <>
      <div style={{ marginBottom:isMobile?12:16, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ fontSize:isMobile?14:16, fontWeight:500 }}>⛽ Fuel Log</div>
        <button onClick={()=>setShowForm(s=>!s)} style={BTN_ADD}>
          {showForm ? '✕ Cancel' : '+ Add Entry'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:isMobile?8:12, marginBottom:isMobile?12:16 }}>
        {[['⛽ Total Litres',totalLitres.toLocaleString()+' L',B.freshPalm],['💰 Total Cost','$ '+totalCost.toLocaleString(),B.gold]].map(([lbl,val,col])=>(
          <div key={lbl} style={{ background:B.white, border:`0.5px solid ${B.border}`, borderRadius:8, padding:'12px 16px', borderTop:`2px solid ${col}` }}>
            <div style={{ fontSize:20, fontWeight:500, color:col }}>{val}</div>
            <div style={{ fontSize:11, color:B.textSecond, marginTop:2 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={S.cardHdr}>New Fuel Entry</div>
          <div style={{ ...S.cardBody, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:B.textSecond, marginBottom:4 }}>Date</div>
              <input style={INP} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} />
            </div>
            <div>
              <div style={{ fontSize:11, color:B.textSecond, marginBottom:4 }}>Vessel</div>
              <select style={INP} value={form.vessel} onChange={e=>setForm(p=>({...p,vessel:e.target.value}))}>
                {vesselOpts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            {[['Litres','litres','number'],['Cost ($)','cost','number'],['Filled By','filledBy','text'],['Notes','notes','text']].map(([lbl,key,type])=>(
              <div key={key}>
                <div style={{ fontSize:11, color:B.textSecond, marginBottom:4 }}>{lbl}</div>
                <input style={INP} type={type} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} placeholder={lbl} />
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'flex-end' }}>
              <button onClick={save} style={BTN_PRIMARY}>Save Entry</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.card}>
        <div style={{ overflowX:'auto' }}>
        <table style={S.table}>
          <thead><tr>{['Date','Vessel','Litres','Cost','Filled By','Notes',''].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {logs.map(l=>(
              <tr key={l.id}>
                <td style={{...S.td, fontFamily:'monospace', fontSize:12}}>{l.date}</td>
                <td style={S.td}>{l.vessel}</td>
                <td style={S.td}>{l.litres} L</td>
                <td style={S.td}>$ {l.cost}</td>
                <td style={S.td}>{l.filledBy||'—'}</td>
                <td style={{...S.td, color:B.textSecond, fontSize:12}}>{l.notes||'—'}</td>
                <td style={S.td}><button onClick={()=>setLogs(lg=>lg.filter(x=>x.id!==l.id))} style={BTN_DEL}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  )
}

// ─── Duty Roster ──────────────────────────────────────────────────────────────
const SHIFT_CODES = [
  { code:'G',  label:'On Duty',         bg:'#5B9BD5', text:'#fff' },
  { code:'O',  label:'Regular Off Day', bg:'#E8734A', text:'#fff' },
  { code:'AL', label:'Annual Leave',    bg:'#9B59B6', text:'#fff' },
  { code:'RR', label:'Rest & Relaxation',bg:'#27AE60',text:'#fff' },
  { code:'PH', label:'Public Holiday',  bg:'#E74C3C', text:'#fff' },
  { code:'S',  label:'Standby',         bg:'#F39C12', text:'#fff' },
  { code:'SL', label:'Sick Leave',      bg:'#95A5A6', text:'#fff' },
  { code:'T',  label:'Training',        bg:'#16A085', text:'#fff' },
]
const SHIFT_MAP   = Object.fromEntries(SHIFT_CODES.map(s=>[s.code,s]))
const SHIFT_CYCLE = SHIFT_CODES.map(s=>s.code)

const INITIAL_MEMBERS = [
  { id:'BM01233', name:'Ahmed Rasheed',  role:'Senior Captain', initials:'AR' },
  { id:'BM02508', name:'Mohamed Saeed', role:'Captain',         initials:'MS' },
  { id:'BM02429', name:'Hassan Ali',    role:'Captain',         initials:'HA' },
  { id:'BM02665', name:'Ali Moosa',     role:'Boat Crew',       initials:'AM' },
  { id:'BM02643', name:'Omar Faiz',     role:'Boat Crew',       initials:'OF' },
  { id:'BM01573', name:'Ibrahim Hassan',role:'Engineer',        initials:'IH' },
]

function RosterView({ user, isMobile }) {
  const now = new Date()
  const initPeriod = () => {
    if (now.getDate() >= 21) return { year: now.getFullYear(), month: now.getMonth() }
    return now.getMonth() === 0
      ? { year: now.getFullYear() - 1, month: 11 }
      : { year: now.getFullYear(), month: now.getMonth() - 1 }
  }
  const [year,  setYear]  = useState(initPeriod().year)
  const [month, setMonth] = useState(initPeriod().month)
  const [locked, setLocked] = useState(false)
  const [members] = useState(INITIAL_MEMBERS)
  const [activeCell, setActiveCell] = useState(null)
  const canEdit = user?.role === 'super_admin' || user?.role === 'resort_admin'

  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear  = month === 11 ? year + 1 : year
  const endOfStartMonth = new Date(year, month + 1, 0).getDate()

  const days = [
    ...Array.from({ length: endOfStartMonth - 20 }, (_, i) => {
      const d = new Date(year, month, 21 + i)
      return { day: 21 + i, month, year, dow: ['S','M','T','W','T','F','S'][d.getDay()], key: `${year}-${month}-${21+i}` }
    }),
    ...Array.from({ length: 20 }, (_, i) => {
      const d = new Date(nextYear, nextMonth, i + 1)
      return { day: i + 1, month: nextMonth, year: nextYear, dow: ['S','M','T','W','T','F','S'][d.getDay()], key: `${nextYear}-${nextMonth}-${i+1}` }
    }),
  ]

  const initRoster = () => {
    const r = {}
    members.forEach(m => { days.forEach(d => { r[`${m.id}-${d.key}`] = d.day % 7 === 0 ? 'O' : 'G' }) })
    return r
  }
  const [roster, setRoster] = useState(initRoster)

  const periodKey = `${year}-${month}`
  const prevPeriodKey = useRef(periodKey)
  if (prevPeriodKey.current !== periodKey) { prevPeriodKey.current = periodKey; setRoster(initRoster()) }

  const setShift = (memberId, dayKey, code) => {
    setRoster(r => ({...r, [`${memberId}-${dayKey}`]: code}))
    setActiveCell(null)
  }

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const prevPeriod = () => { if (month===0) { setMonth(11); setYear(y=>y-1) } else setMonth(m=>m-1) }
  const nextPeriod = () => { if (month===11) { setMonth(0); setYear(y=>y+1) } else setMonth(m=>m+1) }
  const countCode = (memberId, code) => days.filter(d => roster[`${memberId}-${d.key}`]===code).length
  const periodLabel = `21 ${SHORT[month]} – 20 ${SHORT[nextMonth]} ${nextYear}`

  return (
    <div style={{ fontFamily:'var(--font-sans,system-ui)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:isMobile?10:16, flexWrap:'wrap' }}>
        {canEdit && !locked && (
          <button onClick={()=>setLocked(false)} style={{ padding:isMobile?'5px 10px':'7px 18px', borderRadius:4, border:'none', background:B.freshPalm, color:'#fff', fontWeight:600, fontSize:isMobile?11:13, cursor:'pointer' }}>
            {isMobile?'PREPARE':'PREPARE ROSTER'}
          </button>
        )}
        <div style={{ flex:1, textAlign:'center' }}>
          <div style={{ fontSize:isMobile?14:18, fontWeight:600 }}>Boat Operations Duty Roster</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:4 }}>
            <button onClick={prevPeriod} style={{ border:'none', background:'transparent', cursor:'pointer', fontSize:16, color:B.textSecond }}>‹</button>
            <span style={{ fontSize:15, fontWeight:500 }}>{periodLabel}</span>
            <button onClick={nextPeriod} style={{ border:'none', background:'transparent', cursor:'pointer', fontSize:16, color:B.textSecond }}>›</button>
          </div>
          {canEdit && <div style={{ fontSize:11, color:B.textSecond, marginTop:2 }}>{locked?'Roster locked':'Click any cell to select status'}</div>}
        </div>
        {canEdit && (
          <button onClick={()=>setLocked(l=>!l)} style={{ padding:isMobile?'5px 10px':'7px 18px', borderRadius:4, border:'none', background: locked?B.success:B.danger, color:'#fff', fontWeight:600, fontSize:isMobile?11:13, cursor:'pointer' }}>
            {locked ? (isMobile?'UNLOCK':'UNLOCK ROSTER') : (isMobile?'LOCK':'LOCK ROSTER')}
          </button>
        )}
      </div>

      <div style={{ overflowX:'auto', background:B.white, border:`0.5px solid ${B.border}`, borderRadius:8, WebkitOverflowScrolling:'touch' }}>
        <table style={{ borderCollapse:'collapse', minWidth:'100%', fontSize:12 }}>
          <thead>
            <tr style={{ background:B.pearl }}>
              <th style={{ padding:isMobile?'6px 8px':'8px 12px', textAlign:'left', borderBottom:`0.5px solid ${B.border}`, minWidth:isMobile?90:120, position:'sticky', left:0, background:B.pearl, zIndex:2 }}>
                <span style={{ fontSize:11, color:B.textSecond, fontWeight:500 }}>MEMBER</span>
              </th>
              {days.map(d => {
                const isToday = d.day===now.getDate()&&d.month===now.getMonth()&&d.year===now.getFullYear()
                const isFirst = d.day === 1
                return (
                  <th key={d.key} style={{ padding:'6px 4px', textAlign:'center', borderBottom:`0.5px solid ${B.border}`, minWidth:36, fontWeight:isToday?700:400, color:isToday?'#0EA5E9':B.textPrimary, borderLeft: isFirst?`2px solid ${B.borderMid}`:'none' }}>
                    {d.day}
                  </th>
                )
              })}
              <th style={{ padding:'6px 8px', textAlign:'center', borderBottom:`0.5px solid ${B.border}`, minWidth:36, fontSize:10, color:B.textSecond }}>OFF</th>
              <th style={{ padding:'6px 8px', textAlign:'center', borderBottom:`0.5px solid ${B.border}`, minWidth:36, fontSize:10, color:B.textSecond }}>AL</th>
            </tr>
            <tr style={{ background:B.pearl }}>
              <th style={{ padding:'2px 12px', borderBottom:'1px solid rgba(26,69,48,0.12)', position:'sticky', left:0, background:B.pearl, zIndex:2 }}></th>
              {days.map(d => (
                <th key={d.key} style={{ padding:'2px 4px', textAlign:'center', borderBottom:'1px solid rgba(26,69,48,0.12)', fontSize:10, color:B.textSecond, fontWeight:400, borderLeft: d.day===1?`2px solid ${B.borderMid}`:'none' }}>{d.dow}</th>
              ))}
              <th style={{ borderBottom:'1px solid rgba(26,69,48,0.12)' }}></th>
              <th style={{ borderBottom:'1px solid rgba(26,69,48,0.12)' }}></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, mi) => (
              <tr key={m.id} style={{ background: mi%2===0 ? B.white : B.pearl }}>
                <td style={{ padding:'6px 12px', borderBottom:`0.5px solid ${B.border}`, position:'sticky', left:0, background: mi%2===0?B.white:B.pearl, zIndex:1, minWidth:120 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(14,165,233,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600, color:'#0369A1', flexShrink:0 }}>{m.initials}</div>
                    <div>
                      <div style={{ fontWeight:500, fontSize:12, whiteSpace:'nowrap' }}>{m.id}</div>
                      <div style={{ fontSize:10, color:B.textSecond, whiteSpace:'nowrap' }}>{m.role}</div>
                    </div>
                  </div>
                </td>
                {days.map(d => {
                  const rKey = `${m.id}-${d.key}`
                  const code = roster[rKey] || 'G'
                  const shift = SHIFT_MAP[code] || SHIFT_MAP['G']
                  const isToday = d.day===now.getDate()&&d.month===now.getMonth()&&d.year===now.getFullYear()
                  const isActive = activeCell === rKey
                  return (
                    <td key={d.key} style={{ padding:0, textAlign:'center', borderBottom:`0.5px solid ${B.border}`, outline: isToday?`2px solid ${B.freshPalm}`:'none', outlineOffset:'-2px', borderLeft: d.day===1?`2px solid ${B.borderMid}`:'none' }}>
                      {isActive && canEdit && !locked ? (
                        <select
                          autoFocus
                          value={code}
                          onChange={e => setShift(m.id, d.key, e.target.value)}
                          onBlur={() => setActiveCell(null)}
                          style={{ width:'100%', fontSize:10, border:'none', background:shift.bg, color:shift.text, fontWeight:700, padding:'6px 2px', cursor:'pointer', outline:'none', minWidth:34 }}
                        >
                          {SHIFT_CODES.map(s => <option key={s.code} value={s.code}>{s.code} – {s.label}</option>)}
                        </select>
                      ) : (
                        <div
                          onClick={() => canEdit && !locked && setActiveCell(rKey)}
                          style={{ background:shift.bg, color:shift.text, fontWeight:700, fontSize:11, padding:'7px 2px', minWidth:34, userSelect:'none', cursor:(canEdit&&!locked)?'pointer':'default' }}
                          title={shift.label}
                        >{code}</div>
                      )}
                    </td>
                  )
                })}
                <td style={{ padding:'4px 8px', textAlign:'center', borderBottom:`0.5px solid ${B.border}`, fontWeight:600, fontSize:12, color:'#E8734A' }}>{countCode(m.id,'O')}</td>
                <td style={{ padding:'4px 8px', textAlign:'center', borderBottom:`0.5px solid ${B.border}`, fontWeight:600, fontSize:12, color:'#9B59B6' }}>{countCode(m.id,'AL')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:16, justifyContent:'center', padding:'10px 0' }}>
        {SHIFT_CODES.map(s => (
          <div key={s.code} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
            <div style={{ width:24, height:24, background:s.bg, borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', color:s.text, fontWeight:700, fontSize:11 }}>{s.code}</div>
            <span style={{ color:B.textSecond }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


// ─── Flight Tracker ───────────────────────────────────────────────────────────

const IATA_TO_ICAO = {
  '3U':'CSC', '6E':'IGO', AF:'AFR', AI:'AIC', AK:'AXM',
  B4:'ZAN',  BA:'BAW',  BS:'UBG', CX:'CPA', DE:'CFG',
  EK:'UAE',  EY:'ETD',  FD:'AIQ', FZ:'FDB', G9:'ABY',
  GF:'GFA',  H4:'HSK',  IB:'IBE', JD:'CBJ', JL:'JAL',
  KL:'KLM',  LH:'DLH',  LO:'LOT', LX:'SWR', MF:'CXA',
  MH:'MAS',  MO:'NMB',  MS:'MSR', MU:'CES', NH:'ANA',
  NO:'ESS',  NR:'MLD',  OD:'BTK', OS:'AUA', PG:'BKP',
  Q2:'DQA',  QR:'QTR',  SQ:'SIA', SU:'AFL', TK:'THY',
  UL:'ALK',  UX:'AEA',  VS:'VIR', WK:'EDW', WY:'OMA',
}

const AIRLINE_INFO = {
  EK:{ name:'Emirates',            logo:'https://logo.clearbit.com/emirates.com',           color:'#C60C30' },
  QR:{ name:'Qatar Airways',       logo:'https://logo.clearbit.com/qatarairways.com',        color:'#5C0632' },
  BA:{ name:'British Airways',     logo:'https://logo.clearbit.com/britishairways.com',      color:'#075AAA' },
  SQ:{ name:'Singapore Airlines',  logo:'https://logo.clearbit.com/singaporeair.com',        color:'#192F5D' },
  EY:{ name:'Etihad Airways',      logo:'https://logo.clearbit.com/etihad.com',              color:'#BD8B13' },
  TK:{ name:'Turkish Airlines',    logo:'https://logo.clearbit.com/turkishairlines.com',     color:'#C8102E' },
  MH:{ name:'Malaysia Airlines',   logo:'https://logo.clearbit.com/malaysiaairlines.com',   color:'#003087' },
  UL:{ name:'SriLankan Airlines',  logo:'https://logo.clearbit.com/srilankan.com',           color:'#5B2D8E' },
  GF:{ name:'Gulf Air',            logo:'https://logo.clearbit.com/gulfair.com',             color:'#C8102E' },
  WY:{ name:'Oman Air',            logo:'https://logo.clearbit.com/omanair.com',             color:'#C8102E' },
  FZ:{ name:'flydubai',            logo:'https://logo.clearbit.com/flydubai.com',            color:'#E8413A' },
  AI:{ name:'Air India',           logo:'https://logo.clearbit.com/airindia.com',            color:'#E03C31' },
  '6E':{ name:'IndiGo',            logo:'https://logo.clearbit.com/goindigo.in',             color:'#1B4FA0' },
  MU:{ name:'China Eastern',       logo:'https://logo.clearbit.com/ceair.com',               color:'#E4002B' },
  AK:{ name:'AirAsia',             logo:'https://logo.clearbit.com/airasia.com',             color:'#FF0000' },
  BS:{ name:'US-Bangla Airlines',  logo:'https://logo.clearbit.com/usbair.com',              color:'#E31837' },
  KL:{ name:'KLM',                 logo:'https://logo.clearbit.com/klm.com',                 color:'#009FE3' },
  LH:{ name:'Lufthansa',           logo:'https://logo.clearbit.com/lufthansa.com',           color:'#05164D' },
  AF:{ name:'Air France',          logo:'https://logo.clearbit.com/airfrance.com',           color:'#002157' },
  OD:{ name:'Batik Air Malaysia',  logo:'https://logo.clearbit.com/batikair.com',            color:'#8B0000' },
  LX:{ name:'Swiss',               logo:'https://logo.clearbit.com/swiss.com',               color:'#E4002B' },
}

const FLIGHT_ORIGINS = {
  AK74:'KUL', BA060:'LGW', BA061:'LGW', DE2320:'FRA', DE2321:'FRA',
  EK656:'DXB', EK658:'DXB', EK660:'DXB', EY260:'AUH', FZ1025:'DXB',
  G9093:'SHJ', G9094:'SHJ', GF144:'BAH', MF889:'XMN', MH485:'KUL',
  MH483:'KUL', MU235:'PVG', NO510:'MXP', NO511:'FCO', OD293:'KUL',
  OD295:'KUL', QR672:'DOH', QR670:'DOH', SQ432:'SIN', SQ430:'SIN',
  TK734:'IST', TK736:'IST', UL101:'CMB', UL103:'CMB', UL115:'CMB',
  WK066:'ZRH', WK067:'ZRH', WY383:'MCT', WY384:'MCT',
  '6E1129':'TRV', '6E1131':'TRV', '6E1045':'COK', '6E1081':'BOM',
  BS337:'DAC', BS339:'DAC',
}

const AIRPORT_NAMES = {
  DXB:'Dubai', DOH:'Doha', LHR:'London Heathrow', SIN:'Singapore',
  AUH:'Abu Dhabi', IST:'Istanbul', KUL:'Kuala Lumpur', CMB:'Colombo',
  BAH:'Bahrain', MCT:'Muscat', BOM:'Mumbai', DEL:'Delhi',
  HYD:'Hyderabad', TRV:'Thiruvananthapuram', COK:'Kochi', MAA:'Chennai',
  BLR:'Bengaluru', CCU:'Kolkata', DAC:'Dhaka', KHI:'Karachi',
  CGK:'Jakarta', HKG:'Hong Kong', ICN:'Seoul', NRT:'Tokyo Narita',
  CDG:'Paris CDG', FRA:'Frankfurt', ZRH:'Zurich', VIE:'Vienna',
  AMS:'Amsterdam', JNB:'Johannesburg', GVA:'Geneva', MXP:'Milan',
  MLE:'Malé VIA', CAN:'Guangzhou', PVG:'Shanghai', PEK:'Beijing',
  SZX:'Shenzhen', CTU:'Chengdu',
}

const toCallsign = (flight) => {
  const f = flight.toUpperCase().trim()
  for (const [iata, icao] of Object.entries(IATA_TO_ICAO)) {
    if (f.startsWith(iata)) {
      const num = f.slice(iata.length)
      return icao + num
    }
  }
  return f
}

const getAirlineCode = (flight) => flight.toUpperCase().replace(/[0-9]/g,'').trim()

const fmtTime = ts => {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', timeZone:'Indian/Maldives' })
}

const fmtDur = secs => {
  if (secs <= 0) return 'Landed'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const MLE_LAT = 4.1755, MLE_LON = 73.5293
const distToMLE = (lat, lon) => {
  const R = 6371
  const dLat = (MLE_LAT - lat) * Math.PI / 180
  const dLon = (MLE_LON - lon) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180)*Math.cos(MLE_LAT*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function FlightCard({ flight, data, isMobile, onRemove }) {
  const now = Date.now() / 1000
  const code = getAirlineCode(flight)
  const info = AIRLINE_INFO[code] || { name: code, logo: null, color: '#1A4530' }
  const hasData = data && data.lat
  const isGround = hasData && data.alt < 200
  const isAir = hasData && !isGround
  const kmLeft = hasData ? distToMLE(data.lat, data.lon) : null
  const speedKmh = hasData && data.gspeed > 0 ? data.gspeed * 1.852 : null
  const etaSecs = (kmLeft && speedKmh) ? kmLeft / speedKmh * 3600 : null
  const etaTs = etaSecs ? now + etaSecs : null
  const boatTs = etaTs ? etaTs - 57 * 60 : null
  const remaining = etaSecs || 0
  const progress = isAir && etaSecs ? Math.min(95, Math.max(5, 100 - (etaSecs / 7200 * 100))) : isGround ? 100 : 0

  const status = isGround ? 'Landed' : isAir ? 'Airborne' : 'Scheduled'
  const statusColor = isGround ? '#059669' : isAir ? '#2563EB' : '#6B7280'
  const statusBg = isGround ? '#ECFDF5' : isAir ? '#EFF6FF' : '#F9FAFB'

  return (
    <div style={{ background:'#fff', border:`0.5px solid ${B.border}`, borderRadius:12, overflow:'hidden', marginBottom:14, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* Card header */}
      <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:14, borderBottom:`0.5px solid ${B.border}`, background:B.pearl }}>
        {/* Airline logo */}
        <div style={{ width:44, height:44, borderRadius:8, background:'#fff', border:`0.5px solid ${B.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
          {info.logo ? (
            <img src={info.logo} alt={info.name} style={{ width:36, height:36, objectFit:'contain' }}
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
          ) : null}
          <div style={{ width:36, height:36, background:info.color, borderRadius:6, display: info.logo ? 'none' : 'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700 }}>
            {code}
          </div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:18, fontWeight:700, color:B.textPrimary, letterSpacing:'-0.3px' }}>
            {code} <span style={{ color:info.color }}>{flight.slice(code.length)}</span>
          </div>
          <div style={{ fontSize:12, color:B.textSecond, marginTop:2 }}>
            {info.name} {hasData ? `· ${data.aircraft_type || ''}` : ''}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ background:statusBg, color:statusColor, border:`0.5px solid ${statusColor}30`, borderRadius:99, padding:'4px 12px', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:statusColor, display:'inline-block' }} />
            {status}
          </span>
          <button onClick={onRemove} style={{ background:'transparent', border:'none', color:B.textMuted, cursor:'pointer', fontSize:18, lineHeight:1, padding:'0 4px' }}>×</button>
        </div>
      </div>

      {/* Route bar */}
      <div style={{ padding:'16px 18px', borderBottom:`0.5px solid ${B.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ textAlign:'left', minWidth:60 }}>
            <div style={{ fontSize:22, fontWeight:700, color:B.textPrimary, letterSpacing:1 }}>
              {data?.orig || '—'}
            </div>
            <div style={{ fontSize:11, color:B.textSecond, marginTop:2 }}>
              {AIRPORT_NAMES[data?.orig] || 'Origin'}
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:B.textMuted, textAlign:'center', marginBottom:6 }}>
              {isAir ? fmtDur(remaining) + ' remaining' : isGround ? 'Arrived' : 'Awaiting position'}
            </div>
            <div style={{ height:3, background:B.breeze, borderRadius:99, position:'relative' }}>
              <div style={{ width:`${progress}%`, height:'100%', background: isGround?'#059669':info.color||B.freshPalm, borderRadius:99, transition:'width 2s ease' }} />
              {isAir && progress > 5 && (
                <div style={{ position:'absolute', top:-5, left:`${progress}%`, transform:'translateX(-50%)', fontSize:14 }}>✈️</div>
              )}
            </div>
            <div style={{ fontSize:10, color:B.textMuted, textAlign:'center', marginTop:4 }}>{Math.round(progress)}%</div>
          </div>
          <div style={{ textAlign:'right', minWidth:60 }}>
            <div style={{ fontSize:22, fontWeight:700, color:B.textPrimary, letterSpacing:1 }}>MLE</div>
            <div style={{ fontSize:11, color:B.textSecond, marginTop:2 }}>Malé VIA</div>
          </div>
        </div>
      </div>

      {/* Key info grid */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,1fr)', borderBottom:`0.5px solid ${B.border}` }}>
        {[
          { label:'ETA Malé', value: etaTs ? fmtTime(etaTs) : '—', color: isAir?'#2563EB':B.textPrimary, sub:'Velana VIA' },
          { label:'⚓ Boat Dispatch', value: boatTs ? fmtTime(boatTs) : '—', color: B.gold, sub: boatTs && boatTs > now ? 'upcoming' : '—' },
          { label:'Remaining', value: isAir ? fmtDur(remaining) : isGround ? 'Landed' : 'Pending', color:B.textPrimary, sub:isAir?'to MLE':'' },
          { label:'Distance', value: kmLeft ? Math.round(kmLeft) + ' km' : '—', color:B.textPrimary, sub:'to Malé' },
        ].map((item, i) => (
          <div key={i} style={{ padding:'12px 16px', borderRight: i<3?`0.5px solid ${B.border}`:'none' }}>
            <div style={{ fontSize:10, color:B.textMuted, textTransform:'uppercase', letterSpacing:'.8px', marginBottom:5 }}>{item.label}</div>
            <div style={{ fontSize:17, fontWeight:600, color:item.color, fontFamily:'monospace' }}>{item.value}</div>
            <div style={{ fontSize:10, color:B.textMuted, marginTop:2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Telemetry bar */}
      {hasData && (
        <div style={{ padding:'10px 18px', background:B.pearl, display:'flex', gap:20, flexWrap:'wrap' }}>
          {[
            { label:'Alt', value: data.alt ? data.alt.toLocaleString() + ' ft' : '—' },
            { label:'Speed', value: data.gspeed ? data.gspeed + ' kts' : '—' },
            { label:'Heading', value: data.track ? data.track + '°' : '—' },
            { label:'Position', value: `${data.lat?.toFixed(2)}°N  ${data.lon?.toFixed(2)}°E` },
          ].map(item => (
            <div key={item.label} style={{ display:'flex', gap:6, alignItems:'center' }}>
              <span style={{ fontSize:10, color:B.textMuted, textTransform:'uppercase', letterSpacing:'.5px' }}>{item.label}</span>
              <span style={{ fontSize:11, color:B.textPrimary, fontFamily:'monospace', fontWeight:500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FlightTrackerView({ isMobile }) {
  const [tracked, setTracked] = useState([])
  const [liveData, setLiveData] = useState({})
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [clock, setClock] = useState(new Date())
  const [refreshIn, setRefreshIn] = useState(30)

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const getOrig = (flight) => {
    const f = flight.toUpperCase().replace(/\s/g,'')
    return FLIGHT_ORIGINS[f] || null
  }

  const fetchAll = async (flights) => {
    if (!flights.length) return
    setLoading(true)
    try {
      const callsigns = flights.map(toCallsign).join(',')
      const res = await fetch(`/.netlify/functions/fr24?flights=${callsigns}`)
      if (res.ok) {
        const json = await res.json()
        setIsLive(true)
        if (json.data && json.data.length > 0) {
          const map = {}
          json.data.forEach(d => {
            flights.forEach(f => {
              if (toCallsign(f) === d.callsign) map[f] = { ...d, orig: getOrig(f) || '—' }
            })
          })
          setLiveData(prev => ({ ...prev, ...map }))
        }
      }
    } catch(e) {}
    setLoading(false)
  }

  useEffect(() => {
    if (!tracked.length) return
    fetchAll(tracked)
    const t = setInterval(() => {
      setRefreshIn(r => {
        if (r <= 1) { fetchAll(tracked); return 30 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [tracked])

  const addFlight = () => {
    const f = input.toUpperCase().replace(/\s/g,'')
    if (!f || tracked.includes(f)) { setInput(''); return }
    const newTracked = [...tracked, f]
    setTracked(newTracked)
    setInput('')
    setTimeout(() => fetchAll(newTracked), 100)
  }

  const removeFlight = f => {
    setTracked(t => t.filter(x => x !== f))
    setLiveData(d => { const n = {...d}; delete n[f]; return n })
  }

  const airborne = tracked.filter(f => liveData[f] && liveData[f].alt > 200).length
  const landed   = tracked.filter(f => liveData[f] && liveData[f].alt <= 200).length
  const pending  = tracked.length - airborne - landed

  return (
    <div>
      {/* Header */}
      <div style={{ background:B.freshPalm, borderRadius:10, padding:isMobile?'16px':'20px 24px', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:'2px', color:'rgba(255,255,255,0.45)', textTransform:'uppercase', marginBottom:4 }}>Dhirumbaa · Live Operations</div>
            <div style={{ fontSize:isMobile?16:20, fontWeight:600, color:'#fff' }}>Flight Tracker</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 }}>Velana International Airport · North Malé Atoll</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:isMobile?22:30, fontWeight:300, color:B.gold, fontFamily:'monospace', letterSpacing:2 }}>
              {clock.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit', timeZone:'Indian/Maldives' })}
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Maldives Time (MVT)</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap', alignItems:'center' }}>
          {[
            { val:airborne, label:'Airborne', color:'#34D399' },
            { val:landed,   label:'Landed',   color:'rgba(255,255,255,0.7)' },
            { val:pending,  label:'Pending',  color:'rgba(255,255,255,0.5)' },
            { val:tracked.length, label:'Tracked', color:B.gold },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.08)', borderRadius:8, padding:'6px 14px', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:700, color:s.color, fontFamily:'monospace' }}>{s.val}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.8px' }}>{s.label}</div>
            </div>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            {isLive && <span style={{ fontSize:10, background:'rgba(52,211,153,0.15)', color:'#34D399', border:'0.5px solid rgba(52,211,153,0.3)', borderRadius:99, padding:'3px 10px' }}>● Live</span>}
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>↻ {refreshIn}s</span>
            <button onClick={()=>fetchAll(tracked)} disabled={loading} style={{ fontSize:10, background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.7)', borderRadius:99, padding:'4px 12px', cursor:'pointer' }}>
              {loading ? 'Loading…' : '↻ Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Add flight */}
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key==='Enter' && addFlight()}
          placeholder="Add flight number — e.g. EK658, BA060, QR672, MH485"
          style={{ ...INP, flex:1, letterSpacing:1 }}
        />
        <button onClick={addFlight} style={BTN_PRIMARY}>+ Track</button>
      </div>

      {/* Flight cards */}
      {tracked.length === 0 ? (
        <div style={{ padding:'48px 20px', textAlign:'center', color:B.textMuted, background:B.white, borderRadius:10, border:`0.5px solid ${B.border}` }}>
          <div style={{ fontSize:36, marginBottom:10 }}>✈️</div>
          <div style={{ fontWeight:500, fontSize:15, marginBottom:6, color:B.textPrimary }}>No flights tracked</div>
          <div style={{ fontSize:12 }}>Add a flight number above to start live tracking</div>
        </div>
      ) : (
        tracked.map(f => (
          <FlightCard key={f} flight={f} data={liveData[f]} isMobile={isMobile} onRemove={() => removeFlight(f)} />
        ))
      )}
    </div>
  )
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function DhirumbaaFMS() {
  const [user, setUser] = useState(null)
  const [nav,  setNav]  = useState('dashboard')
  const isMobile = useIsMobile()

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      if (session) setUser({ username:session.user.email.split('@')[0], role:'resort_admin', session })
    })
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_,session) => {
      if (!session) setUser(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => { await supabase.auth.signOut(); setUser(null) }

  if (!user) return <LoginPage onLogin={setUser} />

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:"'Work Sans', system-ui, sans-serif", background:B.pearl, color:B.textPrimary, overflowX:'hidden' }}>

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:isMobile?8:14, padding:isMobile?'0 14px':'0 24px', height:isMobile?52:58, background:B.freshPalm, color:B.white, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:isMobile?24:28, height:isMobile?24:28, borderRadius:'50%', background:B.gold, display:'flex', alignItems:'center', justifyContent:'center', fontSize:isMobile?12:14, flexShrink:0 }}>⚓</div>
          <div style={{ fontSize:isMobile?13:16, fontWeight:600, letterSpacing:'0.5px', color:B.white }}>Dhirumbaa FMS</div>
        </div>
        {!isMobile && (
          <>
            <div style={{ width:1, height:20, background:'rgba(255,255,255,0.12)', margin:'0 4px' }} />
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', letterSpacing:'.3px' }}>{RESORT.name}</span>
          </>
        )}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:isMobile?8:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:isMobile?'4px 8px':'5px 12px', background:'rgba(255,255,255,0.06)', borderRadius:99, border:'0.5px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width:isMobile?20:22, height:isMobile?20:22, borderRadius:'50%', background:B.gold, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:600, color:B.midnight }}>
              {user.username.slice(0,2).toUpperCase()}
            </div>
            {!isMobile && <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>{user.username}</span>}
          </div>
          <button onClick={logout} style={{ padding:isMobile?'4px 10px':'5px 14px', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:99, background:'transparent', color:'rgba(255,255,255,0.55)', cursor:'pointer', fontSize:11 }}>
            {isMobile ? '↩' : 'Sign out'}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Desktop sidebar */}
        {!isMobile && (
          <div style={{ width:210, background:B.midnight, display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
            <div style={{ padding:'20px 18px 8px', fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:'2px', textTransform:'uppercase' }}>Navigation</div>
            {NAV.map(item => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 18px', cursor:'pointer', background: nav===item.id?'rgba(255,255,255,0.07)':'transparent', color: nav===item.id?B.white:'rgba(255,255,255,0.45)', borderLeft: nav===item.id?`3px solid ${B.gold}`:'3px solid transparent', fontSize:12, transition:'all .15s', userSelect:'none', letterSpacing:'.3px' }} onClick={()=>setNav(item.id)}>
                <span style={{ fontSize:15, flexShrink:0, opacity: nav===item.id?1:0.6 }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.id==='scheduler' && <span style={{ marginLeft:'auto', fontSize:9, padding:'2px 6px', borderRadius:99, background:B.goldLight, color:B.gold, letterSpacing:'.5px', textTransform:'uppercase' }}>New</span>}
              </div>
            ))}
            <div style={{ flex:1 }} />
            <div style={{ margin:'12px', padding:'12px 14px', background:'rgba(164,162,96,0.08)', borderRadius:6, border:'0.5px solid rgba(164,162,96,0.15)' }}>
              <div style={{ fontSize:9, letterSpacing:'2px', color:'rgba(255,255,255,0.25)', textTransform:'uppercase', marginBottom:4 }}>Platform</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>Dhirumbaa FMS v2</div>
              <div style={{ fontSize:10, color:B.gold, marginTop:2 }}>Multi-resort · Maldives</div>
            </div>
          </div>
        )}

        {/* Content area */}
        <div style={{ flex:1, overflow:'auto', padding:isMobile?'14px 12px 80px':'24px', display:'flex', flexDirection:'column' }}>
          <div style={{ flex:1 }}>
            {nav==='dashboard' && <Dashboard user={user} isMobile={isMobile} />}
            {nav==='flights'   && <FlightTrackerView isMobile={isMobile} />}
            {nav==='scheduler' && <SchedulerView isMobile={isMobile} />}
            {nav==='roster'    && <RosterView user={user} isMobile={isMobile} />}
            {nav==='vessels'   && <VesselsView isMobile={isMobile} />}
            {nav==='team'      && <TeamView isMobile={isMobile} />}
            {nav==='fuel-log'  && <FuelLogView isMobile={isMobile} />}
            {nav==='settings'  && <SettingsView isMobile={isMobile} />}
          </div>

          {!isMobile && (
            <div style={{ marginTop:28, paddingTop:16, borderTop:`0.5px solid ${B.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:13, color:B.gold }}>⚓</span>
                <span style={{ fontSize:12, fontWeight:500, color:B.textSecond, letterSpacing:'.3px' }}>Dhirumbaa FMS</span>
                <span style={{ fontSize:11, color:B.textMuted }}>v2.0 · Multi-Resort Fleet Management</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <span style={{ fontSize:11, color:B.textMuted }}>🏝 {RESORT.name}</span>
                <span style={{ fontSize:11, color:B.textMuted }}>{new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</span>
                <span style={{ fontSize:11, padding:'2px 10px', borderRadius:99, background:B.successLight, color:B.success, fontWeight:500 }}>● Live</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:B.midnight, borderTop:`1px solid rgba(255,255,255,0.08)`, display:'flex', zIndex:100, paddingBottom:'env(safe-area-inset-bottom)' }}>
          {NAV.map(item => (
            <button key={item.id} onClick={()=>setNav(item.id)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8px 4px', border:'none', background:'transparent', cursor:'pointer', gap:3, borderTop: nav===item.id?`2px solid ${B.gold}`:'2px solid transparent' }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <span style={{ fontSize:9, color: nav===item.id?B.gold:'rgba(255,255,255,0.35)', letterSpacing:'.3px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:52 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
