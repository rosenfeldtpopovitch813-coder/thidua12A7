const {requireGvcn} = require("../_firebase");

module.exports = async (req,res)=>{
  if(req.method!=="POST") return res.status(405).json({error:"Method Not Allowed"});
  try{
    const {app,decoded}=await requireGvcn(req);
    const {targetUid,allowOrphan}=req.body||{};
    if(!targetUid || typeof targetUid!=="string") return res.status(400).json({error:"Thiếu targetUid."});
    if(targetUid===decoded.uid) return res.status(400).json({error:"Không thể tự xóa tài khoản GVCN đang đăng nhập."});
    const ref=app.database().ref(`users/${targetUid}`);
    const snap=await ref.once("value");
    const profile=snap.val()||null;
    if(profile?.role==="gvcn") return res.status(403).json({error:"Không thể xóa tài khoản GVCN."});
    try{
      await app.auth().deleteUser(targetUid);
    }catch(err){
      if(err.code!=="auth/user-not-found") throw err;
      if(!allowOrphan && !profile) return res.status(404).json({error:"Tài khoản không tồn tại."});
    }
    await ref.remove();
    return res.status(200).json({ok:true,deletedUid:targetUid});
  }catch(err){
    console.error("delete-user",err);
    const status=err.statusCode||500;
    return res.status(status).json({error:err.code||err.message||"Lỗi máy chủ khi xóa tài khoản."});
  }
};
