const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// Public: get all items
router.get('/', itemController.getAllItems);

// export
module.exports = router;
