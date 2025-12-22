import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";

// Check if S3 is configured
const isS3Configured = !!(
  process.env.S3_ENDPOINT &&
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY
);

// Local storage directory for development
const LOCAL_STORAGE_DIR = path.join(process.cwd(), "uploads");

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

// Ensure local storage directory exists
async function ensureLocalStorageDir(key: string): Promise<void> {
  const filePath = path.join(LOCAL_STORAGE_DIR, key);
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

// Upload file to S3/R2 or local storage
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ key: string; url: string }> {
  if (isS3Configured) {
    // Use S3/R2
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
  } else {
    // Use local file storage
    await ensureLocalStorageDir(key);
    const filePath = path.join(LOCAL_STORAGE_DIR, key);

    // Convert body to buffer if needed
    let buffer: Buffer;
    if (Buffer.isBuffer(body)) {
      buffer = body;
    } else if (body instanceof Uint8Array) {
      buffer = Buffer.from(body);
    } else {
      // ReadableStream
      const chunks: Uint8Array[] = [];
      const reader = (body as ReadableStream).getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      buffer = Buffer.concat(chunks);
    }

    await fs.writeFile(filePath, buffer);

    // Return a local URL
    const url = `/api/uploads/${key}`;
    return { key, url };
  }
}

// Generate signed URL for downloading
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  if (isS3Configured) {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    return getSignedUrl(getS3Client(), command, { expiresIn });
  } else {
    // Return local URL
    return `/api/uploads/${key}`;
  }
}

// Generate signed URL for uploading (for direct client uploads)
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!isS3Configured) {
    throw new Error("Direct uploads require S3 configuration");
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}

// Delete file from S3/R2 or local storage
export async function deleteFile(key: string): Promise<void> {
  if (isS3Configured) {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await getS3Client().send(command);
  } else {
    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    try {
      await fs.unlink(filePath);
    } catch {
      // File might not exist
    }
  }
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
  if (isS3Configured) {
    const command = new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${sourceKey}`,
      Key: destinationKey,
    });
    await getS3Client().send(command);
  } else {
    await ensureLocalStorageDir(destinationKey);
    const sourcePath = path.join(LOCAL_STORAGE_DIR, sourceKey);
    const destPath = path.join(LOCAL_STORAGE_DIR, destinationKey);
    await fs.copyFile(sourcePath, destPath);
  }
}

// List files in a path
export async function listFiles(prefix: string): Promise<string[]> {
  if (isS3Configured) {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });
    const response = await getS3Client().send(command);
    return response.Contents?.map((obj) => obj.Key || "") || [];
  } else {
    const dirPath = path.join(LOCAL_STORAGE_DIR, prefix);
    try {
      const files = await fs.readdir(dirPath, { recursive: true });
      return files.map((f) => path.join(prefix, f.toString()));
    } catch {
      return [];
    }
  }
}

// Get file from S3/R2 or local storage (for server-side processing)
export async function getFile(key: string): Promise<Buffer> {
  if (isS3Configured) {
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
  } else {
    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    return fs.readFile(filePath);
  }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export { getS3Client, BUCKET_NAME, isS3Configured, LOCAL_STORAGE_DIR };
