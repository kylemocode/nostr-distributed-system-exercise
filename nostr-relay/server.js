import WebSocket, { WebSocketServer } from 'ws';
import { PrismaClient } from '@prisma/client';
import { validateEvent } from 'nostr-tools';

const prisma = new PrismaClient();

const wss = new WebSocketServer({ port: 8080 });
const subscriptions = {};

wss.on('connection', ws => {
  let subscriptionId;

  ws.on('message', async message => {
    try {
      const [action, ...args] = JSON.parse(message);
      switch (action) {
        case 'EVENT':
          console.log('EVENT');
          const eventData = args[0];

          // Validate the event before accepting it
          if (!validateEvent(eventData)) {
            throw new Error('Invalid event data');
          }

          // Store the event in the database.
          await prisma.event.create({
            data: {
              sig: eventData.sig,
              payload: eventData.content,
            },
          });

          // Forward the event to all connected clients.
          for (const subscriptionId in subscriptions) {
            const client = subscriptions[subscriptionId];

            if (client.readyState === WebSocket.OPEN) {
              try {
                client.send(message);
                console.log(
                  `Message sent to client with subscriptionId: ${subscriptionId}`
                );
              } catch (err) {
                console.error(
                  `Failed to send message to client with subscriptionId: ${subscriptionId}, error: ${err}`
                );
              }
            }
          }
          break;

        case 'REQ':
          console.log('REQ');
          subscriptionId = args[0];
          subscriptions[subscriptionId] = ws;
          break;

        case 'CLOSE':
          const closeSubscriptionId = args[0];

          if (args[0] === subscriptionId) {
            subscriptionId = null;
            if (subscriptions[closeSubscriptionId]) {
              delete subscriptions[closeSubscriptionId];
            }
          }
          break;

        default:
          throw new Error('Unknown action');
      }
    } catch (err) {
      console.error(`Failed to process message: ${err}`);
    }
  });
});

console.log('WebSocket server started on ws://localhost:8080');
