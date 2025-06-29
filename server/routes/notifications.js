const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { sendStudyReminder, sendAchievementEmail, sendWeeklyReport } = require('../utils/email');

const router = express.Router();

// Validação para configurações de notificação
const notificationSettingsValidation = [
  body('email_notifications').optional().isBoolean().withMessage('Email notifications deve ser true ou false'),
  body('study_reminders').optional().isBoolean().withMessage('Study reminders deve ser true ou false'),
  body('achievement_notifications').optional().isBoolean().withMessage('Achievement notifications deve ser true ou false'),
  body('weekly_reports').optional().isBoolean().withMessage('Weekly reports deve ser true ou false'),
  body('reminder_times').optional().isArray().withMessage('Reminder times deve ser um array'),
  body('timezone').optional().isString().withMessage('Timezone deve ser uma string')
];

// Obter notificações do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    let whereConditions = ['user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (status) {
      whereConditions.push(`status = $${++paramCount}`);
      queryParams.push(status);
    }

    const result = await query(
      `SELECT * FROM notifications 
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // Contar total de notificações
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM notifications 
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    res.json({
      notifications: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Erro ao obter notificações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Marcar notificação como lida
router.put('/:id/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const result = await query(
      `UPDATE notifications 
       SET status = 'read', read_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Notificação não encontrada',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    res.json({
      message: 'Notificação marcada como lida',
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Marcar todas as notificações como lidas
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `UPDATE notifications 
       SET status = 'read', read_at = NOW(), updated_at = NOW()
       WHERE user_id = $1 AND status = 'unread'
       RETURNING COUNT(*) as updated_count`,
      [userId]
    );

    res.json({
      message: 'Todas as notificações marcadas como lidas',
      updated_count: parseInt(result.rows[0].updated_count)
    });

  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Deletar notificação
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Notificação não encontrada',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    res.json({
      message: 'Notificação deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter configurações de notificação
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT notification_preferences FROM student_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Perfil do estudante não encontrado',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    const preferences = result.rows[0].notification_preferences 
      ? JSON.parse(result.rows[0].notification_preferences)
      : {
          email_notifications: true,
          study_reminders: true,
          achievement_notifications: true,
          weekly_reports: true,
          reminder_times: ['09:00', '14:00', '19:00'],
          timezone: 'America/Sao_Paulo'
        };

    res.json({
      settings: preferences
    });

  } catch (error) {
    console.error('Erro ao obter configurações de notificação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Atualizar configurações de notificação
router.put('/settings', notificationSettingsValidation, async (req, res) => {
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
    const settings = req.body;

    // Obter configurações atuais
    const currentResult = await query(
      'SELECT notification_preferences FROM student_profiles WHERE user_id = $1',
      [userId]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Perfil do estudante não encontrado',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    const currentPreferences = currentResult.rows[0].notification_preferences 
      ? JSON.parse(currentResult.rows[0].notification_preferences)
      : {};

    // Mesclar configurações
    const updatedPreferences = {
      ...currentPreferences,
      ...settings
    };

    await query(
      `UPDATE student_profiles 
       SET notification_preferences = $1, updated_at = NOW()
       WHERE user_id = $2`,
      [JSON.stringify(updatedPreferences), userId]
    );

    res.json({
      message: 'Configurações de notificação atualizadas com sucesso',
      settings: updatedPreferences
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações de notificação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Enviar notificação de teste
router.post('/test', async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'study_reminder' } = req.body;

    // Obter dados do usuário
    const userResult = await query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    // Obter configurações de notificação
    const settingsResult = await query(
      'SELECT notification_preferences FROM student_profiles WHERE user_id = $1',
      [userId]
    );

    if (settingsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Perfil do estudante não encontrado',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    const preferences = settingsResult.rows[0].notification_preferences 
      ? JSON.parse(settingsResult.rows[0].notification_preferences)
      : {};

    if (!preferences.email_notifications) {
      return res.status(400).json({
        error: 'Notificações por email estão desabilitadas',
        code: 'EMAIL_NOTIFICATIONS_DISABLED'
      });
    }

    let emailSent = false;

    switch (type) {
      case 'study_reminder':
        if (preferences.study_reminders) {
          const mockSchedule = {
            subject: 'Matemática',
            topic: 'Funções Quadráticas',
            duration: 60,
            priority: 'high'
          };
          
          await sendStudyReminder(user.email, user.name, mockSchedule);
          emailSent = true;
        }
        break;

      case 'achievement':
        if (preferences.achievement_notifications) {
          const mockAchievement = {
            icon: '🏆',
            title: 'Primeiro Passo',
            description: 'Complete sua primeira tarefa',
            points: 10
          };
          
          await sendAchievementEmail(user.email, user.name, mockAchievement);
          emailSent = true;
        }
        break;

      case 'weekly_report':
        if (preferences.weekly_reports) {
          const mockReport = {
            totalStudyTime: 12,
            completedGoals: 8,
            totalGoals: 10,
            completionRate: 80,
            pointsEarned: 150,
            achievementsUnlocked: 2
          };
          
          await sendWeeklyReport(user.email, user.name, mockReport);
          emailSent = true;
        }
        break;

      default:
        return res.status(400).json({
          error: 'Tipo de notificação inválido',
          code: 'INVALID_NOTIFICATION_TYPE'
        });
    }

    if (!emailSent) {
      return res.status(400).json({
        error: 'Tipo de notificação desabilitado nas configurações',
        code: 'NOTIFICATION_TYPE_DISABLED'
      });
    }

    res.json({
      message: 'Notificação de teste enviada com sucesso',
      type,
      email: user.email
    });

  } catch (error) {
    console.error('Erro ao enviar notificação de teste:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Criar notificação manual
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, message, type, priority = 'normal' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: 'Título e mensagem são obrigatórios',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const result = await query(
      `INSERT INTO notifications (user_id, title, message, type, priority, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'unread', NOW(), NOW())
       RETURNING *`,
      [userId, title, message, type, priority]
    );

    res.status(201).json({
      message: 'Notificação criada com sucesso',
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter estatísticas de notificações
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
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
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN status = 'read' THEN 1 END) as read_notifications,
        COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread_notifications,
        COUNT(CASE WHEN type = 'study_reminder' THEN 1 END) as study_reminders,
        COUNT(CASE WHEN type = 'achievement' THEN 1 END) as achievement_notifications,
        COUNT(CASE WHEN type = 'weekly_report' THEN 1 END) as weekly_reports
       FROM notifications 
       WHERE user_id = $1 AND created_at >= $2`,
      [userId, startDateStr]
    );

    // Estatísticas por tipo
    const typeStats = await query(
      `SELECT 
        type,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'read' THEN 1 END) as read_count
       FROM notifications 
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY type
       ORDER BY count DESC`,
      [userId, startDateStr]
    );

    // Estatísticas por dia
    const dailyStats = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'read' THEN 1 END) as read_count
       FROM notifications 
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [userId, startDateStr]
    );

    res.json({
      period,
      start_date: startDateStr,
      end_date: endDate,
      general_stats: generalStats.rows[0],
      type_stats: typeStats.rows,
      daily_stats: dailyStats.rows
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas de notificações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Função para criar notificação de lembrete de estudo
const createStudyReminder = async (userId, schedule) => {
  try {
    const title = '⏰ Hora de Estudar!';
    const message = `Chegou a hora do seu estudo de ${schedule.subject_name}: ${schedule.topic}`;
    
    await query(
      `INSERT INTO notifications (user_id, title, message, type, priority, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'unread', NOW(), NOW())`,
      [userId, title, message, 'study_reminder', 'high']
    );

    // Enviar email se configurado
    const userResult = await query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length > 0) {
      const settingsResult = await query(
        'SELECT notification_preferences FROM student_profiles WHERE user_id = $1',
        [userId]
      );

      if (settingsResult.rows.length > 0) {
        const preferences = settingsResult.rows[0].notification_preferences 
          ? JSON.parse(settingsResult.rows[0].notification_preferences)
          : {};

        if (preferences.email_notifications && preferences.study_reminders) {
          try {
            await sendStudyReminder(userResult.rows[0].email, userResult.rows[0].name, schedule);
          } catch (emailError) {
            console.error('Erro ao enviar email de lembrete:', emailError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao criar lembrete de estudo:', error);
  }
};

// Função para criar notificação de conquista
const createAchievementNotification = async (userId, achievement) => {
  try {
    const title = `🏆 ${achievement.title}`;
    const message = `${achievement.description} (+${achievement.points} pontos)`;
    
    await query(
      `INSERT INTO notifications (user_id, title, message, type, priority, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'unread', NOW(), NOW())`,
      [userId, title, message, 'achievement', 'normal']
    );

    // Enviar email se configurado
    const userResult = await query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length > 0) {
      const settingsResult = await query(
        'SELECT notification_preferences FROM student_profiles WHERE user_id = $1',
        [userId]
      );

      if (settingsResult.rows.length > 0) {
        const preferences = settingsResult.rows[0].notification_preferences 
          ? JSON.parse(settingsResult.rows[0].notification_preferences)
          : {};

        if (preferences.email_notifications && preferences.achievement_notifications) {
          try {
            await sendAchievementEmail(userResult.rows[0].email, userResult.rows[0].name, achievement);
          } catch (emailError) {
            console.error('Erro ao enviar email de conquista:', emailError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao criar notificação de conquista:', error);
  }
};

module.exports = router; 