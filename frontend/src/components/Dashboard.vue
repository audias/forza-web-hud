<script setup>
import { ref, computed } from 'vue';
import { 
  Gauge, Zap, Clock, Flag, Activity 
} from '@lucide/vue';

// Define Props
const props = defineProps({
  telemetry: {
    type: Object,
    default: null
  },
  status: {
    type: Object,
    required: true
  },
  connectionState: {
    type: String,
    required: true
  }
});

// Emits
const emit = defineEmits(['toggle-simulator']);

// Reactive state
const useMph = ref(false); // Defaults to KM/H based on user feedback!

// Compute parsed telemetry object with defaults
const t = computed(() => {
  return props.telemetry || {
    isRaceOn: false,
    timestampMs: 0,
    engineMaxRpm: 8000,
    engineIdleRpm: 900,
    currentEngineRpm: 0,
    speed: 0,
    power: 0,
    torque: 0,
    boost: 0,
    fuel: 0,
    gear: 11,
    accel: 0,
    brake: 0,
    clutch: 0,
    handbrake: 0,
    steer: 0,
    lapNumber: 0,
    racePosition: 0,
    bestLap: 0,
    lastLap: 0,
    currentLap: 0,
    tireTempFl: 75,
    tireTempFr: 75,
    tireTempRl: 75,
    tireTempRr: 75,
    tireCombinedSlipFl: 0,
    tireCombinedSlipFr: 0,
    tireCombinedSlipRl: 0,
    tireCombinedSlipRr: 0,
    normalizedSuspensionTravelFl: 0.5,
    normalizedSuspensionTravelFr: 0.5,
    normalizedSuspensionTravelRl: 0.5,
    normalizedSuspensionTravelRr: 0.5,
    carPerformanceIndex: 100,
    carClass: 0,
    drivetrainType: 0,
    numCylinders: 4,
  };
});

// Speed Conversions
const displaySpeed = computed(() => {
  const speedMps = t.value.speed || 0;
  const speedUnitMultiplier = useMph.value ? 2.23694 : 3.6;
  return Math.round(speedMps * speedUnitMultiplier);
});

// Engine Dynamics
const displayHp = computed(() => Math.round((t.value.power || 0) / 745.7));
const displayTorque = computed(() => Math.round(t.value.torque || 0));
const boostPsi = computed(() => (t.value.boost || 0) * 14.5038);

// RPM gauge calculations (3/4 circle sweep)
const maxRpm = computed(() => t.value.engineMaxRpm || 8000);
const currentRpm = computed(() => t.value.currentEngineRpm || 0);
const rpmRatio = computed(() => Math.min(1, currentRpm.value / maxRpm.value));

const circumference = 2 * Math.PI * 80; // ~502.65
const arcLength = circumference * 0.75; // ~377
const strokeDashoffset = computed(() => arcLength - (arcLength * rpmRatio.value));

// LED Shift Lights
const shiftThresholdStart = 0.8;
const shiftThresholdRedline = 0.95;
const totalLeds = 10;
const currentLedProgress = computed(() => (rpmRatio.value - shiftThresholdStart) / (1 - shiftThresholdStart));
const activeLedsCount = computed(() => Math.max(0, Math.floor(currentLedProgress.value * totalLeds)));
const isRedlineFlashing = computed(() => rpmRatio.value >= shiftThresholdRedline);

