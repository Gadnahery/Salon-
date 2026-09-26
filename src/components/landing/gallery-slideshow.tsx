import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gallery } from "@/lib/salon/data";
import { cn } from "@/lib/utils";

const INTERVAL = 5000;

export function GallerySlideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused || lightbox !== null) return;
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % gallery.length);
      setTick((t) => t + 1);
    }, INTERVAL);
    return () => window.clearInterval(id);
  }, [paused, lightbox]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % gallery.length));
      if (e.key === "ArrowLeft")
        setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const current = gallery[index];

  function go(next: number) {
    setIndex((next + gallery.length) % gallery.length);
    setTick((t) => t + 1);
  }

  return (
    <>
      <div
        className="relative overflow-hidden rounded-[24px] bg-brand-soft"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative aspect-4/5 md:aspect-16/10">
          {gallery.map((g, i) => (
            <button
              key={g.src}
              type="button"
              aria-label={`View ${g.alt}`}
              onClick={() => setLightbox(i)}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                i === index ? "opacity-100" : "opacity-0 pointer-events-none",
              )}
            >
              <img src={g.src} alt={g.alt} className="size-full object-cover" />
            </button>
          ))}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-ink/50 to-transparent" />
          <p className="absolute bottom-12 left-6 max-w-[70%] text-support text-surface/90 md:bottom-14 md:left-8">
            {current.alt}
          </p>
        </div>

        <div className="absolute inset-x-6 bottom-5 flex items-center gap-2 md:inset-x-8">
          {gallery.map((g, i) => (
            <button
              key={g.src + "dot"}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              onClick={() => go(i)}
              className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-surface/30"
            >
              {i === index && (
                <span
                  key={tick}
                  className={cn(
                    "absolute inset-y-0 left-0 w-full rounded-full bg-surface",
                    paused ? "scale-x-0" : "slide-progress",
                  )}
                  style={paused ? { transform: "scaleX(1)" } : undefined}
                />
              )}
              {i < index && <span className="absolute inset-0 rounded-full bg-surface" />}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => go(index - 1)}
          className="absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-ink backdrop-blur-md md:flex"
        >
          <ChevronLeft className="size-5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => go(index + 1)}
          className="absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-ink backdrop-blur-md md:flex"
        >
          <ChevronRight className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/92">
          <button
            type="button"
            aria-label="Close gallery"
            className="absolute top-5 right-5 flex size-11 items-center justify-center rounded-full text-surface"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
          <button
            type="button"
            className="absolute inset-y-0 left-0 w-1/4"
            aria-label="Previous photo"
            onClick={() => setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length))}
          />
          <img
            src={gallery[lightbox].src}
            alt={gallery[lightbox].alt}
            className="max-h-[88dvh] max-w-[92vw] object-contain"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 w-1/4"
            aria-label="Next photo"
            onClick={() => setLightbox((i) => (i === null ? i : (i + 1) % gallery.length))}
          />
        </div>
      )}
    </>
  );
}
