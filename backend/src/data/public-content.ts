export const profile = {
  name: "徐孟达",
  headline: "Java 后端工程师｜软件工程硕士｜关注 AI 应用与业务智能化落地",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  location: "中国·杭州",
  shortBio:
    "毕业于浙江工业大学软件工程硕士，目前从事 Java 后端开发。硕士期间参与过金融时间序列相关项目，工作中主要围绕基于 Dify 平台的文档核实流程建设与落地，关注后端工程能力、AI 工作流和业务效率优化。",
  tags: ["Java", "Spring Boot", "MySQL", "Redis", "Dify", "AI Workflow"],
  socials: {
    github: "https://github.com/NEDK26",
    blog: "https://www.nedk.cn",
    email: "mailto:1049696396@qq.com",
  },
};

export const now = {
  summary:
    "从软件工程硕士到 Java 后端工程师，我更关注把研究能力、工程能力和 AI 工作流实践真正结合到业务落地里。",
  items: [
    {
      id: "zjut-master",
      type: "education",
      title: "软件工程硕士",
      organization: "浙江工业大学",
      location: "杭州",
      period: "2021 - 2024",
      description: "研究生阶段主要参与金融时间序列相关项目，围绕时序数据分析、建模与应用展开实践，也系统训练了我对复杂问题拆解和验证的能力。",
    },
    {
      id: "java-backend-engineer",
      type: "work",
      title: "Java 后端工程师",
      organization: "当前工作",
      location: "杭州",
      period: "2024 - 至今",
      description: "主要负责 Java 后端开发工作，参与基于 Dify 平台的文档核实流程建设，把模型能力、业务规则和流程系统整合成可落地的后端方案。",
    },
  ],
  updatedAt: "2026-03-28",
};

export const lives = [
  {
    id: "west-lake-evening",
    title: "西湖边的傍晚",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    alt: "傍晚湖边与山影的风景照",
    location: "杭州",
    capturedAt: "2026-03-10",
    description: "忙完一天之后，最喜欢沿着湖边走一走，让自己从工作节奏里慢下来。",
    width: 1200,
    height: 1600,
  },
  {
    id: "desk-flow-day",
    title: "工位的一天",
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    alt: "笔记本电脑与代码界面的工作台照片",
    location: "杭州",
    capturedAt: "2026-03-14",
    description: "工作里很多时间都花在接口设计、流程串联和把复杂问题拆解成可以落地的步骤。",
    width: 1200,
    height: 900,
  },
  {
    id: "graduate-library",
    title: "研究生阶段的安静时刻",
    imageUrl:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80",
    alt: "图书馆书架与阅读空间的照片",
    location: "浙江工业大学",
    capturedAt: "2026-03-02",
    description: "想到金融时间序列项目时，最先浮现的还是在图书馆反复读论文和推思路的那些晚上。",
    width: 1200,
    height: 1500,
  },
  {
    id: "coffee-break",
    title: "周末补给",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
    alt: "咖啡与木桌的生活照片",
    location: "杭州",
    capturedAt: "2026-03-22",
    description: "周末喜欢找一家安静的咖啡店，把最近的想法记下来，也顺手整理个人项目。",
    width: 1200,
    height: 1400,
  },
  {
    id: "city-night-walk",
    title: "下班后的城市光线",
    imageUrl:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80",
    alt: "夜晚城市街道与灯光的照片",
    location: "杭州",
    capturedAt: "2026-03-18",
    description: "很多产品和流程上的新想法，反而是在下班路上慢慢想清楚的。",
    width: 1200,
    height: 900,
  },
  {
    id: "notes-and-workflow",
    title: "想法落到纸面上",
    imageUrl:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    alt: "笔记本与桌面书写的照片",
    location: "杭州",
    capturedAt: "2026-03-25",
    description: "做 Dify 相关实践时，我习惯先把流程拆成节点和规则，再回到实现层面去验证。",
    width: 1200,
    height: 1600,
  },
];

export const highlights = [
  {
    id: "financial-time-series",
    title: "金融时间序列研究项目",
    summary: "硕士阶段围绕金融时间序列分析与建模开展研究与实践。",
    description:
      "在研究生阶段参与金融时间序列相关项目，重点放在时序数据处理、建模和结果分析上。这个阶段让我建立了从问题定义、数据观察、实验验证到结果复盘的一整套研究方法。",
    kind: "project",
    period: "2022 - 2024",
    stack: ["Python", "Time Series", "Data Analysis"],
    link: "",
  },
  {
    id: "dify-document-review",
    title: "基于 Dify 的文档核实流程",
    summary: "把模型能力、业务规则与流程系统结合成可落地的后端方案。",
    description:
      "在工作中参与基于 Dify 平台的文档核实方案建设，围绕文档解析、规则校验、流程编排和结果回传做后端支撑，目标是把原本依赖人工判断的步骤沉淀为可复用的智能流程。",
    kind: "project",
    period: "2024 - 至今",
    stack: ["Java", "Dify", "Workflow", "Backend"],
    link: "",
  },
  {
    id: "java-backend-practice",
    title: "Java 后端工程实践",
    summary: "持续积累接口设计、系统稳定性和业务落地方面的后端经验。",
    description:
      "围绕 Java 后端开发，我持续在接口设计、服务拆分、流程整合和稳定性上做工程积累，也在业务场景里尝试把 AI 能力与后端系统结合起来，做更可维护的生产方案。",
    kind: "project",
    period: "持续进行中",
    stack: ["Java", "Spring Boot", "MySQL", "Redis"],
    link: "",
  },
];
