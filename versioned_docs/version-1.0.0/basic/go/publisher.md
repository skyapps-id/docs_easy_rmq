---
sidebar_position: 1
---

# Publisher Guide (Go)

The publisher provides a simple and powerful way to send messages to RabbitMQ exchanges with automatic setup and various configuration options.

## Basic Publisher

Create a publisher and send messages:

```go
package main

import (
    easyrmq "github.com/skyapps-id/easy-rmq-go/pkg/easyrmq"
)

func main() {
    client, _ := easyrmq.NewClient("amqp://guest:guest@localhost:5672", 10)
    defer client.Close()

    publisher := client.Publisher()

    // Publish text
    publisher.PublishText("order.created", "Hello, AMQP!")

    // Publish JSON
    type Order struct {
        ID    string  `json:"id"`
        Total float64 `json:"total"`
    }

    order := Order{
        ID:    "123",
        Total: 100.0,
    }

    publisher.PublishJSON("order.created", order)
}
```

## Features

✅ **Auto send to default exchange** (`amq.direct`)  
✅ **Auto-create exchange** if not exists (durable)  
✅ **No manual setup needed**

## Multiple Exchanges

You can create publishers for different exchange types:

```go
client, _ := easyrmq.NewClient("amqp://guest:guest@localhost:5672", 10)

// Publisher 1 - Direct exchange
pub1 := client.Publisher().WithExchange("orders", easyrmq.ExchangeKindDirect)
pub1.PublishText("order.created", "Order data")

// Publisher 2 - Topic exchange
pub2 := client.Publisher().WithExchange("logs", easyrmq.ExchangeKindTopic)
pub2.PublishText("order.created", "Log data")

// Publisher 3 - Fanout exchange
pub3 := client.Publisher().WithExchange("broadcast", easyrmq.ExchangeKindFanout)
pub3.PublishText("any", "Broadcast data")

// Shortcut methods
pub4 := client.Publisher().WithTopic("logs")
pub5 := client.Publisher().WithDirect("orders")
pub6 := client.Publisher().WithFanout("events")
```

## Exchange Types

### Direct Exchange

Messages are routed to queues based on exact routing key match:

```go
publisher := client.Publisher().WithDirect("orders")

publisher.PublishText("order.created", "Order data")
```

### Topic Exchange

Messages are routed based on pattern matching:

```go
publisher := client.Publisher().WithTopic("logs")

publisher.PublishText("order.created", "Order created log")
publisher.PublishText("order.updated", "Order updated log")
publisher.PublishText("error.critical", "Critical error log")
```

### Fanout Exchange

Messages are broadcast to all bound queues:

```go
publisher := client.Publisher().WithFanout("events")

publisher.PublishText("", "Event data")
```

## Distributed Tracing

Add trace IDs to track messages across services:

```go
// Auto-generate trace ID
client.Publisher().
    WithAutoTraceID().
    PublishText("order.created", "Order data")

// Use custom trace ID (e.g., from OpenTelemetry)
client.Publisher().
    WithTraceID("trace-from-otel-123").
    PublishText("order.created", "Order data")

// Generate standalone trace ID
traceID := easyrmq.GenerateTraceID()
client.Publisher().
    WithTraceID(traceID).
    PublishText("order.created", "Order data")
```

## Error Handling

Publishers return `error` for proper error handling:

```go
err := publisher.PublishText("order.created", "Order data")
if err != nil {
    log.Printf("Failed to publish message: %v", err)
} else {
    log.Println("Message published successfully")
}
```

## Best Practices

1. **Use appropriate exchange types**: Choose Direct, Topic, or Fanout based on your routing needs
2. **Implement error handling**: Always handle publish errors appropriately
3. **Add trace IDs**: Use distributed tracing for better debugging and monitoring
4. **Use JSON serialization**: For structured data, prefer `PublishJSON()` over manual serialization
5. **Connection pooling**: The publisher uses the connection pool efficiently, no need to manage connections manually
