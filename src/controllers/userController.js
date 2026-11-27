const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.generateToken = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.status(200).json({ token });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'firstname', 'surname', 'email'],
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { firstname, surname, email, password, confirmPassword } = req.body;
    if (!firstname || !surname || !email || !password || password !== confirmPassword) {
      return res.status(400).json({ error: 'Dados inválidos ou senhas não conferem' });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const user = await User.create({ firstname, surname, email, password });
    return res.status(201).json({
      id: user.id,
      firstname: user.firstname,
      surname: user.surname,
      email: user.email,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { firstname, surname, email } = req.body;
    if (!firstname || !surname || !email) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    await user.update({ firstname, surname, email });
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    await user.destroy();
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};