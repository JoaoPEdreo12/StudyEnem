import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Calendar,
  BookOpen,
  Cards,
  Trophy,
  Bell,
  Settings,
  BarChart3,
  Users,
  GraduationCap,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  {
    title: 'Dashboard',
    icon: Home,
    path: '/dashboard',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Cronograma',
    icon: Calendar,
    path: '/schedule',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Matérias',
    icon: BookOpen,
    path: '/subjects',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Flashcards',
    icon: Cards,
    path: '/flashcards',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    title: 'Gamificação',
    icon: Trophy,
    path: '/gamification',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    title: 'Notificações',
    icon: Bell,
    path: '/notifications',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    title: 'Relatórios',
    icon: BarChart3,
    path: '/reports',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
];

const adminMenuItems = [
  {
    title: 'Painel Admin',
    icon: GraduationCap,
    path: '/admin',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  {
    title: 'Estudantes',
    icon: Users,
    path: '/admin/students',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.role === 'teacher';

  const handleLogout = async () => {
    await logout();
  };

  const MenuItem = ({ item, isActive }) => {
    const Icon = item.icon;
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link
          to={item.path}
          className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            isActive
              ? `${item.bgColor} ${item.color} shadow-sm`
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
          onClick={() => setIsMobileOpen(false)}
        >
          <Icon className={`w-5 h-5 mr-3 ${isActive ? item.color : 'text-gray-400'}`} />
          <span>{item.title}</span>
        </Link>
      </motion.div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="ml-3 text-xl font-bold text-gray-900">
              Estudos ENEM
            </span>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <MenuItem
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
          />
        ))}
        
        {isAdmin && (
          <>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administração
              </h3>
            </div>
            <div className="space-y-2">
              {adminMenuItems.map((item) => (
                <MenuItem
                  key={item.path}
                  item={item}
                  isActive={location.pathname === item.path}
                />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 space-y-2">
          <Link
            to="/profile"
            className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
            onClick={() => setIsMobileOpen(false)}
          >
            <Settings className="w-4 h-4 mr-3" />
            {!isCollapsed && <span>Configurações</span>}
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg lg:hidden"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isMobileOpen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed left-0 top-0 z-50 h-full w-64 bg-white shadow-xl lg:hidden ${
          isMobileOpen ? 'block' : 'hidden'
        }`}
      >
        <SidebarContent />
      </motion.div>

      {/* Desktop sidebar */}
      <motion.div
        initial={{ width: 256 }}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden lg:block h-full bg-white border-r border-gray-200"
      >
        <SidebarContent />
      </motion.div>
    </>
  );
};

export default Sidebar; 