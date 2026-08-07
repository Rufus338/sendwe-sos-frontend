/** H10 — Gestion des admins de l'hôpital (section 9.D). */
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Page, Driver } from "../../lib/types";
import { Button, ConfirmModal, Field, useToast } from "../../shared/ui";

export function AdminsPage() {
  const { show, node } = useToast();
  const [admins, setAdmins] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [toRevoke, setToRevoke] = useState<Driver | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api<Page<Driver>>("/users", { params: { page_size: 100 } });
      setAdmins(data.items.filter((u) => u.role === "ADMIN_HOSPITAL"));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await api<{ user: Driver; temporary_password: string }>("/users", {
        method: "POST",
        body: JSON.stringify({ full_name: form.full_name, phone: form.phone, role: "ADMIN_HOSPITAL" }),
      });
      setTempPassword(res.temporary_password);
      setShowForm(false);
      setForm({ full_name: "", phone: "" });
      refresh();
    } catch (err) {
      show(err instanceof Error ? err.message : "Erreur", "error");
    }
  };

  const revoke = async () => {
    if (!toRevoke) return;
    try {
      await api(`/users/${toRevoke.id}`, { method: "PATCH", body: JSON.stringify({ is_active: false }) });
      show("Admin révoqué");
      setToRevoke(null);
      refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "Erreur", "error");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">Administrateurs de l'hôpital</h1>

      {tempPassword && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Mot de passe temporaire (affiché une fois) :</p>
          <p className="mt-1 font-mono text-lg font-bold">{tempPassword}</p>
          <button onClick={() => setTempPassword(null)} className="mt-1 text-xs text-amber-700 underline">
            Fermer
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {admins.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.full_name}</td>
                <td className="px-4 py-3">{a.phone}</td>
                <td className="px-4 py-3">
                  {a.is_active ? (
                    <button onClick={() => setToRevoke(a)} className="text-red-600 hover:underline">
                      Révoquer
                    </button>
                  ) : (
                    <span className="text-gray-400">Inactif</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!showForm ? (
        <Button className="mt-4" onClick={() => setShowForm(true)}>Inviter un admin</Button>
      ) : (
        <form onSubmit={invite} className="mt-4 space-y-4 rounded-lg border border-gray-200 p-6">
          <Field
            label="Nom complet"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <Field
            label="Téléphone (+243)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button type="submit">Inviter</Button>
          </div>
        </form>
      )}

      <ConfirmModal
        open={!!toRevoke}
        title="Révoquer l'admin"
        message={`Confirmer la révocation de ${toRevoke?.full_name} ?`}
        danger
        confirmLabel="Révoquer"
        onConfirm={revoke}
        onCancel={() => setToRevoke(null)}
      />
      {node}
    </div>
  );
}
