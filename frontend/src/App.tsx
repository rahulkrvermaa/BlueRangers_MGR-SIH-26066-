import { useState, useEffect } from 'react';
import { Waves, Map as MapIcon, Info } from 'lucide-react';
import { MapComponent } from './components/MapComponent';
import { ProfileChart } from './components/ProfileChart';
import { getMetadata, predictProfile } from './api';
import type { PredictionResponse } from './types';

function App() {
  const [metadata, setMetadata] = useState<any>(null);
  const [date, setDate] = useState('2025-06-10');
  const [lat, setLat] = useState<number>(15.5);
  const [lon, setLon] = useState<number>(65.5);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetadata().then(setMetadata).catch(console.error);
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictProfile(date, lat, lon);
      setPrediction(res);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = (type: 'arabian' | 'bay') => {
    if (type === 'arabian') {
      setLat(15.5); setLon(65.5);
    } else {
      setLat(15.5); setLon(88.5);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-ocean-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Waves className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">OCEANEMBED</h1>
              <p className="text-sm text-slate-400">Satellite Embedding-Based Subsurface Ocean Temperature Reconstruction</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Control Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <MapIcon className="w-5 h-5 text-ocean-600" />
            <h2 className="text-lg font-semibold">Research Demonstration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date (Current PoC)</label>
              <select 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-ocean-500 transition"
              >
                {metadata?.dates.available.map((d: string) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Latitude (°N)</label>
              <input 
                type="number" step="0.25" value={lat} onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-ocean-500 transition"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Longitude (°E)</label>
              <input 
                type="number" step="0.25" value={lon} onChange={(e) => setLon(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-ocean-500 transition"
              />
            </div>

            <div className="flex items-end">
              <button 
                onClick={handlePredict}
                disabled={loading}
                className="w-full bg-ocean-600 hover:bg-ocean-700 text-white font-medium rounded-lg p-2.5 transition flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Reconstructing...' : 'RECONSTRUCT TEMPERATURE'}
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex gap-4 text-sm">
            <span className="text-slate-500">Demo Locations:</span>
            <button onClick={() => handleDemo('arabian')} className="text-ocean-600 font-medium hover:underline">Arabian Sea</button>
            <button onClick={() => handleDemo('bay')} className="text-ocean-600 font-medium hover:underline">Bay of Bengal</button>
          </div>
          {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}
        </div>

        {/* Results Section */}
        {prediction && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Map */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <MapComponent 
                  lat={prediction.requested_location.latitude} 
                  lon={prediction.requested_location.longitude}
                  predictedLat={prediction.selected_grid_location.latitude}
                  predictedLon={prediction.selected_grid_location.longitude}
                />
                
                {/* Surface Variables */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-semibold mb-4 text-slate-800">Surface Ocean State</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: 'SST', v: `${prediction.surface.sst.toFixed(2)} °C` },
                      { l: 'SSS', v: `${prediction.surface.sss.toFixed(2)} PSU` },
                      { l: 'SSH', v: `${prediction.surface.ssh.toFixed(2)} m` },
                      { l: 'Current U', v: `${prediction.surface.current_u.toFixed(2)} m/s` },
                      { l: 'Current V', v: `${prediction.surface.current_v.toFixed(2)} m/s` },
                      { l: 'Wind U', v: `${prediction.surface.wind_u.toFixed(2)} m/s` },
                      { l: 'Wind V', v: `${prediction.surface.wind_v.toFixed(2)} m/s` },
                    ].map((item) => (
                      <div key={item.l} className="bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                        <div className="text-slate-500 text-xs font-medium">{item.l}</div>
                        <div className="font-semibold text-slate-800">{item.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart & Metrics */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <ProfileChart 
                  depths={prediction.depths}
                  predicted={prediction.predicted_temperature}
                  reference={prediction.reference_temperature}
                />
                
                {prediction.metrics && (
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'RMSE', val: `${prediction.metrics.rmse?.toFixed(3)} °C` },
                      { label: 'MAE', val: `${prediction.metrics.mae?.toFixed(3)} °C` },
                      { label: 'Bias', val: `${prediction.metrics.bias?.toFixed(3)} °C` },
                      { label: 'Correlation', val: prediction.metrics.correlation?.toFixed(4) },
                    ].map(m => (
                      <div key={m.label} className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-wider">{m.label}</div>
                        <div className="font-bold text-lg text-ocean-700">{m.val}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Validation / Technical info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Info className="text-ocean-600"/> Validation & Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium text-slate-800 mb-3 border-b pb-2">Aggregate GLORYS Validation (Current PoC)</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li><span className="font-medium">Overall RMSE:</span> 0.6387 °C</li>
                    <li><span className="font-medium">Overall MAE:</span> 0.4441 °C</li>
                    <li><span className="font-medium">Overall Bias:</span> 0.0244 °C</li>
                    <li><span className="font-medium">Overall Correlation:</span> 0.9968</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 mb-3 border-b pb-2">Aggregate Independent ARGO Validation</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li><span className="font-medium">Total Observations:</span> 8601</li>
                    <li><span className="font-medium">Overall RMSE:</span> 1.3032 °C</li>
                    <li><span className="font-medium">Overall MAE:</span> 0.9407 °C</li>
                    <li><span className="font-medium">Overall Bias:</span> 0.6203 °C</li>
                    <li><span className="font-medium">Overall Correlation:</span> 0.9903</li>
                  </ul>
                  <p className="text-xs text-slate-500 mt-2">These are aggregate project metrics. GLORYS comparison evaluates agreement with the reanalysis target. Independent ARGO validation provides an observational check on generalization.</p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t text-sm text-slate-500 flex justify-between items-center">
                <span>Model: CNN-based PoC | Grid: 0.25° | Depth: 0–1000m (15 levels) | Patch: 15×15</span>
              </div>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
