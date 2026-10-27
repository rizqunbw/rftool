import crypto from "node:crypto";

function expectedToken() {
  const secret = process.env.RFTOOL_SESSION_SECRET || "";
  return crypto.createHmac("sha256", secret).update("rftool-authenticated").digest("hex");
}
function safeEqual(a,b){
  const aa=Buffer.from(String(a)),bb=Buffer.from(String(b));
  return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}
export default function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({ok:false});
  const user=process.env.RFTOOL_USERNAME,password=process.env.RFTOOL_PASSWORD,secret=process.env.RFTOOL_SESSION_SECRET;
  if(!user||!password||!secret) return res.status(500).json({ok:false,error:"Server auth is not configured."});
  const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):(req.body||{});
  if(!safeEqual(body.username||"",user)||!safeEqual(body.password||"",password)) return res.status(401).json({ok:false});
  res.setHeader("Set-Cookie","rftool_session="+expectedToken()+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200");
  return res.status(200).json({ok:true});
}