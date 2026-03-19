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
- 生产环境直接请求 `https://demo-personal-project-fullstack.vercel.app`

## 常改位置

- 头像文件：`src/assets/avatar.jpg`
- 页面主内容：`src/app/App.tsx`
- 入口文件：`src/main.tsx`
- 接口类型：`src/types/public.ts`
- API 请求封装：`src/lib/api.ts`

## 下一步计划

1. 更新 `backend/src/data/public-content.ts`，把默认示例数据替换成你的真实资料。
2. 如果想让头像也走后端配置，再把前端头像从本地文件切到 `profile.avatarUrl`。
3. 增加 Vercel 预览域名或其他测试域名到后端 `FRONTEND_ORIGINS`。
4. 补充更多页面模块，例如文章、标签页和项目详情。
5. 完成域名绑定和线上回归检查。

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
6. 当前仓库已内置 `frontend/.env.production`，默认会请求生产后端域名。
7. 点击 `Deploy`。

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

如果后续你想覆盖默认后端地址，再到 Vercel 项目设置里补充 `VITE_API_BASE_URL`。
