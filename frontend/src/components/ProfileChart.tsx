import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ProfileChartProps {
  depths: number[];
  predicted: (number | null)[];
  reference: (number | null)[] | null;
  locationLabel?: string;
}

export const ProfileChart: React.FC<ProfileChartProps> = ({
  depths,
  predicted,
  reference,
  locationLabel,
}) => {
  // Check if there are valid predictions
  const hasValidPredictions = predicted.some((p) => p !== null && !isNaN(p));
  const hasValidReference =
    Boolean(reference && reference.some((r) => r !== null && !isNaN(r)));

  if (!hasValidPredictions) {
    return (
      <div className="h-[480px] w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3 text-xl font-bold">
          ⚠️
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          No Ocean Temperature Profile Available
        </h3>
        <p className="text-sm text-slate-500 max-w-md">
          The selected coordinate is located on land or within a masked coastal cell where open-ocean satellite observations cannot reconstruct a vertical profile.
        </p>
      </div>
    );
  }

  // Format data points for vertical layout:
  // In Recharts layout="vertical", Y-axis represents depth and X-axis represents temperature values.
  const chartData = depths.map((depth, idx) => {
    const predVal = predicted[idx];
    const refVal = reference ? reference[idx] : null;

    return {
      depth,
      OceanEmbed: predVal !== null && !isNaN(predVal) ? Number(predVal.toFixed(3)) : null,
      GLORYS: refVal !== null && !isNaN(refVal) ? Number(refVal.toFixed(3)) : null,
    };
  });

  return (
    <div className="h-[480px] w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">
            Vertical Temperature vs Depth Profile (0–1000 m)
          </h3>
          {locationLabel && (
            <p className="text-xs text-slate-500">{locationLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-medium border border-sky-200">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            OceanEmbed CNN
          </span>
          {hasValidReference && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              GLORYS Reanalysis
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            layout="vertical"
            margin={{ top: 15, right: 25, left: 15, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="number"
              domain={['auto', 'auto']}
              unit="°C"
              tickFormatter={(v: number) => `${v.toFixed(1)}°C`}
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{
                value: 'Temperature (°C)',
                position: 'insideBottom',
                offset: -15,
                fill: '#475569',
                fontSize: 12,
                fontWeight: 500,
              }}
            />
            <YAxis
              dataKey="depth"
              type="number"
              reversed
              domain={[0, 1000]}
              ticks={[0, 50, 100, 150, 200, 300, 500, 700, 1000]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{
                value: 'Depth (m)',
                angle: -90,
                position: 'insideLeft',
                offset: 5,
                fill: '#475569',
                fontSize: 12,
                fontWeight: 500,
              }}
            />
            <Tooltip
              formatter={(value: unknown, name: unknown) => {
                if (typeof value === 'number') {
                  const label = name === 'OceanEmbed' ? 'OceanEmbed (Predicted)' : 'GLORYS (Target Reanalysis)';
                  return [`${value.toFixed(2)} °C`, label];
                }
                return ['N/A', String(name)];
              }}
              labelFormatter={(depth) => `Depth: ${depth} m`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="OceanEmbed"
              name="OceanEmbed CNN"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#0284c7' }}
              activeDot={{ r: 5.5 }}
              connectNulls={false}
            />
            {hasValidReference && (
              <Line
                type="monotone"
                dataKey="GLORYS"
                name="GLORYS Target"
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={{ r: 3, fill: '#64748b' }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
