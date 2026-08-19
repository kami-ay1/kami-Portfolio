/**
 * 技能字典 —— 键盘交互的核心契约。
 *
 * 每个 key 必须与 Spline 场景里对应键帽对象的「名称」完全一致
 * （例：name 为 "react" 的键帽 ↔ 下面的 react 条目）。
 * 增删技能 = 改这里 + 在 Spline 编辑器里同步增删同名键帽，其余代码零改动。
 *
 * label / shortDescription 建议用英文：3D 场景内的文字若走 Spline 变量，
 * 大多数字体不含中文字形；HTML 浮层（本脚手架的默认方案）则中英皆可。
 * color 用于 HTML 降级网格的品牌色发光；icon 用 devicon CDN。
 */

export const SKILL_KEYS = [
  "js",
  "ts",
  "html",
  "css",
  "react",
  "vue",
  "nextjs",
  "tailwind",
  "nodejs",
  "express",
  "postgres",
  "mongodb",
  "git",
  "github",
  "docker",
  "linux",
  "nginx",
  "aws",
  "vim",
  "vercel",
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

export type Skill = {
  /** 与 Spline 键帽对象同名 */
  name: SkillKey;
  label: string;
  /** 按下/悬停键帽时显示的一句话描述 */
  shortDescription: string;
  /** 品牌色（HTML 降级网格的发光色） */
  color: string;
  icon: string;
};

const icon = (path: string) =>
  `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${path}`;

export const SKILLS: Record<SkillKey, Skill> = {
  js: {
    name: "js",
    label: "JavaScript",
    shortDescription: "the language of the web, since 1995",
    color: "#f0db4f",
    icon: icon("javascript/javascript-original.svg"),
  },
  ts: {
    name: "ts",
    label: "TypeScript",
    shortDescription: "JavaScript, but with a type system",
    color: "#007acc",
    icon: icon("typescript/typescript-original.svg"),
  },
  html: {
    name: "html",
    label: "HTML",
    shortDescription: "the skeleton of every page",
    color: "#e34c26",
    icon: icon("html5/html5-original.svg"),
  },
  css: {
    name: "css",
    label: "CSS",
    shortDescription: "making the skeleton look good",
    color: "#2965f1",
    icon: icon("css3/css3-original.svg"),
  },
  react: {
    name: "react",
    label: "React",
    shortDescription: "UI as a function of state",
    color: "#61dafb",
    icon: icon("react/react-original.svg"),
  },
  vue: {
    name: "vue",
    label: "Vue",
    shortDescription: "the progressive framework",
    color: "#41b883",
    icon: icon("vuejs/vuejs-original.svg"),
  },
  nextjs: {
    name: "nextjs",
    label: "Next.js",
    shortDescription: "the React framework for the web",
    color: "#ffffff",
    icon: icon("nextjs/nextjs-original.svg"),
  },
  tailwind: {
    name: "tailwind",
    label: "Tailwind CSS",
    shortDescription: "utility-first styling",
    color: "#38bdf8",
    icon: icon("tailwindcss/tailwindcss-original.svg"),
  },
  nodejs: {
    name: "nodejs",
    label: "Node.js",
    shortDescription: "JavaScript on the server",
    color: "#6cc24a",
    icon: icon("nodejs/nodejs-original.svg"),
  },
  express: {
    name: "express",
    label: "Express",
    shortDescription: "the minimal node framework",
    color: "#ffffff",
    icon: icon("express/express-original.svg"),
  },
  postgres: {
    name: "postgres",
    label: "PostgreSQL",
    shortDescription: "the relational database of choice",
    color: "#336791",
    icon: icon("postgresql/postgresql-original.svg"),
  },
  mongodb: {
    name: "mongodb",
    label: "MongoDB",
    shortDescription: "documents, not tables",
    color: "#47a248",
    icon: icon("mongodb/mongodb-original.svg"),
  },
  git: {
    name: "git",
    label: "Git",
    shortDescription: "version control for everything",
    color: "#f1502f",
    icon: icon("git/git-original.svg"),
  },
  github: {
    name: "github",
    label: "GitHub",
    shortDescription: "where the code lives",
    color: "#e6edf3",
    icon: icon("github/github-original.svg"),
  },
  docker: {
    name: "docker",
    label: "Docker",
    shortDescription: "ship it anywhere",
    color: "#2496ed",
    icon: icon("docker/docker-original.svg"),
  },
  linux: {
    name: "linux",
    label: "Linux",
    shortDescription: "my daily driver",
    color: "#fcc624",
    icon: icon("linux/linux-original.svg"),
  },
  nginx: {
    name: "nginx",
    label: "Nginx",
    shortDescription: "reverse proxy and static files",
    color: "#009639",
    icon: icon("nginx/nginx-original.svg"),
  },
  aws: {
    name: "aws",
    label: "AWS",
    shortDescription: "cloud primitives on tap",
    color: "#ff9900",
    icon: icon("amazonwebservices/amazonwebservices-original-wordmark.svg"),
  },
  vim: {
    name: "vim",
    label: "Vim",
    shortDescription: "exit? in this economy?",
    color: "#019833",
    icon: icon("vim/vim-original.svg"),
  },
  vercel: {
    name: "vercel",
    label: "Vercel",
    shortDescription: "deploy and touch grass",
    color: "#ffffff",
    icon: icon("vercel/vercel-original.svg"),
  },
};
