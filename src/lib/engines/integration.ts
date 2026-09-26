/** External providers. Only HarakaPay is wired; others stay as named stubs. */
export const INTEGRATIONS = {
  payments: "harakapay" as const,
  sms: null,
  whatsapp: null,
  email: null,
  maps: "openstreetmap" as const,
  calendar: "ics" as const,
};

export function paymentProviderLabel() {
  return "HarakaPay";
}

export function unsupportedIntegration(name: string) {
  return `${name} is not connected yet.`;
}
