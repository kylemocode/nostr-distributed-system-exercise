import { config } from 'dotenv';

import MessageQueueService from './services/messageQueue.js';
import AggregatorService from './services/aggregator.js';

async function main() {
  await config();

  const RELAY_ENDPOINTS = ['wss://relay.nekolicio.us/'];
  const queueService = new MessageQueueService(
    process.env.RABBITMQ_CONNECTION_ENDPOINT
  );
  const AGGREGATOR_QUEUE_NAME = 'eventQueue';

  const relayAggregators = RELAY_ENDPOINTS.map(
    relay => new AggregatorService(relay, queueService, AGGREGATOR_QUEUE_NAME)
  );

  for (const relayConnection of relayAggregators) {
    await relayConnection.connect();
  }

  const cleanupAndExit = async () => {
    for (const relayConnection of relayAggregators) {
      await relayConnection.cleanup();
    }
    process.exit();
  };

  // Register the cleanup function for the exit events
  process.on('SIGTERM', cleanupAndExit);
  process.on('SIGINT', cleanupAndExit);
  process.on('SIGUSR1', cleanupAndExit);
  process.on('SIGUSR2', cleanupAndExit);

  // Register the cleanup function for unhandled exceptions and promise rejections
  process.on('uncaughtException', async err => {
    console.error('Unhandled exception:', err);
    await cleanupAndExit();
  });

  process.on('unhandledRejection', async err => {
    console.error('Unhandled promise rejection:', err);
    await cleanupAndExit();
  });
}

main();
