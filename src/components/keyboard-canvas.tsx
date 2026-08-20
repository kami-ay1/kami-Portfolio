"use client";

/**
 * 3D 键盘画布 —— 本站核心组件（架构参考 nareshkhatri.dev，做了适配与简化）。
 *
 * 分工：
 *   Spline 场景（public/assets/keyboard.spline）只负责"物"：
 *     - 名为 "keyboard" 的整组对象（滚动叙事的操作对象）
 *     - 每个键帽以技能名命名（js / ts / react ...，见 src/data/skills.ts）
 *   本组件负责"逻辑"：
 *     1. 懒加载场景，持有 Spline Application 实例
 *     2. 把物理按键 / 鼠标悬停翻译成"技能选中"（查 SKILLS 字典 + 音效 + 浮层）
 *     3. GSAP ScrollTrigger 驱动键盘在各章节间的 transform（滚动叙事）
 *     4. 入场编排、DPR 钳制、后台标签页暂停渲染
 *
 * 场景制作见 SPLINE-GUIDE.md。场景文件缺失时本组件完全不渲染，
 * 技能区自动退化为 HTML 网格（见 sections/skills.tsx）。
 */
import React, { Suspense, useEffect, useRef, useState } from "react";
import type { Application, SplineEvent } from "@splinetool/runtime";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePerfProfile } from "@/hooks/use-perf-profile";
import { useKeyboardScene } from "@/hooks/use-keyboard-scene";
import { useKeycapSound } from "@/hooks/use-keycap-sound";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SKILLS, type Skill, type SkillKey } from "@/data/skills";
import { config } from "@/data/config";
import { sleep } from "@/lib/utils";
import { getKeyboardState, type Section } from "./keyboard-states";

const Spline = React.lazy(() => import("@splinetool/react-spline"));

gsap.registerPlugin(ScrollTrigger);

