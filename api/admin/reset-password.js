let adminModulesPromise;

async function loadAdminModules() {
  if (!adminModulesPromise) {
    adminModulesPromise = Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/auth"),
      import("firebase-admin/database"),
    ]).then(([app, auth, database]) => ({ app, auth, database }));
  }
  return adminModulesPromise;
}

function json(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "";
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64 || "";
  if (!raw && !b64) {
    const e = new Error("SERVICE_ACCOUNT_MISSING");
    e.code = "config/service-account-missing";
    throw e;
  }

  let parsed;
  try {
    const text = raw || Buffer.from(b64, "base64").toString("utf8");
    parsed = JSON.parse(text);
  } catch {
    const e = new Error("SERVICE_ACCOUNT_INVALID_JSON");
    e.code = "config/service-account-invalid-json";
    throw e;
  }

  if (!parsed || !parsed.project_id || !parsed.client_email || !parsed.private_key) {
    const e = new Error("SERVICE_ACCOUNT_INCOMPLETE");
    e.code = "config/service-account-incomplete";
    throw e;
  }

  // Protect against a value pasted with literal \\n instead of real newlines.
  parsed.private_key = String(parsed.private_key).replace(/\\n/g, "\n");
  return parsed;
}

function getDatabaseUrl() {
  const url = String(process.env.FIREBASE_DATABASE_URL || "").trim();
  if (!url) {
    const e = new Error("DATABASE_URL_MISSING");
    e.code = "config/database-url-missing";
    throw e;
  }
  return url.replace(/\/+$/, "");
}

let cachedApp;

async function getServices() {
  const modules = await loadAdminModules();
  const { getApps, initializeApp, cert } = modules.app;
  const { getAuth } = modules.auth;
  const { getDatabase } = modules.database;

  if (!cachedApp) {
    cachedApp = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert(getServiceAccount()),
          databaseURL: getDatabaseUrl(),
        });
  }

  return { auth: getAuth(cachedApp), db: getDatabase(cachedApp) };
}

function errorResponse(res, err) {
  console.error("reset-password error", err);
  const code = String(err?.code || "");
  const message = String(err?.message || "");

  if (code.startsWith("config/")) {
    const configMessages = {
      "config/service-account-missing": "Vercel chưa có FIREBASE_SERVICE_ACCOUNT_JSON (hoặc FIREBASE_SERVICE_ACCOUNT_JSON_B64).",
      "config/service-account-invalid-json": "FIREBASE_SERVICE_ACCOUNT_JSON không phải JSON hợp lệ.",
      "config/service-account-incomplete": "Service Account thiếu project_id, client_email hoặc private_key.",
      "config/database-url-missing": "Vercel chưa có FIREBASE_DATABASE_URL.",
    };
    return json(res, 500, { error: configMessages[code] || "Cấu hình Firebase Admin chưa đúng.", code });
  }

  if (code === "auth/id-token-expired" || code === "auth/argument-error" || code === "auth/invalid-id-token") {
    return json(res, 401, { error: "UNAUTHENTICATED", code });
  }
  if (code === "auth/user-not-found") {
    return json(res, 404, { error: "Tài khoản này tồn tại trong danh sách lớp nhưng không tồn tại trong Firebase Authentication.", code });
  }
  if (code === "auth/invalid-password") {
    return json(res, 400, { error: "Mật khẩu không hợp lệ. Hãy dùng ít nhất 6 ký tự.", code });
  }
  if (code === "auth/too-many-requests") {
    return json(res, 429, { error: "Firebase đang giới hạn yêu cầu. Hãy thử lại sau ít phút.", code });
  }
  if (message.includes("FIREBASE_SERVICE_ACCOUNT") || message.includes("FIREBASE_DATABASE_URL")) {
    return json(res, 500, { error: "Server Firebase Admin chưa được cấu hình đúng trên Vercel.", code: "CONFIG_ERROR" });
  }
  return json(res, 500, { error: message || "Không thể đổi mật khẩu tài khoản này.", code: code || "SERVER_ERROR" });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const authHeader = String(req.headers.authorization || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return json(res, 401, { error: "UNAUTHENTICATED" });

    const { auth, db } = await getServices();
    const decoded = await auth.verifyIdToken(token);
    const actorSnap = await db.ref(`users/${decoded.uid}`).get();
    const actor = actorSnap.exists() ? actorSnap.val() : null;

    if (!actor || actor.active === false || String(actor.role || "").toLowerCase() !== "gvcn") {
      return json(res, 403, { error: "FORBIDDEN" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const targetUid = String(body.targetUid || "").trim();
    const newPassword = String(body.newPassword || "");

    if (!targetUid) return json(res, 400, { error: "Thiếu targetUid" });
    if (targetUid === decoded.uid) return json(res, 400, { error: "Tài khoản GVCN hãy dùng chức năng đổi mật khẩu riêng" });
    if (newPassword.length < 6) return json(res, 400, { error: "Mật khẩu tối thiểu 6 ký tự" });

    const targetSnap = await db.ref(`users/${targetUid}`).get();
    const target = targetSnap.exists() ? targetSnap.val() : null;
    if (!target) return json(res, 404, { error: "Không tìm thấy hồ sơ tài khoản" });
    if (String(target.role || "").toLowerCase() === "gvcn") return json(res, 403, { error: "Không thể dùng chức năng này để đổi mật khẩu GVCN" });

    const userRecord = await auth.updateUser(targetUid, { password: newPassword });
    await auth.revokeRefreshTokens(targetUid);

    return json(res, 200, {
      ok: true,
      uid: userRecord.uid,
      username: target.username || "",
    });
  } catch (err) {
    return errorResponse(res, err);
  }
};
