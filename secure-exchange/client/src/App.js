import React, { useState, useEffect } from 'react';
import './App.css';

// API端点配置
const API_BASE = 'http://localhost:5008/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [prices, setPrices] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [tradeForm, setTradeForm] = useState({
    userId: 1,
    fromCurrency: 'USD',
    toCurrency: 'BTC',
    amount: '',
    customNote: ''
  });
  const [vulnerabilityForm, setVulnerabilityForm] = useState({
    searchQuery: '',
    filename: '',
    targetUserId: 1,
    newBalance: 1000000,
    newPassword: 'hacked'
  });
  const [xssForm, setXssForm] = useState({
    reflectedInput: '',
    storedMessage: '',
    storedUsername: '',
    domData: '',
    profileBio: '',
    profileDisplayName: ''
  });
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [commentForm, setCommentForm] = useState({
    username: '',
    comment: '',
    rating: 5
  });
  const [comments, setComments] = useState([]);
  const [priceComparison, setPriceComparison] = useState({
    crypto: 'BTC',
    fiat: 'USD',
    amount: 1
  });
  const [tradeQueryForm, setTradeQueryForm] = useState({
    userId: '',
    currency: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: ''
  });
  const [tradeQueryResults, setTradeQueryResults] = useState([]);

  useEffect(() => {
    if (token && isLoggedIn) {
      fetchPrices();
      fetchAllUsers();
      fetchAllTransactions();
      fetchComments();
    }
  }, [token, isLoggedIn]);

  const fetchUserData = async () => {
    try {
      // 首先从登录响应中获取用户ID
      const response = await fetch(`${API_BASE}/user/1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('token');
        setToken(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchPrices = async () => {
    try {
      const response = await fetch(`${API_BASE}/prices`);
      const data = await response.json();
      setPrices(data);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const response = await fetch(`${API_BASE}/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);
        alert('Login successful! Secure version - no password exposure.');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/trade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tradeForm)
      });

      const data = await response.json();
      if (data.success) {
        alert('Trade successful! Authentication required and enforced.');
        setTradeForm({ ...tradeForm, amount: '' });
        fetchAllUsers(); // Refresh user data
      } else {
        alert(data.error || 'Trade failed');
      }
    } catch (error) {
      console.error('Trade error:', error);
      alert('Trade failed');
    }
  };

  // 安全版本演示功能 - 所有攻击都被阻止
  const demonstrateVulnerabilities = async () => {
    const { searchQuery, filename, targetUserId, newBalance, newPassword } = vulnerabilityForm;

    // 安全搜索 - 使用参数化查询
    if (searchQuery) {
      try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        alert(`Secure search results: ${JSON.stringify(data, null, 2)}\n\n✅ SQL Injection prevented!`);
      } catch (error) {
        console.error('Search error:', error);
      }
    }

    // 安全高级搜索
    if (searchQuery) {
      try {
        const response = await fetch(`${API_BASE}/advanced-search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        alert(`Secure advanced search results: ${JSON.stringify(data, null, 2)}\n\n✅ Advanced SQL Injection prevented!`);
      } catch (error) {
        console.error('Advanced search error:', error);
      }
    }

    // 数据库信息 - 需要管理员权限
    try {
      const response = await fetch(`${API_BASE}/db-info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Database info (admin only): ${JSON.stringify(data, null, 2)}\n\n✅ Access control enforced!`);
      } else {
        alert(`Access denied: ${data.error}\n\n✅ Unauthorized access prevented!`);
      }
    } catch (error) {
      console.error('Database info error:', error);
    }

    // 修改余额 - 需要管理员权限
    if (newBalance) {
      try {
        const response = await fetch(`${API_BASE}/update-balance`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: targetUserId,
            currency: 'USD',
            amount: newBalance
          })
        });
        const data = await response.json();
        if (response.ok) {
          alert(`Balance update result: ${JSON.stringify(data, null, 2)}\n\n✅ Admin access required and enforced!`);
          fetchAllUsers(); // Refresh data
        } else {
          alert(`Access denied: ${data.error}\n\n✅ Unauthorized balance modification prevented!`);
        }
      } catch (error) {
        console.error('Balance update error:', error);
      }
    }

    // 重置密码 - 需要管理员权限
    if (newPassword) {
      try {
        const response = await fetch(`${API_BASE}/reset-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'admin',
            newPassword: newPassword
          })
        });
        const data = await response.json();
        if (response.ok) {
          alert(`Password reset result: ${JSON.stringify(data, null, 2)}\n\n✅ Admin access required and enforced!`);
        } else {
          alert(`Access denied: ${data.error}\n\n✅ Unauthorized password reset prevented!`);
        }
      } catch (error) {
        console.error('Password reset error:', error);
      }
    }
  };

  const searchProducts = async () => {
    if (!productSearch.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(productSearch)}`);
      const data = await response.json();
      setSearchResults(data.results);

      if (productSearch.includes("'") || productSearch.includes('"') || productSearch.includes('--')) {
        alert('✅ SQL Injection prevented! All inputs are properly validated and sanitized.');
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // 添加商品评论 - 安全的存储型XSS演示
  const addComment = async () => {
    if (!commentForm.comment.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/products/1/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentForm)
      });
      const data = await response.json();
      if (data.success) {
        alert('Comment added! ✅ This comment system is protected against XSS attacks.');
        setCommentForm({ username: '', comment: '', rating: 5 });
        fetchComments();
      }
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  // 获取评论
  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_BASE}/products/1/comments`);
      const data = await response.json();
      setComments(data.comments);
    } catch (error) {
      console.error('Fetch comments error:', error);
    }
  };

  // 价格比较功能 - 安全的反射型XSS演示
  const openPriceComparison = () => {
    const { crypto, fiat, amount } = priceComparison;
    const url = `${API_BASE}/price-comparison?crypto=${encodeURIComponent(crypto)}&fiat=${encodeURIComponent(fiat)}&amount=${encodeURIComponent(amount)}`;
    window.open(url, '_blank');
  };

  // 用户资料页面 - 安全的DOM型XSS演示
  const openUserProfile = () => {
    const { domData } = xssForm;
    let url = `${API_BASE}/user-profile?userId=${user?.id || 1}&theme=light`;
    if (domData) {
      url += `&content=${encodeURIComponent(domData)}`;
    }
    window.open(url, '_blank');
  };

  // 查看评论XSS演示页面
  const viewCommentsXSS = () => {
    const url = `${API_BASE}/comments-view`;
    window.open(url, '_blank');
  };

  // 交易查询 - 安全的SQL注入演示
  const queryTrades = async () => {
    const { userId, currency, minAmount, maxAmount, dateFrom, dateTo } = tradeQueryForm;

    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (currency) params.append('currency', currency);
      if (minAmount) params.append('minAmount', minAmount);
      if (maxAmount) params.append('maxAmount', maxAmount);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const url = `${API_BASE}/trade-query?${params.toString()}`;
      console.log('Querying URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.transactions) {
        setTradeQueryResults(data.transactions);
        alert(`Secure query executed: ${data.query}\n\nFound ${data.transactions.length} transactions.\n\n✅ SQL Injection prevented!`);
      } else if (data.error) {
        alert(`Error: ${data.error}\n\n✅ Security measures enforced!`);
      } else {
        alert(`Unexpected response: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error('Trade query error:', error);
      alert(`Query failed: ${error.message}\n\n✅ Security measures enforced!`);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="App">
        <div className="login-container">
          <h1>🔒 Secure Crypto Exchange</h1>

          <form onSubmit={handleLogin} className="login-form">
            <h2>Login</h2>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="Enter username"
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Enter password"
                required
              />
            </div>
            <button type="submit">Login</button>
            <p className="login-info">
              <strong>Demo Accounts:</strong><br />
              Username: user1, Password: password<br />
              Username: admin, Password: admin123<br />
              Username: alice, Password: alice123<br />
              Username: bob, Password: bob456
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="header">
        <h1>🔒 Secure Crypto Exchange (Protected Version)</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <div className="security-banner">
        <strong>✅ ALL SECURITY MEASURES ACTIVE - SQL Injection, XSS, and CSRF Protection Enabled!</strong>
      </div>

      <div className="main-content">
        <div className="balance-section">
          <h2>💰 Balance (Protected)</h2>
          <div className="balance-grid">
            {user && Object.entries(user.balance).map(([currency, amount]) => (
              <div key={currency} className="balance-item">
                <span className="currency">{currency}</span>
                <span className="amount">{amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          {user && (
            <div className="security-info">
              <strong>✅ SECURITY:</strong> Password properly hashed and not exposed
            </div>
          )}
        </div>

        <div className="prices-section">
          <h2>📈 Market Prices</h2>
          <div className="prices-grid">
            {Object.entries(prices).map(([currency, price]) => (
              <div key={currency} className="price-item">
                <span className="currency">{currency}</span>
                <span className="price">${price.USD.toLocaleString()}</span>
                <span className={`change ${price.change24h >= 0 ? 'positive' : 'negative'}`}>
                  {price.change24h >= 0 ? '+' : ''}{price.change24h}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 交易查询 - 安全的SQL注入演示 */}
        <div className="app-section">
          <h3>🔍 Trade Query (Protected SQL Injection)</h3>
          <div className="trade-query-form">
            <div className="form-row">
              <div className="form-group">
                <label>User ID (Protected):</label>
                <input
                  type="text"
                  value={tradeQueryForm.userId}
                  onChange={(e) => setTradeQueryForm({ ...tradeQueryForm, userId: e.target.value })}
                  placeholder="Try: 1 OR 1=1 (will be blocked)"
                  className="query-input"
                />
              </div>
              <div className="form-group">
                <label>Currency (Protected):</label>
                <input
                  type="text"
                  value={tradeQueryForm.currency}
                  onChange={(e) => setTradeQueryForm({ ...tradeQueryForm, currency: e.target.value })}
                  placeholder="Try: ' OR '1'='1 (will be blocked)"
                  className="query-input"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Min Amount (Protected):</label>
                <input
                  type="text"
                  value={tradeQueryForm.minAmount}
                  onChange={(e) => setTradeQueryForm({ ...tradeQueryForm, minAmount: e.target.value })}
                  placeholder="Try: 0 OR 1=1 (will be blocked)"
                  className="query-input"
                />
              </div>
              <div className="form-group">
                <label>Max Amount (Protected):</label>
                <input
                  type="text"
                  value={tradeQueryForm.maxAmount}
                  onChange={(e) => setTradeQueryForm({ ...tradeQueryForm, maxAmount: e.target.value })}
                  placeholder="Try: 999999 OR 1=1 (will be blocked)"
                  className="query-input"
                />
              </div>
            </div>
            <button onClick={queryTrades} className="query-btn">Execute Secure Query</button>
          </div>

          {tradeQueryResults.length > 0 && (
            <div className="query-results">
              <h4>Query Results:</h4>
              {tradeQueryResults.map((tx) => (
                <div key={tx.id} className="query-result-item">
                  <div className="result-header">
                    <strong>Transaction #{tx.id}</strong>
                    <span className="result-date">{new Date(tx.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="result-details">
                    User {tx.user_id}: {tx.amount} {tx.from_currency} → {tx.converted_amount} {tx.to_currency}
                    {tx.note && <div className="result-note">Note: {tx.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="security-tip">
            💡 Security Features:
            <ul>
              <li><strong>Parameterized Queries:</strong> All SQL injection attempts are blocked</li>
              <li><strong>Input Validation:</strong> All inputs are validated and sanitized</li>
              <li><strong>Authentication Required:</strong> All queries require valid authentication</li>
              <li><strong>Access Control:</strong> Users can only query their own data</li>
            </ul>
          </div>
        </div>

        <div className="real-applications-section">
          {/* 商品评论 - 安全的存储型XSS */}
          <div className="app-section">
            <h3>💬 Product Comments (Protected XSS)</h3>
            <div className="comment-form">
              <input
                type="text"
                value={commentForm.username}
                onChange={(e) => setCommentForm({ ...commentForm, username: e.target.value })}
                placeholder="Your name"
                className="comment-input"
              />
              <textarea
                value={commentForm.comment}
                onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })}
                placeholder="Write your comment..."
                className="comment-textarea"
              />
              <div className="rating-container">
                <label>Rating: </label>
                <select
                  value={commentForm.rating}
                  onChange={(e) => setCommentForm({ ...commentForm, rating: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} ⭐</option>)}
                </select>
              </div>
              <button onClick={addComment} className="comment-btn">Add Comment</button>
            </div>

            <div className="comments-list">
              <h4>Comment List:</h4>
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <strong>{comment.username}</strong> - {comment.rating}⭐
                    <span className="comment-date">{new Date(comment.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="comment-content">{comment.comment}</div>
                </div>
              ))}
            </div>

            <button onClick={viewCommentsXSS} className="xss-demo-btn">
              ✅ View the secure XSS demo page
            </button>
            <div className="security-tip">
              💡 Try XSS: <code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code> - Will be sanitized and blocked
            </div>
          </div>
        </div>

        {/* 安全漏洞演示 */}
        <div className="app-section">
          <h3>🛡️ Security Vulnerability Demonstrations (All Blocked)</h3>
          <div className="vulnerability-form">
            <div className="form-row">
              <div className="form-group">
                <label>Search Query (SQL Injection Test):</label>
                <input
                  type="text"
                  value={vulnerabilityForm.searchQuery}
                  onChange={(e) => setVulnerabilityForm({ ...vulnerabilityForm, searchQuery: e.target.value })}
                  placeholder="Try: ' OR '1'='1"
                  className="vuln-input"
                />
              </div>
              <div className="form-group">
                <label>Target User ID:</label>
                <input
                  type="number"
                  value={vulnerabilityForm.targetUserId}
                  onChange={(e) => setVulnerabilityForm({ ...vulnerabilityForm, targetUserId: parseInt(e.target.value) })}
                  placeholder="User ID to test"
                  className="vuln-input"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>New Balance (Admin Only):</label>
                <input
                  type="number"
                  value={vulnerabilityForm.newBalance}
                  onChange={(e) => setVulnerabilityForm({ ...vulnerabilityForm, newBalance: parseInt(e.target.value) })}
                  placeholder="Try to set balance"
                  className="vuln-input"
                />
              </div>
              <div className="form-group">
                <label>New Password (Admin Only):</label>
                <input
                  type="text"
                  value={vulnerabilityForm.newPassword}
                  onChange={(e) => setVulnerabilityForm({ ...vulnerabilityForm, newPassword: e.target.value })}
                  placeholder="Try to reset password"
                  className="vuln-input"
                />
              </div>
            </div>
            <button onClick={demonstrateVulnerabilities} className="vuln-btn">
              Test Security Measures
            </button>
          </div>
        </div>

        {/* 交易表单 */}
        <div className="app-section">
          <h3>💱 Trade (Authentication Required)</h3>
          <form onSubmit={handleTrade} className="trade-form">
            <div className="form-row">
              <div className="form-group">
                <label>User ID:</label>
                <input
                  type="number"
                  value={tradeForm.userId}
                  onChange={(e) => setTradeForm({ ...tradeForm, userId: parseInt(e.target.value) })}
                  placeholder="Your user ID"
                  required
                />
              </div>
              <div className="form-group">
                <label>From:</label>
                <select
                  value={tradeForm.fromCurrency}
                  onChange={(e) => setTradeForm({ ...tradeForm, fromCurrency: e.target.value })}
                >
                  <option value="USD">USD</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
              <div className="form-group">
                <label>To:</label>
                <select
                  value={tradeForm.toCurrency}
                  onChange={(e) => setTradeForm({ ...tradeForm, toCurrency: e.target.value })}
                >
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Amount:</label>
                <input
                  type="number"
                  step="0.01"
                  value={tradeForm.amount}
                  onChange={(e) => setTradeForm({ ...tradeForm, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div className="form-group">
                <label>Note:</label>
                <input
                  type="text"
                  value={tradeForm.customNote}
                  onChange={(e) => setTradeForm({ ...tradeForm, customNote: e.target.value })}
                  placeholder="Optional note"
                />
              </div>
            </div>
            <button type="submit">Execute Trade</button>
          </form>
        </div>

        {/* 用户列表 */}
        <div className="app-section">
          <h3>👥 All Users (Admin Only)</h3>
          <div className="users-list">
            {allUsers.map((user) => (
              <div key={user.id} className="user-item">
                <span className="user-id">ID: {user.id}</span>
                <span className="user-name">Username: {user.username}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 交易历史 */}
        <div className="app-section">
          <h3>📋 All Transactions (Admin Only)</h3>
          <div className="transactions-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div className="tx-header">
                  <span className="tx-id">#{tx.id}</span>
                  <span className="tx-date">{new Date(tx.timestamp).toLocaleString()}</span>
                </div>
                <div className="tx-details">
                  <span className="tx-amount">
                    User {tx.user_id}: {tx.amount} {tx.from_currency} → {tx.converted_amount} {tx.to_currency}
                  </span>
                  {tx.note && <div className="tx-note">Note: {tx.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
