"use client";

import { PROJECTS } from "@/data/content";
import { SKILLS } from "@/data/skills";
import { SectionHeader } from "../section-header";

export function ProjectsSection() {
  return (
    <section
      id="projects"
      className="flex w-full min-h-screen flex-col justify-center px-6 py-24 md:px-16"
    >
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeader title="Projects" desc="Things I've built" />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project) => (
            <a
              key={project.id}
              href={project.href ?? "#"}
              target={project.href ? "_blank" : undefined}
              rel="noreferrer"
              className="group flex flex-col rounded-2xl border border-border/60 bg-secondary/20 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-foreground/30 hover:bg-secondary/40 hover:shadow-xl"
            >
              <h3 className="font-display text-xl font-bold">
                {project.title}
                {project.href && (
                  <span className="ml-2 inline-block transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                    ↗
                  </span>
                )}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {project.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {project.tech.map((key) => {
                  const skill = SKILLS[key];
                  if (!skill) return null;
                  return (
                    <span
                      key={key}
                      className="rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {skill.label}
                    </span>
                  );
                })}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
