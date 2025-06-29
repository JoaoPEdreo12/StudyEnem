const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificar conexão
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erro na configuração de email:', error);
  } else {
    console.log('✅ Servidor de email configurado');
  }
});

// Email de boas-vindas
const sendWelcomeEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: `"Estudos ENEM" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎓 Bem-vindo à Plataforma de Estudos ENEM!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎓 Estudos ENEM</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Sua jornada para o sucesso começa agora!</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Olá, ${name}! 👋</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Seja bem-vindo à plataforma mais completa para gestão de estudos do ENEM e vestibulares!
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">🚀 O que você pode fazer:</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Criar cronogramas personalizados de estudos</li>
                <li>Acompanhar seu progresso com relatórios detalhados</li>
                <li>Usar flashcards inteligentes com repetição espaçada</li>
                <li>Ganhar pontos e conquistas através da gamificação</li>
                <li>Receber notificações inteligentes e motivacionais</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;">
                Começar Agora
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              Se você tiver alguma dúvida, não hesite em nos contatar.
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>© 2024 Estudos ENEM. Todos os direitos reservados.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de boas-vindas enviado para ${email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar email de boas-vindas:', error);
    throw error;
  }
};

// Email de notificação de estudo
const sendStudyReminder = async (email, name, schedule) => {
  try {
    const mailOptions = {
      from: `"Estudos ENEM" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '⏰ Lembrete de Estudo - Hora de Estudar!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">⏰ Hora de Estudar!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Mantenha o foco e alcance seus objetivos</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Olá, ${name}! 📚</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Chegou a hora do seu estudo programado. Não deixe essa oportunidade passar!
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
              <h3 style="color: #333; margin-top: 0;">📋 Sua agenda de hoje:</h3>
              <div style="color: #666; line-height: 1.8;">
                <p><strong>Matéria:</strong> ${schedule.subject}</p>
                <p><strong>Tópico:</strong> ${schedule.topic}</p>
                <p><strong>Duração:</strong> ${schedule.duration} minutos</p>
                <p><strong>Prioridade:</strong> ${schedule.priority}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/schedule" 
                 style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;">
                Ver Cronograma
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              Lembre-se: consistência é a chave do sucesso! 💪
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>© 2024 Estudos ENEM. Todos os direitos reservados.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Lembrete de estudo enviado para ${email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar lembrete de estudo:', error);
    throw error;
  }
};

// Email de conquista
const sendAchievementEmail = async (email, name, achievement) => {
  try {
    const mailOptions = {
      from: `"Estudos ENEM" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🏆 Nova Conquista Desbloqueada!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🏆 Parabéns!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Você conquistou uma nova medalha</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">${name}, você é incrível! 🎉</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #feca57;">
              <h3 style="color: #333; margin-top: 0;">🏅 Nova Conquista:</h3>
              <div style="text-align: center; margin: 20px 0;">
                <div style="font-size: 48px; margin-bottom: 10px;">${achievement.icon}</div>
                <h4 style="color: #333; margin: 10px 0;">${achievement.title}</h4>
                <p style="color: #666;">${achievement.description}</p>
                <p style="color: #feca57; font-weight: bold; font-size: 18px;">+${achievement.points} pontos</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/achievements" 
                 style="background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;">
                Ver Conquistas
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              Continue assim! Cada conquista te aproxima mais do seu objetivo! 🚀
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>© 2024 Estudos ENEM. Todos os direitos reservados.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de conquista enviado para ${email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar email de conquista:', error);
    throw error;
  }
};

// Email de relatório semanal
const sendWeeklyReport = async (email, name, report) => {
  try {
    const mailOptions = {
      from: `"Estudos ENEM" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '📊 Seu Relatório Semanal de Estudos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">📊 Relatório Semanal</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Acompanhe seu progresso e mantenha o foco</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Olá, ${name}! 📈</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48dbfb;">
              <h3 style="color: #333; margin-top: 0;">📋 Resumo da Semana:</h3>
              <div style="color: #666; line-height: 1.8;">
                <p><strong>Tempo total de estudo:</strong> ${report.totalStudyTime} horas</p>
                <p><strong>Metas cumpridas:</strong> ${report.completedGoals}/${report.totalGoals} (${report.completionRate}%)</p>
                <p><strong>Pontos ganhos:</strong> ${report.pointsEarned}</p>
                <p><strong>Conquistas desbloqueadas:</strong> ${report.achievementsUnlocked}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reports" 
                 style="background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;">
                Ver Relatório Completo
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              Mantenha a consistência e continue progredindo! 💪
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>© 2024 Estudos ENEM. Todos os direitos reservados.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Relatório semanal enviado para ${email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar relatório semanal:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendStudyReminder,
  sendAchievementEmail,
  sendWeeklyReport
}; 