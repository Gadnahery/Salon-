import { useState } from "react";
import { cn } from "@/lib/utils";

type PhotoProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  position?: string;
  transitionName?: string;
  /** Use for above-the-fold hero images */
  priority?: boolean;
};

export function Photo({
  src,
  alt,
  className,
  imgClassName,
  position,
  transitionName,
  priority,
}: PhotoProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={cn("relative overflow-hidden bg-brand-soft", className)}
        aria-label={alt || "Image"}
      />
    );
  }
  return (
    <div className={cn("relative overflow-hidden bg-brand-soft", className)}>
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{
          objectPosition: position ?? "center",
          viewTransitionName: transitionName,
        }}
        className={cn(
          "size-full object-cover photo-outline transition-opacity duration-150 ease-out",
          loaded ? "opacity-100" : "opacity-60",
          imgClassName,
        )}
      />
    </div>
  );
}
