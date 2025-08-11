# Vextra Version Server

用于Vextra平台更新用户文档版本（将最新的编辑命令升级到文档数据）

## 项目简介

Vextra Version Server 是一个高性能的文档版本管理服务，专门为Vextra平台设计。该服务负责处理文档的版本更新、命令执行和状态同步，确保文档数据的一致性和完整性。

## 功能特性

- 🚀 **高性能文档处理**: 支持大规模文档命令批量处理
- 🔄 **版本管理**: 完整的文档版本控制和历史追踪
- 📊 **实时同步**: 支持实时文档状态同步和更新
- 🛡️ **容错机制**: 内置超时处理和异常恢复机制
- 📁 **多存储支持**: 支持MongoDB和MinIO等多种存储后端
- 🔌 **RESTful API**: 提供标准化的HTTP接口
- 📈 **健康监控**: 内置健康检查接口
- 🎨 **文档渲染**: 支持文档页面PNG生成
- 🔐 **多存储提供商**: 支持MinIO、阿里云OSS、AWS S3

## 技术栈

- **运行时**: Node.js 18+
- **语言**: TypeScript 5.1+
- **框架**: Express 5.1+
- **数据库**: MongoDB 4.17+
- **存储**: MinIO/Ali-OSS/AWS S3
- **构建工具**: Rollup 4.9+
- **依赖管理**: npm
- **核心库**: @kcaitech/vextra-core, @kcaitech/vextra-coop
- **渲染引擎**: skia-canvas

## 快速开始

### 环境要求

- Node.js 18.0.0 或更高版本
- MongoDB 4.17+ 
- MinIO 或兼容的S3存储服务
- 至少 2GB 可用内存

### 安装依赖

```bash

# 安装依赖
npm install

```

### 配置

主要配置项：

```yaml
mongo:
  url: mongodb://localhost:27017
  db: kcserver

storage:
  provider: minio  # 支持: minio, ali-oss, aws-s3
  endpoint: "minio:9000"
  region: "zhuhai-1"
  accessKeyID: "your-access-key"
  secretAccessKey: "your-secret-key"
  stsAccessKeyID: "user"  # STS临时凭证
  stsSecretAccessKey: "your-sts-secret"
  documentBucket: "document"
```

### 运行服务

#### 开发模式
```bash
npm run server
```

#### 生产构建
```bash
npm run build
node ./dist/server.mjs
```

#### 自定义端口和配置
```bash
# 使用自定义端口
node ./dist/server.mjs --port 30001

# 使用自定义配置文件
node ./dist/server.mjs --config ./custom-config.yaml

# 同时指定端口和配置文件
node ./dist/server.mjs --port 30001 --config ./custom-config.yaml
```

## API 接口

### 健康检查

```
GET /health
```

响应示例：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### 文档生成

```
POST /generate
Content-Type: application/json
```

请求体：
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
      "description": "更新文档内容",
      "userId": "user-123",
      "time": "2024-01-01T00:00:00.000Z"
    }
  ],
  "gen_pages_png": {
    "tmp_dir": "/tmp/pages"
  }
}
```

响应示例：
```json
{
  "success": true,
  "message": "文档生成成功",
  "data": {
    "documentId": "doc-123",
    "version": "v1.0.0",
    "generatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": "INVALID_DOCUMENT_ID",
  "message": "无效的文档ID",
  "details": "文档ID不能为空"
}
```

## 项目结构

```
src/
├── config/          # 配置管理
│   └── config.ts    # 配置加载和验证
├── handler/         # HTTP处理器
│   ├── generate_handler.ts    # 文档生成处理器
│   ├── health_handler.ts      # 健康检查处理器
│   ├── generate.ts            # 生成逻辑
│   ├── httpcode.ts            # HTTP状态码定义
│   └── types.ts               # 类型定义
├── pal/             # 核心业务逻辑
│   ├── init.ts              # 初始化模块
│   ├── measure.ts           # 测量功能
│   ├── test.ts              # 测试功能
│   └── text2path.ts         # 文本路径处理
├── provider/        # 数据提供者
│   ├── mongo.ts             # MongoDB连接和操作
│   └── storage.ts           # 存储服务抽象层
├── utils/           # 工具函数
│   ├── exit_util.ts         # 退出处理
│   ├── shortlog.ts          # 日志工具
│   ├── timing_util.ts       # 时间工具
│   └── with_timeout.ts      # 超时处理
└── server.ts        # 主服务器文件
```

## 开发指南

### 构建命令

```bash
# 开发构建（包含sourcemap）
npm run build-dev

# 生产构建（代码压缩）
npm run build

# 运行开发服务器
npm run server

# 运行测试（待实现）
npm test
```

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint规则
- 使用Prettier格式化代码
- 提交前运行类型检查
- 使用ES模块语法

### 开发环境设置

```bash
# 安装开发依赖
npm install

# 启动开发服务器（自动构建）
npm run server

# 仅构建
npm run build-dev
```

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| NODE_ENV | development | 运行环境 |
| PORT | 30000 | 服务端口 |
| CONFIG_FILE | config/config.yaml | 配置文件路径 |

### 调试

```bash
# 启用调试日志
DEBUG=* npm run server

# 使用Node.js调试器
node --inspect ./dist/server.mjs
```

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE.txt) file for details.

## Author

- [KCai Technology](https://kcaitech.com)
- [Vextra Official Website](https://vextra.cn)