# Smart Nav - Cloudflare Pages + KV

## 部署方式

本项目必须使用 **Cloudflare Pages**，不要创建成普通 Worker。

仓库根目录必须直接包含：

- `index.html`
- `functions/`
- `functions/api/auth.js`
- `functions/api/config.js`
- `functions/api/links.js`
- `functions/lib/auth.js`

### 1. 创建 KV

Cloudflare → Workers & Pages → KV → 创建命名空间。

名称可以是：

`NAV_DATABASE`

### 2. 创建 Pages 项目

Cloudflare → Workers & Pages → Create application → Pages → Connect to Git。

构建设置：

- Framework preset：None
- Build command：留空
- Build output directory：留空
- Root directory：留空

### 3. 绑定 KV

Pages 项目 → Settings → Functions → KV namespace bindings。

添加：

- Variable name：`NAV_DB`
- KV namespace：选择刚才创建的 KV

保存后重新部署。

## 私密书签 / 私密分类

管理员登录后：

- 添加书签时勾选“登录后可见（私密）”
- 分类目前默认公开；如果需要私密分类，可以直接在 KV 的 `site_config` 中将对应分类设置为 `"private": true`

私密分类示例：

```json
{
  "id": "123",
  "title": "我的私密工具",
  "private": true,
  "links": [
    {
      "name": "内部网站",
      "url": "https://example.com",
      "private": true
    }
  ]
}
```

普通访客请求 API 时，服务器会过滤掉私密分类、私密书签以及管理员密码。

## 管理员登录

首次密码：

`admin888`

登录后可以修改密码。

与旧版本不同，新版本不再把管理员登录状态放在 `localStorage` 中，而是使用 HttpOnly + Secure Cookie，并在 KV 中保存短期会话。

因此：

- 普通访客无法通过修改 localStorage 冒充管理员
- `/api/config` 不会向普通访客返回 `adminPwd`
- `/api/links` 不会向普通访客返回私密书签
- 管理员 POST API 没有有效会话时会返回 401
