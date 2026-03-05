---
sidebar_position: 4
---

# Single Active Consumer

Enable single active consumer mode to ensure only one consumer processes messages at a time for strict message ordering.

## Basic Single Active Consumer

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .with_exchange("stock.events.v1")
    .queue("stock.event")
    .single_active_consumer(true)
    .prefetch(1)  // MUST be 1
    .concurrency(1)  // MUST be 1
    .build(handler)
```

## What is Single Active Consumer?

Single Active Consumer (SAC) ensures that only one consumer actively receives messages from a queue at a time.

### Without SAC (Parallel Processing)

```
Queue → Consumer 1 (active)
     → Consumer 2 (active)
     → Consumer 3 (active)
     
Messages distributed to all consumers
Race conditions possible
```

### With SAC (Sequential Processing)

```
Queue → Consumer 1 (active)
     → Consumer 2 (standby)
     → Consumer 3 (standby)
     
Only one consumer active
Others on standby for failover
```

## Use Cases

### 1. Inventory/Stock Updates

Prevent overselling by processing sequentially:

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .with_exchange("stock.events.v1")
    .queue("stock.update")
    .single_active_consumer(true)
    .prefetch(1)
    .concurrency(1)
    .build(handle_stock_update)

fn handle_stock_update(data: Vec<u8>) -> easy_rmq::Result<()> {
    let update: StockUpdate = serde_json::from_slice(&data)?;
    
    // Read current stock
    let current = db::get_stock(update.item_id)?;
    
    // Apply update
    let new_stock = current + update.delta;
    
    // Write new stock
    db::update_stock(update.item_id, new_stock)?;
    
    Ok(())
}
```

### 2. Payment Processing

Ensure transactions processed in order:

```rust
.single_active_consumer(true)
.prefetch(1)
.concurrency(1)
.build(handle_payment)
```

### 3. Workflow Orchestration

Maintain strict execution order:

```rust
.single_active_consumer(true)
.prefetch(1)
.concurrency(1)
.build(handle_workflow)
```

### 4. High Availability with Failover

Automatic failover to standby consumers:

```rust
// Primary consumer: Active
// Standby consumers: On standby
// If primary fails: Standby takes over
```

## Critical Requirements

### MUST Set Prefetch to 1

```rust
.single_active_consumer(true)
.prefetch(1)  // ← MUST be 1
```

**Why:**
- SAC ensures only ONE consumer is active
- If prefetch > 1: Single consumer buffers multiple messages
- Risk of race conditions with buffered messages

### MUST Set Concurrency to 1

```rust
.single_active_consumer(true)
.concurrency(1)  // ← MUST be 1
```

**Why:**
- SAC ensures only ONE consumer is active
- If concurrency > 1: Single consumer runs parallel workers
- Breaks message ordering with parallel execution

## Race Condition Example

### Without SAC (Parallel)

```rust
// Message 1: "Item A stock +10"
// Message 2: "Item A stock -5"

// Without SAC:
Consumer 1: reads stock: 50 → adds 10 → writes: 60
Consumer 2: reads stock: 50 → subtracts 5 → writes: 45
// Result: 45 ❌ WRONG! Should be 55
```

### With SAC (Sequential)

```rust
// Message 1: "Item A stock +10"
// Message 2: "Item A stock -5"

// With SAC:
Consumer 1: reads stock: 50 → adds 10 → writes: 60
Consumer 1: reads stock: 60 → subtracts 5 → writes: 55
// Result: 55 ✓ CORRECT!
```

## Configuration Examples

### Basic SAC

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("stock.update")
    .single_active_consumer(true)
    .prefetch(1)
    .concurrency(1)
    .build(handler)
```

### SAC with Retry

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("stock.update")
    .single_active_consumer(true)
    .retry(3, 5000)
    .prefetch(1)
    .concurrency(1)
    .build(handler)
```

### SAC with Middleware

```rust
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("stock.update")
    .single_active_consumer(true)
    .prefetch(1)
    .concurrency(1)
    .middleware(logging)
    .middleware(tracing)
    .build(handler)
```

## High Availability

### Standby Consumers

With SAC, you can run multiple consumers:

```rust
// Terminal 1
cargo run --example subscriber

// Terminal 2
cargo run --example subscriber

// Terminal 3
cargo run --example subscriber
```

**Behavior:**
- One consumer: Active
- Other consumers: Standby
- If active fails: Standby takes over
- Automatic failover

### Failover Scenario

