---
sidebar_position: 1
---

# Retry Mechanism

Automatically retry failed messages with configurable delay and max attempts.

## Basic Retry

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .with_exchange("order.events.v1")
    .queue("order.process")
    .retry(3, 5000)  // max 3 retries, 5 second delay
    .build(handler)
```

## How Retry Works

### Retry Queue Flow

```
Original Queue → Processing Failed
                ↓
          Retry Queue (with TTL)
                ↓
        Original Queue (retry)
                ↓
        After max retries
                ↓
          Dead Letter Queue
```

### Process Details

1. **Message Processing**: Handler returns `Err`
2. **Retry Queue**: Message sent to `{queue}.retry` with TTL
3. **Delay**: TTL expires after configured delay (e.g., 5000ms)
4. **Retry**: Message returns to original queue for retry
5. **Max Retries**: After exceeding max retries, sent to `{queue}.dlq`
6. **Dead Letter**: Message stored in DLQ for manual inspection

### Retry Count Tracking

Retry count is tracked in message headers:

```rust
pub fn get_retry_count() -> Option<u32> {
    easy_rmq::get_headers()
        .and_then(|h| h.inner().get("x-retry-count").cloned())
        .and_then(|v| match v {
            lapin::types::AMQPValue::ShortInteger(i) => Some(i as u32),
            _ => None,
        })
}

fn handle_with_retry_info(data: Vec<u8>) -> easy_rmq::Result<()> {
    let retry_count = get_retry_count().unwrap_or(0);
    println!("Processing message (attempt {})", retry_count + 1);
    
    // Process message
    Ok(())
}
```

## Configuration

### Retry Parameters

```rust
.retry(max_retries, delay_ms)
```

- **max_retries**: Maximum number of retry attempts (0 = no retry)
- **delay_ms**: Delay in milliseconds between retries

### Examples

```rust
// No retry (default)
.retry(0, 0)

// Retry 3 times with 5 second delay
.retry(3, 5000)

// Retry 10 times with 30 second delay
.retry(10, 30000)

// Retry 5 times with 1 second delay
.retry(5, 1000)
```

## Queue Names

When retry is enabled, Easy RMQ automatically creates:

| Queue | Purpose |
|-------|---------|
| `{queue}.retry` | Retry queue with TTL |
| `{queue}.dlq` | Dead letter queue for failed messages |

**Example:**
```rust
.queue("order.process")
// Creates:
// - order.process (main queue)
// - order.process.retry (retry queue)
// - order.process.dlq (dead letter queue)
```

## Dead Letter Queue

### What is DLQ?

Dead Letter Queue (DLQ) stores messages that failed after all retry attempts.

### Monitoring DLQ

```rust
use easy_rmq::AmqpClient;

let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;

// Create consumer for DLQ
let pool = client.channel_pool();

let dlq_worker = SubscriberRegistry::new()
    .register({
        let pool = pool.clone();
        move |_count| {
            WorkerBuilder::new(ExchangeKind::Direct)
                .pool(pool)
                .queue("order.process.dlq")
                .build(handle_failed_message)
        }
    });

fn handle_failed_message(data: Vec<u8>) -> easy_rmq::Result<()> {
    let msg = String::from_utf8_lossy(&data);
    tracing::error!("Message failed after all retries: {}", msg);
    // Alert team, log to monitoring, etc.
    Ok(())
}
```

## Best Practices

### Retry Configuration

1. **Transient Failures**: Use retry for network issues, temporary unavailability
2. **Delay Strategy**: Choose delay based on failure recovery time
3. **Max Retries**: Set reasonable limit to avoid infinite retries
4. **DLQ Monitoring**: Monitor DLQ for persistent issues

### Example Use Cases

```rust
// Network failures - retry with backoff
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("api.call")
    .retry(5, 2000)  // 5 retries, 2s delay
    .build(call_external_api)

// Database locks - quick retry
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("db.update")
    .retry(3, 500)  // 3 retries, 500ms delay
    .build(update_database)

// Payment processing - no retry (manual intervention)
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("payment.process")
    .retry(0, 0)  // No retry
    .build(process_payment)
```

### Error Categorization

```rust
fn handle_with_categorization(data: Vec<u8>) -> easy_rmq::Result<()> {
    match process_message(&data) {
        Ok(_) => Ok(()),
        Err(e) if is_transient_error(&e) => {
            // Return error for retry
            Err(easy_rmq::Error::Custom(e.to_string()))
        }
        Err(e) => {
            // Log permanent error, don't retry
            tracing::error!("Permanent error: {:?}", e);
            // Return Ok to prevent retry
            Ok(())
        }
    }
}

fn is_transient_error(err: &Error) -> bool {
    // Check if error is transient (network, timeout, etc.)
    matches!(err.kind(), ErrorKind::ConnectionRefused | ErrorKind::TimedOut)
}
```

## Monitoring

### Metrics to Track

1. **Retry Rate**: Percentage of messages being retried
2. **DLQ Size**: Number of messages in dead letter queue
3. **Retry Count Distribution**: Average retries per message
4. **Failure Reasons**: Common failure patterns

### Example Monitoring

```rust
fn handle_with_metrics(data: Vec<u8>) -> easy_rmq::Result<()> {
    let retry_count = get_retry_count().unwrap_or(0);
    
    match process_message(&data) {
        Ok(_) => {
            if retry_count > 0 {
                tracing::info!("Message succeeded after {} retries", retry_count);
            }
            Ok(())
        }
        Err(e) => {
            tracing::warn!("Message failed (attempt {}): {:?}", retry_count + 1, e);
            Err(e.into())
        }
    }
}
```

## Complete Example

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
                    .retry(3, 5000)  // 3 retries, 5s delay
                    .build(handle_order)
            }
        });

    worker.run().await?;
    Ok(())
}

fn handle_order(data: Vec<u8>) -> easy_rmq::Result<()> {
    let order: Order = serde_json::from_slice(&data)?;
    
    match process_order(&order) {
        Ok(_) => {
            tracing::info!("Order {} processed successfully", order.id);
            Ok(())
        }
        Err(e) if is_transient(&e) => {
            tracing::warn!("Order {} failed transiently: {:?}", order.id, e);
            Err(easy_rmq::Error::Custom(e.to_string()))
        }
        Err(e) => {
            tracing::error!("Order {} failed permanently: {:?}", order.id, e);
            // Don't retry permanent errors
            Ok(())
        }
    }
}
```

## What's Next

- [Prefetch Control](/docs/1.0.0-beta/advanced/prefetch-control) - Control message buffering
- [Parallel Processing](/docs/1.0.0-beta/advanced/parallel-processing) - Configure worker concurrency
- [Single Active Consumer](/docs/1.0.0-beta/advanced/single-active-consumer) - Ensure message ordering