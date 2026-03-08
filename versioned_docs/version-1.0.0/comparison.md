---
sidebar_position: 2
---

# Comparing Rust and Go Versions

Easy RMQ is available in both **Rust** and **Go**, providing similar functionality with language-specific optimizations and patterns. This guide helps you understand the differences and choose the right version for your project.

## Overview

| Feature | Rust (easy-rmq-rs) | Go (easy-rmq-go) |
|---------|-------------------|------------------|
| **Async Model** | Tokio async/await | Goroutines & channels |
| **Error Handling** | `Result<T, E>` with `thiserror` | Multiple return values with custom errors |
| **Dependency Injection** | Trait-based + `Data<T>` wrapper | Interface-based + struct injection |
| **Middleware** | Static functions | Struct with `Before`/`After` methods |
| **Type Safety** | Compile-time guarantees | Runtime type assertions |
| **Performance** | Zero-cost abstractions | Efficient garbage collection |
| **Learning Curve** | Steeper (ownership, lifetimes) | Gentler (simpler syntax) |

## When to Choose Rust

Choose the **Rust version** if:

- ✅ You need **maximum performance** with zero-cost abstractions
- ✅ You want **compile-time type safety** and memory safety guarantees
- ✅ You're building **high-throughput systems** with strict performance requirements
- ✅ You prefer **trait-based** dependency injection patterns
- ✅ You want **static dispatch** and monomorphization
- ✅ You're already using Rust in your stack

### Rust Strengths

```rust
// Compile-time type safety
#[derive(serde::Serialize)]
struct Order {
    id: String,
    total: f64,
}

publisher.publish_json("order.created", &order).await?;

// Zero-cost abstractions
WorkerBuilder::new(ExchangeKind::Direct)
    .pool(pool)
    .queue("order.process")
    .retry(3, 5000)
    .build(handler)
```

**Benefits:**
- No runtime overhead for abstractions
- Memory safety without garbage collector
- Fearless concurrency with async/await
- Pattern matching and enum types

## When to Choose Go

Choose the **Go version** if:

- ✅ You want **simplicity** and rapid development
- ✅ You're building **microservices** with quick iteration cycles
- ✅ You need **easy concurrency** with goroutines
- ✅ You prefer **interface-based** dependency injection
- ✅ You want **fast compilation** and simple deployment
- ✅ You're already using Go in your stack

### Go Strengths

```go
// Simple and idiomatic
type Order struct {
    ID    string  `json:"id"`
    Total float64 `json:"total"`
}

order := Order{ID: "123", Total: 100.0}
publisher.PublishJSON("order.created", order)

// Easy concurrency with goroutines
easyrmq.NewWorkerBuilder("direct").
    Pool(pool).
    Queue("order.process").
    Concurrency(10).
    Build(handler)
```

**Benefits:**
- Simple syntax and fast learning curve
- Built-in concurrency primitives
- Fast compilation and deployment
- Rich standard library

## Feature Comparison

### 1. Publisher Pattern

**Rust:**
```rust
let publisher = client.publisher();
publisher.publish_text("order.created", "Hello!").await?;
```

**Go:**
```go
publisher := client.Publisher()
publisher.PublishText("order.created", "Hello!")
```

**Difference:** Rust uses async/await, Go uses synchronous calls with goroutines.

### 2. Subscriber Pattern

**Rust:**
```rust
let registry = SubscriberRegistry::new()
    .register({
        let pool = pool.clone();
        move |_count| {
            WorkerBuilder::new(ExchangeKind::Direct)
                .pool(pool)
                .queue("order.process")
                .build(handle)
        }
    });
registry.run().await?;
```

**Go:**
```go
registry := easyrmq.NewSubscriberRegistry().
    Register(func(_ int) *easyrmq.BuiltWorker {
        return easyrmq.NewWorkerBuilder("direct").
            Pool(pool).
            Queue("order.process").
            Build(handle)
    })
registry.Run()
```

**Difference:** Similar patterns with language-specific syntax (closures vs functions).

### 3. Dependency Injection

**Rust (Trait-based):**
```rust
pub trait AmqpPublisher {
    async fn publish(&self, exchange: &str, routing_key: &str, payload: &[u8]) -> Result<()>;
}

struct OrderService {
    publisher: Arc<dyn AmqpPublisher>,
}
```

**Go (Interface-based):**
```go
type AmqpPublisher interface {
    Publish(exchange, routingKey string, payload []byte) error
}

type OrderService struct {
    publisher AmqpPublisher
}
```

**Difference:** Rust uses traits with static dispatch, Go uses interfaces with dynamic dispatch.

### 4. Middleware

**Rust (Static Functions):**
```rust
pub fn logging(_payload: &[u8], result: &Result<()>) -> Result<()> {
    match result {
        Ok(_) => tracing::info!("✓ Message processed"),
        Err(e) => tracing::error!("✗ Failed: {:?}", e),
    }
    Ok(())
}

WorkerBuilder::new(ExchangeKind::Direct)
    .middleware(logging)
    .build(handler)
```

