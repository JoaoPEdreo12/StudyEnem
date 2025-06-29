const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

const router = express.Router();

// Validação para criação/atualização de matérias
const subjectValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Cor deve estar no formato hexadecimal'),
  body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Prioridade deve ser entre 1 e 5'),
  body('is_active').optional().isBoolean().withMessage('Status deve ser true ou false')
];

// Obter todas as matérias do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { is_active } = req.query;

    let whereConditions = ['user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (is_active !== undefined) {
      whereConditions.push(`is_active = $${++paramCount}`);
      queryParams.push(is_active === 'true');
    }

    const result = await query(
      `SELECT s.*, 
              COUNT(sch.id) as total_activities,
              COUNT(CASE WHEN sch.status = 'completed' THEN 1 END) as completed_activities,
              SUM(CASE WHEN sch.status = 'completed' THEN sch.duration ELSE 0 END) as total_study_time
       FROM subjects s
       LEFT JOIN schedule sch ON s.id = sch.subject_id
       WHERE ${whereConditions.join(' AND ')}
       GROUP BY s.id
       ORDER BY s.priority DESC, s.name ASC`,
      queryParams
    );

    res.json({
      subjects: result.rows
    });

  } catch (error) {
    console.error('Erro ao obter matérias:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter matéria específica
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;

    const result = await query(
      `SELECT s.*, 
              COUNT(sch.id) as total_activities,
              COUNT(CASE WHEN sch.status = 'completed' THEN 1 END) as completed_activities,
              SUM(CASE WHEN sch.status = 'completed' THEN sch.duration ELSE 0 END) as total_study_time,
              AVG(CASE WHEN sch.status = 'completed' THEN sch.duration ELSE NULL END) as avg_session_time
       FROM subjects s
       LEFT JOIN schedule sch ON s.id = sch.subject_id
       WHERE s.id = $1 AND s.user_id = $2
       GROUP BY s.id`,
      [subjectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Matéria não encontrada',
        code: 'SUBJECT_NOT_FOUND'
      });
    }

    // Obter atividades recentes da matéria
    const recentActivities = await query(
      `SELECT sch.*, s.name as subject_name, s.color as subject_color
       FROM schedule sch
       LEFT JOIN subjects s ON sch.subject_id = s.id
       WHERE sch.subject_id = $1 AND sch.user_id = $2
       ORDER BY sch.scheduled_date DESC, sch.scheduled_time DESC
       LIMIT 10`,
      [subjectId, userId]
    );

    // Obter estatísticas por tipo de atividade
    const activityStats = await query(
      `SELECT sch.type,
              COUNT(*) as total,
              COUNT(CASE WHEN sch.status = 'completed' THEN 1 END) as completed,
              SUM(CASE WHEN sch.status = 'completed' THEN sch.duration ELSE 0 END) as total_time
       FROM schedule sch
       WHERE sch.subject_id = $1 AND sch.user_id = $2
       GROUP BY sch.type`,
      [subjectId, userId]
    );

    res.json({
      subject: {
        ...result.rows[0],
        recent_activities: recentActivities.rows,
        activity_stats: activityStats.rows
      }
    });

  } catch (error) {
    console.error('Erro ao obter matéria:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Criar nova matéria
router.post('/', subjectValidation, async (req, res) => {
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
    const { name, description, color, priority, is_active = true } = req.body;

    // Verificar se já existe uma matéria com o mesmo nome
    const existingSubject = await query(
      'SELECT id FROM subjects WHERE name = $1 AND user_id = $2',
      [name, userId]
    );

    if (existingSubject.rows.length > 0) {
      return res.status(409).json({
        error: 'Já existe uma matéria com este nome',
        code: 'SUBJECT_EXISTS'
      });
    }

    // Gerar cor automática se não fornecida
    const defaultColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const autoColor = color || defaultColors[Math.floor(Math.random() * defaultColors.length)];

    const result = await query(
      `INSERT INTO subjects (user_id, name, description, color, priority, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [userId, name, description, autoColor, priority || 3, is_active]
    );

    res.status(201).json({
      message: 'Matéria criada com sucesso',
      subject: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar matéria:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Atualizar matéria
router.put('/:id', subjectValidation, async (req, res) => {
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
    const subjectId = req.params.id;
    const { name, description, color, priority, is_active } = req.body;

    // Verificar se a matéria pertence ao usuário
    const subjectCheck = await query(
      'SELECT id FROM subjects WHERE id = $1 AND user_id = $2',
      [subjectId, userId]
    );

    if (subjectCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Matéria não encontrada',
        code: 'SUBJECT_NOT_FOUND'
      });
    }

    // Verificar se já existe outra matéria com o mesmo nome (se estiver alterando)
    if (name) {
      const existingSubject = await query(
        'SELECT id FROM subjects WHERE name = $1 AND user_id = $2 AND id != $3',
        [name, userId, subjectId]
      );

      if (existingSubject.rows.length > 0) {
        return res.status(409).json({
          error: 'Já existe uma matéria com este nome',
          code: 'SUBJECT_EXISTS'
        });
      }
    }

    // Construir query de atualização
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      updateValues.push(name);
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(description);
    }

    if (color !== undefined) {
      updateFields.push(`color = $${paramCount++}`);
      updateValues.push(color);
    }

    if (priority !== undefined) {
      updateFields.push(`priority = $${paramCount++}`);
      updateValues.push(priority);
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount++}`);
      updateValues.push(is_active);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(subjectId, userId);

    const result = await query(
      `UPDATE subjects SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`,
      updateValues
    );

    res.json({
      message: 'Matéria atualizada com sucesso',
      subject: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar matéria:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Deletar matéria
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;

    // Verificar se a matéria pertence ao usuário
    const subjectCheck = await query(
      'SELECT id FROM subjects WHERE id = $1 AND user_id = $2',
      [subjectId, userId]
    );

    if (subjectCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Matéria não encontrada',
        code: 'SUBJECT_NOT_FOUND'
      });
    }

    // Verificar se há atividades associadas
    const activitiesCheck = await query(
      'SELECT COUNT(*) as count FROM schedule WHERE subject_id = $1 AND user_id = $2',
      [subjectId, userId]
    );

    if (parseInt(activitiesCheck.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Não é possível deletar uma matéria que possui atividades associadas',
        code: 'SUBJECT_HAS_ACTIVITIES'
      });
    }

    const result = await query(
      'DELETE FROM subjects WHERE id = $1 AND user_id = $2 RETURNING id',
      [subjectId, userId]
    );

    res.json({
      message: 'Matéria deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar matéria:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter estatísticas da matéria
router.get('/:id/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;
    const { period = 'month' } = req.query;

    // Verificar se a matéria pertence ao usuário
    const subjectCheck = await query(
      'SELECT id, name FROM subjects WHERE id = $1 AND user_id = $2',
      [subjectId, userId]
    );

    if (subjectCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Matéria não encontrada',
        code: 'SUBJECT_NOT_FOUND'
      });
    }

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
        COUNT(*) as total_activities,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_activities,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_activities,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_activities,
        SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as total_study_time,
        AVG(CASE WHEN status = 'completed' THEN duration ELSE NULL END) as avg_session_time,
        ROUND(
          (COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / COUNT(*)) * 100, 2
        ) as completion_rate
       FROM schedule 
       WHERE subject_id = $1 AND user_id = $2 AND scheduled_date BETWEEN $3 AND $4`,
      [subjectId, userId, startDateStr, endDate]
    );

    // Estatísticas por dia
    const dailyStats = await query(
      `SELECT 
        DATE(scheduled_date) as date,
        COUNT(*) as total_activities,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_activities,
        SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as study_time
       FROM schedule 
       WHERE subject_id = $1 AND user_id = $2 AND scheduled_date BETWEEN $3 AND $4
       GROUP BY DATE(scheduled_date)
       ORDER BY date`,
      [subjectId, userId, startDateStr, endDate]
    );

    // Estatísticas por tipo de atividade
    const typeStats = await query(
      `SELECT 
        type,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as total_time,
        AVG(CASE WHEN status = 'completed' THEN duration ELSE NULL END) as avg_time
       FROM schedule 
       WHERE subject_id = $1 AND user_id = $2 AND scheduled_date BETWEEN $3 AND $4
       GROUP BY type
       ORDER BY total DESC`,
      [subjectId, userId, startDateStr, endDate]
    );

    // Progresso semanal (últimas 8 semanas)
    const weeklyProgress = await query(
      `SELECT 
        DATE_TRUNC('week', scheduled_date) as week_start,
        COUNT(*) as total_activities,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_activities,
        SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as study_time
       FROM schedule 
       WHERE subject_id = $1 AND user_id = $2
       GROUP BY DATE_TRUNC('week', scheduled_date)
       ORDER BY week_start DESC
       LIMIT 8`,
      [subjectId, userId]
    );

    res.json({
      subject_name: subjectCheck.rows[0].name,
      period,
      start_date: startDateStr,
      end_date: endDate,
      general_stats: generalStats.rows[0],
      daily_stats: dailyStats.rows,
      type_stats: typeStats.rows,
      weekly_progress: weeklyProgress.rows
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas da matéria:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Reordenar prioridades das matérias
router.put('/reorder-priorities', async (req, res) => {
  try {
    const userId = req.user.id;
    const { priorities } = req.body; // Array de {id, priority}

    if (!Array.isArray(priorities)) {
      return res.status(400).json({
        error: 'Dados inválidos',
        code: 'INVALID_DATA'
      });
    }

    // Verificar se todas as matérias pertencem ao usuário
    const subjectIds = priorities.map(p => p.id);
    const subjectsCheck = await query(
      'SELECT id FROM subjects WHERE id = ANY($1) AND user_id = $2',
      [subjectIds, userId]
    );

    if (subjectsCheck.rows.length !== subjectIds.length) {
      return res.status(400).json({
        error: 'Uma ou mais matérias não pertencem ao usuário',
        code: 'INVALID_SUBJECTS'
      });
    }

    // Atualizar prioridades
    for (const item of priorities) {
      await query(
        'UPDATE subjects SET priority = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
        [item.priority, item.id, userId]
      );
    }

    res.json({
      message: 'Prioridades atualizadas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao reordenar prioridades:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router; 