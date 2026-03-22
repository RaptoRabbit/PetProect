const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database('./calculator.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expression TEXT NOT NULL,
      result REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// Calculator function (safe, no eval)
function calculate(n1, operator, n2) {
  const firstNum = parseFloat(n1);
  const secondNum = parseFloat(n2);
  if (operator === 'add') return firstNum + secondNum;
  if (operator === 'subtract') return firstNum - secondNum;
  if (operator === 'multiply') return firstNum * secondNum;
  if (operator === 'divide') return firstNum / secondNum;
  return 0;
}

// API Routes
app.post('/api/calculate', (req, res) => {
  const { firstValue, operator, secondValue } = req.body;
  if (!firstValue || !operator || !secondValue) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  const result = calculate(firstValue, operator, secondValue);
  const expression = `${firstValue} ${operator} ${secondValue}`;

  // Save to database
  db.run('INSERT INTO calculations (expression, result) VALUES (?, ?)', [expression, result], function(err) {
    if (err) {
      console.error('Error saving calculation:', err.message);
    }
  });

  res.json({ result });
});

app.get('/api/history', (req, res) => {
  db.all('SELECT * FROM calculations ORDER BY timestamp DESC LIMIT 10', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});