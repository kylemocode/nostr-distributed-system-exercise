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

      this.counters.connectCounter.add(1);
      connectSpan.setStatus({ code: SpanStatusCode.OK });
      connectSpan.end();
    } catch (error) {
      console.error('Error during connection:', error);
      connectSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      connectSpan.end();
      throw error;
    }
  }

  handleOpen() {
    console.log('connected to relay');
    this.isWsConnectionOpen = true;
    this.ws.send(JSON.stringify(['REQ', 'subscription_id', { Kinds: [1] }]));
  }

  async handleMessage(message) {
    if (this.isWsConnectionOpen && this.isQueueReady) {
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

          this.counters.messageCounter.add(1);
          messageSpan.setStatus({ code: SpanStatusCode.OK });
          messageSpan.end();
          console.log('pushed event to queue successfully!');
        }
      } catch (error) {
        messageSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        messageSpan.end();
        throw error;
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
    try {
      const connectSpan = trace
        .getTracer('event-aggregator')
        .startSpan('cleanup');
      await this.queueService.closeChannel();
      console.log('Closed RabbitMQ connection');
      connectSpan.end();
    } catch (err) {
      console.error('Failed to clean up:', err);
      throw err;
    }
  }
}

module.exports = AggregatorService;
