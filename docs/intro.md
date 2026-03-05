---
sidebar_position: 1
---

# Introduction

Easy RMQ is a Rust AMQP library with connection pool, publisher, subscriber, and dependency injection support.

import VersionBanner from '@site/src/components/VersionBanner';

<VersionBanner />

## Quick Overview

### 🚀 Why Easy RMQ?

- **Simple API**: Easy-to-use publisher and subscriber patterns
- **Auto Setup**: Automatic creation of exchanges, queues, and bindings
- **Connection Pooling**: Built-in pool using `deadpool` for efficiency
- **Advanced Features**: Retry, concurrency, single active consumer
- **Distributed Tracing**: Built-in trace ID generation with OTel support
- **Type Safe**: Strong error handling with `thiserror`
- **Async First**: Full async/await support with Tokio

### 📦 What's Included?

- ✅ Connection pool management
- ✅ Publisher with multiple exchange types
- ✅ Subscriber with worker registry
- ✅ Retry mechanism with DLQ
- ✅ Single active consumer support
- ✅ Prefetch and concurrency control
- ✅ Middleware support
- ✅ Distributed tracing
- ✅ Dependency injection

## Version

**Current Version:** 1.0.0 (unreleased)

This documentation covers Easy RMQ version 1.0.0 (unreleased/development). For the beta release (1.0.0-beta), select "1.0.0-beta" from the version dropdown in the top-right corner.

:::note Development Version

This is the development/unreleased version. APIs may change before the final release. For beta testing, please use version 1.0.0-beta.

:::

## Get Started in 3 Steps

### 1. Start RabbitMQ

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

### 2. Add Dependency

```toml
[dependencies]
easy_rmq = "1.0"
```

### 3. Send & Receive Messages

**Publisher:**
```rust
use easy_rmq::AmqpClient;

let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
client.publisher()
    .publish_text("order.created", "Hello, AMQP!")
    .await?;
```

**Subscriber:**
```rust
use easy_rmq::{AmqpClient, SubscriberRegistry, WorkerBuilder};
use lapin::ExchangeKind;

let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
let pool = client.channel_pool();

let worker = SubscriberRegistry::new()
    .register({
        let pool = pool.clone();
        move |_count| {
            WorkerBuilder::new(ExchangeKind::Direct)
                .pool(pool)
                .with_exchange("order.events.v1")
                .queue("order.process")
                .build(handle_order_event)
        }
    });

worker.run().await?;

fn handle_order_event(data: Vec<u8>) -> easy_rmq::Result<()> {
    let msg = String::from_utf8_lossy(&data);
    println!("📦 Order: {}", msg);
    Ok(())
}
```

## Key Features

### Connection Pool
Efficiently manages AMQP connections using deadpool for optimal resource utilization.

### Auto Setup
Automatically creates exchanges, queues, and bindings - no manual infrastructure needed.

### Worker Registry
Register and manage multiple workers with a clean, consistent pattern.

### Retry Mechanism
Automatic retry with configurable delays and dead letter queue for failed messages.

### Single Active Consumer
Ensure only one consumer processes messages at a time for strict ordering requirements.

### Concurrency Control
Configurable worker concurrency with async/blocking spawn options.

### Middleware
Custom middleware for logging, metrics, distributed tracing, and more.

### Distributed Tracing
Built-in trace ID generation with OpenTelemetry support for tracking message flows.

### Type Safety
Strong error handling with `thiserror` for compile-time guarantees.

## Requirements

- **Rust**: 1.70 or higher
- **RabbitMQ**: 3.x (or Docker)
- **Tokio**: For async runtime

## What's Next

- [Examples](examples) - Complete working examples
- [Installation & Configuration](installation) - Setup and configure Easy RMQ
- [Basic Features](basic) - Learn about publishers and subscribers
- [Advanced Features](advanced) - Explore retry, concurrency, and more

## Links

- [GitHub Repository](https://github.com/skyapps-id/easy_rmq)
- [API Documentation](https://docs.rs/easy_rmq)
- [Release Notes](https://github.com/skyapps-id/easy_rmq/releases)

## License

ISC