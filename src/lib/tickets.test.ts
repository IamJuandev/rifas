import { describe, expect, it } from "vitest";
import {
  estaPagado,
  fechaLocal,
  formatFecha,
  normalizeNumero,
  saldo,
  totales,
} from "./tickets";

describe("normalizeNumero", () => {
  it("pads short numbers to 4 digits", () => {
    expect(normalizeNumero("7")).toBe("0007");
    expect(normalizeNumero(42)).toBe("0042");
    expect(normalizeNumero("0000")).toBe("0000");
    expect(normalizeNumero("9999")).toBe("9999");
  });

  it("rejects non numeric or out of range input", () => {
    expect(normalizeNumero("")).toBeNull();
    expect(normalizeNumero("12345")).toBeNull();
    expect(normalizeNumero("12a")).toBeNull();
    expect(normalizeNumero("-1")).toBeNull();
    expect(normalizeNumero("1.5")).toBeNull();
  });
});

describe("saldo", () => {
  it("returns the outstanding amount", () => {
    expect(saldo(50000, 20000)).toBe(30000);
  });

  it("never goes negative on overpayment", () => {
    expect(saldo(50000, 70000)).toBe(0);
  });
});

describe("estaPagado", () => {
  it("is true once the deposits cover the price", () => {
    expect(estaPagado(50000, 50000)).toBe(true);
    expect(estaPagado(50000, 60000)).toBe(true);
  });

  it("is false while there is a balance", () => {
    expect(estaPagado(50000, 49999)).toBe(false);
  });

  it("is false when the raffle has no price", () => {
    expect(estaPagado(0, 0)).toBe(false);
  });
});

describe("fechaLocal", () => {
  it("keeps the local calendar day for a late evening payment", () => {
    // 2026-08-07 20:45 local time, whatever the machine timezone is.
    const nocheDelSiete = new Date(2026, 7, 7, 20, 45, 0);
    expect(fechaLocal(nocheDelSiete)).toBe("2026-08-07");
  });

  it("keeps the local calendar day just after midnight", () => {
    const madrugada = new Date(2026, 7, 8, 0, 15, 0);
    expect(fechaLocal(madrugada)).toBe("2026-08-08");
  });
});

describe("formatFecha", () => {
  it("renders ISO dates as dd/mm/yyyy", () => {
    expect(formatFecha("2026-08-07")).toBe("07/08/2026");
    expect(formatFecha("2026-08-07 20:30:00")).toBe("07/08/2026");
  });

  it("returns the input untouched when it is not a date", () => {
    expect(formatFecha("sin fecha")).toBe("sin fecha");
  });
});

describe("totales", () => {
  it("aggregates sold tickets, fully paid ones and amounts", () => {
    const result = totales([
      { valorAPagar: 50000, abonado: 50000 },
      { valorAPagar: 50000, abonado: 20000 },
      { valorAPagar: 50000, abonado: 0 },
    ]);

    expect(result).toEqual({
      vendidos: 3,
      pagos: 1,
      esperado: 150000,
      recaudado: 70000,
      pendiente: 80000,
    });
  });

  it("handles an empty raffle", () => {
    expect(totales([])).toEqual({
      vendidos: 0,
      pagos: 0,
      esperado: 0,
      recaudado: 0,
      pendiente: 0,
    });
  });
});
