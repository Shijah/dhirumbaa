import { useState, useRef } from "react";
import {
  LayoutDashboard, Ship, Navigation, Activity, Fuel, Users,
  Wrench, FileText, Bell, ChevronRight, ChevronLeft, Menu,
  AlertTriangle, CheckCircle, Upload, Camera, Plus, Edit2, Trash2,
  Anchor, Droplets, LogOut, Download, RefreshCw, Check,
  Zap, Star, Shield, Lock, Eye, EyeOff, Key, UserPlus,
  Save, AlertCircle, X, ToggleLeft, ToggleRight, ClipboardList
} from "lucide-react";

const C = { navy:"#0d1b2a", teal:"#0d7a6e", gold:"#c9a84c", cream:"#f8f6f0", border:"#e8e4dc" };

const MODULES = [
  { id:"dashboard",  label:"Dashboard",       Icon:LayoutDashboard, group:"core"    },
  { id:"movement",   label:"Boat Movement",   Icon:Navigation,      group:"ops"     },
  { id:"fleet",      label:"Fleet",           Icon:Ship,            group:"ops"     },
  { id:"activities", label:"Activities",      Icon:Activity,        group:"ops"     },
  { id:"fuel",       label:"Fuel Log",        Icon:Fuel,            group:"ops"     },
  { id:"duty",       label:"Duty Roster",     Icon:Users,           group:"crew"    },
  { id:"maintenance",label:"Maintenance",     Icon:Wrench,          group:"ops"     },
  { id:"reports",    label:"Reports",         Icon:FileText,        group:"reports" },
  { id:"checklist",  label:"Checklists",      Icon:ClipboardList,   group:"ops"     },
  { id:"users",      label:"User Management", Icon:Shield,          group:"admin"   },
];
const PERM_LABELS = ["view","edit","delete","export"];
const PERM_COLORS = { view:"#185FA5", edit:"#0d7a6e", delete:"#dc2626", export:"#b45309" };

const allIds = MODULES.map(m => m.id);
const opsIds = allIds.filter(id => id !== "users");
const ROLES = {
  superadmin:{ label:"Super Admin",    color:"#7c3aed", bg:"#ede9fe", desc:"Full system access", perms:Object.fromEntries(allIds.map(id=>[id,["view","edit","delete","export"]])) },
  admin:     { label:"Admin",          color:"#0d7a6e", bg:"#d1fae5", desc:"Full ops, no user management", perms:Object.fromEntries(opsIds.map(id=>[id,["view","edit","delete","export"]])) },
  captain:   { label:"Captain / Crew", color:"#185FA5", bg:"#dbeafe", desc:"View all + edit movement, fuel, duty", perms:{ dashboard:["view"], movement:["view","edit"], fleet:["view"], checklist:["view","edit"], activities:["view"], fuel:["view","edit"], duty:["view","edit"], maintenance:["view"], reports:["view"] } },
  viewonly:  { label:"View Only",      color:"#6b7280", bg:"#f3f4f6", desc:"Read-only access",  perms:Object.fromEntries(opsIds.map(id=>[id,["view"]])) },
};
function getPerms(user) { return user.customPerms || ROLES[user.role]?.perms || {}; }
function can(user, mod, action) { if(!user) return false; const p=getPerms(user); return Array.isArray(p[mod])&&p[mod].includes(action||"view"); }

const INIT_USERS = [
  { id:1,  username:"superadmin",  name:"Super Admin",       email:"ibrahimshijah@gmail.com", role:"superadmin", active:true,  lastLogin:"12 Mar 08:14", customPerms:null, avatar:"SA", ac:"#7c3aed" },
  { id:2,  username:"ops.manager", name:"Ops Manager",       email:"ops@baros.com",            role:"admin",      active:true,  lastLogin:"12 Mar 07:55", customPerms:null, avatar:"OM", ac:"#0d7a6e" },
  { id:3,  username:"nasru",       name:"NASRU (Captain)",   email:"nasru@baros.com",           role:"captain",    active:true,  lastLogin:"12 Mar 05:40", customPerms:null, avatar:"NA", ac:"#185FA5" },
  { id:4,  username:"shafeeq",     name:"SHAFEEQ (Captain)", email:"shafeeq@baros.com",         role:"captain",    active:true,  lastLogin:"11 Mar 22:10", customPerms:null, avatar:"SH", ac:"#854F0B" },
  { id:5,  username:"azuhan",      name:"AZUHAN (Captain)",  email:"azuhan@baros.com",          role:"captain",    active:true,  lastLogin:"12 Mar 05:30", customPerms:null, avatar:"AZ", ac:"#D85A30" },
  { id:6,  username:"david",       name:"DAVID (Captain)",   email:"david@baros.com",           role:"captain",    active:true,  lastLogin:"12 Mar 06:00", customPerms:null, avatar:"DA", ac:"#3B6D11" },
  { id:7,  username:"frontdesk",   name:"Front Desk",        email:"frontdesk@baros.com",       role:"viewonly",   active:true,  lastLogin:"12 Mar 07:00", customPerms:null, avatar:"FD", ac:"#c9a84c" },
  { id:8,  username:"divecenter",  name:"Dive Centre",       email:"divers@baros.com",          role:"viewonly",   active:true,  lastLogin:"11 Mar 16:30", customPerms:null, avatar:"DC", ac:"#378ADD" },
  { id:9,  username:"shirey",      name:"SHIREY (Captain)",  email:"shirey@baros.com",          role:"captain",    active:true,  lastLogin:"12 Mar 05:45", customPerms:null, avatar:"SR", ac:"#7F77DD" },
  { id:10, username:"mirsad",      name:"MIRSAD (Captain)",  email:"mirsad@baros.com",          role:"captain",    active:false, lastLogin:"10 Mar 14:20", customPerms:null, avatar:"MI", ac:"#1D9E75" },
];

const FLEET = [
  { id:1,  name:"Serenity",    type:"Luxury Yacht",     fuelCap:800, cons:90,  pax:12, pri:1, captain:"NASRU",   color:"#c9a84c", fuel:620 },
  { id:2,  name:"Ixora",       type:"Luxury Speedboat", fuelCap:400, cons:97,  pax:8,  pri:2, captain:"AZUHAN",  color:"#0d7a6e", fuel:310 },
  { id:3,  name:"Vitesse",     type:"Luxury Speedboat", fuelCap:400, cons:116, pax:8,  pri:2, captain:"SHIREY",  color:"#185FA5", fuel:280 },
  { id:4,  name:"Tara",        type:"Speedboat",        fuelCap:500, cons:90,  pax:12, pri:1, captain:"SHIREY",  color:"#3B6D11", fuel:350 },
  { id:5,  name:"Xari",        type:"Speedboat",        fuelCap:500, cons:65,  pax:21, pri:4, captain:"DAVID",   color:"#854F0B", fuel:420 },
  { id:6,  name:"Heliconia",   type:"Dhoni",            fuelCap:200, cons:9,   pax:25, pri:1, captain:"SHAFEEQ", color:"#7F77DD", fuel:160 },
  { id:7,  name:"Isadora",     type:"Dhoni",            fuelCap:200, cons:12,  pax:25, pri:2, captain:"SHAFEEQ", color:"#D85A30", fuel:145 },
  { id:8,  name:"Areena",      type:"Dhoni",            fuelCap:200, cons:9,   pax:25, pri:3, captain:"MIRSAD",  color:"#D4537E", fuel:130 },
  { id:9,  name:"Nooma",       type:"Dhoni",            fuelCap:200, cons:5,   pax:6,  pri:4, captain:"MODE",    color:"#1D9E75", fuel:175 },
  { id:10, name:"Wahoo",       type:"Power Boat",       fuelCap:150, cons:25,  pax:6,  pri:5, captain:"MIRSAD",  color:"#378ADD", fuel:90  },
  { id:11, name:"Party Craft", type:"Pontoon",          fuelCap:150, cons:18,  pax:20, pri:5, captain:"DHONA",   color:"#639922", fuel:110 },
  { id:12, name:"Dingy",       type:"Dingy",            fuelCap:30,  cons:5,   pax:4,  pri:6, captain:"—",       color:"#888780", fuel:25  },
];

// Per-boat engine/gearbox specs for checklist header
const BOAT_SPECS = {
  "Serenity":    { engineModel:"MERCURY 400HP", engineMake:"MERCURY", gearboxMake:"MERCURY", portSN:"",stbdSN:"",portGbSN:"",stbdGbSN:"",dgModel:"",dgMake:"",dgSN:"", engines:2 },
  "Ixora":       { engineModel:"MERCURY 300HP", engineMake:"YAMAHA",  gearboxMake:"MERCURY", portSN:"",stbdSN:"",portGbSN:"",stbdGbSN:"",dgModel:"",dgMake:"",dgSN:"", engines:2 },
  "Vitesse":     { engineModel:"MERCURY 300HP", engineMake:"MERCURY", gearboxMake:"MERCURY", portSN:"",stbdSN:"",portGbSN:"",stbdGbSN:"",dgModel:"",dgMake:"",dgSN:"", engines:2 },
  "Tara":        { engineModel:"YAMAHA 300HP",  engineMake:"YAMAHA",  gearboxMake:"YAMAHA",  portSN:"",stbdSN:"",portGbSN:"",stbdGbSN:"",dgModel:"",dgMake:"",dgSN:"", engines:1 },
  "Xari":        { engineModel:"MERCURY 350HP", engineMake:"MERCURY", gearboxMake:"MERCURY", portSN:"",stbdSN:"",portGbSN:"",stbdGbSN:"",dgModel:"",dgMake:"",dgSN:"", engines:2 },
  "Heliconia":   { engineModel:"YANMAR 315HP",  engineMake:"YANMAR",  gearboxMake:"YANMAR",  portSN:"",stbdSN:"",portGbSN:"",stbdGbSN:"",dgModel:"",dgMake:"",dgSN:"", engines:1 },
  "Isadora":     { engineModel:"YANMAR 260HP",  engineMake:"YANMAR",  gearboxMake:"YANMAR",  portSN:"",stbdSN:"",portGbSN:"",stbdGbSN:"",dgModel:"",dgMake:"",dgSN:"", engines:1 },
  "Areena":      { engineModel:"YANMAR 240HP",  engineMake:"YANMAR",  gearboxMake:"YANMAR",  portSN:"",stbdSN:"",portGbSN:"",stbdGbSN:"",dgModel:"",dgMake:"",dgSN:"", engines:1 },
  "Nooma":       { engineModel:"YANMAR 200HP",  engineMake:"YANMAR",  gearboxMake:"YANMAR",  portSN:"",stbdSN:"",portGbSN:"",stbdGbSN:"",dgModel:"",dgMake:"",dgSN:"", engines:1 },
  "Wahoo":       { engineModel:"YAMAHA 150HP",  engineMake:"YAMAHA",  gearboxMake:"YAMAHA",  portSN:"",stbdSN:"",portGbSN:"",stbdGbSN:"",dgModel:"",dgMake:"",dgSN:"", engines:1 },
  "Party Craft": { engineModel:"YAMAHA 115HP",  engineMake:"YAMAHA",  gearboxMake:"YAMAHA",  portSN:"",stbdSN:"",portGbSN:"",stbdGbSN:"",dgModel:"",dgMake:"",dgSN:"", engines:1 },
  "Dingy":       { engineModel:"YAMAHA 40HP",   engineMake:"YAMAHA",  gearboxMake:"YAMAHA",  portSN:"",stbdSN:"",portGbSN:"",stbdGbSN:"",dgModel:"",dgMake:"",dgSN:"", engines:1 },
};

// Checklist items exactly matching Ixora Daily Maintenance Check Sheet
// type: hln=High/Low/Normal  ln=Low/Normal  yn=Yes/No  text=free text  voltage=battery  pressure=oil pressure  temp=temperature
const CL_ITEMS = [
  { id:1,  desc:"Check engine oil level",                                                      type:"hln",      note:"" },
  { id:2,  desc:"Check engine coolant level",                                                  type:"hln",      note:"" },
  { id:3,  desc:"Check gearbox oil level",                                                     type:"hln",      note:"" },
  { id:4,  desc:"Check DG oil level",                                                          type:"hln",      note:"" },
  { id:5,  desc:"Check fuel level in fuel tank",                                               type:"ln",       note:"" },
  { id:6,  desc:"Check DG coolant level",                                                      type:"hln",      note:"" },
  { id:7,  desc:"Check steering system for proper functioning",                                type:"yn",       note:"Working smoothly and properly" },
  { id:8,  desc:"Check the battery voltage",                                                   type:"voltage",  note:"Mention the voltage" },
  { id:9,  desc:"Check trim tabs for proper functioning",                                      type:"yn",       note:"Working smoothly and properly" },
  { id:10, desc:"Check leakages of sea water or fuel in engine room & Rudder room",           type:"yn_leak",  note:"Yes = leakage found (bad)" },
  { id:11, desc:"Check navigational lights for proper functioning",                            type:"yn",       note:"Working properly" },
  { id:12, desc:"Check bilge pump auto/Manual functioning",                                    type:"yn",       note:"Working properly" },
  { id:13, desc:"Check any alarm indication",                                                  type:"yn_alarm", note:"Yes = alarm active" },
  { id:14, desc:"Proper functioning of AC units",                                              type:"yn",       note:"Working properly" },
  { id:15, desc:"Operate engine room blower before starting the engine",                       type:"yn",       note:"Working properly" },
  { id:16, desc:"Check Oil pressure of Engine [Should not exceed 80 Psi]",                   type:"pressure", note:"Note the oil pressure (KPA)" },
  { id:17, desc:"Check engine temperature [Should not exceed 85 degrees]",                   type:"temp",     note:"Note the temp" },
  { id:18, desc:"Check Oil pressure of DG [Should not exceed 80 Psi]",                       type:"pressure", note:"Note the oil pressure" },
  { id:19, desc:"Check DG temperature [Should not exceed 85 degrees]",                       type:"temp",     note:"Note the temp" },
  { id:20, desc:"Electrical Equipment (Lights, horn, pump, bow thruster)",                    type:"yn",       note:"Working properly" },
];

const TRANSPORT_EMAILS = ["transport.assistant@baros.com","transport.manager@baros.com","ibrahimshijah@gmail.com"];

