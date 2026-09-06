"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { config } from "@/data/config";
import { ContactModal } from "../contact-modal";
import { ContactRows } from "../contact-rows";

gsap.registerPlugin(ScrollTrigger);

/**
 * Contact —— 原型 08：Lusion 式巨型宣言 + 单一 CTA + 联系信息行 + 一行式 Footer。
 *   - 巨字 "Let's work / together" 行遮罩升起（一次性，第二行强调色错峰）
 *   - Say Hello 药丸：弹性光标包裹 + 磁吸（cursor-can-hover），点击开表单弹窗
 *   - Footer：一行式极简 + 音乐署名；Back to top 走 Lenis 平滑
 */
export function ContactSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const lenis = useLenis();
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>("[data-c-line], [data-c-row]");
    const tween = gsap.to(targets, {
      y: "0%",
      duration: 0.8,
      ease: "power2.inOut",
      stagger: 0.12,
      paused: true,
    });
    const st = ScrollTrigger.create({
      trigger: root,
      start: "top 78%",
      once: true,
      onEnter: () => tween.play(),
    });
    return () => {
      st.kill();
      tween.kill();
    };
  }, []);

  return (
    <section
      id="contact"
      className="relative flex w-full min-h-screen flex-col items-center justify-center px-6 py-24 text-center"
    >
      <div ref={stageRef} className="w-full max-w-3xl">
        {/* 巨型宣言：两行行遮罩，第二行强调色 */}
        <h2 className="sr-only">Let&apos;s work together</h2>
        <div className="giant select-none" aria-hidden>
          <div className="overflow-hidden">
            <p
              data-c-line
              style={{ transform: "translateY(110%)" }}
              className="giant-line will-change-transform"
            >
              Let&apos;s work
            </p>
          </div>
          {/* 第二行有 g 的下伸尾部：遮罩底部多留 0.14em，否则 g 的尾巴被裁平 */}
          <div className="overflow-hidden pb-[0.14em]">
            <p
              data-c-line
              style={{ transform: "translateY(130%)" }}
              className="giant-line giant-accent will-change-transform"
            >
              together
            </p>
          </div>
        </div>

        {/* CTA：光标磁吸包裹（ElasticCursor 自动生效） */}
        <div className="mt-10 overflow-hidden">
          <div data-c-row style={{ transform: "translateY(110%)" }}>
            <button
              onClick={() => setModalOpen(true)}
              className="cursor-can-hover rounded-full bg-primary px-10 py-4 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90"
            >
              Say Hello
            </button>
          </div>
        </div>

        <ContactRows />

        {/* Footer：一行式极简 */}
        <footer className="mt-16 overflow-hidden">
          <div data-c-row style={{ transform: "translateY(110%)" }}>
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                © {new Date().getFullYear()} {config.author}
              </span>
              <span aria-hidden>·</span>
              <a
                href={config.social.github}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                github
              </a>
              <span aria-hidden>·</span>
              <a
                href={config.social.email}
                className="transition-colors hover:text-foreground"
              >
                email
              </a>
              <span aria-hidden>·</span>
              <a
                href="https://github.com/Naresh-Khatri/3d-portfolio"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                3D scene credit: Naresh Khatri
              </a>
              <span aria-hidden>·</span>
              <button
                onClick={() => lenis?.scrollTo(0)}
                className="cursor-can-hover transition-colors hover:text-foreground"
              >
                Back to top ↑
              </button>
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground/60">
              Music by{" "}
              <a
                href="https://pixabay.com/music/lofi-lo-fi-waves-580731/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Marco Conti
              </a>{" "}
              from{" "}
              <a
                href="https://pixabay.com/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Pixabay
              </a>
            </p>
          </div>
        </footer>
      </div>

      <ContactModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <style>{`
.giant-line {
  font-family: var(--font-display), sans-serif;
  font-weight: 700;
  font-size: clamp(48px, 9.5vw, 118px);
  line-height: 1.04;
  letter-spacing: -0.02em;
}
.giant-accent { color: #5865f2; }
.dark .giant-accent { color: #aab6f5; }
`}</style>
    </section>
  );
}
