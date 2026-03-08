---
sidebar_position: 4
---

# Dependency Injection

Easy RMQ supports dependency injection using traits, enabling clean architecture and testable code.

## Trait-based DI

The library provides the `AmqpPublisher` trait for dependency injection:

```rust
use easy_rmq::{AmqpPublisher, Result};
use std::sync::Arc;

struct OrderService {
    publisher: Arc<dyn AmqpPublisher>,
}

impl OrderService {
    fn new(publisher: Arc<dyn AmqpPublisher>) -> Self {
        Self { publisher }
    }

    async fn create_order(&self, order: Order) -> Result<()> {
        let payload = serde_json::to_vec(&order)?;
        self.publisher.publish("orders", "order.created", &payload).await?;
        Ok(())
    }
}
```

## Usage Example

### Create Service with DI

```rust
use easy_rmq::AmqpClient;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create client
    let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
    
    // Create publisher as trait object
    let publisher: Arc<dyn AmqpPublisher> = Arc::new(client.publisher());
    
    // Inject into service
    let order_service = OrderService::new(publisher);
    
    // Use service
    let order = Order {
        id: "123".to_string(),
        total: 100.0,
    };
    
    order_service.create_order(order).await?;
    
    Ok(())
}
```

### Multiple Services

```rust
struct OrderService {
    publisher: Arc<dyn AmqpPublisher>,
}

struct NotificationService {
    publisher: Arc<dyn AmqpPublisher>,
}

impl OrderService {
    fn new(publisher: Arc<dyn AmqpPublisher>) -> Self {
        Self { publisher }
    }
    
    async fn create_order(&self, order: Order) -> Result<()> {
        let payload = serde_json::to_vec(&order)?;
        self.publisher.publish("orders", "order.created", &payload).await?;
        Ok(())
    }
}

impl NotificationService {
    fn new(publisher: Arc<dyn AmqpPublisher>) -> Self {
        Self { publisher }
    }
    
    async fn send_notification(&self, notification: Notification) -> Result<()> {
        let payload = serde_json::to_vec(&notification)?;
        self.publisher.publish("notifications", "notification.sent", &payload).await?;
        Ok(())
    }
}

// Usage
let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;

// Create publishers for different exchanges
let order_publisher: Arc<dyn AmqpPublisher> = Arc::new(
    client.publisher().with_exchange("orders", lapin::ExchangeKind::Direct)
);

let notification_publisher: Arc<dyn AmqpPublisher> = Arc::new(
    client.publisher().with_exchange("notifications", lapin::ExchangeKind::Fanout)
);

let order_service = OrderService::new(order_publisher);
let notification_service = NotificationService::new(notification_publisher);
```

## Testing with Mocks

Trait-based DI makes testing easy with mock implementations:

```rust
use easy_rmq::{AmqpPublisher, Result};
use std::sync::{Arc, Mutex};

// Mock publisher for testing
struct MockPublisher {
    published_messages: Arc<Mutex<Vec<Vec<u8>>>>,
}

impl MockPublisher {
    fn new() -> Self {
        Self {
            published_messages: Arc::new(Mutex::new(Vec::new())),
        }
    }
    
    fn get_messages(&self) -> Vec<Vec<u8>> {
        self.published_messages.lock().unwrap().clone()
    }
}

impl AmqpPublisher for MockPublisher {
    fn publish(&self, _exchange: &str, _routing_key: &str, payload: &[u8]) -> Result<()> {
        self.published_messages.lock().unwrap().push(payload.to_vec());
        Ok(())
    }
}

// Test example
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_order_service() {
        let mock_publisher = Arc::new(MockPublisher::new());
        let order_service = OrderService::new(mock_publisher.clone());
        
        let order = Order {
            id: "123".to_string(),
            total: 100.0,
        };
        
        order_service.create_order(order).await.unwrap();
        
        let messages = mock_publisher.get_messages();
        assert_eq!(messages.len(), 1);
        
        let published_order: Order = serde_json::from_slice(&messages[0]).unwrap();
        assert_eq!(published_order.id, "123");
        assert_eq!(published_order.total, 100.0);
    }
}
```

## Advanced Patterns

### Service Container

```rust
struct ServiceContainer {
    order_service: Arc<OrderService>,
    notification_service: Arc<NotificationService>,
}

impl ServiceContainer {
    fn new(client: &AmqpClient) -> Self {
        let order_publisher: Arc<dyn AmqpPublisher> = Arc::new(
            client.publisher().with_exchange("orders", lapin::ExchangeKind::Direct)
        );
        
        let notification_publisher: Arc<dyn AmqpPublisher> = Arc::new(
            client.publisher().with_exchange("notifications", lapin::ExchangeKind::Fanout)
        );
        
        Self {
            order_service: Arc::new(OrderService::new(order_publisher)),
            notification_service: Arc::new(NotificationService::new(notification_publisher)),
        }
    }
}
```

### Publisher Factory

```rust
struct PublisherFactory {
    client: AmqpClient,
}

impl PublisherFactory {
    fn new(client: AmqpClient) -> Self {
        Self { client }
    }
    
    fn create_direct_publisher(&self, exchange: &str) -> Arc<dyn AmqpPublisher> {
        Arc::new(
            self.client.publisher()
                .with_exchange(exchange, lapin::ExchangeKind::Direct)
        )
    }
    
    fn create_topic_publisher(&self, exchange: &str) -> Arc<dyn AmqpPublisher> {
        Arc::new(
            self.client.publisher()
                .with_exchange(exchange, lapin::ExchangeKind::Topic)
        )
    }
    
    fn create_fanout_publisher(&self, exchange: &str) -> Arc<dyn AmqpPublisher> {
        Arc::new(
            self.client.publisher()
                .with_exchange(exchange, lapin::ExchangeKind::Fanout)
        )
    }
}
```

## Best Practices

1. **Use trait objects**: `Arc<dyn AmqpPublisher>` for flexible dependency injection
2. **Share publishers**: Multiple services can share the same publisher instance
3. **Mock for testing**: Create mock implementations for unit tests
4. **Factory pattern**: Use factory functions for creating configured publishers
5. **Service containers**: Group related services together for easier management