const BOAT_CAPS = {
  transfer:["Serenity","Ixora","Tara","Xari","Vitesse"], vip:["Serenity","Vitesse","Ixora"],
  diving:["Heliconia","Isadora","Xari","Nooma"], snorkelling:["Heliconia","Isadora","Xari","Nooma"],
  excursion:["Serenity","Xari","Isadora","Nooma","Heliconia","Ixora","Tara"],
  dolphin:["Serenity","Xari","Isadora"], sunset:["Serenity","Xari","Heliconia","Isadora"],
  fishing:["Heliconia","Isadora"], staffFerry:["Tara","Xari","Heliconia","Isadora","Areena"],
  supply:["Areena","Heliconia","Isadora"], noomaOnly:["Nooma"],
};
const EXCURSIONS = [
  { day:"Sunday",    time:"5pm-6:30pm",    name:"Sunset Cruise with Champagne & Canapes",pax:"4-6",boat:"Serenity/Xari",    type:"sunset"    },
  { day:"Sunday",    time:"5:30pm-7:30pm", name:"Fishing by Twilight",                   pax:"4-6",boat:"Heliconia/Isadora", type:"fishing"   },
  { day:"Monday",    time:"4:30pm-6pm",    name:"Sunset Dolphin Watching",               pax:"4-8",boat:"Xari/Isadora",      type:"dolphin"   },
  { day:"Monday",    time:"1pm-5pm",       name:"Male Sightseeing & Shopping Trip",       pax:"4-8",boat:"Ixora/Tara/Xari",  type:"excursion" },
  { day:"Tuesday",   time:"2pm-5pm",       name:"Local Island Discovery",                pax:"4-8",boat:"Ixora/Tara/Xari",  type:"excursion" },
  { day:"Tuesday",   time:"5pm-6:30pm",    name:"Nooma Sailing with Champagne & Canapes",pax:"4-6",boat:"Nooma",            type:"nooma"     },
  { day:"Wednesday", time:"6am-8am",       name:"Sunrise Fishing",                       pax:"4-6",boat:"Heliconia/Isadora", type:"fishing"   },
  { day:"Wednesday", time:"4:30pm-6pm",    name:"Sunset Dolphin Watching",               pax:"4-8",boat:"Xari/Isadora",      type:"dolphin"   },
  { day:"Thursday",  time:"2pm-5pm",       name:"Local Island Discovery",                pax:"4-8",boat:"Ixora/Tara/Xari",  type:"excursion" },
  { day:"Thursday",  time:"5pm-6:30pm",    name:"Sunset Cruise with Champagne & Canapes",pax:"4-6",boat:"Serenity/Xari",    type:"sunset"    },
  { day:"Friday",    time:"4:30pm-6pm",    name:"Sunset Dolphin Watching",               pax:"4-8",boat:"Xari/Isadora",      type:"dolphin"   },
  { day:"Friday",    time:"5:30pm-7:30pm", name:"Fishing by Twilight",                   pax:"4-6",boat:"Heliconia/Isadora", type:"fishing"   },
  { day:"Saturday",  time:"6am-8am",       name:"Sunrise Fishing",                       pax:"4-6",boat:"Heliconia/Isadora", type:"fishing"   },
  { day:"Saturday",  time:"1pm-5pm",       name:"Male Sightseeing & Shopping Trip",       pax:"4-8",boat:"Ixora/Tara/Xari",  type:"excursion" },
  { day:"Saturday",  time:"5pm-6:30pm",    name:"Nooma Sailing with Champagne & Canapes",pax:"4-6",boat:"Nooma",            type:"nooma"     },
];
const MARINE = [
  { day:"Monday",    time:"10am-11:15am",name:"House Reef Snorkelling",     type:"snorkelling"  },
  { day:"Monday",    time:"6pm-7:45pm",  name:"Night Snorkelling",          type:"snorkelling"  },
  { day:"Tuesday",   time:"10:30am-noon",name:"Snorkelling Safari",         type:"snorkelling"  },
  { day:"Wednesday", time:"2pm-3:15pm",  name:"House Reef Snorkelling",     type:"snorkelling"  },
  { day:"Wednesday", time:"6pm-7:45pm",  name:"Night Snorkelling",          type:"snorkelling"  },
  { day:"Wednesday", time:"6pm-7pm",     name:"Marine Biology Presentation",type:"presentation" },
  { day:"Thursday",  time:"2pm-3:30pm",  name:"Snorkelling Safari",         type:"snorkelling"  },
  { day:"Friday",    time:"6pm-7pm",     name:"Marine Biology Presentation",type:"presentation" },
  { day:"Friday",    time:"4pm-5pm",     name:"Nature Walk",                type:"walk"         },
  { day:"Saturday",  time:"10am-11:15am",name:"House Reef Snorkelling",     type:"snorkelling"  },
  { day:"Saturday",  time:"6pm-7:45pm",  name:"Night Snorkelling",          type:"snorkelling"  },
  { day:"Sunday",    time:"10:30am-noon",name:"Snorkelling Safari",         type:"snorkelling"  },
];
const CAPTAINS = [
  {id:1,name:"SALEEM", contact:"7950200",vessel:"Senior/Serenity",role:"Captain"},
  {id:2,name:"NASRU",  contact:"9461017",vessel:"Serenity",       role:"Captain"},
  {id:3,name:"SHAFEEQ",contact:"9883885",vessel:"Heliconia",      role:"Captain"},
  {id:4,name:"AZUHAN", contact:"7932155",vessel:"Ixora",          role:"Captain"},
  {id:5,name:"MIRSAD", contact:"9410773",vessel:"Areena",         role:"Captain"},
  {id:6,name:"DAVID",  contact:"7901716",vessel:"Xari",           role:"Captain"},
  {id:7,name:"SHIREY", contact:"7929255",vessel:"Tara/Vitesse",   role:"Captain"},
  {id:8,name:"MODE",   contact:"7667621",vessel:"Nooma",          role:"Captain"},
  {id:9,name:"DHONA",  contact:"7783056",vessel:"Party Craft",    role:"Captain"},
];
const CREW = [
  {id:10,name:"SHAHEEN", vessel:"Ixora/Areena",role:"Crew"},{id:11,name:"ADAM",    vessel:"Ixora",    role:"Crew"},
  {id:12,name:"JAN",     vessel:"Tara/Xari",  role:"Crew"},{id:13,name:"AYYA",    vessel:"Tara",     role:"Crew"},
  {id:14,name:"MOHO",    vessel:"Serenity",   role:"Crew"},{id:15,name:"MAASEY",  vessel:"Serenity", role:"Crew"},
  {id:16,name:"SACHO",   vessel:"Heliconia",  role:"Crew"},{id:17,name:"H.SALEEM",vessel:"Heliconia",role:"Crew"},
  {id:18,name:"YOONUS",  vessel:"Areena",     role:"Crew"},{id:19,name:"FULHU",   vessel:"Xari",     role:"Crew"},
];
const ALL_STAFF = [...CAPTAINS,...CREW];
const ATTEND = [
  {code:"P",  label:"Present",        color:"#059669",bg:"#d1fae5"},
  {code:"AL", label:"Annual Leave",   color:"#7c3aed",bg:"#ede9fe"},
  {code:"OFF",label:"Day Off",        color:"#0369a1",bg:"#dbeafe"},
  {code:"S",  label:"Sick Leave",     color:"#dc2626",bg:"#fee2e2"},
  {code:"PH", label:"Public Holiday", color:"#b45309",bg:"#fef3c7"},
  {code:"NP", label:"No Pay",         color:"#6b7280",bg:"#f3f4f6"},
  {code:"EL", label:"Emergency",      color:"#be123c",bg:"#ffe4e6"},
];
const FUEL_SRCS = ["Patrol - FSM Hulhumale'","Patrol - From the Resort","Diesel - From the Resort"];
const FUEL_CLR  = {"Patrol - FSM Hulhumale'":"#185FA5","Patrol - From the Resort":"#0d7a6e","Diesel - From the Resort":"#854F0B"};
const MAINT = [
  {id:1,boat:"Tara",     task:"Engine Service",        due:"2026-04-01",status:"due-soon", pri:"high"},
  {id:2,boat:"Xari",     task:"Hull Inspection",       due:"2026-05-15",status:"scheduled",pri:"medium"},
  {id:3,boat:"Ixora",    task:"Safety Equipment Check",due:"2026-03-20",status:"due-soon", pri:"high"},
  {id:4,boat:"Serenity", task:"Seaworthiness Renewal", due:"2026-06-30",status:"scheduled",pri:"medium"},
  {id:5,boat:"Heliconia",task:"Oil Change",            due:"2026-03-25",status:"due-soon", pri:"medium"},
];
const INIT_FUEL = [
  {id:1, date:"2026-03-12",boat:"Tara",        custName:"Transport Dept",desc:"Daily refuel post-ops",        src:"Patrol - From the Resort",  ltrs:450, start:12540,end:12990,receipt:null},
  {id:2, date:"2026-03-12",boat:"Xari",        custName:"Transport Dept",desc:"Staff ferry & excursion ops",  src:"Diesel - From the Resort",  ltrs:380, start:9870, end:10250,receipt:null},
  {id:3, date:"2026-03-11",boat:"Ixora",       custName:"Transport Dept",desc:"Guest transfer operations",    src:"Patrol - FSM Hulhumale'",   ltrs:200, start:4420, end:4620, receipt:null},
  {id:4, date:"2026-03-11",boat:"Serenity",    custName:"Transport Dept",desc:"Luxury yacht refuel",          src:"Patrol - FSM Hulhumale'",   ltrs:300, start:7100, end:7400, receipt:null},
  {id:5, date:"2026-03-10",boat:"Vitesse",     custName:"Transport Dept",desc:"VIP transport refuel",         src:"Patrol - FSM Hulhumale'",   ltrs:280, start:2200, end:2480, receipt:null},
  {id:6, date:"2026-03-10",boat:"Heliconia",   custName:"Transport Dept",desc:"Diving boat refuel",           src:"Diesel - From the Resort",  ltrs:120, start:8800, end:8920, receipt:null},
  {id:7, date:"2026-03-09",boat:"Isadora",     custName:"Transport Dept",desc:"Excursion boat refuel",        src:"Diesel - From the Resort",  ltrs:100, start:5600, end:5700, receipt:null},
  {id:8, date:"2026-03-09",boat:"Areena",      custName:"Transport Dept",desc:"Supply dhoni refuel",          src:"Diesel - From the Resort",  ltrs:90,  start:4100, end:4190, receipt:null},
  {id:9, date:"2026-03-08",boat:"Nooma",       custName:"Transport Dept",desc:"Excursion dhoni refuel",       src:"Diesel - From the Resort",  ltrs:60,  start:1800, end:1860, receipt:null},
  {id:10,date:"2026-03-08",boat:"Wahoo",       custName:"Transport Dept",desc:"Power boat refuel",            src:"Patrol - From the Resort",  ltrs:80,  start:940,  end:1020, receipt:null},
  {id:11,date:"2026-03-07",boat:"Party Craft", custName:"Transport Dept",desc:"Piano / event boat refuel",    src:"Patrol - From the Resort",  ltrs:70,  start:620,  end:690,  receipt:null},
  {id:12,date:"2026-03-07",boat:"Dingy",       custName:"Transport Dept",desc:"Tender boat refuel",           src:"Patrol - From the Resort",  ltrs:15,  start:310,  end:325,  receipt:null},
];
const TODAY = [
  {time:"05:45",boat:"Ixora",      type:"Guest Transfer",    details:"02 PAX DEP & ARR AK74/BA61",captain:"AZUHAN", cat:"transfer",status:"completed"},
  {time:"06:30",boat:"Tara",       type:"Guest Transfer",    details:"02 PAX DEP & ARR OS21",     captain:"SHIREY", cat:"transfer",status:"completed"},
  {time:"07:00",boat:"Xari",       type:"Staff Ferry",       details:"STAFF FERRY BM-07:00/MAL-08:00",captain:"DAVID",cat:"ferry",  status:"completed"},
  {time:"07:45",boat:"Serenity",   type:"VIP Transfer",      details:"03 PAX VIP ARR EK658 AT 09:25",captain:"NASRU",cat:"transfer",status:"active",vip:true},
  {time:"08:00",boat:"Heliconia",  type:"Diving (2 Tank)",   details:"04 PAX DIVING AT 08:30",    captain:"SHAFEEQ",cat:"activity",status:"active"},
  {time:"08:00",boat:"Party Craft",type:"Piano Breakfast",   details:"02 PAX PIANO BREAKFAST",    captain:"DHONA",  cat:"activity",status:"active"},
  {time:"10:00",boat:"Areena",     type:"Sea Cargo Supply",  details:"SEA CARGO SUPPLY",          captain:"MIRSAD", cat:"supply",  status:"completed"},
  {time:"10:45",boat:"Tara",       type:"Guest Transfer",    details:"02 PAX ARR MILAIDHOO 13:30",captain:"SHIREY", cat:"transfer",status:"upcoming"},
  {time:"13:45",boat:"Heliconia",  type:"Snorkelling Safari",details:"04 PAX SNORKELLING AT 14:00",captain:"SHAFEEQ",cat:"activity",status:"upcoming"},
  {time:"16:15",boat:"Xari",       type:"Staff Ferry",       details:"STAFF FERRY + BAND ARR",    captain:"SHIREY", cat:"ferry",   status:"upcoming"},
  {time:"16:45",boat:"Isadora",    type:"Sunset Cruise",     details:"04 PAX SUNSET CRUISE AT 17:00",captain:"SHAFEEQ",cat:"activity",status:"upcoming"},
  {time:"17:15",boat:"Heliconia",  type:"Sunset Fishing",    details:"02 PAX SUNSET FISHING 17:30",captain:"NASRU", cat:"activity",status:"upcoming"},
  {time:"18:45",boat:"Ixora",      type:"Guest Transfer",    details:"02 PAX DEP + REFREES MAL JETTY 7",captain:"AZUHAN",cat:"transfer",status:"upcoming"},
  {time:"20:30",boat:"Areena",     type:"Wet Garbage",       details:"WET GARBAGE DISPOSE",       captain:"MIRSAD", cat:"supply",  status:"upcoming"},
  {time:"22:30",boat:"Xari",       type:"Staff Ferry",       details:"STAFF FERRY BM-22:30/MAL-23:30",captain:"DAVID",cat:"ferry", status:"upcoming"},
];
function subMin(t,m){if(!t||!t.includes(":"))return"06:00";const[h,mn]=t.split(":").map(Number);const tot=h*60+mn-m;const hh=Math.floor(((tot%1440)+1440)%1440/60),mm2=((tot%1440)+1440)%1440%60;return String(hh).padStart(2,"0")+":"+String(mm2).padStart(2,"0");}
function buildSched(arrivals,deps,excBk,diveBk,piano,date){
  const res=[];const used=new Set();
  const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dow=days[new Date(date).getDay()];
  const PRI={vip:{Serenity:1,Vitesse:2,Ixora:3},transfer:{Tara:1,Ixora:2,Serenity:3,Xari:4,Vitesse:5},diving:{Heliconia:1,Isadora:2,Xari:3,Nooma:5}};
  function pick(type){const caps=BOAT_CAPS[type]||[];const pm=PRI[type]||{};const s=caps.filter(b=>!used.has(b)).sort((a,b2)=>(pm[a]||99)-(pm[b2]||99));return s[0]||null;}
  arrivals.filter(a=>a.vip).forEach(a=>{const b=pick("vip");if(b){used.add(b);const f=FLEET.find(x=>x.name===b);res.push({time:subMin(a.time,45),boat:b,type:"VIP Arrival",details:a.pax+" PAX VIP ARR "+a.flight+" AT "+a.time,captain:f?.captain||"",cat:"transfer",status:"upcoming",vip:true});}});
  deps.filter(d=>d.vip).forEach(d=>{const b=pick("vip");if(b){used.add(b);const f=FLEET.find(x=>x.name===b);res.push({time:subMin(d.time,60),boat:b,type:"VIP Departure",details:d.pax+" PAX VIP DEP "+d.flight+" AT "+d.time,captain:f?.captain||"",cat:"transfer",status:"upcoming",vip:true});}});
  arrivals.filter(a=>!a.vip).forEach(a=>{const b=pick("transfer");if(b){const f=FLEET.find(x=>x.name===b);res.push({time:subMin(a.time,45),boat:b,type:"Arrival Transfer",details:a.pax+" PAX ARR "+a.flight+" AT "+a.time,captain:f?.captain||"",cat:"transfer",status:"upcoming"});}});
  deps.filter(d=>!d.vip).forEach(d=>{const b=pick("transfer");if(b){const f=FLEET.find(x=>x.name===b);res.push({time:subMin(d.time,60),boat:b,type:"Departure Transfer",details:d.pax+" PAX DEP "+d.flight+" AT "+d.time,captain:f?.captain||"",cat:"transfer",status:"upcoming"});}});
  if(diveBk.singleTank>0){const b=pick("diving");if(b){const f=FLEET.find(x=>x.name===b);res.push({time:"07:45",boat:b,type:"Diving (Single Tank)",details:diveBk.singleTank+" PAX SINGLE TANK 08:00",captain:f?.captain||"",cat:"activity",status:"upcoming"});}}
  if(diveBk.doubleTank>0){const b=pick("diving");if(b){const f=FLEET.find(x=>x.name===b);res.push({time:"07:45",boat:b,type:"Diving (Double Tank)",details:diveBk.doubleTank+" PAX DOUBLE TANK 08:00",captain:f?.captain||"",cat:"activity",status:"upcoming"});}}
  if(diveBk.snorkelling>0){const b=pick("snorkelling");if(b){const f=FLEET.find(x=>x.name===b);res.push({time:"13:45",boat:b,type:"Snorkelling Safari",details:diveBk.snorkelling+" PAX SNORKELLING 14:00",captain:f?.captain||"",cat:"activity",status:"upcoming"});}}
  excBk.forEach(exc=>{const w=EXCURSIONS.find(e=>e.day===dow&&e.name===exc.name);if(w){const bt=w.type==="nooma"?"noomaOnly":w.type;const b=pick(bt);if(b){used.add(b);const f=FLEET.find(x=>x.name===b);res.push({time:"16:45",boat:b,type:exc.name,details:exc.pax+" PAX "+exc.name.toUpperCase(),captain:f?.captain||"",cat:"activity",status:"upcoming"});}}});
  if(piano.active){const meal=piano.meal;const t=meal==="breakfast"?"07:45":meal==="lunch"?"11:45":"18:30";res.push({time:t,boat:"Party Craft",type:"Piano "+meal.charAt(0).toUpperCase()+meal.slice(1),details:piano.pax+" PAX PIANO "+meal.toUpperCase(),captain:"DHONA",cat:"activity",status:"upcoming"});}
  res.push({time:"06:45",boat:"Xari",type:"Staff Ferry",details:"BM-07:00/MAL-08:00",captain:"DAVID",cat:"ferry",status:"upcoming"});
  res.push({time:"16:00",boat:"Xari",type:"Staff Ferry",details:"BM-16:15/MAL-17:00",captain:"DAVID",cat:"ferry",status:"upcoming"});
  res.push({time:"22:15",boat:"Xari",type:"Staff Ferry",details:"BM-22:30/MAL-23:30",captain:"DAVID",cat:"ferry",status:"upcoming"});
  res.push({time:"09:45",boat:"Areena",type:"Sea Cargo Supply",details:"SEA CARGO SUPPLY",captain:"MIRSAD",cat:"supply",status:"upcoming"});
  res.push({time:"20:15",boat:"Areena",type:"Wet Garbage",details:"WET GARBAGE DISPOSE",captain:"MIRSAD",cat:"supply",status:"upcoming"});
  return res.sort((a,b2)=>a.time.localeCompare(b2.time));
}


