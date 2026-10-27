export default function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({ok:false});
  res.setHeader("Set-Cookie","rftool_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
  return res.status(200).json({ok:true});
}