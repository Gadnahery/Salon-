import { useState } from "react";
import { cn } from "@/lib/utils";

type PhotoProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  position?: string;
  transitionName?: string;
};

export function Photo({
  src,
  alt,
  className,
  imgClassName,
  position,
  transitionName,
}: PhotoProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-brand-soft", className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        style={{
          objectPosition: position ?? "center",
          viewTransitionName: transitionName,
        }}
        className={cn(
          "size-full object-cover photo-outline transition-opacity duration-200 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
      />
    </div>
  );
}
