"use client";

export function DeleteButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(label)) event.preventDefault();
      }}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600"
    >
      Eliminar
    </button>
  );
}
