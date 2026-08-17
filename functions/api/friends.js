// Cloudflare Pages Function: /api/friends
// GET：过滤私密友链；POST/DELETE：需管理员认证。
const COOKIE = "nav_admin_session";
const KEY = "friend_links";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

async function isAdmin(request, env) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp("(^|;\\s*)" + COOKIE + "=([^;]+)"));
  if (!m) return false;
  return !!(await env.NAV_DB.get("session:" + m[2]));
}
function isPrivate(v) { return v === true || v === "true"; }
function pub(arr) { return (arr || []).filter(x => !isPrivate(x.private)); }

export async function onRequest({ request, env }) {
  const raw = await env.NAV_DB.get(KEY);
  let arr = [];
  try { if (raw) arr = JSON.parse(raw); } catch {}
  const admin = await isAdmin(request, env);

  if (request.method === "GET") return json(admin ? arr : pub(arr));
  if (!admin) return json({ error: "Unauthorized" }, 401);

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Bad JSON" }, 400); }
    const link = {
      id: body.id || crypto.randomUUID(),
      name: String(body.name || "未命名"),
      url: String(body.url || "#"),
      private: body.private === true
    };
    arr.push(link);
    await env.NAV_DB.put(KEY, JSON.stringify(arr));
    return json({ success: true });
  }

  if (request.method === "DELETE") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Bad JSON" }, 400); }
    const id = body.id;
    if (!id) return json({ error: "Missing id" }, 400);
    arr = arr.filter(x => x.id !== id);
    await env.NAV_DB.put(KEY, JSON.stringify(arr));
    return json({ success: true });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
