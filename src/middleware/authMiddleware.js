const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Nota: Os requisitos das seções 02-04 pedem 401 Unauthorized.
    // Caso algum teste exija 400 (Seção 05 Req 02), altere 401 para 400.
    return res.status(401).json({ error: 'Token não fornecido ou mal formatado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};