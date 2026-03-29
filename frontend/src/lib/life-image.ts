const HEIC_FILE_EXTENSION_PATTERN = /\.(heic|heif)$/i;
const MAX_UPLOAD_IMAGE_SIZE_MB = 4;
const MAX_UPLOAD_IMAGE_EDGE = 2560;
const MAX_BACKEND_UPLOAD_BYTES = 10 * 1024 * 1024;

function isHeicLikeFile(file: File) {
  return file.type === "image/heic" || file.type === "image/heif" || HEIC_FILE_EXTENSION_PATTERN.test(file.name);
}

function buildFileName(fileName: string, nextExtension: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim();

  return `${baseName || "life-image"}.${nextExtension}`;
}

async function convertHeicToJpeg(file: File) {
  let convertedBlob: Blob | Blob[];

  try {
    const { default: heic2any } = await import("heic2any");

    convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
  } catch {
    throw new Error("实况照片转换失败，请换一张照片或先导出为 JPG 后重试。");
  }

  const normalizedBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

  if (!(normalizedBlob instanceof Blob)) {
    throw new Error("实况照片转换失败，请换一张照片重试。");
  }

  return new File([normalizedBlob], buildFileName(file.name, "jpg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function getCompressionFileType(file: File) {
  if (file.type === "image/png" || file.type === "image/webp" || file.type === "image/jpeg") {
    return file.type;
  }

  return "image/jpeg";
}

export async function prepareLifeImageForUpload(file: File) {
  if ((!file.type || !file.type.startsWith("image/")) && !isHeicLikeFile(file)) {
    throw new Error("请选择图片文件后再上传。");
  }

  const normalizedFile = isHeicLikeFile(file) ? await convertHeicToJpeg(file) : file;

  let processedFile: File;

  try {
    const { default: imageCompression } = await import("browser-image-compression");

    processedFile = await imageCompression(normalizedFile, {
      maxSizeMB: MAX_UPLOAD_IMAGE_SIZE_MB,
      maxWidthOrHeight: MAX_UPLOAD_IMAGE_EDGE,
      useWebWorker: true,
      initialQuality: 0.88,
      fileType: getCompressionFileType(normalizedFile),
    });
  } catch {
    throw new Error("图片处理失败，请换一张照片或稍后重试。");
  }

  if (processedFile.size > MAX_BACKEND_UPLOAD_BYTES) {
    throw new Error("图片处理后仍超过 10MB，请先导出较小版本后再上传。");
  }

  return processedFile;
}

export async function readImageDimensions(file: File) {
  if (typeof createImageBitmap === "function") {
    try {
      const imageBitmap = await createImageBitmap(file);

      try {
        return {
          width: imageBitmap.width,
          height: imageBitmap.height,
        };
      } finally {
        imageBitmap.close();
      }
    } catch {
    }
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      };

      image.onerror = () => {
        reject(new Error("图片尺寸读取失败"));
      };

      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
