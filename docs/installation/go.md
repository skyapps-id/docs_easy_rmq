---
sidebar_position: 3
---

# Go Installation

Complete guide to install and configure Easy RMQ for Go.

## Requirements

Before you begin, ensure you have:

- **Go** 1.19 or higher
- **RabbitMQ** server (or Docker)

## Installation

### Install Using Go Get

```bash
go get github.com/skyapps-id/easy-rmq-go
```

### Add to go.mod

If your `go.mod` doesn't have it yet:

```go
module your-module

go 1.19

require github.com/skyapps-id/easy-rmq-go v1.0.0
```

## Configuration

### Basic Setup

Create a client with connection string and pool size:

```go
package main

import easyrmq "github.com/skyapps-id/easy-rmq-go/pkg/easyrmq"

func main() {
    client, err := easyrmq.NewClient(
        "amqp://guest:guest@localhost:5672",
        10,  // max pool size
    )
    if err != nil {
        panic(err)
    }
    defer client.Close()
}
```

### Connection String Format

```
amqp://username:password@host:port/vhost
```

**Examples:**

```go
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

```go
// Low concurrency (1-5 concurrent operations)
client, _ := easyrmq.NewClient("amqp://guest:guest@localhost:5672", 5)

// Medium concurrency (5-20 concurrent operations)
client, _ := easyrmq.NewClient("amqp://guest:guest@localhost:5672", 15)

// High concurrency (20+ concurrent operations)
client, _ := easyrmq.NewClient("amqp://guest:guest@localhost:5672", 50)
```

**Pool Size Guidelines:**

- **Development**: 5-10 connections
- **Production**: 10-50 connections (based on workload)
- **High Throughput**: 50-100 connections

## Environment Variables

Store configuration in environment variables:

```go
package main

import (
    "os"
    "strconv"
    easyrmq "github.com/skyapps-id/easy-rmq-go/pkg/easyrmq"
)

func getRabbitMQURL() string {
    if url := os.Getenv("RABBITMQ_URL"); url != "" {
        return url
    }
    return "amqp://guest:guest@localhost:5672"
}

func getPoolSize() int {
    if size := os.Getenv("RABBITMQ_POOL_SIZE"); size != "" {
        if i, err := strconv.Atoi(size); err == nil {
            return i
        }
    }
    return 10
}

func main() {
    client, _ := easyrmq.NewClient(
        getRabbitMQURL(),
        getPoolSize(),
    )
    defer client.Close()
}
```

Create `.env` file:

```env
RABBITMQ_URL=amqp://admin:password@localhost:5672
RABBITMQ_POOL_SIZE=20
```

Use with `godotenv`:

```bash
go get github.com/joho/godotenv
```

```go
import _ "github.com/joho/godotenv/autoload"
```

## RabbitMQ Setup

### Docker (Recommended)

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

### Local Installation

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

## Verify Installation

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

## Testing

### Test Connection

```go
package main

import (
    "fmt"
    easyrmq "github.com/skyapps-id/easy-rmq-go/pkg/easyrmq"
)

func main() {
    client, err := easyrmq.NewClient("amqp://guest:guest@localhost:5672", 10)
    if err != nil {
        panic(err)
    }
    defer client.Close()

    // Try to publish a test message
    err = client.Publisher().PublishText("test", "Connection test")
    if err != nil {
        panic(err)
    }

    fmt.Println("✅ Connection successful!")
}
```

### Health Check

```go
func healthCheck(client *easyrmq.Client) bool {
    err := client.Publisher().PublishText("health.check", "ping")
    return err == nil
}
```

## Troubleshooting

### Connection Refused

**Problem**: `Connection refused` error

**Solutions**:
1. Verify RabbitMQ is running: `docker ps` or `systemctl status rabbitmq-server`
2. Check port is accessible: `telnet localhost 5672`
3. Verify connection string format
4. Check firewall settings

### Authentication Failed

**Problem**: `Authentication failed` error

**Solutions**:
1. Verify username and password
2. Check user permissions in RabbitMQ Management UI
3. Ensure user has access to the virtual host

## What's Next

- [Publisher](/docs/basic/publisher) - Learn about publishers
- [Subscriber](/docs/basic/subscriber) - Learn about subscribers
