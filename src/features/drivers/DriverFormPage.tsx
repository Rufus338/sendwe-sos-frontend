/** H6 — Formulaire Ajouter/Éditer ambulancier (section 9.D). */
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import type { Ambulance, Driver, Page } from "../../lib/types";
import { Button, Field, useToast } from "../../shared/ui";

export function DriverFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show, node } = useToast();
  const editing = Boolean(id);

  const [form, setForm] = useState({ full_name: "", phone: "", ambulance_id: "" });
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    api<Page<Ambulance>>("/ambulances", { params: { page_size: 100 } }).then((d) =>
      setAmbulances(d.items)
    );
    if (id) {
      api<Driver>(`/users/${id}`)
        .then((d) =>
          setForm({
            full_name: d.full_name,
            phone: d.phone,
            ambulance_id: d.ambulance_id ?? "",
          })
        )
        .finally(() => setLoading(false));
    }
  }, [id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = "Nom requis";
    if (!form.phone.trim()) errs.phone = "Téléphone requis";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      if (editing) {
        await api(`/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            full_name: form.full_name.trim(),
            ambulance_id: form.ambulance_id || null,
          }),
        });
        show("Ambulancier mis à jour");
      } else {
        const res = await api<{ user: Driver; temporary_password: string }>("/users", {
          method: "POST",
          body: JSON.stringify({
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            role: "AMBULANCIER",
            ambulance_id: form.ambulance_id || null,
          }),
        });
        // Mot de passe temporaire affiché UNE seule fois (section H6)
        setTempPassword(res.temporary_password);
        show("Ambulancier créé — mot de passe temporaire affiché");
      }
      navigate("/drivers");
    } catch (err) {
      show(err instanceof Error ? err.message : "Erreur", "error");
    }
  };

  if (loading) return <p className="text-gray-500">Chargement…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-semibold">
        {editing ? "Éditer l'ambulancier" : "Ajouter un ambulancier"}
      </h1>

      {tempPassword && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Mot de passe temporaire (à communiquer manuellement) :
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-amber-900">{tempPassword}</p>
          <p className="mt-1 text-xs text-amber-700">
            Ce mot de passe ne sera plus affiché. Le changement sera obligatoire à la première
            connexion.
          </p>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 p-6">
        <Field
          label="Nom complet"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          error={errors.full_name}
        />
        <Field
          label="Téléphone (format +243)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          error={errors.phone}
          disabled={editing}
        />
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Ambulance assignée (optionnel)</span>
          <select
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={form.ambulance_id}
            onChange={(e) => setForm({ ...form, ambulance_id: e.target.value })}
          >
            <option value="">— Aucune —</option>
            {ambulances
              .filter((a) => a.status !== "OUT_OF_SERVICE")
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.plate_number} — {a.model}
                </option>
              ))}
          </select>
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate("/drivers")}>Annuler</Button>
          <Button type="submit">{editing ? "Enregistrer" : "Créer"}</Button>
        </div>
      </form>
      {node}
    </div>
  );
}
