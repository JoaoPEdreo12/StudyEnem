const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { sendWelcomeEmail } = require('../utils/email');

const router = express.Router();

// Validação para registro
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Tipo de usuário inválido')
];

// Validação para login
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
];

// Registro de usuário
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { name, email, password, role = 'student' } = req.body;

    // Verificar se o email já existe
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Email já cadastrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Criptografar senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Inserir usuário
    const result = await query(
      `INSERT INTO users (name, email, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, role]
    );

    const user = result.rows[0];

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Enviar email de boas-vindas
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError);
    }

    // Criar perfil inicial do aluno se for estudante
    if (role === 'student') {
      await query(
        `INSERT INTO student_profiles (user_id, study_goal, daily_study_time, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [user.id, 'Preparação para ENEM', 120] // 2 horas por padrão
      );
    }

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, password } = req.body;

    // Buscar usuário
    const result = await query(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Conta desativada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Registrar login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token necessário',
        code: 'TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se o usuário ainda existe
    const result = await query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({
        error: 'Usuário não encontrado ou inativo',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    // Gerar novo token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Token renovado com sucesso',
      token: newToken
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Erro no refresh token:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Logout (opcional - para invalidar tokens no frontend)
router.post('/logout', (req, res) => {
  res.json({
    message: 'Logout realizado com sucesso'
  });
});

module.exports = router; 