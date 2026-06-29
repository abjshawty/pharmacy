// Abidjan is GMT (UTC+0, no DST). A duty week runs Saturday 08:00 → the
// following Saturday 08:00. Returns the [startsAt, endsAt) window (ms epoch)
// that covers `now`. Shared by the seed and the onDutyNow query so both agree
// on exactly where the handover falls.
export function currentDutyWindow(now: number): {
  startsAt: number;
  endsAt: number;
} {
  const d = new Date(now);
  const start = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 8, 0, 0, 0),
  );
  // Step back from today 08:00 UTC to the most recent Saturday (getUTCDay: 6 = Sat).
  const daysSinceSaturday = (d.getUTCDay() - 6 + 7) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceSaturday);
  // If it's Saturday before 08:00, the active window started the previous Saturday.
  if (now < start.getTime()) {
    start.setUTCDate(start.getUTCDate() - 7);
  }
  const startsAt = start.getTime();
  return { startsAt, endsAt: startsAt + 7 * 24 * 60 * 60 * 1000 };
}
