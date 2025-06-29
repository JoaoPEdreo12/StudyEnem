import React, { useState, useEffect } from 'react';
import { testConnection } from '../services/api';
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    setErrorDetails(null);
    
    try {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'failed');
      setLastCheck(new Date());
    } catch (error) {
      setConnectionStatus('failed');
      setErrorDetails({
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Conectado ao servidor';
      case 'failed':
        return 'Erro na conexão';
      case 'checking':
        return 'Verificando conexão...';
      default:
        return 'Status desconhecido';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'checking':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`p-4 rounded-lg border shadow-lg max-w-sm ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          <button
            onClick={checkConnection}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title="Testar conexão novamente"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        {lastCheck && (
          <p className="text-xs opacity-75 mb-2">
            Última verificação: {lastCheck.toLocaleTimeString()}
          </p>
        )}

        {errorDetails && (
          <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
            <p><strong>Erro:</strong> {errorDetails.message}</p>
            {errorDetails.code && <p><strong>Código:</strong> {errorDetails.code}</p>}
            {errorDetails.status && (
              <p><strong>Status:</strong> {errorDetails.status} - {errorDetails.statusText}</p>
            )}
          </div>
        )}

        <div className="mt-2 text-xs opacity-75">
          <p>API: {process.env.REACT_APP_API_URL || 'https://studyenem-backend-production.up.railway.app/api'}</p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest; 