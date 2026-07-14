# ❄️ Cold Storage Onion Monitoring System

An IoT monitoring system for onion cold storage that tracks temperature, humidity,
and decay gases in real time — with a live cloud dashboard, local dashboard,
TFT display, LED indicators, and buzzer alerts.

**Live dashboard:** https://cold-storage-monitor.onrender.com

## How It Works

ESP32 reads all sensors every 2 seconds → posts data to the cloud backend →
dashboard updates live. Decayed onions release ammonia and H2S, which cause a
measurable drop in the BME688's gas resistance reading.

## Hardware

| Component | Purpose | Connection |
|---|---|---|
| ESP32 DevKit V1 (30-pin) | Main controller | — |
| 4× DS18B20 waterproof probes | Temperature at multiple zones | GPIO15 (OneWire, shared bus, 4.7kΩ pullup) |
| BME688 | Humidity + gas resistance (decay detection) | I2C — SDA=GPIO21, SCL=GPIO22, addr 0x76 |
| 1.8" TFT 128×160 (ST7735) | Local display | SPI — CS=5, DC=26, RST=27, DIN=23, CLK=18, BL=3V3 |
| Buzzer (low-trigger) | Audible alert | GPIO32 |
| Green/Red LEDs ×2 pairs | Temp + humidity status | GPIO13/12 (temp), GPIO4/2 (humidity) |

## Software Stack

- **Firmware:** Arduino (ESP32) — `blink/blink.ino`
- **Backend:** FastAPI + WebSocket, deployed on Render — `backend/main.py`
- **Frontend:** React + TypeScript + Vite — `frontend/`
- **Auth & storage:** Supabase (login/signup, thresholds, gas baseline)

## Features

- Live dashboard (WebSocket + polling fallback) accessible from anywhere
- Multi-user login/signup
- Adjustable thresholds from the dashboard — synced to the ESP32 within seconds
- Gas baseline calibration: one click sets baseline; warn/alert auto-set at
  40%/60% drop
- Local dashboard served by the ESP32 itself at http://192.168.1.100
- LEDs, buzzer, and TFT react to threshold breaches on-device

## Running Locally

**Backend**
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

**Frontend**
cd frontend
npm install
npm run dev

**Firmware:** open `blink/blink.ino` in Arduino IDE, select "ESP32 Dev Module",
install libraries (OneWire, DallasTemperature, BME68x, ArduinoJson,
Adafruit GFX, Adafruit ST7735), update WiFi credentials, upload.

## Deployment

Pushing to `main` auto-deploys to Render (config in `render.yaml`).
Frontend must be built and copied into `backend/static/` before pushing:
