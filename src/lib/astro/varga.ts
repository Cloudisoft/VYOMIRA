import { norm360 } from "./math";

/**
 * Parashari divisional charts (BPHS ch. 6). Each function returns the varga sign index (0 = Aries)
 * for a sidereal longitude. Regression-tested against an independent implementation (PyJHora).
 */
const parts = (lon: number, n: number) => {
  const l = norm360(lon);
  return { sign: Math.floor(l / 30), part: Math.floor(((l % 30) * n) / 30), deg: l % 30 };
};
const isOdd = (sign: number) => sign % 2 === 0; // Aries (0) is an odd sign
const modality = (sign: number) => sign % 3; // 0 movable, 1 fixed, 2 dual

export const VARGA_RULES: Record<string, { name: string; purpose: string; fn: (lon: number) => number }> = {
  D1: { name: "Rashi", purpose: "the body and overall life", fn: (l) => Math.floor(norm360(l) / 30) },
  D2: {
    name: "Hora", purpose: "wealth and resources",
    fn: (l) => { const { sign, part } = parts(l, 2); return isOdd(sign) ? (part === 0 ? 4 : 3) : part === 0 ? 3 : 4; },
  },
  D3: { name: "Drekkana", purpose: "siblings and courage", fn: (l) => { const { sign, part } = parts(l, 3); return (sign + part * 4) % 12; } },
  D4: { name: "Chaturthamsa", purpose: "home, property and fortune", fn: (l) => { const { sign, part } = parts(l, 4); return (sign + part * 3) % 12; } },
  D7: { name: "Saptamsa", purpose: "children and creativity", fn: (l) => { const { sign, part } = parts(l, 7); return (sign + (isOdd(sign) ? 0 : 6) + part) % 12; } },
  D9: { name: "Navamsa", purpose: "partnership and the inner strength of planets", fn: (l) => Math.floor(norm360(l) / (30 / 9)) % 12 },
  D10: { name: "Dashamsa", purpose: "career and public action", fn: (l) => { const { sign, part } = parts(l, 10); return (sign + (isOdd(sign) ? 0 : 8) + part) % 12; } },
  D12: { name: "Dwadashamsa", purpose: "parents and lineage", fn: (l) => { const { sign, part } = parts(l, 12); return (sign + part) % 12; } },
  D16: { name: "Shodashamsa", purpose: "vehicles, comforts and happiness", fn: (l) => { const { sign, part } = parts(l, 16); return ([0, 4, 8][modality(sign)] + part) % 12; } },
  D20: { name: "Vimshamsa", purpose: "spiritual practice", fn: (l) => { const { sign, part } = parts(l, 20); return ([0, 8, 4][modality(sign)] + part) % 12; } },
  D24: { name: "Chaturvimshamsa", purpose: "learning and education", fn: (l) => { const { sign, part } = parts(l, 24); return ((isOdd(sign) ? 4 : 3) + part) % 12; } },
  D27: { name: "Bhamsa", purpose: "strengths and weaknesses", fn: (l) => Math.floor(norm360(l) / (30 / 27)) % 12 },
  D30: {
    name: "Trimshamsa", purpose: "challenges and misfortunes",
    fn: (l) => {
      const { sign, deg } = parts(l, 1);
      // Unequal Parashari divisions: odd signs Mars 5°, Saturn 5°, Jupiter 8°, Mercury 7°, Venus 5°; reversed in even signs.
      if (isOdd(sign)) return deg < 5 ? 0 : deg < 10 ? 10 : deg < 18 ? 8 : deg < 25 ? 2 : 6;
      return deg < 5 ? 1 : deg < 12 ? 5 : deg < 20 ? 11 : deg < 25 ? 9 : 7;
    },
  },
  D40: { name: "Khavedamsa", purpose: "maternal legacy", fn: (l) => { const { sign, part } = parts(l, 40); return ((isOdd(sign) ? 0 : 6) + part) % 12; } },
  D45: { name: "Akshavedamsa", purpose: "paternal legacy and character", fn: (l) => { const { sign, part } = parts(l, 45); return ([0, 4, 8][modality(sign)] + part) % 12; } },
  D60: { name: "Shashtiamsa", purpose: "past karma (needs a very exact birth time)", fn: (l) => { const { sign, part } = parts(l, 60); return (sign + part) % 12; } },
};

export type VargaKey = keyof typeof VARGA_RULES;
export const VARGA_KEYS = Object.keys(VARGA_RULES) as VargaKey[];
/** Approx. minutes of birth-time error that can change the varga Lagna (ascendant moves ~1° per 4 min). */
export const vargaSensitivityMinutes = (k: string) => Math.max(0.5, (30 / Number(k.slice(1))) * 4);

export const navamsaSign = VARGA_RULES.D9.fn;
export const dashamsaSign = VARGA_RULES.D10.fn;
export const VARGAS = { D1: VARGA_RULES.D1, D9: VARGA_RULES.D9, D10: VARGA_RULES.D10 } as const;
export type VargaId = keyof typeof VARGAS;
