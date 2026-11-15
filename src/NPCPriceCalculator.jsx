import React, { useState } from "react";
import "./npc-calculator.css";

const format = n => new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);
export default function NPCPriceCalculator(){
 const [target,setTarget]=useState("1000000");
 const [quantity,setQuantity]=useState("250");
 const [tax,setTax]=useState("1");
 const [deduction,setDeduction]=useState("0.45");
 const [mode,setMode]=useState("net");
 const [rounding,setRounding]=useState("ceil");
 const amount=Math.max(0,Number(target)||0),qty=Math.max(1,Math.floor(Number(quantity)||1));
 const t=Math.min(100,Math.max(0,Number(tax)||0))/100;
 const d=Math.min(100,Math.max(0,Number(deduction)||0))/100;
 const taxFactor=1-t, deductionFactor=1-d;
 const effectiveFactor=taxFactor*deductionFactor;
 const raw=mode==="net"?(effectiveFactor>0?amount/effectiveFactor:0):amount;
 const price=rounding==="ceil"?Math.ceil(raw):rounding==="floor"?Math.floor(raw):Math.round(raw);
 const taxAmount=price*t,afterTax=price-taxAmount,cut=afterTax*d,received=afterTax-cut;
 const unit=price/qty;
 return <section className="npc-calc">
  <div className="npc-calc-head"><div><p className="kicker">RF ONLINE TOOLS / CALCULATOR</p><h2>NPC Sell Price Calculator</h2><p className="sub">Calculate the required sale price for a stack of 250 items, including tax and deductions.</p></div><span className="mono-chip">250 PCS · 1% TAX</span></div>
  <div className="npc-calc-grid"><div className="npc-calc-panel">
   <label>Calculation mode<select value={mode} onChange={e=>setMode(e.target.value)}><option value="net">Target net amount → required sell price</option><option value="gross">Gross sell price → net amount</option></select></label>
   <label>{mode==="net"?"Target amount received (net)":"Total selling price (gross)"}<input type="number" min="0" value={target} onChange={e=>setTarget(e.target.value)}/></label>
   <div className="npc-calc-pair"><label>Quantity (pcs)<input type="number" min="1" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><label>NPC tax (%)<input type="number" min="0" max="100" step=".01" value={tax} onChange={e=>setTax(e.target.value)}/></label></div>
   <label>Additional deduction (%)<input type="number" min="0" max="100" step=".01" value={deduction} onChange={e=>setDeduction(e.target.value)}/></label>
   <label>Rounding<select value={rounding} onChange={e=>setRounding(e.target.value)}><option value="ceil">Round up (recommended for target net)</option><option value="round">Nearest whole number</option><option value="floor">Round down</option></select></label>
   <button type="button" className="ghost" onClick={()=>{setTarget("1000000");setQuantity("250");setTax("1");setDeduction("0.45");setMode("net");setRounding("ceil")}}>Reset defaults</button>
  </div><div className="npc-calc-panel npc-calc-results">
    <p className="kicker">CALCULATED RESULT</p><div className="npc-result-primary"><span>Required total selling price</span><strong>{format(price)}</strong></div>
    <div className="npc-stat"><span>Price per item</span><strong>{format(unit)}</strong></div>
    <div className="npc-stat"><span>NPC tax ({format(t*100)}%)</span><strong>−{format(taxAmount)}</strong></div>
    <div className="npc-stat"><span>After NPC tax</span><strong>{format(afterTax)}</strong></div>
    <div className="npc-stat"><span>Additional deduction ({format(d*100)}%)</span><strong>−{format(cut)}</strong></div>
    <div className="npc-stat npc-total"><span>Net amount received</span><strong>{format(received)}</strong></div>
    <div className="npc-formula">Net = Gross × (1 − tax/100) × (1 − deduction/100)<p>Rates are applied sequentially. This is an adjustable model; verify the game's rounding and tax behavior before relying on a final in-game price.</p></div>
  </div></div>
 </section>;
}
