---
sidebar_position: 3
---

# Examples

Complete working examples demonstrating various Easy RMQ features and patterns.

## Quick Start

### Running the Examples

First, ensure RabbitMQ is running:

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

Clone the repository:

```bash
git clone https://github.com/skyapps-id/easy_rmq
cd easy_rmq
```

### Terminal 1 - Start Subscriber

```bash
cargo run --example subscriber
```

### Terminal 2 - Run Publisher

```bash
cargo run --example publisher
```

Press `Ctrl+C` on subscriber for graceful shutdown.

## Core Examples

### Basic Publisher

Simple publisher with auto trace ID generation:

```rust
use easy_rmq::AmqpClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
    
    // Publish text message
    client.publisher()
        .publish_text("order.created", "Hello, AMQP!")
        .await?;
    
    // Publish JSON message
    #[derive(serde::Serialize)]
    struct Order {
        id: String,
        total: f64,
    }
    
    let order = Order {
        id: "123".to_string(),
        total: 100.0,
    };
    
    client.publisher()
        .publish_json("order.created", &order)
        .await?;
    
    Ok(())
}
```

**File**: `examples/publisher.rs`

### Basic Subscriber

Multi-worker with different configurations:

```rust
use easy_rmq::{AmqpClient, SubscriberRegistry, WorkerBuilder};
use lapin::ExchangeKind;

#[tokio::main]
async fn main() -> easy_rmq::Result<()> {
    let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
    let pool = client.channel_pool();

    let worker = SubscriberRegistry::new()
        .register({
            let pool = pool.clone();
            move |_count| {
                println!("📝 Registering worker #{}", _count);
                WorkerBuilder::new(ExchangeKind::Direct)
                    .pool(pool)
                    .with_exchange("order.events.v1")
                    .queue("order.process")
                    .build(handle_order_event)
            }
        })
        .register({
            let pool = pool.clone();
            move |_count| {
                println!("📝 Registering worker #{}", _count);
                WorkerBuilder::new(ExchangeKind::Topic)
                    .pool(pool)
                    .with_exchange("logs.v1")
                    .routing_key("order.*")
                    .queue("api_logs")
                    .build(handle_log_event)
            }
        });

    worker.run().await?;
    Ok(())
}

fn handle_order_event(data: Vec<u8>) -> easy_rmq::Result<()> {
    let msg = String::from_utf8_lossy(&data);
    println!("📦 Order: {}", msg);
    Ok(())
}

fn handle_log_event(data: Vec<u8>) -> easy_rmq::Result<()> {
    let msg = String::from_utf8_lossy(&data);
    println!("📊 Log: {}", msg);
    Ok(())
}
```

**File**: `examples/subscriber.rs`

### Run Both Examples

```bash
# Terminal 1 - Subscriber
cargo run --example subscriber

# Terminal 2 - Publisher
cargo run --example publisher
```

## Advanced Examples

### Single Active Consumer

Demonstrates SAC for strict message ordering:

```rust
use easy_rmq::{AmqpClient, SubscriberRegistry, WorkerBuilder};
use lapin::ExchangeKind;

#[tokio::main]
async fn main() -> easy_rmq::Result<()> {
    let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
    let pool = client.channel_pool();

    let worker = SubscriberRegistry::new()
        .register({
            let pool = pool.clone();
            move |_count| {
                WorkerBuilder::new(ExchangeKind::Direct)
                    .pool(pool)
                    .with_exchange("stock.events.v1")
                    .queue("stock.event")
                    .single_active_consumer(true)
                    .prefetch(1)
                    .concurrency(1)
                    .build(handle_stock_event)
            }
        });

    worker.run().await?;
    Ok(())
}

fn handle_stock_event(data: Vec<u8>) -> easy_rmq::Result<()> {
    let msg = String::from_utf8_lossy(&data);
    println!("📈 Stock: {}", msg);
    Ok(())
}
```

**File**: `examples/single_active_consumer.rs`

### Run SAC Example

```bash
cargo run --example single_active_consumer
```

## Distributed Tracing Examples

### OpenTelemetry Integration

```rust
use easy_rmq::AmqpClient;
use opentelemetry::trace::TraceContextExt;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
    
    // Get trace ID from current OTel context
    let context = opentelemetry::Context::current();
    let span = context.span();
    let trace_id = span.span_context().trace_id().to_string();
    
    // Pass trace ID through message pipeline
    client.publisher()
        .with_trace_id(trace_id)
        .publish_text("order.created", "Order data")
        .await?;
    
    Ok(())
}
```

**File**: `examples/otel_integration.rs`

### Trace ID Generator

```rust
use easy_rmq::generate_trace_id;

fn main() {
    // Generate trace ID
    let trace_id = generate_trace_id();
    println!("Generated trace ID: {}", trace_id);
    
    // Format: {timestamp_hex}-{random_hex}
    // Example: 19ca9a5f5e1-5e148b1f5008b7d8
}
```

