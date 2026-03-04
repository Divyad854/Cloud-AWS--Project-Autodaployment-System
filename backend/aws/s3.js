// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// const s3 = new S3Client({
//   region: "ap-south-1",
// });

// const BUCKET_NAME = "cloudlaunch-uploads"; // your real bucket

// async function uploadZipToS3(fileBuffer, projectId) {
//   const key = `uploads/${projectId}/source.zip`;

//   await s3.send(
//     new PutObjectCommand({
//       Bucket: BUCKET_NAME,
//       Key: key,
//       Body: fileBuffer,
//       ContentType: "application/zip",
//     })
//   );

//   return key;
// }

// module.exports = { uploadZipToS3 };
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "ap-south-1",
});

const BUCKET_NAME = "cloudlaunch-uploads";


/* ==============================
   DELETE PROFILE IMAGE
============================== */

async function deleteProfileImageFromS3(imageUrl) {

  if (!imageUrl) return;

  const key = imageUrl.split(".amazonaws.com/")[1];

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );

}


/* ==============================
   PROFILE IMAGE UPLOAD
============================== */

async function uploadProfileImageToS3(fileBuffer, userId, fileType) {

  const key = `profiles/${userId}/profile-${Date.now()}.${fileType}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: `image/${fileType}`,
    })
  );

  const imageUrl = `https://${BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${key}`;

  return imageUrl;
}

module.exports = {
  uploadProfileImageToS3,
  deleteProfileImageFromS3
};