// Helper functions (methods)
const formatTime = (secs) => {
  if (secs === undefined || secs === 0) return '--:--.---';
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  const wholeSecs = Math.floor(remainingSecs);
  const ms = Math.floor((remainingSecs - wholeSecs) * 1000);
  return `${mins.toString().padStart(2, '0')}:${wholeSecs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

const getGearDisplay = (gear) => {
  if (gear === undefined) return '-';
  if (gear === 0) return 'R';
  if (gear === 11) return 'N';
  return gear.toString();
};

const getCarClass = (carClass) => {
  if (carClass === undefined || carClass === -1) return 'D';
  const classes = ['D', 'C', 'B', 'A', 'S1', 'S2', 'X'];
  return classes[Math.min(carClass, classes.length - 1)];
};

const getDrivetrain = (drivetrain) => {
  if (drivetrain === undefined) return 'FWD';
  const types = ['FWD', 'RWD', 'AWD'];
  return types[Math.min(drivetrain, types.length - 1)];
};

const getTireTempColor = (temp) => {
  if (temp === undefined) return 'hsl(215, 10%, 45%)';
  if (temp < 120) return 'hsl(200, 80%, 55%)';
  if (temp < 195) return 'hsl(142, 70%, 50%)';
  if (temp < 225) return 'hsl(45, 90%, 55%)';
  return 'hsl(355, 85%, 55%)';
};
</script>

<template>
  <div style="width: 100%">
    <!-- HUD Header -->
    <header class="hud-header">
      <div class="hud-logo">
        <Gauge size="28" style="color: var(--color-cyan)" />
        FORZA HUD <span style="font-size: 0.9rem; color: var(--text-muted)">V6.0 (Vue)</span>
      </div>
      
      <div style="display: flex; gap: 1rem; align-items: center">
        <!-- Status Badges -->
        <span v-if="connectionState === 'connecting'" class="badge badge-warning">CONNECTING TO HOST</span>
        <span v-else-if="connectionState === 'disconnected'" class="badge badge-error">DISCONNECTED</span>
        <span v-else-if="status.liveActive" class="badge badge-success">LIVE TELEMETRY ACTIVE</span>
        <span v-else-if="status.simulatorActive" class="badge badge-info">SIMULATOR ACTIVE</span>
        <span v-else class="badge badge-inactive">WAITING FOR GAME</span>
        
        <button 
          class="btn"
          :class="status.simulatorActive ? 'btn-active-sim' : 'btn-outline'"
          @click="emit('toggle-simulator', !status.simulatorActive)"
          :disabled="connectionState !== 'connected' || status.liveActive"
        >
          {{ status.simulatorActive ? 'Stop Simulator' : 'Test Simulator' }}
        </button>
        
        <button 
          class="btn btn-outline"
          @click="useMph = !useMph"
        >
          Unit: {{ useMph ? 'MPH' : 'KM/H' }}
        </button>
      </div>
    </header>

    <!-- Main Grid -->
    <main class="hud-grid">
      
      <!-- Tachometer and Speedometer (Center Panel) -->
      <section 
        class="glass-panel col-6"
        :class="{
          'active-border-live': status.liveActive,
          'active-border-sim': status.simulatorActive
        }"
        style="grid-column: span 6; min-height: 380px; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 1.5rem"
      >
        <!-- LED Shift Lights -->
        <div style="display: flex; gap: 6px; margin-bottom: 1.5rem" :class="{ 'flash-critical': isRedlineFlashing }">
          <div 
            v-for="(_, index) in totalLeds" 
            :key="index"
            :style="{
              width: '28px',
              height: '8px',
              backgroundColor: index < activeLedsCount 
                ? (index < 4 ? 'var(--color-green)' : index < 7 ? 'var(--color-yellow)' : 'var(--color-red)')
                : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '2px',
              boxShadow: index < activeLedsCount
                ? `0 0 10px ${index < 4 ? 'var(--color-green)' : index < 7 ? 'var(--color-yellow)' : 'var(--color-red)'}`
                : 'none',
              transition: 'all 0.05s ease'
            }"
          />
        </div>

        <div style="position: relative; width: 220px; height: 220px">
          <!-- RPM Circular Arc -->
          <svg width="220" height="220" viewBox="0 0 200 200" style="transform: rotate(135deg); transform-origin: center">
            <!-- Background Arc -->
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.03)"
              stroke-width="10"
              :stroke-dasharray="`${arcLength} ${circumference}`"
              stroke-linecap="round"
            />
            <!-- Fill Arc -->
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="transparent"
              :stroke="isRedlineFlashing ? 'var(--color-red)' : 'var(--color-cyan)'"
              stroke-width="10"
              :stroke-dasharray="`${arcLength} ${circumference}`"
              :stroke-dashoffset="strokeDashoffset"
              stroke-linecap="round"
              style="transition: stroke-dashoffset 0.05s ease-out"
              :style="{
                filter: `drop-shadow(0 0 6px ${isRedlineFlashing ? 'var(--color-red)' : 'var(--color-cyan)'})`
              }"
            />
          </svg>

          <!-- Central Gear & Speed Info -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center
          ">
            <span 
              class="font-digital" 
              style="font-size: 4.5rem; line-height: 1"
              :style="{
                color: isRedlineFlashing ? 'var(--color-red)' : 'var(--text-primary)',
                textShadow: isRedlineFlashing ? '0 0 20px var(--color-red-glow)' : 'none'
              }"
            >
              {{ getGearDisplay(t.gear) }}
            </span>
            <span class="font-digital" style="font-size: 2rem; margin-top: 0.2rem; display: flex; align-items: baseline">
              {{ displaySpeed }}
              <span style="font-size: 0.8rem; font-family: var(--font-stats); font-weight: 500; margin-left: 4px; color: var(--text-secondary)">
                {{ useMph ? 'MPH' : 'KM/H' }}
              </span>
            </span>
          </div>
        </div>

        <!-- Redline Indicator / Engine RPM -->
        <div style="margin-top: 0.5rem; display: flex; gap: 1.5rem">
          <span style="font-size: 0.9rem; color: var(--text-secondary)">
            RPM: <span class="font-digital" :style="{ color: isRedlineFlashing ? 'var(--color-red)' : 'var(--color-cyan)' }">{{ Math.round(currentRpm) }}</span>
          </span>
          <span style="font-size: 0.9rem; color: var(--text-secondary)">
            LIMIT: <span class="font-digital">{{ Math.round(maxRpm) }}</span>
          </span>
        </div>

      </section>

      <!-- Throttle & Brake Pedals -->
      <section class="glass-panel col-2" style="display: flex; justify-content: space-around; padding: 1.5rem 1rem">
        <!-- Brake Pedal Indicator -->
        <div style="display: flex; flex-direction: column; align-items: center; height: 100%; gap: 0.5rem">
          <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600">BRAKE</span>
          <div class="gauge-bar-container" style="width: 24px; height: 240px">
            <div 
              class="gauge-bar-fill" 
              style="width: 100%; position: absolute; bottom: 0; background-color: var(--color-red); box-shadow: 0 0 10px var(--color-red-glow)"
              :style="{ height: `${(t.brake || 0) / 2.55}%` }"
            />
          </div>
          <span class="font-digital" style="color: var(--color-red)">{{ Math.round((t.brake || 0) / 2.55) }}%</span>
        </div>

        <!-- Throttle Pedal Indicator -->
        <div style="display: flex; flex-direction: column; align-items: center; height: 100%; gap: 0.5rem">
          <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600">THROTTLE</span>
          <div class="gauge-bar-container" style="width: 24px; height: 240px">
            <div 
              class="gauge-bar-fill" 
              style="width: 100%; position: absolute; bottom: 0; background-color: var(--color-green); box-shadow: 0 0 10px var(--color-green-glow)"
              :style="{ height: `${(t.accel || 0) / 2.55}%` }"
            />
          </div>
          <span class="font-digital" style="color: var(--color-green)">{{ Math.round((t.accel || 0) / 2.55) }}%</span>
        </div>
      </section>

      <!-- Live Dynamics / Performance Stats -->
      <section class="glass-panel col-4" style="display: flex; flex-direction: column; gap: 1.2rem; padding: 1.5rem">
        <h2 style="font-size: 1rem; letter-spacing: 0.08em; color: var(--text-secondary); display: flex; gap: 0.5rem; align-items: center">
          <Zap size="16" /> ENGINE DYNAMICS
        </h2>

        <!-- Power Widget -->
        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px">
            <span style="color: var(--text-secondary)">POWER</span>
            <span class="font-digital" style="color: var(--color-purple)">{{ displayHp }} <span style="font-size: 0.75rem; color: var(--text-muted)">HP</span></span>
          </div>
          <div class="gauge-bar-container" style="height: 6px">
            <div class="gauge-bar-fill" style="background-color: var(--color-purple)" :style="{ width: `${Math.min(100, (displayHp / 1000) * 100)}%` }" />
          </div>
        </div>

        {/* Torque Widget */}
        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px">
            <span style="color: var(--text-secondary)">TORQUE</span>
            <span class="font-digital" style="color: var(--color-yellow)">{{ displayTorque }} <span style="font-size: 0.75rem; color: var(--text-muted)">NM</span></span>
          </div>
          <div class="gauge-bar-container" style="height: 6px">
            <div class="gauge-bar-fill" style="background-color: var(--color-yellow)" :style="{ width: `${Math.min(100, (displayTorque / 800) * 100)}%` }" />
          </div>
        </div>

        {/* Boost Widget */}
        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px">
            <span style="color: var(--text-secondary)">BOOST PRESSURE</span>
            <span class="font-digital" style="color: var(--color-cyan)">{{ boostPsi.toFixed(1) }} <span style="font-size: 0.75rem; color: var(--text-muted)">PSI</span></span>
          </div>
          <div class="gauge-bar-container" style="height: 6px">
            <div class="gauge-bar-fill" style="background-color: var(--color-cyan)" :style="{ width: `${Math.min(100, (boostPsi / 30) * 100)}%` }" />
          </div>
        </div>

        {/* Steering Angle Widget */}
        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px">
            <span style="color: var(--text-secondary)">STEERING ANGLE</span>
            <span class="font-digital">{{ t.steer || 0 }}°</span>
          </div>
          <div style="display: flex; align-items: center; height: 14px; position: relative">
            <div style="position: absolute; left: 50%; top: 0; width: 2px; height: 100%; background-color: rgba(255, 255, 255, 0.2)" />
            <div 
              style="position: absolute; width: 10px; height: 10px; border-radius: 50%; background-color: var(--color-cyan); transform: translateX(-50%); box-shadow: 0 0 8px var(--color-cyan)"
              :style="{ left: `calc(50% + ${((t.steer || 0) / 127) * 45}%)` }" 
            />
          </div>
        </div>
      </section>

      <!-- Tire monitoring panel -->
      <section class="glass-panel col-6" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem">
        <h2 style="font-size: 1rem; letter-spacing: 0.08em; color: var(--text-secondary); display: flex; gap: 0.5rem; align-items: center">
          <Activity size="16" /> TYRE STATUS & TEMPERATURES
        </h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem">
          
          <!-- Front Left Tire -->
          <div :style="{ borderLeft: `3px solid ${getTireTempColor(t.tireTempFl)}` }" style="padding-left: 0.75rem">
            <div style="font-size: 0.8rem; color: var(--text-muted)">FRONT LEFT</div>
            <div style="display: flex; justify-content: space-between; align-items: baseline">
              <span class="font-digital" :style="{ color: getTireTempColor(t.tireTempFl) }" style="font-size: 1.5rem">
                {{ Math.round(t.tireTempFl || 75) }}°F
              </span>
              <span style="font-size: 0.8rem; color: var(--text-secondary)">
                SLIP: <span class="font-digital" :style="{ color: (t.tireCombinedSlipFl || 0) > 0.3 ? 'var(--color-red)' : 'var(--text-primary)' }">{{ (t.tireCombinedSlipFl || 0).toFixed(2) }}</span>
              </span>
            </div>
            <!-- Suspension Travel -->
            <div style="margin-top: 0.2rem">
              <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted)">
                <span>SUSPENSION</span>
                <span>{{ Math.round((t.normalizedSuspensionTravelFl || 0.5) * 100) }}%</span>
              </div>
              <div class="gauge-bar-container" style="height: 4px">
                <div class="gauge-bar-fill" style="background-color: var(--text-secondary)" :style="{ width: `${(t.normalizedSuspensionTravelFl || 0.5) * 100}%` }" />
              </div>
            </div>
          </div>

          <!-- Front Right Tire -->
          <div :style="{ borderLeft: `3px solid ${getTireTempColor(t.tireTempFr)}` }" style="padding-left: 0.75rem">
            <div style="font-size: 0.8rem; color: var(--text-muted)">FRONT RIGHT</div>
            <div style="display: flex; justify-content: space-between; align-items: baseline">
              <span class="font-digital" :style="{ color: getTireTempColor(t.tireTempFr) }" style="font-size: 1.5rem">
                {{ Math.round(t.tireTempFr || 75) }}°F
              </span>
              <span style="font-size: 0.8rem; color: var(--text-secondary)">
                SLIP: <span class="font-digital" :style="{ color: (t.tireCombinedSlipFr || 0) > 0.3 ? 'var(--color-red)' : 'var(--text-primary)' }">{{ (t.tireCombinedSlipFr || 0).toFixed(2) }}</span>
              </span>
            </div>
            <!-- Suspension Travel -->
            <div style="margin-top: 0.2rem">
              <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted)">
                <span>SUSPENSION</span>
                <span>{{ Math.round((t.normalizedSuspensionTravelFr || 0.5) * 100) }}%</span>
              </div>
              <div class="gauge-bar-container" style="height: 4px">
                <div class="gauge-bar-fill" style="background-color: var(--text-secondary)" :style="{ width: `${(t.normalizedSuspensionTravelFr || 0.5) * 100}%` }" />
              </div>
            </div>
          </div>

          <!-- Rear Left Tire -->
          <div :style="{ borderLeft: `3px solid ${getTireTempColor(t.tireTempRl)}` }" style="padding-left: 0.75rem">
            <div style="font-size: 0.8rem; color: var(--text-muted)">REAR LEFT</div>
            <div style="display: flex; justify-content: space-between; align-items: baseline">
              <span class="font-digital" :style="{ color: getTireTempColor(t.tireTempRl) }" style="font-size: 1.5rem">
                {{ Math.round(t.tireTempRl || 75) }}°F
              </span>
              <span style="font-size: 0.8rem; color: var(--text-secondary)">
                SLIP: <span class="font-digital" :style="{ color: (t.tireCombinedSlipRl || 0) > 0.3 ? 'var(--color-red)' : 'var(--text-primary)' }">{{ (t.tireCombinedSlipRl || 0).toFixed(2) }}</span>
              </span>
            </div>
            <!-- Suspension Travel -->
            <div style="margin-top: 0.2rem">
              <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted)">
                <span>SUSPENSION</span>
                <span>{{ Math.round((t.normalizedSuspensionTravelRl || 0.5) * 100) }}%</span>
              </div>
              <div class="gauge-bar-container" style="height: 4px">
                <div class="gauge-bar-fill" style="background-color: var(--text-secondary)" :style="{ width: `${(t.normalizedSuspensionTravelRl || 0.5) * 100}%` }" />
              </div>
            </div>
          </div>

          <!-- Rear Right Tire -->
          <div :style="{ borderLeft: `3px solid ${getTireTempColor(t.tireTempRr)}` }" style="padding-left: 0.75rem">
            <div style="font-size: 0.8rem; color: var(--text-muted)">REAR RIGHT</div>
            <div style="display: flex; justify-content: space-between; align-items: baseline">
              <span class="font-digital" :style="{ color: getTireTempColor(t.tireTempRr) }" style="font-size: 1.5rem">
                {{ Math.round(t.tireTempRr || 75) }}°F
              </span>
              <span style="font-size: 0.8rem; color: var(--text-secondary)">
                SLIP: <span class="font-digital" :style="{ color: (t.tireCombinedSlipRr || 0) > 0.3 ? 'var(--color-red)' : 'var(--text-primary)' }">{{ (t.tireCombinedSlipRr || 0).toFixed(2) }}</span>
              </span>
            </div>
            <!-- Suspension Travel -->
            <div style="margin-top: 0.2rem">
              <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted)">
                <span>SUSPENSION</span>
                <span>{{ Math.round((t.normalizedSuspensionTravelRr || 0.5) * 100) }}%</span>
              </div>
              <div class="gauge-bar-container" style="height: 4px">
                <div class="gauge-bar-fill" style="background-color: var(--text-secondary)" :style="{ width: `${(t.normalizedSuspensionTravelRr || 0.5) * 100}%` }" />
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- Session / Lap Timing Info -->
      <section class="glass-panel col-6" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 0.8rem">
        <h2 style="font-size: 1rem; letter-spacing: 0.08em; color: var(--text-secondary); display: flex; gap: 0.5rem; align-items: center">
          <Clock size="16" /> RACE TIMING & POSITIONS
        </h2>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 0.2rem">
          <!-- Position Box -->
          <div style="display: flex; flex-direction: column; background: rgba(0,0,0,0.15); padding: 0.6rem; borderRadius: 8px; border: 1px solid rgba(255,255,255,0.02)">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px">
              <Flag size={12} /> POSITION
            </span>
            <span class="font-digital" style="font-size: 1.8rem; margin-top: 0.2rem">
              {{ t.racePosition || 0 }} <span style="font-size: 1rem; color: var(--text-muted)">/ 12</span>
            </span>
          </div>

          <!-- Lap Box -->
          <div style="display: flex; flex-direction: column; background: rgba(0,0,0,0.15); padding: 0.6rem; borderRadius: 8px; border: 1px solid rgba(255,255,255,0.02)">
            <span style="font-size: 0.75rem; color: var(--text-muted)">LAP</span>
            <span class="font-digital" style="font-size: 1.8rem; margin-top: 0.2rem">
              #{{ t.lapNumber || 0 }}
            </span>
          </div>

          <!-- Car Class Box -->
          <div style="display: flex; flex-direction: column; background: rgba(0,0,0,0.15); padding: 0.6rem; borderRadius: 8px; border: 1px solid rgba(255,255,255,0.02)">
            <span style="font-size: 0.75rem; color: var(--text-muted)">CAR CLASS</span>
            <span class="font-digital" style="font-size: 1.8rem; margin-top: 0.2rem; color: var(--color-cyan); display: flex; align-items: center; gap: 4px">
              {{ getCarClass(t.carClass) }} <span style="font-size: 1rem; color: var(--text-secondary)">{{ t.carPerformanceIndex }}</span>
            </span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.4rem">
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.03)">
            <span style="color: var(--text-secondary)">CURRENT LAP TIME:</span>
            <span class="font-digital" style="font-size: 1.1rem; color: var(--color-cyan)">{{ formatTime(t.currentLap) }}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.03)">
            <span style="color: var(--text-secondary)">LAST LAP TIME:</span>
            <span class="font-digital" style="font-size: 1.1rem">{{ formatTime(t.lastLap) }}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; padding: 4px 0">
            <span style="color: var(--text-secondary)">BEST LAP TIME:</span>
            <span class="font-digital" style="font-size: 1.1rem; color: var(--color-green)">{{ formatTime(t.bestLap) }}</span>
          </div>
        </div>

        <!-- Car configuration tags -->
        <div style="display: flex; gap: 8px; margin-top: 0.5rem; flex-wrap: wrap">
          <span style="font-size: 0.75rem; padding: 4px 8px; background: rgba(255,255,255,0.03); border-radius: 4px; border: 1px solid rgba(255,255,255,0.05)">
            DRIVETRAIN: {{ getDrivetrain(t.drivetrainType) }}
          </span>
          <span style="font-size: 0.75rem; padding: 4px 8px; background: rgba(255,255,255,0.03); border-radius: 4px; border: 1px solid rgba(255,255,255,0.05)">
            ENGINE: {{ t.numCylinders || 4 }} CYLINDERS
          </span>
          <span style="font-size: 0.75rem; padding: 4px 8px; background: rgba(255,255,255,0.03); border-radius: 4px; border: 1px solid rgba(255,255,255,0.05)">
            DIST: {{ ((t.distanceTraveled || 0) / 1000).toFixed(2) }} KM
          </span>
        </div>
      </section>

    </main>

    <!-- Custom CSS styles for buttons and badges inside component -->
    <component :is="'style'">
      .badge {
        font-family: var(--font-hud);
        font-size: 0.75rem;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: 4px;
        letter-spacing: 0.05em;
        border: 1px solid transparent;
      }
      .badge-success {
        background-color: hsla(142, 70%, 50%, 0.15);
        color: var(--color-green);
        border-color: hsla(142, 70%, 50%, 0.25);
        box-shadow: 0 0 10px hsla(142, 70%, 50%, 0.1);
      }
      .badge-info {
        background-color: hsla(186, 100%, 50%, 0.15);
        color: var(--color-cyan);
        border-color: hsla(186, 100%, 50%, 0.25);
        box-shadow: 0 0 10px hsla(186, 100%, 50%, 0.1);
      }
      .badge-warning {
        background-color: hsla(45, 90%, 55%, 0.15);
        color: var(--color-yellow);
        border-color: hsla(45, 90%, 55%, 0.25);
      }
      .badge-error {
        background-color: hsla(355, 85%, 55%, 0.15);
        color: var(--color-red);
        border-color: hsla(355, 85%, 55%, 0.25);
      }
      .badge-inactive {
        background-color: rgba(255, 255, 255, 0.03);
        color: var(--text-secondary);
        border-color: rgba(255, 255, 255, 0.08);
      }

      .btn {
        font-family: var(--font-hud);
        font-size: 0.75rem;
        font-weight: 700;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .btn-outline {
        background-color: transparent;
        border-color: rgba(255, 255, 255, 0.15);
        color: var(--text-primary);
      }
      .btn-outline:hover:not(:disabled) {
        background-color: rgba(255, 255, 255, 0.05);
        border-color: var(--color-cyan);
        color: var(--color-cyan);
      }
      .btn-active-sim {
        background-color: var(--color-cyan);
        color: var(--bg-main);
        box-shadow: 0 0 15px var(--color-cyan-glow);
      }
      .btn-active-sim:hover:not(:disabled) {
        opacity: 0.9;
      }
      .btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .stat-card {
        background-color: rgba(0,0,0,0.1);
        padding: 0.75rem 1rem;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.02);
      }
    </component>
  </div>
</template>
