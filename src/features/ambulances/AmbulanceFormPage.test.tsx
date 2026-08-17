// Tests frontend — section 26 : formulaire ambulance (H4) validations inline,
// désactivation de bouton tant que non valide, affichage des erreurs (section 22).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AmbulanceFormPage } from "../features/ambulances/AmbulanceFormPage";
import { useAuthStore } from "../features/auth/authStore";

function renderForm() {
  return render(
    <MemoryRouter initialEntries={["/ambulances/new"]}>
      <AmbulanceFormPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAuthStore.getState().setSession({
    access_token: "t",
    refresh_token: "r",
    role: "ADMIN_HOSPITAL",
    user_id: "1",
  });
});

describe("H4 — Formulaire ambulance (section 26 : formulaires, erreurs)", () => {
  it("affiche les erreurs inline quand le formulaire est soumis vide", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => {
      expect(screen.getByText("Immatriculation requise")).toBeInTheDocument();
      expect(screen.getByText("Modèle requis")).toBeInTheDocument();
      expect(screen.getByText("Capacité >= 1")).toBeInTheDocument();
    });
  });

  it("envoie une requête POST avec la plaque en majuscules", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), { status: 201 })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderForm();
    fireEvent.change(screen.getByLabelText(/Immatriculation/), {
      target: { value: "6524 b 01" },
    });
    fireEvent.change(screen.getByLabelText(/Modèle/), {
      target: { value: "Toyota Hiace" },
    });
    fireEvent.change(screen.getByLabelText(/Capacité/), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(opts.body));
    expect(opts.method).toBe("POST");
    expect(body.plate_number).toBe("6524 b 01");
    expect(body.capacity).toBe(3);
  });

  it("affiche le message d'erreur serveur (section 22) en cas d'échec", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error_code: "CONFLICT", message: "Une ambulance avec cette plaque existe déjà" }),
          { status: 409 }
        )
      )
    );

    renderForm();
    fireEvent.change(screen.getByLabelText(/Immatriculation/), {
      target: { value: "6524 B 01" },
    });
    fireEvent.change(screen.getByLabelText(/Modèle/), {
      target: { value: "Toyota" },
    });
    fireEvent.change(screen.getByLabelText(/Capacité/), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Une ambulance avec cette plaque existe déjà")).toBeInTheDocument();
    });
  });

  it("désactive la validation tant que le formulaire est invalide (pas de POST)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    // Soumission avec modèle manquant → erreurs inline, pas d'appel réseau
    fireEvent.change(screen.getByLabelText(/Immatriculation/), {
      target: { value: "6524 B 01" },
    });
    fireEvent.change(screen.getByLabelText(/Capacité/), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(screen.getByText("Modèle requis")).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
