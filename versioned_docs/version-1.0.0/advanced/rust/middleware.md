---
sidebar_position: 5
---

# Middleware

Add custom middleware for logging, metrics, distributed tracing, and other cross-cutting concerns.

## Basic Middleware

```rust
fn logging(_payload: &[u8], result: &Result<()>) -> Result<()> {
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

## Middleware Function Signature

```rust
fn middleware(
    payload: &[u8],
    result: &Result<()>,
) -> Result<()>
```

**Parameters:**
- `payload`: Raw message bytes
- `result`: Result of handler execution

**Returns:**
- `Ok(())`: Continue processing
- `Err(_)`: Stop processing (optional)

## Execution Order

```
Message Arrives
    ↓
Before Middleware (if implemented)
    ↓
Handler Function
    ↓
After Middleware (current)
    ↓
Ack/Nack Message
```

## Built-in Middleware

### Logging Middleware

```rust
pub fn logging(_payload: &[u8], result: &Result<()>) -> Result<()> {
    match result {
        Ok(_) => tracing::info!("✓ Message processed successfully"),
        Err(e) => tracing::error!("✗ Message processing failed: {:?}", e),
    }
    Ok(())
}
```

**Usage:**
```rust
.middleware(logging)
```

### Metrics Middleware

```rust
pub fn metrics(_payload: &[u8], result: &Result<()>) -> Result<()> {
    static SUCCESS_COUNT: AtomicU64 = AtomicU64::new(0);
    static ERROR_COUNT: AtomicU64 = AtomicU64::new(0);
    
    match result {
        Ok(_) => {
            let count = SUCCESS_COUNT.fetch_add(1, Ordering::Relaxed);
            tracing::info!("📊 Success count: {}", count + 1);
        }
        Err(_) => {
            let count = ERROR_COUNT.fetch_add(1, Ordering::Relaxed);
            tracing::warn!("📊 Error count: {}", count + 1);
        }
    }
    Ok(())
}
```

**Usage:**
```rust
.middleware(metrics)
```

### Tracing Middleware

```rust
pub fn tracing(_payload: &[u8], result: &Result<()>) -> Result<()> {
    let trace_id = extract_trace_id()
        .unwrap_or_else(|| "unknown".to_string());
    
    match result {
        Ok(_) => tracing::info!("✓ Processed - trace-id: {}", trace_id),
        Err(e) => tracing::warn!("✗ Failed - trace-id: {} | error: {:?}", trace_id, e),
    }
    Ok(())
}

fn extract_trace_id() -> Option<String> {
    easy_rmq::get_headers()
        .and_then(|h| h.inner().get("x-trace-id").cloned())
        .and_then(|v| match v {
            lapin::types::AMQPValue::LongString(s) => Some(s.to_string()),
            lapin::types::AMQPValue::ShortString(s) => Some(s.to_string()),
            _ => None,
        })
}
```

**Usage:**
```rust
.middleware(tracing)
```

## Custom Middleware

### Timing Middleware

```rust
fn timing(payload: &[u8], result: &Result<()>) -> Result<()> {
    use std::time::Instant;
    
    thread_local! {
        static START_TIME: RefCell<Option<Instant>> = RefCell::new(None);
    }
    
    // Before handler
    if result.is_ok() {
        START_TIME.with(|start| {
            *start.borrow_mut() = Some(Instant::now());
        });
    }
    
    // After handler
    if let Ok(_) = result {
        START_TIME.with(|start| {
            if let Some(start_time) = start.borrow().as_ref() {
                let duration = start_time.elapsed();
                tracing::info!("⏱️ Processing time: {:?}", duration);
            }
        });
    }
    
    Ok(())
}
```

### Validation Middleware

```rust
fn validation(payload: &[u8], _result: &Result<()>) -> Result<()> {
    // Validate message size
    if payload.len() > 1_000_000 {
        tracing::error!("Message too large: {} bytes", payload.len());
        return Err(easy_rmq::Error::Custom("Message too large".into()));
    }
    
    // Validate JSON structure
    if let Err(e) = serde_json::from_slice::<serde_json::Value>(payload) {
        tracing::error!("Invalid JSON: {:?}", e);
        return Err(easy_rmq::Error::Custom(format!("Invalid JSON: {}", e)));
    }
    
    Ok(())
}
```

### Enrichment Middleware

```rust
fn enrichment(payload: &[u8], result: &Result<()>) -> Result<()> {
    if let Ok(msg) = serde_json::from_slice::<Value>(payload) {
        // Add metadata
        let enriched = json!({
            "data": msg,
            "processed_at": Utc::now().to_rfc3339(),
            "consumer_id": get_consumer_id(),
        });
        
        tracing::debug!("Enriched message: {}", enriched);
    }
    
    Ok(())
}
```

### Rate Limiting Middleware

```rust
fn rate_limiter(payload: &[u8], result: &Result<()>) -> Result<()> {
    use std::sync::atomic::{AtomicU64, Ordering};
    
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    static LAST_RESET: AtomicU64 = AtomicU64::new(0);
    
    let now = Utc::now().timestamp() as u64;
    let last_reset = LAST_RESET.load(Ordering::Relaxed);
    
    // Reset counter every minute
    if now - last_reset > 60 {
        COUNTER.store(0, Ordering::Relaxed);
        LAST_RESET.store(now, Ordering::Relaxed);
    }
    
    let count = COUNTER.fetch_add(1, Ordering::Relaxed);
    
    if count > 1000 {
        tracing::warn!("Rate limit exceeded: {} messages/min", count);
        return Err(easy_rmq::Error::Custom("Rate limit exceeded".into()));
    }
    
    Ok(())
}
```

## Chaining Middleware

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("order.process")
    .middleware(validation)     // 1. Validate message
    .middleware(rate_limiter)   // 2. Check rate limit
    .middleware(tracing)        // 3. Log trace ID
    .middleware(timing)         // 4. Measure time
    .middleware(metrics)        // 5. Track metrics
    .middleware(logging)        // 6. Log result
    .build(handler)
```

