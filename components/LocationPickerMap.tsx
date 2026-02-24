"use client";

import { useState, useEffect } from "react";
import { useMapEvents, MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix generic Leaflet icon mounting issue within Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default?.src || '/marker-icon-2x.png',
    iconUrl: require('leaflet/dist/images/marker-icon.png').default?.src || '/marker-icon.png',
    shadowUrl: require('leaflet/dist/images/marker-shadow.png').default?.src || '/marker-shadow.png',
});

interface LocationPickerProps {
    position: { lat: number; lng: number } | null;
    onPositionChange: (pos: { lat: number; lng: number }) => void;
}

function LocationMarker({ position, onPositionChange }: LocationPickerProps) {
    useMapEvents({
        click(e) {
            onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

export default function LocationPickerMap({ position, onPositionChange }: LocationPickerProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[200px] w-full bg-zinc-900 animate-pulse rounded-md" />;

    const center: L.LatLngTuple = position ? [position.lat, position.lng] : [35.0, 135.7];

    return (
        <div className="h-[200px] w-full rounded-md overflow-hidden border border-zinc-700">
            <MapContainer
                center={center}
                zoom={position ? 12 : 8}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <LocationMarker position={position} onPositionChange={onPositionChange} />
            </MapContainer>
        </div>
    );
}
