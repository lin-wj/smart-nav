import { requireAdmin, json } from "../lib/auth.js";

function sanitizeLinks(links) {
    return (Array.isArray(links) ? links : [])
        .filter(link => link && link.private !== true)
        .map(link => ({
            name: String(link.name || ""),
            url: String(link.url || ""),
            private: false
        }));
}

export async function onRequest(context) {
    const { request, env } = context;

    if (!env.NAV_DB) return json({ success: false, message: "KV binding NAV_DB is missing." }, 500);

    if (request.method === "GET") {
        const links = await env.NAV_DB.get("custom_links", "json");
        const admin = await requireAdmin(request, env);
        return json(admin ? (links || []) : sanitizeLinks(links));
    }

    if (request.method === "POST") {
        const admin = await requireAdmin(request, env);
        if (!admin) return json({ success: false, message: "Unauthorized." }, 401);

        try {
            const body = await request.json();
            if (!Array.isArray(body)) return json({ success: false, message: "Links must be an array." }, 400);
            await env.NAV_DB.put("custom_links", JSON.stringify(body));
            return json({ success: true });
        } catch {
            return json({ success: false, message: "Invalid JSON." }, 400);
        }
    }

    return json({ success: false, message: "Method not allowed." }, 405);
}
