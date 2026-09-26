import type { Appointment, ReviewRecord } from "@/lib/salon/types";

export function canReview(appointment: Appointment | undefined, reviews: ReviewRecord[]) {
  if (!appointment) return false;
  if (appointment.status !== "completed") return false;
  return !reviews.some((r) => r.appointmentId === appointment.id);
}

export function averageRating(reviews: ReviewRecord[]) {
  const pub = reviews.filter((r) => r.published);
  if (!pub.length) return 0;
  return Math.round((pub.reduce((s, r) => s + r.rating, 0) / pub.length) * 10) / 10;
}

export function reviewsForStaff(reviews: ReviewRecord[], staffId: string) {
  return reviews.filter((r) => r.published && r.stylistId === staffId);
}
