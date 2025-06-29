-- Script de configuração do banco de dados para a Plataforma de Gestão de Estudos ENEM
-- Execute este script após criar o banco de dados PostgreSQL

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    avatar_url TEXT,
    bio TEXT,
    birth_date DATE,
    school VARCHAR(255),
    grade VARCHAR(50),
    target_exam VARCHAR(100),
    study_goal_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP WITH TIME ZONE
);

-- Tabela de refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT false
);

-- Tabela de matérias
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de subtemas
CREATE TABLE IF NOT EXISTS subtopics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de cronograma
CREATE TABLE IF NOT EXISTS schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    subtopic_id UUID REFERENCES subtopics(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de flashcards
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    tags TEXT[],
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    next_review TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    interval_days INTEGER DEFAULT 1,
    ease_factor DECIMAL(3,2) DEFAULT 2.5,
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de revisões de flashcards
CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    difficulty_rating INTEGER NOT NULL CHECK (difficulty_rating BETWEEN 1 AND 5),
    review_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    response_time_seconds INTEGER,
    is_correct BOOLEAN NOT NULL
);

-- Tabela de gamificação
CREATE TABLE IF NOT EXISTS gamification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_study_time_minutes INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    flashcards_reviewed INTEGER DEFAULT 0,
    achievements_unlocked INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de conquistas
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    category VARCHAR(50),
    points_reward INTEGER DEFAULT 0,
    requirements JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de conquistas do usuário
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações de notificação
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    daily_reminder BOOLEAN DEFAULT true,
    weekly_report BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    study_reminders BOOLEAN DEFAULT true,
    reminder_time TIME DEFAULT '08:00:00',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Tabela de sessões de estudo
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de estatísticas diárias
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    study_time_minutes INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    flashcards_reviewed INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    streak_maintained BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_subject_id ON subtopics(subject_id);
CREATE INDEX IF NOT EXISTS idx_schedule_user_id ON schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_start_time ON schedule(start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_status ON schedule(status);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard_id ON flashcard_reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_gamification_user_id ON gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subtopics_updated_at BEFORE UPDATE ON subtopics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_updated_at BEFORE UPDATE ON schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gamification_updated_at BEFORE UPDATE ON gamification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON daily_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir conquistas padrão
INSERT INTO achievements (name, description, icon, category, points_reward, requirements) VALUES
('Primeiro Passo', 'Complete sua primeira tarefa', '🎯', 'progress', 10, '{"tasks_completed": 1}'),
('Estudioso Dedicado', 'Mantenha uma sequência de 7 dias', '🔥', 'streak', 50, {"streak_days": 7}'),
('Maratonista', 'Mantenha uma sequência de 30 dias', '🏃', 'streak', 200, {"streak_days": 30}'),
('Flashcard Master', 'Revise 100 flashcards', '📚', 'flashcards', 100, {"flashcards_reviewed": 100}'),
('Tempo Bem Aproveitado', 'Estude por 10 horas', '⏰', 'study_time', 75, {"total_study_time_minutes": 600}'),
('Organizador', 'Crie 5 matérias', '📁', 'organization', 25, {"subjects_created": 5}'),
('Consistente', 'Complete tarefas por 5 dias seguidos', '📅', 'consistency', 40, {"consecutive_task_days": 5}'),
('Super Produtivo', 'Complete 10 tarefas em um dia', '⚡', 'productivity', 150, {"tasks_in_day": 10}'),
('Perfeccionista', 'Mantenha 100% de acerto em flashcards por uma semana', '💎', 'accuracy', 300, {"flashcard_accuracy_week": 100}'),
('Mestre dos Estudos', 'Alcance o nível 10', '👑', 'level', 500, {"level": 10})
ON CONFLICT DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Tabela principal de usuários da plataforma';
COMMENT ON TABLE subjects IS 'Matérias/disciplinas dos usuários';
COMMENT ON TABLE schedule IS 'Cronograma de estudos dos usuários';
COMMENT ON TABLE flashcards IS 'Sistema de flashcards com repetição espaçada';
COMMENT ON TABLE gamification IS 'Sistema de gamificação e progresso';
COMMENT ON TABLE achievements IS 'Conquistas disponíveis na plataforma';
COMMENT ON TABLE notifications IS 'Sistema de notificações';
COMMENT ON TABLE study_sessions IS 'Sessões de estudo registradas';
COMMENT ON TABLE daily_stats IS 'Estatísticas diárias dos usuários'; 