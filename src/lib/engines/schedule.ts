import { addMinutes, format, isSunday, parseISO, setHours, setMinutes } from "date-fns";
import { TIME_SLOTS } from "@/lib/salon/format";
import { getTeamMember, stylistsOnTeam } from "@/lib/salon/data";
import { durationFor, MIN_LEAD_MINUTES, SALON_CLOSE, SALON_OPEN } from "./rules";
import type { Appointment, TimeOff } from "@/lib/salon/types";

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && a.end > b.start;
}

export function staffWorksOn(stylistId: string, date: string) {
  const member = getTeamMember(stylistId);
  const day = parseISO(`${date}T12:00:00`).getDay();
  if (isSunday(parseISO(`${date}T12:00:00`))) return false;
  const hours = member?.hours.find((h) => h.day === day);
  if (!hours || hours.off) return false;
  return true;
}

export function staffWindow(stylistId: string, date: string) {
  const member = getTeamMember(stylistId);
  const day = parseISO(`${date}T12:00:00`).getDay();
  const hours = member?.hours.find((h) => h.day === day);
  return {
    start: hours?.start ?? SALON_OPEN,
    end: hours?.end ?? SALON_CLOSE,
    breakStart: member?.breakStart,
    breakEnd: member?.breakEnd,
  };
}

function blocksFor(a: Appointment) {
  const start = toMinutes(a.time);
  const end = start + durationFor(a.serviceId);
  return { start, end };
}

export function occupiedRanges(date: string, stylistId: string, appointments: Appointment[]) {
  return appointments
    .filter(
      (a) =>
        a.date === date &&
        (a.stylistId === stylistId || (a.anyStylist && a.stylistId === "any")) &&
        a.status !== "cancelled" &&
        a.status !== "no_show" &&
        a.status !== "expired",
    )
    .map(blocksFor);
}

export function isTimeOff(stylistId: string, date: string, timeOff: TimeOff[] = []) {
  return timeOff.some((t) => t.staffId === stylistId && t.date === date);
}

export function slotAvailable(opts: {
  date: string;
  time: string;
  stylistId: string;
  serviceId: string;
  appointments: Appointment[];
  ignoreId?: string;
  now?: Date;
  timeOff?: TimeOff[];
}): boolean {
  const { date, time, stylistId, serviceId, appointments, ignoreId, now = new Date(), timeOff = [] } = opts;
  if (isSunday(parseISO(`${date}T12:00:00`))) return false;

  const dur = durationFor(serviceId);
  const start = toMinutes(time);
  const end = start + dur;
  const close = toMinutes(SALON_CLOSE);
  if (end > close) return false;

  const slotStart = parseISO(`${date}T${time}:00`);
  if (slotStart.getTime() - now.getTime() < MIN_LEAD_MINUTES * 60 * 1000) return false;

  const open = appointments.filter((a) => a.id !== ignoreId);

  if (stylistId === "any") {
    return stylistsOnTeam().some((member) => {
      if (member.serviceIds.length && !member.serviceIds.includes(serviceId)) return false;
      return slotAvailable({ ...opts, stylistId: member.id, appointments: open });
    });
  }

  if (!staffWorksOn(stylistId, date)) return false;
  if (isTimeOff(stylistId, date, timeOff)) return false;

  const member = getTeamMember(stylistId);
  if (member && member.serviceIds.length && !member.serviceIds.includes(serviceId)) return false;

  const window = staffWindow(stylistId, date);
  if (start < toMinutes(window.start) || end > toMinutes(window.end)) return false;
  if (window.breakStart && window.breakEnd) {
    const br = { start: toMinutes(window.breakStart), end: toMinutes(window.breakEnd) };
    if (overlaps({ start, end }, br)) return false;
  }

  const taken = occupiedRanges(date, stylistId, open);
  return !taken.some((r) => overlaps({ start, end }, r));
}

export function availableSlots(opts: {
  date: string;
  stylistId: string;
  serviceId: string;
  appointments: Appointment[];
  now?: Date;
  timeOff?: TimeOff[];
  ignoreId?: string;
}) {
  return TIME_SLOTS.filter((time) => slotAvailable({ ...opts, time }));
}

export function dateHasRealAvailability(
  date: string,
  stylistId: string,
  serviceId: string,
  appointments: Appointment[],
  timeOff: TimeOff[] = [],
) {
  return availableSlots({ date, stylistId, serviceId, appointments, timeOff }).length > 0;
}

export function nextOpenDateAt(hour: number, minute: number, from = new Date()) {
  let d = setMinutes(setHours(from, hour), minute);
  d.setSeconds(0, 0);
  if (d.getTime() <= from.getTime() || isSunday(d)) d = addMinutes(d, 24 * 60);
  while (isSunday(d)) d = addMinutes(d, 24 * 60);
  return d;
}

export function todayKey(now = new Date()) {
  return format(now, "yyyy-MM-dd");
}

export function assignFreeStylist(opts: {
  date: string;
  time: string;
  serviceId: string;
  appointments: Appointment[];
  timeOff?: TimeOff[];
}) {
  const free = stylistsOnTeam().find((member) =>
    slotAvailable({ ...opts, stylistId: member.id }),
  );
  return free?.id ?? "any";
}
