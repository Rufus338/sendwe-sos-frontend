/** Composants UI partagés (section 11 — badges, modales, toasts). */
import clsx from "clsx";
import React, { useEffect } from "react";

/** Badge de statut : toujours texte + couleur (accessibilité daltonisme, section 11). */
export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", color)}>
      {label}
    </span>
  );
}

export const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  BUSY: "bg-blue-100 text-blue-800",
  OUT_OF_SERVICE: "bg-red-100 text-red-800",
  OFFLINE: "bg-gray-100 text-gray-700",
  EN_ROUTE_TO_PATIENT: "bg-blue-100 text-blue-800",
  ARRIVED_AT_PATIENT: "bg-blue-100 text-blue-800",
  PATIENT_PICKED_UP: "bg-blue-100 text-blue-800",
  EN_ROUTE_TO_HOSPITAL: "bg-blue-100 text-blue-800",
  ARRIVED_AT_HOSPITAL: "bg-blue-100 text-blue-800",
  SEARCHING: "bg-amber-100 text-amber-800",
  ASSIGNED: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-amber-100 text-amber-800",
  REQUESTED: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
  FAILED: "bg-red-100 text-red-800",
};

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  BUSY: "En intervention",
  OUT_OF_SERVICE: "Hors service",
  OFFLINE: "Hors ligne",
  REQUESTED: "Demandée",
  SEARCHING: "Recherche…",
  ASSIGNED: "Assignée",
  ACCEPTED: "Acceptée",
  EN_ROUTE_TO_PATIENT: "En route patient",
  ARRIVED_AT_PATIENT: "Arrivé patient",
  PATIENT_PICKED_UP: "Patient pris en charge",
  EN_ROUTE_TO_HOSPITAL: "En route hôpital",
  ARRIVED_AT_HOSPITAL: "Arrivé hôpital",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  REJECTED: "Refusée",
  FAILED: "Échec",
};

/** Bouton principal (design system : transition 200ms, focus visible, cursor). */
export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-control px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2",
        variant === "primary" && "bg-accent text-on-accent hover:opacity-90 hover:-translate-y-px",
        variant === "secondary" && "bg-white text-primary border-2 border-primary hover:bg-muted",
        variant === "danger" && "bg-destructive text-on-primary hover:opacity-90 hover:-translate-y-px",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Champ de formulaire avec validation inline (design system : 16px, focus ring). */
export function Field({
  label,
  error,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        className={clsx(
          "mt-1 block w-full rounded-control border bg-white px-3.5 py-2.5 text-base shadow-sm transition-colors duration-200 focus:outline-none",
          error
            ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
            : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
      {hint && !error && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** Modale de confirmation (design system : backdrop blur, bordure arrondie 16px). */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  danger = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md rounded-modal bg-white p-8 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div className="mt-2 text-sm text-muted-foreground">{message}</div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Toast discret 3 secondes (section 11). */
export function useToast() {
  const [toast, setToast] = React.useState<{ message: string; type: "success" | "error" } | null>(null);
  const show = React.useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  const node = toast ? (
    <div
      className={clsx(
        "fixed bottom-4 right-4 z-50 rounded-control px-4 py-2.5 text-sm font-medium text-white shadow-lg",
        toast.type === "success" ? "bg-success" : "bg-destructive"
      )}
      role="status"
    >
      {toast.message}
    </div>
  ) : null;
  return { show, node };
}

/** Bannière persistante d'erreur réseau (section 22). */
export function NetworkBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="bg-pending px-4 py-2 text-center text-sm font-medium text-white">
      Connexion temps réel perdue, tentative de reconnexion…
    </div>
  );
}
