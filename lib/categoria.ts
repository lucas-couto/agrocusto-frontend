import type { CategoriaLancamento } from '@/types';

/**
 * Maps the database enum value to a user-facing Portuguese label.
 */
export const CATEGORIA_LABELS: Record<CategoriaLancamento, string> = {
  semente: 'Semente',
  diesel: 'Diesel',
  mao_de_obra: 'Mao de Obra',
  manutencao: 'Manutencao',
  fertilizante: 'Fertilizante',
  outros: 'Outros',
};

const LABEL_TO_CATEGORIA: Record<string, CategoriaLancamento> = {};
for (const [key, label] of Object.entries(CATEGORIA_LABELS)) {
  LABEL_TO_CATEGORIA[label.toLowerCase()] = key as CategoriaLancamento;
}
// Add common accent variants that the AI might return
LABEL_TO_CATEGORIA['mao de obra'] = 'mao_de_obra';
LABEL_TO_CATEGORIA['mão de obra'] = 'mao_de_obra';
LABEL_TO_CATEGORIA['manutençao'] = 'manutencao';
LABEL_TO_CATEGORIA['manutenção'] = 'manutencao';

/**
 * Converts a user-facing label (e.g. "Semente", "Mão de Obra") to the database
 * enum value. Case-insensitive. Returns 'outros' when no match is found.
 */
export function labelToCategoria(label: string): CategoriaLancamento {
  const normalized = label.trim().toLowerCase();

  // Direct enum value match (e.g. "semente", "mao_de_obra")
  const enumValues: CategoriaLancamento[] = [
    'semente',
    'diesel',
    'mao_de_obra',
    'manutencao',
    'fertilizante',
    'outros',
  ];
  if (enumValues.includes(normalized as CategoriaLancamento)) {
    return normalized as CategoriaLancamento;
  }

  return LABEL_TO_CATEGORIA[normalized] ?? 'outros';
}

/**
 * Converts a database enum value to a user-facing Portuguese label.
 */
export function categoriaToLabel(cat: CategoriaLancamento): string {
  return CATEGORIA_LABELS[cat] ?? cat;
}