**Go (Struct Methods):**
```go
type LoggingMiddleware struct{}

func (lm *LoggingMiddleware) Before(payload []byte) error {
    return nil
}

func (lm *LoggingMiddleware) After(payload []byte, result error) error {
    if result != nil {
        fmt.Println("✓ Message processed")
    }
    return nil
}

easyrmq.NewWorkerBuilder("direct").
    Middleware(&LoggingMiddleware{}).
    Build(handler)
```

**Difference:** Rust uses static functions, Go uses struct with methods (more explicit).

### 5. Error Handling

**Rust (Result Type):**
```rust
fn handle_message(data: Vec<u8>) -> easy_rmq_rs::Result<()> {
    let order: Order = serde_json::from_slice(&data)?;
    process_order(&order)?;
    Ok(())
}
```

**Go (Multiple Returns):**
```go
func handleMessage(data []byte) error {
    var order Order
    if err := json.Unmarshal(data, &order); err != nil {
        return err
    }
    return processOrder(&order)
}
```

**Difference:** Rust uses `?` operator for error propagation, Go uses explicit if statements.

## Performance Considerations

### Rust Performance

- **Memory:** No garbage collector, deterministic memory usage
- **CPU:** Zero-cost abstractions, LLVM optimizations
- **Concurrency:** Async/await with minimal overhead
- **Binary:** Larger binary size, but faster execution

**Best for:** High-throughput systems, real-time processing, low-latency requirements

### Go Performance

- **Memory:** Garbage collector with short pause times
- **CPU:** Efficient goroutine scheduler
- **Concurrency:** Lightweight goroutines (~2KB stack)
- **Binary:** Smaller binary size, fast startup

**Best for:** Microservices, web backends, rapid prototyping

## Code Examples Side-by-Side

### Complete Publisher Example

**Rust:**
```rust
use easy_rmq_rs::AmqpClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;

    client.publisher()
        .with_auto_trace_id()
        .publish_text("order.created", "Order data")
        .await?;

    Ok(())
}
```

**Go:**
```go
package main

import easyrmq "github.com/easyrmq/easy-rmq-go/pkg/easyrmq"

func main() {
    client, _ := easyrmq.NewClient("amqp://guest:guest@localhost:5672", 10)
    defer client.Close()

    client.Publisher().
        WithAutoTraceID().
        PublishText("order.created", "Order data")
}
```

### Complete Subscriber Example

**Rust:**
```rust
use easy_rmq_rs::{AmqpClient, SubscriberRegistry, WorkerBuilder};
use lapin::ExchangeKind;

#[tokio::main]
async fn main() -> easy_rmq_rs::Result<()> {
    let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
    let pool = client.channel_pool();

    let registry = SubscriberRegistry::new()
        .register({
            let pool = pool.clone();
            move |_count| {
                WorkerBuilder::new(ExchangeKind::Direct)
                    .pool(pool)
                    .queue("order.process")
                    .retry(3, 5000)
                    .build(handle_order)
            }
        });

    registry.run().await?;
    Ok(())
}

fn handle_order(data: Vec<u8>) -> easy_rmq_rs::Result<()> {
    let msg = String::from_utf8_lossy(&data);
    println!("📦 Order: {}", msg);
    Ok(())
}
```

**Go:**
```go
package main

import easyrmq "github.com/easyrmq/easy-rmq-go/pkg/easyrmq"

func handleOrder(data []byte) error {
    msg := string(data)
    fmt.Printf("📦 Order: %s\n", msg)
    return nil
}

func main() {
    client, _ := easyrmq.NewClient("amqp://guest:guest@localhost:5672", 10)
    pool := client.ChannelPool()

    registry := easyrmq.NewSubscriberRegistry().
        Register(func(_ int) *easyrmq.BuiltWorker {
            return easyrmq.NewWorkerBuilder("direct").
                Pool(pool).
                Queue("order.process").
                Retry(3, 5000).
                Build(handleOrder)
        })

    registry.Run()
}
```

## Migration Guide

### Rust → Go

1. **Replace `async fn` with regular `func`**
2. **Remove `.await?` and use error checking**
3. **Change `Vec<u8>` to `[]byte`**
4. **Replace `Result<T, E>` with error returns**
5. **Use struct methods instead of closures for middleware**

### Go → Rust

1. **Add `async`/`.await` for async operations**
2. **Use `Result<T, E>` instead of error returns**
3. **Replace `[]byte` with `Vec<u8>`**
4. **Use closures instead of struct methods for middleware**
5. **Add `#[tokio::main]` to main function**

## Conclusion

Both versions provide the same core functionality with language-specific optimizations:

- **Choose Rust** for maximum performance, type safety, and compile-time guarantees
- **Choose Go** for simplicity, rapid development, and easy concurrency

The API patterns are intentionally similar, making it easy to switch between versions if needed.

## See Also

- [Rust Documentation](/docs/rust) - Easy RMQ for Rust
- [Go Documentation](/docs/go) - Easy RMQ for Go
- [Examples](/docs/examples) - Complete working examples
