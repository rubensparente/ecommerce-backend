const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const ProductOption = require('./ProductOption');
const ProductCategory = require('./ProductCategory');

// Product <-> ProductImage (1:N)
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Product <-> ProductOption (1:N)
Product.hasMany(ProductOption, { foreignKey: 'product_id', as: 'options', onDelete: 'CASCADE' });
ProductOption.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Product <-> Category (N:N)
Product.belongsToMany(Category, {
  through: ProductCategory,
  foreignKey: 'product_id',
  otherKey: 'category_id',
  as: 'categories',
});
Category.belongsToMany(Product, {
  through: ProductCategory,
  foreignKey: 'category_id',
  otherKey: 'product_id',
  as: 'products',
});

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory,
};