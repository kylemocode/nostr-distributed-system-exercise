# Nostr Distributed System Exercises

## Phase 1: build a simple nostr client

#### Requirements

- Because this project uses ES module & top level await, making sure that your Node.js version is higher than v14
- Add your private key as a key-value pair (`NOSTR_SECRET_KEY`) in `.env` file, if you do not have key pair, you can go to http://nostr.rocks/ or use

  ```sh
  node utils/generateKeys.js
  ```

  to generate Private/Public keys for testing

#### How to use ?

- install dependencies

```
yarn
```

- run the client

```
node nostr-client.js
```

and you can go to https://relay.nekolicio.us/watcher/ to see if the event successfully send the event.

<img width="1659" alt="截圖 2023-05-06 上午10 51 50" src="https://user-images.githubusercontent.com/35811214/236611298-501c8a62-4f33-44e3-889d-e5782ee9ee9f.png">

BTW, the client will exit after 5 seconds timeout.

#### Question Exercises

- What are some of the challenges you faced while working on Phase 1?

  - I hadn't heard of the Nostr protocol before, so I spent some time researching related documents.
  - Find a proper 3rd node.js package to develop nostr client.

- What kind of failures do you expect to a project such as DISTRISE to encounter?
  - If I understand correctly, DISTRISE should be a type of event aggregator. In a distributed system, such a component might encounter some failure situations, such as network latency, inability to collect events from certain nodes due to network partition, single point of failure, data consistency, and security issues like DDoS attacks. To address these problems, we may need to discuss some solutions in the future, such as using a load balancer in conjunction with replica scaling to address the single point of failure issue, utilizing database replicas and sharding to solve availability and consistency concerns, and setting up monitoring systems to observe resource usage in the system, such as CPU and memory usage, among others.
