const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// Obter perfil de gamificação do usuário
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    // Obter pontos totais e estatísticas
    const statsResult = await query(
      `SELECT 
        COALESCE(SUM(points_earned), 0) as total_points,
        COALESCE(COUNT(*), 0) as total_activities,
        COALESCE(COUNT(CASE WHEN achievement_type IS NOT NULL THEN 1 END), 0) as achievements_count
       FROM gamification_log 
       WHERE user_id = $1`,
      [userId]
    );

    const stats = statsResult.rows[0];
    const totalPoints = parseInt(stats.total_points);
    const currentLevel = Math.floor(totalPoints / 100) + 1;
    const pointsToNextLevel = 100 - (totalPoints % 100);
    const levelProgress = ((totalPoints % 100) / 100) * 100;

    // Obter conquistas desbloqueadas
    const achievementsResult = await query(
      `SELECT DISTINCT achievement_type, achievement_title, achievement_description, achievement_icon
       FROM gamification_log 
       WHERE user_id = $1 AND achievement_type IS NOT NULL
       ORDER BY created_at DESC`,
      [userId]
    );

    // Obter atividades recentes
    const recentActivitiesResult = await query(
      `SELECT activity_type, points_earned, description, created_at
       FROM gamification_log 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Calcular ranking (posição entre todos os usuários)
    const rankingResult = await query(
      `SELECT position FROM (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY SUM(points_earned) DESC) as position
        FROM gamification_log 
        GROUP BY user_id
      ) ranked WHERE user_id = $1`,
      [userId]
    );

    const ranking = rankingResult.rows.length > 0 ? rankingResult.rows[0].position : null;

    // Obter estatísticas por tipo de atividade
    const activityStatsResult = await query(
      `SELECT 
        activity_type,
        COUNT(*) as count,
        SUM(points_earned) as total_points
       FROM gamification_log 
       WHERE user_id = $1
       GROUP BY activity_type
       ORDER BY total_points DESC`,
      [userId]
    );

    res.json({
      profile: {
        total_points: totalPoints,
        current_level: currentLevel,
        points_to_next_level: pointsToNextLevel,
        level_progress: levelProgress,
        achievements_count: parseInt(stats.achievements_count),
        total_activities: parseInt(stats.total_activities),
        ranking: ranking,
        achievements: achievementsResult.rows,
        recent_activities: recentActivitiesResult.rows,
        activity_stats: activityStatsResult.rows
      }
    });

  } catch (error) {
    console.error('Erro ao obter perfil de gamificação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter conquistas disponíveis
router.get('/achievements', async (req, res) => {
  try {
    const userId = req.user.id;

    // Definir todas as conquistas disponíveis
    const allAchievements = [
      {
        id: 'first_task',
        title: 'Primeiro Passo',
        description: 'Complete sua primeira tarefa',
        icon: '🎯',
        points: 10,
        type: 'task_completion',
        requirement: 1
      },
      {
        id: 'task_streak_3',
        title: 'Constante',
        description: 'Complete tarefas por 3 dias consecutivos',
        icon: '🔥',
        points: 25,
        type: 'streak',
        requirement: 3
      },
      {
        id: 'task_streak_7',
        title: 'Dedicado',
        description: 'Complete tarefas por 7 dias consecutivos',
        icon: '⚡',
        points: 50,
        type: 'streak',
        requirement: 7
      },
      {
        id: 'task_streak_30',
        title: 'Inabalável',
        description: 'Complete tarefas por 30 dias consecutivos',
        icon: '🏆',
        points: 200,
        type: 'streak',
        requirement: 30
      },
      {
        id: 'study_time_1h',
        title: 'Foco Inicial',
        description: 'Estude por 1 hora em um dia',
        icon: '⏰',
        points: 15,
        type: 'study_time',
        requirement: 60
      },
      {
        id: 'study_time_3h',
        title: 'Maratonista',
        description: 'Estude por 3 horas em um dia',
        icon: '🚀',
        points: 40,
        type: 'study_time',
        requirement: 180
      },
      {
        id: 'flashcard_master',
        title: 'Mestre dos Flashcards',
        description: 'Revise 50 flashcards',
        icon: '🧠',
        points: 30,
        type: 'flashcard_review',
        requirement: 50
      },
      {
        id: 'subject_expert',
        title: 'Especialista',
        description: 'Complete 20 tarefas em uma matéria',
        icon: '📚',
        points: 35,
        type: 'subject_mastery',
        requirement: 20
      },
      {
        id: 'perfect_day',
        title: 'Dia Perfeito',
        description: 'Complete todas as tarefas do dia',
        icon: '✨',
        points: 20,
        type: 'perfect_day',
        requirement: 1
      },
      {
        id: 'early_bird',
        title: 'Madrugador',
        description: 'Complete uma tarefa antes das 8h',
        icon: '🌅',
        points: 15,
        type: 'early_bird',
        requirement: 1
      },
      {
        id: 'night_owl',
        title: 'Coruja',
        description: 'Complete uma tarefa após as 22h',
        icon: '🦉',
        points: 15,
        type: 'night_owl',
        requirement: 1
      },
      {
        id: 'weekend_warrior',
        title: 'Guerreiro do Fim de Semana',
        description: 'Estude durante o fim de semana',
        icon: '💪',
        points: 25,
        type: 'weekend_study',
        requirement: 1
      }
    ];

    // Obter conquistas já desbloqueadas
    const unlockedAchievementsResult = await query(
      `SELECT DISTINCT achievement_type
       FROM gamification_log 
       WHERE user_id = $1 AND achievement_type IS NOT NULL`,
      [userId]
    );

    const unlockedAchievements = unlockedAchievementsResult.rows.map(row => row.achievement_type);

    // Marcar conquistas como desbloqueadas ou não
    const achievementsWithStatus = allAchievements.map(achievement => ({
      ...achievement,
      unlocked: unlockedAchievements.includes(achievement.id),
      unlocked_at: null // Seria preenchido se tivéssemos a data de desbloqueio
    }));

    res.json({
      achievements: achievementsWithStatus
    });

  } catch (error) {
    console.error('Erro ao obter conquistas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter ranking de usuários
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT 
        u.id,
        u.name,
        u.role,
        COALESCE(SUM(gl.points_earned), 0) as total_points,
        COUNT(gl.id) as total_activities,
        COUNT(CASE WHEN gl.achievement_type IS NOT NULL THEN 1 END) as achievements_count
       FROM users u
       LEFT JOIN gamification_log gl ON u.id = gl.user_id
       WHERE u.role = 'student'
       GROUP BY u.id, u.name, u.role
       ORDER BY total_points DESC, total_activities DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );

    // Adicionar posição no ranking
    const leaderboard = result.rows.map((user, index) => ({
      ...user,
      position: parseInt(offset) + index + 1,
      level: Math.floor(parseInt(user.total_points) / 100) + 1
    }));

    res.json({
      leaderboard,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Erro ao obter leaderboard:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter histórico de atividades
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, activity_type } = req.query;

    let whereConditions = ['user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (activity_type) {
      whereConditions.push(`activity_type = $${++paramCount}`);
      queryParams.push(activity_type);
    }

    const result = await query(
      `SELECT activity_type, points_earned, description, achievement_type, achievement_title, created_at
       FROM gamification_log 
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // Contar total de registros
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM gamification_log 
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    res.json({
      history: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter estatísticas de gamificação
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

    // Estatísticas gerais do período
    const generalStats = await query(
      `SELECT 
        COUNT(*) as total_activities,
        SUM(points_earned) as total_points,
        COUNT(CASE WHEN achievement_type IS NOT NULL THEN 1 END) as achievements_unlocked,
        ROUND(AVG(points_earned), 2) as avg_points_per_activity
       FROM gamification_log 
       WHERE user_id = $1 AND created_at >= $2`,
      [userId, startDateStr]
    );

    // Estatísticas por tipo de atividade
    const activityStats = await query(
      `SELECT 
        activity_type,
        COUNT(*) as count,
        SUM(points_earned) as total_points,
        ROUND(AVG(points_earned), 2) as avg_points
       FROM gamification_log 
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY activity_type
       ORDER BY total_points DESC`,
      [userId, startDateStr]
    );

    // Estatísticas por dia
    const dailyStats = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as activities,
        SUM(points_earned) as points_earned,
        COUNT(CASE WHEN achievement_type IS NOT NULL THEN 1 END) as achievements
       FROM gamification_log 
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [userId, startDateStr]
    );

    // Maior pontuação em um dia
    const bestDayResult = await query(
      `SELECT 
        DATE(created_at) as date,
        SUM(points_earned) as total_points
       FROM gamification_log 
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY DATE(created_at)
       ORDER BY total_points DESC
       LIMIT 1`,
      [userId, startDateStr]
    );

    res.json({
      period,
      start_date: startDateStr,
      end_date: endDate,
      general_stats: generalStats.rows[0],
      activity_stats: activityStats.rows,
      daily_stats: dailyStats.rows,
      best_day: bestDayResult.rows[0] || null
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas de gamificação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Verificar e conceder conquistas automaticamente
router.post('/check-achievements', async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar conquistas baseadas em streaks
    const streakResult = await query(
      `SELECT COUNT(DISTINCT DATE(created_at)) as consecutive_days
       FROM gamification_log 
       WHERE user_id = $1 AND activity_type = 'task_completion'
       AND created_at >= (
         SELECT MAX(created_at) - INTERVAL '30 days'
         FROM gamification_log 
         WHERE user_id = $1
       )
       ORDER BY created_at DESC`,
      [userId]
    );

    const consecutiveDays = parseInt(streakResult.rows[0]?.consecutive_days || 0);

    // Verificar conquistas de tempo de estudo
    const studyTimeResult = await query(
      `SELECT SUM(points_earned * 10) as total_study_minutes
       FROM gamification_log 
       WHERE user_id = $1 AND activity_type = 'task_completion'
       AND DATE(created_at) = CURRENT_DATE`,
      [userId]
    );

    const todayStudyMinutes = parseInt(studyTimeResult.rows[0]?.total_study_minutes || 0);

    // Verificar conquistas de flashcards
    const flashcardResult = await query(
      `SELECT COUNT(*) as total_reviews
       FROM gamification_log 
       WHERE user_id = $1 AND activity_type = 'flashcard_review'`,
      [userId]
    );

    const totalFlashcardReviews = parseInt(flashcardResult.rows[0]?.total_reviews || 0);

    // Lista de conquistas para verificar
    const achievementsToCheck = [];

    // Streak achievements
    if (consecutiveDays >= 3) {
      achievementsToCheck.push({
        id: 'task_streak_3',
        title: 'Constante',
        description: 'Complete tarefas por 3 dias consecutivos',
        icon: '🔥',
        points: 25
      });
    }

    if (consecutiveDays >= 7) {
      achievementsToCheck.push({
        id: 'task_streak_7',
        title: 'Dedicado',
        description: 'Complete tarefas por 7 dias consecutivos',
        icon: '⚡',
        points: 50
      });
    }

    if (consecutiveDays >= 30) {
      achievementsToCheck.push({
        id: 'task_streak_30',
        title: 'Inabalável',
        description: 'Complete tarefas por 30 dias consecutivos',
        icon: '🏆',
        points: 200
      });
    }

    // Study time achievements
    if (todayStudyMinutes >= 60) {
      achievementsToCheck.push({
        id: 'study_time_1h',
        title: 'Foco Inicial',
        description: 'Estude por 1 hora em um dia',
        icon: '⏰',
        points: 15
      });
    }

    if (todayStudyMinutes >= 180) {
      achievementsToCheck.push({
        id: 'study_time_3h',
        title: 'Maratonista',
        description: 'Estude por 3 horas em um dia',
        icon: '🚀',
        points: 40
      });
    }

    // Flashcard achievements
    if (totalFlashcardReviews >= 50) {
      achievementsToCheck.push({
        id: 'flashcard_master',
        title: 'Mestre dos Flashcards',
        description: 'Revise 50 flashcards',
        icon: '🧠',
        points: 30
      });
    }

    // Verificar quais conquistas já foram desbloqueadas
    const unlockedAchievementsResult = await query(
      `SELECT DISTINCT achievement_type
       FROM gamification_log 
       WHERE user_id = $1 AND achievement_type IS NOT NULL`,
      [userId]
    );

    const unlockedAchievements = unlockedAchievementsResult.rows.map(row => row.achievement_type);

    // Filtrar apenas conquistas não desbloqueadas
    const newAchievements = achievementsToCheck.filter(
      achievement => !unlockedAchievements.includes(achievement.id)
    );

    // Conceder novas conquistas
    const grantedAchievements = [];
    for (const achievement of newAchievements) {
      await query(
        `INSERT INTO gamification_log (user_id, activity_type, points_earned, description, achievement_type, achievement_title, achievement_description, achievement_icon, created_at)
         VALUES ($1, 'achievement', $2, $3, $4, $5, $6, $7, NOW())`,
        [
          userId,
          achievement.points,
          `Conquista desbloqueada: ${achievement.title}`,
          achievement.id,
          achievement.title,
          achievement.description,
          achievement.icon
        ]
      );

      grantedAchievements.push(achievement);
    }

    res.json({
      message: 'Verificação de conquistas concluída',
      new_achievements: grantedAchievements,
      total_granted: grantedAchievements.length
    });

  } catch (error) {
    console.error('Erro ao verificar conquistas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router; 