"use client";

import { useState } from "react";
import { config } from "@/data/config";
import { SectionHeader } from "../section-header";
import { ContactModal } from "../contact-modal";

export function ContactSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section
      id="contact"
      className="flex w-full min-h-screen flex-col items-center justify-center px-6 py-24 text-center"
    >
      <div className="w-full max-w-2xl">
        <SectionHeader
          title="Let's Work Together"
          desc="Have a project in mind? My inbox is always open."
          className="text-center [&>h2]:mx-auto"
        />
        <button
          onClick={() => setModalOpen(true)}
          className="inline-block rounded-full bg-primary px-10 py-4 text-lg font-semibold text-primary-foreground transition-transform hover:-translate-y-1"
        >
          Say Hello
        </button>{" "}
        <a
          href={config.social.email}
          className="ml-1 inline-block text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          或直接发邮件
        </a>
        <p className="mt-10 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {config.author} · Built with Next.js +
          Spline ·{" "}
          <a
            href="https://github.com/Naresh-Khatri/3d-portfolio"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            inspired by Naresh Khatri
          </a>
        </p>
      </div>

      <ContactModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
