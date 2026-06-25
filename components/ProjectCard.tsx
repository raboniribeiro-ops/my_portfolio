import Link from "next/link"
import type { Project } from "@/lib/types"

interface ProjectCardProps {
  project: Project
  priority?: boolean
  fillHeight?: boolean
}

export function ProjectCard({ project, fillHeight = false }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`group relative block overflow-hidden bg-border ${fillHeight ? 'w-full h-full' : 'w-full'}`}
    >
      {project.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.cover}
          alt={project.title}
          className={
            fillHeight
              ? "absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              : "w-full h-auto block group-hover:scale-105 transition-transform duration-500 origin-center"
          }
          loading="lazy"
        />
      )}

      {/* Fallback sem imagem no modo masonry */}
      {!project.cover && !fillHeight && (
        <div className="w-full aspect-square bg-border" />
      )}

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
        <p className="text-sm font-medium text-fg leading-tight">{project.title}</p>
        <p className="text-[10px] text-muted mt-0.5">
          {[project.client, project.year].filter(Boolean).join(' · ')}
        </p>
      </div>
    </Link>
  )
}
