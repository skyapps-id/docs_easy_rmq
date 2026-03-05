---
sidebar_position: 4
---

# Distributed Tracing

Easy RMQ provides built-in support for distributed tracing with automatic or custom trace ID generation, perfect for tracking message flows through your system.

## Publisher with Trace ID

### Auto-generate Trace ID

```rust
use easy_rmq::AmqpClient;

let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;

// Option 1: Auto-generate trace ID (recommended for most cases)
client.publisher()
    .with_auto_trace_id()
    .publish_text("order.created", "Order data")
    .await?;
```

### Custom Trace ID

```rust
// Option 2: Use custom trace ID (e.g., from OpenTelemetry)
client.publisher()
    .with_trace_id("trace-from-otel-123".to_string())
    .publish_text("order.created", "Order data")
    .await?;
```

### Generate Standalone Trace ID

```rust
// Option 3: Generate standalone trace ID
use easy_rmq::generate_trace_id;
let trace_id = generate_trace_id();
client.publisher()
    .with_trace_id(trace_id)
    .publish_text("order.created", "Order data")
    .await?;
```

## Subscriber: Extract Trace ID

The subscriber automatically stores message headers in thread-local storage, accessible via `easy_rmq::get_headers()`:

```rust
use easy_rmq::Result;

// In your handler or middleware
pub fn extract_trace_id() -> Option<String> {
    easy_rmq::get_headers()
        .and_then(|h| h.inner().get("x-trace-id").cloned())
        .and_then(|v| match v {
            lapin::types::AMQPValue::LongString(s) => Some(s.to_string()),
            lapin::types::AMQPValue::ShortString(s) => Some(s.to_string()),
            _ => None,
        })
}

fn handle_event(data: Vec<u8>) -> Result<()> {
    let trace_id = extract_trace_id().unwrap_or_else(|| "unknown".to_string());
    tracing::info!("Processing message - trace-id: {}", trace_id);
    
    // Process message...
    Ok(())
}
```

## Middleware: Automatic Trace ID Logging

Use the built-in `tracing` middleware for automatic trace ID extraction and logging:

```rust
use easy_rmq::{WorkerBuilder, SubscriberRegistry};
use lapin::ExchangeKind;

// Add tracing middleware
let worker = SubscriberRegistry::new()
    .register({
        let pool = pool.clone();
        move |_count| {
            WorkerBuilder::new(ExchangeKind::Direct)
                .pool(pool)
                .with_exchange("orders")
                .queue("order.process")
                .middleware(common::middleware::tracing)  // Auto-log trace IDs
                .build(handler)
        }
    });
```

### Sample Output

```
INFO Message processed - trace-id: 19ca9a5f5e1-5e148b1f5008b7d8
WARN Message failed - trace-id: 19ca9a5f5e1-5e148b1f5008b7d8 | error: ...
```

## OpenTelemetry Integration

For production distributed tracing with OpenTelemetry:

```rust
use opentelemetry::trace::TraceContextExt;

// Get trace ID from current OTel context
let context = opentelemetry::Context::current();
let span = context.span();
let trace_id = span.span_context().trace_id().to_string();

// Pass trace ID through message pipeline
client.publisher()
    .with_trace_id(trace_id)
    .publish_text("order.created", payload)
    .await?;

// Or auto-generate when no OTel context available
client.publisher()
    .with_auto_trace_id()
    .publish_text("order.created", payload)
    .await?;
```

## Complete Tracing Flow

### Publisher Side

```rust
use easy_rmq::AmqpClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
    
    // Publish with trace ID
    client.publisher()
        .with_auto_trace_id()
        .publish_text("order.created", "Order #12345")
        .await?;
    
    Ok(())
}
```

### Subscriber Side with Tracing

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
                    .with_exchange("order.events.v1")
                    .queue("order.process")
                    .build(handle_order_event)
            }
        });

    worker.run().await?;
    Ok(())
}

fn handle_order_event(data: Vec<u8>) -> easy_rmq::Result<()> {
    // Extract trace ID from message headers
    let trace_id = easy_rmq::get_headers()
        .and_then(|h| h.inner().get("x-trace-id").cloned())
        .and_then(|v| match v {
            lapin::types::AMQPValue::LongString(s) => Some(s.to_string()),
            lapin::types::AMQPValue::ShortString(s) => Some(s.to_string()),
            _ => None,
        })
        .unwrap_or_else(|| "unknown".to_string());

    let msg = String::from_utf8_lossy(&data);
    
    // Log with trace ID
    tracing::info!(
        trace_id = %trace_id,
        message = %msg,
        "Processing order event"
    );
    
    // Process message...
    Ok(())
}
```

## Benefits

- ✅ Track messages across services
- ✅ Correlate logs with trace IDs
- ✅ Debug distributed systems
- ✅ Monitor message flows
- ✅ OTel-compatible

## Trace ID Format

Format: `{timestamp_hex}-{random_hex}`

Example: `19ca9a5f5e1-5e148b1f5008b7d8`

## Best Practices

1. **Always use trace IDs**: Enable trace IDs for all production messages
2. **Correlate logs**: Include trace IDs in all log statements
3. **OpenTelemetry integration**: Use OTel trace IDs when available
4. **Middleware**: Use built-in tracing middleware for automatic logging
5. **Debugging**: Use trace IDs to track message flows through your system