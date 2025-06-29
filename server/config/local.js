// Configuração para desenvolvimento local
module.exports = {
  // Configurações do Servidor
  PORT: 5001,
  NODE_ENV: 'development',
  
  // Configurações do Banco de Dados (Substitua pelos seus dados do Supabase)
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:[SEU_PASSWORD]@db.[SEU_PROJECT_ID].supabase.co:5432/postgres',
  
  // JWT Secret (Gere uma chave segura para desenvolvimento)
  JWT_SECRET: process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_para_desenvolvimento_local_123456789',
  
  // Configurações de Email (Opcional para desenvolvimento)
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER || 'seu_email@gmail.com',
  EMAIL_PASS: process.env.EMAIL_PASS || 'sua_senha_de_app',
  
  // Configurações de CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Configurações de Rate Limiting
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutos
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // Configurações de Log
  LOG_LEVEL: 'debug',
  
  // Configurações de Segurança
  BCRYPT_ROUNDS: 10,
  JWT_EXPIRES_IN: '24h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
}; 