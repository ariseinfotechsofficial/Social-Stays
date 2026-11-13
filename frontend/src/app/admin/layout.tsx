import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Providers } from "@admin/components/Providers";
import "./admin.css";

const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: "500", display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Social Stays Admin", template: "%s · Social Stays Admin" },
  robots: { index: false, follow: false },
};

/**
 * Root layout for /admin. Separate from the public site's root layout, so the admin never loads the
 * site's analytics, smooth scrolling or styles, and the site never loads the admin's.
 */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${manrope.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
