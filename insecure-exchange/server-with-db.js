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

// 不安全的交易 - 真正的SQL注入漏洞
app.post('/api/trade', (req, res) => {
  const { userId, fromCurrency, toCurrency, amount, customNote } = req.body;

  // 漏洞5: 没有认证，任何人都可以交易
  // 漏洞6: 没有输入验证
  // 漏洞7: SQL注入 - 直接拼接用户输入
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

        // 更新余额 - 存在SQL注入漏洞
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
            // 记录交易 - 存在SQL注入漏洞
            const insertQuery = `
              INSERT INTO transactions (user_id, from_currency, to_currency, amount, converted_amount, note)
              VALUES (${userId}, '${fromCurrency}', '${toCurrency}', ${amount}, ${convertedAmount}, '${customNote || ''}')
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
                    convertedAmount,
                    note: customNote
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

// 高级交易查询 - SQL注入演示
app.get('/api/trade-query', (req, res) => {
  // 漏洞8: SQL注入 - 交易查询
  const { userId, currency, minAmount, maxAmount, dateFrom, dateTo } = req.query;

  // 构建不安全的查询 - 直接拼接用户输入
  let query = 'SELECT * FROM transactions';

  // 构建WHERE子句 - 更容易被SQL注入攻击
  let whereConditions = [];

  if (userId) {
    // 数字型注入 - 不需要引号
    whereConditions.push(`user_id = ${userId}`);
  }

  if (currency) {
    // 字符串型注入 - 需要引号
    whereConditions.push(`(from_currency = '${currency}' OR to_currency = '${currency}')`);
  }

  if (minAmount) {
    // 数字型注入 - 不需要引号
    whereConditions.push(`amount >= ${minAmount}`);
  }

  if (maxAmount) {
    // 数字型注入 - 不需要引号
    whereConditions.push(`amount <= ${maxAmount}`);
  }

  if (dateFrom) {
    // 字符串型注入 - 需要引号
    whereConditions.push(`timestamp >= '${dateFrom}'`);
  }

  if (dateTo) {
    // 字符串型注入 - 需要引号
    whereConditions.push(`timestamp <= '${dateTo}'`);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ' ORDER BY timestamp DESC';

  console.log('Executing SQL query:', query);

  db.all(query, (err, transactions) => {
    if (err) {
      console.error('Database error:', err);
      res.json({ error: 'Database error', details: err.message, query: query });
    } else {
      console.log(`Found ${transactions.length} transactions`);
      res.json({
        transactions,
        query: query,
        message: 'Vulnerable trade query executed'
      });
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

// 商品搜索功能 - SQL注入漏洞
app.get('/api/products/search', (req, res) => {
  // 漏洞15: SQL注入 - 模拟不安全的商品搜索
  const searchTerm = req.query.q || '';

  // 模拟商品数据
  const products = [
    { id: 1, name: 'Bitcoin Mining Rig', price: 2500, category: 'Hardware' },
    { id: 2, name: 'Ethereum Wallet', price: 50, category: 'Software' },
    { id: 3, name: 'Crypto Trading Bot', price: 200, category: 'Software' },
    { id: 4, name: 'Ledger Nano S', price: 80, category: 'Hardware' }
  ];

  // 不安全的搜索逻辑 - 模拟SQL注入
  const results = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 如果搜索包含特殊字符，返回额外信息（模拟SQL注入）
  if (searchTerm.includes("'") || searchTerm.includes('"') || searchTerm.includes('--')) {
    results.push({
      id: 999,
      name: '⚠️ SQL Injection Detected',
      price: 0,
      category: 'Vulnerability',
      note: 'This would expose database information in a real SQL injection'
    });
  }

  res.json({ results, searchTerm });
});

// 商品评论系统 - 存储型XSS漏洞
app.post('/api/products/:productId/comments', (req, res) => {
  // 漏洞16: 存储型XSS - 商品评论系统
  const { productId } = req.params;
  const { username, comment, rating } = req.body;

  // 不安全的存储 - 直接存储用户输入，没有转义
  const newComment = {
    id: Date.now(),
    productId: parseInt(productId),
    username: username || 'Anonymous',
    comment: comment, // 直接存储，没有转义
    rating: rating || 5,
    timestamp: new Date().toISOString()
  };

  // 模拟存储到数据库
  if (!global.productComments) {
    global.productComments = [];
  }
  global.productComments.push(newComment);

  res.json({ success: true, comment: newComment });
});

// 获取商品评论 - XSS漏洞
app.get('/api/products/:productId/comments', (req, res) => {
  // 漏洞17: 不安全的输出 - 直接输出存储的HTML
  const { productId } = req.params;
  const comments = (global.productComments || []).filter(c => c.productId === parseInt(productId));

  res.json({
    productId: parseInt(productId),
    comments: comments,
    total: comments.length
  });
});

// 查看评论页面 - 真正的XSS演示
app.get('/api/comments-view', (req, res) => {
  const comments = global.productComments || [];

  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <html>
      <head>
        <title>Product Comments</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; }
          .comment { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          .comment-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .username { font-weight: bold; color: #2c3e50; }
          .rating { color: #f39c12; }
          .date { color: #7f8c8d; font-size: 0.9em; }
          .comment-content { line-height: 1.6; }
          .warning { background: #ff4757; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>💬 Product Comments</h1>
          <div class="warning">
            ⚠️ This page is vulnerable to stored XSS attacks! 
            Comments are rendered without sanitization.
          </div>
          
          ${comments.length === 0 ? '<p>No comments yet.</p>' : ''}
          
          ${comments.map(comment => `
            <div class="comment">
              <div class="comment-header">
                <span class="username">${comment.username}</span>
                <span class="rating">${'⭐'.repeat(comment.rating)}</span>
                <span class="date">${new Date(comment.timestamp).toLocaleString()}</span>
              </div>
              <div class="comment-content">
                ${comment.comment}
              </div>
            </div>
          `).join('')}
          
          <div style="margin-top: 30px; padding: 20px; background: #e8f4fd; border-radius: 10px;">
            <h3>💡 XSS Attack Examples:</h3>
            <ul>
              <li><code>&lt;script&gt;alert('XSS Attack!')&lt;/script&gt;</code></li>
              <li><code>&lt;img src=x onerror=alert('XSS')&gt;</code></li>
              <li><code>&lt;svg onload=alert('XSS')&gt;&lt;/svg&gt;</code></li>
              <li><code>&lt;div onmouseover=alert('XSS')&gt;Hover me&lt;/div&gt;</code></li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  `);
});

