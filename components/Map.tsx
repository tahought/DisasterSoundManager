"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";

type Unit = Database["public"]["Tables"]["units"]["Row"];
type Incident = Database["public"]["Tables"]["incidents"]["Row"];

function MapController({ targetPosition }: { targetPosition: L.LatLngTuple | null }) {
    const map = useMap();
    useEffect(() => {
        if (targetPosition) {
            map.flyTo(targetPosition, 13, { duration: 1.5 });
        }
    }, [targetPosition, map]);
    return null;
}

export default function Map() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [recentIncidents, setRecentIncidents] = useState<Record<string, Incident>>({});
    const [latestIncidentPosition, setLatestIncidentPosition] = useState<L.LatLngTuple | null>(null);
    const latestIncidentIdRef = useRef<string | null>(null);

    useEffect(() => {
        const fetchMapData = async () => {
            // Fetch units
            const { data: unitsData } = await supabase.from("units").select("*");
            if (unitsData) setUnits(unitsData);

            // Fetch recent incidents (last 5 minutes)
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const { data: incidentsData } = await supabase
                .from("incidents")
                .select("*")
                .gte("created_at", fiveMinsAgo)
                .order("created_at", { ascending: false });

            if (incidentsData) {
                const incidentMap: Record<string, Incident> = {};

                incidentsData.forEach((inc) => {
                    if (!incidentMap[inc.unit_id]) {
                        incidentMap[inc.unit_id] = inc; // keep the most recent for that unit
                    }
                });

                setRecentIncidents(incidentMap);

                // Update pan target if there is a new incident (first in the descending array)
                if (incidentsData.length > 0) {
                    const newestInc = incidentsData[0];
                    if (newestInc.id !== latestIncidentIdRef.current) {
                        latestIncidentIdRef.current = newestInc.id;
                        setLatestIncidentPosition([newestInc.latitude, newestInc.longitude]);
                    }
                }
            }
        };

        fetchMapData();

        // Refresh every minute to remove old pings
        const interval = setInterval(() => fetchMapData(), 60000);

        // Subscribe to realtime updates
        const channel = supabase
            .channel("public:map")
            .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => {
                fetchMapData(); // In a production app you'd append incrementally, but fetching all is fine for this scale
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "units" }, () => {
                fetchMapData(); // Refetch units if a new custom unit is created
            })
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, []);

    // Center map around Kansai area (where our mock data is)
    const center: L.LatLngTuple = [34.8, 135.6];

    // Custom icon factory
    const createCustomIcon = (isPinging: boolean) => {
        return L.divIcon({
            className: "pulsing-marker",
            html: `
        <div class="relative flex items-center justify-center">
          ${isPinging ? '<div class="pulse-ring"></div>' : ''}
          <div class="marker-inner ${isPinging ? 'bg-destructive border-transparent' : 'bg-blue-500 border-zinc-950'}"></div>
        </div>
      `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
        });
    };

    return (
        <div className="h-full w-full rounded-xl overflow-hidden shadow-xl border border-zinc-800">
            <MapContainer
                center={center}
                zoom={10}
                style={{ height: '100%', width: '100%', background: '#18181b' }}
                zoomControl={false}
            >
                <MapController targetPosition={latestIncidentPosition} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {units.map((unit) => {
                    const recentIncident = recentIncidents[unit.id];
                    const isPinging = !!recentIncident;

                    return (
                        <Marker
                            key={unit.id}
                            position={[unit.latitude, unit.longitude]}
                            icon={createCustomIcon(isPinging)}
                        >
                            <Popup className="custom-popup">
                                <div className="bg-zinc-950 text-zinc-100 p-2 rounded-lg border border-zinc-800 min-w-[200px]">
                                    <h3 className="font-bold border-b border-zinc-800 pb-2 mb-2">{unit.id}</h3>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">ステータス</span>
                                            <span className={unit.status === 'online' ? "text-emerald-400" : "text-zinc-500"}>
                                                {unit.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">バッテリー</span>
                                            <span className={unit.battery < 20 ? "text-red-400" : "text-zinc-100"}>
                                                {unit.battery}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">電波強度</span>
                                            <span>{unit.signal_strength}</span>
                                        </div>
                                    </div>

                                    {isPinging && (
                                        <div className="mt-3 pt-3 border-t border-zinc-800">
                                            <div className="text-xs text-red-400 font-bold mb-1">最近の検知</div>
                                            <Badge variant="destructive">{recentIncident.type}</Badge>
                                            <div className="text-xs text-zinc-400 mt-1">
                                                {(recentIncident.confidence * 100).toFixed(1)}% ({new Date(recentIncident.created_at || '').toLocaleTimeString()})
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
