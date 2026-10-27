import crypto from "node:crypto";
function cookies(raw=""){return Object.fromEntries(raw.split(";").map(v=>v.trim().split("=")).filter(v=>v.length===2))}
export default function handler(req,res){
  const secret=process.env.RFTOOL_SESSION_SECRET;if(!secret)return res.status(500).json({ok:false});
  const expected=crypto.createHmac("sha256",secret).update("rftool-authenticated").digest("hex");
  const actual=cookies(req.headers.cookie||"").rftool_session||"";
  const a=Buffer.from(actual),b=Buffer.from(expected);
  const ok=a.length===b.length&&crypto.timingSafeEqual(a,b);
  return res.status(ok?200:401).json({ok});
}