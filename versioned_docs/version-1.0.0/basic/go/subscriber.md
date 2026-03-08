---
sidebar_position: 2
---

# Subscriber Guide (Go)

Subscribers receive messages from queues using a clean and powerful worker registry pattern with automatic setup.

## Basic Subscriber

Create a simple subscriber with a handler:

```go
package main

import (
    easyrmq "github.com/skyapps-id/easy-rmq-go/pkg/easyrmq"
)

func main() {
    client, _ := easyrmq.NewClient("amqp://guest:guest@localhost:5672", 10)
    defer client.Close()

    worker := easyrmq.NewSubscriberRegistry().
        Register(func(count int) easyrmq.Worker {
            return easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
                WithPool(client).
                WithExchange("order.events.v1").
                Queue("order.process").
                Build(handleOrderEvent)
        })

    worker.Run()
}

func handleOrderEvent(data []byte) error {
    msg := string(data)
    println("📦 Order:", msg)
    return nil
}
```

## Worker Registry

Register multiple workers with different configurations:

```go
worker := easyrmq.NewSubscriberRegistry().
    Register(func(count int) easyrmq.Worker {
        println("📝 Registering worker #", count)
        return easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
            WithPool(client).
            WithExchange("order.events.v1").
            Queue("order.process").
            Build(handleOrderEvent)
    }).
    Register(func(count int) easyrmq.Worker {
        println("📝 Registering worker #", count)
        return easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindTopic).
            WithPool(client).
            WithExchange("logs.v1").
            RoutingKey("order.*").
            Queue("api_logs").
            Build(handleLogEvent)
    })

worker.Run()
```

## Queue Format per Exchange Type

### Direct Exchange

```go
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    WithPool(client).
    WithExchange("order.events").
    Queue("order.created").  // routing_key
    Build(handler)
// Queue: "order.created.job"
// Binding: queue_bind("order.created.job", "order.events", "order.created")
```

### Topic Exchange

```go
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindTopic).
    WithPool(client).
    WithExchange("logs").
    RoutingKey("order.*").  // routing pattern
    Queue("api_logs").      // queue name
    Build(handler)
// Queue: "api_logs"
// Binding: queue_bind("api_logs", "logs", "order.*")
```

### Fanout Exchange

```go
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindFanout).
    WithPool(client).
    WithExchange("events").
    Queue("notification_q").
    Build(handler)
// Queue: "notification_q"
// Binding: queue_bind("notification_q", "events", "")
```

## Message Handlers

Handler functions receive message data as `[]byte`:

```go
func handleTextMessage(data []byte) error {
    msg := string(data)
    println("Received:", msg)
    return nil
}

func handleJSONMessage(data []byte) error {
    type Order struct {
        ID    string  `json:"id"`
        Total float64 `json:"total"`
    }

    var order Order
    if err := json.Unmarshal(data, &order); err != nil {
        return err
    }

    println("Order ID:", order.ID, "Total:", order.Total)
    return nil
}
```

## Graceful Shutdown

The subscriber handles graceful shutdown automatically:

```go
worker := easyrmq.NewSubscriberRegistry().
    Register(/* ... */).
    Run()

// Press Ctrl+C to gracefully shutdown
// All in-flight messages will be processed
```

## Error Handling

Handlers can return errors for automatic retry:

```go
func handleWithError(data []byte) error {
    if someCondition {
        return fmt.Errorf("processing failed")
    }
    // Process message
    return nil
}
```

## Best Practices

1. **Use Worker Registry**: Manage multiple workers with consistent pattern
2. **Handler functions**: Keep handlers simple and focused
3. **Error handling**: Return errors for retry, handle unrecoverable errors
4. **Queue naming**: Use descriptive queue names following the exchange type pattern
5. **Graceful shutdown**: Ensure your handlers complete processing before shutdown
