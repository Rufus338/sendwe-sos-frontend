// Tests frontend — section 26 : composants UI partagés (badges par statut).
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StatusBadge, STATUS_LABELS, Button, NetworkBanner, ConfirmModal } from "../shared/ui";

describe("Composants UI partagés (section 26)", () => {
  it("rend un badge avec un libellé français pour un statut connu", () => {
    render(<StatusBadge status="EN_ROUTE_TO_PATIENT" />);
    expect(screen.getByText("En route patient")).toBeInTheDocument();
  });

  it("affiche le libellé brut pour un statut inconnu", () => {
    render(<StatusBadge status="X_UNKNOWN" />);
    expect(screen.getByText("X_UNKNOWN")).toBeInTheDocument();
  });

  it("expose un libellé pour chaque statut métier (accessibilité texte)", () => {
    // Les 13 statuts d'intervention + 4 statuts ambulance doivent avoir un libellé
    const expected = [
      "AVAILABLE", "BUSY", "OUT_OF_SERVICE", "OFFLINE",
      "REQUESTED", "SEARCHING", "ASSIGNED", "ACCEPTED",
      "EN_ROUTE_TO_PATIENT", "ARRIVED_AT_PATIENT", "PATIENT_PICKED_UP",
      "EN_ROUTE_TO_HOSPITAL", "ARRIVED_AT_HOSPITAL", "COMPLETED",
      "CANCELLED", "REJECTED", "FAILED",
    ];
    for (const s of expected) {
      expect(STATUS_LABELS[s], `statut ${s}`).toBeTruthy();
    }
  });

  it("désactive un bouton via la prop disabled", () => {
    render(<Button disabled>Enregistrer</Button>);
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
  });

  it("affiche le bandeau réseau uniquement quand visible", () => {
    const { rerender } = render(<NetworkBanner visible={false} />);
    expect(screen.queryByText(/Connexion temps réel perdue/)).not.toBeInTheDocument();
    rerender(<NetworkBanner visible={true} />);
    expect(screen.getByText(/Connexion temps réel perdue/)).toBeInTheDocument();
  });

  it("désactive le bouton de confirmation de la modale selon confirmDisabled", () => {
    render(
      <ConfirmModal
        open
        title="Supprimer"
        message="Confirmer la suppression"
        confirmDisabled
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: "Confirmer" })).toBeDisabled();
  });

  it("la modale déclenche onConfirm au clic", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        open
        title="Supprimer"
        message="Confirmer"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
