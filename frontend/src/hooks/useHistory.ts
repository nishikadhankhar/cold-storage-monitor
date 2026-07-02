import { useEffect, useState } from "react";
import type { DeviceReading } from "./useLiveReadings";

export function useHistory(deviceId: string | null) {
  const [data, setData] = useState<DeviceReading[]>([]);

  useEffect(() => {
    if (!deviceId) { setData([]); return; }
    fetch(`http://localhost:8000/devices/${deviceId}/history?limit=120`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData([]));
  }, [deviceId]);

  return data;
}
