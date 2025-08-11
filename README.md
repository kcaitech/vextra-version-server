# Vextra Version Server

A service for updating user document versions on the Vextra platform (upgrading the latest edit commands to document data)

## Project Introduction

Vextra Version Server is a high-performance document version management service specifically designed for the Vextra platform. This service is responsible for handling document version updates, command execution, and status synchronization, ensuring consistency and integrity of document data.

## Features

- 🚀 **High-Performance Document Processing**: Supports large-scale document command batch processing
- 🔄 **Version Management**: Complete document version control and history tracking
- 📊 **Real-time Synchronization**: Supports real-time document status synchronization and updates
- 🛡️ **Fault Tolerance**: Built-in timeout handling and exception recovery mechanisms
- 📁 **Multi-Storage Support**: Supports MongoDB, MinIO, and other storage backends
- 🔌 **RESTful API**: Provides standardized HTTP interfaces
- 📈 **Health Monitoring**: Built-in health check interface
- 🎨 **Document Rendering**: Supports document page PNG generation
- 🔐 **Multiple Storage Providers**: Supports MinIO, Alibaba Cloud OSS, AWS S3

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.1+
- **Framework**: Express 5.1+
- **Database**: MongoDB 4.17+
- **Storage**: MinIO/Ali-OSS/AWS S3
- **Build Tool**: Rollup 4.9+
- **Package Manager**: npm
- **Core Libraries**: @kcaitech/vextra-core, @kcaitech/vextra-coop
- **Rendering Engine**: skia-canvas

## Quick Start

### Requirements

- Node.js 18.0.0 or higher
- MongoDB 4.17+
- MinIO or compatible S3 storage service
- At least 2GB available memory

### Install Dependencies

```bash
# Install dependencies
npm install
```

### Configuration

Main configuration items:

```yaml
mongo:
  url: mongodb://localhost:27017
  db: kcserver

storage:
  provider: minio  # Supported: minio, ali-oss, aws-s3
  endpoint: "minio:9000"
  region: "zhuhai-1"
  accessKeyID: "your-access-key"
  secretAccessKey: "your-secret-key"
  stsAccessKeyID: "user"  # STS temporary credentials
  stsSecretAccessKey: "your-sts-secret"
  documentBucket: "document"
```

### Run Service

#### Development Mode
```bash
npm run server
```

#### Production Build
```bash
npm run build
node ./dist/server.mjs
```

#### Custom Port and Configuration
```bash
# Use custom port
node ./dist/server.mjs --port 30001

# Use custom config file
node ./dist/server.mjs --config ./custom-config.yaml

# Specify both port and config file
node ./dist/server.mjs --port 30001 --config ./custom-config.yaml
```

## API Interfaces

### Health Check

```
GET /health
```

Response example:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Document Generation

```
POST /generate
Content-Type: application/json
```

Request body:
```json
{
  "documentInfo": {
    "id": "doc-123",
    "path": "/documents/doc-123",
    "version_id": "v1.0.0",
    "last_cmd_id": "cmd-456"
  },
  "cmdItemList": [
    {
      "id": "cmd-456",
      "documentId": "doc-123",
      "version": 1,
      "ops": [],
      "description": "Update document content",
      "userId": "user-123",
      "time": "2024-01-01T00:00:00.000Z"
    }
  ],
  "gen_pages_png": {
    "tmp_dir": "/tmp/pages"
  }
}
```

Response example:
```json
{
  "success": true,
  "message": "Document generated successfully",
  "data": {
    "documentId": "doc-123",
    "version": "v1.0.0",
    "generatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "INVALID_DOCUMENT_ID",
  "message": "Invalid document ID",
  "details": "Document ID cannot be empty"
}
```

## Project Structure

```
src/
├── config/          # Configuration management
│   └── config.ts    # Configuration loading and validation
├── handler/         # HTTP handlers
│   ├── generate_handler.ts    # Document generation handler
│   ├── health_handler.ts      # Health check handler
│   ├── generate.ts            # Generation logic
│   ├── httpcode.ts            # HTTP status code definitions
│   └── types.ts               # Type definitions
├── pal/             # Core business logic
│   ├── init.ts              # Initialization module
│   ├── measure.ts           # Measurement functionality
│   ├── test.ts              # Testing functionality
│   └── text2path.ts         # Text path processing
├── provider/        # Data providers
│   ├── mongo.ts             # MongoDB connection and operations
│   └── storage.ts           # Storage service abstraction layer
├── utils/           # Utility functions
│   ├── exit_util.ts         # Exit handling
│   ├── shortlog.ts          # Logging utilities
│   ├── timing_util.ts       # Timing utilities
│   └── with_timeout.ts      # Timeout handling
└── server.ts        # Main server file
```

## Development Guide

### Build Commands

```bash
# Development build (includes sourcemap)
npm run build-dev

# Production build (code minification)
npm run build

# Run development server
npm run server

# Run tests (to be implemented)
npm test
```

### Code Standards

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for code formatting
- Run type checking before commit
- Use ES module syntax

### Development Environment Setup

```bash
# Install development dependencies
npm install

# Start development server (auto-build)
npm run server

# Build only
npm run build-dev
```

### Environment Variables

| Variable Name | Default Value | Description |
|---------------|---------------|-------------|
| NODE_ENV | development | Runtime environment |
| PORT | 30000 | Service port |
| CONFIG_FILE | config/config.yaml | Configuration file path |

### Debugging

```bash
# Enable debug logging
DEBUG=* npm run server

# Use Node.js debugger
node --inspect ./dist/server.mjs
```

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE.txt) file for details.

## Author

- [KCai Technology](https://kcaitech.com)
- [Vextra Official Website](https://vextra.cn)