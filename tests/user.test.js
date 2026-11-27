const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('CRUD de Usuários e Autenticação (/v1/user)', () => {
  let token;
  let userId;

  it('POST /v1/user - deve retornar 400 se senhas não conferem', async () => {
    const res = await request(app).post('/v1/user').send({
      firstname: 'João',
      surname: 'Silva',
      email: 'joao@mail.com',
      password: '123@123',
      confirmPassword: 'outra_senha',
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /v1/user - deve criar um usuário (201)', async () => {
    const res = await request(app).post('/v1/user').send({
      firstname: 'João',
      surname: 'Silva',
      email: 'joao@mail.com',
      password: '123@123',
      confirmPassword: '123@123',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('joao@mail.com');
    userId = res.body.id;
  });

  it('POST /v1/user - deve retornar 400 para email duplicado', async () => {
    const res = await request(app).post('/v1/user').send({
      firstname: 'João',
      surname: 'Silva',
      email: 'joao@mail.com',
      password: '123@123',
      confirmPassword: '123@123',
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /v1/user/token - deve retornar 400 para senha incorreta', async () => {
    const res = await request(app).post('/v1/user/token').send({
      email: 'joao@mail.com',
      password: 'errada',
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /v1/user/token - deve gerar JWT válido (200)', async () => {
    const res = await request(app).post('/v1/user/token').send({
      email: 'joao@mail.com',
      password: '123@123',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('GET /v1/user/:id - deve retornar dados do usuário (200)', async () => {
    const res = await request(app).get(`/v1/user/${userId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      id: userId,
      firstname: 'João',
      surname: 'Silva',
      email: 'joao@mail.com',
    });
  });

  it('GET /v1/user/:id - deve retornar 404 para ID inexistente', async () => {
    const res = await request(app).get('/v1/user/99999');
    expect(res.statusCode).toBe(404);
  });

  it('PUT /v1/user/:id - deve bloquear atualização sem token (401)', async () => {
    const res = await request(app).put(`/v1/user/${userId}`).send({
      firstname: 'João Editado',
      surname: 'Silva',
      email: 'joao@mail.com',
    });
    expect(res.statusCode).toBe(401);
  });

  it('PUT /v1/user/:id - deve atualizar usuário com token (204)', async () => {
    const res = await request(app)
      .put(`/v1/user/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstname: 'João Editado',
        surname: 'Silva',
        email: 'joao@mail.com',
      });
    expect(res.statusCode).toBe(204);
  });

  it('DELETE /v1/user/:id - deve bloquear exclusão sem token (401)', async () => {
    const res = await request(app).delete(`/v1/user/${userId}`);
    expect(res.statusCode).toBe(401);
  });

  it('DELETE /v1/user/:id - deve deletar usuário com token (204)', async () => {
    const res = await request(app)
      .delete(`/v1/user/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(204);
  });

  it('DELETE /v1/user/:id - deve retornar 404 ao deletar novamente', async () => {
    const res = await request(app)
      .delete(`/v1/user/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});