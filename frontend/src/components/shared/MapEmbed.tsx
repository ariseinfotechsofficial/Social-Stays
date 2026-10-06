import { cn } from "@/lib/utils";

/** Google Maps embed at an approximate location (no API key needed). Lazy-loaded below the fold. */
export function MapEmbed({ lat, lng, zoom = 12, title, className }: { lat: number; lng: number; zoom?: number; title: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-photo bg-sand-deep", className)}>
      <iframe
        title={title}
        src={`https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0 grayscale-[35%] sepia-[12%]"
      />
    </div>
  );
}
