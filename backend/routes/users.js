// const express = require('express');
// const router = express.Router();

// const auth = require('../middleware/auth');
// const { getProfile, updateProfile } = require('../controllers/userController');

// router.get('/profile', auth, getProfile);
// router.put('/profile', auth, updateProfile);

// module.exports = router;

const auth = require("../middleware/auth");

const express = require("express");
const multer = require("multer");

const router = express.Router();

const upload = multer();

const userController = require("../controllers/userController");


router.post('/create', userController.createUser);

router.get('/profile', auth, userController.getProfile);

router.put('/profile', auth, userController.updateProfile);

router.put(
  "/profile-image",
   auth,  
  upload.single("image"),
  userController.uploadProfileImage
);

module.exports = router;