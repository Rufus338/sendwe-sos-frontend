/** H3 — Liste des ambulances (section 9.D). */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import type { Ambulance, Page } from "../../lib/types";
import { Button, ConfirmModal, StatusBadge, useToast } from "../../shared/ui";

export function AmbulancesPage() {
  const navigate = useNavigate();
  const { show, node } = useToast();
  const [items, setItems] = useState<Ambulance[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<Ambulance | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [toOffline, setToOffline] = useState<Ambulance | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api<Page<Ambulance>>("/ambulances", { params: { page_size: 100 } });
      setItems(data.items);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setStatus = async (id: string, status: "OUT_OF_SERVICE" | "AVAILABLE") => {
    try {
      await api(`/ambulances/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      show("Statut mis à jour");
      refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "Erreur", "error");
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api(`/ambulances/${toDelete.id}`, { method: "DELETE" });
      show("Ambulance supprimée");
      setToDelete(null);
      refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "Erreur", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ambulances</h1>
        <Button onClick={() => navigate("/ambulances/new")}>Ajouter une ambulance</Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3">Immatriculation</th>
              <th className="px-4 py-3">Modèle</th>
              <th className="px-4 py-3">Capacité</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Chargement…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Aucune ambulance pour le moment
                </td>
              </tr>
            )}
            {items.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.plate_number}</td>
                <td className="px-4 py-3">{a.model}</td>
                <td className="px-4 py-3">{a.capacity}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/ambulances/${a.id}/edit`)}
                      className="text-blue-600 hover:underline"
                    >
                      Éditer
                    </button>
                    {a.status !== "OUT_OF_SERVICE" ? (
                      <button
                        onClick={() => setToOffline(a)}
                        className="text-amber-600 hover:underline"
                      >
                        Hors service
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatus(a.id, "AVAILABLE")}
                        className="text-green-600 hover:underline"
                      >
                        Remettre en service
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setToDelete(a);
                        setConfirmText("");
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!toOffline}
        title="Mettre hors service"
        message={`Confirmer la mise hors service de ${toOffline?.plate_number} ?`}
        confirmLabel="Mettre hors service"
        danger
        onConfirm={() => {
          if (toOffline) setStatus(toOffline.id, "OUT_OF_SERVICE");
          setToOffline(null);
        }}
        onCancel={() => setToOffline(null)}
      />

      <ConfirmModal
        open={!!toDelete}
        title="Supprimer l'ambulance"
        message={
          <div>
            <p className="mb-2">
              Pour confirmer, tapez le nom du véhicule (<strong>{toDelete?.plate_number}</strong>) :
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder={toDelete?.plate_number}
            />
          </div>
        }
        confirmLabel="Supprimer définitivement"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      {node}
    </div>
  );
}
