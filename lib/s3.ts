import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET ?? "fitpr-uploads";

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

export function getS3Url(key: string): string {
  return `https://${BUCKET}.s3.${process.env.AWS_REGION ?? "ap-south-1"}.amazonaws.com/${key}`;
}

export async function deleteS3Object(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}

export function buildVideoKey(orgId: string, clientId: string, fileName: string): string {
  const timestamp = Date.now();
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `orgs/${orgId}/clients/${clientId}/videos/${timestamp}_${safe}`;
}

export function buildAvatarKey(userId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `users/${userId}/avatar/${safe}`;
}

export function buildPhotoKey(orgId: string, clientId: string, type: string, fileName: string): string {
  const timestamp = Date.now();
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `orgs/${orgId}/clients/${clientId}/photos/${type}_${timestamp}_${safe}`;
}
