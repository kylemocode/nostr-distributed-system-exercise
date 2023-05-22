import WebSocket from 'ws';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  // Connect to relay
  const ws = new WebSocket('wss://relay.nekolicio.us/');

  ws.on('open', function open() {
    console.log('connected to relay');
    ws.send(JSON.stringify(['REQ', 'subscription_id', { Kinds: [1] }]));
  });

  ws.on('message', async function incoming(message) {
    // Parse the message
    const [action, ...args] = JSON.parse(message);

    if (action === 'EVENT') {
      // Store the event in the database
      const eventData = args[1];

      await prisma.aggregation_Event.create({
        data: {
          sig: eventData.sig,
          payload: eventData.content,
        },
      });
      console.log('store event to DB successfully!');
    }
  });

  ws.on('close', function close() {
    console.log('disconnected from relay');
  });
})();
