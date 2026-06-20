<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Dashboard from './components/Dashboard.vue';

// Reactive states
const telemetry = ref(null);
const connectionState = ref('disconnected');
const status = ref({
  udpPort: 5607,
  simulatorActive: false,
  liveActive: false
});

let ws = null;
let reconnectTimeout = null;

// Function to connect to WebSocket
const connect = () => {
  if (ws) {
    ws.close();
  }

  connectionState.value = 'connecting';
  
  // Read port from URL parameters or fallback to 8080
  const params = new URLSearchParams(window.location.search);
  const wsPort = params.get('wsPort') || '8080';
  const wsUrl = `ws://${window.location.hostname}:${wsPort}`;

  console.log(`[WS] Connecting to ${wsUrl}...`);
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('[WS] Connected to backend server.');
    connectionState.value = 'connected';
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'telemetry') {
        telemetry.value = msg.payload;
      } else if (msg.type === 'status') {
        status.value = msg.payload;
      }
    } catch (err) {
      console.error('[WS] Error processing message:', err);
    }
  };

  ws.onclose = () => {
    console.log('[WS] Connection closed. Attempting reconnect in 2s...');
    connectionState.value = 'disconnected';
    
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
      connect();
    }, 2000);
  };

  ws.onerror = (err) => {
    console.error('[WS] WebSocket error:', err);
    ws.close();
  };
};

// Toggle simulator mode
const toggleSimulator = (enable) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'toggle_simulator',
      value: enable
    }));
  }
};

onMounted(() => {
  connect();
});

onUnmounted(() => {
  if (ws) ws.close();
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
});
</script>

<template>
  <div style="min-height: 100vh; display: flex; flex-direction: column">
    <Dashboard 
      :telemetry="telemetry" 
      :status="status" 
      :connectionState="connectionState"
      @toggle-simulator="toggleSimulator"
    />
  </div>
</template>
