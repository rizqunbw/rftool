import React, { useState } from "react";
import "./npc-calculator.css";

const fmt = n => new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);
const clean = v => String(v).replace(/,/g,"").replace(/[^0-9.]/g,"");
const grouped = v => { const raw=clean(v); const [whole,...rest]=raw.split("."); return (whole ? Number(whole).toLocaleString("en-US") : "") + (rest.length ? "."+rest.join("") : ""); };
const numeric = v => Number(clean(v)) || 0;
function NumberField({value,onChange,decimal=false,...props}){return <input {...props} type="text" inputMode={decimal?"decimal":"numeric"} value={grouped(value)} onChange={e=>onChange(clean(e.target.value))}/>}
export default function NPCPriceCalculator(){
 const [target,setTarget]=useState("1000000");
 const [stack,setStack]=useState("250");
 const [tax,setTax]=useState("1");
 const [testPrice,setTestPrice]=useState("8889");
 const qty=Math.max(1,Math.floor(numeric(stack)||1));
 const rate=Math.min(100,Math.max(0,numeric(tax)||0));
 const factor=qty/2*(1-rate/100);
 const wanted=Math.max(0,Math.floor(numeric(target)||0));
 const std=factor>0?Math.ceil(wanted/factor):0;
 const actual=Math.floor(std*factor);
 const test=Math.max(0,Math.floor(numeric(testPrice)||0));
 const testResult=Math.floor(test*factor);
 return <section className="npc-calc">
  <div className="npc-calc-head"><div><p className="kicker">RF ONLINE TOOLS / KALKULATOR</p><h2>Kalkulator Harga Jual ke NPC</h2><p className="sub">Cari StdPrice Excel berdasarkan target harga jual, max stack, dan pajak NPC.</p></div><span className="mono-chip">RUMUS RF ONLINE</span></div>
  <div className="npc-calc-grid"><div className="npc-calc-panel">
   <label>Max Stack (pcs)<NumberField value={stack} onChange={e=>setStack(e.target.value)}/></label>
   <label>Harga Jual ke NPC yang Diinginkan (Disena)<NumberField value={target} onChange={e=>setTarget(e.target.value)}/></label>
   <label>Pajak NPC (%)<NumberField decimal value={tax} onChange={e=>setTax(e.target.value)}/></label>
   <button type="button" className="ghost" onClick={()=>{setStack("250");setTarget("1000000");setTax("1");setTestPrice("8889")}}>Reset</button>
   <div className="npc-formula">Rumus: StdPrice = ROUNDUP(Target × 2 / (Max Stack × (1 − Pajak/100)))<p>Rumus diuji terhadap contoh Gold Pig Statue: StdPrice 8.889, stack 250, pajak 1%, hasil 1.100.013 Disena. Pembulatan harga jual diasumsikan ke bawah.</p></div>
  </div><div className="npc-calc-panel npc-calc-results">
    <p className="kicker">HASIL KALKULASI</p>
    <div className="npc-result-primary"><span>StdPrice Excel yang Harus Diisi</span><strong>{factor>0?fmt(std):"Pajak tidak valid"}</strong></div>
    <div className="npc-stat"><span>Max Stack</span><strong>{fmt(qty)} pcs</strong></div>
    <div className="npc-stat"><span>Target Harga Jual</span><strong>{fmt(wanted)} Disena</strong></div>
    <div className="npc-stat npc-total"><span>Perkiraan Harga Jual Aktual</span><strong>{factor>0?fmt(actual):"—"} Disena</strong></div>
    <div className="npc-stat"><span>Selisih dari Target</span><strong>{factor>0?fmt(actual-wanted):"—"} Disena</strong></div>
    <div className="npc-formula">CEK HARGA DARI STDPRICE EXCEL</div>
    <label>StdPrice Excel yang Ingin Diuji<NumberField value={testPrice} onChange={e=>setTestPrice(e.target.value)}/></label>
    <div className="npc-result-primary"><span>Perkiraan Harga Jual ke NPC</span><strong>{fmt(testResult)} Disena</strong></div>
  </div></div>
 </section>;
}