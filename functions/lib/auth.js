const SESSION_PREFIX = "session:";
const SESSION_TTL = 60 * 60 * 24 * 7;

function json(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders }
    });
}

function cookieOptions(maxAge) {
    return [
        `Max-Age=${maxAge}`,
        "Path=/",
        "HttpOnly",
        "Secure",
        "SameSite=Lax"
    ].join("; ");
}

export async function getAdminSession(request, env) {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/(?:^|;\s*)nav_admin_session=([^;]+)/);
    if (!match) return null;

    const token = match[1];
    const session = await env.NAV_DB.get(`${SESSION_PREFIX}${token}`, "json");
    return session?.admin === true ? { token, ...session } : null;
}

export async function requireAdmin(request, env) {
    const session = await getAdminSession(request, env);
    if (!session) return null;
    return session;
}

export function setSessionCookie(token) {
    return `nav_admin_session=${token}; ${cookieOptions(SESSION_TTL)}`;
}

export function clearSessionCookie() {
    return cookieOptions(0);
}

export function responseWithCookie(data, status, cookie) {
    return json(data, status, { "Set-Cookie": cookie });
}

export { SESSION_PREFIX, SESSION_TTL, json };
