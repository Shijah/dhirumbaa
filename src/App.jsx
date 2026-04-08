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
// ─── Smart Scheduler v3 ─────────────────────────────────────────────────────

const SCHED_GROUPS = [
  {
    id: 'transfers',
    label: 'Transfers',
    cats: [
      { id:'arrivals',   icon:'🛬', label:'Arrivals',   color:'#1A4530' },
      { id:'departures', icon:'✈️', label:'Departures', color:'#374151' },
    ]
  },
  {
    id: 'activities',
    label: 'Activities',
    cats: [
      { id:'excursions', icon:'🤿', label:'Excursions / Water Sports', color:'#0369A1' },
      { id:'diving',     icon:'🐠', label:'Diving',                    color:'#0891B2' },
      { id:'snorkeling', icon:'🐢', label:'Snorkeling',                color:'#059669' },
      { id:'fnb',        icon:'🍽️', label:'Destination Dining',        color:'#B45309' },
    ]
  },
]

const VESSELS_LIST = ['Ixora', 'Tara', 'Serenity', 'Xari']
const VESSEL_COL   = { Ixora:'#1A4530', Tara:'#0369A1', Serenity:'#7C3AED', Xari:'#B45309' }

const autoVessel = (pax, vip) => {
  if (vip && vip.toLowerCase() !== 'no' && vip !== '') return 'Serenity'
  return pax <= 6 ? 'Tara' : 'Ixora'
}

const calcBoatDispatch = (eta) => {
  if (!eta || !eta.includes(':')) return '—'
  const [h, m] = eta.split(':').map(Number)
  const tot = h * 60 + m - 57
  if (tot < 0) return '—'
  return `${String(Math.floor(tot / 60)).padStart(2,'0')}:${String(tot % 60).padStart(2,'0')}`
}

// ─── Parse any file format ────────────────────────────────────────────────────
const parseFile = async (file, catId, date) => {
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs')

  const fmt = (v) => {
    if (!v && v !== 0) return ''
    if (v instanceof Date) return v.toTimeString().slice(0, 5)
    return String(v).trim()
  }

  // ── PDF parsing via PDF.js ────────────────────────────────────────────────
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    try {
      const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')
      pdfjsLib.default ? (pdfjsLib.default.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js') : null
      const pdfjs = window.pdfjsLib || pdfjsLib.default || pdfjsLib

      // Load via URL instead
      const arrayBuf = await file.arrayBuffer()
      const uint8    = new Uint8Array(arrayBuf)

      // Use PDF.js via CDN script tag approach
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
          s.onload = resolve
          s.onerror = reject
          document.head.appendChild(s)
        })
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      }

      const loadingTask = window.pdfjsLib.getDocument({ data: uint8 })
      const pdf = await loadingTask.promise
      let allText = ''
      for (let p = 1; p <= pdf.numPages; p++) {
        const page  = await pdf.getPage(p)
        const tc    = await page.getTextContent()
        const lines = {}
        tc.items.forEach(item => {
          const y = Math.round(item.transform[5])
          if (!lines[y]) lines[y] = []
          lines[y].push({ x: Math.round(item.transform[4]), text: item.str })
        })
        Object.keys(lines).sort((a,b) => b-a).forEach(y => {
          const sorted = lines[y].sort((a,b) => a.x - b.x)
          allText += sorted.map(i => i.text).join('	') + '
'
        })
      }

      // Parse text as TSV/table
      const lines  = allText.split('
').filter(l => l.trim())
      if (lines.length < 2) return { rows: [], note: 'Could not extract table data from PDF. Try saving as Excel.' }

      // Find header row (contains keywords like GUEST, ROOM, FLIGHT, PAX)
      const keywords = ['GUEST','ROOM','FLIGHT','PAX','NAME','VILLA','TIME']
      let headerIdx  = lines.findIndex(l => keywords.some(k => l.toUpperCase().includes(k)))
      if (headerIdx === -1) headerIdx = 0

      const headers = lines[headerIdx].split('	').map(h => h.trim().toUpperCase())
      const dataRows = lines.slice(headerIdx + 1)

      const fmt = (v) => v ? String(v).trim() : ''

      const getCol = (cols, ...names) => {
        for (const name of names) {
          const idx = headers.findIndex(h => h.includes(name.toUpperCase()))
          if (idx !== -1 && cols[idx]) return fmt(cols[idx])
        }
        return ''
      }

      const rows = dataRows
        .map(line => {
          const cols = line.split('	')
          if (cols.length < 2) return null
          const guest = getCol(cols,'GUEST','NAME')
          const room  = getCol(cols,'ROOM','VILLA')
          const flt   = getCol(cols,'FLIGHT','FLT').toUpperCase()
          if (!guest && !room && !flt) return null
          const paxRaw = getCol(cols,'PAX','GUESTS','NO')
          return {
            resort_id:      BAROS_RESORT_ID,
            schedule_date:  date,
            type:           catId,
            flight_time:    getCol(cols,'TIME','SCHED','ARR','ETA'),
            flight_number:  flt,
            transfer_time:  getCol(cols,'TRANSFER'),
            checkout_time:  getCol(cols,'CHECKOUT'),
            room,
            guest_name:     guest,
            pax:            parseInt(paxRaw) || 1,
            meal_plan:      getCol(cols,'MEAL','MP','BOARD'),
            operator:       getCol(cols,'OPERATOR','TRANSFER','OPER'),
            spc:            false,
            vip:            getCol(cols,'VIP'),
            room_type:      getCol(cols,'TYPE','ROOM TYPE'),
            nights:         parseInt(getCol(cols,'NIGHT','NIGHTS')) || null,
            butler:         getCol(cols,'BUTLER'),
            confirmation:   getCol(cols,'CONF','CONFIRM'),
            comments:       getCol(cols,'COMMENT','NOTE','REMARK'),
            assigned_vessel: autoVessel(parseInt(paxRaw)||1, getCol(cols,'VIP')),
          }
        })
        .filter(Boolean)

      return { rows, note: rows.length === 0 ? 'No rows found in PDF. Check column headers match expected format.' : null }
    } catch(e) {
      return { rows: [], note: 'PDF error: ' + e.message + '. Try saving as Excel (.xlsx) for best results.' }
    }
  }

  // ── Image: not parseable ──────────────────────────────────────────────────
  if (file.type.startsWith('image/')) {
    return { rows: [], note: 'Image files cannot be parsed automatically. Please use Excel, ODS, or CSV.' }
  }

  // ── Excel / ODS / CSV ─────────────────────────────────────────────────────
  let wb
  {
    const buf = await file.arrayBuffer()
    wb = XLSX.read(buf, { type: 'array', cellDates: true })
  }

  // Find best matching sheet
  const cats = ['arrival','departure','excursion','diving','snorkel','fnb','dining','activity']
  const sheetName = wb.SheetNames.find(s =>
    cats.some(c => s.toLowerCase().includes(c)) ||
    s.toLowerCase().includes(catId.toLowerCase().slice(0,4))
  ) || wb.SheetNames[0]

  const ws  = wb.Sheets[sheetName]
  const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })

  const rows = raw.map(r => ({
    resort_id:      BAROS_RESORT_ID,
    schedule_date:  date,
    type:           catId,
    flight_time:    fmt(r['FLIGHT TIME']   || r['TIME']          || r['TRANSFER TIME'] || r['DEPARTURE TIME'] || ''),
    flight_number:  fmt(r['FLIGHT NUMBER'] || r['FLIGHT']        || r['FLIGHT NO']     || '').toUpperCase(),
    transfer_time:  fmt(r['TRANSFER TIME'] || ''),
    checkout_time:  fmt(r['CHECKOUT TIME'] || ''),
    room:           fmt(r['ROOM']          || r['VILLA']         || ''),
    guest_name:     fmt(r['GUEST NAME']    || r['NAME']          || r['GUEST']         || ''),
    pax:            parseInt(r['PAX']      || r['GUESTS']        || r['NO OF GUESTS']  || 1) || 1,
    meal_plan:      fmt(r['MP']            || r['MEAL PLAN']     || r['MEAL']          || ''),
    operator:       fmt(r['OPERATOR']      || r['OPERTOR']       || r['TRANSFER']      || ''),
    spc:            ['yes','1','true'].includes(String(r['SPC'] || '').toLowerCase()),
    vip:            fmt(r['VIP'] || ''),
    room_type:      fmt(r['ROOM TYPE']     || r['ROOM TTPE']     || ''),
    nights:         parseInt(r['NIGHTS']   || r['NGHTS']         || 0) || null,
    departure_date: fmt(r['DEPARTURE']     || r['CHECKOUT']      || ''),
    member:         ['yes','1','true'].includes(String(r['MEM'] || r['MEMBER'] || '').toLowerCase()),
    butler:         fmt(r['BUTLER'] || ''),
    confirmation:   fmt(r['CONFIRMATION']  || r['CONF']          || ''),
    comments:       fmt(r['COMMENTS']      || r['NOTES']         || r['REMARKS']       || ''),
    assigned_vessel: autoVessel(
      parseInt(r['PAX'] || 1) || 1,
      fmt(r['VIP'] || '')
    ),
  })).filter(r => r.guest_name || r.room || r.flight_number)

  return { rows, note: null }
}

