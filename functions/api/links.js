// Cloudflare Pages Function: /api/links
const COOKIE="nav_admin_session";
const KEY="custom_links";

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8"}});
}
async function admin(request,env){
  const c=request.headers.get("Cookie")||"";
  const m=c.match(new RegExp("(^|;\\s*)"+COOKIE+"=([^;]+)"));
  return !!(m && await env.NAV_DB.get("session:"+m[2]));
}
function pub(arr){return (arr||[]).filter(x=>x.private!==true&&x.private!=="true")}
export async function onRequest({request,env}){
  let raw=await env.NAV_DB.get(KEY), arr=[];
  try{if(raw)arr=JSON.parse(raw)}catch{}
  const isAdmin=await admin(request,env);
  if(request.method==="GET")return json(isAdmin?arr:pub(arr));
  if(!isAdmin)return json({error:"Unauthorized"},401);
  if(request.method!=="POST")return new Response("Method Not Allowed",{status:405});
  let body;try{body=await request.json()}catch{return json({error:"Bad JSON"},400)}
  if(!Array.isArray(body))return json({error:"Expected array"},400);
  // 保留旧数据兼容，同时给新书签补 id。
  body=body.map(x=>({id:x.id||crypto.randomUUID(),name:String(x.name||"未命名"),url:String(x.url||"#"),private:x.private===true}));
  await env.NAV_DB.put(KEY,JSON.stringify(body));
  return json({success:true});
}
