import { Counter } from 'prom-client';

// Create metrics
export const connectCounter = new Counter({
  name: 'relay_connect_counts',
  help: 'Counts the number of successful connections to the relay',
});

export const messageCounter = new Counter({
  name: 'message_received_counts',
  help: 'Counts the number of messages received from the relay',
});

export const queuePublishCounter = new Counter({
  name: 'queue_publish_counts',
  help: 'Counts the number of messages published to the queue',
});

export const cleanupCounter = new Counter({
  name: 'cleanup_counts',
  help: 'Counts the number of successful cleanup operations',
});
