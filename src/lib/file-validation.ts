/** Допустимые MIME-типы и расширения для загрузки изображений. */
export const ALLOWED_IMAGE_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

/** Проверяет, что расширение файла соответствует MIME-типу. */
export function isValidImageExtension(
  filename: string,
  mimeType: string,
): boolean {
  const ext =
    filename.lastIndexOf(".") >= 0
      ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
      : "";
  const allowed = ALLOWED_IMAGE_TYPES[mimeType];
  if (!allowed) return false;
  return allowed.includes(ext);
}

/** Определяет тип изображения по magic bytes (JPEG, PNG, GIF, WebP). */
export function detectImageType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}