const KeyboardScene = ({ maxDpr }: { maxDpr: number }) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [splineApp, setSplineApp] = useState<Application>();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("hero");
  const [keyboardRevealed, setKeyboardRevealed] = useState(false);

  const selectedSkillRef = useRef<Skill | null>(null);
  const keycapAnimationsRef = useRef<{
    start: () => void;
    stop: () => void;
  } | null>(null);

  const { playPress, playRelease } = useKeycapSound();

  /** 场景变量是可选契约：场景里定义了 heading/desc 就同步写入，没定义就走 HTML 浮层 */
  const trySetVariable = (name: string, value: string) => {
    if (!splineApp) return;
    try {
      if (splineApp.getVariable(name) !== undefined) {
        splineApp.setVariable(name, value);
      }
    } catch {
      /* 变量不存在 —— 忽略 */
    }
  };

  // ---------- 交互事件：键帽名 → 技能 ----------

  const isInputFocused = () => {
    const el = document.activeElement;
    return (
      !!el &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        (el as HTMLElement).isContentEditable)
    );
  };

  const handleMouseHover = (e: SplineEvent) => {
    if (!splineApp || selectedSkillRef.current?.name === e.target.name) return;

    const skill = SKILLS[e.target.name as SkillKey];
    if (skill) {
      if (selectedSkillRef.current) playRelease();
      playPress();
      selectedSkillRef.current = skill;
      setSelectedSkill(skill);
      trySetVariable("heading", skill.label);
      trySetVariable("desc", skill.shortDescription);
    } else {
      // 悬停到了非键帽对象上 —— 视为"松开"
      if (selectedSkillRef.current) playRelease();
      selectedSkillRef.current = null;
      setSelectedSkill(null);
      trySetVariable("heading", "");
      trySetVariable("desc", "");
    }
  };

  const handleSplineInteractions = () => {
    if (!splineApp) return;

    splineApp.addEventListener("keyUp", () => {
      if (!splineApp || isInputFocused()) return;
      playRelease();
      selectedSkillRef.current = null;
      setSelectedSkill(null);
      trySetVariable("heading", "");
      trySetVariable("desc", "");
    });

    // Spline 场景内绑定的键盘事件：物理键盘按下 → 对应键帽高亮
    splineApp.addEventListener("keyDown", (e) => {
      if (!splineApp || isInputFocused()) return;
      const skill = SKILLS[e.target.name as SkillKey];
      if (skill) {
        playPress();
        selectedSkillRef.current = skill;
        setSelectedSkill(skill);
        trySetVariable("heading", skill.label);
        trySetVariable("desc", skill.shortDescription);
      }
    });

    splineApp.addEventListener("mouseHover", handleMouseHover);
  };

  // ---------- 滚动叙事：章节 → 键盘 transform ----------

  const createSectionTimeline = (
    triggerId: string,
    targetSection: Section,
    prevSection: Section,
    start = "top 50%"
  ) => {
    const kbd = splineApp?.findObjectByName("keyboard");
    if (!kbd) return null;

    const applyState = (section: Section) => {
      const state = getKeyboardState({ section, isMobile });
      gsap.to(kbd.scale, { ...state.scale, duration: 1 });
      gsap.to(kbd.position, { ...state.position, duration: 1 });
      gsap.to(kbd.rotation, { ...state.rotation, duration: 1 });
    };

    return gsap.timeline({
      scrollTrigger: {
        trigger: triggerId,
        start,
        end: "bottom bottom",
        scrub: true,
        onEnter: () => {
          setActiveSection(targetSection);
          applyState(targetSection);
        },
        onLeaveBack: () => {
          setActiveSection(prevSection);
          applyState(prevSection);
        },
      },
    });
  };

  const setupScrollAnimations = (): gsap.core.Timeline[] => {
    const kbd = splineApp?.findObjectByName("keyboard");
    if (!kbd) return [];

    const heroState = getKeyboardState({ section: "hero", isMobile });
    gsap.set(kbd.scale, heroState.scale);
    gsap.set(kbd.position, heroState.position);

    return [
      createSectionTimeline("#skills", "skills", "hero"),
      createSectionTimeline("#experience", "experience", "skills"),
      createSectionTimeline("#projects", "projects", "experience", "top 70%"),
      createSectionTimeline("#contact", "contact", "projects", "top 30%"),
    ].filter(Boolean) as gsap.core.Timeline[];
  };

  // ---------- 章节专属动画 ----------

  /**
   * contact 章节的"键帽漂浮"：随机顺序把所有技能键帽弹性地拉起再放下
   * （yoyo 无限往返）。float（无限）与 settle（有限）两组 tween 分开追踪，
   * start/stop 各自杀掉自己创建的那组——否则快速滚动时一次过期的 stop
   * 可能杀掉新启动的 float，或让旧的 yoyo 永远停不下来。
   */
  const getKeycapsAnimation = () => {
    if (!splineApp)
      return { start: () => {}, stop: () => {} };

    let floatTweens: gsap.core.Tween[] = [];
    let settleTweens: gsap.core.Tween[] = [];
    const killFloat = () => {
      floatTweens.forEach((t) => t.kill());
      floatTweens = [];
    };
    const killSettle = () => {
      settleTweens.forEach((t) => t.kill());
      settleTweens = [];
    };

    const start = () => {
      killSettle();
      killFloat();
      Object.values(SKILLS)
        .sort(() => Math.random() - 0.5)
        .forEach((skill, idx) => {
          const keycap = splineApp.findObjectByName(skill.name);
          if (!keycap) return;
          floatTweens.push(
            gsap.to(keycap.position, {
              y: Math.random() * 200 + 200,
              duration: Math.random() * 2 + 2,
              delay: idx * 0.6,
              repeat: -1,
              yoyo: true,
              yoyoEase: "none",
              ease: "elastic.out(1,0.3)",
            })
          );
        });
    };

    const stop = () => {
      killFloat();
      killSettle();
      Object.values(SKILLS).forEach((skill) => {
        const keycap = splineApp.findObjectByName(skill.name);
        if (!keycap) return;
        settleTweens.push(
          gsap.to(keycap.position, {
            y: 0,
            duration: 4,
            ease: "elastic.out(1,0.7)",
          })
        );
      });
    };

    return { start, stop };
  };

  /**
   * 入场编排：键盘从极小弹性放大，键帽按 70ms 阶梯延迟依次砸落。
   *
   * 场景里键帽是三组命名对象（对齐原版场景结构）：
   *   - "keycap"：键帽主体，弹落到 y=50（原场景的静息高度，不是 0！）
   *   - "keycap-desktop" / "keycap-mobile"：按设备显隐的变体键帽，
   *     场景导出时默认隐藏，必须在这里显式设为可见
   *   - 技能名对象（js/react...）：只参与按键事件和 contact 漂浮，入场不动它们
   */
  const updateKeyboardTransform = async () => {
    const kbd = splineApp?.findObjectByName("keyboard");
    if (!kbd) return;

    kbd.visible = false;
    await sleep(400);
    kbd.visible = true;

    const currentState = getKeyboardState({
      section: activeSection,
      isMobile,
    });
    gsap.fromTo(
      kbd.scale,
      { x: 0.01, y: 0.01, z: 0.01 },
      { ...currentState.scale, duration: 1.5, ease: "elastic.out(1, 0.6)" }
    );

    const allObjects = splineApp.getAllObjects();
    const keycaps = allObjects.filter((obj) => obj.name === "keycap");

    await sleep(900);

    // 先按设备放出变体键帽（场景默认藏着它们）
    if (isMobile) {
      allObjects
        .filter((obj) => obj.name === "keycap-mobile")
        .forEach((keycap) => {
          keycap.visible = true;
        });
    } else {
      allObjects
        .filter((obj) => obj.name === "keycap-desktop")
        .forEach(async (keycap, idx) => {
          await sleep(idx * 70);
          keycap.visible = true;
        });
    }

    // 键帽主体逐个砸落（从 y=200 弹到 y=50 静息位）
    keycaps.forEach(async (keycap, idx) => {
      keycap.visible = false;
      await sleep(idx * 70);
      keycap.visible = true;
      gsap.fromTo(
        keycap.position,
        { y: 200 },
        { y: 50, duration: 0.5, delay: 0.1, ease: "bounce.out" }
      );
    });
  };

  // ---------- Effects ----------

  // 初始化：事件绑定 + 滚动时间线（卸载时全部清理，防止在已销毁的场景上触发）
  useEffect(() => {
    if (!splineApp) return;

    handleSplineInteractions();
    const timelines = setupScrollAnimations();
    keycapAnimationsRef.current = getKeycapsAnimation();

    return () => {
      keycapAnimationsRef.current?.stop();
      timelines.forEach((tl) => {
        tl.scrollTrigger?.kill();
        tl.kill();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splineApp, isMobile]);

  // 章节切换时的专属动画：hero 慢速旋转 / contact 拆解漂浮
  useEffect(() => {
    if (!splineApp) return;

    // cancelled 标记：下面 await sleep 之后才执行的 start/stop 若已过期则放弃，
    // 否则快速滚动会让多次运行交叠，一次过期的 keycap start() 落在最后，
    // 漂浮动画就永远停不下来了。
    let cancelled = false;

    const kbd = splineApp.findObjectByName("keyboard");

    // hero：无限往复的慢速旋转（先建为 paused，按章节 restart/pause）
    const rotateKeyboard = kbd
      ? gsap.to(kbd.rotation, {
          y: Math.PI * 2 + kbd.rotation.y,
          duration: 10,
          repeat: -1,
          yoyo: true,
          yoyoEase: true,
          ease: "back.inOut",
          delay: 2.5,
          paused: true,
        })
      : undefined;

    // contact：翻转视角看键盘"背面"的无限往复
    const teardownKeyboard = kbd
      ? gsap.fromTo(
          kbd.rotation,
          { y: 0, x: -Math.PI, z: 0 },
          {
            y: -Math.PI / 2,
            duration: 5,
            repeat: -1,
            yoyo: true,
            yoyoEase: true,
            delay: 2.5,
            immediateRender: false,
            paused: true,
          }
        )
      : undefined;

    const manage = async () => {
      if (activeSection === "hero") {
        rotateKeyboard?.restart();
        teardownKeyboard?.pause();
      } else {
        rotateKeyboard?.pause();
        teardownKeyboard?.pause();
      }

      if (activeSection === "contact") {
        await sleep(600);
        if (cancelled) return;
        teardownKeyboard?.restart();
        keycapAnimationsRef.current?.start();
      } else {
        await sleep(600);
        if (cancelled) return;
        teardownKeyboard?.pause();
        keycapAnimationsRef.current?.stop();
      }
    };

    manage();

    return () => {
      cancelled = true;
      rotateKeyboard?.kill();
      teardownKeyboard?.kill();
    };
  }, [activeSection, splineApp]);

  // URL hash 同步（replaceState：不产生历史记录，刷新后能回到当前章节）
  // + 首次入场编排
  useEffect(() => {
    const hash = activeSection === "hero" ? "" : `#${activeSection}`;
    const url = window.location.pathname + window.location.search + hash;
    window.history.replaceState(window.history.state, "", url);

    if (!splineApp || keyboardRevealed) return;
    setKeyboardRevealed(true);
    updateKeyboardTransform();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splineApp, activeSection]);

  // 钳制渲染倍率：Spline 导出默认按 devicePixelRatio 渲染，2-3 倍屏
  // 会渲染 1x 屏 4-9 倍的像素量。_renderer 是内部 API（变了就静默放弃）。
  useEffect(() => {
    if (!splineApp) return;

    const apply = () => {
      try {
        const renderer = (
          splineApp as unknown as {
            _renderer?: { setPixelRatio?: (n: number) => void };
          }
        )._renderer;
        renderer?.setPixelRatio?.(
          Math.min(window.devicePixelRatio, maxDpr)
        );
      } catch {
        /* internal API moved —— 场景照常渲染 */
      }
    };

    apply();
    window.addEventListener("resize", apply, { passive: true });
    return () => window.removeEventListener("resize", apply);
  }, [splineApp, maxDpr]);

  // 后台标签页暂停整个 WebGL 渲染循环（否则 Spline 会在看不见的地方全速渲染）
  useEffect(() => {
    if (!splineApp) return;
    const onVisibility = () => {
      if (document.hidden) splineApp.stop();
      else splineApp.play();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, [splineApp]);

  return (
    <>
      <Suspense
        fallback={
          <div className="fixed inset-0 z-0 grid place-items-center bg-background">
            <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          </div>
        }
      >
        <Spline
          className="fixed inset-0 z-0 h-full w-full"
          scene={config.sceneUrl}
          onLoad={(app: Application) => setSplineApp(app)}
        />
      </Suspense>

      {/* 技能浮层：按下/悬停键帽时显示（HTML 实现，支持中文，不依赖场景变量） */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-16 z-10 flex justify-center transition-all duration-300 ${
          selectedSkill
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
        }`}
      >
        {selectedSkill && (
          <div
            className="mx-4 flex max-w-md items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-5 py-4 shadow-2xl backdrop-blur-md"
            style={{ boxShadow: `0 10px 40px -12px ${selectedSkill.color}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedSkill.icon}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="font-display text-lg font-bold leading-tight">
                {selectedSkill.label}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {selectedSkill.shortDescription}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/**
 * 门卫组件：等设备检测 ready、确认用户没有要求降级、且场景文件确实存在，
 * 才挂载 KeyboardScene。任何一条不满足都完全卸载（而不是组件内部 early-return），
 * 保证重新满足条件时从干净状态完整重建。
 */
const KeyboardCanvas = () => {
  const { disable3D, maxDpr, ready } = usePerfProfile();
  const sceneStatus = useKeyboardScene();

  if (!ready || disable3D || sceneStatus !== "available") return null;
  return <KeyboardScene maxDpr={maxDpr} />;
};

export default KeyboardCanvas;
