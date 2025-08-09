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
        topic: "devices/building1/office/temperature",
        payload: {
          value: 22.5,
          unit: "C",
          status: "ok",
          readings: [
            { time: "2024-06-01T12:30:00Z", value: 22.1 },
            { time: "2024-06-01T12:32:00Z", value: 22.3 },
            { time: "2024-06-01T12:34:00Z", value: 22.5 }
          ],
          alerts: [
            { type: "threshold", triggered: false },
            { type: "sensor_error", triggered: false }
          ],
          metadata: {
            location: {
              building: "Building 1",
              floor: 2,
              room: "Office 201"
            },
            calibration: {
              lastCalibrated: "2024-05-01T09:00:00Z",
              calibratedBy: "tech-42"
            }
          }
        },
        qos: 1,
        retain: false,
        timestamp: "2024-06-01T12:34:56Z",
        clientId: "client-12345",
        user: "user1",
        messageId: 42,
        properties: {
          responseTopic: "responses/building1/office/temperature",
          correlationData: "abc123",
          userProperties: {
            source: "sensor-gateway",
            priority: "high"
          },
          subscriptionIdentifiers: [101, 102]
        },
        history: [
          {
            timestamp: "2024-06-01T12:30:00Z",
            value: 22.1,
            status: "ok"
          },
          {
            timestamp: "2024-06-01T12:32:00Z",
            value: 22.3,
            status: "ok"
          }
        ]
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
