# E-commerce Backend API (Digital Store)

API RESTful desenvolvida em **Node.js** e **Express** para gerenciamento de usuários, categorias e produtos de um e-commerce, com persistência em **MySQL** via **Sequelize ORM**, autenticação **JWT** e suíte completa de testes automatizados com **Jest** e **Supertest**.

---

## Tecnologias Utilizadas

* **Node.js** — Ambiente de execução JavaScript no servidor
* **Express.js** — Framework para criação de rotas e middlewares HTTP
* **MySQL + mysql2** — Banco de dados relacional e driver de conexão
* **Sequelize** — ORM para modelagem, associações e sincronização das tabelas
* **JWT (`jsonwebtoken`)** — Autenticação e proteção de rotas privadas
* **Bcrypt** — Criptografia (hash) de senhas de usuários
* **Dotenv** — Gerenciamento de variáveis de ambiente
* **CORS** — Liberação de acesso para integração com o frontend
* **Nodemon** — Reinicialização automática do servidor em desenvolvimento
* **Jest + Supertest** — Testes automatizados de integração para todo o CRUD

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

1. **Node.js** (versão LTS recomendada — inclui o `npm`)
2. **MySQL Server** (versão 8.x ou superior)
3. **Git** (opcional, para clonar o repositório)
4. Um cliente SQL (como **MySQL Workbench** ou **DBeaver**) e um cliente HTTP (como **Insomnia**, **Postman** ou **Thunder Client**) para testes manuais.

Verifique se o Node.js e o npm estão instalados corretamente:

```bash
node -v
npm -v
```

---

## Estrutura de Diretórios

```text
ecommerce-backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── categoryController.js
│   │   ├── productController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Category.js
│   │   ├── index.js
│   │   ├── Product.js
│   │   ├── ProductCategory.js
│   │   ├── ProductImage.js
│   │   ├── ProductOption.js
│   │   └── User.js
│   ├── routes/
│   │   ├── categoryRoutes.js
│   │   ├── productRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   └── productService.js
│   ├── app.js
│   └── server.js
├── tests/
│   ├── category.test.js
│   ├── product.test.js
│   └── user.test.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## Instalação e Configuração

### 1. Instale as dependências

Na pasta raiz do backend (`ecommerce-backend`), execute:

```bash
npm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo (ajuste `DB_USER`, `DB_PASS` e `JWT_SECRET` conforme o seu ambiente):

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ecommerce_db
DB_USER=root
DB_PASS=sua_senha_mysql
JWT_SECRET=sua_chave_secreta_super_segura
JWT_EXPIRES_IN=1d
```

---

## Script de Criação do Banco de Dados (MySQL)

Antes de iniciar o servidor ou rodar os testes, crie o banco de dados no MySQL.

### Opção 1: Apenas criar o banco (recomendado)

O Sequelize cria e sincroniza automaticamente todas as tabelas (`users`, `categories`, `products`, `product_images`, `product_options` e `product_categories`) assim que o servidor é iniciado. Basta executar:

```sql
CREATE DATABASE IF NOT EXISTS ecommerce_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Ou direto pelo terminal:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Opção 2: Script SQL completo (banco + tabelas)

Caso prefira criar toda a estrutura manualmente no MySQL Workbench ou DBeaver:

```sql
CREATE DATABASE IF NOT EXISTS ecommerce_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ecommerce_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstname VARCHAR(255) NOT NULL,
  surname VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  use_in_menu TINYINT(1) DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enabled TINYINT(1) DEFAULT 0,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  use_in_menu TINYINT(1) DEFAULT 0,
  stock INT DEFAULT 0,
  description VARCHAR(255),
  price FLOAT NOT NULL,
  price_with_discount FLOAT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  enabled TINYINT(1) DEFAULT 0,
  path VARCHAR(255) NOT NULL,
  CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  shape ENUM('square', 'circle') DEFAULT 'square',
  radius INT DEFAULT 0,
  type ENUM('text', 'color') DEFAULT 'text',
  `values` VARCHAR(255) NOT NULL,
  CONSTRAINT fk_product_options_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_categories (
  product_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (product_id, category_id),
  CONSTRAINT fk_product_categories_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_product_categories_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE CASCADE
);
```

