"use client";

import Script from "next/script";
import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/**
 * Tracking IDs come from Settings → SEO & tracking in the admin.
 * Preferred setup: only a GTM container, with GA4, Meta Pixel and Conversions API configured inside it.
 * GA4 and the Meta Pixel can also be loaded directly when GTM isn't used; never set both, or visits count twice.
 * Also captures UTM / referrer for WhatsApp enquiries.
 */
export function Analytics({ gtmId, ga4Id, metaPixelId }: { gtmId?: string; ga4Id?: string; metaPixelId?: string }) {
  useEffect(() => {
    captureAttribution();
  }, []);

  const safe = (id?: string) => (id && /^[\w-]+$/.test(id) ? id : "");
  const gtm = safe(gtmId);
  const ga4 = gtm ? "" : safe(ga4Id);
  const pixel = gtm ? "" : safe(metaPixelId);

  return (
    <>
      {gtm && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      )}
      {ga4 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`}
          </Script>
        </>
      )}
      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
