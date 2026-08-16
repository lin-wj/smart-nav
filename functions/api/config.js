// Cloudflare Pages Function: /api/config
// GET：未登录只返回公开配置；登录后返回完整分类与书签。
// POST：仅管理员可修改配置。
const COOKIE = "nav_admin_session";
const CONFIG_KEY = "site_config";
const SESSION_TTL = 60 * 60 * 24 * 7;

function json(data, status=200, headers={}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type":"application/json; charset=utf-8", ...headers}
  });
}
function isPrivate(v){ return v === true || v === "true"; }

async function isAdmin(request, env){
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp("(^|;\\s*)"+COOKIE+"=([^;]+)"));
  if(!m) return false;
  return !!(await env.NAV_DB.get("session:"+m[2]));
}
function publicConfig(c){
  return {
    wallpaper: c.wallpaper || "",
    dynamicSections: (c.dynamicSections || []).filter(s=>!isPrivate(s.private)).map(s=>({
      id:s.id,title:s.title,private:false,
      links:(s.links||[]).filter(l=>!isPrivate(l.private)).map(l=>({id:l.id,name:l.name,url:l.url,private:false}))
    }))
  };
}

export async function onRequest(context){
  const {request,env}=context;
  let raw=await env.NAV_DB.get(CONFIG_KEY);
  let c={wallpaper:"",dynamicSections:[],adminPwd:"admin888"};
  try{if(raw)c={...c,...JSON.parse(raw)}}catch{}
  const admin=await isAdmin(request,env);

  if(request.method==="GET") return json(admin ? {
    wallpaper:c.wallpaper||"",
    dynamicSections:c.dynamicSections||[]
  } : publicConfig(c));

  if(request.method!=="POST") return new Response("Method Not Allowed",{status:405});

  if(!admin) return json({error:"Unauthorized"},401);

  let body={};try{body=await request.json()}catch{return json({error:"Bad JSON"},400)}
  // 修改密码使用 {adminPwd:"..."}，不把密码返回给浏览器。
  if(typeof body.adminPwd==="string"){
    if(body.adminPwd.trim().length<6)return json({error:"密码至少6位"},400);
    c.adminPwd=body.adminPwd.trim();
  }
  if("wallpaper" in body)c.wallpaper=String(body.wallpaper||"");
  if(Array.isArray(body.dynamicSections))c.dynamicSections=body.dynamicSections;

  await env.NAV_DB.put(CONFIG_KEY,JSON.stringify(c));
  return json({success:true});
}
