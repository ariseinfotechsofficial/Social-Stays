import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { EnquiryProvider } from "@/components/enquiry/EnquiryDialog";
import { Analytics } from "@/components/layout/Analytics";
import { SiteProvider } from "@/components/layout/SiteProvider";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { getContent } from "@/lib/content";
import { clientSite, siteUrl } from "@/lib/site";
import "../globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: "500",
  display: "swap",
});

// Italic is only used for quotes and taglines below the fold, so it isn't preloaded
const cormorantItalic = Cormorant_Garamond({
  variable: "--font-cormorant-italic",
  subsets: ["latin"],
  weight: "500",
  style: "italic",
  display: "swap",
  preload: false,
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getContent();
  const { seo, brand } = settings;
  const og = seo.ogImage;
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: seo.title || brand.name,
      template: settings.titleTemplate || `%s | ${brand.name}`,
    },
    description: seo.description || brand.description,
    applicationName: brand.name,
    keywords: seo.keywords,
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: brand.name,
      ...(og ? { images: [{ url: og.src, width: 1200, height: 630, alt: og.alt }] } : {}),
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: "/" },
    formatDetection: { telephone: false },
    ...(brand.favicon ? { icons: { icon: brand.favicon.src, apple: brand.favicon.src } } : {}),
    ...(settings.tracking.googleSiteVerification ? { verification: { google: settings.tracking.googleSiteVerification } } : {}),
    ...(seo.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const content = await getContent();
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${cormorantItalic.variable} ${manrope.variable}`}>
      <body>
        <SiteProvider site={clientSite(content)}>
          <MotionProvider>
            <SmoothScroll>
              <EnquiryProvider>{children}</EnquiryProvider>
            </SmoothScroll>
          </MotionProvider>
        </SiteProvider>
        <Analytics gtmId={content.settings.tracking.gtmId} ga4Id={content.settings.tracking.ga4Id} metaPixelId={content.settings.tracking.metaPixelId} />
      </body>
    </html>
  );
}
