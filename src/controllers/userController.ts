import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { JWT_SECRET, BCRYPT_SALT_ROUNDS } from '../config/config';

interface UserRequestBody {
  name?: string;
  email: string;
  password: string;
}

export const registerUser = async (req: Request<{}, any, UserRequestBody>, res: Response) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    res.status(400).json({ error: 'Todos os campos (nome, email, senha) são obrigatórios.' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Formato de email inválido.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    return;
  }

  try {
    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists) {
      res.status(409).json({ error: 'Este email já está cadastrado.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    const tokenPayload = { id: newUser._id, email: newUser.email };
    const token = jwt.sign(tokenPayload, JWT_SECRET);

    res.status(201).json({ email: newUser.email, token });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
  }
};

export const loginUser = async (req: Request<{}, any, UserRequestBody>, res: Response) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    return;
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.password) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    const tokenPayload = { id: user._id, email: user.email };
    const token = jwt.sign(tokenPayload, JWT_SECRET);

    res.status(200).json({ token });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro interno ao fazer login.' });
  }
};
