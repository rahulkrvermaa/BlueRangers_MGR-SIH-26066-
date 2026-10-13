import { useState, useEffect, useRef, useId } from 'react';
import {
  Waves,
  Map as MapIcon,
  Info,
  AlertTriangle,
  RotateCw,
  Compass,
  Activity,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';
import { MapComponent } from './components/MapComponent';
import { ProfileChart } from './components/ProfileChart';
import { getMetadata, getHealth, predictProfile, API_BASE } from './api';
import type { PredictionResponse, MetadataResponse, HealthResponse } from './types';

// Default fallback domain boundaries from Copernicus NetCDF grid
const DEFAULT_DOMAIN = {
  minLat: 5.125,
  maxLat: 29.875,
  minLon: 45.125,
  maxLon: 104.875,
};

const DEFAULT_DATES = [
  '2025-06-01', '2025-06-02', '2025-06-03', '2025-06-04',
  '2025-06-05', '2025-06-06', '2025-06-07', '2025-06-08',
  '2025-06-09', '2025-06-10', '2025-06-11', '2025-06-12',
  '2025-06-13', '2025-06-14', '2025-06-15',
];

export function App() {
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [backendState, setBackendState] = useState<'checking' | 'connected' | 'error'>('checking');

  const [date, setDate] = useState('2025-06-10');
  const [lat, setLat] = useState<number>(15.5);
  const [lon, setLon] = useState<number>(65.5);

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const warmupTimerRef = useRef<number | null>(null);

  const dateSelectId = useId();
  const latInputId = useId();
  const lonInputId = useId();

  // Load initial health and metadata
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function initialize() {
      try {
        setBackendState('checking');
        const [metaDataRes, healthRes] = await Promise.allSettled([
          getMetadata(controller.signal),
          getHealth(controller.signal),
        ]);

        if (!isMounted) return;

        if (healthRes.status === 'fulfilled') {
          setHealth(healthRes.value);
          setBackendState('connected');
        } else {
          setBackendState('error');
        }

        if (metaDataRes.status === 'fulfilled') {
          const meta = metaDataRes.value;
          setMetadata(meta);
          setDate((prev) =>
            meta.dates.available.length > 0 && !meta.dates.available.includes(prev)
              ? meta.dates.available[0]
              : prev
          );
        }
      } catch {
        if (isMounted) {
          setBackendState('error');
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Coordinate domain bounds check
  const domainMinLat = metadata?.study_region.latitude[0] ?? DEFAULT_DOMAIN.minLat;
  const domainMaxLat = metadata?.study_region.latitude[1] ?? DEFAULT_DOMAIN.maxLat;
  const domainMinLon = metadata?.study_region.longitude[0] ?? DEFAULT_DOMAIN.minLon;
  const domainMaxLon = metadata?.study_region.longitude[1] ?? DEFAULT_DOMAIN.maxLon;

  const latOutOfDomain = lat < domainMinLat || lat > domainMaxLat;
  const lonOutOfDomain = lon < domainMinLon || lon > domainMaxLon;
  const isInputValid = !isNaN(lat) && !isNaN(lon) && !latOutOfDomain && !lonOutOfDomain;

  const handlePredict = async () => {
    if (!isInputValid) {
      setError(
        `Coordinates must fall within the study domain: Latitude ${domainMinLat.toFixed(2)}°N–${domainMaxLat.toFixed(2)}°N, Longitude ${domainMinLon.toFixed(2)}°E–${domainMaxLon.toFixed(2)}°E.`
      );
      return;
    }

    // Cancel any ongoing prediction request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setIsWarmingUp(false);

    // If request takes longer than 6 seconds, warn user that Render is spinning up
    warmupTimerRef.current = window.setTimeout(() => {
      setIsWarmingUp(true);
    }, 6000);

    try {
      const res = await predictProfile(
        { date, latitude: lat, longitude: lon },
        controller.signal
      );
      setPrediction(res);
      setBackendState('connected');
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Request cancelled') {
        return; // Normal cancellation
      }
      const msg = err instanceof Error ? err.message : 'Prediction request failed.';
      setError(msg);
    } finally {
      if (warmupTimerRef.current) {
        clearTimeout(warmupTimerRef.current);
      }
      setIsWarmingUp(false);
      setLoading(false);
    }
  };

  const handleDemo = (type: 'arabian' | 'bay') => {
    if (type === 'arabian') {
      setLat(15.5);
      setLon(65.5);
    } else {
      setLat(15.5);
      setLon(88.5);
    }
    setError(null);
  };

  const handleMapSelect = (newLat: number, newLon: number) => {
    setLat(newLat);
    setLon(newLon);
    setError(null);
  };

  const availableDateOptions = metadata?.dates.available || DEFAULT_DATES;

  // Check if current prediction is masked (e.g. land)
  const isPredictionMasked =
    prediction !== null &&
    (prediction.surface.sst === null ||
      prediction.predicted_temperature.every((p) => p === null));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-ocean-900 text-white shadow-lg sticky top-0 z-50 border-b border-ocean-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-ocean-800 rounded-xl border border-cyan-800/40">
                <Waves className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">OCEANEMBED</h1>
                  <span className="text-[11px] font-semibold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800">
                    DeepCurrent v1.0
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Satellite Observation-Based Reconstruction of Subsurface Ocean Temperature
                </p>
              </div>
            </div>

            {/* Backend status badge */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="flex items-center gap-2 text-xs bg-ocean-800/80 px-3 py-1.5 rounded-lg border border-ocean-700">
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendState === 'connected'
                      ? 'bg-emerald-400 animate-pulse'
                      : backendState === 'checking'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-rose-400'
                  }`}
                />
                <span className="text-slate-200 font-medium">
                  Backend: {backendState === 'connected' ? 'Connected (Live)' : backendState === 'checking' ? 'Connecting...' : 'Unreachable'}
                </span>
                <span className="text-slate-400 text-[10px] hidden md:inline">
                  ({API_BASE.replace(/^https?:\/\//, '')})
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Research Controls */}
        <section aria-labelledby="controls-heading" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-ocean-500" />
              <h2 id="controls-heading" className="text-base font-semibold text-slate-800">
                Oceanographic Domain Query Controls
              </h2>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
              Domain: {domainMinLat.toFixed(2)}°N–{domainMaxLat.toFixed(2)}°N | {domainMinLon.toFixed(2)}°E–{domainMaxLon.toFixed(2)}°E
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <div>
              <label htmlFor={dateSelectId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Observation Date
              </label>
              <select
                id={dateSelectId}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-ocean-500 transition"
              >
                {availableDateOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">15-day daily demonstration series</p>
            </div>

            <div>
              <label htmlFor={latInputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Latitude (°N)
              </label>
              <input
                id={latInputId}
                type="number"
                step="0.25"
                min={domainMinLat}
                max={domainMaxLat}
                value={isNaN(lat) ? '' : lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-ocean-500 transition ${
                  latOutOfDomain ? 'border-rose-400 bg-rose-50/50 text-rose-900' : 'border-slate-300 text-slate-800'
                }`}
              />
              {latOutOfDomain ? (
                <p className="text-[11px] text-rose-600 mt-1">
                  Range: {domainMinLat.toFixed(2)}° to {domainMaxLat.toFixed(2)}°N
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">Grid step: 0.25°</p>
              )}
            </div>

            <div>
              <label htmlFor={lonInputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Longitude (°E)
              </label>
              <input
                id={lonInputId}
                type="number"
                step="0.25"
                min={domainMinLon}
                max={domainMaxLon}
                value={isNaN(lon) ? '' : lon}
                onChange={(e) => setLon(parseFloat(e.target.value))}
                className={`w-full bg-slate-50 border rounded-lg p-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-ocean-500 transition ${
                  lonOutOfDomain ? 'border-rose-400 bg-rose-50/50 text-rose-900' : 'border-slate-300 text-slate-800'
                }`}
              />
              {lonOutOfDomain ? (
                <p className="text-[11px] text-rose-600 mt-1">
                  Range: {domainMinLon.toFixed(2)}° to {domainMaxLon.toFixed(2)}°E
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">Grid step: 0.25°</p>
              )}
            </div>

            <div className="flex items-end">
              <button
                onClick={handlePredict}
                disabled={loading || !isInputValid}
                className="w-full bg-ocean-500 hover:bg-ocean-600 text-white font-medium rounded-lg p-2.5 text-sm transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Reconstructing...</span>
                  </>
                ) : (
                  <span>RECONSTRUCT TEMPERATURE</span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Verified Ocean Benchmarks:</span>
              <button
                type="button"
                onClick={() => handleDemo('arabian')}
                className="text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-2.5 py-1 rounded-md font-medium transition"
              >
                Arabian Sea (15.5°N, 65.5°E)
              </button>
              <button
                type="button"
                onClick={() => handleDemo('bay')}
                className="text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-2.5 py-1 rounded-md font-medium transition"
              >
                Bay of Bengal (15.5°N, 88.5°E)
              </button>
            </div>
            <span className="text-slate-400">
              Model input: 15×15 local spatial patch across 7 satellite variables
            </span>
          </div>

          {/* Warming up banner */}
          {isWarmingUp && (
            <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
              <span>
                <strong>Connecting to Model Service:</strong> The backend is executing PyTorch CNN inference. If waking from cold sleep on Render, this may take up to ~45 seconds. Thank you for your patience.
              </span>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Query Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </section>

        {/* Masked / Land Warning Banner */}
        {isPredictionMasked && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-950">Land / Masked Ocean Cell</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The selected location ({prediction.selected_grid_location.latitude.toFixed(3)}°N, {prediction.selected_grid_location.longitude.toFixed(3)}°E) is on land or in a coastal masked cell. Subsurface temperature reconstruction requires valid open-ocean satellite observations. Please select an open-ocean coordinate in the Arabian Sea or Bay of Bengal.
              </p>
            </div>
          </div>
        )}

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Interactive Map & Surface State */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-ocean-500" />
                  <h3 className="font-semibold text-slate-800 text-sm">Interactive Study Map</h3>
                </div>
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  0.25° Grid Snapping
                </span>
              </div>

              <MapComponent
                lat={lat}
                lon={lon}
                onLocationSelect={handleMapSelect}
                predictedLat={prediction?.selected_grid_location.latitude}
                predictedLon={prediction?.selected_grid_location.longitude}
                domainBounds={[
                  [domainMinLat, domainMinLon],
                  [domainMaxLat, domainMaxLon],
                ]}
              />

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <p>
                  <strong>Target:</strong> {isNaN(lat) ? '--' : lat.toFixed(3)}°N, {isNaN(lon) ? '--' : lon.toFixed(3)}°E
                  {prediction && (
                    <>
                      <br />
                      <strong>Nearest Ocean Cell:</strong> {prediction.selected_grid_location.latitude.toFixed(3)}°N, {prediction.selected_grid_location.longitude.toFixed(3)}°E
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Surface Ocean State Panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-ocean-500" />
                  <h3 className="font-semibold text-slate-800 text-sm">Surface Ocean State</h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {prediction ? prediction.date : date}
                </span>
              </div>

              {prediction ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      label: 'SST (Sea Surface Temp)',
                      val: prediction.surface.sst !== null ? `${prediction.surface.sst.toFixed(2)} °C` : 'N/A (Masked)',
                      source: 'OSTIA',
                    },
                    {
                      label: 'SSS (Sea Surface Salinity)',
                      val: prediction.surface.sss !== null ? `${prediction.surface.sss.toFixed(2)} PSU` : 'N/A (Masked)',
                      source: 'SMOS/Aquarius',
                    },
                    {
                      label: 'SSH (Sea Surface Height)',
                      val: prediction.surface.ssh !== null ? `${prediction.surface.ssh.toFixed(2)} m` : 'N/A (Masked)',
                      source: 'DUACS SLA',
                    },
                    {
                      label: 'Current U (Zonal)',
                      val: prediction.surface.current_u !== null ? `${prediction.surface.current_u.toFixed(2)} m/s` : 'N/A (Masked)',
                      source: 'OSCAR',
                    },
                    {
                      label: 'Current V (Meridional)',
                      val: prediction.surface.current_v !== null ? `${prediction.surface.current_v.toFixed(2)} m/s` : 'N/A (Masked)',
                      source: 'OSCAR',
                    },
                    {
                      label: 'Wind U (Zonal Stress)',
                      val: prediction.surface.wind_u !== null ? `${prediction.surface.wind_u.toFixed(2)} m/s` : 'N/A (Masked)',
                      source: 'CCMP',
                    },
                    {
                      label: 'Wind V (Meridional Stress)',
                      val: prediction.surface.wind_v !== null ? `${prediction.surface.wind_v.toFixed(2)} m/s` : 'N/A (Masked)',
                      source: 'CCMP',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] text-slate-500 font-medium truncate" title={item.label}>
                          {item.label}
                        </span>
                        <span className="text-[9px] bg-slate-200/60 text-slate-600 px-1 rounded font-mono shrink-0">
                          {item.source}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-800 text-sm mt-1">
                        {item.val}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Database className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  Run temperature reconstruction to inspect collocated surface observations.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Vertical Profile Chart & Point Metrics */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {prediction ? (
              <>
                <ProfileChart
                  depths={prediction.depths}
                  predicted={prediction.predicted_temperature}
                  reference={prediction.reference_temperature}
                  locationLabel={`${prediction.selected_grid_location.latitude.toFixed(3)}°N, ${prediction.selected_grid_location.longitude.toFixed(3)}°E • ${prediction.date}`}
                />

                {/* Point-Level Validation Metrics */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">
                        Collocated Profile Error Metrics (Point-Specific)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Evaluated against matching Copernicus GLORYS12V1 reanalysis profile across 15 standard depths (0–1000m)
                      </p>
                    </div>
                    {prediction.metrics ? (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                        15 Paired Depth Levels
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 self-start sm:self-auto">
                        Reference Unavailable
                      </span>
                    )}
                  </div>

                  {prediction.metrics ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        {
                          label: 'Point RMSE',
                          val: `${prediction.metrics.rmse !== null ? prediction.metrics.rmse.toFixed(3) : 'N/A'} °C`,
                          desc: 'Root Mean Squared Error',
                        },
                        {
                          label: 'Point MAE',
                          val: `${prediction.metrics.mae !== null ? prediction.metrics.mae.toFixed(3) : 'N/A'} °C`,
                          desc: 'Mean Absolute Error',
                        },
                        {
                          label: 'Point Bias',
                          val: `${prediction.metrics.bias !== null ? prediction.metrics.bias.toFixed(3) : 'N/A'} °C`,
                          desc: 'Mean Prediction Bias',
                        },
                        {
                          label: 'Correlation (r)',
                          val: prediction.metrics.correlation !== null ? prediction.metrics.correlation.toFixed(4) : 'N/A',
                          desc: 'Pearson Profile Correlation',
                        },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center"
                        >
                          <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1">
                            {m.label}
                          </div>
                          <div className="font-bold text-lg text-ocean-700">{m.val}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">
                      Validation metrics unavailable for this coordinate: no collocated open-ocean GLORYS profile exists at this location.
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* Ready State before first prediction */
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[480px]">
                <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 mb-4">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  Ready for Ocean Temperature Reconstruction
                </h3>
                <p className="text-sm text-slate-600 max-w-lg mb-6 leading-relaxed">
                  Select an observation date and coordinate in the Arabian Sea or Bay of Bengal (or click directly on the interactive map), then click <strong>RECONSTRUCT TEMPERATURE</strong> to run the deployed PyTorch CNN model against real NetCDF satellite observations.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      handleDemo('arabian');
                      handlePredict();
                    }}
                    className="bg-ocean-500 hover:bg-ocean-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
                  >
                    Quick Start: Arabian Sea Benchmark
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDemo('bay');
                      handlePredict();
                    }}
                    className="bg-white hover:bg-slate-50 text-ocean-600 border border-slate-300 text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
                  >
                    Quick Start: Bay of Bengal Benchmark
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Validation & Evidence-Based Details Section */}
        <section aria-labelledby="validation-heading" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Info className="w-5 h-5 text-ocean-500" />
            <h2 id="validation-heading" className="text-base font-semibold text-slate-800">
              Scientific Validation & Model Provenance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Benchmark 1: GLORYS Reanalysis */}
            <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <h3 className="font-semibold text-slate-800 text-sm">
                  Historical Benchmark: Aggregate GLORYS Target Test Set
                </h3>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                  Test Set
                </span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex justify-between">
                  <span className="font-medium text-slate-700">Evaluation Period:</span>
                  <span>June 2025 (15-day holdout evaluation)</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium text-slate-700">Overall RMSE:</span>
                  <span className="font-semibold text-slate-800">0.6387 °C</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium text-slate-700">Overall MAE:</span>
                  <span className="font-semibold text-slate-800">0.4441 °C</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium text-slate-700">Overall Bias:</span>
                  <span className="font-semibold text-slate-800">0.0244 °C</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium text-slate-700">Profile Correlation (r):</span>
                  <span className="font-semibold text-slate-800">0.9968</span>
                </li>
              </ul>
              <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200">
                GLORYS12V1 evaluates fidelity to numerical ocean reanalysis targets across the North Indian Ocean basin.
              </p>
            </div>

            {/* Benchmark 2: Independent In-Situ ARGO Validation */}
            <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <h3 className="font-semibold text-slate-800 text-sm">
                  Historical Benchmark: Independent In-Situ ARGO Floats
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                  In-Situ
                </span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex justify-between">
                  <span className="font-medium text-slate-700">Total Matched Floats:</span>
                  <span className="font-semibold text-slate-800">8,601 profiles</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium text-slate-700">Overall RMSE:</span>
                  <span className="font-semibold text-slate-800">1.3032 °C</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium text-slate-700">Overall MAE:</span>
                  <span className="font-semibold text-slate-800">0.9407 °C</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium text-slate-700">Overall Bias:</span>
                  <span className="font-semibold text-slate-800">0.6203 °C</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium text-slate-700">Profile Correlation (r):</span>
                  <span className="font-semibold text-slate-800">0.9903</span>
                </li>
              </ul>
              <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200">
                Independent observational verification comparing AI predictions directly to sparse physical ARGO CTD sensors.
              </p>
            </div>
          </div>

          {/* Model and Grid Metadata Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                <strong>Model:</strong> {metadata?.model_name || health?.model || 'OceanEmbed Patch-CNN'}
              </span>
              <span>•</span>
              <span>
                <strong>Grid:</strong> {metadata?.grid_resolution || '0.25°'}
              </span>
              <span>•</span>
              <span>
                <strong>Depths:</strong> {metadata?.depth_levels.length || 15} levels (0–1000m)
              </span>
              <span>•</span>
              <span>
                <strong>Patch Context:</strong> {metadata?.patch_size ? `${metadata.patch_size}×${metadata.patch_size}` : '15×15'} cells
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Deployed API:</span>
              <a
                href={`${API_BASE}/health`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-700 hover:underline flex items-center gap-1 font-mono text-[11px]"
              >
                {API_BASE}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
