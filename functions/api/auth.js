import {
    SESSION_PREFIX,
    SESSION_TTL,
    getAdminSession,
    json,
    responseWithCookie,
    setSessionCookie,
    clearSessionCookie
} from "../lib/auth.js";

const DEFAULT_PASSWORD = "admin888";

async function getConfig(env) {
    const data = await env.NAV_DB.get("site_config", "json");
    return data || {};
}

function randomToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequest(context) {
    const { request, env } = context;

    if (!env.NAV_DB) {
        return json({ success: false, message: "KV binding NAV_DB is missing." }, 500);
    }

    if (request.method === "GET") {
        const session = await getAdminSession(request, env);
        return json({ authenticated: !!session });
    }

    if (request.method === "POST") {
        try {
            const body = await request.json();
            const password = String(body?.password ?? "");
            const config = await getConfig(env);
            const validPassword = config.adminPwd || DEFAULT_PASSWORD;

            if (!password || password !== validPassword) {
                return json({ success: false, message: "Invalid password." }, 401);
            }

            const token = randomToken();
            await env.NAV_DB.put(
                `${SESSION_PREFIX}${token}`,
                JSON.stringify({ admin: true, createdAt: Date.now() }),
                { expirationTtl: SESSION_TTL }
            );

            return responseWithCookie(
                { success: true, authenticated: true },
                200,
                setSessionCookie(token)
            );
        } catch {
            return json({ success: false, message: "Invalid request." }, 400);
        }
    }

    if (request.method === "DELETE") {
        const session = await getAdminSession(request, env);
        if (session?.token) {
            await env.NAV_DB.delete(`${SESSION_PREFIX}${session.token}`);
        }
        return responseWithCookie(
            { success: true, authenticated: false },
            200,
            `nav_admin_session=; ${clearSessionCookie()}`
        );
    }

    return json({ success: false, message: "Method not allowed." }, 405);
}
