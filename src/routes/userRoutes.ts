import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/userController';

const router = Router();

// Rota de Registro de Usuário
router.post('/user', registerUser);

// Rota de Login de Usuário
router.post('/login', loginUser);

export default router;
