import amqp from 'amqplib';

class MessageQueueService {
  constructor(CONN_URL) {
    this.connection_url = CONN_URL;
  }

  async connect() {
    try {
      const connection = await amqp.connect(this.connection_url);
      this.channel = await connection.createChannel();
    } catch (err) {
      // Log the error
      console.error(`Error connecting to RabbitMQ: ${err.message}`);

      // Re-throw the error to halt execution
      throw err;
    }
  }

  async publishToQueue(queueName, data) {
    try {
      await this.channel.assertQueue(queueName);
      this.channel.sendToQueue(queueName, Buffer.from(data));
    } catch (err) {
      console.error(`Error publishing to queue: ${err.message}`);
      throw err;
    }
  }

  closeChannel() {
    try {
      this.channel.close();
      console.log(`Closing RabbitMQ channel`);
    } catch (err) {
      console.error(`Error closing RabbitMQ channel: ${err.message}`);
      throw err;
    }
  }
}

export default MessageQueueService;
