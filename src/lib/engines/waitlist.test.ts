import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findNextWaitlistMatch, isOfferExpired, makeOffer } from "./waitlist";
import type { WaitlistEntry } from "@/lib/salon/types";

function entry(partial: Partial<WaitlistEntry> & Pick<WaitlistEntry, "id">): WaitlistEntry {
  return {
    serviceId: "hair-braiding",
    stylistId: "any",
    preferredDate: "2026-10-10",
    customerId: "c1",
    customerName: "Test",
    customerPhone: "255700000000",
    createdAt: "2026-10-01T10:00:00.000Z",
    status: "waiting",
    ...partial,
  };
}

describe("waitlist engine", () => {
  it("matches first waiting entry by join time", () => {
    const entries = [
      entry({ id: "w1", createdAt: "2026-10-01T12:00:00.000Z" }),
      entry({ id: "w0", createdAt: "2026-10-01T10:00:00.000Z" }),
    ];
    const m = findNextWaitlistMatch(entries, {
      serviceId: "hair-braiding",
      stylistId: "x",
      date: "2026-10-10",
      time: "10:00",
    });
    assert.equal(m?.id, "w0");
  });

  it("skips different service", () => {
    const entries = [entry({ id: "w1", serviceId: "nails" })];
    const m = findNextWaitlistMatch(entries, {
      serviceId: "hair-braiding",
      stylistId: "x",
      date: "2026-10-10",
      time: "10:00",
    });
    assert.equal(m, null);
  });

  it("offer expiry", () => {
    const o = makeOffer(entry({ id: "w1" }), { date: "2026-10-10", time: "10:00" }, 15);
    assert.equal(isOfferExpired(o.expiresAt, new Date(Date.now() - 1000)), false);
    assert.equal(isOfferExpired("2000-01-01T00:00:00.000Z"), true);
  });
});
