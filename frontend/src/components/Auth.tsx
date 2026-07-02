import { useState } from "react";
import { supabase } from "../lib/supabase";

export function Auth({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handle() {
    setError("");
    setMessage("");
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onAuth();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account, then log in.");
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0f1117", display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: "system-ui",
    }}>
      <div style={{
        background: "#1e2538", border: "2px solid #334155", borderRadius: 16,
        padding: "40px 36px", width: 360,
      }}>
        <h1 style={{ color: "#f1f5f9", fontSize: 22, marginBottom: 6 }}>❄️ Cold Storage Monitor</h1>
        <p style={{ color: "#475569", fontSize: 13, marginBottom: 28 }}>
          {mode === "login" ? "Sign in to your account" : "Create a new account"}
        </p>

        <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>EMAIL</label>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={inputStyle}
        />

        <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, marginTop: 14, display: "block" }}>PASSWORD</label>
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
          onKeyDown={e => e.key === "Enter" && handle()}
        />

        {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>{error}</p>}
        {message && <p style={{ color: "#34d399", fontSize: 13, marginTop: 12 }}>{message}</p>}

        <button onClick={handle} disabled={loading} style={btnStyle}>
          {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Sign Up"}
        </button>

        <p style={{ color: "#475569", fontSize: 13, marginTop: 20, textAlign: "center" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}
            style={{ color: "#7c3aed", cursor: "pointer" }}
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </span>
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", marginTop: 6, marginBottom: 4,
  background: "#0f1117", border: "1px solid #334155", color: "#e2e8f0",
  borderRadius: 8, padding: "10px 12px", fontSize: 14, boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  width: "100%", marginTop: 20,
  background: "#7c3aed", color: "white", border: "none",
  borderRadius: 8, padding: "12px", fontSize: 15, cursor: "pointer", fontWeight: 600,
};
