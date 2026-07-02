"""
Device simulator — publishes sensor readings for 3 devices over MQTT.
Each device has:
  - 3x DS18B20 probes (temperature only, 1-Wire)
  - 1x BME680 (humidity + gas resistance)
device_003 drifts over a sine cycle to trigger warnings/alerts.
"""
import json
import math
import random
import time

import paho.mqtt.client as mqtt

BROKER = "localhost"

DEVICES = {
    "device_001": {
        "name": "Cold Room A",
        "bme_address": "0x76",
        "ds18_addresses": ["28:FF:A1:01", "28:FF:A1:02", "28:FF:A1:03"],
        "ds18_gpio": 15,
        "base_temp": 24.0,
        "base_hum":  55.0,
        "base_gas":  45000,
    },
    "device_002": {
        "name": "Freezer B",
        "bme_address": "0x77",
        "ds18_addresses": ["28:FF:B2:01", "28:FF:B2:02", "28:FF:B2:03"],
        "base_temp": 22.0,
        "base_hum":  50.0,
        "base_gas":  52000,
    },
    "device_003": {
        "name": "Dock C",
        "bme_address": "0x76",
        "ds18_addresses": ["28:FF:C3:01", "28:FF:C3:02", "28:FF:C3:03"],
        "base_temp": 26.0,
        "base_hum":  60.0,
        "base_gas":  38000,
    },
}

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.connect(BROKER, 1883, keepalive=60)
client.loop_start()

tick = 0
print("[sim] publishing to broker — Ctrl+C to stop")

try:
    while True:
        for device_id, cfg in DEVICES.items():
            # device_003 drifts on a sine wave (±6°C, 24-tick cycle ≈ 72s)
            drift = 0.0
            if device_id == "device_003":
                drift = 6.0 * math.sin(tick * math.pi / 24)

            base = cfg["base_temp"] + drift

            # DS18B20 probes — all near the same base temp with tiny noise.
            # On device_003 probe 3 gets an extra +3°C spike to demo divergence.
            probe_drift = 3.0 * math.sin(tick * math.pi / 12) if device_id == "device_003" else 0.0
            ds18_temps = [
                round(base + random.uniform(-0.15, 0.15), 2),
                round(base + random.uniform(-0.15, 0.15), 2),
                round(base + probe_drift + random.uniform(-0.15, 0.15), 2),  # probe 3 can diverge
            ]

            hum = cfg["base_hum"] + (drift * 1.5) + random.uniform(-0.5, 0.5)
            gas = cfg["base_gas"] + random.uniform(-500, 500)

            payload = {
                "device_id":   device_id,
                "bme_address": cfg["bme_address"],
                "timestamp":   int(time.time()),
                # BME680 readings
                "humidity":       {"value": round(hum, 2), "unit": "%"},
                "gas_resistance": {"value": round(gas, 0), "unit": "Ω"},
                # DS18B20 probes — list of {address, value, unit}
                "ds18_probes": [
                    {"id": f"Sensor {i+1}", "address": cfg["ds18_addresses"][i],
                     "value": ds18_temps[i], "unit": "C"}
                    for i in range(3)
                ],
            }
            topic = f"devices/{device_id}/sensors"
            client.publish(topic, json.dumps(payload), qos=1, retain=True)
            print(
                f"[{device_id}] DS18: {ds18_temps[0]:.1f} / {ds18_temps[1]:.1f} / {ds18_temps[2]:.1f}°C  "
                f"hum={hum:.1f}%  gas={gas:.0f}Ω"
            )

        tick += 1
        time.sleep(3)
except KeyboardInterrupt:
    print("[sim] stopped")
    client.loop_stop()
    client.disconnect()
