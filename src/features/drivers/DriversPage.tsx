/** H5 — Liste des ambulanciers (section 9.D). */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import type { Driver, Page } from "../../lib/types";
import { Button, ConfirmModal, StatusBadge, useToast } from "../../shared/ui";

export function DriversPage() {
  const navigate = useNavigate();
  const { show, node } = useToast();
  const [items, setItems] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDisable, setToDisable] = useState<Driver | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api<Page<Driver>>("/users", { params: { page_size: 100 } });
      // Filtrer côté client : le backend peut retourner admin + ambulanciers
      setItems(data.items.filter((u) => u.role === "AMBULANCIER"));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const disable = async (d: Driver) => {
    try {
      await api(`/users/${d.id}`, { method: "PATCH", body: JSON.stringify({ is_active: false }) });
      show("Compte désactivé");
      setToDisable(null);
      refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "Erreur", "error");
    }
  };

  const assignAmbulance = async (d: Driver) => {
    const ambId = window.prompt("ID de l'ambulance à assigner :");
    if (!ambId) return;
    try {
      await api(`/drivers/${d.id}`, { method: "PATCH", body: JSON.stringify({ ambulance_id: ambId }) });
      show("Ambulance assignée");
      refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "Erreur", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ambulanciers</h1>
        <Button onClick={() => navigate("/drivers/new")}>Ajouter un ambulancier</Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Ambulance</th>
              <th className="px-4 py-3">Disponibilité</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Chargement…</td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Aucun ambulancier pour le moment
                </td>
              </tr>
            )}
            {items.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{d.full_name}</td>
                <td className="px-4 py-3">{d.phone}</td>
                <td className="px-4 py-3">
                  {d.ambulance ? d.ambulance.plate_number : (
                    <button onClick={() => assignAmbulance(d)} className="text-blue-600 hover:underline">
                      Assigner une ambulance
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={d.is_available ? "AVAILABLE" : "OFFLINE"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/drivers/${d.id}/edit`)} className="text-blue-600 hover:underline">
                      Éditer
                    </button>
                    {d.is_active && (
                      <button onClick={() => setToDisable(d)} className="text-red-600 hover:underline">
                        Désactiver
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
        open={!!toDisable}
        title="Désactiver le compte"
        message={`Confirmer la désactivation de ${toDisable?.full_name} ?`}
        danger
        confirmLabel="Désactiver"
        onConfirm={() => toDisable && disable(toDisable)}
        onCancel={() => setToDisable(null)}
      />
      {node}
    </div>
  );
}
