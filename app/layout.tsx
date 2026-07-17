import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Portfólio";
const siteRole = process.env.NEXT_PUBLIC_SITE_ROLE ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
const description = siteRole ? `${siteName} — ${siteRole}` : siteName;
const openGraphImage = new URL("/og-image.webp", siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { template: `%s — ${siteName}`, default: siteName },
  description,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName,
    url: siteUrl,
    title: siteName,
    description,
    images: [
      {
        url: openGraphImage,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    images: [openGraphImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <div className="animate-page-in">{children}</div>
      </body>
    </html>
  );
}
