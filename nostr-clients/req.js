import { relayInit } from 'nostr-tools';
import 'websocket-polyfill';
import { config } from 'dotenv';

await config();

// const TESTING_RELAY = 'wss://relay.nekolicio.us/';
const TESTING_RELAY = 'ws://localhost:8080';

const relay = relayInit(TESTING_RELAY);

relay.on('connect', () => {
  console.log(`connected to ${relay.url}`);
});

relay.on('error', () => {
  console.log(`failed to connect to ${relay.url}`);
});

await relay.connect();

let sub = relay.sub([{}]);

sub.on('event', event => {
  console.log('we got the event we wanted:', event);
});

sub.on('eose', () => {
  sub.unsub();
});
