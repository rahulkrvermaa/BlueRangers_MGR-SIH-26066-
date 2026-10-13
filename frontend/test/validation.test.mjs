import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const BACKEND_URL = 'https://bluerangers-mgr-sih-26066.onrender.com';

const STUDY_DOMAIN = {
  minLat: 5.125,
  maxLat: 29.875,
  minLon: 45.125,
  maxLon: 104.875,
};

function isWithinDomain(lat, lon, domain = STUDY_DOMAIN) {
  if (typeof lat !== 'number' || isNaN(lat)) return false;
  if (typeof lon !== 'number' || isNaN(lon)) return false;
  return lat >= domain.minLat && lat <= domain.maxLat && lon >= domain.minLon && lon <= domain.maxLon;
}

function isMaskedLandPrediction(response) {
  if (!response) return true;
  if (response.surface?.sst === null || response.surface?.sst === undefined) return true;
  if (Array.isArray(response.predicted_temperature)) {
    return response.predicted_temperature.every((p) => p === null || isNaN(p));
  }
  return true;
}

describe('Domain & Boundary Validations', () => {
  it('accepts valid coordinates within the North Indian Ocean domain', () => {
    assert.strictEqual(isWithinDomain(15.5, 65.5), true, 'Arabian Sea coordinate should be valid');
    assert.strictEqual(isWithinDomain(15.5, 88.5), true, 'Bay of Bengal coordinate should be valid');
    assert.strictEqual(isWithinDomain(5.125, 45.125), true, 'Southwest corner should be valid');
    assert.strictEqual(isWithinDomain(29.875, 104.875), true, 'Northeast corner should be valid');
  });

  it('rejects coordinates outside the trained domain', () => {
    assert.strictEqual(isWithinDomain(4.0, 65.5), false, 'Latitude < 5.125 should be rejected');
    assert.strictEqual(isWithinDomain(31.0, 65.5), false, 'Latitude > 29.875 should be rejected');
    assert.strictEqual(isWithinDomain(15.5, 40.0), false, 'Longitude < 45.125 should be rejected');
    assert.strictEqual(isWithinDomain(15.5, 110.0), false, 'Longitude > 104.875 should be rejected');
    assert.strictEqual(isWithinDomain(NaN, 65.5), false, 'NaN latitude should be rejected');
    assert.strictEqual(isWithinDomain(15.5, undefined), false, 'Undefined longitude should be rejected');
  });
});

describe('Masked / Land Point Detection', () => {
  it('correctly flags land or masked cell as masked', () => {
    const landResponse = {
      surface: { sst: null, sss: null, ssh: null },
      predicted_temperature: [null, null, null],
    };
    assert.strictEqual(isMaskedLandPrediction(landResponse), true);
  });

  it('correctly recognizes valid open-ocean predictions', () => {
    const validResponse = {
      surface: { sst: 30.2, sss: 36.5, ssh: 0.1 },
      predicted_temperature: [30.1, 29.5, 28.0],
    };
    assert.strictEqual(isMaskedLandPrediction(validResponse), false);
  });
});

describe('Live Deployed Backend Contract Tests', () => {
  it('GET /health returns 200 OK and valid status', async () => {
    const res = await fetch(`${BACKEND_URL}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.model, 'OceanEmbed CNN');
  });

  it('GET /metadata returns verified domain parameters and depth levels', async () => {
    const res = await fetch(`${BACKEND_URL}/metadata`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.deepStrictEqual(data.depth_levels, [
      0.0, 5.0, 10.0, 20.0, 30.0, 50.0, 75.0, 100.0, 125.0, 150.0, 200.0, 300.0, 500.0, 700.0, 1000.0,
    ]);
    assert.strictEqual(data.variables.length, 7);
    assert.strictEqual(data.dates.available.length, 15);
  });

  it('POST /predict returns real temperature profile for Arabian Sea', async () => {
    const res = await fetch(`${BACKEND_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2025-06-10',
        latitude: 15.5,
        longitude: 65.5,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.depths.length, 15);
    assert.strictEqual(data.predicted_temperature.length, 15);
    assert.strictEqual(data.reference_temperature.length, 15);

    // Verify temperatures decrease with depth in tropical ocean
    const surfaceTemp = data.predicted_temperature[0];
    const deepTemp = data.predicted_temperature[14];
    assert.ok(surfaceTemp > 25, 'Surface temp should be > 25°C');
    assert.ok(deepTemp < 15, 'Deep 1000m temp should be < 15°C');
    assert.ok(surfaceTemp > deepTemp, 'Surface should be warmer than 1000m');

    // Verify metrics exist
    assert.ok(data.metrics !== null, 'Metrics should exist for valid ocean point');
    assert.ok(data.metrics.rmse > 0 && data.metrics.rmse < 5, 'RMSE should be in reasonable range');
  });

  it('POST /predict returns masked response for land point without crashing', async () => {
    const res = await fetch(`${BACKEND_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2025-06-10',
        latitude: 22.0,
        longitude: 77.0, // Central India
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.surface.sst, null);
    assert.strictEqual(isMaskedLandPrediction(data), true);
  });
});

