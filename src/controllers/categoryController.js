const { Category } = require('../models');

exports.search = async (req, res) => {
  try {
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : 12;
    const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : 1;

    if (Number.isNaN(limit) || Number.isNaN(page) || page < 1) {
      return res.status(400).json({ error: 'Parâmetros de paginação inválidos' });
    }

    const where = {};
    if (req.query.use_in_menu !== undefined) {
      where.use_in_menu = req.query.use_in_menu === 'true';
    }

    const queryOptions = { where };

    if (req.query.fields) {
      queryOptions.attributes = req.query.fields.split(',').map((f) => f.trim());
    }

    if (limit !== -1) {
      queryOptions.limit = limit;
      queryOptions.offset = (page - 1) * limit;
    }

    const { count, rows } = await Category.findAndCountAll(queryOptions);

    return res.status(200).json({
      data: rows,
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
    const category = await Category.findByPk(req.params.id, {
      attributes: ['id', 'name', 'slug', 'use_in_menu'],
    });
    if (!category) return res.status(404).json({ error: 'Categoria não encontrada' });
    return res.status(200).json(category);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, slug, use_in_menu } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'name e slug são obrigatórios' });
    }

    const category = await Category.create({ name, slug, use_in_menu });
    return res.status(201).json(category);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, slug, use_in_menu } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'name e slug são obrigatórios' });
    }

    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Categoria não encontrada' });

    await category.update({ name, slug, use_in_menu });
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Categoria não encontrada' });

    await category.destroy();
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};