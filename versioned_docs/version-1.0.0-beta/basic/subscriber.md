---
sidebar_position: 3
---

# Subscriber Guide

Subscribers receive messages from queues using a clean and powerful worker registry pattern with automatic setup.

## Basic Subscriber

Create a simple subscriber with a handler:

```rust
use easy_rmq::{AmqpClient, SubscriberRegistry, WorkerBuilder};
use lapin::ExchangeKind;

#[tokio::main]
async fn main() -> easy_rmq::Result<()> {
    let client = AmqpClient::new(
        "amqp://guest:guest@localhost:5672".to_string(),
        10
    )?;
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

fn handle_order_event(data: Vec<u8>) -> easy_rmq::Result<()> {
    let msg = String::from_utf8_lossy(&data);
    println!("📦 Order: {}", msg);
    Ok(())
}
```

## Worker Registry

Register multiple workers with different configurations:

```rust
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
```

## Queue Format per Exchange Type

### Direct Exchange

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .with_exchange("order.events")
    .queue("order.created")  // routing_key
    .build(handler)
// Queue: "order.created.job"
// Binding: queue_bind("order.created.job", "order.events", "order.created")
```

### Topic Exchange

```rust
WorkerBuilder::new(ExchangeKind::Topic)
    .pool(pool)
    .with_exchange("logs")
    .routing_key("order.*")  // routing pattern
    .queue("api_logs")       // queue name
    .build(handler)
// Queue: "api_logs"
// Binding: queue_bind("api_logs", "logs", "order.*")
```

### Fanout Exchange

```rust
WorkerBuilder::new(ExchangeKind::Fanout)
    .pool(pool)
    .with_exchange("events")
    .queue("notification_q")
    .build(handler)
// Queue: "notification_q"
// Binding: queue_bind("notification_q", "events", "")
```

## Message Handlers

Handler functions receive message data as `Vec<u8>`:

```rust
fn handle_text_message(data: Vec<u8>) -> easy_rmq::Result<()> {
    let msg = String::from_utf8_lossy(&data);
    println!("Received: {}", msg);
    Ok(())
}

fn handle_json_message(data: Vec<u8>) -> easy_rmq::Result<()> {
    #[derive(serde::Deserialize)]
    struct Order {
        id: String,
        total: f64,
    }
    
    let order: Order = serde_json::from_slice(&data)?;
    println!("Order ID: {}, Total: {}", order.id, order.total);
    Ok(())
}
```

## Graceful Shutdown

The subscriber handles graceful shutdown automatically:

```rust
let worker = SubscriberRegistry::new()
    .register(/* ... */)
    .run()
    .await?;

// Press Ctrl+C to gracefully shutdown
// All in-flight messages will be processed
```

## Error Handling

Handlers can return errors for automatic retry:

```rust
fn handle_with_error(data: Vec<u8>) -> easy_rmq::Result<()> {
    if some_condition {
        return Err(easy_rmq::Error::Custom("Processing failed".into()));
    }
    // Process message
    Ok(())
}
```

## Best Practices

1. **Use Worker Registry**: Manage multiple workers with consistent pattern
2. **Handler functions**: Keep handlers simple and focused
3. **Error handling**: Return errors for retry, handle unrecoverable errors
4. **Queue naming**: Use descriptive queue names following the exchange type pattern
5. **Graceful shutdown**: Ensure your handlers complete processing before shutdown