import { NodeTracerProvider } from '@opentelemetry/node';
import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/tracing';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { config } from 'dotenv';
import express from 'express';
import { register } from 'prom-client';

import MessageQueueService from './services/messageQueue.js';
import AggregatorService from './services/aggregator.cjs';
import {
  connectCounter,
  messageCounter,
  queuePublishCounter,
  cleanupCounter,
} from './services/metrics.js';

// Set up OpenTelemetry
const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'event-aggregator',
  }),
});
const consoleExporter = new ConsoleSpanExporter();
const spanProcessor = new SimpleSpanProcessor(consoleExporter);

provider.addSpanProcessor(spanProcessor);
provider.register();

const zipkinExporter = new ZipkinExporter({
  url: 'http://localhost:9411/api/v2/spans',
  serviceName: 'event-aggregator',
});
const zipkinProcessor = new SimpleSpanProcessor(zipkinExporter);

provider.addSpanProcessor(zipkinProcessor);

async function main() {
  await config();

  const RELAY_ENDPOINTS = ['wss://relay.nekolicio.us/'];
  const queueService = new MessageQueueService(
    process.env.RABBITMQ_CONNECTION_ENDPOINT
  );
  const AGGREGATOR_QUEUE_NAME = 'eventQueue';

  const relayAggregators = RELAY_ENDPOINTS.map(
    relay =>
      new AggregatorService(relay, queueService, AGGREGATOR_QUEUE_NAME, {
        connectCounter,
        messageCounter,
        queuePublishCounter,
        cleanupCounter,
      })
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

/*
 * Express server to send metrics to Prometheus.
 * Just a workaround, because prom-client default will get metrics from same process.
 * We may use Node.js Cluster modules to handle IPC in the future refactor.
 */
const app = express();

app.get('/metrics', async (_, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(5001, () => {
  console.log('server listening on port 5001...');
});
