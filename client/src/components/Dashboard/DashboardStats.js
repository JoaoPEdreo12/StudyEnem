import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Trophy,
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, change, changeType }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-soft border border-gray-100 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  changeType === 'positive' ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {changeType === 'positive' ? '+' : ''}{change}
              </span>
              <TrendingUp
                className={`w-4 h-4 ml-1 ${
                  changeType === 'positive' ? 'text-success-600' : 'text-danger-600'
                }`}
              />
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

const DashboardStats = ({ stats }) => {
  const defaultStats = {
    totalSubjects: 8,
    completedTasks: 24,
    studyTime: '12h 30m',
    streak: 7,
    pendingTasks: 5,
    flashcardsDue: 15,
    achievements: 12,
    weeklyGoal: 85,
  };

  const data = stats || defaultStats;

  const statCards = [
    {
      title: 'Matérias Ativas',
      value: data.totalSubjects,
      icon: BookOpen,
      color: 'bg-blue-500',
      change: '+2',
      changeType: 'positive',
    },
    {
      title: 'Tarefas Concluídas',
      value: data.completedTasks,
      icon: CheckCircle,
      color: 'bg-success-500',
      change: '+8',
      changeType: 'positive',
    },
    {
      title: 'Tempo de Estudo',
      value: data.studyTime,
      icon: Clock,
      color: 'bg-purple-500',
      change: '+2h 15m',
      changeType: 'positive',
    },
    {
      title: 'Sequência Atual',
      value: `${data.streak} dias`,
      icon: Target,
      color: 'bg-orange-500',
      change: '+1',
      changeType: 'positive',
    },
    {
      title: 'Tarefas Pendentes',
      value: data.pendingTasks,
      icon: AlertCircle,
      color: 'bg-warning-500',
      change: '-3',
      changeType: 'positive',
    },
    {
      title: 'Flashcards para Revisar',
      value: data.flashcardsDue,
      icon: Calendar,
      color: 'bg-indigo-500',
      change: '+5',
      changeType: 'negative',
    },
    {
      title: 'Conquistas Desbloqueadas',
      value: data.achievements,
      icon: Trophy,
      color: 'bg-yellow-500',
      change: '+2',
      changeType: 'positive',
    },
    {
      title: 'Meta Semanal',
      value: `${data.weeklyGoal}%`,
      icon: TrendingUp,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'positive',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <StatCard {...card} />
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardStats; 