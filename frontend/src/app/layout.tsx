import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { EnquiryProvider } from "@/components/enquiry/EnquiryDialog";
import { Analytics } from "@/components/layout/Analytics";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { photo } from "@/data/photos";
import { site } from "@/lib/site";
import "./globals.css";

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

const ogImage = photo("villas/shipra-farm/01").src;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Social Stays — Private villas & farmhouses near Indore",
    template: "%s | Social Stays",
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "villa near Indore",
    "farmhouse in Indore for party",
    "Jaam Gate stay",
    "private pool villa Indore",
    "Mandu villa",
    "Omkareshwar stay",
    "Ujjain farmhouse",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    images: [{ url: typeof ogImage === "string" ? ogImage : ogImage.src, width: 1200, height: 630, alt: "Shipra Farm at dusk" }],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${cormorantItalic.variable} ${manrope.variable}`}>
      <body>
        <MotionProvider>
          <SmoothScroll>
            <EnquiryProvider>{children}</EnquiryProvider>
          </SmoothScroll>
        </MotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
