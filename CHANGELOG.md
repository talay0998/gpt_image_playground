# 二次开发变更记录（Changelog）

本文件记录本**二次开发分支**相对上游项目的变更。

- 上游项目：https://github.com/CookSleep/gpt_image_playground
- 上游版本基线：`v0.7.12`
- 本仓库：https://gitee.com/alim-talay/gpt-image-playground
- 二次开发说明与功能差异概览见 [FORK.md](./FORK.md)。

---

## 2026-09-14

### 新增

- 维吾尔语（ئۇيغۇرچە）双语界面：新增 `src/lib/i18n.ts`（`zh` / `ug` 双字典 + `t()` / `useUiLang()` / `setUiLang()`），全站 UI 文案支持中/维实时切换，维吾尔语下自动切换 `lang` 与 RTL 布局。
- 维吾尔语字体：新增 `public/fonts/` 全套 UKIJ 字体，并在 `src/index.css` 注册 `@font-face`、调整字体栈。
- 登录鉴权（Cloudflare Worker + D1）：新增 `worker/index.ts` 登录页与 Cookie 会话、`migrations/0001_init.sql`、`scripts/init-admin.mjs`；`wrangler.jsonc` 增加 D1 绑定。
- Cloudflare Workers AI 生图：`wrangler.jsonc` 增加 `AI` 绑定，`worker/index.ts` 新增 `POST /ai/generate`（`@cf/black-forest-labs/flux-1-schnell`），前端新增内置服务商 `cloudflare`。
- 国内生图服务商预置：服务商下拉新增硅基流动 SiliconFlow、智谱 GLM / BigModel、豆包 火山方舟、通义千问 / 万相 DashScope；选定后自动带出固定 API 地址、仅需填 Token，并提供模型下拉。
- 自定义服务商清单扩展：`CustomProviderDefinition` 支持 `baseUrl`、`models`，`CustomProviderSubmitMapping` 支持 `headers`（用于万相异步所需请求头）。
- 新增文档：`FORK.md`（二次开发说明与差异清单）、`CHANGELOG.md`（本文件）。

### 修复

- 修复设置页 `streamPartialHint` / `base64Hint` 直接显示字面量 `{param}` 的问题，改为内联 `<code>partial_images</code>` / `<code>response_format</code>`。

### 变更

- `public/sw.js` 的 `CACHE_NAME` 增加后缀，确保升级后清理旧缓存。
- 移除个人部署信息：`wrangler.jsonc` 中的 D1 `database_id` 改为占位符。
- 内部标识中性化：会话 Cookie `talay_auth` → `app_auth`，语言存储键 `talay_ui_lang` → `app_ui_lang`。

> 说明：兼容性影响——Cookie 改名后既有登录会话失效，需重新登录；语言存储键改名后语言选择会回到默认（中文）。