**File**: `examples/trace_id_generator.rs`

### Run Tracing Examples

```bash
# OTel integration
cargo run --example otel_integration

# Generate trace IDs
cargo run --example trace_id_generator
```

## Complete Production Example

### Publisher with All Features

```rust
use easy_rmq::AmqpClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
    
    // Publisher with custom exchange and trace ID
    client.publisher()
        .with_exchange("orders", lapin::ExchangeKind::Direct)
        .with_auto_trace_id()
        .publish_text("order.created", "Order data")
        .await?;
    
    Ok(())
}
```

### Subscriber with All Features

```rust
use easy_rmq::{AmqpClient, SubscriberRegistry, WorkerBuilder};
use lapin::ExchangeKind;

#[tokio::main]
async fn main() -> easy_rmq::Result<()> {
    let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
    let pool = client.channel_pool();

    let worker = SubscriberRegistry::new()
        .register({
            let pool = pool.clone();
            move |_count| {
                WorkerBuilder::new(ExchangeKind::Direct)
                    .pool(pool)
                    .with_exchange("orders")
                    .queue("order.process")
                    .retry(3, 5000)
                    .prefetch(50)
                    .concurrency(10)
                    .parallelize(tokio::task::spawn)
                    .middleware(logging)
                    .middleware(metrics)
                    .build(handler)
            }
        });

    worker.run().await?;
    Ok(())
}

fn handler(data: Vec<u8>) -> easy_rmq::Result<()> {
    let msg = String::from_utf8_lossy(&data);
    println!("Received: {}", msg);
    Ok(())
}

fn logging(_payload: &[u8], result: &Result<()>) -> Result<()> {
    match result {
        Ok(_) => tracing::info!("✓ Message processed successfully"),
        Err(e) => tracing::error!("✗ Message processing failed: {:?}", e),
    }
    Ok(())
}

fn metrics(_payload: &[u8], result: &Result<()>) -> Result<()> {
    match result {
        Ok(_) => tracing::info!("📊 Metrics: message processed"),
        Err(_) => tracing::warn!("✗ Message failed"),
    }
    Ok(())
}
```

## Common Patterns

### Multiple Exchanges

```rust
use lapin::ExchangeKind;

let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;

// Direct exchange
let order_publisher = client.publisher()
    .with_exchange("orders", ExchangeKind::Direct);

// Topic exchange
let log_publisher = client.publisher()
    .with_exchange("logs", ExchangeKind::Topic);

// Fanout exchange
let event_publisher = client.publisher()
    .with_exchange("events", ExchangeKind::Fanout);

// Use publishers
order_publisher.publish_text("order.created", "Order data").await?;
log_publisher.publish_text("order.created", "Log entry").await?;
event_publisher.publish_text("", "Event data").await?;
```

### JSON Message Handling

```rust
#[derive(serde::Serialize, serde::Deserialize)]
struct Order {
    id: String,
    total: f64,
    items: Vec<String>,
}

// Publisher
let order = Order {
    id: "123".to_string(),
    total: 100.0,
    items: vec!["item1".to_string(), "item2".to_string()],
};

client.publisher()
    .publish_json("order.created", &order)
    .await?;

// Subscriber
fn handle_order(data: Vec<u8>) -> easy_rmq::Result<()> {
    let order: Order = serde_json::from_slice(&data)?;
    println!("Order {}: ${}", order.id, order.total);
    Ok(())
}
```

## Testing

### Run Tests

```bash
cargo test
```

### Integration Tests

Create integration test in `tests/integration_test.rs`:

```rust
use easy_rmq::AmqpClient;

#[tokio::test]
async fn test_publish_and_subscribe() {
    let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10).unwrap();
    
    // Publish test message
    client.publisher()
        .publish_text("test", "test message")
        .await
        .unwrap();
    
    // Assert message was published
    assert!(true);
}
```

## Running Examples Summary

| Example | Description | Command |
|---------|-------------|---------|
| Basic Publisher | Simple text/JSON publishing | `cargo run --example publisher` |
| Basic Subscriber | Multi-worker subscriber | `cargo run --example subscriber` |
| SAC Example | Single active consumer demo | `cargo run --example single_active_consumer` |
| OTel Integration | OpenTelemetry patterns | `cargo run --example otel_integration` |
| Trace ID Generator | Generate trace IDs | `cargo run --example trace_id_generator` |

## What's Next

- [Publisher Guide](../basic/publisher) - Learn about publishers
- [Subscriber Guide](../basic/subscriber) - Learn about subscribers
- [Advanced Features](/docs/1.0.0-beta/advanced/retry-mechanism) - Explore retry and concurrency