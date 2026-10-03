/**
 * Warembo Village motion system — single source for timing, easing, reduced-motion.
 * Use with `motion` package: LazyMotion + m.* components.
 */
import type { Transition, Variants } from "motion/react";

/** Micro interactions: taps, toggles */
export const micro: Transition = {
  duration: 0.15,
  ease: [0.22, 1, 0.36, 1],
};

/** Standard: cards, sheets, list items */
export const standard: Transition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1], // ease-out-quart-ish
};

/** Emphasised: page, hero, success */
export const emphasized: Transition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

export const springCustomer = { type: "spring" as const, stiffness: 380, damping: 28 };
export const springStaff = { type: "spring" as const, stiffness: 520, damping: 34 };
export const springAdmin = { type: "spring" as const, stiffness: 600, damping: 40 };

export const stagger = {
  delayChildren: 0.04,
  staggerChildren: 0.05,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: standard },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: standard },
};

export const scalePress = {
  whileTap: { scale: 0.97 },
  transition: micro,
};

export const listContainer: Variants = {
  hidden: {},
  show: { transition: stagger },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: standard },
};

/** Soft page transition (customer) */
export const pageCustomer: Variants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0, transition: standard },
  exit: { opacity: 0, x: -8, transition: micro },
};

/** Fast fade (staff) */
export const pageStaff: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: micro },
  exit: { opacity: 0, transition: micro },
};

/** Near-instant rise (admin) */
export const pageAdmin: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: micro },
  exit: { opacity: 0, transition: micro },
};
