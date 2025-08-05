import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5003/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [prices, setPrices] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [tradeForm, setTradeForm] = useState({ fromCurrency: 'USD', toCurrency: 'BTC', amount: '' });

  useEffect(() => {
    if (token) {
      fetchUserData();
      fetchPrices();
      fetchTransactions();
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE}/user`, {
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

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_BASE}/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
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

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Login failed');
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

      if (response.ok) {
        const data = await response.json();
        setUser({ ...user, balance: data.newBalance });
        setTransactions([data.transaction, ...transactions]);
        setTradeForm({ fromCurrency: 'USD', toCurrency: 'BTC', amount: '' });
        alert('Trade successful!');
      } else {
        const error = await response.json();
        alert(error.error || 'Trade failed');
      }
    } catch (error) {
      console.error('Trade error:', error);
      alert('Trade failed');
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
              <strong>Demo Account:</strong><br />
              Username: user1<br />
              Password: password
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="header">
        <h1>🔒 Secure Crypto Exchange</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <div className="main-content">
        <div className="balance-section">
          <h2>💰 Balance</h2>
          <div className="balance-grid">
            {user && Object.entries(user.balance).map(([currency, amount]) => (
              <div key={currency} className="balance-item">
                <span className="currency">{currency}</span>
                <span className="amount">{amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
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
          <h2>💱 Trade</h2>
          <form onSubmit={handleTrade} className="trade-form">
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
            <button type="submit">Execute Trade</button>
          </form>
        </div>

        <div className="transactions-section">
          <h2>📋 Transaction History</h2>
          <div className="transactions-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div className="tx-header">
                  <span className="tx-id">#{tx.id}</span>
                  <span className="tx-date">{new Date(tx.timestamp).toLocaleString()}</span>
                </div>
                <div className="tx-details">
                  <span className="tx-amount">
                    {tx.amount} {tx.fromCurrency} → {tx.convertedAmount.toFixed(4)} {tx.toCurrency}
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
