---
sidebar_position: 3
---

# Parallel Processing (Go)

Process multiple messages concurrently for improved throughput.

## Basic Parallel Processing

```go
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    WithPool(client).
    WithExchange("order.events.v1").
    Queue("order.process").
    ConsumerCount(5).
    Build(handler)
```

## How It Works

Single Consumer vs Multiple Consumers:

```
Single Consumer:           Multiple Consumers (5):
[Consumer]                  [C1][C2][C3][C4][C5]
  | Msg1                      |  |  |  |  |
  | Msg2                     Msg1 Msg2 Msg3 Msg4 Msg5
  | Msg3
```

## Benefits

✅ **Increased Throughput**: Process multiple messages simultaneously  
✅ **Better Resource Utilization**: Use all CPU cores  
✅ **Improved Latency**: Reduce queue wait times  

## Configuration

### Consumer Count

```go
.ConsumerCount(1)   // Single consumer (default)
.ConsumerCount(5)   // 5 parallel consumers
.ConsumerCount(10)  // 10 parallel consumers
.ConsumerCount(0)   // Auto (based on CPU cores)
```

### Use Cases

```go
// CPU-intensive tasks
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    Queue("image.process").
    ConsumerCount(runtime.NumCPU()).
    Build(processImage)

// I/O-bound tasks
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    Queue("api.call").
    ConsumerCount(50).
    Build(makeAPICall)

// Mixed workload
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    Queue("order.process").
    ConsumerCount(10).
    Build(processOrder)
```

## Best Practices

1. **Match CPU cores**: Use `runtime.NumCPU()` for CPU-intensive tasks
2. **Higher for I/O**: Use more consumers for I/O-bound operations
3. **Monitor resources**: Watch CPU, memory, and connection usage
4. **Test load**: Use load testing to find optimal consumer count
5. **Consider prefetch**: Combine with prefetch control for best results
