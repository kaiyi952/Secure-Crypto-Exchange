import React, { useState, useEffect } from 'react';
import './App.css';

// API端点配置
const API_BASE = 'http://localhost:5007/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
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
    fetchPrices();
    fetchAllUsers();
    fetchAllTransactions();
  }, []);

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
      const response = await fetch(`${API_BASE}/users`);
      const data = await response.json();
      setAllUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const response = await fetch(`${API_BASE}/transactions`);
      const data = await response.json();
      setTransactions(data);
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
        setUser(data.user);
        setIsLoggedIn(true);
        alert('Login successful! Check the console for exposed password.');
        console.log('⚠️ VULNERABILITY: Password exposed:', data.user.password);
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tradeForm)
      });

      const data = await response.json();
      if (data.success) {
        alert('Trade successful! No authentication required.');
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

  // 漏洞演示功能
  const demonstrateVulnerabilities = async () => {
    const { searchQuery, filename, targetUserId, newBalance, newPassword } = vulnerabilityForm;

    // 漏洞1: 搜索用户（包括密码）
    if (searchQuery) {
      try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        alert(`Search results: ${JSON.stringify(data, null, 2)}`);
      } catch (error) {
        console.error('Search error:', error);
      }
    }

    // 漏洞2: 高级SQL注入
    if (searchQuery) {
      try {
        const response = await fetch(`${API_BASE}/advanced-search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        alert(`Advanced search results: ${JSON.stringify(data, null, 2)}`);
      } catch (error) {
        console.error('Advanced search error:', error);
      }
    }

    // 漏洞3: 数据库信息泄露
    try {
      const response = await fetch(`${API_BASE}/db-info`);
      const data = await response.json();
      alert(`Database info: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Database info error:', error);
    }

    // 漏洞4: 修改任意用户余额
    if (newBalance) {
      try {
        const response = await fetch(`${API_BASE}/update-balance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: targetUserId,
            currency: 'USD',
            amount: newBalance
          })
        });
        const data = await response.json();
        alert(`Balance update result: ${JSON.stringify(data, null, 2)}`);
        fetchAllUsers(); // Refresh data
      } catch (error) {
        console.error('Balance update error:', error);
      }
    }

    // 漏洞5: 重置任意用户密码
    if (newPassword) {
      try {
        const response = await fetch(`${API_BASE}/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'admin',
            newPassword: newPassword
          })
        });
        const data = await response.json();
        alert(`Password reset result: ${JSON.stringify(data, null, 2)}`);
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
        alert('⚠️ SQL Injection detected! In a real application, this could expose database information.');
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // 添加商品评论 - 存储型XSS演示
  const addComment = async () => {
    if (!commentForm.comment.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/products/1/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentForm)
      });
      const data = await response.json();
      if (data.success) {
        alert('Comment added! Note: This comment system has a stored XSS vulnerability.');
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

  // 价格比较功能 - 反射型XSS演示
  const openPriceComparison = () => {
    const { crypto, fiat, amount } = priceComparison;
    const url = `${API_BASE}/price-comparison?crypto=${encodeURIComponent(crypto)}&fiat=${encodeURIComponent(fiat)}&amount=${encodeURIComponent(amount)}`;
    window.open(url, '_blank');
  };

  // 用户资料页面 - DOM型XSS演示
  const openUserProfile = () => {
    const { domData } = xssForm;
    let url = `${API_BASE}/user-profile?userId=1&theme=light`;
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

  // 交易查询 - SQL注入演示
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

      // 测试连接
      const testResponse = await fetch(`${API_BASE}/transactions`);
      console.log('Test response status:', testResponse.status);

      const response = await fetch(url);
      console.log('Query response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.transactions) {
        setTradeQueryResults(data.transactions);
        alert(`Query executed: ${data.query}\n\nFound ${data.transactions.length} transactions.`);
      } else if (data.error) {
        alert(`Error: ${data.error}\n\nQuery: ${data.query || 'N/A'}\n\nDetails: ${data.details || 'N/A'}`);
      } else {
        alert(`Unexpected response: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error('Trade query error:', error);
      alert(`Query failed: ${error.message}\n\nPlease check the browser console for more details.`);
    }
  };

  // 加载评论
  useEffect(() => {
    fetchComments();
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="App">
        <div className="login-container">
          <h1>⚠️ Insecure Crypto Exchange</h1>

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
        <h1>⚠️ Insecure Crypto Exchange (Database Version)</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <div className="warning-banner">
        <strong>⚠️ REAL SQL INJECTION VULNERABILITIES - Educational Purposes Only!</strong>
      </div>

      <div className="main-content">
        <div className="balance-section">
          <h2>💰 Balance (Exposed)</h2>
          <div className="balance-grid">
            {user && Object.entries(user.balance).map(([currency, amount]) => (
              <div key={currency} className="balance-item">
                <span className="currency">{currency}</span>
                <span className="amount">{amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          {user && (
            <div className="vulnerability-info">
              <strong>⚠️ VULNERABILITY:</strong> Password exposed: {user.password}
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



        {/* 交易查询 - SQL注入演示 */}
        <div className="app-section">
          <h3>🔍 Trade Query (SQL Injection)</h3>
          <div className="trade-query-form">
            <div className="form-row">
              <div className="form-group">
                <label>User ID (Numeric Injection):</label>
                <input
                  type="text"
                  value={tradeQueryForm.userId}
                  onChange={(e) => setTradeQueryForm({ ...tradeQueryForm, userId: e.target.value })}
                  placeholder="Try: 1 OR 1=1 (no quotes needed)"
                  className="query-input"
                />
              </div>
              <div className="form-group">
                <label>Currency (String Injection):</label>
                <input
                  type="text"
                  value={tradeQueryForm.currency}
                  onChange={(e) => setTradeQueryForm({ ...tradeQueryForm, currency: e.target.value })}
                  placeholder="Try: ' OR '1'='1 (quotes needed)"
                  className="query-input"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Min Amount (Numeric Injection):</label>
                <input
                  type="text"
                  value={tradeQueryForm.minAmount}
                  onChange={(e) => setTradeQueryForm({ ...tradeQueryForm, minAmount: e.target.value })}
                  placeholder="Try: 0 OR 1=1 (no quotes needed)"
                  className="query-input"
                />
              </div>
              <div className="form-group">
                <label>Max Amount (Numeric Injection):</label>
                <input
                  type="text"
                  value={tradeQueryForm.maxAmount}
                  onChange={(e) => setTradeQueryForm({ ...tradeQueryForm, maxAmount: e.target.value })}
                  placeholder="Try: 999999 OR 1=1 (no quotes needed)"
                  className="query-input"
                />
              </div>
            </div>
            <button onClick={queryTrades} className="query-btn">Execute Query</button>
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

          <div className="vulnerability-tip">
            💡 SQL Injection Examples:
            <ul>
              <li><strong>Numeric Injection (User ID, Min/Max Amount):</strong></li>
              <li><code>1 OR 1=1</code> - Show all transactions</li>
              <li><code>1; DROP TABLE transactions; --</code> - Delete transactions table</li>
              <li><code>1 UNION SELECT * FROM users --</code> - Union attack</li>
              <li><strong>String Injection (Currency):</strong></li>
              <li><code>' OR '1'='1</code> - Show all transactions</li>
              <li><code>'; DROP TABLE transactions; --</code> - Delete transactions table</li>
              <li><code>' UNION SELECT * FROM users --</code> - Union attack</li>
            </ul>
          </div>
        </div>

        <div className="real-applications-section">




          {/* 商品评论 - 存储型XSS */}
          <div className="app-section">
            <h3>💬 Product Comments (Stored XSS)</h3>
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
                  <div className="comment-content" dangerouslySetInnerHTML={{ __html: comment.comment }} />
                </div>
              ))}
            </div>

            <button onClick={viewCommentsXSS} className="xss-demo-btn">
              🚨 View the real XSS demo page
            </button>
            <div className="vulnerability-tip">
              💡 Try XSS: <code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code> or <code>&lt;img src=x onerror=alert('XSS')&gt;</code>
            </div>
          </div>




        </div>



      </div>
    </div>
  );
}

export default App;
