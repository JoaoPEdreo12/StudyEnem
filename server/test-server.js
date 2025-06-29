const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware básico
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando!'
  });
});

// Rota de teste de banco
app.get('/api/test-db', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const result = await query('SELECT NOW() as current_time');
    res.json({ 
      status: 'OK',
      database: 'Conectado',
      time: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Test DB: http://localhost:${PORT}/api/test-db`);
}); 