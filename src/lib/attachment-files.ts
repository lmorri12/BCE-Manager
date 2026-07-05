const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
] as const;

const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
] as const;

export const ATTACHMENT_FILE_ACCEPT = [
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
].join(",");

function normaliseExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

export function isAllowedAttachmentFile(fileName: string, mimeType: string | null | undefined): boolean {
  const extension = normaliseExtension(fileName);
  const hasAllowedExtension = ALLOWED_ATTACHMENT_EXTENSIONS.includes(
    extension as (typeof ALLOWED_ATTACHMENT_EXTENSIONS)[number]
  );

  if (!hasAllowedExtension) return false;
  if (!mimeType) return true;

  return ALLOWED_ATTACHMENT_MIME_TYPES.includes(
    mimeType.toLowerCase() as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number]
  );
}

export const ATTACHMENT_FILE_TYPE_LABEL =
  "PDF, Word documents, and image files only";
