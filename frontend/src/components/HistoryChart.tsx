import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { DeviceReading } from "../hooks/useLiveReadings";

type Props = { data: DeviceReading[]; deviceName: string };

function fmt(ts: number) {
  const d = new Date(ts * 1000);
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`;
}

const PROBE_COLORS = ["#34d399", "#6ee7b7", "#a7f3d0"];

export function HistoryChart({ data, deviceName }: Props) {
  const chartData = data.map((r) => {
    const point: Record<string, number | string | undefined> = {
      time: fmt(r.timestamp),
      "Humidity (%)": r.humidity?.value,
      "Gas (kΩ)":     r.gas_resistance ? +(r.gas_resistance.value / 1000).toFixed(1) : undefined,
    };
    (r.ds18_probes ?? []).forEach((p) => {
      point[p.id] = p.value;
    });
    return point;
  });

  // Derive probe names from first data point that has them
  const probeNames = (data[0]?.ds18_probes ?? []).map((p) => p.id);

  return (
    <div style={{ background: "#1e2538", borderRadius: 12, padding: "20px 24px", marginTop: 8 }}>
      <h3 style={{ color: "#5eead4", margin: "0 0 16px", fontSize: 14 }}>
        {deviceName} — sensor history
        <span style={{ color: "#475569", fontWeight: 400, marginLeft: 10, fontSize: 12 }}>
          DS18 °C · Humidity % · Gas kΩ
        </span>
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "#475569", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#0f1117", border: "1px solid #334155", borderRadius: 8 }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          {probeNames.map((name, i) => (
            <Line key={name} type="monotone" dataKey={name}
              stroke={PROBE_COLORS[i % PROBE_COLORS.length]}
              dot={false} strokeWidth={2} />
          ))}
          <Line type="monotone" dataKey="Humidity (%)" stroke="#60a5fa" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="Gas (kΩ)"     stroke="#f59e0b" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