// ─── Single upload card ───────────────────────────────────────────────────────
function UploadCard({ cat, date, data, fr24Map, fr24Loading, onUpload, onRefreshFR24 }) {
  const fileRef    = useRef()
  const [busy, setBusy]       = useState(false)
  const [msg,  setMsg]        = useState('')
  const [open, setOpen]       = useState(false)
  const [vessels, setVessels] = useState({})

  const hasData  = data && data.length > 0
  const totalPax = data ? data.reduce((s,r) => s + (r.pax||0), 0) : 0

  const handleFile = async (file) => {
    if (!file) return
    setBusy(true)
    setMsg('Reading file…')
    try {
      const { rows, note } = await parseFile(file, cat.id, date)
      if (note) { setMsg(note); setBusy(false); return }
      setMsg(`Saving ${rows.length} rows…`)
      await sb.from('boat_schedule').delete()
        .eq('resort_id', BAROS_RESORT_ID)
        .eq('schedule_date', date)
        .eq('type', cat.id)
      if (rows.length > 0) await sb.from('boat_schedule').insert(rows)
      onUpload(cat.id, rows)
      if (cat.id === 'arrivals') {
        const fns = [...new Set(rows.map(r => r.flight_number).filter(Boolean))]
        if (fns.length) onRefreshFR24(fns)
      }
      setMsg(`✓ ${rows.length} records loaded`)
      setOpen(true)
    } catch(e) {
      setMsg('Error: ' + e.message)
    }
    setBusy(false)
  }

  return (
    <div style={{ background:B.white, border:`0.5px solid ${B.border}`, borderRadius:10, overflow:'hidden' }}>
      {/* Card header */}
      <div
        onClick={() => hasData && setOpen(o => !o)}
        style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:hasData?'pointer':'default', background:hasData?B.pearl:B.white }}
      >
        <div style={{ width:40, height:40, borderRadius:9, background:cat.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
          {cat.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:13, color:B.textPrimary }}>{cat.label}</div>
          {hasData
            ? <div style={{ fontSize:11, color:cat.color, fontWeight:500, marginTop:1 }}>{data.length} trips · {totalPax} pax · {[...new Set(data.map(r=>r.assigned_vessel).filter(Boolean))].join(', ')}</div>
            : <div style={{ fontSize:11, color:B.textMuted, marginTop:1 }}>No data — upload a file to load</div>
          }
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }} onClick={e=>e.stopPropagation()}>
          {cat.id === 'arrivals' && hasData && (
            <button onClick={()=>{const f=[...new Set(data.map(r=>r.flight_number).filter(Boolean))];if(f.length)onRefreshFR24(f)}} disabled={fr24Loading}
              style={{ padding:'5px 10px', borderRadius:6, border:`0.5px solid ${B.border}`, background:'transparent', color:B.textSecond, fontSize:11, cursor:'pointer', whiteSpace:'nowrap' }}>
              {fr24Loading?'↻':'✈ FR24'}
            </button>
          )}
          <input ref={fileRef} type="file" accept=".ods,.xlsx,.xls,.csv,.pdf,image/*" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])} />
          <button onClick={()=>fileRef.current.click()} disabled={busy}
            style={{ padding:'6px 14px', borderRadius:6, border:`1.5px solid ${cat.color}`, background:hasData?'transparent':cat.color, color:hasData?cat.color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
            {busy ? '⏳' : hasData ? '↻ Update' : '⬆ Upload'}
          </button>
        </div>
        {hasData && <span style={{ color:B.textMuted, fontSize:11 }}>{open?'▲':'▼'}</span>}
      </div>

      {/* Upload message */}
      {msg && (
        <div style={{ padding:'6px 16px', fontSize:11, borderTop:`0.5px solid ${B.border}`,
          color: msg.startsWith('✓')?'#059669': msg.startsWith('Error')?'#DC2626':B.textSecond,
          background: msg.startsWith('✓')?'#F0FDF4': msg.startsWith('Error')?'#FEF2F2':B.pearl }}>
          {msg}
        </div>
      )}

      {/* Supported formats note */}
      {!hasData && (
        <div style={{ padding:'8px 16px', fontSize:10, color:B.textMuted, borderTop:`0.5px solid ${B.border}`, display:'flex', gap:8 }}>
          {['Excel (.xlsx)', 'ODS', 'CSV', 'PDF (text)', 'Image'].map(f => (
            <span key={f} style={{ background:B.pearl, borderRadius:4, padding:'2px 7px' }}>{f}</span>
          ))}
        </div>
      )}

      {/* Data table */}
      {open && hasData && <SchedTable rows={data} catId={cat.id} fr24Map={fr24Map} vessels={vessels} setVessels={setVessels} />}
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────
function SchedTable({ rows, catId, fr24Map, vessels, setVessels }) {
  const isArr = catId === 'arrivals'
  const isDep = catId === 'departures'

  const TH = { padding:'8px 10px', textAlign:'left', fontSize:10, color:'rgba(255,255,255,0.75)', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', whiteSpace:'nowrap' }
  const TD = { padding:'8px 10px', verticalAlign:'middle', borderBottom:`0.5px solid ${B.border}` }

  const hdr = isArr
    ? ['', 'Flight', 'Sched', 'Status', 'FR24 ETA', '⚓ Boat Out', 'Vessel', 'Room', 'Guest', 'PAX', 'Operator', 'Meal', 'Butler', 'Notes']
    : isDep
    ? ['Transfer', 'Checkout', '', 'Flight', 'Flt Time', 'Vessel', 'Room', 'Guest', 'PAX', 'Operator', 'Meal', 'Butler', 'Notes']
    : ['Time', 'Vessel', 'Room', 'Guest', 'PAX', 'Notes']

  return (
    <div style={{ overflowX:'auto', borderTop:`0.5px solid ${B.border}` }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth: isArr?1050:isDep?900:600 }}>
        <thead>
          <tr style={{ background:B.freshPalm }}>
            {hdr.map((h,i) => <th key={i} style={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const fr       = fr24Map[r.flight_number] || {}
            const eta      = fr.eta || r.fr24_eta || r.flight_time || '—'
            const boat     = fr.boat_dispatch || calcBoatDispatch(eta)
            const status   = fr.status || (r.flight_number ? 'Scheduled' : '—')
            const sColor   = status==='Landed'?'#059669':status==='Airborne'?'#2563EB':'#9CA3AF'
            const sBg      = status==='Landed'?'#ECFDF5':status==='Airborne'?'#EFF6FF':'#F9FAFB'
            const isVip    = r.vip && r.vip.toLowerCase()!=='no' && r.vip!==''
            const rowBg    = isVip?'#FFFBEB':r.spc?'#EFF6FF':i%2===0?B.white:B.pearl
            const code     = r.flight_number?.replace(/[0-9]/g,'').trim()
            const info     = AIRLINE_INFO?.[code] || {}
            const vessel   = vessels[i] || r.assigned_vessel || 'Ixora'

            const VesselPicker = () => (
              <select value={vessel} onChange={e=>setVessels(v=>({...v,[i]:e.target.value}))}
                style={{ fontSize:11, padding:'3px 6px', borderRadius:5, border:`1.5px solid ${VESSEL_COL[vessel]||B.border}`, color:VESSEL_COL[vessel]||B.textPrimary, fontWeight:600, background:'#fff', cursor:'pointer', outline:'none' }}>
                {VESSELS_LIST.map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            )

            const Logo = () => info.logo
              ? <img src={info.logo} alt={code} style={{ width:28,height:28,objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
              : <div style={{ width:28,height:28,background:info.color||B.freshPalm,borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:9,fontWeight:700 }}>{code}</div>

            const GuestCell = () => (
              <td style={{...TD,maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                <div style={{ fontWeight:500 }}>{r.guest_name||'—'}</div>
                {isVip && <div style={{ fontSize:9,color:B.gold,fontWeight:700 }}>⭐ {r.vip}</div>}
                {r.spc  && <div style={{ fontSize:9,color:'#2563EB',fontWeight:700 }}>★ Special</div>}
              </td>
            )

            if (isArr) return (
              <tr key={i} style={{ background:rowBg }}>
                <td style={TD}><Logo/></td>
                <td style={{...TD,fontFamily:'monospace',fontWeight:700,fontSize:13}}>{r.flight_number||'—'}</td>
                <td style={{...TD,fontFamily:'monospace',color:'#9CA3AF'}}>{r.flight_time||'—'}</td>
                <td style={TD}><span style={{ background:sBg,color:sColor,borderRadius:99,padding:'2px 9px',fontSize:10,fontWeight:600,whiteSpace:'nowrap' }}>{status}</span></td>
                <td style={{...TD,fontFamily:'monospace',fontWeight:700,color:'#2563EB',fontSize:14}}>{eta}</td>
                <td style={{...TD,fontFamily:'monospace',fontWeight:700,color:B.gold,fontSize:14}}>{boat}</td>
                <td style={TD}><VesselPicker/></td>
                <td style={{...TD,fontWeight:600}}>{r.room||'—'}</td>
                <GuestCell/>
                <td style={{...TD,textAlign:'center',fontWeight:700}}>{r.pax}</td>
                <td style={{...TD,fontSize:11,color:B.textSecond}}>{r.operator||'—'}</td>
                <td style={{...TD,fontSize:11}}>{r.meal_plan||'—'}</td>
                <td style={{...TD,fontSize:11}}>{r.butler||'—'}</td>
                <td style={{...TD,fontSize:11,color:B.textMuted,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.comments||'—'}</td>
              </tr>
            )

            if (isDep) return (
              <tr key={i} style={{ background:rowBg }}>
                <td style={{...TD,fontFamily:'monospace',fontWeight:700,color:B.gold,fontSize:14}}>{r.transfer_time||r.flight_time||'—'}</td>
                <td style={{...TD,fontFamily:'monospace',color:'#9CA3AF'}}>{r.checkout_time||'—'}</td>
                <td style={TD}><Logo/></td>
                <td style={{...TD,fontFamily:'monospace',fontWeight:700,fontSize:13}}>{r.flight_number||'—'}</td>
                <td style={{...TD,fontFamily:'monospace',color:'#9CA3AF'}}>{r.flight_time||'—'}</td>
                <td style={TD}><VesselPicker/></td>
                <td style={{...TD,fontWeight:600}}>{r.room||'—'}</td>
                <GuestCell/>
                <td style={{...TD,textAlign:'center',fontWeight:700}}>{r.pax}</td>
                <td style={{...TD,fontSize:11,color:B.textSecond}}>{r.operator||'—'}</td>
                <td style={{...TD,fontSize:11}}>{r.meal_plan||'—'}</td>
                <td style={{...TD,fontSize:11}}>{r.butler||'—'}</td>
                <td style={{...TD,fontSize:11,color:B.textMuted,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.comments||'—'}</td>
              </tr>
            )

            return (
              <tr key={i} style={{ background:rowBg }}>
                <td style={{...TD,fontFamily:'monospace',fontWeight:700,color:B.freshPalm}}>{r.flight_time||r.transfer_time||'—'}</td>
                <td style={TD}><VesselPicker/></td>
                <td style={{...TD,fontWeight:600}}>{r.room||'—'}</td>
                <GuestCell/>
                <td style={{...TD,textAlign:'center',fontWeight:700}}>{r.pax}</td>
                <td style={{...TD,fontSize:11,color:B.textSecond}}>{r.operator||'—'}</td>
                <td style={{...TD,fontSize:11,color:B.textMuted,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.comments||'—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Scheduler View ───────────────────────────────────────────────────────
function SchedulerView({ isMobile }) {
  const today    = new Date().toLocaleDateString('en-CA', { timeZone:'Indian/Maldives' })
  const tomorrow = new Date(Date.now()+86400000).toLocaleDateString('en-CA', { timeZone:'Indian/Maldives' })

  const [dayTab,      setDayTab]      = useState('today')
  const [schedData,   setSchedData]   = useState({})
  const [fr24Map,     setFr24Map]     = useState({})
  const [fr24Loading, setFr24Loading] = useState(false)
  const [lastSync,    setLastSync]    = useState(null)
  const [clock,       setClock]       = useState(new Date())

  const viewDate = dayTab === 'today' ? today : tomorrow

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Load from Supabase
  useEffect(() => {
    const load = async (date, label) => {
      try {
        const { data } = await sb.from('boat_schedule').select('*')
          .eq('resort_id', BAROS_RESORT_ID)
          .eq('schedule_date', date)
          .order('flight_time', { ascending: true })
        if (data?.length) {
          const map = {}
          SCHED_GROUPS.forEach(g => g.cats.forEach(cat => {
            const rows = data.filter(r => r.type === cat.id)
            if (rows.length) map[`${label}-${cat.id}`] = rows
          }))
          setSchedData(prev => ({ ...prev, ...map }))
          const fns = [...new Set(data.filter(r=>r.type==='arrivals').map(r=>r.flight_number).filter(Boolean))]
          if (fns.length) fetchFR24(fns)
        }
      } catch(e) {}
    }
    load(today, 'today')
    load(tomorrow, 'tomorrow')
  }, [])

  const fetchFR24 = async (flightNos) => {
    setFr24Loading(true)
    try {
      const callsigns = flightNos.map(f => {
        const u = f.toUpperCase()
        for (const [iata, icao] of Object.entries(IATA_TO_ICAO)) {
          if (u.startsWith(iata)) return icao + u.slice(iata.length)
        }
        return u
      }).join(',')
      const res  = await fetch(`/.netlify/functions/fr24?flights=${callsigns}&mode=live`)
      const json = await res.json()
      if (json.data?.length) {
        const map = {}
        json.data.forEach(d => {
          flightNos.forEach(f => {
            const u = f.toUpperCase()
            const cs = (() => {
              for (const [iata,icao] of Object.entries(IATA_TO_ICAO)) {
                if (u.startsWith(iata)) return icao + u.slice(iata.length)
              }
              return u
            })()
            if (cs === d.callsign) {
              const now = Date.now()/1000
              const R=6371,dLat=(4.1755-d.lat)*Math.PI/180,dLon=(73.5293-d.lon)*Math.PI/180
              const a=Math.sin(dLat/2)**2+Math.cos(d.lat*Math.PI/180)*Math.cos(4.1755*Math.PI/180)*Math.sin(dLon/2)**2
              const km=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
              const secs = d.gspeed>0 ? (km/(d.gspeed*1.852))*3600*1.05 : null
              const etaTs  = secs ? now+secs : null
              const boatTs = etaTs ? etaTs-57*60 : null
              const fmtT   = ts => ts ? new Date(ts*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Indian/Maldives'}) : null
              map[f] = { status: d.alt<100?'Landed':'Airborne', eta:fmtT(etaTs), boat_dispatch:fmtT(boatTs) }
            }
          })
        })
        setFr24Map(prev => ({ ...prev, ...map }))
        setLastSync(new Date())
      }
    } catch(e) {}
    setFr24Loading(false)
  }

  const handleUpload = (catId, rows) => {
    setSchedData(prev => ({ ...prev, [`${dayTab}-${catId}`]: rows }))
  }

  const getData = (catId) => schedData[`${dayTab}-${catId}`] || []

  const allRows = SCHED_GROUPS.flatMap(g => g.cats.flatMap(c => getData(c.id)))
  const totalPax  = allRows.reduce((s,r) => s+(r.pax||0), 0)
  const totalArr  = getData('arrivals').length
  const totalDep  = getData('departures').length
  const vipCount  = allRows.filter(r => r.vip && r.vip.toLowerCase()!=='no' && r.vip!=='').length
  const airborne  = Object.values(fr24Map).filter(f => f.status==='Airborne').length

  const todayLabel    = new Date(today+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'})
  const tomorrowLabel = new Date(tomorrow+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'})

  return (
    <div>
      {/* Header */}
      <div style={{ background:B.freshPalm, borderRadius:10, padding:isMobile?'14px':'18px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:'2px', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:4 }}>Baros Maldives · Operations</div>
            <div style={{ fontSize:isMobile?16:22, fontWeight:600, color:'#fff' }}>Smart Scheduler</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Boat Transfer & Activity Planning</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:isMobile?22:30, fontWeight:300, color:B.gold, fontFamily:'monospace', letterSpacing:2 }}>
              {clock.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Indian/Maldives'})}
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2 }}>
              {lastSync ? `FR24 synced ${lastSync.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} MVT` : 'Maldives Time (MVT)'}
            </div>
          </div>
        </div>

        {/* Day selector */}
        <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap', alignItems:'center' }}>
          {[
            { id:'today',    label:'Today',    sub:todayLabel },
            { id:'tomorrow', label:'Tomorrow', sub:tomorrowLabel },
          ].map(d => (
            <button key={d.id} onClick={() => setDayTab(d.id)}
              style={{ padding:'8px 22px', borderRadius:7, cursor:'pointer', textAlign:'left',
                border:`1.5px solid ${dayTab===d.id?'#fff':'rgba(255,255,255,0.2)'}`,
                background: dayTab===d.id?'rgba(255,255,255,0.15)':'transparent', color:'#fff',
                fontWeight: dayTab===d.id?600:400, fontSize:13 }}>
              <div>{d.label}</div>
              <div style={{ fontSize:10, opacity:.55, marginTop:1 }}>{d.sub}</div>
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
            {fr24Loading && <span style={{ fontSize:11, color:'#34D399' }}>↻ Syncing FR24…</span>}
            {airborne > 0 && <span style={{ fontSize:11, background:'rgba(52,211,153,0.15)', color:'#34D399', borderRadius:99, padding:'4px 10px', border:'0.5px solid rgba(52,211,153,0.3)' }}>● {airborne} airborne</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        {[
          { label:'Arrivals',   val:totalArr,  color:B.freshPalm },
          { label:'Departures', val:totalDep,  color:'#374151'   },
          { label:'Total PAX',  val:totalPax,  color:'#0369A1'   },
          { label:'VIP',        val:vipCount,  color:B.gold      },
          { label:'Airborne',   val:airborne,  color:'#2563EB'   },
        ].map(s => (
          <div key={s.label} style={{ background:B.white, border:`0.5px solid ${B.border}`, borderRadius:8, padding:'8px 16px', display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ fontSize:22, fontWeight:700, color:s.color, fontFamily:'monospace' }}>{s.val}</div>
            <div style={{ fontSize:10, color:B.textMuted, textTransform:'uppercase', letterSpacing:'.8px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Groups */}
      {SCHED_GROUPS.map(group => (
        <div key={group.id} style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:600, color:B.textMuted, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10, paddingLeft:2 }}>
            {group.label}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {group.cats.map(cat => (
              <UploadCard
                key={cat.id}
                cat={cat}
                date={viewDate}
                data={getData(cat.id)}
                fr24Map={fr24Map}
                fr24Loading={fr24Loading}
                onUpload={(_catId, rows) => handleUpload(cat.id, rows)}
                onRefreshFR24={fetchFR24}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
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
  // Domestic & seaplane
  Q2:'DQA',  NR:'MLD',  TM:'TMW',  VL:'VLL',
  // International
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
  EK: { name:'Emirates',             logo:'https://www.gstatic.com/flights/airline_logos/70px/EK.png', color:'#C60C30' },
  QR: { name:'Qatar Airways',        logo:'https://www.gstatic.com/flights/airline_logos/70px/QR.png', color:'#5C0632' },
  BA: { name:'British Airways',      logo:'https://www.gstatic.com/flights/airline_logos/70px/BA.png', color:'#075AAA' },
  SQ: { name:'Singapore Airlines',   logo:'https://www.gstatic.com/flights/airline_logos/70px/SQ.png', color:'#192F5D' },
  EY: { name:'Etihad Airways',       logo:'https://www.gstatic.com/flights/airline_logos/70px/EY.png', color:'#BD8B13' },
  TK: { name:'Turkish Airlines',     logo:'https://www.gstatic.com/flights/airline_logos/70px/TK.png', color:'#C8102E' },
  MH: { name:'Malaysia Airlines',    logo:'https://www.gstatic.com/flights/airline_logos/70px/MH.png', color:'#003087' },
  OD: { name:'Batik Air Malaysia',   logo:'https://www.gstatic.com/flights/airline_logos/70px/OD.png', color:'#8B0000' },
  UL: { name:'SriLankan Airlines',   logo:'https://www.gstatic.com/flights/airline_logos/70px/UL.png', color:'#5B2D8E' },
  GF: { name:'Gulf Air',             logo:'https://www.gstatic.com/flights/airline_logos/70px/GF.png', color:'#C8102E' },
  WY: { name:'Oman Air',             logo:'https://www.gstatic.com/flights/airline_logos/70px/WY.png', color:'#C8102E' },
  FZ: { name:'flydubai',             logo:'https://www.gstatic.com/flights/airline_logos/70px/FZ.png', color:'#E8413A' },
  AI: { name:'Air India',            logo:'https://www.gstatic.com/flights/airline_logos/70px/AI.png', color:'#E03C31' },
  '6E':{ name:'IndiGo',              logo:'https://www.gstatic.com/flights/airline_logos/70px/6E.png', color:'#1B4FA0' },
  MU: { name:'China Eastern',        logo:'https://www.gstatic.com/flights/airline_logos/70px/MU.png', color:'#E4002B' },
  MF: { name:'Xiamen Airlines',      logo:'https://www.gstatic.com/flights/airline_logos/70px/MF.png', color:'#0055A5' },
  AK: { name:'AirAsia',              logo:'https://www.gstatic.com/flights/airline_logos/70px/AK.png', color:'#FF0000' },
  BS: { name:'US-Bangla Airlines',   logo:'https://www.gstatic.com/flights/airline_logos/70px/BS.png', color:'#E31837' },
  KL: { name:'KLM',                  logo:'https://www.gstatic.com/flights/airline_logos/70px/KL.png', color:'#009FE3' },
  LH: { name:'Lufthansa',            logo:'https://www.gstatic.com/flights/airline_logos/70px/LH.png', color:'#05164D' },
  AF: { name:'Air France',           logo:'https://www.gstatic.com/flights/airline_logos/70px/AF.png', color:'#002157' },
  LX: { name:'Swiss',                logo:'https://www.gstatic.com/flights/airline_logos/70px/LX.png', color:'#E4002B' },
  DE: { name:'Condor',               logo:'https://www.gstatic.com/flights/airline_logos/70px/DE.png', color:'#FF6600' },
  WK: { name:'Edelweiss Air',        logo:'https://www.gstatic.com/flights/airline_logos/70px/WK.png', color:'#1A5276' },
  G9: { name:'Air Arabia',           logo:'https://www.gstatic.com/flights/airline_logos/70px/G9.png', color:'#E31837' },
  NO: { name:'Neos',                 logo:'https://www.gstatic.com/flights/airline_logos/70px/NO.png', color:'#FF6600' },
  LO: { name:'LOT Polish Airlines',  logo:'https://www.gstatic.com/flights/airline_logos/70px/LO.png', color:'#005CA9' },
  NR: { name:'Manta Air',            logo:'https://www.gstatic.com/flights/airline_logos/70px/NR.png', color:'#0077C8' },
  Q2: { name:'Maldivian',            logo:'https://www.gstatic.com/flights/airline_logos/70px/Q2.png', color:'#006341' },
}

const AIRPORT_NAMES = {
  DXB:'Dubai', DOH:'Doha', AUH:'Abu Dhabi', MCT:'Muscat', BAH:'Bahrain',
  SHJ:'Sharjah', SIN:'Singapore', KUL:'Kuala Lumpur', CMB:'Colombo',
  IST:'Istanbul', PVG:'Shanghai', XMN:'Xiamen', LGW:'London Gatwick',
  LHR:'London Heathrow', FRA:'Frankfurt', ZRH:'Zurich', WAW:'Warsaw',
  MXP:'Milan', FCO:'Rome', CDG:'Paris', BOM:'Mumbai', DEL:'Delhi',
  TRV:'Thiruvananthapuram', COK:'Kochi', MAA:'Chennai', BLR:'Bengaluru',
  HYD:'Hyderabad', CCU:'Kolkata', DAC:'Dhaka', MLE:'Malé VIA',
}

const SCHEDULE = [
  { flight:'FZ1025', airline:'flydubai',           orig:'DXB', arr:'01:10', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'WY383',  airline:'Oman Air',            orig:'MCT', arr:'03:30', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'WY384',  airline:'Oman Air',            orig:'MCT', arr:'03:30', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'GF144',  airline:'Gulf Air',            orig:'BAH', arr:'06:35', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'EK656',  airline:'Emirates',            orig:'DXB', arr:'07:35', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'QR672',  airline:'Qatar Airways',       orig:'DOH', arr:'07:50', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'WK066',  airline:'Edelweiss Air',       orig:'ZRH', arr:'07:50', days:['Sun','Tue','Thu','Sat'] },
  { flight:'WK067',  airline:'Edelweiss Air',       orig:'ZRH', arr:'07:50', days:['Sun','Tue','Thu','Sat'] },
  { flight:'G9093',  airline:'Air Arabia',          orig:'SHJ', arr:'08:10', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'G9094',  airline:'Air Arabia',          orig:'SHJ', arr:'08:10', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'EY260',  airline:'Etihad Airways',      orig:'AUH', arr:'09:00', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'BA060',  airline:'British Airways',     orig:'LGW', arr:'09:40', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'BA061',  airline:'British Airways',     orig:'LGW', arr:'09:40', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'AK74',   airline:'AirAsia',             orig:'KUL', arr:'09:55', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'DE2320', airline:'Condor',              orig:'FRA', arr:'10:00', days:['Sun','Tue','Thu','Sat'] },
  { flight:'DE2321', airline:'Condor',              orig:'FRA', arr:'10:00', days:['Sun','Tue','Thu','Sat'] },
  { flight:'NO510',  airline:'Neos',                orig:'MXP', arr:'09:15', days:['Sun','Tue','Thu','Sat'] },
  { flight:'NO511',  airline:'Neos',                orig:'FCO', arr:'09:15', days:['Sun','Tue','Thu','Sat'] },
  { flight:'MH485',  airline:'Malaysia Airlines',   orig:'KUL', arr:'11:00', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'SQ432',  airline:'Singapore Airlines',  orig:'SIN', arr:'11:40', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'MF889',  airline:'Xiamen Airlines',     orig:'XMN', arr:'12:10', days:['Mon','Wed','Fri'] },
  { flight:'TK734',  airline:'Turkish Airlines',    orig:'IST', arr:'12:35', days:['Sun','Tue','Thu','Sat'] },
  { flight:'MU235',  airline:'China Eastern',       orig:'PVG', arr:'17:50', days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'OD293',  airline:'Batik Air Malaysia',  orig:'KUL', arr:null,    days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'OD295',  airline:'Batik Air Malaysia',  orig:'KUL', arr:null,    days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'UL101',  airline:'SriLankan Airlines',  orig:'CMB', arr:null,    days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'UL103',  airline:'SriLankan Airlines',  orig:'CMB', arr:null,    days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  { flight:'UL115',  airline:'SriLankan Airlines',  orig:'CMB', arr:null,    days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
]

const FLIGHT_ORIGINS = {
  ...Object.fromEntries(SCHEDULE.map(s => [s.flight, s.orig])),
  // Common alternates not in schedule
  AK72:'KUL', AK76:'KUL', AK78:'KUL',
  EK658:'DXB', EK660:'DXB', EK652:'DXB',
  QR670:'DOH', QR674:'DOH',
  SQ430:'SIN', SQ434:'SIN',
  MH483:'KUL', MH487:'KUL',
  TK736:'IST', TK732:'IST',
  MU233:'PVG', MU237:'PVG',
  UL105:'CMB', UL107:'CMB',
  OD291:'KUL', OD297:'KUL',
}

const toCallsign = (flight) => {
  const f = flight.toUpperCase().trim()
  for (const [iata, icao] of Object.entries(IATA_TO_ICAO)) {
    if (f.startsWith(iata)) return icao + f.slice(iata.length)
  }
  return f
}

const getCode = (flight) => {
  const f = flight.toUpperCase()
  for (const code of Object.keys(AIRLINE_INFO)) {
    if (f.startsWith(code)) return code
  }
  return f.replace(/[0-9]/g,'').trim()
}

const fmtTime = ts => {
  if (!ts) return '—'
  return new Date(ts*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Indian/Maldives'})
}
const fmtDur = s => {
  if (s<=0) return 'Arrived'
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60)
  return h>0?`${h}h ${m}m`:`${m}m`
}

const MLE_LAT=4.1755, MLE_LON=73.5293
const distToMLE = (lat,lon) => {
  const R=6371, dLat=(MLE_LAT-lat)*Math.PI/180, dLon=(MLE_LON-lon)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat*Math.PI/180)*Math.cos(MLE_LAT*Math.PI/180)*Math.sin(dLon/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

function AirlineLogo({ code, size=36 }) {
  const info = AIRLINE_INFO[code] || {}
  const [err, setErr] = useState(false)
  if (info.logo && !err) {
    return <img src={info.logo} alt={code} style={{width:size,height:size,objectFit:'contain'}} onError={()=>setErr(true)} />
  }
  return (
    <div style={{width:size,height:size,background:info.color||B.freshPalm,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:size*0.3,fontWeight:700}}>
      {code}
    </div>
  )
}

function TodayScheduleTable({ onTrack, trackedFlights }) {
  const now = new Date()
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const today = dayNames[now.getDay()]
  const nowMins = now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Indian/Maldives'}).split(':').map(Number).reduce((a,b,i)=>i===0?a+b*60:a+b,0)

  const todayFlights = SCHEDULE
    .filter(f => f.days.includes(today))
    .sort((a,b) => (a.arr||'99:99').localeCompare(b.arr||'99:99'))

  if (!todayFlights.length) return null

  return (
    <div style={{background:B.white,border:`0.5px solid ${B.border}`,borderRadius:10,overflow:'hidden',marginBottom:16}}>
      <div style={{padding:'10px 16px',background:B.pearl,borderBottom:`0.5px solid ${B.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontWeight:600,fontSize:13,color:B.textPrimary}}>
          Today's Arrivals
          <span style={{fontWeight:400,fontSize:11,color:B.textMuted,marginLeft:8}}>
            {now.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short',timeZone:'Indian/Maldives'})}
          </span>
        </div>
        <span style={{fontSize:11,color:B.textMuted}}>{todayFlights.length} flights</span>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:500}}>
          <thead>
            <tr style={{background:B.pearl,borderBottom:`0.5px solid ${B.border}`}}>
              {['Airline','Flight','From','ETA','Status',''].map(h=>(
                <th key={h} style={{padding:'7px 12px',textAlign:'left',fontSize:10,color:B.textMuted,fontWeight:600,letterSpacing:'1px',textTransform:'uppercase'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {todayFlights.map((f,i) => {
              const code = getCode(f.flight)
              const arrMins = f.arr ? f.arr.split(':').map(Number).reduce((a,b,i)=>i===0?a+b*60:a+b,0) : null
              const isLanded   = arrMins !== null && nowMins > arrMins + 20
              const isArriving = arrMins !== null && !isLanded && nowMins > arrMins - 90
              const isTracked  = trackedFlights.includes(f.flight)
              const statusLabel = isLanded ? '✓ Landed' : isArriving ? '● Arriving' : 'Scheduled'
              const statusColor = isLanded ? '#059669' : isArriving ? '#2563EB' : B.textMuted
              const statusBg    = isLanded ? '#ECFDF5' : isArriving ? '#EFF6FF' : B.pearl
              return (
                <tr key={i} style={{borderBottom:`0.5px solid ${B.border}`,background:i%2===0?B.white:B.pearl}}>
                  <td style={{padding:'8px 12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <AirlineLogo code={code} size={28} />
                    </div>
                  </td>
                  <td style={{padding:'8px 12px'}}>
                    <div style={{fontWeight:700,color:B.textPrimary,fontFamily:'monospace',fontSize:13}}>{f.flight}</div>
                    <div style={{fontSize:10,color:B.textMuted}}>{f.airline}</div>
                  </td>
                  <td style={{padding:'8px 12px'}}>
                    <div style={{fontWeight:600,color:B.textPrimary}}>{f.orig}</div>
                    <div style={{fontSize:10,color:B.textMuted}}>{AIRPORT_NAMES[f.orig]||f.orig}</div>
                  </td>
                  <td style={{padding:'8px 12px',fontFamily:'monospace',fontWeight:700,color:B.textPrimary,fontSize:13}}>{f.arr||'—'}</td>
                  <td style={{padding:'8px 12px'}}>
                    <span style={{background:statusBg,color:statusColor,borderRadius:99,padding:'3px 10px',fontSize:10,fontWeight:600}}>{statusLabel}</span>
                  </td>
                  <td style={{padding:'8px 12px',textAlign:'right'}}>
                    {isTracked
                      ? <span style={{fontSize:10,color:B.gold,fontWeight:500}}>● Tracking</span>
                      : <button onClick={()=>onTrack(f.flight)} style={{padding:'4px 10px',borderRadius:4,border:`0.5px solid ${B.freshPalm}`,background:'transparent',color:B.freshPalm,fontSize:11,cursor:'pointer',fontWeight:500}}>+ Track</button>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FlightCard({ flight, data, isMobile, onRemove }) {
  const now = Date.now()/1000
  const code = getCode(flight)
  const info = AIRLINE_INFO[code] || { name:code, color:B.freshPalm }
  const hasData   = data && data.lat
  const isGround  = hasData && data.alt < 200
  const isAir     = hasData && !isGround
  const kmLeft    = hasData ? distToMLE(data.lat, data.lon) : null
  const speedKmh  = hasData && data.gspeed>0 ? data.gspeed*1.852 : null

  // Priority: FR24 summary ETA > position-based calculation
  let etaTs = null
  if (data?.fr24_eta) {
    // FR24 gives ISO timestamp or Unix
    const ts = typeof data.fr24_eta === 'number' ? data.fr24_eta : Date.parse(data.fr24_eta)/1000
    if (ts && ts > now) etaTs = ts
  }
  if (!etaTs && data?.estimated_arr) {
    const ts = typeof data.estimated_arr === 'number' ? data.estimated_arr : Date.parse(data.estimated_arr)/1000
    if (ts && ts > now) etaTs = ts
  }
  if (!etaTs && data?.scheduled_arr) {
    const ts = typeof data.scheduled_arr === 'number' ? data.scheduled_arr : Date.parse(data.scheduled_arr)/1000
    if (ts) etaTs = ts
  }
  // Fallback: calculate from position if no FR24 ETA
  if (!etaTs && kmLeft && speedKmh) {
    etaTs = now + (kmLeft/speedKmh*3600)*1.05
  }

  const etaSecs  = etaTs ? Math.max(0, etaTs - now) : null
  const boatTs   = etaTs ? etaTs - 57*60 : null
  const depTs    = data?.actual_dep ? (typeof data.actual_dep === 'number' ? data.actual_dep : Date.parse(data.actual_dep)/1000) : null
  const progress = isAir && etaSecs ? Math.min(95,Math.max(5,100-(etaSecs/7200*100))) : isGround?100:0

  const statusLabel = isGround?'Landed':isAir?'Airborne':'Scheduled'
  const statusColor = isGround?'#059669':isAir?'#2563EB':'#6B7280'
  const statusBg    = isGround?'#ECFDF5':isAir?'#EFF6FF':'#F9FAFB'

  const orig = data?.orig || FLIGHT_ORIGINS[flight] || null

  return (
    <div style={{background:B.white,border:`0.5px solid ${B.border}`,borderRadius:12,overflow:'hidden',marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
      {/* Header */}
      <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:12,borderBottom:`0.5px solid ${B.border}`,background:B.pearl}}>
        <div style={{width:44,height:44,borderRadius:8,background:'#fff',border:`0.5px solid ${B.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden',padding:3}}>
          <AirlineLogo code={code} size={36} />
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:18,fontWeight:700,color:B.textPrimary,letterSpacing:'-0.3px'}}>
            {code} <span style={{color:info.color||B.freshPalm}}>{flight.slice(code.length)}</span>
          </div>
          <div style={{fontSize:11,color:B.textSecond,marginTop:1}}>
            {info.name} {hasData && data.alt ? `· ${data.alt?.toLocaleString()} ft · ${data.gspeed} kts` : '· Awaiting position'}
          </div>
        </div>
        <span style={{background:statusBg,color:statusColor,borderRadius:99,padding:'4px 12px',fontSize:11,fontWeight:600,display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:statusColor,display:'inline-block'}}/>
          {statusLabel}
        </span>
        <button onClick={onRemove} style={{background:'transparent',border:'none',color:B.textMuted,cursor:'pointer',fontSize:20,lineHeight:1,padding:'0 2px',flexShrink:0}}>×</button>
      </div>

      {/* Route bar */}
      <div style={{padding:'14px 16px',borderBottom:`0.5px solid ${B.border}`}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{textAlign:'left',minWidth:64}}>
            <div style={{fontSize:22,fontWeight:700,color:B.textPrimary,letterSpacing:1}}>{orig||'—'}</div>
            <div style={{fontSize:11,color:B.textSecond,marginTop:1}}>{orig?AIRPORT_NAMES[orig]||orig:'Origin'}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:B.textMuted,textAlign:'center',marginBottom:5}}>
              {isAir ? fmtDur(etaSecs||0)+' to MLE' : isGround?'Arrived':'No position yet'}
            </div>
            <div style={{height:4,background:B.breeze,borderRadius:99,position:'relative'}}>
              <div style={{width:`${progress}%`,height:'100%',background:isGround?'#059669':info.color||B.freshPalm,borderRadius:99,transition:'width 2s ease'}}/>
              {isAir && progress>5 && (
                <span style={{position:'absolute',top:-8,left:`${Math.min(progress,93)}%`,transform:'translateX(-50%)',fontSize:14}}>✈️</span>
              )}
            </div>
            <div style={{fontSize:10,color:B.textMuted,textAlign:'center',marginTop:3}}>{Math.round(progress)}%</div>
          </div>
          <div style={{textAlign:'right',minWidth:64}}>
            <div style={{fontSize:22,fontWeight:700,color:B.textPrimary,letterSpacing:1}}>MLE</div>
            <div style={{fontSize:11,color:B.textSecond,marginTop:1}}>Malé VIA</div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)'}}>
        {[
          {label:'Departed',       value:depTs?fmtTime(depTs):'—',                   color:B.textPrimary,                  sub:'actual time'},
          {label:'ETA Malé',       value:etaTs?fmtTime(etaTs):'—',                    color:isAir?'#2563EB':B.textPrimary,  sub: data?.fr24_eta ? 'via FR24' : 'estimated'},
          {label:'⚓ Boat Dispatch',value:boatTs?fmtTime(boatTs):'—',                  color:B.gold,                         sub:boatTs&&boatTs>now?'upcoming':'—'},
          {label:'Remaining',      value:isAir?fmtDur(etaSecs||0):isGround?'Arrived':'Pending', color:B.textPrimary,         sub:isAir?'to MLE':''},
        ].map((item,i)=>(
          <div key={i} style={{padding:'12px 14px',borderRight:i<3?`0.5px solid ${B.border}`:'none',borderBottom:'none'}}>
            <div style={{fontSize:10,color:B.textMuted,textTransform:'uppercase',letterSpacing:'.8px',marginBottom:4}}>{item.label}</div>
            <div style={{fontSize:16,fontWeight:700,color:item.color,fontFamily:'monospace'}}>{item.value}</div>
            <div style={{fontSize:10,color:B.textMuted,marginTop:2}}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Telemetry */}
      {hasData && (
        <div style={{padding:'8px 14px',background:B.pearl,borderTop:`0.5px solid ${B.border}`,display:'flex',gap:20,flexWrap:'wrap'}}>
          {[
            {l:'Alt',   v:data.alt?data.alt.toLocaleString()+' ft':'—'},
            {l:'Speed', v:data.gspeed?data.gspeed+' kts':'—'},
            {l:'Hdg',   v:data.track?data.track+'°':'—'},
            {l:'Pos',   v:data.lat?`${data.lat.toFixed(2)}°N  ${data.lon.toFixed(2)}°E`:'—'},
          ].map(item=>(
            <div key={item.l} style={{display:'flex',gap:5,alignItems:'center'}}>
              <span style={{fontSize:10,color:B.textMuted,textTransform:'uppercase',letterSpacing:'.5px'}}>{item.l}</span>
              <span style={{fontSize:11,color:B.textPrimary,fontFamily:'monospace',fontWeight:500}}>{item.v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FlightTrackerView({ isMobile }) {
  const [tracked,   setTracked]   = useState([])
  const [liveData,  setLiveData]  = useState({})
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [isLive,    setIsLive]    = useState(false)
  const [clock,     setClock]     = useState(new Date())
  const [refreshIn, setRefreshIn] = useState(30)

  useEffect(() => {
    const t = setInterval(()=>setClock(new Date()),1000)
    return ()=>clearInterval(t)
  },[])

  const fetchAll = async (flights) => {
    if (!flights.length) return
    setLoading(true)
    try {
      const callsigns = flights.map(toCallsign).join(',')
      const today = new Date().toISOString().slice(0,10)

      // Fetch both live position AND flight summary in parallel
      const [liveRes, summaryRes] = await Promise.all([
        fetch(`/.netlify/functions/fr24?flights=${callsigns}&mode=live`),
        fetch(`/.netlify/functions/fr24?flights=${callsigns}&mode=summary&date=${today}`),
      ])

      const liveJson    = liveRes.ok    ? await liveRes.json()    : { data: [] }
      const summaryJson = summaryRes.ok ? await summaryRes.json() : { data: [] }

      setIsLive(true)

      // Build map from live data (position, speed, altitude)
      const map = {}
      if (liveJson.data?.length > 0) {
        liveJson.data.forEach(d => {
          flights.forEach(f => {
            if (toCallsign(f) === d.callsign) {
              map[f] = {
                ...map[f],
                lat: d.lat, lon: d.lon, alt: d.alt,
                gspeed: d.gspeed, track: d.track,
                callsign: d.callsign,
                orig: FLIGHT_ORIGINS[f] || null,
              }
            }
          })
        })
      }

      // Overlay summary data (precise dep/arr times from FR24)
      if (summaryJson.data?.length > 0) {
        summaryJson.data.forEach(d => {
          const fn = d.flight_number || d.callsign || ''
          flights.forEach(f => {
            if (
              fn.replace(/\s/g,'').toUpperCase() === f.toUpperCase() ||
              (d.callsign && d.callsign === toCallsign(f))
            ) {
              map[f] = {
                ...map[f],
                orig: d.orig_iata || d.airport_from_iata || FLIGHT_ORIGINS[f] || map[f]?.orig || null,
                dest: d.dest_iata || d.airport_to_iata || 'MLE',
                scheduled_arr: d.scheduled_time_arr || d.sta || null,
                actual_arr:    d.actual_time_arr    || d.ata || null,
                estimated_arr: d.estimated_time_arr || d.eta || null,
                scheduled_dep: d.scheduled_time_dep || d.std || null,
                actual_dep:    d.actual_time_dep    || d.atd || null,
                status:        d.status || null,
                fr24_eta:      d.estimated_time_arr || d.eta || null,
              }
            }
          })
        })
      }

      if (Object.keys(map).length > 0) {
        setLiveData(prev => ({ ...prev, ...map }))
      }
    } catch(e) { console.log('FR24 error:', e) }
    setLoading(false)
  }

  useEffect(() => {
    if (!tracked.length) return
    fetchAll(tracked)
    const t = setInterval(()=>{
      setRefreshIn(r=>{ if(r<=1){fetchAll(tracked);return 30} return r-1 })
    },1000)
    return ()=>clearInterval(t)
  },[tracked])

  const addFlight = (fn) => {
    const f = (fn||input).toUpperCase().replace(/\s/g,'')
    if (!f || tracked.includes(f)) { setInput(''); return }
    const n = [...tracked, f]
    setTracked(n)
    setInput('')
    setTimeout(()=>fetchAll(n),100)
  }

  const removeFlight = f => {
    setTracked(t=>t.filter(x=>x!==f))
    setLiveData(d=>{ const n={...d}; delete n[f]; return n })
  }

  const airborne = tracked.filter(f=>liveData[f]&&liveData[f].alt>200).length
  const landed   = tracked.filter(f=>liveData[f]&&liveData[f].alt<=200).length

  return (
    <div>
      {/* Header */}
      <div style={{background:B.freshPalm,borderRadius:10,padding:isMobile?'16px':'20px 24px',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontSize:10,letterSpacing:'2px',color:'rgba(255,255,255,0.45)',textTransform:'uppercase',marginBottom:4}}>Dhirumbaa · Live Operations</div>
            <div style={{fontSize:isMobile?16:22,fontWeight:600,color:'#fff'}}>Flight Tracker</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:2}}>Velana International Airport · North Malé Atoll</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:isMobile?22:30,fontWeight:300,color:B.gold,fontFamily:'monospace',letterSpacing:2}}>
              {clock.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Indian/Maldives'})}
            </div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:2}}>Maldives Time (MVT)</div>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14,flexWrap:'wrap',alignItems:'center'}}>
          {[
            {val:airborne,          label:'Airborne', color:'#34D399'},
            {val:landed,            label:'Landed',   color:'rgba(255,255,255,0.7)'},
            {val:tracked.length-airborne-landed, label:'Pending', color:'rgba(255,255,255,0.4)'},
            {val:tracked.length,    label:'Tracked',  color:B.gold},
          ].map(s=>(
            <div key={s.label} style={{background:'rgba(255,255,255,0.08)',borderRadius:8,padding:'6px 14px',textAlign:'center'}}>
              <div style={{fontSize:18,fontWeight:700,color:s.color,fontFamily:'monospace'}}>{s.val}</div>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'.8px'}}>{s.label}</div>
            </div>
          ))}
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
            {isLive && <span style={{fontSize:10,background:'rgba(52,211,153,0.15)',color:'#34D399',border:'0.5px solid rgba(52,211,153,0.3)',borderRadius:99,padding:'3px 10px'}}>● Live</span>}
            <span style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>↻ {refreshIn}s</span>
            <button onClick={()=>fetchAll(tracked)} disabled={loading} style={{fontSize:10,background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.7)',borderRadius:99,padding:'4px 12px',cursor:'pointer'}}>
              {loading?'Loading…':'↻ Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Add flight input */}
      <div style={{display:'flex',gap:10,marginBottom:16}}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value.toUpperCase())}
          onKeyDown={e=>e.key==='Enter'&&addFlight()}
          placeholder="Add flight — e.g. EK656, QR672, MH485, SQ432"
          style={{...INP,flex:1,letterSpacing:1}}
        />
        <button onClick={()=>addFlight()} style={BTN_PRIMARY}>+ Track</button>
      </div>

      {/* Today's schedule table */}
      <TodayScheduleTable onTrack={addFlight} trackedFlights={tracked} />

      {/* Live tracked cards */}
      {tracked.length > 0 && (
        <div style={{marginTop:4}}>
          <div style={{fontSize:11,fontWeight:600,color:B.textMuted,textTransform:'uppercase',letterSpacing:'1px',marginBottom:10}}>Live Tracking</div>
          {tracked.map(f=>(
            <FlightCard key={f} flight={f} data={liveData[f]} isMobile={isMobile} onRemove={()=>removeFlight(f)} />
          ))}
        </div>
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
