import type { DS18Probe } from "../hooks/useLiveReadings";

const STATUS_COLOR  = { ok: "#34d399", warn: "#f59e0b", alert: "#ef4444" };
const STATUS_BG     = { ok: "#1e2538", warn: "#2a2010", alert: "#2d1515" };
const STATUS_BORDER = { ok: "#334155", warn: "#92400e", alert: "#7c2d12" };
const STATUS_LABEL  = { ok: "NORMAL",  warn: "WARNING", alert: "CRITICAL" };

type Props = { probe: DS18Probe };

export function SensorColumn({ probe }: Props) {
  const s = probe.status ?? "ok";
  const color  = STATUS_COLOR[s];
  const isOk   = s === "ok";

  return (
    <div style={{
      flex: 1,
      minWidth: 180,
      background: STATUS_BG[s],
      border: `2px solid ${STATUS_BORDER[s]}`,
      borderRadius: 14,
      padding: "24px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
    }}>
      {/* Sensor name */}
      <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em" }}>
        {probe.id.toUpperCase()}
      </div>

      {/* Status dot */}
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        background: color,
        boxShadow: `0 0 ${isOk ? 6 : 12}px ${color}`,
      }}/>

      {/* Temperature — big */}
      <div style={{
        color,
        fontSize: 42,
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: "-1px",
      }}>
        {probe.value.toFixed(1)}
        <span style={{ fontSize: 20, fontWeight: 500, marginLeft: 4 }}>°C</span>
      </div>

      {/* Status label */}
      <div style={{
        background: isOk ? "#0f172a" : STATUS_BG[s],
        border: `1px solid ${STATUS_BORDER[s]}`,
        borderRadius: 20,
        padding: "3px 14px",
        fontSize: 11,
        fontWeight: 700,
        color,
        letterSpacing: "0.08em",
      }}>
        {STATUS_LABEL[s]}
      </div>

      {/* Address */}
      <div style={{
        fontSize: 9,
        color: "#334155",
        fontFamily: "monospace",
        textAlign: "center",
        wordBreak: "break-all",
      }}>
        {probe.address}
      </div>
    </div>
  );
}
