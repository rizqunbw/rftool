export default function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  const bank=process.env.PAYMENT_BANK_NAME;
  const accountNumber=process.env.PAYMENT_ACCOUNT_NUMBER;
  const accountName=process.env.PAYMENT_ACCOUNT_NAME;
  const whatsapp=process.env.PAYMENT_WHATSAPP;
  if(!bank||!accountNumber||!accountName||!whatsapp) return res.status(503).json({error:"Payment configuration unavailable"});
  res.setHeader("Cache-Control","no-store");
  return res.status(200).json({bank,accountNumber,accountName,whatsapp});
}
