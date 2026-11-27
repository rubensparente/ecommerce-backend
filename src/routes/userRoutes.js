const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

router.post('/token', userController.generateToken);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', auth, userController.update);
router.delete('/:id', auth, userController.remove);

module.exports = router;