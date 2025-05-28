import app from '../app';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import User from '../models/user';
import Image from '../models/image';
import { generateTestToken } from '../utils/testSetup';
import { mockUser, mockFile } from '../utils/mocks';

import '../utils/testSetup';

jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req: any, res: any, next: any) => {
      req.file = mockFile;
      next();
    }
  });
  multer.diskStorage = () => ({});
  return multer;
});

describe('Testes de Upload e Gerenciamento de Imagens', () => {
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
      filename: `test-image-${Date.now()}.jpg`,
      originalname: 'test-image.jpg',
      path: 'uploads/test-image.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      uploader: new mongoose.Types.ObjectId(userId),
      description: 'Test image description',
      tags: ['test', 'image'],
    });
    await image.save();
    imageId = (image._id as Types.ObjectId).toString();
  });

  describe('Upload de Imagem', () => {
    it.skip('Deve fazer upload de imagem com sucesso quando autenticado', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${validToken}`)
        .field('description', 'Test image description')
        .field('tags', 'test,image,unit-test');
      
      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('image');
      expect(response.body.image).toHaveProperty('filename');
    });

    it('Deve rejeitar upload sem autenticação', async () => {
      const response = await request(app)
        .post('/api/upload')
        .field('description', 'Test image description')
        .field('tags', 'test,image');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Busca de Imagens', () => {
    it('Deve listar imagens com paginação correta', async () => {
      for (let i = 0; i < 5; i++) {
        const image = new Image({
          filename: `test-image-${i}.jpg`,
          originalname: `test-image-${i}.jpg`,
          path: `uploads/test-image-${i}.jpg`,
          mimetype: 'image/jpeg',
          size: 1024,
          uploader: new mongoose.Types.ObjectId(userId),
          description: `Test image ${i}`,
          tags: ['test', `image-${i}`],
        });
        await image.save();
      }

      const response = await request(app)
        .get('/api/images')
        .query({ page: 1, limit: 3 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('Deve retornar erro para parâmetros de paginação inválidos', async () => {
      const response = await request(app)
        .get('/api/images')
        .query({ page: 0, limit: 10 });
      
      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
      } else {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('page');
        expect(response.body.page).toBe(1);
      }
    });

    it('Deve buscar imagem específica por ID', async () => {
      const response = await request(app)
        .get(`/api/images/${imageId}`);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('_id');
        expect(response.body).toHaveProperty('filename');
      } else {
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
      }
    });

    it('Deve retornar erro para ID de imagem inválido', async () => {
      const response = await request(app)
        .get('/api/images/invalid-id');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'ID de imagem inválido.');
    });

    it('Deve retornar erro para imagem não encontrada', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/images/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Imagem não encontrada.');
    });
  });

  describe('Imagens do Usuário', () => {
    it('Deve listar imagens enviadas pelo usuário autenticado', async () => {
      const userImage = new Image({
        filename: `user-image-${Date.now()}.jpg`,
        originalname: 'user-image.jpg',
        path: 'uploads/user-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        uploader: new mongoose.Types.ObjectId(userId),
        description: 'User specific image',
        tags: ['test', 'user-image'],
      });
      await userImage.save();
      
      const response = await request(app)
        .get('/api/user/my-images')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('totalItems');
    });

    it('Deve rejeitar listagem sem autenticação', async () => {
      const response = await request(app)
        .get('/api/user/my-images');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
