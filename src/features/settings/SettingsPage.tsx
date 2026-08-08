/** H9 — Paramètres de l'hôpital (section 9.D). */
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import type { Hospital } from "../../lib/types";
import { useAuthStore } from "../auth/authStore";
import { Button, Field, useToast } from "../../shared/ui";

export function SettingsPage() {
  const { show, node } = useToast();
  const userId = useAuthStore((s) => s.userId);
  const [form, setForm] = useState({
    name: "",
    address: "",
    contact_phone: "",
    emergency_backup_phone: "",
    default_search_radius_km: "",
    max_search_radius_km: "",
  });
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupère l'hôpital de l'admin courant via son profil
    api<{ hospital_id: string | null }>("/users/me").then(async (me) => {
      if (!me.hospital_id) return;
      setHospitalId(me.hospital_id);
      const h = await api<Hospital>(`/hospitals/${me.hospital_id}`);
      setForm({
        name: h.name,
        address: h.address ?? "",
        contact_phone: h.contact_phone,
        emergency_backup_phone: h.emergency_backup_phone ?? "",
        default_search_radius_km: String(h.default_search_radius_km),
        max_search_radius_km: String(h.max_search_radius_km),
      });
    }).finally(() => setLoading(false));
  }, [userId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hospitalId) return;
    const def = Number(form.default_search_radius_km);
    const max = Number(form.max_search_radius_km);
    if (max < def) {
      show("max_search_radius_km doit être >= default_search_radius_km", "error");
      return;
    }
    try {
      await api(`/hospitals/${hospitalId}`, {
        method: "PATCH",
        body: JSON.stringify({
          address: form.address.trim() || null,
          contact_phone: form.contact_phone.trim(),
          emergency_backup_phone: form.emergency_backup_phone.trim() || null,
          default_search_radius_km: def,
          max_search_radius_km: max,
        }),
      });
      show("Paramètres enregistrés");
    } catch (err) {
      show(err instanceof Error ? err.message : "Erreur", "error");
    }
  };

  if (loading) return <p className="text-gray-500">Chargement…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-semibold">Paramètres de l'hôpital</h1>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 p-6">
        <Field
          label="Nom de l'hôpital"
          value={form.name}
          onChange={() => {}}
          disabled
          hint="Modifiable par le super admin uniquement"
        />
        <Field
          label="Adresse"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <Field
          label="Téléphone de contact"
          value={form.contact_phone}
          onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
        />
        <Field
          label="Numéro d'urgence de secours (optionnel)"
          value={form.emergency_backup_phone}
          onChange={(e) => setForm({ ...form, emergency_backup_phone: e.target.value })}
          hint="Affiché au patient si aucune ambulance trouvée. Laisser vide si non défini."
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Rayon initial (km)"
            type="number"
            step="0.1"
            value={form.default_search_radius_km}
            onChange={(e) => setForm({ ...form, default_search_radius_km: e.target.value })}
          />
          <Field
            label="Rayon maximal (km)"
            type="number"
            step="0.1"
            value={form.max_search_radius_km}
            onChange={(e) => setForm({ ...form, max_search_radius_km: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Link to="/settings/admins" className="text-sm font-medium text-blue-600 hover:underline">
            Gérer les administrateurs →
          </Link>
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
      {node}
    </div>
  );
}
