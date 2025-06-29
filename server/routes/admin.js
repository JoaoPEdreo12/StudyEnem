const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware para verificar se é admin ou professor
router.use(requireRole(['admin', 'teacher']));

// Obter dashboard administrativo
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Estatísticas gerais
    const generalStats = await query(
      `SELECT 
        COUNT(*) as total_students,
        COUNT(CASE WHEN u.last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as active_students,
        COUNT(CASE WHEN u.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_students
       FROM users u
       WHERE u.role = 'student'`,
      []
    );

    // Estatísticas de atividades
    const activityStats = await query(
      `SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_activities,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_activities,
        SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as total_study_time
       FROM schedule s
       JOIN users u ON s.user_id = u.id
       WHERE u.role = 'student'`,
      []
    );

    // Estatísticas de gamificação
    const gamificationStats = await query(
      `SELECT 
        COUNT(DISTINCT gl.user_id) as active_users,
        SUM(gl.points_earned) as total_points,
        COUNT(CASE WHEN gl.achievement_type IS NOT NULL THEN 1 END) as total_achievements
       FROM gamification_log gl
       JOIN users u ON gl.user_id = u.id
       WHERE u.role = 'student'`,
      []
    );

    // Top estudantes por pontos
    const topStudents = await query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        COALESCE(SUM(gl.points_earned), 0) as total_points,
        COUNT(gl.id) as total_activities
       FROM users u
       LEFT JOIN gamification_log gl ON u.id = gl.user_id
       WHERE u.role = 'student'
       GROUP BY u.id, u.name, u.email
       ORDER BY total_points DESC
       LIMIT 10`,
      []
    );

    // Atividades recentes
    const recentActivities = await query(
      `SELECT 
        s.*,
        u.name as student_name,
        sub.name as subject_name
       FROM schedule s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       WHERE u.role = 'student'
       ORDER BY s.created_at DESC
       LIMIT 20`,
      []
    );

    res.json({
      dashboard: {
        general_stats: generalStats.rows[0],
        activity_stats: activityStats.rows[0],
        gamification_stats: gamificationStats.rows[0],
        top_students: topStudents.rows,
        recent_activities: recentActivities.rows
      }
    });

  } catch (error) {
    console.error('Erro ao obter dashboard administrativo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter lista de estudantes
router.get('/students', async (req, res) => {
  try {
    const { limit = 50, offset = 0, search, status } = req.query;

    let whereConditions = ['u.role = $1'];
    let queryParams = ['student'];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`(u.name ILIKE $${++paramCount} OR u.email ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (status === 'active') {
      whereConditions.push(`u.last_login >= NOW() - INTERVAL '30 days'`);
    } else if (status === 'inactive') {
      whereConditions.push(`u.last_login < NOW() - INTERVAL '30 days'`);
    }

    const result = await query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        u.last_login,
        sp.study_goal,
        sp.daily_study_time,
        COALESCE(SUM(gl.points_earned), 0) as total_points,
        COUNT(s.id) as total_activities,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_activities
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       LEFT JOIN gamification_log gl ON u.id = gl.user_id
       LEFT JOIN schedule s ON u.id = s.user_id
       WHERE ${whereConditions.join(' AND ')}
       GROUP BY u.id, u.name, u.email, u.created_at, u.last_login, sp.study_goal, sp.daily_study_time
       ORDER BY u.created_at DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // Contar total de estudantes
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM users u
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    res.json({
      students: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Erro ao obter lista de estudantes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter perfil detalhado de um estudante
router.get('/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;

    // Dados básicos do estudante
    const studentResult = await query(
      `SELECT 
        u.*,
        sp.study_goal,
        sp.daily_study_time,
        sp.target_exam_date,
        sp.preferred_study_times,
        sp.notification_preferences
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = $1 AND u.role = 'student'`,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Estudante não encontrado',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    const student = studentResult.rows[0];

    // Estatísticas de atividades
    const activityStats = await query(
      `SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_activities,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_activities,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_activities,
        SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as total_study_time,
        AVG(CASE WHEN status = 'completed' THEN duration ELSE NULL END) as avg_session_time
       FROM schedule 
       WHERE user_id = $1`,
      [studentId]
    );

    // Estatísticas de gamificação
    const gamificationStats = await query(
      `SELECT 
        COALESCE(SUM(points_earned), 0) as total_points,
        COUNT(*) as total_activities,
        COUNT(CASE WHEN achievement_type IS NOT NULL THEN 1 END) as achievements_count
       FROM gamification_log 
       WHERE user_id = $1`,
      [studentId]
    );

    // Matérias do estudante
    const subjectsResult = await query(
      `SELECT 
        s.*,
        COUNT(sch.id) as total_activities,
        COUNT(CASE WHEN sch.status = 'completed' THEN 1 END) as completed_activities,
        SUM(CASE WHEN sch.status = 'completed' THEN sch.duration ELSE 0 END) as study_time
       FROM subjects s
       LEFT JOIN schedule sch ON s.id = sch.subject_id
       WHERE s.user_id = $1
       GROUP BY s.id
       ORDER BY s.priority DESC`,
      [studentId]
    );

    // Atividades recentes
    const recentActivities = await query(
      `SELECT s.*, sub.name as subject_name, sub.color as subject_color
       FROM schedule s
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 20`,
      [studentId]
    );

    // Progresso semanal (últimas 8 semanas)
    const weeklyProgress = await query(
      `SELECT 
        DATE_TRUNC('week', scheduled_date) as week_start,
        COUNT(*) as total_activities,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_activities,
        SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as study_time
       FROM schedule 
       WHERE user_id = $1
       GROUP BY DATE_TRUNC('week', scheduled_date)
       ORDER BY week_start DESC
       LIMIT 8`,
      [studentId]
    );

    res.json({
      student: {
        ...student,
        activity_stats: activityStats.rows[0],
        gamification_stats: gamificationStats.rows[0],
        subjects: subjectsResult.rows,
        recent_activities: recentActivities.rows,
        weekly_progress: weeklyProgress.rows
      }
    });

  } catch (error) {
    console.error('Erro ao obter perfil do estudante:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Criar modelo de cronograma
router.post('/schedule-templates', async (req, res) => {
  try {
    const { name, description, subjects, schedule_data, is_public = false } = req.body;

    if (!name || !subjects || !schedule_data) {
      return res.status(400).json({
        error: 'Nome, matérias e dados do cronograma são obrigatórios',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const result = await query(
      `INSERT INTO schedule_templates (name, description, subjects, schedule_data, is_public, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [name, description, JSON.stringify(subjects), JSON.stringify(schedule_data), is_public, req.user.id]
    );

    res.status(201).json({
      message: 'Modelo de cronograma criado com sucesso',
      template: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar modelo de cronograma:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter modelos de cronograma
router.get('/schedule-templates', async (req, res) => {
  try {
    const { limit = 20, offset = 0, is_public } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (is_public !== undefined) {
      whereConditions.push(`is_public = $${++paramCount}`);
      queryParams.push(is_public === 'true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT st.*, u.name as created_by_name
       FROM schedule_templates st
       LEFT JOIN users u ON st.created_by = u.id
       ${whereClause}
       ORDER BY st.created_at DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    res.json({
      templates: result.rows,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Erro ao obter modelos de cronograma:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Criar desafio compartilhado
router.post('/challenges', async (req, res) => {
  try {
    const { title, description, type, requirements, rewards, start_date, end_date, target_students } = req.body;

    if (!title || !description || !type || !requirements || !start_date || !end_date) {
      return res.status(400).json({
        error: 'Todos os campos obrigatórios devem ser preenchidos',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const result = await query(
      `INSERT INTO challenges (title, description, type, requirements, rewards, start_date, end_date, target_students, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [title, description, type, JSON.stringify(requirements), JSON.stringify(rewards), start_date, end_date, target_students, req.user.id]
    );

    res.status(201).json({
      message: 'Desafio criado com sucesso',
      challenge: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar desafio:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter desafios
router.get('/challenges', async (req, res) => {
  try {
    const { limit = 20, offset = 0, status } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      whereConditions.push(`status = $${++paramCount}`);
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT c.*, u.name as created_by_name,
              COUNT(cp.user_id) as participants_count
       FROM challenges c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
       ${whereClause}
       GROUP BY c.id, u.name
       ORDER BY c.created_at DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    res.json({
      challenges: result.rows,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Erro ao obter desafios:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter relatórios gerais
router.get('/reports', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

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
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const startDateStr = startDate.toISOString().split('T')[0];

    // Estatísticas gerais
    const generalStats = await query(
      `SELECT 
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT CASE WHEN u.last_login >= NOW() - INTERVAL '7 days' THEN u.id END) as active_students,
        COUNT(DISTINCT CASE WHEN u.created_at >= $1 THEN u.id END) as new_students
       FROM users u
       WHERE u.role = 'student'`,
      [startDateStr]
    );

    // Estatísticas de atividades
    const activityStats = await query(
      `SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_activities,
        COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_activities,
        SUM(CASE WHEN s.status = 'completed' THEN s.duration ELSE 0 END) as total_study_time,
        AVG(CASE WHEN s.status = 'completed' THEN s.duration ELSE NULL END) as avg_session_time
       FROM schedule s
       JOIN users u ON s.user_id = u.id
       WHERE u.role = 'student' AND s.scheduled_date >= $1`,
      [startDateStr]
    );

    // Estatísticas de gamificação
    const gamificationStats = await query(
      `SELECT 
        COUNT(DISTINCT gl.user_id) as active_users,
        SUM(gl.points_earned) as total_points,
        COUNT(CASE WHEN gl.achievement_type IS NOT NULL THEN 1 END) as total_achievements,
        ROUND(AVG(gl.points_earned), 2) as avg_points_per_user
       FROM gamification_log gl
       JOIN users u ON gl.user_id = u.id
       WHERE u.role = 'student' AND gl.created_at >= $1`,
      [startDateStr]
    );

    // Top matérias mais estudadas
    const topSubjects = await query(
      `SELECT 
        sub.name as subject_name,
        COUNT(s.id) as total_activities,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_activities,
        SUM(CASE WHEN s.status = 'completed' THEN s.duration ELSE 0 END) as study_time
       FROM subjects sub
       LEFT JOIN schedule s ON sub.id = s.subject_id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE u.role = 'student' AND (s.scheduled_date >= $1 OR s.scheduled_date IS NULL)
       GROUP BY sub.id, sub.name
       ORDER BY study_time DESC
       LIMIT 10`,
      [startDateStr]
    );

    // Progresso diário
    const dailyProgress = await query(
      `SELECT 
        DATE(s.scheduled_date) as date,
        COUNT(*) as total_activities,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_activities,
        SUM(CASE WHEN s.status = 'completed' THEN s.duration ELSE 0 END) as study_time
       FROM schedule s
       JOIN users u ON s.user_id = u.id
       WHERE u.role = 'student' AND s.scheduled_date >= $1
       GROUP BY DATE(s.scheduled_date)
       ORDER BY date`,
      [startDateStr]
    );

    res.json({
      period,
      start_date: startDateStr,
      end_date: endDate,
      general_stats: generalStats.rows[0],
      activity_stats: activityStats.rows[0],
      gamification_stats: gamificationStats.rows[0],
      top_subjects: topSubjects.rows,
      daily_progress: dailyProgress.rows
    });

  } catch (error) {
    console.error('Erro ao obter relatórios:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Enviar notificação em massa
router.post('/bulk-notifications', async (req, res) => {
  try {
    const { title, message, target_students, type = 'general' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: 'Título e mensagem são obrigatórios',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    let whereConditions = ['role = $1'];
    let queryParams = ['student'];
    let paramCount = 0;

    if (target_students && target_students.length > 0) {
      whereConditions.push(`id = ANY($${++paramCount})`);
      queryParams.push(target_students);
    }

    // Obter estudantes alvo
    const studentsResult = await query(
      `SELECT id FROM users WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    if (studentsResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Nenhum estudante encontrado',
        code: 'NO_STUDENTS_FOUND'
      });
    }

    // Criar notificações
    const notifications = [];
    for (const student of studentsResult.rows) {
      const notificationResult = await query(
        `INSERT INTO notifications (user_id, title, message, type, priority, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'unread', NOW(), NOW())
         RETURNING id`,
        [student.id, title, message, type, 'normal']
      );
      notifications.push(notificationResult.rows[0].id);
    }

    res.json({
      message: 'Notificações enviadas com sucesso',
      sent_count: notifications.length,
      target_students: studentsResult.rows.length
    });

  } catch (error) {
    console.error('Erro ao enviar notificações em massa:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter estatísticas de uso da plataforma
router.get('/platform-stats', async (req, res) => {
  try {
    // Estatísticas de usuários
    const userStats = await query(
      `SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'student' THEN 1 END) as total_students,
        COUNT(CASE WHEN role = 'teacher' THEN 1 END) as total_teachers,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month,
        COUNT(CASE WHEN last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as active_users_week
       FROM users`,
      []
    );

    // Estatísticas de atividades
    const activityStats = await query(
      `SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_activities,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_activities,
        SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as total_study_time_hours,
        AVG(CASE WHEN status = 'completed' THEN duration ELSE NULL END) as avg_session_minutes
       FROM schedule`,
      []
    );

    // Estatísticas de gamificação
    const gamificationStats = await query(
      `SELECT 
        COUNT(DISTINCT user_id) as users_with_points,
        SUM(points_earned) as total_points_awarded,
        COUNT(CASE WHEN achievement_type IS NOT NULL THEN 1 END) as total_achievements,
        ROUND(AVG(points_earned), 2) as avg_points_per_activity
       FROM gamification_log`,
      []
    );

    // Estatísticas de flashcards
    const flashcardStats = await query(
      `SELECT 
        COUNT(*) as total_flashcards,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_flashcards,
        SUM(review_count) as total_reviews,
        ROUND(AVG(review_count), 2) as avg_reviews_per_card
       FROM flashcards`,
      []
    );

    // Estatísticas de matérias
    const subjectStats = await query(
      `SELECT 
        COUNT(*) as total_subjects,
        COUNT(DISTINCT user_id) as users_with_subjects,
        ROUND(AVG(priority), 2) as avg_priority
       FROM subjects`,
      []
    );

    res.json({
      user_stats: userStats.rows[0],
      activity_stats: activityStats.rows[0],
      gamification_stats: gamificationStats.rows[0],
      flashcard_stats: flashcardStats.rows[0],
      subject_stats: subjectStats.rows[0]
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas da plataforma:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router; 