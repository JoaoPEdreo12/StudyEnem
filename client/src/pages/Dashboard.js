import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Calendar, BookOpen, CheckCircle, Trophy, Plus, ArrowRight } from 'lucide-react';
import { userService, scheduleService } from '../services/api';
import DashboardStats from '../components/Dashboard/DashboardStats';
import Layout from '../components/Layout/Layout';

const Dashboard = () => {
  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  // Buscar dados do dashboard
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'dashboard',
    userService.getDashboard,
    {
      refetchInterval: 300000, // 5 minutos
    }
  );

  // Buscar estatísticas do usuário
  const { data: userStats, isLoading: statsLoading } = useQuery(
    'userStats',
    userService.getStats,
    {
      refetchInterval: 600000, // 10 minutos
    }
  );

  // Buscar tarefas de hoje
  const { data: todayTasks, isLoading: tasksLoading } = useQuery(
    'todayTasks',
    scheduleService.getToday,
    {
      refetchInterval: 300000, // 5 minutos
    }
  );

  useEffect(() => {
    if (todayTasks?.data) {
      const tasks = todayTasks.data;
      setRecentTasks(tasks.filter(task => task.completed).slice(0, 5));
      setUpcomingTasks(tasks.filter(task => !task.completed).slice(0, 5));
    }
  }, [todayTasks]);

  const QuickAction = ({ title, description, icon: Icon, color, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center p-4 bg-white rounded-xl shadow-soft border border-gray-100 hover:shadow-medium transition-all duration-200"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} mr-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-left">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </motion.button>
  );

  const TaskItem = ({ task, type = 'upcoming' }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-soft transition-all duration-200"
    >
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-3 ${
          type === 'completed' ? 'bg-success-500' : 'bg-warning-500'
        }`} />
        <div>
          <h4 className="font-medium text-gray-900">{task.title}</h4>
          <p className="text-sm text-gray-600">{task.subject}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">
          {task.duration} min
        </span>
        {type === 'upcoming' && (
          <button className="p-1 text-success-600 hover:bg-success-50 rounded">
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );

  if (dashboardLoading || statsLoading || tasksLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Olá, {dashboardData?.data?.user?.name || 'Estudante'}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Vamos continuar seus estudos. Aqui está seu progresso de hoje.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </motion.button>
        </motion.div>

        {/* Statistics Cards */}
        <DashboardStats stats={userStats?.data} />

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction
              title="Criar Tarefa"
              description="Adicionar nova atividade"
              icon={Plus}
              color="bg-blue-500"
              onClick={() => {/* Navegar para criar tarefa */}}
            />
            <QuickAction
              title="Revisar Flashcards"
              description="15 cards pendentes"
              icon={BookOpen}
              color="bg-purple-500"
              onClick={() => {/* Navegar para flashcards */}}
            />
            <QuickAction
              title="Ver Cronograma"
              description="Planejar semana"
              icon={Calendar}
              color="bg-green-500"
              onClick={() => {/* Navegar para cronograma */}}
            />
            <QuickAction
              title="Conquistas"
              description="Ver progresso"
              icon={Trophy}
              color="bg-yellow-500"
              onClick={() => {/* Navegar para gamificação */}}
            />
          </div>
        </motion.div>

        {/* Today's Tasks and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Tarefas de Hoje
              </h2>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                Ver todas
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="space-y-3">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task, index) => (
                  <TaskItem key={task.id || index} task={task} type="upcoming" />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma tarefa para hoje</p>
                  <p className="text-sm">Que tal criar uma nova atividade?</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Atividade Recente
              </h2>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                Ver histórico
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="space-y-3">
              {recentTasks.length > 0 ? (
                recentTasks.map((task, index) => (
                  <TaskItem key={task.id || index} task={task} type="completed" />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma atividade recente</p>
                  <p className="text-sm">Complete suas primeiras tarefas!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Weekly Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-soft border border-gray-100 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Progresso Semanal
          </h2>
          
          <div className="grid grid-cols-7 gap-4">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, index) => {
              const progress = Math.floor(Math.random() * 100);
              return (
                <div key={day} className="text-center">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    {day}
                  </div>
                  <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-primary-500 to-primary-600 transition-all duration-300"
                      style={{ height: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {progress}%
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Dashboard; 