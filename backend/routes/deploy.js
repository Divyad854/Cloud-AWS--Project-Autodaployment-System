const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const deployController = require('../controllers/deployController');

router.post('/', auth, deployController.deploy);

module.exports = router;
