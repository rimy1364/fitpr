"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { formatDate } from "@/lib/utils";

interface Props {
  checkIns: { date: string; weight: number }[];
  measurements: { date: Date; waist: number | null; chest: number | null; arms: number | null; hips: number | null; thighs: number | null }[];
  startWeight: number | null;
  targetWeight: number | null;
}

export function ProgressCharts({ checkIns, measurements, startWeight, targetWeight }: Props) {
  const weightData = checkIns.map((c) => ({
    date: formatDate(c.date, "MMM d"),
    weight: c.weight,
  }));

  const measurementData = measurements.map((m) => ({
    date: formatDate(m.date, "MMM d"),
    waist: m.waist,
    chest: m.chest,
    arms: m.arms,
    hips: m.hips,
    thighs: m.thighs,
  }));

  return (
    <div className="space-y-6">
      {startWeight && targetWeight && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-muted-foreground">Start</p>
                <p className="text-xl font-bold">{startWeight} kg</p>
              </div>
              <div className="text-center text-muted-foreground">→</div>
              <div className="text-right">
                <p className="text-muted-foreground">Target</p>
                <p className="text-xl font-bold text-primary">{targetWeight} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Weight Over Time</CardTitle></CardHeader>
        <CardContent>
          {weightData.length < 2 ? (
            <p className="text-center text-muted-foreground py-8">
              Log at least 2 check-ins to see your weight chart.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                <Tooltip />
                {targetWeight && (
                  <ReferenceLine y={targetWeight} stroke="#22c55e" strokeDasharray="4 4"
                    label={{ value: "Target", position: "right", fontSize: 11 }} />
                )}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {measurementData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Body Measurements (cm)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={measurementData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                <Tooltip />
                {[
                  { key: "waist", color: "#3b82f6" },
                  { key: "chest", color: "#10b981" },
                  { key: "hips", color: "#f59e0b" },
                  { key: "arms", color: "#8b5cf6" },
                  { key: "thighs", color: "#ef4444" },
                ].map(({ key, color }) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={color}
                    strokeWidth={2} dot={{ r: 3 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
