#!/bin/bash

echo "🚀 Instalando a Plataforma de Gestão de Estudos ENEM..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm primeiro."
    exit 1
fi

echo "✅ Node.js e npm encontrados"

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do backend"
    exit 1
fi
cd ..

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do frontend"
    exit 1
fi
cd ..

echo "✅ Todas as dependências foram instaladas com sucesso!"

# Criar arquivo .env para o backend se não existir
if [ ! -f "server/.env" ]; then
    echo "🔧 Criando arquivo de configuração do backend..."
    cat > server/.env << EOF
# Configurações do Servidor
PORT=5000
NODE_ENV=development

# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=estudos_enem
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

# Configurações JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_REFRESH_SECRET=seu_refresh_secret_super_seguro_aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Configurações de Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_aqui

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de CORS
CORS_ORIGIN=http://localhost:3000
EOF
    echo "✅ Arquivo .env criado. Por favor, configure as variáveis de ambiente."
fi

# Criar arquivo .env para o frontend se não existir
if [ ! -f "client/.env" ]; then
    echo "🔧 Criando arquivo de configuração do frontend..."
    cat > client/.env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=Estudos ENEM
REACT_APP_VERSION=1.0.0
EOF
    echo "✅ Arquivo .env do frontend criado."
fi

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o banco de dados PostgreSQL"
echo "2. Edite o arquivo server/.env com suas configurações"
echo "3. Execute 'npm run dev' na raiz do projeto para iniciar"
echo ""
echo "📚 Para mais informações, consulte o README.md"
echo "" 