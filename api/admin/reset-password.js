const {requireGvcn} = require("../_firebase");

module.exports = async (req,res)=>{
  if(req.method!=="POST") return res.status(405).json({error:"Method Not Allowed"});
  try{
    const {app,decoded}=await requireGvcn(req);
    const {targetUid,newPassword}=req.body||{};
    if(!targetUid || typeof targetUid!=="string") return res.status(400).json({error:"Thiếu targetUid."});
    if(typeof newPassword!=="string" || newPassword.length<6) return res.status(400).json({error:"Mật khẩu phải có ít nhất 6 ký tự."});
    if(targetUid===decoded.uid) return res.status(400).json({error:"Tài khoản GVCN hãy dùng chức năng đổi mật khẩu riêng."});
    const targetSnap=await app.database().ref(`users/${targetUid}`).once("value");
    const target=targetSnap.val();
    if(!target) return res.status(404).json({error:"Không tìm thấy hồ sơ tài khoản cần đổi mật khẩu."});
    if(target.role==="gvcn") return res.status(403).json({error:"Không thể đổi mật khẩu GVCN bằng chức năng này."});
    await app.auth().updateUser(targetUid,{password:newPassword});
    return res.status(200).json({ok:true});
  }catch(err){
    console.error("reset-password",err);
    const status=err.statusCode||500;
    return res.status(status).json({error:err.code||err.message||"Lỗi máy chủ khi đổi mật khẩu."});
  }
};
