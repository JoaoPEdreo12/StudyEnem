const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso necessário',
        code: 'TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se o usuário ainda existe no banco
    const userResult = await query(
      'SELECT id, email, name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Conta desativada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Autenticação necessária',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        code: 'ACCESS_DENIED'
      });
    }

    next();
  };
};

const requireAdmin = requireRole(['admin', 'teacher']);
const requireTeacher = requireRole(['admin', 'teacher']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireTeacher
}; 