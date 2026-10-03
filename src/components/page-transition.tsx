import { m, AnimatePresence } from "motion/react";
import type { ReactNode } from "react";
import { pageCustomer } from "@/lib/motion";

/** Soft route transition for customer portal pages. */
export function PageTransition({
  routeKey,
  children,
}: {
  routeKey: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <m.div
        key={routeKey}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageCustomer}
        className="min-h-dvh"
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
