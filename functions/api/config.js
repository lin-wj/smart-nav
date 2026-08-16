import { requireAdmin, json } from "../lib/auth.js";

function sanitizeForPublic(config) {
    const data = config || {};
    const sections = Array.isArray(data.dynamicSections) ? data.dynamicSections : [];

    return {
        wallpaper: typeof data.wallpaper === "string" ? data.wallpaper : "",
        dynamicSections: sections
            .filter(section => section && section.private !== true)
            .map(section => ({
                id: String(section.id),
                title: String(section.title || ""),
                private: false,
                links: Array.isArray(section.links)
                    ? section.links.filter(link => link && link.private !== true).map(link => ({
                        name: String(link.name || ""),
                        url: String(link.url || ""),
                        private: false
                    }))
                    : []
            }))
    };
}

export async function onRequest(context) {
    const { request, env } = context;

    if (!env.NAV_DB) return json({ success: false, message: "KV binding NAV_DB is missing." }, 500);

    if (request.method === "GET") {
        const config = await env.NAV_DB.get("site_config", "json");
        const admin = await requireAdmin(request, env);

        // 管理员拿到完整配置；普通访客永远拿不到 adminPwd，也拿不到私密分类/书签。
        return json(admin ? (config || {}) : sanitizeForPublic(config || {}));
    }

    if (request.method === "POST") {
        const admin = await requireAdmin(request, env);
        if (!admin) return json({ success: false, message: "Unauthorized." }, 401);

        try {
            const body = await request.json();
            const current = (await env.NAV_DB.get("site_config", "json")) || {};

            // 前端即使误删字段，也不会把管理员密码清空。
            const next = {
                ...current,
                wallpaper: typeof body.wallpaper === "string" ? body.wallpaper : (current.wallpaper || ""),
                dynamicSections: Array.isArray(body.dynamicSections) ? body.dynamicSections : (current.dynamicSections || [])
            };

            if (typeof body.adminPwd === "string" && body.adminPwd.trim()) {
                next.adminPwd = body.adminPwd.trim();
            }

            await env.NAV_DB.put("site_config", JSON.stringify(next));
            return json({ success: true });
        } catch {
            return json({ success: false, message: "Invalid JSON." }, 400);
        }
    }

    return json({ success: false, message: "Method not allowed." }, 405);
}
