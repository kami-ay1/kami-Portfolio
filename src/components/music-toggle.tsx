"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "@/data/config";

/**
 * 顶栏音乐开关（Lusion 式均衡器按钮）：
 *   - 静止态：四根等宽等长满高柱条；播放态：各自随机跳动（均衡器动画）
 *   - 自动播放策略：进页即尝试出声播放；被浏览器策略拒绝（绝大多数访客
 *     首访都会）则静音起播，并在首次点击/按键/触屏时解除静音——体感上
 *     就是"一碰页面音乐就响"。浏览器不允许任何站点完全无声绕过该策略。
 *   - 音源 config.bgm.url（本地文件），循环播放；加载失败静默回关闭态
 */

type Phase = "off" | "armed" | "playing";
/** off = 未播放；armed = 已静音起播、等首次交互解除静音；playing = 出声中 */

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockRef = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<Phase>("off");
  const [bubble, setBubble] = useState<string | null>(null);
  const bubbleTimer = useRef(0);
  const phaseRef = useRef<Phase>("off");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const showNote = useCallback(
    (text: string, ms: number) => {
      setBubble(text);
      window.clearTimeout(bubbleTimer.current);
      bubbleTimer.current = window.setTimeout(() => setBubble(null), ms);
    },
    []
  );
  const [showBubble, setShowBubble] = useState(false);

  // 进页即尝试自动播放（见顶部注释的策略说明）
  useEffect(() => {
    const a = new Audio(config.bgm.url);
    a.loop = true;
    a.volume = config.bgm.volume;
    audioRef.current = a;

    let cancelled = false;
    const unlock = () => {
      if (cancelled) return;
      a.muted = false;
      setPhase("playing");
      setBubble(null);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    unlockRef.current = unlock;

    a.play()
      .then(() => {
        // 浏览器互动分足够，直接出声
        if (!cancelled) setPhase("playing");
      })
      .catch(() => {
        if (cancelled) return;
        // 被策略拦截：静音起播（永远被允许），等首次交互解除静音
        a.muted = true;
        a.play()
          .then(() => {
            if (cancelled) return;
            setPhase("armed");
            window.addEventListener("pointerdown", unlock);
            window.addEventListener("keydown", unlock);
            window.addEventListener("touchstart", unlock, { passive: true });
          })
          .catch(() => {
            /* 音频加载失败：保持关闭态，按钮仍可手动重试 */
          });
      });

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      a.pause();
    };
  }, []);

  // 加载屏擦出时：根据状态弹气泡引导音乐（首访必现）
  useEffect(() => {
    const onPreloaderDone = () => {
      if (phaseRef.current === "armed") showNote("点击任意处播放音乐", 9000);
      else if (phaseRef.current === "playing")
        showNote("🎵 背景音乐播放中", 4500);
    };
    window.addEventListener("preloader:done", onPreloaderDone);
    return () => window.removeEventListener("preloader:done", onPreloaderDone);
  }, [showNote]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (phase === "playing") {
      a.pause();
      setPhase("off");
    } else {
      // off：起播；armed：本次点击即解除静音（unlock 也会触发，幂等）
      if (phase === "armed") {
        unlockRef.current();
        return;
      }
      a.muted = false;
      a.play()
        .then(() => setPhase("playing"))
        .catch(() => setPhase("off"));
    }
  };

  return (
    <button
      aria-label={
        phase === "playing" ? "暂停背景音乐" : "播放背景音乐"
      }
      title={
        phase === "playing"
          ? "音乐：开（点击暂停）"
          : phase === "armed"
            ? "音乐已就绪（静音），点击任意处播放"
            : "音乐：关（点击播放）"
      }
      onClick={toggle}
      className={`btn-fill relative grid size-10 place-items-center rounded-lg text-foreground/80 transition-colors hover:text-foreground ${
        phase === "playing"
          ? "music-on"
          : phase === "armed"
            ? "music-armed"
            : ""
      }`}
    >
      <span className="eq flex h-4 items-end gap-[3px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className="eq-bar block w-[3px] rounded-full bg-current" />
        ))}
      </span>
      {/* 待命气泡：静音起播时引导访客点击任意处出声 */}
      {bubble && (
        <span className="mb-bubble" role="status">
          {bubble}
          <i className="mb-bubble-arrow" aria-hidden />
        </span>
      )}
      <style>{`
/* 静止态：四根等宽等长柱条，顶满整个容器 */
.eq-bar { height: 100%; transition: height .3s var(--ease-lando, ease); }
/* 待命态（静音起播、等首次交互）：柱条呼吸提示"点一下就有音乐" */
.music-armed .eq-bar { animation: eq-breath 1.6s ease-in-out infinite; }
.music-armed .eq-bar:nth-child(2) { animation-delay: .2s; }
.music-armed .eq-bar:nth-child(3) { animation-delay: .4s; }
.music-armed .eq-bar:nth-child(4) { animation-delay: .6s; }
@keyframes eq-breath { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
/* 播放态：每根柱条各自的跳动区间 + 不同时长 + 负延迟错相，
   时长互质式错开让相位持续漂移，不会出现整齐的波浪 */
.music-on .eq-bar { animation: eq-jump-a .8s ease-in-out infinite alternate; }
.music-on .eq-bar:nth-child(1) { animation-duration: .54s; animation-delay: -.12s; }
.music-on .eq-bar:nth-child(2) { animation-name: eq-jump-b; animation-duration: .78s; animation-delay: -.41s; }
.music-on .eq-bar:nth-child(3) { animation-name: eq-jump-c; animation-duration: .46s; animation-delay: -.06s; }
.music-on .eq-bar:nth-child(4) { animation-name: eq-jump-d; animation-duration: .67s; animation-delay: -.28s; }
@keyframes eq-jump-a { from { height: 22%; } to { height: 100%; } }
@keyframes eq-jump-b { from { height: 45%; } to { height: 92%; } }
@keyframes eq-jump-c { from { height: 15%; } to { height: 78%; } }
@keyframes eq-jump-d { from { height: 30%; } to { height: 100%; } }
/* 待命气泡：按钮下方弹出引导（点击任意处出声） */
.mb-bubble {
  position: absolute; right: 0; top: calc(100% + 10px);
  display: block; white-space: nowrap;
  padding: 7px 12px; border-radius: 10px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
  font-size: 12px; line-height: 1.4;
  box-shadow: 0 8px 24px rgba(0,0,0,.35);
  animation: mb-in .35s cubic-bezier(0.34,1.4,0.64,1) both;
  pointer-events: none;
}
.mb-bubble-arrow {
  position: absolute; top: -5px; right: 14px;
  width: 9px; height: 9px; transform: rotate(45deg);
  background: hsl(var(--background));
  border-left: 1px solid hsl(var(--border));
  border-top: 1px solid hsl(var(--border));
}
@keyframes mb-in {
  from { opacity: 0; transform: translateY(-6px) scale(.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
`}</style>
    </button>
  );
}
