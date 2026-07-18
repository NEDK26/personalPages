# Personal Pages

一个可编辑的个人主页：Hono + Turso 后端提供内容 API，Vite + React 前端负责展示和管理控制台，生产环境通过显式 Vercel Functions 保持同源 `/api` 请求。

## 项目结构

- `backend/`：Hono API、管理员会话、内容迁移和 Turso 持久化。
- `frontend/`：公开页面、按需加载的管理控制台、Vercel 显式代理和 Blob 图片直传。

## 本地启动

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

另开一个终端：

```bash
cd frontend
npm install
npm run dev
```

前端默认位于 `http://localhost:5173`，后端默认位于 `http://localhost:3000`。访问 `#admin` 可打开管理控制台。

## 环境与安全

生产环境必须配置：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`，至少 12 个字符
- `ADMIN_SESSION_SECRET`，至少 32 个随机字符

缺少任一变量时，生产后端会拒绝启动。登录成功后后端签发 8 小时有效的 `HttpOnly`、`SameSite=Strict` 会话 Cookie；浏览器不会持久化管理员密码，写操作额外校验 CSRF 令牌。

数据库编辑需要 `TURSO_DATABASE_URL` 和 `TURSO_AUTH_TOKEN`，图片上传需要相应项目中的 `BLOB_READ_WRITE_TOKEN`。不要提交 `.env`。

## 数据库迁移

建表、兼容迁移和默认数据填充在后端启动阶段执行，不占用首个 HTTP 请求。也可以在部署阶段显式运行：

```bash
cd backend
npm run migrate
```

内容列表替换使用 libSQL 写事务；任一写入失败时会整体回滚。

## 验证命令

```bash
cd backend
npm test
npm run build

cd ../frontend
npm test
npm run typecheck
npm run build
```

## 生产请求链路

浏览器只访问前端域名的 `/api/*`。`frontend/api/` 保留每个公开和管理端点的显式函数，公共代理行为集中在 `frontend/server/proxy.ts`。前端 Vercel 项目需要配置 `BACKEND_API_BASE_URL`；浏览器端 `VITE_API_BASE_URL` 保持 `/api`。

Lives 图片通过前端函数签发短期直传权限后上传到 Vercel Blob，上传完成回调负责生成方形 WebP 缩略图。
