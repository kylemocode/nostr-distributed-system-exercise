const WebSocket = require('ws');
const { trace, SpanStatusCode } = require('@opentelemetry/api');

class AggregatorService {
  constructor(relayEndpoint, queueService, queueName, counters) {
    this.relayEndpoint = relayEndpoint;
    this.queueService = queueService;
    this.queueName = queueName;
    this.ws = new WebSocket(this.relayEndpoint);
    this.isWsConnectionOpen = false;
    this.isQueueReady = false;
    this.counters = counters;

    this.ws.on('open', this.handleOpen.bind(this));
    this.ws.on('message', this.handleMessage.bind(this));
    this.ws.on('close', this.handleClose.bind(this));
  }

  async connect() {
    const connectSpan = trace
      .getTracer('event-aggregator')
      .startSpan('connect');

    try {
      connectSpan.setStatus({ code: SpanStatusCode.OK });

      await this.queueService.connect();
      this.isQueueReady = true;
      console.log('QueueService connected.');

      // If the WebSocket is already open, no need to wait
      if (this.ws.readyState !== WebSocket.OPEN) {
        // Otherwise, wait for the WebSocket to open
        await new Promise((resolve, reject) => {
          this.ws.once('open', () => {
            this.isWsConnectionOpen = true;
            resolve();
          });
          this.ws.once('error', reject);
        });
      }
      console.log(
        'this.counters.connectCounter ',
        this.counters.connectCounter
      );
      this.counters.connectCounter.inc();
      connectSpan.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      console.error('Error during connection:', error);

      connectSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });

      throw error;
    } finally {
      connectSpan.end();
    }
  }

  handleOpen() {
    console.log('connected to relay');
    this.isWsConnectionOpen = true;
    this.ws.send(JSON.stringify(['REQ', 'subscription_id', { Kinds: [1] }]));
  }

  async handleMessage(message) {
    if (this.isWsConnectionOpen && this.isQueueReady) {
      this.counters.messageCounter.inc();
      const messageSpan = trace
        .getTracer('event-aggregator')
        .startSpan('handle_message');

      try {
        console.log('Receive message...');
        const [action, ...args] = JSON.parse(message);

        if (action === 'EVENT') {
          const eventData = args[1];
          await this.queueService.publishToQueue(
            this.queueName,
            JSON.stringify({
              sig: eventData.sig,
              payload: eventData.content,
            })
          );

          this.counters.queuePublishCounter.inc();
          messageSpan.setStatus({ code: SpanStatusCode.OK });
          console.log('pushed event to queue successfully!');
        }
      } catch (error) {
        messageSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        throw error;
      } finally {
        messageSpan.end();
      }
    } else {
      console.log(
        'Skipping message handling because WebSocket is not open yet.'
      );
    }
  }

  handleClose() {
    console.log('disconnected from relay');
  }

  async cleanup() {
    const cleanupSpan = trace
      .getTracer('event-aggregator')
      .startSpan('cleanup');

    try {
      await this.queueService.closeChannel();
      console.log('Closed RabbitMQ connection');
      cleanupSpan.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      console.error('Failed to clean up:', error);
      cleanupSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: err.message,
      });
      throw err;
    } finally {
      cleanupSpan.end();
    }
  }
}

module.exports = AggregatorService;
