---
sidebar_position: 3
---

# Parallel Processing

Run multiple workers concurrently with controlled parallelism for high-throughput message processing.

## Basic Parallel Processing

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("order.process")
    .prefetch(50)              // Buffer 50 messages
    .concurrency(10)           // Spawn 10 parallel workers
    .parallelize(tokio::task::spawn)  // Async tasks
    .build(handler)
```

## Configuration Breakdown

### Prefetch

```rust
.prefetch(50)
```
- AMQP prefetch count (buffer size from broker)
- Total messages distributed among all workers

### Concurrency

```rust
.concurrency(10)
```
- Number of parallel worker tasks
- Each worker has its own consumer loop

### Parallelize

```rust
.parallelize(tokio::task::spawn)
```
- Spawn function for task creation
- Determines execution model

## Execution Models

### Async Tasks (Default)

```rust
.parallelize(tokio::task::spawn)
```

**Use for:**
- I/O-bound operations
- Database queries
- HTTP/API calls
- Network operations

**Example:**
```rust
.parallelize(tokio::task::spawn)

async fn handle_order(data: Vec<u8>) -> easy_rmq::Result<()> {
    // I/O operations
    let order: Order = serde_json::from_slice(&data)?;
    db::save_order(&order).await?;
    api::notify_customer(&order.customer_id).await?;
    Ok(())
}
```

### Blocking Tasks

```rust
.parallelize(tokio::task::spawn_blocking)
```

**Use for:**
- CPU-intensive operations
- Blocking system calls
- Heavy computations
- File system operations

**Example:**
```rust
.parallelize(tokio::task::spawn_blocking)

fn handle_order(data: Vec<u8>) -> easy_rmq::Result<()> {
    // CPU-intensive operations
    let order: Order = serde_json::from_slice(&data)?;
    let result = heavy_computation(&order)?;
    let encrypted = encrypt_data(&result)?;
    Ok(())
}
```

## Worker Model

### How Workers Compete

```
Broker (prefetch=50)
    ↓
Consumer Channel
    ↓
Message Dispatcher
    ↓
┌─────────┬─────────┬─────────┐
│Worker 1 │Worker 2 │Worker 3 │ ... Worker 10
│~5 msgs  │~5 msgs  │~5 msgs  │
└─────────┴─────────┴─────────┘
```

Each worker:
- Has its own consumer loop
- Receives messages from the same queue
- Competes for messages (RabbitMQ round-robin)
- Processes independently

### Message Distribution

```rust
.prefetch(50)
.concurrency(10)
```

**Distribution:**
- Total prefetch: 50 messages
- Workers: 10
- Messages per worker: ~5 (50 / 10)
- Workers compete for messages as they complete

## Configuration Examples

### Low Concurrency (1-5 workers)

```rust
.prefetch(25)
.concurrency(3)
.parallelize(tokio::task::spawn)
```

**Use when:**
- Limited resources
- Slow external systems
- Rate-limited APIs
- Database connection limits

### Medium Concurrency (5-20 workers)

```rust
.prefetch(100)
.concurrency(10)
.parallelize(tokio::task::spawn)
```

**Use when:**
- Balanced workload
- Standard throughput
- General-purpose processing

### High Concurrency (20-100 workers)

```rust
.prefetch(500)
.concurrency(50)
.parallelize(tokio::task::spawn)
```

**Use when:**
- High-throughput requirements
- Fast external systems
- Plenty of resources
- Scalable infrastructure

## Complete Configuration

### Sequential Processing

```rust
// No concurrency, process one at a time
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("order.process")
    .build(handler)
```

**Behavior:**
- 1 message at a time
- No prefetch
- No parallelization

### Buffered Sequential

```rust
// Buffer messages, process sequentially
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("order.process")
    .prefetch(10)
    .build(handler)
```

**Behavior:**
- Buffer 10 messages
- Process 1 at a time
- No parallel workers

### Parallel Async

```rust
// Parallel workers with async execution
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("order.process")
    .prefetch(50)
    .concurrency(10)
    .parallelize(tokio::task::spawn)
    .build(handler)
```

**Behavior:**
- 10 parallel workers
- Async I/O execution
- ~5 messages per worker

### Parallel Blocking

```rust
// Parallel workers with blocking execution
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("order.process")
    .prefetch(50)
    .concurrency(10)
    .parallelize(tokio::task::spawn_blocking)
    .build(handler)
