#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/local');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const scheduleRoutes = require('./routes/schedule');
const subjectRoutes = require('./routes/subjects');
const flashcardRoutes = require('./routes/flashcards');
const gamificationRoutes = require('./routes/gamification');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = 5001; // Forçar porta 5001

console.log('🚀 Iniciando servidor local...');
console.log(`📊 Ambiente: ${config.NODE_ENV}`);
console.log(`🔗 Porta: ${PORT}`);

// Configurações de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(morgan('dev')); // Log mais detalhado para desenvolvimento
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    message: 'Servidor local funcionando!'
  });
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando corretamente!',
    timestamp: new Date().toISOString()
  });
});

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/schedule', authenticateToken, scheduleRoutes);
app.use('/api/subjects', authenticateToken, subjectRoutes);
app.use('/api/flashcards', authenticateToken, flashcardRoutes);
app.use('/api/gamification', authenticateToken, gamificationRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

// Tratamento de rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl,
    message: 'Verifique se a URL está correta'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Teste: http://localhost:${PORT}/api/test`);
  console.log(`📱 Frontend: http://localhost:3000`);
  console.log('🎯 Pronto para desenvolvimento!');
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Erro não tratado:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Exceção não capturada:', err);
  process.exit(1);
}); 