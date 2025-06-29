const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

const router = express.Router();

// Validação para criação/atualização de flashcards
const flashcardValidation = [
  body('subject_id').isInt().withMessage('ID da matéria é obrigatório'),
  body('front_content').trim().isLength({ min: 3, max: 1000 }).withMessage('Conteúdo da frente deve ter entre 3 e 1000 caracteres'),
  body('back_content').trim().isLength({ min: 3, max: 1000 }).withMessage('Conteúdo do verso deve ter entre 3 e 1000 caracteres'),
  body('tags').optional().isArray().withMessage('Tags deve ser um array'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Dificuldade deve ser easy, medium ou hard')
];

// Obter flashcards do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject_id, status, difficulty, tags, limit = 50, offset = 0 } = req.query;

    let whereConditions = ['fc.user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (subject_id) {
      whereConditions.push(`fc.subject_id = $${++paramCount}`);
      queryParams.push(subject_id);
    }

    if (status) {
      whereConditions.push(`fc.status = $${++paramCount}`);
      queryParams.push(status);
    }

    if (difficulty) {
      whereConditions.push(`fc.difficulty = $${++paramCount}`);
      queryParams.push(difficulty);
    }

    if (tags && Array.isArray(tags)) {
      whereConditions.push(`fc.tags ?| $${++paramCount}`);
      queryParams.push(tags);
    }

    const result = await query(
      `SELECT fc.*, s.name as subject_name, s.color as subject_color
       FROM flashcards fc
       LEFT JOIN subjects s ON fc.subject_id = s.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY fc.next_review ASC, fc.created_at DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // Contar total de flashcards
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM flashcards fc
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    res.json({
      flashcards: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Erro ao obter flashcards:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter flashcards para revisão
router.get('/review', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject_id, limit = 20 } = req.query;

    let whereConditions = ['fc.user_id = $1', 'fc.status = $2'];
    let queryParams = [userId, 'active'];
    let paramCount = 2;

    if (subject_id) {
      whereConditions.push(`fc.subject_id = $${++paramCount}`);
      queryParams.push(subject_id);
    }

    // Obter flashcards que precisam de revisão (hoje ou antes)
    const today = new Date().toISOString().split('T')[0];
    whereConditions.push(`fc.next_review <= $${++paramCount}`);
    queryParams.push(today);

    const result = await query(
      `SELECT fc.*, s.name as subject_name, s.color as subject_color
       FROM flashcards fc
       LEFT JOIN subjects s ON fc.subject_id = s.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY fc.next_review ASC, RANDOM()
       LIMIT $${++paramCount}`,
      [...queryParams, parseInt(limit)]
    );

    res.json({
      flashcards: result.rows,
      total_for_review: result.rows.length
    });

  } catch (error) {
    console.error('Erro ao obter flashcards para revisão:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Criar novo flashcard
router.post('/', flashcardValidation, async (req, res) => {
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
    const { subject_id, front_content, back_content, tags, difficulty = 'medium' } = req.body;

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

    const result = await query(
      `INSERT INTO flashcards (user_id, subject_id, front_content, back_content, tags, difficulty, status, next_review, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW(), NOW())
       RETURNING *`,
      [userId, subject_id, front_content, back_content, JSON.stringify(tags || []), difficulty]
    );

    // Buscar dados da matéria para resposta
    const subjectResult = await query(
      'SELECT name, color FROM subjects WHERE id = $1',
      [subject_id]
    );

    const flashcard = {
      ...result.rows[0],
      subject_name: subjectResult.rows[0].name,
      subject_color: subjectResult.rows[0].color
    };

    res.status(201).json({
      message: 'Flashcard criado com sucesso',
      flashcard
    });

  } catch (error) {
    console.error('Erro ao criar flashcard:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Atualizar flashcard
router.put('/:id', flashcardValidation, async (req, res) => {
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
    const flashcardId = req.params.id;
    const { subject_id, front_content, back_content, tags, difficulty, status } = req.body;

    // Verificar se o flashcard pertence ao usuário
    const flashcardCheck = await query(
      'SELECT id FROM flashcards WHERE id = $1 AND user_id = $2',
      [flashcardId, userId]
    );

    if (flashcardCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Flashcard não encontrado',
        code: 'FLASHCARD_NOT_FOUND'
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

    // Construir query de atualização
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (subject_id !== undefined) {
      updateFields.push(`subject_id = $${paramCount++}`);
      updateValues.push(subject_id);
    }

    if (front_content !== undefined) {
      updateFields.push(`front_content = $${paramCount++}`);
      updateValues.push(front_content);
    }

    if (back_content !== undefined) {
      updateFields.push(`back_content = $${paramCount++}`);
      updateValues.push(back_content);
    }

    if (tags !== undefined) {
      updateFields.push(`tags = $${paramCount++}`);
      updateValues.push(JSON.stringify(tags));
    }

    if (difficulty !== undefined) {
      updateFields.push(`difficulty = $${paramCount++}`);
      updateValues.push(difficulty);
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(status);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(flashcardId, userId);

    const result = await query(
      `UPDATE flashcards SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`,
      updateValues
    );

    // Buscar dados da matéria para resposta
    const subjectResult = await query(
      'SELECT name, color FROM subjects WHERE id = $1',
      [result.rows[0].subject_id]
    );

    const flashcard = {
      ...result.rows[0],
      subject_name: subjectResult.rows[0].name,
      subject_color: subjectResult.rows[0].color
    };

    res.json({
      message: 'Flashcard atualizado com sucesso',
      flashcard
    });

  } catch (error) {
    console.error('Erro ao atualizar flashcard:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Deletar flashcard
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const flashcardId = req.params.id;

    const result = await query(
      'DELETE FROM flashcards WHERE id = $1 AND user_id = $2 RETURNING id',
      [flashcardId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Flashcard não encontrado',
        code: 'FLASHCARD_NOT_FOUND'
      });
    }

    res.json({
      message: 'Flashcard deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar flashcard:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Revisar flashcard (SRS - Spaced Repetition System)
router.put('/:id/review', async (req, res) => {
  try {
    const userId = req.user.id;
    const flashcardId = req.params.id;
    const { rating } = req.body; // 1-5 (1=muito difícil, 5=muito fácil)

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating deve ser entre 1 e 5',
        code: 'INVALID_RATING'
      });
    }

    // Verificar se o flashcard pertence ao usuário
    const flashcardCheck = await query(
      'SELECT * FROM flashcards WHERE id = $1 AND user_id = $2',
      [flashcardId, userId]
    );

    if (flashcardCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Flashcard não encontrado',
        code: 'FLASHCARD_NOT_FOUND'
      });
    }

    const flashcard = flashcardCheck.rows[0];

    // Calcular novo intervalo baseado no rating (SRS)
    let newInterval;
    let newEaseFactor = flashcard.ease_factor || 2.5;

    if (rating >= 3) {
      // Resposta correta
      if (flashcard.interval === 0) {
        newInterval = 1;
      } else if (flashcard.interval === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(flashcard.interval * newEaseFactor);
      }
      
      // Ajustar ease factor
      newEaseFactor = Math.max(1.3, newEaseFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
    } else {
      // Resposta incorreta
      newInterval = 1;
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
    }

    // Calcular próxima data de revisão
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    // Atualizar flashcard
    const result = await query(
      `UPDATE flashcards 
       SET interval = $1, 
           ease_factor = $2, 
           next_review = $3,
           review_count = review_count + 1,
           last_reviewed = NOW(),
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [newInterval, newEaseFactor, nextReview, flashcardId, userId]
    );

    // Registrar revisão
    await query(
      `INSERT INTO flashcard_reviews (flashcard_id, user_id, rating, interval, ease_factor, reviewed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [flashcardId, userId, rating, newInterval, newEaseFactor]
    );

    // Adicionar pontos de gamificação
    const points = rating >= 3 ? Math.floor(rating * 2) : 1; // 2-10 pontos para acertos, 1 para erros
    
    await query(
      `INSERT INTO gamification_log (user_id, activity_type, points_earned, description, created_at)
       VALUES ($1, 'flashcard_review', $2, $3, NOW())`,
      [userId, points, `Revisou flashcard: ${flashcard.front_content.substring(0, 50)}...`]
    );

    res.json({
      message: 'Flashcard revisado com sucesso',
      points_earned: points,
      next_review: nextReview,
      new_interval: newInterval,
      flashcard: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao revisar flashcard:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obter estatísticas dos flashcards
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject_id, period = 'month' } = req.query;

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

    let whereConditions = ['fr.user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (subject_id) {
      whereConditions.push(`fc.subject_id = $${++paramCount}`);
      queryParams.push(subject_id);
    }

    whereConditions.push(`fr.reviewed_at >= $${++paramCount}`);
    queryParams.push(startDateStr);

    // Estatísticas gerais
    const generalStats = await query(
      `SELECT 
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN fr.rating >= 3 THEN 1 END) as correct_reviews,
        COUNT(CASE WHEN fr.rating < 3 THEN 1 END) as incorrect_reviews,
        ROUND(AVG(fr.rating), 2) as avg_rating,
        ROUND(
          (COUNT(CASE WHEN fr.rating >= 3 THEN 1 END)::float / COUNT(*)) * 100, 2
        ) as accuracy_rate
       FROM flashcard_reviews fr
       LEFT JOIN flashcards fc ON fr.flashcard_id = fc.id
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    // Estatísticas por matéria
    const subjectStats = await query(
      `SELECT 
        s.name as subject_name,
        s.color as subject_color,
        COUNT(fr.id) as total_reviews,
        COUNT(CASE WHEN fr.rating >= 3 THEN 1 END) as correct_reviews,
        ROUND(AVG(fr.rating), 2) as avg_rating
       FROM flashcard_reviews fr
       LEFT JOIN flashcards fc ON fr.flashcard_id = fc.id
       LEFT JOIN subjects s ON fc.subject_id = s.id
       WHERE fr.user_id = $1 AND fr.reviewed_at >= $2
       GROUP BY s.id, s.name, s.color
       ORDER BY total_reviews DESC`,
      [userId, startDateStr]
    );

    // Estatísticas por dia
    const dailyStats = await query(
      `SELECT 
        DATE(fr.reviewed_at) as date,
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN fr.rating >= 3 THEN 1 END) as correct_reviews,
        ROUND(AVG(fr.rating), 2) as avg_rating
       FROM flashcard_reviews fr
       WHERE fr.user_id = $1 AND fr.reviewed_at >= $2
       GROUP BY DATE(fr.reviewed_at)
       ORDER BY date`,
      [userId, startDateStr]
    );

    // Flashcards que precisam de revisão
    const dueForReview = await query(
      `SELECT COUNT(*) as count
       FROM flashcards 
       WHERE user_id = $1 AND status = 'active' AND next_review <= NOW()`,
      [userId]
    );

    res.json({
      period,
      start_date: startDateStr,
      end_date: endDate,
      general_stats: generalStats.rows[0],
      subject_stats: subjectStats.rows,
      daily_stats: dailyStats.rows,
      due_for_review: parseInt(dueForReview.rows[0].count)
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas dos flashcards:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Importar flashcards em lote
router.post('/import', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject_id, flashcards } = req.body;

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return res.status(400).json({
        error: 'Lista de flashcards inválida',
        code: 'INVALID_FLASHCARDS'
      });
    }

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

    const createdFlashcards = [];

    for (const card of flashcards) {
      if (!card.front_content || !card.back_content) continue;

      const result = await query(
        `INSERT INTO flashcards (user_id, subject_id, front_content, back_content, tags, difficulty, status, next_review, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW(), NOW())
         RETURNING *`,
        [
          userId, 
          subject_id, 
          card.front_content, 
          card.back_content, 
          JSON.stringify(card.tags || []), 
          card.difficulty || 'medium'
        ]
      );

      createdFlashcards.push(result.rows[0]);
    }

    res.status(201).json({
      message: 'Flashcards importados com sucesso',
      imported_count: createdFlashcards.length,
      flashcards: createdFlashcards
    });

  } catch (error) {
    console.error('Erro ao importar flashcards:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router; 