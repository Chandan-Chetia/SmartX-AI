// SQLite database setup for chat history
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'chatHistory.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userMessage TEXT,
    botResponse TEXT,
    timestamp TEXT
  )`);
});

module.exports = db;
