---
sidebar_position: 2
---

# Prefetch Control

Control how many messages are pre-fetched from the broker to optimize throughput and memory usage.

## Basic Prefetch

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("order.process")
    .prefetch(10)  // Buffer 10 messages
    .build(handler)
```

## What is Prefetch?

Prefetch (QoS - Quality of Service) controls how many messages a consumer can receive and buffer before acknowledging them.

### Without Prefetch

```
Broker → Consumer → Buffer → Handler
         ↓
    All unacknowledged
    messages sent
```

### With Prefetch

```
Broker → Consumer → Buffer (size=10) → Handler
         ↓
    Maximum 10 unacknowledged
    messages at a time
```

## Prefetch Behavior

### Without Concurrency (Sequential Processing)

```rust
.prefetch(10)
// No .concurrency()
```

**Behavior:**
- Buffer up to 10 messages
- Process sequentially, one at a time
- Next message starts after previous completes
- Good for: Order-sensitive processing

### With Concurrency (Parallel Processing)

```rust
.prefetch(50)
.concurrency(10)
```

**Behavior:**
- Buffer up to 50 messages
- 10 parallel workers
- ~5 messages per worker (50 / 10)
- Workers compete for messages
- Good for: High-throughput processing

## Configuration Guidelines

### Low Prefetch (1-10)

```rust
.prefetch(5)
```

**Use when:**
- Messages are large
- Processing is slow
- Memory is limited
- Strict ordering needed

**Examples:**
```rust
// Large file processing
.prefetch(2)

// Heavy computation
.prefetch(5)

// Memory-intensive operations
.prefetch(3)
```

### Medium Prefetch (10-50)

```rust
.prefetch(25)
```

**Use when:**
- Balanced throughput
- Standard message sizes
- Normal processing time
- General-purpose workloads

**Examples:**
```rust
// Database operations
.prefetch(20)

// API calls
.prefetch(30)

// Email sending
.prefetch(25)
```

### High Prefetch (50-200)

```rust
.prefetch(100)
```

**Use when:**
- Messages are small
- Processing is fast
- High throughput needed
- Plenty of memory available

**Examples:**
```rust
// Log processing
.prefetch(100)

// Metrics aggregation
.prefetch(150)

// Quick transformations
.prefetch(200)
```

## Prefetch with Concurrency

### Configuration Formula

```rust
// Ideal prefetch = concurrency × messages_per_worker

prefetch(100)
.concurrency(10)
// Each worker: ~10 messages
```

### Examples

```rust
// 10 workers, 5 messages each
.prefetch(50)
.concurrency(10)

// 20 workers, 10 messages each
.prefetch(200)
.concurrency(20)

// 5 workers, 20 messages each
.prefetch(100)
.concurrency(5)
```

## Tuning Prefetch

### Step-by-Step Tuning

1. **Start with baseline:**
```rust
.prefetch(20)
```

2. **Monitor metrics:**
- Consumer lag (queue depth)
- Processing time per message
- Memory usage
- CPU utilization

3. **Adjust based on bottlenecks:**

**Low CPU, High Lag:**
```rust
// Increase prefetch
.prefetch(50)  // was 20
```

**High Memory, Low Lag:**
```rust
// Decrease prefetch
.prefetch(10)  // was 50
```

**Slow Processing, Low CPU:**
```rust
// Increase concurrency
.prefetch(100)
.concurrency(20)  // was 10
```

### Performance Testing

```rust
#[tokio::main]
async fn main() -> easy_rmq::Result<()> {
    // Test different prefetch values
    let prefetch_values = vec![10, 25, 50, 100];
    
    for prefetch in prefetch_values {
        let worker = SubscriberRegistry::new()
            .register({
                let pool = pool.clone();
                move |_count| {
                    WorkerBuilder::new(ExchangeKind::Direct)
                        .pool(pool.clone())
                        .queue("test.queue")
                        .prefetch(prefetch)
                        .build(handler)
                }
            });
        
        // Measure performance
        let start = std::time::Instant::now();
        worker.run().await?;
        let duration = start.elapsed();
        
        println!("Prefetch {}: {:?}", prefetch, duration);
    }
    
    Ok(())
}
```

## Prefetch vs Queue Depth

### Queue Depth vs Prefetch

```
Queue Depth: Total messages waiting in queue
Prefetch: Messages sent to consumer (unacknowledged)
```

### Example Scenario

```
Queue: 1000 messages
Prefetch: 50
Consumers: 10

Messages in queue: 1000
Messages in-flight: 50 (5 per consumer)
Messages waiting: 950
```

## Special Cases

### Single Active Consumer

```rust
.single_active_consumer(true)
.prefetch(1)  // MUST be 1
.concurrency(1)  // MUST be 1
```

⚠️ **Important:** With SAC, prefetch MUST be 1

### Time-Critical Processing

```rust
.prefetch(1)
// Process one message at a time
// Minimize latency
```

### Batch Processing

```rust
.prefetch(1000)
// Buffer large batch
// Process in groups
```

## Monitoring

### Key Metrics

```rust
fn handle_with_metrics(data: Vec<u8>) -> easy_rmq::Result<()> {
    let start = std::time::Instant::now();
    
    // Process message
    process_message(&data)?;
    
    let duration = start.elapsed();
    tracing::debug!("Message processed in {:?}", duration);
    
    Ok(())
}
```

### Queue Monitoring

```bash
# Check queue depth
rabbitmqctl list_queues name messages messages_unacknowledged

# Expected output:
# order.process  1000  50
#                ↑     ↑
#           Queue   Unacknowledged
#           Depth   (prefetch)
```

## Best Practices

1. **Start conservative**: Begin with prefetch=20-30
2. **Monitor constantly**: Track queue depth and processing time
3. **Adjust gradually**: Change prefetch values incrementally
4. **Consider message size**: Larger messages = lower prefetch
5. **Account for concurrency**: Prefetch = concurrency × buffer_per_worker
6. **Test thoroughly**: Load test with production-like traffic
7. **Memory awareness**: Ensure sufficient memory for buffered messages

## Troubleshooting

### Problem: High Memory Usage

**Solution:**
```rust
.prefetch(10)  // Reduce prefetch
```

### Problem: Slow Processing

**Solution:**
```rust
.prefetch(50)
.concurrency(10)  // Increase concurrency
```

### Problem: Consumer Lag

**Solution:**
```rust
.prefetch(100)  // Increase prefetch
.concurrency(20)
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
                    .parallelize(tokio::task::spawn)
                    .build(handle_order)
            }
        });

    worker.run().await?;
    Ok(())
}

fn handle_order(data: Vec<u8>) -> easy_rmq::Result<()> {
    let order: Order = serde_json::from_slice(&data)?;
    // Process order
    Ok(())
}
```

## What's Next

- [Parallel Processing](/docs/advanced/parallel-processing) - Configure worker concurrency
- [Retry Mechanism](/docs/advanced/retry-mechanism) - Handle failed messages
- [Single Active Consumer](/docs/advanced/single-active-consumer) - Ensure message ordering