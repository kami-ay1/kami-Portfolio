"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * 键帽音效 —— 用 Web Audio 实时合成，不依赖任何音频文件。
 *
 * 风格：闷厚 thock（类红轴/奶轴手感）——
 *   press  = 带通噪声闷"嗒"（1.6kHz）+ 中低频"哒"瞬态 + 加厚低频"咚"
 *   release = 更短更轻的回弹"嗒"（2.2kHz）
 * 每次播放加 ±8% 随机变速 + ±60 音分微失谐，避免机关枪式的重复感。
 *
 * 注意：浏览器自动播放策略要求 AudioContext 在用户手势后才能出声，
 * 键盘按下属于手势，没有问题；纯 hover 触发的声音在手势前可能被静音，
 * 属预期行为（内部会尝试 resume，失败即静默跳过）。
 */
export function useKeycapSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    // 0.25 秒白噪声，两个音效共用一个 buffer
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBufferRef.current = buffer;

    return () => {
      ctx.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  const getCtx = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return null;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx.state === "running" ? ctx : null;
  }, []);

  const play = useCallback(
    (
      kind: "press" | "release",
      variation: number // -1..1，已含随机量
    ) => {
      const ctx = getCtx();
      const noise = noiseBufferRef.current;
      if (!ctx || !noise) return;

      const t = ctx.currentTime;
      const master = ctx.createGain();
      master.connect(ctx.destination);

      const isPress = kind === "press";

      // —— 带通噪声：偏闷的塑料"嗒"（频段压低，圆润不刺耳）——
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = (isPress ? 1600 : 2200) * (1 + variation * 0.15);
      bp.Q.value = 1.6;

      const noiseGain = ctx.createGain();
      const peak = isPress ? 0.6 : 0.28;
      const dur = isPress ? 0.045 : 0.026;
      noiseGain.gain.setValueAtTime(peak, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      src.playbackRate.value = (isPress ? 0.95 : 1.3) * (1 + variation * 0.08);
      src.connect(bp);
      bp.connect(noiseGain);
      noiseGain.connect(master);
      src.start(t);
      src.stop(t + dur + 0.02);

      // —— 中低频"哒"瞬态：保留一点敲击感但整体偏闷 ——
      const ping = ctx.createOscillator();
      ping.type = "triangle";
      ping.frequency.setValueAtTime((isPress ? 850 : 1300) * (1 + variation * 0.12), t);
      const pingGain = ctx.createGain();
      pingGain.gain.setValueAtTime(isPress ? 0.2 : 0.12, t);
      pingGain.gain.exponentialRampToValueAtTime(0.001, t + (isPress ? 0.045 : 0.025));
      ping.connect(pingGain);
      pingGain.connect(master);
      ping.start(t);
      ping.stop(t + 0.06);

      // —— 低频"咚"加厚：键程到底的闷响主体 ——
      if (isPress) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(120 * (1 + variation * 0.1), t);
        osc.frequency.exponentialRampToValueAtTime(48, t + 0.08);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.38, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);
        osc.connect(oscGain);
        oscGain.connect(master);
        osc.start(t);
        osc.stop(t + 0.1);
      }
    },
    [getCtx]
  );

  const playPress = useCallback(
    () => play("press", Math.random() * 2 - 1),
    [play]
  );
  const playRelease = useCallback(
    () => play("release", Math.random() * 2 - 1),
    [play]
  );

  return { playPress, playRelease };
}
