import dgram from 'dgram';
import { WebSocketServer } from 'ws';
import express from 'express';
import { parseForzaPacket } from './parser.js';
import path from 'path';

const UDP_PORT = parseInt(process.env.UDP_PORT || '5607', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '8080', 10);

const app = express();

// Serve static files from 'public' directory (useful for single docker container deployment)
app.use(express.static(path.join(process.cwd(), 'public')));

const server = app.listen(WS_PORT, () => {
  console.log(`[HTTP/WS] Server listening on port ${WS_PORT}`);
});

// Set up WebSocket server
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  console.log(`[WS] Client connected. Total clients: ${wss.clients.size}`);
  clients.add(ws);

  // Send initial status
  ws.send(JSON.stringify({
    type: 'status',
    payload: {
      udpPort: UDP_PORT,
      simulatorActive: simInterval !== null,
      liveActive: liveActive
    }
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'toggle_simulator') {
        if (data.value) {
          startSimulator();
        } else {
          stopSimulator();
        }
        broadcastStatus();
      }
    } catch (err) {
      console.error('[WS] Error parsing client message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Remaining clients: ${wss.clients.size}`);
  });
});

function broadcast(data) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) { // WebSocket.OPEN is 1
      client.send(payload);
    }
  }
}

function broadcastStatus() {
  broadcast({
    type: 'status',
    payload: {
      udpPort: UDP_PORT,
      simulatorActive: simInterval !== null,
      liveActive: liveActive
    }
  });
}

// Set up UDP server
const udpSocket = dgram.createSocket('udp4');
let liveActive = false;
let lastUdpTime = 0;

udpSocket.on('message', (msg) => {
  liveActive = true;
  lastUdpTime = Date.now();
  
  // If simulator is active, automatically stop it when real telemetry arrives
  if (simInterval !== null) {
    console.log('[UDP] Real telemetry detected, stopping simulator.');
    stopSimulator();
    broadcastStatus();
  }

  const telemetry = parseForzaPacket(msg);
  if (telemetry) {
    broadcast({
      type: 'telemetry',
      payload: telemetry
    });
  }
});

udpSocket.on('listening', () => {
  const address = udpSocket.address();
  console.log(`[UDP] Socket listening on ${address.address}:${address.port}`);
});

udpSocket.on('error', (err) => {
  console.error('[UDP] Socket error:', err);
});

udpSocket.bind(UDP_PORT);

// Check if live telemetry is still active
setInterval(() => {
  if (liveActive && Date.now() - lastUdpTime > 3000) {
    liveActive = false;
    console.log('[UDP] No telemetry received for 3 seconds. Status set to inactive.');
    broadcastStatus();
  }
}, 1000);

// Simulator logic
let simInterval = null;
let simData = {
  isRaceOn: true,
  timestampMs: 0,
  engineMaxRpm: 8000,
  engineIdleRpm: 900,
  currentEngineRpm: 900,
  accelerationX: 0,
  accelerationY: 0,
  accelerationZ: 0,
  velocityX: 0,
  velocityY: 0,
  velocityZ: 0,
  angularVelocityX: 0,
  angularVelocityY: 0,
  angularVelocityZ: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
  normalizedSuspensionTravelFl: 0.5,
  normalizedSuspensionTravelFr: 0.5,
  normalizedSuspensionTravelRl: 0.5,
  normalizedSuspensionTravelRr: 0.5,
  tireSlipRatioFl: 0,
  tireSlipRatioFr: 0,
  tireSlipRatioRl: 0,
  tireSlipRatioRr: 0,
  wheelRotationSpeedFl: 0,
  wheelRotationSpeedFr: 0,
  wheelRotationSpeedRl: 0,
  wheelRotationSpeedRr: 0,
  wheelOnRumbleStripFl: 0,
  wheelOnRumbleStripFr: 0,
  wheelOnRumbleStripRl: 0,
  wheelOnRumbleStripRr: 0,
  wheelInPuddleDepthFl: 0,
  wheelInPuddleDepthFr: 0,
  wheelInPuddleDepthRl: 0,
  wheelInPuddleDepthRr: 0,
  surfaceRumbleFl: 0,
  surfaceRumbleFr: 0,
  surfaceRumbleRl: 0,
  surfaceRumbleRr: 0,
  tireSlipAngleFl: 0,
  tireSlipAngleFr: 0,
  tireSlipAngleRl: 0,
  tireSlipAngleRr: 0,
  tireCombinedSlipFl: 0,
  tireCombinedSlipFr: 0,
  tireCombinedSlipRl: 0,
  tireCombinedSlipRr: 0,
  suspensionTravelMetersFl: 0.2,
  suspensionTravelMetersFr: 0.2,
  suspensionTravelMetersRl: 0.2,
  suspensionTravelMetersRr: 0.2,
  carOrdinal: 1,
  carClass: 3, // S1 class
  carPerformanceIndex: 900,
  drivetrainType: 2, // AWD
  numCylinders: 6,
  
  carGroup: 0,
  smashableVelDiff: 0,
  smashableMass: 0,
  
  positionX: 0,
  positionY: 0,
  positionZ: 0,
  speed: 0,
  power: 0,
  torque: 0,
  tireTempFl: 80,
  tireTempFr: 80,
  tireTempRl: 80,
  tireTempRr: 80,
  boost: 0,
  fuel: 100,
  distanceTraveled: 0,
  bestLap: 72.4,
  lastLap: 74.8,
  currentLap: 0,
  currentRaceTime: 0,
  lapNumber: 1,
  racePosition: 4,
  accel: 0,
  brake: 0,
  clutch: 0,
  handbrake: 0,
  gear: 11, // Neutral
  steer: 0,
  normalizedDrivingLine: 0,
  normalizedAiBrake: 0
};

