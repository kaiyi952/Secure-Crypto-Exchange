const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});
app.use(limiter);

app.use(express.json({ limit: '10kb' }));

// 模拟数据库
const users = [
  {
    id: 1,
    username: 'user1',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    balance: { USD: 10000, BTC: 2.5, ETH: 15 }
  }
];

const transactions = [];

// 验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// 登录
app.post('/api/login', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, username: user.username, balance: user.balance } });
});

// 获取用户信息
app.get('/api/user', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: { id: user.id, username: user.username, balance: user.balance } });
});

// 获取市场价格
app.get('/api/prices', (req, res) => {
  const prices = {
    BTC: { USD: 45000, change24h: 2.5 },
    ETH: { USD: 3200, change24h: -1.2 },
    ADA: { USD: 1.2, change24h: 5.8 }
  };
  res.json(prices);
});

// 交易
app.post('/api/trade', authenticateToken, [
  body('fromCurrency').isIn(['USD', 'BTC', 'ETH']),
  body('toCurrency').isIn(['USD', 'BTC', 'ETH']),
  body('amount').isFloat({ min: 0.01 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fromCurrency, toCurrency, amount } = req.body;
  const user = users.find(u => u.id === req.user.id);

  if (user.balance[fromCurrency] < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // 模拟交易逻辑
  const prices = {
    BTC: { USD: 45000 },
    ETH: { USD: 3200 }
  };

  let convertedAmount;
  if (fromCurrency === 'USD' && toCurrency !== 'USD') {
    convertedAmount = amount / prices[toCurrency].USD;
  } else if (toCurrency === 'USD' && fromCurrency !== 'USD') {
    convertedAmount = amount * prices[fromCurrency].USD;
  } else {
    convertedAmount = amount * (prices[fromCurrency].USD / prices[toCurrency].USD);
  }

  // 更新余额
  user.balance[fromCurrency] -= amount;
  user.balance[toCurrency] += convertedAmount;

  // 记录交易
  const transaction = {
    id: transactions.length + 1,
    userId: user.id,
    fromCurrency,
    toCurrency,
    amount,
    convertedAmount,
    timestamp: new Date()
  };
  transactions.push(transaction);

  res.json({
    success: true,
    newBalance: user.balance,
    transaction
  });
});

// 获取交易历史
app.get('/api/transactions', authenticateToken, (req, res) => {
  const userTransactions = transactions.filter(t => t.userId === req.user.id);
  res.json(userTransactions);
});

app.listen(PORT, () => {
  console.log(`Secure exchange server running on port ${PORT}`);
}); 