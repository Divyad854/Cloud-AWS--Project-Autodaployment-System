const { dynamo, TABLES } = require('../config/dynamo');

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


exports.updateProfile = async (req, res, next) => {
  try {

    const userId = req.user.sub;

    const {
      name,
      email,
      userType,
      profilePhotoUrl,
      mobileNo,
      country,
      state,
      city,
      collegeName,
      companyName,
      bio,
      github
    } = req.body;

    const now = new Date().toISOString();

    const params = {
      TableName: TABLES.USERS,
      Item: {
        id: userId,
        name,
        email,
        userType,
        profilePhotoUrl,
        mobileNo,
        country,
        state,
        city,
        collegeName,
        companyName,
        bio,
        github,
        profileCompleted: true,
        createdAt: now,
        updatedAt: now
      }
    };

    await dynamo.put(params).promise();

    res.json({ message: "Profile saved successfully" });

  } catch (err) {
    next(err);
  }
};