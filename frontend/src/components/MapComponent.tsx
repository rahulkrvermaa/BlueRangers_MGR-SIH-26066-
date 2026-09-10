import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  lat: number;
  lon: number;
  onLocationSelect?: (lat: number, lon: number) => void;
  predictedLat?: number;
  predictedLon?: number;
}

const MapUpdater = ({ lat, lon }: { lat: number, lon: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
  }, [lat, lon, map]);
  return null;
};

export const MapComponent: React.FC<MapProps> = ({ lat, lon, predictedLat, predictedLon }) => {
  // Domain Bounds: 5N-30N, 45E-105E
  const domainBounds: L.LatLngBoundsExpression = [
    [5, 45],
    [30, 105]
  ];

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer center={[lat, lon]} zoom={4} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Rectangle bounds={domainBounds} pathOptions={{ color: '#0a9396', weight: 2, fillOpacity: 0.1 }} />
        
        <Marker position={[lat, lon]}>
          <Popup>Requested Location</Popup>
        </Marker>
        
        {predictedLat !== undefined && predictedLon !== undefined && (
          <Marker position={[predictedLat, predictedLon]} opacity={0.7}>
            <Popup>
              Selected Grid Location<br/>
              {predictedLat.toFixed(3)}°N, {predictedLon.toFixed(3)}°E
            </Popup>
          </Marker>
        )}
        <MapUpdater lat={lat} lon={lon} />
      </MapContainer>
    </div>
  );
};
