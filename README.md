# 🎓 Plataforma de Estudos ENEM e Vestibular

Uma plataforma completa e moderna para estudantes se prepararem para ENEM e vestibulares, com recursos de gamificação, flashcards inteligentes, cronogramas personalizados e muito mais.

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js** com Express
- **PostgreSQL** (Supabase)
- **JWT** para autenticação
- **Nodemailer** para emails
- **Bcrypt** para criptografia

### Frontend
- **React** com Hooks
- **Tailwind CSS** para estilização
- **React Router** para navegação
- **Axios** para requisições HTTP
- **React Icons** para ícones

## 📋 Funcionalidades

### Para Estudantes
- ✅ **Autenticação segura** com JWT
- ✅ **Dashboard personalizado** com estatísticas
- ✅ **Cronograma inteligente** de estudos
- ✅ **Gerenciamento de matérias** com prioridades
- ✅ **Flashcards com repetição espaçada**
- ✅ **Sistema de gamificação** com pontos e conquistas
- ✅ **Notificações** por email e push
- ✅ **Relatórios de progresso** semanais

### Para Professores/Admins
- ✅ **Painel administrativo** completo
- ✅ **Gestão de estudantes** e turmas
- ✅ **Relatórios detalhados** de performance
- ✅ **Criação de modelos** de cronograma
- ✅ **Notificações em massa**

## 🏗️ Estrutura do Projeto

```
New Project/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── contexts/      # Contextos React
│   │   └── services/      # Serviços de API
│   └── public/            # Arquivos estáticos
├── server/                # Backend Node.js
│   ├── routes/            # Rotas da API
│   ├── middleware/        # Middlewares
│   ├── config/           # Configurações
│   └── utils/            # Utilitários
└── supabase-setup.sql    # Script de setup do banco
```

## 🚀 Deploy na Nuvem

### Backend (Railway)
1. Acesse [Railway](https://railway.app/)
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Frontend (Vercel)
1. Acesse [Vercel](https://vercel.com/)
2. Conecte seu repositório GitHub
3. Configure a pasta `client` como diretório raiz
4. Configure as variáveis de ambiente:
   - `REACT_APP_API_URL` (URL do backend no Railway)

### Banco de Dados (Supabase)
- Já configurado e pronto para uso
- Execute o script `supabase-setup.sql` no SQL Editor

## 🛠️ Instalação Local

### Pré-requisitos
- Node.js 16+
- npm ou yarn
- Conta no Supabase

### Backend
```bash
cd server
npm install
cp .env.example .env
# Configure as variáveis no .env
npm run dev
```

### Frontend
```bash
cd client
npm install
cp .env.example .env
# Configure REACT_APP_API_URL no .env
npm start
```

## 📱 URLs de Acesso

- **Frontend:** https://seu-projeto.vercel.app
- **Backend:** https://seu-projeto.up.railway.app
- **Banco:** Supabase Dashboard

## 🔧 Variáveis de Ambiente

### Backend (.env)
```env
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=sua_chave_secreta
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://seu-backend.up.railway.app
```

## 📊 Status do Projeto

- ✅ Autenticação e autorização
- ✅ CRUD de usuários e perfis
- ✅ Sistema de matérias
- ✅ Cronograma de estudos
- ✅ Flashcards
- ✅ Gamificação
- ✅ Notificações
- ✅ Painel administrativo
- ✅ Deploy na nuvem

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido para ajudar estudantes a se prepararem melhor para ENEM e vestibulares.

---

**🎯 Objetivo:** Transformar a preparação para vestibulares em uma experiência gamificada e eficiente! 