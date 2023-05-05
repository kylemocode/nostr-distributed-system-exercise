import { relayInit, getEventHash, signEvent } from 'nostr-tools';
import 'websocket-polyfill';
import { config } from 'dotenv';

await config();

const CLIENT_PUBLICK_KEY =
  '33fa869f2a18ec4637875296161cd4fb81966349a84e78765d66da6e2316e6e4';
const relay = relayInit('wss://relay.nekolicio.us/');

relay.on('connect', () => {
  console.log(`connected to ${relay.url}`);
});
relay.on('error', () => {
  console.log(`failed to connect to ${relay.url}`);
});

await relay.connect();

const event = {
  kind: 1,
  pubkey: CLIENT_PUBLICK_KEY,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: 'Hello World from Kyle !',
};

event.id = getEventHash(event);
event.sig = signEvent(event, process.env.NOSTR_SECRET_KEY);

const pub = relay.publish(event);

pub.on('ok', () => {
  console.log(`${relay.url} has accepted our event`);
});

pub.on('failed', reason => {
  console.log(`failed to publish to ${relay.url}: ${reason}`);
});

setTimeout(() => {
  relay.close();
}, 5000);
