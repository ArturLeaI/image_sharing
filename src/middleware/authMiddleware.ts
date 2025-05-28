import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estendendo a interface Request do Express para incluir o campo user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any; // Para permitir outros campos que possam existir no payload
  };
}

// Interface para o payload do JWT
export interface JwtPayload {
  id: string;
  email: string;
  [key: string]: any; // Para permitir outros campos que possam existir no payload
}

// Middleware de autenticação
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Obter o token do header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido.' });
      return;
    }

    // Extrair o token (remover o prefixo "Bearer ")
    const token = authHeader.split(' ')[1];
    
    // Verificar e decodificar o token
    const JWT_SECRET = process.env.JWT_SECRET || '';
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido nas variáveis de ambiente.');
      res.status(500).json({ error: 'Erro de configuração do servidor.' });
      return;
    }

    // Decodificar o token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Adicionar o payload decodificado ao objeto req
    (req as AuthenticatedRequest).user = decoded;
    
    // Continuar para o próximo middleware ou rota
    next();
  } catch (error) {
    // Tratar erros de verificação do token
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token inválido.' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expirado.' });
    } else {
      console.error('Erro na autenticação:', error);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  }
};
