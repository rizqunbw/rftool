const SUPABASE_URL="https://xtkkdzthgusjxjzljhqb.supabase.co";
const KEY="sb_publishable_mj8-vlJAvqijqM--F3N9kQ_AK3vX30U";
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({ok:false});
 const b=req.body||{},type=b.eventType;
 if(!["login","register"].includes(type))return res.status(400).json({ok:false});
 const ip=String(req.headers["x-forwarded-for"]||req.headers["x-real-ip"]||"").split(",")[0].trim();
 const ua=String(req.headers["user-agent"]||"");
 try{
  const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/record_auth_event",{method:"POST",headers:{"content-type":"application/json","apikey":KEY},body:JSON.stringify({p_secret:process.env.AUTH_LOG_SECRET,p_event_type:type,p_success:!!b.success,p_email:String(b.email||"").slice(0,320),p_user_id:b.userId||null,p_ip:ip,p_user_agent:ua,p_error_message:b.error?String(b.error).slice(0,1000):null})});
  if(!r.ok)throw new Error("log failed");
  return res.status(200).json({ok:true});
 }catch{return res.status(200).json({ok:false})}
}