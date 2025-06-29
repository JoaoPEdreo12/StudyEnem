import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar se há um usuário logado ao carregar a aplicação
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await authService.refresh(token);
          const { user, accessToken } = response.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('user', JSON.stringify(user));
          
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user },
          });
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          dispatch({
            type: 'AUTH_FAILURE',
            payload: 'Sessão expirada. Faça login novamente.',
          });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.login(credentials);
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user },
      });

      toast.success('Login realizado com sucesso!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer login';
      dispatch({
        type: 'AUTH_FAILURE',
        payload: message,
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.register(userData);
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user },
      });

      toast.success('Conta criada com sucesso!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao criar conta';
      dispatch({
        type: 'AUTH_FAILURE',
        payload: message,
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      dispatch({ type: 'AUTH_LOGOUT' });
      toast.success('Logout realizado com sucesso!');
    }
  };

  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData,
    });
    
    // Atualizar dados no localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 