import app from '../app';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import User from '../models/user';
import Image from '../models/image';
import { generateTestToken } from '../utils/testSetup';
import { mockUser } from '../utils/mocks';

import '../utils/testSetup';

describe('Testes de Comentários', () => {
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
      filename: `test-comment-image-${Date.now()}.jpg`,
      originalname: 'test-comment-image.jpg',
      path: 'uploads/test-comment-image.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      uploader: new mongoose.Types.ObjectId(userId),
      description: 'Test image for comments',
      tags: ['test', 'comments'],
    });
    await image.save();
    imageId = (image._id as Types.ObjectId).toString();
  });

  describe('Adicionar Comentários', () => {
    it('Deve adicionar comentário com sucesso', async () => {
      const response = await request(app)
        .post(`/api/images/${imageId}/comment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ text: 'Este é um comentário de teste' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Comentário adicionado!');
      expect(response.body).toHaveProperty('comment');
      expect(response.body.comment).toHaveProperty('text', 'Este é um comentário de teste');
      expect(response.body.comment).toHaveProperty('user');
    });

    it('Deve rejeitar comentário sem autenticação', async () => {
      const response = await request(app)
        .post(`/api/images/${imageId}/comment`)
        .send({ text: 'Este é um comentário de teste' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('Deve rejeitar comentário vazio', async () => {
      const response = await request(app)
        .post(`/api/images/${imageId}/comment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ text: '' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'O texto do comentário não pode estar vazio.');
    });

    it('Deve rejeitar comentário muito longo', async () => {
      const longText = 'a'.repeat(501);
      
      const response = await request(app)
        .post(`/api/images/${imageId}/comment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ text: longText });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'O comentário excede o limite de 500 caracteres.');
    });

    it('Deve rejeitar comentário para imagem inexistente', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .post(`/api/images/${nonExistentId}/comment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ text: 'Este é um comentário de teste' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Imagem não encontrada.');
    });

    it('Deve rejeitar comentário com ID de imagem inválido', async () => {
      const response = await request(app)
        .post('/api/images/invalid-id/comment')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ text: 'Este é um comentário de teste' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'ID de imagem inválido.');
    });
  });

  describe('Visualização de Comentários', () => {
    it('Deve mostrar comentários ao buscar imagem específica', async () => {
      await request(app)
        .post(`/api/images/${imageId}/comment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ text: 'Comentário para visualização' });
      
      const response = await request(app)
        .get(`/api/images/${imageId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comments');
      expect(response.body.comments).toBeInstanceOf(Array);
      expect(response.body.comments.length).toBeGreaterThan(0);
      
      const hasComment = response.body.comments.some(
        (comment: any) => comment.text === 'Comentário para visualização'
      );
      expect(hasComment).toBe(true);
    });
  });
});
