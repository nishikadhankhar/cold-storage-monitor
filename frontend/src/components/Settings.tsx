import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Thresholds = {
  id: number;
  temp_warn: number;
  temp_alert: number;
  hum_warn: number;
  hum_alert: number;
  gas_warn: number;
  gas_alert: number;
  gas_baseline: number | null;
};

const API = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : `https://${window.location.host}`;

export function Settings({ onClose }: { onClose: () => void }) {
  const [t, setT] = useState<Thresholds | null>(null);
  const [warnPct, setWarnPct]   = useState(40);
  const [alertPct, setAlertPct] = useState(60);
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("thresholds").select("*").single().then(({ data }) => {
      if (data) {
        const d = data as Thresholds;
        setT(d);
        if (d.gas_baseline) {
          setWarnPct(Math.round((1 - d.gas_warn / d.gas_baseline) * 100));
          setAlertPct(Math.round((1 - d.gas_alert / d.gas_baseline) * 100));
        }
      }
      setLoading(false);
    });
  }, []);

  async function save() {
    if (!t) return;
    const baseline = t.gas_baseline ?? t.gas_warn;
    const gas_warn  = baseline * (1 - warnPct  / 100);
    const gas_alert = baseline * (1 - alertPct / 100);

    const payload = {
      temp_warn: t.temp_warn, temp_alert: t.temp_alert,
      hum_warn:  t.hum_warn,  hum_alert:  t.hum_alert,
      gas_warn, gas_alert,
    };
    await supabase.from("thresholds").update({
      ...payload, updated_at: new Date().toISOString(),
    }).eq("id", t.id);
    await fetch(`${API}/api/thresholds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function numField(label: string, value: number, onChange: (v: number) => void, unit: string, step = 0.5) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <label style={{ color: "#94a3b8", fontSize: 13, width: 220 }}>{label}</label>
        <input
          type="number" step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            background: "#0f1117", border: "1px solid #334155", color: "#e2e8f0",
            borderRadius: 8, padding: "8px 12px", fontSize: 14, width: 110,
          }}
        />
        <span style={{ color: "#475569", fontSize: 13 }}>{unit}</span>
      </div>
    );
  }

  const baseline = t?.gas_baseline;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }}>
      <div style={{
        background: "#1e2538", border: "2px solid #334155", borderRadius: 16,
        padding: "32px 36px", width: 500, fontFamily: "system-ui", maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#f1f5f9", fontSize: 18, margin: 0 }}>⚙ Threshold Settings</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {loading ? <p style={{ color: "#475569" }}>Loading…</p> : (
          <>
            <p style={{ color: "#7c3aed", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 16 }}>TEMPERATURE (°C)</p>
            {numField("Warn above", t!.temp_warn,  v => setT(p => p && ({ ...p, temp_warn: v })),  "°C")}
            {numField("Alert above", t!.temp_alert, v => setT(p => p && ({ ...p, temp_alert: v })), "°C")}

            <p style={{ color: "#7c3aed", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 16, marginTop: 8 }}>HUMIDITY (%)</p>
            {numField("Warn above", t!.hum_warn,  v => setT(p => p && ({ ...p, hum_warn: v })),  "%")}
            {numField("Alert above", t!.hum_alert, v => setT(p => p && ({ ...p, hum_alert: v })), "%")}

            <p style={{ color: "#7c3aed", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8, marginTop: 8 }}>GAS RESISTANCE — % DROP FROM BASELINE</p>
            {baseline ? (
              <p style={{ color: "#475569", fontSize: 12, marginBottom: 14 }}>
                Baseline: <span style={{ color: "#94a3b8" }}>{Math.round(baseline).toLocaleString()} Ω</span>
                &nbsp;·&nbsp; Warn at: <span style={{ color: "#f59e0b" }}>{Math.round(baseline * (1 - warnPct/100)).toLocaleString()} Ω</span>
                &nbsp;·&nbsp; Alert at: <span style={{ color: "#ef4444" }}>{Math.round(baseline * (1 - alertPct/100)).toLocaleString()} Ω</span>
              </p>
            ) : (
              <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 14 }}>
                ⚠ No baseline set — use "Set Gas Baseline" button on the dashboard first
              </p>
            )}
            {numField("Warn when drop exceeds", warnPct,  setWarnPct,  "% drop", 1)}
            {numField("Alert when drop exceeds", alertPct, setAlertPct, "% drop", 1)}

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
              <button onClick={save} style={{
                background: "#7c3aed", color: "white", border: "none",
                borderRadius: 8, padding: "10px 28px", fontSize: 14, cursor: "pointer", fontWeight: 600,
              }}>Save</button>
              {saved && <span style={{ color: "#34d399", fontSize: 13 }}>✓ Saved!</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
