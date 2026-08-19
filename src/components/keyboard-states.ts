/**
 * 键盘的"滚动叙事"状态表 —— 每个章节里 3D 键盘的 scale / position / rotation。
 *
 * 这些数值对应 Spline 场景里名为 "keyboard" 的对象（整组键盘）。
 * 想调整某章节的镜头就改这里，不用碰任何组件代码。
 * 坐标单位是 Spline 场景单位；先在编辑器里摆好键盘，再按视觉微调这些数。
 */
export type Section =
  | "hero"
  | "skills"
  | "experience"
  | "projects"
  | "contact";

type Transform = {
  scale: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
};

export const STATES: Record<Section, { desktop: Transform; mobile: Transform }> =
  {
    hero: {
      desktop: {
        scale: { x: 0.2, y: 0.2, z: 0.2 },
        position: { x: 225, y: -100, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      mobile: {
        scale: { x: 0.3, y: 0.3, z: 0.3 },
        position: { x: 0, y: -200, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
    },
    skills: {
      desktop: {
        scale: { x: 0.25, y: 0.25, z: 0.25 },
        position: { x: 0, y: -40, z: 0 },
        rotation: { x: 0, y: Math.PI / 12, z: 0 },
      },
      mobile: {
        scale: { x: 0.3, y: 0.3, z: 0.3 },
        position: { x: 0, y: -40, z: 0 },
        rotation: { x: 0, y: Math.PI / 6, z: 0 },
      },
    },
    experience: {
      desktop: {
        scale: { x: 0.25, y: 0.25, z: 0.25 },
        position: { x: 0, y: -40, z: 0 },
        rotation: {
          x: Math.PI / 12, // 略微前倾
          y: -Math.PI / 4, // 与技能区反向旋转，制造章节节奏感
          z: 0,
        },
      },
      mobile: {
        scale: { x: 0.3, y: 0.3, z: 0.3 },
        position: { x: 0, y: -40, z: 0 },
        rotation: { x: Math.PI / 6, y: -Math.PI / 6, z: 0 },
      },
    },
    projects: {
      desktop: {
        scale: { x: 0.25, y: 0.25, z: 0.25 },
        position: { x: 0, y: -40, z: 0 },
        // 翻到背面：给键盘背面留展示空间（可以放你的装饰物）
        rotation: { x: Math.PI, y: Math.PI / 3, z: Math.PI },
      },
      mobile: {
        scale: { x: 0.3, y: 0.3, z: 0.3 },
        position: { x: 0, y: 150, z: 0 },
        rotation: { x: Math.PI, y: Math.PI / 3, z: Math.PI },
      },
    },
    contact: {
      desktop: {
        scale: { x: 0.2, y: 0.2, z: 0.2 },
        position: { x: 350, y: -250, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      mobile: {
        scale: { x: 0.25, y: 0.25, z: 0.25 },
        position: { x: 0, y: 150, z: 0 },
        rotation: { x: Math.PI, y: Math.PI / 3, z: Math.PI },
      },
    },
  };

/**
 * 取某章节的键盘状态，并按视口宽度做比例缩放后 clamp——
 * 保证 4K 大屏上键盘不会小成玩具、手机上也不会撑爆画面。
 */
export function getKeyboardState({
  section,
  isMobile,
}: {
  section: Section;
  isMobile: boolean;
}): Transform {
  const base = STATES[section][isMobile ? "mobile" : "desktop"];

  const DESKTOP_REF_WIDTH = 1280;
  const MOBILE_REF_WIDTH = 390;
  const width = window.innerWidth;

  const target = isMobile
    ? width / MOBILE_REF_WIDTH
    : width / DESKTOP_REF_WIDTH;
  const offset = Math.min(Math.max(target, 0.5), isMobile ? 0.6 : 1.15);

  return {
    ...base,
    scale: {
      x: Math.abs(base.scale.x * offset),
      y: Math.abs(base.scale.y * offset),
      z: Math.abs(base.scale.z * offset),
    },
  };
}
