---
sidebar_position: 1
---

# Introduction

Easy RMQ is a modern AMQP library available in both **Rust** and **Go** with connection pool, publisher, subscriber, and dependency injection support.

import VersionBanner from '@site/src/components/VersionBanner';

<VersionBanner />

## Quick Overview

### 🦀 Rust Version (easy-rmq-rs)

- **Simple API**: Easy-to-use publisher and subscriber patterns
- **Auto Setup**: Automatic creation of exchanges, queues, and bindings
- **Connection Pooling**: Built-in pool using `deadpool` for efficiency
- **Advanced Features**: Retry, concurrency, single active consumer
- **Distributed Tracing**: Built-in trace ID generation with OTel support
- **Type Safe**: Strong error handling with `thiserror`
- **Async First**: Full async/await support with Tokio

### 🐹 Go Version (easy-rmq-go)

- **Simple API**: Clean and intuitive publisher/subscriber patterns
- **Auto Setup**: Automatic creation of exchanges, queues, and bindings
- **Connection Pooling**: Efficient AMQP connection management
- **Advanced Features**: Retry, concurrency, single active consumer
- **Distributed Tracing**: Built-in trace ID generation with OTel support
- **Type Safe**: Strong error handling with custom errors
- **Concurrent**: Full goroutine and channel support

### 📦 What's Included?

**Both Versions:**
- ✅ Connection pool management
- ✅ Publisher with multiple exchange types (Direct, Topic, Fanout)
- ✅ Subscriber with worker registry
- ✅ Retry mechanism with DLQ
- ✅ Single active consumer support
- ✅ Prefetch and concurrency control
- ✅ Middleware support
- ✅ Distributed tracing
- ✅ Dependency injection

**Rust Version (easy-rmq-rs):**
- ✅ Full async/await with Tokio
- ✅ Trait-based DI pattern
- ✅ Static middleware functions
- ✅ Strong compile-time type safety

**Go Version (easy-rmq-go):**
- ✅ Goroutine-based concurrency
- ✅ Interface-based DI pattern
- ✅ Struct middleware with Before/After hooks
- ✅ Simple and idiomatic Go code

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

### 2. Choose Your Language

**Rust (easy-rmq-rs):**
```toml
[dependencies]
easy-rmq-rs = "1.0"
```

**Go (easy-rmq-go):**
```bash
go get github.com/easyrmq/easy-rmq-go
```

### 3. Send & Receive Messages

#### Rust Version

**Publisher:**
```rust
use easy_rmq_rs::AmqpClient;

let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
client.publisher()
    .publish_text("order.created", "Hello, AMQP!")
    .await?;
```

**Subscriber:**
```rust
use easy_rmq_rs::{AmqpClient, SubscriberRegistry, WorkerBuilder};
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

fn handle_order_event(data: Vec<u8>) -> easy_rmq_rs::Result<()> {
    let msg = String::from_utf8_lossy(&data);
    println!("📦 Order: {}", msg);
    Ok(())
}
```

#### Go Version

**Publisher:**
```go
package main

import easyrmq "github.com/easyrmq/easy-rmq-go/pkg/easyrmq"

client, _ := easyrmq.NewClient("amqp://guest:guest@localhost:5672", 10)
publisher := client.Publisher()
publisher.PublishText("order.created", "Hello, AMQP!")
```

**Subscriber:**
```go
package main

import easyrmq "github.com/easyrmq/easy-rmq-go/pkg/easyrmq"

client, _ := easyrmq.NewClient("amqp://guest:guest@localhost:5672", 10)
pool := client.ChannelPool()

registry := easyrmq.NewSubscriberRegistry().
    Register(func(_ int) *easyrmq.BuiltWorker {
        return easyrmq.NewWorkerBuilder("direct").
            Pool(pool).
            WithExchange("order.events.v1").
            Queue("order.process").
            Build(handleOrderEvent)
    })

registry.Run()

func handleOrderEvent(data []byte) error {
    msg := string(data)
    fmt.Printf("📦 Order: %s\n", msg)
    return nil
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

**Rust Version:**
- **Rust**: 1.70 or higher
- **RabbitMQ**: 3.x (or Docker)
- **Tokio**: For async runtime

**Go Version:**
- **Go**: 1.19 or higher
- **RabbitMQ**: 3.x (or Docker)

## What's Next

**Language-Specific Documentation:**
- [Rust Documentation](/docs/basic/rust/) - Easy RMQ for Rust
- [Go Documentation](/docs/basic/go/) - Easy RMQ for Go

**General Topics:**
- [Examples](/docs/examples) - Complete working examples
- [Installation & Configuration](/docs/installation/) - Setup and configure Easy RMQ
- [Basic Features](/docs/basic/) - Learn about publishers and subscribers
- [Advanced Features](/docs/advanced/) - Explore retry, concurrency, and more

## Links

**Rust Version:**
- [GitHub Repository](https://github.com/skyapps-id/easy-rmq-rs)
- [API Documentation](https://docs.rs/easy-rmq-rs)
- [Release Notes](https://github.com/skyapps-id/easy-rmq-rs/releases)

**Go Version:**
- [GitHub Repository](https://github.com/skyapps-id/easy-rmq-go)
- [API Documentation](https://pkg.go.dev/github.com/easyrmq/easy-rmq-go)
- [Release Notes](https://github.com/skyapps-id/easy-rmq-go/releases)

## License

ISC