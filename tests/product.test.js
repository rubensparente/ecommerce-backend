const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

describe('CRUD de Produtos (/v1/product)', () => {
  let token;
  let categoryId;
  let productId;
  let imageId;
  let optionId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await request(app).post('/v1/user').send({
      firstname: 'Admin',
      surname: 'Produto',
      email: 'admin.prod@mail.com',
      password: '123@123',
      confirmPassword: '123@123',
    });

    const authRes = await request(app).post('/v1/user/token').send({
      email: 'admin.prod@mail.com',
      password: '123@123',
    });
    token = authRes.body.token;

    const catRes = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tênis', slug: 'tenis', use_in_menu: true });
    categoryId = catRes.body.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('POST /v1/product - deve bloquear sem token (401)', async () => {
    const res = await request(app).post('/v1/product').send({
      name: 'Tênis Nike',
      slug: 'tenis-nike',
      price: 200,
      price_with_discount: 150,
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /v1/product - deve retornar 400 sem campos obrigatórios', async () => {
    const res = await request(app)
      .post('/v1/product')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Incompleto' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /v1/product - deve criar produto com categoria, imagens e opções (201)', async () => {
    const res = await request(app)
      .post('/v1/product')
      .set('Authorization', `Bearer ${token}`)
      .send({
        enabled: true,
        name: 'Tênis Nike Air',
        slug: 'tenis-nike-air',
        stock: 15,
        description: 'Tênis esportivo confortável',
        price: 299.9,
        price_with_discount: 199.9,
        category_ids: [categoryId],
        images: [
          { type: 'image/png', content: 'https://store.com/img1.png' },
          { type: 'image/png', content: 'https://store.com/img2.png' },
        ],
        options: [
          {
            title: 'Tamanho',
            shape: 'square',
            radius: '4px',
            type: 'text',
            value: ['39', '40', '41'],
          },
          {
            title: 'Cor',
            shape: 'circle',
            type: 'color',
            values: ['#000', '#FFF'],
          },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    productId = res.body.id;
  });

  it('GET /v1/product/:id - deve retornar produto completo com associações (200)', async () => {
    const res = await request(app).get(`/v1/product/${productId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Tênis Nike Air');
    expect(res.body.category_ids).toContain(categoryId);
    expect(res.body.images).toHaveLength(2);
    expect(res.body.options).toHaveLength(2);

    imageId = res.body.images[0].id;
    optionId = res.body.options[0].id;
  });

  it('GET /v1/product/:id - deve retornar 404 para ID inexistente', async () => {
    const res = await request(app).get('/v1/product/99999');
    expect(res.statusCode).toBe(404);
  });

  it('GET /v1/product/search - deve filtrar por match, categoria e faixa de preço (200)', async () => {
    const res = await request(app).get(
      `/v1/product/search?match=Nike&category_ids=${categoryId}&price-range=200-350&fields=id,name,price`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0]).toEqual({
      id: productId,
      name: 'Tênis Nike Air',
      price: 299.9,
    });
  });

  it('PUT /v1/product/:id - deve atualizar produto, remover imagem e editar opção (204)', async () => {
    const res = await request(app)
      .put(`/v1/product/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        enabled: true,
        name: 'Tênis Nike Air Atualizado',
        slug: 'tenis-nike-air-atualizado',
        stock: 20,
        description: 'Descrição atualizada',
        price: 250,
        price_with_discount: 180,
        category_ids: [categoryId],
        images: [
          { id: imageId, deleted: true },
          { type: 'image/png', content: 'https://store.com/img3.png' },
        ],
        options: [
          { id: optionId, radius: '8px', value: ['40', '42'] },
        ],
      });
    expect(res.statusCode).toBe(204);

    const check = await request(app).get(`/v1/product/${productId}`);
    expect(check.body.name).toBe('Tênis Nike Air Atualizado');
    expect(check.body.images).toHaveLength(2);
  });

  it('DELETE /v1/product/:id - deve deletar produto (204)', async () => {
    const res = await request(app)
      .delete(`/v1/product/${productId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(204);
  });

  it('DELETE /v1/product/:id - deve retornar 404 ao deletar produto inexistente', async () => {
    const res = await request(app)
      .delete(`/v1/product/${productId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});