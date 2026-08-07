/** H1 — Connexion admin (même endpoint que l'app mobile). */
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuthStore } from "./authStore";
import { Button, Field } from "../../shared/ui";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api<{
        access_token: string;
        refresh_token: string;
        role: string;
        user_id: string;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      });
      setSession(data as never);
      navigate("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Numéro ou mot de passe incorrect";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-modal border border-border bg-white p-8 shadow-lg"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-control bg-primary text-2xl shadow-md">
            🚑
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sendwe SOS</h1>
            <p className="text-sm text-muted-foreground">Connexion — Dashboard hôpital</p>
          </div>
        </div>
        <div className="space-y-4">
          <Field
            label="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+243 ..."
            required
          />
          <Field
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
        </div>
      </form>
    </div>
  );
}