---

## Como Executar o Projeto

### Ambiente de desenvolvimento (com Nodemon)

```bash
npm run dev
```

### Ambiente de produção

```bash
npm start
```

Quando a inicialização for bem-sucedida, o terminal exibirá:

```text
Banco de dados sincronizado com sucesso.
Servidor rodando na porta 3000
```

A API ficará disponível em: `http://localhost:3000`

---

## Como Executar os Testes Automatizados

O projeto possui 3 suítes de testes em `tests/` cobrindo todos os fluxos de sucesso (`200`, `201`, `204`) e cenários de erro (`400`, `401`, `404`):

* **`tests/user.test.js`** — Cadastro, login/JWT, busca por ID, atualização e exclusão de usuários
* **`tests/category.test.js`** — Criação, listagem com filtros/paginação, busca por ID, atualização e exclusão de categorias
* **`tests/product.test.js`** — Criação com associações (categorias, imagens e opções), busca avançada (`match`, `category_ids`, `price-range`, `fields`), atualização de relacionamentos e exclusão de produtos

### Executar todas as suítes

Certifique-se de que o script `test` no `package.json` contenha `--runInBand` (para executar os arquivos em sequência e evitar conflito no banco):

```json
"test": "jest --runInBand --detectOpenHandles --forceExit"
```

Rode no terminal:

```bash
npm test
```

### Executar uma suíte específica

```bash
npx jest tests/user.test.js
npx jest tests/category.test.js
npx jest tests/product.test.js
```

> **Atenção:** As suítes de teste executam `sequelize.sync({ force: true })` para recriar as tabelas limpas a cada execução, o que apaga os dados existentes no banco configurado no `.env`. Evite rodar `npm test` apontando para um banco de produção.

---

## Endpoints da API

Todas as rotas protegidas exigem o cabeçalho:

```http
Authorization: Bearer <seu_token_jwt>
```

### Autenticação e Usuários

| Método | Rota | Autenticação | Descrição |
| :--- | :--- | :---: | :--- |
| `POST` | `/v1/user` | Não | Cadastra um novo usuário |
| `POST` | `/v1/user/token` | Não | Autentica o usuário e retorna o token JWT |
| `GET` | `/v1/user/:id` | Não | Obtém os dados de um usuário pelo ID |
| `PUT` | `/v1/user/:id` | Sim | Atualiza os dados de um usuário |
| `DELETE` | `/v1/user/:id` | Sim | Remove um usuário |

### Categorias

| Método | Rota | Autenticação | Descrição |
| :--- | :--- | :---: | :--- |
| `GET` | `/v1/category/search` | Não | Lista categorias (`limit`, `page`, `fields`, `use_in_menu`) |
| `GET` | `/v1/category/:id` | Não | Obtém uma categoria pelo ID |
| `POST` | `/v1/category` | Sim | Cadastra uma nova categoria |
| `PUT` | `/v1/category/:id` | Sim | Atualiza uma categoria |
| `DELETE` | `/v1/category/:id` | Sim | Remove uma categoria |

### Produtos

| Método | Rota | Autenticação | Descrição |
| :--- | :--- | :---: | :--- |
| `GET` | `/v1/product/search` | Não | Lista produtos (`limit`, `page`, `fields`, `match`, `category_ids`, `price-range`, `option[id]`) |
| `GET` | `/v1/product/:id` | Não | Obtém um produto completo pelo ID (com imagens, opções e categorias) |
| `POST` | `/v1/product` | Sim | Cadastra um novo produto com imagens, opções e categorias |
| `PUT` | `/v1/product/:id` | Sim | Atualiza um produto e seus relacionamentos |
| `DELETE` | `/v1/product/:id` | Sim | Remove um produto |

---

## Códigos de Status HTTP Utilizados

* `200 OK` — Requisição executada com sucesso com retorno no corpo
* `201 Created` — Recurso criado com sucesso
* `204 No Content` — Atualização ou exclusão executada com sucesso sem corpo na resposta
* `400 Bad Request` — Dados inválidos ou mal formatados na requisição
* `401 Unauthorized` — Token JWT ausente, inválido ou expirado
* `404 Not Found` — Recurso solicitado não encontrado