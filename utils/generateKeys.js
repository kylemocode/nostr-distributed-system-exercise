import { generatePrivateKey, getPublicKey } from 'nostr-tools';

let sk = generatePrivateKey(); // `sk` is a hex string
let pk = getPublicKey(sk); // `pk` is a hex string

console.log('private key: ', sk);
console.log('public key: ', pk);
