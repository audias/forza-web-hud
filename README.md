# Forza Web HUD

A real-time, responsive web-based Head-Up Display (HUD) for telemetry data from Forza Horizon (4/5/6) and Forza Motorsport. 

This project receives binary UDP telemetry packets directly from the game's "Data Out" stream, parses them using a lightweight Node.js parser, and streams the updates to a gorgeous, neon-themed cyberpunk dashboard built using **Vue 3** and **Vanilla CSS**.

```
  +-------------------------+             +--------------------------+             +-------------------------+
  |  Forza Horizon Game     |             |  Node.js Backend Server  |             |  Vue 3 Web Browser Client|
  |  (UDP Telemetry stream) | ----------> |  - Parses UDP Packets    | ----------> |  - Dashboard Interface  |
  |  Default Port: 5607     |             |  - WebSocket broadcaster |             |  - Default: KM/H        |
  +-------------------------+             +--------------------------+             +-------------------------+
```

---

## Features

- **Circular SVG Tachometer (RPM Arc)**: Smooth visual dial matching the car's RPM and limit with redline warning flashers.
- **Speedometer**: Central indicator showing current speed in **KM/H (default)** or **MPH** (toggled dynamically).
- **Driver Pedals & Steering**: Highly responsive vertical throttle (green) and brake (red) indicator bars, and horizontal steering angle indicator.
- **Tyre telemetry**: Live Tyre Temperatures (color-coded for Cold, Optimal, Warm, Overheating) and Tyre Slip ratios.
- **Race Timing & Info**: Position, current lap, lap number, best lap, last lap, and drivetrain (FWD/RWD/AWD) metrics.
- **Interactive Simulator**: Built-in developer testing mode allowing offline testing without loading the game.

---

## Configuration & Game Setup

To enable the game telemetry feed:
1. Open Forza Horizon and navigate to **Settings** > **HUD and Gameplay**.
2. Scroll to the bottom and find **Data Out**. Set it to **ON**.
3. Set **Data Out IP Address** to your computer's IP address (use `127.0.0.1` if running on the same PC).
4. Set **Data Out Port** to your configured UDP port (default is `5607`).

---

## Running with Docker (Recommended)

You can run the entire stack (both frontend and backend) inside a single lightweight Docker container using Docker Compose:

### 1. Build and Start
```bash
docker compose up --build
```

### 2. Access the HUD
Open your browser and navigate to:
**[http://localhost:8080/](http://localhost:8080/)**

---

## Running Locally for Development

To run the frontend and backend in development mode separately:

### Prerequisites
- Node.js (v20 or higher recommended)
- npm (v10 or higher)

### 1. Backend Server Setup
1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (runs with native file watching and loads `.env` configuration):
   ```bash
   npm run dev
   ```
   *The server listens on **UDP Port 5607** (telemetry) and **WebSocket Port 8080**.*

### 2. Frontend client Setup
1. Navigate to the `frontend/` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the client:
   ```bash
   npm run dev
   ```
4. Access the client at **[http://localhost:5173/](http://localhost:5173/)**

---

## Customizing Ports

The backend ports are fully configurable via the environment variables in **`backend/.env`**:
- `UDP_PORT`: Port to listen for Forza UDP telemetry packets (default: `5607`).
- `WS_PORT`: Port to run the WebSocket and static Express server on (default: `8080`).

### Dynamic Frontend Connection
To connect the Web HUD client to a custom backend port, append `?wsPort=XXXX` to the dashboard URL:
*Example: `http://localhost:5173/?wsPort=9090`*
