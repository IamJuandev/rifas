export const NUMERO_LENGTH = 4;
export const NUMERO_MIN = 0;
export const NUMERO_MAX = 9999;

/**
 * Normalizes a raffle number to its canonical 4-digit form.
 * Returns null when the input is not a valid number in range.
 */
export function normalizeNumero(input: string | number): string | null {
  const raw = String(input).trim();
  if (!/^\d{1,4}$/.test(raw)) return null;

  const value = Number(raw);
  if (value < NUMERO_MIN || value > NUMERO_MAX) return null;

  return raw.padStart(NUMERO_LENGTH, "0");
}

export function saldo(valorAPagar: number, abonado: number): number {
  return Math.max(0, valorAPagar - abonado);
}

export function estaPagado(valorAPagar: number, abonado: number): boolean {
  return valorAPagar > 0 && abonado >= valorAPagar;
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Local calendar date as `yyyy-mm-dd`. Plain `toISOString()` would return the
 * UTC day, which is already tomorrow for evening payments in America/Bogota.
 */
export function fechaLocal(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function formatFecha(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

export type Totales = {
  vendidos: number;
  pagos: number;
  esperado: number;
  recaudado: number;
  pendiente: number;
};

export function totales(
  tickets: Array<{ valorAPagar: number; abonado: number }>,
): Totales {
  const esperado = tickets.reduce((acc, t) => acc + t.valorAPagar, 0);
  const recaudado = tickets.reduce((acc, t) => acc + t.abonado, 0);

  return {
    vendidos: tickets.length,
    pagos: tickets.filter((t) => estaPagado(t.valorAPagar, t.abonado)).length,
    esperado,
    recaudado,
    pendiente: Math.max(0, esperado - recaudado),
  };
}
