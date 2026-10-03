import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/icons/icon-192.png"
      alt=""
      width={32}
      height={32}
      className={cn("size-8 rounded-full object-cover", className)}
    />
  );
}

export function LogoWord({
  className,
  light,
}: {
  className?: string;
  light?: boolean;
}) {
  const isNoir =
    typeof document === "undefined" ||
    document.documentElement.getAttribute("data-theme") !== "ivory";
  const useWhite = light === true || (light !== false && isNoir);
  const src = useWhite
    ? "/brand/logo-white-transparent.png"
    : "/brand/logo-black-transparent.png";

  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src={src}
        alt="Warembo Village"
        className="h-9 w-auto max-w-[160px] object-contain object-left"
      />
    </span>
  );
}
