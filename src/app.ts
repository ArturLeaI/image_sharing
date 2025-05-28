import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import * as helmet from 'helmet';

// Importações de configurações e rotas
import { MONGO_URI, PORT, UPLOAD_DIR } from './config/config';
import userRoutes from './routes/userRoutes';
import imageRoutes from './routes/imageRoutes'; // Assumindo que você já tem este arquivo

// --- Inicialização do Express ---
const app: Application = express();

// --- Middlewares Globais ---
app.use(helmet.default()); // Adiciona headers de segurança
app.use(express.json()); // Para parsear JSON body
app.use(express.urlencoded({ extended: false })); // Para parsear URL-encoded body

// Servir arquivos estáticos da pasta de uploads
app.use('/uploads', express.static(path.join(__dirname, UPLOAD_DIR)));

// Rota de "saúde" da API
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API funcionando corretamente' });
});

// Montar as rotas de usuário
app.use('/', userRoutes);

// Montar as rotas de imagem sob o prefixo /api
app.use('/api', imageRoutes);

// --- Middleware de Tratamento de Erros Global ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err.stack || err);
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
});



export default app;
