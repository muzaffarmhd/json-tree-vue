<template>
  <div id="app" class="layout">
    <aside class="sidebar">
      <header class="sidebar-header">
        <span>JSON Input</span>
        <button class="btn" @click="formatJson">Format</button>
      </header>
      <JsonEditor v-model="jsonText" />
    </aside>
    <main class="content">
      <TreeComponent :data="parsedJson" />
    </main>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import TreeComponent from '@/components/TreeComponent.vue';
import JsonEditor from '@/components/JsonEditor.vue';
import { parse } from 'jsonc-parser';
import { debounce } from '@/utils/debounce';

export default Vue.extend({
  name: 'App',
  components: { TreeComponent, JsonEditor },
  data() {
    const initial = {
      broker: {
        host: 'mqtt.example.com',
        port: 8883,
        protocol: 'mqtts',
        clientId: 'client-12345',
        username: 'user1',
        password: '******',
        keepalive: 60,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30000,
        will: { topic: 'clients/client-12345/status', payload: 'offline', qos: 1, retain: true }
      },
      subscriptions: [
        { topic: 'sensors/+/temperature', qos: 1, options: { nl: false, rap: false, rh: 0 } },
        { topic: 'devices/+/status', qos: 0 }
      ],
      publications: [
        { topic: 'devices/device-001/command', payload: { command: 'restart', timestamp: '2024-06-01T12:00:00Z' }, qos: 2, retain: false },
        { topic: 'alerts/system', payload: { level: 'critical', message: 'Temperature threshold exceeded', details: { sensor: 'sensor-42', value: 87.5, threshold: 80 } }, qos: 1, retain: true }
      ],
      lastMessages: {
        'sensors/sensor-42/temperature': { payload: { value: 87.5, unit: 'C' }, qos: 1, retain: false, timestamp: '2024-06-01T12:01:00Z' },
        'devices/device-001/status': { payload: 'online', qos: 0, retain: true, timestamp: '2024-06-01T11:59:00Z' }
      },
      retainedTopics: [ 'devices/device-001/status', 'alerts/system' ],
      connectionStatus: { connected: true, lastReconnect: '2024-06-01T11:58:00Z', error: null },
      metrics: { messagesSent: 1245, messagesReceived: 1320, bytesSent: 1048576, bytesReceived: 2097152, uptimeSeconds: 86400 }
    };

    return {
      jsonText: JSON.stringify(initial, null, 2) as string,
      parsedJson: initial as any,
      debouncedParse: null as any
    };
  },
  created() {
    this.debouncedParse = debounce((text: string) => {
      try {
        const obj = parse(text);
        this.parsedJson = obj ?? {};
      } catch (e) {
        // ignore parse errors during typing
      }
    }, 300);
  },
  watch: {
    jsonText(next: string) {
      this.debouncedParse(next);
    }
  },
  methods: {
    formatJson() {
      try {
        const obj = parse(this.jsonText);
        this.jsonText = JSON.stringify(obj, null, 2);
      } catch {}
    }
  }
});
</script>

<style>
html, body, #app { height: 100%; }
.layout {
  display: grid;
  grid-template-columns: 420px 1fr;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.sidebar {
  display: grid;
  grid-template-rows: 44px 1fr;
  border-right: 1px solid #e5e7eb;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}
.btn { border: 1px solid #d1d5db; background: #fff; padding: 4px 8px; border-radius: 6px; cursor: pointer; }
.content { height: 100%; width: 100%; }
</style>
