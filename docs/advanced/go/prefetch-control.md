---
sidebar_position: 2
---

# Prefetch Control (Go)

Optimize message delivery by controlling the number of unacknowledged messages.

## Basic Prefetch

```go
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    WithPool(client).
    WithExchange("order.events.v1").
    Queue("order.process").
    PrefetchCount(10).
    Build(handler)
```

## What is Prefetch?

Prefetch controls how many messages a consumer can receive at once before acknowledging:

```
Without Prefetch:          With Prefetch (5):
[Msg1][Msg2][Msg3]...       [Msg1][Msg2][Msg3][Msg4][Msg5]
                              ↑
                              Only 5 unacked messages allowed
```

## Benefits

✅ **Memory Control**: Limit memory usage per consumer  
✅ **Fair Distribution**: Spread messages across consumers  
✅ **Backpressure Handling**: Prevent overwhelming consumers  

## Configuration

### Prefetch Values

```go
.PrefetchCount(1)   // Process one at a time (strict ordering)
.PrefetchCount(10)  // Balanced performance
.PrefetchCount(50)  // High throughput
.PrefetchCount(0)   // Unlimited (not recommended)
```

### Use Cases

```go
// CPU-intensive processing
.PrefetchCount(2)

// Fast processing
.PrefetchCount(50)

// Slow I/O operations
.PrefetchCount(5)

// Unpredictable processing time
.PrefetchCount(10)
```

## Best Practices

1. **Match processing capacity**: Set based on your handler's processing speed
2. **Consider resource limits**: Account for memory, CPU, and external dependencies
3. **Test and tune**: Use load testing to find optimal prefetch values
4. **Multiple queues**: Use different prefetch values for different workloads
