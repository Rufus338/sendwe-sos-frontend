/** H4 — Formulaire Ajouter/Éditer ambulance (section 9.D). */
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import type { Ambulance } from "../../lib/types";
import { Button, Field, useToast } from "../../shared/ui";

export function AmbulanceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show, node } = useToast();
  const editing = Boolean(id);

  const [form, setForm] = useState({
    plate_number: "",
    model: "",
    capacity: "1",
    equipment_notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (id) {
      api<Ambulance>(`/ambulances/${id}`)
        .then((a) =>
          setForm({
            plate_number: a.plate_number,
            model: a.model,
            capacity: String(a.capacity),
            equipment_notes: a.equipment_notes ?? "",
          })
        )
        .finally(() => setLoading(false));
    }
  }, [id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.plate_number.trim()) errs.plate_number = "Immatriculation requise";
    if (!form.model.trim()) errs.model = "Modèle requis";
    if (!form.capacity || Number(form.capacity) < 1) errs.capacity = "Capacité >= 1";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      plate_number: form.plate_number.trim(),
      model: form.model.trim(),
      capacity: Number(form.capacity),
      equipment_notes: form.equipment_notes.trim() || null,
    };
    try {
      if (editing) {
        await api(`/ambulances/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await api("/ambulances", { method: "POST", body: JSON.stringify(payload) });
      }
      show("Ambulance enregistrée");
      navigate("/ambulances");
    } catch (err) {
      show(err instanceof Error ? err.message : "Erreur d'enregistrement", "error");
    }
  };

  if (loading) return <p className="text-gray-500">Chargement…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-semibold">
        {editing ? "Éditer l'ambulance" : "Ajouter une ambulance"}
      </h1>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 p-6">
        <Field
          label="Immatriculation"
          value={form.plate_number}
          onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
          error={errors.plate_number}
          placeholder="Ex. 6524 B 01"
        />
        <Field
          label="Modèle"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          error={errors.model}
          placeholder="Ex. Toyota Hiace Ambulance"
        />
        <Field
          label="Capacité"
          type="number"
          min={1}
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          error={errors.capacity}
        />
        <Field
          label="Notes d'équipement (optionnel)"
          value={form.equipment_notes}
          onChange={(e) => setForm({ ...form, equipment_notes: e.target.value })}
          hint="Ex. brancard, oxygène, défibrillateur"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate("/ambulances")}>
            Annuler
          </Button>
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
      {node}
    </div>
  );
}
