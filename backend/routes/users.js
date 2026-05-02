const auth = require("../middleware/auth");

const express = require("express");
const multer = require("multer");

const router = express.Router();
const upload = multer();

const userController = require("../controllers/userController");

/* ==============================
   USER ROUTES
============================== */

router.post('/create', userController.createUser);

router.get('/profile', auth, userController.getProfile);

router.put('/profile', auth, userController.updateProfile);

router.put(
  "/profile-image",
  auth,
  upload.single("image"),
  userController.uploadProfileImage
);

/* ==============================
   🔥 DELETE ACCOUNT (ADD THIS)
============================== */
router.delete(
  "/delete",
  auth,
  userController.deleteAccount
);

module.exports = router;