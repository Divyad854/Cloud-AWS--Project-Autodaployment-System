const { dynamo, TABLES } = require('../config/dynamo');

/* =========================
   GET NOTIFICATIONS
========================= */
exports.getNotifications = async (req, res) => {
  try {
   

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId =
      req.user.sub ||
      req.user.username ||
      req.user.email;

    if (!userId) {
      return res.status(400).json({
        message: "User ID not found in token"
      });
    }

    const isAdmin = req.user["custom:role"] === "admin";

    let result;

    if (isAdmin) {
      // 🔥 ADMIN → hide admin deleted
      result = await dynamo.scan({
        TableName: TABLES.NOTIFICATIONS,
        ConsistentRead: true,
        FilterExpression:
          "attribute_not_exists(deletedByAdmin) OR deletedByAdmin = :false",
        ExpressionAttributeValues: {
          ":false": false
        }
      }).promise();

    } else {
      // 🔥 USER → only own + hide user deleted (FIXED)
      result = await dynamo.scan({
        TableName: TABLES.NOTIFICATIONS,
        ConsistentRead: true,
        FilterExpression:
          "userId = :uid AND (deletedByUser = :false OR attribute_not_exists(deletedByUser))",
        ExpressionAttributeValues: {
          ":uid": userId,
          ":false": false
        }
      }).promise();
    }

    const notifications = (result.Items || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ notifications });

  } catch (err) {
    console.error("❌ NOTIFICATION ERROR:", err);
    res.status(500).json({
      message: "Error fetching notifications",
      error: err.message
    });
  }
};

/* =========================
   DELETE NOTIFICATION
========================= */
exports.deleteNotification = async (req, res) => {
  try {
    const user = req.user;
    const notificationId = req.params.id;

    const isAdmin = user["custom:role"] === "admin";

    // 🔍 GET ITEM
    const existing = await dynamo.get({
      TableName: TABLES.NOTIFICATIONS,
      Key: { notificationId },
      ConsistentRead: true
    }).promise();

    if (!existing.Item) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const item = existing.Item;

    // 🔥 FORCE BOOLEAN (CRITICAL FIX)
    item.deletedByUser = item.deletedByUser === true;
    item.deletedByAdmin = item.deletedByAdmin === true;

    // ✅ APPLY FLAG
    if (isAdmin) {
      item.deletedByAdmin = true;
    } else {
      item.deletedByUser = true;
    }

    console.log("UPDATED ITEM 👉", item); // debug

    // 💥 BOTH → HARD DELETE
    if (item.deletedByAdmin && item.deletedByUser) {
      await dynamo.delete({
        TableName: TABLES.NOTIFICATIONS,
        Key: { notificationId }
      }).promise();

      return res.json({ message: "Deleted permanently" });
    }

    // 🟡 SOFT DELETE UPDATE
    await dynamo.put({
      TableName: TABLES.NOTIFICATIONS,
      Item: item
    }).promise();

    res.json({ message: "Deleted for this user only" });

  } catch (err) {
    console.error("❌ DELETE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};