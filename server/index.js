const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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
const PORT = process.env.PORT || 5000;

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
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requests por IP
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://estudosenem.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Rota para arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Tratamento de rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Exceção não capturada:', err);
  process.exit(1);
}); 