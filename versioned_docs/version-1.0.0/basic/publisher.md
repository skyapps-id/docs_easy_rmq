---
sidebar_position: 2
---

# Publisher Guide

The publisher provides a simple and powerful way to send messages to RabbitMQ exchanges with automatic setup and various configuration options.

## Basic Publisher

Create a publisher and send messages:

```rust
use easy_rmq::AmqpClient;

let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;

let publisher = client.publisher();

// Publish text
publisher.publish_text("order.created", "Hello, AMQP!").await?;

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
```

## Features

✅ **Auto send to default exchange** (`amq.direct`)  
✅ **Auto-create exchange** if not exists (durable)  
✅ **No manual setup needed**

## Multiple Exchanges

You can create publishers for different exchange types:

```rust
use lapin::ExchangeKind;

let client = AmqpClient::new("...", 10)?;

// Publisher 1 - Direct exchange
let pub1 = client.publisher().with_exchange("orders", ExchangeKind::Direct);
pub1.publish_text("order.created", "Order data").await?;

// Publisher 2 - Topic exchange
let pub2 = client.publisher().with_exchange("logs", ExchangeKind::Topic);
pub2.publish_text("order.created", "Log data").await?;

// Publisher 3 - Fanout exchange
let pub3 = client.publisher().with_exchange("broadcast", ExchangeKind::Fanout);
pub3.publish_text("any", "Broadcast data").await?;

// Shortcut methods
let pub4 = client.publisher().with_topic("logs");
let pub5 = client.publisher().with_direct("orders");
let pub6 = client.publisher().with_fanout("events");
```

## Exchange Types

### Direct Exchange

Messages are routed to queues based on exact routing key match:

```rust
let publisher = client.publisher()
    .with_direct("orders");

publisher.publish_text("order.created", "Order data").await?;
```

### Topic Exchange

Messages are routed based on pattern matching:

```rust
let publisher = client.publisher()
    .with_topic("logs");

publisher.publish_text("order.created", "Order created log").await?;
publisher.publish_text("order.updated", "Order updated log").await?;
publisher.publish_text("error.critical", "Critical error log").await?;
```

### Fanout Exchange

Messages are broadcast to all bound queues:

```rust
let publisher = client.publisher()
    .with_fanout("events");

publisher.publish_text("", "Event data").await?;
```

## Distributed Tracing

Add trace IDs to track messages across services:

```rust
// Auto-generate trace ID
client.publisher()
    .with_auto_trace_id()
    .publish_text("order.created", "Order data")
    .await?;

// Use custom trace ID (e.g., from OpenTelemetry)
client.publisher()
    .with_trace_id("trace-from-otel-123".to_string())
    .publish_text("order.created", "Order data")
    .await?;

// Generate standalone trace ID
use easy_rmq::generate_trace_id;
let trace_id = generate_trace_id();
client.publisher()
    .with_trace_id(trace_id)
    .publish_text("order.created", "Order data")
    .await?;
```

## Error Handling

Publishers return `Result<()>` for proper error handling:

```rust
match publisher.publish_text("order.created", "Order data").await {
    Ok(_) => println!("Message published successfully"),
    Err(e) => eprintln!("Failed to publish message: {:?}", e),
}
```

## Best Practices

1. **Use appropriate exchange types**: Choose Direct, Topic, or Fanout based on your routing needs
2. **Implement error handling**: Always handle publish errors appropriately
3. **Add trace IDs**: Use distributed tracing for better debugging and monitoring
4. **Use JSON serialization**: For structured data, prefer `publish_json()` over manual serialization
5. **Connection pooling**: The publisher uses the connection pool efficiently, no need to manage connections manually