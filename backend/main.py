import json
import os
from collections import defaultdict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

# ── In-memory store ───────────────────────────────────────────────────────────
latest: dict[str, dict] = {}
history: dict[str, list] = defaultdict(list)
MAX_HISTORY = 500

DEVICE_NAMES = {
    "device_001": "Cold Room A",
}

THRESHOLDS = {
    "humidity":       {"warn": 65.0,  "alert": 80.0,  "invert": False},
    "gas_resistance": {"warn": 50000, "alert": 10000, "invert": True},
    "ds18_temp":      {"warn": 28.0,  "alert": 32.0,  "invert": False},
}

# Mutable thresholds updated via /api/thresholds
thresholds_store = {
    "temp_warn": 28.0, "temp_alert": 32.0,
    "hum_warn":  65.0, "hum_alert":  80.0,
    "gas_warn":  50000,"gas_alert":  10000,
}

DS18_WARN_SPREAD  = 1.0
DS18_ALERT_SPREAD = 2.5
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


def scalar_status(sensor: str, value: float) -> str:
    s = thresholds_store
    if sensor == "humidity":
        if value >= s["hum_alert"]: return "alert"
        if value >= s["hum_warn"]:  return "warn"
    elif sensor == "gas_resistance":
        if value <= s["gas_alert"]: return "alert"
        if value <= s["gas_warn"]:  return "warn"
    elif sensor == "ds18_temp":
        if value >= s["temp_alert"]: return "alert"
        if value >= s["temp_warn"]:  return "warn"
    return "ok"


def ds18_consensus(probes: list[dict]) -> str:
    if not probes:
        return "ok"
    temps = [p["value"] for p in probes]
    spread = max(temps) - min(temps)
    per_probe = [scalar_status("ds18_temp", t) for t in temps]
    if "alert" in per_probe or spread >= DS18_ALERT_SPREAD: return "alert"
    if "warn"  in per_probe or spread >= DS18_WARN_SPREAD:  return "warn"
    return "ok"


def annotate(data: dict) -> dict:
    out = dict(data)
    for s in ("humidity", "gas_resistance"):
        if s in out and isinstance(out[s], dict):
            out[s]["status"] = scalar_status(s, out[s]["value"])
        elif s in out:
            out[s] = {"value": out[s], "unit": "%" if s == "humidity" else "Ω",
                      "status": scalar_status(s, out[s])}
    if "ds18_probes" in out:
        for probe in out["ds18_probes"]:
            probe["status"] = scalar_status("ds18_temp", probe["value"])
        out["ds18_consensus"] = ds18_consensus(out["ds18_probes"])
    out["name"] = DEVICE_NAMES.get(data.get("device_id", ""), data.get("device_id", "unknown"))
    return out


# ── WebSocket manager ─────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self._clients: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self._clients.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self._clients:
            self._clients.remove(ws)

    async def broadcast(self, payload: dict):
        dead = []
        for ws in self._clients:
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._clients.remove(ws)


manager = ConnectionManager()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ── API routes (must come before catch-all) ───────────────────────────────────
@app.post("/ingest")
async def ingest(request: Request):
    data = await request.json()
    device_id = data.get("device_id")
    if not device_id:
        return {"error": "missing device_id"}
    enriched = annotate(data)
    latest[device_id] = enriched
    h = history[device_id]
    h.append(enriched)
    if len(h) > MAX_HISTORY:
        h.pop(0)
    await manager.broadcast(enriched)
    return {"status": "ok", **thresholds_store}


@app.get("/devices")
def list_devices():
    return list(latest.values())


@app.get("/devices/{device_id}/latest")
def get_latest(device_id: str):
    return latest.get(device_id, {})


@app.get("/devices/{device_id}/history")
def get_history(device_id: str, limit: int = 200):
    return history[device_id][-limit:]


@app.websocket("/ws/live")
async def ws_live(ws: WebSocket):
    await manager.connect(ws)
    for reading in latest.values():
        await ws.send_text(json.dumps(reading))
    try:
        while True:
            await ws.receive_text()
    except (WebSocketDisconnect, Exception):
        manager.disconnect(ws)


# ── Thresholds API ───────────────────────────────────────────────────────────
@app.get("/api/thresholds")
def get_thresholds():
    return thresholds_store

@app.post("/api/thresholds")
async def set_thresholds(request: Request):
    data = await request.json()
    for key in thresholds_store:
        if key in data:
            thresholds_store[key] = float(data[key])
    return {"status": "ok", **thresholds_store}


# ── Static frontend ───────────────────────────────────────────────────────────
@app.get("/")
def serve_root():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/assets/{filename}")
def serve_assets(filename: str):
    return FileResponse(os.path.join(STATIC_DIR, "assets", filename))


@app.get("/favicon.svg")
def serve_favicon():
    return FileResponse(os.path.join(STATIC_DIR, "favicon.svg"))
