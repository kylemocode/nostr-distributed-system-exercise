# Nostr Distributed System Exercises

Nostr Distributed System Exerices based on https://achq.notion.site/Distributed-Systems-Project-Briefing-00eaa7a219954bb1a346d73bf09164f2

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

## Phase 2: build a simple nostr relay

#### How to use ?

```
node nostr-relay/server.js
```

then use ws://localhost:8080 as relay URL in the client

#### TODOS

- [x] Deploy to cloud service ( wss://enchanted-lunar-lens.glitch.me/ , but because of the security policy of glitch, we have to specify the user-agent header to connect to this ws server, or it may return 502 bad gateway error)
- [ ] Currently we use JS object to store ws connection, but if we scale the relay server in the future, it may cause some issues. So I think that I can try to replace the object mapping with distributed in-memory data store such as Redis

#### Questions Exercises

- Why did you choose this database? (Postgres)
  - I am more familiar with PostgresSQL
  - My database is hosted by Supabase. Supabase is a backend-as-a-service, it provide easy to use UI and some scaling strategies which I can use in the future
  - Although PostgreSQL itself does not directly support distributed database functionality, but it can be achieved through various external tools and techniques like sharding, replication and Citus.
- If the number of events to be stored will be huge, what would you do to scale the database?

  - I will try these methods first:

    - Sharding: This involves dividing the data into multiple parts (or "shards") and distributing these parts across multiple PostgreSQL instances. Each instance may run on a different physical or virtual machine. For example, Postgres-XL is an open-source, distributed database based on PostgreSQL that supports horizontal scaling through sharding.

    - Replication: This involves keeping copies of the data on multiple PostgreSQL instances. PostgreSQL natively supports replication features, including Streaming Replication and Logical Replication.

    - PostgreSQL External Extensions: For instance, Citus is an open-source PostgreSQL extension that can transform a single-node PostgreSQL database into a distributed database. Citus implements the functionalities of a distributed database through sharding and replication.

  - In reality, it depends on identifying the actual bottleneck before determining the appropriate scaling strategy.

## Phase 3: Event Fetching and Persistence

Currently, this aggregator only get event from the testing relay

#### How to use ?

```
node nostr-aggregator/server.js
```

If you want to see the events stored in the DB through CLI, run this command

```
node nostr-aggregator/eventDisplayer.js --amount=2 --orderBy=asc --keyword=keyword
```

- `amount`: amount of data you want to get, default value is 20
- `orderBy`: should be "desc" or "asc"
- `keyword`: payload content contains keyword, default will be empty string

![截圖 2023-05-22 下午11 40 07](https://github.com/kylemocode/nostr-distributed-system-exercise/assets/35811214/85ef3d2f-655a-45fb-98b6-9e88f0931230)

## Phase 4 Event Aggregation and Queuing

### How to use ?

For aggregator, run

```
node nostr-aggregator/server.js
```

It will loop through the endpoints of relays in the array and listen to WS event. If it receive events, it will send them to RabbitMQ.

For consume the events from queue, run

```
node nostr-aggregator/services/eventConsumer.js
```

to start the consumer (Only for demo purpose. In reality, we may deploy and scale them independently.)

The consumer will fetch events from queue and store them in DB. And we can use display built in phase 3 to read event data from DB.
