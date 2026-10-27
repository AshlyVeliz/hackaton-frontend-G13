import { useEffect, useRef, type ReactNode } from "react";

// Ventana encima de la página. Se cierra con la X, con Escape o haciendo clic afuera.
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    dialogRef.current?.focus(); // el foco del teclado entra al modal al abrirlo
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(); // clic en el fondo oscuro
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="card relative mt-10 w-full max-w-2xl p-6 outline-none"
      >
        <button
          className="btn-ghost absolute right-4 top-4"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
