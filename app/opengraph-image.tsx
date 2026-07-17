import { ImageResponse } from "next/og"

export const alt = process.env.NEXT_PUBLIC_SITE_NAME ?? "Portfolio"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

async function loadInterTight(weight: number) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter+Tight:wght@${weight}&display=swap`
  ).then((res) => res.text())
  const fontUrl = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1]
    ?? css.match(/url\((.+?)\)/)?.[1]
  if (!fontUrl) throw new Error("Inter Tight font URL not found")
  return fetch(fontUrl).then((res) => res.arrayBuffer())
}

export default async function Image() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Portfolio"
  const siteRole = process.env.NEXT_PUBLIC_SITE_ROLE ?? ""
  const initial = (siteName.trim()[0] ?? "P").toUpperCase()

  const [regular, light] = await Promise.all([
    loadInterTight(700),
    loadInterTight(300),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #0d1117 0%, #111827 44%, #171c29 100%)",
          color: "#f8fafc",
          fontFamily: "Inter Tight, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(248, 250, 252, 0.06)",
              border: "1px solid rgba(248, 250, 252, 0.12)",
              fontSize: 40,
              fontWeight: 700,
              color: "#f8fafc",
            }}
          >
            {initial}
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 18,
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em" }}>
              {siteName}
            </div>
            {siteRole && (
              <div style={{ marginTop: 14, fontSize: 28, fontWeight: 300, color: "#94a3b8" }}>
                {siteRole}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 400, color: "#cbd5e1" }}>
              Full-stack portfolio with clean design and strong technical storytelling.
            </div>
          </div>
          <div
            style={{
              padding: "18px 28px",
              borderRadius: 20,
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(148, 163, 184, 0.16)",
              fontSize: 22,
              fontWeight: 600,
              color: "#e2e8f0",
            }}
          >
            Portfolio
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter Tight", data: regular, weight: 700, style: "normal" },
        { name: "Inter Tight", data: light, weight: 300, style: "normal" },
      ],
    }
  )
}
