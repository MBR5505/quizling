const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

router.get('/', indexController.homePage);
router.get('/faq', indexController.faqPage);
router.get('/about', indexController.aboutPage);

module.exports = router;
