import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <p className="type-title">Page not found</p>
        <Link href="/admin" className="mt-4 inline-block font-semibold text-gold-deep underline">
          Back to the dashboard
        </Link>
      </div>
    </main>
  );
}
