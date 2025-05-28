import app from '../app';
import supertest from 'supertest';

import '../utils/testSetup';

const request = supertest(app);

describe("User Registration", () => {
  it("Deve registrar um usuário com sucesso", async () => {
    const time = Date.now();
    const email = `${time}@gmail.com`;
    const user = { name: "User1", email, password: "123456" };

    const res = await request.post("/user").send(user);

    expect(res.statusCode).toEqual(201);
    expect(res.body.email).toEqual(email);
  });

  it("User Validation - Deve rejeitar dados em branco", async () => {
    const user = { name: "User1", email: "", password: "" };

    const res = await request.post("/user").send(user);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it("Deve rejeitar email duplicado", async () => {
    const email = `duplicate@example.com`;
    const user1 = { name: "User One", email, password: "123456" };
    const user2 = { name: "User Two", email, password: "654321" };

    await request.post("/user").send(user1);

    const res = await request.post("/user").send(user2);

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('error', 'Este email já está cadastrado.');
  });

  it("Deve retornar um token quando o login for efetuado", async () => {
    const timestamp = Date.now();
    const email = `${timestamp}@gmail.com`;
    const password = "senha123";
    const user = { name: "Teste Login", email, password };

    await request.post("/user").send(user);

    const res = await request.post("/login").send({ email, password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
  });
});
