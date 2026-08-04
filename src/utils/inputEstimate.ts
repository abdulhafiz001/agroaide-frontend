/**
 * Client-side seed & fertilizer estimate (mirrors backend config/input_rates.php).
 * Used when the API route is unavailable so Calculate still works.
 */

const STEP_CM = 75;

type CropRate = {
  defaultRowCm: number;
  defaultIntraCm: number;
  seedsPerStand: number;
  seedsPerKg: number;
  seedUnit?: string;
  fertilizers: { name: string; kgPerHa: number }[];
};

const CROPS: Record<string, CropRate> = {
  Maize: {
    defaultRowCm: 75,
    defaultIntraCm: 25,
    seedsPerStand: 2,
    seedsPerKg: 2800,
    fertilizers: [
      { name: 'NPK 15-15-15', kgPerHa: 150 },
      { name: 'Urea', kgPerHa: 100 },
    ],
  },
  Cassava: {
    defaultRowCm: 100,
    defaultIntraCm: 100,
    seedsPerStand: 1,
    seedsPerKg: 1,
    seedUnit: 'cuttings',
    fertilizers: [{ name: 'NPK 15-15-15', kgPerHa: 200 }],
  },
  Yam: {
    defaultRowCm: 100,
    defaultIntraCm: 100,
    seedsPerStand: 1,
    seedsPerKg: 1,
    seedUnit: 'setts',
    fertilizers: [{ name: 'NPK 15-15-15', kgPerHa: 200 }],
  },
  Tomato: {
    defaultRowCm: 75,
    defaultIntraCm: 50,
    seedsPerStand: 1,
    seedsPerKg: 300000,
    fertilizers: [
      { name: 'NPK 15-15-15', kgPerHa: 250 },
      { name: 'Urea', kgPerHa: 50 },
    ],
  },
  Rice: {
    defaultRowCm: 20,
    defaultIntraCm: 20,
    seedsPerStand: 3,
    seedsPerKg: 40000,
    fertilizers: [
      { name: 'NPK 15-15-15', kgPerHa: 200 },
      { name: 'Urea', kgPerHa: 100 },
    ],
  },
  Sorghum: {
    defaultRowCm: 75,
    defaultIntraCm: 20,
    seedsPerStand: 3,
    seedsPerKg: 35000,
    fertilizers: [
      { name: 'NPK 15-15-15', kgPerHa: 100 },
      { name: 'Urea', kgPerHa: 50 },
    ],
  },
  Millet: {
    defaultRowCm: 75,
    defaultIntraCm: 20,
    seedsPerStand: 3,
    seedsPerKg: 150000,
    fertilizers: [
      { name: 'NPK 15-15-15', kgPerHa: 80 },
      { name: 'Urea', kgPerHa: 40 },
    ],
  },
  Cowpea: {
    defaultRowCm: 75,
    defaultIntraCm: 25,
    seedsPerStand: 2,
    seedsPerKg: 4000,
    fertilizers: [{ name: 'NPK 15-15-15', kgPerHa: 50 }],
  },
};

const DEFAULT: CropRate = {
  defaultRowCm: 75,
  defaultIntraCm: 25,
  seedsPerStand: 2,
  seedsPerKg: 5000,
  fertilizers: [{ name: 'NPK 15-15-15', kgPerHa: 100 }],
};

export type InputEstimateResult = {
  crop: string;
  areaM2: number;
  areaSource: string;
  spacingMode: string;
  rowCm: number;
  intraCm: number;
  rowSteps: number;
  intraSteps: number;
  population: number;
  seedUnit: string;
  seedKg: number | null;
  seedStands: number | null;
  fertilizers: { name: string; kg: number; bags50kg: number }[];
  aiSummary: string;
  disclaimer: string;
};

function normalizeCrop(crop: string): string {
  const known = Object.keys(CROPS).find((k) => k.toLowerCase() === crop.trim().toLowerCase());
  if (known) return known;
  return crop.trim() ? crop.trim().charAt(0).toUpperCase() + crop.trim().slice(1).toLowerCase() : 'Maize';
}

export function computeInputEstimate(opts: {
  crop: string;
  areaM2: number;
  hasMeasuredBoundary: boolean;
  rowCm: number;
  intraCm: number;
}): InputEstimateResult {
  const cropKey = normalizeCrop(opts.crop);
  const table = CROPS[cropKey] ?? DEFAULT;
  const row = Math.max(5, opts.rowCm || table.defaultRowCm);
  const intra = Math.max(5, opts.intraCm || table.defaultIntraCm);
  let areaM2 = opts.areaM2 > 0 ? opts.areaM2 : 1000;
  const areaSource = opts.areaM2 > 0 ? (opts.hasMeasuredBoundary ? 'measured' : 'estimate') : 'fallback';

  const population = Math.round(areaM2 / ((row / 100) * (intra / 100)));
  const seedsPerStand = table.seedsPerStand;
  const seedUnit = table.seedUnit ?? 'kg';
  const totalSeeds = population * seedsPerStand;
  const seedKg = seedUnit === 'kg' ? Math.round((totalSeeds / Math.max(1, table.seedsPerKg)) * 100) / 100 : null;
  const seedStands = seedUnit !== 'kg' ? population : null;
  const hectares = areaM2 / 10000;
  const fertilizers = table.fertilizers.map((f) => {
    const kg = Math.round(hectares * f.kgPerHa * 100) / 100;
    return { name: f.name, kg, bags50kg: Math.round((kg / 50) * 100) / 100 };
  });

  const disclaimer = 'Guide only — may not be 100% correct for your soil and variety.';
  const fertLines = fertilizers.map((f) => `${f.name}: ${f.kg} kg (~${f.bags50kg} bags of 50kg)`).join('; ');
  const seedLine =
    seedUnit === 'kg'
      ? `Seed: about ${seedKg} kg`
      : `Planting material: about ${seedStands ?? population} ${seedUnit}`;
  const aiSummary = `For your ${Math.round(areaM2 * 100) / 100} m² ${cropKey} field, plant about ${row} cm × ${intra} cm apart (~${population} stands). ${seedLine}. Fertilizer: ${fertLines}. ${disclaimer}`;

  return {
    crop: cropKey,
    areaM2: Math.round(areaM2 * 100) / 100,
    areaSource,
    spacingMode: 'cm',
    rowCm: row,
    intraCm: intra,
    rowSteps: Math.round((row / STEP_CM) * 100) / 100,
    intraSteps: Math.round((intra / STEP_CM) * 100) / 100,
    population,
    seedUnit,
    seedKg,
    seedStands,
    fertilizers,
    aiSummary,
    disclaimer,
  };
}