function Bdg({label,bg,color,style}){return <span style={{background:bg,color,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap",...style}}>{label}</span>;}
function Card({children,style}){return <div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e4dc",padding:"16px 20px",...style}}>{children}</div>;}
function Btn({children,onClick,variant,style,disabled}){
  const base={padding:"8px 14px",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontSize:13,fontWeight:600,display:"inline-flex",alignItems:"center",gap:6,border:"none",opacity:disabled?0.5:1};
  const vs={primary:{background:"#0d7a6e",color:"#fff"},secondary:{background:"#fff",color:"#0d1b2a",border:"1px solid #e8e4dc"},purple:{background:"#7c3aed",color:"#fff"},danger:{background:"#fee2e2",color:"#991b1b"}};
  return <button onClick={disabled?undefined:onClick} style={{...base,...(vs[variant||"primary"]),...style}}>{children}</button>;
}
function Hdr({title,action,onAction}){return(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><h2 style={{fontSize:16,fontWeight:700,color:"#0d1b2a",margin:0}}>{title}</h2>{action&&<button onClick={onAction} style={{fontSize:13,color:"#0d7a6e",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>{action}</button>}</div>);}
function ViewOnly(){return <div style={{marginBottom:14,padding:"10px 14px",background:"#dbeafe",borderRadius:8,fontSize:13,color:"#1e40af",display:"flex",alignItems:"center",gap:8}}><Eye size={14}/> View-only mode</div>;}
function Locked({name}){return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:360,gap:14}}><Lock size={48} color="#e0ddd5"/><div style={{fontSize:18,fontWeight:700,color:"#ccc"}}>Access Restricted</div><div style={{fontSize:13,color:"#bbb",textAlign:"center",maxWidth:300}}>You do not have permission to view <strong>{name}</strong>.</div></div>);}
function StsBdg({status}){const m={active:{bg:"#d1fae5",c:"#065f46"},upcoming:{bg:"#dbeafe",c:"#1e40af"},completed:{bg:"#f3f4f6",c:"#6b7280"},"due-soon":{bg:"#fff7ed",c:"#c2410c"},scheduled:{bg:"#f0fdf4",c:"#15803d"}};const s=m[status]||{bg:"#f3f4f6",c:"#6b7280"};return <Bdg label={status} bg={s.bg} color={s.c}/>;}

function Login({onLogin,users}){
  const [un,setUn]=useState("");
  const [pw,setPw]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [err,setErr]=useState("");
  const [busy,setBusy]=useState(false);
  const handle=()=>{
    setErr("");setBusy(true);
    setTimeout(()=>{
      const u=users.find(x=>x.username===un.trim().toLowerCase());
      if(!u){setErr("Username not found.");setBusy(false);return;}
      if(!u.active){setErr("Account deactivated. Contact Super Admin.");setBusy(false);return;}
      const correctPw=u.role==="superadmin"?"Baros@2026":"baros2026";
      if(pw!==correctPw&&pw!==u.username){setErr("Incorrect password.");setBusy(false);return;}
      onLogin(u);
    },700);
  };
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0d1b2a 0%,#1a3a5c 50%,#0d4a42 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,0.97)",borderRadius:20,padding:"40px 44px",width:"100%",maxWidth:420,boxShadow:"0 24px 80px rgba(0,0,0,0.3)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:28,fontWeight:800,color:"#0d1b2a",letterSpacing:"1px"}}>BAROS</div>
          <div style={{fontSize:11,color:"#c9a84c",letterSpacing:"3px",fontWeight:700,marginTop:2}}>MALDIVES - VMS</div>
          <div style={{width:40,height:2,background:"#c9a84c",margin:"12px auto 0"}}></div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:"#888",display:"block",marginBottom:5,fontWeight:600}}>Username</label>
          <input value={un} onChange={e=>setUn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} placeholder="e.g. nasru" autoFocus
            style={{width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid #e8e4dc",fontSize:14,boxSizing:"border-box",color:"#0d1b2a",outline:"none"}}/>
        </div>
        <div style={{marginBottom:8}}>
          <label style={{fontSize:12,color:"#888",display:"block",marginBottom:5,fontWeight:600}}>Password</label>
          <div style={{position:"relative"}}>
            <input type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} placeholder="..." style={{width:"100%",padding:"11px 40px 11px 14px",borderRadius:10,border:"1.5px solid #e8e4dc",fontSize:14,boxSizing:"border-box",color:"#0d1b2a",outline:"none"}}/>
            <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#aaa"}}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
          </div>
        </div>
        {err&&<div style={{padding:"8px 12px",background:"#fee2e2",borderRadius:8,color:"#991b1b",fontSize:13,marginBottom:10,display:"flex",alignItems:"center",gap:8}}><AlertCircle size={14}/>{err}</div>}
        <div style={{fontSize:11,color:"#bbb",marginBottom:18}}>Staff password: <code style={{color:"#0d7a6e",fontWeight:700}}>baros2026</code></div>
        <button onClick={handle} disabled={busy||!un} style={{width:"100%",padding:"13px",borderRadius:10,border:"none",background:busy||!un?"#0d7a6e88":"#0d7a6e",color:"#fff",fontWeight:700,fontSize:15,cursor:busy||!un?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {busy?<RefreshCw size={16} style={{animation:"spin 1s linear infinite"}}/>:<Key size={16}/>}
          {busy?"Signing in...":"Sign In"}
        </button>
        <div style={{marginTop:22,borderTop:"1px solid #e8e4dc",paddingTop:16}}>
          <div style={{fontSize:11,color:"#aaa",marginBottom:8,fontWeight:600}}>Quick login - staff accounts:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {[["ops.manager","Admin","#0d7a6e"],["nasru","Captain","#185FA5"],["frontdesk","View Only","#c9a84c"]].map(([u,label,color])=>(
              <button key={u} onClick={()=>{setUn(u);setPw("baros2026");}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+color,background:color+"10",color,fontSize:11,fontWeight:700,cursor:"pointer"}}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


function Dashboard({user,onNav}){
  const alerts=MAINT.filter(m=>m.status==="due-soon").length;
  const catC={transfer:"#0d7a6e",activity:"#c9a84c",ferry:"#7F77DD",supply:"#D85A30"};
  const rt=ROLES[user.role];
  return(
    <div>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:22}}>
        <div>
          <div style={{fontSize:12,color:"#aaa",marginBottom:4}}>Thursday 12 March 2026 - Maldives Time</div>
          <h1 style={{fontSize:26,fontWeight:800,color:"#0d1b2a",margin:0}}>Operations Dashboard</h1>
          <div style={{fontSize:12,color:"#aaa",marginTop:4}}>Logged in as <strong style={{color:"#0d7a6e"}}>{user.name}</strong> {rt&&<Bdg label={rt.label} bg={rt.bg} color={rt.color} style={{fontSize:11}}/>}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:28,fontWeight:800,color:"#0d7a6e",lineHeight:1}}>{new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit",timeZone:"Indian/Maldives"})}</div>
          <div style={{fontSize:11,color:"#aaa"}}>MVT (UTC+5)</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:18}}>
        {[{Icon:Navigation,label:"Trips Today",value:15,sub:"Active & scheduled",color:"#0d7a6e"},{Icon:Ship,label:"Fleet Size",value:"12",sub:"All operational",color:"#7F77DD"},{Icon:AlertTriangle,label:"Maint. Alerts",value:alerts,sub:"Needs attention",color:"#c9a84c"},{Icon:Users,label:"Staff On Duty",value:"17",sub:"2 off today",color:"#D4537E"},{Icon:Droplets,label:"Fuel YTD",value:"111K L",sub:"All vessels",color:"#185FA5"}].map(({Icon,label,value,sub,color},i)=>(
          <Card key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:38,height:38,borderRadius:9,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={17} color={color}/></div>
            <div><div style={{fontSize:11,color:"#aaa"}}>{label}</div><div style={{fontSize:20,fontWeight:700,color:"#0d1b2a",lineHeight:1.1}}>{value}</div><div style={{fontSize:11,color:"#bbb"}}>{sub}</div></div>
          </Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16}}>
        <Card>
          <Hdr title="Today - Quick Summary" action={can(user,"movement")?"Full Schedule ->":undefined} onAction={()=>onNav("movement")}/>
          {[{cat:"transfer",label:"Guest Transfers",count:5,detail:"AK74, OS21, EK658 + 1 VIP"},{cat:"activity",label:"Activities",count:6,detail:"Diving, Snorkelling, Sunset Cruise, Piano"},{cat:"ferry",label:"Staff Ferries",count:3,detail:"Xari - 07:00 / 16:15 / 22:30"},{cat:"supply",label:"Supply & Operations",count:2,detail:"Sea Cargo + Wet Garbage (Areena)"}].map((r,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<3?"1px solid #f4f2ed":"none"}}>
              <div style={{width:34,height:34,borderRadius:9,background:catC[r.cat]+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:10,height:10,borderRadius:"50%",background:catC[r.cat]}}></div></div>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:"#0d1b2a"}}>{r.label}</div><div style={{fontSize:12,color:"#aaa"}}>{r.detail}</div></div>
              <div style={{fontSize:22,fontWeight:800,color:catC[r.cat]}}>{r.count}</div>
            </div>
          ))}
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <Hdr title="Maintenance Alerts" action={can(user,"maintenance")?"View ->":undefined} onAction={()=>onNav("maintenance")}/>
            {MAINT.filter(m=>m.status==="due-soon").map((m,i,arr)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:i<arr.length-1?"1px solid #f4f2ed":"none"}}>
                <AlertTriangle size={13} color="#c2410c" style={{flexShrink:0,marginTop:2}}/>
                <div><div style={{fontWeight:600,fontSize:13,color:"#0d1b2a"}}>{m.boat}</div><div style={{fontSize:11,color:"#c2410c"}}>{m.task} - Due {m.due}</div></div>
              </div>
            ))}
          </Card>
          <Card>
            <Hdr title="Fleet Fuel"/>
            {FLEET.slice(0,6).map((b,i)=>(
              <div key={i} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                  <span style={{fontWeight:600,color:"#0d1b2a"}}>{b.name}</span>
                  <span style={{color:"#aaa"}}>{b.fuel}L</span>
                </div>
                <div style={{height:4,borderRadius:2,background:"#f0ede5"}}>
                  <div style={{height:"100%",borderRadius:2,background:b.fuel/b.fuelCap<0.3?"#ef4444":b.fuel/b.fuelCap<0.6?"#c9a84c":"#0d7a6e",width:Math.round(b.fuel/b.fuelCap*100)+"%"}}></div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Movement({user}){
  if(!can(user,"movement"))return <Locked name="Boat Movement"/>;
  const edit=can(user,"movement","edit");
  const [tab,setTab]=useState("today");
  const [date,setDate]=useState("2026-03-14");
  const [arrivals,setArrivals]=useState([{pax:4,flight:"EK659",time:"10:30",vip:false}]);
  const [deps,setDeps]=useState([{pax:6,flight:"AK75",time:"09:00",vip:false}]);
  const [excBk,setExcBk]=useState([]);
  const [diveBk,setDiveBk]=useState({singleTank:0,doubleTank:0,snorkelling:0});
  const [piano,setPiano]=useState({active:false,meal:"breakfast",pax:2});
  const [gen,setGen]=useState(null);
  const fRef=useRef();
  const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dow=days[new Date(date).getDay()];
  const catC={transfer:"#0d7a6e",activity:"#c9a84c",ferry:"#7F77DD",supply:"#D85A30"};
  const catL={transfer:"Guest Transfers",activity:"Activities & Excursions",ferry:"Staff Ferries",supply:"Supply & Operations"};
  const renderTbl=function(data){
    return ["transfer","activity","ferry","supply"].map(function(cat){
      const items=data.filter(function(m){return m.cat===cat;});
      if(!items.length)return null;
      return(
        <Card key={cat} style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{width:4,height:18,borderRadius:2,background:catC[cat]}}></div>
            <span style={{fontWeight:700,fontSize:14,color:"#0d1b2a"}}>{catL[cat]}</span>
            <Bdg label={items.length} bg={catC[cat]+"18"} color={catC[cat]}/>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:"1px solid #f4f2ed"}}>{["Time","Vessel","Type","Details","Captain","Status"].map(function(h){return <th key={h} style={{textAlign:"left",padding:"5px 10px",color:"#aaa",fontSize:11,fontWeight:600}}>{h}</th>;})}</tr></thead>
              <tbody>
                {items.map(function(m,i){
                  return(
                    <tr key={i} style={{borderBottom:"1px solid #f8f6f0",background:m.vip?"#fffbeb":"transparent"}}>
                      <td style={{padding:"9px 10px",fontWeight:700,color:"#0d1b2a",whiteSpace:"nowrap"}}>{m.time}{m.vip&&<Star size={11} color="#c9a84c" fill="#c9a84c" style={{verticalAlign:"middle",marginLeft:4}}/>}</td>
                      <td style={{padding:"9px 10px",fontWeight:600,color:"#0d1b2a"}}>{m.boat}</td>
                      <td style={{padding:"9px 10px",color:"#666"}}>{m.type}</td>
                      <td style={{padding:"9px 10px",color:"#888",fontSize:12,maxWidth:200}}><span style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.details}</span></td>
                      <td style={{padding:"9px 10px",fontWeight:600,color:"#555"}}>{m.captain}</td>
                      <td style={{padding:"9px 10px"}}><StsBdg status={m.status}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      );
    });
  };
  return(
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
        <div><h1 style={{fontSize:24,fontWeight:800,color:"#0d1b2a",margin:0}}>Boat Movement</h1><div style={{fontSize:13,color:"#aaa",marginTop:3}}>Daily schedule - Smart scheduler</div></div>
        <div style={{display:"flex",gap:8}}>
          {can(user,"movement","export")&&<Btn variant="secondary"><Download size={14}/>Export</Btn>}
          {edit&&<Btn onClick={()=>setTab("scheduler")}><Zap size={14}/>Generate Next Day</Btn>}
        </div>
      </div>
      {!edit&&<ViewOnly/>}
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        <button onClick={()=>setTab("today")} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #e8e4dc",background:tab==="today"?"#0d1b2a":"#fff",color:tab==="today"?"#fff":"#666",fontSize:13,cursor:"pointer",fontWeight:600}}>Today - 12 Mar</button>
        {edit&&<button onClick={()=>setTab("scheduler")} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #e8e4dc",background:tab==="scheduler"?"#0d1b2a":"#fff",color:tab==="scheduler"?"#fff":"#666",fontSize:13,cursor:"pointer",fontWeight:600}}>Smart Scheduler</button>}
        {edit&&gen&&<button onClick={()=>setTab("generated")} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #e8e4dc",background:tab==="generated"?"#0d1b2a":"#fff",color:tab==="generated"?"#fff":"#666",fontSize:13,cursor:"pointer",fontWeight:600}}>Generated ({gen.length})</button>}
      </div>
      {tab==="today"&&renderTbl(TODAY)}
      {tab==="scheduler"&&edit&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div>
            <Card style={{marginBottom:14}}>
              <Hdr title="Step 1 - Upload Arrival/Departure List"/>
              <div style={{border:"2px dashed #d0cdc5",borderRadius:10,padding:28,textAlign:"center",cursor:"pointer",background:"#fafaf8",marginBottom:12}} onClick={()=>fRef.current&&fRef.current.click()}>
                <Upload size={30} color="#bbb" style={{display:"block",margin:"0 auto 8px"}}/>
                <div style={{color:"#888",fontSize:13}}>Upload CSV or XLSX file</div>
              </div>
              <input ref={fRef} type="file" accept=".csv,.xlsx" style={{display:"none"}}/>
              <div style={{marginTop:12}}>
                <label style={{fontSize:12,color:"#888",display:"block",marginBottom:5}}>Schedule Date</label>
                <input type="date" value={date} onChange={function(e){setDate(e.target.value);}} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e0ddd5",fontSize:13,boxSizing:"border-box"}}/>
                <div style={{fontSize:11,color:"#0d7a6e",marginTop:3}}>Day of week: {dow}</div>
              </div>
            </Card>
            <Card style={{marginBottom:14}}>
              <Hdr title="Arrivals" action="+ Add" onAction={()=>setArrivals(function(a){return [...a,{pax:2,flight:"",time:"10:00",vip:false}];})}/>
              {arrivals.map(function(a,i){
                return(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 60px auto auto",gap:6,marginBottom:8,alignItems:"center"}}>
                    <input placeholder="Flight" value={a.flight} onChange={function(e){const n=[...arrivals];n[i]={...n[i],flight:e.target.value};setArrivals(n);}} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #e0ddd5",fontSize:12}}/>
                    <input type="time" value={a.time} onChange={function(e){const n=[...arrivals];n[i]={...n[i],time:e.target.value};setArrivals(n);}} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #e0ddd5",fontSize:12}}/>
                    <input type="number" placeholder="PAX" value={a.pax} onChange={function(e){const n=[...arrivals];n[i]={...n[i],pax:parseInt(e.target.value)||1};setArrivals(n);}} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #e0ddd5",fontSize:12}}/>
                    <label style={{fontSize:11,display:"flex",alignItems:"center",gap:4,color:"#c9a84c",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}><input type="checkbox" checked={a.vip} onChange={function(e){const n=[...arrivals];n[i]={...n[i],vip:e.target.checked};setArrivals(n);}}/> VIP</label>
                    <button onClick={()=>setArrivals(function(a2){return a2.filter(function(_,j){return j!==i;});})} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:18,lineHeight:1}}>x</button>
                  </div>
                );
              })}
              {arrivals.length===0&&<div style={{fontSize:12,color:"#bbb",textAlign:"center",padding:8}}>No arrivals added</div>}
            </Card>
            <Card>
              <Hdr title="Departures" action="+ Add" onAction={()=>setDeps(function(d){return [...d,{pax:2,flight:"",time:"09:00",vip:false}];})}/>
              {deps.map(function(d,i){
                return(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 60px auto auto",gap:6,marginBottom:8,alignItems:"center"}}>
                    <input placeholder="Flight" value={d.flight} onChange={function(e){const n=[...deps];n[i]={...n[i],flight:e.target.value};setDeps(n);}} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #e0ddd5",fontSize:12}}/>
                    <input type="time" value={d.time} onChange={function(e){const n=[...deps];n[i]={...n[i],time:e.target.value};setDeps(n);}} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #e0ddd5",fontSize:12}}/>
                    <input type="number" placeholder="PAX" value={d.pax} onChange={function(e){const n=[...deps];n[i]={...n[i],pax:parseInt(e.target.value)||1};setDeps(n);}} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #e0ddd5",fontSize:12}}/>
                    <label style={{fontSize:11,display:"flex",alignItems:"center",gap:4,color:"#c9a84c",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}><input type="checkbox" checked={d.vip} onChange={function(e){const n=[...deps];n[i]={...n[i],vip:e.target.checked};setDeps(n);}}/> VIP</label>
                    <button onClick={()=>setDeps(function(d2){return d2.filter(function(_,j){return j!==i;});})} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:18,lineHeight:1}}>x</button>
                  </div>
                );
              })}
              {deps.length===0&&<div style={{fontSize:12,color:"#bbb",textAlign:"center",padding:8}}>No departures added</div>}
            </Card>
          </div>
          <div>
            <Card style={{marginBottom:14}}>
              <Hdr title="Step 2 - Dive & Activity Bookings"/>
              {[["singleTank","Diving - Single Tank"],["doubleTank","Diving - Double Tank"],["snorkelling","Snorkelling Safari"]].map(function(pair){var key=pair[0],label=pair[1];
                return(
                  <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f4f2ed"}}>
                    <span style={{fontSize:13,color:"#555"}}>{label}</span>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <button onClick={()=>setDiveBk(function(d){return {...d,[key]:Math.max(0,d[key]-1)};})} style={{width:28,height:28,borderRadius:6,border:"1px solid #e0ddd5",background:"#fff",cursor:"pointer",fontSize:16}}>-</button>
                      <span style={{fontWeight:700,fontSize:15,color:"#0d1b2a",minWidth:20,textAlign:"center"}}>{diveBk[key]}</span>
                      <button onClick={()=>setDiveBk(function(d){return {...d,[key]:d[key]+1};})} style={{width:28,height:28,borderRadius:6,border:"none",background:"#0d7a6e",cursor:"pointer",fontSize:16,color:"#fff"}}>+</button>
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card style={{marginBottom:14}}>
              <Hdr title={"Step 3 - Excursion Bookings ("+dow+")"}/>
              {EXCURSIONS.filter(function(e){return e.day===dow;}).length===0
                ?<div style={{fontSize:12,color:"#bbb",padding:8}}>No excursions on {dow}</div>
                :EXCURSIONS.filter(function(e){return e.day===dow;}).map(function(e,i){
                  const booked=excBk.some(function(b){return b.name===e.name;});
                  return(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f4f2ed"}}>
                      <input type="checkbox" checked={booked} onChange={function(v){if(v.target.checked)setExcBk(function(b){return [...b,{name:e.name,pax:4}];});else setExcBk(function(b){return b.filter(function(x){return x.name!==e.name;});});}}/>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#0d1b2a"}}>{e.name}</div><div style={{fontSize:11,color:"#aaa"}}>{e.time}</div></div>
                    </div>
                  );
                })
              }
            </Card>
            <Card style={{marginBottom:14}}>
              <Hdr title="Step 4 - Piano Booking"/>
              <label style={{fontSize:13,display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontWeight:600,color:"#0d1b2a",marginBottom:piano.active?12:0}}>
                <input type="checkbox" checked={piano.active} onChange={function(e){setPiano(function(p){return {...p,active:e.target.checked};});}}/> Piano booking confirmed
              </label>
              {piano.active&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <select value={piano.meal} onChange={function(e){setPiano(function(p){return {...p,meal:e.target.value};});}} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #e0ddd5",fontSize:13}}>
                    <option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option>
                  </select>
                  <input type="number" value={piano.pax} min={1} onChange={function(e){setPiano(function(p){return {...p,pax:parseInt(e.target.value)||2};});}} style={{padding:"7px 8px",borderRadius:7,border:"1px solid #e0ddd5",fontSize:13}}/>
                </div>
              )}
            </Card>
            <Btn style={{width:"100%",justifyContent:"center"}} onClick={function(){setGen(buildSched(arrivals,deps,excBk,diveBk,piano,date));setTab("generated");}}>
              <Zap size={14}/> Generate Schedule for {date}
            </Btn>
          </div>
        </div>
      )}
      {tab==="generated"&&gen&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,padding:"12px 16px",background:"#f0fdf4",borderRadius:10,border:"1px solid #bbf7d0"}}>
            <CheckCircle size={18} color="#059669"/>
            <div style={{flex:1}}><div style={{fontWeight:700,color:"#065f46"}}>Schedule generated for {date} ({dow})</div><div style={{fontSize:12,color:"#059669"}}>{gen.length} movements - VIP priority applied</div></div>
          </div>
          {renderTbl(gen)}
        </div>
      )}
    </div>
  );
}


function FleetPage({user}){
  if(!can(user,"fleet"))return <Locked name="Fleet Profiles"/>;
  const [sel,setSel]=useState(null);
  const [tab,setTab]=useState("specs");
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:800,color:"#0d1b2a",margin:0}}>Fleet Profiles</h1>
        {can(user,"fleet","edit")&&<Btn><Plus size={14}/>Add Vessel</Btn>}
      </div>
      {!can(user,"fleet","edit")&&<ViewOnly/>}
      <Card style={{marginBottom:16}}><FuelCapacityTable user={user}/></Card>
      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16}}>
        <div>
          {FLEET.map(function(b,i){
            return(
              <div key={i} onClick={()=>setSel(b)} style={{padding:"11px 13px",borderRadius:10,border:"1px solid "+(sel&&sel.id===b.id?b.color:"#e8e4dc"),background:sel&&sel.id===b.id?b.color+"08":"#fff",cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:9,background:b.color+"20",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Anchor size={15} color={b.color}/></div>
                <div style={{flex:1}}><div style={{fontWeight:700,color:"#0d1b2a",fontSize:13}}>{b.name}</div><div style={{fontSize:11,color:"#aaa"}}>{b.type}</div></div>
                <div style={{textAlign:"right",fontSize:11}}><div style={{color:"#aaa"}}>Fuel</div><div style={{fontWeight:700,color:b.fuel/b.fuelCap<0.3?"#dc2626":"#0d7a6e"}}>{Math.round(b.fuel/b.fuelCap*100)}%</div></div>
              </div>
            );
          })}
        </div>
        {sel?(
          <Card>
            <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:14,paddingBottom:14,borderBottom:"1px solid #e8e4dc"}}>
              <div style={{width:52,height:52,borderRadius:14,background:sel.color+"20",display:"flex",alignItems:"center",justifyContent:"center"}}><Anchor size={24} color={sel.color}/></div>
              <div><h2 style={{fontSize:20,fontWeight:800,color:"#0d1b2a",margin:0}}>{sel.name}</h2><div style={{fontSize:12,color:"#aaa"}}>{sel.type} - Priority #{sel.pri}</div></div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              {["specs","fuel","capabilities"].map(function(t){return <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 14px",borderRadius:8,border:"1px solid #e8e4dc",background:tab===t?"#0d1b2a":"#fff",color:tab===t?"#fff":"#666",fontSize:12,cursor:"pointer",fontWeight:600,textTransform:"capitalize"}}>{t}</button>;})}
            </div>
            {tab==="specs"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["Fuel Capacity",sel.fuelCap.toLocaleString()+" L"],["Consumption/hr",sel.cons+" L/hr"],["Passenger Cap",sel.pax+" PAX"],["Priority","#"+sel.pri],["Captain",sel.captain]].map(function(item,i){var k=item[0],v=item[1];
                  return <div key={i} style={{padding:"12px",background:"#f8f6f0",borderRadius:8}}><div style={{fontSize:11,color:"#aaa"}}>{k}</div><div style={{fontSize:15,fontWeight:700,color:"#0d1b2a"}}>{v}</div></div>;
                })}
              </div>
            )}
            {tab==="fuel"&&(
              <div>
                <div style={{marginBottom:8,height:10,borderRadius:5,background:"#f0ede5"}}><div style={{height:"100%",borderRadius:5,background:sel.fuel/sel.fuelCap<0.3?"#ef4444":"#0d7a6e",width:Math.round(sel.fuel/sel.fuelCap*100)+"%"}}></div></div>
                <div style={{fontSize:13,color:"#888"}}>{sel.fuel}L remaining of {sel.fuelCap}L - ~{Math.round(sel.fuel/sel.cons)} hrs range</div>
              </div>
            )}
            {tab==="capabilities"&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {Object.entries(BOAT_CAPS).filter(function(entry){return entry[1].includes(sel.name);}).map(function(entry,i){var key=entry[0];
                  return <span key={i} style={{padding:"5px 12px",background:"#0d7a6e12",color:"#0d7a6e",borderRadius:8,fontSize:12,fontWeight:600}}>{key}</span>;
                })}
              </div>
            )}
          </Card>
        ):(
          <Card style={{display:"flex",alignItems:"center",justifyContent:"center",color:"#ccc",minHeight:300}}>Select a vessel to view details</Card>
        )}
      </div>
    </div>
  );
}