```

**Behavior:**
- 10 parallel workers
- Blocking thread execution
- ~5 messages per worker

## Comparison Table

| Configuration | `.prefetch()` | `.concurrency()` | `.parallelize()` | Workers | Messages/Worker | Behavior |
|---------------|---------------|------------------|------------------|---------|-----------------|----------|
| Sequential | Not set / 1 | Not set | Not set | 1 | 1 | 1 message at a time |
| Buffered | 10 | Not set | Not set | 1 | 10 | Buffer 10, process 1-by-1 |
| Parallel Async | 50 | 10 | `tokio::task::spawn` | 10 | ~5 | 10 workers, async |
| Parallel Blocking | 50 | 10 | `tokio::task::spawn_blocking` | 10 | ~5 | 10 workers, blocking |

## Performance Tuning

### Tuning Steps

1. **Baseline Configuration:**
```rust
.prefetch(20)
.concurrency(5)
.parallelize(tokio::task::spawn)
```

2. **Load Test:**
- Measure throughput (messages/second)
- Monitor CPU, memory, network
- Check queue depth

3. **Adjust Based on Bottlenecks:**

**CPU Underutilized:**
```rust
.concurrency(20)  // Increase workers
```

**High Memory:**
```rust
.prefetch(30)  // Reduce prefetch
```

**Slow External API:**
```rust
.concurrency(50)  // More parallel requests
```

### Formula for Optimal Configuration

```rust
// For I/O-bound operations
prefetch = concurrency × 5_to_10
concurrency = min(100, num_cpu_cores × 2)

// For CPU-bound operations
prefetch = concurrency × 2_to_3
concurrency = num_cpu_cores
```

## Best Practices

### Use Async for I/O

```rust
.parallelize(tokio::task::spawn)

async fn handle(data: Vec<u8>) -> easy_rmq::Result<()> {
    // I/O operations
    db.save(data).await?;
    api.call().await?;
    Ok(())
}
```

### Use Blocking for CPU

```rust
.parallelize(tokio::task::spawn_blocking)

fn handle(data: Vec<u8>) -> easy_rmq::Result<()> {
    // CPU operations
    let result = process(data)?;
    Ok(())
}
```

### Monitor Resource Usage

```rust
fn handle_with_metrics(data: Vec<u8>) -> easy_rmq::Result<()> {
    let start = std::time::Instant::now();
    
    process_message(&data)?;
    
    let duration = start.elapsed();
    tracing::debug!("Processing time: {:?}", duration);
    
    Ok(())
}
```

## Common Patterns

### Rate-Limited Processing

```rust
.prefetch(20)
.concurrency(5)  // Limited concurrency
.parallelize(tokio::task::spawn)
```

### High-Throughput Processing

```rust
.prefetch(200)
.concurrency(50)
.parallelize(tokio::task::spawn)
```

### CPU-Intensive Processing

```rust
.prefetch(20)
.concurrency(4)  // CPU cores
.parallelize(tokio::task::spawn_blocking)
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
                    .retry(3, 5000)
                    .prefetch(50)  // Buffer 50 messages
                    .concurrency(10)  // 10 parallel workers
                    .parallelize(tokio::task::spawn)  // Async execution
                    .middleware(logging)
                    .build(handle_order)
            }
        });

    worker.run().await?;
    Ok(())
}

async fn handle_order(data: Vec<u8>) -> easy_rmq::Result<()> {
    let order: Order = serde_json::from_slice(&data)?;
    
    // I/O operations
    db::save_order(&order).await?;
    api::notify_customer(&order.customer_id).await?;
    
    Ok(())
}

fn logging(_payload: &[u8], result: &Result<()>) -> easy_rmq::Result<()> {
    match result {
        Ok(_) => tracing::info!("✓ Message processed"),
        Err(e) => tracing::error!("✗ Message failed: {:?}", e),
    }
    Ok(())
}
```

## What's Next

- [Prefetch Control](/docs/advanced/prefetch-control) - Optimize message buffering
- [Retry Mechanism](/docs/advanced/retry-mechanism) - Handle failed messages
- [Single Active Consumer](/docs/advanced/single-active-consumer) - Ensure message ordering