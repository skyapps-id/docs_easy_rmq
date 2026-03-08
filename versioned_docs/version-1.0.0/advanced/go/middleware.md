---
sidebar_position: 5
---

# Middleware (Go)

Add custom middleware for message processing pipelines.

## Basic Middleware

```go
func loggingMiddleware(next easyrmq.HandlerFunc) easyrmq.HandlerFunc {
    return func(data []byte) error {
        log.Printf("Processing message: %s", string(data))
        err := next(data)
        if err != nil {
            log.Printf("Message processing failed: %v", err)
        } else {
            log.Printf("Message processed successfully")
        }
        return err
    }
}

easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    WithPool(client).
    WithExchange("order.events.v1").
    Queue("order.process").
    Middleware(loggingMiddleware).
    Build(handleOrder)
```

## Multiple Middleware

Chain multiple middleware functions:

```go
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    Queue("order.process").
    Middleware(loggingMiddleware).
    Middleware(metricsMiddleware).
    Middleware(recoveryMiddleware).
    Build(handleOrder)
```

## Common Middleware Patterns

### Logging Middleware

```go
func loggingMiddleware(next easyrmq.HandlerFunc) easyrmq.HandlerFunc {
    return func(data []byte) error {
        start := time.Now()
        log.Printf("Started processing message")

        err := next(data)

        duration := time.Since(start)
        if err != nil {
            log.Printf("Failed after %v: %v", duration, err)
        } else {
            log.Printf("Completed in %v", duration)
        }
        return err
    }
}
```

### Metrics Middleware

```go
func metricsMiddleware(next easyrmq.HandlerFunc) easyrmq.HandlerFunc {
    return func(data []byte) error {
        start := time.Now()

        err := next(data)

        duration := time.Since(start)
        if err != nil {
            metrics.RecordFailure(duration)
        } else {
            metrics.RecordSuccess(duration)
        }
        return err
    }
}
```

### Recovery Middleware

```go
func recoveryMiddleware(next easyrmq.HandlerFunc) easyrmq.HandlerFunc {
    return func(data []byte) (err error) {
        defer func() {
            if r := recover(); r != nil {
                err = fmt.Errorf("panic recovered: %v", r)
                log.Printf("Panic in handler: %v", r)
            }
        }()
        return next(data)
    }
}
```

### Validation Middleware

```go
func validationMiddleware(next easyrmq.HandlerFunc) easyrmq.HandlerFunc {
    return func(data []byte) error {
        if len(data) == 0 {
            return fmt.Errorf("empty message")
        }

        if len(data) > 1024*1024 {
            return fmt.Errorf("message too large: %d bytes", len(data))
        }

        return next(data)
    }
}
```

## Best Practices

1. **Order matters**: Place middleware in correct order (logging → validation → handler)
2. **Keep middleware focused**: Each middleware should do one thing well
3. **Handle errors**: Decide if errors should stop the chain or be logged
4. **Use context**: Pass request-scoped values through middleware
5. **Test middleware**: Test middleware independently and in combination
