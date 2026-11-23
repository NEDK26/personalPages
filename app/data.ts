export const CONTENT = {
  en: {
    name: 'Xu Minda', role: 'Robotics Engineer', intro: 'Building reliable software and exploring practical applications of AI.',
    projectsLabel: 'Selected Projects', linkUnavailable: 'Not available yet', experienceLabel: 'Experience', blogLabel: 'Blog', emptyBlog: 'Articles coming soon.', connect: 'Connect', contact: 'Feel free to contact me at',
    tabs: { experience: 'Experience', projects: 'Projects', blog: 'Blog' }, tabListLabel: 'Profile',
    projects: [
      { id: 'action', name: 'Ideas into Action', description: 'A project exploring approachable lifestyle ideas through real-world experiments, with starting budgets under ¥10,000.' },
      { id: 'free-agent', name: 'FreeAgent', description: 'A Pi Agent plugin for managing a model pool and trying fallback models on retryable failures.' },
      { id: 'keyboard-simulator', name: '3D Keyboard Simulator', description: 'Customize a keyboard in 3D by choosing a layout, editing keycap colors, and testing the result as you type.' },
    ],
    experience: [
      { id: 'work', company: 'Hangzhou', title: 'Java Backend Engineer', start: '2024', end: 'Present' },
      { id: 'education', company: 'Zhejiang University of Technology', title: 'M.S. in Software Engineering', start: '2021', end: '2024' },
    ],
    blog: [{ uid: 'about-this-blog', title: 'About this blog', description: 'A place for notes on engineering, projects, and ideas.', link: '/blog/about-this-blog' }],
  },
  zh: {
    name: '徐孟达', role: '机器人开发工程师', intro: '专注于可靠的软件系统，探索 AI 技术在实际业务中的应用。',
    projectsLabel: '精选项目', linkUnavailable: '暂未提供', experienceLabel: '经历', blogLabel: '博客', emptyBlog: '文章准备中。', connect: '联系我', contact: '欢迎通过邮件联系我：',
    tabs: { experience: '经历', projects: '项目', blog: '博客' }, tabListLabel: '资料',
    projects: [
      { id: 'action', name: '知行合一', description: '探索启动预算 1 万元以内、普通人可以尝试的生活理念，把衣橱、居住与健康等想法变成实际行动。' },
      { id: 'free-agent', name: 'FreeAgent', description: '一个 Pi Agent 插件，用于管理模型池，并在可重试故障时尝试备用模型。' },
      { id: 'keyboard-simulator', name: '3D 键盘模拟器', description: '在浏览器里选布局、给键帽配色，实时预览 3D 键盘，并直接试打。' },
    ],
    experience: [
      { id: 'work', company: '杭州', title: 'Java 后端工程师', start: '2024', end: '至今' },
      { id: 'education', company: '浙江工业大学', title: '软件工程硕士', start: '2021', end: '2024' },
    ],
    blog: [{ uid: 'about-this-blog', title: '关于这个博客', description: '一个记录技术实践、项目和想法的地方。', link: '/blog/about-this-blog' }],
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
