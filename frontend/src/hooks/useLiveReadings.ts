import { useEffect, useRef, useState } from "react";

export type SensorValue = {
  value: number;
  unit: string;
  status: "ok" | "warn" | "alert";
};

export type DS18Probe = {
  id: string;       // "Sensor 1" etc.
  address: string;  // "28:FF:A1:01"
  value: number;
  unit: string;
  status: "ok" | "warn" | "alert";
};

export type DeviceReading = {
  device_id: string;
  name: string;
  bme_address: string;
  timestamp: number;
  humidity: SensorValue;
  gas_resistance: SensorValue;
  ds18_probes: DS18Probe[];
  ds18_consensus: "ok" | "warn" | "alert";
};

const WS_URL = window.location.hostname === "localhost"
  ? "ws://localhost:8000/ws/live"
  : `wss://${window.location.host}/ws/live`;

const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : `https://${window.location.host}`;

export function useLiveReadings() {
  const [readings, setReadings] = useState<Record<string, DeviceReading>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const retryDelay = useRef(1000);

  // Poll /devices every 5s as fallback
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/devices`);
        const data: DeviceReading[] = await res.json();
        if (Array.isArray(data)) {
          const map: Record<string, DeviceReading> = {};
          data.forEach(d => { if (d.device_id) map[d.device_id] = d; });
          setReadings(map);
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket for real-time updates
  useEffect(() => {
    let cancelled = false;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => { retryDelay.current = 1000; };

      ws.onmessage = (e) => {
        const data: DeviceReading = JSON.parse(e.data);
        if (data.device_id) {
          setReadings((prev) => ({ ...prev, [data.device_id]: data }));
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setTimeout(connect, retryDelay.current);
        retryDelay.current = Math.min(retryDelay.current * 2, 15000);
      };
    }

    connect();
    return () => { cancelled = true; wsRef.current?.close(); };
  }, []);

  return readings;
}
