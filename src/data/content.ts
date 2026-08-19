import type { SkillKey } from "./skills";

/** 经历 —— 按你自己的简历改 */
export type Experience = {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  company: string;
  description: string[];
  skills: SkillKey[];
};

export const EXPERIENCE: Experience[] = [
  {
    id: 1,
    startDate: "2024",
    endDate: "Present",
    title: "Full Stack Developer",
    company: "Your Company",
    description: [
      "Built something impressive end-to-end, with a number to prove it.",
      "Led a migration / optimization that measurably improved things.",
      "Owned features from requirements to production.",
    ],
    skills: ["nextjs", "ts", "react", "nodejs", "postgres", "docker"],
  },
  {
    id: 2,
    startDate: "2022",
    endDate: "2024",
    title: "Frontend Developer",
    company: "Previous Company",
    description: [
      "Shipped dashboards and internal tools used by the whole team.",
      "Turned messy spreadsheets into proper products.",
    ],
    skills: ["vue", "tailwind", "express", "mongodb"],
  },
];

/** 项目 —— href 可以是外部链接，也可以留空 */
export type Project = {
  id: number;
  title: string;
  description: string;
  tech: SkillKey[];
  href?: string;
};

export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "Project One",
    description:
      "One line about what it does and why it matters. Replace with your own project.",
    tech: ["nextjs", "ts", "postgres"],
    href: "https://github.com/yourname/project-one",
  },
  {
    id: 2,
    title: "Project Two",
    description: "Another highlight. Numbers and outcomes beat adjectives.",
    tech: ["react", "nodejs", "mongodb"],
    href: "https://github.com/yourname/project-two",
  },
  {
    id: 3,
    title: "Project Three",
    description: "A third one to fill the grid nicely.",
    tech: ["vue", "tailwind", "docker"],
    href: "https://github.com/yourname/project-three",
  },
];
