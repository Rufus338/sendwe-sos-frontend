/** H8 — Détail intervention avec timeline + carte trajectoire (section 9.D). */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import type { TripDetail } from "../../lib/types";
import { LiveMap, MapMarker } from "../../shared/LiveMap";
import { Button, ConfirmModal, StatusBadge, useToast } from "../../shared/ui";

const ACTIVE_STATES = [
  "REQUESTED", "SEARCHING", "ASSIGNED", "ACCEPTED", "EN_ROUTE_TO_PATIENT",
  "ARRIVED_AT_PATIENT", "PATIENT_PICKED_UP", "EN_ROUTE_TO_HOSPITAL",
  "ARRIVED_AT_HOSPITAL",
];

export function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show, node } = useToast();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmReassign, setConfirmReassign] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = () => {
    api<TripDetail>(`/trips/${id}`).then(setTrip).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const reassign = async () => {
    try {
      await api(`/trips/${id}/reassign`, { method: "PATCH", body: "{}" });
      show("Matching relancé");
      setConfirmReassign(false);
      setTimeout(load, 3000);
    } catch (e) {
      show(e instanceof Error ? e.message : "Erreur", "error");
    }
  };

  const cancelTrip = async () => {
    if (!trip) return;
    try {
      await api(`/trips/${trip.id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "Annulation admin" }),
      });
      show("Intervention annulée");
      setConfirmCancel(false);
      load();
    } catch (e) {
      show(e instanceof Error ? e.message : "Erreur", "error");
    }
  };

  if (loading) return <p className="text-gray-500">Chargement…</p>;
  if (!trip) return <p className="text-gray-500">Intervention introuvable</p>;

  const pickup = trip.pickup_location;
  const markers: MapMarker[] = pickup
    ? [{ id: "pickup", lat: pickup.lat, lng: pickup.lng, color: "#dc2626", label: "Prise en charge" }]
    : [];
  const canCancel = ACTIVE_STATES.includes(trip.status);

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Intervention {trip.id.slice(0, 8)}</h1>
        <div className="flex gap-2">
          {canCancel && (
            <Button variant="danger" onClick={() => setConfirmCancel(true)}>
              Annuler
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate("/trips")}>Retour</Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <StatusBadge status={trip.status} />
          {trip.plate_number && <span className="text-sm text-gray-600">Ambulance {trip.plate_number}</span>}
          {trip.driver_name && <span className="text-sm text-gray-600">Chauffeur {trip.driver_name}</span>}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-gray-500">Motif</dt><dd>{trip.reason_category?.replaceAll("_", " ") ?? "—"}</dd></div>
          <div><dt className="text-gray-500">Bénéficiaire</dt><dd>{trip.beneficiary_name ?? "Le demandeur"}</dd></div>
          {trip.reason_note && (
            <div className="col-span-2"><dt className="text-gray-500">Note</dt><dd>{trip.reason_note}</dd></div>
          )}
        </dl>
        {(trip.status === "REJECTED" || trip.status === "FAILED") && (
          <div className="mt-4">
            <Button onClick={() => setConfirmReassign(true)}>Réassigner (relancer le matching)</Button>
          </div>
        )}
      </div>

      {/* Carte trajectoire (H8) */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <LiveMap markers={markers} height="280px" />
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 font-medium">Timeline</h2>
        <ol className="space-y-3">
          {trip.status_events.map((ev, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
              <span className="font-medium">{ev.to_status.replaceAll("_", " ")}</span>
              <span className="text-xs text-gray-500">
                {new Date(ev.created_at).toLocaleString("fr-FR")}
              </span>
            </li>
          ))}
          {trip.status_events.length === 0 && (
            <li className="text-sm text-gray-500">Aucun événement enregistré</li>
          )}
        </ol>
      </div>

      <ConfirmModal
        open={confirmReassign}
        title="Réassigner l'intervention"
        message="Relancer le matching avec les autres ambulances disponibles ?"
        confirmLabel="Relancer le matching"
        onConfirm={reassign}
        onCancel={() => setConfirmReassign(false)}
      />
      <ConfirmModal
        open={confirmCancel}
        title="Annuler l'intervention"
        message={`Confirmer l'annulation de l'intervention ${trip.id.slice(0, 8)} ?`}
        confirmLabel="Annuler l'intervention"
        danger
        onConfirm={cancelTrip}
        onCancel={() => setConfirmCancel(false)}
      />
      {node}
    </div>
  );
}
