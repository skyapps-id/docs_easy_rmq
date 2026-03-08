---
sidebar_position: 1
---

# Easy RMQ for Rust (easy-rmq-rs)

Easy RMQ for Rust is a modern AMQP library that provides a simple and powerful way to work with RabbitMQ in your Rust applications.

## Features

- **Connection Pool**: Efficiently manages AMQP connections using deadpool
- **Publisher**: Send messages to exchanges with routing keys
- **Subscriber**: Receive messages from queues with handlers
- **Worker Registry**: Register and manage multiple workers with a clean pattern
- **Auto Setup**: Automatically creates exchanges and queues
- **Retry Mechanism**: Automatic retry with delay for failed messages
- **Single Active Consumer**: Ensure only one consumer processes messages at a time
- **Prefetch Control**: AMQP prefetch (QoS) configuration
- **Parallel Processing**: Configurable worker concurrency with async/blocking spawn
- **Middleware**: Custom middleware for logging, metrics, and distributed tracing
- **Distributed Tracing**: Built-in trace ID generation with OpenTelemetry support
- **Handler DI**: Dependency injection for handlers with `Data<T>` wrapper
- **Type Safe**: Strong error handling with thiserror
- **Async**: Full async support using tokio

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
easy-rmq-rs = "1.0"
tokio = { version = "1", features = ["full"] }
```

Or use the local path:

```toml
[dependencies]
easy-rmq-rs = { path = "./easy-rmq-rs" }
```

## Quick Start

### 1. Start RabbitMQ

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

### 2. Create a Publisher

```rust
use easy_rmq_rs::AmqpClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = AmqpClient::new(
        "amqp://guest:guest@localhost:5672".to_string(),
        10  // max pool size
    )?;

    let publisher = client.publisher();

    // Publish text
    publisher.publish_text(
        "order.created",
        "Hello, AMQP!"
    ).await?;

    // Publish JSON
    #[derive(serde::Serialize)]
    struct Order {
        id: String,
        total: f64,
    }

    let order = Order {
        id: "123".to_string(),
        total: 100.0,
    };

    publisher.publish_json("order.created", &order).await?;

    Ok(())
}
```

### 3. Create a Subscriber

```rust
use easy_rmq_rs::{AmqpClient, SubscriberRegistry, WorkerBuilder};
use lapin::ExchangeKind;

#[tokio::main]
async fn main() -> easy_rmq_rs::Result<()> {
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
    Ok(())
}

fn handle_order_event(data: Vec<u8>) -> easy_rmq_rs::Result<()> {
    let msg = String::from_utf8_lossy(&data);
    println!("📦 Order: {}", msg);
    Ok(())
}
```

## Architecture & Best Practices

🎯 **Simple & Clean:**
- **Default Exchange**: `amq.direct` (RabbitMQ built-in)
- **Publisher**: Auto-create exchange + send messages
- **Subscriber**: Auto-create exchange + queue + binding
- **Worker Registry**: Register multiple workers with clean pattern
- **Retry**: Automatic retry with delay for failed messages
- **Prefetch**: AMQP QoS control for message buffering
- **Concurrency**: Parallel worker processing
- **Full Auto-Setup**: No manual infrastructure needed

## Core Components

### AmqpClient

The main entry point for creating publishers and subscribers:

```rust
use easy_rmq_rs::AmqpClient;

let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
let publisher = client.publisher();
let pool = client.channel_pool();
```

### Publisher

Send messages to exchanges:

```rust
let publisher = client.publisher();

// Default exchange
publisher.publish_text("routing.key", "message").await?;

// Custom exchange
let pub1 = client.publisher().with_exchange("orders", ExchangeKind::Direct);
pub1.publish_text("order.created", "Order data").await?;

// Topic exchange
let pub2 = client.publisher().with_topic("logs");
pub2.publish_text("order.created", "Log data").await?;

