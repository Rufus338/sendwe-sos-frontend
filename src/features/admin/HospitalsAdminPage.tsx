/** S1 — Liste des hôpitaux (super admin, section 9.E). */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import type { Hospital } from "../../lib/types";
import { Button, ConfirmModal, useToast } from "../../shared/ui";

export function HospitalsAdminPage() {
  const navigate = useNavigate();
  const { show, node } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [toDisable, setToDisable] = useState<Hospital | null>(null);

  const refresh = useCallback(async () => {
    try {
      setHospitals(await api<Hospital[]>("/hospitals"));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const disable = async () => {
    if (!toDisable) return;
    try {
      await api(`/hospitals/${toDisable.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: false }),
      });
      show("Hôpital désactivé");
      setToDisable(null);
      refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "Erreur", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hôpitaux</h1>
        <Button onClick={() => navigate("/admin/hospitals/new")}>Ajouter un hôpital</Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {hospitals.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Aucun hôpital</td></tr>
            )}
            {hospitals.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{h.name}</td>
                <td className="px-4 py-3">{h.city}</td>
                <td className="px-4 py-3">{h.contact_phone}</td>
                <td className="px-4 py-3">{h.is_active ? "Actif" : "Inactif"}</td>
                <td className="px-4 py-3">
                  {h.is_active && (
                    <button onClick={() => setToDisable(h)} className="text-red-600 hover:underline">
                      Désactiver
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!toDisable}
        title="Désactiver l'hôpital"
        message={`Confirmer la désactivation de ${toDisable?.name} ? Tous les comptes liés seront bloqués.`}
        danger
        confirmLabel="Désactiver"
        onConfirm={disable}
        onCancel={() => setToDisable(null)}
      />
      {node}
    </div>
  );
}
