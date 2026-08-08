import { describe, expect, it } from "vitest";
import { linkWhatsApp, mensajeEstado } from "./mensajes";

const base = {
  numero: "4444",
  valorAPagar: 30000,
  abonado: 0,
};

describe("mensajeEstado", () => {
  it("confirms a reserved ticket with its value and balance", () => {
    expect(mensajeEstado(base)).toBe(
      [
        "✅ ¡Ticket confirmado!",
        "",
        "Gracias por participar en nuestra rifa. Tu ticket ha quedado registrado correctamente. 🎟️",
        "",
        "🎟️ Número de ticket: 4444",
        "💰 Valor del ticket: $ 30.000",
        "⏳ Saldo pendiente: $ 30.000",
        "",
        "🍀 ¡Mucha suerte en el sorteo!",
        "¡Esperamos que seas el próximo ganador! 🏆🎉",
      ].join("\n"),
    );
  });

  it("confirms the deposit just recorded", () => {
    expect(
      mensajeEstado({ ...base, abonado: 12000, ultimoAbono: 5000 }),
    ).toBe(
      [
        "✅ ¡Abono registrado!",
        "",
        "Gracias por tu pago. Lo hemos registrado correctamente. 🎟️",
        "",
        "🎟️ Número de ticket: 4444",
        "💵 Abono recibido: $ 5.000",
        "💰 Total abonado: $ 12.000 de $ 30.000",
        "⏳ Saldo pendiente: $ 18.000",
        "",
        "🍀 ¡Mucha suerte en el sorteo!",
        "¡Esperamos que seas el próximo ganador! 🏆🎉",
      ].join("\n"),
    );
  });

  it("closes the account when the ticket is fully paid", () => {
    const texto = mensajeEstado({
      ...base,
      abonado: 30000,
      ultimoAbono: 18000,
    });

    expect(texto).toContain("🎉 ¡Ticket pagado por completo!");
    expect(texto).toContain("💰 Valor del ticket: $ 30.000");
    expect(texto).toContain("✅ Saldo pendiente: $ 0");
    expect(texto).not.toContain("⏳");
  });

  it("treats an overpayment as fully paid, never as a negative balance", () => {
    const texto = mensajeEstado({ ...base, abonado: 35000 });

    expect(texto).toContain("🎉 ¡Ticket pagado por completo!");
    expect(texto).not.toContain("-$");
  });

  it("reports the running total when there is no deposit to announce", () => {
    const texto = mensajeEstado({ ...base, abonado: 12000 });

    expect(texto).toContain("✅ ¡Ticket confirmado!");
    expect(texto).toContain("💰 Total abonado: $ 12.000 de $ 30.000");
    expect(texto).toContain("⏳ Saldo pendiente: $ 18.000");
    expect(texto).not.toContain("Abono recibido");
  });

  it("lists the scheduled draw dates when there are any", () => {
    const texto = mensajeEstado({
      ...base,
      fechasSorteo: ["2026-09-01", null, "2026-11-15"],
    });

    expect(texto).toContain("📅 Sorteos: 01/09/2026 · 15/11/2026");
  });

  it("omits the draw line when no date is set", () => {
    const texto = mensajeEstado({ ...base, fechasSorteo: [null, null, null] });

    expect(texto).not.toContain("📅");
  });
});

describe("linkWhatsApp", () => {
  it("adds the country code to a 10 digit mobile", () => {
    expect(linkWhatsApp("3001234567", "hola")).toBe(
      "https://wa.me/573001234567?text=hola",
    );
  });

  it("ignores separators", () => {
    expect(linkWhatsApp("300 123 4567", "hola")).toBe(
      "https://wa.me/573001234567?text=hola",
    );
  });

  it("accepts a number that already carries the country code", () => {
    expect(linkWhatsApp("573001234567", "hola")).toBe(
      "https://wa.me/573001234567?text=hola",
    );
  });

  it("refuses shapes it cannot trust instead of guessing", () => {
    expect(linkWhatsApp("31111111", "hola")).toBeNull();
    expect(linkWhatsApp("", "hola")).toBeNull();
    expect(linkWhatsApp("6012345678", "hola")).toBeNull();
  });

  it("escapes the message so line breaks survive", () => {
    expect(linkWhatsApp("3001234567", "hola\nchau")).toContain("hola%0Achau");
  });
});
