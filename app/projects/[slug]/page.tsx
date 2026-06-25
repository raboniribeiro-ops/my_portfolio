import { notFound } from "next/navigation"
import Link from "next/link"
import { getProjectBySlug, getAllSlugs } from "@/lib/notion"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProjectGallery } from "@/components/ProjectGallery"

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Portfolio"
  return {
    title: project ? `${project.title} — ${siteName}` : "Projeto não encontrado",
    description: project?.description,
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) notFound()

  const meta = [project.client, project.year || null, project.category]
    .filter(Boolean)
    .join(" · ")

  return (
    <>
      <Header />
      <main className="pt-24">
        <div className="px-6 md:px-10 pb-10 flex flex-col md:flex-row md:justify-between md:items-start gap-6">
          <Link
            href="/"
            className="inline-flex border border-border rounded-full px-4 py-1.5 text-xs hover:bg-white/5 transition-colors w-fit"
          >
            ← Back
          </Link>
          <div className="md:text-right">
            <h1 className="font-display text-3xl md:text-5xl font-light leading-tight">{project.title}</h1>
            {meta && <p className="text-xs text-muted mt-2">{meta}</p>}
            {project.description && (
              <p className="text-sm text-fg/70 mt-3 max-w-md md:ml-auto">{project.description}</p>
            )}
          </div>
        </div>

        <div className="px-3 pb-16">
          <ProjectGallery media={project.media} videoUrls={project.videoUrls} />
        </div>
      </main>
      <Footer />
    </>
  )
}
