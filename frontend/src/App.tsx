import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { Auth } from "./components/Auth";
import { Settings } from "./components/Settings";
import { AlertBanner } from "./components/AlertBanner";
import { useLiveReadings } from "./hooks/useLiveReadings";
import type { DS18Probe, DeviceReading } from "./hooks/useLiveReadings";
import type { User } from "@supabase/supabase-js";

const API = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : `https://${window.location.host}`;

const STATUS_COLOR  = { ok: "#34d399", warn: "#f59e0b", alert: "#ef4444" };
const STATUS_BG     = { ok: "#1e2538", warn: "#2a2010", alert: "#2d1515" };
const STATUS_BORDER = { ok: "#334155", warn: "#92400e", alert: "#7c2d12" };

function SensorColumn({ probe }: { probe: DS18Probe }) {
  const s = probe.status ?? "ok";
  return (
    <div style={{
      flex: 1, background: STATUS_BG[s], border: `2px solid ${STATUS_BORDER[s]}`,
      borderRadius: 14, padding: "32px 20px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
    }}>
      <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em" }}>
        {probe.id.toUpperCase()}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        background: STATUS_COLOR[s], boxShadow: `0 0 12px ${STATUS_COLOR[s]}`,
      }}/>
      <div style={{ color: STATUS_COLOR[s], fontSize: 52, fontWeight: 800, lineHeight: 1 }}>
        {probe.value.toFixed(2)}
        <span style={{ fontSize: 22, fontWeight: 500, marginLeft: 6 }}>°C</span>
      </div>
      {s !== "ok" && (
        <div style={{ color: STATUS_COLOR[s], fontSize: 11, fontWeight: 700 }}>
          ⚠ {s.toUpperCase()}
        </div>
      )}
      <div style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", textAlign: "center" }}>
        {probe.address}
      </div>
    </div>
  );
}

function BMECard({ label, value, unit, status }: { label: string; value: string; unit: string; status: string }) {
  const s = (status ?? "ok") as "ok" | "warn" | "alert";
  return (
    <div style={{
      flex: 1, background: STATUS_BG[s], border: `2px solid ${STATUS_BORDER[s]}`,
      borderRadius: 14, padding: "24px 20px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    }}>
      <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>{label}</div>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: STATUS_COLOR[s], boxShadow: `0 0 10px ${STATUS_COLOR[s]}` }}/>
      <div style={{ color: STATUS_COLOR[s], fontSize: 48, fontWeight: 800, lineHeight: 1 }}>
        {value}<span style={{ fontSize: 20, marginLeft: 4 }}>{unit}</span>
      </div>
      {s !== "ok" && (
        <div style={{ color: STATUS_COLOR[s], fontSize: 11, fontWeight: 700 }}>⚠ {s.toUpperCase()}</div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrateMsg, setCalibrateMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function calibrateBaseline() {
    if (!device?.gas_resistance?.value) return;
    const baseline = device.gas_resistance.value;
    const gas_warn  = Math.round(baseline * 0.60); // 40% drop
    const gas_alert = Math.round(baseline * 0.40); // 60% drop
    setCalibrating(true);
    // Save baseline + auto-calculated thresholds to Supabase
    const { data } = await supabase.from("thresholds").select("id").single();
    if (data) {
      await supabase.from("thresholds").update({
        gas_baseline: baseline, gas_warn, gas_alert,
        updated_at: new Date().toISOString(),
      }).eq("id", data.id);
    }
    // Sync to backend
    await fetch(`${API}/api/thresholds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gas_warn, gas_alert }),
    });
    setCalibrating(false);
    setCalibrateMsg(`Baseline set: ${Math.round(baseline).toLocaleString()} Ω — warn <${gas_warn.toLocaleString()} Ω, alert <${gas_alert.toLocaleString()} Ω`);
    setTimeout(() => setCalibrateMsg(""), 6000);
  }

  const readings = useLiveReadings();
  const deviceIds = Object.keys(readings);
  const connected = deviceIds.length > 0;
  const device: DeviceReading | null = connected ? readings[deviceIds[0]] : null;
  const probes: DS18Probe[] = device?.ds18_probes ?? [];

  if (authLoading) return null;
  if (!user) return <Auth onAuth={() => {}} />;

  return (
    <div style={{
      minHeight: "100vh", background: "#0f1117", color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif", padding: "28px 32px",
    }}>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>
          ❄️ Cold Storage Monitor
        </h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setShowSettings(true)} style={{
            background: "#1e2538", border: "1px solid #334155", color: "#94a3b8",
            borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer",
          }}>⚙ Settings</button>
          <button onClick={() => supabase.auth.signOut()} style={{
            background: "#1e2538", border: "1px solid #334155", color: "#94a3b8",
            borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer",
          }}>Sign Out</button>
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
      </div>

      <AlertBanner readings={readings} />

      {!connected ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#334155" }}>
          <div style={{ fontSize: 48 }}>📡</div>
          <div style={{ fontSize: 16, marginTop: 12 }}>Waiting for device…</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            {probes.map(probe => <SensorColumn key={probe.address} probe={probe} />)}
          </div>
          {device && (
            <>
              <div style={{ display: "flex", gap: 16 }}>
                <BMECard
                  label="💧 HUMIDITY"
                  value={device.humidity?.value.toFixed(1) ?? "—"}
                  unit="%"
                  status={device.humidity?.status ?? "ok"}
                />
                <BMECard
                  label="⚗ GAS RESISTANCE"
                  value={device.gas_resistance ? Math.round(device.gas_resistance.value).toLocaleString() : "—"}
                  unit="Ω"
                  status={device.gas_resistance?.status ?? "ok"}
                />
              </div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <button
                  onClick={calibrateBaseline}
                  disabled={calibrating || !device.gas_resistance?.value}
                  style={{
                    background: "#1e2538", border: "2px solid #7c3aed", color: "#a78bfa",
                    borderRadius: 10, padding: "10px 20px", fontSize: 13,
                    cursor: "pointer", fontWeight: 600,
                  }}
                >
                  {calibrating ? "Setting baseline…" : "🎯 Set Gas Baseline (Calibrate Now)"}
                </button>
                {calibrateMsg && (
                  <span style={{ color: "#34d399", fontSize: 13 }}>✓ {calibrateMsg}</span>
                )}
              </div>
              <p style={{ color: "#475569", fontSize: 11, marginTop: 6 }}>
                Place sensor in fresh air first, then click to set baseline. Warn = 40% drop, Alert = 60% drop.
              </p>
            </>
          )}
        </>
      )}

      <p style={{ color: "#1e2538", fontSize: 11, marginTop: 24, textAlign: "right" }}>
        {user.email}
      </p>
    </div>
  );
}
