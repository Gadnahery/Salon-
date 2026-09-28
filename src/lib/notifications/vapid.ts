/** VAPID keys for Web Push (public is safe on client; private is server-only). */
export const VAPID_SUBJECT =
  (typeof process !== "undefined" && process.env.VAPID_SUBJECT) ||
  "mailto:gadnahery7@gmail.com";

export const VAPID_PUBLIC_KEY =
  (typeof process !== "undefined" && process.env.VAPID_PUBLIC_KEY) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_VAPID_PUBLIC_KEY) ||
  "BF8KK2gkYJthaGTGlyEM-6vva3pce0DHEIgjtK2C8SxqSgDwEMv6t_Gik6xJYBm6elomOobvWJjQ1Al-dRHHV90";

/** Server only — never import this into client components. */
export function getVapidPrivateKey(): string {
  if (typeof process !== "undefined" && process.env.VAPID_PRIVATE_KEY) {
    return process.env.VAPID_PRIVATE_KEY;
  }
  return "0-j_rRLpPjEeSTD_QkR3RRHPF_0OBHA0K-LMaZtsSH0";
}
