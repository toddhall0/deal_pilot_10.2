import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Lazy-initialize S3 client to avoid module load errors
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true, // Required for R2 and MinIO
    });
  }
  return s3Client;
}

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "deal-pilot-documents";

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
];

export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".txt",
  ".csv",
];

// Maximum file size: 100MB
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

// File path structure: /deals/{dealId}/{category}/{filename}
export function generateFileKey(
  dealId: string,
  category: string,
  filename: string,
  uniqueId?: string
): string {
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const timestamp = Date.now();
  const id = uniqueId || timestamp.toString();
  return `deals/${dealId}/${category}/${id}-${sanitizedFilename}`;
}

// Get file extension from filename
export function getFileExtension(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  return ext ? `.${ext}` : "";
}

// Validate file type
export function isValidFileType(mimeType: string, filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_FILE_TYPES.includes(mimeType) || ALLOWED_EXTENSIONS.includes(ext);
}

// Get file type category for icons
export function getFileTypeCategory(mimeType: string, filename: string): string {
  const ext = getFileExtension(filename).toLowerCase();

  if (mimeType === "application/pdf" || ext === ".pdf") return "pdf";
  if (mimeType.includes("word") || [".doc", ".docx"].includes(ext)) return "word";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet") || [".xls", ".xlsx", ".csv"].includes(ext)) return "excel";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation") || [".ppt", ".pptx"].includes(ext)) return "powerpoint";
  if (mimeType.startsWith("image/") || [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) return "image";
  if (mimeType === "text/plain" || ext === ".txt") return "text";

  return "other";
}

// Upload file to S3/R2
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ key: string; url: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  });

  await getS3Client().send(command);

  // Generate a signed URL for immediate access
  const url = await getSignedDownloadUrl(key);

  return { key, url };
}

// Generate signed URL for downloading
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}

// Generate signed URL for uploading (for direct client uploads)
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}

// Delete file from S3/R2
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await getS3Client().send(command);
}

// Delete multiple files
export async function deleteFiles(keys: string[]): Promise<void> {
  await Promise.all(keys.map((key) => deleteFile(key)));
}

// Copy file (for versioning)
export async function copyFile(
  sourceKey: string,
  destinationKey: string
): Promise<void> {
  const command = new CopyObjectCommand({
    Bucket: BUCKET_NAME,
    CopySource: `${BUCKET_NAME}/${sourceKey}`,
    Key: destinationKey,
  });

  await getS3Client().send(command);
}

// List files in a path
export async function listFiles(prefix: string): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await getS3Client().send(command);
  return response.Contents?.map((obj) => obj.Key || "") || [];
}

// Get file from S3/R2 (for server-side processing)
export async function getFile(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await getS3Client().send(command);
  const stream = response.Body as ReadableStream;

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export { getS3Client, BUCKET_NAME };
