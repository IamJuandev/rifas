export type SorteoFecha = { orden: number; fecha: string | null };

/**
 * A raffle is live while any of its draws is scheduled for today or later:
 * those numbers are still playing, so the raffle must not be deleted.
 */
export function sorteosVigentes(
  sorteos: SorteoFecha[],
  hoy: string,
): SorteoFecha[] {
  return sorteos.filter((s) => s.fecha !== null && s.fecha >= hoy);
}

export function estaVigente(sorteos: SorteoFecha[], hoy: string): boolean {
  return sorteosVigentes(sorteos, hoy).length > 0;
}

export type MotivoBloqueo = { puede: false; motivo: string } | { puede: true };

export function puedeEliminarse(
  sorteos: SorteoFecha[],
  hoy: string,
): MotivoBloqueo {
  const vigentes = sorteosVigentes(sorteos, hoy);

  if (vigentes.length === 0) return { puede: true };

  const ordenes = vigentes.map((s) => s.orden).join(", ");
  const plural = vigentes.length > 1;

  return {
    puede: false,
    motivo: plural
      ? `No se puede eliminar: los sorteos ${ordenes} todavía no se juegan.`
      : `No se puede eliminar: el sorteo ${ordenes} todavía no se juega.`,
  };
}
