const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5005;

// 不安全配置 - 没有安全中间件
app.use(cors()); // 允许所有来源
app.use(express.json());

// 模拟数据库 - 明文存储
const users = [
  {
    id: 1,
    username: 'user1',
    password: 'password', // 明文密码
    balance: { USD: 10000, BTC: 2.5, ETH: 15 }
  },
  {
    id: 2,
    username: 'admin',
    password: 'admin123', // 明文密码
    balance: { USD: 50000, BTC: 10, ETH: 50 }
  }
];

const transactions = [];

// 不安全的登录 - 没有验证，直接比较
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // 漏洞1: 明文密码比较
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    // 漏洞2: 没有JWT，直接返回用户信息
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        password: user.password, // 漏洞3: 返回密码
        balance: user.balance
      }
    });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

// 获取用户信息 - 没有认证
app.get('/api/user/:id', (req, res) => {
  // 漏洞4: 没有认证，任何人都可以获取任何用户信息
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);

  if (user) {
    res.json({ user });
  } else {
    res.json({ error: 'User not found' });
  }
});

// 获取所有用户 - 严重漏洞
app.get('/api/users', (req, res) => {
  // 漏洞5: 暴露所有用户信息
  res.json({ users });
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

// 不安全的交易 - 没有验证
app.post('/api/trade', (req, res) => {
  const { userId, fromCurrency, toCurrency, amount } = req.body;

  // 漏洞6: 没有认证，任何人都可以交易
  // 漏洞7: 没有输入验证
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.json({ error: 'User not found' });
  }

  if (user.balance[fromCurrency] < amount) {
    return res.json({ error: 'Insufficient balance' });
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

// 获取交易历史 - 没有认证
app.get('/api/transactions/:userId', (req, res) => {
  // 漏洞8: 任何人都可以查看任何用户的交易历史
  const userId = parseInt(req.params.userId);
  const userTransactions = transactions.filter(t => t.userId === userId);
  res.json(userTransactions);
});

// 获取所有交易 - 严重漏洞
app.get('/api/transactions', (req, res) => {
  // 漏洞9: 暴露所有交易信息
  res.json(transactions);
});

// 更新用户余额 - 严重漏洞
app.post('/api/update-balance', (req, res) => {
  // 漏洞10: 没有认证，任何人都可以修改余额
  const { userId, currency, amount } = req.body;
  const user = users.find(u => u.id === userId);

  if (user) {
    user.balance[currency] = amount;
    res.json({ success: true, balance: user.balance });
  } else {
    res.json({ error: 'User not found' });
  }
});

// SQL注入漏洞模拟
app.get('/api/search', (req, res) => {
  // 漏洞11: 模拟SQL注入
  const query = req.query.q;

  // 模拟不安全的查询
  const results = users.filter(user =>
    user.username.includes(query) ||
    user.password.includes(query) // 漏洞：搜索密码
  );

  res.json({ results });
});

// 文件路径遍历漏洞
app.get('/api/file', (req, res) => {
  // 漏洞12: 路径遍历
  const filename = req.query.filename;

  // 不安全的文件访问
  res.json({
    message: `Attempting to access file: ${filename}`,
    warning: 'This is a path traversal vulnerability!'
  });
});

// 不安全的密码重置
app.post('/api/reset-password', (req, res) => {
  // 漏洞13: 没有验证，直接重置密码
  const { username, newPassword } = req.body;
  const user = users.find(u => u.username === username);

  if (user) {
    user.password = newPassword; // 明文存储
    res.json({ success: true, message: 'Password reset successfully' });
  } else {
    res.json({ error: 'User not found' });
  }
});

// 不安全的用户注册
app.post('/api/register', (req, res) => {
  // 漏洞14: 没有验证，直接创建用户
  const { username, password } = req.body;

  // 检查用户是否已存在
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.json({ error: 'User already exists' });
  }

  // 创建新用户
  const newUser = {
    id: users.length + 1,
    username,
    password, // 明文存储
    balance: { USD: 0, BTC: 0, ETH: 0 }
  };

  users.push(newUser);
  res.json({ success: true, user: newUser });
});

app.listen(PORT, () => {
  console.log(`⚠️  INSECURE exchange server running on port ${PORT}`);
  console.log('⚠️  This server contains multiple security vulnerabilities for educational purposes!');
}); 