/** H2 — Tableau de bord / carte temps réel (section 9.D). */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import type { Ambulance, Page, Trip } from "../../lib/types";
import { LiveMap, MapMarker, MapRoute } from "../../shared/LiveMap";
import { StatusBadge } from "../../shared/ui";

const AMB_COLOR: Record<string, string> = {
  AVAILABLE: "#16a34a",
  BUSY: "#2563eb",
  OUT_OF_SERVICE: "#dc2626",
  OFFLINE: "#6b7280",
};

const ACTIVE_TRIPS = ["REQUESTED", "SEARCHING", "ASSIGNED", "ACCEPTED", "EN_ROUTE_TO_PATIENT", "ARRIVED_AT_PATIENT", "PATIENT_PICKED_UP", "EN_ROUTE_TO_HOSPITAL", "ARRIVED_AT_HOSPITAL"];

export function DashboardPage() {
  const navigate = useNavigate();
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [routes, setRoutes] = useState<MapRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [ambRes, tripRes] = await Promise.all([
        api<Page<Ambulance>>("/ambulances", { params: { page_size: 100 } }),
        api<Page<Trip>>("/trips", { params: { page_size: 100 } }),
      ]);
      setAmbulances(ambRes.items);
      setTrips(tripRes.items.filter((t) => ACTIVE_TRIPS.includes(t.status)));
    } catch {
      /* le temps réel via WS gère les erreurs */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onRefresh = () => refresh();
    window.addEventListener("ws:ambulance", onRefresh);
    window.addEventListener("ws:trip", onRefresh);
    return () => {
      window.removeEventListener("ws:ambulance", onRefresh);
      window.removeEventListener("ws:trip", onRefresh);
    };
  }, [refresh]);

  // Charger l'itinéraire de l'ambulance sélectionnée (Mapbox, mode dégradé sinon)
  useEffect(() => {
    if (!selected) {
      setRoutes([]);
      return;
    }
    let cancelled = false;
    const amb = ambulances.find((a) => a.id === selected);
    if (!amb?.location) {
      setRoutes([]);
      return;
    }
    // Destination : lieu de l'intervention liée si l'ambulance est BUSY
    const trip = trips.find((t) => t.ambulance_id === selected);
    const loadRoute = async () => {
      if (!trip) {
        setRoutes([]);
        return;
      }
      try {
        // Récupère le détail du trip pour obtenir le point de prise en charge
        const detail = await api<{ pickup_location?: { lat: number; lng: number } | null }>(`/trips/${trip.id}`);
        const dest = detail.pickup_location;
        if (!dest) {
          setRoutes([]);
          return;
        }
        const route = await api<{
          mode: string;
          geometry: { coordinates: [number, number][] } | null;
          distance_m?: number;
          duration_s?: number;
        }>("/routing", {
          params: {
            origin_lat: amb.location!.lat,
            origin_lng: amb.location!.lng,
            dest_lat: dest.lat,
            dest_lng: dest.lng,
          },
        });
        if (cancelled) return;
        if (route.geometry?.coordinates?.length) {
          setRoutes([
            {
              id: selected,
              coordinates: route.geometry.coordinates,
              dashed: route.mode !== "mapbox",
            },
          ]);
        } else {
          // Mode dégradé sans géométrie : ligne droite
          setRoutes([
            {
              id: selected,
              coordinates: [
                [amb.location!.lng, amb.location!.lat],
                [dest.lng, dest.lat],
              ],
              dashed: true,
            },
          ]);
        }
      } catch {
        if (!cancelled) setRoutes([]);
      }
    };
    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [selected, ambulances, trips]);

  const markers: MapMarker[] = ambulances
    .filter((a) => a.location)
    .map((a) => ({
      id: a.id,
      lat: a.location!.lat,
      lng: a.location!.lng,
      color: AMB_COLOR[a.status] ?? "#6b7280",
      heading: a.heading,
      label: a.plate_number,
    }));

  const counts = {
    available: ambulances.filter((a) => a.status === "AVAILABLE").length,
    busy: ambulances.filter((a) => a.status === "BUSY").length,
    offline: ambulances.filter((a) => a.status === "OFFLINE" || a.status === "OUT_OF_SERVICE").length,
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Tableau de bord — temps réel</h1>
        <div className="flex gap-6 text-sm">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-success" /> {counts.available} disponibles
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-active" /> {counts.busy} en intervention
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gray-400" /> {counts.offline} hors ligne
          </span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-3 gap-4">
        <div className="col-span-2 overflow-hidden rounded-card border border-border shadow-md">
          <LiveMap
            markers={markers}
            onMarkerClick={(id) => setSelected(id)}
            height="100%"
            routes={routes}
          />
        </div>
        <div className="space-y-4 overflow-y-auto">
          <div className="rounded-card border border-border bg-white p-5 shadow-md">
            <h2 className="mb-3 font-semibold text-foreground">
              Interventions actives ({trips.length})
            </h2>
            {trips.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune intervention active</p>
            ) : (
              <ul className="space-y-2">
                {trips.map((t) => (
                  <li key={t.id}>
                    <button
                      className="w-full rounded-control border border-border bg-white p-2.5 text-left text-sm transition-colors duration-200 cursor-pointer hover:bg-muted"
                      onClick={() => navigate(`/trips/${t.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-data text-xs font-semibold text-foreground">
                          {t.ambulance_id.slice(0, 8)}
                        </span>
                        <StatusBadge status={t.status} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => navigate("/trips")}
              className="mt-3 text-sm font-medium text-accent transition-colors duration-200 cursor-pointer hover:underline"
            >
              Voir toutes les interventions →
            </button>
          </div>

          {selected && (
            <div className="rounded-card border border-border bg-white p-5 shadow-md">
              <h2 className="mb-2 font-semibold text-foreground">Détail ambulance</h2>
              {ambulances
                .filter((a) => a.id === selected)
                .map((a) => (
                  <div key={a.id} className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Immatriculation :</span>{" "}
                      <span className="font-data font-semibold text-foreground">{a.plate_number}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Modèle :</span> {a.model}
                    </p>
                    <p>
                      <StatusBadge status={a.status} />
                    </p>
                    <button
                      onClick={() => {
                        const trip = trips.find((t) => t.ambulance_id === a.id);
                        if (trip) navigate(`/trips/${trip.id}`);
                      }}
                      className="mt-2 text-sm font-medium text-accent transition-colors duration-200 cursor-pointer hover:underline"
                    >
                      Voir l'intervention →
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
