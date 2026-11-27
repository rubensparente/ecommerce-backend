const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

describe('CRUD de Categorias (/v1/category)', () => {
  let token;
  let categoryId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await request(app).post('/v1/user').send({
      firstname: 'Admin',
      surname: 'Teste',
      email: 'admin@mail.com',
      password: '123@123',
      confirmPassword: '123@123',
    });

    const authRes = await request(app).post('/v1/user/token').send({
      email: 'admin@mail.com',
      password: '123@123',
    });
    token = authRes.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('POST /v1/category - deve bloquear sem token (401)', async () => {
    const res = await request(app).post('/v1/category').send({
      name: 'Shoes',
      slug: 'shoes',
      use_in_menu: true,
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /v1/category - deve retornar 400 sem campos obrigatórios', async () => {
    const res = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Shoes' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /v1/category - deve criar categoria (201)', async () => {
    const res = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Shoes',
        slug: 'shoes',
        use_in_menu: true,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    categoryId = res.body.id;
  });

  it('GET /v1/category/search - deve listar categorias com paginação e filtros (200)', async () => {
    const res = await request(app).get('/v1/category/search?limit=12&page=1&use_in_menu=true&fields=name,slug');
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0]).toEqual({ name: 'Shoes', slug: 'shoes' });
  });

  it('GET /v1/category/:id - deve retornar categoria por ID (200)', async () => {
    const res = await request(app).get(`/v1/category/${categoryId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.slug).toBe('shoes');
  });

  it('GET /v1/category/:id - deve retornar 404 para ID inexistente', async () => {
    const res = await request(app).get('/v1/category/99999');
    expect(res.statusCode).toBe(404);
  });

  it('PUT /v1/category/:id - deve atualizar categoria (204)', async () => {
    const res = await request(app)
      .put(`/v1/category/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Tênis',
        slug: 'tenis',
        use_in_menu: false,
      });
    expect(res.statusCode).toBe(204);
  });

  it('DELETE /v1/category/:id - deve deletar categoria (204)', async () => {
    const res = await request(app)
      .delete(`/v1/category/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(204);
  });

  it('DELETE /v1/category/:id - deve retornar 404 ao deletar categoria inexistente', async () => {
    const res = await request(app)
      .delete(`/v1/category/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});