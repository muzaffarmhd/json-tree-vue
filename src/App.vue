<template>
  <div id="app">
    <TreeComponent :data="sampleJson" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import TreeComponent from '@/components/TreeComponent.vue';

export default Vue.extend({
  name: 'App',
  components: { TreeComponent },
  data() {
    return {
      sampleJson: {
        broker: {
          host: "mqtt.example.com",
          port: 8883,
          protocol: "mqtts",
          clientId: "client-12345",
          username: "user1",
          password: "******",
          keepalive: 60,
          clean: true,
          reconnectPeriod: 1000,
          connectTimeout: 30000,
          will: {
            topic: "clients/client-12345/status",
            payload: "offline",
            qos: 1,
            retain: true
          }
        },
        subscriptions: [
          {
            topic: "sensors/+/temperature",
            qos: 1,
            options: {
              nl: false,
              rap: false,
              rh: 0
            }
          },
          {
            topic: "devices/+/status",
            qos: 0
          }
        ],
        publications: [
          {
            topic: "devices/device-001/command",
            payload: {
              command: "restart",
              timestamp: "2024-06-01T12:00:00Z"
            },
            qos: 2,
            retain: false
          },
          {
            topic: "alerts/system",
            payload: {
              level: "critical",
              message: "Temperature threshold exceeded",
              details: {
                sensor: "sensor-42",
                value: 87.5,
                threshold: 80
              }
            },
            qos: 1,
            retain: true
          }
        ],
        lastMessages: {
          "sensors/sensor-42/temperature": {
            payload: {
              value: 87.5,
              unit: "C"
            },
            qos: 1,
            retain: false,
            timestamp: "2024-06-01T12:01:00Z"
          },
          "devices/device-001/status": {
            payload: "online",
            qos: 0,
            retain: true,
            timestamp: "2024-06-01T11:59:00Z"
          }
        },
        retainedTopics: [
          "devices/device-001/status",
          "alerts/system"
        ],
        connectionStatus: {
          connected: true,
          lastReconnect: "2024-06-01T11:58:00Z",
          error: null
        },
        metrics: {
          messagesSent: 1245,
          messagesReceived: 1320,
          bytesSent: 1048576,
          bytesReceived: 2097152,
          uptimeSeconds: 86400
        }
      }
    };
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
