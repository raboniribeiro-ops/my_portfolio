interface ProjectGalleryProps {
  media: string[]
  videoUrls: string[]
}

function getEmbedUrl(url: string): string | null {
  if (url.includes("youtube.com/watch")) {
    const id = new URL(url).searchParams.get("v")
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0]
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  if (url.includes("vimeo.com/")) {
    const id = url.split("vimeo.com/")[1]?.split("?")[0]
    return id ? `https://player.vimeo.com/video/${id}` : null
  }
  return null
}

export function ProjectGallery({ media, videoUrls }: ProjectGalleryProps) {
  const items: Array<{ type: "image"; src: string } | { type: "video"; url: string }> = []

  const totalMedia = media.length
  const totalVideos = videoUrls.length

  let mi = 0
  let vi = 0

  while (mi < totalMedia || vi < totalVideos) {
    if (mi < totalMedia) { items.push({ type: "image", src: media[mi++] }) }
    if (mi < totalMedia) { items.push({ type: "image", src: media[mi++] }) }
    if (vi < totalVideos) { items.push({ type: "video", url: videoUrls[vi++] }) }
  }

  return (
    <div className="flex flex-col gap-2 md:gap-3">
      {items.map((item, i) => {
        if (item.type === "image") {
          return (
            <div key={i} className="relative w-full aspect-video overflow-hidden bg-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )
        }

        const embedUrl = getEmbedUrl(item.url)

        if (embedUrl) {
          return (
            <div key={i} className="w-full aspect-video">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          )
        }

        if (item.url.endsWith(".mp4") || item.url.includes(".mp4")) {
          return (
            <div key={i} className="w-full aspect-video">
              <video
                src={item.url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