function ActivitiesPage({user}){
  if(!can(user,"activities"))return <Locked name="Activities"/>;
  const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const today=days[new Date().getDay()];
  const [activeDay,setActiveDay]=useState(today);
  const [view,setView]=useState("excursions");
  const typeC={sunset:"#c9a84c",fishing:"#185FA5",dolphin:"#0d7a6e",excursion:"#7F77DD",nooma:"#1D9E75",snorkelling:"#0369a1",presentation:"#D85A30",walk:"#059669"};
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:800,color:"#0d1b2a",margin:0}}>Activities & Excursions</h1>
        <div style={{display:"flex",gap:8}}>
          {["excursions","marine"].map(function(v){return <button key={v} onClick={()=>setView(v)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #e8e4dc",background:view===v?"#0d1b2a":"#fff",color:view===v?"#fff":"#666",fontSize:13,cursor:"pointer",fontWeight:600,textTransform:"capitalize"}}>{v}</button>;})}
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18,overflowX:"auto",paddingBottom:4}}>
        {days.map(function(d){return <button key={d} onClick={()=>setActiveDay(d)} style={{padding:"7px 16px",borderRadius:10,border:"1px solid #e8e4dc",whiteSpace:"nowrap",background:activeDay===d?"#c9a84c":d===today?"#fff7e6":"#fff",color:activeDay===d?"#fff":d===today?"#92400e":"#555",fontSize:13,cursor:"pointer",fontWeight:activeDay===d||d===today?700:400}}>{d}{d===today?" - Today":""}</button>;})}
      </div>
      {view==="excursions"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {EXCURSIONS.filter(function(e){return e.day===activeDay;}).length===0
            ?<Card style={{textAlign:"center",padding:32,color:"#bbb",gridColumn:"1/-1"}}>No excursions on {activeDay}</Card>
            :EXCURSIONS.filter(function(e){return e.day===activeDay;}).map(function(e,i){
              return(
                <Card key={i} style={{borderLeft:"4px solid "+(typeC[e.type]||"#c9a84c")}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#0d1b2a",marginBottom:8}}>{e.name}</div>
                  <div style={{fontSize:12,color:"#888"}}>Time: {e.time}  |  Pax: {e.pax}  |  Boat: {e.boat}</div>
                </Card>
              );
            })
          }
        </div>
      )}
      {view==="marine"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
          {MARINE.filter(function(e){return e.day===activeDay;}).length===0
            ?<Card style={{textAlign:"center",padding:32,color:"#bbb",gridColumn:"1/-1"}}>No marine activities on {activeDay}</Card>
            :MARINE.filter(function(e){return e.day===activeDay;}).map(function(e,i){
              return(
                <Card key={i} style={{borderLeft:"4px solid "+(typeC[e.type]||"#0d7a6e")}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#0d1b2a",marginBottom:6}}>{e.name}</div>
                  <div style={{fontSize:12,color:"#888"}}>Time: {e.time}</div>
                </Card>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

function FuelLogPage({user}){
  if(!can(user,"fuel"))return <Locked name="Fuel Log"/>;
  const edit=can(user,"fuel","edit");
  const [logs,setLogs]=useState(INIT_FUEL);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({date:new Date().toISOString().split("T")[0],custName:"Transport Dept",desc:"",src:"Patrol - FSM Hulhumale\'",boat:"",ltrs:"",start:"",end:"",receipt:null});
  const [preview,setPreview]=useState(null);
  const fRef=useRef();
  const consumed=(form.end&&form.start)?Math.max(0,parseInt(form.end||"0")-parseInt(form.start||"0")):null;
  const save=function(){
    if(!form.boat||!form.ltrs)return;
    setLogs(function(l){return [{...form,id:Date.now(),ltrs:parseInt(form.ltrs),start:parseInt(form.start)||0,end:parseInt(form.end)||0},...l];});
    setForm({date:new Date().toISOString().split("T")[0],custName:"Transport Dept",desc:"",src:"Patrol - FSM Hulhumale\'",boat:"",ltrs:"",start:"",end:"",receipt:null});
    setPreview(null);setShowForm(false);
  };
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div><h1 style={{fontSize:24,fontWeight:800,color:"#0d1b2a",margin:0}}>Fuel Log</h1><div style={{fontSize:13,color:"#aaa",marginTop:3}}>3 fuel types - Receipt upload - Meter readings</div></div>
        {edit&&<Btn onClick={function(){setShowForm(function(s){return !s;});}}>  <Plus size={14}/>New Entry</Btn>}
      </div>
      {!edit&&<ViewOnly/>}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {FUEL_SRCS.map(function(s){return <Bdg key={s} label={s} bg={FUEL_CLR[s]+"18"} color={FUEL_CLR[s]} style={{padding:"5px 12px",borderRadius:8,fontSize:12}}/>;  })}
      </div>
      {showForm&&edit&&(
        <Card style={{marginBottom:18,border:"2px solid #0d7a6e"}}>
          <div style={{fontWeight:700,fontSize:15,color:"#0d1b2a",marginBottom:14}}>New Fuel Entry</div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,color:"#888",display:"block",marginBottom:6,fontWeight:600}}>Select Vessel *</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {FLEET.map(function(b){
                return(
                  <button key={b.name} onClick={function(){setForm(function(f){return {...f,boat:b.name};});}} style={{padding:"6px 12px",borderRadius:8,border:"2px solid "+(form.boat===b.name?b.color:"#e0ddd5"),background:form.boat===b.name?b.color+"18":"#fff",color:form.boat===b.name?b.color:"#0d1b2a",fontSize:12,cursor:"pointer",fontWeight:600}}>
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>
          {form.boat&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Date *</label><input type="date" value={form.date} onChange={function(e){setForm(function(f){return {...f,date:e.target.value};});}} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e0ddd5",fontSize:13,boxSizing:"border-box"}}/></div>
              <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Delivered From *</label>
                <select value={form.src} onChange={function(e){setForm(function(f){return {...f,src:e.target.value};});}} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e0ddd5",fontSize:13,boxSizing:"border-box"}}>
                  {FUEL_SRCS.map(function(s){return <option key={s} value={s}>{s}</option>;})}
                </select>
              </div>
              <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Customer Name</label><input value={form.custName} onChange={function(e){setForm(function(f){return {...f,custName:e.target.value};});}} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e0ddd5",fontSize:13,boxSizing:"border-box"}}/></div>
              <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Description</label><input value={form.desc} onChange={function(e){setForm(function(f){return {...f,desc:e.target.value};});}} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e0ddd5",fontSize:13,boxSizing:"border-box"}}/></div>
              <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Litres *</label><input type="number" value={form.ltrs} onChange={function(e){setForm(function(f){return {...f,ltrs:e.target.value};});}} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e0ddd5",fontSize:13,boxSizing:"border-box"}}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Start</label><input type="number" value={form.start} onChange={function(e){setForm(function(f){return {...f,start:e.target.value};});}} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e0ddd5",fontSize:13,boxSizing:"border-box"}}/></div>
                <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>End</label><input type="number" value={form.end} onChange={function(e){setForm(function(f){return {...f,end:e.target.value};});}} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e0ddd5",fontSize:13,boxSizing:"border-box"}}/></div>
              </div>
              {consumed!==null&&consumed>0&&(<div style={{gridColumn:"1/-1",padding:"10px 14px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,fontSize:13,display:"flex",justifyContent:"space-between"}}><span style={{color:"#065f46"}}>Meter reading confirms</span><span style={{fontWeight:700,color:"#065f46"}}>{consumed.toLocaleString()} L</span></div>)}
              <div style={{gridColumn:"1/-1"}}>
                <label style={{fontSize:12,color:"#888",display:"block",marginBottom:5}}>Upload Receipt</label>
                <div style={{border:"2px dashed #d0cdc5",borderRadius:8,padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}} onClick={function(){fRef.current&&fRef.current.click();}}>
                  <Camera size={22} color="#bbb"/>
                  <div style={{fontSize:12,color:"#aaa",flex:1}}>{form.receipt||"Tap to upload photo / PDF"}</div>
                  {preview&&<img src={preview} alt="receipt" style={{width:56,height:56,objectFit:"cover",borderRadius:8}}/>}
                </div>
                <input ref={fRef} type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={function(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=function(ev){setPreview(ev.target.result);};r.readAsDataURL(f);setForm(function(x){return {...x,receipt:f.name};});}}/>
              </div>
              <div style={{gridColumn:"1/-1",display:"flex",gap:8,justifyContent:"flex-end"}}>
                <Btn variant="secondary" onClick={function(){setShowForm(false);}}>Cancel</Btn>
                <Btn onClick={save}><Check size={14}/>Save Entry</Btn>
              </div>
            </div>
          )}
        </Card>
      )}
      <Card>
        <Hdr title="Fuel Log Entries"/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{borderBottom:"1px solid #f4f2ed"}}>{["Date","Vessel","Customer","Description","Delivered From","Ltrs","Start","End","Receipt"].map(function(h){return <th key={h} style={{textAlign:"left",padding:"7px 10px",color:"#aaa",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>;})}</tr></thead>
            <tbody>
              {logs.map(function(l,i){
                return(
                  <tr key={i} style={{borderBottom:"1px solid #f8f6f0",background:i%2===0?"transparent":"#fafaf8"}}>
                    <td style={{padding:"9px 10px",color:"#888"}}>{l.date}</td>
                    <td style={{padding:"9px 10px",fontWeight:700,color:"#0d1b2a"}}>{l.boat}</td>
                    <td style={{padding:"9px 10px",color:"#555"}}>{l.custName}</td>
                    <td style={{padding:"9px 10px",color:"#777",fontSize:12}}>{l.desc}</td>
                    <td style={{padding:"9px 10px"}}><Bdg label={l.src} bg={FUEL_CLR[l.src]+"18"} color={FUEL_CLR[l.src]||"#888"} style={{fontSize:9,borderRadius:5}}/></td>
                    <td style={{padding:"9px 10px",fontWeight:700,color:"#0d7a6e"}}>{(l.ltrs||0).toLocaleString()}</td>
                    <td style={{padding:"9px 10px",color:"#888"}}>{(l.start||0).toLocaleString()}</td>
                    <td style={{padding:"9px 10px",color:"#888"}}>{(l.end||0).toLocaleString()}</td>
                    <td style={{padding:"9px 10px"}}>{l.receipt?<Bdg label="Uploaded" bg="#d1fae5" color="#065f46" style={{fontSize:10}}/>:<Bdg label="None" bg="#f3f4f6" color="#aaa" style={{fontSize:10}}/>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card style={{marginTop:16}}>
        <Hdr title="Fuel Balance — All 12 Vessels"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
          {FLEET.map(function(b){
            var boatLogs=logs.filter(function(l){return l.boat===b.name;});
            var totalLoaded=boatLogs.reduce(function(sum,l){return sum+(l.ltrs||0);},0);
            var lastEntry=boatLogs[0];
            var pct=Math.min(100,Math.round(b.fuel/b.fuelCap*100));
            var barColor=pct<30?"#ef4444":pct<60?"#c9a84c":"#0d7a6e";
            return(
              <div key={b.id} style={{padding:"12px 14px",borderRadius:10,border:"1px solid #e8e4dc",background:"#fff"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:b.color,flexShrink:0}}></div>
                  <span style={{fontWeight:700,color:"#0d1b2a",fontSize:14,flex:1}}>{b.name}</span>
                  <span style={{fontSize:11,color:"#aaa"}}>{b.type}</span>
                </div>
                <div style={{height:8,borderRadius:4,background:"#f0ede5",marginBottom:6}}>
                  <div style={{height:"100%",borderRadius:4,background:barColor,width:pct+"%",transition:"width 0.4s"}}></div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                  <span style={{color:"#888"}}>Current</span>
                  <span style={{fontWeight:700,color:barColor}}>{b.fuel}L / {b.fuelCap}L ({pct}%)</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#aaa",marginBottom:2}}>
                  <span>Total loaded</span>
                  <span style={{fontWeight:600,color:"#0d1b2a"}}>{totalLoaded.toLocaleString()} L</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#aaa"}}>
                  <span>Last refuel</span>
                  <span style={{fontWeight:600,color:"#555"}}>{lastEntry?lastEntry.date:"—"}</span>
                </div>
                {pct<30&&<div style={{marginTop:6,fontSize:10,fontWeight:700,color:"#ef4444",padding:"3px 7px",background:"#fee2e2",borderRadius:5}}>LOW — Refuel needed</div>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}


function DutyRosterPage({user}){
  if(!can(user,"duty"))return <Locked name="Duty Roster"/>;
  const edit=can(user,"duty","edit");
  const [tab,setTab]=useState("attendance");
  const [year,setYear]=useState(2026);
  const [month,setMonth]=useState(2);
  const [att,setAtt]=useState({});
  const [requests,setRequests]=useState([]);
  const [minStaff,setMinStaff]=useState({normal:{cap:2,crew:3},busy:{cap:1,crew:2}});
  const [editMin,setEditMin]=useState(false);
  const [offForm,setOffForm]=useState({staffId:"",reason:"",date:""});
  const days=new Date(year,month+1,0).getDate();
  const firstDay=new Date(year,month,1).getDay();
  const mName=new Date(year,month,1).toLocaleString("en",{month:"long"});
  const getCode=function(sid,d){return att[sid+"-"+d]||"P";};
  const setCode=function(sid,d,c){setAtt(function(a){const n={...a};n[sid+"-"+d]=c;return n;});};
  const canGiveOff=function(sid,d,code){
    if(code==="P")return{ok:true,reason:""};
    const p=ALL_STAFF.find(function(s){return s.id===sid;});
    const isCap=p&&p.role==="Captain";
    const othersOff=ALL_STAFF.filter(function(s){
      if(s.id===sid)return false;
      if(isCap!==(s.role==="Captain"))return false;
      return (att[s.id+"-"+d]||"P")!=="P";
    }).length;
    const max=isCap?minStaff.normal.cap:minStaff.normal.crew;
    if(othersOff>=max)return{ok:false,reason:"Max "+max+" "+(isCap?"captains":"crew")+" off at once"};
    return{ok:true,reason:"Minimum staffing maintained"};
  };
  const prevMon=function(){if(month===0){setMonth(11);setYear(function(y){return y-1;});}else setMonth(function(m){return m-1;});};
  const nextMon=function(){if(month===11){setMonth(0);setYear(function(y){return y+1;});}else setMonth(function(m){return m+1;});};

  const checkOff=offForm.staffId&&offForm.date&&offForm.reason?canGiveOff(parseInt(offForm.staffId),parseInt(offForm.date.split("-")[2]),offForm.reason):null;

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div><h1 style={{fontSize:24,fontWeight:800,color:"#0d1b2a",margin:0}}>Duty Roster</h1><div style={{fontSize:13,color:"#aaa",marginTop:3}}>Attendance - Off-day management - Min staffing</div></div>
        {can(user,"duty","export")&&<Btn variant="secondary"><Download size={14}/>Export</Btn>}
      </div>
      {!edit&&<ViewOnly/>}
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        {[["attendance","Attendance"],["offday","Off Day Requests"],["minstaffing","Min Staffing"]].map(function(pair){var id=pair[0],label=pair[1];
          const pend=requests.filter(function(r){return r.status==="pending";}).length;
          return(
            <button key={id} onClick={()=>setTab(id)} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #e8e4dc",background:tab===id?"#0d1b2a":"#fff",color:tab===id?"#fff":"#666",fontSize:13,cursor:"pointer",fontWeight:600}}>
              {label}{id==="offday"&&pend>0&&<span style={{marginLeft:6,background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10}}>{pend}</span>}
            </button>
          );
        })}
      </div>

      {tab==="attendance"&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <button onClick={prevMon} style={{width:30,height:30,borderRadius:7,border:"1px solid #e0ddd5",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronLeft size={14}/></button>
            <div style={{fontWeight:700,fontSize:15,color:"#0d1b2a",minWidth:150,textAlign:"center"}}>{mName} {year}</div>
            <button onClick={nextMon} style={{width:30,height:30,borderRadius:7,border:"1px solid #e0ddd5",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronRight size={14}/></button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
            {ATTEND.map(function(a){return <Bdg key={a.code} label={a.code+" - "+a.label} bg={a.bg} color={a.color} style={{fontSize:11,borderRadius:6}}/>;  })}
          </div>
          {[{title:"Captains",list:CAPTAINS},{title:"Crew",list:CREW}].map(function({title,list}){
            return(
              <Card key={title} style={{marginBottom:14,overflowX:"auto"}}>
                <div style={{fontWeight:700,fontSize:14,color:"#0d1b2a",marginBottom:10}}>{title}</div>
                <table style={{borderCollapse:"collapse",fontSize:12,minWidth:900}}>
                  <thead><tr style={{borderBottom:"1px solid #f4f2ed"}}>
                    <th style={{textAlign:"left",padding:"5px 10px",color:"#aaa",fontSize:11,fontWeight:600,minWidth:90}}>Name</th>
                    {Array.from({length:days},function(_,i){return <th key={i} style={{padding:"4px 2px",color:"#aaa",fontSize:10,fontWeight:600,textAlign:"center",minWidth:30}}>{i+1}</th>;  })}
                  </tr></thead>
                  <tbody>
                    {list.map(function(person){
                      return(
                        <tr key={person.id} style={{borderBottom:"1px solid #f8f6f0"}}>
                          <td style={{padding:"6px 10px",fontWeight:700,color:"#0d1b2a",whiteSpace:"nowrap"}}>{person.name}</td>
                          {Array.from({length:days},function(_,di){
                            const d=di+1;
                            const code=getCode(person.id,d);
                            const ac=ATTEND.find(function(a){return a.code===code;})||ATTEND[0];
                            const chk=code!=="P"?canGiveOff(person.id,d,code):{ok:true};
                            return(
                              <td key={di} style={{padding:"3px 2px",textAlign:"center"}}>
                                {edit?(
                                  <select value={code} onChange={function(e){setCode(person.id,d,e.target.value);}} title={chk.ok?ac.label:"Warning: "+chk.reason}
                                    style={{width:34,padding:"2px 0",borderRadius:5,border:"1px solid "+(chk.ok?ac.color:"#ef4444"),background:chk.ok?ac.bg:"#fee2e2",color:chk.ok?ac.color:"#991b1b",fontSize:10,fontWeight:700,cursor:"pointer",appearance:"none",textAlign:"center"}}>
                                    {ATTEND.map(function(a){return <option key={a.code} value={a.code}>{a.code}</option>;  })}
                                  </select>
                                ):(
                                  <Bdg label={code} bg={ac.bg} color={ac.color} style={{fontSize:9,padding:"1px 4px"}}/>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            );
          })}
        </div>
      )}

      {tab==="offday"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:16}}>
          <Card>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <button onClick={prevMon} style={{width:28,height:28,borderRadius:7,border:"1px solid #e0ddd5",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronLeft size={13}/></button>
              <div style={{fontWeight:700,flex:1,textAlign:"center",fontSize:14,color:"#0d1b2a"}}>{mName} {year}</div>
              <button onClick={nextMon} style={{width:28,height:28,borderRadius:7,border:"1px solid #e0ddd5",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronRight size={13}/></button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(function(d){return <div key={d} style={{textAlign:"center",fontSize:10,color:"#aaa",fontWeight:600,padding:"3px 0"}}>{d}</div>;  })}
              {Array.from({length:firstDay},function(_,i){return <div key={"e"+i}/>;  })}
              {Array.from({length:days},function(_,i){
                const d=i+1;
                const reqs=requests.filter(function(r){return parseInt(r.date&&r.date.split("-")[2])===d&&parseInt(r.date&&r.date.split("-")[1])-1===month;});
                const capOff=reqs.filter(function(r){const s=ALL_STAFF.find(function(s2){return s2.id===r.staffId;});return s&&s.role==="Captain";}).length;
                const crewOff=reqs.filter(function(r){const s=ALL_STAFF.find(function(s2){return s2.id===r.staffId;});return s&&s.role==="Crew";}).length;
                const over=capOff>minStaff.normal.cap||crewOff>minStaff.normal.crew;
                const at=capOff===minStaff.normal.cap||crewOff===minStaff.normal.crew;
                return(
                  <div key={d} style={{textAlign:"center",padding:"7px 2px",borderRadius:7,cursor:"pointer",border:"1px solid "+(over?"#ef4444":at?"#c9a84c":"#f0ede5"),background:over?"#fee2e2":at?"#fef9c3":"#fff"}}>
                    <div style={{fontSize:13,color:"#0d1b2a"}}>{d}</div>
                    {reqs.length>0&&<div style={{fontSize:9,color:over?"#ef4444":"#c9a84c",fontWeight:700}}>{reqs.length} off</div>}
                  </div>
                );
              })}
            </div>
          </Card>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {edit&&(
              <Card>
                <Hdr title="New Off-Day Request"/>
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:12,color:"#888",display:"block",marginBottom:5}}>Staff Member</label>
                  <select value={offForm.staffId} onChange={function(e){setOffForm(function(f){return {...f,staffId:e.target.value};});}} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e0ddd5",fontSize:13,boxSizing:"border-box"}}>
                    <option value="">Select staff...</option>
                    <optgroup label="Captains">{CAPTAINS.map(function(c){return <option key={c.id} value={c.id}>{c.name}</option>;  })}</optgroup>
                    <optgroup label="Crew">{CREW.map(function(c){return <option key={c.id} value={c.id}>{c.name}</option>;  })}</optgroup>
                  </select>
                </div>
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:12,color:"#888",display:"block",marginBottom:5}}>Date</label>
                  <input type="date" value={offForm.date} onChange={function(e){setOffForm(function(f){return {...f,date:e.target.value};});}} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e0ddd5",fontSize:13,boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:12,color:"#888",display:"block",marginBottom:5}}>Leave Type</label>
                  <select value={offForm.reason} onChange={function(e){setOffForm(function(f){return {...f,reason:e.target.value};});}} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e0ddd5",fontSize:13,boxSizing:"border-box"}}>
                    <option value="">Select type...</option>
                    {ATTEND.filter(function(a){return a.code!=="P";}).map(function(a){return <option key={a.code} value={a.code}>{a.code} - {a.label}</option>;  })}
                  </select>
                </div>
                {checkOff&&(
                  <div style={{padding:"10px 12px",borderRadius:8,background:checkOff.ok?"#f0fdf4":"#fee2e2",border:"1px solid "+(checkOff.ok?"#bbf7d0":"#fca5a5"),marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:700,fontSize:13,color:checkOff.ok?"#065f46":"#991b1b"}}>
                      {checkOff.ok?<CheckCircle size={15}/>:<AlertTriangle size={15}/>}
                      {checkOff.ok?"CAN GIVE OFF":"CANNOT GIVE OFF"}
                    </div>
                    <div style={{fontSize:12,color:checkOff.ok?"#059669":"#dc2626",marginTop:3}}>{checkOff.reason}</div>
                  </div>
                )}
                <Btn style={{width:"100%",justifyContent:"center"}} onClick={function(){
                  if(!offForm.staffId||!offForm.date||!offForm.reason)return;
                  const chk=canGiveOff(parseInt(offForm.staffId),parseInt(offForm.date.split("-")[2]),offForm.reason);
                  setRequests(function(r){return [...r,{id:Date.now(),...offForm,staffId:parseInt(offForm.staffId),status:chk.ok?"approved":"rejected"}];});
                  setOffForm({staffId:"",reason:"",date:""});
                }}>Submit Request</Btn>
              </Card>
            )}
            <Card>
              <Hdr title="Recent Requests"/>
              {requests.length===0&&<div style={{fontSize:12,color:"#bbb",textAlign:"center",padding:12}}>No requests yet</div>}
              {requests.slice().reverse().slice(0,6).map(function(r,i){
                const p=ALL_STAFF.find(function(s){return s.id===r.staffId;});
                const ac=ATTEND.find(function(a){return a.code===r.reason;})||ATTEND[0];
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f4f2ed"}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13,color:"#0d1b2a"}}>{p?p.name:"Unknown"} - {r.date}</div>
                      <Bdg label={r.reason+" "+ac.label} bg={ac.bg} color={ac.color} style={{fontSize:9,marginTop:2}}/>
                    </div>
                    <Bdg label={r.status==="approved"?"Approved":"Rejected"} bg={r.status==="approved"?"#d1fae5":"#fee2e2"} color={r.status==="approved"?"#065f46":"#991b1b"} style={{fontSize:10}}/>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      )}

      {tab==="minstaffing"&&(
        <Card style={{maxWidth:600}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:16,fontWeight:700,color:"#0d1b2a"}}>Minimum Staffing Rules</div>
            {edit&&<Btn variant="secondary" onClick={function(){setEditMin(function(e){return !e;});}}><Edit2 size={13}/>{editMin?"Done":"Edit"}</Btn>}
          </div>
          <div style={{fontSize:13,color:"#888",marginBottom:16}}>System flags off requests as CANNOT GIVE OFF if minimum staffing would be breached.</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:"1px solid #f4f2ed"}}><th style={{textAlign:"left",padding:"8px 12px",color:"#aaa",fontSize:11,fontWeight:600}}>Period</th><th style={{textAlign:"center",padding:"8px 12px",color:"#aaa",fontSize:11,fontWeight:600}}>Max Captains Off</th><th style={{textAlign:"center",padding:"8px 12px",color:"#aaa",fontSize:11,fontWeight:600}}>Max Crew Off</th></tr></thead>
            <tbody>
              {[["normal","Normal Operations","Standard occupancy"],["busy","Busy / High Season","Events & peak season"]].map(function(row){var key=row[0],label=row[1],sub=row[2];
                return(
                  <tr key={key} style={{borderBottom:"1px solid #f8f6f0"}}>
                    <td style={{padding:"14px 12px"}}><div style={{fontWeight:700,color:"#0d1b2a"}}>{label}</div><div style={{fontSize:11,color:"#aaa"}}>{sub}</div></td>
                    <td style={{padding:"14px 12px",textAlign:"center"}}>
                      {editMin?<input type="number" value={minStaff[key].cap} min={0} max={5} onChange={function(e){setMinStaff(function(s){const n={...s};n[key]={...n[key],cap:parseInt(e.target.value)||0};return n;});}} style={{width:56,padding:"6px",borderRadius:7,border:"1px solid #e0ddd5",fontSize:18,fontWeight:800,textAlign:"center"}}/>
                      :<div style={{fontSize:28,fontWeight:800,color:"#0d1b2a"}}>{minStaff[key].cap}</div>}
                    </td>
                    <td style={{padding:"14px 12px",textAlign:"center"}}>
                      {editMin?<input type="number" value={minStaff[key].crew} min={0} max={8} onChange={function(e){setMinStaff(function(s){const n={...s};n[key]={...n[key],crew:parseInt(e.target.value)||0};return n;});}} style={{width:56,padding:"6px",borderRadius:7,border:"1px solid #e0ddd5",fontSize:18,fontWeight:800,textAlign:"center"}}/>
                      :<div style={{fontSize:28,fontWeight:800,color:"#0d1b2a"}}>{minStaff[key].crew}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function MaintenancePage({user}){
  if(!can(user,"maintenance"))return <Locked name="Maintenance"/>;
  const edit=can(user,"maintenance","edit");
  const priBdg=function(pri){const m={high:{bg:"#fee2e2",c:"#991b1b"},medium:{bg:"#fff7ed",c:"#c2410c"},low:{bg:"#f0fdf4",c:"#166534"}};const s=m[pri]||m.low;return <Bdg label={pri} bg={s.bg} color={s.c} style={{textTransform:"capitalize"}}/>;};
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:800,color:"#0d1b2a",margin:0}}>Preventive Maintenance</h1>
        {edit&&<Btn><Plus size={14}/>Add Task</Btn>}
      </div>
      {!edit&&<ViewOnly/>}
      <Card>
        <Hdr title="Maintenance Schedule"/>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{borderBottom:"1px solid #f4f2ed"}}>{["Vessel","Task","Due Date","Priority","Status","Action"].map(function(h){return <th key={h} style={{textAlign:"left",padding:"7px 12px",color:"#aaa",fontSize:11,fontWeight:600}}>{h}</th>;})}</tr></thead>
          <tbody>
            {MAINT.map(function(m,i){
              return(
                <tr key={i} style={{borderBottom:"1px solid #f8f6f0",background:m.status==="due-soon"?"#fffbeb":"transparent"}}>
                  <td style={{padding:"10px 12px",fontWeight:700,color:"#0d1b2a"}}>{m.boat}</td>
                  <td style={{padding:"10px 12px",color:"#555"}}>{m.task}</td>
                  <td style={{padding:"10px 12px",color:m.status==="due-soon"?"#c2410c":"#777"}}>{m.due}</td>
                  <td style={{padding:"10px 12px"}}>{priBdg(m.pri)}</td>
                  <td style={{padding:"10px 12px"}}><StsBdg status={m.status}/></td>
                  <td style={{padding:"10px 12px"}}>{edit&&<button style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid #e0ddd5",background:"#fff",cursor:"pointer",color:"#0d1b2a"}}>Complete</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ReportsPage({user}){
  if(!can(user,"reports"))return <Locked name="Reports"/>;
  const exp=can(user,"reports","export");
  return(
    <div>
      <h1 style={{fontSize:24,fontWeight:800,color:"#0d1b2a",margin:"0 0 5px"}}>Reports & Exports</h1>
      <div style={{fontSize:13,color:"#aaa",marginBottom:20}}>Generate and download operational reports</div>
      {!exp&&<div style={{marginBottom:14,padding:"10px 14px",background:"#dbeafe",borderRadius:8,fontSize:13,color:"#1e40af",display:"flex",alignItems:"center",gap:8}}><Lock size={14}/> Export restricted - contact Super Admin</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
        {[["Daily Movement Report","Full movement log for any date"],["Monthly Fuel Summary","Fuel by vessel with meter readings"],["Activity Log","Excursions and marine bookings"],["Running Hours","Engine hours actual vs estimated"],["Maintenance","Upcoming and completed tasks"],["Duty Roster","Attendance with leave breakdown"],["Off-Day Calendar","Approved leaves and availability"],["Audit Trail","All changes with user and timestamp"]].map(function(item,i){var title=item[0],desc=item[1];
          return(
            <Card key={i}>
              <div style={{fontWeight:700,color:"#0d1b2a",fontSize:14,marginBottom:5}}>{title}</div>
              <div style={{fontSize:12,color:"#aaa",marginBottom:14}}>{desc}</div>
              {exp?<Btn style={{width:"100%",justifyContent:"center"}}><Download size={13}/>Export</Btn>
              :<Btn variant="secondary" style={{width:"100%",justifyContent:"center"}} disabled><Lock size={13}/>Restricted</Btn>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}


function UserMgmt({user,users,setUsers}){
  if(user.role!=="superadmin")return <Locked name="User Management"/>;
  const [tab,setTab]=useState("users");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({username:"",name:"",email:"",role:"captain",active:true,password:""});
  const [customOn,setCustomOn]=useState(false);
  const [customPerms,setCustomPerms]=useState({});
  const [showPw,setShowPw]=useState(false);
  const AUDIT=[
    {time:"2026-03-12 08:14",user:"superadmin", action:"Login",         detail:"Successful login"},
    {time:"2026-03-12 07:55",user:"ops.manager",action:"Login",         detail:"Successful login"},
    {time:"2026-03-11 14:20",user:"superadmin", action:"User Updated",  detail:"Changed nasru role -> captain"},
    {time:"2026-03-11 09:00",user:"superadmin", action:"User Created",  detail:"Created user: frontdesk"},
    {time:"2026-03-10 16:30",user:"ops.manager",action:"Exported",      detail:"Boat Movement 10-Mar-2026"},
  ];
  const openCreate=function(){setForm({username:"",name:"",email:"",role:"captain",active:true,password:""});setCustomOn(false);setCustomPerms({});setModal({mode:"create"});};
  const openEdit=function(u){setForm({...u,password:""});const hasC=u.customPerms!==null;setCustomOn(hasC);setCustomPerms(hasC?u.customPerms:JSON.parse(JSON.stringify(ROLES[u.role]&&ROLES[u.role].perms||{})));setModal({mode:"edit",user:u});};
  const applyRole=function(role){setForm(function(f){return {...f,role};});setCustomPerms(JSON.parse(JSON.stringify(ROLES[role]&&ROLES[role].perms||{})));};
  const togglePerm=function(mod,action){setCustomPerms(function(p){const cur=Array.isArray(p[mod])?[...p[mod]]:[];const next=cur.includes(action)?cur.filter(function(a){return a!==action;}):[...cur,action];const n={...p};n[mod]=next;return n;});};
  const saveUser=function(){
    const fp=customOn?customPerms:null;
    if(modal.mode==="create"){
      const colors=["#7c3aed","#0d7a6e","#185FA5","#D85A30","#854F0B","#c9a84c"];
      setUsers(function(u){return [...u,{...form,id:Date.now(),customPerms:fp,lastLogin:"Never",avatar:(form.name.split(" ").map(function(w){return w[0];}).join("").toUpperCase().slice(0,2)||"??"),ac:colors[u.length%6]}];});
    }else{
      setUsers(function(u){return u.map(function(x){return x.id===modal.user.id?{...x,...form,customPerms:fp}:x;});});
    }
    setModal(null);
  };
  return(
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
        <div><h1 style={{fontSize:24,fontWeight:800,color:"#0d1b2a",margin:0}}>User Management</h1><div style={{fontSize:13,color:"#aaa",marginTop:3}}>Manage access, roles and permissions</div></div>
        <Btn variant="purple" onClick={openCreate}><UserPlus size={14}/>Add User</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{Icon:Users,label:"Total Users",value:users.length,color:"#7c3aed"},{Icon:Shield,label:"Admins",value:users.filter(function(u){return u.role==="superadmin"||u.role==="admin";}).length,color:"#0d7a6e"},{Icon:Anchor,label:"Captains/Crew",value:users.filter(function(u){return u.role==="captain";}).length,color:"#185FA5"},{Icon:Eye,label:"View Only",value:users.filter(function(u){return u.role==="viewonly";}).length,color:"#c9a84c"}].map(function({Icon,label,value,color},i){
          return(
            <Card key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{width:38,height:38,borderRadius:9,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={17} color={color}/></div>
              <div><div style={{fontSize:11,color:"#aaa"}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:"#0d1b2a"}}>{value}</div></div>
            </Card>
          );
        })}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {[["users","Users"],["roles","Role Templates"],["audit","Audit Log"]].map(function(pair){var id=pair[0],label=pair[1];return <button key={id} onClick={()=>setTab(id)} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #e8e4dc",background:tab===id?"#0d1b2a":"#fff",color:tab===id?"#fff":"#666",fontSize:13,cursor:"pointer",fontWeight:600}}>{label}</button>;  })}
      </div>
      {tab==="users"&&(
        <Card>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{borderBottom:"1px solid #f4f2ed"}}>{["User","Username","Email","Role","Status","Last Login","Actions"].map(function(h){return <th key={h} style={{textAlign:"left",padding:"7px 12px",color:"#aaa",fontSize:11,fontWeight:600}}>{h}</th>;  })}</tr></thead>
            <tbody>
              {users.map(function(u){
                const rt=ROLES[u.role];
                return(
                  <tr key={u.id} style={{borderBottom:"1px solid #f8f6f0",opacity:u.active?1:0.5}}>
                    <td style={{padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:(u.ac||"#888")+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:u.ac||"#888",flexShrink:0}}>{u.avatar||"??"}</div>
                        <div><div style={{fontWeight:700,color:"#0d1b2a",fontSize:13}}>{u.name}</div>{u.customPerms&&<div style={{fontSize:10,color:"#c2410c",fontWeight:600}}>Custom perms</div>}</div>
                      </div>
                    </td>
                    <td style={{padding:"10px 12px",color:"#666",fontFamily:"monospace",fontSize:12}}>{u.username}</td>
                    <td style={{padding:"10px 12px",color:"#888",fontSize:12}}>{u.email}</td>
                    <td style={{padding:"10px 12px"}}>{rt&&<Bdg label={rt.label} bg={rt.bg} color={rt.color} style={{fontSize:11}}/>}</td>
                    <td style={{padding:"10px 12px"}}>
                      <button onClick={function(){if(u.id!==1)setUsers(function(us){return us.map(function(x){return x.id===u.id?{...x,active:!x.active}:x;});});}} style={{background:"none",border:"none",cursor:u.id===1?"default":"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,color:u.active?"#0d7a6e":"#aaa",fontWeight:600}}>
                        {u.active?<ToggleRight size={18} color="#0d7a6e"/>:<ToggleLeft size={18} color="#ccc"/>}
                        {u.active?"Active":"Inactive"}
                      </button>
                    </td>
                    <td style={{padding:"10px 12px",color:"#aaa",fontSize:11}}>{u.lastLogin}</td>
                    <td style={{padding:"10px 12px"}}>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={function(){openEdit(u);}} style={{width:28,height:28,borderRadius:6,border:"1px solid #e8e4dc",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit2 size={13} color="#0d7a6e"/></button>
                        {u.id!==1&&<button onClick={function(){setUsers(function(us){return us.filter(function(x){return x.id!==u.id;});});}} style={{width:28,height:28,borderRadius:6,border:"1px solid #fee2e2",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={13} color="#dc2626"/></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      {tab==="roles"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
          {Object.entries(ROLES).map(function(entry){var key=entry[0],rt=entry[1];
            return(
              <Card key={key} style={{borderTop:"4px solid "+rt.color}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <Bdg label={rt.label} bg={rt.bg} color={rt.color} style={{fontSize:12}}/>
                  <span style={{fontSize:11,color:"#aaa",marginLeft:"auto"}}>{key}</span>
                </div>
                <div style={{fontSize:12,color:"#888",marginBottom:12}}>{rt.desc}</div>
                <div style={{borderTop:"1px solid #e8e4dc",paddingTop:10}}>
                  {MODULES.map(function(mod){
                    const ps=rt.perms[mod.id]||[];
                    if(!ps.length)return null;
                    return(
                      <div key={mod.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                        <span style={{flex:1,fontSize:12,color:"#555",fontWeight:600}}>{mod.label}</span>
                        <div style={{display:"flex",gap:3}}>
                          {ps.map(function(p){return <Bdg key={p} label={p} bg={PERM_COLORS[p]+"18"} color={PERM_COLORS[p]} style={{fontSize:9,padding:"1px 5px"}}/>;  })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {tab==="audit"&&(
        <Card>
          <Hdr title="System Audit Log"/>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{borderBottom:"1px solid #f4f2ed"}}>{["Timestamp","User","Action","Detail"].map(function(h){return <th key={h} style={{textAlign:"left",padding:"7px 12px",color:"#aaa",fontSize:11,fontWeight:600}}>{h}</th>;  })}</tr></thead>
            <tbody>
              {AUDIT.map(function(a,i){
                return(
                  <tr key={i} style={{borderBottom:"1px solid #f8f6f0"}}>
                    <td style={{padding:"9px 12px",color:"#888",fontSize:12,fontFamily:"monospace"}}>{a.time}</td>
                    <td style={{padding:"9px 12px",fontWeight:700,color:"#0d1b2a"}}>{a.user}</td>
                    <td style={{padding:"9px 12px"}}><Bdg label={a.action} bg="#f0fdf4" color="#0d7a6e" style={{fontSize:11}}/></td>
                    <td style={{padding:"9px 12px",color:"#777",fontSize:12}}>{a.detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(13,27,42,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:700,maxHeight:"90vh",overflowY:"auto",padding:28,position:"relative"}}>
            <button onClick={function(){setModal(null);}} style={{position:"absolute",top:16,right:16,background:"none",border:"none",cursor:"pointer",color:"#aaa"}}><X size={20}/></button>
            <h2 style={{fontSize:20,fontWeight:800,color:"#0d1b2a",margin:"0 0 20px"}}>{modal.mode==="create"?"Add New User":"Edit User"}</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {[["Full Name","name","text","e.g. NASRU (Captain)"],["Username","username","text","e.g. nasru"],["Email","email","email","e.g. nasru@baros.com"]].map(function(f){var lbl=f[0],key=f[1],type=f[2],ph=f[3];
                return(
                  <div key={key}>
                    <label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>{lbl}</label>
                    <input type={type} placeholder={ph} value={form[key]||""} onChange={function(e){setForm(function(f){const n={...f};n[key]=e.target.value;return n;});}} disabled={modal.mode==="edit"&&modal.user&&modal.user.id===1&&key==="username"} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e8e4dc",fontSize:13,boxSizing:"border-box"}}/>
                  </div>
                );
              })}
              <div>
                <label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>{modal.mode==="create"?"Password":"New Password"}</label>
                <div style={{position:"relative"}}>
                  <input type={showPw?"text":"password"} value={form.password||""} onChange={function(e){setForm(function(f){return {...f,password:e.target.value};});}} placeholder={modal.mode==="edit"?"Leave blank to keep":"Set password"} style={{width:"100%",padding:"8px 36px 8px 10px",borderRadius:8,border:"1px solid #e8e4dc",fontSize:13,boxSizing:"border-box"}}/>
                  <button type="button" onClick={function(){setShowPw(function(p){return !p;});}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#aaa"}}>{showPw?<EyeOff size={15}/>:<Eye size={15}/>}</button>
                </div>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,color:"#888",display:"block",marginBottom:8,fontWeight:600}}>Role Template</label>
              {modal.user&&modal.user.id===1?(
                <div style={{padding:"10px 14px",background:"#ede9fe",borderRadius:8,fontSize:13,color:"#7c3aed",fontWeight:700}}>Super Admin - locked</div>
              ):(
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {Object.entries(ROLES).map(function(entry){var key=entry[0],rt=entry[1];
                    return <button key={key} onClick={function(){applyRole(key);}} style={{padding:"8px 14px",borderRadius:8,border:"2px solid "+(form.role===key?rt.color:"#e8e4dc"),background:form.role===key?rt.bg:"#fff",color:form.role===key?rt.color:"#0d1b2a",fontSize:13,cursor:"pointer",fontWeight:600}}>{rt.label}</button>;
                  })}
                </div>
              )}
              {form.role&&<div style={{fontSize:11,color:"#aaa",marginTop:6}}>{ROLES[form.role]&&ROLES[form.role].desc}</div>}
            </div>
            {(!modal.user||modal.user.id!==1)&&(
              <div style={{marginBottom:16}}>
                <button onClick={function(){setCustomOn(function(c){return !c;});if(!customOn)setCustomPerms(JSON.parse(JSON.stringify(ROLES[form.role]&&ROLES[form.role].perms||{})));}} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,color:customOn?"#0d7a6e":"#aaa",fontWeight:600,fontSize:13,marginBottom:12}}>
                  {customOn?<ToggleRight size={20} color="#0d7a6e"/>:<ToggleLeft size={20} color="#ccc"/>}
                  Customise permissions for this user
                  {customOn&&<Bdg label="Custom" bg="#fff7ed" color="#c2410c" style={{fontSize:10}}/>}
                </button>
                {customOn&&(
                  <div style={{border:"1px solid #e8e4dc",borderRadius:10,overflow:"hidden"}}>
                    <div style={{background:"#f8f6f0",padding:"8px 14px",display:"grid",gridTemplateColumns:"1fr repeat(4,70px)",gap:4}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#aaa"}}>MODULE</span>
                      {PERM_LABELS.map(function(p){return <span key={p} style={{textAlign:"center",fontSize:11,fontWeight:700,color:PERM_COLORS[p],textTransform:"uppercase"}}>{p}</span>;  })}
                    </div>
                    {MODULES.map(function(mod,mi){
                      const ps=Array.isArray(customPerms[mod.id])?customPerms[mod.id]:[];
                      return(
                        <div key={mod.id} style={{display:"grid",gridTemplateColumns:"1fr repeat(4,70px)",gap:4,padding:"9px 14px",borderTop:"1px solid #f4f2ed",background:mi%2===0?"#fff":"#fafaf8",alignItems:"center"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <mod.Icon size={14} color="#0d7a6e"/>
                            <span style={{fontSize:13,fontWeight:600,color:"#0d1b2a"}}>{mod.label}</span>
                          </div>
                          {PERM_LABELS.map(function(p){
                            return(
                              <div key={p} style={{display:"flex",justifyContent:"center"}}>
                                <input type="checkbox" checked={ps.includes(p)} onChange={function(){togglePerm(mod.id,p);}} style={{width:16,height:16,cursor:"pointer",accentColor:PERM_COLORS[p]}}/>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",paddingTop:16,borderTop:"1px solid #e8e4dc"}}>
              <Btn variant="secondary" onClick={function(){setModal(null);}}>Cancel</Btn>
              <Btn variant="purple" onClick={saveUser}><Save size={14}/>{modal.mode==="create"?"Create User":"Save Changes"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function FuelCapacityTable({user}){
  const canEdit=user.role==="superadmin"||user.role==="admin";
  const [caps,setCaps]=useState(function(){
    var obj={};
    FLEET.forEach(function(b){obj[b.id]={fuelCap:b.fuelCap,cons:b.cons,pax:b.pax};});
    return obj;
  });
  const [editing,setEditing]=useState(false);
  const [saved,setSaved]=useState(false);

  function save(){
    setSaved(true);setEditing(false);
    setTimeout(function(){setSaved(false);},2500);
  }

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:15,fontWeight:700,color:"#0d1b2a"}}>Fuel & Capacity Settings</div>
        <div style={{display:"flex",gap:8}}>
          {canEdit&&!editing&&<Btn variant="secondary" onClick={function(){setEditing(true);}}><Edit2 size={13}/>Edit</Btn>}
          {editing&&<Btn onClick={save}><Save size={13}/>Save All Changes</Btn>}
          {editing&&<Btn variant="secondary" onClick={function(){setEditing(false);}}>Cancel</Btn>}
        </div>
      </div>
      {saved&&<div style={{marginBottom:12,padding:"8px 14px",background:"#f0fdf4",borderRadius:8,fontSize:13,color:"#065f46",border:"1px solid #bbf7d0"}}>Changes saved successfully.</div>}
      {canEdit&&!editing&&<div style={{marginBottom:12,padding:"8px 14px",background:"#ede9fe",borderRadius:8,fontSize:12,color:"#7c3aed"}}>Admin & Super Admin can edit fuel capacity, consumption per hour, and passenger capacity for each vessel.</div>}
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:"#f8f6f0",borderBottom:"2px solid #e8e4dc"}}>
              {["Vessel","Type","Fuel Capacity (L)","Consumption/hr (L)","Passenger Cap","Fuel %"].map(function(h){return <th key={h} style={{textAlign:"left",padding:"9px 12px",fontSize:11,color:"#888",fontWeight:700}}>{h}</th>;  })}
            </tr>
          </thead>
          <tbody>
            {FLEET.map(function(b){
              var c=caps[b.id]||{fuelCap:b.fuelCap,cons:b.cons,pax:b.pax};
              var pct=Math.round(b.fuel/c.fuelCap*100);
              return(
                <tr key={b.id} style={{borderBottom:"1px solid #f4f2ed"}}>
                  <td style={{padding:"10px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:b.color,flexShrink:0}}></div>
                      <span style={{fontWeight:700,color:"#0d1b2a"}}>{b.name}</span>
                    </div>
                  </td>
                  <td style={{padding:"10px 12px",color:"#888",fontSize:12}}>{b.type}</td>
                  <td style={{padding:"10px 12px"}}>
                    {editing&&canEdit
                      ?<input type="number" value={c.fuelCap} onChange={function(e){setCaps(function(cp){var n=Object.assign({},cp);n[b.id]=Object.assign({},n[b.id],{fuelCap:parseInt(e.target.value)||0});return n;});}} style={{width:90,padding:"5px 8px",borderRadius:7,border:"2px solid #7c3aed",fontSize:14,fontWeight:700}}/>
                      :<span style={{fontWeight:700,color:"#0d1b2a"}}>{c.fuelCap.toLocaleString()} L</span>
                    }
                  </td>
                  <td style={{padding:"10px 12px"}}>
                    {editing&&canEdit
                      ?<input type="number" value={c.cons} onChange={function(e){setCaps(function(cp){var n=Object.assign({},cp);n[b.id]=Object.assign({},n[b.id],{cons:parseInt(e.target.value)||0});return n;});}} style={{width:80,padding:"5px 8px",borderRadius:7,border:"2px solid #7c3aed",fontSize:14,fontWeight:700}}/>
                      :<span style={{fontWeight:700,color:"#0d1b2a"}}>{c.cons} L/hr</span>
                    }
                  </td>
                  <td style={{padding:"10px 12px"}}>
                    {editing&&canEdit
                      ?<input type="number" value={c.pax} onChange={function(e){setCaps(function(cp){var n=Object.assign({},cp);n[b.id]=Object.assign({},n[b.id],{pax:parseInt(e.target.value)||0});return n;});}} style={{width:70,padding:"5px 8px",borderRadius:7,border:"2px solid #7c3aed",fontSize:14,fontWeight:700}}/>
                      :<span style={{fontWeight:700,color:"#0d1b2a"}}>{c.pax} PAX</span>
                    }
                  </td>
                  <td style={{padding:"10px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1,height:8,borderRadius:4,background:"#f0ede5",minWidth:60}}>
                        <div style={{height:"100%",borderRadius:4,background:pct<30?"#ef4444":pct<60?"#c9a84c":"#0d7a6e",width:pct+"%"}}></div>
                      </div>
                      <span style={{fontSize:12,fontWeight:700,color:pct<30?"#ef4444":pct<60?"#c9a84c":"#0d7a6e",minWidth:36}}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function ChecklistPage({user}){
  if(!can(user,"checklist"))return <Locked name="Checklists"/>;
  const canEdit=can(user,"checklist","edit");
  const [selBoat,setSelBoat]=useState(null);
  const [tab,setTab]=useState("new");
  const [runHours,setRunHours]=useState({port:"",stbd:""});
  const [specVals,setSpecVals]=useState({});
  const [answers,setAnswers]=useState({});
  const [remarks,setRemarks]=useState({});
  const [checkedBy,setCheckedBy]=useState("");
  const [submitted,setSubmitted]=useState(false);
  const [logs,setLogs]=useState([
    {id:1,boat:"Ixora",date:"2026-03-12",captain:"AZUHAN",portHrs:"876",stbdHrs:"874",complete:true},
    {id:2,boat:"Tara", date:"2026-03-11",captain:"SHIREY",portHrs:"2187",stbdHrs:"",complete:true},
  ]);

  var boat=selBoat?FLEET.find(function(b){return b.id===selBoat;}):null;
  var spec=boat?BOAT_SPECS[boat.name]:null;
  var isDual=spec&&spec.engines===2;

  function initForm(b){
    var s=BOAT_SPECS[b.name];
    setSpecVals({engineModel:s?s.engineModel:"",engineMake:s?s.engineMake:"",gearboxMake:s?s.gearboxMake:"",portSN:s?s.portSN:"",stbdSN:s?s.stbdSN:"",portGbSN:s?s.portGbSN:"",stbdGbSN:s?s.stbdGbSN:"",dgModel:s?s.dgModel:"",dgMake:s?s.dgMake:"",dgSN:s?s.dgSN:""});
    setRunHours({port:"",stbd:""});
    setAnswers({});setRemarks({});setCheckedBy("");setSubmitted(false);
  }

  function setAns(id,val){setAnswers(function(a){var n=Object.assign({},a);n[id]=val;return n;});}
  function setRem(id,val){setRemarks(function(r){var n=Object.assign({},r);n[id]=val;return n;});}

  function allAnswered(){
    return CL_ITEMS.every(function(item){
      return answers[item.id]!==undefined&&answers[item.id]!=="";
    });
  }


  function generatePDF(entry, specData, answerData, remarkData, runHrs){
    var boatObj = FLEET.find(function(b){ return b.name === (entry ? entry.boat : (boat ? boat.name : "")); });
    var bColor = boatObj ? boatObj.color : "#0d7a6e";
    var bName  = entry ? entry.boat : (boat ? boat.name : "");
    var bDate  = entry ? entry.date : new Date().toLocaleDateString("en-GB");
    var bCaptain = entry ? entry.captain : (boat ? boat.captain : "");
    var portHrs = entry ? entry.portHrs : (runHrs ? runHrs.port : "");
    var stbdHrs = entry ? entry.stbdHrs : (runHrs ? runHrs.stbd : "");
    var sv = specData || specVals;
    var ans = answerData || answers;
    var rem = remarkData || remarks;
    var cb = entry ? (entry.checkedBy || "") : checkedBy;

    function statusCell(item){
      var val = ans[item.id] || "";
      if(!val) return '<span style="color:#aaa">—</span>';
      var col = "#0d1b2a";
      if(val==="Normal"||val==="Yes"||val==="No (no leak)"){ col="#059669"; }
      else if(val==="High"||val==="Low"||val==="Yes (alarm)"||val==="Yes (leak)"){ col="#dc2626"; }
      else if(val==="No"){ col = item.type==="yn_leak"||item.type==="yn_alarm" ? "#059669" : "#dc2626"; }
      return '<strong style="color:'+col+'">'+val+'</strong>';
    }

    var rows = CL_ITEMS.map(function(item){
      return '<tr style="border-bottom:1px solid #eee">'
        + '<td style="padding:6px 8px;font-weight:700;color:#444;width:30px">'+item.id+'</td>'
        + '<td style="padding:6px 8px;color:#333;font-size:12px">'+item.desc+'</td>'
        + '<td style="padding:6px 8px;width:160px">'+statusCell(item)+'</td>'
        + '<td style="padding:6px 8px;font-size:11px;color:#666;width:160px">'+(rem[item.id]||"")+'</td>'
        + '</tr>';
    }).join("");

    var isDualEng = BOAT_SPECS[bName] && BOAT_SPECS[bName].engines === 2;
    var hrsRow = isDualEng
      ? '<td><strong>Port Running Hrs:</strong> '+portHrs+'</td><td><strong>Stbd Running Hrs:</strong> '+stbdHrs+'</td>'
      : '<td colspan="2"><strong>Running Hrs:</strong> '+portHrs+'</td>';

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
      + '<title>Daily Maintenance Checklist - '+bName+' - '+bDate+'</title>'
      + '<style>'
      + 'body{font-family:Arial,sans-serif;font-size:13px;color:#222;margin:0;padding:20px;}'
      + 'h1{font-size:15px;text-align:center;margin:0 0 4px;letter-spacing:1px;}'
      + 'table{width:100%;border-collapse:collapse;}'
      + 'th{background:#f0f0f0;padding:6px 8px;text-align:left;font-size:11px;font-weight:700;border:1px solid #ccc;}'
      + 'td{border:1px solid #ddd;padding:5px 7px;vertical-align:top;}'
      + '.header-table td{border:1px solid #999;padding:5px 8px;font-size:12px;}'
      + '.logo{font-size:22px;font-weight:900;letter-spacing:2px;color:#0d1b2a;}'
      + '.sub{font-size:9px;letter-spacing:3px;color:#c9a84c;display:block;margin-top:1px;}'
      + '.title-bar{background:#0d1b2a;color:#fff;text-align:center;padding:8px;font-size:14px;font-weight:700;letter-spacing:1px;margin:10px 0 6px;}'
      + '.footer{margin-top:20px;border-top:1px solid #ccc;padding-top:10px;font-size:11px;color:#555;}'
      + '@media print{body{padding:10px;} button{display:none!important;}}'
      + '</style></head><body>'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'
      + '<div><span class="logo">BAROS</span><span class="sub">MALDIVES</span></div>'
      + '<div style="text-align:right;font-size:12px"><strong>Date:</strong> '+bDate+'</div>'
      + '</div>'
      + '<div class="title-bar">DAILY MAINTENANCE CHECK LIST</div>'
      + '<table class="header-table" style="margin-bottom:6px">'
      + '<tr><td colspan="2"><strong>Name of the Boat:</strong> '+bName+'</td>'
      + '<td colspan="2"><strong>Engine Model:</strong> '+(sv.engineModel||"")+'</td>'
      + '<td colspan="2"><strong>Engine Make:</strong> '+(sv.engineMake||"")+'</td></tr>'
      + '<tr><td><strong>Port S/N:</strong> '+(sv.portSN||"")+'</td>'
      + '<td><strong>Stbd S/N:</strong> '+(sv.stbdSN||"")+'</td>'
      + hrsRow + '</tr>'
      + '<tr><td><strong>Gearbox Model:</strong></td>'
      + '<td><strong>Gearbox Make:</strong> '+(sv.gearboxMake||"")+'</td>'
      + '<td><strong>Port Gearbox S/N:</strong> '+(sv.portGbSN||"")+'</td>'
      + '<td><strong>Stbd Gearbox S/N:</strong> '+(sv.stbdGbSN||"")+'</td></tr>'
      + '<tr><td><strong>DG Model:</strong> '+(sv.dgModel||"")+'</td>'
      + '<td><strong>DG Make:</strong> '+(sv.dgMake||"")+'</td>'
      + '<td colspan="2"><strong>DG S/N:</strong> '+(sv.dgSN||"")+'</td></tr>'
      + '</table>'
      + '<table style="margin-top:8px">'
      + '<thead><tr><th style="width:30px">Sr.no.</th><th>Description</th><th style="width:160px">Status</th><th style="width:160px">Remarks</th><th style="width:90px">Checked By</th></tr></thead>'
      + '<tbody>'+rows+'</tbody>'
      + '</table>'
      + '<div class="footer">'
      + '<p><strong>Instructions:</strong> Put tick mark after checking. Make remarks if any repair/damage happen and any electrical light, bilges are not working. Follow the instruction manual provided.</p>'
      + '<div style="display:flex;justify-content:space-between;margin-top:16px">'
      + '<div><strong>Checked By:</strong> '+cb+'<div style="border-top:1px solid #999;width:200px;margin-top:30px;font-size:10px">Signature</div></div>'
      + '<div><strong>Approved By Transport Manager:</strong><div style="border-top:1px solid #999;width:200px;margin-top:30px;font-size:10px">Signature</div></div>'
      + '</div></div>'
      + '<div style="text-align:center;margin-top:12px">'
      + '<button onclick="window.print()" style="padding:10px 28px;background:#0d7a6e;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">Print / Save as PDF</button>'
      + '</div>'
      + '</body></html>';

    var win = window.open("","_blank","width=900,height=800");
    if(win){ win.document.write(html); win.document.close(); }
  }

  function submitCL(){
    var entry={id:Date.now(),boat:boat.name,date:new Date().toLocaleDateString("en-GB"),
      captain:boat.captain,portHrs:runHours.port,stbdHrs:runHours.stbd,complete:allAnswered(),
      answers:Object.assign({},answers),remarks:Object.assign({},remarks),checkedBy:checkedBy};
    setLogs(function(l){return [entry,...l];});
    setSubmitted(true);
  }

  function renderInput(item){
    var val=answers[item.id]||"";
    var inp=function(v){setAns(item.id,v);};
    var btnStyle=function(active,color){return {padding:"4px 12px",borderRadius:6,border:"1px solid "+(active?color:"#e0ddd5"),background:active?color+"18":"#fff",color:active?color:"#888",fontSize:11,fontWeight:700,cursor:"pointer"};};

    if(item.type==="hln"){
      return(
        <div style={{display:"flex",gap:6}}>
          {["High","Low","Normal"].map(function(opt){
            var isW=opt==="Normal";
            var active=val===opt;
            var color=opt==="Normal"?"#059669":opt==="High"?"#dc2626":"#c2410c";
            return <button key={opt} onClick={function(){inp(opt);}} style={btnStyle(active,color)}>{opt}</button>;
          })}
        </div>
      );
    }
    if(item.type==="ln"){
      return(
        <div style={{display:"flex",gap:6}}>
          {["Low","Normal"].map(function(opt){
            var active=val===opt;
            var color=opt==="Normal"?"#059669":"#c2410c";
            return <button key={opt} onClick={function(){inp(opt);}} style={btnStyle(active,color)}>{opt}</button>;
          })}
        </div>
      );
    }
    if(item.type==="yn"){
      return(
        <div style={{display:"flex",gap:6}}>
          {["Yes","No"].map(function(opt){
            var active=val===opt;
            var color=opt==="Yes"?"#059669":"#dc2626";
            return <button key={opt} onClick={function(){inp(opt);}} style={btnStyle(active,color)}>{opt}</button>;
          })}
        </div>
      );
    }
    if(item.type==="yn_leak"){
      return(
        <div style={{display:"flex",gap:6}}>
          {["Yes","No"].map(function(opt){
            var active=val===opt;
            var color=opt==="No"?"#059669":"#dc2626";
            return <button key={opt} onClick={function(){inp(opt);}} style={btnStyle(active,color)}>{opt}</button>;
          })}
        </div>
      );
    }
    if(item.type==="yn_alarm"){
      return(
        <div style={{display:"flex",gap:6}}>
          {["Yes","No"].map(function(opt){
            var active=val===opt;
            var color=opt==="No"?"#059669":"#dc2626";
            return <button key={opt} onClick={function(){inp(opt);}} style={btnStyle(active,color)}>{opt}</button>;
          })}
        </div>
      );
    }
    return(
      <input value={val} onChange={function(e){inp(e.target.value);}} placeholder={item.note}
        style={{padding:"5px 8px",borderRadius:7,border:"1px solid #e0ddd5",fontSize:12,width:140}}/>
    );
  }

  if(submitted&&boat){
    return(
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <Card style={{textAlign:"center",padding:40}}>
          <CheckCircle size={52} color="#059669" style={{display:"block",margin:"0 auto 14px"}}/>
          <h2 style={{fontSize:20,fontWeight:800,color:"#0d1b2a",margin:"0 0 8px"}}>Checklist Submitted</h2>
          <div style={{fontSize:13,color:"#888",marginBottom:20}}>{boat.name} - {new Date().toLocaleDateString("en-GB")}</div>
          <div style={{padding:"14px",background:"#f0fdf4",borderRadius:10,border:"1px solid #bbf7d0",marginBottom:16,textAlign:"left"}}>
            <div style={{fontWeight:700,color:"#065f46",marginBottom:8}}>Notification sent to:</div>
            {TRANSPORT_EMAILS.map(function(e,i){return <div key={i} style={{fontSize:12,color:"#555",padding:"3px 0"}}>{e}</div>;})}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <Btn onClick={function(){generatePDF(null,specVals,answers,remarks,runHours);}} variant="secondary"><Download size={14}/>Download PDF</Btn>
            <Btn onClick={function(){setSubmitted(false);setSelBoat(null);setTab("log");}}>View Checklist Log</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div><h1 style={{fontSize:24,fontWeight:800,color:"#0d1b2a",margin:0}}>Daily Maintenance Checklist</h1>
          <div style={{fontSize:13,color:"#aaa",marginTop:3}}>Based on Baros Maldives Daily Maintenance Check Sheet</div></div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {[["new","New Checklist"],["log","Completed Logs"],["pdf","PDF Preview"]].map(function(pair){
          var id=pair[0],label=pair[1];
          return <button key={id} onClick={function(){setTab(id);}} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #e8e4dc",background:tab===id?"#0d1b2a":"#fff",color:tab===id?"#fff":"#666",fontSize:13,cursor:"pointer",fontWeight:600}}>{label}</button>;
        })}
      </div>

      {tab==="new"&&(
        <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:16}}>
          <div>
            <Card>
              <Hdr title="Select Vessel"/>
              {FLEET.map(function(b){
                return(
                  <div key={b.id} onClick={function(){if(canEdit){setSelBoat(b.id);initForm(b);}}} style={{padding:"9px 12px",borderRadius:9,border:"1px solid "+(selBoat===b.id?b.color:"#e8e4dc"),background:selBoat===b.id?b.color+"08":"#fff",cursor:canEdit?"pointer":"default",marginBottom:7,display:"flex",alignItems:"center",gap:9}}>
                    <div style={{width:28,height:28,borderRadius:7,background:b.color+"20",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Anchor size={12} color={b.color}/></div>
                    <div style={{flex:1}}><div style={{fontWeight:700,color:"#0d1b2a",fontSize:12}}>{b.name}</div><div style={{fontSize:10,color:"#aaa"}}>{b.type}</div></div>
                  </div>
                );
              })}
            </Card>
          </div>

          <div>
            {!boat?(
              <Card style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:300,flexDirection:"column",gap:10,color:"#ccc"}}>
                <ClipboardList size={40} color="#e0ddd5"/>
                <div>Select a vessel to start the daily checklist</div>
              </Card>
            ):(
              <div>
                <Card style={{marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,paddingBottom:14,borderBottom:"1px solid #e8e4dc"}}>
                    <div style={{width:46,height:46,borderRadius:12,background:boat.color+"20",display:"flex",alignItems:"center",justifyContent:"center"}}><Anchor size={20} color={boat.color}/></div>
                    <div>
                      <div style={{fontSize:17,fontWeight:800,color:"#0d1b2a"}}>DAILY MAINTENANCE CHECK LIST</div>
                      <div style={{fontSize:12,color:"#888"}}>{boat.name} - {new Date().toLocaleDateString("en-GB")}</div>
                    </div>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                    <div style={{gridColumn:"1/-1",fontWeight:700,fontSize:13,color:"#0d1b2a",marginBottom:4}}>Vessel & Engine Details</div>
                    {[["Engine Model","engineModel"],["Engine Make","engineMake"],["Gearbox Make","gearboxMake"],["Port S/N","portSN"],["Stbd S/N","stbdSN"],["Port Gearbox S/N","portGbSN"],["Stbd Gearbox S/N","stbdGbSN"],["DG Model","dgModel"],["DG Make","dgMake"],["DG S/N","dgSN"]].map(function(pair){
                      var label=pair[0],key=pair[1];
                      return(
                        <div key={key}>
                          <label style={{fontSize:11,color:"#888",display:"block",marginBottom:3}}>{label}</label>
                          <input value={specVals[key]||""} onChange={function(e){setSpecVals(function(v){var n=Object.assign({},v);n[key]=e.target.value;return n;});}} style={{width:"100%",padding:"6px 8px",borderRadius:7,border:"1px solid #e0ddd5",fontSize:12,boxSizing:"border-box"}}/>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:isDual?"1fr 1fr":"1fr",gap:8,marginBottom:14}}>
                    <div>
                      <label style={{fontSize:11,color:"#888",display:"block",marginBottom:3}}>{isDual?"Port Running Hrs":"Running Hrs"} *</label>
                      <input type="number" value={runHours.port} onChange={function(e){setRunHours(function(h){return Object.assign({},h,{port:e.target.value});});}} placeholder="e.g. 876" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1.5px solid #0d7a6e",fontSize:15,fontWeight:700,boxSizing:"border-box"}}/>
                    </div>
                    {isDual&&(
                      <div>
                        <label style={{fontSize:11,color:"#888",display:"block",marginBottom:3}}>Stbd Running Hrs *</label>
                        <input type="number" value={runHours.stbd} onChange={function(e){setRunHours(function(h){return Object.assign({},h,{stbd:e.target.value});});}} placeholder="e.g. 874" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1.5px solid #0d7a6e",fontSize:15,fontWeight:700,boxSizing:"border-box"}}/>
                      </div>
                    )}
                  </div>
                </Card>

                <Card style={{marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#0d1b2a",marginBottom:14}}>Inspection Items</div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr style={{background:"#f8f6f0",borderBottom:"2px solid #e8e4dc"}}>
                        <th style={{textAlign:"left",padding:"8px 10px",fontSize:11,color:"#888",fontWeight:700,width:30}}>No.</th>
                        <th style={{textAlign:"left",padding:"8px 10px",fontSize:11,color:"#888",fontWeight:700}}>Description</th>
                        <th style={{textAlign:"left",padding:"8px 10px",fontSize:11,color:"#888",fontWeight:700,width:200}}>Status</th>
                        <th style={{textAlign:"left",padding:"8px 10px",fontSize:11,color:"#888",fontWeight:700,width:180}}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CL_ITEMS.map(function(item,i){
                        var answered=answers[item.id]!==undefined&&answers[item.id]!=="";
                        return(
                          <tr key={item.id} style={{borderBottom:"1px solid #f4f2ed",background:answered?"#f9fffe":"transparent"}}>
                            <td style={{padding:"8px 10px",fontWeight:700,color:"#0d1b2a",fontSize:12}}>{item.id}</td>
                            <td style={{padding:"8px 10px",color:"#444",fontSize:12}}>{item.desc}</td>
                            <td style={{padding:"8px 10px"}}>{canEdit?renderInput(item):<span style={{fontSize:12,color:"#888"}}>{answers[item.id]||"-"}</span>}</td>
                            <td style={{padding:"8px 10px"}}>
                              {canEdit?<input value={remarks[item.id]||""} onChange={function(e){setRem(item.id,e.target.value);}} placeholder="Remarks..." style={{width:"100%",padding:"5px 7px",borderRadius:6,border:"1px solid #e0ddd5",fontSize:11,boxSizing:"border-box"}}/>:<span style={{fontSize:11,color:"#888"}}>{remarks[item.id]||""}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>

                {canEdit&&(
                  <Card style={{marginBottom:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,alignItems:"end"}}>
                      <div>
                        <label style={{fontSize:12,color:"#888",display:"block",marginBottom:5,fontWeight:600}}>Checked By</label>
                        <input value={checkedBy} onChange={function(e){setCheckedBy(e.target.value);}} placeholder="Name of person completing checklist" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e0ddd5",fontSize:13,boxSizing:"border-box"}}/>
                      </div>
                      <div>
                        <div style={{fontSize:11,color:"#888",marginBottom:6}}>Notification will be sent to Transport Manager for approval.</div>
                        <Btn onClick={submitCL} disabled={!runHours.port} style={{width:"100%",justifyContent:"center"}}>
                          <CheckCircle size={14}/>Submit & Notify Transport Manager
                        </Btn>
                      </div>
                    </div>
                    <div style={{marginTop:10,padding:"8px 12px",background:"#f8f6f0",borderRadius:7,fontSize:11,color:"#888"}}>
                      Instructions: Put tick mark after checking. Make remarks if any repair/damage happen and any electrical light, bilges are not working. Follow the instruction manual provided.
                    </div>
                  </Card>
                )}
                {!canEdit&&<ViewOnly/>}
              </div>
            )}
          </div>
        </div>
      )}


      {tab==="pdf"&&(
        <div>
          <Card style={{marginBottom:14,background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <CheckCircle size={28} color="#059669"/>
              <div>
                <div style={{fontWeight:700,fontSize:16,color:"#065f46"}}>Generate Checklist PDF</div>
                <div style={{fontSize:13,color:"#059669",marginTop:2}}>Opens a print-ready page in a new window. Use browser Print (Ctrl+P / Cmd+P) and choose "Save as PDF".</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{padding:"14px",background:"#fff",borderRadius:10,border:"1px solid #e8e4dc"}}>
                <div style={{fontWeight:700,color:"#0d1b2a",marginBottom:10,fontSize:14}}>Current / New Checklist</div>
                {boat?(
                  <div>
                    <div style={{fontSize:13,color:"#888",marginBottom:10}}>{boat.name} - {new Date().toLocaleDateString("en-GB")}</div>
                    <Btn onClick={function(){generatePDF(null,specVals,answers,remarks,runHours);}} style={{width:"100%",justifyContent:"center"}}>
                      <Download size={14}/>Open PDF Preview
                    </Btn>
                  </div>
                ):(
                  <div style={{fontSize:13,color:"#bbb",textAlign:"center",padding:"10px 0"}}>Go to New Checklist tab and select a vessel first</div>
                )}
              </div>
              <div style={{padding:"14px",background:"#fff",borderRadius:10,border:"1px solid #e8e4dc"}}>
                <div style={{fontWeight:700,color:"#0d1b2a",marginBottom:10,fontSize:14}}>From Completed Logs</div>
                {logs.length===0?(
                  <div style={{fontSize:13,color:"#bbb",textAlign:"center",padding:"10px 0"}}>No completed checklists yet</div>
                ):(
                  <div>
                    {logs.map(function(l,i){
                      return(
                        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:i<logs.length-1?"1px solid #f4f2ed":"none"}}>
                          <div>
                            <span style={{fontWeight:700,color:"#0d1b2a",fontSize:13}}>{l.boat}</span>
                            <span style={{color:"#888",fontSize:12,marginLeft:8}}>{l.date} - Capt. {l.captain}</span>
                          </div>
                          <Btn variant="secondary" style={{padding:"5px 10px",fontSize:11}} onClick={function(){generatePDF(l,null,l.answers||{},l.remarks||{},{port:l.portHrs,stbd:l.stbdHrs});}}>
                            <Download size={12}/>PDF
                          </Btn>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
          <Card style={{background:"#f8f6f0"}}>
            <div style={{fontWeight:700,color:"#0d1b2a",marginBottom:8,fontSize:14}}>How to save as PDF</div>
            {[["1","Click Open PDF Preview — a new browser window opens with the formatted checklist"],["2","In the new window, click the green Print / Save as PDF button"],["3","In the print dialog, change destination to Save as PDF"],["4","Click Save and choose where to store the file"]].map(function(step){
              return(
                <div key={step[0]} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:"1px solid #eee"}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:"#0d7a6e",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{step[0]}</div>
                  <div style={{fontSize:13,color:"#555",lineHeight:1.5}}>{step[1]}</div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {tab==="log"&&(
        <Card>
          <Hdr title="Completed Checklists"/>
          {logs.length===0&&<div style={{textAlign:"center",padding:40,color:"#bbb"}}>No completed checklists yet</div>}
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{borderBottom:"1px solid #f4f2ed"}}>{["Date","Vessel","Captain","Port Hrs","Stbd Hrs","Status","Notified","PDF"].map(function(h){return <th key={h} style={{textAlign:"left",padding:"7px 12px",color:"#aaa",fontSize:11,fontWeight:600}}>{h}</th>;})}</tr></thead>
            <tbody>
              {logs.map(function(l,i){
                return(
                  <tr key={i} style={{borderBottom:"1px solid #f8f6f0"}}>
                    <td style={{padding:"10px 12px",color:"#888",fontSize:12}}>{l.date}</td>
                    <td style={{padding:"10px 12px",fontWeight:700,color:"#0d1b2a"}}>{l.boat}</td>
                    <td style={{padding:"10px 12px",color:"#555"}}>{l.captain}</td>
                    <td style={{padding:"10px 12px",fontWeight:600,color:"#0d7a6e"}}>{l.portHrs} hrs</td>
                    <td style={{padding:"10px 12px",color:"#888"}}>{l.stbdHrs?l.stbdHrs+" hrs":"—"}</td>
                    <td style={{padding:"10px 12px"}}>{l.complete?<Bdg label="Complete" bg="#d1fae5" color="#065f46"/>:<Bdg label="Incomplete" bg="#fee2e2" color="#991b1b"/>}</td>
                    <td style={{padding:"10px 12px"}}><Bdg label="Sent" bg="#f0fdf4" color="#059669" style={{fontSize:10}}/></td>
                    <td style={{padding:"10px 12px"}}><button onClick={function(){generatePDF(l,null,l.answers||{},l.remarks||{},{port:l.portHrs,stbd:l.stbdHrs});}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #e0ddd5",background:"#fff",cursor:"pointer",fontSize:11,color:"#0d1b2a",display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}><Download size={11}/>PDF</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}


function Sidebar({active,onNav,collapsed,onToggle,user}){
  const alerts=MAINT.filter(function(m){return m.status==="due-soon";}).length;
  const visible=MODULES.filter(function(m){return can(user,m.id,"view");});
  const rt=ROLES[user.role];
  return(
    <div style={{width:collapsed?58:238,background:"#0d1b2a",height:"100vh",display:"flex",flexDirection:"column",flexShrink:0,transition:"width 0.2s",overflow:"hidden"}}>
      <div style={{padding:collapsed?"18px 0":"20px 18px",borderBottom:"1px solid #1e2f40",display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between"}}>
        {!collapsed&&<div><div style={{fontSize:15,fontWeight:800,color:"#e8e0d0",letterSpacing:"0.5px"}}>BAROS</div><div style={{fontSize:9,color:"#c9a84c",letterSpacing:"2px",marginTop:1}}>VMS - MALDIVES</div></div>}
        <button onClick={onToggle} style={{background:"none",border:"none",cursor:"pointer",color:"#8899aa",padding:4}}><Menu size={15}/></button>
      </div>
      <nav style={{flex:1,padding:"10px 0",overflowY:"auto"}}>
        {visible.map(function({id,label,Icon}){
          return(
            <button key={id} onClick={function(){onNav(id);}} style={{display:"flex",alignItems:"center",gap:11,width:"100%",padding:collapsed?"10px 0":"10px 16px",justifyContent:collapsed?"center":"flex-start",background:active===id?"#0d7a6e28":"none",border:"none",cursor:"pointer",borderLeft:"3px solid "+(active===id?"#0d7a6e":"transparent"),color:active===id?"#e8e0d0":"#8899aa",fontSize:13,fontWeight:active===id?700:400}}>
              <Icon size={16}/>
              {!collapsed&&<span style={{flex:1}}>{label}</span>}
              {!collapsed&&id==="maintenance"&&alerts>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700}}>{alerts}</span>}
              {!collapsed&&id==="users"&&<span style={{background:"#7c3aed",color:"#fff",borderRadius:10,padding:"1px 5px",fontSize:9,fontWeight:700}}>SA</span>}
            </button>
          );
        })}
      </nav>
      {!collapsed&&rt&&(
        <div style={{margin:"0 10px 8px",padding:"8px 12px",borderRadius:8,background:rt.color+"18"}}>
          <div style={{fontSize:10,color:rt.color,fontWeight:700}}>{rt.label}</div>
          <div style={{fontSize:10,color:"#8899aa",marginTop:1}}>{visible.length} modules accessible</div>
        </div>
      )}
      <div style={{padding:collapsed?"12px 0":"12px 16px",borderTop:"1px solid #1e2f40",display:"flex",alignItems:"center",gap:9,justifyContent:collapsed?"center":"flex-start"}}>
        <div style={{width:30,height:30,borderRadius:"50%",background:(user.ac||"#c9a84c")+"28",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:user.ac||"#c9a84c",flexShrink:0}}>{user.avatar||"??"}</div>
        {!collapsed&&<div style={{flex:1,overflow:"hidden"}}><div style={{fontSize:11,fontWeight:700,color:"#e8e0d0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div><div style={{fontSize:10,color:"#6677aa"}}>{user.username}</div></div>}
        {!collapsed&&<LogOut size={13} color="#6677aa" style={{cursor:"pointer",flexShrink:0}}/>}
      </div>
    </div>
  );
}

function TopBar({page,user,onLogout}){
  const labels={dashboard:"Dashboard",movement:"Boat Movement",fleet:"Fleet Profiles",activities:"Activities",fuel:"Fuel Log",duty:"Duty Roster",maintenance:"Maintenance",reports:"Reports",users:"User Management"};
  const alerts=MAINT.filter(function(m){return m.status==="due-soon";}).length;
  const rt=ROLES[user.role];
  return(
    <div style={{height:52,background:"#fff",borderBottom:"1px solid #e8e4dc",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",flexShrink:0}}>
      <div style={{fontSize:13,color:"#aaa"}}>
        <span style={{color:"#0d1b2a",fontWeight:600}}>Baros VMS</span>
        <ChevronRight size={13} style={{verticalAlign:"middle",margin:"0 4px"}}/>
        {labels[page]||page}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        {rt&&<Bdg label={rt.label} bg={rt.bg} color={rt.color} style={{fontSize:11}}/>}
        <div style={{position:"relative"}}>
          <Bell size={17} color="#aaa"/>
          {alerts>0&&<span style={{position:"absolute",top:-4,right:-4,width:15,height:15,borderRadius:"50%",background:"#ef4444",color:"#fff",fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{alerts}</span>}
        </div>
        <div style={{fontSize:12,color:"#aaa"}}>
          {new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit",timeZone:"Indian/Maldives"})} MVT
        </div>
        <button onClick={onLogout} style={{background:"none",border:"1px solid #e8e4dc",borderRadius:7,padding:"4px 10px",cursor:"pointer",fontSize:12,color:"#888",display:"flex",alignItems:"center",gap:4}}><LogOut size={13}/>Sign out</button>
      </div>
    </div>
  );
}

export default function App(){
  const [currentUser,setCurrentUser]=useState(null);
  const [users,setUsers]=useState(INIT_USERS);
  const [page,setPage]=useState("dashboard");
  const [collapsed,setCollapsed]=useState(false);

  const handleLogin=function(u){
    const fresh=users.find(function(x){return x.id===u.id;})||u;
    setCurrentUser(fresh);
    setUsers(function(us){return us.map(function(x){return x.id===u.id?{...x,lastLogin:new Date().toLocaleString("en-GB").slice(0,17)}:x;});});
    setPage("dashboard");
  };
  const handleLogout=function(){setCurrentUser(null);setPage("dashboard");};

  if(!currentUser){
    return(
      <div style={{fontFamily:"\'Plus Jakarta Sans\',system-ui,sans-serif"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');*{box-sizing:border-box;}@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        <Login onLogin={handleLogin} users={users}/>
      </div>
    );
  }

  const liveUser=users.find(function(u){return u.id===currentUser.id;})||currentUser;
  const visFirst=MODULES.find(function(m){return can(liveUser,m.id,"view");})||{id:"dashboard"};
  const activePage=can(liveUser,page,"view")?page:visFirst.id;

  const props={user:liveUser,users:users,setUsers:setUsers,onNav:setPage};

  const pageMap={
    dashboard: <Dashboard user={liveUser} onNav={setPage}/>,
    movement:  <Movement user={liveUser}/>,
    fleet:     <FleetPage user={liveUser}/>,
    activities:<ActivitiesPage user={liveUser}/>,
    fuel:      <FuelLogPage user={liveUser}/>,
    duty:      <DutyRosterPage user={liveUser}/>,
    maintenance:<MaintenancePage user={liveUser}/>,
    reports:   <ReportsPage user={liveUser}/>,
    checklist: <ChecklistPage user={liveUser}/>,
    users:     <UserMgmt user={liveUser} users={users} setUsers={setUsers}/>,
  };

  return(
    <div style={{display:"flex",height:"100vh",background:"#f8f6f0",fontFamily:"\'Plus Jakarta Sans\',system-ui,sans-serif",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:#f1efea;}
        ::-webkit-scrollbar-thumb{background:#c9a84c;border-radius:2px;}
        @keyframes spin{to{transform:rotate(360deg);}}
        select{cursor:pointer;}
      `}</style>
      <Sidebar active={activePage} onNav={setPage} collapsed={collapsed} onToggle={function(){setCollapsed(function(p){return !p;});}} user={liveUser}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <TopBar page={activePage} user={liveUser} onLogout={handleLogout}/>
        <main style={{flex:1,overflowY:"auto",padding:22}}>
          {pageMap[activePage]||pageMap.dashboard}
        </main>
      </div>
    </div>
  );
}
