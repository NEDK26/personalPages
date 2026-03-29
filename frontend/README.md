# Frontend UI

前端 UI 已从设计压缩包解压到 `frontend/`，并整理成可直接运行的 Vite + React + TypeScript 项目。

## 本地开发

- 安装依赖：`npm install`
- 启动开发环境：`npm run dev`
- 生产构建：`npm run build`
- TypeScript 检查：`npm run typecheck`

默认本地访问地址：`http://localhost:5173/`

## 环境配置

- 本地联调环境：`frontend/.env.development`
- 生产环境：`frontend/.env.production`
- 通用示例：`frontend/.env.example`

当前默认值：

- 本地开发通过 `/api` 代理到 `http://localhost:3000`
- 生产环境默认也请求同域 `/api`
- Vercel 上由 `frontend/api/*.ts` 显式路由处理同域 API；其中 `frontend/api/admin/lives/upload.ts` 负责给浏览器签发 Blob 直传 token

## 常改位置

- 头像文件：`src/assets/avatar.jpg`
- 页面主内容：`src/app/App.tsx`
- 入口文件：`src/main.tsx`
- 接口类型：`src/types/public.ts`
- API 请求封装：`src/lib/api.ts`

## 下一步计划

1. 更新 `backend/src/data/public-content.ts`，把默认示例数据替换成你的真实资料。
2. 如果想让头像也走后端配置，再把前端头像从本地文件切到 `profile.avatarUrl`。
3. 补充更多页面模块，例如文章、标签页和项目详情。
4. 完成域名绑定和线上回归检查。
5. 如果要增加新的公开接口，新增对应的 `frontend/api/*.ts` 显式路由文件。

## Vercel 部署

推荐把 `frontend/` 作为 Vercel 的 Root Directory。

### 控制台部署

1. 先把仓库推到 GitHub、GitLab 或 Bitbucket。
2. 登录 Vercel，点击 `Add New` -> `Project`。
3. 导入当前仓库。
4. 在项目设置里把 `Root Directory` 设为 `frontend`。
5. 确认以下配置：
   - Framework Preset：`Vite`
   - Build Command：`npm run build`
   - Output Directory：`dist`
6. 在前端 Vercel 项目的 Environment Variables 里新增：
   - `BACKEND_API_BASE_URL`：你的后端线上地址，例如 `https://your-backend-project.vercel.app`
   - `BLOB_READ_WRITE_TOKEN`：用于 `/api/admin/lives/upload` 给浏览器签发 Blob 直传 token
7. 如果你之前在前端 Vercel 项目里配置过 `VITE_API_BASE_URL=https://...`，请删除它或改回 `/api`。
8. 点击 `Deploy`。

### CLI 部署

在 `frontend/` 目录执行：

```bash
npm install -g vercel
vercel
```

首次执行时按下面选择即可：

- Set up and deploy：选当前项目
- Which scope：选你的账号或团队
- Link to existing project?：如果没有旧项目选 `N`
- In which directory is your code located?：输入 `./`
- Want to modify these settings?：选 `N`

部署前记得在前端 Vercel 项目里设置 `BACKEND_API_BASE_URL` 和 `BLOB_READ_WRITE_TOKEN`。

## 线上请求链路

- 浏览器请求：`https://你的前端域名/api/profile`
- 前端 Vercel Function 代理到：`BACKEND_API_BASE_URL/profile`
- 浏览器不再直连后端域名，所以国内访问前端域名时不会因为后端域名不可达而直接超时
- Lives 图片上传链路改为：浏览器 -> `POST /api/admin/lives/upload` 申请 token -> 浏览器直传 Vercel Blob -> 前端 Vercel 路由在上传完成后生成缩略图
