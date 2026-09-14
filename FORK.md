# 二次开发说明（Fork Notice）

本仓库是开源项目 **GPT Image Playground** 的**二次开发（Fork）版本**，由 `alim-talay` 维护。

- 原项目：https://github.com/CookSleep/gpt_image_playground
- 本仓库（二次开发）：https://gitee.com/alim-talay/gpt-image-playground
- 开源许可：MIT（见 [LICENSE](./LICENSE)）。本仓库**保留原项目的版权声明与许可协议**，未移除任何作者署名与授权信息。

> 使用或再分发本仓库时，请同时遵守原项目的 MIT 许可协议，并保留原作者的版权声明。

---

## 一、本仓库相对原项目的主要变化

以下为二次开发分支相对原项目新增/修改的功能点，按模块归类。除列出的部分外，其余功能与上游保持一致。

### 1. 维吾尔语（ئۇيغۇرچە）双语界面

- 新增 `src/lib/i18n.ts`：内置 `zh` / `ug` 两套完整字典（700+ 键），提供 `t()`、`useUiLang()`、`setUiLang()`，语言选择持久化到 `localStorage`（键名 `talay_ui_lang`）。
- 全部组件、设置页、输入框 placeholder、按钮、提示、确认弹窗、toast、错误提示等 UI 文案改为通过 `t()` 输出，支持中文 / 维吾尔语实时切换。
- 维吾尔语时自动将 `document.documentElement` 设为 `lang="ug"` 与 `dir="rtl"`（RTL 布局）。
- 按占位符 `{n}`、`{msg}` 等参数化文案；带内联 `<code>` 的提示拆分为 `Lead/Mid/Tail` 分段键以保留样式。

### 2. 维吾尔语字体

- 新增 `public/fonts/` 下全套 UKIJ 字体（TTF）。
- `src/index.css` 中为 `UKIJ Tuz`、`UKIJ Es`、`UKIJ Basma`、`UKIJ Qolyazma`、`UKIJ Tughra` 等注册 `@font-face`，并调整 UI 字体栈以适配维吾尔语。

### 3. 登录鉴权（Cloudflare Worker + D1）

- 新增 `worker/index.ts`：基于 Cloudflare Workers 的登录页与 Cookie 会话鉴权，包含：
  - `POST /auth/login`、`POST /auth/logout`；
  - PBKDF2（10 万次迭代）口令校验；
  - HMAC-SHA256 签名会话 Cookie（7 天）；
  - 基于 IP 的失败次数限制与临时锁定；
  - 未登录时对任意路径返回登录页（自包含内联样式，跟随系统深浅色）。
- 新增 `migrations/0001_init.sql`：`users` 与 `auth_attempts` 表结构。
- 新增 `scripts/init-admin.mjs`：生成 PBKDF2 口令哈希，用于初始化管理员账号。
- `wrangler.jsonc` 增加 D1 绑定（`database_id` 已替换为占位符，部署前需自行填写）。

### 4. Cloudflare Workers AI 生图

- `wrangler.jsonc` 增加 Workers AI 绑定 `AI`。
- `worker/index.ts` 新增需登录的 `POST /ai/generate`：调用 `@cf/black-forest-labs/flux-1-schnell`，返回 `data:image/jpeg;base64,...`。
- 前端新增内置生图服务商 `cloudflare`（`Cloudflare Workers AI`），在「设置 → API 配置 → 服务商类型」下拉中可选，无需 API Key。

### 5. 国内生图服务商预置（下拉 + 只填 Token + 模型下拉）

在设置的服务商下拉中新增以下内置生图服务商，选定后自动带出固定 API 地址、仅需填写 Token，并从模型下拉中选择模型：

- 硅基流动 SiliconFlow（`https://api.siliconflow.cn/v1`）
- 智谱 GLM / BigModel（`https://open.bigmodel.cn/api/paas/v4`）
- 豆包 火山方舟（`https://ark.cn-beijing.volces.com/api/v3`）
- 通义千问 / 万相 DashScope（`https://dashscope.aliyuncs.com/api/v1`，异步任务 + 轮询）

配套改动：

- `CustomProviderDefinition` 增加可选 `baseUrl`（固定地址）与 `models`（模型下拉列表）。
- `CustomProviderSubmitMapping` 增加可选 `headers`，提交时渲染并合并自定义请求头（万相异步所需的 `X-DashScope-Async: enable`）。
- 这些预置服务商复用现有「自定义 HTTP 服务商」的请求构造与结果提取通道；`paramCompatibility` 为其限制输出数量、并将 `auto` 尺寸回退为具体值。

### 6. 其他修复与调整

- 修复 `SettingsModal` 中 `streamPartialHint` / `base64Hint` 直接输出字面量 `{param}` 的问题，改为内联 `<code>partial_images</code>` / `<code>response_format</code>`。
- `public/sw.js` 的 `CACHE_NAME` 增加后缀，确保升级后清理旧缓存。
- 各项用户可见错误文案补齐中/维双语。

---

## 二、从本仓库自行部署时的注意事项

1. **D1 数据库**：`wrangler.jsonc` 中的 `database_id` 为占位符。请先创建 D1 数据库并执行 `migrations/0001_init.sql`，再填入真实 `database_id`。
2. **会话密钥**：登录会话依赖 Worker secret `AUTH_SECRET`，需执行 `wrangler secret put AUTH_SECRET` 设置高强度随机值。
3. **初始账号**：使用 `node scripts/init-admin.mjs <username> <password>` 生成口令哈希，写入 `users` 表。
4. **Workers AI 绑定**：如需使用 Cloudflare 生图，保留 `wrangler.jsonc` 中的 `ai` 绑定；不需要时可移除，同时移除/隐藏 `cloudflare` 服务商。
5. **国内服务商 Token**：仅需在设置中填写各家 API Key，请自行从对应平台获取。

---

## 三、许可与商标

- 本项目及本二次开发版本均以 **MIT** 协议开源。二次开发部分同样以 MIT 协议提供。
- 原项目的名称、Logo 与品牌归原作者所有；本仓库作为二次开发版本，仅用于功能扩展与本地化，不代表原项目官方立场。
