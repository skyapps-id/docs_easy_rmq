---
sidebar_position: 4
---

# Single Active Consumer (Go)

Ensure only one consumer processes messages from a queue at a time.

## Basic Usage

```go
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    WithPool(client).
    WithExchange("order.events.v1").
    Queue("order.process").
    SingleActiveConsumer(true).
    Build(handler)
```

## What is Single Active Consumer?

Single Active Consumer ensures that only one consumer receives messages from a queue at any time:

```
Without SAC:                  With SAC:
[C1][C2][C3]                  [Active][Standby][Standby]
  |   |   |                      |         (backup)
 Msg1 Msg2 Msg3              Msg1 Msg2 Msg3
(Round-robin)                (Only active receives)
```

## Benefits

✅ **Message Ordering**: Ensure messages are processed in order  
✅ **Exclusive Access**: Only one consumer processes at a time  
✅ **Automatic Failover**: Standby consumers take over if active fails  

## Use Cases

```go
// Ordered processing required
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    Queue("payment.process").
    SingleActiveConsumer(true).
    Build(processPayment)

// Stateful operations
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    Queue("inventory.update").
    SingleActiveConsumer(true).
    Build(updateInventory)

// Rate-limited external API
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    Queue("external.api").
    SingleActiveConsumer(true).
    Build(callExternalAPI)
```

## Best Practices

1. **Use when ordering matters**: Enable for sequential processing requirements
2. **Combine with retry**: SAC works well with retry mechanisms
3. **Monitor active consumer**: Track which consumer is active
4. **Handle failover**: Ensure standby consumers can take over seamlessly
