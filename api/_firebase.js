const admin = require("firebase-admin");

function getServiceAccount(){
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if(!raw) throw new Error("Thiếu FIREBASE_SERVICE_ACCOUNT_JSON trên Vercel.");
  let svc;
  try { svc = JSON.parse(raw); }
  catch { throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON không phải JSON hợp lệ."); }
  if(svc.private_key) svc.private_key = String(svc.private_key).replace(/\\n/g,"\n");
  return svc;
}

function getApp(){
  if(admin.apps.length) return admin.app();
  const serviceAccount = getServiceAccount();
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  if(!databaseURL) throw new Error("Thiếu FIREBASE_DATABASE_URL trên Vercel.");
  return admin.initializeApp({credential: admin.credential.cert(serviceAccount), databaseURL});
}

async function requireGvcn(req){
  const app = getApp();
  const authHeader = String(req.headers.authorization || "");
  if(!authHeader.startsWith("Bearer ")){
    const e = new Error("UNAUTHENTICATED"); e.statusCode = 401; throw e;
  }
  const token = authHeader.slice(7).trim();
  if(!token){ const e=new Error("UNAUTHENTICATED");e.statusCode=401;throw e; }
  let decoded;
  try { decoded = await app.auth().verifyIdToken(token, true); }
  catch { const e=new Error("Phiên xác thực không hợp lệ hoặc đã hết hạn.");e.statusCode=401;throw e; }
  const snap = await app.database().ref(`users/${decoded.uid}`).once("value");
  const profile = snap.val() || null;
  if(!profile || profile.role !== "gvcn" || profile.active === false){
    const e=new Error("Chỉ GVCN đang hoạt động mới được thực hiện thao tác này.");e.statusCode=403;throw e;
  }
  return {app,decoded,profile};
}

module.exports={getApp,requireGvcn};
