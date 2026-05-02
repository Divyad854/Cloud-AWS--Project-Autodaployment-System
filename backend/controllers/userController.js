const { dynamo, TABLES } = require('../config/dynamo');

const { uploadProfileImageToS3, deleteProfileImageFromS3 } = require("../aws/s3");
/* 🔥 ADD THIS */
const {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});
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

exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const email = req.user.email; // optional

    console.log("DELETE USER:", userId);

    /* 1. DELETE FROM COGNITO 🔥 */
    await cognitoClient.send(
      new AdminDeleteUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: userId // ⚠️ use sub
      })
    );

    /* 2. DELETE FROM DYNAMO */
    const user = await dynamo.get({
      TableName: TABLES.USERS,
      Key: { id: userId }
    }).promise();

    if (user.Item?.profilePhotoUrl) {
      await deleteProfileImageFromS3(user.Item.profilePhotoUrl);
    }

    /* 3. DELETE PROJECTS */
    const projects = await dynamo.scan({
      TableName: TABLES.PROJECTS,
      FilterExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId
      }
    }).promise();

    if (projects.Items.length > 0) {
      const deleteRequests = projects.Items.map(p => ({
        DeleteRequest: {
          Key: { id: p.id }
        }
      }));

      await dynamo.batchWrite({
        RequestItems: {
          [TABLES.PROJECTS]: deleteRequests
        }
      }).promise();
    }

    /* 4. DELETE USER RECORD */
    await dynamo.delete({
      TableName: TABLES.USERS,
      Key: { id: userId }
    }).promise();

    res.json({ message: "Account deleted completely" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    next(err);
  }
};