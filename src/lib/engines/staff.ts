import { getTeamMember, stylistsOnTeam } from "@/lib/salon/data";
import type { Appointment, ShiftStatus, StaffRole, TeamMember } from "@/lib/salon/types";

export function qualifiedFor(serviceId: string, team: TeamMember[] = stylistsOnTeam()) {
  return team.filter((m) => m.active !== false && m.role === "stylist" && m.serviceIds.includes(serviceId));
}

export function canPerform(staffId: string, serviceId: string) {
  const member = getTeamMember(staffId);
  if (!member || member.active === false) return false;
  if (member.role === "admin" || member.role === "manager") return true;
  if (!member.serviceIds.length) return false;
  return member.serviceIds.includes(serviceId);
}

export function liveShift(staffId: string, appointments: Appointment[], override: ShiftStatus): ShiftStatus {
  if (override === "on_break" || override === "offline") return override;
  const busy = appointments.some((a) => a.stylistId === staffId && a.status === "in_service");
  return busy ? "busy" : "available";
}

export function staffTodayLoad(staffId: string, date: string, appointments: Appointment[]) {
  const mine = appointments.filter(
    (a) => a.date === date && a.stylistId === staffId && a.status !== "cancelled" && a.status !== "expired",
  );
  return {
    appointments: mine.length,
    completed: mine.filter((a) => a.status === "completed").length,
    inService: mine.filter((a) => a.status === "in_service").length,
  };
}

export function roleLabel(role: StaffRole) {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  if (role === "receptionist") return "Reception";
  return "Stylist";
}
