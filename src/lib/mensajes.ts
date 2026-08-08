import { estaPagado, formatFecha, formatMoney, saldo } from "./tickets";

export type DatosMensaje = {
  numero: string;
  valorAPagar: number;
  abonado: number;
  /** Amount of the deposit just recorded, when the message follows one. */
  ultimoAbono?: number;
  /** Draw dates already scheduled, in order. */
  fechasSorteo?: Array<string | null>;
};

const CIERRE = ["🍀 ¡Mucha suerte en el sorteo!", "¡Esperamos que seas el próximo ganador! 🏆🎉"];

function lineaSorteos(fechas: Array<string | null> | undefined): string | null {
  const cargadas = (fechas ?? []).filter((f): f is string => Boolean(f));
  if (cargadas.length === 0) return null;

  return `📅 Sorteos: ${cargadas.map(formatFecha).join(" · ")}`;
}

/**
 * Ready-to-send message for the buyer, in three shapes: ticket just reserved,
 * deposit recorded, and fully paid. Wording comes from the business.
 */
export function mensajeEstado(datos: DatosMensaje): string {
  const { numero, valorAPagar, abonado, ultimoAbono } = datos;
  const pendiente = saldo(valorAPagar, abonado);
  const pagado = estaPagado(valorAPagar, abonado);

  const encabezado: string[] = [];
  const detalle: string[] = [`🎟️ Número de ticket: ${numero}`];

  if (pagado) {
    encabezado.push(
      "🎉 ¡Ticket pagado por completo!",
      "",
      "Tu ticket quedó totalmente pago. ¡Gracias por tu confianza! 🎟️",
    );
    detalle.push(
      `💰 Valor del ticket: ${formatMoney(valorAPagar)}`,
      `✅ Saldo pendiente: ${formatMoney(0)}`,
    );
  } else if (ultimoAbono && ultimoAbono > 0) {
    encabezado.push(
      "✅ ¡Abono registrado!",
      "",
      "Gracias por tu pago. Lo hemos registrado correctamente. 🎟️",
    );
    detalle.push(
      `💵 Abono recibido: ${formatMoney(ultimoAbono)}`,
      `💰 Total abonado: ${formatMoney(abonado)} de ${formatMoney(valorAPagar)}`,
      `⏳ Saldo pendiente: ${formatMoney(pendiente)}`,
    );
  } else {
    encabezado.push(
      "✅ ¡Ticket confirmado!",
      "",
      "Gracias por participar en nuestra rifa. Tu ticket ha quedado registrado correctamente. 🎟️",
    );

    if (abonado > 0) {
      detalle.push(
        `💰 Total abonado: ${formatMoney(abonado)} de ${formatMoney(valorAPagar)}`,
        `⏳ Saldo pendiente: ${formatMoney(pendiente)}`,
      );
    } else {
      detalle.push(
        `💰 Valor del ticket: ${formatMoney(valorAPagar)}`,
        `⏳ Saldo pendiente: ${formatMoney(pendiente)}`,
      );
    }
  }

  const sorteos = lineaSorteos(datos.fechasSorteo);
  if (sorteos) detalle.push(sorteos);

  return [...encabezado, "", ...detalle, "", ...CIERRE].join("\n");
}

/**
 * wa.me link for a Colombian mobile. Returns null when the number is not a
 * shape we can trust — a wrong country code sends the message to a stranger.
 */
export function linkWhatsApp(telefono: string, mensaje: string): string | null {
  const digitos = telefono.replace(/\D/g, "");

  let internacional: string | null = null;
  if (/^3\d{9}$/.test(digitos)) internacional = `57${digitos}`;
  else if (/^573\d{9}$/.test(digitos)) internacional = digitos;

  if (!internacional) return null;

  return `https://wa.me/${internacional}?text=${encodeURIComponent(mensaje)}`;
}