let simState = {
  phase: 'idle', // idle, accelerating, cruising, braking, shifting
  gear: 1,
  speedKmh: 0,
  rpm: 900,
  throttle: 0,
  brake: 0,
  clutch: 0,
  shiftingTime: 0,
  lapTime: 0,
  distance: 0,
  yaw: 0
};

function startSimulator() {
  if (simInterval !== null) return;
  console.log('[SIM] Starting telemetry simulator...');
  
  simState = {
    phase: 'accelerating',
    gear: 1,
    speedKmh: 0,
    rpm: 900,
    throttle: 100,
    brake: 0,
    clutch: 0,
    shiftingTime: 0,
    lapTime: 0,
    distance: 0,
    yaw: 0
  };

  simInterval = setInterval(() => {
    updateSimulatorState();
    
    // Convert speed back to m/s
    const speedMs = (simState.speedKmh / 3.6);
    // Sim horsepower = torque * rpm / 5252
    const simulatedHp = (simState.throttle / 100) * (350 + Math.sin(simState.rpm / 1000) * 150);
    const watts = simulatedHp * 745.7;
    const nmTorque = simState.rpm > 0 ? (watts / (simState.rpm * 2 * Math.PI / 60)) : 0;

    simData.timestampMs += 16;
    simData.currentEngineRpm = simState.rpm;
    simData.speed = speedMs;
    simData.power = watts;
    simData.torque = nmTorque;
    simData.gear = simState.gear;
    simData.accel = Math.round(simState.throttle * 2.55);
    simData.brake = Math.round(simState.brake * 2.55);
    simData.clutch = Math.round(simState.clutch * 2.55);
    simData.steer = Math.round(Math.sin(simData.timestampMs / 1000) * 45);
    simData.boost = Math.max(0, (simState.throttle / 100) * 1.4 * (simState.rpm / 5000));
    simData.currentRaceTime = simState.lapTime;
    simData.currentLap = simState.lapTime;
    simData.distanceTraveled = simState.distance;

    // Simulate tire temperatures
    const tempHeat = (simState.speedKmh / 100) * (simState.throttle / 100) * 0.1;
    const cooling = 0.02;
    simData.tireTempFl = Math.min(220, Math.max(80, (simData.tireTempFl || 80) + tempHeat - cooling + Math.abs(simData.steer || 0) * 0.005));
    simData.tireTempFr = Math.min(220, Math.max(80, (simData.tireTempFr || 80) + tempHeat - cooling + Math.abs(simData.steer || 0) * 0.005));
    simData.tireTempRl = Math.min(220, Math.max(80, (simData.tireTempRl || 80) + tempHeat * 1.2 - cooling));
    simData.tireTempRr = Math.min(220, Math.max(80, (simData.tireTempRr || 80) + tempHeat * 1.2 - cooling));

    // Simulate suspension movement
    simData.normalizedSuspensionTravelFl = 0.5 + Math.sin(simData.timestampMs / 200) * 0.1 - (simData.accelerationY || 0) * 0.1;
    simData.normalizedSuspensionTravelFr = 0.5 + Math.cos(simData.timestampMs / 200) * 0.1 - (simData.accelerationY || 0) * 0.1;
    simData.normalizedSuspensionTravelRl = 0.5 - Math.sin(simData.timestampMs / 200) * 0.1 + (simData.accelerationY || 0) * 0.1;
    simData.normalizedSuspensionTravelRr = 0.5 - Math.cos(simData.timestampMs / 200) * 0.1 + (simData.accelerationY || 0) * 0.1;

    // Tire combined slip
    const lateralSlip = Math.abs(simData.steer || 0) / 127;
    simData.tireCombinedSlipFl = lateralSlip + (simState.brake > 50 ? 0.4 : 0);
    simData.tireCombinedSlipFr = lateralSlip + (simState.brake > 50 ? 0.4 : 0);
    simData.tireCombinedSlipRl = (simState.throttle > 80 && simState.gear <= 2 ? 0.6 : 0);
    simData.tireCombinedSlipRr = (simState.throttle > 80 && simState.gear <= 2 ? 0.6 : 0);

    broadcast({
      type: 'telemetry',
      payload: simData
    });
  }, 16);
}

