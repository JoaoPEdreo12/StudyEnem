const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Validação para atualização de perfil
const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email inválido'),
  body('study_goal').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Objetivo deve ter entre 5 e 200 caracteres'),
  body('daily_study_time').optional().isInt({ min: 30, max: 480 }).withMessage('Tempo de estudo deve ser entre 30 e 480 minutos')
];

// Obter perfil do usuário
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at, u.last_login,
              sp.study_goal, sp.daily_study_time, sp.target_exam_date,
              sp.preferred_study_times, sp.notification_preferences
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        last_login: user.last_login,
        profile: user.role === 'student' ? {
          study_goal: user.study_goal,
          daily_study_time: user.daily_study_time,
          target_exam_date: user.target_exam_date,
          preferred_study_times: user.preferred_study_times,
          notification_preferences: user.notification_preferences
        } : null
      }
    });

  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Atualizar perfil do usuário
router.put('/profile', updateProfileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const userId = req.user.id;
    const { name, email, study_goal, daily_study_time, target_exam_date, preferred_study_times, notification_preferences } = req.body;

    // Verificar se o email já existe (se estiver sendo alterado)
    if (email) {
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'Email já cadastrado',
          code: 'EMAIL_EXISTS'
        });
      }
    }

    // Atualizar dados básicos do usuário
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (name) {
      updateFields.push(`name = $${paramCount++}`);
      updateValues.push(name);
    }

    if (email) {
      updateFields.push(`email = $${paramCount++}`);
      updateValues.push(email);
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(userId);

      await query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        updateValues
      );
    }

    // Atualizar perfil do estudante se aplicável
    if (req.user.role === 'student') {
      const profileUpdateFields = [];
      const profileUpdateValues = [];
      let profileParamCount = 1;

      if (study_goal !== undefined) {
        profileUpdateFields.push(`study_goal = $${profileParamCount++}`);
        profileUpdateValues.push(study_goal);
      }

      if (daily_study_time !== undefined) {
        profileUpdateFields.push(`daily_study_time = $${profileParamCount++}`);
        profileUpdateValues.push(daily_study_time);
      }

      if (target_exam_date !== undefined) {
        profileUpdateFields.push(`target_exam_date = $${profileParamCount++}`);
        profileUpdateValues.push(target_exam_date);
      }

      if (preferred_study_times !== undefined) {
        profileUpdateFields.push(`preferred_study_times = $${profileParamCount++}`);
        profileUpdateValues.push(JSON.stringify(preferred_study_times));
      }

      if (notification_preferences !== undefined) {
        profileUpdateFields.push(`notification_preferences = $${profileParamCount++}`);
        profileUpdateValues.push(JSON.stringify(notification_preferences));
      }

      if (profileUpdateFields.length > 0) {
        profileUpdateFields.push(`updated_at = NOW()`);
        profileUpdateValues.push(userId);

        await query(
          `UPDATE student_profiles SET ${profileUpdateFields.join(', ')} WHERE user_id = $${profileParamCount}`,
          profileUpdateValues
        );
      }
    }

    res.json({
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Dashboard do aluno
router.get('/dashboard', requireRole(['student']), async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Estatísticas do dia
    const todayStats = await query(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as study_time
       FROM schedule 
       WHERE user_id = $1 AND DATE(scheduled_date) = $2`,
      [userId, today]
    );

    // Estatísticas da semana
    const weekStats = await query(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as study_time
       FROM schedule 
       WHERE user_id = $1 AND scheduled_date >= $2`,
      [userId, weekStartStr]
    );

    // Tarefas de hoje
    const todayTasks = await query(
      `SELECT s.*, sub.name as subject_name, sub.color as subject_color
       FROM schedule s
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.user_id = $1 AND DATE(s.scheduled_date) = $2
       ORDER BY s.scheduled_time ASC`,
      [userId, today]
    );

    // Próximas tarefas
    const upcomingTasks = await query(
      `SELECT s.*, sub.name as subject_name, sub.color as subject_color
       FROM schedule s
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.user_id = $1 AND s.scheduled_date > $2
       ORDER BY s.scheduled_date ASC, s.scheduled_time ASC
       LIMIT 5`,
      [userId, today]
    );

    // Progresso por matéria (últimos 7 dias)
    const subjectProgress = await query(
      `SELECT 
        sub.name as subject_name,
        sub.color as subject_color,
        COUNT(s.id) as total_tasks,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_tasks,
        SUM(CASE WHEN s.status = 'completed' THEN s.duration ELSE 0 END) as study_time
       FROM subjects sub
       LEFT JOIN schedule s ON sub.id = s.subject_id 
         AND s.user_id = $1 
         AND s.scheduled_date >= $2
       WHERE sub.user_id = $1
       GROUP BY sub.id, sub.name, sub.color
       ORDER BY study_time DESC`,
      [userId, weekStartStr]
    );

    // Pontos e conquistas
    const gamificationStats = await query(
      `SELECT 
        COALESCE(SUM(points_earned), 0) as total_points,
        COALESCE(COUNT(CASE WHEN achievement_type IS NOT NULL THEN 1 END), 0) as achievements_count
       FROM gamification_log 
       WHERE user_id = $1`,
      [userId]
    );

    // Nível atual
    const currentLevel = Math.floor(gamificationStats.rows[0].total_points / 100) + 1;

    res.json({
      dashboard: {
        today: {
          total_tasks: parseInt(todayStats.rows[0].total_tasks) || 0,
          completed_tasks: parseInt(todayStats.rows[0].completed_tasks) || 0,
          study_time: parseInt(todayStats.rows[0].study_time) || 0,
          completion_rate: todayStats.rows[0].total_tasks > 0 
            ? Math.round((todayStats.rows[0].completed_tasks / todayStats.rows[0].total_tasks) * 100)
            : 0
        },
        week: {
          total_tasks: parseInt(weekStats.rows[0].total_tasks) || 0,
          completed_tasks: parseInt(weekStats.rows[0].completed_tasks) || 0,
          study_time: parseInt(weekStats.rows[0].study_time) || 0,
          completion_rate: weekStats.rows[0].total_tasks > 0 
            ? Math.round((weekStats.rows[0].completed_tasks / weekStats.rows[0].total_tasks) * 100)
            : 0
        },
        today_tasks: todayTasks.rows,
        upcoming_tasks: upcomingTasks.rows,
        subject_progress: subjectProgress.rows,
        gamification: {
          total_points: parseInt(gamificationStats.rows[0].total_points) || 0,
          achievements_count: parseInt(gamificationStats.rows[0].achievements_count) || 0,
          current_level: currentLevel,
          points_to_next_level: 100 - (gamificationStats.rows[0].total_points % 100)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter dashboard:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter estatísticas detalhadas
router.get('/stats', requireRole(['student']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'week' } = req.query;

    let startDate;
    const endDate = new Date().toISOString().split('T')[0];

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
    }

    const startDateStr = startDate.toISOString().split('T')[0];

    // Estatísticas gerais
    const generalStats = await query(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_tasks,
        SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as total_study_time,
        AVG(CASE WHEN status = 'completed' THEN duration ELSE NULL END) as avg_session_time
       FROM schedule 
       WHERE user_id = $1 AND scheduled_date BETWEEN $2 AND $3`,
      [userId, startDateStr, endDate]
    );

    // Estatísticas por dia
    const dailyStats = await query(
      `SELECT 
        DATE(scheduled_date) as date,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as study_time
       FROM schedule 
       WHERE user_id = $1 AND scheduled_date BETWEEN $2 AND $3
       GROUP BY DATE(scheduled_date)
       ORDER BY date`,
      [userId, startDateStr, endDate]
    );

    // Estatísticas por matéria
    const subjectStats = await query(
      `SELECT 
        sub.name as subject_name,
        sub.color as subject_color,
        COUNT(s.id) as total_tasks,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_tasks,
        SUM(CASE WHEN s.status = 'completed' THEN s.duration ELSE 0 END) as study_time,
        ROUND(AVG(CASE WHEN s.status = 'completed' THEN s.duration ELSE NULL END), 2) as avg_session_time
       FROM subjects sub
       LEFT JOIN schedule s ON sub.id = s.subject_id 
         AND s.user_id = $1 
         AND s.scheduled_date BETWEEN $2 AND $3
       WHERE sub.user_id = $1
       GROUP BY sub.id, sub.name, sub.color
       ORDER BY study_time DESC`,
      [userId, startDateStr, endDate]
    );

    res.json({
      period,
      start_date: startDateStr,
      end_date: endDate,
      general_stats: generalStats.rows[0],
      daily_stats: dailyStats.rows,
      subject_stats: subjectStats.rows
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router; 