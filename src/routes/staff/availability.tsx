import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ScreenHeader } from "@/components/salon/screen-header";
import { useSalonStore } from "@/lib/salon/store";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const Route = createFileRoute("/staff/availability")({ component: StaffAvailability });

function StaffAvailability() {
  const session = useSalonStore((s) => s.session);
  const team = useSalonStore((s) => s.team);
  const timeOff = useSalonStore((s) => s.timeOff);
  const updateStaffHours = useSalonStore((s) => s.updateStaffHours);
  const addTimeOff = useSalonStore((s) => s.addTimeOff);
  const removeTimeOff = useSalonStore((s) => s.removeTimeOff);
  const member = team.find((m) => m.id === session.actorId);
  const mine = timeOff.filter((t) => t.staffId === session.actorId);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("Personal leave");

  if (!member) {
    return (
      <main className="px-5 py-16">
        <p className="text-body">Sign in as staff to manage availability.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg pb-28">
      <ScreenHeader title="Availability" backTo="/staff/more" />
      <div className="px-5">
        <p className="text-section font-normal">{member.name}</p>
        <p className="mt-1 text-support text-muted">Working hours feed the booking engine.</p>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const hours = DAYS.map((_, day) => {
              const off = fd.get(`off-${day}`) === "on";
              return {
                day,
                start: String(fd.get(`start-${day}`) || "09:00"),
                end: String(fd.get(`end-${day}`) || "19:00"),
                off: day === 0 || off,
              };
            });
            updateStaffHours(member.id, hours);
          }}
        >
          {DAYS.map((label, day) => {
            const hours = member.hours.find((h) => h.day === day);
            const off = hours?.off || day === 0;
            return (
              <div key={day} className="rounded-[20px] bg-surface px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-body">{label}</p>
                  {day !== 0 && (
                    <label className="flex items-center gap-2 text-support text-muted">
                      <input type="checkbox" name={`off-${day}`} defaultChecked={off} /> Off
                    </label>
                  )}
                  {day === 0 && <span className="text-support text-muted">Off</span>}
                </div>
                {day !== 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Input name={`start-${day}`} type="time" defaultValue={hours?.start ?? "09:00"} />
                    <Input name={`end-${day}`} type="time" defaultValue={hours?.end ?? "19:00"} />
                  </div>
                )}
              </div>
            );
          })}
          <Button type="submit" className="h-12 w-full">
            Save hours
          </Button>
        </form>

        <p className="mt-10 text-micro uppercase tracking-[0.16em] text-muted">Time off</p>
        <ul className="mt-3 space-y-2">
          {mine.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
              <span>
                <span className="block text-body">{t.date}</span>
                <span className="text-support text-muted">{t.reason}</span>
              </span>
              <button type="button" className="text-support text-danger" onClick={() => removeTimeOff(t.id)}>
                Remove
              </button>
            </li>
          ))}
          {mine.length === 0 && <p className="text-support text-muted">No upcoming time off.</p>}
        </ul>
        <Label className="mt-6">Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Label className="mt-3">Reason</Label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button
          className="mt-4 h-12 w-full"
          disabled={!date}
          onClick={() => {
            addTimeOff(member.id, date, reason.trim() || "Time off");
            setDate("");
          }}
        >
          Add time off
        </Button>
      </div>
    </main>
  );
}
