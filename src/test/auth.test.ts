import app from '../app';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/user';
import { generateTestToken } from '../utils/testSetup';
import { mockUser } from '../utils/mocks';

import '../utils/testSetup';

describe('Testes de Autenticação', () => {
  let userId: string;
  let validToken: string;
  let expiredToken: string;
  let invalidToken: string;

  beforeAll(async () => {
    const user = new User({
      name: mockUser.name,
      email: mockUser.email,
      password: mockUser.password
    });
    await user.save();
    userId = user._id.toString();

    validToken = generateTestToken(userId, mockUser.email);
    
    const payload = { id: userId, email: mockUser.email, exp: Math.floor(Date.now() / 1000) - 3600 };
    expiredToken = jwt.sign(payload, process.env.JWT_SECRET || '');
    
    invalidToken = validToken.slice(0, -5) + 'xxxxx';
  });

  describe('Middleware de Autenticação', () => {
    it('Deve rejeitar requisições sem token', async () => {
      const response = await request(app)
        .get('/api/user/my-images');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('Deve rejeitar requisições com token inválido', async () => {
      const response = await request(app)
        .get('/api/user/my-images')
        .set('Authorization', `Bearer ${invalidToken}`);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('Deve rejeitar requisições com formato de token incorreto', async () => {
      const response = await request(app)
        .get('/api/user/my-images')
        .set('Authorization', `${validToken}`);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('Deve permitir requisições com token válido', async () => {
      const response = await request(app)
        .get('/api/user/my-images')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });
});
