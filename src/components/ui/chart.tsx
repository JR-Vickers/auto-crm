import * as React from "react"
import { BarChart as RechartsBarChart, LineChart as RechartsLineChart, Bar, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts"

interface ChartData {
  name: string;
  value: number;
}

interface ChartProps {
  data: ChartData[];
  height?: number;
}

export function BarChart({ data, height = 350 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <RechartsTooltip />
        <Bar dataKey="value" fill="#6366f1" />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function LineChart({ data, height = 350 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <RechartsTooltip />
        <Line type="monotone" dataKey="value" stroke="#6366f1" />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
} 