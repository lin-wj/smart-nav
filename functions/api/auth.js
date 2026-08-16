// Cloudflare Pages Function: /api/auth
// 管理员密码保存在 KV；登录成功后只发 HttpOnly Session Cookie。
// 浏览器永远不会拿到管理员密码。

const COOKIE = "nav_admin_session";
const CONFIG_KEY = "site_config";
const TTL = 60 * 60 * 24 * 7;


// JSON 返回函数（修复 Set-Cookie 无法传递的问题）
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}


// 获取 Cookie
function getCookie(request) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(
    new RegExp("(^|;\\s*)" + COOKIE + "=([^;]+)")
  );
  return m ? m[2] : null;
}


// 获取站点配置
async function getConfig(env) {
  let c = {};
  try {
    c = JSON.parse(
      (await env.NAV_DB.get(CONFIG_KEY)) || "{}"
    );
  } catch {}

  return c;
}


export async function onRequest({ request, env }) {

  // 查询登录状态
  if (request.method === "GET") {

    const token = getCookie(request);

    return json({
      authenticated: !!(
        token &&
        await env.NAV_DB.get("session:" + token)
      )
    });
  }


  // 登录
  if (request.method === "POST") {

    let body;

    try {
      body = await request.json();
    } catch {
      return json({
        error: "Bad JSON"
      }, 400);
    }


    const c = await getConfig(env);

    const pwd = c.adminPwd;


    // 防止 KV 配置丢失导致默认密码泄露
    if (!pwd) {
      return json({
        error: "Server configuration error"
      }, 500);
    }


    // 密码错误
    if (String(body.password || "") !== pwd) {
      return json({
        error: "Invalid password"
      }, 401);
    }


    // 创建 Session
    const token = crypto.randomUUID();


    await env.NAV_DB.put(
      "session:" + token,
      "1",
      {
        expirationTtl: TTL
      }
    );


    // 登录成功，写入 HttpOnly Cookie
    return json(
      {
        success: true
      },
      200,
      {
        "Set-Cookie":
          `${COOKIE}=${token}; Max-Age=${TTL}; Path=/; HttpOnly; Secure; SameSite=Lax`
      }
    );
  }



  // 登出
  if (request.method === "DELETE") {

    const token = getCookie(request);


    if (token) {
      await env.NAV_DB.delete(
        "session:" + token
      );
    }


    return new Response(null, {
      status: 204,
      headers: {
        "Set-Cookie":
          `${COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`
      }
    });
  }



  return new Response(
    "Method Not Allowed",
    {
      status: 405
    }
  );
}