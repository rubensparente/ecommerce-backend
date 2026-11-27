const { Op } = require('sequelize');
const {
  sequelize,
  Product,
  Category,
  ProductImage,
  ProductOption,
} = require('../models');
const {
  formatProductResponse,
  parseRadius,
  parseOptionValues,
} = require('../services/productService');

exports.search = async (req, res) => {
  try {
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : 12;
    const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : 1;

    if (Number.isNaN(limit) || Number.isNaN(page) || page < 1) {
      return res.status(400).json({ error: 'Parâmetros de paginação inválidos' });
    }

    const where = {};

    if (req.query.match) {
      where[Op.or] = [
        { name: { [Op.like]: `%${req.query.match}%` } },
        { description: { [Op.like]: `%${req.query.match}%` } },
      ];
    }

    if (req.query['price-range']) {
      const [min, max] = req.query['price-range'].split('-').map(Number);
      if (Number.isNaN(min) || Number.isNaN(max)) {
        return res.status(400).json({ error: 'price-range inválido' });
      }
      where.price = { [Op.between]: [min, max] };
    }

    const categoryInclude = { model: Category, as: 'categories', attributes: ['id'] };
    if (req.query.category_ids) {
      const ids = req.query.category_ids.split(',').map(Number);
      categoryInclude.where = { id: { [Op.in]: ids } };
      categoryInclude.required = true;
    }

    const optionInclude = { model: ProductOption, as: 'options' };
    if (req.query.option && typeof req.query.option === 'object') {
      const optionConditions = Object.entries(req.query.option).map(([optId, vals]) => {
        const valList = String(vals).split(',');
        return {
          id: Number(optId),
          [Op.or]: valList.map((v) => ({ values: { [Op.like]: `%${v.trim()}%` } })),
        };
      });
      if (optionConditions.length > 0) {
        optionInclude.where = { [Op.or]: optionConditions };
        optionInclude.required = true;
      }
    }

    const queryOptions = {
      where,
      include: [
        categoryInclude,
        { model: ProductImage, as: 'images' },
        optionInclude,
      ],
      distinct: true,
    };

    if (limit !== -1) {
      queryOptions.limit = limit;
      queryOptions.offset = (page - 1) * limit;
    }

    const { count, rows } = await Product.findAndCountAll(queryOptions);
    const data = rows.map((p) => formatProductResponse(p, req.query.fields));

    return res.status(200).json({
      data,
      total: count,
      limit,
      page: limit === -1 ? 1 : page,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'categories', attributes: ['id'] },
        { model: ProductImage, as: 'images' },
        { model: ProductOption, as: 'options' },
      ],
    });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    return res.status(200).json(formatProductResponse(product));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      enabled, name, slug, stock, description,
      price, price_with_discount, category_ids, images, options,
    } = req.body;

    if (!name || !slug || price === undefined || price_with_discount === undefined) {
      await t.rollback();
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const product = await Product.create(
      { enabled, name, slug, stock, description, price, price_with_discount },
      { transaction: t }
    );

    if (Array.isArray(category_ids) && category_ids.length > 0) {
      await product.setCategories(category_ids, { transaction: t });
    }

    if (Array.isArray(images) && images.length > 0) {
      const imageRows = images.map((img) => ({
        product_id: product.id,
        enabled: true,
        path: img.content,
      }));
      await ProductImage.bulkCreate(imageRows, { transaction: t });
    }

    if (Array.isArray(options) && options.length > 0) {
      const optionRows = options.map((opt) => ({
        product_id: product.id,
        title: opt.title,
        shape: opt.shape || 'square',
        radius: parseRadius(opt.radius),
        type: opt.type || 'text',
        values: parseOptionValues(opt),
      }));
      await ProductOption.bulkCreate(optionRows, { transaction: t });
    }

    await t.commit();
    return res.status(201).json({ id: product.id });
  } catch (err) {
    await t.rollback();
    return res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(req.params.id, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const {
      enabled, name, slug, stock, description,
      price, price_with_discount, category_ids, images, options,
    } = req.body;

    await product.update(
      { enabled, name, slug, stock, description, price, price_with_discount },
      { transaction: t }
    );

    if (Array.isArray(category_ids)) {
      await product.setCategories(category_ids, { transaction: t });
    }

    if (Array.isArray(images)) {
      for (const img of images) {
        if (img.id && img.deleted) {
          await ProductImage.destroy({
            where: { id: img.id, product_id: product.id },
            transaction: t,
          });
        } else if (img.id) {
          await ProductImage.update(
            { path: img.content },
            { where: { id: img.id, product_id: product.id }, transaction: t }
          );
        } else {
          await ProductImage.create(
            { product_id: product.id, enabled: true, path: img.content },
            { transaction: t }
          );
        }
      }
    }

    if (Array.isArray(options)) {
      for (const opt of options) {
        if (opt.id && opt.deleted) {
          await ProductOption.destroy({
            where: { id: opt.id, product_id: product.id },
            transaction: t,
          });
        } else if (opt.id) {
          const updateData = {};
          if (opt.title !== undefined) updateData.title = opt.title;
          if (opt.shape !== undefined) updateData.shape = opt.shape;
          if (opt.radius !== undefined) updateData.radius = parseRadius(opt.radius);
          if (opt.type !== undefined) updateData.type = opt.type;
          if (opt.values !== undefined || opt.value !== undefined) {
            updateData.values = parseOptionValues(opt);
          }
          await ProductOption.update(updateData, {
            where: { id: opt.id, product_id: product.id },
            transaction: t,
          });
        } else {
          await ProductOption.create(
            {
              product_id: product.id,
              title: opt.title,
              shape: opt.shape || 'square',
              radius: parseRadius(opt.radius),
              type: opt.type || 'text',
              values: parseOptionValues(opt),
            },
            { transaction: t }
          );
        }
      }
    }

    await t.commit();
    return res.status(204).send();
  } catch (err) {
    await t.rollback();
    return res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    await product.destroy();
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};