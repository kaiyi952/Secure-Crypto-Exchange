import React, { useState, useEffect } from 'react';
import './App.css';

// 可以选择使用不同的API端点
const API_BASE = 'http://localhost:5007/api'; // 数据库版本
// const API_BASE = 'http://localhost:5005/api'; // 内存版本

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [prices, setPrices] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [tradeForm, setTradeForm] = useState({ userId: 1, fromCurrency: 'USD', toCurrency: 'BTC', amount: '' });
  const [vulnerabilityForm, setVulnerabilityForm] = useState({
    searchQuery: '',
    filename: '',
    targetUserId: 1,
    newBalance: 1000000,
    newPassword: 'hacked'
  });

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

  if (!isLoggedIn) {
    return (
      <div className="App">
        <div className="login-container">
          <h1>⚠️ Insecure Crypto Exchange (Database Version)</h1>
          <div className="warning-banner">
            <strong>⚠️ WARNING: This application contains REAL SQL injection vulnerabilities for educational purposes!</strong>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <h2>Login (No Security)</h2>
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

        <div className="trade-section">
          <h2>💱 Trade (No Authentication)</h2>
          <form onSubmit={handleTrade} className="trade-form">
            <div className="form-group">
              <label>User ID (Can trade for anyone):</label>
              <input
                type="number"
                value={tradeForm.userId}
                onChange={(e) => setTradeForm({ ...tradeForm, userId: parseInt(e.target.value) })}
                placeholder="Enter user ID"
                required
              />
            </div>
            <div className="form-row">
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
            <button type="submit">Execute Trade (No Auth)</button>
          </form>
        </div>

        <div className="vulnerabilities-section">
          <h2>🔓 SQL Injection Demonstrations</h2>
          <div className="vulnerability-form">
            <div className="form-group">
              <label>SQL Injection Search:</label>
              <input
                type="text"
                value={vulnerabilityForm.searchQuery}
                onChange={(e) => setVulnerabilityForm({ ...vulnerabilityForm, searchQuery: e.target.value })}
                placeholder="Try: ' OR '1'='1 or ' UNION SELECT * FROM users --"
              />
            </div>
            <div className="form-group">
              <label>Target User ID for Balance Hack:</label>
              <input
                type="number"
                value={vulnerabilityForm.targetUserId}
                onChange={(e) => setVulnerabilityForm({ ...vulnerabilityForm, targetUserId: parseInt(e.target.value) })}
                placeholder="User ID"
              />
            </div>
            <div className="form-group">
              <label>New Balance Amount:</label>
              <input
                type="number"
                value={vulnerabilityForm.newBalance}
                onChange={(e) => setVulnerabilityForm({ ...vulnerabilityForm, newBalance: parseInt(e.target.value) })}
                placeholder="New balance"
              />
            </div>
            <div className="form-group">
              <label>New Password for Admin:</label>
              <input
                type="text"
                value={vulnerabilityForm.newPassword}
                onChange={(e) => setVulnerabilityForm({ ...vulnerabilityForm, newPassword: e.target.value })}
                placeholder="New password"
              />
            </div>
            <button onClick={demonstrateVulnerabilities} className="vulnerability-btn">
              🔓 Demonstrate SQL Injection
            </button>
          </div>
        </div>

        <div className="users-section">
          <h2>👥 All Users (Exposed)</h2>
          <div className="users-list">
            {allUsers.map((user) => (
              <div key={user.id} className="user-item">
                <div className="user-header">
                  <span className="user-id">ID: {user.id}</span>
                  <span className="user-name">{user.username}</span>
                </div>
                <div className="user-details">
                  <span className="user-password">Password: {user.password}</span>
                  <span className="user-balance">USD: {user.usd_balance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="transactions-section">
          <h2>📋 All Transactions (Exposed)</h2>
          <div className="transactions-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div className="tx-header">
                  <span className="tx-id">#{tx.id}</span>
                  <span className="tx-user">User: {tx.user_id}</span>
                  <span className="tx-date">{new Date(tx.timestamp).toLocaleString()}</span>
                </div>
                <div className="tx-details">
                  <span className="tx-amount">
                    {tx.amount} {tx.from_currency} → {tx.converted_amount.toFixed(4)} {tx.to_currency}
                  </span>
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
