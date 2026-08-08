import { describe, expect, it } from "vitest";
import { estaVigente, puedeEliminarse } from "./rifas";

const HOY = "2026-08-07";

describe("estaVigente", () => {
  it("is live when a draw is scheduled for the future", () => {
    expect(
      estaVigente(
        [
          { orden: 1, fecha: "2026-08-01" },
          { orden: 2, fecha: "2026-09-01" },
        ],
        HOY,
      ),
    ).toBe(true);
  });

  it("is live when a draw happens today", () => {
    expect(estaVigente([{ orden: 1, fecha: HOY }], HOY)).toBe(true);
  });

  it("is over when every draw is in the past", () => {
    expect(
      estaVigente(
        [
          { orden: 1, fecha: "2026-08-01" },
          { orden: 2, fecha: "2026-08-06" },
        ],
        HOY,
      ),
    ).toBe(false);
  });

  it("is not live when no date was set yet", () => {
    expect(
      estaVigente(
        [
          { orden: 1, fecha: null },
          { orden: 2, fecha: null },
        ],
        HOY,
      ),
    ).toBe(false);
  });
});

describe("puedeEliminarse", () => {
  it("allows deleting a finished raffle", () => {
    expect(puedeEliminarse([{ orden: 1, fecha: "2026-01-01" }], HOY)).toEqual({
      puede: true,
    });
  });

  it("names the single pending draw", () => {
    const result = puedeEliminarse([{ orden: 2, fecha: "2026-12-01" }], HOY);

    expect(result.puede).toBe(false);
    expect(result).toHaveProperty(
      "motivo",
      "No se puede eliminar: el sorteo 2 todavía no se juega.",
    );
  });

  it("names every pending draw", () => {
    const result = puedeEliminarse(
      [
        { orden: 1, fecha: "2026-01-01" },
        { orden: 2, fecha: "2026-12-01" },
        { orden: 3, fecha: "2027-01-01" },
      ],
      HOY,
    );

    expect(result).toEqual({
      puede: false,
      motivo: "No se puede eliminar: los sorteos 2, 3 todavía no se juegan.",
    });
  });
});
