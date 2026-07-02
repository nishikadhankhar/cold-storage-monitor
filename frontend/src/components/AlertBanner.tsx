import type { DeviceReading } from "../hooks/useLiveReadings";

type Props = { readings: Record<string, DeviceReading> };

export function AlertBanner({ readings }: Props) {
  const alerts: { level: "alert" | "warn"; msg: string }[] = [];

  for (const r of Object.values(readings)) {
    const name = r.name || r.device_id;

    // DS18 consensus
    if (r.ds18_consensus === "alert") {
      alerts.push({ level: "alert", msg: `${name}: DS18 probes critically diverged` });
    } else if (r.ds18_consensus === "warn") {
      alerts.push({ level: "warn", msg: `${name}: DS18 probe temperature divergence detected` });
    }

    // Individual DS18 probes above threshold
    for (const probe of r.ds18_probes ?? []) {
      if (probe.status === "alert")
        alerts.push({ level: "alert", msg: `${name} › ${probe.id} (${probe.address}): ${probe.value.toFixed(1)}°C — critical` });
      else if (probe.status === "warn")
        alerts.push({ level: "warn",  msg: `${name} › ${probe.id} (${probe.address}): ${probe.value.toFixed(1)}°C — rising` });
    }

    // BME sensors
    if (r.humidity?.status === "alert")
      alerts.push({ level: "alert", msg: `${name}: humidity critical (${r.humidity.value.toFixed(1)}%)` });
    else if (r.humidity?.status === "warn")
      alerts.push({ level: "warn",  msg: `${name}: humidity rising (${r.humidity.value.toFixed(1)}%)` });

    if (r.gas_resistance?.status === "alert")
      alerts.push({ level: "alert", msg: `${name}: gas resistance critical (${Math.round(r.gas_resistance.value).toLocaleString()} Ω)` });
    else if (r.gas_resistance?.status === "warn")
      alerts.push({ level: "warn",  msg: `${name}: gas resistance dropping (${Math.round(r.gas_resistance.value).toLocaleString()} Ω)` });
  }

  if (alerts.length === 0) return null;

  const hasAlert = alerts.some((a) => a.level === "alert");

  return (
    <div style={{
      background: hasAlert ? "#450a0a" : "#1c1400",
      border: `1px solid ${hasAlert ? "#7c2d12" : "#92400e"}`,
      borderRadius: 10, padding: "12px 20px", marginBottom: 20,
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <span style={{ fontSize: 20 }}>{hasAlert ? "🚨" : "⚠️"}</span>
      <div>
        <div style={{ color: hasAlert ? "#fca5a5" : "#fcd34d", fontWeight: 700, marginBottom: 6 }}>
          {hasAlert ? "Active Alerts" : "Warnings"}
        </div>
        {alerts.map((a, i) => (
          <div key={i} style={{ color: a.level === "alert" ? "#fca5a5" : "#fcd34d", fontSize: 13, marginBottom: 2 }}>
            {a.level === "alert" ? "🔴" : "🟡"} {a.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
