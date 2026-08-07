/** S2 — Formulaire Ajouter hôpital + premier admin (section 9.E). */
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import type { Hospital } from "../../lib/types";
import { Button, Field, useToast } from "../../shared/ui";

export function HospitalCreatePage() {
  const navigate = useNavigate();
  const { show, node } = useToast();
  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    contact_phone: "",
    admin_full_name: "",
    admin_phone: "",
    default_search_radius_km: "15.0",
    max_search_radius_km: "40.0",
  });
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await api<{ hospital: Hospital; temporary_password: string }>("/hospitals", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          city: form.city,
          address: form.address.trim() || null,
          contact_phone: form.contact_phone,
          admin_full_name: form.admin_full_name,
          admin_phone: form.admin_phone,
          default_search_radius_km: Number(form.default_search_radius_km),
          max_search_radius_km: Number(form.max_search_radius_km),
        }),
      });
      setTempPassword(res.temporary_password);
      show("Hôpital et administrateur créés");
      setTimeout(() => navigate("/admin/hospitals"), 2500);
    } catch (err) {
      show(err instanceof Error ? err.message : "Erreur", "error");
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-semibold">Ajouter un hôpital</h1>

      {tempPassword && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Mot de passe temporaire de l'admin initial (affiché une fois) :</p>
          <p className="mt-1 font-mono text-lg font-bold">{tempPassword}</p>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 p-6">
        <h2 className="font-medium">Hôpital</h2>
        <Field label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Field label="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        <Field label="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Field label="Téléphone de contact" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Rayon initial (km)" type="number" step="0.1" value={form.default_search_radius_km} onChange={(e) => setForm({ ...form, default_search_radius_km: e.target.value })} />
          <Field label="Rayon maximal (km)" type="number" step="0.1" value={form.max_search_radius_km} onChange={(e) => setForm({ ...form, max_search_radius_km: e.target.value })} />
        </div>

        <h2 className="font-medium pt-2">Compte administrateur initial</h2>
        <Field label="Nom complet" value={form.admin_full_name} onChange={(e) => setForm({ ...form, admin_full_name: e.target.value })} required />
        <Field label="Téléphone (+243)" value={form.admin_phone} onChange={(e) => setForm({ ...form, admin_phone: e.target.value })} required />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate("/admin/hospitals")}>Annuler</Button>
          <Button type="submit">Créer l'hôpital et l'administrateur</Button>
        </div>
      </form>
      {node}
    </div>
  );
}
