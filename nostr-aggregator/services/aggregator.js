import WebSocket from 'ws';

class AggregatorService {
  constructor(relayEndpoint, queueService, queueName) {
    this.relayEndpoint = relayEndpoint;
    this.queueService = queueService;
    this.queueName = queueName;
    this.ws = new WebSocket(this.relayEndpoint);
  }

  async connect() {
    this.ws.on('open', this.handleOpen.bind(this));
    this.ws.on('message', this.handleMessage.bind(this));
    this.ws.on('close', this.handleClose.bind(this));

    // Starting both the connections in parallel
    const connectQueuePromise = this.queueService.connect();
    const connectWSPromise = new Promise((resolve, reject) => {
      this.ws.once('open', resolve);
      this.ws.once('error', reject);
    });

    // Waiting for both the connections to be ready
    await Promise.all([connectQueuePromise, connectWSPromise]);

    console.log('connected to queue and websocket successfully');
  }

  handleOpen() {
    console.log('connected to relay');
    this.ws.send(JSON.stringify(['REQ', 'subscription_id', { Kinds: [1] }]));
  }

  async handleMessage(message) {
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

      console.log('pushed event to queue successfully!');
    }
  }

  handleClose() {
    console.log('disconnected from relay');
  }

  async cleanup() {
    try {
      await this.queueService.closeChannel();
      console.log('Closed RabbitMQ connection');
    } catch (err) {
      console.error('Failed to clean up:', err);
      throw err;
    }
  }
}

export default AggregatorService;
