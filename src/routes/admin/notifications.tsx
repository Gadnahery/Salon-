import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useSalonStore } from "@/lib/salon/store";
import { useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/admin/notifications")({
  component: AdminNotifications,
});

function AdminNotifications() {
  const noticesAll = useSalonStore((s) => s.notices);
  const notices = noticesAll.filter((n) => n.audience === "admin");
  const templates = useSalonStore((s) => s.templates);
  const updateTemplate = useSalonStore((s) => s.updateTemplate);
  const mark = useSalonStore((s) => s.markNoticesRead);
  const hydrated = useHydrated();
  const [edit, setEdit] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated) mark("admin");
  }, [hydrated, mark]);

  const current = templates.find((t) => t.id === edit);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <h1 className="text-title font-normal">Notifications</h1>
      <section className="mt-8">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Templates</p>
        <ul className="mt-4 space-y-3">
          {templates.map((t) => (
            <li key={t.id} className="rounded-[20px] bg-surface p-5">
              <p className="text-body font-medium">{t.title}</p>
              <p className="mt-1 text-body text-muted">{t.body}</p>
              <button type="button" className="mt-3 text-support" onClick={() => setEdit(t.id)}>
                Edit template
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Inbox</p>
        <ul className="mt-4">
          {notices.map((n) => (
            <li key={n.id} className="border-b border-line py-4">
              <p className="text-body font-medium">{n.title}</p>
              <p className="mt-1 text-body text-muted">{n.body}</p>
              <p className="mt-2 text-support text-muted">
                {formatDistanceToNow(new Date(n.time), { addSuffix: true })}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {current && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <form
            className="w-full max-w-lg rounded-[24px] bg-surface p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateTemplate(current.id, {
                title: String(fd.get("title")),
                body: String(fd.get("body")),
              });
              setEdit(null);
            }}
          >
            <p className="text-section font-normal">Edit template</p>
            <Label className="mt-4">Title</Label>
            <Input name="title" defaultValue={current.title} />
            <Label className="mt-4">Body</Label>
            <Textarea name="body" defaultValue={current.body} />
            <p className="mt-3 text-support text-muted">Use {"{{time}}"} for the appointment time.</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" className="h-12" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" className="h-12">
                Save
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
