const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.join(__dirname, 'insecure_exchange.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Initializing database...');

// 创建用户表
db.serialize(() => {
  // 删除现有表（如果存在）
  db.run("DROP TABLE IF EXISTS users", (err) => {
    if (err) {
      console.error('Error dropping users table:', err);
    } else {
      console.log('✅ Dropped existing users table');
    }
  });

  db.run("DROP TABLE IF EXISTS transactions", (err) => {
    if (err) {
      console.error('Error dropping transactions table:', err);
    } else {
      console.log('✅ Dropped existing transactions table');
    }
  });

  // 创建用户表
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      usd_balance REAL DEFAULT 0,
      btc_balance REAL DEFAULT 0,
      eth_balance REAL DEFAULT 0
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('✅ Created users table');
    }
  });

  // 创建交易表
  db.run(`
    CREATE TABLE transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      from_currency TEXT NOT NULL,
      to_currency TEXT NOT NULL,
      amount REAL NOT NULL,
      converted_amount REAL NOT NULL,
      note TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating transactions table:', err);
    } else {
      console.log('✅ Created transactions table');
    }
  });

  // 插入测试数据
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, usd_balance, btc_balance, eth_balance) 
    VALUES (?, ?, ?, ?, ?)
  `);

  // 插入用户数据
  insertUser.run('user1', 'password', 10000, 2.5, 15, (err) => {
    if (err) {
      console.error('Error inserting user1:', err);
    } else {
      console.log('✅ Inserted user1');
    }
  });

  insertUser.run('admin', 'admin123', 50000, 10, 50, (err) => {
    if (err) {
      console.error('Error inserting admin:', err);
    } else {
      console.log('✅ Inserted admin');
    }
  });

  insertUser.run('alice', 'alice123', 5000, 1.2, 8, (err) => {
    if (err) {
      console.error('Error inserting alice:', err);
    } else {
      console.log('✅ Inserted alice');
    }
  });

  insertUser.run('bob', 'bob456', 3000, 0.8, 5, (err) => {
    if (err) {
      console.error('Error inserting bob:', err);
    } else {
      console.log('✅ Inserted bob');
    }
  });

  insertUser.finalize((err) => {
    if (err) {
      console.error('Error finalizing user insertions:', err);
    } else {
      console.log('✅ All users inserted successfully');
    }
  });

  // 插入一些测试交易
  const insertTransaction = db.prepare(`
    INSERT INTO transactions (user_id, from_currency, to_currency, amount, converted_amount) 
    VALUES (?, ?, ?, ?, ?)
  `);

  insertTransaction.run(1, 'USD', 'BTC', 1000, 0.022, (err) => {
    if (err) {
      console.error('Error inserting transaction 1:', err);
    } else {
      console.log('✅ Inserted test transaction 1');
    }
  });

  insertTransaction.run(1, 'BTC', 'ETH', 0.5, 8, (err) => {
    if (err) {
      console.error('Error inserting transaction 2:', err);
    } else {
      console.log('✅ Inserted test transaction 2');
    }
  });

  insertTransaction.finalize((err) => {
    if (err) {
      console.error('Error finalizing transaction insertions:', err);
    } else {
      console.log('✅ All transactions inserted successfully');
    }
  });

  // 验证数据
  db.all("SELECT * FROM users", (err, rows) => {
    if (err) {
      console.error('Error querying users:', err);
    } else {
      console.log('📊 Users in database:');
      rows.forEach(row => {
        console.log(`  - ${row.username}: ${row.password} (USD: ${row.usd_balance}, BTC: ${row.btc_balance}, ETH: ${row.eth_balance})`);
      });
    }
  });

  db.all("SELECT * FROM transactions", (err, rows) => {
    if (err) {
      console.error('Error querying transactions:', err);
    } else {
      console.log('📊 Transactions in database:');
      rows.forEach(row => {
        console.log(`  - User ${row.user_id}: ${row.amount} ${row.from_currency} → ${row.converted_amount} ${row.to_currency}`);
      });
    }
  });

  console.log('\n🎉 Database initialization completed!');
  console.log('⚠️  This database contains intentionally vulnerable queries for educational purposes!');

  // 关闭数据库连接
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
  });
}); 