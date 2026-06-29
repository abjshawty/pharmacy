import { mutation } from "./_generated/server";

// POC seed data for Abidjan. Coordinates are approximate, hand-placed within
// each commune — representative, not surveyed. They'll be replaced by real
// geocoded data (Nominatim, from the scrape) per PLAN.md Phase 1.
//
// `duty: true` marks the one pharmacy per commune that is on the
// pharmacie de garde rotation for the current week; `contactName` is the
// (sparse) duty pharmacist name. Both are stripped before insert into the
// `pharmacies` table and turned into `dutyShifts` rows.
type SeedPharmacy = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  hours?: string;
  commune: string;
  sourceId: string;
  duty?: boolean;
  contactName?: string;
};

const PHARMACIES: SeedPharmacy[] = [
  // Plateau
  {
    name: "Pharmacie du Plateau",
    address: "Av. Chardy, Plateau, Abidjan",
    lat: 5.3242,
    lng: -4.0187,
    phone: "27 20 21 55 30",
    hours: "Lun–Sam 08:00–19:00",
    commune: "Plateau",
    sourceId: "seed-plateau-1",
    duty: true,
    contactName: "Dr. Koffi",
  },
  {
    name: "Pharmacie de la Cathédrale",
    address: "Bd. Carde, Plateau, Abidjan",
    lat: 5.3201,
    lng: -4.0224,
    phone: "27 20 22 14 08",
    commune: "Plateau",
    sourceId: "seed-plateau-2",
  },
  // Cocody
  {
    name: "Pharmacie Saint Jean",
    address: "Bd. Latrille, Cocody, Abidjan",
    lat: 5.3556,
    lng: -3.9876,
    phone: "27 22 44 21 30",
    hours: "Lun–Sam 08:00–20:00",
    commune: "Cocody",
    sourceId: "seed-cocody-1",
    duty: true,
  },
  {
    name: "Pharmacie des II Plateaux",
    address: "Rue des Jardins, Cocody, Abidjan",
    lat: 5.3631,
    lng: -3.9989,
    phone: "27 22 41 60 17",
    commune: "Cocody",
    sourceId: "seed-cocody-2",
  },
  {
    name: "Pharmacie Angré 7e Tranche",
    address: "Carrefour Saint Jacques, Angré, Cocody",
    lat: 5.3925,
    lng: -3.9772,
    phone: "27 22 50 33 12",
    commune: "Cocody",
    sourceId: "seed-cocody-3",
  },
  // Yopougon
  {
    name: "Pharmacie Sideci",
    address: "Sideci, Yopougon, Abidjan",
    lat: 5.3458,
    lng: -4.0851,
    phone: "27 23 45 11 90",
    commune: "Yopougon",
    sourceId: "seed-yopougon-1",
    duty: true,
    contactName: "Dr. Aka",
  },
  {
    name: "Pharmacie Niangon",
    address: "Niangon Sud, Yopougon, Abidjan",
    lat: 5.3372,
    lng: -4.0938,
    phone: "27 23 46 70 22",
    commune: "Yopougon",
    sourceId: "seed-yopougon-2",
  },
  // Adjamé
  {
    name: "Pharmacie du Forum",
    address: "Forum des Marchés, Adjamé, Abidjan",
    lat: 5.3668,
    lng: -4.0271,
    phone: "27 20 37 25 41",
    commune: "Adjamé",
    sourceId: "seed-adjame-1",
    duty: true,
  },
  {
    name: "Pharmacie 220 Logements",
    address: "220 Logements, Adjamé, Abidjan",
    lat: 5.3719,
    lng: -4.0238,
    phone: "27 20 38 19 64",
    commune: "Adjamé",
    sourceId: "seed-adjame-2",
  },
  // Marcory
  {
    name: "Pharmacie Marcory Résidentiel",
    address: "Bd. du Cameroun, Marcory, Abidjan",
    lat: 5.3018,
    lng: -3.9881,
    phone: "27 21 26 44 75",
    hours: "Lun–Sam 08:00–19:30",
    commune: "Marcory",
    sourceId: "seed-marcory-1",
    duty: true,
  },
  {
    name: "Pharmacie Zone 4",
    address: "Rue Pierre et Marie Curie, Zone 4, Marcory",
    lat: 5.2967,
    lng: -3.9952,
    phone: "27 21 25 80 13",
    commune: "Marcory",
    sourceId: "seed-marcory-2",
  },
  // Treichville
  {
    name: "Pharmacie de l'Arsenal",
    address: "Av. 16, Treichville, Abidjan",
    lat: 5.2934,
    lng: -4.0051,
    phone: "27 21 24 33 09",
    commune: "Treichville",
    sourceId: "seed-treichville-1",
    duty: true,
  },
  // Koumassi
  {
    name: "Pharmacie Koumassi Grand Marché",
    address: "Grand Marché, Koumassi, Abidjan",
    lat: 5.2887,
    lng: -3.9554,
    phone: "27 21 36 12 47",
    commune: "Koumassi",
    sourceId: "seed-koumassi-1",
    duty: true,
    contactName: "Dr. Bamba",
  },
  // Abobo
  {
    name: "Pharmacie Abobo Gare",
    address: "Abobo Gare, Abidjan",
    lat: 5.4281,
    lng: -4.0203,
    phone: "27 24 39 55 28",
    commune: "Abobo",
    sourceId: "seed-abobo-1",
    duty: true,
  },
  // Port-Bouët
  {
    name: "Pharmacie de l'Aéroport",
    address: "Bd. VGE, Port-Bouët, Abidjan",
    lat: 5.2541,
    lng: -3.9268,
    phone: "27 21 27 70 91",
    commune: "Port-Bouët",
    sourceId: "seed-portbouet-1",
    duty: true,
  },
  // Attécoubé
  {
    name: "Pharmacie Locodjro",
    address: "Locodjro, Attécoubé, Abidjan",
    lat: 5.3371,
    lng: -4.0352,
    phone: "27 20 35 48 60",
    commune: "Attécoubé",
    sourceId: "seed-attecoube-1",
    duty: true,
  },
  // Bingerville
  {
    name: "Pharmacie de Bingerville",
    address: "Route d'Adzopé, Bingerville",
    lat: 5.3554,
    lng: -3.8816,
    phone: "27 22 40 03 55",
    commune: "Bingerville",
    sourceId: "seed-bingerville-1",
    duty: true,
  },
];

// Abidjan is GMT (UTC+0, no DST). A duty week runs Saturday 08:00 → the
// following Saturday 08:00. Compute the window covering `now` as plain UTC.
function currentDutyWindow(now: number): { startsAt: number; endsAt: number } {
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

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Idempotent: wipe both tables before re-seeding.
    for (const row of await ctx.db.query("dutyShifts").collect()) {
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db.query("pharmacies").collect()) {
      await ctx.db.delete(row._id);
    }

    const { startsAt, endsAt } = currentDutyWindow(Date.now());
    let dutyCount = 0;

    for (const { duty, contactName, ...pharmacy } of PHARMACIES) {
      const pharmacyId = await ctx.db.insert("pharmacies", pharmacy);
      if (duty) {
        await ctx.db.insert("dutyShifts", {
          pharmacyId,
          startsAt,
          endsAt,
          ...(contactName ? { contactName } : {}),
        });
        dutyCount++;
      }
    }

    return { pharmacies: PHARMACIES.length, dutyShifts: dutyCount };
  },
});
