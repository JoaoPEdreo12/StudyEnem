import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, Calendar, Search, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Schedule = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    done: []
  });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    priority: 'medium',
    dueDate: '',
    estimatedTime: '',
    tags: []
  });

  // Mock subjects
  const subjects = [
    { id: 'matematica', name: 'Matemática', color: 'bg-red-500' },
    { id: 'portugues', name: 'Português', color: 'bg-blue-500' },
    { id: 'historia', name: 'História', color: 'bg-green-500' },
    { id: 'geografia', name: 'Geografia', color: 'bg-yellow-500' },
    { id: 'biologia', name: 'Biologia', color: 'bg-purple-500' },
    { id: 'fisica', name: 'Física', color: 'bg-indigo-500' },
    { id: 'quimica', name: 'Química', color: 'bg-pink-500' },
    { id: 'ingles', name: 'Inglês', color: 'bg-orange-500' }
  ];

  const priorities = [
    { value: 'low', label: 'Baixa', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800' }
  ];

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem(`tasks_${user?.id}`);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, [user]);

  // Save tasks to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`tasks_${user.id}`, JSON.stringify(tasks));
    }
  }, [tasks, user]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    if (sourceColumn === destColumn) {
      const column = tasks[sourceColumn];
      const newColumn = Array.from(column);
      const [removed] = newColumn.splice(source.index, 1);
      newColumn.splice(destination.index, 0, removed);

      setTasks({
        ...tasks,
        [sourceColumn]: newColumn
      });
    } else {
      const sourceColumnTasks = Array.from(tasks[sourceColumn]);
      const destColumnTasks = Array.from(tasks[destColumn]);
      const [removed] = sourceColumnTasks.splice(source.index, 1);
      destColumnTasks.splice(destination.index, 0, removed);

      setTasks({
        ...tasks,
        [sourceColumn]: sourceColumnTasks,
        [destColumn]: destColumnTasks
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newTask = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
      status: editingTask ? editingTask.status : 'todo',
      completed: false
    };

    if (editingTask) {
      // Update existing task
      const updatedTasks = { ...tasks };
      Object.keys(updatedTasks).forEach(column => {
        updatedTasks[column] = updatedTasks[column].map(task =>
          task.id === editingTask.id ? { ...task, ...formData } : task
        );
      });
      setTasks(updatedTasks);
    } else {
      // Add new task
      setTasks({
        ...tasks,
        todo: [...tasks.todo, newTask]
      });
    }

    setShowModal(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      subject: '',
      priority: 'medium',
      dueDate: '',
      estimatedTime: '',
      tags: []
    });
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      subject: task.subject,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedTime: task.estimatedTime,
      tags: task.tags || []
    });
    setShowModal(true);
  };

  const handleDelete = (taskId) => {
    const updatedTasks = { ...tasks };
    Object.keys(updatedTasks).forEach(column => {
      updatedTasks[column] = updatedTasks[column].filter(task => task.id !== taskId);
    });
    setTasks(updatedTasks);
  };

  const handleToggleComplete = (taskId) => {
    const updatedTasks = { ...tasks };
    Object.keys(updatedTasks).forEach(column => {
      updatedTasks[column] = updatedTasks[column].map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
    });
    setTasks(updatedTasks);
  };

  const filteredTasks = (columnTasks) => {
    return columnTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || task.subject === selectedSubject;
      const matchesFilter = filter === 'all' || 
                           (filter === 'completed' && task.completed) ||
                           (filter === 'pending' && !task.completed);
      
      return matchesSearch && matchesSubject && matchesFilter;
    });
  };

  const getColumnStats = (column) => {
    const columnTasks = tasks[column] || [];
    const total = columnTasks.length;
    const completed = columnTasks.filter(task => task.completed).length;
    const overdue = columnTasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      return new Date(task.dueDate) < new Date();
    }).length;

    return { total, completed, overdue };
  };

  const columns = [
    { id: 'todo', title: 'A Fazer', color: 'bg-gray-100', textColor: 'text-gray-700' },
    { id: 'inProgress', title: 'Em Progresso', color: 'bg-blue-100', textColor: 'text-blue-700' },
    { id: 'done', title: 'Concluído', color: 'bg-green-100', textColor: 'text-green-700' }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cronograma de Estudos</h1>
            <p className="text-gray-600">Organize suas tarefas e mantenha o foco nos estudos</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Tarefa
          </motion.button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as matérias</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as tarefas</option>
              <option value="pending">Pendentes</option>
              <option value="completed">Concluídas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map(column => {
            const stats = getColumnStats(column.id);
            return (
              <div key={column.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Column Header */}
                <div className={`p-4 ${column.color} rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${column.textColor}`}>
                      {column.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{stats.total}</span>
                      {stats.overdue > 0 && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          {stats.overdue} atrasadas
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 min-h-96 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                    >
                      <AnimatePresence>
                        {filteredTasks(tasks[column.id] || []).map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <motion.div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`mb-3 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
                                  snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                } ${task.completed ? 'opacity-75' : ''}`}
                              >
                                {/* Task Header */}
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleToggleComplete(task.id)}
                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        task.completed 
                                          ? 'bg-green-500 border-green-500 text-white' 
                                          : 'border-gray-300 hover:border-green-500'
                                      }`}
                                    >
                                      {task.completed && <CheckCircle className="w-3 h-3" />}
                                    </button>
                                    <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                      {task.title}
                                    </h4>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {task.priority === 'high' && <Star className="w-4 h-4 text-red-500 fill-current" />}
                                    <div className="relative">
                                      <button className="p-1 hover:bg-gray-100 rounded">
                                        <MoreVertical className="w-4 h-4 text-gray-400" />
                                      </button>
                                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden">
                                        <button
                                          onClick={() => handleEdit(task)}
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                                        >
                                          <Edit className="w-4 h-4 mr-2" />
                                          Editar
                                        </button>
                                        <button
                                          onClick={() => handleDelete(task.id)}
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Excluir
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Task Description */}
                                {task.description && (
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                {/* Task Meta */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center space-x-3">
                                    {task.subject && (
                                      <div className="flex items-center space-x-1">
                                        <div className={`w-3 h-3 rounded-full ${subjects.find(s => s.id === task.subject)?.color || 'bg-gray-400'}`}></div>
                                        <span>{subjects.find(s => s.id === task.subject)?.name}</span>
                                      </div>
                                    )}
                                    {task.dueDate && (
                                      <div className="flex items-center space-x-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                                      </div>
                                    )}
                                  </div>
                                  {task.priority && (
                                    <span className={`px-2 py-1 rounded-full text-xs ${priorities.find(p => p.value === task.priority)?.color}`}>
                                      {priorities.find(p => p.value === task.priority)?.label}
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </Draggable>
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Modal */}
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
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
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

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matéria
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma matéria</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
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

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Entrega
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Estimated Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tempo Estimado (horas)
                    </label>
                    <input
                      type="number"
                      name="estimatedTime"
                      value={formData.estimatedTime}
                      onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})}
                      min="0"
                      step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingTask(null);
                        setFormData({
                          title: '',
                          description: '',
                          subject: '',
                          priority: 'medium',
                          dueDate: '',
                          estimatedTime: '',
                          tags: []
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
                      {editingTask ? 'Atualizar' : 'Criar'}
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

export default Schedule; 