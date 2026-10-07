const { getApps, initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getDatabase } = require("firebase-admin/database");

function adminServices() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing");
  }
  if (!process.env.FIREBASE_DATABASE_URL) {
    throw new Error("FIREBASE_DATABASE_URL is missing");
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });

  return {
    auth: getAuth(app),
    db: getDatabase(app),
  };
}

function json(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const authHeader = String(req.headers.authorization || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return json(res, 401, { error: "UNAUTHENTICATED" });

    const { auth, db } = adminServices();
    const decoded = await auth.verifyIdToken(token);
    const actorSnap = await db.ref(`users/${decoded.uid}`).get();
    const actor = actorSnap.exists() ? actorSnap.val() : null;

    if (!actor || actor.active === false || actor.role !== "gvcn") {
      return json(res, 403, { error: "FORBIDDEN" });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const targetUid = String(body.targetUid || "").trim();
    const newPassword = String(body.newPassword || "");

    if (!targetUid) return json(res, 400, { error: "Thiếu targetUid" });
    if (targetUid === decoded.uid) return json(res, 400, { error: "Tài khoản GVCN hãy dùng chức năng đổi mật khẩu riêng" });
    if (newPassword.length < 6) return json(res, 400, { error: "Mật khẩu tối thiểu 6 ký tự" });

    const targetSnap = await db.ref(`users/${targetUid}`).get();
    const target = targetSnap.exists() ? targetSnap.val() : null;
    if (!target) return json(res, 404, { error: "Không tìm thấy hồ sơ tài khoản" });
    if (target.role === "gvcn") return json(res, 403, { error: "Không thể dùng chức năng này để đổi mật khẩu GVCN" });

    const userRecord = await auth.updateUser(targetUid, { password: newPassword });
    await auth.revokeRefreshTokens(targetUid);

    return json(res, 200, {
      ok: true,
      uid: userRecord.uid,
      username: target.username || "",
    });
  } catch (err) {
    console.error("reset-password error", err);
    const code = String(err?.code || "");
    if (code === "auth/id-token-expired" || code === "auth/argument-error" || code === "auth/invalid-id-token") {
      return json(res, 401, { error: "UNAUTHENTICATED" });
    }
    if (String(err?.message || "").includes("FIREBASE_SERVICE_ACCOUNT_JSON") || String(err?.message || "").includes("FIREBASE_DATABASE_URL")) {
      return json(res, 500, { error: "Server chưa cấu hình FIREBASE_SERVICE_ACCOUNT_JSON / FIREBASE_DATABASE_URL" });
    }
    return json(res, 500, { error: "Không thể đổi mật khẩu tài khoản này" });
  }
};
