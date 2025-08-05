# Secure vs Insecure Crypto Exchange

这是一个教育项目，展示了安全和不安全的加密货币交易所实现。项目包含两个独立的应用程序，用于对比学习网络安全最佳实践。

## 项目结构

```
Secure-Crypto-Exchange/
├── secure-exchange/          # 安全版本
│   ├── server.js            # 安全后端
│   ├── package.json
│   └── client/              # React前端
│       ├── src/
│       │   ├── App.js
│       │   └── App.css
│       └── package.json
├── insecure-exchange/        # 不安全版本
│   ├── server.js            # 不安全后端
│   ├── package.json
│   └── client/              # React前端
│       ├── src/
│       │   ├── App.js
│       │   └── App.css
│       └── package.json
└── README.md
```

## 安全版本特性

### 后端安全措施
- ✅ JWT身份验证
- ✅ 密码加密存储 (bcrypt)
- ✅ 输入验证和清理
- ✅ CORS保护
- ✅ Helmet安全头
- ✅ 速率限制
- ✅ 请求大小限制

### 前端安全措施
- ✅ 安全的API调用
- ✅ 令牌管理
- ✅ 输入验证
- ✅ 错误处理

## 不安全版本漏洞

### 后端漏洞
- ❌ 明文密码存储
- ❌ 无身份验证
- ❌ 无输入验证
- ❌ 暴露所有用户数据
- ❌ 无CORS保护
- ❌ 无速率限制
- ❌ 任意用户余额修改
- ❌ 密码重置无验证
- ❌ 模拟SQL注入
- ❌ 路径遍历漏洞

### 前端漏洞演示
- ❌ 显示所有用户密码
- ❌ 暴露所有交易记录
- ❌ 允许为任意用户交易
- ❌ 漏洞演示功能

## 安装和运行

### 安全版本

1. 安装后端依赖：
```bash
cd secure-exchange
npm install
```

2. 启动后端服务器：
```bash
npm start
```

3. 安装前端依赖：
```bash
cd client
npm install
```

4. 启动前端应用：
```bash
npm start
```

5. 访问应用：
- 前端: http://localhost:3000
- 后端: http://localhost:5000

### 不安全版本

1. 安装后端依赖：
```bash
cd insecure-exchange
npm install
```

2. 启动后端服务器：
```bash
npm start
```

3. 安装前端依赖：
```bash
cd client
npm install
```

4. 启动前端应用：
```bash
npm start
```

5. 访问应用：
- 前端: http://localhost:3000
- 后端: http://localhost:5001

## 演示账户

### 安全版本
- 用户名: `user1`
- 密码: `password`

### 不安全版本
- 用户名: `user1`, 密码: `password`
- 用户名: `admin`, 密码: `admin123`

## 功能对比

| 功能 | 安全版本 | 不安全版本 |
|------|----------|------------|
| 用户登录 | ✅ 加密验证 | ❌ 明文比较 |
| 密码存储 | ✅ bcrypt加密 | ❌ 明文存储 |
| 身份验证 | ✅ JWT令牌 | ❌ 无认证 |
| 用户数据保护 | ✅ 仅限本人 | ❌ 暴露所有用户 |
| 交易安全 | ✅ 验证用户身份 | ❌ 任意用户可交易 |
| 输入验证 | ✅ 严格验证 | ❌ 无验证 |
| 错误处理 | ✅ 安全错误信息 | ❌ 暴露系统信息 |

## 教育目的

这个项目旨在：
1. 展示常见的网络安全漏洞
2. 对比安全和不安全的实现
3. 学习网络安全最佳实践
4. 理解漏洞的影响和防护方法

## 警告

⚠️ **重要提醒**：
- 不安全版本仅用于教育目的
- 不要在生产环境中使用不安全版本
- 这些漏洞是故意设计的，用于学习安全概念

## 技术栈

- **后端**: Node.js, Express
- **前端**: React
- **安全库**: bcryptjs, jsonwebtoken, helmet, express-rate-limit
- **样式**: CSS3, Flexbox, Grid

## 学习要点

通过对比这两个版本，你可以学习到：

1. **身份验证和授权**
   - JWT vs 无认证
   - 密码安全存储
   - 会话管理

2. **数据保护**
   - 用户数据隔离
   - 敏感信息保护
   - 访问控制

3. **输入验证**
   - 数据清理
   - 类型检查
   - 边界验证

4. **安全配置**
   - CORS设置
   - 安全头
   - 速率限制

5. **错误处理**
   - 安全错误信息
   - 日志记录
   - 异常处理