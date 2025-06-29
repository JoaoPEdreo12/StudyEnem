const errorHandler = (err, req, res, next) => {
  console.error('Erro capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Erros de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Erros de banco de dados
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      error: 'Dados já existem',
      details: 'Um registro com esses dados já existe',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: 'Referência inválida',
      details: 'Dados referenciados não existem',
      code: 'FOREIGN_KEY_ERROR'
    });
  }

  // Erros de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Erro padrão
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  errorHandler
}; 