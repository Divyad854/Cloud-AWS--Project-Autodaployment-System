const { dynamo, TABLES } = require('../config/dynamo');

const { uploadProfileImageToS3, deleteProfileImageFromS3 } = require("../aws/s3");

/* ==============================
   GET PROFILE
============================== */
exports.getProfile = async (req, res, next) => {
  try {

    const userId = req.user.sub;

    const result = await dynamo.get({
      TableName: TABLES.USERS,
      Key: { id: userId }
    }).promise();

    res.json({ profile: result.Item || null });

  } catch (err) {
    next(err);
  }
};


/* ==============================
   UPLOAD PROFILE IMAGE
============================== */

exports.uploadProfileImage = async (req, res, next) => {

  try {

    const userId = req.user.sub;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "Image not provided"
      });
    }

    /* Get existing profile */

    const existing = await dynamo.get({
      TableName: TABLES.USERS,
      Key: { id: userId }
    }).promise();

    const oldImage = existing.Item?.profilePhotoUrl;

    /* DELETE OLD IMAGE FROM S3 */

    if (oldImage) {
      await deleteProfileImageFromS3(oldImage);
    }

    /* Upload new image */

    const fileType = file.mimetype.split("/")[1];

    const imageUrl = await uploadProfileImageToS3(
      file.buffer,
      userId,
      fileType
    );

    /* Save new URL */

    await dynamo.update({
      TableName: TABLES.USERS,
      Key: { id: userId },
      UpdateExpression: "SET profilePhotoUrl = :url",
      ExpressionAttributeValues: {
        ":url": imageUrl
      }
    }).promise();

    res.json({ imageUrl });

  } catch (err) {
    next(err);
  }

};
/* ==============================
   UPDATE PROFILE
============================== */
exports.updateProfile = async (req, res, next) => {
  try {

    const userId = req.user.sub;
    const role = req.user["custom:role"] || "user";

    const now = new Date().toISOString();

    const {
      name,
      email,
      mobileNo,
      gender,
      birthDate,
      profilePhotoUrl,
      country,
      state,
      city,
      userType,
      collegeName,
      companyName,
      bio,
      github
    } = req.body;

    /* AGE VALIDATION */

    if (birthDate) {

      const birth = new Date(birthDate);
      const today = new Date();

      let age = today.getFullYear() - birth.getFullYear();

      const m = today.getMonth() - birth.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      if (age < 18) {
        return res.status(400).json({
          message: "User must be at least 18 years old"
        });
      }

    }

    const item = {
      id: userId,
      name,
      email,
      mobileNo,
      gender,
      birthDate,
      profilePhotoUrl,
      country,
      state,
      city,
      userType,
      collegeName,
      companyName,
      bio,
      github,
      role,
      profileCompleted: true,
      updatedAt: now
    };

    await dynamo.put({
      TableName: TABLES.USERS,
      Item: item
    }).promise();

    res.json({
      message: "Profile updated successfully"
    });

  } catch (err) {
    next(err);
  }
};


/* ==============================
   CREATE USER
============================== */
exports.createUser = async (req, res, next) => {

  try {

    const { id, name, email } = req.body;

    const now = new Date().toISOString();

    const item = {
      id,
      name,
      email,
      userType: '',
      profilePhotoUrl: '',
      mobileNo: '',
      gender: '',
      birthDate: '',
      country: '',
      state: '',
      city: '',
      collegeName: '',
      companyName: '',
      bio: '',
      github: '',
      profileCompleted: false,
      createdAt: now,
      updatedAt: now
    };

    await dynamo.put({
      TableName: TABLES.USERS,
      Item: item
    }).promise();

    res.json({
      message: "User created"
    });

  } catch (err) {
    next(err);
  }

};
