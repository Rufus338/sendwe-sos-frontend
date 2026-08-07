/** Carte MapLibre GL partagée (tuiles OpenStreetMap, section 12.2). */
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  heading?: number | null;
  label?: string;
}

export interface MapRoute {
  id: string;
  coordinates: [number, number][]; // [lng, lat]
  dashed?: boolean; // ligne pointillée = mode dégradé (section 19)
}

/** Marqueurs colorés par statut (section 11) + itinéraire Mapbox (section 19). */
export function LiveMap({
  markers,
  center,
  zoom = 12,
  onMarkerClick,
  height = "100%",
  routes = [],
}: {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (id: string) => void;
  height?: string;
  routes?: MapRoute[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<Record<string, maplibregl.Marker>>({});
  const routeSources = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: center ?? [27.4794, -11.6647],
      zoom,
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mise à jour des marqueurs
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();
    markers.forEach((m) => {
      seen.add(m.id);
      const existing = markerRefs.current[m.id];
      if (existing) {
        existing.setLngLat([m.lng, m.lat]);
        return;
      }
      const el = document.createElement("div");
      el.className = "map-marker";
      el.style.width = "22px";
      el.style.height = "22px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = m.color;
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";
      el.style.cursor = "pointer";
      if (m.heading != null) {
        el.style.background = `linear-gradient(0deg, ${m.color} 0%, ${m.color} 100%)`;
      }
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .addTo(map);
      if (onMarkerClick) {
        el.addEventListener("click", () => onMarkerClick(m.id));
      }
      markerRefs.current[m.id] = marker;
    });
    // Supprime les marqueurs disparus
    Object.keys(markerRefs.current).forEach((id) => {
      if (!seen.has(id)) {
        markerRefs.current[id].remove();
        delete markerRefs.current[id];
      }
    });
  }, [markers, onMarkerClick]);

  // Mise à jour des itinéraires (couches GeoJSON)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.isStyleLoaded()) return;

    // Supprime les sources/lignes obsolètes
    routeSources.current.forEach((id) => {
      if (!routes.some((r) => r.id === id)) {
        if (map.getLayer(`route-line-${id}`)) map.removeLayer(`route-line-${id}`);
        if (map.getSource(id)) map.removeSource(id);
        routeSources.current.delete(id);
      }
    });

    routes.forEach((r) => {
      if (!map.getSource(r.id)) {
        map.addSource(r.id, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: r.coordinates },
          },
        });
        map.addLayer({
          id: `route-line-${r.id}`,
          type: "line",
          source: r.id,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#2563eb",
            "line-width": 4,
            // Ligne pointillée si mode dégradé (section 19)
            ...(r.dashed ? { "line-dasharray": [2, 2] } : {}),
          },
        });
        routeSources.current.add(r.id);
      } else {
        const src = map.getSource(r.id) as maplibregl.GeoJSONSource;
        src.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: r.coordinates },
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes]);

  return <div ref={containerRef} style={{ height, width: "100%" }} />;
}
