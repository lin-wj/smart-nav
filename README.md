# Smart Nav - Cloudflare Pages + KV

本版本基于 Cloudflare Pages Functions + KV。

## 本次改进

- 分类采用自适应瀑布流：不同分类书签数量差距较大时，不再出现明显的大块空白。
- 管理员可以拖拽调整分类顺序。
- 管理员可以在同一分类内拖拽调整书签顺序。
- 管理员可以将书签跨分类拖拽，包括“站长推荐”和普通自定义分类之间互相移动。
- 拖拽到分类空白区域可直接移动到该分类末尾。
- 书签继续支持重命名、修改 URL、删除、公开/私有。
- 分类继续支持重命名、删除、公开/私有。
- 私有书签和私有分类只在管理员登录后返回并显示，公开项目不显示额外标签；私有项目只显示“私”。
- 书签图标优先使用网站域名对应的 favicon，失败时使用名称首字母兜底。
- 保留原有 Pages Functions API：`/api/auth`、`/api/config`、`/api/links`。

## 部署

保持 Cloudflare Pages 项目结构不变：

- `index.html`
- `functions/api/auth.js`
- `functions/api/config.js`
- `functions/api/links.js`

并在 Pages 项目中绑定 KV namespace，变量名保持为 `NAV_DB`。
