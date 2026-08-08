"use client";

import { useEffect, useState } from "react";

export function CopiarMensaje({
  mensaje,
  whatsapp,
  compacto = false,
}: {
  mensaje: string;
  whatsapp: string | null;
  compacto?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  const [verMensaje, setVerMensaje] = useState(false);

  useEffect(() => {
    if (!copiado) return;

    const id = setTimeout(() => setCopiado(false), 2500);
    return () => clearTimeout(id);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
    } catch {
      // Clipboard is blocked without HTTPS or permission: show the text so it
      // can still be selected by hand instead of failing silently.
      setVerMensaje(true);
    }
  }

  return (
    <div className={compacto ? "" : "mt-4"}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copiar}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          {copiado ? "Copiado ✓" : "Copiar mensaje"}
        </button>

        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-teal-600 px-3 py-1.5 text-sm text-teal-700"
          >
            WhatsApp
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => setVerMensaje((v) => !v)}
          className="text-sm text-slate-500 underline"
        >
          {verMensaje ? "Ocultar" : "Ver"}
        </button>
      </div>

      {verMensaje ? (
        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs whitespace-pre-wrap text-slate-700">
          {mensaje}
        </pre>
      ) : null}
    </div>
  );
}
