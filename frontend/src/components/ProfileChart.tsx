import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProfileChartProps {
  depths: number[];
  predicted: number[];
  reference: (number | null)[] | null;
}

export const ProfileChart: React.FC<ProfileChartProps> = ({ depths, predicted, reference }) => {
  const data = depths.map((d, i) => ({
    depth: d,
    OceanEmbed: predicted[i],
    GLORYS: reference ? reference[i] : null
  }));

  return (
    <div className="h-[500px] w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" domain={['auto', 'auto']} tickFormatter={(v) => `${v.toFixed(1)}°C`} />
          <YAxis dataKey="depth" type="number" reversed label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value: any) => `${Number(value).toFixed(2)} °C`}
            labelFormatter={(label) => `Depth: ${label} m`}
          />
          <Legend />
          <Line type="monotone" dataKey="OceanEmbed" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          {reference && reference.some(v => v !== null) && (
            <Line type="monotone" dataKey="GLORYS" stroke="#64748b" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 3 }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
