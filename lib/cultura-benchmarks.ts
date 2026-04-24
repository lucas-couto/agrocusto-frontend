// Benchmarks by culture used to estimate expected revenue and break-even.
// Figures are national averages for soy/corn/wheat — replace with user-editable
// inputs or quote-driven prices once those flows exist.

export type CulturaBenchmark = {
  readonly produtividadeScHa: number;
  readonly precoSc: number;
};

const BENCHMARKS: Readonly<Record<string, CulturaBenchmark>> = {
  Soja: { produtividadeScHa: 60, precoSc: 135 },
  Milho: { produtividadeScHa: 90, precoSc: 62 },
  Trigo: { produtividadeScHa: 40, precoSc: 80 },
};

const UNKNOWN: CulturaBenchmark = { produtividadeScHa: 0, precoSc: 0 };

export function getBenchmark(cultura: string): CulturaBenchmark {
  return BENCHMARKS[cultura] ?? UNKNOWN;
}
