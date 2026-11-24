# 个人主页维护指南

## 安装与预览

本地需要 Git、Node.js 20 或更高版本，以及 npm。进入仓库根目录后安装锁定的依赖并启动开发服务。

```bash
npm ci
npm run dev
```

打开 [本地主页](http://localhost:3000/)，用资料页顶部的语言切换检查中英文内容。

## 更新资料与项目

- 昵称、姓名、简介、工作与教育经历、联系方式集中在 [`app/data.ts`](./app/data.ts)。姓名、简介和经历有 `en` 与 `zh` 两份内容，更新时同步修改。头像文件在 [`public/avatar.jpg`](./public/avatar.jpg)。
- 新增项目集条目时，在 `CONTENT.en.projects` 和 `CONTENT.zh.projects` 各加一条记录，两条使用相同的 `id`。在 `PROJECT_LINKS` 下用同一个 `id` 登记 GitHub 和线上 Demo 地址。缺少地址的入口会显示为暂未提供。
- 将项目缩略图放在 [`public/projects/`](./public/projects/)，在 [项目集页面](./app/projects/page.tsx) 的 `PROJECT_COVERS` 中登记路径，例如 `/projects/my-project.jpg`。列表将图片按正方形裁切，主体放在画面中央即可。
- 3D 键盘模拟器目前链接到 KeySim 的源码和在线 Demo。二开版发布后，在 `PROJECT_LINKS['keyboard-simulator']` 更新这两个地址。

## 发布博客

1. 在 `app/blog/<slug>/page.mdx` 编写正文，并导出 `metadata`，可参考 [首篇博客](./app/blog/about-this-blog/page.mdx)。如需按语言切换正文，可参考同目录的 [`content.tsx`](./app/blog/about-this-blog/content.tsx)。
2. 在 `CONTENT.en.blog` 和 `CONTENT.zh.blog` 中登记文章的标题、摘要及链接，两者使用相同的 `uid` 和 `/blog/<slug>` 路径。
3. 在首页的「博客」标签中检查两个语言版本的入口和正文。

## 部署

Vercel 的 `my-pages` 项目连接 `NEDK26/personalPages`，生产分支为 `main`，构建根目录为仓库根目录。合并后，Vercel 会为新提交自动部署。通过 GitHub 提交页的 `Vercel – my-pages` 检查确认部署状态，然后打开 [生产主页](https://my-pages-eight.vercel.app/) 验证本次更新。

本地需要验证生产构建时，运行 `npm run build`。如果更换正式域名，同步更新 [`app/layout.tsx`](./app/layout.tsx) 的 `metadataBase` 和 [`lib/constants.ts`](./lib/constants.ts) 的 `WEBSITE_URL`。
