---
sidebar_position: 6
---

# Distributed Tracing (Go)

Track messages across services with OpenTelemetry integration.

## Basic Tracing

Enable automatic trace ID generation:

```go
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    WithPool(client).
    WithExchange("order.events.v1").
    Queue("order.process").
    WithAutoTraceID().
    Build(handleOrder)
```

## Publisher Tracing

Add trace IDs to published messages:

```go
// Auto-generate trace ID
client.Publisher().
    WithAutoTraceID().
    PublishText("order.created", "Order data")

// Use custom trace ID (e.g., from OpenTelemetry)
import "go.opentelemetry.io/otel"

traceID := otel.GetTraceID()
client.Publisher().
    WithTraceID(traceID).
    PublishText("order.created", "Order data")

// Generate standalone trace ID
traceID := easyrmq.GenerateTraceID()
client.Publisher().
    WithTraceID(traceID).
    PublishText("order.created", "Order data")
```

## Subscriber Tracing

Extract trace IDs from received messages:

```go
func handleOrder(data []byte) error {
    traceID := easyrmq.GetTraceID()
    if traceID != "" {
        log.Printf("Processing message with trace ID: %s", traceID)
        // Use trace ID for logging and monitoring
    }

    // Process message
    return nil
}
```

## OpenTelemetry Integration

### Publisher with OpenTelemetry

```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/trace"
)

func publishWithTracing() error {
    ctx := context.Background()
    tracer := otel.Tracer("publisher")

    ctx, span := tracer.Start(ctx, "publish.order.created")
    defer span.End()

    traceID := span.SpanContext().TraceID().String()
    client.Publisher().
        WithTraceID(traceID).
        PublishText("order.created", "Order data")

    return nil
}
```

### Subscriber with OpenTelemetry

```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/trace"
)

func handleWithTracing(data []byte) error {
    tracer := otel.Tracer("subscriber")
    traceID := easyrmq.GetTraceID()

    ctx := context.Background()
    if traceID != "" {
        // Convert trace ID string to OpenTelemetry format
        sc := trace.SpanContextConfig{}
        // ... parse traceID and set in sc
        ctx = trace.ContextWithSpanContext(ctx, sc)
    }

    ctx, span := tracer.Start(ctx, "process.order")
    defer span.End()

    // Process message
    return nil
}
```

## Trace Context Propagation

Propagate trace context across services:

```go
func handleOrder(data []byte) error {
    traceID := easyrmq.GetTraceID()

    // Include trace ID in downstream service calls
    resp, err := httpClient.Post(
        "http://inventory-service/update",
        "application/json",
        data,
    )
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    return nil
}
```

## Benefits

✅ **End-to-end tracing**: Track messages across multiple services  
✅ **Performance insights**: Identify bottlenecks and slow operations  
✅ **Error debugging**: Correlate errors across service boundaries  
✅ **Request correlation**: Link logs from different services  

## Best Practices

1. **Always use trace IDs**: Enable tracing in production for observability
2. **Consistent propagation**: Ensure trace IDs are passed to all downstream calls
3. **Span naming**: Use descriptive span names for better trace visualization
4. **Sampling**: Use appropriate sampling rates to manage tracing overhead
5. **Correlation IDs**: Combine trace IDs with business correlation IDs
