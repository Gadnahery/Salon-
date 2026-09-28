import { useRef, useState } from "react";
import { Photo } from "@/components/salon/photo";
import { Button } from "@/components/ui/button";
import { pickImageAsSrc } from "@/lib/salon/image-upload";
import { cn } from "@/lib/utils";

type Props = {
  value?: string;
  onChange: (src: string) => void;
  label?: string;
  className?: string;
  /** Extra images the admin can pick from (gallery) */
  galleryChoices?: Array<{ id: string; src: string; alt: string }>;
};

export function ImagePicker({ value, onChange, label = "Photo", className, galleryChoices }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const src = await pickImageAsSrc(file);
      onChange(src);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not use that photo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-support font-medium text-muted">{label}</p>
      {value ? (
        <Photo src={value} alt="" className="aspect-[4/5] w-full max-w-xs rounded-[20px]" />
      ) : (
        <div className="flex aspect-[4/5] w-full max-w-xs items-center justify-center rounded-[20px] border border-dashed border-line bg-surface text-support text-muted">
          No photo yet
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="h-11 bg-ink text-white"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Loading…" : value ? "Change photo" : "Choose photo"}
        </Button>
        {galleryChoices && galleryChoices.length > 0 && (
          <Button type="button" variant="secondary" className="h-11" onClick={() => setShowGallery((v) => !v)}>
            {showGallery ? "Hide gallery" : "From gallery"}
          </Button>
        )}
        {value && (
          <Button type="button" variant="secondary" className="h-11" onClick={() => onChange("")}>
            Remove
          </Button>
        )}
      </div>

      {error && <p className="rounded-2xl bg-brand-soft px-4 py-3 text-support text-brand">{error}</p>}

      {showGallery && galleryChoices && (
        <ul className="grid grid-cols-3 gap-2">
          {galleryChoices.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className={cn(
                  "overflow-hidden rounded-2xl border-2",
                  value === g.src ? "border-ink" : "border-transparent",
                )}
                onClick={() => {
                  onChange(g.src);
                  setShowGallery(false);
                }}
              >
                <Photo src={g.src} alt={g.alt} className="aspect-square w-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