// Fanout exchange
let pub3 = client.publisher().with_fanout("events");
pub3.publish_text("", "Event data").await?;
```

### Subscriber Registry

Manage multiple workers:

```rust
let registry = SubscriberRegistry::new()
    .register({
        let pool = pool.clone();
        move |_count| {
            WorkerBuilder::new(ExchangeKind::Direct)
                .pool(pool)
                .with_exchange("orders")
                .queue("order.process")
                .build(handle_order)
        }
    })
    .register({
        let pool = pool.clone();
        move |_count| {
            WorkerBuilder::new(ExchangeKind::Topic)
                .pool(pool)
                .with_exchange("logs")
                .routing_key("order.*")
                .queue("api_logs")
                .build(handle_log)
        }
    });

registry.run().await?;
```

### Worker Builder

Configure individual workers:

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .with_exchange("orders.v1")
    .queue("order.process")
    .retry(3, 5000)           // 3 retries, 5s delay
    .prefetch(10)             // Buffer 10 messages
    .concurrency(5)           // 5 parallel workers
    .parallelize(tokio::task::spawn)
    .middleware(logging)
    .build(handler)
```

## Advanced Features

### Retry Mechanism

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("order.process")
    .retry(3, 5000)  // max 3 retries, 5 second delay
    .build(handler)
```

### Single Active Consumer

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("stock.event")
    .single_active_consumer(true)
    .prefetch(1)       // Must be 1
    .concurrency(1)    // Must be 1
    .build(handler)
```

### Prefetch Control

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("order.process")
    .prefetch(10)  // Buffer 10 messages
    .build(handler)
```

### Parallel Processing

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("order.process")
    .prefetch(50)
    .concurrency(10)
    .parallelize(tokio::task::spawn)
    .build(handler)
```

### Middleware

```rust
pub fn logging(_payload: &[u8], result: &Result<()>) -> Result<()> {
    match result {
        Ok(_) => tracing::info!("✓ Message processed successfully"),
        Err(e) => tracing::error!("✗ Message processing failed: {:?}", e),
    }
    Ok(())
}

WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("order.process")
    .middleware(logging)
    .build(handler)
```

### Distributed Tracing

```rust
// Auto-generate trace ID
client.publisher()
    .with_auto_trace_id()
    .publish_text("order.created", "Order data")
    .await?;

// Custom trace ID
client.publisher()
    .with_trace_id("trace-from-otel-123".to_string())
    .publish_text("order.created", "Order data")
    .await?;
```

### Dependency Injection

```rust
use easy_rmq_rs::Data;

#[derive(Clone)]
struct EmailService {
    smtp_server: String,
}

fn send_email(service: Data<EmailService>, data: &[u8]) -> easy_rmq_rs::Result<()> {
    service.send_email(data)
}

let email_service = Data::new(EmailService::new("smtp.gmail.com:587".to_string()));

WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("emails.send")
    .data(email_service)
    .build(send_email)
```

## Examples

See the `examples/` directory in the easy-rmq-rs repository:

- **`publisher.rs`** - Publisher with auto trace ID generation
- **`subscriber.rs`** - Multi-worker with middleware, retry, prefetch, concurrency, and SAC
- **`dependency_injection.rs`** - Handler-level DI with `Data<T>`
- **`dependency_injection_publisher.rs`** - Publisher trait-based DI pattern

Run examples:

```bash
# Terminal 1 - Start subscriber first
cargo run --example subscriber

# Terminal 2 - Then publisher
cargo run --example publisher
```

## Documentation

- [Publisher Guide](/docs/basic/publisher) - Learn about publishers
- [Subscriber Guide](/docs/basic/subscriber) - Learn about subscribers
- [Retry Mechanism](/docs/advanced/retry-mechanism) - Configure retry behavior
- [Prefetch Control](/docs/advanced/prefetch-control) - Control message buffering
- [Parallel Processing](/docs/advanced/parallel-processing) - Configure worker concurrency
- [Single Active Consumer](/docs/advanced/single-active-consumer) - Ensure message ordering
- [Middleware](/docs/advanced/middleware) - Add custom middleware
- [Distributed Tracing](/docs/advanced/distributed-tracing) - Implement distributed tracing
- [Dependency Injection](/docs/basic/dependency-injection) - Use dependency injection

## Requirements

- **Rust**: 1.70 or higher
- **RabbitMQ**: 3.x (or Docker)
- **Tokio**: For async runtime

## License

ISC
