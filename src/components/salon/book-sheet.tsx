import { Drawer } from "vaul";
import { useNavigate } from "@tanstack/react-router";
import { categoryOrder, categoryLabel } from "@/lib/salon/format";
import { useSalonStore } from "@/lib/salon/store";
import type { Category } from "@/lib/salon/types";

const copy: Record<Category, string> = {
  hair: "Braids, presses, locs",
  nails: "Gel, acrylic, pedicure",
  makeup: "Everyday, occasion, bridal",
  treatments: "Hair, scalp, facial",
};

export function BookSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const setDraft = useSalonStore((s) => s.setDraft);

  function pick(category: Category) {
    setDraft({ serviceId: null, stylistId: "any", date: null, time: null });
    onOpenChange(false);
    void navigate({ to: "/app/services", search: { category } });
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-surface px-6 pb-10 pt-4 shadow-soft outline-none">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line" />
          <Drawer.Title className="text-title font-normal tracking-tight text-ink">
            What would you like to book?
          </Drawer.Title>
          <p className="mt-1 text-body text-muted">Choose a category to begin.</p>
          <ul className="mt-6 flex flex-col">
            {categoryOrder.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => pick(c)}
                  className="flex w-full items-center justify-between border-b border-line px-1 py-5 text-left last:border-0"
                >
                  <span>
                    <span className="block text-body font-medium text-ink">{categoryLabel(c)}</span>
                    <span className="block text-support text-muted">{copy[c]}</span>
                  </span>
                  <span className="text-muted">→</span>
                </button>
              </li>
            ))}
          </ul>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
