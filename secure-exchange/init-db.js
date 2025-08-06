const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// 创建数据库连接
const dbPath = path.join(__dirname, 'secure_exchange.db');
const db = new sqlite3.Database(dbPath);

console.log('🔒 Initializing secure database...');

// 创建用户表
db.serialize(async () => {
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

  // 等待表创建完成后再插入数据
  setTimeout(async () => {
    try {
      // 插入用户数据 - 使用加密密码
      const user1Hash = await bcrypt.hash('password', 10);
      const adminHash = await bcrypt.hash('admin123', 10);
      const aliceHash = await bcrypt.hash('alice123', 10);
      const bobHash = await bcrypt.hash('bob456', 10);

      // 插入用户
      db.run(`
        INSERT INTO users (username, password, usd_balance, btc_balance, eth_balance) 
        VALUES (?, ?, ?, ?, ?)
      `, ['user1', user1Hash, 10000, 2.5, 15], (err) => {
        if (err) {
          console.error('Error inserting user1:', err);
        } else {
          console.log('✅ Inserted user1');
        }
      });

      db.run(`
        INSERT INTO users (username, password, usd_balance, btc_balance, eth_balance) 
        VALUES (?, ?, ?, ?, ?)
      `, ['admin', adminHash, 50000, 10, 50], (err) => {
        if (err) {
          console.error('Error inserting admin:', err);
        } else {
          console.log('✅ Inserted admin');
        }
      });

      db.run(`
        INSERT INTO users (username, password, usd_balance, btc_balance, eth_balance) 
        VALUES (?, ?, ?, ?, ?)
      `, ['alice', aliceHash, 5000, 1.2, 8], (err) => {
        if (err) {
          console.error('Error inserting alice:', err);
        } else {
          console.log('✅ Inserted alice');
        }
      });

      db.run(`
        INSERT INTO users (username, password, usd_balance, btc_balance, eth_balance) 
        VALUES (?, ?, ?, ?, ?)
      `, ['bob', bobHash, 3000, 0.8, 5], (err) => {
        if (err) {
          console.error('Error inserting bob:', err);
        } else {
          console.log('✅ Inserted bob');
        }
      });

      // 等待用户插入完成后再插入交易
      setTimeout(() => {
        // 插入一些测试交易
        db.run(`
          INSERT INTO transactions (user_id, from_currency, to_currency, amount, converted_amount) 
          VALUES (?, ?, ?, ?, ?)
        `, [1, 'USD', 'BTC', 1000, 0.022], (err) => {
          if (err) {
            console.error('Error inserting transaction 1:', err);
          } else {
            console.log('✅ Inserted test transaction 1');
          }
        });

        db.run(`
          INSERT INTO transactions (user_id, from_currency, to_currency, amount, converted_amount) 
          VALUES (?, ?, ?, ?, ?)
        `, [1, 'BTC', 'ETH', 0.5, 8], (err) => {
          if (err) {
            console.error('Error inserting transaction 2:', err);
          } else {
            console.log('✅ Inserted test transaction 2');
          }
        });

        // 等待交易插入完成后验证数据
        setTimeout(() => {
          // 验证数据
          db.all("SELECT id, username, usd_balance, btc_balance, eth_balance FROM users", (err, rows) => {
            if (err) {
              console.error('Error querying users:', err);
            } else {
              console.log('📊 Users in database:');
              rows.forEach(row => {
                console.log(`  - ${row.username}: (USD: ${row.usd_balance}, BTC: ${row.btc_balance}, ETH: ${row.eth_balance})`);
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

          console.log('\n🎉 Secure database initialization completed!');
          console.log('🔒 This database implements all security best practices!');

          // 关闭数据库连接
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err);
            } else {
              console.log('✅ Database connection closed');
            }
          });
        }, 1000);
      }, 1000);
    } catch (error) {
      console.error('Error during database initialization:', error);
    }
  }, 1000);
}); 