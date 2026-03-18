# Frontend UI

前端 UI 已从设计压缩包解压到 `frontend/`，并整理成可直接运行的 Vite + React + TypeScript 项目。

## 本地开发

- 安装依赖：`npm install`
- 启动开发环境：`npm run dev`
- 生产构建：`npm run build`
- TypeScript 检查：`npm run typecheck`

默认本地访问地址：`http://localhost:5173/`

## 常改位置

- 头像文件：`src/assets/avatar.png`
- 页面主内容：`src/app/App.tsx`
- 入口文件：`src/main.tsx`

## 下一步计划

1. 替换头像、昵称、简介和社交链接，完成个人信息定制。
2. 调整导航和按钮跳转，让页面内容可访问而不是占位链接。
3. 接入 `backend/` 接口，把静态展示改成真实数据驱动。
4. 补充环境变量方案，例如后续对接接口时增加 `VITE_API_BASE_URL`。
5. 完成线上部署和域名绑定。

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
6. 当前版本没有必填前端环境变量，可直接部署。
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

如果后续页面要请求后端接口，再到 Vercel 项目设置里补充环境变量。
