const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "ap-south-1",
});

const BUCKET_NAME = "cloudlaunch-uploads"; // your real bucket

async function uploadZipToS3(fileBuffer, projectId) {
  const key = `uploads/${projectId}/source.zip`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: "application/zip",
    })
  );

  return key;
}

module.exports = { uploadZipToS3 };