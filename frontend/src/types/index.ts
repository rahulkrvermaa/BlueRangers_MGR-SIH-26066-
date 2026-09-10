export interface Location {
  latitude: number;
  longitude: number;
}

export interface SurfaceData {
  sst: number;
  sss: number;
  ssh: number;
  current_u: number;
  current_v: number;
  wind_u: number;
  wind_v: number;
}

export interface PredictionMetrics {
  rmse: number | null;
  mae: number | null;
  bias: number | null;
  correlation: number | null;
}

export interface PredictionResponse {
  requested_location: Location;
  selected_grid_location: Location;
  date: string;
  surface: SurfaceData;
  depths: number[];
  predicted_temperature: number[];
  reference_temperature: (number | null)[] | null;
  error: (number | null)[] | null;
  absolute_error: (number | null)[] | null;
  metrics: PredictionMetrics | null;
}
