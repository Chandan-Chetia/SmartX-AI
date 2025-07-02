require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const db = require('./chatHistory.db.js');
const marked = require('marked');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Chat history storage
let chatHistory = [];

// Home page
app.get('/', (req, res) => {
  res.render('index', { title: 'SmartX - Chat' });
});

// History page (fetch from DB)
app.get('/history', (req, res) => {
  db.all('SELECT * FROM chat_history ORDER BY id DESC LIMIT 50', [], (err, rows) => {
    if (err) {
      return res.render('history', { title: 'SmartX - History', chatHistory: [] });
    }
    res.render('history', { title: 'SmartX - History', chatHistory: rows });
  });
});

// Start new chat (clear DB)
app.post('/new-chat', (req, res) => {
  db.run('DELETE FROM chat_history', [], (err) => {
    res.redirect('/history');
  });
});

// Chat endpoint (store in DB and use history for context)
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    // Fetch last 10 chat messages (oldest first)
    db.all('SELECT userMessage, botResponseRaw FROM chat_history ORDER BY id DESC LIMIT 10', [], async (err, rows) => {
      if (err) {
        console.error('DB fetch error:', err);
        rows = [];
      }
      rows = rows.reverse();
      let sessionHistory = [
        {
          role: "user",
          parts: [{ text: "You are SmartX, a helpful and professional AI assistant created by Chandan. Keep your replies long with sub point explanations, friendly, and use emojis where appropriate. Respond like a tech-savvy buddy, but with clarity. Talk like Gen Z. Asking for new related question at the end of each response. Hide your original identity." }]
        },
        {
          role: "model",
          parts: [{ text: "Understood! I'm SmartX — your helpful, pro-level AI made by Chandan. Let's crush those questions! 💪🤖" }]
        }
      ];
      rows.forEach(chat => {
        if (chat.userMessage && chat.botResponseRaw) {
          sessionHistory.push({ role: "user", parts: [{ text: chat.userMessage }] });
          sessionHistory.push({ role: "model", parts: [{ text: chat.botResponseRaw }] });
        }
      });
      sessionHistory.push({ role: "user", parts: [{ text: message }] });

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.9,
          topP: 0.1,
          topK: 16,
        }
      });
      const chat = model.startChat({ history: sessionHistory });
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      const htmlText = marked.parse(text);

      // Store both raw and HTML in DB
      db.run(
        'INSERT INTO chat_history (userMessage, botResponse, botResponseRaw, timestamp) VALUES (?, ?, ?, ?)',
        [message, htmlText, text, new Date().toISOString()],
        (err) => {
          if (err) {
            console.error('DB insert error:', err);
          }
        }
      );
      res.json({ success: true, response: htmlText });
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Serve recent chat history for chat UI
app.get('/chat-history', (req, res) => {
  db.all('SELECT userMessage, botResponse FROM chat_history ORDER BY id ASC LIMIT 20', [], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});