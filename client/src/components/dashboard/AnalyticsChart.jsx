import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Provide some mock data until backend is fully wired for time-series attendance
const defaultData = [
  { name: 'Mon', present: 85, absent: 15 },
  { name: 'Tue', present: 88, absent: 12 },
  { name: 'Wed', present: 92, absent: 8 },
  { name: 'Thu', present: 86, absent: 14 },
  { name: 'Fri', present: 95, absent: 5 },
  { name: 'Sat', present: 70, absent: 30 },
];

const AnalyticsChart = ({ data = defaultData }) => {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" />
          <Area 
            type="monotone" 
            dataKey="present" 
            stroke="#10B981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPresent)" 
            name="Present (%)"
          />
          <Area 
            type="monotone" 
            dataKey="absent" 
            stroke="#EF4444" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorAbsent)" 
            name="Absent (%)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;
