/** English UI strings — customer / staff / admin namespaces */
export const en = {
  common: {
    book: "Book an appointment",
    continue: "Continue",
    back: "Back",
    cancel: "Cancel",
    save: "Save",
    loading: "Loading…",
    notConnected: "Not connected yet",
  },
  customer: {
    homeGreeting: "Ready for your next look?",
    noAppointments: "No upcoming appointments",
    joinWaitlist: "Join waitlist",
    myWaitlist: "My waitlist",
    payDeposit: "Pay deposit",
    requestSent: "Request sent",
  },
  staff: {
    today: "Today",
    acceptRequest: "Accept request",
    walkIn: "Walk-in",
  },
  admin: {
    integrations: "Integrations",
    featureFlags: "Feature flags",
    messageLog: "Message log",
  },
} as const;

export type Dict = typeof en;
