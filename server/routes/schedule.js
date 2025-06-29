const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { requireRole } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// Validação para criação/atualização de atividades
const scheduleValidation = [
  body('subject_id').isInt().withMessage('ID da matéria é obrigatório'),
  body('topic').trim().isLength({ min: 3, max: 200 }).withMessage('Tópico deve ter entre 3 e 200 caracteres'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('scheduled_date').isISO8601().withMessage('Data deve estar no formato ISO'),
  body('scheduled_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Horário deve estar no formato HH:MM'),
  body('duration').isInt({ min: 15, max: 480 }).withMessage('Duração deve ser entre 15 e 480 minutos'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Prioridade deve ser low, medium ou high'),
  body('type').isIn(['study', 'review', 'practice', 'exam']).withMessage('Tipo deve ser study, review, practice ou exam')
];

// Obter cronograma
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date, subject_id, status } = req.query;

    let whereConditions = ['s.user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (start_date) {
      whereConditions.push(`s.scheduled_date >= $${++paramCount}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`s.scheduled_date <= $${++paramCount}`);
      queryParams.push(end_date);
    }

    if (subject_id) {
      whereConditions.push(`s.subject_id = $${++paramCount}`);
      queryParams.push(subject_id);
    }

    if (status) {
      whereConditions.push(`s.status = $${++paramCount}`);
      queryParams.push(status);
    }

    const result = await query(
      `SELECT s.*, sub.name as subject_name, sub.color as subject_color
       FROM schedule s
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY s.scheduled_date ASC, s.scheduled_time ASC`,
      queryParams
    );

    res.json({
      schedule: result.rows
    });

  } catch (error) {
    console.error('Erro ao obter cronograma:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Criar atividade
router.post('/', scheduleValidation, async (req, res) => {
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
    const { subject_id, topic, description, scheduled_date, scheduled_time, duration, priority, type } = req.body;

    // Verificar se a matéria pertence ao usuário
    const subjectCheck = await query(
      'SELECT id FROM subjects WHERE id = $1 AND user_id = $2',
      [subject_id, userId]
    );

    if (subjectCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Matéria não encontrada',
        code: 'SUBJECT_NOT_FOUND'
      });
    }

    // Verificar conflitos de horário
    const conflictCheck = await query(
      `SELECT id FROM schedule 
       WHERE user_id = $1 
       AND scheduled_date = $2 
       AND status != 'cancelled'
       AND (
         (scheduled_time <= $3 AND scheduled_time + INTERVAL '1 minute' * duration > $3) OR
         (scheduled_time < $3 + INTERVAL '1 minute' * $4 AND scheduled_time + INTERVAL '1 minute' * duration >= $3 + INTERVAL '1 minute' * $4)
       )`,
      [userId, scheduled_date, scheduled_time, duration]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'Conflito de horário detectado',
        code: 'SCHEDULE_CONFLICT'
      });
    }

    const result = await query(
      `INSERT INTO schedule (user_id, subject_id, topic, description, scheduled_date, scheduled_time, duration, priority, type, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW(), NOW())
       RETURNING *`,
      [userId, subject_id, topic, description, scheduled_date, scheduled_time, duration, priority, type]
    );

    // Buscar dados da matéria para resposta
    const subjectResult = await query(
      'SELECT name, color FROM subjects WHERE id = $1',
      [subject_id]
    );

    const activity = {
      ...result.rows[0],
      subject_name: subjectResult.rows[0].name,
      subject_color: subjectResult.rows[0].color
    };

    res.status(201).json({
      message: 'Atividade criada com sucesso',
      activity
    });

  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Atualizar atividade
router.put('/:id', scheduleValidation, async (req, res) => {
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
    const activityId = req.params.id;
    const { subject_id, topic, description, scheduled_date, scheduled_time, duration, priority, type, status } = req.body;

    // Verificar se a atividade pertence ao usuário
    const activityCheck = await query(
      'SELECT id FROM schedule WHERE id = $1 AND user_id = $2',
      [activityId, userId]
    );

    if (activityCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Atividade não encontrada',
        code: 'ACTIVITY_NOT_FOUND'
      });
    }

    // Verificar se a matéria pertence ao usuário (se estiver sendo alterada)
    if (subject_id) {
      const subjectCheck = await query(
        'SELECT id FROM subjects WHERE id = $1 AND user_id = $2',
        [subject_id, userId]
      );

      if (subjectCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Matéria não encontrada',
          code: 'SUBJECT_NOT_FOUND'
        });
      }
    }

    // Verificar conflitos de horário (excluindo a atividade atual)
    if (scheduled_date && scheduled_time && duration) {
      const conflictCheck = await query(
        `SELECT id FROM schedule 
         WHERE user_id = $1 
         AND id != $2
         AND scheduled_date = $3 
         AND status != 'cancelled'
         AND (
           (scheduled_time <= $4 AND scheduled_time + INTERVAL '1 minute' * duration > $4) OR
           (scheduled_time < $4 + INTERVAL '1 minute' * $5 AND scheduled_time + INTERVAL '1 minute' * duration >= $4 + INTERVAL '1 minute' * $5)
         )`,
        [userId, activityId, scheduled_date, scheduled_time, duration]
      );

      if (conflictCheck.rows.length > 0) {
        return res.status(409).json({
          error: 'Conflito de horário detectado',
          code: 'SCHEDULE_CONFLICT'
        });
      }
    }

    // Construir query de atualização
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (subject_id !== undefined) {
      updateFields.push(`subject_id = $${paramCount++}`);
      updateValues.push(subject_id);
    }

    if (topic !== undefined) {
      updateFields.push(`topic = $${paramCount++}`);
      updateValues.push(topic);
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(description);
    }

    if (scheduled_date !== undefined) {
      updateFields.push(`scheduled_date = $${paramCount++}`);
      updateValues.push(scheduled_date);
    }

    if (scheduled_time !== undefined) {
      updateFields.push(`scheduled_time = $${paramCount++}`);
      updateValues.push(scheduled_time);
    }

    if (duration !== undefined) {
      updateFields.push(`duration = $${paramCount++}`);
      updateValues.push(duration);
    }

    if (priority !== undefined) {
      updateFields.push(`priority = $${paramCount++}`);
      updateValues.push(priority);
    }

    if (type !== undefined) {
      updateFields.push(`type = $${paramCount++}`);
      updateValues.push(type);
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(status);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(activityId);

    const result = await query(
      `UPDATE schedule SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`,
      [...updateValues, userId]
    );

    // Buscar dados da matéria para resposta
    const subjectResult = await query(
      'SELECT name, color FROM subjects WHERE id = $1',
      [result.rows[0].subject_id]
    );

    const activity = {
      ...result.rows[0],
      subject_name: subjectResult.rows[0].name,
      subject_color: subjectResult.rows[0].color
    };

    res.json({
      message: 'Atividade atualizada com sucesso',
      activity
    });

  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Deletar atividade
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = req.params.id;

    const result = await query(
      'DELETE FROM schedule WHERE id = $1 AND user_id = $2 RETURNING id',
      [activityId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Atividade não encontrada',
        code: 'ACTIVITY_NOT_FOUND'
      });
    }

    res.json({
      message: 'Atividade deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar atividade:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Marcar atividade como concluída
router.put('/:id/complete', async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = req.params.id;
    const { actual_duration, notes } = req.body;

    const result = await query(
      `UPDATE schedule 
       SET status = 'completed', 
           completed_at = NOW(),
           actual_duration = $1,
           notes = $2,
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [actual_duration, notes, activityId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Atividade não encontrada',
        code: 'ACTIVITY_NOT_FOUND'
      });
    }

    // Adicionar pontos de gamificação
    const points = Math.floor((actual_duration || result.rows[0].duration) / 10); // 1 ponto a cada 10 minutos
    
    await query(
      `INSERT INTO gamification_log (user_id, activity_type, points_earned, description, created_at)
       VALUES ($1, 'task_completion', $2, $3, NOW())`,
      [userId, points, `Concluiu: ${result.rows[0].topic}`]
    );

    res.json({
      message: 'Atividade concluída com sucesso',
      points_earned: points,
      activity: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao concluir atividade:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Planejamento automático com IA
router.post('/auto-plan', requireRole(['student']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date, focus_subjects } = req.body;

    // Obter perfil do estudante
    const profileResult = await query(
      'SELECT daily_study_time, preferred_study_times FROM student_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Perfil do estudante não encontrado',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    const profile = profileResult.rows[0];
    const dailyStudyTime = profile.daily_study_time || 120; // 2 horas por padrão
    const preferredTimes = profile.preferred_study_times ? JSON.parse(profile.preferred_study_times) : ['09:00', '14:00', '19:00'];

    // Obter matérias do usuário
    const subjectsResult = await query(
      'SELECT id, name, color, priority FROM subjects WHERE user_id = $1 ORDER BY priority DESC',
      [userId]
    );

    if (subjectsResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Nenhuma matéria cadastrada',
        code: 'NO_SUBJECTS'
      });
    }

    const subjects = subjectsResult.rows;
    const focusSubjectIds = focus_subjects || subjects.map(s => s.id);

    // Gerar cronograma automático
    const generatedSchedule = [];
    const startDate = moment(start_date);
    const endDate = moment(end_date);
    const daysDiff = endDate.diff(startDate, 'days') + 1;

    // Distribuir tempo de estudo por matéria baseado na prioridade
    const totalPriority = subjects.reduce((sum, subject) => sum + (subject.priority || 1), 0);
    
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = startDate.clone().add(i, 'days');
      const dayOfWeek = currentDate.day();
      
      // Pular fins de semana (opcional)
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // Distribuir sessões ao longo do dia
      const sessionsPerDay = Math.ceil(dailyStudyTime / 60); // 1 hora por sessão
      const timeSlots = preferredTimes.slice(0, sessionsPerDay);

      for (let j = 0; j < timeSlots.length; j++) {
        const timeSlot = timeSlots[j];
        
        // Selecionar matéria baseada na prioridade e foco
        const availableSubjects = subjects.filter(subject => 
          focusSubjectIds.includes(subject.id)
        );

        if (availableSubjects.length === 0) continue;

        // Algoritmo de seleção ponderada
        const weights = availableSubjects.map(subject => {
          const priority = subject.priority || 1;
          const focusBonus = focusSubjectIds.includes(subject.id) ? 2 : 1;
          return priority * focusBonus;
        });

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        let selectedSubjectIndex = 0;

        for (let k = 0; k < weights.length; k++) {
          random -= weights[k];
          if (random <= 0) {
            selectedSubjectIndex = k;
            break;
          }
        }

        const selectedSubject = availableSubjects[selectedSubjectIndex];

        // Gerar tópico baseado na matéria
        const topics = [
          'Revisão de conceitos fundamentais',
          'Resolução de exercícios',
          'Estudo de teoria',
          'Prática de questões',
          'Análise de questões anteriores',
          'Consolidação de conteúdo'
        ];

        const randomTopic = topics[Math.floor(Math.random() * topics.length)];

        generatedSchedule.push({
          subject_id: selectedSubject.id,
          subject_name: selectedSubject.name,
          subject_color: selectedSubject.color,
          topic: `${randomTopic} - ${selectedSubject.name}`,
          description: `Sessão de estudo automática gerada para ${selectedSubject.name}`,
          scheduled_date: currentDate.format('YYYY-MM-DD'),
          scheduled_time: timeSlot,
          duration: 60, // 1 hora por sessão
          priority: selectedSubject.priority > 2 ? 'high' : 'medium',
          type: 'study'
        });
      }
    }

    res.json({
      message: 'Cronograma automático gerado com sucesso',
      schedule: generatedSchedule,
      total_sessions: generatedSchedule.length
    });

  } catch (error) {
    console.error('Erro ao gerar cronograma automático:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Aplicar cronograma automático
router.post('/apply-auto-plan', requireRole(['student']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { schedule } = req.body;

    if (!Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({
        error: 'Cronograma inválido',
        code: 'INVALID_SCHEDULE'
      });
    }

    const createdActivities = [];

    await transaction(async (client) => {
      for (const activity of schedule) {
        // Verificar se a matéria pertence ao usuário
        const subjectCheck = await client.query(
          'SELECT id FROM subjects WHERE id = $1 AND user_id = $2',
          [activity.subject_id, userId]
        );

        if (subjectCheck.rows.length === 0) continue;

        // Verificar conflitos de horário
        const conflictCheck = await client.query(
          `SELECT id FROM schedule 
           WHERE user_id = $1 
           AND scheduled_date = $2 
           AND status != 'cancelled'
           AND (
             (scheduled_time <= $3 AND scheduled_time + INTERVAL '1 minute' * duration > $3) OR
             (scheduled_time < $3 + INTERVAL '1 minute' * $4 AND scheduled_time + INTERVAL '1 minute' * duration >= $3 + INTERVAL '1 minute' * $4)
           )`,
          [userId, activity.scheduled_date, activity.scheduled_time, activity.duration]
        );

        if (conflictCheck.rows.length > 0) continue;

        // Criar atividade
        const result = await client.query(
          `INSERT INTO schedule (user_id, subject_id, topic, description, scheduled_date, scheduled_time, duration, priority, type, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW(), NOW())
           RETURNING *`,
          [userId, activity.subject_id, activity.topic, activity.description, activity.scheduled_date, activity.scheduled_time, activity.duration, activity.priority, activity.type]
        );

        createdActivities.push({
          ...result.rows[0],
          subject_name: activity.subject_name,
          subject_color: activity.subject_color
        });
      }
    });

    res.json({
      message: 'Cronograma aplicado com sucesso',
      created_activities: createdActivities.length,
      activities: createdActivities
    });

  } catch (error) {
    console.error('Erro ao aplicar cronograma automático:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router; 