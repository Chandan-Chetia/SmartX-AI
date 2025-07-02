// Migration script to add botResponseRaw column if it doesn't exist
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('chatHistory.db');

db.serialize(() => {
  db.get("PRAGMA table_info(chat_history)", (err, row) => {
    if (err) throw err;
    db.all("PRAGMA table_info(chat_history)", (err, columns) => {
      if (!columns.some(col => col.name === 'botResponseRaw')) {
        db.run("ALTER TABLE chat_history ADD COLUMN botResponseRaw TEXT", (err) => {
          if (err) throw err;
          console.log('Column botResponseRaw added.');
        });
      } else {
        console.log('Column botResponseRaw already exists.');
      }
    });
  });
});

db.close();