**Execution Order:**
1. Validation
2. Rate limiting
3. Tracing
4. Timing
5. Metrics
6. Logging

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
                    .retry(3, 5000)
                    .prefetch(50)
                    .concurrency(10)
                    .parallelize(tokio::task::spawn)
                    .middleware(validation)
                    .middleware(tracing)
                    .middleware(timing)
                    .middleware(metrics)
                    .middleware(logging)
                    .build(handle_order)
            }
        });

    worker.run().await?;
    Ok(())
}

fn validation(payload: &[u8], _result: &Result<()>) -> easy_rmq::Result<()> {
    if payload.len() > 1_000_000 {
        return Err(easy_rmq::Error::Custom("Message too large".into()));
    }
    Ok(())
}

fn tracing(_payload: &[u8], result: &Result<()>) -> easy_rmq::Result<()> {
    let trace_id = extract_trace_id().unwrap_or_else(|| "unknown".to_string());
    match result {
        Ok(_) => tracing::info!("✓ Processed - trace-id: {}", trace_id),
        Err(e) => tracing::warn!("✗ Failed - trace-id: {} | error: {:?}", trace_id, e),
    }
    Ok(())
}

fn timing(_payload: &[u8], result: &Result<()>) -> easy_rmq::Result<()> {
    use std::time::Instant;
    thread_local! {
        static START_TIME: RefCell<Option<Instant>> = RefCell::new(None);
    }
    
    if result.is_ok() {
        START_TIME.with(|start| *start.borrow_mut() = Some(Instant::now()));
    } else {
        START_TIME.with(|start| {
            if let Some(start_time) = start.borrow().as_ref() {
                let duration = start_time.elapsed();
                tracing::info!("⏱️ Processing time: {:?}", duration);
            }
        });
    }
    Ok(())
}

fn metrics(_payload: &[u8], result: &Result<()>) -> easy_rmq::Result<()> {
    static SUCCESS_COUNT: AtomicU64 = AtomicU64::new(0);
    static ERROR_COUNT: AtomicU64 = AtomicU64::new(0);
    
    match result {
        Ok(_) => {
            let count = SUCCESS_COUNT.fetch_add(1, Ordering::Relaxed);
            tracing::info!("📊 Success: {}", count + 1);
        }
        Err(_) => {
            let count = ERROR_COUNT.fetch_add(1, Ordering::Relaxed);
            tracing::warn!("📊 Error: {}", count + 1);
        }
    }
    Ok(())
}

fn logging(_payload: &[u8], result: &Result<()>) -> easy_rmq::Result<()> {
    match result {
        Ok(_) => tracing::info!("✓ Message processed"),
        Err(e) => tracing::error!("✗ Message failed: {:?}", e),
    }
    Ok(())
}

fn handle_order(data: Vec<u8>) -> easy_rmq::Result<()> {
    let order: Order = serde_json::from_slice(&data)?;
    // Process order
    Ok(())
}
```

## Best Practices

1. **Keep middleware simple**: Each middleware should do one thing
2. **Order matters**: Place validation before expensive operations
3. **Don't swallow errors**: Let errors propagate for retry
4. **Use thread-local storage**: For before/after state
5. **Monitor overhead**: Middleware adds latency, measure it
6. **Test middleware**: Test middleware independently

## Common Patterns

### Circuit Breaker

```rust
fn circuit_breaker(payload: &[u8], result: &Result<()>) -> Result<()> {
    static FAILURE_COUNT: AtomicU64 = AtomicU64::new(0);
    static LAST_FAILURE: AtomicU64 = AtomicU64::new(0);
    
    let now = Utc::now().timestamp() as u64;
    let failures = FAILURE_COUNT.load(Ordering::Relaxed);
    
    // Check if circuit is open
    if failures > 10 {
        let last_failure = LAST_FAILURE.load(Ordering::Relaxed);
        if now - last_failure < 60 {
            return Err(easy_rmq::Error::Custom("Circuit breaker open".into()));
        } else {
            // Reset circuit breaker
            FAILURE_COUNT.store(0, Ordering::Relaxed);
        }
    }
    
    // Track failures
    if result.is_err() {
        FAILURE_COUNT.fetch_add(1, Ordering::Relaxed);
        LAST_FAILURE.store(now, Ordering::Relaxed);
    }
    
    Ok(())
}
```

### Dead Letter Queue

```rust
fn dead_letter(payload: &[u8], result: &Result<()>) -> Result<()> {
    if let Err(e) = result {
        tracing::error!("Message failed, sending to DLQ: {:?}", e);
        
        // Send to dead letter queue
        let client = get_dlq_client()?;
        client.publisher()
            .publish_text("dlq", String::from_utf8_lossy(payload))
            .await?;
    }
    
    Ok(())
}
```

## What's Next

- [Distributed Tracing](/docs/advanced/distributed-tracing) - Advanced tracing patterns
- [Retry Mechanism](/docs/advanced/retry-mechanism) - Handle failed messages
- [Prefetch Control](/docs/advanced/prefetch-control) - Optimize message buffering