import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Run with: npx convex run seed:run
// Safe to re-run — skips insertion if data already exists.
export const run = mutation({
    args: {},
    handler: async (ctx) => {
        const existingPharmacies = await ctx.db.query("pharmacies").take(1);
        const existingMedications = await ctx.db.query("medications").take(1);

        const results = { pharmacies: 0, medications: 0 };

        // ── Pharmacies ───────────────────────────────────────────────────────
        if (existingPharmacies.length === 0) {
            const pharmacyData = [
                {
                    name: "CityMed Pharmacy",
                    address: "14 Rue de la Paix",
                    city: "Paris",
                    country: "France",
                    lat: 48.8698,
                    lng: 2.3311,
                    phone: "+33 1 42 60 00 01",
                    email: "contact@citymed.fr",
                    isActive: true,
                    operatingHours: [
                        { day: 1, openTime: "08:00", closeTime: "21:00" },
                        { day: 2, openTime: "08:00", closeTime: "21:00" },
                        { day: 3, openTime: "08:00", closeTime: "21:00" },
                        { day: 4, openTime: "08:00", closeTime: "21:00" },
                        { day: 5, openTime: "08:00", closeTime: "21:00" },
                        { day: 6, openTime: "09:00", closeTime: "19:00" },
                    ],
                },
                {
                    name: "Pharmacie du Marché",
                    address: "3 Place du Marché Saint-Honoré",
                    city: "Paris",
                    country: "France",
                    lat: 48.8651,
                    lng: 2.3304,
                    phone: "+33 1 42 61 00 02",
                    email: "info@pharmaciemarche.fr",
                    isActive: true,
                    operatingHours: [
                        { day: 1, openTime: "08:30", closeTime: "20:00" },
                        { day: 2, openTime: "08:30", closeTime: "20:00" },
                        { day: 3, openTime: "08:30", closeTime: "20:00" },
                        { day: 4, openTime: "08:30", closeTime: "20:00" },
                        { day: 5, openTime: "08:30", closeTime: "20:00" },
                        { day: 6, openTime: "09:00", closeTime: "18:00" },
                        { day: 0, openTime: "10:00", closeTime: "14:00" },
                    ],
                },
                {
                    name: "MedExpress 24",
                    address: "88 Boulevard de Clichy",
                    city: "Paris",
                    country: "France",
                    lat: 48.8835,
                    lng: 2.3303,
                    phone: "+33 1 46 06 00 03",
                    email: "urgences@medexpress24.fr",
                    isActive: true,
                    operatingHours: [
                        { day: 0, openTime: "00:00", closeTime: "23:59" },
                        { day: 1, openTime: "00:00", closeTime: "23:59" },
                        { day: 2, openTime: "00:00", closeTime: "23:59" },
                        { day: 3, openTime: "00:00", closeTime: "23:59" },
                        { day: 4, openTime: "00:00", closeTime: "23:59" },
                        { day: 5, openTime: "00:00", closeTime: "23:59" },
                        { day: 6, openTime: "00:00", closeTime: "23:59" },
                    ],
                },
                {
                    name: "Abidjan Central Pharmacy",
                    address: "Avenue Chardy, Plateau",
                    city: "Abidjan",
                    country: "Côte d'Ivoire",
                    lat: 5.3186,
                    lng: -4.0227,
                    phone: "+225 27 20 21 00 04",
                    email: "contact@abidjancentral.ci",
                    isActive: true,
                    operatingHours: [
                        { day: 1, openTime: "07:30", closeTime: "19:30" },
                        { day: 2, openTime: "07:30", closeTime: "19:30" },
                        { day: 3, openTime: "07:30", closeTime: "19:30" },
                        { day: 4, openTime: "07:30", closeTime: "19:30" },
                        { day: 5, openTime: "07:30", closeTime: "19:30" },
                        { day: 6, openTime: "08:00", closeTime: "17:00" },
                    ],
                },
                {
                    name: "Plateau PharmaCare",
                    address: "Rue du Commerce, Zone 4",
                    city: "Abidjan",
                    country: "Côte d'Ivoire",
                    lat: 5.3311,
                    lng: -4.0162,
                    phone: "+225 27 22 44 00 05",
                    isActive: true,
                    operatingHours: [
                        { day: 1, openTime: "08:00", closeTime: "20:00" },
                        { day: 2, openTime: "08:00", closeTime: "20:00" },
                        { day: 3, openTime: "08:00", closeTime: "20:00" },
                        { day: 4, openTime: "08:00", closeTime: "20:00" },
                        { day: 5, openTime: "08:00", closeTime: "20:00" },
                        { day: 6, openTime: "09:00", closeTime: "16:00" },
                    ],
                },
            ];

            for (const p of pharmacyData) {
                await ctx.db.insert("pharmacies", p);
                results.pharmacies++;
            }
        }

        // ── Medications ──────────────────────────────────────────────────────
        if (existingMedications.length === 0) {
            const medicationData = [
                // Antibiotics
                {
                    name: "Amoxicillin",
                    genericName: "Amoxicillin",
                    brand: "Amoxil",
                    category: "antibiotic",
                    description: "Penicillin-type antibiotic used to treat bacterial infections.",
                    requiresPrescription: true,
                    dosageForms: ["capsule", "tablet", "oral suspension"],
                },
                {
                    name: "Azithromycin",
                    genericName: "Azithromycin",
                    brand: "Zithromax",
                    category: "antibiotic",
                    description: "Macrolide antibiotic for respiratory, skin, and ear infections.",
                    requiresPrescription: true,
                    dosageForms: ["tablet", "oral suspension"],
                },
                {
                    name: "Ciprofloxacin",
                    genericName: "Ciprofloxacin",
                    brand: "Cipro",
                    category: "antibiotic",
                    description: "Fluoroquinolone antibiotic for urinary and GI infections.",
                    requiresPrescription: true,
                    dosageForms: ["tablet", "oral suspension", "injection"],
                },
                // Analgesics
                {
                    name: "Paracetamol",
                    genericName: "Acetaminophen",
                    brand: "Doliprane",
                    category: "analgesic",
                    description: "Pain reliever and fever reducer for mild to moderate pain.",
                    requiresPrescription: false,
                    dosageForms: ["tablet", "syrup", "suppository", "effervescent"],
                },
                {
                    name: "Ibuprofen",
                    genericName: "Ibuprofen",
                    brand: "Advil",
                    category: "analgesic",
                    description: "NSAID for pain, fever, and inflammation.",
                    requiresPrescription: false,
                    dosageForms: ["tablet", "capsule", "syrup", "gel"],
                },
                {
                    name: "Tramadol",
                    genericName: "Tramadol hydrochloride",
                    brand: "Ultram",
                    category: "analgesic",
                    description: "Opioid analgesic for moderate to severe pain.",
                    requiresPrescription: true,
                    dosageForms: ["capsule", "tablet", "injection"],
                },
                {
                    name: "Aspirin",
                    genericName: "Acetylsalicylic acid",
                    brand: "Aspégic",
                    category: "analgesic",
                    description: "NSAID used for pain, fever, and cardiovascular prevention.",
                    requiresPrescription: false,
                    dosageForms: ["tablet", "effervescent", "enteric-coated tablet"],
                },
                // Antihistamines
                {
                    name: "Cetirizine",
                    genericName: "Cetirizine hydrochloride",
                    brand: "Zyrtec",
                    category: "antihistamine",
                    description: "Second-generation antihistamine for allergies and hay fever.",
                    requiresPrescription: false,
                    dosageForms: ["tablet", "syrup"],
                },
                {
                    name: "Loratadine",
                    genericName: "Loratadine",
                    brand: "Claritin",
                    category: "antihistamine",
                    description: "Non-drowsy antihistamine for allergic rhinitis and urticaria.",
                    requiresPrescription: false,
                    dosageForms: ["tablet", "syrup"],
                },
                // Antihypertensives
                {
                    name: "Amlodipine",
                    genericName: "Amlodipine besylate",
                    brand: "Norvasc",
                    category: "antihypertensive",
                    description: "Calcium channel blocker for hypertension and angina.",
                    requiresPrescription: true,
                    dosageForms: ["tablet"],
                },
                {
                    name: "Lisinopril",
                    genericName: "Lisinopril",
                    brand: "Zestril",
                    category: "antihypertensive",
                    description: "ACE inhibitor for hypertension and heart failure.",
                    requiresPrescription: true,
                    dosageForms: ["tablet"],
                },
                {
                    name: "Losartan",
                    genericName: "Losartan potassium",
                    brand: "Cozaar",
                    category: "antihypertensive",
                    description: "Angiotensin II receptor blocker for hypertension.",
                    requiresPrescription: true,
                    dosageForms: ["tablet"],
                },
                // Antidiabetics
                {
                    name: "Metformin",
                    genericName: "Metformin hydrochloride",
                    brand: "Glucophage",
                    category: "antidiabetic",
                    description: "First-line medication for type 2 diabetes.",
                    requiresPrescription: true,
                    dosageForms: ["tablet", "extended-release tablet"],
                },
                {
                    name: "Glibenclamide",
                    genericName: "Glyburide",
                    brand: "Daonil",
                    category: "antidiabetic",
                    description: "Sulfonylurea for type 2 diabetes.",
                    requiresPrescription: true,
                    dosageForms: ["tablet"],
                },
                // Antimalarials
                {
                    name: "Artemether-Lumefantrine",
                    genericName: "Artemether + Lumefantrine",
                    brand: "Coartem",
                    category: "antimalarial",
                    description: "First-line treatment for uncomplicated malaria.",
                    requiresPrescription: true,
                    dosageForms: ["tablet"],
                },
                {
                    name: "Chloroquine",
                    genericName: "Chloroquine phosphate",
                    brand: "Nivaquine",
                    category: "antimalarial",
                    description: "Antimalarial for prevention and treatment.",
                    requiresPrescription: true,
                    dosageForms: ["tablet", "syrup"],
                },
                // Vitamins & Supplements
                {
                    name: "Vitamin C",
                    genericName: "Ascorbic acid",
                    brand: "Cévit",
                    category: "vitamin",
                    description: "Antioxidant vitamin for immune support.",
                    requiresPrescription: false,
                    dosageForms: ["tablet", "effervescent", "sachet"],
                },
                {
                    name: "Vitamin D3",
                    genericName: "Cholecalciferol",
                    brand: "Uvedose",
                    category: "vitamin",
                    description: "Vitamin D supplement for bone health and immunity.",
                    requiresPrescription: false,
                    dosageForms: ["capsule", "oral solution", "ampoule"],
                },
                {
                    name: "Iron + Folic Acid",
                    genericName: "Ferrous sulfate + Folic acid",
                    brand: "Felofort",
                    category: "vitamin",
                    description: "Iron and folate supplement for anaemia prevention.",
                    requiresPrescription: false,
                    dosageForms: ["tablet"],
                },
                // GI
                {
                    name: "Omeprazole",
                    genericName: "Omeprazole",
                    brand: "Mopral",
                    category: "gastrointestinal",
                    description: "Proton pump inhibitor for acid reflux and ulcers.",
                    requiresPrescription: false,
                    dosageForms: ["capsule", "tablet"],
                },
                {
                    name: "Metronidazole",
                    genericName: "Metronidazole",
                    brand: "Flagyl",
                    category: "antibiotic",
                    description: "Antibiotic and antiprotozoal for GI and anaerobic infections.",
                    requiresPrescription: true,
                    dosageForms: ["tablet", "oral suspension", "injection", "gel"],
                },
                {
                    name: "Oral Rehydration Salts",
                    genericName: "ORS",
                    brand: "SRO",
                    category: "gastrointestinal",
                    description: "Electrolyte solution for dehydration from diarrhoea.",
                    requiresPrescription: false,
                    dosageForms: ["sachet"],
                },
                // Respiratory
                {
                    name: "Salbutamol",
                    genericName: "Albuterol",
                    brand: "Ventolin",
                    category: "respiratory",
                    description: "Bronchodilator for asthma and COPD.",
                    requiresPrescription: true,
                    dosageForms: ["inhaler", "nebuliser solution", "tablet"],
                },
                {
                    name: "Ambroxol",
                    genericName: "Ambroxol hydrochloride",
                    brand: "Mucosolvan",
                    category: "respiratory",
                    description: "Expectorant for productive cough.",
                    requiresPrescription: false,
                    dosageForms: ["tablet", "syrup", "drops"],
                },
            ];

            for (const m of medicationData) {
                await ctx.db.insert("medications", m);
                results.medications++;
            }
        }

        return {
            message: "Seed complete",
            inserted: results,
            skipped: {
                pharmacies: existingPharmacies.length > 0,
                medications: existingMedications.length > 0,
            },
        };
    },
});
