import app from '../app'; 
import request from 'supertest';

describe('Testes do servidor', () => {
    it('Deve retornar 200 na rota raiz', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });
});