// 价格比较功能 - 反射型XSS漏洞
app.get('/api/price-comparison', (req, res) => {
  // 漏洞18: 反射型XSS - 价格比较页面
  const { crypto, fiat, amount } = req.query;

  // 模拟价格数据
  const prices = {
    BTC: { USD: 45000, EUR: 42000, CNY: 320000 },
    ETH: { USD: 3200, EUR: 3000, CNY: 23000 },
    ADA: { USD: 1.2, EUR: 1.1, CNY: 8.5 }
  };

  const cryptoUpper = crypto ? crypto.toUpperCase() : 'BTC';
  const fiatUpper = fiat ? fiat.toUpperCase() : 'USD';
  const amountNum = parseFloat(amount) || 1;

  const price = prices[cryptoUpper]?.[fiatUpper] || 0;
  const total = price * amountNum;

  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <html>
      <head>
        <title>Price Comparison</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .result { background: #f0f0f0; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .price { font-size: 24px; color: #2ecc71; font-weight: bold; }
          .warning { color: #e74c3c; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>💰 Crypto Price Comparison</h1>
        <div class="result">
          <h2>Price Calculation</h2>
          <p><strong>Cryptocurrency:</strong> ${cryptoUpper || 'BTC'}</p>
          <p><strong>Fiat Currency:</strong> ${fiatUpper || 'USD'}</p>
          <p><strong>Amount:</strong> ${amountNum}</p>
          <p class="price">Total Value: ${fiatUpper} ${total.toLocaleString()}</p>
          <p><strong>Rate:</strong> 1 ${cryptoUpper} = ${fiatUpper} ${price.toLocaleString()}</p>
        </div>
        <p class="warning">⚠️ This page is vulnerable to reflected XSS attacks!</p>
        <p>Try adding <code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code> to any parameter.</p>
        <script>
          // 检测URL中的XSS payload
          const urlParams = new URLSearchParams(window.location.search);
          const cryptoParam = urlParams.get('crypto');
          const fiatParam = urlParams.get('fiat');
          const amountParam = urlParams.get('amount');
          
          // 检查是否包含XSS payload
          if (cryptoParam && (cryptoParam.includes('<script>') || cryptoParam.includes('alert('))) {
            console.log('Reflected XSS detected in crypto parameter!');
          }
          if (fiatParam && (fiatParam.includes('<script>') || fiatParam.includes('alert('))) {
            console.log('Reflected XSS detected in fiat parameter!');
          }
          if (amountParam && (amountParam.includes('<script>') || amountParam.includes('alert('))) {
            console.log('Reflected XSS detected in amount parameter!');
          }
        </script>
      </body>
    </html>
  `);
});

// 用户资料页面 - DOM型XSS漏洞
app.get('/api/user-profile', (req, res) => {
  // 漏洞19: DOM型XSS - 用户资料页面
  const { userId, theme, layout } = req.query;

  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <html>
      <head>
        <title>User Profile</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .profile { background: #f8f9fa; padding: 20px; border-radius: 10px; }
          .theme-dark { background: #2c3e50; color: white; }
          .theme-light { background: #ecf0f1; color: #2c3e50; }
        </style>
      </head>
      <body>
        <h1>👤 User Profile</h1>
        <div class="profile" id="profile-container">
          <h2>User Information</h2>
          <p><strong>User ID:</strong> <span id="user-id">${userId || '1'}</span></p>
          <p><strong>Theme:</strong> <span id="theme">${theme || 'light'}</span></p>
          <p><strong>Layout:</strong> <span id="layout">${layout || 'default'}</span></p>
          <div id="custom-content"></div>
        </div>
        
        <script>
          // 不安全的DOM操作 - DOM型XSS漏洞
          const urlParams = new URLSearchParams(window.location.search);
          const theme = urlParams.get('theme');
          const layout = urlParams.get('layout');
          const customContent = urlParams.get('content');
          
          // 直接设置innerHTML，没有转义
          if (customContent) {
            document.getElementById('custom-content').innerHTML = customContent;
          }
          
          // 应用主题
          if (theme === 'dark') {
            document.body.className = 'theme-dark';
          } else if (theme === 'light') {
            document.body.className = 'theme-light';
          }
          
          console.log('⚠️ This page is vulnerable to DOM-based XSS attacks!');
        </script>
      </body>
    </html>
  `);
});

// 获取所有商品评论（用于演示）
app.get('/api/comments', (req, res) => {
  const comments = global.productComments || [];
  res.json({ comments });
});

app.listen(PORT, () => {
  console.log(`⚠️  INSECURE exchange server with REAL DATABASE running on port ${PORT}`);
  console.log('⚠️  This server contains REAL SQL injection vulnerabilities for educational purposes!');
  console.log('⚠️  Database file:', dbPath);
}); 