---
sidebar_position: 1
---

# Retry Mechanism (Go)

Automatically retry failed messages with configurable delay and max attempts.

## Basic Retry

```go
easyrmq.NewWorkerBuilder(easyrmq.ExchangeKindDirect).
    WithPool(client).
    WithExchange("order.events.v1").
    Queue("order.process").
    Retry(3, 5000).  // max 3 retries, 5 second delay
    Build(handler)
```

## How Retry Works

### Retry Queue Flow

```
Original Queue → Processing Failed
                ↓
          Retry Queue (with TTL)
                ↓
        Original Queue (retry)
                ↓
         After max retries
                ↓
           Dead Letter Queue
```

### Process Details

1. **Message Processing**: Handler returns `error`
2. **Retry Queue**: Message sent to `{queue}.retry` with TTL
3. **Delay**: TTL expires after configured delay (e.g., 5000ms)
4. **Retry**: Message returns to original queue for retry
5. **Max Retries**: After exceeding max retries, sent to `{queue}.dlq`
6. **Dead Letter**: Message stored in DLQ for manual inspection

### Retry Count Tracking

Retry count is tracked in message headers:

```go
func getRetryCount() uint32 {
    headers := easyrmq.GetHeaders()
    if headers != nil {
        if val, ok := headers["x-retry-count"]; ok {
            if count, ok := val.(int32); ok {
                return uint32(count)
            }
        }
    }
    return 0
}

func handleWithRetryInfo(data []byte) error {
    retryCount := getRetryCount()
    println("Processing message (attempt)", retryCount + 1)

    // Process message
    return nil
}
```

## Configuration

### Retry Parameters

```go
.Retry(maxRetries, delayMs)
```

- **maxRetries**: Maximum number of retry attempts (0 = no retry)
- **delayMs**: Delay in milliseconds between retries

### Examples

```go
// No retry - fail fast
.Retry(0, 0)

// Quick retry - 3 attempts, 1 second delay
.Retry(3, 1000)

// Standard retry - 5 attempts, 5 seconds delay
.Retry(5, 5000)

// Long retry - 10 attempts, 30 seconds delay
.Retry(10, 30000)
```

## Exponential Backoff

Implement exponential backoff for better failure handling:

```go
func getRetryDelay(retryCount uint32) uint32 {
    // Exponential backoff: 2^n seconds
    delay := uint32(1) << retryCount
    if delay > 300 {
        delay = 300 // Cap at 5 minutes
    }
    return delay * 1000 // Convert to milliseconds
}
```

## Dead Letter Queue

Messages that exceed max retries are sent to DLQ:

```go
func handleDLQMessage(data []byte) error {
    var msg struct {
        OriginalQueue string `json:"original_queue"`
        ErrorCount    int    `json:"error_count"`
        LastError     string `json:"last_error"`
        Payload       []byte `json:"payload"`
    }

    if err := json.Unmarshal(data, &msg); err != nil {
        return err
    }

    log.Printf("DLQ Message from %s: %s", msg.OriginalQueue, msg.LastError)
    // Store for manual investigation
    return nil
}
```

## Best Practices

1. **Set appropriate max retries**: Balance between resilience and resource usage
2. **Use exponential backoff**: Avoid overwhelming failing services
3. **Monitor DLQ**: Regularly check and analyze failed messages
4. **Set sensible delays**: Too short = retry storms, too long = delayed recovery
5. **Handle permanent failures**: Some errors should not be retried
