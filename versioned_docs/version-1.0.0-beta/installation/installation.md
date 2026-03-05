---
sidebar_position: 2
---

# Installation

Learn how to install and configure Easy RMQ in your Rust project.

## Requirements

Before you begin, ensure you have:

- **Rust** 1.70 or higher
- **RabbitMQ** server (or Docker)
- **Tokio** runtime (for async support)

## Installation

### Add to Cargo.toml

Add Easy RMQ to your `Cargo.toml`:

```toml
[dependencies]
easy_rmq = { git = "https://github.com/skyapps-id/easy_rmq" }
tokio = { version = "1", features = ["full"] }
```

### Using Cargo Edit

```bash
cargo add easy_rmq --git https://github.com/skyapps-id/easy_rmq
```

## RabbitMQ Setup

### Option 1: Docker (Recommended)

#### Using Docker CLI

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

#### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq
    ports:
      - "5672:5672"   # AMQP port
      - "15672:15672" # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    restart: unless-stopped

volumes:
  rabbitmq_data:
```

Start RabbitMQ:

```bash
docker-compose up -d
```

### Option 2: Local Installation

#### macOS

```bash
brew install rabbitmq
brew services start rabbitmq
```

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install rabbitmq-server
sudo systemctl start rabbitmq-server
```

#### Windows

Download and install from [RabbitMQ official website](https://www.rabbitmq.com/download.html)

### Verify RabbitMQ is Running

Check if RabbitMQ is running:

```bash
# Check if port 5672 is open
netstat -an | grep 5672

# Or use curl to check management API
curl http://localhost:15672/api/overview
```

Access the Management UI at: http://localhost:15672
- Default username: `guest` (or `admin` if using Docker Compose)
- Default password: `guest` (or `password` if using Docker Compose)

## Configuration

### Basic Configuration

Create a client with connection string and pool size:

```rust
use easy_rmq::AmqpClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = AmqpClient::new(
        "amqp://guest:guest@localhost:5672".to_string(),
        10  // max pool size
    )?;

    Ok(())
}
```

### Connection String Format

```
amqp://username:password@host:port/vhost
```

**Examples:**

```rust
// Local RabbitMQ with default credentials
"amqp://guest:guest@localhost:5672"

// Custom credentials
"amqp://admin:password@localhost:5672"

// With virtual host
"amqp://guest:guest@localhost:5672/my_vhost"

// Remote server
"amqp://user:pass@rabbitmq.example.com:5672"

// With SSL (AMQPS)
"amqps://user:pass@rabbitmq.example.com:5671"
```

### Pool Size Configuration

Choose pool size based on your workload:

```rust
// Low concurrency (1-5 concurrent operations)
let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 5)?;

// Medium concurrency (5-20 concurrent operations)
let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 15)?;

// High concurrency (20+ concurrent operations)
let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 50)?;
```

**Pool Size Guidelines:**

- **Development**: 5-10 connections
- **Production**: 10-50 connections (based on workload)
- **High Throughput**: 50-100 connections

### Environment Variables

Store configuration in environment variables:

```rust
use std::env;

fn get_rabbitmq_url() -> String {
    env::var("RABBITMQ_URL")
        .unwrap_or_else(|_| "amqp://guest:guest@localhost:5672".to_string())
}

fn get_pool_size() -> u32 {
    env::var("RABBITMQ_POOL_SIZE")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(10)
}

let client = AmqpClient::new(
    get_rabbitmq_url(),
    get_pool_size()
)?;
```

Create `.env` file:

```env
RABBITMQ_URL=amqp://admin:password@localhost:5672
RABBITMQ_POOL_SIZE=20
```

Use with `dotenv`:

```toml
[dependencies]
dotenv = "0.15"
```

```rust
dotenv::dotenv().ok();
```

### TLS/SSL Configuration

For secure connections with TLS:

```rust
let client = AmqpClient::new(
    "amqps://admin:password@rabbitmq.example.com:5671".to_string(),
    10
)?;
```

**Note**: Ensure your RabbitMQ server has TLS enabled and certificates properly configured.

### Connection Properties

Configure additional connection properties:

```rust
use easy_rmq::AmqpClient;

let client = AmqpClient::new(
    "amqp://guest:guest@localhost:5672".to_string(),
    10
)?;

// Access channel pool
let pool = client.channel_pool();

// Connection is automatically managed
// No need to manually handle connection lifecycle
```

## Testing Configuration

### Test Connection

```rust
use easy_rmq::AmqpClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = AmqpClient::new(
        "amqp://guest:guest@localhost:5672".to_string(),
        10
    )?;

    // Try to publish a test message
    client.publisher()
        .publish_text("test", "Connection test")
        .await?;

    println!("✅ Connection successful!");
    
    Ok(())
}
```

### Health Check

```rust
async fn health_check(client: &AmqpClient) -> bool {
    match client.publisher()
        .publish_text("health.check", "ping")
        .await
    {
        Ok(_) => true,
        Err(_) => false,
    }
}
```

## Troubleshooting

### Common Issues

#### Connection Refused

**Problem**: `Connection refused` error

**Solutions**:
1. Verify RabbitMQ is running: `docker ps` or `systemctl status rabbitmq-server`
2. Check port is accessible: `telnet localhost 5672`
3. Verify connection string format
4. Check firewall settings

#### Authentication Failed

**Problem**: `Authentication failed` error

**Solutions**:
1. Verify username and password
2. Check user permissions in RabbitMQ Management UI
3. Ensure user has access to the virtual host

#### Timeout

**Problem**: Connection timeout

**Solutions**:
1. Check network connectivity
2. Verify correct host and port
3. Increase timeout if needed
4. Check RabbitMQ server logs

## Best Practices

1. **Use Environment Variables**: Store connection strings in environment variables
2. **Connection Pooling**: Use appropriate pool size for your workload
3. **Error Handling**: Always handle connection errors appropriately
4. **Graceful Shutdown**: Implement graceful shutdown for clean connection closure
5. **Monitoring**: Monitor connection health and pool utilization
6. **Security**: Use strong passwords and TLS in production
7. **Resource Management**: Set appropriate channel and connection limits

## What's Next

- [Basic Features](../basic/publisher) - Learn about publishers
- [Basic Features](../basic/subscriber) - Learn about subscribers
- [Advanced Features](/docs/1.0.0-beta/advanced/retry-mechanism) - Explore retry and error handling