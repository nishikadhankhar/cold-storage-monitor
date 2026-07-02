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
};

export function Settings({ onClose }: { onClose: () => void }) {
  const [t, setT] = useState<Thresholds | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("thresholds").select("*").single().then(({ data }) => {
      if (data) setT(data as Thresholds);
      setLoading(false);
    });
  }, []);

  async function save() {
    if (!t) return;
    await supabase.from("thresholds").update({
      temp_warn: t.temp_warn, temp_alert: t.temp_alert,
      hum_warn: t.hum_warn,   hum_alert: t.hum_alert,
      gas_warn: t.gas_warn,   gas_alert: t.gas_alert,
      updated_at: new Date().toISOString(),
    }).eq("id", t.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function field(label: string, key: keyof Thresholds, unit: string) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <label style={{ color: "#94a3b8", fontSize: 13, width: 220 }}>{label}</label>
        <input
          type="number" step="0.5"
          value={t ? (t[key] as number) : ""}
          onChange={e => t && setT({ ...t, [key]: parseFloat(e.target.value) })}
          style={{
            background: "#0f1117", border: "1px solid #334155", color: "#e2e8f0",
            borderRadius: 8, padding: "8px 12px", fontSize: 14, width: 110,
          }}
        />
        <span style={{ color: "#475569", fontSize: 13 }}>{unit}</span>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }}>
      <div style={{
        background: "#1e2538", border: "2px solid #334155", borderRadius: 16,
        padding: "32px 36px", width: 480, fontFamily: "system-ui",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#f1f5f9", fontSize: 18, margin: 0 }}>⚙ Threshold Settings</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {loading ? <p style={{ color: "#475569" }}>Loading…</p> : (
          <>
            <p style={{ color: "#7c3aed", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 16 }}>TEMPERATURE (°C)</p>
            {field("Warn above", "temp_warn", "°C")}
            {field("Alert above", "temp_alert", "°C")}

            <p style={{ color: "#7c3aed", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 16, marginTop: 8 }}>HUMIDITY (%)</p>
            {field("Warn above", "hum_warn", "%")}
            {field("Alert above", "hum_alert", "%")}

            <p style={{ color: "#7c3aed", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 16, marginTop: 8 }}>GAS RESISTANCE (Ω)</p>
            {field("Warn below", "gas_warn", "Ω")}
            {field("Alert below", "gas_alert", "Ω")}

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
