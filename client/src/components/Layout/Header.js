import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Search,
  Plus,
  Settings,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Quick Actions */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </motion.button>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </motion.button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
              >
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <p className="text-sm font-medium text-gray-900">
                      Nova tarefa disponível
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Matemática - Álgebra Linear
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Há 5 minutos
                    </p>
                  </div>
                  <div className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <p className="text-sm font-medium text-gray-900">
                      Flashcard para revisão
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      15 flashcards aguardando revisão
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Há 1 hora
                    </p>
                  </div>
                  <div className="p-4 hover:bg-gray-50 cursor-pointer">
                    <p className="text-sm font-medium text-gray-900">
                      Conquista desbloqueada!
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      "Estudioso Dedicado" - 7 dias seguidos
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Há 2 horas
                    </p>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200">
                  <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Ver todas as notificações
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden md:block text-sm font-medium">
                {user?.name || 'Usuário'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </motion.button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
              >
                <div className="p-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email}
                  </p>
                </div>
                <div className="py-2">
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    <User className="w-4 h-4 mr-3" />
                    Perfil
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    <Settings className="w-4 h-4 mr-3" />
                    Configurações
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sair
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(isProfileOpen || isNotificationsOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileOpen(false);
            setIsNotificationsOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header; 