# 🔧 Guia de Solução de Problemas - Conectividade

## Problema: "Erro na comunicação com o servidor"

### 🔍 **Diagnóstico**

1. **Verifique o componente de teste de conexão** (canto inferior direito da tela)
2. **Abra o Console do navegador** (F12) e verifique os logs
3. **Teste a URL da API diretamente** no navegador

### 🛠️ **Soluções**

#### **1. Problema de CORS**
```
Erro: Access to fetch at 'https://studyenem-backend-production.up.railway.app/api/auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solução:**
- O backend precisa estar configurado para aceitar requisições do frontend
- Verifique se o Railway está rodando corretamente

#### **2. Servidor Offline**
```
Erro: ERR_NETWORK or ECONNABORTED
```

**Soluções:**
- Verifique se o Railway está ativo: https://railway.app/dashboard
- Reinicie o serviço no Railway
- Verifique os logs do Railway para erros

#### **3. URL da API Incorreta**
```
Erro: 404 Not Found
```

**Solução:**
- Verifique se a URL está correta: `https://studyenem-backend-production.up.railway.app/api`
- Confirme se o endpoint existe no backend

#### **4. Timeout de Conexão**
```
Erro: ECONNABORTED
```

**Solução:**
- Aumente o timeout no arquivo `client/src/config/api.js`
- Verifique sua conexão com a internet

### 🔧 **Configurações**

#### **Arquivo de Configuração da API**
```javascript
// client/src/config/api.js
const API_CONFIG = {
  BASE_URL: 'https://studyenem-backend-production.up.railway.app/api',
  TIMEOUT: 15000, // Aumentar se necessário
  // ...
};
```

#### **Variável de Ambiente (Opcional)**
Crie um arquivo `.env` na pasta `client/`:
```env
REACT_APP_API_URL=https://studyenem-backend-production.up.railway.app/api
```

### 🚀 **Testes**

#### **1. Teste Manual da API**
```bash
# Teste de conectividade básica
curl -X GET https://studyenem-backend-production.up.railway.app/api/health

# Teste de login
curl -X POST https://studyenem-backend-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

#### **2. Verificar Railway**
1. Acesse: https://railway.app/dashboard
2. Verifique se o serviço está "Running"
3. Clique em "View Logs" para ver erros
4. Verifique as variáveis de ambiente

#### **3. Verificar Supabase**
1. Acesse: https://supabase.com/dashboard
2. Verifique se o banco está ativo
3. Teste a conexão no SQL Editor

### 📱 **Modo Offline (Fallback)**

Se o servidor estiver offline, o sistema funciona com dados locais:

- **Flashcards**: Salvos no localStorage
- **Matérias**: Salvos no localStorage  
- **Cronograma**: Salvos no localStorage
- **Autenticação**: Não funciona offline

### 🔄 **Reinicialização**

#### **Frontend (Local)**
```bash
cd client
npm start
```

#### **Backend (Railway)**
1. Acesse Railway Dashboard
2. Clique em "Redeploy"
3. Aguarde o deploy completar

#### **Banco de Dados (Supabase)**
1. Acesse Supabase Dashboard
2. Verifique se as tabelas existem
3. Execute o script SQL se necessário

### 📞 **Suporte**

Se o problema persistir:

1. **Verifique os logs** no Console do navegador
2. **Teste a API** diretamente com curl ou Postman
3. **Verifique o status** do Railway e Supabase
4. **Consulte os logs** do Railway para erros específicos

### 🎯 **Checklist de Verificação**

- [ ] Railway está rodando
- [ ] Supabase está ativo
- [ ] URL da API está correta
- [ ] CORS está configurado
- [ ] Variáveis de ambiente estão corretas
- [ ] Internet está funcionando
- [ ] Firewall não está bloqueando
- [ ] DNS está resolvendo corretamente

### 🔍 **Logs Úteis**

#### **Console do Navegador**
```javascript
// Verificar URL da API
console.log('API URL:', process.env.REACT_APP_API_URL);

// Testar conexão
fetch('https://studyenem-backend-production.up.railway.app/api/health')
  .then(response => console.log('Status:', response.status))
  .catch(error => console.error('Erro:', error));
```

#### **Railway Logs**
Verifique se há erros como:
- Database connection failed
- Environment variables missing
- Port already in use
- Memory exceeded 