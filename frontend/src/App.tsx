import { useLiveReadings } from "./hooks/useLiveReadings";
import { AlertBanner } from "./components/AlertBanner";
import type { DS18Probe } from "./hooks/useLiveReadings";

const STATUS_COLOR  = { ok: "#34d399", warn: "#f59e0b", alert: "#ef4444" };
const STATUS_BG     = { ok: "#1e2538", warn: "#2a2010", alert: "#2d1515" };
const STATUS_BORDER = { ok: "#334155", warn: "#92400e", alert: "#7c2d12" };

function SensorColumn({ probe }: { probe: DS18Probe }) {
  const s = probe.status ?? "ok";
  return (
    <div style={{
      flex: 1,
      background: STATUS_BG[s],
      border: `2px solid ${STATUS_BORDER[s]}`,
      borderRadius: 14,
      padding: "32px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
    }}>
      {/* Name */}
      <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em" }}>
        {probe.id.toUpperCase()}
      </div>

      {/* Glowing dot */}
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        background: STATUS_COLOR[s],
        boxShadow: `0 0 12px ${STATUS_COLOR[s]}`,
      }}/>

      {/* Temperature — big */}
      <div style={{ color: STATUS_COLOR[s], fontSize: 52, fontWeight: 800, lineHeight: 1 }}>
        {probe.value.toFixed(2)}
        <span style={{ fontSize: 22, fontWeight: 500, marginLeft: 6 }}>°C</span>
      </div>

      {/* Address */}
      <div style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", textAlign: "center" }}>
        {probe.address}
      </div>
    </div>
  );
}

export default function App() {
  const readings = useLiveReadings();
  const deviceIds = Object.keys(readings);
  const connected = deviceIds.length > 0;

  // Only use the first (real) device
  const device = connected ? readings[deviceIds[0]] : null;
  const probes: DS18Probe[] = device?.ds18_probes ?? [];
  const bme = device;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f1117",
      color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "28px 32px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>
          ❄️ Cold Storage Monitor
        </h1>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#1e2538", border: "1px solid #334155",
          borderRadius: 20, padding: "6px 14px", fontSize: 12,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: connected ? "#34d399" : "#ef4444",
            display: "inline-block",
            boxShadow: connected ? "0 0 6px #34d399" : "none",
          }}/>
          <span style={{ color: connected ? "#34d399" : "#ef4444" }}>
            {connected ? "Live" : "Connecting…"}
          </span>
        </div>
      </div>

      <AlertBanner readings={readings} />

      {!connected && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#334155" }}>
          <div style={{ fontSize: 48 }}>📡</div>
          <div style={{ fontSize: 16, marginTop: 12 }}>Waiting for device…</div>
        </div>
      )}

      {connected && (
        <>
          {/* 4 DS18 columns */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            {probes.map((probe) => (
              <SensorColumn key={probe.address} probe={probe} />
            ))}
          </div>

          {/* BME688 row */}
          {bme && (
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{
                flex: 1, background: STATUS_BG[bme.humidity?.status ?? "ok"],
                border: `2px solid ${STATUS_BORDER[bme.humidity?.status ?? "ok"]}`,
                borderRadius: 14, padding: "24px 20px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              }}>
                <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>💧 HUMIDITY</div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: STATUS_COLOR[bme.humidity?.status ?? "ok"], boxShadow: `0 0 10px ${STATUS_COLOR[bme.humidity?.status ?? "ok"]}` }}/>
                <div style={{ color: STATUS_COLOR[bme.humidity?.status ?? "ok"], fontSize: 48, fontWeight: 800, lineHeight: 1 }}>
                  {bme.humidity?.value.toFixed(1)}<span style={{ fontSize: 20, marginLeft: 4 }}>%</span>
                </div>
              </div>

              <div style={{
                flex: 1, background: STATUS_BG[bme.gas_resistance?.status ?? "ok"],
                border: `2px solid ${STATUS_BORDER[bme.gas_resistance?.status ?? "ok"]}`,
                borderRadius: 14, padding: "24px 20px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              }}>
                <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>⚗ GAS RESISTANCE</div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: STATUS_COLOR[bme.gas_resistance?.status ?? "ok"], boxShadow: `0 0 10px ${STATUS_COLOR[bme.gas_resistance?.status ?? "ok"]}` }}/>
                <div style={{ color: STATUS_COLOR[bme.gas_resistance?.status ?? "ok"], fontSize: 48, fontWeight: 800, lineHeight: 1 }}>
                  {bme.gas_resistance ? Math.round(bme.gas_resistance.value).toLocaleString() : "—"}
                  <span style={{ fontSize: 20, marginLeft: 4 }}>Ω</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
