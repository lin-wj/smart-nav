// Cloudflare Pages Function: /api/friend-links
// 友情链接数据持久化到 KV，同时兼容旧的 localStorage 存储。
const COOKIE = "nav_admin_session";
const KEY = "friend_links";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function isAdmin(request, env) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp("(^|;\\s*)" + COOKIE + "=([^;]+)"));
  if (!m) return false;
  return !!(await env.NAV_DB.get("session:" + m[2]));
}

export async function onRequest({ request, env }) {
  let raw = await env.NAV_DB.get(KEY);
  let arr = [];
  try { if (raw) arr = JSON.parse(raw); } catch {}

  const admin = await isAdmin(request, env);

  if (request.method === "GET") return json(arr);

  if (!admin) return json({ error: "Unauthorized" }, 401);
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let body = {};
  try { body = await request.json(); } catch { return json({ error: "Bad JSON" }, 400); }

  if (!Array.isArray(body)) return json({ error: "Expected array" }, 400);

  // 规范化每条数据，补全 id
  body = body.map((x) => ({
    id: x.id || crypto.randomUUID(),
    name: String(x.name || "未命名"),
    url: String(x.url || "#"),
  }));

  await env.NAV_DB.put(KEY, JSON.stringify(body));
  return json({ success: true });
}
