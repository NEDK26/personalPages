export const CONTENT = {
  en: {
    name: 'Xu Minda', role: 'Robotics Engineer', intro: 'I work on robotics and have a background in Java backend development. In my spare time, I build tools I want to use, like a Pi plugin for model fallback and a 3D keyboard customizer.',
    projectsLabel: 'Selected Projects', linkUnavailable: 'Not available yet', experienceLabel: 'Experience', blogLabel: 'Blog', emptyBlog: 'Articles coming soon.', connect: 'Connect', contact: 'Feel free to contact me at',
    tabs: { experience: 'Experience', projects: 'Projects', blog: 'Blog' }, tabListLabel: 'Profile',
    projectCollection: {
      title: 'vibecoding Projects',
      back: 'Back to profile projects',
    },
    projects: [
      { id: 'action', name: 'Ideas into Action', description: 'I turn ideas like the 23-piece wardrobe and setting up a home gym into small experiments with starting budgets within ¥10,000. The current tool breaks each idea into steps and tracks progress.' },
      { id: 'free-agent', name: 'FreeAgent', description: 'A Pi Agent plugin that helps you find free API options, order models in a fallback pool, and try the next model after a retryable error such as rate limiting.' },
      { id: 'keyboard-simulator', name: '3D Keyboard Simulator', description: 'A browser-based KeySim fork. Pick a keyboard layout, change individual keycap colors, and try typing on the 3D preview.' },
    ],
    experience: [
      { id: 'work', company: 'Hangzhou', title: 'Java Backend Engineer', start: '2024', end: 'Present' },
      { id: 'education', company: 'Zhejiang University of Technology', title: 'M.S. in Software Engineering', start: '2021', end: '2024' },
    ],
    blog: [
      { uid: 'when-agent-retries-should-stop', title: 'When should an AI agent stop retrying?', description: 'What building FreeAgent taught me about model fallback after a tool has already run.', link: '/blog/when-agent-retries-should-stop' },
      { uid: 'about-this-blog', title: 'What I write about', description: 'Notes on decisions I make while building tools, and what I learn from trying ideas in everyday life.', link: '/blog/about-this-blog' },
    ],
  },
  zh: {
    name: '徐孟达', role: '机器人开发工程师', intro: '我做机器人开发，也有 Java 后端开发背景。业余做一些自己想用的工具，比如给 Pi 写模型回退插件，在浏览器里搭配自己的 3D 键盘。',
    projectsLabel: '精选项目', linkUnavailable: '暂未提供', experienceLabel: '经历', blogLabel: '博客', emptyBlog: '文章准备中。', connect: '联系我', contact: '欢迎通过邮件联系我：',
    tabs: { experience: '经历', projects: '项目', blog: '博客' }, tabListLabel: '资料',
    projectCollection: {
      title: 'vibecoding 项目集',
      back: '返回主页项目',
    },
    projects: [
      { id: 'action', name: '知行合一', description: '把 23 件衣橱、家庭健身等生活理念拆成启动预算不超过 1 万元的小实验。目前可以把想法拆成步骤、记录进度。' },
      { id: 'free-agent', name: 'FreeAgent', description: '给 Pi Agent 写的插件，用来查找免费 API 入口、给候选模型排序。遇到限流等可重试错误时，会按顺序尝试下一个模型。' },
      { id: 'keyboard-simulator', name: '3D 键盘模拟器', description: '基于 KeySim 二次开发。在浏览器里选键盘布局、给单颗键帽配色，实时预览 3D 效果，再上手试打。' },
    ],
    experience: [
      { id: 'work', company: '杭州', title: 'Java 后端工程师', start: '2024', end: '至今' },
      { id: 'education', company: '浙江工业大学', title: '软件工程硕士', start: '2021', end: '2024' },
    ],
    blog: [
      { uid: 'when-agent-retries-should-stop', title: 'AI Agent 换模型时，什么时候该停止重试？', description: '工具已经执行过，换个模型还能从头再来吗？这是我做 FreeAgent 时遇到的问题。', link: '/blog/when-agent-retries-should-stop' },
      { uid: 'about-this-blog', title: '我会在这里写什么', description: '记录做工具时遇到的取舍，以及把生活理念付诸实践时学到的东西。', link: '/blog/about-this-blog' },
    ],
  },
} as const
export const SOCIAL_LINKS = [{ label: 'GitHub', link: 'https://github.com/NEDK26' }]
export const EMAIL = 'sureminda@protonmail.com'
export const DISPLAY_NAME = 'MindaDX'

// Add verified project links here; empty values remain unavailable.
export const PROJECT_LINKS: Record<string, { github?: string; demo?: string }> = {
  action: { github: 'https://github.com/NEDK26/zhixing-action' },
  'free-agent': { github: 'https://github.com/NEDK26/freeAgent' },
  'keyboard-simulator': {
    github: 'https://github.com/crsnbrt/keysim',
    demo: 'https://keyboardsimulator.xyz/',
  },
}