function stopSimulator() {
  if (simInterval === null) return;
  console.log('[SIM] Stopping telemetry simulator.');
  clearInterval(simInterval);
  simInterval = null;
}

function updateSimulatorState() {
  simState.lapTime += 0.016;
  simState.distance += (simState.speedKmh / 3.6) * 0.016;

  if (simState.lapTime > 75) {
    simState.lapTime = 0;
    simData.lapNumber = (simData.lapNumber || 1) + 1;
    simData.lastLap = 74.8 + Math.random() * 2 - 1;
    simData.racePosition = Math.max(1, Math.min(12, (simData.racePosition || 4) + (Math.random() > 0.6 ? -1 : Math.random() > 0.8 ? 1 : 0)));
  }

  const gearRatios = [0, 60, 110, 160, 210, 260, 310, 360];

  if (simState.phase === 'accelerating') {
    simState.throttle = 100;
    simState.brake = 0;
    simState.clutch = 0;

    const accelerationRate = (8 - simState.gear) * 0.15;
    simState.speedKmh += accelerationRate;

    const currentGearMaxSpeed = gearRatios[simState.gear];
    const prevGearMaxSpeed = gearRatios[simState.gear - 1] || 0;
    const speedRange = currentGearMaxSpeed - prevGearMaxSpeed;
    const speedInCurrentGear = simState.speedKmh - prevGearMaxSpeed;
    
    simState.rpm = 2000 + (speedInCurrentGear / speedRange) * (7800 - 2000);

    if (simState.rpm >= 7600) {
      if (simState.gear < 6) {
        simState.phase = 'shifting';
        simState.shiftingTime = 0;
      } else {
        simState.phase = 'cruising';
      }
    }
  } else if (simState.phase === 'shifting') {
    simState.throttle = 0;
    simState.clutch = 100;
    simState.rpm -= 400;
    simState.shiftingTime += 0.016;

    if (simState.shiftingTime >= 0.15) {
      simState.gear += 1;
      simState.phase = 'accelerating';
    }
  } else if (simState.phase === 'cruising') {
    simState.throttle = 35 + Math.sin(simState.lapTime) * 5;
    simState.brake = 0;
    simState.rpm = 6800 + Math.sin(simState.lapTime) * 100;
    
    if (simState.lapTime > 45 && simState.lapTime < 60) {
      simState.phase = 'braking';
    }
  } else if (simState.phase === 'braking') {
    simState.throttle = 0;
    simState.brake = 80;
    
    simState.speedKmh -= 2.2;
    
    if (simState.speedKmh < 80) {
      simState.speedKmh = 80;
      simState.gear = 2;
      simState.rpm = 3500;
      simState.phase = 'accelerating';
    } else {
      const currentGearMaxSpeed = gearRatios[simState.gear];
      const prevGearMaxSpeed = gearRatios[simState.gear - 1] || 0;
      
      if (simState.speedKmh < prevGearMaxSpeed + 10 && simState.gear > 2) {
        simState.gear -= 1;
      }
      
      const speedInCurrentGear = simState.speedKmh - prevGearMaxSpeed;
      const speedRange = currentGearMaxSpeed - prevGearMaxSpeed;
      simState.rpm = 2500 + (speedInCurrentGear / speedRange) * (5000 - 2500);
    }
  }
}
