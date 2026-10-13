export interface Location {
  latitude: number;
  longitude: number;
}

export interface SurfaceData {
  sst: number | null;
  sss: number | null;
  ssh: number | null;
  current_u: number | null;
  current_v: number | null;
  wind_u: number | null;
  wind_v: number | null;
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
  predicted_temperature: (number | null)[];
  reference_temperature: (number | null)[] | null;
  error: (number | null)[] | null;
  absolute_error: (number | null)[] | null;
  metrics: PredictionMetrics | null;
}

export interface StudyRegion {
  latitude: [number, number];
  longitude: [number, number];
}

export interface DateCoverage {
  start: string;
  end: string;
  available: string[];
}

export interface MetadataResponse {
  study_region: StudyRegion;
  grid_resolution: string;
  dates: DateCoverage;
  depth_levels: number[];
  variables: string[];
  patch_size: number;
  model_name: string;
  supported_demonstration_period: string;
}

export interface HealthResponse {
  status: string;
  model: string;
}
