// Importações Essenciais
import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
// Importação com tipo para resolver o erro de declaração
import * as helmet from 'helmet';

// Importações de Módulos Locais
import User from './models/user'; // Assumindo que você tem este modelo definido
import Image from './routes/image'; // Rotas de imagem
// Removido: import { authenticate, AuthenticatedRequest, JwtPayload } from './middleware/authMiddleware'; - A autenticação será usada nas rotas específicas
// Removido: import Image from './models/image'; - Não é mais usado diretamente aqui

// Carrega variáveis de ambiente do .env
dotenv.config();

// --- Configurações Carregadas do Ambiente ---
const JWT_SECRET = process.env.JWT_SECRET || '';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myapp'; // Exemplo: Adicione sua URI no .env
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';

// --- Validação Crítica de Configuração ---
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1); // Encerra a aplicação se o segredo JWT não estiver definido
}

// --- Interfaces ---
// Interface para o corpo da requisição de criação/login de usuário
interface UserRequestBody {
  name?: string; // Tornar opcional aqui, validar na rota
  email: string;
  password: string;
}

// --- Inicialização do Express ---
const app: Application = express();

// --- Middlewares Globais ---
app.use(helmet.default()); // Adiciona headers de segurança
app.use(express.json()); // Para parsear JSON body
app.use(express.urlencoded({ extended: false })); // Para parsear URL-encoded body

// Servir arquivos estáticos da pasta de uploads
// Usar path.join para garantir compatibilidade entre sistemas operacionais
app.use('/uploads', express.static(path.join(__dirname, UPLOAD_DIR)));

// Rota de "saúde" da API
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API funcionando corretamente' });
});

// Rota de Registro de Usuário
app.post('/user', async (req: Request<{}, any, UserRequestBody>, res: Response) => {
  // Validação de entrada (Poderia ser movida para um middleware de validação com Joi/Zod)
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
   res.status(400).json({ error: 'Todos os campos (nome, email, senha) são obrigatórios.' });
   return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
   res.status(400).json({ error: 'Formato de email inválido.' });
   return
  }

  // Verificar força da senha (Exemplo simples, idealmente usar uma biblioteca)
  if (password.length < 6) { // Exemplo: mínimo de 6 caracteres
     res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
     return
  }

  const userExists = await User.findOne({ email: email.trim().toLowerCase() }); // Normalizar email
  if (userExists) {
   res.status(409).json({ error: 'Este email já está cadastrado.' }); // Usar 409 Conflict
   return
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Criação do novo usuário
  const newUser = new User({
    name: name.trim(),
    email: email.trim().toLowerCase(), // Salvar email normalizado
    password: hashedPassword,
  });

  await newUser.save();

  // Geração do Token JWT - Corrigido para resolver erro de tipagem
   const tokenPayload = { id: newUser._id, email: newUser.email };
  
  // Usando a assinatura correta para jwt.sign sem tipagem adicional
  const token = jwt.sign(tokenPayload, JWT_SECRET);


  // Retornar email e token (evitar retornar o objeto usuário inteiro)
  res.status(201).json({ email: newUser.email, token }); // Usar 201 Created
});

// Rota de Login de Usuário
app.post('/login', async (req: Request<{}, any, UserRequestBody>, res: Response) => {
  const { email, password } = req.body;

  // Validação de entrada
  if (!email?.trim() || !password?.trim()) {
     res.status(400).json({ error: 'Email e senha são obrigatórios.' });
     return
  }

  // Busca o usuário pelo email (normalizado)
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user || !user.password) {
    // Resposta genérica para não informar se o email existe ou não
     res.status(401).json({ error: 'Credenciais inválidas.' });
     return
  }

  // Compara a senha fornecida com o hash armazenado
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
     res.status(401).json({ error: 'Credenciais inválidas.' });
     return
  }

  // Gera o Token JWT - Corrigido para resolver erro de tipagem
   const tokenPayload = { id: user._id, email: user.email };
  
  // Usando a assinatura correta para jwt.sign sem tipagem adicional
  const token = jwt.sign(tokenPayload, JWT_SECRET);


  // Retorna o token
  res.status(200).json({ token });
});

// Montar as rotas de imagem sob o prefixo /api
app.use('/api', Image);

// --- Middleware de Tratamento de Erros Global ---
// Deve ser o último middleware adicionado
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err.stack || err); // Logar o stack trace para depuração

  // Pode adicionar lógica para tratar tipos específicos de erro (ex: erros de validação, erros do Mongoose)
  // if (err instanceof ValidationError) { ... }

  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
});

export default app;
