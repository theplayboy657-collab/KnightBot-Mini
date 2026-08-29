const express = require('express');
const helmet = require('helmet');
const pairRouter = require('./routes/pair');
const config = require('./config');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(helmet());
app.use(express.json());
app.use(express.static('public'));

// mount pair routes if available
app.use('/', pairRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'Bot is running', bot: config.botName, owner: config.ownerName?.[0] || 'owner' });
});

app.get('/', (req, res) => {
  res.redirect('/health');
});

app.listen(PORT, () => {
  console.log(`🌐 HTTP Server listening on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});
