import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Edit, Trash2, Search, MoreVertical, Book, GraduationCap, Brain, Calculator, Globe, Leaf, Atom, TestTube, Languages, Clock, Target, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Subjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'BookOpen',
    difficulty: 'medium',
    priority: 'medium',
    targetHours: '',
    currentHours: '0',
    topics: []
  });

  // Available icons
  const availableIcons = [
    { name: 'BookOpen', icon: BookOpen, label: 'Livro' },
    { name: 'Calculator', icon: Calculator, label: 'Calculadora' },
    { name: 'Globe', icon: Globe, label: 'Globo' },
    { name: 'Leaf', icon: Leaf, label: 'Folha' },
    { name: 'Atom', icon: Atom, label: 'Átomo' },
    { name: 'TestTube', icon: TestTube, label: 'Tubo de Ensaio' },
    { name: 'Languages', icon: Languages, label: 'Idiomas' },
    { name: 'Brain', icon: Brain, label: 'Cérebro' },
    { name: 'GraduationCap', icon: GraduationCap, label: 'Capelo' },
    { name: 'Book', icon: Book, label: 'Livro Fechado' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Fácil', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'hard', label: 'Difícil', color: 'bg-red-100 text-red-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Média', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'Alta', color: 'bg-purple-100 text-purple-800' }
  ];

  // Load subjects from localStorage
  useEffect(() => {
    const savedSubjects = localStorage.getItem(`subjects_${user?.id}`);
    if (savedSubjects) {
      setSubjects(JSON.parse(savedSubjects));
    } else {
      // Default subjects
      const defaultSubjects = [
        {
          id: '1',
          name: 'Matemática',
          description: 'Álgebra, geometria, trigonometria e cálculo',
          color: '#EF4444',
          icon: 'Calculator',
          difficulty: 'hard',
          priority: 'high',
          targetHours: '120',
          currentHours: '45',
          topics: ['Álgebra', 'Geometria', 'Trigonometria', 'Cálculo'],
          createdAt: new Date().toISOString(),
          lastStudied: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Português',
          description: 'Gramática, literatura e interpretação de texto',
          color: '#3B82F6',
          icon: 'BookOpen',
          difficulty: 'medium',
          priority: 'high',
          targetHours: '80',
          currentHours: '32',
          topics: ['Gramática', 'Literatura', 'Interpretação', 'Redação'],
          createdAt: new Date().toISOString(),
          lastStudied: new Date().toISOString()
        },
        {
          id: '3',
          name: 'História',
          description: 'História do Brasil e história geral',
          color: '#10B981',
          icon: 'Globe',
          difficulty: 'medium',
          priority: 'medium',
          targetHours: '60',
          currentHours: '28',
          topics: ['História do Brasil', 'História Geral', 'História Contemporânea'],
          createdAt: new Date().toISOString(),
          lastStudied: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Geografia',
          description: 'Geografia física e humana',
          color: '#F59E0B',
          icon: 'Globe',
          difficulty: 'easy',
          priority: 'medium',
          targetHours: '50',
          currentHours: '18',
          topics: ['Geografia Física', 'Geografia Humana', 'Geografia do Brasil'],
          createdAt: new Date().toISOString(),
          lastStudied: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Biologia',
          description: 'Biologia celular, genética e ecologia',
          color: '#8B5CF6',
          icon: 'Leaf',
          difficulty: 'medium',
          priority: 'high',
          targetHours: '90',
          currentHours: '38',
          topics: ['Biologia Celular', 'Genética', 'Ecologia', 'Evolução'],
          createdAt: new Date().toISOString(),
          lastStudied: new Date().toISOString()
        },
        {
          id: '6',
          name: 'Física',
          description: 'Mecânica, termodinâmica e eletromagnetismo',
          color: '#6366F1',
          icon: 'Atom',
          difficulty: 'hard',
          priority: 'high',
          targetHours: '100',
          currentHours: '42',
          topics: ['Mecânica', 'Termodinâmica', 'Eletromagnetismo', 'Óptica'],
          createdAt: new Date().toISOString(),
          lastStudied: new Date().toISOString()
        }
      ];
      setSubjects(defaultSubjects);
    }
  }, [user]);

  // Save subjects to localStorage
  useEffect(() => {
    if (user && subjects.length > 0) {
      localStorage.setItem(`subjects_${user.id}`, JSON.stringify(subjects));
    }
  }, [subjects, user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newSubject = {
      id: editingSubject ? editingSubject.id : Date.now().toString(),
      ...formData,
      createdAt: editingSubject ? editingSubject.createdAt : new Date().toISOString(),
      lastStudied: editingSubject ? editingSubject.lastStudied : new Date().toISOString()
    };

    if (editingSubject) {
      setSubjects(subjects.map(subject => 
        subject.id === editingSubject.id ? newSubject : subject
      ));
    } else {
      setSubjects([...subjects, newSubject]);
    }

    setShowModal(false);
    setEditingSubject(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: 'BookOpen',
      difficulty: 'medium',
      priority: 'medium',
      targetHours: '',
      currentHours: '0',
      topics: []
    });
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description,
      color: subject.color,
      icon: subject.icon,
      difficulty: subject.difficulty,
      priority: subject.priority,
      targetHours: subject.targetHours,
      currentHours: subject.currentHours,
      topics: subject.topics || []
    });
    setShowModal(true);
  };

  const handleDelete = (subjectId) => {
    if (window.confirm('Tem certeza que deseja excluir esta matéria?')) {
      setSubjects(subjects.filter(subject => subject.id !== subjectId));
    }
  };

  const handleAddHours = (subjectId, hours) => {
    setSubjects(subjects.map(subject => {
      if (subject.id === subjectId) {
        return {
          ...subject,
          currentHours: (parseInt(subject.currentHours) + parseInt(hours)).toString(),
          lastStudied: new Date().toISOString()
        };
      }
      return subject;
    }));
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || subject.difficulty === filter;
    
    return matchesSearch && matchesFilter;
  });

  const getProgressPercentage = (current, target) => {
    return Math.min((parseInt(current) / parseInt(target)) * 100, 100);
  };

  const getIconComponent = (iconName) => {
    const iconObj = availableIcons.find(icon => icon.name === iconName);
    return iconObj ? iconObj.icon : BookOpen;
  };

  const getStats = () => {
    const totalSubjects = subjects.length;
    const totalTargetHours = subjects.reduce((sum, subject) => sum + parseInt(subject.targetHours || 0), 0);
    const totalCurrentHours = subjects.reduce((sum, subject) => sum + parseInt(subject.currentHours || 0), 0);
    const averageProgress = totalSubjects > 0 ? (totalCurrentHours / totalTargetHours) * 100 : 0;
    const highPrioritySubjects = subjects.filter(subject => subject.priority === 'high').length;

    return {
      totalSubjects,
      totalTargetHours,
      totalCurrentHours,
      averageProgress: Math.round(averageProgress),
      highPrioritySubjects
    };
  };

  const stats = getStats();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Matérias</h1>
            <p className="text-gray-600">Gerencie suas disciplinas e acompanhe o progresso</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Matéria
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total de Matérias</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Horas Estudadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCurrentHours}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Meta de Horas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTargetHours}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Progresso Geral</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageProgress}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Star className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Alta Prioridade</p>
                <p className="text-2xl font-bold text-gray-900">{stats.highPrioritySubjects}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar matérias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Difficulty Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas as dificuldades</option>
                <option value="easy">Fácil</option>
                <option value="medium">Médio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lista
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => {
            const IconComponent = getIconComponent(subject.icon);
            const progress = getProgressPercentage(subject.currentHours, subject.targetHours);
            
            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                {/* Subject Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: subject.color }}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                        <p className="text-sm text-gray-600">{subject.description}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: subject.color
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{subject.currentHours}h estudadas</span>
                      <span>Meta: {subject.targetHours}h</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${difficulties.find(d => d.value === subject.difficulty)?.color}`}>
                      {difficulties.find(d => d.value === subject.difficulty)?.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${priorities.find(p => p.value === subject.priority)?.color}`}>
                      {priorities.find(p => p.value === subject.priority)?.label}
                    </span>
                  </div>

                  {/* Topics */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Tópicos principais:</p>
                    <div className="flex flex-wrap gap-1">
                      {subject.topics.slice(0, 3).map((topic, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {topic}
                        </span>
                      ))}
                      {subject.topics.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{subject.topics.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddHours(subject.id, 1)}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                    >
                      +1h
                    </button>
                    <button
                      onClick={() => handleAddHours(subject.id, 2)}
                      className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors duration-200"
                    >
                      +2h
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matéria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progresso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dificuldade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Estudo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubjects.map((subject) => {
                  const IconComponent = getIconComponent(subject.icon);
                  const progress = getProgressPercentage(subject.currentHours, subject.targetHours);
                  
                  return (
                    <tr key={subject.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                            style={{ backgroundColor: subject.color }}
                          >
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                            <div className="text-sm text-gray-500">{subject.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="h-2 rounded-full"
                              style={{ 
                                width: `${progress}%`,
                                backgroundColor: subject.color
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{progress}%</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {subject.currentHours}h / {subject.targetHours}h
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${difficulties.find(d => d.value === subject.difficulty)?.color}`}>
                          {difficulties.find(d => d.value === subject.difficulty)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${priorities.find(p => p.value === subject.priority)?.color}`}>
                          {priorities.find(p => p.value === subject.priority)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(subject.lastStudied).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddHours(subject.id, 1)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            +1h
                          </button>
                          <button
                            onClick={() => handleEdit(subject)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(subject.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {editingSubject ? 'Editar Matéria' : 'Nova Matéria'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Matéria
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Color and Icon */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cor
                      </label>
                      <input
                        type="color"
                        name="color"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ícone
                      </label>
                      <select
                        name="icon"
                        value={formData.icon}
                        onChange={(e) => setFormData({...formData, icon: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {availableIcons.map(icon => (
                          <option key={icon.name} value={icon.name}>{icon.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Difficulty and Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dificuldade
                      </label>
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {difficulties.map(difficulty => (
                          <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prioridade
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>{priority.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Target Hours */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta de Horas de Estudo
                    </label>
                    <input
                      type="number"
                      name="targetHours"
                      value={formData.targetHours}
                      onChange={(e) => setFormData({...formData, targetHours: e.target.value})}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingSubject(null);
                        setFormData({
                          name: '',
                          description: '',
                          color: '#3B82F6',
                          icon: 'BookOpen',
                          difficulty: 'medium',
                          priority: 'medium',
                          targetHours: '',
                          currentHours: '0',
                          topics: []
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      {editingSubject ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Subjects; 