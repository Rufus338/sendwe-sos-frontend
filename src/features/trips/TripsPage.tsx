/** H7 — Liste des interventions filtrable (section 9.D). */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import type { Page, Trip, TripStatus } from "../../lib/types";
import { ConfirmModal, StatusBadge, useToast } from "../../shared/ui";

const STATUSES: TripStatus[] = [
  "REQUESTED", "SEARCHING", "ASSIGNED", "ACCEPTED", "EN_ROUTE_TO_PATIENT",
  "ARRIVED_AT_PATIENT", "PATIENT_PICKED_UP", "EN_ROUTE_TO_HOSPITAL",
  "ARRIVED_AT_HOSPITAL", "COMPLETED", "CANCELLED", "REJECTED", "FAILED",
];

export function TripsPage() {
  const navigate = useNavigate();
  const { show, node } = useToast();
  const [items, setItems] = useState<Trip[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [toCancel, setToCancel] = useState<Trip | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page_size: 100 };
      if (status) params.status = status;
      const data = await api<Page<Trip>>("/trips", { params });
      setItems(data.items);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refresh();
    const onRefresh = () => refresh();
    window.addEventListener("ws:trip", onRefresh);
    return () => window.removeEventListener("ws:trip", onRefresh);
  }, [refresh]);

  const cancel = async (t: Trip) => {
    try {
      await api(`/trips/${t.id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "Annulation admin" }),
      });
      show("Intervention annulée");
      setToCancel(null);
      refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "Erreur", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Interventions</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Ambulance</th>
              <th className="px-4 py-3">Assignée le</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Chargement…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Aucune intervention</td></tr>
            )}
            {items.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3">{t.ambulance_id.slice(0, 8)}</td>
                <td className="px-4 py-3">
                  {t.assigned_at ? new Date(t.assigned_at).toLocaleString("fr-FR") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/trips/${t.id}`)} className="text-blue-600 hover:underline">
                      Voir détail
                    </button>
                    {["REQUESTED", "SEARCHING", "ASSIGNED", "ACCEPTED", "EN_ROUTE_TO_PATIENT", "ARRIVED_AT_PATIENT"].includes(t.status) && (
                      <button onClick={() => setToCancel(t)} className="text-red-600 hover:underline">
                        Annuler
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!toCancel}
        title="Annuler l'intervention"
        message={`Confirmer l'annulation de l'intervention ${toCancel?.id.slice(0, 8)} ?`}
        danger
        confirmLabel="Annuler l'intervention"
        onConfirm={() => toCancel && cancel(toCancel)}
        onCancel={() => setToCancel(null)}
      />
      {node}
    </div>
  );
}
