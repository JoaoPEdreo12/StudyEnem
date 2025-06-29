import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, BookOpen, Play, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Flashcards = () => {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studySession, setStudySession] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    skipped: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    subject: '',
    difficulty: 'medium',
    tags: [],
    hint: '',
    explanation: ''
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

  const difficulties = [
    { value: 'easy', label: 'Fácil', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'hard', label: 'Difícil', color: 'bg-red-100 text-red-800' }
  ];

  // Load flashcards from localStorage
  useEffect(() => {
    const savedCards = localStorage.getItem(`flashcards_${user?.id}`);
    if (savedCards) {
      setFlashcards(JSON.parse(savedCards));
    } else {
      // Default flashcards
      const defaultCards = [
        {
          id: '1',
          question: 'Qual é a fórmula da área de um círculo?',
          answer: 'A = πr²',
          subject: 'matematica',
          difficulty: 'medium',
          tags: ['geometria', 'área', 'círculo'],
          hint: 'Pense no raio ao quadrado',
          explanation: 'A área de um círculo é calculada multiplicando π pelo raio ao quadrado.',
          createdAt: new Date().toISOString(),
          lastReviewed: null,
          nextReview: new Date().toISOString(),
          reviewCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          easeFactor: 2.5,
          interval: 1
        },
        {
          id: '2',
          question: 'O que é uma oração subordinada?',
          answer: 'Uma oração que depende sintaticamente de outra oração principal.',
          subject: 'portugues',
          difficulty: 'medium',
          tags: ['gramática', 'sintaxe', 'oração'],
          hint: 'Pense na dependência entre orações',
          explanation: 'A oração subordinada não tem sentido completo sozinha e depende da oração principal.',
          createdAt: new Date().toISOString(),
          lastReviewed: null,
          nextReview: new Date().toISOString(),
          reviewCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          easeFactor: 2.5,
          interval: 1
        },
        {
          id: '3',
          question: 'Em que ano o Brasil se tornou independente?',
          answer: '1822',
          subject: 'historia',
          difficulty: 'easy',
          tags: ['história do Brasil', 'independência'],
          hint: 'Pense no século XIX',
          explanation: 'A independência do Brasil foi proclamada por Dom Pedro I em 7 de setembro de 1822.',
          createdAt: new Date().toISOString(),
          lastReviewed: null,
          nextReview: new Date().toISOString(),
          reviewCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          easeFactor: 2.5,
          interval: 1
        }
      ];
      setFlashcards(defaultCards);
    }
  }, [user]);

  // Save flashcards to localStorage
  useEffect(() => {
    if (user && flashcards.length > 0) {
      localStorage.setItem(`flashcards_${user.id}`, JSON.stringify(flashcards));
    }
  }, [flashcards, user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newCard = {
      id: editingCard ? editingCard.id : Date.now().toString(),
      ...formData,
      createdAt: editingCard ? editingCard.createdAt : new Date().toISOString(),
      lastReviewed: editingCard ? editingCard.lastReviewed : null,
      nextReview: editingCard ? editingCard.nextReview : new Date().toISOString(),
      reviewCount: editingCard ? editingCard.reviewCount : 0,
      correctCount: editingCard ? editingCard.correctCount : 0,
      incorrectCount: editingCard ? editingCard.incorrectCount : 0,
      easeFactor: editingCard ? editingCard.easeFactor : 2.5,
      interval: editingCard ? editingCard.interval : 1
    };

    if (editingCard) {
      setFlashcards(flashcards.map(card => 
        card.id === editingCard.id ? newCard : card
      ));
    } else {
      setFlashcards([...flashcards, newCard]);
    }

    setShowModal(false);
    setEditingCard(null);
    setFormData({
      question: '',
      answer: '',
      subject: '',
      difficulty: 'medium',
      tags: [],
      hint: '',
      explanation: ''
    });
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setFormData({
      question: card.question,
      answer: card.answer,
      subject: card.subject,
      difficulty: card.difficulty,
      tags: card.tags || [],
      hint: card.hint || '',
      explanation: card.explanation || ''
    });
    setShowModal(true);
  };

  const handleDelete = (cardId) => {
    if (window.confirm('Tem certeza que deseja excluir este flashcard?')) {
      setFlashcards(flashcards.filter(card => card.id !== cardId));
    }
  };

  const filteredCards = flashcards.filter(card => {
    const matchesSearch = card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || card.subject === selectedSubject;
    const matchesFilter = filter === 'all' || card.difficulty === filter;
    
    return matchesSearch && matchesSubject && matchesFilter;
  });

  const getStats = () => {
    const totalCards = flashcards.length;
    const totalReviews = flashcards.reduce((sum, card) => sum + card.reviewCount, 0);
    const totalCorrect = flashcards.reduce((sum, card) => sum + card.correctCount, 0);
    const totalIncorrect = flashcards.reduce((sum, card) => sum + card.incorrectCount, 0);
    const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
    const dueForReview = flashcards.filter(card => new Date(card.nextReview) <= new Date()).length;

    return {
      totalCards,
      totalReviews,
      totalCorrect,
      totalIncorrect,
      accuracy,
      dueForReview
    };
  };

  const stats = getStats();

  // Study mode functions
  const startStudySession = () => {
    setStudyMode(true);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setStudySession({
      total: filteredCards.length,
      correct: 0,
      incorrect: 0,
      skipped: 0
    });
  };

  const endStudySession = () => {
    setStudyMode(false);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const handleCardResponse = (response) => {
    const currentCard = filteredCards[currentCardIndex];
    
    // Update card statistics
    const updatedCard = {
      ...currentCard,
      reviewCount: currentCard.reviewCount + 1,
      lastReviewed: new Date().toISOString(),
      correctCount: response === 'correct' ? currentCard.correctCount + 1 : currentCard.correctCount,
      incorrectCount: response === 'incorrect' ? currentCard.incorrectCount + 1 : currentCard.incorrectCount
    };

    // Calculate next review date using spaced repetition
    const newEaseFactor = response === 'correct' 
      ? Math.max(1.3, currentCard.easeFactor + 0.1)
      : Math.max(1.3, currentCard.easeFactor - 0.2);
    
    const newInterval = response === 'correct' 
      ? Math.round(currentCard.interval * newEaseFactor)
      : 1;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    updatedCard.easeFactor = newEaseFactor;
    updatedCard.interval = newInterval;
    updatedCard.nextReview = nextReview.toISOString();

    setFlashcards(flashcards.map(card => 
      card.id === currentCard.id ? updatedCard : card
    ));

    // Update study session
    setStudySession(prev => ({
      ...prev,
      [response]: prev[response] + 1
    }));

    // Move to next card
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      endStudySession();
    }
  };

  const shuffleCards = () => {
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
  };

  if (studyMode) {
    const currentCard = filteredCards[currentCardIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Study Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Modo de Estudo</h2>
                <p className="text-gray-600">Card {currentCardIndex + 1} de {filteredCards.length}</p>
              </div>
              <button
                onClick={endStudySession}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentCardIndex + 1) / filteredCards.length) * 100}%` }}
              ></div>
            </div>

            {/* Stats */}
            <div className="flex justify-between text-sm text-gray-600">
              <span>✅ {studySession.correct}</span>
              <span>❌ {studySession.incorrect}</span>
              <span>⏭️ {studySession.skipped}</span>
            </div>
          </div>

          {/* Flashcard */}
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-lg p-8 mb-6"
          >
            {/* Subject Tag */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-xs text-white ${subjects.find(s => s.id === currentCard.subject)?.color}`}>
                {subjects.find(s => s.id === currentCard.subject)?.name}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs ${difficulties.find(d => d.value === currentCard.difficulty)?.color}`}>
                {difficulties.find(d => d.value === currentCard.difficulty)?.label}
              </span>
            </div>

            {/* Question */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Pergunta:</h3>
              <p className="text-xl text-gray-900 leading-relaxed">{currentCard.question}</p>
            </div>

            {/* Hint */}
            {currentCard.hint && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center text-yellow-800">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Dica:</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">{currentCard.hint}</p>
              </div>
            )}

            {/* Answer */}
            <AnimatePresence>
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Resposta:</h3>
                  <p className="text-xl text-gray-900 leading-relaxed mb-4">{currentCard.answer}</p>
                  
                  {currentCard.explanation && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center text-blue-800 mb-2">
                        <Brain className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Explicação:</span>
                      </div>
                      <p className="text-sm text-blue-700">{currentCard.explanation}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              {!showAnswer ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAnswer(true)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Ver Resposta
                </motion.button>
              ) : (
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCardResponse('incorrect')}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                  >
                    ❌ Errei
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCardResponse('skipped')}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
                  >
                    ⏭️ Pular
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCardResponse('correct')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    ✅ Acertei
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
            <p className="text-gray-600">Sistema de revisão espaçada para memorização eficiente</p>
          </div>
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={shuffleCards}
              className="bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center"
            >
              <Shuffle className="w-5 h-5 mr-2" />
              Embaralhar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startStudySession}
              disabled={filteredCards.length === 0}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5 mr-2" />
              Estudar ({filteredCards.length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Card
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total de Cards</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCards}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Para Revisar</p>
                <p className="text-2xl font-bold text-gray-900">{stats.dueForReview}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total de Revisões</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Acertos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCorrect}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Erros</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalIncorrect}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Precisão</p>
                <p className="text-2xl font-bold text-gray-900">{stats.accuracy}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar flashcards..."
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
        </div>
      </div>

      {/* Flashcards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card) => {
          const isDueForReview = new Date(card.nextReview) <= new Date();
          const accuracy = card.reviewCount > 0 ? Math.round((card.correctCount / card.reviewCount) * 100) : 0;
          
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${
                isDueForReview ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${subjects.find(s => s.id === card.subject)?.color}`}>
                      {subjects.find(s => s.id === card.subject)?.name}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${difficulties.find(d => d.value === card.difficulty)?.color}`}>
                      {difficulties.find(d => d.value === card.difficulty)?.label}
                    </span>
                  </div>
                  <div className="relative">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden">
                      <button
                        onClick={() => handleEdit(card)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Question Preview */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Pergunta:</h3>
                  <p className="text-gray-700 line-clamp-3">{card.question}</p>
                </div>

                {/* Answer Preview */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Resposta:</h3>
                  <p className="text-gray-700 line-clamp-2">{card.answer}</p>
                </div>

                {/* Tags */}
                {card.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {card.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {card.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{card.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <span>📊 {card.reviewCount} revisões</span>
                    <span>🎯 {accuracy}% acerto</span>
                  </div>
                  {isDueForReview && (
                    <span className="text-yellow-600 font-medium">⚠️ Para revisar</span>
                  )}
                </div>

                {/* Next Review */}
                <div className="text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>
                      Próxima revisão: {new Date(card.nextReview).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum flashcard encontrado</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filter !== 'all' || selectedSubject !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Crie seu primeiro flashcard para começar a estudar'
            }
          </p>
          {!searchTerm && filter === 'all' && selectedSubject === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              Criar Primeiro Card
            </button>
          )}
        </div>
      )}

      {/* Flashcard Modal */}
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
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {editingCard ? 'Editar Flashcard' : 'Novo Flashcard'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Question */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pergunta *
                    </label>
                    <textarea
                      name="question"
                      value={formData.question}
                      onChange={(e) => setFormData({...formData, question: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Answer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resposta *
                    </label>
                    <textarea
                      name="answer"
                      value={formData.answer}
                      onChange={(e) => setFormData({...formData, answer: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Subject and Difficulty */}
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  {/* Hint */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dica (opcional)
                    </label>
                    <input
                      type="text"
                      name="hint"
                      value={formData.hint}
                      onChange={(e) => setFormData({...formData, hint: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Uma dica para ajudar na resposta"
                    />
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Explicação (opcional)
                    </label>
                    <textarea
                      name="explanation"
                      value={formData.explanation}
                      onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Explicação detalhada da resposta"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingCard(null);
                        setFormData({
                          question: '',
                          answer: '',
                          subject: '',
                          difficulty: 'medium',
                          tags: [],
                          hint: '',
                          explanation: ''
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
                      {editingCard ? 'Atualizar' : 'Criar'}
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

export default Flashcards; 