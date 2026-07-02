import type { DeviceReading, SensorValue, DS18Probe } from "../hooks/useLiveReadings";

const STATUS_COLOR: Record<string, string> = {
  ok:    "#34d399",
  warn:  "#f59e0b",
  alert: "#ef4444",
};
const STATUS_BG: Record<string, string> = {
  ok:    "#1e2538",
  warn:  "#2a2010",
  alert: "#2d1515",
};
const STATUS_BORDER: Record<string, string> = {
  ok:    "#334155",
  warn:  "#92400e",
  alert: "#7c2d12",
};
const STATUS_ICON: Record<string, string> = { ok: "🟢", warn: "🟡", alert: "🔴" };

function worstOf(...statuses: (string | undefined)[]): "ok" | "warn" | "alert" {
  if (statuses.includes("alert")) return "alert";
  if (statuses.includes("warn"))  return "warn";
  return "ok";
}

// ── BME scalar row ────────────────────────────────────────────────────────────
function SensorRow({ label, s, decimals = 1 }: { label: string; s: SensorValue | undefined; decimals?: number }) {
  if (!s) return null;
  const color = STATUS_COLOR[s.status] ?? "#94a3b8";
  const formatted = decimals === 0 ? Math.round(s.value).toLocaleString() : s.value.toFixed(decimals);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1e293b" }}>
      <span style={{ color: "#94a3b8", fontSize: 13 }}>{label}</span>
      <span style={{ color, fontWeight: 700, fontSize: 13 }}>
        {formatted} {s.unit} {STATUS_ICON[s.status] !== STATUS_ICON.ok ? STATUS_ICON[s.status] : ""}
      </span>
    </div>
  );
}

// ── DS18 probe group ──────────────────────────────────────────────────────────
function DS18Group({ probes, consensus }: { probes: DS18Probe[]; consensus: string }) {
  if (!probes?.length) return null;

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Group header with consensus indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "5px 0", borderBottom: "1px solid #1e293b", marginBottom: 2,
      }}>
        <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em" }}>
          DS18B20 PROBES
        </span>
        <span style={{ fontSize: 10 }}>{STATUS_ICON[consensus]}</span>
        {consensus !== "ok" && (
          <span style={{ color: STATUS_COLOR[consensus], fontSize: 10, fontWeight: 600 }}>
            {consensus === "warn" ? "DIVERGENCE" : "CRITICAL"}
          </span>
        )}
        {consensus === "ok" && (
          <span style={{ color: "#475569", fontSize: 10 }}>all agree</span>
        )}
      </div>

      {/* Individual probe rows */}
      {probes.map((probe) => (
        <div
          key={probe.address}
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "4px 0 4px 8px", borderBottom: "1px solid #0f172a",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Status dot */}
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: STATUS_COLOR[probe.status],
              display: "inline-block",
              boxShadow: probe.status !== "ok" ? `0 0 5px ${STATUS_COLOR[probe.status]}` : "none",
              flexShrink: 0,
            }}/>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{probe.id}</span>
            <span style={{
              fontSize: 9, color: "#475569", fontFamily: "monospace",
              background: "#0f172a", border: "1px solid #1e293b",
              borderRadius: 3, padding: "1px 4px",
            }}>
              {probe.address}
            </span>
          </div>
          <span style={{
            color: STATUS_COLOR[probe.status], fontWeight: 700, fontSize: 13,
          }}>
            {probe.value.toFixed(2)} °C
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Device card ───────────────────────────────────────────────────────────────
type Props = { reading: DeviceReading; selected: boolean; onClick: () => void };

export function DeviceCard({ reading, selected, onClick }: Props) {
  const worst = worstOf(
    reading.ds18_consensus,
    reading.humidity?.status,
    reading.gas_resistance?.status,
  );

  const age = Math.max(0, Math.round(Date.now() / 1000 - reading.timestamp));

  return (
    <div
      onClick={onClick}
      style={{
        background: STATUS_BG[worst],
        border: `2px solid ${selected ? "#7c3aed" : STATUS_BORDER[worst]}`,
        borderRadius: 12,
        padding: "16px 20px",
        minWidth: 290,
        cursor: "pointer",
        transition: "border-color 0.15s",
        boxShadow: selected ? "0 0 0 3px #7c3aed44" : "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ color: worst === "alert" ? "#fca5a5" : "#5eead4", fontWeight: 700, fontSize: 15 }}>
          {reading.name || reading.device_id}
        </span>
        <span style={{ fontSize: 10, color: "#475569" }}>
          {age < 10 ? "live" : `${age}s ago`}
        </span>
      </div>

      {/* Address chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 10, color: "#64748b", fontFamily: "monospace",
          background: "#0f172a", border: "1px solid #1e293b",
          borderRadius: 4, padding: "1px 6px",
        }}>
          {reading.device_id}
        </span>
        {reading.bme_address && (
          <span style={{
            fontSize: 10, color: "#818cf8", fontFamily: "monospace",
            background: "#1e1b4b", border: "1px solid #3730a3",
            borderRadius: 4, padding: "1px 6px",
          }}>
            BME I²C {reading.bme_address}
          </span>
        )}
      </div>

      {/* DS18B20 probe group */}
      <DS18Group probes={reading.ds18_probes} consensus={reading.ds18_consensus} />

      {/* BME680 sensors */}
      <div style={{ marginTop: 4 }}>
        <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", padding: "5px 0 3px", borderBottom: "1px solid #1e293b" }}>
          BME680
        </div>
        <SensorRow label="💧 Humidity"       s={reading.humidity} />
        <SensorRow label="⚗ Gas Resistance"  s={reading.gas_resistance} decimals={0} />
      </div>
    </div>
  );
}