```
Initial State:
  Consumer 1: ACTIVE
  Consumer 2: STANDBY
  Consumer 3: STANDBY

Consumer 1 Fails:
  Consumer 2: becomes ACTIVE
  Consumer 3: remains STANDBY

Consumer 2 Fails:
  Consumer 3: becomes ACTIVE
```

## Requirements

### RabbitMQ Version

- **Minimum**: RabbitMQ 3.12+
- **Plugin**: `rabbitmq_single_active_consumer`

### Enable Plugin

```bash
rabbitmq-plugins enable rabbitmq_single_active_consumer
```

### Verify Plugin

```bash
rabbitmq-plugins list | grep single_active_consumer
```

## Complete Example

### Stock Update with SAC

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
                    .queue("stock.update")
                    .single_active_consumer(true)
                    .retry(3, 5000)
                    .prefetch(1)
                    .concurrency(1)
                    .parallelize(tokio::task::spawn)
                    .middleware(logging)
                    .build(handle_stock_update)
            }
        });

    worker.run().await?;
    Ok(())
}

#[derive(serde::Deserialize)]
struct StockUpdate {
    item_id: String,
    delta: i32,
}

fn handle_stock_update(data: Vec<u8>) -> easy_rmq::Result<()> {
    let update: StockUpdate = serde_json::from_slice(&data)?;
    
    tracing::info!("Processing stock update: {} ({})", update.item_id, update.delta);
    
    // Read current stock
    let current = db::get_stock(&update.item_id)?;
    tracing::info!("Current stock: {}", current);
    
    // Apply update
    let new_stock = current + update.delta;
    tracing::info!("New stock: {}", new_stock);
    
    // Write new stock
    db::update_stock(&update.item_id, new_stock)?;
    
    tracing::info!("Stock updated successfully");
    
    Ok(())
}

fn logging(_payload: &[u8], result: &Result<()>) -> easy_rmq::Result<()> {
    match result {
        Ok(_) => tracing::info!("✓ Stock update processed"),
        Err(e) => tracing::error!("✗ Stock update failed: {:?}", e),
    }
    Ok(())
}
```

## Testing SAC

### Test Sequential Processing

```bash
# Terminal 1 - Start consumer
cargo run --example consumer

# Terminal 2 - Publish messages
# Message 1: {"item_id": "A", "delta": 10}
# Message 2: {"item_id": "A", "delta": -5}
# Message 3: {"item_id": "A", "delta": 20}

# Verify: Stock = initial + 10 - 5 + 20
```

### Test Failover

```bash
# Terminal 1 - Start consumer 1
cargo run --example consumer

# Terminal 2 - Start consumer 2
cargo run --example consumer

# Terminal 3 - Kill consumer 1 (Ctrl+C)
# Consumer 2 should take over
```

## Best Practices

1. **Always use prefetch(1)**: Required to prevent race conditions
2. **Always use concurrency(1)**: Required to maintain ordering
3. **Monitor active consumer**: Track which consumer is active
4. **Test failover**: Verify standby consumers take over correctly
5. **Use for ordering**: Only when strict ordering is required
6. **Consider performance**: SAC reduces throughput vs parallel processing

## Monitoring

### Check Active Consumer

```rust
fn handle_with_consumer_info(data: Vec<u8>) -> easy_rmq::Result<()> {
    let consumer_tag = easy_rmq::get_consumer_tag()?;
    tracing::info!("Processing with consumer: {}", consumer_tag);
    
    process_message(&data)?;
    
    Ok(())
}
```

### Log Consumer State

```rust
fn log_consumer_state() {
    let consumer_tag = easy_rmq::get_consumer_tag().unwrap_or_else(|_| "unknown".to_string());
    tracing::info!("Consumer tag: {}", consumer_tag);
}
```

## Troubleshooting

### Problem: Race Conditions

**Solution:**
```rust
.single_active_consumer(true)
.prefetch(1)  // MUST be 1
.concurrency(1)  // MUST be 1
```

### Problem: SAC Not Working

**Check:**
1. RabbitMQ version >= 3.12
2. Plugin enabled: `rabbitmq_single_active_consumer`
3. prefetch(1) and concurrency(1) set

### Problem: Consumer Not Failing Over

**Check:**
1. Multiple consumers running
2. Queue has SAC enabled
3. Consumer connections healthy

## What's Next

- [Prefetch Control](/docs/1.0.0/advanced/prefetch-control) - Understanding QoS
- [Parallel Processing](/docs/1.0.0/advanced/parallel-processing) - When NOT to use SAC
- [Retry Mechanism](/docs/1.0.0/advanced/retry-mechanism) - Handle failed messages