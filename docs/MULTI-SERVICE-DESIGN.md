# Multi-service booking — design (Feature F)

**Status:** design only until approved. No schema breaking changes.

## Goal
Allow a customer to book more than one service in a single visit (e.g. braids + manicure), with one deposit flow and one staff day view.

## Proposed model (additive)
- New optional table `salon_appointment_items` (appointment_id, service_id, stylist_id, duration_min, price, sort).
- Existing `appointments.serviceId` remains the **primary** service for backwards compatibility.
- Quote engine sums item prices; deposit % applies to total.
- Schedule engine blocks contiguous time for sum of durations (or sequential slots with buffer setting).

## UX
1. Service detail → “Add another service” before date/time.
2. Review step lists all services + total.
3. Staff Today shows combined visit; can start/complete per item later (phase 2 of multi-service).

## Migration
Additive only. Old rows = single item implied from appointment.serviceId.

## Open decisions
- Sequential slots vs one block of combined duration?
- One stylist for all vs per-service stylist?
