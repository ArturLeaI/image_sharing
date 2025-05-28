import app from '../app';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import User from '../models/user';
import Image from '../models/image';
import { generateTestToken } from '../utils/testSetup';
import { mockUser } from '../utils/mocks';

import '../utils/testSetup';

describe('Testes de Likes', () => {
  let userId: string;
  let validToken: string;
  let imageId: string;

  beforeEach(async () => {
    await Image.deleteMany({});
    
    const testEmail = `test-${Date.now()}@example.com`;
    const user = new User({
      name: mockUser.name,
      email: testEmail,
      password: mockUser.password
    });
    await user.save();
    userId = user._id.toString();

    validToken = generateTestToken(userId, testEmail);

    const image = new Image({
      filename: `test-like-image-${Date.now()}.jpg`,
      originalname: 'test-like-image.jpg',
      path: 'uploads/test-like-image.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      uploader: new mongoose.Types.ObjectId(userId),
      description: 'Test image for likes',
      tags: ['test', 'likes'],
    });
    await image.save();
    imageId = (image._id as Types.ObjectId).toString();
  });

  describe('Curtir/Descurtir Imagens', () => {
    it('Deve curtir uma imagem com sucesso', async () => {
      const response = await request(app)
        .post(`/api/images/${imageId}/like`)
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('liked', true);
      expect(response.body).toHaveProperty('totalLikes', 1);
    });

    it('Deve descurtir uma imagem previamente curtida', async () => {
      await request(app)
        .post(`/api/images/${imageId}/like`)
        .set('Authorization', `Bearer ${validToken}`);
      
      const response = await request(app)
        .post(`/api/images/${imageId}/like`)
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('liked');
      expect(response.body).toHaveProperty('totalLikes');
    });

    it('Deve rejeitar curtida sem autenticação', async () => {
      const response = await request(app)
        .post(`/api/images/${imageId}/like`);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('Deve rejeitar curtida com ID de imagem inválido', async () => {
      const response = await request(app)
        .post('/api/images/invalid-id/like')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'ID de imagem inválido.');
    });

    it('Deve rejeitar curtida para imagem inexistente', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .post(`/api/images/${nonExistentId}/like`)
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Imagem não encontrada.');
    });
  });

  describe('Listagem de Imagens Curtidas', () => {
    it('Deve listar imagens curtidas pelo usuário', async () => {
      await request(app)
        .post(`/api/images/${imageId}/like`)
        .set('Authorization', `Bearer ${validToken}`);
      
      const response = await request(app)
        .get('/api/user/liked-images')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('page');
    });

    it('Deve rejeitar listagem sem autenticação', async () => {
      const response = await request(app)
        .get('/api/user/liked-images');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
