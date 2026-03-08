---
sidebar_position: 1
---

# Easy RMQ for Go (easy-rmq-go)

Easy RMQ for Go is a modern AMQP library that provides a simple and powerful way to work with RabbitMQ in your Go applications.

## Features

- **Connection Pool**: Efficiently manages AMQP connections
- **Publisher**: Send messages to exchanges with routing keys
- **Subscriber**: Receive messages from queues with handlers
- **Worker Registry**: Register and manage multiple workers with a clean pattern
- **Auto Setup**: Automatically creates exchanges and queues
- **Retry Mechanism**: Automatic retry with delay for failed messages
- **Single Active Consumer**: Ensure only one consumer processes messages at a time
- **Prefetch Control**: AMQP prefetch (QoS) configuration
- **Parallel Processing**: Configurable worker concurrency with goroutines
- **Middleware**: Custom middleware for logging, metrics, and distributed tracing
- **Distributed Tracing**: Built-in trace ID generation with OpenTelemetry support
- **Handler DI**: Dependency injection for handlers
- **Type Safe**: Strong error handling
- **Async**: Full async support using goroutines and channels

## Installation

```bash
go get github.com/easyrmq/easy-rmq-go
```

## Quick Start

### 1. Start RabbitMQ

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

### 2. Create a Publisher

```go
package main

import (
    "log"
    easyrmq "github.com/easyrmq/easy-rmq-go/pkg/easyrmq"
)

func main() {
    client, err := easyrmq.NewClient(
        "amqp://guest:guest@localhost:5672",
        10,  // max pool size
    )
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    publisher := client.Publisher()

    // Publish text
    err = publisher.PublishText("order.created", "Hello, AMQP!")

    // Publish JSON
    type Order struct {
        ID    string  `json:"id"`
        Total float64 `json:"total"`
    }

    order := Order{ID: "123", Total: 100.0}
    err = publisher.PublishJSON("order.created", order)
}
```

### 3. Create a Subscriber

```go
package main

import (
    "fmt"
    easyrmq "github.com/easyrmq/easy-rmq-go/pkg/easyrmq"
)

func handleOrderEvent(data []byte) error {
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
                WithExchange("order.events.v1").
                Queue("order.process").
                Build(handleOrderEvent)
        })

    registry.Run()
}
```

## Architecture & Best Practices

🎯 **Simple & Clean:**
- **Default Exchange**: `amq.direct` (RabbitMQ built-in)
- **Publisher**: Auto-create exchange + send messages
- **Subscriber**: Auto-create exchange + queue + binding
- **Worker Registry**: Register multiple workers with clean pattern
- **Retry**: Automatic retry with delay for failed messages
- **Prefetch**: AMQP QoS control for message buffering
- **Concurrency**: Parallel worker processing
- **Full Auto-Setup**: No manual infrastructure needed

## Core Components

### Client

The main entry point for creating publishers and subscribers:

```go
client, err := easyrmq.NewClient("amqp://guest:guest@localhost:5672", 10)
publisher := client.Publisher()
pool := client.ChannelPool()
```

### Publisher

Send messages to exchanges:

```go
publisher := client.Publisher()

// Default exchange
publisher.PublishText("routing.key", "message")

// Custom exchange
pub1 := client.Publisher().WithExchange("orders")
pub1.PublishText("order.created", "Order data")

// Topic exchange
pub2 := client.Publisher().WithTopic("logs")
pub2.PublishText("order.created", "Log data")

// Fanout exchange
pub3 := client.Publisher().WithFanout("events")
pub3.PublishText("", "Event data")
```

### Subscriber Registry

Manage multiple workers:

```go
registry := easyrmq.NewSubscriberRegistry().
    Register(func(_ int) *easyrmq.BuiltWorker {
        return easyrmq.NewWorkerBuilder("direct").
            Pool(pool).
            WithExchange("orders").
            Queue("order.process").
            Build(handleOrder)
    }).
    Register(func(_ int) *easyrmq.BuiltWorker {
        return easyrmq.NewWorkerBuilder("topic").
            Pool(pool).
            WithExchange("logs").
            RoutingKey("order.*").
            Queue("api_logs").
            Build(handleLog)
    })

registry.Run()
```

### Worker Builder

Configure individual workers:

```go
easyrmq.NewWorkerBuilder("direct").
    Pool(pool).
    WithExchange("orders.v1").
    Queue("order.process").
    Retry(3, 5000).           // 3 retries, 5s delay
    Prefetch(10).             // Buffer 10 messages
    Concurrency(5).           // 5 parallel workers
    Middleware(&LoggingMiddleware{}).
    Build(handler)
```

## Advanced Features

### Retry Mechanism

```go
easyrmq.NewWorkerBuilder("direct").
    Pool(pool).
    Queue("order.process").
    Retry(3, 5000)  // max 3 retries, 5 second delay
    Build(handler)
```

### Single Active Consumer

```go
easyrmq.NewWorkerBuilder("direct").
    Pool(pool).
    Queue("stock.event").
    SingleActiveConsumer(true).
    Prefetch(1).       // Must be 1
    Concurrency(1).    // Must be 1
    Build(handler)
```

### Prefetch Control

```go
easyrmq.NewWorkerBuilder("direct").
    Pool(pool).
    Queue("order.process").
    Prefetch(10)  // Buffer 10 messages
    Build(handler)
```

### Parallel Processing

```go
easyrmq.NewWorkerBuilder("direct").
    Pool(pool).
    Queue("order.process").
    Prefetch(50).
    Concurrency(10).
    Build(handler)
```

### Middleware

```go
type LoggingMiddleware struct{}

func (lm *LoggingMiddleware) Before(payload []byte) error {
    return nil
}

func (lm *LoggingMiddleware) After(payload []byte, result error) error {
    if result != nil {
        fmt.Println("✓ Message processed successfully")
    } else {
        fmt.Printf("✗ Message processing failed: %v\n", result)
    }
    return nil
}

easyrmq.NewWorkerBuilder("direct").
    Pool(pool).
    Queue("order.process").
    Middleware(&LoggingMiddleware{}).
    Build(handler)
```

### Distributed Tracing

```go
// Auto-generate trace ID
client.Publisher().
    WithAutoTraceID().
    PublishText("order.created", "Order data")

// Custom trace ID
client.Publisher().
    WithTraceID("trace-from-otel-123").
    PublishText("order.created", "Order data")
```

## Examples

See the `examples/` directory in the easy-rmq-go repository:

- **`publisher/`** - Publisher with auto trace ID generation
- **`subscriber/`** - Multi-worker with middleware, retry, prefetch, concurrency, and SAC

Run examples:

```bash
# Terminal 1 - Start subscriber first
cd examples/subscriber
go run main.go

# Terminal 2 - Then publisher
cd examples/publisher
go run main.go
```

## Documentation

- [Publisher Guide](/docs/basic/publisher) - Learn about publishers
- [Subscriber Guide](/docs/basic/subscriber) - Learn about subscribers
- [Retry Mechanism](/docs/advanced/retry-mechanism) - Configure retry behavior
- [Prefetch Control](/docs/advanced/prefetch-control) - Control message buffering
- [Parallel Processing](/docs/advanced/parallel-processing) - Configure worker concurrency
- [Single Active Consumer](/docs/advanced/single-active-consumer) - Ensure message ordering
- [Middleware](/docs/advanced/middleware) - Add custom middleware
- [Distributed Tracing](/docs/advanced/distributed-tracing) - Implement distributed tracing

## Requirements

- **Go**: 1.19 or higher
- **RabbitMQ**: 3.x (or Docker)

## License

ISC
