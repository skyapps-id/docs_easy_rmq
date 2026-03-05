# Easy RMQ Documentation

This is the official documentation for [Easy RMQ](https://github.com/skyapps-id/easy_rmq), built with [Docusaurus](https://docusaurus.io/).

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Build for production
yarn build
```

Visit http://localhost:3000 to see the documentation.

## 📚 Documentation Structure

```
docs/
├── intro.md              # Introduction to Easy RMQ
├── examples.md           # Complete working examples
├── installation/         # Installation & Configuration
├── basic/                # Basic Features
│   ├── publisher.md
│   ├── subscriber.md
│   └── dependency-injection.md
└── advanced/             # Advanced Features
    ├── retry-mechanism.md
    ├── prefetch-control.md
    ├── parallel-processing.md
    ├── single-active-consumer.md
    ├── middleware.md
    └── distributed-tracing.md
```

## 📖 Versioning

This documentation supports versioning to accommodate different releases of Easy RMQ.

### Current Version

- **1.0.0** (current) - Latest stable release

### Creating a New Version

When a new version of Easy RMQ is released:

1. **Update the documentation** for the new version
2. **Create a new version:**

```bash
yarn run docusaurus docs:version 2.0.0
```

This will:
- Copy current documentation to `versioned_docs/version-2.0.0/`
- Create versioned sidebar configuration
- Add version to the dropdown

3. **Update `docusaurus.config.ts`:**

```typescript
versions: {
  current: {
    label: '2.0.0',
  },
  '1.0.0': {
    label: 'v1.0.0',
  },
}
```

### When to Create a New Version

Create a new documentation version when:

- ✅ **Breaking changes** are introduced
- ✅ **Major version release** (e.g., 1.0 → 2.0)
- ✅ **Significant API changes** that affect usage

Update the current version when:

- ✅ **Minor updates** (e.g., 1.0 → 1.1)
- ✅ **Bug fixes**
- ✅ **Documentation improvements**
- ✅ **New features** without breaking changes

## 🛠️ Development

### Adding New Documentation

1. Create a new `.md` file in the appropriate directory
2. Set `sidebar_position` frontmatter if needed
3. The documentation will automatically appear in the sidebar

### Updating Existing Documentation

Edit any `.md` file in the `docs/` directory. Changes will be hot-reloaded.

### Sidebar Structure

The sidebar is auto-generated from the `docs/` folder structure. See `sidebars.ts` for configuration.

## 📦 Deployment

### Deploy to GitHub Pages

```bash
# Using SSH
USE_SSH=true yarn deploy

# Not using SSH
GIT_USER=<Your GitHub username> yarn deploy
```

This command:
1. Builds the website
2. Pushes to the `gh-pages` branch
3. Deploys to GitHub Pages

### Manual Deployment

```bash
# Build
yarn build

# The static files are in the `build/` directory
# You can deploy them to any static hosting service
```

## 🔧 Configuration

Main configuration file: `docusaurus.config.ts`

Key configurations:
- **Site metadata**: title, tagline, URL
- **Navigation**: navbar items
- **Footer**: footer links
- **Versioning**: version configuration
- **Theme**: color mode, syntax highlighting

## 📝 Content Guidelines

### Markdown

Documentation is written in Markdown. Docusaurus supports:
- Standard Markdown
- MDX (Markdown + JSX)
- Code syntax highlighting
- Admonitions (notes, warnings, tips)
- Tabs and code blocks

### Code Examples

Use proper syntax highlighting:

```rust
use easy_rmq::AmqpClient;

let client = AmqpClient::new("amqp://guest:guest@localhost:5672".to_string(), 10)?;
```

### Frontmatter

Every documentation file should have frontmatter:

```yaml
---
sidebar_position: 1
---
```

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
yarn start -- --port 3001
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .docusaurus
yarn build
```

## 📄 License

ISC

## 🔗 Links

- [Easy RMQ GitHub Repository](https://github.com/skyapps-id/easy_rmq)
- [Docusaurus Documentation](https://docusaurus.io/)
- [MDX Documentation](https://mdxjs.com/)
