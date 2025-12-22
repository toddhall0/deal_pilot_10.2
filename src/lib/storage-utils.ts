// Storage utility functions - safe for client-side use
// These functions don't use any Node.js-specific modules

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

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

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
