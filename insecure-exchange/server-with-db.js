const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5007;

// 不安全配置 - 没有安全中间件
app.use(cors()); // 允许所有来源
app.use(express.json());

// 连接数据库
const dbPath = path.join(__dirname, 'insecure_exchange.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Connected to SQLite database');

// 不安全的登录 - 直接拼接SQL
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // 漏洞1: SQL注入 - 直接拼接用户输入
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  db.get(query, (err, user) => {
    if (err) {
      console.error('Database error:', err);
      res.json({ success: false, message: 'Database error', error: err.message });
    } else if (user) {
      // 漏洞2: 返回明文密码
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          password: user.password, // 漏洞：返回密码
          balance: {
            USD: user.usd_balance,
            BTC: user.btc_balance,
            ETH: user.eth_balance
          }
        }
      });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// 获取用户信息 - 没有认证
app.get('/api/user/:id', (req, res) => {
  // 漏洞3: 没有认证，任何人都可以获取任何用户信息
  const userId = req.params.id;
  const query = `SELECT * FROM users WHERE id = ${userId}`;

  db.get(query, (err, user) => {
    if (err) {
      res.json({ error: 'Database error', details: err.message });
    } else if (user) {
      res.json({ user });
    } else {
      res.json({ error: 'User not found' });
    }
  });
});

// 获取所有用户 - 严重漏洞
app.get('/api/users', (req, res) => {
  // 漏洞4: 暴露所有用户信息
  const query = 'SELECT * FROM users';

  db.all(query, (err, users) => {
    if (err) {
      res.json({ error: 'Database error', details: err.message });
    } else {
      res.json({ users });
    }
  });
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

  // 漏洞5: 没有认证，任何人都可以交易
  // 漏洞6: 没有输入验证
  const userQuery = `SELECT * FROM users WHERE id = ${userId}`;

  db.get(userQuery, (err, user) => {
    if (err) {
      res.json({ error: 'Database error', details: err.message });
    } else if (!user) {
      res.json({ error: 'User not found' });
    } else {
      // 检查余额
      const balanceField = `${fromCurrency.toLowerCase()}_balance`;
      if (user[balanceField] < amount) {
        res.json({ error: 'Insufficient balance' });
      } else {
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
        const updateQuery = `
          UPDATE users 
          SET ${fromCurrency.toLowerCase()}_balance = ${fromCurrency.toLowerCase()}_balance - ${amount},
              ${toCurrency.toLowerCase()}_balance = ${toCurrency.toLowerCase()}_balance + ${convertedAmount}
          WHERE id = ${userId}
        `;

        db.run(updateQuery, function (err) {
          if (err) {
            res.json({ error: 'Database error', details: err.message });
          } else {
            // 记录交易
            const insertQuery = `
              INSERT INTO transactions (user_id, from_currency, to_currency, amount, converted_amount)
              VALUES (${userId}, '${fromCurrency}', '${toCurrency}', ${amount}, ${convertedAmount})
            `;

            db.run(insertQuery, function (err) {
              if (err) {
                res.json({ error: 'Failed to record transaction', details: err.message });
              } else {
                res.json({
                  success: true,
                  message: 'Trade executed successfully',
                  transaction: {
                    id: this.lastID,
                    userId: userId,
                    fromCurrency,
                    toCurrency,
                    amount,
                    convertedAmount
                  }
                });
              }
            });
          }
        });
      }
    }
  });
});

// 获取交易历史 - 没有认证
app.get('/api/transactions/:userId', (req, res) => {
  // 漏洞7: 任何人都可以查看任何用户的交易历史
  const userId = req.params.userId;
  const query = `SELECT * FROM transactions WHERE user_id = ${userId}`;

  db.all(query, (err, transactions) => {
    if (err) {
      res.json({ error: 'Database error', details: err.message });
    } else {
      res.json(transactions);
    }
  });
});

// 获取所有交易 - 严重漏洞
app.get('/api/transactions', (req, res) => {
  // 漏洞8: 暴露所有交易信息
  const query = 'SELECT * FROM transactions';

  db.all(query, (err, transactions) => {
    if (err) {
      res.json({ error: 'Database error', details: err.message });
    } else {
      res.json(transactions);
    }
  });
});

// 更新用户余额 - 严重漏洞
app.post('/api/update-balance', (req, res) => {
  // 漏洞9: 没有认证，任何人都可以修改余额
  const { userId, currency, amount } = req.body;
  const query = `UPDATE users SET ${currency.toLowerCase()}_balance = ${amount} WHERE id = ${userId}`;

  db.run(query, function (err) {
    if (err) {
      res.json({ error: 'Database error', details: err.message });
    } else {
      res.json({ success: true, message: 'Balance updated successfully' });
    }
  });
});

// SQL注入漏洞 - 真实数据库查询
app.get('/api/search', (req, res) => {
  // 漏洞10: SQL注入 - 直接拼接用户输入
  const query = req.query.q;

  // 不安全的查询 - 直接拼接
  const sqlQuery = `SELECT * FROM users WHERE username LIKE '%${query}%' OR password LIKE '%${query}%'`;

  db.all(sqlQuery, (err, results) => {
    if (err) {
      res.json({ error: 'Database error', details: err.message });
    } else {
      res.json({
        results,
        query: sqlQuery,
        message: 'Vulnerable search performed'
      });
    }
  });
});

// 高级SQL注入演示
app.get('/api/advanced-search', (req, res) => {
  // 漏洞11: 更复杂的SQL注入
  const query = req.query.q;

  // 不安全的查询 - 允许更复杂的注入
  const sqlQuery = `SELECT * FROM users WHERE username = '${query}' OR password = '${query}'`;

  db.all(sqlQuery, (err, results) => {
    if (err) {
      res.json({ error: 'Database error', details: err.message });
    } else {
      res.json({
        results,
        query: sqlQuery,
        message: 'Advanced vulnerable search performed'
      });
    }
  });
});

// 不安全的密码重置
app.post('/api/reset-password', (req, res) => {
  // 漏洞12: 没有验证，直接重置密码
  const { username, newPassword } = req.body;
  const query = `UPDATE users SET password = '${newPassword}' WHERE username = '${username}'`;

  db.run(query, function (err) {
    if (err) {
      res.json({ error: 'Database error', details: err.message });
    } else {
      res.json({ success: true, message: 'Password reset successfully' });
    }
  });
});

// 不安全的用户注册
app.post('/api/register', (req, res) => {
  // 漏洞13: 没有验证，直接创建用户
  const { username, password } = req.body;
  const query = `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`;

  db.run(query, function (err) {
    if (err) {
      res.json({ error: 'Database error', details: err.message });
    } else {
      res.json({ success: true, message: 'User created successfully', userId: this.lastID });
    }
  });
});

// 数据库信息泄露
app.get('/api/db-info', (req, res) => {
  // 漏洞14: 暴露数据库信息
  const query = "SELECT name FROM sqlite_master WHERE type='table'";

  db.all(query, (err, tables) => {
    if (err) {
      res.json({ error: 'Database error', details: err.message });
    } else {
      res.json({
        tables,
        message: 'Database schema exposed!',
        warning: 'This is a serious security vulnerability!'
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`⚠️  INSECURE exchange server with REAL DATABASE running on port ${PORT}`);
  console.log('⚠️  This server contains REAL SQL injection vulnerabilities for educational purposes!');
  console.log('⚠️  Database file:', dbPath);
}); 