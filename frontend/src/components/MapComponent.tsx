import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  lat: number;
  lon: number;
  onLocationSelect?: (lat: number, lon: number) => void;
  predictedLat?: number;
  predictedLon?: number;
  domainBounds?: [[number, number], [number, number]];
}

const MapUpdater = ({ lat, lon }: { lat: number; lon: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
  }, [lat, lon, map]);
  return null;
};

const ClickHandler = ({ onSelect }: { onSelect?: (lat: number, lon: number) => void }) => {
  useMapEvents({
    click(e) {
      if (onSelect) {
        onSelect(
          parseFloat(e.latlng.lat.toFixed(3)),
          parseFloat(e.latlng.lng.toFixed(3))
        );
      }
    },
  });
  return null;
};

export const MapComponent: React.FC<MapProps> = ({
  lat,
  lon,
  onLocationSelect,
  predictedLat,
  predictedLon,
  domainBounds = [
    [5.125, 45.125],
    [29.875, 104.875],
  ],
}) => {
  const isWithinDomain =
    lat >= domainBounds[0][0] &&
    lat <= domainBounds[1][0] &&
    lon >= domainBounds[0][1] &&
    lon <= domainBounds[1][1];

  return (
    <div className="flex flex-col gap-2">
      <div className="h-[380px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
        <MapContainer
          center={[lat, lon]}
          zoom={4}
          minZoom={3}
          maxZoom={9}
          className="h-full w-full cursor-crosshair"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Rectangle
            bounds={domainBounds}
            pathOptions={{
              color: '#0284c7',
              weight: 2,
              dashArray: '4, 4',
              fillColor: '#38bdf8',
              fillOpacity: 0.08,
            }}
          />

          <Marker position={[lat, lon]}>
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-slate-800">Target Location</p>
                <p>{lat.toFixed(3)}°N, {lon.toFixed(3)}°E</p>
                {!isWithinDomain && (
                  <p className="text-amber-600 font-semibold mt-1">
                    ⚠️ Outside 0.25° trained domain
                  </p>
                )}
              </div>
            </Popup>
          </Marker>

          {predictedLat !== undefined &&
            predictedLon !== undefined &&
            (Math.abs(predictedLat - lat) > 0.01 || Math.abs(predictedLon - lon) > 0.01) && (
              <Marker position={[predictedLat, predictedLon]} opacity={0.85}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-cyan-800">Snapped Grid Center</p>
                    <p>{predictedLat.toFixed(3)}°N, {predictedLon.toFixed(3)}°E</p>
                  </div>
                </Popup>
              </Marker>
            )}

          <MapUpdater lat={lat} lon={lon} />
          <ClickHandler onSelect={onLocationSelect} />
        </MapContainer>
      </div>
      <div className="flex justify-between items-center text-xs text-slate-500 px-1">
        <span>Click anywhere on the map to pick coordinates</span>
        <span className={isWithinDomain ? 'text-emerald-700 font-medium' : 'text-amber-600 font-medium'}>
          {isWithinDomain ? '✓ Within Study Domain' : '⚠️ Outside Study Domain'}
        </span>
      </div>
    </div>
  );
};
