import { PrismaClient } from '@prisma/client';

import MessageQueueService from './messageQueue.js';

class EventConsumer {
  constructor(queueService, queueName) {
    this.queueService = queueService;
    this.queueName = queueName;
    this.prisma = new PrismaClient();
  }

  async connect() {
    await this.queueService.connect();
    console.log('Connect to queue service successfully, waiting for event...');

    // Fetch events from the queue and store them in the database
    this.queueService.channel.consume(
      this.queueName,
      this.handleMessage.bind(this)
    );
  }

  async handleMessage(msg) {
    try {
      const eventData = JSON.parse(msg.content.toString());
      console.log('eventData consumed from MQ...', eventData);

      await this.prisma.aggregation_Event.create({
        data: {
          sig: eventData.sig,
          payload: eventData.payload,
        },
      });
      console.log('stored event to DB successfully!');

      // Acknowledge the message
      this.queueService.channel.ack(msg);
    } catch (err) {
      console.error(`Error occurred: ${err.message}`);
      // In case of an error, reject the message
      this.queueService.channel.nack(msg);
    }
  }

  async cleanup() {
    try {
      // Close the RabbitMQ connection
      await this.queueService.closeChannel();
      console.log('Closed RabbitMQ connection');

      // Disconnect Prisma client
      await this.prisma.$disconnect();
      console.log('Disconnected from Prisma');
    } catch (err) {
      console.error('Failed to clean up:', err);
      throw err;
    }
  }
}

async function main() {
  const queueService = new MessageQueueService(
    process.env.RABBITMQ_CONNECTION_ENDPOINT
  );
  const AGGREGATOR_QUEUE_NAME = 'eventQueue';
  const consumer = new EventConsumer(queueService, AGGREGATOR_QUEUE_NAME);

  await consumer.connect();

  const cleanupAndExit = async () => {
    await consumer.cleanup();
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
