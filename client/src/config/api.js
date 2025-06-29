// Configuração da API
const API_CONFIG = {
  // URL da API - Railway em produção, localhost em desenvolvimento
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://seu-backend.railway.app/api'
    : 'http://localhost:5001/api',
  
  // Timeout das requisições (10 segundos)
  TIMEOUT: 10000,
  
  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Configurações de retry
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export default API_CONFIG; 